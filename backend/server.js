import { createServer } from 'node:http';
import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { promisify } from 'node:util';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const scrypt = promisify(scryptCallback);
const currentDir = dirname(fileURLToPath(import.meta.url));
const databasePath = resolve(currentDir, 'data', 'read2gether-auth.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    username TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_expiration ON sessions(expires_at);
`);

const userColumns = db.prepare('PRAGMA table_info(users)').all();
if (!userColumns.some((column) => column.name === 'username')) {
  db.exec("ALTER TABLE users ADD COLUMN username TEXT NOT NULL DEFAULT ''");
}
const existingUsers = db.prepare('SELECT id, email FROM users WHERE username = ?').all('');
const updateUsername = db.prepare('UPDATE users SET username = ? WHERE id = ?');
const usernameExists = db.prepare('SELECT 1 FROM users WHERE username = ? COLLATE NOCASE AND id <> ?');
for (const account of existingUsers) {
  const emailName = account.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 20);
  const base = emailName.length >= 3 ? emailName : 'leitor';
  let candidate = base;
  let suffix = 1;
  while (usernameExists.get(candidate, account.id)) {
    const ending = `_${suffix++}`;
    candidate = `${base.slice(0, 20 - ending.length)}${ending}`;
  }
  updateUsername.run(candidate, account.id);
}
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username COLLATE NOCASE)');

const passwordParameters = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const sessionLifetimeMs = 30 * 24 * 60 * 60 * 1000;

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64, passwordParameters);
  return `scrypt$${passwordParameters.N}$${passwordParameters.r}$${passwordParameters.p}$${salt.toString('hex')}$${key.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  try {
    const [algorithm, n, r, p, saltHex, keyHex] = storedHash.split('$');
    if (algorithm !== 'scrypt' || !n || !r || !p || !saltHex || !keyHex) return false;
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(keyHex, 'hex');
    const actual = await scrypt(password, salt, expected.length, {
      N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  let raw = '';
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 16_384) throw Object.assign(new Error('Corpo da solicitação muito grande.'), { status: 413 });
  }
  try {
    return JSON.parse(raw || '{}');
  } catch {
    throw Object.assign(new Error('JSON inválido.'), { status: 400 });
  }
}

function validateCredentials(email, password, isSignup, username) {
  if (typeof email !== 'string' || typeof password !== 'string') {
    return 'Informe e-mail e senha.';
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return 'Informe um e-mail válido.';
  }
  if (password.length > 128 || Buffer.byteLength(password, 'utf8') > 128) {
    return 'A senha pode ter no máximo 128 bytes.';
  }
  if (isSignup && password.length < 8) return 'Use uma senha com pelo menos 8 caracteres.';
  if (isSignup && (typeof username !== 'string' || !/^[a-zA-Z0-9._]{3,20}$/.test(username.trim()))) {
    return 'O nome de usuário deve ter de 3 a 20 caracteres e usar apenas letras, números, ponto ou sublinhado.';
  }
  return null;
}

function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + sessionLifetimeMs).toISOString();
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now.toISOString());
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .run(hashToken(token), userId, expiresAt, now.toISOString());
  return token;
}

function getSessionUser(request) {
  const authorization = request.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return null;
  const now = new Date().toISOString();
  const row = db.prepare(`
    SELECT users.id, users.email, users.username
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(hashToken(token), now);
  return row || null;
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    response.end();
    return;
  }

  const route = new URL(request.url || '/', 'http://localhost').pathname;
  try {
    if (request.method === 'GET' && route === '/health') {
      sendJson(response, 200, { ok: true, service: 'read2gether-local-auth' });
      return;
    }

    if (request.method === 'POST' && (route === '/auth/register' || route === '/auth/login')) {
      const isSignup = route.endsWith('/register');
      const { email, password, username } = await readJson(request);
      const validationError = validateCredentials(email, password, isSignup, username);
      if (validationError) {
        sendJson(response, 400, { error: validationError });
        return;
      }
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : '';
      let user;
      if (isSignup) {
        if (db.prepare('SELECT 1 FROM users WHERE username = ? COLLATE NOCASE').get(normalizedUsername)) {
          sendJson(response, 409, { error: 'Esse nome de usuário já está em uso. Escolha outro.' });
          return;
        }
        const userId = randomUUID();
        const passwordHash = await hashPassword(password);
        try {
          db.prepare('INSERT INTO users (id, email, username, password_hash, created_at) VALUES (?, ?, ?, ?, ?)')
            .run(userId, normalizedEmail, normalizedUsername, passwordHash, new Date().toISOString());
        } catch (error) {
          if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            if (db.prepare('SELECT 1 FROM users WHERE username = ? COLLATE NOCASE').get(normalizedUsername)) {
              sendJson(response, 409, { error: 'Esse nome de usuário já está em uso. Escolha outro.' });
              return;
            }
            sendJson(response, 409, { error: 'Já existe uma conta com esse e-mail.' });
            return;
          }
          throw error;
        }
        user = { id: userId, email: normalizedEmail, username: normalizedUsername };
      } else {
        const account = db.prepare('SELECT id, email, username, password_hash FROM users WHERE email = ? COLLATE NOCASE')
          .get(normalizedEmail);
        const passwordMatches = account && await verifyPassword(password, account.password_hash);
        if (!passwordMatches) {
          sendJson(response, 401, { error: 'E-mail ou senha incorretos.' });
          return;
        }
        user = { id: account.id, email: account.email, username: account.username };
      }
      sendJson(response, isSignup ? 201 : 200, { user, token: createSession(user.id) });
      return;
    }

    if (request.method === 'GET' && route === '/auth/me') {
      const user = getSessionUser(request);
      if (!user) {
        sendJson(response, 401, { error: 'Sessão inválida ou expirada.' });
        return;
      }
      sendJson(response, 200, { user });
      return;
    }

    if (request.method === 'POST' && route === '/auth/logout') {
      const authorization = request.headers.authorization || '';
      const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
      if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
      sendJson(response, 200, { ok: true });
      return;
    }

    sendJson(response, 404, { error: 'Rota não encontrada.' });
  } catch (error) {
    sendJson(response, error.status || 500, {
      error: error.status ? error.message : 'Erro interno do backend.',
    });
    if (!error.status) console.error('Falha no backend local:', error);
  }
});

const port = Number(process.env.PORT || 3333);
server.listen(port, '0.0.0.0', () => {
  console.log(`Backend local ativo em http://0.0.0.0:${port}`);
  console.log(`Banco de autenticação: ${databasePath}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => {
      db.close();
      process.exit(0);
    });
  });
}

import * as SQLite from 'expo-sqlite';
import { DEFAULT_WEEKLY_GOAL, DEFAULT_YEARLY_GOAL } from '../constants/books';

let databasePromise;
let writeQueue = Promise.resolve();

function serializeWrite(operation) {
  const nextWrite = writeQueue.catch(() => {}).then(operation);
  writeQueue = nextWrite;
  return nextWrite;
}

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('read2gether.db').then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS books (
          user_id TEXT NOT NULL,
          id TEXT NOT NULL,
          google_volume_id TEXT,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          total_pages INTEGER NOT NULL,
          current_page INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL,
          added_by_user INTEGER NOT NULL DEFAULT 0,
          thumbnail TEXT,
          description TEXT,
          PRIMARY KEY (user_id, id)
        );
        CREATE TABLE IF NOT EXISTS reading_sessions (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          book_id TEXT NOT NULL,
          date TEXT NOT NULL,
          pages INTEGER NOT NULL,
          duration_seconds INTEGER NOT NULL DEFAULT 0,
          comment TEXT NOT NULL DEFAULT '',
          FOREIGN KEY (user_id, book_id) REFERENCES books(user_id, id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS reading_sessions_user_date
          ON reading_sessions(user_id, date);
        CREATE TABLE IF NOT EXISTS user_goals (
          user_id TEXT PRIMARY KEY NOT NULL,
          weekly_pages INTEGER NOT NULL DEFAULT ${DEFAULT_WEEKLY_GOAL},
          yearly_books INTEGER NOT NULL DEFAULT ${DEFAULT_YEARLY_GOAL}
        );
        CREATE TABLE IF NOT EXISTS user_profiles (
          user_id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL DEFAULT '',
          bio TEXT NOT NULL DEFAULT '',
          photo_uri TEXT
        );
        CREATE TABLE IF NOT EXISTS app_settings (
          setting_key TEXT PRIMARY KEY NOT NULL,
          setting_value TEXT NOT NULL
        );
      `);
      const version = await db.getFirstAsync('PRAGMA user_version');
      if ((version?.user_version ?? 0) < 1) {
        // Remove livros que eram inseridos automaticamente pela versão de demonstração.
        await db.withExclusiveTransactionAsync(async (transaction) => {
          await transaction.runAsync("DELETE FROM reading_sessions WHERE book_id IN ('b1', 'b2', 'b3')");
          await transaction.runAsync("DELETE FROM books WHERE id IN ('b1', 'b2', 'b3')");
        });
        await db.execAsync('PRAGMA user_version = 1');
      }
      if ((version?.user_version ?? 0) < 2) {
        const sessionColumns = await db.getAllAsync('PRAGMA table_info(reading_sessions)');
        const profileColumns = await db.getAllAsync('PRAGMA table_info(user_profiles)');
        if (!sessionColumns.some((column) => column.name === 'comment')) {
          await db.execAsync("ALTER TABLE reading_sessions ADD COLUMN comment TEXT NOT NULL DEFAULT ''");
        }
        if (!profileColumns.some((column) => column.name === 'name')) {
          await db.execAsync("ALTER TABLE user_profiles ADD COLUMN name TEXT NOT NULL DEFAULT ''");
        }
        await db.execAsync('PRAGMA user_version = 2');
      }
      return db;
    });
  }
  return databasePromise;
}

export async function loadLocalProfile(userId) {
  const db = await getDatabase();
  return db.getFirstAsync('SELECT name, bio, photo_uri FROM user_profiles WHERE user_id = ?', userId);
}

export async function saveLocalProfile(userId, { name, bio, photoUri }) {
  const db = await getDatabase();
  return serializeWrite(() => db.runAsync(
    `INSERT INTO user_profiles (user_id, name, bio, photo_uri) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET name = excluded.name, bio = excluded.bio, photo_uri = excluded.photo_uri`,
    userId, name, bio, photoUri || null,
  ));
}

export async function loadThemeMode() {
  const db = await getDatabase();
  const setting = await db.getFirstAsync(
    'SELECT setting_value FROM app_settings WHERE setting_key = ?',
    'theme_mode',
  );
  return setting?.setting_value === 'dark' ? 'dark' : 'light';
}

export async function saveThemeMode(mode) {
  const db = await getDatabase();
  return serializeWrite(() => db.runAsync(
    `INSERT INTO app_settings (setting_key, setting_value) VALUES ('theme_mode', ?)
     ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
    mode === 'dark' ? 'dark' : 'light',
  ));
}

function mapBook(row) {
  return {
    id: row.id,
    googleVolumeId: row.google_volume_id,
    title: row.title,
    author: row.author,
    total: row.total_pages,
    current: row.current_page,
    status: row.status,
    addedByUser: Boolean(row.added_by_user),
    thumbnail: row.thumbnail,
    description: row.description,
  };
}

export async function loadTrackerData(userId) {
  const db = await getDatabase();
  let goal = await db.getFirstAsync('SELECT weekly_pages, yearly_books FROM user_goals WHERE user_id = ?', userId);
  if (!goal) {
    await serializeWrite(() => db.runAsync(
      'INSERT OR IGNORE INTO user_goals (user_id, weekly_pages, yearly_books) VALUES (?, ?, ?)',
      userId, DEFAULT_WEEKLY_GOAL, DEFAULT_YEARLY_GOAL,
    ));
    goal = await db.getFirstAsync('SELECT weekly_pages, yearly_books FROM user_goals WHERE user_id = ?', userId);
  }
  const rows = await db.getAllAsync('SELECT * FROM books WHERE user_id = ? ORDER BY rowid', userId);
  const sessions = await db.getAllAsync(
    'SELECT id, date, pages, book_id, duration_seconds, comment FROM reading_sessions WHERE user_id = ? ORDER BY rowid',
    userId,
  );
  return {
    books: rows.map(mapBook),
    sessions: sessions.map((session) => ({
      id: session.id,
      date: session.date,
      pages: session.pages,
      bookId: session.book_id,
      durationSeconds: session.duration_seconds,
      comment: session.comment || '',
    })),
    weeklyGoal: goal?.weekly_pages ?? DEFAULT_WEEKLY_GOAL,
    yearlyGoal: goal?.yearly_books ?? DEFAULT_YEARLY_GOAL,
  };
}

export async function saveTrackerData(userId, { books, sessions, weeklyGoal, yearlyGoal }) {
  const db = await getDatabase();
  return serializeWrite(() => db.withExclusiveTransactionAsync(async (transaction) => {
    for (const book of books) {
      await transaction.runAsync(
        `INSERT INTO books
          (user_id, id, google_volume_id, title, author, total_pages, current_page, status, added_by_user, thumbnail, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, id) DO UPDATE SET
           google_volume_id = excluded.google_volume_id,
           title = excluded.title,
           author = excluded.author,
           total_pages = excluded.total_pages,
           current_page = excluded.current_page,
           status = excluded.status,
           added_by_user = excluded.added_by_user,
           thumbnail = excluded.thumbnail,
           description = excluded.description`,
        userId, book.id, book.googleVolumeId || null, book.title, book.author,
        book.total, book.current, book.status, book.addedByUser ? 1 : 0,
        book.thumbnail || null, book.description || null,
      );
    }
    for (const session of sessions) {
      await transaction.runAsync(
        `INSERT INTO reading_sessions (id, user_id, book_id, date, pages, duration_seconds, comment)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           user_id = excluded.user_id,
           book_id = excluded.book_id,
           date = excluded.date,
           pages = excluded.pages,
           duration_seconds = excluded.duration_seconds,
           comment = excluded.comment`,
        session.id, userId, session.bookId, session.date, session.pages, session.durationSeconds || 0, session.comment || '',
      );
    }
    await transaction.runAsync(
      `INSERT INTO user_goals (user_id, weekly_pages, yearly_books) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET weekly_pages = excluded.weekly_pages, yearly_books = excluded.yearly_books`,
      userId, weeklyGoal, yearlyGoal,
    );
  }));
}

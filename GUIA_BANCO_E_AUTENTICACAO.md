# Banco local e autenticação

Este documento descreve o cadastro, login, armazenamento e os arquivos que participam dessa implementação.

## Arquitetura

O projeto usa dois arquivos SQLite locais, com responsabilidades diferentes:

1. **SQLite do Expo no aparelho** (`read2gether.db`): livros, sessões de leitura, metas e perfil. Os dados ficam no dispositivo e são separados pelo ID da conta autenticada.
2. **SQLite do backend no computador** (`backend/data/read2gether-auth.sqlite`): contas, hashes de senha e sessões. O backend não abre o arquivo privado do celular. O ID da conta conecta os dois lados, mas os livros e leituras não são enviados ao servidor.

```text
Expo Go no celular                         Node no computador
┌────────────────────────┐   HTTP local   ┌─────────────────────────┐
│ SQLite: livros, metas, │ ─ cadastro/ ─▶ │ SQLite: email, hash e   │
│ leituras e perfil      │   login/token  │ sessões de autenticação│
└────────────────────────┘                └─────────────────────────┘
```

Esta configuração atende a um protótipo local. Não sincroniza livros entre dispositivos. A API está em HTTP para desenvolvimento na rede local; não use essa configuração em uma rede pública ou em uma versão publicada sem migrar para HTTPS e revisar os controles de segurança.

## Como iniciar no Windows

Use duas janelas de terminal, na pasta `C:\TCCapp\read2gether`.

**Terminal 1 — backend:**

```powershell
npm run backend
```

O backend precisa de Node.js 22.13 ou superior (`node --version`). Quando estiver ativo, `http://localhost:3333/health` deve responder com `{"ok":true,"service":"read2gether-local-auth"}`.

**Terminal 2 — Expo:**

```powershell
npx expo start
```

### Expo Go em um iPhone físico

O endereço `localhost` no celular aponta para o próprio celular, não para o computador. Descubra o IPv4 do computador com `ipconfig` e procure o endereço da placa Wi-Fi (por exemplo, `192.168.0.25`). No arquivo `.env.local`, preserve sua chave do Google Books e adicione/ajuste:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.25:3333
```

Troque o exemplo pelo IPv4 real do computador. O iPhone e o computador devem estar na mesma rede Wi-Fi; se o Windows perguntar, permita o Node.js na rede privada. Depois altere a variável, reinicie o Expo com `npx expo start -c` e abra novamente pelo QR code. Em simuladores, normalmente pode ser usado `http://127.0.0.1:3333`.

## Cadastro e login

- A tela inicial permite alternar entre **Entrar** e **Criar conta**.
- O backend normaliza o e-mail para minúsculas, verifica seu formato e exige pelo menos 8 caracteres de senha no cadastro.
- O cadastro também exige um nome de usuário de 3 a 20 caracteres (letras, números, ponto ou sublinhado), normalizado para minúsculas. O backend verifica a disponibilidade antes de criar a conta e impõe unicidade no SQLite para evitar duplicatas em cadastros simultâneos. A migração atribui nomes de usuário provisórios às contas de teste já existentes.
- O servidor gera um salt aleatório e armazena o resultado de `scrypt`, nunca a senha original. O formato do campo `password_hash` contém algoritmo, parâmetros, salt e hash; isso permite verificar a senha sem poder recuperá-la.
- No login, a comparação é feita no backend com comparação de tempo constante. Respostas de e-mail/senha incorretos são genéricas.
- O backend cria um token aleatório de sessão. Somente o hash desse token fica no SQLite do servidor; o token original fica no `expo-secure-store` do dispositivo e é enviado como Bearer token.
- A sessão local dura 30 dias. **Sair da conta** apaga o token salvo no aparelho e revoga a sessão no backend.
- O banco local guarda e-mail/ID da conta no contexto em memória enquanto o app está aberto; não guarda senha nem token em `expo-sqlite`.

Como o backend não tem serviço de e-mail configurado, **recuperação de senha por e-mail ainda não está disponível**. Para adicioná-la, será necessário configurar envio de e-mail e tokens temporários de redefinição.

## Esquema de dados

### Banco do aparelho — `src/services/database.js`

| Tabela | Campos principais | Uso |
| --- | --- | --- |
| `books` | `user_id`, `id`, `title`, `author`, `total_pages`, `current_page`, `status`, metadados do Google Books | Estante e progresso de cada livro |
| `reading_sessions` | `id`, `user_id`, `book_id`, `date`, `pages`, `duration_seconds`, `comment` | Histórico e comentário opcional sobre cada leitura |
| `user_goals` | `user_id`, `weekly_pages`, `yearly_books` | Metas semanais e anuais |
| `user_profiles` | `user_id`, `name`, `bio`, `photo_uri` | Nome, biografia e caminho persistente da foto |
| `app_settings` | `setting_key`, `setting_value` | Preferências locais, incluindo o tema claro/escuro |

As chaves usam `user_id` para manter contas separadas no mesmo aparelho. A migração versão 1 remove os três livros de demonstração da versão anterior; a versão 2 adiciona comentários às sessões e nome ao perfil, preservando o conteúdo já existente. Contas novas começam com a estante vazia. Livros, leituras e metas são gravados no SQLite antes de a interface confirmar a alteração. A foto é copiada para `Documents/profile-images/`; o SQLite mantém o caminho para carregá-la depois.

### Banco do backend — `backend/server.js`

| Tabela | Campos principais | Uso |
| --- | --- | --- |
| `users` | `id`, `email`, `username`, `password_hash`, `created_at` | Conta; e-mail e nome de usuário são únicos |
| `sessions` | `token_hash`, `user_id`, `expires_at`, `created_at` | Sessões revogáveis de login |

O arquivo em `backend/data/` é ignorado pelo Git e será criado automaticamente ao iniciar o backend. Ele guarda contas reais de desenvolvimento: não o envie ou publique.

## Endpoints da API

| Método e rota | Função |
| --- | --- |
| `GET /health` | Verificar se o backend está acessível |
| `POST /auth/register` | Criar conta e iniciar uma sessão |
| `POST /auth/login` | Validar e-mail/senha e iniciar uma sessão |
| `GET /auth/me` | Validar o token existente |
| `POST /auth/logout` | Revogar a sessão |

As chamadas do app ficam centralizadas em `src/services/api.js`; o estado de autenticação e o token ficam em `src/hooks/useAuth.js`.

## Onde alterar

- **Endereço da API:** `.env.local` (`EXPO_PUBLIC_API_URL`). Veja `.env.example` para um exemplo.
- **Rotas, hash de senha, validade do token e esquema de contas:** `backend/server.js`.
- **Tabelas do app, comentários e persistência local:** `src/services/database.js`.
- **Tema claro/escuro:** a preferência fica em `app_settings`; `src/hooks/useAppTheme.js` carrega e salva a escolha. A tela **Ler** força o modo escuro com `ThemeScope` em `src/app/(tabs)/read.js`.
- **Cópia permanente da foto do perfil:** `src/services/profileImage.js`.
- **Chamadas HTTP e mensagens de erro de conexão:** `src/services/api.js`.
- **Cadastro, login, restauração de sessão e logout:** `src/hooks/useAuth.js` e `src/screens/LoginScreen.js`.
- **Nome de usuário único e migração das contas de teste:** `backend/server.js`. O nome exibido na Home é outro campo, configurável em **Perfil → Editar perfil** e persistido localmente.
- **E-mail no perfil:** fica oculto no showcase e aparece no editor apenas como leitura durante o período de testes. A edição de e-mail está intencionalmente bloqueada e fica como melhoria futura, com confirmação de conta implementada no backend.
- **Carregamento e salvamento das leituras/metas:** `src/hooks/useReadingTracker.js`.
- **Este guia:** atualizar quando tabelas, endpoints ou passos de execução mudarem.

# Guia de manutenção — Read2gether

Este guia mapeia as pastas e os arquivos do app para facilitar alterações futuras. A navegação usa Expo Router; as telas ficam em `src/app/`, os componentes reutilizáveis em `src/components/` e as regras de leitura em `src/hooks/`.

## Estrutura do projeto

```text
src/
  app/
    _layout.js             Provedor de estado e rotas principais
    login.js               Tela inicial de cadastro e login locais
    forgot-password.js     Tela informativa de recuperação de senha
    (tabs)/
      _layout.js           Cabeçalho e navegação inferior
      index.js              Rota Início
      goals.js              Rota Metas
      books.js              Rota Meus livros
      read.js               Rota Ler
      profile.js            Rota Perfil e badges
  components/
    BookCover/              Capa reutilizável: imagem remota ou fallback
    BookCard/               Cartão reutilizável com capa da API/fallback
    Button/                 Botão principal, suave e contornado
    Card/                   Cartão de conteúdo
    ReadingCalendar/        Calendário mensal de leituras e pausas
    ProgressBar/            Indicador de progresso
    SectionTitle/           Título e ação de seção
    TabBar/                 Barra de abas integrada ao Router
  constants/
    books.js                Valores padrão das metas
    colors.js               Paleta do aplicativo
    tabs.js                 Rótulos e ícones das abas
  hooks/
    useAuth.js              Cadastro, login, sessão e perfil local
    useReadingTracker.js    Estado, persistência e regras de leitura
    useAppTheme.js          Preferência de tema e tema fixo por tela
  screens/
    BooksScreen.js           Estante, cadastro manual e busca Google Books
    GoalsScreen.js           Metas semanal e anual
    HomeScreen.js            Resumo e atalhos
    ReadScreen.js            Cronômetro, registro e histórico
    ProfileScreen.js         Showcase do perfil, edição e badges
  services/
    api.js                  Cliente HTTP para o backend local
    database.js             Esquema e operações SQLite do aparelho
    profileImage.js          Cópia de foto para os arquivos permanentes do app
    googleBooks.js           Cliente HTTP e conversão dos dados do Google Books
backend/
  server.js                  API local, hash de senha e sessões
  data/                      Arquivo SQLite de autenticação (ignorado pelo Git)
  styles/
    auth.js                  Aparência das telas de login e recuperação
    app.js                   Estilos da moldura, cabeçalho e rolagem
    profile.js               Aparência do perfil e dos badges
    screens.js               Estilos compartilhados pelas telas
```

Cada componente reutilizável tem `index.js` com a estrutura/comportamento e `style.js` com sua aparência. Para mudar só a cor global, comece em `src/constants/colors.js`.
## Tema claro e escuro

Na tela **Perfil**, a seção **Aparência** permite escolher o modo claro ou escuro para as telas gerais. A escolha é salva no SQLite local do aparelho, na tabela `app_settings`, pela chave `theme_mode`; na próxima abertura, o app carrega essa preferência. A preferência é do aparelho, não sincronizada por conta.

A tela **Ler** sempre usa o tema escuro, independentemente da escolha global. `src/app/(tabs)/read.js` aplica `ThemeScope`, e `src/app/(tabs)/_layout.js` adapta o cabeçalho, a barra inferior e a barra de status quando essa rota está aberta. Para adicionar ou alterar cores, edite `src/constants/colors.js`; para mudar como a preferência é carregada/salva, edite `src/hooks/useAppTheme.js` e as funções `loadThemeMode()` / `saveThemeMode()` em `src/services/database.js`.

## Onde alterar cada parte

- **Navegação e novas rotas:** crie o arquivo da tela em `src/app/` ou `src/app/(tabs)/` e registre uma aba em `src/app/(tabs)/_layout.js` e `src/constants/tabs.js`.
- **Atalho para Perfil:** a foto/avatar no cabeçalho é um botão que navega para `/profile`; ajuste em `src/app/(tabs)/_layout.js`.
- **Login e acesso ao app:** `src/app/login.js` abre `src/screens/LoginScreen.js`. `src/hooks/useAuth.js` chama o backend e guarda o token no SecureStore; `backend/server.js` valida cadastro/login e controla sessões.
- **Recuperação de senha:** `src/app/forgot-password.js` abre `src/screens/ForgotPasswordScreen.js`. O backend local ainda não envia e-mails; será necessário configurar serviço de e-mail e token de redefinição.
- **Perfil e badges:** `src/screens/ProfileScreen.js` mostra o perfil e badges e abre o editor ao tocar em **Editar perfil**. Nome, bio e URI da foto são gravados no SQLite do aparelho; a imagem é copiada para `Documents/profile-images` por `src/services/profileImage.js`. Critérios e associação de arte ficam em `createBadges()`.
- **Nome do perfil:** o nome de usuário é único e fica na conta do backend; o nome exibido (nome real ou escolhido pelo usuário) fica no perfil local e aparece na saudação da Home. Para mudar a saudação, veja `src/screens/HomeScreen.js`; para alterar o cadastro e validação do nome de usuário, veja `src/screens/LoginScreen.js` e `backend/server.js`.
- **Privacidade do e-mail:** o showcase do perfil não exibe o e-mail. Ele aparece somente dentro de **Editar perfil**, como informação bloqueada e sem campo de edição durante os testes. A edição do e-mail deve ser implementada em uma versão futura com confirmação da conta e atualização segura no backend.
- **Conquistas no perfil:** `src/screens/ProfileScreen.js` mostra as badges desbloqueadas como medalhas; a lista de conquistas futuras e seu progresso aparece ao tocar em **Ver próximas conquistas**. Os critérios e imagens SVG ficam associados em `createBadges()` e vêm de `assets/achievement-*.svg`, renderizados por `expo-image`.
- **Sair da conta:** botão comum ao fim da tela Perfil, depois das opções de aparência; seu posicionamento é controlado em `src/screens/ProfileScreen.js` e `src/styles/profile.js`.
- **Selecionar foto:** `expo-image-picker` abre a biblioteca do celular; as permissões e o texto explicativo para builds nativos estão configurados em `app.json`.
- **Streak pausada:** `streakPaused` em `src/hooks/useReadingTracker.js` ativa o símbolo azul de pausa na Home e na tela Ler quando há uma streak, mas ainda não houve leitura hoje.
- **Calendário:** `src/components/ReadingCalendar/index.js` monta o mês e classifica as datas a partir das sessões. Está na Home e em Metas. Dias lidos ficam vermelhos; os dois primeiros dias sem leitura após uma leitura ficam azuis; a partir do terceiro dia sem leitura, o calendário volta à cor padrão. Cores e dimensões estão em `src/components/ReadingCalendar/style.js`.
- **Botões da barra inferior:** `src/components/TabBar/index.js` usa `router.navigate()` do Expo Router para abrir cada rota. Não dependa de `navigation.emit` nessa barra personalizada.
- **Ícone Perfil:** a silhueta é composta por formas nativas no `TabBar`; cor inativa/selecionada é ajustada em `src/components/TabBar/style.js`.
- **Conteúdo de uma tela:** edite o arquivo correspondente em `src/screens/`.
- **Aparência geral:** `src/styles/app.js` e `src/styles/screens.js`.
- **Um componente, como botão ou cartão:** sua pasta em `src/components/NomeDoComponente/`; `index.js` é o JSX e `style.js` é o estilo.
- **Capa de livro:** `src/components/BookCover/index.js` exibe a URL recebida do Google Books; sem URL ou se a imagem falhar, mostra a inicial do título. Seus tamanhos ficam em `src/components/BookCover/style.js`. O componente é usado nos cartões da estante e nos resultados de busca.
- **Metas padrão:** `src/constants/books.js`.
- **Regras de negócio, progresso, metas, cronômetro e streak:** `src/hooks/useReadingTracker.js`.
- **Comunicação e transformação de dados da API:** `src/services/googleBooks.js`.

## Estado compartilhado e banco local

`ReadingTrackerProvider`, definido em `src/hooks/useReadingTracker.js`, carrega livros, sessões e metas do Expo SQLite e persiste livros, progresso, sessões (incluindo comentário) e metas antes de atualizar a interface. Os dados são locais ao aparelho e separados por `user_id`. Perfil é gravado explicitamente ao salvar o editor.

Um livro da estante usa `id`, `title`, `author`, `total`, `current` e `status`. Livros encontrados na API também podem ter `googleVolumeId`, `thumbnail` e `description`. Cada sessão guarda `date`, `pages`, `bookId`, `durationSeconds` e o comentário opcional. O nome exibido, a bio e a foto são armazenados em `user_profiles`; a conta também possui um `username` único no SQLite do backend.

O campo `thumbnail` é a URL https da capa retornada em `volumeInfo.imageLinks` pela API do Google Books; o serviço a normaliza e o `BookCover` a renderiza como imagem remota na estante e nos resultados de busca. Livros manuais ou resultados sem capa mostram a inicial do título como fallback.

`calculateReadingStreak()` calcula os dias consecutivos registrados e preserva a streak por até dois dias sem leitura; no terceiro dia consecutivo sem ler, ela zera. `countPagesThisWeek()` soma sessões desde segunda-feira.

Os badges usam sessões registradas, páginas lidas e livros adicionados manualmente ou pela API. Contas novas começam com a estante vazia.

## Cadastro, login e recuperação de senha

O cadastro e login enviam e-mail e senha ao backend local. `backend/server.js` guarda e-mail e hash `scrypt` no SQLite do computador; a senha original nunca é persistida. O backend emite tokens de sessão e o app guarda o token no `expo-secure-store`. Livros, sessões, metas e perfil ficam no SQLite do aparelho. O backend não pode abrir diretamente o banco privado do celular, e os dados de leitura ainda não são sincronizados entre dispositivos.

Para iniciar, abra um terminal e execute `npm run backend`; em outro terminal, execute `npx expo start`. No Expo Go em celular físico, defina `EXPO_PUBLIC_API_URL` em `.env.local` usando o IPv4 do computador e mantenha ambos na mesma rede Wi-Fi. Esquema e configuração estão em [GUIA_BANCO_E_AUTENTICACAO.md](./GUIA_BANCO_E_AUTENTICACAO.md). Recuperação de senha por e-mail ainda não existe; ela requer serviço de e-mail e tokens temporários de redefinição.

## Google Books API

A tela **Meus livros** já busca livros reais no catálogo público do Google Books por título, autor ou ISBN. Ao adicionar um resultado, o app guarda os metadados disponíveis e usa o identificador do volume para evitar duplicatas. A API pode não informar o total de páginas; nesses casos, o app abre o formulário manual para completar esse campo. A busca pública precisa de uma chave ou token segundo a documentação do Google Books.

O serviço fica isolado em `src/services/googleBooks.js`:

- `searchGoogleBooks(query, options)`: pesquisa e retorna uma lista com os campos normalizados que a interface usa.
- `getGoogleBookById(volumeId)`: busca os metadados de um volume específico.
- `normalizeVolume(volume)`: adapta o formato da resposta da API ao modelo usado pelo app.

A busca usa `GET https://www.googleapis.com/books/v1/volumes` com `q`, `maxResults`, `printType=books` e a chave configurada. [Documentação oficial da busca](https://developers.google.com/books/docs/v1/reference/volumes/list) e [autorização para o serviço](https://developers.google.com/books/docs/v1/using).

Para habilitar a busca, crie uma chave no Google Cloud, habilite a **Google Books API** no projeto e coloque a chave em `.env.local` na raiz do projeto. O arquivo `.env.example` é apenas um modelo: copie-o para `.env.local` e substitua o valor de exemplo:

```env
EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY=sua_chave_aqui
```

O Expo carrega `.env.local` durante o desenvolvimento; esse arquivo está ignorado pelo Git. **Valores com prefixo `EXPO_PUBLIC_` ficam visíveis no bundle do aplicativo.** Restrinja a chave para permitir apenas a Google Books API. Durante o teste pelo Expo Go, não aplique uma restrição de aplicativo que dependa do identificador próprio do app: o Expo Go usa o identificador do próprio Expo Go. Ao criar um app nativo próprio, configure a restrição para o identificador iOS/Android correspondente. [Como o Expo trata variáveis de ambiente](https://docs.expo.dev/guides/environment-variables/).

Depois de criar ou editar `.env.local`, recarregue o app no Expo Go para aplicar a variável.

### Erro `Quota exceeded` / `Queries per day`

Esse erro vem do limite diário do projeto Google Cloud associado à chave. Não é uma configuração de TypeScript nem um problema no formulário. O app agora explica isso em português, reutiliza buscas repetidas enquanto está aberto e para de enviar novas solicitações depois de receber o erro de cota.

Para investigar no Google Cloud Console, selecione o projeto cujo número aparece na mensagem, abra **APIs e serviços → Google Books API → Quotas** e confira o uso de `Queries per day`. Aumente o limite se o Console permitir; caso contrário, aguarde a renovação diária indicada pelo Google Cloud. Limites por dia geralmente renovam à meia-noite do horário do Pacífico. [Visão geral oficial de cotas](https://docs.cloud.google.com/docs/quotas/overview).

### Erro `dispatchNativeEvent` no Expo Go

`dispatchNativeEvent` é interno do React Native; o app não deve defini-lo nem importá-lo em JavaScript ou TypeScript. Neste projeto, o código das telas está em JavaScript. O projeto usa Expo SDK 58, React Native 0.88 e Expo Router 58, alinhados às versões recomendadas para o SDK. A barra inferior usa `router.navigate()` porque o callback da barra personalizada não fornece `navigation` nesta configuração; chamar `navigation.emit()` causava `Cannot read property 'emit' of undefined`. As telas principais ficam acessíveis pelas cinco abas inferiores (Início, Metas, Meus livros, Ler e Perfil). Para iniciar uma sessão limpa no Expo Go, pare o servidor anterior e execute `npx expo start --clear`, depois leia o novo QR code. [Tabela oficial de versões do SDK 58](https://docs.expo.dev/versions/v58.0.0/) e [documentação do Expo Router 58](https://docs.expo.dev/versions/v58.0.0/sdk/router/).

## Comandos úteis

- `npm start`: inicia o Expo.
- `npm run backend`: inicia a API local de autenticação (requer Node.js 22.13+).
- `npx expo start --clear`: inicia o Expo limpando o cache do Metro (útil após atualizar SDK/dependências).
- `npm run android`: abre o projeto no Android conectado/emulador.
- `npm run ios`: abre o projeto no iOS (precisa de macOS e Xcode).

O ponto de entrada foi alterado para `expo-router/entry`, e as rotas são descobertas em `src/app/`. `app.json` contém o plugin do Router e o esquema de links `read2gether`.

## Limites conhecidos desta versão

- O backend e o banco de contas precisam estar ativos no computador para cadastro e login; leituras persistem somente no dispositivo em que foram registradas.
- O backend local usa HTTP de desenvolvimento, não deve ser exposto à internet; uma versão publicada precisa de HTTPS e revisão de segurança.
- Recuperação de senha por e-mail ainda não está configurada.
- O cronômetro pode perder precisão quando o sistema suspende o app em segundo plano.
- A busca Google Books precisa de conexão com a internet e os metadados variam por título.
- O cadastro manual continua disponível para livros que não aparecem na API ou não têm total de páginas.

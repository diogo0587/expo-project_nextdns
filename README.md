# NextDNS Logs Manager (Expo, Dark Theme)

This app provides maintenance tools for NextDNS logs with built-in dark theme and optional integration with your Gemini API to summarize logs.

Built on [Expo Router] with file-based navigation.

## Features

- View and search NextDNS logs
- Real-time stream of new logs
- Download direct link to logs file
- Delete all logs for a profile (with confirmation)
- Settings screen to configure:
  - NextDNS API Key
  - Multiple NextDNS Profiles + quick selection
  - Timezone for queries (IANA)
  - Gemini API Key and model
- Dark theme support out of the box
- Stats: Top domains, clients, actions (barras simples)
- Export CSV dos logs

## Setup

1) Install dependencies:

```bash
npm install
```

2) Start the app:

```bash
npx expo start
```

3) Configure API keys:

- Open the app and go to the Settings tab.
- Enter your NextDNS API Key and Profile(s).
  - Get your key at https://my.nextdns.io/account
- Optionally, enter your Gemini API Key (for summarization) and model (default: `gemini-1.5-flash-latest`).
  - Get a key at https://aistudio.google.com/app/apikey

Keys and settings are securely persisted using Expo SecureStore (Android/iOS). On web, há fallback para localStorage.

## Tabs

- Home: Default starter page
- Explore: Starter guidance
- Logs: Search, filtros avançados, estatísticas, export CSV; summarize com Gemini
- Stream: Live updates usando NextDNS stream endpoint
- Download: Link para download dos logs
- Delete: Deletar todos os logs do perfil ativo
- Settings: Gerenciar chaves, perfis e timezone

## NextDNS API

This app uses the official NextDNS API:
- Docs: https://nextdns.github.io/api/
- Endpoints used:
  - `GET /profiles/:profile/logs`
  - `GET /profiles/:profile/logs/stream`
  - `GET /profiles/:profile/logs/download?redirect=0`
  - `DELETE /profiles/:profile/logs`

## Gemini API

This app calls the Google Generative Language API to summarize log data:
- Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=...`
- Default model: `gemini-1.5-flash-latest`

## Build

Web (estático):
```bash
npm run export:web
# publica a pasta dist em qualquer static hosting
```

Nativo (EAS Build):
1. Login:
```bash
npx expo login
```
2. Init EAS:
```bash
npm run eas:init
```
3. Android (produção):
```bash
npm run build:android
```
4. iOS (produção):
```bash
npm run build:ios
```
5. Enviar para lojas:
```bash
npm run submit:android
npm run submit:ios
```

EAS perfis estão em `eas.json`:
- development: developmentClient, distribuição interna
- preview: distribuição interna
- production: autoIncrement

## CI/CD (GitHub Actions)

Um workflow já está configurado em `.github/workflows/eas-build.yml`:
- Dispara builds EAS (Android/iOS) ao dar push no branch `main`.
- Exporta o build web e faz upload como artefato (`web-dist`).
- Configure o segredo `EXPO_TOKEN` no repositório (Settings → Secrets and variables → Actions).

## Notes

- O app respeita o modo escuro/claro do sistema via Expo/React Navigation.
- CORS no Web: se suas APIs bloquearem requisições do navegador, podemos adicionar um proxy.

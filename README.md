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
  - NextDNS Profile ID
  - Gemini API Key and model
- Dark theme support out of the box

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
- Enter your NextDNS API Key and Profile ID.
  - Get your key at https://my.nextdns.io/account
- Optionally, enter your Gemini API Key (for summarization) and model (default: `gemini-1.5-flash-latest`).
  - Get a key at https://aistudio.google.com/app/apikey

Note: Keys are currently stored in memory for simplicity. Persistent storage can be added if needed.

## Tabs

- Home: Default starter page
- Explore: Starter guidance
- Logs: Search and view logs; summarize with Gemini
- Stream: Live updates using NextDNS stream endpoint
- Download: Retrieve a downloadable URL for logs
- Delete: Delete all logs from the configured profile
- Settings: Manage API keys and profile

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

## Notes

- The app respects system dark/light mode via Expo/React Navigation theme provider.
- No extra storage dependencies were added; if you want persistence, we can integrate SecureStore or AsyncStorage.

# 🌾 Agrimitra

**Your Digital Farming Companion** — an AI-powered, multilingual agricultural advisory platform that gives Indian farmers personalized crop advice, real-time weather insights, government scheme discovery, yield estimates and voice-enabled chat support.

<p align="left">
  <img alt="Node" src="https://img.shields.io/badge/node-%3E%3D20-brightgreen" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.6-blue" />
  <img alt="React" src="https://img.shields.io/badge/React-18-61dafb" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-5-646cff" />
  <img alt="Express" src="https://img.shields.io/badge/Express-4-000000" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [How the Chat Pipeline Works](#how-the-chat-pipeline-works)
- [Voice Features](#voice-features)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)
- [License](#license)

---

## Overview

Agrimitra is a full-stack farming companion built for accessibility. Farmers create a simple profile (crop, soil, land size, irrigation, language) and then talk to **KRISHI SAKHI**, an AI assistant that combines the farmer's profile, live weather and recent conversation context to give short, actionable, weather-aware advice.

The UI ships in **13 Indian languages** with **Malayalam as the default**, and supports voice input/output for low-literacy and hands-free use. All third-party API keys live on the server — the browser only ever talks to Agrimitra's own `/api/*` endpoints.

---

## Features

| | Feature | Description |
|---|---|---|
| 🌾 | **AI Farm Advisory** | KRISHI SAKHI chatbot gives personalized, weather-aware farming advice |
| 🌍 | **Multilingual UI** | 13 languages — Malayalam (default), English, Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, Urdu, Odia, Assamese |
| 💬 | **Translation Pipeline** | Chat input/output translated to and from English for the AI, then back to the farmer's language |
| 🌤️ | **Live Weather & Alerts** | OpenWeather current conditions + 24h rain probability, with automatic heat / heavy-rain / pest alerts |
| 🎤 | **Voice I/O** | Browser Speech-to-Text and Text-to-Speech (Web Speech API), with per-message playback and a global TTS toggle |
| 👨‍🌾 | **Farmer Profiles** | Crop, soil, land size/unit, irrigation and language preferences, persisted locally |
| 📊 | **Dashboard** | Crop health, weather and market snapshots, AI yield estimation and personalized government schemes |
| 🛒 | **Marketplace** | AI-suggested pesticides, equipment and products with buy links |
| 📱 | **Mobile-First** | Responsive, touch-friendly layout with a floating chat launcher |
| 🔒 | **Server-side Keys** | AI, weather and translation providers are proxied through the backend; no secrets in the client bundle |

---

## Tech Stack

**Frontend**
- React 18 + Vite + TypeScript
- Tailwind CSS + shadcn/ui (`@radix-ui`) components
- `wouter` for routing
- TanStack React Query for server state
- React Hook Form + Zod for form validation
- `react-i18next` for internationalization
- Web Speech API for STT/TTS

**Backend**
- Node.js + Express (TypeScript, ESM)
- Vite middleware in development, static serving in production
- Drizzle ORM + PostgreSQL schema (optional persistence layer)
- Server-side proxies for Gemini / OpenAI, OpenWeather and Google Translate

---

## Architecture

```
┌──────────────────────────────┐        ┌───────────────────────────────┐
│   Browser (React + Vite)     │        │   Express server (Node)       │
│                              │        │                               │
│  Landing / Profile / Chat    │  HTTP  │  /api/chat     → Gemini/OpenAI│
│  Dashboard / Marketplace     │ ─────► │  /api/weather  → OpenWeather  │
│                              │  /api  │  /api/translate→ Google Trans.│
│  localStorage: profile, chat │        │  /api/schemes, /api/yield/*   │
│  Web Speech API: STT / TTS   │        │  /api/market/*                │
└──────────────────────────────┘        └───────────────────────────────┘
                                                     │
                                                     ▼
                                        Optional: PostgreSQL (Drizzle)
```

- **Development** (`npm run dev`): the Express server boots Vite in middleware mode and serves both the SPA and the API on one port (`5000`).
- **Production** (`npm run build` → `npm start`): the client is bundled to `dist/public`, the server to `dist/index.js`, and Express serves the static build plus the API.

---

## Project Structure

```
Agrimitra/
├── client/                     # Frontend (React + Vite)
│   ├── index.html              # SPA shell (fonts, Font Awesome, root div)
│   └── src/
│       ├── components/          # Layout, FloatingChatButton + ui/ primitives
│       ├── hooks/               # useProfile, useWeather, useChat, useVoice, useI18n
│       ├── locales/             # 13 JSON translation files
│       ├── pages/               # Landing, Profile, Chat, Dashboard, Marketplace, not-found
│       ├── services/            # aiService, weatherService, translationService,
│       │                        # voiceService, storageService, schemesService
│       ├── lib/                 # queryClient, utils (cn)
│       ├── types/               # Shared frontend types
│       ├── App.tsx              # Routes + providers
│       ├── i18n.ts              # i18next configuration
│       └── index.css            # Tailwind layers, theme tokens, animations
├── server/                     # Backend (Express)
│   ├── index.ts                 # App bootstrap, logging, error handling, listen
│   ├── routes.ts                # All /api/* endpoints + AI system prompt
│   ├── storage.ts               # In-memory storage implementation
│   └── vite.ts                  # Vite dev middleware + static serving + logger
├── shared/
│   └── schema.ts                # Drizzle tables + Zod insert schemas
├── .env.example                # Template for all environment variables
├── drizzle.config.ts           # Drizzle Kit config (optional DB)
├── tailwind.config.ts          # Tailwind theme + animations
├── vite.config.ts              # Vite config (aliases, root, build output)
└── package.json
```

---

## Prerequisites

- **Node.js 20+** (the build uses `import.meta.dirname`)
- **npm 9+**
- API keys (optional — the app degrades gracefully):
  - [Google Gemini](https://aistudio.google.com/app/apikey) or [OpenAI](https://platform.openai.com/api-keys) for the AI chat
  - [OpenWeather](https://home.openweathermap.org/api_keys) for live weather
  - [Google Cloud Translation](https://console.cloud.google.com/apis/credentials) (optional; a mock translator is used when absent)

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create your local `.env` from the template and fill in your keys:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

See [Environment Variables](#environment-variables) for the full list.

### 3. Run in development

```bash
npm run dev
```

Open **http://localhost:5000**. The same server hosts the SPA and the API.

### 4. Build & run for production

```bash
npm run build
npm start
```

### 5. (Optional) Provision the database

The app runs fully without a database (profiles and chat live in the browser's `localStorage`). To push the Drizzle schema to PostgreSQL:

```bash
# requires DATABASE_URL in .env
npm run db:push
```

---

## Environment Variables

All variables are read server-side. Copy `.env.example` to `.env` and set the values.

| Variable | Required | Default | Description |
|---|---|---|---|
| `AI_PROVIDER` | No | auto-detect | `gemini` or `openai`. Falls back to whichever key is present. |
| `GEMINI_API_KEY` | Yes* | — | Google Gemini API key. |
| `GEMINI_MODEL` | No | `gemini-1.5-flash` | Gemini model name. |
| `OPENAI_API_KEY` | Yes* | — | OpenAI API key (used when `AI_PROVIDER=openai`). |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | OpenAI model name. |
| `OPENWEATHER_API_KEY` | Yes** | — | OpenWeather key for weather + forecast. |
| `TRANSLATE_API_KEY` | No | — | Google Cloud Translation key. Mock translation is used when empty. |
| `PORT` | No | `5000` | HTTP port. |
| `NODE_ENV` | No | `development` | `development` enables Vite middleware; `production` serves the build. |
| `DATABASE_URL` | No | — | PostgreSQL connection string, only needed for `npm run db:push`. |

\* At least one of `GEMINI_API_KEY` / `OPENAI_API_KEY` for AI chat.
\** Required for live weather; the app shows demo weather when it is missing.

> **Never commit `.env`.** It is already listed in `.gitignore`; only `.env.example` is tracked.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server (Express + Vite HMR) on `PORT`. |
| `npm run build` | Build the client to `dist/public` and bundle the server to `dist/index.js`. |
| `npm start` | Run the production server from `dist/`. |
| `npm run check` | Type-check the whole project with `tsc`. |
| `npm run db:push` | Push the Drizzle schema to `DATABASE_URL` (PostgreSQL). |

---

## API Reference

All endpoints are served under `/api`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | KRISHI SAKHI chat. Body: `{ message, context }`. Returns `{ response }`. |
| `GET` | `/api/weather?location=<place>` | Current weather + 24h rain probability for a location. |
| `POST` | `/api/translate` | Translate text. Body: `{ text, from, to }`. Returns `{ translatedText }`. |
| `GET` | `/api/schemes?state=&category=&q=` | Farmer welfare schemes (curated + AI-augmented). |
| `POST` | `/api/yield/estimate` | Rule-based yield estimate. Body: `{ crop, area, unit, sowingDate, ... }`. |
| `GET` | `/api/market/products?category=&q=` | Product suggestions for a marketplace category. |
| `GET` | `/api/market/trending?location=&crop=` | Trending pesticides/equipment for the region. |
| `POST` | `/api/profiles` | Create a farmer profile (in-memory). |
| `GET/PUT/DELETE` | `/api/profiles/:id` | Read, update or delete a profile. |
| `POST/GET/DELETE` | `/api/profiles/:profileId/messages` | Chat message persistence. |
| `POST/GET` | `/api/profiles/:profileId/alerts` | Weather/pest/market alerts. |
| `PUT` | `/api/alerts/:alertId/read` | Mark an alert as read. |

---

## How the Chat Pipeline Works

1. The farmer types or speaks a message (in their **chatbot language**).
2. `useChat` translates it to English via `/api/translate` (if needed).
3. It builds a context object from the **profile**, the latest **weather** and the **last few messages**.
4. `POST /api/chat` sends the message + context to Gemini (or OpenAI) with the KRISHI SAKHI system prompt, which encodes weather rules (heat, rain, humidity + crop).
5. The English reply is translated back into the chatbot language.
6. The message pair is appended to the chat and saved to `localStorage`.
7. If TTS is enabled, the reply is spoken aloud; each bot message also has a play button.

---

## Voice Features

- **Speech-to-Text**: browser `SpeechRecognition`/`webkitSpeechRecognition`, mapped to the correct Indian locale.
- **Text-to-Speech**: browser `speechSynthesis`, preferring a matching voice and falling back to English.
- Voice input requires a **secure context** (HTTPS or `localhost`) and microphone permission.

---

## Deployment

**Any Node host (Render, Railway, Fly.io, VPS):**

```bash
npm ci
npm run build
NODE_ENV=production npm start
```

Set the environment variables from the [table above](#environment-variables) in your host's dashboard. The server listens on `PORT` and binds to `0.0.0.0`.

The server binds to `0.0.0.0` on `PORT`, so it works behind most PaaS proxies out of the box. For platforms that require a health check, use `GET /api/schemes` (returns `200` without any external key).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Chat replies with generic fallback text | No AI key configured, or the provider returned an error. Check `GEMINI_API_KEY` / `OPENAI_API_KEY` and `AI_PROVIDER` in `.env`. |
| Weather shows demo values (32°C, 75%) | `OPENWEATHER_API_KEY` is missing or invalid. Check the server logs for `Weather API error`. |
| Icons appear as blank boxes | Font Awesome is loaded from a CDN — ensure the browser can reach `cdnjs.cloudflare.com`. |
| Chat text isn't translated | `TRANSLATE_API_KEY` is empty, so the mock translator is used. Add a Google Translate key for real translations. |
| Voice buttons do nothing | The browser doesn't support the Web Speech API, or microphone permission was denied. Use Chrome/Edge over HTTPS or `localhost`. |
| `npm run db:push` fails | `DATABASE_URL` is unset or the database is unreachable. The app does not need a database to run. |
| Port already in use | Change `PORT` in `.env`. |

---

## Security Notes

- All third-party API calls are proxied by the Express server, so no provider keys are embedded in the client bundle.
- `.env` is git-ignored; keep secrets out of version control and rotate any key that has ever been committed.
- Profile and chat data are stored in the browser's `localStorage` only — nothing personal leaves the device except the chat message and context sent to the configured AI provider.
- The in-memory storage layer (`server/storage.ts`) is intended for development; use the Drizzle/PostgreSQL schema for durable, multi-user persistence.

---

## License

Released under the **MIT License**. See `package.json` for details.

---

<p align="center"><em>Built to help farmers grow better, with technology that speaks their language. 🌱</em></p>

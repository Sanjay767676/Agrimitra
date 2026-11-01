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

Agrimitra is a farming companion built for accessibility. Farmers create a simple profile (crop, soil, land size, irrigation, language) and then talk to **KRISHI SAKHI**, an AI assistant that combines the farmer's profile, live weather and recent conversation context to give short, actionable, weather-aware advice.

The UI ships in **13 Indian languages** with **Malayalam as the default**, and supports voice input/output for low-literacy and hands-free use. All third-party API keys live on the backend — the browser only ever talks to Agrimitra's own `/api/*` endpoints.

The project is split into two independent apps:

- **`frontend/`** — the React + Vite single-page app.
- **`backend/`** — the Express API that proxies AI, weather and translation providers.

They run as separate processes and communicate over HTTP.

---

## Features

| | Feature | Description |
|---|---|---|
| 🌾 | **AI Farm Advisory** | KRISHI SAKHI chatbot gives personalized, weather-aware farming advice |
| 🌍 | **Multilingual UI** | 13 languages — Malayalam (default), English, Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, Urdu, Odia, Assamese |
| 💬 | **Translation Pipeline** | Chat input/output translated to and from English for the AI, then back to the farmer's language |
| 🌤️ | **Live Weather & Alerts** | OpenWeather current conditions + 24h rain probability, with automatic heat / heavy-rain / pest alerts |
| 🎤 | **Voice I/O** | Browser Speech-to-Text and Text-to-Speech (Web Speech API), with per-message playback and a global TTS toggle |
| 👨‍🌾 | **Farmer Profiles** | Crop, soil, land size/unit, irrigation and language preferences, persisted in the browser |
| 📊 | **Dashboard** | Crop health, weather and market snapshots, AI yield estimation and personalized government schemes |
| 🛒 | **Marketplace** | AI-suggested pesticides, equipment and products with buy links |
| 📱 | **Mobile-First** | Responsive, touch-friendly layout with a floating chat launcher |
| 🔒 | **Server-side Keys** | AI, weather and translation providers are proxied through the backend; no secrets in the client bundle |

---

## Tech Stack

**Frontend (`frontend/`)**
- React 18 + Vite + TypeScript
- Tailwind CSS + shadcn/ui (`@radix-ui`) components
- `wouter` for routing
- TanStack React Query for server state
- React Hook Form + Zod for form validation
- `react-i18next` for internationalization
- Web Speech API for STT/TTS

**Backend (`backend/`)**
- Node.js + Express (TypeScript, ESM)
- CORS-enabled JSON API
- Server-side proxies for Gemini / OpenAI, OpenWeather and Google Translate

Farmer profiles and chat history are stored in the browser's `localStorage`; the backend is stateless.

---

## Architecture

```
┌──────────────────────────────┐         ┌───────────────────────────────┐
│  frontend/  (React + Vite)   │         │  backend/  (Express API)      │
│  http://localhost:5173       │  HTTP   │  http://localhost:5000        │
│                              │ ──────► │                               │
│  Landing / Profile / Chat    │  /api   │  /api/chat     → Gemini/OpenAI│
│  Dashboard / Marketplace     │ (proxy) │  /api/weather  → OpenWeather  │
│                              │         │  /api/translate→ Google Trans.│
│  localStorage: profile, chat │         │  /api/schemes, /api/yield/*   │
│  Web Speech API: STT / TTS   │         │  /api/market/*                │
└──────────────────────────────┘         └───────────────────────────────┘
```

- **Development:** the Vite dev server (`frontend`, port `5173`) proxies all `/api` requests to the Express server (`backend`, port `5000`), so there are no CORS issues in the browser.
- **Production:** build the frontend to `frontend/dist`. Serve it with any static host, or copy it to `backend/dist/public` and let Express serve it.

---

## Project Structure

```
Agrimitra/
├── frontend/                   # React + Vite SPA
│   ├── index.html
│   ├── src/
│   │   ├── components/          # Layout, FloatingChatButton + ui/ primitives
│   │   ├── hooks/               # useProfile, useWeather, useChat, useVoice, useI18n
│   │   ├── locales/             # 13 JSON translation files
│   │   ├── pages/               # Landing, Profile, Chat, Dashboard, Marketplace, not-found
│   │   ├── services/            # aiService, weatherService, translationService,
│   │   │                        # voiceService, storageService, schemesService
│   │   ├── lib/                 # queryClient, utils (cn)
│   │   ├── types/               # Shared frontend types
│   │   ├── App.tsx              # Routes + providers
│   │   ├── i18n.ts              # i18next configuration
│   │   └── index.css            # Tailwind layers, theme tokens, animations
│   ├── vite.config.ts          # Vite config + /api dev proxy
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── components.json
│   ├── tsconfig.json
│   └── package.json
├── backend/                    # Express API
│   ├── src/
│   │   ├── index.ts             # App bootstrap, CORS, logging, (prod) static serve
│   │   └── routes.ts            # /api/* endpoints + AI system prompt
│   ├── .env.example             # Backend environment variables
│   ├── tsconfig.json
│   └── package.json
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Node.js 20+**
- **npm 9+**
- API keys (optional — the app degrades gracefully):
  - [Google Gemini](https://aistudio.google.com/app/apikey) or [OpenAI](https://platform.openai.com/api-keys) for the AI chat
  - [OpenWeather](https://home.openweathermap.org/api_keys) for live weather
  - [Google Cloud Translation](https://console.cloud.google.com/apis/credentials) (optional; a mock translator is used when absent)

---

## Getting Started

Run the backend and frontend in **two terminals**.

### 1. Backend

```bash
cd backend
npm install

# configure environment variables
# Windows (PowerShell): Copy-Item .env.example .env
# macOS / Linux:        cp .env.example .env
npm run dev
```

The API starts on **http://localhost:5000**.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The dev server proxies `/api` to the backend automatically.

> To point the frontend at a different backend URL during development, set `VITE_API_TARGET`, e.g. `VITE_API_TARGET=http://localhost:8080 npm run dev`.

### 3. Supabase (authentication + farmer data)

1. In your Supabase project, open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates the
   `farmer_profiles` and `chat_messages` tables with Row Level Security.
2. Go to **Project Settings → API** and copy:
   - the **anon public** key → put it in `frontend/.env` as `VITE_SUPABASE_ANON_KEY`
   - the **service_role** key → put it in `backend/.env` as `SUPABASE_SERVICE_ROLE_KEY`
3. Set `SUPABASE_URL` (backend) and `VITE_SUPABASE_URL` (frontend) to your project URL.

> If the Supabase keys are left as placeholders, the app still runs but stores the
> profile and chat only in the browser's `localStorage` (no login).

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `AI_PROVIDER` | No | auto-detect | `gemini` or `openai`. Falls back to whichever key is present. |
| `GEMINI_API_KEY` | Yes* | — | Google Gemini API key (powers the chatbot). |
| `GEMINI_MODEL` | No | `gemini-1.5-flash` | Gemini model name. |
| `OPENAI_API_KEY` | Yes* | — | OpenAI API key (used when `AI_PROVIDER=openai`). |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | OpenAI model name. |
| `OPENROUTER_API_KEY` | No | — | OpenRouter key. Generates up-to-date government schemes; curated list used when empty. |
| `OPENROUTER_MODEL` | No | `openai/gpt-4o-mini` | OpenRouter model for schemes. |
| `OPENWEATHER_API_KEY` | Yes** | — | OpenWeather key for weather + forecast. |
| `TRANSLATE_API_KEY` | No | — | Google Cloud Translation key. Mock translation is used when empty. |
| `SUPABASE_URL` | No*** | — | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | No*** | — | Supabase **service_role** key. Backend only — never expose it. |
| `PORT` | No | `5000` | HTTP port for the backend. |
| `NODE_ENV` | No | `development` | `production` enables static serving of the built frontend if present. |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | No*** | Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | No*** | Supabase **anon public** key. Safe to expose in the browser. |
| `VITE_API_TARGET` | No | Override the backend URL for the dev proxy (default `http://localhost:5000`). |

\* At least one of `GEMINI_API_KEY` / `OPENAI_API_KEY` for AI chat.
\** Required for live weather; the frontend shows demo weather when it is missing.
\*** Required for login + cloud storage of farmer data. Without them the app falls back to `localStorage`.

> **Never commit `.env`.** Only `.env.example` is tracked. The `service_role` key must stay on the backend.

---

## Available Scripts

**Backend (`backend/`)**

| Script | Description |
|---|---|
| `npm run dev` | Start the API with hot reload (`tsx watch`) on `PORT`. |
| `npm run build` | Bundle the server to `backend/dist/index.js`. |
| `npm start` | Run the production server from `dist/`. |
| `npm run check` | Type-check the backend. |

**Frontend (`frontend/`)**

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite dev server on `5173` with the `/api` proxy. |
| `npm run build` | Build the SPA to `frontend/dist`. |
| `npm run preview` | Preview the production build locally. |
| `npm run check` | Type-check the frontend. |

---

## API Reference

All endpoints are served by the backend under `/api`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | KRISHI SAKHI chat. Body: `{ message, context }`. Returns `{ response }`. |
| `GET` | `/api/weather?location=<place>` | Current weather + 24h rain probability for a location. |
| `POST` | `/api/translate` | Translate text. Body: `{ text, from, to }`. Returns `{ translatedText }`. |
| `GET` | `/api/schemes?state=&category=&q=` | Farmer welfare schemes (curated + AI-augmented). |
| `POST` | `/api/yield/estimate` | Rule-based yield estimate. Body: `{ crop, area, unit, sowingDate, ... }`. |
| `GET` | `/api/market/products?category=&q=` | Product suggestions for a marketplace category. |
| `GET` | `/api/market/trending?location=&crop=` | Trending pesticides/equipment for the region. |

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

The two apps deploy independently.

**Backend** (Render, Railway, Fly.io, a VPS, etc.):

```bash
cd backend
npm ci
npm run build
NODE_ENV=production npm start
```

Set the environment variables from the [table above](#environment-variables) in your host's dashboard. The server listens on `PORT` and binds to `0.0.0.0`.

**Frontend** (any static host — Netlify, Vercel, S3/CloudFront, etc.):

```bash
cd frontend
npm ci
npm run build   # outputs frontend/dist
```

Configure the host so `/api/*` is routed to the backend (via a proxy/rewrite rule), or serve the built SPA from the backend by copying `frontend/dist` to `backend/dist/public` before `npm start`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Frontend can't reach the API | Make sure the backend is running on `5000`, or set `VITE_API_TARGET` to its URL. |
| Chat replies with generic fallback text | No AI key configured, or the provider returned an error. Check `GEMINI_API_KEY` / `OPENAI_API_KEY` and `AI_PROVIDER` in `backend/.env`. |
| Weather shows demo values (32°C, 75%) | `OPENWEATHER_API_KEY` is missing or invalid. Check the backend logs for `Weather API error`. |
| Icons appear as blank boxes | Font Awesome is loaded from a CDN — ensure the browser can reach `cdnjs.cloudflare.com`. |
| Chat text isn't translated | `TRANSLATE_API_KEY` is empty, so the mock translator is used. Add a Google Translate key for real translations. |
| Voice buttons do nothing | The browser doesn't support the Web Speech API, or microphone permission was denied. Use Chrome/Edge over HTTPS or `localhost`. |
| Port already in use | Change `PORT` in `backend/.env`, or the `server.port` in `frontend/vite.config.ts`. |

---

## Security Notes

- All third-party API calls are proxied by the Express backend, so no provider keys are embedded in the client bundle.
- `.env` is git-ignored; keep secrets out of version control and rotate any key that has ever been committed.
- Profile and chat data are stored in the browser's `localStorage` only — nothing personal leaves the device except the chat message and context sent to the configured AI provider.

---

## License

Released under the **MIT License**.

---

<p align="center"><em>Built to help farmers grow better, with technology that speaks their language. 🌱</em></p>

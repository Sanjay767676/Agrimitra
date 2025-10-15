# Agrimitra - Your Digital Farming Companion

A multilingual agricultural advisory platform powered by AI, providing farmers with personalized crop advice, weather insights, and voice-enabled chat support.

## Features

- 🌾 **AI-Powered Farm Advisory**: KRISHI SAKHI chatbot provides personalized farming advice
- 🌍 **Multilingual Support**: 13+ Indian languages including Malayalam (default), Hindi, Tamil, Telugu, and more
- 🌤️ **Real-time Weather Integration**: OpenWeather API integration with weather-based alerts
- 🎤 **Voice Features**: Speech-to-Text input and Text-to-Speech output for accessibility
- 👨‍🌾 **Farmer Profile Management**: Personalized recommendations based on crop, soil, and irrigation data
- 📱 **Mobile-First Design**: Responsive interface optimized for mobile devices
- 🔄 **Translation Pipeline**: Seamless multilingual chat communication

## Tech Stack

### Frontend
- **React 18** with **Vite** for fast development
- **TailwindCSS** for responsive styling
- **React Router** (wouter) for navigation
- **React Query** for state management
- **React Hook Form** with Zod validation
- **react-i18next** for internationalization
- **Web Speech API** for voice features

### Backend
- **Express.js** server
- **In-memory storage** with optional Firebase integration
- **OpenWeather API** for weather data
- **OpenAI API** for AI chat responses
- **Google Translate API** (optional) for translation

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment variables

Create a `.env` file in the project root with:

```
PORT=5000
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4o-mini
OPENWEATHER_API_KEY=your-openweather-key
TRANSLATE_API_KEY=optional-google-translate-key
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-1.5-flash
```

### 3. Run in development

```bash
npm run dev
```

Server will start on `http://localhost:5000` and serve the React app with Vite.

### 4. Build and run production

```bash
npm run build
npm start
```

### Windows notes

Scripts use `cross-env` to set `NODE_ENV`, so they work on Windows PowerShell and CMD.

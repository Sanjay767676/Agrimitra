# Overview

Agrimitra is a multilingual agricultural advisory platform designed to empower farmers with AI-powered farming advice, real-time weather insights, and voice-enabled chat support. The application serves as a digital farming companion, offering personalized crop recommendations, weather-based alerts, and agricultural guidance in 13+ Indian languages with Malayalam as the default. The platform emphasizes accessibility through mobile-first design and voice interaction capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 18 with Vite**: Modern development setup for fast build times and hot module replacement
- **TypeScript**: Type-safe development across the entire codebase
- **Wouter**: Lightweight client-side routing for navigation
- **TailwindCSS with shadcn/ui**: Responsive design system with pre-built components
- **Mobile-first design**: Optimized for mobile devices with responsive breakpoints

## State Management
- **React Query**: Server state management with caching and synchronization
- **React Hook Form with Zod**: Form handling with schema validation
- **Local Storage**: Primary data persistence for farmer profiles and chat history
- **In-memory caching**: Weather data and API responses cached for performance

## Internationalization
- **react-i18next**: Multi-language support system
- **13 Indian Languages**: Full localization including Malayalam (default), Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, Urdu, Odia, and Assamese
- **Separate language preferences**: Independent settings for UI language and chatbot communication language

## Voice Features
- **Web Speech API**: Browser-native speech-to-text (STT) and text-to-speech (TTS)
- **Multi-language voice support**: Voice input/output in various Indian languages
- **Fallback mechanisms**: Graceful degradation when voice features are unavailable

## Backend Architecture
- **Express.js server**: RESTful API endpoints for data management
- **In-memory storage**: Primary data store with localStorage fallback
- **Modular service architecture**: Separate services for AI, weather, translation, and voice
- **Session management**: User profile and chat session persistence

## Data Models
- **Farmer Profiles**: Personal information, farm details, and language preferences
- **Chat Messages**: Conversation history with sender identification and timestamps
- **Weather Alerts**: Contextual farming alerts based on weather conditions
- **Drizzle ORM integration**: Database schema ready for PostgreSQL deployment

# External Dependencies

## Core APIs
- **OpenAI API**: AI-powered farming advice through GPT-4 integration
- **OpenWeather API**: Real-time weather data and forecasting (API key: ad2346767fce3e9feefd0c79a65ddcc9)
- **Google Translate API**: Optional multilingual translation capabilities
- **Web Speech API**: Browser-native voice recognition and synthesis

## Development Dependencies
- **Vite**: Build tool and development server
- **ESBuild**: Fast JavaScript bundling for production
- **TypeScript compiler**: Type checking and transpilation
- **Drizzle Kit**: Database migration and schema management

## UI Component Libraries
- **Radix UI**: Accessible component primitives for forms, dialogs, and navigation
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe CSS class management
- **TailwindCSS plugins**: Extended styling capabilities

## Optional Integrations
- **Firebase**: Alternative backend storage and authentication (configurable)
- **PostgreSQL with Neon**: Cloud database option via Drizzle ORM
- **Google Cloud Services**: Enhanced translation and voice services
- **Chart.js**: Data visualization for dashboard analytics (placeholder ready)

## Browser APIs
- **localStorage**: Client-side data persistence
- **Geolocation API**: Location-based weather services
- **Notification API**: Weather and farming alerts
- **Service Worker**: Offline functionality (ready for implementation)
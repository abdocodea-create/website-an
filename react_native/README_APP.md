# React Native Expo Anime App

A React Native Expo application for streaming anime, built to mirror the existing web frontend.

## Features

- **Authentication**: Login and Register with JWT token management
- **Home**: Browse latest and popular anime
- **Search**: Search anime with debounced input
- **Anime Details**: Full-screen hero section with anime info and episodes list
- **Video Player**: Watch episodes with expo-av video player
- **Profile**: User information and logout

## Tech Stack

- **Expo Router**: File-based routing
- **NativeWind**: Tailwind CSS for React Native
- **Zustand**: State management with AsyncStorage persistence
- **React Query**: Data fetching and caching
- **Axios**: HTTP client with interceptors
- **React Hook Form + Zod**: Form validation
- **Expo AV**: Video playback
- **Lucide React Native**: Icons

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
EXPO_PUBLIC_API_URL=http://YOUR_BACKEND_IP:8080/api
```

3. Run the app:
```bash
# Development
npm start

# Android
npm run android

# iOS (macOS only)
npm run ios

# Web
npm run web
```

## Project Structure

```
app/
  (auth)/
    login.tsx           # Login screen
    register.tsx        # Register screen
  (tabs)/
    index.tsx           # Home screen
    search.tsx          # Search screen
    profile.tsx         # Profile screen
  anime/
    [id].tsx            # Anime details
    watch/
      [...params].tsx   # Video player
components/
  ui/                   # Shadcn-like components
lib/
  api.ts                # Axios configuration
  utils.ts              # Utility functions
stores/
  auth-store.ts         # Auth state management
```

## API Integration

All screens are connected to the backend API:
- `/auth/login` - Login
- `/auth/register` - Register
- `/animes` - Get animes list
- `/animes/:id` - Get anime details
- `/episodes` - Get episodes
- `/animes/search` - Search animes

## Styling

Uses NativeWind (Tailwind CSS) with a custom theme matching the web app:
- Custom colors (primary, secondary, muted, etc.)
- Dark mode support
- Shadcn-inspired components

## Notes

- The app uses the same API endpoints as the web frontend
- Token refresh is handled automatically via Axios interceptors
- User session persists via AsyncStorage
- Video player uses expo-av for cross-platform support

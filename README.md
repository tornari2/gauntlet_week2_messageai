# GauntletAI Week 2: MessageAI - WhatsApp Clone MVP

A real-time messaging application built with React Native and Expo that replicates core WhatsApp functionality.

> **Note:** For comprehensive documentation, see:
> - `../ARCHITECTURE.md` - System architecture and design patterns
> - `../IMPLEMENTATION_PLAN.md` - Detailed PR breakdown and tasks
> - `./memory-bank/` - Project context and progress tracking

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Expo Go app on your mobile device
- Firebase account

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase credentials
   ```

3. **Run the app:**
   ```bash
   npm start
   # Scan QR code with Expo Go
   ```

## 📱 Development Commands

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm test           # Run tests
npm run test:coverage  # Run tests with coverage
```

## 🔧 Tech Stack

- **Framework:** React Native + Expo SDK 54
- **Language:** TypeScript (strict mode)
- **State:** Zustand
- **Navigation:** React Navigation 6
- **Backend:** Firebase (Auth, Firestore, FCM)
- **Testing:** Jest + React Native Testing Library

## 📁 Project Structure

```
gauntletai_week2_messageai/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # Screen components
│   ├── services/       # Business logic & Firebase
│   ├── stores/         # Zustand state management
│   ├── navigation/     # React Navigation setup
│   ├── types/          # TypeScript definitions
│   └── utils/          # Helper functions
├── __tests__/          # Test files
├── assets/             # Images, icons, splash
├── App.tsx             # Root component
└── package.json        # Dependencies
```

## 🔥 Firebase Setup Required

Before running the app, you must:

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Email/Password authentication
3. Create a Firestore database (test mode)
4. Copy your config to `.env` file

## 📖 Full Documentation

See parent directory for:
- **ARCHITECTURE.md** - Complete system design
- **IMPLEMENTATION_PLAN.md** - 12 PR roadmap
- **PR1_SUMMARY.md** - Foundation setup details
- **memory-bank/** - Development context

## ✅ Current Status

**Phase:** PR #1 Complete  
**Next:** PR #2 - Authentication System

---

**GauntletAI Week 2 Project** | Built with React Native + Expo + Firebase


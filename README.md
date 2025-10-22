# 💬 MessageAI - WhatsApp Clone MVP

A production-ready, real-time messaging application built with React Native and Expo that replicates core WhatsApp functionality with Firebase backend.

![React Native](https://img.shields.io/badge/React_Native-0.81.4-61DAFB?logo=react)
![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-12.4-FFCA28?logo=firebase)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Setup Instructions](#-setup-instructions)
  - [Expo Go (Quick Start)](#1-expo-go-quick-start)
  - [iOS Simulator](#2-ios-simulator-local-development)
  - [Android Emulator](#3-android-emulator-local-development)
- [Firebase Configuration](#-firebase-configuration)
- [Running the App](#-running-the-app)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

**MessageAI** is a WhatsApp-inspired mobile messaging application designed for iOS and Android. This MVP focuses on delivering a seamless real-time messaging experience with features including:

- **Real-time messaging** with < 1 second latency
- **Group chat support** for multi-user conversations
- **Local notifications** with in-app banners and system alerts
- **Presence system** showing user online/offline status
- **Optimistic UI updates** for instant message display
- **Offline support** with automatic sync when back online
- **Firebase backend** for serverless, scalable architecture

This is a **GauntletAI Week 2 project** demonstrating production-ready mobile development with React Native, TypeScript, and Firebase.

### What Makes This Special?

- ✅ **Expo Go Compatible**: Test instantly on physical devices without building
- ✅ **WebSocket-like Notifications**: Real-time delivery using Firebase Realtime Database
- ✅ **Optimistic UI**: Messages appear instantly with auto-sync
- ✅ **Smart Notifications**: Suppresses alerts when viewing active chat
- ✅ **Offline-First**: Queue messages and sync when connected
- ✅ **Production Ready**: 70%+ test coverage, comprehensive error handling

---

## ✨ Features

### Core Messaging
- 💬 **Direct Messages**: One-on-one conversations
- 👥 **Group Chats**: Multi-participant messaging
- ⚡ **Real-time Delivery**: Instant message sync across devices
- 📱 **Optimistic UI**: Messages show immediately with sync confirmation
- 📎 **Message Status**: Sent, delivered, read indicators

### User Management
- 🔐 **Authentication**: Email/password with Firebase Auth
- 👤 **User Profiles**: Display name, email, avatar support
- 🟢 **Presence System**: Real-time online/offline status
- 📊 **Connection Status**: Visual indicators for network state

### Notifications
- 🔔 **In-App Banners**: Beautiful animated notifications (foreground)
- 📲 **System Notifications**: Native alerts (background)
- 🔕 **Smart Suppression**: No alerts when viewing active chat
- 🎯 **Actionable**: Tap to navigate directly to conversation

### User Experience
- 🎨 **Modern UI**: WhatsApp-inspired design with Material influences
- 🌙 **Smooth Animations**: Transitions, banners, message animations
- ⚙️ **Swipe Actions**: Delete chats with native gestures
- 🔄 **Pull to Refresh**: Update chat lists and messages
- 📱 **Cross-Platform**: Consistent experience on iOS and Android

---

## 🔧 Tech Stack

### Frontend
- **Framework**: React Native 0.81.4
- **Build Tool**: Expo SDK 54
- **Language**: TypeScript 5.9 (strict mode)
- **Navigation**: React Navigation 6 (Native Stack)
- **State Management**: Zustand 5.0

### Backend & Services
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Real-time**: Firebase Realtime Database
- **Storage**: AsyncStorage (local) + Firebase Storage (future)
- **Notifications**: Expo Notifications API

### Development Tools
- **Testing**: Jest 30 + React Native Testing Library
- **Type Checking**: TypeScript with strict mode
- **Code Quality**: ESLint + Prettier (configured)
- **Version Control**: Git

### Key Dependencies
```json
{
  "react": "19.1.0",
  "react-native": "0.81.4",
  "expo": "^54.0.16",
  "firebase": "^12.4.0",
  "zustand": "^5.0.8",
  "@react-navigation/native": "^7.1.18",
  "expo-notifications": "~0.32.12",
  "@react-native-community/netinfo": "^11.4.1"
}
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be v18+
   ```
   Download from: https://nodejs.org/

2. **npm** (comes with Node.js) or **yarn**
   ```bash
   npm --version  # Should be 9+
   ```

3. **Git**
   ```bash
   git --version
   ```

4. **Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

### For iOS Development (macOS only)

5. **Xcode** (14.0 or higher)
   - Download from Mac App Store
   - Install Command Line Tools:
     ```bash
     xcode-select --install
     ```

6. **CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

### For Android Development

7. **Android Studio**
   - Download from: https://developer.android.com/studio
   - Install Android SDK (API Level 33+)
   - Configure Android Virtual Device (AVD)

### For Quick Testing

8. **Expo Go App** (on physical device)
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

### Firebase Account

9. **Firebase Project**
   - Create account at: https://console.firebase.google.com/
   - You'll configure this in setup step

---

## 💾 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd WK2_MessageAI/gauntletai_week2_messageai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

   This will install all required packages including React Native, Expo, Firebase, and testing libraries.

3. **Verify installation**
   ```bash
   npm list --depth=0
   ```

   You should see all dependencies listed without errors.

---

## 🚀 Setup Instructions

Choose your preferred development environment:

### 1. Expo Go (Quick Start)

**Best for**: Quick testing, no build required, works on any OS

#### Steps:

1. **Start Metro bundler**
   ```bash
   npm start
   ```
   Or:
   ```bash
   npx expo start
   ```

2. **A QR code will appear in terminal**

3. **Scan the QR code**:
   - **iOS**: Open Camera app → Point at QR code → Tap notification
   - **Android**: Open Expo Go app → Tap "Scan QR Code"

4. **App will load on your device**
   - First load takes 30-60 seconds
   - Subsequent loads are faster with cache

#### Expo Go Limitations:
- ✅ Perfect for development and testing
- ✅ Full feature support for this app
- ✅ Hot reload and fast refresh
- ❌ Cannot add custom native modules (not needed for this project)
- ❌ Requires internet connection to load

---

### 2. iOS Simulator (Local Development)

**Best for**: macOS developers wanting native iOS experience

#### Prerequisites:
- macOS computer
- Xcode 14+ installed
- CocoaPods installed

#### Steps:

1. **Install iOS dependencies**
   ```bash
   cd ios
   pod install
   cd ..
   ```

2. **Build and run on iOS simulator**
   ```bash
   npm run ios
   ```
   
   Or with specific simulator:
   ```bash
   npx expo run:ios --device
   ```

3. **Select simulator** from the list that appears:
   ```
   ? Select a simulator
   ❯ iPhone 15 Pro
     iPhone 15
     iPhone 14 Pro
     iPad Pro (12.9-inch)
   ```

4. **App will build and launch**
   - First build takes 3-5 minutes
   - Subsequent builds are faster (~30 seconds)
   - Simulator will open automatically

#### iOS Simulator Tips:
- Press `i` in terminal to select a different simulator
- Use `Cmd + D` in simulator for dev menu
- Use `Cmd + R` to reload
- Simulator location: `/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app`

#### Troubleshooting iOS:
```bash
# Clear iOS build cache
cd ios
rm -rf build
rm -rf Pods
rm Podfile.lock
pod install --repo-update
cd ..

# Rebuild
npm run ios
```

---

### 3. Android Emulator (Local Development)

**Best for**: Testing Android-specific features, works on any OS

#### Prerequisites:
- Android Studio installed
- Android SDK installed (API 33+)
- Android emulator configured

#### Setup Android Virtual Device (AVD):

1. **Open Android Studio**

2. **Open AVD Manager**:
   - Tools → Device Manager
   - Or press toolbar icon

3. **Create Virtual Device**:
   - Click "Create Device"
   - Select: Pixel 5 (or any modern device)
   - System Image: API 33 (Android 13.0) or higher
   - Click "Next" → "Finish"

4. **Start the emulator**:
   - Click ▶️ play button next to your device
   - Wait for emulator to fully boot

#### Run App on Android:

1. **Verify emulator is running**
   ```bash
   adb devices
   ```
   Should show:
   ```
   List of devices attached
   emulator-5554   device
   ```

2. **Build and run**
   ```bash
   npm run android
   ```
   
   Or:
   ```bash
   npx expo run:android
   ```

3. **App will build and launch**
   - First build takes 5-10 minutes
   - Subsequent builds are faster (~1 minute)
   - App will install and open automatically

#### Android Emulator Tips:
- Press `a` in terminal to select a different device
- Shake device or press `Cmd/Ctrl + M` for dev menu
- Press `R + R` to reload
- Use `Ctrl + -/+` to zoom in/out emulator window

#### Troubleshooting Android:
```bash
# Clear Android build cache
cd android
./gradlew clean
cd ..

# Clear Gradle cache
rm -rf ~/.gradle/caches/

# Rebuild
npm run android
```

#### Common Android Issues:

**ADB not found?**
```bash
# Add to ~/.zshrc or ~/.bashrc:
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Emulator won't start?**
- Open Android Studio → AVD Manager → Wipe Data
- Restart emulator

**Build fails with "SDK location not found"?**
```bash
# Create local.properties in android/ folder:
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
```

---

## 🔥 Firebase Configuration

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add Project"
3. Enter project name: `messageai-app` (or your choice)
4. Disable Google Analytics (optional for development)
5. Click "Create Project"

### Step 2: Register App

1. In Firebase Console, click "Add app" → Choose Web (</>) icon
2. Register app with nickname: "MessageAI Web"
3. Copy the Firebase configuration object

### Step 3: Enable Authentication

1. In Firebase Console: Build → Authentication
2. Click "Get Started"
3. Enable **Email/Password** provider
4. Click "Save"

### Step 4: Create Firestore Database

1. In Firebase Console: Build → Firestore Database
2. Click "Create Database"
3. Choose "Start in test mode" (for development)
4. Select location (choose closest to you)
5. Click "Enable"

### Step 5: Enable Realtime Database

1. In Firebase Console: Build → Realtime Database
2. Click "Create Database"
3. Choose "Start in test mode"
4. Click "Enable"

### Step 6: Configure App

1. **Create Firebase config file**:
   ```bash
   touch src/services/firebase.ts
   ```

2. **Add your Firebase configuration** (already exists in the app, update with your credentials):
   ```typescript
   // src/services/firebase.ts
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID",
     databaseURL: "YOUR_DATABASE_URL"  // Important for Realtime Database
   };
   ```

### Step 7: Deploy Security Rules

1. **Deploy Firestore rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Deploy Realtime Database rules**:
   ```bash
   ./deploy-database-rules.sh
   ```
   Or manually:
   ```bash
   firebase deploy --only database
   ```

### Security Rules Explained:

**Firestore Rules** (`firestore.rules`):
- Users can read/write their own data
- Chat access controlled by participant list
- Messages only editable by sender

**Realtime Database Rules** (`database.rules.json`):
- Notifications readable only by recipient
- Presence system for online status
- Auto-cleanup of old data

---

## 🏃 Running the App

Once setup is complete, start developing:

### Start Development Server
```bash
npm start
```

This opens Expo DevTools in your browser with options:
- Press `i` - Open on iOS simulator
- Press `a` - Open on Android emulator
- Press `w` - Open in web browser (limited functionality)
- Scan QR - Open in Expo Go on physical device

### Alternative Commands
```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web (limited)
npm run web

# Start with cache cleared
npx expo start --clear
```

### Development Workflow

1. **Start the server**: `npm start`
2. **Make code changes** in your editor
3. **See updates instantly** with Fast Refresh
4. **Test on multiple platforms** simultaneously

### Hot Reload & Fast Refresh

- **Fast Refresh**: Automatically enabled
  - Changes appear instantly
  - Preserves component state
  - Works for most code changes

- **Full Reload**: Sometimes needed
  - Shake device or `Cmd + D` (iOS) / `Cmd + M` (Android)
  - Select "Reload"
  - Or press `r` in terminal

---

## 🧪 Testing

The project includes comprehensive test coverage (70%+).

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Test Structure
```
__tests__/
├── components/          # Component unit tests
│   ├── ChatListItem.test.tsx
│   ├── MessageBubble.test.tsx
│   └── MessageInput.test.tsx
├── screens/            # Screen integration tests
│   └── LoginScreen.test.tsx
├── services/           # Service logic tests
│   ├── authService.test.ts
│   └── firebase.test.ts
├── stores/             # State management tests
│   ├── authStore.test.ts
│   ├── chatStore.test.ts
│   └── messageStore.test.ts
└── utils/              # Utility function tests
    └── dateHelpers.test.ts
```

### Manual Testing Guide

See detailed testing scenarios:
- `NOTIFICATION_TESTING_GUIDE.md` - Test notifications
- `PR5_TESTING_GUIDE.md` - Complete feature testing
- `QUICK_START.md` - Quick test scenarios

---

## 📁 Project Structure

```
gauntletai_week2_messageai/
│
├── src/                          # Source code
│   ├── components/               # Reusable UI components
│   │   ├── ChatListItem.tsx     # Chat list entry
│   │   ├── ConnectionStatus.tsx # Network indicator
│   │   ├── MessageBubble.tsx    # Message display
│   │   ├── MessageInput.tsx     # Text input with send
│   │   ├── NotificationBanner.tsx # In-app notification
│   │   ├── OnlineIndicator.tsx  # User presence dot
│   │   ├── SwipeableChatListItem.tsx # Swipe-to-delete
│   │   └── UserSelector.tsx     # User picker for groups
│   │
│   ├── screens/                 # Screen components
│   │   ├── LoginScreen.tsx     # Authentication
│   │   ├── SignupScreen.tsx    # User registration
│   │   ├── ChatsListScreen.tsx # Chat list (home)
│   │   ├── ChatScreen.tsx      # Conversation view
│   │   ├── NewChatScreen.tsx   # Start new chat
│   │   └── CreateGroupScreen.tsx # Create group chat
│   │
│   ├── services/                # Business logic & Firebase
│   │   ├── firebase.ts         # Firebase initialization
│   │   ├── authService.ts      # Authentication logic
│   │   ├── chatService.ts      # Chat & message operations
│   │   ├── presenceService.ts  # Online/offline tracking
│   │   ├── notificationService.ts # Local notifications
│   │   ├── realtimeNotificationService.ts # Real-time delivery
│   │   └── storageService.ts   # AsyncStorage wrapper
│   │
│   ├── stores/                  # Zustand state management
│   │   ├── authStore.ts        # Auth state
│   │   ├── chatStore.ts        # Chats & messages
│   │   ├── messageStore.ts     # Message operations
│   │   ├── networkStore.ts     # Connection status
│   │   └── notificationStore.ts # Notification queue
│   │
│   ├── navigation/              # Navigation configuration
│   │   └── AppNavigator.tsx    # Stack navigator setup
│   │
│   ├── types/                   # TypeScript definitions
│   │   └── index.ts            # Shared types & interfaces
│   │
│   ├── utils/                   # Helper functions
│   │   ├── dateHelpers.ts      # Date formatting
│   │   └── mockData.ts         # Test data
│   │
│   └── constants/               # App constants
│       └── Colors.ts           # Color palette
│
├── __tests__/                   # Test files (mirrors src/)
├── assets/                      # Static assets
│   ├── icon.png                # App icon
│   ├── splash-icon.png         # Splash screen
│   └── adaptive-icon.png       # Android adaptive icon
│
├── ios/                         # iOS native project
├── android/                     # Android native project (auto-generated)
│
├── memory-bank/                 # Project documentation
│   ├── projectBrief.md         # Project overview
│   ├── techContext.md          # Technical decisions
│   ├── progress.md             # Development log
│   └── activeContext.md        # Current status
│
├── App.tsx                      # Root component
├── index.js                     # Entry point
├── app.json                     # Expo configuration
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
├── jest.setup.js               # Test configuration
│
├── firestore.rules             # Firestore security rules
├── database.rules.json         # Realtime DB rules
├── deploy-database-rules.sh    # Deployment script
│
└── README.md                    # This file
```

### Key Files Explained

- **App.tsx**: Root component, sets up navigation and global state
- **firebase.ts**: Firebase initialization and configuration
- **AppNavigator.tsx**: Navigation structure and screen routing
- **authStore.ts**: Global authentication state (Zustand)
- **chatStore.ts**: Chat list and message state
- **notificationService.ts**: Handles all notification logic

---

## 📖 Documentation

Comprehensive documentation is available in the project:

### Getting Started
- `README.md` - This file
- `QUICK_START.md` - Fast setup guide
- `RESTART_INSTRUCTIONS.md` - How to reset the app

### Feature Documentation
- `LOCAL_NOTIFICATIONS_IMPLEMENTATION.md` - Notification system architecture
- `NOTIFICATION_TESTING_GUIDE.md` - Test notification features
- `NOTIFICATION_VISUAL_GUIDE.md` - Visual notification examples
- `PERFORMANCE_OPTIMIZATION.md` - Performance best practices
- `OFFLINE_MESSAGE_FIX.md` - Offline handling details

### Setup Guides
- `ENABLE_REALTIME_DATABASE.md` - Firebase Realtime DB setup
- `FIXING_PERMISSION_ERROR.md` - Permission issues
- `ANDROID_BACK_BUTTON_FIX.md` - Android back button handling

### Project Documentation
- `IMPLEMENTATION_COMPLETE.md` - Feature completion status
- `ARCHITECTURE.md` - System architecture (parent directory)
- `IMPLEMENTATION_PLAN.md` - Development roadmap (parent directory)

### Memory Bank
- `memory-bank/projectBrief.md` - Project overview
- `memory-bank/techContext.md` - Technology decisions
- `memory-bank/progress.md` - Development progress
- `memory-bank/activeContext.md` - Current status

### PR Summaries
- `PR1_SUMMARY.md` - Foundation setup
- `PR4_SUMMARY.md` through `PR10_SUMMARY.md` - Feature implementation

---

## 🐛 Troubleshooting

### Common Issues

#### 1. App Won't Start
```bash
# Clear all caches
rm -rf node_modules
npm install
npx expo start --clear
```

#### 2. Firebase Connection Errors
- ✅ Check Firebase config in `src/services/firebase.ts`
- ✅ Verify Firebase project is active
- ✅ Check internet connection
- ✅ Confirm Firebase services are enabled (Auth, Firestore, Realtime DB)

#### 3. Notifications Not Working
```bash
# Deploy database rules
./deploy-database-rules.sh

# Check logs
npx expo start
# Look for 🔔 emoji in console
```

See `NOTIFICATION_TESTING_GUIDE.md` for detailed troubleshooting.

#### 4. iOS Build Fails
```bash
# Reset iOS dependencies
cd ios
rm -rf Pods build
pod install --repo-update
cd ..
npm run ios
```

#### 5. Android Build Fails
```bash
# Clean Gradle
cd android
./gradlew clean
cd ..

# Clear Gradle cache
rm -rf ~/.gradle/caches/

# Rebuild
npm run android
```

#### 6. Metro Bundler Port Conflict
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or start on different port
npx expo start --port 8082
```

#### 7. "Unable to resolve module" Error
```bash
# Clear watchman
watchman watch-del-all

# Clear metro cache
npx expo start --clear

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

1. **Check existing documentation** in the project
2. **Review console logs** for specific errors
3. **Search issues** in the repository
4. **Check Expo documentation**: https://docs.expo.dev/
5. **Firebase documentation**: https://firebase.google.com/docs

### Debug Mode

Enable debug logging:
```bash
# iOS
npx expo start --ios --dev-client

# Android
npx expo start --android --dev-client
```

### Performance Issues

If the app is slow:
1. Run on physical device instead of simulator
2. Enable Hermes engine (already enabled)
3. Use production build for testing performance
4. Check network connection
5. Review `PERFORMANCE_OPTIMIZATION.md`

---

## 🎯 Next Steps

After setup, try these:

1. **Test the app**
   - Create two user accounts
   - Send messages between accounts
   - Test on multiple devices
   - Try offline scenarios

2. **Explore the codebase**
   - Read component files in `src/components/`
   - Review services in `src/services/`
   - Understand state management in `src/stores/`

3. **Run tests**
   ```bash
   npm run test:coverage
   ```

4. **Read documentation**
   - Start with `QUICK_START.md`
   - Review `ARCHITECTURE.md` in parent directory
   - Check `memory-bank/` for project context

5. **Customize**
   - Update colors in `src/constants/Colors.ts`
   - Modify UI components
   - Add new features

---

## 📝 Development Notes

### Current Status
- ✅ **Authentication**: Email/password login and signup
- ✅ **Messaging**: Real-time direct and group messaging
- ✅ **Notifications**: In-app banners and local notifications
- ✅ **Presence**: Online/offline status tracking
- ✅ **Offline Support**: Queue messages when offline
- ✅ **UI/UX**: WhatsApp-inspired interface
- ✅ **Testing**: 70%+ code coverage

### Future Enhancements (Post-MVP)
- 🔮 AI agent integration
- 🔮 RAG (Retrieval-Augmented Generation) capabilities
- 🔮 Voice/video calls
- 🔮 Media sharing (photos, videos, files)
- 🔮 Message editing and deletion
- 🔮 Typing indicators
- 🔮 Read receipts
- 🔮 Message search
- 🔮 Stories/Status updates

---

## 📄 License

This is a GauntletAI Week 2 project for educational purposes.

---

## 🙌 Acknowledgments

Built as part of GauntletAI Week 2 challenge.

**Tech Stack Credits:**
- React Native & Expo teams
- Firebase team
- Zustand state management
- React Navigation
- React Native Testing Library

---

## 📬 Contact

**Developer**: Michael Tornaritis  
**Project**: GauntletAI Week 2 - MessageAI MVP  
**Repository**: [Your Repo URL]

---

**Happy Coding! 🚀**

For questions or issues, check the documentation files or review the inline code comments.


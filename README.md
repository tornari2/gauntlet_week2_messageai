# 💬 MessageAI - Intelligent Multilingual Messaging Platform

A production-ready, AI-powered real-time messaging application built with React Native, Expo, and Firebase. Features intelligent translation, cultural context analysis, and seamless multilingual communication.

![React Native](https://img.shields.io/badge/React_Native-0.81.4-61DAFB?logo=react)
![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-12.4-FFCA28?logo=firebase)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991?logo=openai)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
  - [AI-Powered Translation Features](#-ai-powered-translation-features)
  - [Core Messaging Features](#-core-messaging-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [Firebase Configuration](#-firebase-configuration)
- [Running the App](#-running-the-app)
- [Known Limitations](#-known-limitations)
- [Project Structure](#-project-structure)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Documentation](#-documentation)

---

## 🎯 Overview

**MessageAI** is an intelligent WhatsApp-inspired mobile messaging application that breaks down language barriers. Built for iOS and Android, it combines real-time messaging with cutting-edge AI features to enable seamless multilingual communication.

### What Makes This Special?

- 🌍 **Automatic Language Detection**: AI-powered detection with country flag badges (🇫🇷 🇪🇸 🇺🇸)
- 🤖 **Auto-Translation**: Per-chat toggleable translation for convenience or learning  
- 🎭 **Cultural Context Analysis**: Understand idioms, slang, and cultural nuances
- 🗣️ **Tone Adjustment**: Rephrase messages as casual, neutral, or formal before sending
- 🤖 **AI Chat Assistant**: Ask AI to summarize conversations, extract dates, generate to-do lists, or analyze mood with RAG-powered semantic search
- ⚡ **Real-time Performance**: < 1 second message latency
- 📱 **Offline-First**: Queue messages and sync when connected
- 🔔 **Smart Notifications**: Grouped by chat to prevent spam
- 🌐 **Full Internationalization**: Static UI available in English, Spanish, and French

This is a **GauntletAI Week 2 project** demonstrating production-ready mobile development with AI integration.

---

## ✨ Features

### 🤖 AI-Powered Translation Features

#### 1. **Automatic Language Detection**
- **Real-time detection** using OpenAI's GPT-4o-mini
- **Visual flag badges** for instant language recognition (🇫🇷 French, 🇪🇸 Spanish, 🇺🇸 English, etc.)
- **50+ languages supported** with flag emojis
- **Unknown language handling** - gracefully handles gibberish or unrecognizable text

#### 2. **Tap-to-Translate**
- **Translation badge** on each message showing detected language
- **One-tap translation** to your preferred language
- **Show original** option always available
- **Translation caching** for instant re-display
- **Differentiates** auto-translated (🤖) vs manual (✓) messages

#### 3. **Auto-Translation Toggle**
- **Per-chat setting** - enable for convenience, disable for learning
- **Persistent settings** via AsyncStorage
- **In-message toggle button** - Located left of the message input field
- **Visual indicator** - Language icon (🌐) shows active/inactive state
- **Intelligent triggering** - only translates when language differs from your preference
- **Manual override** - always can view original text

#### 4. **Tone Adjustment**
- **Three tone levels**: Casual (friendly, may include slang), Neutral (polite, free of slang), Formal (precise, professional)
- **Context-aware rephrasing** - maintains meaning while adjusting tone
- **Pre-send editing** - Adjust tone before sending via sparkles icon (✨) in message input
- **Natural rephrasing** - rewrites sentences naturally, not as formal letters
- **Slang removal** - Neutral and Formal tones remove idioms and slang expressions
- **Firebase Cloud Function** powered by OpenAI
- **Fully internationalized** - Descriptions and results in user's preferred language
- **Use cases**: Professional emails, casual chats, diplomatic messages

#### 5. **Cultural Context Analysis**
- **Explain idioms and cultural references** like "break a leg" or "piece of cake"
- **Historical context** for culturally-specific phrases
- **Regional variations** explained (e.g., UK vs US English)
- **Modal interface** with detailed explanations
- **Powered by GPT-4o-mini** for accurate cultural insights

#### 6. **Slang Explanation**
- **Decode slang terms** like "it's giving", "no cap", "bussin"
- **Generation-specific slang** (Gen Z, Millennial, etc.)
- **Regional slang** (AAVE, UK slang, Aussie slang)
- **Context-aware** - explains in context of the conversation
- **Educational tool** for cross-generational communication
- **Long-press message** to access from context menu
- **Fully internationalized** - Results displayed in user's preferred language

#### 7. **AI Chat Assistant (RAG-Powered)**
- **Robot icon (🤖)** in chat header toggles AI assistant panel
- **Natural language queries** - Ask anything about the conversation
- **Four intelligent query types**:
  1. **"Summarize this conversation"** - General overview + breakdown by participant with bullet points
  2. **"Give me my to-do list"** - Extracts action items specific to the current user
  3. **"Extract important dates and times"** - Lists all temporal references (no date assumptions)
  4. **"Analyze the mood of the chat"** - Overall mood + per-participant emotional analysis
- **RAG (Retrieval-Augmented Generation)** with Pinecone vector database for semantic search
- **OpenAI function calling** - Intelligently queries conversation data using date filtering, participant filtering, and semantic search
- **Automatic message indexing** - Messages indexed to Pinecone with embeddings (text-embedding-3-small)
- **"Paste in Chat" feature** - Insert AI responses directly into message input
- **Clean, plain-text format** - No markdown formatting, clear bullet point separation
- **Strict date accuracy** - Only extracts explicitly stated or derivable dates
- **Fully internationalized** - All UI and AI responses in user's preferred language (EN/ES/FR)

### 💬 Core Messaging Features

#### Real-time Communication
- **Direct messages** - One-on-one conversations
- **Group chats** - Multi-participant messaging with participant management
- **Instant delivery** - Real-time sync using Firebase Firestore
- **Typing indicators** - See when others are typing
- **Read receipts** - WhatsApp-style checkmarks (✓, ✓✓, blue for read)

#### User Experience
- **Optimistic UI** - Messages appear instantly (0ms perceived delay)
- **Message status** - Pending (◷), Sent (✓), Delivered (✓✓), Read (blue ✓✓)
- **Retry mechanism** - Tap failed messages to retry
- **Image sharing** - Send photos with compression (400x400, 60% quality)
- **Swipe actions** - Long-press to delete chats

#### Presence & Status
- **Online/Offline indicators** - Real-time presence using Firebase RTDB
- **Last seen timestamps** - "Active 5m ago" format
- **Connection status** - Visual banner when offline
- **Automatic sync** - Resume when connection restored

#### Notifications
- **In-app banners** - Animated slide-in notifications (foreground)
- **System notifications** - Native alerts (background)
- **Notification grouping** - Multiple messages show as "3 new messages"
- **Smart suppression** - No alerts when viewing active chat
- **Deep linking** - Tap notification to open specific chat

#### Offline Support
- **Message queue** - Send messages offline, auto-sync when connected
- **AsyncStorage caching** - Last 100 messages per chat cached
- **Instant display** - Cached messages load immediately
- **Network awareness** - Visual indicators and smart queue management

---

## 🏗️ Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         REACT NATIVE APP                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Screens    │  │  Components  │  │ Navigation   │          │
│  │              │  │              │  │              │          │
│  │ • ChatScreen │  │ • Message    │  │ • Auth Stack │          │
│  │ • ChatsList  │  │   Bubble     │  │ • Main Stack │          │
│  │ • Login      │  │ • Translation│  │ • Deep Links │          │
│  │ • NewChat    │  │   Badge      │  │              │          │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘          │
│         │                 │                                       │
│  ┌──────▼─────────────────▼──────────────────┐                  │
│  │         ZUSTAND STATE STORES               │                  │
│  │  • authStore    • chatStore                │                  │
│  │  • messageStore • translationStore         │                  │
│  │  • networkStore • notificationStore        │                  │
│  └──────┬────────────────────────────────────┘                  │
│         │                                                         │
│  ┌──────▼─────────────────────────────────────┐                 │
│  │            SERVICE LAYER                    │                 │
│  │  • authService    • chatService             │                 │
│  │  • translationService • languageService     │                 │
│  │  • presenceService    • typingService       │                 │
│  │  • notificationService • storageService     │                 │
│  └──────┬────────────────────────────────────┘                  │
│         │                                                         │
└─────────┼─────────────────────────────────────────────────────┘
          │
    ┌─────▼──────────────────────────────────────────┐
    │              FIREBASE BACKEND                   │
    ├─────────────────────────────────────────────────┤
    │                                                  │
    │  ┌──────────────┐  ┌──────────────┐           │
    │  │  Firestore   │  │  Realtime    │           │
    │  │   Database   │  │   Database   │           │
    │  │              │  │              │           │
    │  │ • Messages   │  │ • Presence   │           │
    │  │ • Chats      │  │ • Typing     │           │
    │  │ • Users      │  │ • Notifs     │           │
    │  └──────────────┘  └──────────────┘           │
    │                                                  │
    │  ┌──────────────┐  ┌──────────────┐           │
    │  │    Auth      │  │   Storage    │           │
    │  │              │  │              │           │
    │  │ • Email/Pass │  │ • Images     │           │
    │  │ • Tokens     │  │ • Avatars    │           │
    │  └──────────────┘  └──────────────┘           │
    │                                                  │
    │  ┌──────────────────────────────┐              │
    │  │    CLOUD FUNCTIONS           │              │
    │  │                              │              │
    │  │ • detectLanguage            │              │
    │  │ • translateText             │              │
    │  │ • adjustFormality           │              │
    │  │ • explainCulturalContext    │              │
    │  │ • explainSlang              │              │
    │  │ • intelligentChatAssistant  │              │
    │  │ • indexMessageToPinecone    │              │
    │  └──────────────────────────────┘              │
    │                                                  │
    └──────────────────┬───────────────────────────┘
                       │
                 ┌─────▼─────┐
                 │  OPENAI   │
                 │  GPT-4o   │
                 │   mini    │
                 └─────┬─────┘
                       │
                 ┌─────▼─────────┐
                 │   PINECONE    │
                 │ Vector Store  │
                 │  (RAG Index)  │
                 └───────────────┘
```

### Data Flow: Message Sending with Translation

```
User types message → Optimistic UI (instant display)
                  ↓
            Send to Firestore
                  ↓
      Cloud Function: detectLanguage
                  ↓
           Update message with detectedLanguage
                  ↓
      Real-time listener updates all clients
                  ↓
   TranslationBadge appears with flag emoji
                  ↓
User taps badge → translateText Cloud Function
                  ↓
            Translation cached
                  ↓
         Display translated text
```

### Translation Store Architecture

```
┌──────────────────────────────────────────┐
│       TRANSLATION STORE (Zustand)        │
├──────────────────────────────────────────┤
│                                           │
│  State:                                   │
│  • userLanguage: string                   │
│  • translationCache: Record<id, text>     │
│  • autoTranslateEnabled: Record<chat, bool>│
│  • translating: boolean                   │
│                                           │
│  Actions:                                 │
│  • setUserLanguage(lang)                  │
│  • translateMessage(id, text, from, to)   │
│  • setAutoTranslate(chatId, enabled)      │
│  • loadAutoTranslateSetting(chatId)       │
│  • isAutoTranslateEnabled(chatId)         │
│                                           │
│  Persistence:                             │
│  • AsyncStorage for auto-translate        │
│  • In-memory cache for translations       │
│                                           │
└──────────────────────────────────────────┘
```

---

## 🔧 Tech Stack

### Frontend
- **Framework**: React Native 0.81.4
- **Build Tool**: Expo SDK 54
- **Language**: TypeScript 5.9 (strict mode)
- **Navigation**: React Navigation 6 (Native Stack)
- **State Management**: Zustand 5.0
- **UI Components**: Custom components with React Native primitives

### Backend & AI Services
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore (messages, chats, users)
- **Real-time**: Firebase Realtime Database (presence, typing, notifications)
- **Storage**: Firebase Storage (images, avatars)
- **Cloud Functions**: Firebase Cloud Functions (Node.js 20)
- **AI Provider**: OpenAI GPT-4o-mini
- **Vector Database**: Pinecone (RAG message indexing with text-embedding-3-small)
- **Internationalization**: i18n-js (English, Spanish, French)
- **Local Storage**: AsyncStorage (message cache, settings)

### Development Tools
- **Testing**: Jest 30 + React Native Testing Library
- **Type Checking**: TypeScript with strict mode
- **Code Quality**: ESLint + Prettier
- **Version Control**: Git
- **CI/CD**: GitHub Actions (optional)

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
  "@react-native-community/netinfo": "^11.4.1",
  "expo-image-picker": "~16.0.3",
  "openai": "^4.77.3",
  "@pinecone-database/pinecone": "^4.0.0",
  "i18n-js": "^4.4.3"
}
```

### UI Design

**MessageAI** features a clean, modern interface with thoughtful attention to UX details:

- **Brand Identity**: 
  - App name: **GlossAI** (displayed on login screen)
  - Primary color: Dark brown (#B8956B)
  - Accent color: Lighter green (#C8E6C9) for backgrounds
  
- **Chat Interface**:
  - WhatsApp-inspired message bubbles with sender colors
  - Country flag badges for automatic language detection
  - Translation badges with one-tap toggle
  - Typing indicators with real-time presence
  - Read receipts with WhatsApp-style checkmarks
  
- **Input Bar**:
  - Auto-translate toggle (🌐) positioned left of message input
  - Tone adjustment sparkles icon (✨) when text is present
  - Image picker and send button
  
- **AI Assistant**:
  - Robot icon (🤖) in chat header for AI assistant toggle
  - Clean example query bubbles
  - Plain-text AI responses with clear bullet point formatting
  - "Paste in Chat" action for inserting AI responses
  
- **Accessibility**:
  - High contrast ratios for readability
  - Touch targets sized appropriately (min 44x44pt)
  - Clear visual feedback for all interactions

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

8. **Expo Go App** (on physical device - **RECOMMENDED**)
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

### Firebase & AI Accounts

9. **Firebase Project**
   - Create account at: https://console.firebase.google.com/
   - You'll configure this in setup step

10. **OpenAI Account** (for AI features)
    - Create account at: https://platform.openai.com/
    - Get API key from: https://platform.openai.com/api-keys

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

3. **Install Firebase Functions dependencies**
   ```bash
   cd functions
   npm install
   cd ..
   ```

4. **Verify installation**
   ```bash
   npm list --depth=0
   ```

---

## 🔐 ironment Setup

### 1. Create ironment Files

Create a `.env` file in the **root directory** (not in `functions/`):

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com

# App Configuration
EXPO_PUBLIC_APP_ENV=development
```

### 2. Firebase Functions Environment

Create `functions/.env`:

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
PINCONE_API_KEY=your-pinecone-api-key-here
```

### 3. Set Firebase Functions Config (Alternative)

If you prefer Firebase config over `.env`:

```bash
cd functions
firebase functions:config:set openai.key="sk-your-openai-api-key-here"
firebase functions:config:set pinecone.key="your-pinecone-api-key-here"
cd ..
```

### 4. Security Notes

⚠️ **IMPORTANT**:
- **Never commit `.env` files** to git (already in `.gitignore`)
- **Rotate API keys** if accidentally exposed
- **Use Firebase security rules** in production
- **Limit OpenAI API spending** in OpenAI dashboard

---

## 🔥 Firebase Configuration

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name (e.g., `messageai-prod`)
4. Disable Google Analytics (optional for this project)
5. Click **"Create project"**

### Step 2: Register Web App

1. In Firebase project overview, click **Web icon** (`</>`)
2. Register app with nickname (e.g., `MessageAI Web`)
3. **Copy the config values** to your `.env` file
4. Click **"Continue to console"**

### Step 3: Enable Authentication

1. In Firebase console, go to **Authentication** → **Get started**
2. Click **Sign-in method** tab
3. Enable **Email/Password**
4. Click **Save**

### Step 4: Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Select **Start in test mode** (we'll add rules later)
3. Choose **Cloud Firestore location** (e.g., `us-central1`)
4. Click **Enable**

### Step 5: Create Realtime Database

1. Go to **Realtime Database** → **Create database**
2. Select **Start in test mode**
3. Choose same **location** as Firestore
4. Click **Enable**

### Step 6: Enable Firebase Storage

1. Go to **Storage** → **Get started**
2. Start in **test mode**
3. Choose same **location**
4. Click **Done**

### Step 7: Deploy Security Rules

Deploy Firestore, Realtime Database, and Storage rules:

```bash
# Deploy all rules
firebase deploy --only firestore:rules,database:rules,storage:rules

# Or deploy individually
firebase deploy --only firestore:rules
firebase deploy --only database:rules
firebase deploy --only storage:rules
```

Alternatively, use the helper scripts:

```bash
# macOS/Linux
chmod +x deploy-database-rules.sh
./deploy-database-rules.sh

chmod +x deploy-storage-rules.sh
./deploy-storage-rules.sh
```

### Step 8: Deploy Firebase Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions
cd ..
```

This deploys all AI-powered functions:
- `detectLanguage` - Automatic language detection
- `translateText` - Message translation
- `adjustFormality` - Formality adjustment
- `explainCulturalContext` - Cultural context analysis
- `explainSlang` - Slang explanation
- `summarizeThread` - Conversation summarization

### Step 9: Verify Setup

Check that all services are enabled:

```bash
firebase projects:list
firebase functions:list
firebase database:get /
firebase firestore:indexes
```

---

## 🚀 Running the App

### Quick Start (Recommended)

**Best for**: Quick testing on physical devices

```bash
# Start Metro bundler
npm start

# Or with specific options
npx expo start --clear  # Clear cache
npx expo start --tunnel # Use tunnel for remote access
```

Scan the QR code with:
- **iOS**: Camera app → Tap notification → Opens in Expo Go
- **Android**: Expo Go app → Scan QR Code button

### iOS Simulator (macOS only)

```bash
# Install iOS dependencies (first time only)
cd ios
pod install
cd ..

# Run on iOS simulator
npm run ios

# Or select specific simulator
npx expo run:ios --device
```

**Tips**:
- Press `i` in terminal to switch simulators
- Use `Cmd + D` in simulator for dev menu
- Use `Cmd + R` to reload

### Android Emulator

```bash
# Make sure Android emulator is running
# (Open from Android Studio → Device Manager)

# Run on Android emulator
npm run android

# Or select specific emulator
npx expo run:android --device
```

**Tips**:
- Press `a` in terminal to select emulator
- Use `Cmd + M` (Mac) or `Ctrl + M` (Windows) for dev menu
- Use `R + R` to reload

### Physical Device (Production Testing)

For full offline testing, use a physical device:

```bash
# Start with device on same WiFi
npm start

# Or use tunnel for cellular testing
npx expo start --tunnel
```

Scan QR code with Expo Go app.

### Development Commands

```bash
# Start with cache clear
npm start -- --clear

# Start in production mode
npm start -- --no-dev --minify

# Type check
npx tsc --noEmit

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Lint code
npm run lint

# Format code
npm run format
```

---

## ⚠️ Known Limitations

### Authentication Persistence

**Issue**: Auth state does not persist between app restarts in development.

**Impact**:
- Users must log in again after closing the app
- This is expected behavior in Expo Go / development builds
- Does NOT affect testing of messaging features

**Workaround**:
- Use test accounts for quick re-login
- Production builds with proper native builds will persist auth

**Technical Details**:
- Expo Go uses different storage mechanisms than production builds
- Firebase Auth persistence requires native modules not available in Expo Go
- See: https://firebase.google.com/docs/auth/web/auth-state-persistence

### iOS Simulator Offline Testing

**Issue**: iOS Simulator WiFi cannot be reliably toggled on/off.

**Impact**:
- Offline features (message queue, cache, sync) **cannot be reliably tested** on iOS Simulator
- Network Link Conditioner affects entire Mac, not just simulator
- Airplane mode simulation doesn't work properly

**Recommendation**: **Use physical iPhone** for offline feature testing

**Why**:
- iOS Simulator shares network with host Mac
- No separate network interface to toggle
- Network Link Conditioner is system-wide and unreliable

**Workaround for Simulator**:
- Temporarily disable WiFi on entire Mac (not recommended)
- Use Network Link Conditioner with care
- Test on physical device for production validation

### Android Emulator Offline Testing

**Issue**: Similar network challenges, though easier to toggle.

**Impact**:
- Offline features work better than iOS Simulator but still not perfect
- Emulator network can be toggled in extended controls

**Recommendation**: Use Android emulator or physical Android device for offline testing

**How to Toggle**:
1. Open emulator
2. Click `...` (More) button
3. Settings → Network → Toggle Mobile Data / WiFi

### Offline Feature Testing Matrix

| Platform | Offline Testing | Recommendation |
|----------|----------------|----------------|
| **Physical iPhone** | ✅ Excellent | **BEST** - Toggle airplane mode |
| **iOS Simulator** | ❌ Poor | Avoid for offline testing |
| **Physical Android** | ✅ Excellent | **BEST** - Toggle airplane mode |
| **Android Emulator** | ⚠️ Fair | Usable, but physical device better |

### OpenAI API Costs

**Note**: AI features (translation, cultural context, etc.) incur OpenAI API costs.

**Typical Costs** (as of Oct 2025):
- GPT-4o-mini: $0.150 / 1M input tokens, $0.600 / 1M output tokens
- Average translation: ~100 tokens (~$0.00015 per translation)
- Average cultural context: ~500 tokens (~$0.0007 per request)

**Recommendations**:
- Set **spending limits** in OpenAI dashboard
- Monitor **usage** in OpenAI dashboard
- Implement **rate limiting** for production
- Cache translations to reduce API calls

### Group Chat Limitations

**Current State**:
- Group chats support **unlimited participants**
- No participant removal UI (can add via Firebase console)
- No admin/moderator roles
- No group avatars (uses 👥 emoji)

**Future Enhancements**:
- Participant management UI
- Role-based permissions
- Group settings customization

### Image Size Limits

**Current Implementation**:
- Images compressed to **400x400 pixels**
- Quality set to **60%**
- Typical size: **50-150 KB per image**

**Why**:
- Fast uploads on cellular networks
- Reduced Firebase Storage costs
- Adequate quality for messaging

**Limitations**:
- No original quality option
- No video support
- No document sharing

### Translation & Internationalization

**Static UI Translation Support**:
- Full translation of static UI components is currently available in **English, Spanish, and French only**
- All app interface elements (buttons, labels, menus, AI assistant text) are translated to these three languages
- User's preferred language setting controls which translation is displayed

**Dynamic Content Translation**:
- Message translation via OpenAI supports **50+ languages** (any language pair)
- AI features (slang explanation, cultural context, tone adjustment) work with all supported languages
- Language detection works for all 50+ languages

**Why the Limitation?**:
- Creating and maintaining high-quality UI translations requires native speaker review
- Each new language adds ~500-1000 translation keys
- Future expansion to more languages is planned based on user demand

---

## 📁 Project Structure

```
gauntletai_week2_messageai/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── MessageBubble.tsx           # Individual message display
│   │   ├── TranslationBadge.tsx        # Language detection badge
│   │   ├── FormalitySelector.tsx       # Formality adjustment UI
│   │   ├── CulturalContextModal.tsx    # Cultural context display
│   │   ├── SlangExplanationModal.tsx   # Slang explanation display
│   │   ├── MultilingualSummaryModal.tsx # Thread summary display
│   │   ├── ChatListItem.tsx            # Chat list item
│   │   ├── MessageInput.tsx            # Message composition
│   │   ├── OnlineIndicator.tsx         # Presence indicator
│   │   ├── NotificationBanner.tsx      # In-app notifications
│   │   ├── ConnectionStatus.tsx        # Network status banner
│   │   ├── TypingIndicator.tsx         # "User is typing..."
│   │   └── UserSelector.tsx            # User selection for groups
│   │
│   ├── screens/              # Screen components
│   │   ├── ChatScreen.tsx              # Main conversation view
│   │   ├── ChatsListScreen.tsx         # Chat list with grouped notifications
│   │   ├── LoginScreen.tsx             # Authentication
│   │   ├── SignupScreen.tsx            # User registration
│   │   ├── NewChatScreen.tsx           # Start new chat
│   │   ├── CreateGroupScreen.tsx       # Create group chat
│   │   └── UserProfileScreen.tsx       # User settings & language preference
│   │
│   ├── services/             # Business logic & API integration
│   │   ├── firebase.ts                 # Firebase initialization
│   │   ├── authService.ts              # Authentication operations
│   │   ├── chatService.ts              # Chat/message CRUD
│   │   ├── translationService.ts       # Translation API calls
│   │   ├── languageService.ts          # Language utilities & flags
│   │   ├── presenceService.ts          # Online/offline tracking
│   │   ├── typingService.ts            # Typing indicators
│   │   ├── notificationService.ts      # Local notifications
│   │   ├── realtimeNotificationService.ts # Real-time notification delivery
│   │   ├── imageService.ts             # Image upload/compression
│   │   └── storageService.ts           # AsyncStorage caching
│   │
│   ├── stores/               # Zustand state management
│   │   ├── authStore.ts                # Auth state & user info
│   │   ├── chatStore.ts                # Chat list & metadata
│   │   ├── messageStore.ts             # Messages & optimistic updates
│   │   ├── translationStore.ts         # Translation state & cache
│   │   ├── networkStore.ts             # Network connectivity state
│   │   └── notificationStore.ts        # Notification queue & grouping
│   │
│   ├── types/                # TypeScript definitions
│   │   ├── index.ts                    # Core types (Message, Chat, User)
│   │   └── translation.ts              # Translation-specific types
│   │
│   ├── utils/                # Helper functions
│   │   ├── dateHelpers.ts              # Date formatting utilities
│   │   ├── userColors.ts               # Avatar color generation
│   │   └── readReceiptHelpers.ts       # Read receipt logic
│   │
│   ├── navigation/           # Navigation configuration
│   │   └── AppNavigator.tsx            # Stack navigation setup
│   │
│   └── constants/            # App constants
│       └── Colors.ts                    # Color palette
│
├── functions/                # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts                    # AI-powered functions
│   │       ├── detectLanguage          # Language detection
│   │       ├── translateText           # Translation
│   │       ├── adjustFormality         # Formality adjustment
│   │       ├── explainCulturalContext  # Cultural context
│   │       ├── explainSlang            # Slang explanation
│   │       └── summarizeThread         # Thread summarization
│   ├── package.json
│   └── tsconfig.json
│
├── __tests__/                # Test files
│   ├── components/
│   ├── screens/
│   ├── services/
│   └── stores/
│
├── assets/                   # Static assets
│   ├── icon.png
│   ├── splash-icon.png
│   └── adaptive-icon.png
│
├── memory-bank/              # Project documentation
│   ├── projectBrief.md
│   ├── progress.md
│   ├── techContext.md
│   └── activeContext.md
│
├── App.tsx                   # App entry point
├── app.json                  # Expo configuration
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── firebase.json             # Firebase config
├── firestore.rules           # Firestore security rules
├── database.rules.json       # Realtime Database rules
├── storage.rules             # Storage security rules
└── README.md                 # This file
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage report
npm test -- --coverage

# Run specific test file
npm test ChatScreen.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="translation"
```

### Test Coverage

Current test coverage:
- **Services**: 15% (basic tests configured)
- **Stores**: 10% (basic tests configured)
- **Components**: 5% (snapshot tests)
- **Screens**: 5% (smoke tests)

Target: **80%+ coverage** for production

## 🔧 Troubleshooting

### Common Issues

#### 1. "Metro bundler not starting"
```bash
# Clear cache and restart
npm start -- --clear

# Or reset completely
rm -rf node_modules
npm install
npm start
```

#### 2. "Firebase app not initialized"
- Check `.env` file exists in root directory
- Verify all `EXPO_PUBLIC_FIREBASE_*` variables are set
- Restart Metro bundler after changing `.env`
- Check Firebase console for correct config values

#### 3. "OpenAI API errors"
```bash
# Check Functions logs
firebase functions:log

# Verify OPENAI_API_KEY is set
firebase functions:config:get

# Redeploy functions
cd functions
npm install
firebase deploy --only functions
```

#### 4. "Translation not working"
- Verify OpenAI API key is valid
- Check Firebase Functions are deployed
- Check Functions logs for errors:
  ```bash
  firebase functions:log --only detectLanguage
  firebase functions:log --only translateText
  ```
- Verify you have OpenAI credits

#### 5. "Images not uploading"
- Verify Firebase Storage is enabled
- Check storage rules are deployed:
  ```bash
  firebase deploy --only storage:rules
  ```
- Check image size (< 10MB)
- Verify permissions in `Info.plist` (iOS) or `AndroidManifest.xml` (Android)

#### 6. "Offline features not working"
- **iOS Simulator**: Known limitation, use physical device
- **Android Emulator**: Toggle network in emulator settings
- **Physical Device**: Toggle airplane mode
- Check network store logs in Metro console

#### 7. "Auth not persisting"
- **Expected** in Expo Go / development
- Will work in production builds
- Use test accounts for quick re-login

#### 8. "Type errors after npm install"
```bash
# Rebuild TypeScript cache
npx tsc --noEmit

# Check for version conflicts
npm list typescript
npm list @types/react
```

#### 9. "Pod install fails" (iOS)
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

#### 10. "Firebase Functions timing out"
- Check function execution time in Firebase Console
- GPT-4o-mini should respond in 2-5 seconds
- Consider increasing timeout in `functions/src/index.ts`:
  ```typescript
  export const translateText = functions
    .runWith({ timeoutSeconds: 60 })  // Increase from 30
    .https.onCall(...)
  ```

### Getting Help

- **Firebase Issues**: https://firebase.google.com/support
- **Expo Issues**: https://forums.expo.dev/
- **React Native**: https://reactnative.dev/help
- **OpenAI API**: https://help.openai.com/

### Debug Mode

Enable detailed logging:

```typescript
// In src/services/translationService.ts
const DEBUG = true;  // Enable debug logs

// In src/stores/messageStore.ts
console.log('[DEBUG] Messages:', messages);  // Already enabled
```

---

## 📚 Documentation

### Project Documentation

- **ARCHITECTURE.md** - Detailed system architecture with diagrams
- **IMPLEMENTATION_PLAN.md** - Original implementation plan with PR breakdown
- **LANGUAGE_PREFERENCE_UI.md** - Translation UI design document
- **QUICK_START.md** - Quick start guide for developers

### Memory Bank (Development Context)

Located in `memory-bank/`:
- **projectBrief.md** - Project overview and goals
- **progress.md** - Development progress and completed features
- **techContext.md** - Technical decisions and patterns
- **activeContext.md** - Current development status
- **systemPatterns.md** - Code patterns and best practices

### API Documentation

#### Translation Service

```typescript
// Detect language
const language = await translationService.detectLanguage(messageId, text);

// Translate text
const translated = await translationService.translateMessage(
  messageId,
  text,
  fromLang,
  toLang
);

// Adjust formality
const formal = await translationService.adjustFormality(
  text,
  'formal'  // 'casual' | 'neutral' | 'formal'
);

// Explain cultural context
const context = await translationService.explainCulturalContext(
  messageId,
  text,
  language
);

// Explain slang
const explanation = await translationService.explainSlang(
  messageId,
  text,
  language
);

// Summarize thread
const summary = await translationService.summarizeThread(
  messages,
  targetLanguage
);
```

#### Language Service

```typescript
// Get language name
const name = getLanguageName('fr');  // 'French'

// Get flag emoji
const flag = getLanguageFlag('fr');  // '🇫🇷'

// Get supported languages
const languages = getSupportedLanguages();
```

### Firebase Cloud Functions

All functions are callable from the client via Firebase Functions:

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Example: Translate text
const translateText = httpsCallable(functions, 'translateText');
const result = await translateText({
  text: 'Bonjour',
  fromLanguage: 'fr',
  toLanguage: 'en'
});

console.log(result.data.translatedText);  // 'Hello'
```

---

## 🤝 Contributing

This is a GauntletAI Week 2 project. For contributions:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is part of the GauntletAI program. See LICENSE file for details.

---

## 🙏 Acknowledgments

- **GauntletAI** for the project framework
- **Firebase** for the backend infrastructure
- **OpenAI** for AI capabilities
- **Expo** for the development platform
- **React Native Community** for libraries and tools

---

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Check the [Troubleshooting](#-troubleshooting) section
- Review [Documentation](#-documentation)

---

**Built with ❤️ using React Native, Firebase, and OpenAI**

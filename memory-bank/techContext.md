# Tech Context: WhatsApp Clone MVP

## Technology Stack

### Frontend Framework
**React Native with Expo (Managed Workflow)**
- Version: Latest stable (Expo SDK ~50.0.0)
- Why: Cross-platform (iOS + Android) from single codebase
- Why Expo: Faster development, built-in tooling, easy deployment
- Deployment: Expo Go for testing, EAS Build for production

### State Management
**Zustand**
- Version: ^4.4.7
- Why over Redux: Minimal boilerplate, no provider wrapping, easier to learn
- Why over Context: Better performance, built-in async support
- Pattern: Store per domain (auth, chat, message)

### Navigation
**React Navigation**
- Version: ^6.1.9
- Packages: `@react-navigation/native`, `@react-navigation/native-stack`
- Why over Expo Router: More mature, better for complex navigation patterns
- Pattern: Stack navigation with conditional auth routing

### Backend & Services
**Firebase (Google Cloud)**
- **Authentication**: Email/Password (Firebase Auth)
- **Database**: Cloud Firestore (NoSQL, real-time)
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Hosting**: Firebase Hosting (optional for web version)
- Why: Serverless, real-time built-in, generous free tier

### Local Storage
**AsyncStorage**
- Package: `@react-native-async-storage/async-storage`
- Version: 1.21.0
- Purpose: Cache messages, persist user preferences
- Limit: Last 100 messages per chat

### Push Notifications
**Expo Notifications**
- Package: `expo-notifications`
- Version: ~0.27.6
- Integration: Expo Push API + Firebase Cloud Messaging
- Note: Requires dev build for full functionality (doesn't work in Expo Go)

### Language
**TypeScript**
- Strict mode enabled
- All files use `.ts` or `.tsx` extensions
- No `any` types in production code
- Full type coverage for props, state, services

## Project Structure

```
WK2_MessageAI/
├── App.tsx                          # Entry point
├── app.json                         # Expo configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── .env.example                     # Environment variables template
├── .env                             # Local environment (not committed)
├── firestore.rules                  # Firestore security rules
├── ARCHITECTURE.md                  # System architecture documentation
├── IMPLEMENTATION_PLAN.md           # PR breakdown and tasks
├── README.md                        # Project documentation
│
├── memory-bank/                     # Project context (this directory)
│   ├── projectBrief.md
│   ├── productContext.md
│   ├── systemPatterns.md
│   ├── techContext.md              # This file
│   ├── activeContext.md
│   └── progress.md
│
└── src/
    ├── screens/                     # Screen components
    │   ├── LoginScreen.tsx
    │   ├── SignupScreen.tsx
    │   ├── ChatsListScreen.tsx
    │   ├── ChatScreen.tsx
    │   ├── CreateGroupScreen.tsx
    │   └── ProfileScreen.tsx
    │
    ├── components/                  # Reusable components
    │   ├── MessageBubble.tsx
    │   ├── MessageInput.tsx
    │   ├── ChatListItem.tsx
    │   ├── OnlineIndicator.tsx
    │   ├── ReadReceipt.tsx
    │   └── UserSelector.tsx
    │
    ├── navigation/                  # Navigation setup
    │   └── AppNavigator.tsx
    │
    ├── stores/                      # Zustand stores
    │   ├── authStore.ts
    │   ├── chatStore.ts
    │   └── messageStore.ts
    │
    ├── services/                    # Business logic & API
    │   ├── firebase.ts              # Firebase initialization
    │   ├── authService.ts           # Authentication operations
    │   ├── chatService.ts           # Chat/message operations
    │   ├── notificationService.ts   # Push notifications
    │   └── storageService.ts        # Local caching
    │
    ├── types/                       # TypeScript definitions
    │   └── index.ts                 # All type definitions
    │
    └── utils/                       # Helper functions
        ├── dateHelpers.ts           # Date formatting
        └── mockData.ts              # Test data generation
```

## Dependencies

### Core Dependencies
```json
{
  "expo": "~50.0.0",
  "react": "18.2.0",
  "react-native": "0.73.0",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/native-stack": "^6.9.17",
  "react-native-screens": "~3.29.0",
  "react-native-safe-area-context": "4.8.2",
  "zustand": "^4.4.7",
  "firebase": "^10.7.1",
  "expo-notifications": "~0.27.6",
  "@react-native-async-storage/async-storage": "1.21.0",
  "expo-device": "~5.9.3"
}
```

### Dev Dependencies
```json
{
  "@types/react": "~18.2.45",
  "@types/react-native": "~0.73.0",
  "typescript": "^5.3.0",
  "@testing-library/react-native": "^12.4.0",
  "@testing-library/jest-native": "^5.4.3",
  "jest": "^29.7.0",
  "jest-expo": "~50.0.0"
}
```

## Environment Configuration

### Environment Variables (.env)
```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# App Configuration
EXPO_PUBLIC_APP_ENV=development
```

### app.json Configuration
```json
{
  "expo": {
    "name": "WK2_MessageAI",
    "slug": "wk2-messageai",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#25D366"
    },
    "ios": {
      "bundleIdentifier": "com.yourname.wk2messageai",
      "supportsTablet": true
    },
    "android": {
      "package": "com.yourname.wk2messageai",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#25D366"
      },
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#25D366"
        }
      ]
    ]
  }
}
```

## Firebase Configuration

### Collections Structure
```
firestore/
├── users/{userId}
│   ├── email: string
│   ├── displayName: string
│   ├── photoURL?: string
│   ├── isOnline: boolean
│   ├── lastSeen: timestamp
│   └── pushToken?: string
│
├── chats/{chatId}
│   ├── type: 'direct' | 'group'
│   ├── participants: string[]
│   ├── lastMessage: string
│   ├── lastMessageTime: timestamp
│   ├── createdAt: timestamp
│   ├── groupName?: string
│   └── groupPhoto?: string
│
├── messages/{chatId}/messages/{messageId}
│   ├── text: string
│   ├── senderId: string
│   ├── timestamp: timestamp
│   └── readBy: string[]
│
└── userChats/{userId}/chats/{chatId}
    ├── chatId: string
    ├── unreadCount: number
    └── lastViewed: timestamp
```

### Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Chats collection
    match /chats/{chatId} {
      allow read, write: if request.auth != null &&
        request.auth.uid in resource.data.participants;
    }
    
    // Messages subcollection
    match /messages/{chatId}/messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.senderId;
    }
    
    // User chats subcollection
    match /userChats/{userId}/chats/{chatId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### Firestore Indexes
Required composite indexes:
```
Collection: messages/{chatId}/messages
Fields: senderId (Ascending), readBy (Array)

Collection: messages/{chatId}/messages
Fields: timestamp (Descending)
```

## Development Tools

### Package Manager
**npm** (default) or **yarn**

### Code Editor
**VS Code** or **Cursor** (recommended)
- Extensions: ESLint, Prettier, TypeScript

### Testing
**Jest + React Native Testing Library**
- Unit tests: Service layer, stores, utils
- Component tests: All components and screens
- Integration tests: User flows
- E2E tests: Critical paths

### Linting & Formatting
**ESLint + Prettier**
```json
{
  "extends": ["expo", "prettier"],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error"
  }
}
```

### Version Control
**Git + GitHub**
- Branch naming: `feature/pr-X-description` or `agent-N/feature`
- PR-based workflow
- Conventional commits

### Debugging
- **React Native Debugger**
- **Flipper**
- **Expo DevTools**
- **Firebase Emulator Suite** (optional for local testing)

## Build & Deployment

### Development
```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Clear cache
npx expo start --clear
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Production Build (EAS)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for Android (APK)
eas build --platform android --profile preview

# Build for iOS (TestFlight)
eas build --platform ios --profile preview

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Expo Go Deployment
```bash
# Publish to Expo
npx expo publish

# Share via QR code
npx expo start
# Scan QR code with Expo Go app
```

## Performance Considerations

### Bundle Size
- Optimize imports: `import { specific } from 'library'`
- Use React.lazy for code splitting (if needed)
- Remove console.logs in production

### Memory Management
- Unsubscribe from listeners on unmount
- Clear intervals/timeouts
- Limit cached messages (100 per chat)

### Network Optimization
- Batch writes where possible
- Use Firestore offline persistence
- Implement retry logic with exponential backoff

### Render Optimization
- Use React.memo for components
- Use Zustand selectors to avoid re-renders
- Optimize FlatList with getItemLayout
- Use removeClippedSubviews for long lists

## Known Technical Limitations

1. **Expo Go Limitations**
   - Push notifications don't work (need dev build)
   - Some native modules unavailable
   - Limited background task support

2. **Firebase Free Tier Limits**
   - 50K document reads/day
   - 20K document writes/day
   - 1 GB storage
   - 10 GB network egress/month

3. **AsyncStorage Limitations**
   - 6 MB limit on iOS (can be increased)
   - Synchronous operations can block
   - Not encrypted by default

4. **React Native Limitations**
   - Larger app size than native
   - Some performance overhead
   - Platform-specific bugs

## Future Technical Considerations

### Scaling Beyond MVP
- Consider React Native Hermes for performance
- Implement message pagination (load older messages)
- Add Firebase Cloud Functions for server-side logic
- Consider CDN for media files
- Implement proper logging/monitoring (Sentry)

### AI Integration (Post-MVP)
- Add OpenAI SDK or Anthropic SDK
- Vector database for RAG (Pinecone, Weaviate)
- Streaming responses for AI messages
- Background processing for AI features

### Advanced Features
- WebRTC for voice/video calls
- E2EE using Signal Protocol
- Message indexing for search (Algolia/ElasticSearch)
- Media compression and optimization
- Background sync for offline messages


# System Patterns: WhatsApp Clone MVP

## Architecture Pattern

### Three-Tier Client Architecture

```
┌─────────────────────────────────────────────┐
│   Presentation Layer (UI)                   │
│   Screens & Components - Pure UI           │
│   Minimal logic, delegates to stores        │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│   State Layer (Application State)           │
│   Zustand Stores - Global state            │
│   Coordinates data flow                     │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│   Service Layer (Business Logic)            │
│   Services - Firebase operations           │
│   API calls, data transformation            │
└─────────────────────────────────────────────┘
```

**Key Principle:** Unidirectional data flow
```
User Action → Store Action → Service → Firebase → 
Real-time Listener → Store Update → Component Re-render
```

## Core Design Patterns

### 1. Optimistic Update Pattern

**Purpose:** Provide instant feedback to users

**Implementation:**
```typescript
// Step 1: Add temporary message immediately
const tempId = `temp_${Date.now()}`;
messageStore.addOptimisticMessage(chatId, {
  id: tempId,
  text: messageText,
  pending: true
});

// Step 2: Send to server
try {
  const realId = await chatService.sendMessage(chatId, messageText);
  // Step 3: Replace temp with real
  messageStore.updateMessageStatus(tempId, { id: realId, pending: false });
} catch (error) {
  // Step 4: Mark as failed
  messageStore.updateMessageStatus(tempId, { failed: true });
}
```

**Used for:** Message sending, status updates

### 2. Real-Time Subscription Pattern

**Purpose:** Keep UI in sync with server state

**Implementation:**
```typescript
// In store or component
useEffect(() => {
  // Create subscription
  const unsubscribe = chatService.subscribeToMessages(chatId, (messages) => {
    messageStore.setMessages(chatId, messages);
  });
  
  // Cleanup on unmount
  return () => unsubscribe();
}, [chatId]);
```

**Used for:** Messages, chats, online status

### 3. Cache-First Pattern

**Purpose:** Instant load, background sync

**Implementation:**
```typescript
// Step 1: Load from cache immediately
const cached = await storageService.getCachedMessages(chatId);
messageStore.setMessages(chatId, cached);

// Step 2: Subscribe to real-time updates
chatService.subscribeToMessages(chatId, (serverMessages) => {
  messageStore.setMessages(chatId, serverMessages);
  // Step 3: Update cache
  storageService.cacheMessages(chatId, serverMessages);
});
```

**Used for:** Message history, chat list

### 4. Presence Pattern

**Purpose:** Track online/offline status reliably

**Implementation:**
```typescript
// On connection
const userRef = doc(firestore, 'users', userId);

// Set online immediately
updateDoc(userRef, { isOnline: true });

// Set up disconnect handler
onDisconnect(userRef).update({
  isOnline: false,
  lastSeen: serverTimestamp()
});

// Listen to app state
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    updateDoc(userRef, { isOnline: true });
  } else {
    updateDoc(userRef, { isOnline: false, lastSeen: serverTimestamp() });
  }
});
```

**Used for:** User online status

### 5. Batch Write Pattern

**Purpose:** Reduce Firestore writes, improve performance

**Implementation:**
```typescript
const batch = writeBatch(firestore);

unreadMessages.forEach(msg => {
  const msgRef = doc(firestore, 'messages', chatId, 'messages', msg.id);
  batch.update(msgRef, {
    readBy: arrayUnion(userId)
  });
});

await batch.commit();
```

**Used for:** Read receipts, bulk operations

## Component Communication Patterns

### Pattern 1: Screen → Store → Service → Firebase
**Use case:** User actions that modify server state

```typescript
// User types message in ChatScreen
ChatScreen 
  → messageStore.addOptimisticMessage()
  → chatService.sendMessage()
  → Firebase.addDoc()
```

### Pattern 2: Firebase → Listener → Store → Components
**Use case:** Real-time updates from server

```typescript
Firebase.onSnapshot()
  → chatService.subscribeToMessages()
  → messageStore.setMessages()
  → ChatScreen re-renders
```

### Pattern 3: Store → Multiple Components
**Use case:** Sharing state across components

```typescript
authStore.user
  ├─> ChatListScreen (for userId)
  ├─> ChatScreen (for senderId)
  ├─> ProfileScreen (for user info)
  └─> MessageBubble (to determine sent vs received)
```

### Pattern 4: Service → Cache → Store
**Use case:** Offline-first architecture

```typescript
messageStore.subscribeToMessages()
  ├─> AsyncStorage.getItem() (load cached)
  │     └─> messageStore.setMessages() (instant display)
  └─> Firebase.onSnapshot() (real-time sync)
        └─> messageStore.setMessages() (update with server data)
        └─> AsyncStorage.setItem() (update cache)
```

## State Management Patterns

### Zustand Store Structure

```typescript
interface StoreState {
  // State
  data: DataType[];
  loading: boolean;
  error: Error | null;
  
  // Actions
  setData: (data: DataType[]) => void;
  fetchData: () => Promise<void>;
  clearData: () => void;
}

const useStore = create<StoreState>((set, get) => ({
  // Initial state
  data: [],
  loading: false,
  error: null,
  
  // Actions
  setData: (data) => set({ data }),
  
  fetchData: async () => {
    set({ loading: true });
    try {
      const data = await service.getData();
      set({ data, loading: false });
    } catch (error) {
      set({ error, loading: false });
    }
  },
  
  clearData: () => set({ data: [], error: null })
}));
```

### Store Composition

Stores can access other stores:
```typescript
// messageStore accessing authStore
import { useAuthStore } from './authStore';

const useMessageStore = create((set, get) => ({
  sendMessage: async (chatId, text) => {
    const userId = useAuthStore.getState().user?.uid;
    if (!userId) throw new Error('Not authenticated');
    
    await chatService.sendMessage(chatId, text, userId);
  }
}));
```

## Error Handling Patterns

### Service Layer Errors

```typescript
export class ChatError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ChatError';
  }
}

export const sendMessage = async (chatId: string, text: string) => {
  try {
    // Firebase operation
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw new ChatError('Not authorized to send messages', 'PERMISSION_DENIED');
    }
    throw new ChatError('Failed to send message', 'SEND_FAILED');
  }
};
```

### UI Error Display

```typescript
// In component
const [error, setError] = useState<string | null>(null);

const handleSend = async () => {
  try {
    await messageStore.sendMessage(chatId, text);
  } catch (error) {
    if (error instanceof ChatError) {
      setError(error.message); // User-friendly message
    } else {
      setError('Something went wrong');
    }
  }
};
```

## Performance Optimization Patterns

### 1. Component Memoization

```typescript
export const MessageBubble = React.memo(({ message, isSent }) => {
  // Component code
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.message.id === nextProps.message.id &&
         prevProps.message.readBy.length === nextProps.message.readBy.length;
});
```

### 2. Zustand Selectors

```typescript
// Only re-render when specific data changes
const messages = useMessageStore(state => state.messages[chatId]);
const currentUser = useAuthStore(state => state.user);
```

### 3. FlatList Optimization

```typescript
<FlatList
  data={messages}
  keyExtractor={(item) => item.id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

## Security Patterns

### Firestore Security Rules Pattern

```javascript
// Verify user is participant before allowing access
match /chats/{chatId} {
  allow read, write: if request.auth != null &&
    request.auth.uid in resource.data.participants;
}

// Only message sender can update
match /messages/{chatId}/messages/{messageId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth.uid == resource.data.senderId;
}
```

### Client-Side Validation Pattern

```typescript
// Always validate before sending to server
const validateMessage = (text: string): boolean => {
  if (!text || text.trim().length === 0) return false;
  if (text.length > 10000) return false;
  return true;
};
```

## Testing Patterns

### Service Layer Testing

```typescript
// Mock Firebase
jest.mock('./firebase', () => ({
  firestore: mockFirestore
}));

describe('chatService', () => {
  it('should send message', async () => {
    const messageId = await chatService.sendMessage('chat1', 'Hello', 'user1');
    expect(messageId).toBeDefined();
    expect(mockFirestore.addDoc).toHaveBeenCalled();
  });
});
```

### Component Testing

```typescript
describe('MessageBubble', () => {
  it('should display message text', () => {
    const { getByText } = render(
      <MessageBubble message={{ text: 'Hello' }} isSent={true} />
    );
    expect(getByText('Hello')).toBeTruthy();
  });
});
```

## Naming Conventions

### Files
- **Components:** PascalCase (`MessageBubble.tsx`)
- **Screens:** PascalCase + Screen (`ChatScreen.tsx`)
- **Services:** camelCase (`chatService.ts`)
- **Stores:** camelCase + Store (`authStore.ts`)
- **Utils:** camelCase (`dateHelpers.ts`)

### Code
- **Components:** PascalCase (`MessageBubble`)
- **Functions:** camelCase (`sendMessage`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_MESSAGE_LENGTH`)
- **Types/Interfaces:** PascalCase (`Message`, `Chat`)
- **Hooks:** camelCase starting with 'use' (`useMessages`)

### Test IDs
- Format: `componentName-element`
- Examples: `message-bubble`, `send-button`, `chat-list-item`

## Key Architectural Decisions

1. **Zustand over Redux** - Minimal boilerplate, easier learning curve
2. **React Navigation over Expo Router** - More mature, better for complex navigation
3. **Firebase over custom backend** - Serverless, real-time built-in, faster MVP
4. **Optimistic updates** - Better perceived performance
5. **AsyncStorage + Firestore persistence** - Dual-layer caching for reliability
6. **Named exports** - More flexible, better for tree-shaking
7. **Functional components only** - Modern React patterns
8. **TypeScript strict mode** - Catch errors early


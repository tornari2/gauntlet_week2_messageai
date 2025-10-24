# Implementation Breakdown: PR Sequence & Tasks

---

## **PR #1: Project Foundation & Firebase Setup**
**Branch:** `feature/project-setup`  
**Goal:** Initialize Expo project with Firebase integration and basic configuration  
**Dependencies:** None  
**Estimated Time:** 3-4 hours

### Tasks:
1. **Task 1.1:** Initialize Expo project
   - Run `npx create-expo-app@latest WK2_MessageAI --template blank`
   - Verify app runs on Expo Go
   - Initialize git repository

2. **Task 1.2:** Install core dependencies
   ```bash
   npx expo install @react-navigation/native @react-navigation/native-stack
   npx expo install react-native-screens react-native-safe-area-context
   npm install zustand firebase
   npx expo install @react-native-async-storage/async-storage
   ```

3. **Task 1.3:** Set up project structure
   - Create `/src` directory
   - Create subdirectories: `/screens`, `/components`, `/services`, `/stores`, `/navigation`, `/types`, `/utils`
   - Create `.gitignore` entries for Firebase config files

4. **Task 1.4:** Create Firebase project
   - Set up Firebase project in console
   - Enable Authentication (Email/Password)
   - Create Firestore database (test mode initially)
   - Download config files (but don't commit)

5. **Task 1.5:** Create Firebase service
   - Create `/src/services/firebase.ts`
   - Initialize Firebase app
   - Export `auth`, `firestore` instances
   - Create `.env` for Firebase config (with `.env.example` template)

6. **Task 1.6:** Set up TypeScript types
   - Create `/src/types/index.ts`
   - Define User, Chat, Message interfaces

7. **Task 1.7:** Configure app.json
   - Add app name, bundle identifier
   - Configure splash screen
   - Add permissions placeholders

### Unit Tests:
```typescript
// __tests__/services/firebase.test.ts
describe('Firebase Configuration', () => {
  it('should initialize Firebase app', () => {
    expect(firebaseApp).toBeDefined();
  });
  
  it('should export auth instance', () => {
    expect(auth).toBeDefined();
  });
  
  it('should export firestore instance', () => {
    expect(firestore).toBeDefined();
  });
});
```

### PR Checklist:
- [ ] App runs successfully with `npx expo start`
- [ ] Firebase configuration loads without errors
- [ ] All directories created with placeholder files
- [ ] TypeScript types defined
- [ ] `.env.example` documented
- [ ] Tests pass
- [ ] README.md updated with setup instructions

---

## **PR #2: Authentication System**
**Branch:** `feature/authentication`  
**Goal:** Implement user authentication with Firebase Auth  
**Dependencies:** PR #1  
**Estimated Time:** 4-5 hours

### Tasks:
1. **Task 2.1:** Create auth store (Zustand)
   - Create `/src/stores/authStore.ts`
   - Define state: `user`, `loading`, `error`
   - Define actions: `login`, `signup`, `logout`, `initialize`

2. **Task 2.2:** Create auth service
   - Create `/src/services/authService.ts`
   - Implement `signUp(email, password, displayName)`
   - Implement `signIn(email, password)`
   - Implement `signOut()`
   - Create Firestore user document on signup

3. **Task 2.3:** Set up auth state listener
   - Add `onAuthStateChanged` listener in authStore
   - Update store when auth state changes
   - Handle loading states

4. **Task 2.4:** Create LoginScreen
   - Create `/src/screens/LoginScreen.tsx`
   - Email and password inputs
   - Login button with loading state
   - Link to signup screen
   - Display error messages

5. **Task 2.5:** Create SignupScreen
   - Create `/src/screens/SignupScreen.tsx`
   - Email, password, display name inputs
   - Signup button with loading state
   - Link to login screen
   - Input validation

6. **Task 2.6:** Create basic navigation
   - Create `/src/navigation/AppNavigator.tsx`
   - Auth stack (Login, Signup)
   - Conditional rendering based on auth state
   - Integrate in App.tsx

### Unit Tests:
```typescript
// __tests__/stores/authStore.test.ts
describe('Auth Store', () => {
  it('should initialize with null user', () => {
    const { user } = useAuthStore.getState();
    expect(user).toBeNull();
  });
  
  it('should update user on login', async () => {
    const mockUser = { uid: '123', email: 'test@test.com' };
    await useAuthStore.getState().login('test@test.com', 'password');
    // Verify store updated
  });
});

// __tests__/services/authService.test.ts
describe('Auth Service', () => {
  it('should create user document on signup', async () => {
    const result = await authService.signUp('test@test.com', 'password', 'Test User');
    expect(result).toHaveProperty('uid');
    // Verify Firestore document created
  });
  
  it('should handle invalid credentials', async () => {
    await expect(
      authService.signIn('wrong@test.com', 'wrong')
    ).rejects.toThrow();
  });
});

// __tests__/screens/LoginScreen.test.tsx
describe('LoginScreen', () => {
  it('should render email and password inputs', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });
  
  it('should call login on button press', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Login'));
    // Verify login called
  });
});
```

### PR Checklist:
- [ ] Users can sign up with email/password
- [ ] Users can log in
- [ ] Users can log out
- [ ] Auth state persists on app reload
- [ ] Loading states display correctly
- [ ] Error messages show for invalid inputs
- [ ] Firestore user document created on signup
- [ ] Tests pass (>80% coverage)

---

## **PR #3: Chat List & Navigation**
**Branch:** `feature/chat-list`  
**Goal:** Display user's chat list with navigation to individual chats  
**Dependencies:** PR #2  
**Estimated Time:** 4-5 hours

### Tasks:
1. **Task 3.1:** Create chat store
   - Create `/src/stores/chatStore.ts`
   - Define state: `chats`, `currentChat`, `loading`
   - Define actions: `setChats`, `setCurrentChat`, `subscribeToChats`

2. **Task 3.2:** Create chat service (basic)
   - Create `/src/services/chatService.ts`
   - Implement `subscribeToUserChats(userId, callback)`
   - Implement `getChatParticipants(chatId)`
   - Implement `createOrGetDirectChat(userId1, userId2)`

3. **Task 3.3:** Create ChatListItem component
   - Create `/src/components/ChatListItem.tsx`
   - Display participant name
   - Display last message preview
   - Display timestamp
   - Display online indicator (placeholder)
   - Navigate to chat on tap

4. **Task 3.4:** Create ChatsListScreen
   - Create `/src/screens/ChatsListScreen.tsx`
   - FlatList of ChatListItem components
   - Subscribe to user's chats on mount
   - Show loading state
   - Show empty state
   - Add logout button in header

5. **Task 3.5:** Create placeholder ChatScreen
   - Create `/src/screens/ChatScreen.tsx`
   - Display chat participant name in header
   - Placeholder for messages
   - Placeholder for message input

6. **Task 3.6:** Update navigation
   - Add Main stack to AppNavigator
   - Add ChatsListScreen and ChatScreen
   - Configure screen options

7. **Task 3.7:** Create mock data helper (for testing)
   - Create `/src/utils/mockData.ts`
   - Helper to create sample users and chats
   - Use for testing UI without full backend

### Unit Tests:
```typescript
// __tests__/stores/chatStore.test.ts
describe('Chat Store', () => {
  it('should store chats array', () => {
    const mockChats = [{ id: '1', participants: ['user1', 'user2'] }];
    useChatStore.getState().setChats(mockChats);
    expect(useChatStore.getState().chats).toEqual(mockChats);
  });
  
  it('should set current chat', () => {
    const chat = { id: '1', participants: [] };
    useChatStore.getState().setCurrentChat(chat);
    expect(useChatStore.getState().currentChat).toEqual(chat);
  });
});

// __tests__/services/chatService.test.ts
describe('Chat Service', () => {
  it('should create direct chat if not exists', async () => {
    const chatId = await chatService.createOrGetDirectChat('user1', 'user2');
    expect(chatId).toBeDefined();
  });
  
  it('should return existing chat if already created', async () => {
    const chatId1 = await chatService.createOrGetDirectChat('user1', 'user2');
    const chatId2 = await chatService.createOrGetDirectChat('user1', 'user2');
    expect(chatId1).toEqual(chatId2);
  });
});

// __tests__/components/ChatListItem.test.tsx
describe('ChatListItem', () => {
  it('should display participant name', () => {
    const chat = { 
      id: '1', 
      participants: ['user1', 'user2'],
      lastMessage: 'Hello',
      participantName: 'John Doe'
    };
    const { getByText } = render(<ChatListItem chat={chat} />);
    expect(getByText('John Doe')).toBeTruthy();
  });
  
  it('should navigate to chat on press', () => {
    const navigation = { navigate: jest.fn() };
    const { getByTestId } = render(<ChatListItem chat={mockChat} navigation={navigation} />);
    fireEvent.press(getByTestId('chat-list-item'));
    expect(navigation.navigate).toHaveBeenCalledWith('Chat', { chatId: mockChat.id });
  });
});
```

### PR Checklist:
- [ ] Chat list displays user's chats
- [ ] Tapping chat navigates to ChatScreen
- [ ] Real-time updates when new chat created
- [ ] Empty state shows when no chats
- [ ] Loading state displays correctly
- [ ] Logout button works
- [ ] Tests pass (>80% coverage)

---

## **PR #4: Real-Time Messaging (Core)**
**Branch:** `feature/real-time-messaging`  
**Goal:** Send and receive messages in real-time  
**Dependencies:** PR #3  
**Estimated Time:** 6-7 hours

### Tasks:
1. **Task 4.1:** Create message store
   - Create `/src/stores/messageStore.ts`
   - State: `messages` (Record<chatId, Message[]>)
   - Actions: `setMessages`, `addMessage`, `subscribeToMessages`

2. **Task 4.2:** Extend chat service with messaging
   - Add `sendMessage(chatId, text, senderId)`
   - Add `subscribeToMessages(chatId, callback)`
   - Update chat's lastMessage and lastMessageTime on send
   - Create userChats subcollection entries

3. **Task 4.3:** Create MessageBubble component
   - Create `/src/components/MessageBubble.tsx`
   - Display message text
   - Display timestamp
   - Different styles for sent vs received
   - Props: message, isSent

4. **Task 4.4:** Create MessageInput component
   - Create `/src/components/MessageInput.tsx`
   - TextInput with send button
   - Handle send action
   - Clear input after send
   - Keyboard handling

5. **Task 4.5:** Implement ChatScreen fully
   - Update `/src/screens/ChatScreen.tsx`
   - FlatList of MessageBubble components (inverted)
   - Subscribe to messages on mount
   - Integrate MessageInput
   - Auto-scroll to bottom on new messages
   - Loading states

6. **Task 4.6:** Set up Firestore security rules
   - Create `firestore.rules` file
   - Rules for users, chats, messages collections
   - Deploy rules to Firebase

7. **Task 4.7:** Create date helper utilities
   - Create `/src/utils/dateHelpers.ts`
   - `formatMessageTime(timestamp)` function
   - Handle "Just now", "5m ago", "Yesterday", etc.

### Unit Tests:
```typescript
// __tests__/stores/messageStore.test.ts
describe('Message Store', () => {
  it('should add message to chat', () => {
    const message = { id: '1', text: 'Hello', senderId: 'user1' };
    useMessageStore.getState().addMessage('chat1', message);
    expect(useMessageStore.getState().messages['chat1']).toContainEqual(message);
  });
  
  it('should maintain chronological order', () => {
    const msg1 = { id: '1', timestamp: new Date('2025-01-01T10:00:00') };
    const msg2 = { id: '2', timestamp: new Date('2025-01-01T10:01:00') };
    useMessageStore.getState().addMessage('chat1', msg1);
    useMessageStore.getState().addMessage('chat1', msg2);
    const messages = useMessageStore.getState().messages['chat1'];
    expect(messages[0].timestamp < messages[1].timestamp).toBe(true);
  });
});

// __tests__/services/chatService.test.ts (messaging)
describe('Chat Service - Messaging', () => {
  it('should send message to chat', async () => {
    const messageId = await chatService.sendMessage('chat1', 'Hello', 'user1');
    expect(messageId).toBeDefined();
  });
  
  it('should update chat lastMessage on send', async () => {
    await chatService.sendMessage('chat1', 'Test message', 'user1');
    const chat = await chatService.getChat('chat1');
    expect(chat.lastMessage).toBe('Test message');
  });
});

// __tests__/components/MessageBubble.test.tsx
describe('MessageBubble', () => {
  it('should display message text', () => {
    const message = { id: '1', text: 'Hello world', senderId: 'user1' };
    const { getByText } = render(<MessageBubble message={message} isSent={true} />);
    expect(getByText('Hello world')).toBeTruthy();
  });
  
  it('should apply sent style when isSent=true', () => {
    const { getByTestId } = render(<MessageBubble message={mockMessage} isSent={true} />);
    const bubble = getByTestId('message-bubble');
    expect(bubble.props.style).toContain(styles.sentBubble);
  });
});

// __tests__/utils/dateHelpers.test.ts
describe('Date Helpers', () => {
  it('should format recent message as "Just now"', () => {
    const now = new Date();
    expect(formatMessageTime(now)).toBe('Just now');
  });
  
  it('should format minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatMessageTime(fiveMinutesAgo)).toBe('5m ago');
  });
  
  it('should format yesterday', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(formatMessageTime(yesterday)).toContain('Yesterday');
  });
});
```

### Integration Tests:
```typescript
// __tests__/integration/messaging.test.ts
describe('Messaging Integration', () => {
  it('should send and receive message end-to-end', async () => {
    // Create two users
    // User 1 sends message
    // Verify User 2 receives it
  });
});
```

### PR Checklist:
- [ ] Users can send messages
- [ ] Messages appear in real-time (< 1 second)
- [ ] Messages display in chronological order
- [ ] Sent/received messages styled differently
- [ ] Timestamps formatted correctly
- [ ] Keyboard dismisses on send
- [ ] Chat list updates with last message
- [ ] Security rules deployed
- [ ] Tests pass (>80% coverage)

---

## **PR #5: Optimistic UI Updates**
**Branch:** `feature/optimistic-updates`  
**Goal:** Messages appear instantly before server confirmation  
**Dependencies:** PR #4  
**Estimated Time:** 3-4 hours

### Tasks:
1. **Task 5.1:** Extend message store for optimistic updates
   - Add `addOptimisticMessage(chatId, message)` action
   - Add `updateMessageStatus(chatId, messageId, updates)` action
   - Handle temporary IDs

2. **Task 5.2:** Update message type
   - Add optional `pending: boolean` field
   - Add optional `failed: boolean` field
   - Add optional `tempId: string` field

3. **Task 5.3:** Implement optimistic send flow
   - Update MessageInput component
   - Create temp message with `tempId`
   - Add to store immediately
   - Send to Firebase
   - Replace temp message with real one on success
   - Mark as failed on error

4. **Task 5.4:** Add pending indicator to MessageBubble
   - Show spinner/clock icon for pending messages
   - Show error icon for failed messages
   - Add retry action for failed messages

5. **Task 5.5:** Handle message deduplication
   - Filter out optimistic messages when real ones arrive
   - Match by tempId → real id mapping

### Unit Tests:
```typescript
// __tests__/stores/messageStore.test.ts (optimistic)
describe('Message Store - Optimistic Updates', () => {
  it('should add optimistic message immediately', () => {
    const tempMessage = { id: 'temp_123', text: 'Hello', pending: true };
    useMessageStore.getState().addOptimisticMessage('chat1', tempMessage);
    expect(useMessageStore.getState().messages['chat1']).toContainEqual(tempMessage);
  });
  
  it('should replace temp message with confirmed one', () => {
    const tempMessage = { id: 'temp_123', text: 'Hello', pending: true };
    useMessageStore.getState().addOptimisticMessage('chat1', tempMessage);
    
    useMessageStore.getState().updateMessageStatus('chat1', 'temp_123', { 
      id: 'real_123', 
      pending: false 
    });
    
    const messages = useMessageStore.getState().messages['chat1'];
    expect(messages.find(m => m.id === 'real_123')).toBeDefined();
    expect(messages.find(m => m.id === 'temp_123')).toBeUndefined();
  });
  
  it('should mark message as failed on error', () => {
    const tempMessage = { id: 'temp_123', text: 'Hello', pending: true };
    useMessageStore.getState().addOptimisticMessage('chat1', tempMessage);
    
    useMessageStore.getState().updateMessageStatus('chat1', 'temp_123', { 
      failed: true, 
      pending: false 
    });
    
    const message = useMessageStore.getState().messages['chat1'].find(m => m.id === 'temp_123');
    expect(message.failed).toBe(true);
  });
});

// __tests__/components/MessageBubble.test.tsx (optimistic)
describe('MessageBubble - Optimistic UI', () => {
  it('should show pending indicator for pending messages', () => {
    const message = { id: 'temp_1', text: 'Hello', pending: true };
    const { getByTestId } = render(<MessageBubble message={message} isSent={true} />);
    expect(getByTestId('pending-indicator')).toBeTruthy();
  });
  
  it('should show error icon for failed messages', () => {
    const message = { id: 'temp_1', text: 'Hello', failed: true };
    const { getByTestId } = render(<MessageBubble message={message} isSent={true} />);
    expect(getByTestId('error-icon')).toBeTruthy();
  });
});
```

### PR Checklist:
- [ ] Messages appear instantly on send
- [ ] Pending indicator visible during send
- [ ] Confirmed messages replace optimistic ones
- [ ] Failed messages show error state
- [ ] No duplicate messages after confirmation
- [ ] Retry works for failed messages
- [ ] Tests pass (>80% coverage)

---

## **PR #6: Online/Offline Status**
**Branch:** `feature/online-status`  
**Goal:** Show real-time online/offline status for users  
**Dependencies:** PR #3  
**Estimated Time:** 3-4 hours

### Tasks:
1. **Task 6.1:** Update auth service for presence
   - Add `updateOnlineStatus(isOnline)` function
   - Set up `onDisconnect()` handler
   - Update user document on auth state change
   - Update on app foreground/background

2. **Task 6.2:** Set up AppState listener
   - Add AppState listener in App.tsx
   - Update online status on state changes
   - Handle active, background, inactive states

3. **Task 6.3:** Create OnlineIndicator component
   - Create `/src/components/OnlineIndicator.tsx`
   - Green dot for online
   - Gray dot for offline
   - "Last seen X ago" for offline users

4. **Task 6.4:** Add online status to ChatListItem
   - Show OnlineIndicator next to participant name
   - Subscribe to participant's online status

5. **Task 6.5:** Add online status to ChatScreen header
   - Show OnlineIndicator in header
   - Show "Online" or "Last seen..." text

6. **Task 6.6:** Handle cleanup on logout
   - Set offline status on logout
   - Clean up listeners

### Unit Tests:
```typescript
// __tests__/services/authService.test.ts (presence)
describe('Auth Service - Presence', () => {
  it('should update online status', async () => {
    await authService.updateOnlineStatus(true);
    const user = await authService.getCurrentUser();
    expect(user.isOnline).toBe(true);
  });
  
  it('should set lastSeen when going offline', async () => {
    await authService.updateOnlineStatus(false);
    const user = await authService.getCurrentUser();
    expect(user.lastSeen).toBeDefined();
  });
});

// __tests__/components/OnlineIndicator.test.tsx
describe('OnlineIndicator', () => {
  it('should show green dot for online users', () => {
    const { getByTestId } = render(<OnlineIndicator isOnline={true} />);
    const dot = getByTestId('online-dot');
    expect(dot.props.style).toContain(styles.onlineDot);
  });
  
  it('should show last seen for offline users', () => {
    const lastSeen = new Date(Date.now() - 5 * 60 * 1000);
    const { getByText } = render(<OnlineIndicator isOnline={false} lastSeen={lastSeen} />);
    expect(getByText(/Last seen/)).toBeTruthy();
  });
});
```

### Integration Tests:
```typescript
// __tests__/integration/presence.test.ts
describe('Presence Integration', () => {
  it('should update status when app goes to background', async () => {
    // Simulate app going to background
    // Verify user marked as offline in Firestore
  });
});
```

### PR Checklist:
- [ ] Online users show green indicator
- [ ] Offline users show gray indicator
- [ ] Last seen updates correctly
- [ ] Status updates when app backgrounds
- [ ] Status persists in Firestore
- [ ] onDisconnect handler works
- [ ] Tests pass (>80% coverage)

---

## **PR #7: Read Receipts**
**Branch:** `feature/read-receipts`  
**Goal:** Show when messages have been read  
**Dependencies:** PR #4  
**Estimated Time:** 4-5 hours

### Tasks:
1. **Task 7.1:** Create read receipt service
   - Add `markMessagesAsRead(chatId, userId)` to chatService
   - Batch update readBy array for unread messages
   - Handle efficiently (don't re-mark already read)

2. **Task 7.2:** Update MessageBubble for receipts
   - Create ReadReceipt component (or add to MessageBubble)
   - Show ✓ (sent), ✓✓ (delivered), ✓✓ (read/blue)
   - Logic based on `readBy` array

3. **Task 7.3:** Implement auto-read in ChatScreen
   - Call `markMessagesAsRead()` when screen focused
   - Call when new messages arrive (if screen active)
   - Use `useFocusEffect` hook

4. **Task 7.4:** Add read status to chat list
   - Show unread count badge
   - Bold unread chats
   - Clear on chat open

5. **Task 7.5:** Handle group chat read receipts
   - Show read count ("Read by 3")
   - Or list of names who read
   - Different UI than one-on-one

### Unit Tests:
```typescript
// __tests__/services/chatService.test.ts (read receipts)
describe('Chat Service - Read Receipts', () => {
  it('should mark messages as read', async () => {
    const chatId = 'chat1';
    await chatService.markMessagesAsRead(chatId, 'user2');
    
    const messages = await chatService.getMessages(chatId);
    messages.forEach(msg => {
      if (msg.senderId !== 'user2') {
        expect(msg.readBy).toContain('user2');
      }
    });
  });
  
  it('should not re-mark already read messages', async () => {
    const chatId = 'chat1';
    await chatService.markMessagesAsRead(chatId, 'user2');
    
    const beforeCount = await getWriteCount();
    await chatService.markMessagesAsRead(chatId, 'user2');
    const afterCount = await getWriteCount();
    
    expect(afterCount).toBe(beforeCount); // No additional writes
  });
});

// __tests__/components/MessageBubble.test.tsx (read receipts)
describe('MessageBubble - Read Receipts', () => {
  it('should show single check for sent message', () => {
    const message = { id: '1', text: 'Hello', readBy: [] };
    const { getByTestId } = render(<MessageBubble message={message} isSent={true} />);
    expect(getByTestId('single-check')).toBeTruthy();
  });
  
  it('should show double check for delivered message', () => {
    const message = { id: '1', text: 'Hello', readBy: ['user2'], delivered: true };
    const { getByTestId } = render(<MessageBubble message={message} isSent={true} />);
    expect(getByTestId('double-check')).toBeTruthy();
  });
  
  it('should show blue checks for read message', () => {
    const message = { id: '1', text: 'Hello', readBy: ['user2'], senderId: 'user1' };
    const participants = ['user1', 'user2'];
    const { getByTestId } = render(
      <MessageBubble message={message} isSent={true} participants={participants} />
    );
    expect(getByTestId('read-check')).toBeTruthy();
  });
});
```

### PR Checklist:
- [ ] Messages marked as read when chat opened
- [ ] Read receipts show correct status (✓/✓✓/read)
- [ ] Unread count displays in chat list
- [ ] Group chat shows read count
- [ ] No unnecessary Firestore writes
- [ ] Tests pass (>80% coverage)

---

## **PR #8: Message Persistence**
**Branch:** `feature/message-persistence`  
**Goal:** Messages persist across app restarts  
**Dependencies:** PR #4  
**Estimated Time:** 3-4 hours

### Tasks:
1. **Task 8.1:** Enable Firestore offline persistence
   - Add `enableIndexedDbPersistence(firestore)` in firebase.ts
   - Handle errors/warnings
   - Test offline behavior

2. **Task 8.2:** Add AsyncStorage caching layer
   - Create `/src/services/storageService.ts`
   - Functions: `cacheMessages()`, `getCachedMessages()`
   - Store last 100 messages per chat

3. **Task 8.3:** Update message store for persistence
   - Load from AsyncStorage on app start
   - Save to AsyncStorage when messages update
   - Merge with Firestore data

4. **Task 8.4:** Handle offline message queue
   - Queue messages sent while offline
   - Retry on reconnection
   - Update status when sent

5. **Task 8.5:** Add connection status indicator
   - Create ConnectionStatus component
   - Show "Connecting..." banner when offline
   - Listen to Firebase connection state

### Unit Tests:
```typescript
// __tests__/services/storageService.test.ts
describe('Storage Service', () => {
  it('should cache messages to AsyncStorage', async () => {
    const messages = [{ id: '1', text: 'Hello' }];
    await storageService.cacheMessages('chat1', messages);
    
    const cached = await storageService.getCachedMessages('chat1');
    expect(cached).toEqual(messages);
  });
  
  it('should limit cached messages to 100', async () => {
    const messages = Array(150).fill(null).map((_, i) => ({ id: `${i}`, text: `Msg ${i}` }));
    await storageService.cacheMessages('chat1', messages);
    
    const cached = await storageService.getCachedMessages('chat1');
    expect(cached.length).toBe(100);
  });
});

// __tests__/integration/offline.test.ts
describe('Offline Functionality', () => {
  it('should queue messages when offline', async () => {
    // Simulate offline mode
    // Send message
    // Verify queued locally
    // Go online
    // Verify message sent to server
  });
  
  it('should load cached messages on app start', async () => {
    // Cache messages
    // Restart app
    // Verify messages load from cache
    // Verify Firestore sync happens
  });
});
```

### PR Checklist:
- [ ] Messages persist after app restart
- [ ] Offline messages queue and send on reconnect
- [ ] Cached messages load instantly
- [ ] Firestore sync happens in background
- [ ] Connection status indicator works
- [ ] No data loss during crashes
- [ ] Tests pass (>80% coverage)

---

## **PR #9: Group Chat**
**Branch:** `feature/group-chat`  
**Goal:** Create and participate in group chats  
**Dependencies:** PR #4, PR #7  
**Estimated Time:** 5-6 hours

### Tasks:
1. **Task 9.1:** Extend chat service for groups
   - Add `createGroupChat(creatorId, participantIds, groupName)`
   - Add `addParticipant(chatId, userId)`
   - Add `removeParticipant(chatId, userId)`
   - Update message sending to handle groups

2. **Task 9.2:** Create user selection component
   - Create `/src/components/UserSelector.tsx`
   - Multi-select list of users
   - Search functionality
   - Selected user chips

3. **Task 9.3:** Create CreateGroupScreen
   - Create `/src/screens/CreateGroupScreen.tsx`
   - Step 1: Select participants
   - Step 2: Enter group name
   - Create button

4. **Task 9.4:** Update ChatScreen for groups
   - Show group name in header
   - Show sender name in message bubbles
   - Show participant count
   - Different read receipt display

5. **Task 9.5:** Update ChatListItem for groups
   - Show group icon/indicator
   - Show group name
   - Show participant count

6. **Task 9.6:** Add "New Group" button to ChatsListScreen
   - FAB or header button
   - Navigate to CreateGroupScreen

### Unit Tests:
```typescript
// __tests__/services/chatService.test.ts (groups)
describe('Chat Service - Groups', () => {
  it('should create group chat', async () => {
    const groupId = await chatService.createGroupChat(
      'user1',
      ['user2', 'user3'],
      'Test Group'
    );
    expect(groupId).toBeDefined();
    
    const group = await chatService.getChat(groupId);
    expect(group.type).toBe('group');
    expect(group.participants).toHaveLength(3);
    expect(group.groupName).toBe('Test Group');
  });
  
  it('should create userChats entries for all participants', async () => {
    const groupId = await chatService.createGroupChat('user1', ['user2', 'user3'], 'Test');
    
    const user2Chats = await chatService.getUserChats('user2');
    expect(user2Chats.some(chat => chat.id === groupId)).toBe(true);
  });
});

// __tests__/screens/CreateGroupScreen.test.tsx
describe('CreateGroupScreen', () => {
  it('should allow selecting multiple users', () => {
    const { getByText } = render(<CreateGroupScreen />);
    fireEvent.press(getByText('User 1'));
    fireEvent.press(getByText('User 2'));
    // Verify both selected
  });
  
  it('should require group name', async () => {
    const { getByText, getByPlaceholderText } = render(<CreateGroupScreen />);
    fireEvent.press(getByText('Create'));
    // Verify error shown
  });
});
```

### PR Checklist:
- [ ] Users can create group chats
- [ ] Group chats appear in chat list
- [ ] Messages sent in groups reach all participants
- [ ] Sender names shown in group messages
- [ ] Group read receipts show count
- [ ] New Group button navigates correctly
- [ ] Tests pass (>80% coverage)

---

## **PR #10: Push Notifications**
**Branch:** `feature/push-notifications`  
**Goal:** Receive push notifications for new messages  
**Dependencies:** PR #4  
**Estimated Time:** 4-5 hours

### Tasks:
1. **Task 10.1:** Install notification dependencies
   ```bash
   npx expo install expo-notifications expo-device
   ```

2. **Task 10.2:** Create notification service
   - Create `/src/services/notificationService.ts`
   - Implement `registerForPushNotifications()`
   - Request permissions
   - Get Expo push token

3. **Task 10.3:** Store push token in Firestore
   - Add `pushToken` field to user document
   - Update on app launch
   - Update on token refresh

4. **Task 10.4:** Set up notification handlers
   - Configure `setNotificationHandler()`
   - Handle foreground notifications
   - Handle notification tap (navigation)
   - Create notification observer hook

5. **Task 10.5:** Integrate in App.tsx
   - Register for notifications on mount
   - Set up notification listeners
   - Handle deep linking from notifications

6. **Task 10.6:** Create Firebase Cloud Function (optional for MVP)
   - Function triggered on new message
   - Send push via Expo Push API
   - (Can test manually via Expo push tool first)

7. **Task 10.7:** Add notification testing tool
   - Create dev menu option to send test notification
   - Helpful for testing without full backend

### Unit Tests:
```typescript
// __tests__/services/notificationService.test.ts
describe('Notification Service', () => {
  it('should request notification permissions', async () => {
    const token = await notificationService.registerForPushNotifications();
    expect(token).toBeDefined();
  });
  
  it('should handle permission denial gracefully', async () => {
    // Mock permission denial
    const token = await notificationService.registerForPushNotifications();
    expect(token).toBeNull();
  });
});

// __tests__/integration/notifications.test.ts
describe('Notifications Integration', () => {
  it('should navigate to chat on notification tap', async () => {
    const notification = {
      request: {
        content: { data: { chatId: 'chat1' } }
      }
    };
    
    // Simulate notification tap
    // Verify navigation to correct chat
  });
  
  it('should show in-app notification in foreground', async () => {
    // Send notification while app is open
    // Verify banner appears
  });
});
```

### PR Checklist:
- [ ] Notification permission requested on first launch
- [ ] Push token stored in Firestore
- [ ] Foreground notifications show in-app banner
- [ ] Tapping notification opens correct chat
- [ ] Background notifications work
- [ ] Notifications work on both iOS and Android
- [ ] Tests pass (>80% coverage)
- [ ] Documented: Cloud Function deployment (if implemented)

---

## **PR #11: UI Polish & Final Testing**
**Branch:** `feature/ui-polish`  
**Goal:** Polish UI, fix bugs, comprehensive testing  
**Dependencies:** All previous PRs  
**Estimated Time:** 6-8 hours

### Tasks:
1. **Task 11.1:** UI Consistency Pass
   - Consistent colors (WhatsApp green: #25D366)
   - Consistent spacing and padding
   - Consistent typography
   - Dark mode support (optional)

2. **Task 11.2:** Add loading states everywhere
   - Skeleton screens for chat list
   - Loading spinner for messages
   - Button loading states
   - Pull-to-refresh indicators

3. **Task 11.3:** Error handling improvements
   - User-friendly error messages
   - Retry mechanisms
   - Offline banners
   - Network error handling

4. **Task 11.4:** Keyboard handling
   - KeyboardAvoidingView in ChatScreen
   - Auto-scroll on keyboard open
   - Dismiss keyboard on scroll
   - Input stays visible

5. **Task 11.5:** Add empty states
   - Empty chat list
   - No messages in chat
   - No search results
   - Illustrations or helpful text

6. **Task 11.6:** Performance optimizations
   - Memoize components
   - Optimize FlatList rendering
   - Image optimization
   - Reduce re-renders

7. **Task 11.7:** Accessibility
   - Screen reader support
   - Sufficient color contrast
   - Touch target sizes (min 44x44)
   - Semantic labels

8. **Task 11.8:** Add app icon and splash screen
   - Design or use placeholder
   - Configure in app.json
   - Generate assets with Expo

### End-to-End Tests:
```typescript
// __tests__/e2e/complete-flow.test.ts
describe('Complete User Flow', () => {
  it('should complete full user journey', async () => {
    // Sign up
    // See empty chat list
    // Create chat with user
    // Send message
    // Receive response
    // Create group
    // Send group message
    // Logout
    // Login again
    // Verify all data persists
  });
  
  it('should handle offline -> online flow', async () => {
    // Go offline
    // Send messages (queued)
    // Go online
    // Verify messages sent
    // Receive messages
  });
  
  it('should handle multiple simultaneous messages', async () => {
    // Two users send messages at same time
    // Verify both appear in correct order
    // Verify no duplicates
  });
});
```

### Manual Testing Checklist:
```markdown
## Authentication
- [ ] Sign up with valid email
- [ ] Sign up with invalid email (error)
- [ ] Sign up with weak password (error)
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error)
- [ ] Logout
- [ ] Session persists on app restart

## One-on-One Chat
- [ ] Start new chat
- [ ] Send text message
- [ ] Receive text message in < 1 second
- [ ] Messages in chronological order
- [ ] Timestamps display correctly
- [ ] Sent/received messages styled differently
- [ ] Online indicator shows correctly
- [ ] Last seen updates when user goes offline

## Optimistic Updates
- [ ] Message appears instantly on send
- [ ] Pending indicator visible
- [ ] Confirmed message replaces optimistic
- [ ] Failed message shows error
- [ ] Retry works for failed messages

## Read Receipts
- [ ] Single check when sent
- [ ] Double check when delivered
- [ ] Blue checks when read
- [ ] Opens chat marks messages as read
- [ ] Unread count in chat list

## Group Chat
- [ ] Create group with 3+ users
- [ ] Send message in group
- [ ] All participants receive message
- [ ] Sender name shows in messages
- [ ] Group read count displays
- [ ] Group appears in chat list

## Push Notifications
- [ ] Permission requested on first launch
- [ ] Notification received for new message
- [ ] Foreground notification shows banner
- [ ] Background notification appears
- [ ] Tapping notification opens chat
- [ ] Works on both iOS and Android

## Persistence
- [ ] Force quit app, reopen (messages persist)
- [ ] Logout and login on different device (sync)
- [ ] Airplane mode → send messages → online (messages send)

## UI/UX
- [ ] Keyboard dismisses on scroll
- [ ] Auto-scroll to bottom on new message
- [ ] Pull-to-refresh works
- [ ] Empty states display
- [ ] Loading states display
- [ ] Error messages user-friendly
- [ ] Smooth scrolling with many messages
- [ ] App icon displays
- [ ] Splash screen displays
```

### PR Checklist:
- [ ] All manual test cases pass
- [ ] All automated tests pass (>80% coverage)
- [ ] No console errors or warnings
- [ ] Performance is smooth (60fps scrolling)
- [ ] Works on iOS and Android
- [ ] Works on different screen sizes
- [ ] Keyboard handling works correctly
- [ ] All loading and error states implemented
- [ ] README updated with:
  - Setup instructions
  - Environment variables
  - Testing instructions
  - Known limitations
- [ ] Screenshots/GIFs added to README

---

## **PR #12: Deployment & Documentation**
**Branch:** `release/v1.0.0`  
**Goal:** Deploy MVP and finalize documentation  
**Dependencies:** PR #11  
**Estimated Time:** 2-3 hours

### Tasks:
1. **Task 12.1:** Update README.md
   - Project overview
   - Features list
   - Setup instructions
   - Environment variables guide
   - Running locally
   - Testing guide
   - Deployment guide
   - Troubleshooting

2. **Task 12.2:** Create .env.example
   - All required environment variables
   - Commented descriptions
   - No actual secrets

3. **Task 12.3:** Test Expo Go deployment
   - Run `npx expo start`
   - Generate QR code
   - Test on physical devices
   - Verify all features work

4. **Task 12.4:** (Optional) Build standalone apps
   - Set up EAS account
   - Configure eas.json
   - Build Android APK: `eas build --platform android --profile preview`
   - Build iOS for TestFlight: `eas build --platform ios --profile preview`

5. **Task 12.5:** Create deployment documentation
   - Firebase setup guide
   - Expo Go deployment steps
   - EAS Build instructions (optional)
   - Environment setup guide

6. **Task 12.6:** Create demo video/GIF
   - Record app usage
   - Show key features
   - Add to README

7. **Task 12.7:** Final code cleanup
   - Remove console.logs
   - Remove unused imports
   - Remove commented code
   - Format code consistently

8. **Task 12.8:** Version tagging
   - Tag release as v1.0.0
   - Create GitHub release notes

### Deployment Checklist:
```markdown
## Pre-Deployment
- [ ] All tests pass
- [ ] No console errors
- [ ] All environment variables documented
- [ ] Firebase security rules deployed
- [ ] Code reviewed and merged to main

## Expo Go Deployment
- [ ] Run `npx expo start`
- [ ] Scan QR code on iOS device (works)
- [ ] Scan QR code on Android device (works)
- [ ] Share link with testers

## (Optional) Standalone Apps
- [ ] EAS account created
- [ ] eas.json configured
- [ ] Android build succeeds
- [ ] iOS build succeeds
- [ ] TestFlight beta uploaded
- [ ] APK distributed to testers

## Documentation
- [ ] README complete and accurate
- [ ] Setup instructions tested by new user
- [ ] Demo video/GIFs added
- [ ] Known limitations documented
- [ ] Next steps (AI features) outlined

## Post-Deployment
- [ ] Monitor Firebase usage
- [ ] Collect tester feedback
- [ ] Log bugs in GitHub issues
- [ ] Plan next iteration
```

### PR Checklist:
- [ ] README comprehensive
- [ ] .env.example created
- [ ] Works in Expo Go
- [ ] (Optional) Standalone apps built
- [ ] Demo video created
- [ ] Code cleaned up
- [ ] Release tagged
- [ ] Deployment documentation complete

---

## Summary: PR Timeline

| PR # | Feature | Est. Time | Cumulative |
|------|---------|-----------|------------|
| 1 | Project Setup | 3-4h | 3-4h |
| 2 | Authentication | 4-5h | 7-9h |
| 3 | Chat List & Navigation | 4-5h | 11-14h |
| 4 | Real-Time Messaging | 6-7h | 17-21h |
| 5 | Optimistic Updates | 3-4h | 20-25h |
| 6 | Online/Offline Status | 3-4h | 23-29h |
| 7 | Read Receipts | 4-5h | 27-34h |
| 8 | Message Persistence | 3-4h | 30-38h |
| 9 | Group Chat | 5-6h | 35-44h |
| 10 | Push Notifications | 4-5h | 39-49h |
| 11 | UI Polish & Testing | 6-8h | 45-57h |
| 12 | Deployment & Docs | 2-3h | **47-60h** |

**Total Estimated Time:** 47-60 hours (6-8 days at 8 hours/day)

---

## Testing Summary

### Total Test Files: ~40+
- Unit tests: ~30 files
- Integration tests: ~5 files
- E2E tests: ~5 files

### Coverage Target: >80%
- Services: 90%+
- Components: 80%+
- Screens: 70%+
- Stores: 90%+

---

## Next Steps After MVP

Once the MVP is complete and deployed, the next phase will focus on:

1. **AI Agent Integration** - Intelligent chat assistant
2. **RAG Implementation** - Context-aware responses using retrieval-augmented generation
3. **Media Sharing** - Photos, videos, files
4. **Advanced Features** - Voice notes, message search, reactions
5. **Performance Optimization** - Scale testing, caching improvements
6. **Analytics** - User behavior tracking, error monitoring

---

**Ready to start with PR #1!**


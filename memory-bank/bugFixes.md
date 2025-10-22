# Bug Fixes Log

## October 21, 2025

### Critical Firestore Bug - Undefined Values
**Status:** ✅ Fixed
**Commit:** 6acb029

**Problem:**
```
Unsupported field value: undefined (found in field photoURL in document users/...)
```

**Root Cause:**
Firestore doesn't accept `undefined` values - it requires `null` for nullable fields.

**Fix:**
Changed all instances of `|| undefined` to `|| null` in `authService.ts`:
- Line 41: `photoURL: firebaseUser.photoURL || null`
- Line 44: `pushToken: data.pushToken || null`
- Line 53: `photoURL: firebaseUser.photoURL || null`
- Line 62: `pushToken: data.pushToken || null`
- Line 291: `photoURL: firebaseUser.photoURL || null`
- Line 294: `pushToken: data.pushToken || null`

**Lesson:** Always use `null` instead of `undefined` when working with Firestore.

---

### Display Name Bug - "Unknown User"
**Status:** ✅ Fixed
**Commit:** 6acb029

**Problem:**
All chat names were showing as "Unknown User" instead of actual user display names.

**Root Cause:**
Type mismatch between `Chat` and `ChatWithDetails` types:
- `chatService.ts` was using property name `participantName` (doesn't exist)
- `ChatWithDetails` type defines it as `otherUserName`
- `chatStore.ts` was using `Chat` type instead of `ChatWithDetails`

**Fix:**
1. **chatService.ts:**
   - Changed `const participantName` to `const otherUserName`
   - Changed return type from `Chat[]` to `ChatWithDetails[]`
   - Removed unnecessary `as Chat` type assertion

2. **chatStore.ts:**
   - Changed import from `Chat` to `ChatWithDetails`
   - Updated `chats: ChatWithDetails[]`
   - Updated `currentChat: ChatWithDetails | null`

**Lesson:** Type consistency is critical. Using the correct type (`ChatWithDetails`) prevents property name bugs.

---

### Firebase Persistence Warning
**Status:** ✅ Improved
**Commit:** 6acb029

**Warning:**
```
Error using user provided cache. Falling back to memory cache: 
FirebaseError: [code=unimplemented]: IndexedDB persistence is only 
available on platforms that support LocalStorage.
```

**Explanation:**
This is **expected behavior** on React Native:
- IndexedDB is a web API not available on mobile
- Firebase automatically falls back to memory cache
- Firestore still works correctly

**Fix:**
- Changed `console.warn` to `console.log` to reduce noise
- Updated message to clarify this is "React Native default" behavior

**Lesson:** React Native != Web. Some Firebase warnings are platform-specific and expected.

---

### Firestore Index Requirement
**Status:** ✅ Fixed
**Commit:** 8bfc9dc

**Problem:**
Firestore was requiring an index for `orderBy` queries.

**Solution:**
Removed `orderBy` from early development queries to avoid index requirements. Can add back later with proper indexes.

**Lesson:** Firestore indexes take time to create. Remove unnecessary orderBy in early development.

---

## Bug Prevention Patterns

### 1. Firestore Data Validation
```typescript
// ❌ BAD - Will cause Firestore errors
{
  photoURL: user.photoURL || undefined,
  pushToken: token || undefined
}

// ✅ GOOD - Use null for optional fields
{
  photoURL: user.photoURL || null,
  pushToken: token || null
}
```

### 2. Type Consistency
```typescript
// ❌ BAD - Type mismatch causes bugs
import { Chat } from '../types';
const chats: Chat[] = [];
chats.push({ ...data, participantName }); // Property doesn't exist!

// ✅ GOOD - Use correct type
import { ChatWithDetails } from '../types';
const chats: ChatWithDetails[] = [];
chats.push({ ...data, otherUserName }); // Property exists!
```

### 3. Error Handling
```typescript
// ✅ GOOD - Catch and log Firestore errors
try {
  await setDoc(doc(firestore, 'users', userId), data);
} catch (error) {
  console.error('Firestore error:', error);
  // Don't throw on expected errors
}
```

---

## October 22, 2025

### Duplicate Key Warnings - React Native FlatList
**Status:** ✅ Fixed
**Commit:** 5e52c09

**Problem:**
```
ERROR Encountered two children with the same key, `%s`. Keys should be unique...
```

**Root Cause:**
Race condition in optimistic message updates:
1. User sends message → optimistic message with `tempId` added
2. Firestore receives message and broadcasts update with real ID
3. Local `sendMessage` completes and updates temp message with real ID
4. Result: Two messages with the same ID (updated temp + Firestore message)

**Fix:**
Changed message confirmation strategy in `messageStore.ts`:
- Instead of updating optimistic message with real ID, we now **remove** it
- Firestore's real-time listener provides the authoritative version
- Applied to `sendMessageOptimistic`, `retryMessage`, and `processOfflineQueue`

**Code Changes:**
```typescript
// ❌ OLD - Caused duplicates
get().updateMessage(chatId, tempId, {
  id: realMessageId,
  pending: false,
  tempId: undefined,
});

// ✅ NEW - Removes temp, Firestore provides real
set((state) => {
  const existingMessages = state.messages[chatId] || [];
  return {
    messages: {
      ...state.messages,
      [chatId]: existingMessages.filter(m => m.tempId !== tempId),
    },
  };
});
```

**Also Fixed:**
- Simplified deduplication logic in `setMessages`
- Changed FlatList keyExtractor from `Math.random()` to `msg-${index}`
- Added comprehensive logging for debugging

**Lesson:** When using optimistic updates with real-time listeners, remove optimistic data once operation completes rather than trying to merge it.

---

### Network Status Flicker
**Status:** ✅ Fixed
**Commit:** 5e52c09

**Problem:**
When going offline/online, users saw a brief flicker of the NewChatScreen or user lists on the main chat pane.

**Root Cause:**
`ConnectionStatus` component had unnecessary dependencies in useEffect:
- `subscribeToChats`, `user`, `processOfflineQueue`, `setConnected` in dependency array
- Each network change triggered re-render and re-subscribed to NetInfo
- This caused navigation stack to briefly show cached screens

**Fix:**
Refactored `ConnectionStatus.tsx`:
1. Removed unused imports (`useChatStore`, `useAuthStore`)
2. Used refs to store callbacks (`processOfflineQueueRef`, `setConnectedRef`)
3. Changed useEffect dependency array to empty `[]` (setup once on mount)
4. Removed verbose logging

**Code Changes:**
```typescript
// ❌ OLD - Re-rendered on every change
}, [processOfflineQueue, setConnected, user, subscribeToChats]);

// ✅ NEW - Only sets up once
const processOfflineQueueRef = useRef(processOfflineQueue);
useEffect(() => {
  processOfflineQueueRef.current = processOfflineQueue;
}, [processOfflineQueue]);

useEffect(() => {
  // NetInfo setup
}, []); // Empty deps - setup once
```

**Lesson:** Use refs for callbacks that don't need to trigger re-renders. NetInfo listener should be set up once on mount, not on every state change.

---

### SafeAreaProvider Error
**Status:** ✅ Fixed
**Commit:** a501825 (Phase 10)

**Problem:**
```
ERROR [Error: No safe area value available. Make sure you are rendering 
`<SafeAreaProvider>` at the top of your app.]
```

**Root Cause:**
`NotificationBanner` component uses `useSafeAreaInsets()` from `react-native-safe-area-context`, but no `SafeAreaProvider` was wrapping the app.

**Fix:**
Wrapped entire App component return with `<SafeAreaProvider>`:
```typescript
// App.tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';

return (
  <SafeAreaProvider>
    <NotificationBanner />
    <ConnectionStatus />
    <AppNavigator />
  </SafeAreaProvider>
);
```

**Lesson:** Components using safe area hooks require `SafeAreaProvider` at the root level.

---

### Android Back Button Not Clickable
**Status:** ✅ Fixed
**Commit:** a501825 (Phase 10)

**Problem:**
Back button in ChatScreen header was not responding to touches on Android devices.

**Root Cause:**
Two absolutely positioned overlay components were blocking touch events:
1. `NotificationBanner` - `position: absolute`, `zIndex: 9999`
2. `ConnectionStatus` - `position: absolute`, `zIndex: 1000`

Even when hidden (slid off-screen), they still captured touch events.

**Fix:**
Added `pointerEvents` prop to both components:

1. **NotificationBanner.tsx:**
```typescript
<Animated.View
  pointerEvents="box-none"  // Allow touches to pass through
>
```

2. **ConnectionStatus.tsx:**
```typescript
<Animated.View
  pointerEvents={isConnected ? 'none' : 'box-none'}
>
```

**Behavior:**
- `"none"` - All touches pass through (when banner hidden)
- `"box-none"` - Container doesn't capture, but children can (when banner visible)

**Lesson:** Absolutely positioned overlays with high z-index must use `pointerEvents` to prevent blocking unintended touches. Always test touch interactions on Android as behavior can differ from iOS.

---

### Firebase Realtime Database Permission Denied
**Status:** ✅ Documented
**Commit:** a501825 (Phase 10)

**Problem:**
```
ERROR Error sending real-time notification: [Error: PERMISSION_DENIED: Permission denied]
```

**Root Cause:**
Firebase Realtime Database rules hadn't been deployed yet, or database wasn't enabled.

**Solution:**
1. Enable Realtime Database in Firebase Console
2. Deploy database rules from `database.rules.json`:
```json
{
  "rules": {
    "notifications": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "auth != null"
      }
    }
  }
}
```

**Documentation:**
Created `FIXING_PERMISSION_ERROR.md` with step-by-step guide for:
- Deploying via Firebase Console (easiest)
- Deploying via Firebase CLI
- Troubleshooting permission issues

**Lesson:** Always deploy database rules before testing real-time features. Provide clear documentation for setup steps.

---

## Known Issues

### Non-Issues (Expected Behavior)
- Firebase persistence warning on React Native (uses memory cache)
- Auth invalid-credential errors (wrong password / no account)

### To Fix Later
- Improve error messages for users
- Add loading indicators during operations

## Testing Checklist

✅ Test on actual devices, not just emulators
✅ Check Firestore console for data structure
✅ Verify all user-facing strings (not "Unknown User", etc.)
✅ Test with multiple users simultaneously
✅ Check console for unexpected errors
✅ Test offline behavior



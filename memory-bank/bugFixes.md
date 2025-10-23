# Bug Fixes Log

## October 23, 2025

### ChatScreen Presence Updates Not Working
**Status:** ✅ Fixed
**Date:** October 23, 2025
**Commits:** a8ae8bb, 466b6b3, d475aa2, 5984b21, 372a832, c8be171, 86bba2a, fe3c892
**Severity:** Critical - Presence indicators not updating in chat windows

#### The Problem
Online/offline status indicators were updating correctly in ChatsListScreen but NOT in ChatScreen (both direct and group chats). When a user force-quit their app, the indicator in the chat window stayed green indefinitely, even though the chat list showed them as offline immediately.

#### Root Causes (Multiple Issues)

**Issue 1: Missing Error Callbacks**
- `onValue()` RTDB listeners were missing error callback parameters
- Errors were failing silently without any indication
- Without error callbacks, subscription failures went unnoticed

**Issue 2: Infinite Re-subscription Loop**
- useEffect dependencies included `currentChat` and `user` (full objects)
- These objects were recreated on every render (via `.find()`)
- Caused listeners to be set up repeatedly, creating memory leaks
- Old listeners were being cleaned up while new ones were created
- The "active" listener kept changing, breaking presence updates

**Issue 3: Duplicate Subscriptions for Direct Chats**
- ChatScreen was creating its own RTDB subscription for direct chat presence
- `chatService.subscribeToUserChats()` already subscribed to the same data
- Duplicate subscriptions caused conflicts and race conditions
- The data was already available in `currentChat.otherUserOnline`

**Issue 4: Race Condition in Group Chats**
- RTDB presence listeners fired BEFORE Firestore loaded user profiles
- When presence update arrived, `participantUsers` was an empty array
- `.map()` on empty array returned empty array, so updates were lost
- Profiles and presence were loading in parallel instead of sequentially

#### The Fixes

**Fix 1: Added Error Callbacks**
```typescript
// BEFORE (fails silently)
const unsubscribe = onValue(statusRef, (snapshot) => {
  // handle data
});

// AFTER (logs errors)
const unsubscribe = onValue(
  statusRef,
  (snapshot) => {
    // handle data
  },
  (error) => {
    console.error('ERROR subscribing to RTDB:', error);
  }
);
```

**Fix 2: Fixed useEffect Dependencies**
```typescript
// BEFORE (re-subscribes on every render)
}, [currentChat, user]);

// AFTER (only re-subscribes when IDs change)
}, [currentChat?.id, user?.uid]);
```

**Fix 3: Removed Duplicate Direct Chat Subscription**
```typescript
// BEFORE: Created separate RTDB subscription in ChatScreen
// AFTER: Use presence data from currentChat object
const directChatOnlineStatus = currentChat?.type === 'direct' 
  ? currentChat.otherUserOnline 
  : undefined;

// Load user profile from Firestore (for display name)
// But use presence from currentChat (already tracked by chatService)
setOtherUser({
  ...profileData,
  isOnline: directChatOnlineStatus ?? false,
  lastSeen: directChatLastSeen || profileData.lastSeen,
});
```

**Fix 4: Delayed RTDB Setup for Group Chats**
```typescript
// Load Firestore profiles first
participantIds.forEach(uid => {
  const firestoreUnsub = onSnapshot(userDocRef, (docSnap) => {
    // Load user profile into participantUsers
  });
  unsubscribers.push(firestoreUnsub);
});

// Set up RTDB listeners AFTER 500ms delay
const rtdbTimeout = setTimeout(() => {
  participantIds.forEach(uid => {
    const rtdbUnsub = onValue(statusRef, (snapshot) => {
      // Now participantUsers is populated, updates will work
      setParticipantUsers(prev => {
        if (prev.length === 0) {
          console.log('participantUsers empty, skipping');
          return prev;
        }
        return prev.map(u => u.uid === uid ? { ...u, isOnline } : u);
      });
    });
  });
}, 500);
```

#### Files Modified
- `src/screens/ChatScreen.tsx` - Complete rewrite of presence subscription logic
- `src/services/presenceService.ts` - Added debug logging

#### Debugging Process
1. Added extensive console logging to track subscription lifecycle
2. Discovered listeners being set up multiple times
3. Found `participantUsers` was empty when updates arrived
4. Traced issue to object dependencies causing re-renders
5. Identified duplicate subscriptions for direct chats
6. Implemented sequential loading (Firestore then RTDB) for groups

#### Testing Results
- ✅ Direct chat presence updates within 30-60 seconds after force quit
- ✅ Group chat presence updates within 30-60 seconds after force quit
- ✅ Chat list and chat window now update at the same time
- ✅ No more infinite re-subscriptions
- ✅ No memory leaks from duplicate listeners

#### Key Learnings
1. **Always add error callbacks to Firebase listeners** - Silent failures are impossible to debug
2. **useEffect dependencies matter** - Objects cause re-runs, use primitive values (IDs)
3. **Don't duplicate subscriptions** - Reuse data that's already being tracked
4. **Race conditions with async data** - Load dependencies first, then set up listeners
5. **Empty array edge case** - Always check if state is populated before updating
6. **Timing matters** - Sometimes you need delays to ensure data is ready

#### Why It Was So Difficult
The issue involved multiple compounding problems:
1. Silent failures (no error callbacks)
2. Re-subscription loops (object dependencies)
3. Architectural duplication (two subscriptions for same data)
4. Race conditions (parallel vs sequential loading)

Each fix revealed the next issue. The final solution required understanding the entire data flow from `chatService` → `currentChat` → `ChatScreen`.

---

### FlatList Performance Optimizations
**Status:** ✅ Completed
**Date:** October 23, 2025

**Objective:**
Implement comprehensive FlatList performance optimizations across all screens to improve scrolling performance and reduce memory usage.

**Optimizations Applied:**

1. **`getItemLayout`** - Pre-calculates item dimensions to prevent layout recalculations
2. **`removeClippedSubviews={true}`** - Removes off-screen views from native hierarchy
3. **`maxToRenderPerBatch`** - Controls items rendered per scroll batch
4. **`windowSize`** - Defines viewport multiplier for rendering
5. **`initialNumToRender`** - Sets initial render count
6. **`updateCellsBatchingPeriod`** - Batching delay for updates

**Files Changed:**

#### 1. ChatScreen.tsx (Messages FlatList)
```typescript
const getMessageItemLayout = (_: any, index: number) => ({
  length: 80, // Approximate message bubble height
  offset: 80 * index,
  index,
});

<FlatList
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={21}
  initialNumToRender={15}
  updateCellsBatchingPeriod={50}
  getItemLayout={getMessageItemLayout}
/>
```

#### 2. NewChatScreen.tsx (Users FlatList)
```typescript
const getUserItemLayout = (_: any, index: number) => ({
  length: 82, // User item height (50 avatar + 16*2 padding)
  offset: 82 * index,
  index,
});

<FlatList
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={10}
  updateCellsBatchingPeriod={50}
  getItemLayout={getUserItemLayout}
/>
```

#### 3. UserSelector.tsx (Group Chat User Selection)
```typescript
const getUserItemLayout = (_: any, index: number) => ({
  length: 76, // User item height (48 avatar + 12*2 padding + 4 margin)
  offset: 76 * index,
  index,
});

<FlatList
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={10}
  updateCellsBatchingPeriod={50}
  getItemLayout={getUserItemLayout}
/>
```

#### 4. ChatsListScreen.tsx
Already had optimizations applied from previous fix.

**Benefits:**
- ⚡ **Faster scrolling** - Pre-calculated layouts eliminate measurement overhead
- 💾 **Lower memory usage** - `removeClippedSubviews` removes off-screen items
- 🎯 **Smoother rendering** - Batch controls prevent frame drops
- 📱 **Better on older devices** - Optimizations help lower-end hardware

**Testing:**
- Scroll performance in chat lists
- Message rendering in conversations
- User selection in group chat creation
- Memory usage during long scrolls

---

## October 22, 2025

### Chat List Flicker on App Foreground
**Status:** ✅ Fixed
**Commit:** 970f0b2

**The Problem:**
Brief visual flicker of last messages on the chat list when backgrounding and then foregrounding the app. The last message would flash/flicker momentarily.

**Root Cause:**
When the app returned to foreground:
1. `handleAppStateChange` called `updatePresence(user.uid, true)`
2. Presence update triggered Firebase real-time subscription
3. Chat list data updated with new online status
4. FlatList recalculated item layouts on re-render
5. Brief flash occurred during layout recalculation

**The Fix:**
Added FlatList performance optimizations to prevent layout recalculations:

```typescript
// Fixed item layout prevents re-calculations
const getItemLayout = (_: any, index: number) => ({
  length: 88, // Height of ChatListItem (padding 16 * 2 + avatar 56)
  offset: 88 * index,
  index,
});

<FlatList
  getItemLayout={getItemLayout}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={10}
/>
```

**Optimizations Applied:**
1. **`getItemLayout`** - Provides fixed item dimensions upfront, preventing FlatList from recalculating layouts
2. **`removeClippedSubviews`** - Only renders visible items, reduces memory usage
3. **Render batching** - `maxToRenderPerBatch`, `windowSize`, `initialNumToRender` for smoother rendering

**Files Changed:**
- `src/screens/ChatsListScreen.tsx` - Added FlatList performance props

**Result:**
- ✅ No more flicker when app returns to foreground
- ✅ Smoother scrolling performance
- ✅ Better memory efficiency
- ✅ Fixed item layout prevents unnecessary layout recalculations

---

### Users Going Offline When App Backgrounded
**Status:** ✅ Fixed
**Commit:** 0e24872

**The Problem:**
Users were being marked as offline whenever the app went to background (switching to another app, receiving a phone call, home screen, etc.). This created a poor user experience as users appeared offline even though they were still actively using their device.

**Root Cause:**
In `App.tsx`, the `handleAppStateChange()` function was calling `updatePresence(user.uid, false)` whenever the app state changed from `active` to `inactive` or `background`:

```typescript
// App is going to background
if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
  await updatePresence(user.uid, false);  // ❌ Too aggressive!
}
```

This was too aggressive - backgrounding an app doesn't mean the user is offline.

**The Fix:**
Removed the code that sets users offline when the app goes to background. Users now stay online when backgrounded and only go offline when:

1. **Network connection is lost** - Firebase Realtime Database's `onDisconnect()` handler automatically detects this
2. **App is completely killed/closed** - Firebase's `onDisconnect()` handler triggers
3. **User explicitly logs out** - `authService.signOut()` calls `setUserOffline()`

Kept the foreground handler to ensure users are marked online when returning to the app.

**Files Changed:**
- `App.tsx` - Removed background offline logic, added explanatory comments

**Result:**
- ✅ Users stay online when app is backgrounded
- ✅ More accurate online status representation
- ✅ Better user experience
- ✅ Firebase's automatic disconnect detection handles true offline scenarios
- ✅ Online status only changes for meaningful events (logout, disconnect, app kill)

---

### Critical: LoginScreen Unmounting During Auth + Error Toast Not Appearing
**Status:** ✅ Fixed
**Commit:** d83ba78
**Severity:** Critical (Error messages completely broken)

**The Problem:**
Error toast notifications were not appearing on login/signup failures despite extensive debugging attempts with useState, useReducer, refs, and various timing strategies.

**Root Cause Discovery:**
Through systematic logging, discovered the LoginScreen was **unmounting and remounting** during every login attempt:
```
LOG  🔐 Login pressed
LOG  💥 LoginScreen unmounting        ← Component DESTROYED!
LOG  🏗️  LoginScreen mounted          ← Fresh component created
LOG  ❌ Login failed, setting error
```

**Why It Happened:**
1. User presses "Login" button
2. `authStore.login()` sets `loading: true` **globally**
3. `AppNavigator` checks: `if (loading) return <LoadingScreen />`
4. **Entire AuthStack unmounts** → LoginScreen destroyed, all state lost
5. Login fails, `loading: false` 
6. **AuthStack remounts** → Fresh LoginScreen with empty state
7. Error gets set in new component instance, but previous refs/state are gone
8. This explained why NO state management approach worked (useState, useReducer, refs)

**The Fix:**
1. **Removed Global Loading State from Auth Operations**
   - Removed `loading: true/false` from `authStore.login()` method
   - Removed `loading: true/false` from `authStore.signup()` method  
   - Each screen now uses only its own `localLoading` state
   - AppNavigator no longer unmounts screens during authentication
   - Component stays mounted throughout auth process
   
2. **Disabled Password Autofill**
   - Added `autoComplete="off"` to email and password TextInputs
   - Added `textContentType="none"` to disable iOS autofill
   - Eliminates "Save Password" popup on failed login attempts

**Files Changed:**
- `src/stores/authStore.ts` - Removed global loading state from login/signup
- `src/screens/LoginScreen.tsx` - Added autofill prevention props
- `src/screens/SignupScreen.tsx` - Will need same autofill prevention

**Result:**
- ✅ Error toast now appears on login/signup failures
- ✅ Component stays mounted during authentication
- ✅ No more "Save Password" popup
- ✅ All debugging logs can now be cleaned up
- ✅ Error toast slides up smoothly from bottom with animation

**Key Lesson:**
Component lifecycle issues can make state management appear broken. Always check if components are unmounting unexpectedly before trying different state approaches.

---

### Console Error Banners & Spinner Flicker
**Status:** ✅ Fixed
**Commit:** 6016893

**Issues Fixed:**

1. **Console Error Banners**
   - **Problem:** Firebase auth errors (auth/invalid-email, etc.) appearing as console.error logs
   - **Impact:** Cluttered console output, confusing error display
   - **Fix:**
     - Removed console.error from authStore login/signup methods
     - Removed console.error from authService signIn/signUp functions
     - Errors are already handled and displayed in UI with inline error messages
   - **Files Changed:**
     - `src/stores/authStore.ts`
     - `src/services/authService.ts`

2. **Chat List Spinner Flicker**
   - **Problem:** Loading spinner flashing on ChatsListScreen when initially loading
   - **Impact:** Jarring visual experience, double spinners (empty state + FlatList refresh)
   - **Root Cause:** 
     - `subscribeToChats` always set `loading: true` even on re-subscription
     - FlatList `refreshing={loading}` prop showed pull-to-refresh spinner unnecessarily
   - **Fix:**
     - Only set loading on initial load (when chats array is empty)
     - Removed pull-to-refresh from FlatList (real-time updates make it unnecessary)
   - **Files Changed:**
     - `src/stores/chatStore.ts`
     - `src/screens/ChatsListScreen.tsx`

**Result:**
- Clean console output with no redundant error logs
- Smooth chat list loading without spinner flicker
- Better loading state management
- Removed unnecessary pull-to-refresh feature

---

### Auth Screen UX Improvements
**Status:** ✅ Fixed
**Commit:** d2f455b

**Issues Fixed:**

1. **Inline Error Messages**
   - **Problem:** Login and signup errors shown as native Alert.alert popups that block the UI
   - **Impact:** Poor UX - users had to dismiss popups, messages weren't well positioned
   - **Fix:** 
     - Added error state management to LoginScreen and SignupScreen
     - Replaced Alert.alert with inline error banners
     - Styled with red background (#FFE5E5), left border accent (#FF6B6B)
     - Positioned below headers for immediate visibility
     - Auto-clears on next submit attempt
   - **Files Changed:** 
     - `src/screens/LoginScreen.tsx`
     - `src/screens/SignupScreen.tsx`

2. **Loading Spinner Color Inconsistency**
   - **Problem:** App initialization showed green spinner (#25D366), then flashed to tan/brown (#D4A574)
   - **Impact:** Jarring visual transition during app load
   - **Root Cause:** AppNavigator LoadingScreen using old WhatsApp green color
   - **Fix:** Changed ActivityIndicator color to match primary brand color (#D4A574)
   - **Files Changed:** `src/navigation/AppNavigator.tsx`

**Result:**
- Better UX with inline error messages
- Smooth loading experience without color changes
- Consistent visual branding throughout app
- Removed unused Alert imports

---

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

### ErrorToast Syntax Error - Extra Empty Line
**Status:** ✅ Fixed
**Commit:** TBD

**Problem:**
```
ERROR [runtime not ready]: ReferenceError: Property 'r' doesn't exist
```

**Root Cause:**
Extra empty line at the end of `ErrorToast.tsx` (line 188) after the closing of the file. This caused a parsing/minification error that manifested as a cryptic "Property 'r' doesn't exist" runtime error.

**Fix:**
Removed the trailing empty line from `ErrorToast.tsx`.

**Files Changed:**
- `src/components/ErrorToast.tsx` - Removed extra empty line at end of file

**Result:**
- ✅ Runtime error resolved
- ✅ App now loads without parsing errors

**Lesson:** Trailing whitespace and empty lines at the end of files can cause unexpected parsing/minification errors in React Native. Always keep files clean with proper EOF formatting.

---

### Critical: No Authentication Persistence - Users Log Out on Force Close
**Status:** ✅ Resolved (Accepted as limitation and cleaned up all workarounds)
**Date:** October 22, 2025
**Severity:** Medium (Accepted trade-off for Expo Go compatibility)

**Problem:**
Users were being logged out every time they force closed the app (completely shut it down). They had to re-enter email and password on every app launch.

**Root Cause:**
Firebase Auth v9+ doesn't automatically enable persistence in React Native/Expo. The code was using `getAuth()` which works for web but doesn't configure persistence for React Native. 

The comment in `firebase.ts` incorrectly stated: "Firebase handles persistence automatically in React Native/Expo" - this is **not true** for Firebase v9+ SDK.

In Firebase v9+, you must explicitly use:
- `initializeAuth()` instead of `getAuth()`
- Custom persistence object with AsyncStorage
- Pass persistence config to `initializeAuth()`

**Investigation & Attempted Fixes:**
Attempted multiple approaches to enable Firebase Auth persistence in React Native:

1. **Custom persistence object** - Failed with "INTERNAL ASSERTION FAILED" error
2. **Import from `@firebase/auth/dist/rn/index.js`** - Metro bundler couldn't resolve the path
3. **Import from `@firebase/auth`** - Package not available at node_modules root level
4. **Standard `firebase/auth` imports** - No React Native-specific exports available

**Root Cause:**
Firebase JS SDK v12's module structure doesn't properly expose React Native-specific auth modules (`initializeAuth`, `getReactNativePersistence`) through paths that Metro bundler can resolve. The React Native build exists at `firebase/node_modules/@firebase/auth/dist/rn/` but:
- Can't import directly from nested node_modules
- `@firebase/auth` isn't a standalone package
- `firebase/auth` package.json doesn't have "react-native" field
- Metro's module resolution can't reach the RN-specific exports

**Attempted Solutions:**
Multiple approaches were attempted to enable Firebase Auth persistence:

1. **Custom persistence object** - Failed with "INTERNAL ASSERTION FAILED" error
2. **Import from `@firebase/auth/dist/rn/index.js`** - Metro bundler couldn't resolve the path
3. **Import from `@firebase/auth`** - Package not available at node_modules root level
4. **Custom SecureStore session management** - Could save/retrieve data but couldn't restore Firebase session
5. **Standard `firebase/auth` imports** - No React Native-specific exports available

**Why None Worked:**
- Firebase JS SDK v12's React Native auth modules aren't accessible through Metro bundler
- The required functions (`initializeAuth`, `getReactNativePersistence`) exist but can't be imported
- Even when session data was saved/retrieved from SecureStore, there's no way to restore the Firebase session without these functions
- Firebase's module structure assumes web bundlers (Webpack), not Metro

**Decision: Accept the Limitation**
After extensive investigation, we decided to accept this as a known limitation rather than further complicate the codebase.

**Files Cleaned Up:**
- ❌ `src/services/sessionService.ts` - Deleted (custom session management attempt)
- ✅ `src/stores/authStore.ts` - Removed all sessionService imports and calls
- ✅ `src/services/firebase.ts` - Kept clean with `getAuth()` only
- ✅ `app.json` - Removed expo-secure-store plugin reference
- ✅ Uninstalled expo-secure-store package

**Current Behavior:**
- ⚠️ Users must log in again after force-closing app
- ✅ App works perfectly otherwise (messaging, presence, notifications all work)
- ✅ Simpler codebase without workarounds
- ✅ Can be fixed later with Expo Development Builds or React Native Firebase

**Lesson:** 
When facing limitations in the development environment (Expo Go), sometimes it's better to accept the limitation and document it rather than introduce complex workarounds that may break in the future. The persistence issue is a minor inconvenience during development but can be properly fixed when migrating to a production build.

---

### Login Screen Flicker After Authentication
**Status:** ✅ Fixed
**Date:** October 22, 2025
**Severity:** Low (Visual/UX issue)

**Problem:**
Users experienced a visible flicker on the login screen after entering credentials and pressing the login button. This was particularly noticeable on physical devices, less so on emulators.

**Root Cause:**
The `authStore.ts` was updating the user state twice during login:
1. Directly in the `login()` method via `set({ user })`
2. Through the `onAuthStateChanged` listener immediately after

This caused a double-render where the LoginScreen would briefly show the user as logged in before the AppNavigator switched to the main app, creating a visible flicker.

**The Fix:**
Modified `src/stores/authStore.ts` to remove the direct `set({ user })` calls from both `login()` and `signup()` methods. Now the `onAuthStateChanged` listener is the single source of truth for authentication state updates.

**Files Changed:**
- ✅ `src/stores/authStore.ts` - Removed direct user state updates from `login()` and `signup()`
- ✅ `src/screens/LoginScreen.tsx` - Removed all debug logging (15+ console.log statements)
- ✅ `src/components/ErrorToast.tsx` - Removed debug logging

**Before:**
```typescript
login: async (email: string, password: string) => {
  const user = await authService.signIn(email, password);
  set({ user }); // ❌ Causes double render with onAuthStateChanged
}
```

**After:**
```typescript
login: async (email: string, password: string) => {
  await authService.signIn(email, password);
  // Let onAuthStateChanged handle user state update
}
```

**Additional Performance Improvements:**
Removed extensive debug logging that was added during session persistence troubleshooting:
- LoginScreen had 15+ console.log statements
- ErrorToast had debug logging in useEffect
- These console.log calls were causing additional performance overhead on physical devices

**Result:**
- ✅ Smooth login experience with no flicker
- ✅ Better performance on physical devices
- ✅ Cleaner console output
- ✅ Single source of truth for auth state changes

**Lesson:**
When using listeners like `onAuthStateChanged`, avoid manually updating the same state that the listener manages. Let the listener be the single source of truth to prevent race conditions and double renders. Also, remember to remove debug logging before considering a feature complete - console.log has performance overhead, especially on physical devices.

**Additional Optimizations:**
1. **Fixed SafeAreaView deprecation warnings** - Replaced deprecated `SafeAreaView` from `react-native` with the proper one from `react-native-safe-area-context` in all screens (ChatsListScreen, ChatScreen, NewChatScreen, CreateGroupScreen). This improves performance and eliminates console warnings.

2. **Fixed navigator flicker on autofill** - Changed from two separate conditional navigators (`AuthStack` and `MainStack`) to a single `RootStack` navigator with conditional screen rendering. This prevents the entire navigator from unmounting/remounting during login, providing smooth fade transitions instead of jarring flashes. Added `animation: 'fade'` with `animationDuration: 200` for smooth transitions.

3. **Simplified LoginScreen error handling** - Removed complex `errorRef` + `renderTrigger` pattern in favor of simple `error` state, reducing unnecessary re-renders during autofill.

4. **Enabled proper autofill support** - Changed TextInput props from `autoComplete="off"` to `autoComplete="email"/"password"` to work with the native system instead of fighting it.

5. **Added user-specific avatar colors** - Created `userColors.ts` utility to generate consistent, colorful avatars for users. Updated NewChatScreen, UserSelector (CreateGroupScreen), to use user-specific colors instead of the generic primary color. This makes it easier to distinguish users at a glance.

6. **Fixed ChatScreen presence updates** - Added dual subscription (Firestore + RTDB) for instant online/offline status updates when users force quit, matching the behavior in ChatsListScreen.

7. **Enhanced group chat participant display** - Group chat headers now show individual participant names with real-time online indicators instead of just participant count. Subscribes to each participant's presence for instant updates.

---

**Future Solutions (When Ready for Production):**
1. **Expo Development Builds** (Recommended) - Keep Expo benefits, add native modules
   - Still use Expo's development workflow
   - Can use React Native Firebase or other native modules
   - Build takes 15-30 minutes one-time
   
2. **React Native Firebase** (`@react-native-firebase/auth`) - Native auth with proper persistence
   - Requires Expo Development Builds or full React Native
   - Better performance and more features
   - Native persistence works perfectly

3. **Wait for Firebase JS SDK improvements** - May never happen for Expo Go

**Important Notes:**
- This limitation only affects Expo Go (managed workflow)
- Many production apps work fine with this limitation (re-login as security feature)
- Web apps have automatic persistence
- This affects most Expo Go + Firebase JS SDK projects

**Lesson:** Firebase JS SDK v12 has architectural limitations for React Native persistence with Metro bundler. The module structure assumes web bundlers (Webpack) and doesn't properly support Metro's resolution strategy. For production apps requiring persistent auth:
- Use **Expo Development Builds** with React Native Firebase (best balance)
- Or accept re-login requirement (common for secure apps)
- Don't try complex workarounds that can't actually restore Firebase sessions

---

## Known Issues

### Active Limitations
- **No Auth Persistence in Expo Go** - Users must re-login after force-closing the app
  - This is a limitation of Firebase JS SDK + Metro bundler with Expo Go
  - Can be fixed with Expo Development Builds when ready for production
  - Not critical for development phase

### Non-Issues (Expected Behavior)
- Firebase persistence warning on React Native (uses memory cache for Firestore)
- Auth invalid-credential errors (wrong password / no account)

### To Fix Later
- Improve error messages for users
- Add loading indicators during operations
- Implement auth persistence workaround or migrate to native Firebase

## Testing Checklist

✅ Test on actual devices, not just emulators
✅ Check Firestore console for data structure
✅ Verify all user-facing strings (not "Unknown User", etc.)
✅ Test with multiple users simultaneously
✅ Check console for unexpected errors
✅ Test offline behavior



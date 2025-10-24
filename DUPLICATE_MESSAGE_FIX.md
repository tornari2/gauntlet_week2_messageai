# Duplicate Message Fix

## Problem
Messages sent while in airplane mode were being duplicated upon reconnection:
1. First time: messages appeared in correct order
2. Second time: messages appeared in reverse order

Additionally, messages on login screen were showing duplicate notifications.

## Root Cause
The app was using **two separate offline queueing systems** that both tried to send messages on reconnect:

1. **Firestore's Built-in Offline Persistence**: Automatically queues writes when offline and syncs them when reconnecting
2. **Custom AsyncStorage Queue**: Our own backup system that we added

When reconnecting:
- Firestore would sync its queue → send messages once
- Our `processOfflineQueue()` would read AsyncStorage → send messages AGAIN

Additionally, the AsyncStorage queue contained old messages from deleted chats that were never properly cleaned up, causing errors and duplicate processing.

## Solution

### 1. Cleared Corrupted Queue
Added temporary code to clear the AsyncStorage queue of old/corrupted entries:
```typescript
// In App.tsx (temporary)
AsyncStorage.removeItem('offline_queue')
```

### 2. Rely on Firestore's Offline Persistence
Modified `sendMessageOptimistic` in `messageStore.ts` to:
- **NOT** add messages to AsyncStorage queue when offline
- **ALWAYS** send to Firestore (which handles offline queueing automatically)
- **ONLY** use AsyncStorage as a fallback if Firestore completely fails

**Before:**
```typescript
// Add to AsyncStorage queue immediately when offline
if (!isConnected) {
  await storageService.addToOfflineQueue(chatId, optimisticMessage);
}

try {
  // Then send to Firestore
  await chatService.sendMessage(chatId, text, senderId);
} catch (error) {
  // Mark as failed
}
```

**After:**
```typescript
try {
  // Always try Firestore first (it handles offline caching)
  await chatService.sendMessage(chatId, text, senderId);
} catch (error) {
  // Only add to AsyncStorage if Firestore completely failed
  if (!isConnected) {
    await storageService.addToOfflineQueue(chatId, optimisticMessage);
  }
  // Mark as failed
}
```

### 3. Simplified Architecture
- **Primary offline handler**: Firestore's built-in offline persistence
- **Backup handler**: AsyncStorage queue (only for Firestore failures)
- **Result**: No more duplicate sends

## Testing
1. ✅ Enable airplane mode
2. ✅ Send messages (should show clock icon ◷)
3. ✅ Disable airplane mode
4. ✅ Messages should appear once (not twice)
5. ✅ No duplicate notifications on login

## Files Changed
- `src/stores/messageStore.ts` - Modified `sendMessageOptimistic` logic
- `App.tsx` - Temporarily cleared queue, then removed cleanup code
- Deleted `force-clear-queue.js` and `clear-offline-queue.js`

## Expected Behavior
- Messages sent offline are queued by Firestore
- On reconnect, Firestore syncs once
- AsyncStorage queue remains empty (unless Firestore fails)
- No duplicates
- Messages appear in correct order


# Offline Message Status Fix

## Problem
When sending messages while offline, messages were showing a gray checkmark (✓) instead of a pending clock (⏱️) or failed state. This was misleading because it made users think the message was sent successfully when it was actually only saved to Firebase's local cache.

## Root Cause
Firebase Firestore's offline persistence feature automatically caches writes locally and considers them "successful" even when there's no network connection. The `sendMessage` operation would complete immediately, removing the `pending` state before users could see it.

## Solution

### 1. **Network State Store** (`src/stores/networkStore.ts`)
Created a new global Zustand store to track network connectivity state across the entire app.

**Features:**
- Monitors network state using `@react-native-community/netinfo`
- Provides `isConnected` state accessible from any component or store
- Automatically initializes and maintains connection status

### 2. **Updated Message Store** (`src/stores/messageStore.ts`)
Modified `sendMessageOptimistic` to check network status before attempting to send:

**Offline Behavior:**
- ✅ Checks `isConnected` from `networkStore` before sending
- 📴 If offline, adds message to offline queue immediately
- ⏱️ Keeps message in `pending` state (shows clock icon)
- 🔄 Message will be processed when connection is restored

**Online Behavior:**
- 📡 Sends message to server normally
- ✅ Updates to sent state (shows checkmark) after server confirms
- ❌ Shows failed state if send operation fails

**Queue Processing:**
- 🔄 When connection is restored, `processOfflineQueue` automatically sends queued messages
- ✅ Updates pending messages to sent state upon success
- ❌ Marks as failed if retry fails

### 3. **Updated ConnectionStatus Component** (`src/components/ConnectionStatus.tsx`)
Integrated with the new `networkStore`:

**Features:**
- Updates global `networkStore` when network state changes
- Triggers offline queue processing when connection is restored
- Maintains visual banner for user feedback

## User Experience

### Before Fix
```
User offline → Sends message → ✓ Gray checkmark (misleading)
```

### After Fix
```
User offline → Sends message → ⏱️ Clock (pending)
Connection restored → 🔄 Auto-sends → ✅ Checkmark (sent)
```

### Message States
1. **⏱️ Clock (pending)**: Message waiting to send (offline or sending)
2. **✓ Gray checkmark**: Message sent to server, not read yet
3. **✓✓ Gray checkmarks**: Message delivered (in groups)
4. **✓✓ Blue checkmarks**: Message read by recipient(s)
5. **! Red exclamation**: Message failed to send (tap to retry)

## Testing

### Test Offline Sending
1. Turn off Wi-Fi on your device
2. Send a message
3. ✅ Should see ⏱️ clock icon (pending state)
4. ✅ Red "No internet connection" banner should appear
5. Turn Wi-Fi back on
6. ✅ Message should auto-send and change to ✓ checkmark
7. ✅ Banner should disappear

### Test Online Sending
1. Ensure Wi-Fi is on
2. Send a message
3. ✅ Should see ⏱️ clock very briefly (usually too fast to notice)
4. ✅ Should immediately change to ✓ checkmark when sent

### Test Sending to Offline User
1. Send message while you're online
2. Recipient is offline
3. ✅ Should show ✓ single gray checkmark
4. When recipient opens the chat
5. ✅ Should change to ✓✓ blue checkmarks

## Files Changed
- `src/stores/networkStore.ts` (NEW)
- `src/stores/messageStore.ts` (MODIFIED)
- `src/components/ConnectionStatus.tsx` (MODIFIED)

## Implementation Details

### Network Store Pattern
```typescript
// Check network status from anywhere
const isConnected = useNetworkStore.getState().isConnected;

// In components
const { isConnected } = useNetworkStore();
```

### Message Sending Flow
```typescript
sendMessageOptimistic(chatId, text, senderId)
  ↓
Check isConnected
  ↓
If OFFLINE:
  - Add to queue
  - Keep as pending
  - Wait for reconnection
  ↓
If ONLINE:
  - Send to Firebase
  - Update to sent on success
  - Mark failed on error
```

## Benefits
1. **Accurate Status**: Users always know if their message was actually sent
2. **Clear Feedback**: Pending state is visible when offline
3. **Auto-Retry**: Messages automatically send when connection returns
4. **WhatsApp-like UX**: Familiar message status indicators
5. **Reliable**: Works even if Firebase offline cache is enabled

## Notes
- Firebase's offline persistence is still enabled for other operations
- Only message sending explicitly checks network state
- This provides better UX than relying solely on Firebase's automatic sync
- The network store could be extended for other offline-aware features in the future


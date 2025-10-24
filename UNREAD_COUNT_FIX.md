# Unread Message Count Badge Flickering Fix

## Problem

The unread message count badges on chat list items were **flickering** - they would appear briefly and then immediately disappear. The badges used to persist correctly but were now only showing as a quick flash.

## Root Cause - State Reset on Every Update

The issue was that the main chat list subscription fires **on every chat update**, including:
- New messages
- Presence changes (users going online/offline)
- Profile updates (name/color changes)
- Any Firestore document change

Each time the subscription fired, the code would:

1. Build a fresh `chats` array with `unreadCount: 0` for all chats
2. Call `onChatsUpdate(chats)` - **this resets all badges to 0**
3. Then set up message subscriptions to calculate the real unread count
4. The subscriptions fire and update the count back

This created a **flicker**: badges appeared → reset to 0 → updated back to correct count.

```typescript
// ❌ OLD CODE - Always resets unread count to 0
for (const docSnap of snapshot.docs) {
  chats.push({
    ...chatData,
    unreadCount: 0, // ← Always 0, loses existing count!
  });
}

// This call shows 0 for all badges (flicker!)
latestChats = chats;
onChatsUpdate(chats);

// Then subscriptions fire and update the count back
// But the damage is done - user saw the flicker
```

The problem was particularly bad because presence changes happen frequently (every 30-60 seconds), causing constant flickering.

## Solution

**Preserve existing unread counts** when rebuilding the chats array:

Instead of always initializing to 0, check if the chat already exists in `latestChats` and preserve its current unread count:

```typescript
// ✅ NEW CODE - Preserve existing unread count
for (const docSnap of snapshot.docs) {
  chats.push({
    ...chatData,
    // Find existing chat and preserve its unread count, or default to 0 for new chats
    unreadCount: latestChats.find(c => c.id === docSnap.id)?.unreadCount ?? 0,
  });
}

// This call now preserves existing badge counts (no flicker!)
latestChats = chats;
onChatsUpdate(chats);

// Message subscriptions still update the count when messages change
```

## Key Changes in `chatService.ts`

```typescript
// For direct chats
const chatWithDetails: ChatWithDetails = {
  id: docSnap.id,
  // ... other fields ...
  unreadCount: latestChats.find(c => c.id === docSnap.id)?.unreadCount ?? 0,
};

// For group chats
chats.push({
  id: docSnap.id,
  // ... other fields ...
  unreadCount: latestChats.find(c => c.id === docSnap.id)?.unreadCount ?? 0,
});
```

## How It Works

1. **First Load**: Chat doesn't exist in `latestChats`, so `find()` returns `undefined`, fallback to `0`
2. **Presence Update Triggers**: Chat exists in `latestChats` with `unreadCount: 3`, so we preserve `3`
3. **Message Subscriptions**: Still update the count in real-time when messages are marked as read
4. **No Flicker**: Badge counts persist across non-message updates

## Benefits

1. **No flickering**: Badges stay visible and don't reset to 0
2. **Smooth updates**: Only changes when messages are actually read/received
3. **Better UX**: Users can reliably see which chats have unread messages
4. **Performance**: No visual jank during frequent presence updates

## Testing

To verify the fix:

1. **Test 1: Badge Persistence**
   - Have User A send you messages
   - You should see an unread badge appear
   - **Badge should stay visible** (not flicker or disappear)
   - Wait 60 seconds (presence updates fire) - badge should still be there

2. **Test 2: Reading Messages**
   - Click on a chat with unread messages
   - Badge should disappear when you open the chat
   - Navigate back - badge should remain gone

3. **Test 3: Presence Changes**
   - Have unread messages in multiple chats
   - Have other users go online/offline
   - **Badges should remain stable** during presence changes

4. **Test 4: Profile Updates**
   - Change your avatar color or display name
   - **Badges should not flicker** during the update

## Files Modified

- `src/services/chatService.ts` - Preserve unread counts when rebuilding chats array

## Technical Details

### Why This Pattern?

Firebase real-time listeners fire on **every document change**, not just the fields you care about. When we subscribe to the chats collection:

- Presence updates trigger the subscription → rebuild chat list
- Profile updates trigger the subscription → rebuild chat list  
- New messages trigger the subscription → rebuild chat list

Since we can't control when the subscription fires, we must **preserve state** that shouldn't change across rebuilds.

### The Pattern: Preserve State on Rebuild

```typescript
// When rebuilding an array from a subscription:
newArray = subscription.map(item => ({
  ...newData,
  preservedField: existingArray.find(e => e.id === item.id)?.preservedField ?? default,
}));
```

This is a common pattern for Firebase subscriptions that rebuild entire arrays on every update.

### Alternative Approaches (Not Used)

1. **Only subscribe to specific fields** - Not possible, Firestore subscriptions are all-or-nothing
2. **Debounce updates** - Would delay legitimate updates
3. **Separate subscriptions for each chat** - More complex, same problem
4. **Check for actual changes before updating** - Adds overhead, doesn't solve root cause

The chosen approach (preserve state) is the simplest and most performant solution.

## History

This feature used to work correctly, then broke after implementing real-time unread count tracking. The sequence of issues was:

1. **Original**: Used `getDocs()` - no real-time updates, badges never updated
2. **First Fix**: Added `onSnapshot` for real-time updates - badges appeared but immediately disappeared (timing issue)
3. **Second Fix**: Reordered subscription setup - badges appeared but flickered on every update
4. **Final Fix**: Preserve counts across rebuilds - badges now work correctly!

## Related Files

- `UNREAD_COUNT_FIX.md` - Original documentation (timing fix)
- `src/services/chatService.ts` - Main implementation
- `src/components/ChatListItem.tsx` - Badge display component



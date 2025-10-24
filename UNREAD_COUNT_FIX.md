# Unread Message Count Real-Time Update Fix

## Problem

The unread message count indicator (badge) on chat list items was persisting for too long after users had already viewed the messages. The badge would not disappear immediately after reading messages in a chat.

## Root Cause

The unread count calculation in `chatService.subscribeToUserChats()` was using `getDocs()` to fetch all messages and count unread ones. This approach had a critical flaw:

1. `getDocs()` is a one-time fetch operation that runs when the chat list subscription first loads
2. When users open a chat and messages are marked as read in Firestore, the chat document itself doesn't change
3. Since only changes to the chat document trigger the subscription callback, the unread count never recalculated
4. The badge would only update if something else triggered a chat document change (like a new message)

```typescript
// ❌ OLD CODE - Only calculates once per chat
const messagesSnapshot = await getDocs(messagesRef);
let unreadCount = 0;
messagesSnapshot.forEach((msgDoc) => {
  const msgData = msgDoc.data();
  if (msgData.senderId !== userId && !msgData.readBy?.includes(userId)) {
    unreadCount++;
  }
});
```

## Solution

Implemented real-time listeners for the messages subcollection of each chat:

### 1. **Added Message Subscriptions**
   - Created a `Map` to store message subscription unsubscribe functions for each chat
   - Set up `onSnapshot` listeners for each chat's messages subcollection
   - These listeners recalculate the unread count in real-time whenever any message changes

### 2. **Real-Time Unread Count Updates**
   - When messages are marked as read in `ChatScreen`, the change is immediately detected
   - The listener recalculates the unread count and updates the chat list
   - The badge disappears or updates instantly

### 3. **Proper Cleanup**
   - Added cleanup logic to unsubscribe from message listeners when chats are removed from the list
   - Prevents memory leaks and unnecessary Firestore reads

## Key Changes in `chatService.ts`

```typescript
// ✅ NEW CODE - Real-time subscription
const messageUnsubscribers = new Map<string, () => void>();

// Set up real-time listener for unread count
if (!messageUnsubscribers.has(docSnap.id)) {
  const messagesRef = collection(firestore, 'chats', docSnap.id, 'messages');
  const messagesUnsubscribe = onSnapshot(
    messagesRef,
    (messagesSnapshot) => {
      // Calculate unread count
      let newUnreadCount = 0;
      messagesSnapshot.forEach((msgDoc) => {
        const msgData = msgDoc.data();
        if (msgData.senderId !== userId && !msgData.readBy?.includes(userId)) {
          newUnreadCount++;
        }
      });
      
      // Update the unread count for this specific chat
      latestChats = latestChats.map(chat => {
        if (chat.id === docSnap.id) {
          return {
            ...chat,
            unreadCount: newUnreadCount,
          };
        }
        return chat;
      });
      
      onChatsUpdate([...latestChats]);
    },
    (error) => {
      console.error(`Error subscribing to messages for chat ${docSnap.id}:`, error);
    }
  );
  
  messageUnsubscribers.set(docSnap.id, messagesUnsubscribe);
}
```

## Benefits

1. **Instant Updates**: Unread badges disappear immediately when messages are read
2. **Real-Time Accuracy**: Badge counts are always accurate and reflect the current state
3. **Better UX**: Users get immediate visual feedback when they read messages
4. **Efficient**: Only subscribes to chats that are currently in the user's chat list
5. **Clean**: Properly unsubscribes when chats are removed to prevent memory leaks

## Testing

To verify the fix:

1. **Test 1: Direct Chat**
   - User A sends messages to User B
   - User B should see an unread badge on the chat
   - When User B opens the chat, the badge should disappear immediately
   - When User B navigates back to the chat list, the badge should remain gone

2. **Test 2: Group Chat**
   - User A sends messages to a group chat
   - User B should see an unread badge
   - When User B opens the chat, the badge should disappear immediately
   - The badge should update in real-time as messages are read

3. **Test 3: Multiple Unread Chats**
   - Have unread messages in multiple chats
   - Open each chat one by one
   - Verify each badge disappears immediately upon opening its chat

## Files Modified

- `src/services/chatService.ts` - Added real-time message subscriptions for unread count updates


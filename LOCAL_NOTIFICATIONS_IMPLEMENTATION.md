# Local Notifications & In-App Banners Implementation

## Overview
This document describes the implementation of local notifications with in-app banners using Firebase Realtime Database to simulate push notifications for Expo Go compatibility.

## Architecture

### Components

#### 1. **NotificationBanner Component** (`src/components/NotificationBanner.tsx`)
- In-app banner that displays at the top of the screen when messages arrive
- Auto-dismisses after 4 seconds
- Animated slide-in/out transitions
- Tappable to navigate to the chat
- Dismissible with a close button

#### 2. **Notification Store** (`src/stores/notificationStore.ts`)
- Manages notification state using Zustand
- Tracks currently displayed notification
- Manages notification queue
- Suppresses notifications for the currently active chat
- Processes queued notifications sequentially

#### 3. **Notification Service** (`src/services/notificationService.ts`)
- Handles local notification registration and permissions
- Triggers local notifications when app is in background
- Shows in-app banners when app is in foreground
- Manages notification channels (Android)
- Badge count management

#### 4. **Realtime Notification Service** (`src/services/realtimeNotificationService.ts`)
- WebSocket-style service using Firebase Realtime Database
- Listens for incoming notifications in real-time
- Sends notifications to other chat participants
- Cleans up processed notifications automatically
- No polling required - instant delivery

### Flow

#### When a message is sent:

1. **Message Creation** (`chatService.sendMessage`)
   - Message is saved to Firestore
   - Chat's lastMessage is updated
   - Real-time notifications are sent to all other participants

2. **Notification Delivery** (`realtimeNotificationService.sendRealtimeNotification`)
   - Notification payload is written to Firebase Realtime Database
   - Path: `/notifications/{recipientId}/{notificationId}`
   - Includes: chatId, chatName, messageText, senderId, timestamp

3. **Notification Reception** (`realtimeNotificationService.initializeRealtimeNotifications`)
   - User's notification listener detects new notification
   - Notification is processed immediately
   - Notification is removed from the queue after processing

4. **Notification Display** (`notificationService.triggerMessageNotification`)
   - If user is viewing the chat → No notification (suppressed)
   - If app is in foreground → In-app banner is shown
   - If app is in background → Local notification is shown

### State Management

#### Active Chat Tracking
- `ChatScreen` sets `activeChatId` when entering a chat
- `activeChatId` is cleared when leaving the chat
- Notifications for the active chat are suppressed

#### Notification Queue
- Only one notification is shown at a time
- Additional notifications are queued
- Queue is processed sequentially with delays between notifications

## Key Features

### ✅ Expo Go Compatible
- Uses local notifications instead of push notifications
- No Expo push notification server required
- Works in development and production builds

### ✅ Real-time Delivery
- Firebase Realtime Database provides instant delivery
- WebSocket-like behavior without manual polling
- Automatic reconnection handling

### ✅ Smart Notification Suppression
- No notifications when viewing the chat
- Prevents duplicate notifications
- Respects app state (foreground vs background)

### ✅ User Experience
- Beautiful in-app banners with animations
- Tappable notifications to navigate to chat
- Auto-dismiss with manual dismiss option
- Sound and vibration support

### ✅ Offline Support
- Notifications queue automatically when offline
- Delivered when connection is restored
- Firebase handles reconnection automatically

## Implementation Details

### Firebase Realtime Database Structure
```
notifications/
  {userId}/
    {notificationId}/
      chatId: string
      chatName: string
      messageText: string
      senderId: string
      timestamp: number
```

### Notification Flow
1. User A sends a message to User B
2. `sendRealtimeNotification` writes to `/notifications/userB/{id}`
3. User B's app has a listener on `/notifications/userB`
4. Listener triggers immediately (WebSocket-style)
5. Notification is shown (banner or local)
6. Notification is removed from database after processing

### App Integration (`App.tsx`)
- Registers for local notification permissions on login
- Initializes real-time notification listener for logged-in user
- Displays `NotificationBanner` component at the root level
- Cleans up listeners on logout/unmount

### Chat Screen Integration
- Sets active chat ID when entering
- Clears active chat ID when leaving
- Prevents notifications for current chat

## Testing

### Testing In-App Banners
1. Open the app on Device A (login as User A)
2. Open the app on Device B (login as User B)
3. On Device B, navigate to a different chat (not User A's chat)
4. On Device A, send a message to User B
5. Device B should show an in-app banner at the top

### Testing Local Notifications
1. Open the app on Device A (login as User A)
2. Open the app on Device B (login as User B)
3. On Device B, press Home to background the app
4. On Device A, send a message to User B
5. Device B should show a system notification

### Testing Notification Suppression
1. Open the app on Device A (login as User A)
2. Open the app on Device B (login as User B)
3. On Device B, open the chat with User A
4. On Device A, send a message to User B
5. Device B should NOT show a notification (already in the chat)

## Security Considerations

### Firebase Realtime Database Rules
The notification queue is user-specific and should be protected:

```json
{
  "rules": {
    "notifications": {
      "$userId": {
        ".read": "$userId === auth.uid",
        ".write": "auth != null"
      }
    }
  }
}
```

- Users can only read their own notifications
- Any authenticated user can write notifications (to send to others)
- Notifications are automatically cleaned up after processing

## Performance

### Optimizations
- Notifications are removed immediately after processing
- Only one listener per user (efficient)
- No polling - uses WebSocket connections
- Minimal bandwidth usage (small payloads)
- Queue prevents notification spam

### Scalability
- Each user has their own notification queue
- Firebase handles millions of concurrent connections
- Automatic scaling without code changes
- No server-side code required

## Troubleshooting

### Notifications not showing
1. Check notification permissions are granted
2. Verify Firebase Realtime Database is enabled
3. Check console logs for errors
4. Verify user is logged in
5. Check app is not in Do Not Disturb mode

### In-app banner not appearing
1. Verify app is in foreground
2. Check that you're not viewing the active chat
3. Look for console logs starting with 🔔
4. Verify NotificationBanner is rendered in App.tsx

### Real-time delivery delayed
1. Check network connection
2. Verify Firebase Realtime Database connection
3. Look for console logs starting with 🔌
4. Test with simple messages first

## Future Enhancements

### Possible Improvements
- [ ] Add notification sounds customization
- [ ] Support notification images/avatars
- [ ] Add notification action buttons
- [ ] Implement notification grouping
- [ ] Add notification history
- [ ] Support rich media notifications
- [ ] Add notification preferences per chat
- [ ] Implement quiet hours

## Files Modified/Created

### Created Files
- `src/components/NotificationBanner.tsx` - In-app notification banner component
- `src/stores/notificationStore.ts` - Notification state management
- `src/services/realtimeNotificationService.ts` - WebSocket-style notification service

### Modified Files
- `src/services/notificationService.ts` - Updated for local notifications
- `src/services/chatService.ts` - Added notification sending on message
- `src/screens/ChatScreen.tsx` - Added active chat tracking
- `App.tsx` - Integrated notification system
- `database.rules.json` - Added notification queue rules (to be updated)

## Summary

This implementation provides a complete push notification simulation using local notifications and Firebase Realtime Database. It works seamlessly with Expo Go, provides instant delivery, and offers an excellent user experience with both in-app banners and system notifications.

The architecture is scalable, secure, and easy to maintain. It leverages Firebase's real-time capabilities to provide WebSocket-like functionality without the complexity of managing WebSocket connections manually.


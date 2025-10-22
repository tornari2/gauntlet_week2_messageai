# Testing Local Notifications & In-App Banners

This guide helps you test the new local notification system with in-app banners.

## Prerequisites

1. Two test devices or simulators
2. Two test accounts
3. Updated database rules deployed to Firebase

## Deploy Database Rules First

Before testing, deploy the updated Firebase Realtime Database rules:

```bash
cd /Users/michaeltornaritis/Desktop/WK2_MessageAI/gauntletai_week2_messageai
./deploy-database-rules.sh
```

Or manually:
```bash
firebase deploy --only database
```

## Test Scenarios

### Test 1: In-App Banner (App in Foreground, Different Chat)

**Setup:**
1. Device A: Login as User A
2. Device B: Login as User B
3. Device B: Navigate to a different chat (NOT User A's chat)

**Action:**
4. Device A: Send a message to User B

**Expected Result:**
- Device B shows an animated in-app banner at the top
- Banner displays "User A" as title and message text as body
- Banner auto-dismisses after 4 seconds
- Banner can be manually dismissed with X button
- Tapping banner navigates to the chat

**Console Logs:**
```
🔔 Showing in-app notification banner
📥 Firestore update for chat {chatId}: {n} messages
```

---

### Test 2: Local Notification (App in Background)

**Setup:**
1. Device A: Login as User A
2. Device B: Login as User B
3. Device B: Press Home button (app goes to background)

**Action:**
4. Device A: Send a message to User B

**Expected Result:**
- Device B shows a system notification
- Notification displays "User A" as title and message text as body
- Tapping notification opens the app

**Console Logs (when app is brought to foreground):**
```
📱 AppState change detected: background → active
📥 Firestore update for chat {chatId}: {n} messages
```

---

### Test 3: No Notification (Viewing Active Chat)

**Setup:**
1. Device A: Login as User A
2. Device B: Login as User B
3. Device B: Open chat with User A

**Action:**
4. Device A: Send a message to User B

**Expected Result:**
- Device B does NOT show a notification or banner
- Message appears instantly in the chat
- Message is automatically marked as read

**Console Logs:**
```
🔕 User is viewing this chat, no notification
📥 Firestore update for chat {chatId}: {n} messages
```

---

### Test 4: Real-time Delivery (WebSocket Simulation)

**Setup:**
1. Device A: Login as User A
2. Device B: Login as User B
3. Both devices connected to internet

**Action:**
4. Device A: Send multiple messages to User B quickly

**Expected Result:**
- Messages appear on Device B instantly (no delay)
- Notifications are queued and shown one at a time
- Each notification auto-dismisses before the next appears
- No notifications are missed

**Console Logs (Device B):**
```
🔌 Initializing real-time notifications for user: {userId}
📤 Sent real-time notification to user: {userId}
🔔 Showing in-app notification banner
📬 Adding notification to queue
```

---

### Test 5: Offline/Online Behavior

**Setup:**
1. Device A: Login as User A
2. Device B: Login as User B
3. Device B: Turn on Airplane Mode

**Action:**
4. Device A: Send a message to User B
5. Device B: Turn off Airplane Mode

**Expected Result:**
- Message syncs when Device B comes back online
- Notification is triggered immediately after sync
- No duplicate notifications

**Console Logs (Device B):**
```
📴 Device is offline
🔌 Connection restored
📥 Firestore update for chat {chatId}: {n} messages
🔔 Showing notification
```

---

### Test 6: Group Chat Notifications

**Setup:**
1. Create a group chat with User A, User B, and User C
2. Device A: Login as User A
3. Device B: Login as User B
4. Device C: Login as User C
5. Device B & C: Navigate away from the group chat

**Action:**
6. Device A: Send a message to the group

**Expected Result:**
- Device B shows banner: "User A in Group Name"
- Device C shows banner: "User A in Group Name"
- Device A receives no notification (sender)

**Console Logs (Device B & C):**
```
🔔 Showing in-app notification banner
Title: User A in Group Name
Body: {message text}
```

---

### Test 7: Notification Permissions

**Setup:**
1. Fresh install or clear app data
2. Login as User A

**Action:**
3. Observe notification permission request
4. Grant or deny permissions

**Expected Result:**
- Permission dialog appears on first launch after login
- If granted: ✅ Local notifications registered successfully
- If denied: ❌ Local notification permissions denied
- In-app banners work regardless (don't require permissions)

**Console Logs:**
```
✅ Local notifications registered successfully
or
❌ Local notification permissions denied
```

---

## Debugging

### Check Notification Listener Status

Add this temporary code to verify the listener is active:

```typescript
// In App.tsx, after initializeRealtimeNotifications
console.log('🔌 Real-time notification listener active');
```

### Check Active Chat ID

Add this to ChatScreen to verify active chat tracking:

```typescript
// In ChatScreen.tsx, in the setActiveChatId useEffect
console.log('📍 Active chat set to:', chatId);
```

### Check Notification Queue

Add this to notificationStore to see queue state:

```typescript
// In notificationStore.ts, in showNotification
console.log('Queue length:', get().notificationQueue.length);
```

### Test Firebase Realtime Database Directly

Use Firebase Console to check the notifications queue:
1. Go to Firebase Console
2. Select your project
3. Go to Realtime Database
4. Navigate to `/notifications/{userId}`
5. You should see notifications appear and disappear as they're processed

## Common Issues

### Issue: No notifications appear
**Solution:**
1. Check that Firebase Realtime Database is enabled
2. Verify database rules are deployed
3. Check console for errors
4. Verify user is logged in
5. Test with simple message first

### Issue: Banner appears but local notification doesn't
**Solution:**
1. Check notification permissions are granted
2. Test on a physical device (not simulator)
3. Check app is actually in background
4. Verify sound/notifications not muted

### Issue: Notifications delayed
**Solution:**
1. Check network connection
2. Look for reconnection messages in console
3. Verify Firebase connection is active
4. Test with faster internet connection

### Issue: Duplicate notifications
**Solution:**
1. Check that notification is removed from queue after processing
2. Verify only one listener is active (check console logs)
3. Check for multiple app instances

## Performance Testing

### Test Network Efficiency
1. Send 10 messages quickly
2. Check network tab in browser dev tools
3. Verify minimal bandwidth usage
4. Check notification delivery speed

### Test Battery Usage
1. Run app for 1 hour with notifications
2. Check battery usage in device settings
3. Should be minimal (WebSocket is efficient)

## Next Steps After Testing

Once testing is complete:
1. ✅ Verify all test scenarios pass
2. ✅ Check console logs for errors
3. ✅ Test on multiple devices/platforms
4. ✅ Document any issues or edge cases
5. ✅ Consider additional features (sounds, images, etc.)

## Cleanup

Remember to remove any temporary debug logging before committing.


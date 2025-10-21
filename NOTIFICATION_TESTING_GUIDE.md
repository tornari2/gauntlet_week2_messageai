# Push Notification Testing Guide - PR #10

## 🚨 Important: Physical Device Required

Push notifications **DO NOT work in simulators**. You must test on a physical iOS or Android device with Expo Go installed.

## Quick Start Testing

### Step 1: Run the App on Physical Device

```bash
cd /Users/michaeltornaritis/Desktop/WK2_MessageAI/gauntletai_week2_messageai
npx expo start
```

**On your phone:**
- **iOS**: Open Camera app → Scan QR code → Opens in Expo Go
- **Android**: Open Expo Go → Tap "Scan QR Code" → Scan QR code

### Step 2: Login and Get Push Token

1. Launch the app on your device
2. Login or create an account
3. Watch the terminal/console for this message:
   ```
   Push token: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
   ```
4. **Copy this token** - you'll need it for testing!

### Step 3: Test Notifications

You have two options:

## Option A: Use Expo's Push Notification Tool (Easiest)

1. Go to **https://expo.dev/notifications**

2. Enter your push token (from Step 2)

3. Fill in the notification:
   ```
   Title: Test Notification
   Message: Hello from MessageAI!
   ```

4. Add data payload (JSON):
   ```json
   {
     "chatId": "test-chat-123",
     "chatName": "Test Chat"
   }
   ```

5. Click **"Send a Notification"**

6. Check your phone!

## Option B: Use curl Command

```bash
curl -H "Content-Type: application/json" \
  -X POST "https://exp.host/--/api/v2/push/send" \
  -d '{
    "to": "ExponentPushToken[YOUR_TOKEN_HERE]",
    "title": "New Message",
    "body": "John: Hey, how are you?",
    "data": {
      "chatId": "chat123",
      "chatName": "John Doe"
    },
    "sound": "default",
    "badge": 1
  }'
```

Replace `YOUR_TOKEN_HERE` with your actual token.

## What to Test

### Test 1: Foreground Notification (App Open)

**Steps:**
1. Keep app open and visible
2. Send a test notification
3. **Expected**: Banner appears at top of screen
4. **Expected**: Notification auto-dismisses after a few seconds
5. **Expected**: Console logs: "Notification received in foreground"

**✅ Pass if:** Banner shows with correct title/message

### Test 2: Background Notification (App Minimized)

**Steps:**
1. Minimize app (press home button)
2. Send a test notification
3. **Expected**: Notification appears in notification tray
4. **Expected**: Shows notification icon and text

**✅ Pass if:** Notification visible in tray

### Test 3: Deep Linking (Tap Notification)

**Steps:**
1. Send notification with chatId in data
2. Tap the notification
3. **Expected**: App opens
4. **Expected**: Navigates to specific chat
5. **Expected**: Console logs: "Navigate to chat: [chatId]"

**✅ Pass if:** Opens correct chat screen

### Test 4: Cold Start Navigation

**Steps:**
1. **Force quit the app** (swipe up from app switcher)
2. Send a test notification
3. Tap notification from lock screen
4. **Expected**: App launches
5. **Expected**: Navigates directly to chat

**✅ Pass if:** App starts and opens chat

### Test 5: Permission Denial

**Steps:**
1. Uninstall app
2. Reinstall app
3. Login
4. When permission dialog appears, tap "Don't Allow"
5. **Expected**: Console logs: "Failed to get push token"
6. **Expected**: App continues working normally

**✅ Pass if:** No crashes, app works without notifications

### Test 6: Multiple Notifications

**Steps:**
1. Send 3-5 notifications quickly
2. **Expected**: All appear in notification tray
3. Tap one notification
4. **Expected**: Opens to correct chat

**✅ Pass if:** Can handle multiple notifications

## Troubleshooting

### "Must use physical device for Push Notifications"

**Problem:** Running in simulator
**Solution:** Use physical device with Expo Go

### No push token appears in console

**Problem:** Permission denied or not logged in
**Solutions:**
- Make sure you're logged in
- Check if permission was granted
- Restart app and login again
- Check device settings → Notifications → Expo Go

### Notification not appearing

**Possible causes:**
1. **Wrong token** - Copy token exactly, including brackets
2. **Permission denied** - Check notification settings
3. **Network issue** - Check internet connection
4. **App not running** - Make sure app is installed

**Debug steps:**
```bash
# Check if token is valid (should return success)
curl -X POST "https://exp.host/--/api/v2/push/send" \
  -H "Content-Type: application/json" \
  -d '{"to":"YOUR_TOKEN","title":"Test","body":"Test"}'
```

### Notification received but deep link not working

**Check:**
1. Did you include `chatId` in data?
2. Is the chatId valid?
3. Check console for navigation errors

**Fix:** Ensure data payload includes:
```json
{
  "chatId": "valid-chat-id",
  "chatName": "Chat Name"
}
```

### Permission dialog doesn't appear

**On iOS:**
- Settings → Expo Go → Notifications → Allow
- Uninstall and reinstall app to see dialog again

**On Android:**
- Settings → Apps → Expo Go → Notifications → Enable
- Android 13+ auto-grants notification permission

## Testing Checklist

- [ ] App runs on physical device
- [ ] User can login successfully
- [ ] Push token appears in console
- [ ] Token copied correctly
- [ ] Can send notification via Expo tool
- [ ] Foreground notification shows banner
- [ ] Background notification appears in tray
- [ ] Tapping notification opens app
- [ ] Deep linking navigates to correct chat
- [ ] Cold start navigation works
- [ ] Multiple notifications handled correctly
- [ ] Permission denial handled gracefully

## Expected Console Output

### On Login
```
Registering for push notifications...
Push token: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
Storing push token in Firestore...
Push token stored successfully
```

### On Notification Received (Foreground)
```
Notification received in foreground: {
  request: {
    content: {
      title: "Test Notification",
      body: "Hello!",
      data: { chatId: "chat123" }
    }
  }
}
```

### On Notification Tapped
```
Notification tapped: {...}
Navigate to chat: chat123
```

## Common Test Scenarios

### Scenario 1: New Message Notification
```json
{
  "to": "ExponentPushToken[...]",
  "title": "John Doe",
  "body": "Hey, are you free today?",
  "data": {
    "chatId": "chat-abc-123",
    "chatName": "John Doe",
    "senderId": "user-456",
    "messageId": "msg-789"
  },
  "sound": "default",
  "badge": 1
}
```

### Scenario 2: Group Message Notification
```json
{
  "to": "ExponentPushToken[...]",
  "title": "Engineering Team",
  "body": "Sarah: Meeting at 3pm today",
  "data": {
    "chatId": "group-xyz-789",
    "chatName": "Engineering Team",
    "senderId": "user-sarah",
    "isGroup": true
  },
  "sound": "default",
  "badge": 5
}
```

### Scenario 3: Multiple Unread Messages
```json
{
  "to": "ExponentPushToken[...]",
  "title": "3 new messages",
  "body": "You have unread messages",
  "data": {
    "chatId": "chat-123",
    "chatName": "John Doe"
  },
  "badge": 3
}
```

## Performance Testing

### Test Load
Send 10 notifications in quick succession:

```bash
for i in {1..10}; do
  curl -X POST "https://exp.host/--/api/v2/push/send" \
    -H "Content-Type: application/json" \
    -d "{\"to\":\"YOUR_TOKEN\",\"title\":\"Test $i\",\"body\":\"Message $i\"}"
  echo "Sent notification $i"
done
```

**Expected:** All notifications delivered within 1-2 seconds

## Integration with Firebase (Future)

Once you set up a Cloud Function, test automatic notifications:

1. Open app on Device A (User A logged in)
2. Open app on Device B (User B logged in)
3. User A sends message to User B
4. **Expected:** User B receives push notification
5. User B taps notification
6. **Expected:** Opens to chat with User A

## Known Limitations in Expo Go

✅ **Works:**
- Basic push notifications
- Title, body, data
- Foreground/background
- Notification tap handling
- Deep linking
- Badge numbers
- Default sounds

❌ **Doesn't Work:**
- Custom notification sounds
- Rich notifications (images)
- Notification actions (buttons)
- Android notification channels (custom)
- Category-specific settings

## Next Steps After Testing

1. **If all tests pass:** Commit PR #10! ✅
2. **If issues found:** Debug and fix
3. **For production:** Consider EAS Build for advanced features
4. **For automation:** Implement Firebase Cloud Function

## Need Help?

### Check Logs
```bash
# In terminal where expo is running
# All logs will appear here including:
# - Push token
# - Notification received
# - Navigation events
```

### Verify Token Format
```
✅ Correct: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
❌ Wrong:   xxxxxxxxxxxxxxxxxxxxxx (missing prefix)
❌ Wrong:   ExponentPushToken (missing token)
```

### Test Token Validity
Use Expo's notification tool first - if it works there, your token is valid!

## Success Criteria

✅ **PR #10 is successful if:**
1. Push token obtained on login
2. Token stored in Firestore
3. Notifications received when sent
4. Tapping notification opens chat
5. Works on both iOS and Android
6. No crashes or errors
7. Graceful handling of permission denial

---

**Ready to test!** Follow the steps above and let me know what you discover! 🚀


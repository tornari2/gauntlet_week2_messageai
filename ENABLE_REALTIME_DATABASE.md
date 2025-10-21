# Enable Firebase Realtime Database for Presence System

## Why This is Needed

The app now uses Firebase Realtime Database for presence tracking (online/offline status) because:
- **Automatic disconnect detection**: Realtime Database's `onDisconnect()` automatically sets users offline when their connection drops
- **More reliable**: Detects disconnections even when the app is force-closed or the device loses connection
- **Firestore limitation**: Firestore doesn't have an equivalent feature for automatic disconnect handling

The presence data is also mirrored to Firestore so existing code continues to work.

## Steps to Enable Realtime Database

### 1. Go to Firebase Console
- Visit https://console.firebase.google.com
- Select your project: **wk2-messageai-9b5ce** (or your project ID)

### 2. Enable Realtime Database
1. In the left sidebar, click **"Build"** → **"Realtime Database"**
2. Click **"Create Database"**
3. Choose a location:
   - **Recommended**: `us-central1` (or the same region as your Firestore)
4. For **security rules**, select **"Start in locked mode"** (we'll set custom rules next)
5. Click **"Enable"**

### 3. Set Up Security Rules
1. In the Realtime Database console, click the **"Rules"** tab
2. Replace the default rules with the following:

```json
{
  "rules": {
    "status": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

**What these rules do:**
- Anyone can **read** any user's status (needed to see if others are online)
- Users can only **write** to their own status (security: `$uid === auth.uid`)
- All other paths are denied by default

3. Click **"Publish"**

### 4. Verify the Database URL
After creating the database, verify that the URL matches the format in `firebase.ts`:
```
https://wk2-messageai-9b5ce-default-rtdb.firebaseio.com
```

If your project is in a different region (e.g., Europe or Asia), the URL might be:
```
https://wk2-messageai-9b5ce-default-rtdb.europe-west1.firebasedatabase.app
```

If the URL is different, update `src/services/firebase.ts`:
```typescript
databaseURL: 'https://YOUR-PROJECT-ID-default-rtdb.YOUR-REGION.firebasedatabase.app',
```

## How It Works

### Presence Flow
1. **User logs in**: 
   - `setupPresence()` is called
   - Sets user status to "online" in Realtime Database
   - Mirrors status to Firestore
   - Sets up `onDisconnect()` handler

2. **User goes offline**:
   - If connection drops unexpectedly (app closed, network lost):
     - Realtime Database **automatically** sets status to "offline"
     - Change is mirrored to Firestore
   - If app goes to background normally:
     - `updatePresence()` explicitly sets status to "offline"

3. **Other users see the update**:
   - Real-time listeners in Firestore detect the status change
   - Online indicators update immediately

### Data Structure
```
Realtime Database:
/status/
  /{userId}/
    state: "online" | "offline"
    last_changed: timestamp

Firestore (mirrored):
/users/{userId}
  isOnline: boolean
  lastSeen: timestamp
```

## Testing

After enabling Realtime Database:

1. **Restart your app** (both emulator and physical device)
2. **Test normal background**: Put app in background → should show offline
3. **Test force close**: 
   - Force quit the emulator app
   - Wait 5-10 seconds
   - Check the other device → should show offline ✅
4. **Test network disconnect**: 
   - Turn off Wi-Fi on one device
   - Wait 5-10 seconds
   - Check the other device → should show offline ✅

## Troubleshooting

### Error: "Permission denied"
- Make sure you published the security rules
- Verify that users are authenticated before accessing presence data

### Error: "Database URL is invalid"
- Check that your database URL matches the format in `firebase.ts`
- Update `databaseURL` if your region is different

### Status not updating when force-closing
- Wait 5-10 seconds (Firebase needs time to detect the disconnect)
- Check that Realtime Database is enabled and rules are set
- Verify the database URL is correct

### "FIREBASE WARNING: Using an unspecified index"
- This is normal and won't affect functionality
- Realtime Database doesn't require explicit indexes like Firestore

## Files Modified

- `src/services/firebase.ts` - Added Realtime Database initialization
- `src/services/presenceService.ts` - New service for presence management
- `App.tsx` - Uses `setupPresence()` instead of manual status updates
- `src/services/authService.ts` - Uses `setUserOffline()` on logout
- `database.rules.json` - Security rules for Realtime Database

## Cost Considerations

Realtime Database usage for presence is **extremely minimal**:
- Each user has ~10 bytes of presence data
- Updates happen only on connect/disconnect/app state changes
- Most apps will stay well within the free tier:
  - **Free tier**: 1 GB stored, 10 GB/month downloaded
  - **Presence system**: Uses ~1 KB per 100 users

## Next Steps

After enabling Realtime Database:
1. ✅ Restart the development server
2. ✅ Test presence on both devices
3. ✅ Verify automatic offline detection works
4. Deploy updated firestore.rules and database.rules.json to production


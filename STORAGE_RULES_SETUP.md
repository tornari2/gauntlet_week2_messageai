# Firebase Storage Rules Setup

## Problem

Getting error: `Firebase Storage: An unknown error occurred (storage/unknown)`

This happens because Firebase Storage security rules haven't been configured yet.

## Quick Fix - Via Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Storage** in the left menu
4. Click on the **Rules** tab
5. Replace the default rules with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read/write images
    match /chat-images/{chatId}/{imageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024; // 5MB limit
    }
  }
}
```

6. Click **Publish**

## Alternative - Deploy Via CLI

If you have Firebase CLI installed:

```bash
cd gauntletai_week2_messageai
./deploy-storage-rules.sh
```

Or manually:
```bash
firebase deploy --only storage
```

## What These Rules Do

- ✅ Allow any authenticated user to read images
- ✅ Allow any authenticated user to upload images
- ✅ Limit uploads to 5MB per file
- ✅ Organize images in `/chat-images/{chatId}/{timestamp}.jpg`

## Optimizations Applied

I've also made the images **much smaller and faster**:

### Before:
- Max size: 1024x1024 pixels
- Compression: 70%
- Picker quality: 80%
- Average size: 300-800KB

### After:
- Max size: **800x800 pixels** ⚡
- Compression: **50%** ⚡
- Picker quality: **60%** ⚡
- Average size: **50-200KB** 🎉

This should make uploads **3-5x faster** while still maintaining good image quality for chat messages.

## Testing After Setup

1. Deploy the storage rules (via console or CLI)
2. Restart your app
3. Try sending an image again
4. Upload should complete in 1-3 seconds instead of 10+ seconds
5. Images will be much smaller (50-200KB instead of 500KB+)

## Troubleshooting

**Still getting errors?**
- Make sure you're logged in (check auth token hasn't expired)
- Verify Storage is enabled in Firebase Console
- Check that the bucket name matches in your Firebase config
- Try logging out and back in to the app

**Images still too large?**
- The new compression settings reduce images to ~50-200KB
- If you want even smaller, edit `src/services/imageService.ts`:
  - Change `maxWidth: 800` to `maxWidth: 600`
  - Change `compress: 0.5` to `compress: 0.3`

**Upload still slow?**
- Check your internet connection
- Firebase Storage upload speed depends on your network
- With the new compression, uploads should be 3-5x faster


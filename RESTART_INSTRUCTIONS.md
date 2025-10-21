# How to Restart the App with Clean Cache

The code is correct, but you need to clear the cache to pick up the changes.

## Steps:

### 1. Stop the current Expo/Metro bundler
Press `Ctrl+C` in the terminal where `npx expo start` is running

### 2. Clear all caches
Run these commands:

```bash
# Navigate to the project directory
cd /Users/michaeltornaritis/Desktop/WK2_MessageAI/gauntletai_week2_messageai

# Clear Expo cache
npx expo start --clear

# If that doesn't work, do a deeper clean:
rm -rf node_modules/.cache
rm -rf .expo
npx expo start --clear
```

### 3. Reload the app
Once Metro bundler starts:
- Press `i` for iOS simulator
- Or scan the QR code on your device
- When the app loads, shake the device and select "Reload"

## Why This Is Needed

Metro bundler (React Native's JavaScript bundler) caches compiled modules. When we changed the Firebase initialization code, the old cached version was still being used, causing the "Component auth has not been registered yet" error even though our code is now correct.

## What to Expect After Restart

✅ No "Component auth has not been registered yet" error
✅ Firebase initializes successfully
✅ You can sign up and log in
✅ Messages work
⚠️  Warning about auth persistence (expected and safe to ignore)

## If It Still Doesn't Work

Try a complete clean and reinstall:

```bash
cd /Users/michaeltornaritis/Desktop/WK2_MessageAI/gauntletai_week2_messageai

# Stop any running processes first!

# Remove all build artifacts and caches
rm -rf node_modules
rm -rf .expo
rm -rf ios/Pods
rm -rf ios/build
rm package-lock.json

# Reinstall everything
npm install

# Start fresh
npx expo start --clear
```


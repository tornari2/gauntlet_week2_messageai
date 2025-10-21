# Bug Fixes - Auth & Firestore Issues

## Date: October 21, 2025

### Critical Bug Fixed: ❌ → ✅

**Issue**: `Unsupported field value: undefined (found in field photoURL in document users/...)`

**Root Cause**: 
Firestore doesn't accept `undefined` values - it requires `null` for nullable fields. The code was setting `photoURL: undefined` and `pushToken: undefined` which caused Firestore writes to fail.

**Files Fixed**:
- `src/services/authService.ts`

**Changes Made**:
1. Line 41, 44, 53, 62, 291, 294: Changed all instances of `|| undefined` to `|| null`
2. Updated `getUserData()` function
3. Updated `getAllUsers()` function  
4. Updated user document creation in error handler

**Before**:
```typescript
photoURL: firebaseUser.photoURL || undefined,
pushToken: data.pushToken || undefined,
```

**After**:
```typescript
photoURL: firebaseUser.photoURL || null,
pushToken: data.pushToken || null,
```

### Improved: Firestore Persistence Warning

**Issue**: 
```
Error using user provided cache. Falling back to memory cache: 
FirebaseError: [code=unimplemented]: IndexedDB persistence is only 
available on platforms that support LocalStorage.
```

**Status**: 
This is **expected behavior** on React Native. IndexedDB is a web API not available on mobile.

**Changes Made**:
- Changed console.warn to console.log to reduce noise
- Updated message to clarify this is "React Native default" behavior
- Firestore still works fine with memory cache

### Auth Error Handling

The `auth/invalid-credential` errors are expected when:
- User enters wrong password
- User tries to login before creating account
- Credentials don't match

**What to do**:
1. Make sure you're **signing up first** (not logging in)
2. Use valid email format: `user@example.com`
3. Password must be at least 6 characters

## Testing Instructions

Now the app should work correctly! Try this flow:

### Create Two Test Accounts:

**Simulator 1 (iPhone 16e)**:
1. Tap "Sign Up"
2. Email: `alice@test.com`
3. Password: `password123`
4. Display Name: `Alice`
5. Tap "Sign Up" button

**Simulator 2 (iPhone 17 Pro)**:
1. Open second simulator: `xcrun simctl boot "iPhone 17 Pro"`
2. In Expo terminal: Press `Shift + i` → Select iPhone 17 Pro
3. Tap "Sign Up"
4. Email: `bob@test.com`
5. Password: `password123`
6. Display Name: `Bob`
7. Tap "Sign Up" button

### Test Chat Feature:

**Back on Simulator 1 (Alice)**:
1. Tap the green **[+]** button (bottom-right)
2. You should see "Bob" in the user list! ✅
3. Tap "Bob"
4. Type a message: "Hi Bob!"
5. Press send

**On Simulator 2 (Bob)**:
1. Chat with Alice should appear automatically
2. You should see "Hi Bob!" in real-time! ⚡

## Files Modified:
- ✅ `src/services/authService.ts` - Fixed `undefined` → `null` (6 locations)
- ✅ `src/services/firebase.ts` - Improved warning message

## Status: All Critical Bugs Fixed! 🎉

The app should now work correctly for:
- ✅ User signup
- ✅ User login
- ✅ Viewing other users
- ✅ Creating chats
- ✅ Real-time messaging


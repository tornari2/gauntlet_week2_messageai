# User Profile Offline Error Fix

## Problem
When offline and navigating to the User Profile screen, user was seeing an error:
```
"Error loading user color, load bundle from server request error could not load bundle."
```

## Root Cause
The `UserProfileScreen` component was using a dynamic import to load `getDoc` from Firebase:

```typescript
const userDoc = await import('firebase/firestore').then(({ getDoc }) => 
  getDoc(userRef)
);
```

**Why this caused the error:**
- Dynamic imports (`import()`) try to load code from the server
- When offline, this fails with "load bundle from server" error
- The error was logged even though offline behavior is expected

## Solution

### 1. Fixed Import Statement
Changed from dynamic import to static import at the top of the file:

**Before:**
```typescript
import { doc, updateDoc } from 'firebase/firestore';

// Later in the code:
const userDoc = await import('firebase/firestore').then(({ getDoc }) => 
  getDoc(userRef)
);
```

**After:**
```typescript
import { doc, updateDoc, getDoc } from 'firebase/firestore';

// Later in the code:
const userDoc = await getDoc(userRef);
```

### 2. Suppressed Expected Offline Errors
Modified error handling in `loadUserColor()` to only log unexpected errors:

```typescript
catch (error: any) {
  // Only log non-offline errors
  if (error?.code !== 'unavailable' && 
      !error?.message?.includes('offline') &&
      !error?.message?.includes('load bundle')) {
    console.error('Error loading user color:', error);
  }
  // Use default color on error (already set in state)
}
```

**Result**: Offline errors are handled silently, using the default color

### 3. Enhanced Save Function
Updated `handleSave()` to provide user-friendly messaging when offline:

```typescript
catch (error: any) {
  console.error('Error updating profile:', error);
  
  // Check if offline
  if (error?.code === 'unavailable' || 
      error?.message?.includes('offline') ||
      error?.message?.includes('network')) {
    Alert.alert(
      'Offline', 
      'You are currently offline. Your changes will be saved when you reconnect to the internet.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  } else {
    Alert.alert('Error', 'Failed to update profile. Please try again.');
  }
}
```

**Benefits**:
- User gets clear feedback about offline state
- No scary error messages
- They understand changes will sync later

## Files Modified

**`src/screens/UserProfileScreen.tsx`**

### Changes:
1. **Line 23**: Added `getDoc` to imports
2. **Lines 60-85**: Fixed `loadUserColor()` function
   - Removed dynamic import
   - Added offline error suppression
3. **Lines 87-133**: Enhanced `handleSave()` function
   - Added offline detection
   - User-friendly offline message

## User Experience

### Before
**Online:**
- ✅ Profile loads correctly
- ✅ Can save changes

**Offline:**
- ❌ Error: "load bundle from server request error"
- ❌ Scary technical error message

### After
**Online:**
- ✅ Profile loads correctly
- ✅ Can save changes

**Offline:**
- ✅ Profile loads with default color (no error!)
- ✅ If user tries to save: Friendly message about being offline
- ✅ Changes will sync when back online (Firestore offline persistence)

## How Firestore Offline Persistence Works

### Loading Data (`getDoc`)
1. **Online**: Fetches from server, caches result
2. **Offline**: Uses cached data (if available), otherwise fails gracefully

### Saving Data (`updateDoc`)
1. **Online**: Saves to server immediately
2. **Offline**: Queues the write locally, syncs when connection restored

### For User Profile:
- **Load**: Uses cached color or falls back to default (Green #25D366)
- **Save**: Firestore will automatically sync changes once online

## Testing

1. **Go to Profile (Online)**:
   - ✅ Should load your saved color
   - ✅ Changes save immediately

2. **Go to Profile (Offline)**:
   - ✅ Should load default color (no error message)
   - ✅ Can still change color/name
   - ✅ Saving shows: "Your changes will be saved when you reconnect"

3. **Go back Online**:
   - ✅ Firestore automatically syncs queued changes
   - ✅ Profile updates across all devices

## Technical Details

### Why Dynamic Import Failed
- `import()` is meant for code-splitting (loading JS modules on demand)
- It's a network request that requires server access
- Not suitable for offline-first apps
- Should use static imports for critical dependencies

### Static vs Dynamic Imports
```typescript
// Static Import (loads at app start)
import { getDoc } from 'firebase/firestore';  ✅ Works offline

// Dynamic Import (loads on demand)
const { getDoc } = await import('firebase/firestore');  ❌ Fails offline
```

### Error Types
- `unavailable`: Firestore's offline error code
- "offline": Common in error messages
- "load bundle": Specific to dynamic import failures
- "network": Network-related failures

All of these are now handled gracefully!

---

**Key Takeaway**: Always use static imports for critical dependencies like Firebase functions. Dynamic imports should only be used for truly optional features that can fail gracefully.


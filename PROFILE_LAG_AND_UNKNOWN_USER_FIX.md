# Profile Lag & Group Chat "Unknown User" Fix

## Problems

### 1. Profile Page Lag When Offline
- Profile screen showed loading spinner for several seconds when offline
- Changing name/color was laggy
- Poor user experience

### 2. Group Chat "Unknown User"
- One or more participants showing as "Unknown User" even though they were previously cached
- Participant names disappearing from the top banner
- Issue persisted even after implementing cache loading

## Root Causes

### Problem 1: Blocking UI Load
The `loadUserColor()` function was setting `loading` state to `true` and waiting for Firestore:

```typescript
setLoading(true); // Shows loading spinner, blocks entire UI
const userDoc = await getDoc(userRef); // Takes time when offline
setLoading(false);
```

**Result**: User had to wait for Firestore timeout before seeing the profile screen.

### Problem 2: Race Conditions in State Updates
The `loadParticipantsFromCache()` function had multiple issues:

1. **Sequential state updates**: Used a `for` loop with individual `setParticipantUsers` calls
2. **Race condition**: Real-time `onSnapshot` listeners fired before cache load completed
3. **State overwriting**: Multiple rapid state updates caused participants to disappear

```typescript
// BAD: Multiple state updates in sequence
for (const uid of participantIds) {
  const userSnap = await getDoc(userDocRef);
  setParticipantUsers(prev => [...prev, user]); // State update 1
}
// Meanwhile, onSnapshot fires...
setParticipantUsers(prev => [...prev, user]); // State update 2 (overwrites!)
```

## Solutions

### Fix 1: Non-Blocking Profile Load

**Changed**: Made `loadUserColor()` load silently in the background without showing loading state.

**Before:**
```typescript
const loadUserColor = async () => {
  setLoading(true); // BLOCKS UI
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    setSelectedColor(data.avatarColor);
  }
  setLoading(false);
};
```

**After:**
```typescript
const loadUserColor = async () => {
  // Don't show loading state - load silently in background
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    setSelectedColor(data.avatarColor);
  }
  // No loading spinner, UI is immediately interactive
};
```

**Benefits**:
- Profile page loads instantly
- User can interact immediately
- Color loads from cache in background
- Smooth, responsive experience

### Fix 2: Batch Participant Loading

**Changed**: Load ALL participants in parallel, then set state ONCE.

**Before:**
```typescript
const loadParticipantsFromCache = async () => {
  for (const uid of participantIds) {
    const userSnap = await getDoc(userDocRef);
    setParticipantUsers(prev => [...prev, user]); // Multiple state updates!
  }
};
```

**After:**
```typescript
const loadParticipantsFromCache = async () => {
  const loadedParticipants = [];
  
  // Load all participants in parallel
  await Promise.all(
    participantIds.map(async (uid) => {
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        loadedParticipants.push({
          uid: userSnap.id,
          displayName: data.displayName || 'Unknown User',
          // ... other fields
        });
      }
    })
  );
  
  // Set all participants at once (prevents race conditions)
  setParticipantUsers(loadedParticipants);
};
```

**Benefits**:
- **Parallel loading**: All participants load simultaneously (faster!)
- **Single state update**: No race conditions
- **Atomic operation**: All names appear together
- **No flickering**: Prevents "Unknown User" appearing then disappearing

### Fix 3: Real-Time Listeners Only Update

**Changed**: `onSnapshot` listeners now only UPDATE existing participants, not add new ones.

**Before:**
```typescript
onSnapshot(userDocRef, (docSnap) => {
  setParticipantUsers(prev => {
    const others = prev.filter(u => u.uid !== uid);
    return [...others, newUser]; // Always adds, even if not in cache yet
  });
});
```

**After:**
```typescript
onSnapshot(userDocRef, (docSnap) => {
  setParticipantUsers(prev => {
    const existing = prev.find(u => u.uid === uid);
    if (!existing) {
      console.log('onSnapshot fired but user not loaded from cache yet');
      return prev; // Don't add yet, wait for cache load
    }
    
    const others = prev.filter(u => u.uid !== uid);
    return [...others, updatedUser]; // Only update existing
  });
});
```

**Benefits**:
- Cache load is the "source of truth" for initial data
- Real-time listeners only provide updates
- No more race conditions between cache and real-time data

## Files Modified

### 1. `src/screens/UserProfileScreen.tsx`

**Lines 48, 60-83**: Removed blocking loading state from `loadUserColor()`
- Removed `setLoading(true)` and `setLoading(false)`
- Profile loads instantly without waiting for Firestore
- Color loads in background

### 2. `src/screens/ChatScreen.tsx`

**Lines 119-178**: Refactored `loadParticipantsFromCache()`
- Changed from sequential `for` loop to parallel `Promise.all()`
- Load all participants into array first
- Single `setParticipantUsers()` call at the end
- Added detailed logging

**Lines 187-223**: Updated `onSnapshot` listeners
- Check if participant exists before updating
- Prevent adding users before cache loads
- Only update existing entries

## User Experience

### Profile Page
**Before:**
- Offline: Loading spinner for 3-5 seconds ⏳
- Laggy interactions

**After:**
- Offline: Loads instantly! ✅
- Smooth, responsive
- Color loads in background

### Group Chat
**Before:**
- "Unknown User" appearing randomly
- Names flickering or disappearing
- Only 1 participant visible sometimes

**After:**
- All participants load immediately from cache ✅
- Real names show even when offline
- No flickering or disappearing names
- Yellow status dots when offline

## Technical Details

### Why Parallel Loading is Faster
```typescript
// Sequential (slow): 100ms × 3 users = 300ms
for (const uid of users) {
  await getDoc(uid); // Wait for each
}

// Parallel (fast): max(100ms, 100ms, 100ms) = 100ms
await Promise.all(
  users.map(uid => getDoc(uid)) // All at once!
);
```

### Why Single State Update Prevents Race Conditions
```typescript
// BAD: Multiple updates can interleave
setParticipantUsers([user1]); // Update 1
// onSnapshot fires here!
setParticipantUsers(prev => [...prev, user2]); // Update 2 (might overwrite!)

// GOOD: One atomic update
const users = [user1, user2, user3];
setParticipantUsers(users); // One update, no race
```

## Testing

1. **Profile Page (Offline)**:
   - ✅ Opens instantly, no loading spinner
   - ✅ Can immediately change name/color
   - ✅ Default color shows if not cached

2. **Group Chat (Offline)**:
   - ✅ All participant names appear in header
   - ✅ No "Unknown User" (if previously cached)
   - ✅ All yellow status dots
   - ✅ No flickering or disappearing names

3. **Group Chat (Online)**:
   - ✅ Names load from cache first
   - ✅ Real-time updates still work
   - ✅ Status indicators update correctly

---

**Key Takeaway**: When loading data, always batch your state updates and load in parallel when possible. Sequential updates + async operations = race conditions!


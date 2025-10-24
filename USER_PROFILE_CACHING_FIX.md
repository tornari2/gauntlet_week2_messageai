# User Profile Caching Fix

## Issues Fixed

1. **Unknown User in Group Chat (Offline)**: When joining a group chat on airplane mode, users were seeing "Unknown User" instead of the actual user names like "test user 2"
2. **Missing Users in Selection Screen**: When creating a new chat offline, users were not appearing in the user selection screen

## Root Cause

The app was only caching **messages** but not **user profiles**. When offline:
- User profiles were not available in AsyncStorage
- Firestore's local cache only works if the data was previously loaded while online
- If a user never opened a chat with someone while online, that user's profile wouldn't be in Firestore's cache

## Solution

Added comprehensive user profile caching to AsyncStorage that works alongside Firestore's cache:

### 1. Storage Service Updates (`storageService.ts`)

Added three new functions for user profile caching:

```typescript
// Cache multiple user profiles
cacheUserProfiles(users: User[]): Promise<void>

// Get all cached user profiles
getCachedUserProfiles(): Promise<User[]>

// Get a specific user profile by ID
getCachedUserProfile(userId: string): Promise<User | null>
```

**Features:**
- Merges new profiles with existing cache (updates without losing data)
- Serializes/deserializes dates properly
- Handles errors gracefully (caching failures don't crash the app)
- Cleared on logout for privacy

### 2. Auth Service Updates (`authService.ts`)

Updated `getAllUsers()` to cache users when loaded online:

**Online:**
- Loads users from Firestore
- Caches them to AsyncStorage for offline access
- Returns fresh data

**Offline:**
- Detects network errors (`unavailable`, `offline`, `network`)
- Falls back to AsyncStorage cache
- Returns cached user list
- Filters out current user

### 3. User Selector Updates (`UserSelector.tsx`)

Updated `loadUsers()` to use cached profiles when offline:

**Online:**
- Loads users from Firestore
- Caches them immediately
- Updates UI

**Offline:**
- Catches network errors
- Loads from AsyncStorage cache
- Shows cached users in selection list
- Filters and sorts properly

### 4. Chat Service Updates (`chatService.ts`)

Updated `getUserDisplayName()` and `subscribeToUserChats()` to cache profiles:

**When loading user profiles:**
- Caches each user profile as it's loaded
- Falls back to cache when offline
- Used in:
  - Direct chat list (other user's name)
  - Group chat messages (sender names)
  - Notifications

### 5. Chat Screen Updates (`ChatScreen.tsx`)

Updated group chat participant loading to use AsyncStorage cache:

**When loading group participants offline:**
1. First tries Firestore's `getDoc()` (uses Firestore cache)
2. If that fails due to network error, tries AsyncStorage cache
3. Falls back to "Unknown User" placeholder only if both fail

**Result:** Group chat participants load correctly even when offline

## How It Works

### User Profile Caching Flow

```
1. User logs in and views chat list
   └→ Chat Service loads user profiles
      └→ Profiles cached to AsyncStorage

2. User opens "New Chat" screen
   └→ authService.getAllUsers() loads all users
      └→ Users cached to AsyncStorage
   
3. User creates group chat with "test user 2"
   └→ Group participants cached to AsyncStorage

4. User goes offline (airplane mode)
   └→ Opens group chat
      └→ Firestore's getDoc() fails (not in cache)
         └→ Falls back to AsyncStorage cache
            └→ Shows "test user 2" ✅
   
5. User opens "New Chat" screen (offline)
   └→ getDocs() fails (network unavailable)
      └→ Falls back to AsyncStorage cache
         └→ Shows "test user 2" in selection list ✅
```

### Cache Lifecycle

**Populated:**
- First time viewing chat list (online)
- Creating/viewing new chats (online)
- Opening group chats (online)
- Any user interaction that loads profiles

**Used:**
- Viewing chat list (offline)
- Opening group chats (offline)
- Creating new chats (offline)
- Any screen showing user info (offline)

**Cleared:**
- User logs out
- App data cleared

## Testing Scenarios

### Test 1: Group Chat Offline
1. ✅ While **online**: Create a group chat with "test user 2"
2. ✅ Enable airplane mode
3. ✅ Open the group chat
4. ✅ **Expected**: See "test user 2" (not "Unknown User")

### Test 2: New Chat Screen Offline
1. ✅ While **online**: Open "New Chat" screen (loads and caches all users)
2. ✅ Go back to chat list
3. ✅ Enable airplane mode
4. ✅ Open "New Chat" screen again
5. ✅ **Expected**: See "test user 2" in the user list

### Test 3: Fresh Install Offline
1. ❌ Install app fresh
2. ❌ Never go online
3. ❌ Try to create chat
4. ❌ **Expected**: Empty user list (no cache available)
   - This is expected - you need to go online at least once to load users

## Technical Details

### AsyncStorage Structure

```typescript
// Key: 'user_profiles'
// Value: Array of User objects
[
  {
    uid: "user123",
    email: "test2@example.com",
    displayName: "test user 2",
    photoURL: null,
    avatarColor: "#34B7F1",
    isOnline: false,
    lastSeen: "2025-10-24T10:30:00.000Z", // ISO string
    createdAt: "2025-10-20T08:15:00.000Z"
  },
  // ... more users
]
```

### Firestore Cache vs AsyncStorage Cache

| Feature | Firestore Cache | AsyncStorage Cache |
|---------|----------------|-------------------|
| **Automatic** | Yes (built-in) | No (we manage it) |
| **Scope** | Only accessed data | All loaded profiles |
| **Persistence** | Automatic | Explicit saves |
| **Offline access** | Limited to cached docs | All cached profiles |
| **Use case** | Individual document reads | Bulk queries offline |

**Why we need both:**
- Firestore cache: Great for `getDoc()` (single user)
- AsyncStorage cache: Needed for `getDocs()` (all users list)

## Files Modified

1. **`src/services/storageService.ts`**
   - Added `cacheUserProfiles()`
   - Added `getCachedUserProfiles()`
   - Added `getCachedUserProfile()`
   - Updated `clearAllCache()` to include user profiles

2. **`src/services/authService.ts`**
   - Updated `getAllUsers()` to cache profiles when online
   - Added fallback to AsyncStorage cache when offline

3. **`src/components/UserSelector.tsx`**
   - Updated `loadUsers()` to cache profiles when online
   - Added fallback to AsyncStorage cache when offline

4. **`src/services/chatService.ts`**
   - Updated `getUserDisplayName()` to cache profiles
   - Added fallback to AsyncStorage cache when offline
   - Updated `subscribeToUserChats()` to cache profiles

5. **`src/screens/ChatScreen.tsx`**
   - Updated `loadParticipantsFromCache()` to try AsyncStorage cache
   - Added proper error handling for offline scenarios

## Benefits

✅ **Better Offline Experience**: Users see real names instead of "Unknown User"
✅ **Faster Loading**: Cached profiles load instantly
✅ **Reduced Network Requests**: Less Firestore reads
✅ **Privacy**: Cache cleared on logout
✅ **Graceful Degradation**: Falls back to placeholders only when all caches fail

## Edge Cases Handled

1. **User never went online**: Empty cache, shows empty list ✅
2. **Stale cache**: Updates when going back online ✅
3. **Cache corruption**: Graceful error handling, returns empty array ✅
4. **Logout**: Cache cleared for privacy ✅
5. **Multiple users**: Merges instead of replacing ✅

## Performance Impact

**Minimal:**
- AsyncStorage reads are very fast (~1-2ms)
- Caching happens in background
- No blocking operations
- Falls through on errors (doesn't slow down app)

## Future Improvements

1. **Cache expiration**: Add TTL to cached profiles (e.g., 7 days)
2. **Selective caching**: Only cache frequently accessed users
3. **Background sync**: Update cache periodically when online
4. **Compression**: Compress cache for large user bases
5. **Indexed storage**: Use a better storage solution for large datasets

## Conclusion

This fix ensures that user profiles are available offline by implementing a comprehensive caching layer. Users will now see real names in group chats and user selection screens even when offline, as long as they've loaded those users at least once while online.


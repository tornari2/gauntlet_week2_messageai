# Bug Fixes Log

## October 21, 2025

### Critical Firestore Bug - Undefined Values
**Status:** ✅ Fixed
**Commit:** 6acb029

**Problem:**
```
Unsupported field value: undefined (found in field photoURL in document users/...)
```

**Root Cause:**
Firestore doesn't accept `undefined` values - it requires `null` for nullable fields.

**Fix:**
Changed all instances of `|| undefined` to `|| null` in `authService.ts`:
- Line 41: `photoURL: firebaseUser.photoURL || null`
- Line 44: `pushToken: data.pushToken || null`
- Line 53: `photoURL: firebaseUser.photoURL || null`
- Line 62: `pushToken: data.pushToken || null`
- Line 291: `photoURL: firebaseUser.photoURL || null`
- Line 294: `pushToken: data.pushToken || null`

**Lesson:** Always use `null` instead of `undefined` when working with Firestore.

---

### Display Name Bug - "Unknown User"
**Status:** ✅ Fixed
**Commit:** 6acb029

**Problem:**
All chat names were showing as "Unknown User" instead of actual user display names.

**Root Cause:**
Type mismatch between `Chat` and `ChatWithDetails` types:
- `chatService.ts` was using property name `participantName` (doesn't exist)
- `ChatWithDetails` type defines it as `otherUserName`
- `chatStore.ts` was using `Chat` type instead of `ChatWithDetails`

**Fix:**
1. **chatService.ts:**
   - Changed `const participantName` to `const otherUserName`
   - Changed return type from `Chat[]` to `ChatWithDetails[]`
   - Removed unnecessary `as Chat` type assertion

2. **chatStore.ts:**
   - Changed import from `Chat` to `ChatWithDetails`
   - Updated `chats: ChatWithDetails[]`
   - Updated `currentChat: ChatWithDetails | null`

**Lesson:** Type consistency is critical. Using the correct type (`ChatWithDetails`) prevents property name bugs.

---

### Firebase Persistence Warning
**Status:** ✅ Improved
**Commit:** 6acb029

**Warning:**
```
Error using user provided cache. Falling back to memory cache: 
FirebaseError: [code=unimplemented]: IndexedDB persistence is only 
available on platforms that support LocalStorage.
```

**Explanation:**
This is **expected behavior** on React Native:
- IndexedDB is a web API not available on mobile
- Firebase automatically falls back to memory cache
- Firestore still works correctly

**Fix:**
- Changed `console.warn` to `console.log` to reduce noise
- Updated message to clarify this is "React Native default" behavior

**Lesson:** React Native != Web. Some Firebase warnings are platform-specific and expected.

---

### Firestore Index Requirement
**Status:** ✅ Fixed
**Commit:** 8bfc9dc

**Problem:**
Firestore was requiring an index for `orderBy` queries.

**Solution:**
Removed `orderBy` from early development queries to avoid index requirements. Can add back later with proper indexes.

**Lesson:** Firestore indexes take time to create. Remove unnecessary orderBy in early development.

---

## Bug Prevention Patterns

### 1. Firestore Data Validation
```typescript
// ❌ BAD - Will cause Firestore errors
{
  photoURL: user.photoURL || undefined,
  pushToken: token || undefined
}

// ✅ GOOD - Use null for optional fields
{
  photoURL: user.photoURL || null,
  pushToken: token || null
}
```

### 2. Type Consistency
```typescript
// ❌ BAD - Type mismatch causes bugs
import { Chat } from '../types';
const chats: Chat[] = [];
chats.push({ ...data, participantName }); // Property doesn't exist!

// ✅ GOOD - Use correct type
import { ChatWithDetails } from '../types';
const chats: ChatWithDetails[] = [];
chats.push({ ...data, otherUserName }); // Property exists!
```

### 3. Error Handling
```typescript
// ✅ GOOD - Catch and log Firestore errors
try {
  await setDoc(doc(firestore, 'users', userId), data);
} catch (error) {
  console.error('Firestore error:', error);
  // Don't throw on expected errors
}
```

## Known Issues

### Non-Issues (Expected Behavior)
- Firebase persistence warning on React Native (uses memory cache)
- Auth invalid-credential errors (wrong password / no account)

### To Fix Later
- Improve error messages for users
- Add retry logic for failed Firestore writes
- Add loading indicators during operations
- Handle network connectivity issues

## Testing Checklist

✅ Test on actual devices, not just emulators
✅ Check Firestore console for data structure
✅ Verify all user-facing strings (not "Unknown User", etc.)
✅ Test with multiple users simultaneously
✅ Check console for unexpected errors
✅ Test offline behavior



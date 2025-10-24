# Unknown Status When Offline - Implementation

## Feature
When the current user is offline, all other users' online status should show as "unknown" with yellow indicators, since the app cannot reliably determine their real-time status without an internet connection.

## Changes Made

### 1. Added "Unknown" Status Color
**File**: `src/constants/Colors.ts`
- Added new color: `unknown: '#FFC107'` (yellow) for unknown status indicator

### 2. Updated OnlineIndicator Component
**File**: `src/components/OnlineIndicator.tsx`

**Added**:
- New prop: `isUnknown?: boolean` - indicates when status is unknown (user is offline)
- `getDotColor()` function - determines dot color (yellow if unknown, green if online, gray if offline)
- `getStatusText()` function - returns "Status unknown (you are offline)" when `isUnknown` is true

**Changed**:
- Dot color now set dynamically via `backgroundColor` instead of static styles
- Status text shows "Status unknown (you are offline)" when offline
- Updated memoization to include `isUnknown` in dependency check

### 3. Updated ChatListItem Component
**File**: `src/components/ChatListItem.tsx`

**Added**:
- Import `useNetworkStore` to access connection status
- `isConnected` state from network store
- Pass `isUnknown={!isConnected}` to `OnlineIndicator`

**Result**: On the main chat list screen, when offline, all user status indicators show yellow.

### 4. Updated ChatScreen Component
**File**: `src/screens/ChatScreen.tsx`

**Changed**:
- Added `isUnknown={!isConnected}` to both `OnlineIndicator` instances:
  - Group chat participants list
  - Direct chat header
- Removed redundant "(You're offline)" text (now handled by OnlineIndicator's status text)

**Result**: In individual chat windows, when offline:
- Direct chats: Shows "Status unknown (you are offline)" in yellow
- Group chats: All participant indicators show yellow dots

## User Experience

### When Online (Connected)
- **Green dot** (●) = User is online
- **Gray dot** (●) = User is offline
- Text shows: "Online" or "Last seen X ago"

### When Offline (No Connection)
- **Yellow dot** (●) = All users show as "Status unknown"
- Text shows: "Status unknown (you are offline)"
- Applies to:
  - Chat list screen (all chat items)
  - Individual chat headers (direct chats)
  - Group chat participant lists

## Why This Matters
When the current user is offline:
- The app cannot connect to Firebase Realtime Database to get presence updates
- Cached presence data may be stale
- Showing yellow "unknown" status is more honest than showing potentially incorrect green/gray status
- User is clearly informed that status information is unavailable due to their offline state

## Visual Example

```
ONLINE STATE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
John Doe             ● Online
Jane Smith          ● Last seen 5m ago

OFFLINE STATE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
John Doe            ● Status unknown (you are offline)
Jane Smith          ● Status unknown (you are offline)
```

## Files Modified
1. `src/constants/Colors.ts` - Added yellow color for unknown status
2. `src/components/OnlineIndicator.tsx` - Added `isUnknown` prop and logic
3. `src/components/ChatListItem.tsx` - Pass network status to OnlineIndicator
4. `src/screens/ChatScreen.tsx` - Pass network status to OnlineIndicator (2 places)

## Testing
1. Open app while connected - verify green/gray dots show normally
2. Enable airplane mode
3. Check chat list - all status dots should turn yellow
4. Open a direct chat - header should show yellow dot with "Status unknown (you are offline)"
5. Open a group chat - all participant dots should be yellow
6. Disable airplane mode
7. Verify dots return to normal green/gray based on actual online status


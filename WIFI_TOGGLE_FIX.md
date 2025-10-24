# WiFi Toggle Fix - October 24, 2025

## Problem Identified

The root cause of both issues (persistent banner and duplicate messages) was **store initialization**.

### Evidence from Logs

```
LOG  [ConnectionStatus] State transition: true → true
LOG  [ConnectionStatus] No state change (connected: true , prevConnected: true )
```

The `networkStore` was initializing with `isConnected: true` and staying `true` the entire time, which meant:

1. **No offline detection**: When WiFi turned off, store stayed `true` (no transition)
2. **No online detection**: When WiFi turned back on, store stayed `true` (no transition)
3. **No banner animation**: No state change = no re-render = banner stuck
4. **No queue processing**: No reconnection detected = `processOfflineQueue` never called
5. **Duplicate messages**: Messages queued offline but never processed, then sent again when manually triggered

## The Fix

### Changed `networkStore.ts` Initialization

**Before:**
```typescript
isConnected: true, // Assume online initially
```

**After:**
```typescript
isConnected: false, // Start pessimistic - ConnectionStatus will set correct value on mount
```

**Also added logging to `setConnected`:**
```typescript
setConnected: (connected: boolean) => {
  const prevConnected = get().isConnected;
  console.log('[NetworkStore] setConnected called:', prevConnected, '→', connected);
  set({ isConnected: connected });
},
```

## Why This Works

### On App Start (Online)
1. Store initializes: `isConnected: false`
2. `ConnectionStatus` mounts, tests connectivity
3. Finds internet is reachable: `true`
4. **State transition**: `false` → `true` ✅
5. Banner hidden (as it should be)
6. Establishes baseline state

### When WiFi Goes OFF
1. Polling or NetInfo detects offline
2. **State transition**: `true` → `false` ✅
3. Logs: `📴 WENT OFFLINE`
4. Banner animates into view
5. Messages show clock icon (◷)

### When WiFi Comes ON
1. Polling tests connectivity, finds internet
2. **State transition**: `false` → `true` ✅
3. Logs: `🎉🎉🎉 RECONNECTION DETECTED`
4. Banner animates away
5. After 3 seconds, `processOfflineQueue` runs
6. Messages sync properly, no duplicates

## Expected Logs After Fix

### App Start (Online)
```
[NetworkStore] setConnected called: false → true
[ConnectionStatus] State transition: false → true
[ConnectionStatus] ⚡ Will animate to: 50 (50=hidden, 0=visible)
```

### WiFi OFF
```
[ConnectionStatus] Poll detected state change! true → false
[NetworkStore] setConnected called: true → false
[ConnectionStatus] 📴 WENT OFFLINE VIA POLLING 📴
[ConnectionStatus] ⚡ Will animate to: 0 (50=hidden, 0=visible)
```

### WiFi ON
```
[ConnectionStatus] Poll detected state change! false → true
[NetworkStore] setConnected called: false → true
[ConnectionStatus] 🎉🎉🎉 RECONNECTION DETECTED VIA POLLING 🎉🎉🎉
[ConnectionStatus] ⚡ Will animate to: 50 (50=hidden, 0=visible)
[ConnectionStatus] 🔄 Now processing offline queue...
```

## Testing Steps

1. **Restart the app** (important - need fresh store state)
2. **Verify app starts online** - banner should be hidden
3. **Turn WiFi OFF** on Mac
4. **Wait 1-5 seconds** - banner should appear
5. **Send a message** - should show clock icon (◷)
6. **Turn WiFi ON** on Mac
7. **Wait 1-5 seconds** - banner should disappear
8. **Wait 3 more seconds** - message should sync (◷ → ✓ → ✓✓)
9. **Check for duplicates** - message should appear only once

## Related Files

- `/src/stores/networkStore.ts` - Changed initialization and added logging
- `/src/components/ConnectionStatus.tsx` - Already had all the detection logic, just needed state transitions
- `WIFI_TOGGLE_DEBUG.md` - Diagnostic information that led to this fix

## Why It Was Hard to Catch

1. **Polls showed correct state**: `{"computed": true, "isConnected": true}` 
   - This made it seem like detection was working
2. **Store was "correct"**: It was `true` when online
   - But it was ALWAYS `true`, even when offline
3. **No transitions**: The key wasn't the current state, it was the lack of state CHANGES
4. **Simulator behavior**: WiFi toggle on Mac is edge case that doesn't trigger NetInfo events reliably

The fix was only possible because we added the comprehensive logging that showed `State transition: true → true` (no change).



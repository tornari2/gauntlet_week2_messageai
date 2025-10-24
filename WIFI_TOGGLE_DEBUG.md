# WiFi Toggle Debugging - October 24, 2025

## Current Issues

1. **Persistent Banner**: The "no internet connection" banner continues to display even after WiFi is re-enabled on the Mac (for iOS Simulator)
2. **Duplicate Messages**: Messages sent while offline are appearing multiple times after coming back online

## Changes Made for Debugging

### Enhanced Logging in `ConnectionStatus.tsx`

#### 1. Component Render Logging (line 40)
```typescript
console.log('[ConnectionStatus] 🎬 RENDER - isConnected:', isConnected, 'store:', useNetworkStore.getState().isConnected);
```
- Logs on every render
- Shows both hook value and direct store read
- Should be identical

#### 2. NetInfo Event Listener (lines 70-131)
- Added raw NetInfo state logging: `JSON.stringify(state, null, 2)`
- ALWAYS test connectivity when `isConnected === true` (not conditional)
- Added store verification after update: `useNetworkStore.getState().isConnected`
- Added explicit offline transition logging

#### 3. Polling Logic (lines 136-190)
- Now ALWAYS tests connectivity when NetInfo says connected
- No more conditional testing - critical for WiFi toggle detection
- Added store verification after update

#### 4. Animation Effect (lines 199-212)
- Shows current `slideAnim` value
- Shows target animation value (50=hidden, 0=visible)
- Logs completion

## What to Look For in Logs

### When Turning WiFi OFF:

You should see one of these sequences:

**Via NetInfo Event:**
```
[ConnectionStatus] 🔵 NetInfo event fired, processing...
[ConnectionStatus] Raw NetInfo state: {"isConnected": false, ...}
[ConnectionStatus] NetInfo says isConnected=false, definitely offline
[ConnectionStatus] State transition: true → false
[ConnectionStatus] 📴 WENT OFFLINE VIA NetInfo EVENT 📴
[ConnectionStatus] ⚡ Animation effect triggered, isConnected: false
[ConnectionStatus] ⚡ Will animate to: 0 (50=hidden, 0=visible)
```

**Via Polling:**
```
[ConnectionStatus] Poll result: {"computed": false, "previous": true, ...}
[ConnectionStatus] 📡 Poll detected state change! true → false
[ConnectionStatus] 📡📡📡 STATE CHANGE DETECTED IN POLL 📡📡📡
[ConnectionStatus] 📴 WENT OFFLINE VIA POLLING 📴
[ConnectionStatus] ⚡ Animation effect triggered, isConnected: false
[ConnectionStatus] ⚡ Will animate to: 0 (50=hidden, 0=visible)
```

### When Turning WiFi ON:

You should see one of these sequences:

**Via NetInfo Event (rare on simulator):**
```
[ConnectionStatus] 🔵 NetInfo event fired, processing...
[ConnectionStatus] NetInfo says connected, testing actual connectivity...
[ConnectionStatus] Actual connectivity test result: true
[ConnectionStatus] State transition: false → true
[ConnectionStatus] Verifying store update: true
[ConnectionStatus] 🎉🎉🎉 RECONNECTION DETECTED VIA NetInfo EVENT 🎉🎉🎉
[ConnectionStatus] ⚡ Animation effect triggered, isConnected: true
[ConnectionStatus] ⚡ Will animate to: 50 (50=hidden, 0=visible)
[ConnectionStatus] 🔄 Now processing offline queue...
```

**Via Polling (more common):**
```
[ConnectionStatus] Poll result: {"computed": true, "previous": false, ...}
[ConnectionStatus] 📡 Poll detected state change! false → true
[ConnectionStatus] 📡📡📡 STATE CHANGE DETECTED IN POLL 📡📡📡
[ConnectionStatus] Verifying store update: true
[ConnectionStatus] 🎉🎉🎉 RECONNECTION DETECTED VIA POLLING 🎉🎉🎉
[ConnectionStatus] ⚡ Animation effect triggered, isConnected: true
[ConnectionStatus] ⚡ Will animate to: 50 (50=hidden, 0=visible)
[ConnectionStatus] 🔄 Now processing offline queue...
```

## Diagnostic Questions

### If Banner Persists After WiFi Is Turned Back On:

1. **Is polling detecting online state?**
   - Search logs for: `Poll result: {"computed": true`
   - If YES → polling knows you're online
   - If NO → connectivity test is failing

2. **Is there a state transition?**
   - Search logs for: `STATE CHANGE DETECTED IN POLL` or `RECONNECTION DETECTED`
   - If YES → state is updating, banner should hide
   - If NO → likely cause: store was already `true` when you went offline

3. **Is the component re-rendering?**
   - Search logs for: `🎬 RENDER - isConnected:`
   - Check if there's a render after state transition
   - Compare hook value vs store value - should match

4. **Is the animation firing?**
   - Search logs for: `⚡ Animation effect triggered, isConnected: true`
   - Should show `Will animate to: 50`
   - If YES but banner still visible → animation issue
   - If NO → component not re-rendering

### If Messages Are Duplicating:

1. **When are messages being added to queue?**
   - Search logs for: `📴 [sendMessageOptimistic] Message added to offline queue`
   - Check the timestamps
   - If messages are being queued while banner is visible but connection is actually online → explains duplicates

2. **Is queue processing finding duplicates?**
   - Search logs for: `✅ [processOfflineQueue] Message already sent`
   - Should see this for messages that Firestore already synced

3. **How many times is processOfflineQueue running?**
   - Search logs for: `🔄 [processOfflineQueue] Starting...`
   - Should only run once per reconnection
   - If multiple times → may be processing same messages repeatedly

## Potential Root Causes

### Hypothesis 1: Store Initializes as `true`, Never Transitions to `false`

**Evidence needed:**
- Look at FIRST logs after app starts
- Check if you see `State transition: false → true` when WiFi comes on
- If store starts as `true`, stays `true`, polling won't detect a transition

**Solution if confirmed:**
- Change `networkStore.ts` line 22 from `isConnected: true` to `isConnected: false`
- OR add initial state detection on component mount

### Hypothesis 2: Store Updates But Component Doesn't Re-render

**Evidence needed:**
- Look for `Verifying store update: true` in logs
- Check if followed by `🎬 RENDER` log
- If store updates but no render → Zustand subscription issue

**Solution if confirmed:**
- Check if multiple `ConnectionStatus` components are mounted
- Verify Zustand selector is triggering re-renders

### Hypothesis 3: Animation Runs But Banner Stays Visible

**Evidence needed:**
- Look for `⚡ Will animate to: 50` followed by `✅ Animation completed`
- Check if banner is still visible despite animation completing

**Solution if confirmed:**
- May be CSS/style issue
- May be another `ConnectionStatus` instance rendering

### Hypothesis 4: Messages Queued While App Thinks It's Offline But Firestore Is Online

**Evidence needed:**
- Messages showing checkmarks (Firestore working)
- Banner still visible (app thinks offline)
- Messages being added to queue
- Later: duplicates when queue processes

**Solution if confirmed:**
- Fix state detection (hypotheses 1-3)
- Once banner shows correct state, queueing will be correct

## Testing Steps

1. **Restart app** to get clean logs
2. **Wait for initial state** - look for first `[ConnectionStatus]` logs
3. **Turn WiFi OFF**
   - Wait 5 seconds
   - Copy all logs from that moment
4. **Turn WiFi ON**
   - Wait 10 seconds
   - Copy all logs from that moment
5. **Send test message**
   - Observe if it duplicates
6. **Share logs** with focus on:
   - First appearance of each emoji prefix (🔵, 📡, ⚡, 🎬)
   - State transitions
   - Store verification logs

## Next Steps

Based on log analysis, we'll likely need to:
1. Fix store initialization if it's starting as `true`
2. Add forced store sync on component mount
3. Add debouncing to prevent rapid state flips
4. Add queue deduplication improvements if needed



# Offline Messaging - Testing Notes

## ✅ Working on Real Devices
The offline messaging functionality works correctly on **real iOS/Android devices**:
- Messages sent while offline show clock icon (◷)
- Messages are queued by Firestore's offline persistence
- On reconnection, messages sync automatically
- No duplicates
- Banner appears/disappears correctly

## ⚠️ iOS Simulator Limitations
The iOS Simulator has known issues with network state detection:

### Issues
1. **Host WiFi Dependency**: Simulator network is tied to Mac's WiFi
2. **Metro Logging Stops**: When Mac WiFi is off, Metro can't send logs
3. **Unreliable `isInternetReachable`**: Often reports `null` instead of true/false
4. **Delayed State Detection**: Slower to detect network changes than real devices
5. **Banner May Persist**: Connection status banner may not update reliably

### Why This Happens
- Simulator uses host Mac's network stack
- When Mac WiFi is off, simulator loses Metro connection
- Network state APIs (`NetInfo`) behave differently in simulator vs device

### Recommendation
**Always test offline functionality on real devices**, not the simulator. The simulator is fine for UI/layout work, but unreliable for network-dependent features.

## Testing Checklist (Real Device)
1. ✅ Enable airplane mode
2. ✅ Send messages - should show clock icon (◷)
3. ✅ Messages should be pending (not sent)
4. ✅ "No internet connection" banner appears
5. ✅ Disable airplane mode
6. ✅ Messages send automatically (clock → checkmark)
7. ✅ Banner disappears
8. ✅ No duplicate messages
9. ✅ Messages appear in correct order

## Known Simulator Behavior
- May require multiple airplane mode toggles
- Banner may persist even when online
- Logs may stop when network changes
- Use `Features → Toggle Airplane Mode` in simulator for best results
- Real device testing is **required** for verification


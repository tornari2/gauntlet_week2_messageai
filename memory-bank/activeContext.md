# Active Context: WhatsApp Clone MVP

## Current Status
**Phase:** Advanced Features - Read Receipts Complete
**Date Updated:** October 21, 2025
**Next Action:** Begin PR #8 - Message Persistence

## What We're Working On

### Recently Completed: PR #7 ✅
**Read Receipts - COMPLETE**
- Objective: Implement WhatsApp-style read receipts with checkmarks
- Actual Time: ~4 hours
- Status: Complete and pushed to GitHub
- Commit: 7206969

### Recently Completed: PR #6 ✅
**Online/Offline Status - COMPLETE**
- Objective: Implement real-time presence tracking
- Actual Time: ~3.5 hours
- Status: Complete and committed
- Commit: 4d21d12

### Recently Completed: PR #5 ✅
**Optimistic UI Updates - COMPLETE**
- Objective: Implement instant message sending with optimistic UI updates
- Actual Time: ~4 hours
- Status: Complete and tested
- Commit: 0a105e2

### Recently Completed: PR #4 ✅
**Real-Time Messaging - COMPLETE**
- Objective: Implement full real-time chat functionality
- Actual Time: ~7 hours
- Status: Complete with bug fixes
- Commits: 31945c1, f36fdf1, 6acb029

### Key Accomplishments from PR #1-7:
1. ✅ **Project Foundation** - Expo + Firebase + TypeScript setup
2. ✅ **Authentication** - Signup/Login with Firestore user profiles
3. ✅ **Chat List** - Real-time chat list with navigation
4. ✅ **Real-Time Messaging** - Working one-on-one chat
5. ✅ **NewChatScreen** - User discovery and chat creation
6. ✅ **Optimistic Updates** - Instant message sending with retry mechanism
7. ✅ **Online Status** - Real-time presence tracking with last seen
8. ✅ **Read Receipts** - WhatsApp-style checkmarks and unread badges
9. ✅ **Bug Fixes** - Firestore undefined values, display names, persistence warnings

### Current Working Features:
- ✅ User signup and login
- ✅ Viewing list of chats
- ✅ Creating new chats with any user
- ✅ Sending and receiving messages in real-time
- ✅ Optimistic message updates (instant send)
- ✅ Message status indicators (pending, sent, failed)
- ✅ Failed message retry mechanism
- ✅ Online/offline status indicators
- ✅ Last seen timestamps ("Active X ago")
- ✅ Real-time presence updates
- ✅ AppState monitoring
- ✅ Read receipt checkmarks (✓, ✓✓, blue checks)
- ✅ Auto-read messages on chat open
- ✅ Unread count badges in chat list
- ✅ Proper display names in chat list
- ✅ Message timestamps
- ✅ Firestore security rules

### Immediate Next Steps

**PR #8: Message Persistence (Recommended Next)**
1. **Enable Firestore Offline Persistence**
   - Add enableIndexedDbPersistence() (or React Native equivalent)
   - Handle errors/warnings
   - Test offline behavior
   
2. **AsyncStorage Caching**
   - Create storageService.ts
   - Cache last 100 messages per chat
   - Merge with Firestore data
   
3. **Offline Message Queue**
   - Queue messages sent while offline
   - Retry on reconnection
   - Update status when sent
   
4. **Connection Status**
   - Create ConnectionStatus component
   - Show "Connecting..." banner when offline

## Recent Decisions

### Implementation Decisions (Oct 20-21, 2025)
- ✅ **Frontend:** React Native with Expo (managed workflow)
- ✅ **State:** Zustand (over Redux Toolkit and Context API)
- ✅ **Navigation:** React Navigation (over Expo Router)
- ✅ **Backend:** Firebase (Auth, Firestore, FCM)
- ✅ **Deployment:** Expo Go for MVP, EAS Build for production

### Bug Fixes & Learnings (Oct 21, 2025)
- ✅ **Firestore null vs undefined:** Changed all `|| undefined` to `|| null` (6 locations in authService.ts)
- ✅ **Display names bug:** Fixed `participantName` → `otherUserName` in chatService.ts
- ✅ **Type consistency:** Changed chatStore to use `ChatWithDetails` instead of `Chat`
- ✅ **Firebase persistence:** Clarified React Native uses memory cache (expected behavior)
- ✅ **Firestore orderBy:** Removed to avoid index requirements in early development
- ✅ **NewChatScreen:** Added floating action button and user selection screen
- ✅ **Nullable types:** Updated User type to allow `null` for `photoURL` and `pushToken`
- ✅ **Timestamp handling:** OnlineIndicator accepts `Timestamp | Date` for flexibility
- ✅ **AppState tracking:** Reliable presence tracking via React Native AppState API
- ✅ **Real-time presence:** Efficient Firestore listeners for online status updates
- ✅ **Read receipt logic:** getReadReceiptIcon() checks readBy array against participants
- ✅ **useFocusEffect:** Perfect for auto-reading messages when chat screen focused
- ✅ **Unread counting:** Calculate in subscribeToUserChats for real-time badge updates
- ✅ **Blue checks:** Color changes from white to blue when all participants read

## Active Constraints

### Time Constraints
- Target: 6-8 days at 8 hours/day
- MVP must be complete before AI integration phase

### Technical Constraints
- Must work on Expo Go (for easy testing)
- Must work offline (queue messages)
- Must support iOS and Android
- Firebase free tier limits (50K reads/day)

### Scope Constraints
- **In Scope:** Core messaging, groups, status, receipts, notifications
- **Out of Scope:** Media sharing, voice/video calls, E2EE, message editing, typing indicators

## Blockers & Dependencies

### Current Blockers
- None (read receipts complete, ready for message persistence)

### Items Needing Cleanup
- Duplicate files in repo (`MessageBubble 2.tsx`, `MessageInput 2.tsx`, `messageStore 2.ts`, `dateHelpers 2.ts`, `firestore 2.rules`)
- Should remove these duplicate files
- Uncommitted changes in working directory

### Upcoming Dependencies
- **PR #8 (Message Persistence)** - Depends on PR #5 ✅ (complete)
- **PR #9 (Group Chat)** - Depends on PR #4 ✅, PR #7 ✅ (both complete)
- **PR #10 (Push Notifications)** - Depends on PR #4 ✅ (complete)

## Questions to Resolve

### Current Questions
- [ ] Should we add automated tests for read receipts?
- [ ] Any bugs discovered during PR #7 testing?
- [ ] Should we implement message persistence or group chat next?

### Resolved Questions
- [x] Firebase project name? → Used Firebase Console defaults
- [x] Bundle identifier? → `com.anonymous.gauntletaiweek2messageai`
- [x] Use Firebase Emulator? → No, using live Firebase
- [x] Why "Unknown User"? → Fixed: used wrong property name
- [x] Why Firestore errors? → Fixed: undefined vs null issue
- [x] How to track presence? → AppState listener with Firestore updates
- [x] Last seen format? → "Active X ago" using formatLastSeen helper
- [x] Read receipt colors? → White for delivered, blue for read
- [x] Auto-read approach? → useFocusEffect when screen focused

## Context for AI Agents

### When Starting New Work Session
**Quick Context:**
- Project: WhatsApp clone MVP with React Native + Expo + Firebase
- Current Status: **PRs #1-7 complete** ✅
- Core messaging with optimistic updates, online status, and read receipts working
- Ready for: Message persistence (PR #8)
- Reference: `IMPLEMENTATION_PLAN.md` for detailed tasks
- Reference: `ARCHITECTURE.md` for system design

**Files to Review:**
- `memory-bank/progress.md` - See what's been completed (58% done)
- `IMPLEMENTATION_PLAN.md` - PR #8 tasks (next)
- PR summaries: `PR4_SUMMARY.md`, `PR5_SUMMARY.md`, `PR6_SUMMARY.md`, `PR7_SUMMARY.md`
- Bug fix docs: `BUG_FIXES.md`, `FIX_UNKNOWN_USER.md`, `UI_CHANGES.md`

### When Implementing Features
**Key Patterns Learned:**
- Always use `null` instead of `undefined` for Firestore
- Use `ChatWithDetails` type instead of `Chat` for proper display names
- Firebase persistence warnings on React Native are normal
- Real-time listeners pattern: Zustand store → subscribe in useEffect → cleanup on unmount
- Type safety prevents bugs (learned from `otherUserName` vs `participantName` issue)
- AppState API for presence tracking is reliable and efficient
- Allow `Timestamp | Date` unions for Firebase/app data flexibility
- OnlineIndicator component pattern: dot + optional text, multiple sizes
- useFocusEffect perfect for screen-focused actions (like marking messages read)
- Read receipt logic: compare readBy array with participants array
- Unread count: calculate in subscribeToUserChats for real-time updates

**Reference Files:**
- `ARCHITECTURE.md` - Data flow diagrams
- `systemPatterns.md` - Implementation patterns
- `techContext.md` - TypeScript types and structure

### When Writing Tests
**Testing Standards:**
- Target: >80% code coverage
- Unit tests for all services and stores
- Component tests for all UI components
- Integration tests for critical flows
- Reference: `IMPLEMENTATION_PLAN.md` for test examples per PR

## Development Environment

### Current Setup Status
- [x] Expo CLI installed
- [x] Node.js version verified (18+)
- [x] VS Code / Cursor with extensions
- [x] Git configured
- [x] Firebase account created
- [x] Firebase project set up
- [x] iOS Simulator ready
- [x] Testing on physical devices
- [x] App running successfully

### Required Before Starting
1. Install Expo CLI: `npm install -g expo-cli`
2. Verify Node version: `node --version` (should be 18+)
3. Create Firebase account
4. Set up iOS Simulator or Android Emulator
5. Have physical device for testing (optional but recommended)

## Communication Patterns

### For This Project
When asking AI for help, mention:
- Current PR number (e.g., "Working on PR #4")
- What you're implementing (e.g., "Implementing message store")
- Reference documentation (e.g., "@ARCHITECTURE.md show message flow")

### Efficient Prompts
```
Good: "Following PR #2 in IMPLEMENTATION_PLAN.md, implement the auth store"
Good: "@ARCHITECTURE.md show auth flow, then implement authService.ts"
Good: "Generate tests for messageStore per PR #4 specifications"

Less effective: "Create an auth system"
Less effective: "Make the messaging work"
```

## Tracking Current Work

### Today's Goals
- [x] Complete PR #4 (Real-time messaging)
- [x] Complete PR #5 (Optimistic updates)
- [x] Complete PR #6 (Online status)
- [x] Complete PR #7 (Read receipts)
- [x] Fix critical bugs (undefined values, display names)
- [x] Test on physical devices
- [x] Commit PR #6 and PR #7 to git
- [x] Push to GitHub
- [x] Update memory bank
- [ ] Decide: PR #8 (Message persistence) or PR #9 (Group chat) next

### This Week's Goals (Updated)
- [x] PRs 1-7 complete (setup, auth, chat list, messaging, optimistic updates, online status, read receipts) ✅
- [x] Basic one-on-one chat working ✅
- [x] Real-time message delivery functional ✅
- [x] Instant message sending (optimistic UI) ✅
- [x] Real-time presence tracking ✅
- [x] Read receipts with checkmarks ✅
- [ ] Start PR #8 (Message persistence) or PR #9 (Group chat)

### Original Sprint Goal
- [ ] MVP feature-complete (PRs 1-12)
- [ ] All tests passing
- [ ] Deployed to Expo Go
- [ ] Manual testing checklist complete

**Progress: 58% (7/12 PRs complete)**

## Notes & Reminders

### Important Conventions
- **Always use named exports** (not default exports)
- **Add testID to all interactive components**
- **Include JSDoc comments for all functions**
- **Use TypeScript strict mode** (no `any` types)
- **Clean up listeners on unmount**

### Common Commands
```bash
# Start dev server
npx expo start

# Clear cache
npx expo start --clear

# Run tests
npm test

# Type checking
npx tsc --noEmit
```

### Useful Resources
- Expo docs: https://docs.expo.dev
- Firebase docs: https://firebase.google.com/docs
- React Navigation: https://reactnavigation.org
- Zustand: https://github.com/pmndrs/zustand
- Bug fix docs: See `BUG_FIXES.md`, `FIX_UNKNOWN_USER.md`, `UI_CHANGES.md` in project root

## Next Session Prep

### Before Starting Next Session
1. Review this file for current status (PRs #1-7 complete ✅)
2. Check `progress.md` for completed items (58% done)
3. Review PR #8 in `IMPLEMENTATION_PLAN.md` (Message Persistence)
4. Review `PR7_SUMMARY.md` for read receipts implementation
5. Consider testing read receipts on multiple devices

### To Update After Session
- Update "Current Focus" section with new work
- Move completed items to `progress.md`
- Update any new decisions or blockers
- Note any questions that arose
- Update git commit history
- Document new bugs or fixes


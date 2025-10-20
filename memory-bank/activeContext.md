# Active Context: WhatsApp Clone MVP

## Current Status
**Phase:** Planning & Documentation Complete
**Date Updated:** October 20, 2025
**Next Action:** Begin PR #1 - Project Foundation & Firebase Setup

## What We're Working On

### Current Focus
**PR #1: Project Foundation & Firebase Setup**
- Objective: Initialize Expo project with Firebase integration
- Estimated Time: 3-4 hours
- Status: Not started
- Branch: `feature/project-setup` (to be created)

### Immediate Next Steps

1. **Initialize Expo Project**
   ```bash
   npx create-expo-app@latest WK2_MessageAI --template blank
   ```
   - Verify runs on Expo Go
   - Initialize git repository

2. **Install Core Dependencies**
   ```bash
   npx expo install @react-navigation/native @react-navigation/native-stack
   npx expo install react-native-screens react-native-safe-area-context
   npm install zustand firebase
   npx expo install @react-native-async-storage/async-storage
   ```

3. **Set Up Project Structure**
   - Create `/src` directory
   - Create subdirectories: `screens/`, `components/`, `services/`, `stores/`, `navigation/`, `types/`, `utils/`
   - Add Firebase config files to `.gitignore`

4. **Create Firebase Project**
   - Go to Firebase Console
   - Create new project
   - Enable Authentication (Email/Password)
   - Create Firestore database (test mode initially)
   - Download config (don't commit)

5. **Create Firebase Service**
   - Create `/src/services/firebase.ts`
   - Initialize Firebase app
   - Export `auth`, `firestore` instances
   - Create `.env.example` template

6. **Set Up TypeScript Types**
   - Create `/src/types/index.ts`
   - Define User, Chat, Message interfaces

7. **Configure app.json**
   - Add app name, bundle identifier
   - Configure splash screen
   - Add permissions placeholders

## Recent Decisions

### Architecture Decisions (Oct 20, 2025)
- ✅ **Frontend:** React Native with Expo (managed workflow)
- ✅ **State:** Zustand (over Redux Toolkit and Context API)
- ✅ **Navigation:** React Navigation (over Expo Router)
- ✅ **Backend:** Firebase (Auth, Firestore, FCM)
- ✅ **Deployment:** Expo Go for MVP, EAS Build for production

### Planning Complete (Oct 20, 2025)
- ✅ Created comprehensive `ARCHITECTURE.md` with:
  - High-level architecture diagrams
  - File dependency maps
  - 8 data flow diagrams (sequence diagrams)
  - Firebase data model
  - Component communication patterns
  
- ✅ Created detailed `IMPLEMENTATION_PLAN.md` with:
  - 12 sequential PRs
  - Detailed tasks per PR
  - Unit test examples
  - Checklists for each PR
  - Timeline: 47-60 hours total

- ✅ Created `memory-bank/` directory with:
  - Project brief
  - Product context
  - System patterns
  - Tech context
  - Active context (this file)
  - Progress tracking

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
- None (ready to start development)

### Upcoming Dependencies
- **PR #2 (Auth)** depends on PR #1 (setup)
- **PR #3 (Chat List)** depends on PR #2 (auth)
- **PR #4 (Messaging)** depends on PR #3 (chat list)
- **PR #5 (Optimistic)** depends on PR #4 (messaging)
- And so on... (sequential dependencies documented in IMPLEMENTATION_PLAN.md)

## Questions to Resolve

### Before Starting PR #1
- [ ] Firebase project name? (Suggestion: `wk2-messageai-dev`)
- [ ] Bundle identifier? (Suggestion: `com.yourname.wk2messageai`)
- [ ] Use Firebase Emulator for development? (Recommended: No for MVP, use live)
- [ ] Testing strategy for PR #1? (Suggestion: Basic smoke tests only)

### Future Questions
- Push notification strategy (dev build vs. Expo Go)?
- Media sharing implementation approach (post-MVP)?
- AI agent integration architecture (post-MVP)?

## Context for AI Agents

### When Starting New Work Session
**Quick Context:**
- Project: WhatsApp clone MVP with React Native + Expo + Firebase
- Current PR: #1 (Project setup)
- Reference: `IMPLEMENTATION_PLAN.md` for detailed tasks
- Reference: `ARCHITECTURE.md` for system design

**Files to Review:**
- `IMPLEMENTATION_PLAN.md` - PR #1 tasks
- `techContext.md` - Dependency versions and configuration
- `systemPatterns.md` - Coding patterns and conventions

### When Implementing Features
**Key Patterns:**
- Use Zustand for state management
- Use optimistic updates for user actions
- Subscribe to Firestore real-time listeners
- Cache data in AsyncStorage
- Follow three-tier architecture (UI → Store → Service)

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
- [ ] Expo CLI installed
- [ ] Node.js version verified (18+)
- [ ] VS Code / Cursor with extensions
- [ ] Git configured
- [ ] Firebase account created
- [ ] iOS Simulator / Android Emulator ready

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
- [ ] Complete PR #1 setup
- [ ] Verify Expo runs on device
- [ ] Firebase configuration working
- [ ] Directory structure created
- [ ] TypeScript types defined

### This Week's Goals
- [ ] PRs 1-4 complete (setup, auth, chat list, messaging)
- [ ] Basic one-on-one chat working
- [ ] Real-time message delivery functional
- [ ] Optimistic UI updates working

### This Sprint (Week 1)
- [ ] MVP feature-complete (PRs 1-12)
- [ ] All tests passing
- [ ] Deployed to Expo Go
- [ ] Manual testing checklist complete

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

## Next Session Prep

### Before Starting Next Session
1. Review this file for current status
2. Check `progress.md` for completed items
3. Review relevant PR in `IMPLEMENTATION_PLAN.md`
4. Check `ARCHITECTURE.md` for implementation patterns

### To Update After Session
- Update "Current Focus" section
- Move completed items to `progress.md`
- Update any new decisions or blockers
- Note any questions that arose
- Update development environment status


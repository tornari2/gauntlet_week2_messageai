# Project Brief: WhatsApp Clone MVP

## Project Name
WK2_MessageAI - WhatsApp Clone with AI Integration (MVP Phase)

## Project Type
Mobile Application (iOS & Android)

## Overview
A real-time messaging application built with React Native that replicates core WhatsApp functionality. This is the MVP phase focusing on fundamental messaging features. AI agent and RAG (Retrieval-Augmented Generation) capabilities will be integrated in subsequent phases.

## Primary Goal
Build a production-ready messaging platform that enables real-time communication between users with a smooth, responsive user experience featuring optimistic UI updates.

## Target Platform
- iOS (via Expo Go / TestFlight)
- Android (via Expo Go / APK)
- Development: Local simulator/emulator with deployed backend

## Development Approach
- Expo managed workflow for faster development
- Firebase backend for serverless architecture
- Phased development with 12 sequential Pull Requests
- Test-driven development with >80% code coverage
- Mobile-first, cross-platform design

## Timeline
- **Estimated Duration:** 47-60 hours (6-8 days at 8 hours/day)
- **Development Mode:** Solo development with potential for parallel agent assistance
- **Deployment:** Expo Go initially, optional EAS builds for TestFlight/APK

## Success Criteria
- ✅ Users can send and receive messages in real-time (< 1 second latency)
- ✅ Messages persist across app restarts
- ✅ Users can create and participate in group chats
- ✅ Optimistic UI updates show messages instantly
- ✅ Online status reflects actual user state within 5 seconds
- ✅ Push notifications delivered and actionable
- ✅ Zero critical bugs in core messaging flow

## Out of Scope (Post-MVP)
- AI agent features
- RAG capabilities
- Voice/video calls
- Media sharing (photos, videos, files)
- Message editing/deletion
- Typing indicators
- End-to-end encryption
- Message search
- Stories/Status

## Key Stakeholders
- Product Owner: Michael Tornaritis
- Developer: Michael Tornaritis
- Target Users: Mobile-first communicators

## References
- Detailed implementation plan: `IMPLEMENTATION_PLAN.md`
- System architecture: `ARCHITECTURE.md`
- Firebase project: TBD (to be created in PR #1)


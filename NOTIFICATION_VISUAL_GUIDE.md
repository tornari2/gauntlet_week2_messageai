# Visual Guide: Notification System

## In-App Banner (Foreground)

When a message arrives while the app is in the foreground (and you're not viewing that chat):

```
┌────────────────────────────────────────────────┐
│  📱 Phone Screen (App Open)                    │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ 🔔 Notification Banner (Animated)        │ │
│  │ ┌────────────────────────────────────┐   │ │
│  │ │ 💬  John Doe                    ✕  │   │ │
│  │ │     Hey, are you there?            │   │ │
│  │ └────────────────────────────────────┘   │ │
│  │         ↑ Slides in from top             │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ╔════════════════════════════════════════╗  │
│  ║ 📱 Your App Content                    ║  │
│  ║                                        ║  │
│  ║  Chat List or Current Screen           ║  │
│  ║                                        ║  │
│  ╚════════════════════════════════════════╝  │
└────────────────────────────────────────────────┘
```

**Behavior:**
- Slides in from top with spring animation
- Auto-dismisses after 4 seconds
- Tappable to open the chat
- X button to dismiss manually
- Plays sound (if enabled)

---

## System Notification (Background)

When a message arrives while the app is in the background:

```
┌────────────────────────────────────────────────┐
│  📱 Phone Home Screen / Lock Screen            │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ 🔔 System Notification                   │ │
│  │ ┌────────────────────────────────────┐   │ │
│  │ │ 💬 MessageAI    Now              │   │ │
│  │ │ John Doe                           │   │ │
│  │ │ Hey, are you there?                │   │ │
│  │ └────────────────────────────────────┘   │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ╔════════════════════════════════════════╗  │
│  ║ 📱 Other Apps                          ║  │
│  ║                                        ║  │
│  ║                                        ║  │
│  ╚════════════════════════════════════════╝  │
└────────────────────────────────────────────────┘
```

**Behavior:**
- Standard iOS/Android notification
- Appears in notification center
- Tappable to open app
- Sound and vibration
- Badge count updated

---

## Notification Flow Diagram

```
┌─────────────┐
│  User A     │
│  Sends      │
│  Message    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  chatService.sendMessage()              │
│  1. Save to Firestore                   │
│  2. Update lastMessage                  │
│  3. Send real-time notification         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Firebase Realtime Database             │
│  /notifications/userB/abc123            │
│  { chatId, chatName, text, ... }        │
└──────────────┬──────────────────────────┘
               │
               ▼ (WebSocket - Instant!)
┌─────────────────────────────────────────┐
│  User B's Device                        │
│  realtimeNotificationService            │
│  Listener detects new notification      │
└──────────────┬──────────────────────────┘
               │
               ├─────────────┬──────────────┐
               │             │              │
               ▼             ▼              ▼
         ┌─────────┐   ┌─────────┐   ┌──────────┐
         │ Active  │   │Foreground│   │Background│
         │  Chat   │   │Different │   │   or     │
         │         │   │  Chat    │   │ Locked   │
         └────┬────┘   └────┬─────┘   └────┬─────┘
              │             │              │
              ▼             ▼              ▼
         ┌─────────┐   ┌─────────┐   ┌──────────┐
         │ Suppress│   │ In-App  │   │  Local   │
         │    🔕   │   │ Banner  │   │  Notif   │
         │         │   │  📬     │   │   🔔     │
         └─────────┘   └─────────┘   └──────────┘
```

---

## State Transitions

### Notification Store State Machine

```
                    ┌──────────────────┐
                    │   No Notification │
                    │   (idle)          │
                    └────────┬──────────┘
                             │
                    New notification arrives
                             │
                             ▼
                    ┌──────────────────┐
                    │   Showing         │
              ┌─────┤   Notification    ├─────┐
              │     │                   │     │
     Auto-dismiss   └──────────┬────────┘   Manual dismiss
     (4 seconds)               │              (X button)
              │                │                   │
              │       User taps notification       │
              │                │                   │
              └────────────────┴───────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Dismissed       │
                    │   Check queue     │
                    └────────┬──────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
             Queue empty            Queue has items
                  │                     │
                  ▼                     ▼
          ┌──────────────┐      ┌──────────────┐
          │   Idle       │      │  Show next   │
          └──────────────┘      │  (500ms delay)│
                                └──────┬────────┘
                                       │
                                       ▼
                                (back to "Showing")
```

---

## Component Hierarchy

```
App.tsx
├─ NotificationBanner (Absolute positioned at top)
│  ├─ Shows currentNotification from store
│  ├─ Animated.View for slide animation
│  └─ TouchableOpacity for tap handling
├─ ConnectionStatus (Below notification banner)
└─ AppNavigator (Main app content)
   └─ ChatScreen
      ├─ Sets activeChatId on mount
      ├─ Clears activeChatId on unmount
      └─ Messages display

Notification Flow:
realtimeNotificationService (listens) 
  → notificationService (decides banner vs local)
    → notificationStore (manages state)
      → NotificationBanner (displays)
```

---

## Firebase Realtime Database Structure

```
firebase-realtime-db/
├─ status/                    (User presence)
│  ├─ userId1/
│  │  ├─ state: "online"
│  │  └─ last_changed: 1234567890
│  └─ userId2/
│     ├─ state: "offline"
│     └─ last_changed: 1234567890
│
└─ notifications/             (Notification queue)
   ├─ userId1/
   │  ├─ notifId1/
   │  │  ├─ chatId: "chat123"
   │  │  ├─ chatName: "John Doe"
   │  │  ├─ messageText: "Hey!"
   │  │  ├─ senderId: "userId2"
   │  │  └─ timestamp: 1234567890
   │  └─ notifId2/           (Multiple notifications queued)
   │     └─ ...
   └─ userId2/
      └─ (empty - no pending notifications)

Note: Notifications are automatically removed after processing
```

---

## Timeline: Message Send to Notification Display

```
T=0ms    │ User A taps "Send" button
         │
T=50ms   │ chatService.sendMessage() called
         │ ├─ Message saved to Firestore
         │ ├─ lastMessage updated
         │ └─ sendRealtimeNotification() called
         │
T=100ms  │ Notification written to Realtime Database
         │ /notifications/userB/abc123
         │
T=110ms  │ User B's listener detects change (WebSocket!)
         │ onValue callback fires
         │
T=120ms  │ triggerMessageNotification() called
         │ ├─ Check activeChatId
         │ ├─ Check AppState
         │ └─ Decision made
         │
T=130ms  │ Notification displayed
         │ ├─ In-app banner: Slide animation starts
         │ └─ Local notification: System API called
         │
T=150ms  │ Notification visible to user
         │ Sound plays (if enabled)
         │
T=4150ms │ Auto-dismiss timer fires
         │ Banner slides out
         │
T=4650ms │ Next notification in queue processed
         │ (if any)

Total time from send to display: ~150ms
(Feels instant to users!)
```

---

## Color Scheme & Design

```
Banner Colors:
├─ Background: #FFFFFF (White)
├─ Border Left: #25D366 (WhatsApp Green)
├─ Icon Background: #E3F2ED (Light Green)
├─ Title Text: #000000 (Black)
├─ Body Text: #666666 (Dark Gray)
├─ Dismiss Button BG: #F0F0F0 (Light Gray)
└─ Shadow: rgba(0,0,0,0.25)

Animations:
├─ Slide In: Spring (friction: 8, tension: 40)
├─ Slide Out: Timing (duration: 300ms)
└─ Easing: Natural, bouncy feel

Dimensions:
├─ Banner Height: 80px
├─ Icon Size: 40x40px
├─ Border Radius: 12px
├─ Horizontal Margin: 12px
└─ Safe Area: Respects device notches
```

---

## User Interaction States

### Banner Touch States
```
┌─────────────────────────────────────────┐
│  Idle State (Default)                   │
│  ┌────────────────────────────────────┐ │
│  │ 💬  John Doe                    ✕  │ │
│  │     Hey, are you there?            │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Pressed State (Slightly transparent)   │
│  ┌────────────────────────────────────┐ │
│  │ 💬  John Doe                    ✕  │ │
│  │     Hey, are you there?            │ │ 90% opacity
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
         ↓ User releases
         ↓
┌─────────────────────────────────────────┐
│  Navigation Action                      │
│  App navigates to ChatScreen            │
│  Banner dismisses with slide animation  │
└─────────────────────────────────────────┘
```

---

This visual guide shows the complete notification system in action!


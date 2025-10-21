# UI Changes - New Chat Creation Flow

## ChatsListScreen - Before & After

### Before:
- Just had list of chats
- Logout button in header
- TODO comment about adding FAB

### After:
- **NEW**: Green floating action button (+) in bottom-right corner
- Tapping the FAB opens the NewChatScreen

```
┌─────────────────────────────┐
│ Chats              [Logout] │ ← Header
├─────────────────────────────┤
│                             │
│  💬 Chat with John         │
│  💬 Chat with Sarah        │
│  💬 Chat with Mike         │
│                             │
│                             │
│                        ┌───┐│
│                        │ + ││ ← FAB Button
│                        └───┘│
└─────────────────────────────┘
```

## NewChatScreen - New Screen

A brand new screen that shows:
1. Back button in header
2. Search bar to filter users
3. List of all users with:
   - Avatar (first letter of name)
   - Display name
   - Email
   - Online indicator (green dot)

```
┌─────────────────────────────┐
│ ← New Chat                  │ ← Header with back button
├─────────────────────────────┤
│ 🔍 Search by name or email  │ ← Search input
├─────────────────────────────┤
│                             │
│  [J] John Doe          ●    │ ← Online
│      john@example.com       │
│                             │
│  [S] Sarah Smith            │ ← Offline
│      sarah@example.com      │
│                             │
│  [M] Mike Johnson      ●    │ ← Online
│      mike@example.com       │
│                             │
└─────────────────────────────┘
```

## User Flow

1. User opens app → sees ChatsListScreen
2. Taps green **[+]** button
3. NewChatScreen opens
4. User can:
   - Scroll through all users
   - Search by name or email
   - Tap on any user
5. App creates/opens chat and navigates to ChatScreen

## Visual Design Details

### Floating Action Button (FAB)
- **Color**: #25D366 (WhatsApp green)
- **Size**: 56x56 pixels
- **Position**: 20px from right, 20px from bottom
- **Icon**: White "+" symbol
- **Shadow**: Material Design elevation 8
- **Effect**: Stands out clearly, easy to tap

### User List Items
- **Avatar**: Circular, green background, white letter
- **Name**: Bold, 16px
- **Email**: Gray, 14px
- **Online Indicator**: Small green dot (12px diameter)
- **Layout**: Avatar on left, info in center, indicator on right

### Search Bar
- **Background**: White with border
- **Placeholder**: "Search by name or email..."
- **Position**: Below header, above user list
- **Behavior**: Real-time filtering as you type

## Color Scheme
- **Primary Green**: #25D366 (FAB, avatars, online indicators)
- **Dark Green**: #1EA952 (borders)
- **White**: #fff (backgrounds, text on green)
- **Black**: #000 (primary text)
- **Gray**: #8e8e93 (secondary text)
- **Light Gray**: #f0f0f0 (borders, separators)


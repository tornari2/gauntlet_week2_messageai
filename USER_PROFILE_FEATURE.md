# User Profile Feature

## Overview

Added a user profile page where users can customize their display name and avatar color.

## Features

### 1. Profile Button
- **Location**: Bottom left of main chat screen
- **Icon**: Person icon (Ionicons)
- **Color**: Purple (#673AB7) for distinction
- **Action**: Navigates to User Profile screen

### 2. User Profile Screen

#### Display Name Editing
- Text input field for changing display name
- Max length: 50 characters
- Validation: Must not be empty
- Updates in Firestore and local auth store

#### Avatar Color Selection
- 12 pre-defined colors to choose from:
  - Green (#25D366) - Default WhatsApp green
  - Blue (#4FC3F7)
  - Purple (#9C27B0)
  - Red (#F44336)
  - Orange (#FF9800)
  - Pink (#E91E63)
  - Teal (#009688)
  - Indigo (#3F51B5)
  - Amber (#FFC107)
  - Deep Purple (#673AB7)
  - Cyan (#00BCD4)
  - Lime (#CDDC39)

- Grid layout with color circles
- Selected color shows checkmark
- Selected color has black border
- Real-time preview in avatar at top

#### Avatar Preview
- Large circular avatar (100x100)
- Shows first letter of display name (or email)
- Background color = selected avatar color
- Email address displayed below avatar

### 3. Data Storage

#### Firestore Structure
```typescript
/users/{userId}
  - displayName: string
  - avatarColor: string (hex code)
  - email: string
  - ... other fields
```

## UI/UX

### Layout
1. **Header**: Back button, "Profile" title
2. **Avatar Preview**: Large preview with selected color
3. **Display Name Section**: Text input with label
4. **Avatar Color Section**: Grid of 12 color options
5. **Save Button**: Green button at bottom

### Visual Design
- Clean, modern interface
- Smooth transitions
- Loading states for data fetching and saving
- Success/error alerts
- Disabled states while saving

## Files

### New Files
- `src/screens/UserProfileScreen.tsx` - Profile editing screen

### Modified Files
- `src/screens/ChatsListScreen.tsx` - Added profile button (bottom left FAB)
- `src/navigation/AppNavigator.tsx` - Added UserProfile route

## Navigation

```typescript
// From ChatsListScreen
navigation.navigate('UserProfile')

// Back to ChatsListScreen
navigation.goBack()
```

## Testing

### Test Cases
1. **Open Profile**
   - Tap purple button in bottom left
   - Should navigate to profile screen
   - Should show current name and color

2. **Change Display Name**
   - Type new name in input
   - Tap "Save Changes"
   - Should show success alert
   - Should navigate back
   - New name should appear in chats

3. **Change Avatar Color**
   - Tap on a color circle
   - Should show checkmark and black border
   - Avatar preview should update immediately
   - Tap "Save Changes"
   - Color should persist

4. **Validation**
   - Clear display name (empty)
   - Tap "Save Changes"
   - Should show error alert
   - Should NOT navigate back

5. **Loading States**
   - Should show loading spinner while fetching data
   - Save button should show spinner while saving
   - Button should be disabled while saving

## Implementation Details

### Color Selection
```typescript
const AVATAR_COLORS = [
  { name: 'Green', value: '#25D366' },
  // ... more colors
];
```

### Save Logic
```typescript
// Updates both Firestore and local auth store
await updateDoc(userRef, {
  displayName: displayName.trim(),
  avatarColor: selectedColor,
});

useAuthStore.setState({
  user: { ...user, displayName: displayName.trim() },
});
```

### Profile Button Position
```typescript
fabProfile: {
  left: 20,        // Bottom left
  right: 'auto',   // Override default right position
  bottom: 20,
  backgroundColor: '#673AB7',  // Purple
}
```

## Future Enhancements

Potential additions (not implemented):
1. **Profile Photos** - Upload actual photos instead of just colors
2. **Bio/Status** - Add a status message field
3. **Theme Selection** - Let users choose app color theme
4. **Privacy Settings** - Control who can see profile info
5. **Delete Account** - Option to delete user account

## Visual Preview

### Chat List with Profile Button
```
┌─────────────────────────────┐
│  Chats              Logout  │
├─────────────────────────────┤
│                             │
│  [Chat Items...]            │
│                             │
│  ⚫ (Profile)        ⚫ (New)│
│     (Bottom Left)           │
└─────────────────────────────┘
```

### Profile Screen
```
┌─────────────────────────────┐
│  ← Back      Profile        │
├─────────────────────────────┤
│         ╔═══╗              │
│         ║ A ║ ← Preview    │
│         ╚═══╝              │
│      user@email.com         │
│                             │
│  Display Name               │
│  ┌─────────────────────┐  │
│  │ Alice               │  │
│  └─────────────────────┘  │
│                             │
│  Avatar Color               │
│  ⚫ ⚫ ⚫ ⚫ ⚫ ⚫           │
│  ⚫ ⚫ ⚫ ⚫ ⚫ ⚫           │
│                             │
│  ┌─────────────────────┐  │
│  │   Save Changes      │  │
│  └─────────────────────┘  │
└─────────────────────────────┘
```

## Summary

The user profile feature provides a simple, intuitive way for users to personalize their presence in the app. The avatar color system provides visual distinction without the complexity of image uploads, while the display name gives users control over how they're identified.

**Status**: ✅ Complete and ready to test!


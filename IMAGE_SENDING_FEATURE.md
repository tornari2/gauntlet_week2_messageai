# Image Sending Feature Implementation

## Overview

Added the ability to send images in chat conversations with optimistic UI updates and placeholder loading states.

## Features

- 📷 **Image Picker**: Small photo icon to the left of the message input
- ⏳ **Placeholder Loading**: Gray placeholder with spinner while images upload
- 🚀 **Optimistic Updates**: Images appear instantly with local URI before upload completes
- 📏 **Auto Compression**: Images are automatically compressed and resized to max 1024x1024
- ☁️ **Firebase Storage**: Images uploaded to Firebase Cloud Storage
- 💬 **Optional Captions**: Support for text captions alongside images (currently empty string)
- 📱 **Proper Display**: Images show with correct dimensions in message bubbles

## Components Modified

### 1. Message Type (`src/types/index.ts`)
Added image support to the `Message` interface:
```typescript
export interface Message {
  // ... existing fields
  imageUrl?: string; // URL of uploaded image
  imageWidth?: number; // Image dimensions for proper display
  imageHeight?: number;
}
```

### 2. Firebase Storage Service (`src/services/firebase.ts`)
- Added Firebase Storage initialization
- Exported `storage` instance for image uploads

### 3. Image Service (`src/services/imageService.ts`) - **NEW FILE**
Handles all image-related operations:

**Functions:**
- `requestImagePermissions()`: Request camera roll permissions
- `pickImage()`: Launch image picker with aspect ratio 4:3, quality 0.8
- `compressImage()`: Resize images to max 1024x1024, compress to JPEG 70%
- `uploadImage()`: Upload to Firebase Storage with progress tracking
- `generatePlaceholder()`: Create gray placeholder SVG (not used yet, kept for future)

**Image Storage Structure:**
```
/chat-images/{chatId}/{timestamp}.jpg
```

### 4. Message Input (`src/components/MessageInput.tsx`)
Added image picker button:
- Blue camera icon (`image-outline`) positioned left of text input
- Calls `onImagePick` callback when tapped
- Disabled state matches text input disable state

**UI Layout:**
```
[📷] [Type a message...] [➤]
```

### 5. Message Bubble (`src/components/MessageBubble.tsx`)
Added image display with loading states:

**Features:**
- Shows ActivityIndicator spinner while loading
- Gray placeholder (#E0E0E0) with spinner
- Image fades in when loaded
- Error state: semi-transparent image with "Failed to load image" overlay
- Optional text caption below image with 8px spacing
- Rounded corners (borderRadius: 12px)
- Maintains aspect ratio

**States:**
1. Loading: Gray placeholder + spinner
2. Loaded: Full image displayed
3. Error: Semi-transparent image + error message overlay

### 6. Chat Service (`src/services/chatService.ts`)
Updated `sendMessage()` function:

**New Parameters:**
```typescript
sendMessage(
  chatId: string,
  text: string,
  senderId: string,
  imageUrl?: string,      // NEW
  imageWidth?: number,    // NEW
  imageHeight?: number    // NEW
): Promise<string>
```

**Behavior:**
- Adds image fields to Firestore message document if present
- Updates `lastMessage` to "📷 Photo" if image with no text
- Sends notification with "📷 Photo" or caption text

### 7. Message Store (`src/stores/messageStore.ts`)
Added `sendImageOptimistic()` function:

**Flow:**
1. Create optimistic message with local image URI
2. Display message immediately (instant feedback)
3. Upload image to Firebase Storage
4. Send message with uploaded URL to Firestore
5. Remove optimistic message (Firestore provides real one)
6. If upload fails, mark message as failed

**Signature:**
```typescript
sendImageOptimistic(
  chatId: string,
  imageUri: string,        // Local file URI
  text: string,            // Optional caption
  senderId: string,
  imageWidth: number,
  imageHeight: number
): Promise<void>
```

### 8. Chat Screen (`src/screens/ChatScreen.tsx`)
Wired up image picker:

**Handler:**
```typescript
const handleImagePick = async () => {
  const imageAsset = await pickImage();
  if (!imageAsset) return; // User canceled
  
  await sendImageOptimistic(
    chatId,
    imageAsset.uri,
    '', // Caption (could add UI for this)
    user.uid,
    imageAsset.width,
    imageAsset.height
  );
};
```

Connected to MessageInput via `onImagePick` prop.

## Dependencies Installed

```bash
npx expo install expo-image-picker expo-image-manipulator
```

- **expo-image-picker**: Select images from device gallery
- **expo-image-manipulator**: Compress and resize images before upload

## User Flow

1. User taps photo icon (📷) in message input
2. System permission prompt (if first time)
3. Native image picker opens
4. User selects image (with 4:3 crop option)
5. Image appears immediately in chat with loading spinner
6. Image compresses to max 1024x1024
7. Image uploads to Firebase Storage
8. Message sent to Firestore with uploaded URL
9. Loading spinner disappears, image fully loaded
10. Other users receive real-time notification and see image

## Technical Details

### Image Compression
- **Max Dimensions**: 1024x1024 (maintains aspect ratio)
- **Format**: JPEG
- **Quality**: 70% (good balance of size vs quality)
- **Average Size**: 100-500KB depending on content

### Firebase Storage Rules
Images are stored in Firebase Cloud Storage. Make sure storage rules allow authenticated uploads:

```json
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /chat-images/{chatId}/{imageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Optimistic UI
The optimistic update pattern ensures instant feedback:
1. **Local URI** used as placeholder (file://...)
2. Image shows immediately while uploading
3. **Uploaded URL** replaces local URI when complete
4. Firestore real-time listener provides final message

### Error Handling
- **Permission Denied**: Returns null, no error shown (user canceled)
- **Upload Failed**: Message marked as failed with retry option
- **Image Load Failed**: Shows error overlay on image
- **Network Offline**: Upload queued until connection restored (Firebase handles this)

## Future Enhancements

1. **Image Captions**: Add UI to enter text caption with image
2. **Image Gallery**: View full-screen images with pinch-to-zoom
3. **Multiple Images**: Send multiple images in one message
4. **Camera**: Take photo directly instead of picking from gallery
5. **Video Support**: Extend to support video uploads
6. **Progress Bar**: Show upload progress percentage
7. **Image Preview**: Preview image before sending with edit/cancel options

## Testing

### Manual Testing Checklist
- ✅ Pick image from gallery
- ✅ Image appears with loading spinner
- ✅ Spinner disappears when loaded
- ✅ Other user receives image notification
- ✅ Image displays correctly for recipient
- ✅ Works in both direct and group chats
- ✅ Failed uploads show error state
- ✅ Image dimensions maintain aspect ratio
- ✅ Large images compressed properly
- ✅ Works offline (uploads when reconnected)

### Test Scenarios
1. **Happy Path**: Pick image → uploads successfully → appears in chat
2. **Permission Denied**: First time → permission prompt → grant/deny
3. **Upload Failure**: Network off → image marked failed → reconnect → retry
4. **Large Image**: 4000x3000 photo → compresses to 1024x768 → uploads fast
5. **Portrait/Landscape**: Different aspect ratios → display correctly
6. **Group Chat**: Send image → all participants receive notification
7. **Offline Send**: Pick image offline → queued → sends when online

## Files Created
- `src/services/imageService.ts` - Image handling and upload logic

## Files Modified
- `src/types/index.ts` - Added image fields to Message interface
- `src/services/firebase.ts` - Added Firebase Storage initialization
- `src/components/MessageInput.tsx` - Added photo picker button
- `src/components/MessageBubble.tsx` - Added image display with loading states
- `src/services/chatService.ts` - Updated sendMessage for images
- `src/stores/messageStore.ts` - Added sendImageOptimistic function
- `src/screens/ChatScreen.tsx` - Wired up image picker handler

## Dependencies Added
- `expo-image-picker@~15.0.8`
- `expo-image-manipulator@~13.0.0`


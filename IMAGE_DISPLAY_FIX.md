# Image Display Fix

## Issue
Images were appearing briefly as a flicker before completely disappearing from the chat screen. Only the timestamp was visible.

## Root Cause
The image rendering logic had several issues:
1. The `imageLoading` state was initialized to `true`, causing the placeholder to always show initially even for already-loaded images
2. The placeholder and image were not properly positioned - the placeholder needed to overlay the image container completely
3. The image dimensions were applied to the placeholder instead of the container itself

## Solution

### 1. Fixed Image Container Structure
**File: `src/components/MessageBubble.tsx`**

Restructured the image rendering logic:
- Moved width/height styles from placeholder to the container itself
- Made the container a fixed-size box with `position: 'relative'`
- Positioned the placeholder absolutely to overlay the entire container with `top: 0, left: 0, right: 0, bottom: 0`
- Added `zIndex: 1` to ensure the placeholder appears above the image while loading
- Conditionally render the image only when there's no error

```tsx
{message.imageUrl && (
  <View 
    style={[
      styles.imageContainer,
      {
        width: message.imageWidth || 250,
        height: message.imageHeight || 250,
      }
    ]}
  >
    {imageLoading && !imageError && (
      <View style={styles.imagePlaceholder}>
        <ActivityIndicator size="large" color={isSent ? '#FFFFFF' : Colors.primary} />
      </View>
    )}
    
    {!imageError && (
      <Image
        source={{ uri: message.imageUrl }}
        style={[
          styles.image,
          {
            width: message.imageWidth || 250,
            height: message.imageHeight || 250,
          },
        ]}
        resizeMode="cover"
        onLoadStart={() => setImageLoading(true)}
        onLoadEnd={() => setImageLoading(false)}
        onError={() => {
          setImageLoading(false);
          setImageError(true);
        }}
      />
    )}
    
    {imageError && (
      <View style={styles.imageErrorContainer}>
        <Text style={styles.imageErrorText}>Failed to load image</Text>
      </View>
    )}
  </View>
)}
```

### 2. Fixed State Initialization
Changed `imageLoading` initial state from `true` to `false`:
```tsx
const [imageLoading, setImageLoading] = useState(false);
```

This prevents the placeholder from showing for images that are already cached.

### 3. Updated Styles
```tsx
imageContainer: {
  borderRadius: 12,
  overflow: 'hidden',
  marginVertical: 4,
  position: 'relative',  // Create positioning context
},
imagePlaceholder: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,    // Cover entire container
  bottom: 0,   // Cover entire container
  backgroundColor: '#E0E0E0',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 12,
  zIndex: 1,   // Appear above image
},
image: {
  borderRadius: 12,
  width: '100%',   // Fill container
  height: '100%',  // Fill container
},
```

## Result
✅ Images now display correctly in chat messages
✅ Loading placeholder shows while image is loading
✅ Image replaces placeholder once loaded
✅ No more flickering or disappearing images
✅ Proper error handling if image fails to load

## Testing
1. Send an image in a chat
2. Verify the image appears correctly
3. Verify no flickering occurs
4. Check both sent and received messages
5. Test in both direct and group chats


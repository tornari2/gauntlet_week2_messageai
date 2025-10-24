/**
 * Image Service - Handle image uploads to Firebase Storage
 */

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Request camera roll permissions
 */
export const requestImagePermissions = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
};

/**
 * Pick an image from the device gallery
 */
export const pickImage = async (): Promise<ImagePicker.ImagePickerAsset | null> => {
  try {
    // Request permissions first
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      console.log('Image picker permission denied');
      return null;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6, // Lower quality for faster processing
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
};

/**
 * Compress and resize image before upload
 * Smaller size for chat messages (more modest display)
 */
export const compressImage = async (
  uri: string,
  maxWidth: number = 400,
  maxHeight: number = 400
): Promise<{ uri: string; width: number; height: number }> => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth, height: maxHeight } }],
      {
        compress: 0.6, // Good balance of quality and size
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return {
      uri: manipResult.uri,
      width: manipResult.width,
      height: manipResult.height,
    };
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original if compression fails
    return { uri, width: maxWidth, height: maxHeight };
  }
};

/**
 * Upload image to Firebase Storage
 * @param uri - Local file URI
 * @param chatId - Chat ID for organizing uploads
 * @param onProgress - Progress callback (0-1)
 * @returns Download URL and image dimensions
 */
export const uploadImage = async (
  uri: string,
  chatId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; width: number; height: number }> => {
  try {
    // Compress image first
    const compressed = await compressImage(uri);

    // Convert URI to blob
    const response = await fetch(compressed.uri);
    const blob = await response.blob();

    // Create unique filename
    const timestamp = Date.now();
    const filename = `chat-images/${chatId}/${timestamp}.jpg`;
    const storageRef = ref(storage, filename);

    // Upload with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = snapshot.bytesTransferred / snapshot.totalBytes;
          onProgress?.(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              url: downloadURL,
              width: compressed.width,
              height: compressed.height,
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Generate a placeholder data URI for immediate display
 */
export const generatePlaceholder = (width: number, height: number): string => {
  // Simple gray placeholder as data URI
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'%3E%3Crect fill='%23e0e0e0' width='${width}' height='${height}'/%3E%3C/svg%3E`;
};


/**
 * Photo Save Service
 * 
 * Saves images to device photo library
 */

import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';

/**
 * Request permission to save to photos
 */
export async function requestPhotoLibraryPermission(): Promise<boolean> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant permission to save images to your photo library.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting photo library permission:', error);
    return false;
  }
}

/**
 * Save an image to the device photo library
 * 
 * @param imageUri - URI of the image to save
 * @param albumName - Optional album name to save to
 */
export async function saveToPhotos(
  imageUri: string,
  albumName: string = 'MessageAI'
): Promise<boolean> {
  try {
    // Request permission
    const hasPermission = await requestPhotoLibraryPermission();
    if (!hasPermission) {
      return false;
    }

    // Save to library
    const asset = await MediaLibrary.createAssetAsync(imageUri);
    
    // Create or get album
    if (Platform.OS === 'ios') {
      // iOS requires creating an album
      let album = await MediaLibrary.getAlbumAsync(albumName);
      
      if (album === null) {
        album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
    }
    
    Alert.alert(
      'Success',
      'Image saved to your photos!',
      [{ text: 'OK' }]
    );
    
    return true;
  } catch (error) {
    console.error('Error saving to photos:', error);
    
    Alert.alert(
      'Save Failed',
      'Could not save image to photos. Please try again.',
      [{ text: 'OK' }]
    );
    
    return false;
  }
}


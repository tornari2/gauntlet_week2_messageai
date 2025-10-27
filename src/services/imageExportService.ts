/**
 * Image Export Service
 * 
 * Captures views as images for saving and sharing
 */

import { captureRef } from 'react-native-view-shot';
import { Alert } from 'react-native';

/**
 * Capture a React ref as an image
 * Returns the URI of the captured image
 */
export async function captureViewAsImage(
  viewRef: React.RefObject<any>,
  options?: {
    format?: 'png' | 'jpg';
    quality?: number;
  }
): Promise<string> {
  try {
    if (!viewRef.current) {
      throw new Error('View ref is not available');
    }

    const uri = await captureRef(viewRef, {
      format: options?.format || 'png',
      quality: options?.quality || 1.0,
      result: 'tmpfile',
    });

    return uri;
  } catch (error) {
    console.error('Error capturing view as image:', error);
    throw error;
  }
}

/**
 * Show error alert
 */
export function showExportError(error: any) {
  Alert.alert(
    'Export Failed',
    'Could not save image. Please try again.',
    [{ text: 'OK' }]
  );
}


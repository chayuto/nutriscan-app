/**
 * useCamera Hook
 *
 * Manages camera operations including photo capture and gallery selection.
 * Integrates with usePermissions for permission handling.
 *
 * Features:
 * - Camera photo capture
 * - Gallery photo selection
 * - Permission management
 * - Loading states
 * - Error handling
 *
 * @example
 * ```typescript
 * const { capturePhoto, pickFromGallery, isCapturing, error } = useCamera();
 *
 * const handleTakePhoto = async () => {
 *   const uri = await capturePhoto();
 *   if (uri) {
 *     // Process photo
 *   }
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { usePermissions } from './usePermissions';

export interface UseCameraReturn {
  /**
   * Capture a photo using the camera
   * @returns Image URI or null if cancelled/failed
   */
  capturePhoto: () => Promise<string | null>;

  /**
   * Pick an image from the gallery
   * @returns Image URI or null if cancelled/failed
   */
  pickFromGallery: () => Promise<string | null>;

  /**
   * Whether a camera capture is in progress
   */
  isCapturing: boolean;

  /**
   * Whether gallery picking is in progress
   */
  isPicking: boolean;

  /**
   * Camera permission status
   */
  cameraPermission: {
    hasPermission: boolean;
    request: () => Promise<boolean>;
    openSettings: () => Promise<void>;
  };

  /**
   * Gallery permission status
   */
  galleryPermission: {
    hasPermission: boolean;
    request: () => Promise<boolean>;
    openSettings: () => Promise<void>;
  };

  /**
   * Error message if operation failed
   */
  error: string | null;
}

/**
 * Hook for camera operations with integrated permission handling
 *
 * @returns Camera operation functions and state
 */
export function useCamera(): UseCameraReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Permission hooks
  const cameraPerms = usePermissions('camera');
  const galleryPerms = usePermissions('media-library');

  /**
   * Capture a photo using the camera
   */
  const capturePhoto = useCallback(async (): Promise<string | null> => {
    try {
      setIsCapturing(true);
      setError(null);

      // Check permission
      if (!cameraPerms.hasPermission) {
        const granted = await cameraPerms.request();
        if (!granted) {
          setError('Camera permission is required to take photos');
          return null;
        }
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1, // Max quality (will be compressed by image service)
        exif: false,
      });

      // Check if user cancelled
      if (result.canceled) {
        return null;
      }

      // Return first image URI
      if (result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }

      setError('No image was captured');
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to capture photo';
      setError(message);
      console.error('[useCamera] Error capturing photo:', err);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [cameraPerms]);

  /**
   * Pick an image from the gallery
   */
  const pickFromGallery = useCallback(async (): Promise<string | null> => {
    try {
      setIsPicking(true);
      setError(null);

      // Check permission
      if (!galleryPerms.hasPermission) {
        const granted = await galleryPerms.request();
        if (!granted) {
          setError('Gallery permission is required to select photos');
          return null;
        }
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1, // Max quality (will be compressed by image service)
        exif: false,
      });

      // Check if user cancelled
      if (result.canceled) {
        return null;
      }

      // Return first image URI
      if (result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }

      setError('No image was selected');
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pick image';
      setError(message);
      console.error('[useCamera] Error picking image:', err);
      return null;
    } finally {
      setIsPicking(false);
    }
  }, [galleryPerms]);

  return {
    capturePhoto,
    pickFromGallery,
    isCapturing,
    isPicking,
    cameraPermission: {
      hasPermission: cameraPerms.hasPermission,
      request: cameraPerms.request,
      openSettings: cameraPerms.openSettings,
    },
    galleryPermission: {
      hasPermission: galleryPerms.hasPermission,
      request: galleryPerms.request,
      openSettings: galleryPerms.openSettings,
    },
    error,
  };
}

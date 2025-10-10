/**
 * usePermissions Hook
 *
 * Generic permission management hook for handling various permissions
 * (camera, media library, etc.) with platform-specific behavior.
 *
 * Features:
 * - Automatic permission check on mount
 * - Request permission with loading state
 * - Open settings when permission denied
 * - Platform-specific handling (iOS canAskAgain)
 *
 * @example
 * ```typescript
 * const { status, hasPermission, request, openSettings, canAskAgain } =
 *   usePermissions('camera');
 *
 * if (!hasPermission) {
 *   return <Button onPress={request}>Grant Camera Access</Button>;
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { Linking, Alert } from 'react-native';
import * as Camera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export type PermissionType = 'camera' | 'media-library';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

export interface UsePermissionsReturn {
  /**
   * Current permission status
   */
  status: PermissionStatus;

  /**
   * Whether permission is granted
   */
  hasPermission: boolean;

  /**
   * Whether we can ask again (iOS specific)
   * Always true on Android
   */
  canAskAgain: boolean;

  /**
   * Request permission from user
   */
  request: () => Promise<boolean>;

  /**
   * Open device settings (for when permission is denied)
   */
  openSettings: () => Promise<void>;

  /**
   * Whether a request is in progress
   */
  isRequesting: boolean;

  /**
   * Error if permission check/request failed
   */
  error: string | null;
}

/**
 * Hook for managing permissions with React state
 *
 * @param type - Permission type to manage
 * @returns Permission state and control functions
 */
export function usePermissions(type: PermissionType): UsePermissionsReturn {
  const [status, setStatus] = useState<PermissionStatus>('undetermined');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check current permission status
   */
  const checkPermission = useCallback(async () => {
    try {
      setError(null);
      let result;

      if (type === 'camera') {
        result = await Camera.Camera.getCameraPermissionsAsync();
      } else if (type === 'media-library') {
        result = await ImagePicker.getMediaLibraryPermissionsAsync();
      } else {
        throw new Error(`Unknown permission type: ${type}`);
      }

      // Map expo status to our simplified status
      const mappedStatus: PermissionStatus = result.granted
        ? 'granted'
        : result.status === 'undetermined'
          ? 'undetermined'
          : 'denied';

      setStatus(mappedStatus);
      setCanAskAgain(result.canAskAgain ?? true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check permission';
      setError(message);
      console.error(`[usePermissions] Error checking ${type}:`, err);
    }
  }, [type]);

  /**
   * Request permission from user
   */
  const request = useCallback(async (): Promise<boolean> => {
    try {
      setIsRequesting(true);
      setError(null);

      let result;

      if (type === 'camera') {
        result = await Camera.Camera.requestCameraPermissionsAsync();
      } else if (type === 'media-library') {
        result = await ImagePicker.requestMediaLibraryPermissionsAsync();
      } else {
        throw new Error(`Unknown permission type: ${type}`);
      }

      const mappedStatus: PermissionStatus = result.granted
        ? 'granted'
        : result.status === 'undetermined'
          ? 'undetermined'
          : 'denied';

      setStatus(mappedStatus);
      setCanAskAgain(result.canAskAgain ?? true);

      return result.granted;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request permission';
      setError(message);
      console.error(`[usePermissions] Error requesting ${type}:`, err);
      return false;
    } finally {
      setIsRequesting(false);
    }
  }, [type]);

  /**
   * Open device settings app
   */
  const openSettings = useCallback(async (): Promise<void> => {
    try {
      const permissionName = type === 'camera' ? 'Camera' : 'Media Library';

      Alert.alert(
        `${permissionName} Access Needed`,
        `Please enable ${permissionName} access in Settings to use this feature.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Open Settings',
            onPress: async () => {
              const canOpen = await Linking.canOpenURL('app-settings:');
              if (canOpen) {
                await Linking.openSettings();
              } else {
                setError('Unable to open settings');
              }
            },
          },
        ]
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open settings';
      setError(message);
      console.error('[usePermissions] Error opening settings:', err);
    }
  }, [type]);

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const hasPermission = status === 'granted';

  return {
    status,
    hasPermission,
    canAskAgain,
    request,
    openSettings,
    isRequesting,
    error,
  };
}

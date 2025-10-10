/**
 * Tests for usePermissions hook
 *
 * Uses @testing-library/react-native which is the recommended approach
 * for React Native + Expo projects (instead of deprecated @testing-library/react-hooks)
 */

// Mock dependencies BEFORE imports
jest.mock('expo-camera', () => ({
  Camera: {
    getCameraPermissionsAsync: jest.fn(),
    requestCameraPermissionsAsync: jest.fn(),
  },
  CameraType: {},
  FlashMode: {},
}));

jest.mock('expo-image-picker', () => ({
  getMediaLibraryPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {},
}));

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    canOpenURL: jest.fn(),
    openSettings: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import * as Camera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { usePermissions, PermissionType } from '../usePermissions';

describe('usePermissions', () => {
  // Type-safe mocks
  const mockGetCameraPermissions = Camera.Camera.getCameraPermissionsAsync as jest.Mock;
  const mockRequestCameraPermissions = Camera.Camera.requestCameraPermissionsAsync as jest.Mock;
  const mockGetMediaLibraryPermissions = ImagePicker.getMediaLibraryPermissionsAsync as jest.Mock;
  const mockRequestMediaLibraryPermissions =
    ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
  const mockAlertAlert = Alert.alert as jest.Mock;
  const mockLinkingCanOpenURL = Linking.canOpenURL as jest.MockedFunction<
    typeof Linking.canOpenURL
  >;
  const mockLinkingOpenSettings = Linking.openSettings as jest.MockedFunction<
    typeof Linking.openSettings
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('Camera permissions', () => {
    const permissionType: PermissionType = 'camera';

    it('should initialize with undetermined status', () => {
      mockGetCameraPermissions.mockResolvedValue({
        status: 'undetermined',
        granted: false,
        canAskAgain: true,
      });

      const { result } = renderHook(() => usePermissions(permissionType));

      expect(result.current.status).toBe('undetermined');
      expect(result.current.hasPermission).toBe(false);
      expect(result.current.canAskAgain).toBe(true);
      expect(result.current.isRequesting).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should check camera permission on mount', async () => {
      mockGetCameraPermissions.mockResolvedValue({
        status: 'granted',
        granted: true,
        canAskAgain: true,
      });

      const { result } = renderHook(() => usePermissions(permissionType));

      await waitFor(() => {
        expect(result.current.status).toBe('granted');
      });

      expect(mockGetCameraPermissions).toHaveBeenCalledTimes(1);
      expect(result.current.hasPermission).toBe(true);
    });

    it('should request camera permission successfully', async () => {
      mockGetCameraPermissions.mockResolvedValue({
        status: 'undetermined',
        granted: false,
        canAskAgain: true,
      });

      mockRequestCameraPermissions.mockResolvedValue({
        status: 'granted',
        granted: true,
        canAskAgain: true,
      });

      const { result } = renderHook(() => usePermissions(permissionType));

      let requestResult: boolean = false;
      await act(async () => {
        requestResult = await result.current.request();
      });

      expect(requestResult).toBe(true);
      expect(result.current.status).toBe('granted');
      expect(result.current.hasPermission).toBe(true);
      expect(mockRequestCameraPermissions).toHaveBeenCalledTimes(1);
    });

    it('should handle permission denial', async () => {
      mockGetCameraPermissions.mockResolvedValue({
        status: 'undetermined',
        granted: false,
        canAskAgain: true,
      });

      mockRequestCameraPermissions.mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: false,
      });

      const { result } = renderHook(() => usePermissions(permissionType));

      let requestResult: boolean = false;
      await act(async () => {
        requestResult = await result.current.request();
      });

      expect(requestResult).toBe(false);
      expect(result.current.status).toBe('denied');
      expect(result.current.hasPermission).toBe(false);
      expect(result.current.canAskAgain).toBe(false);
    });

    it('should set isRequesting during permission request', async () => {
      mockGetCameraPermissions.mockResolvedValue({
        status: 'undetermined',
        granted: false,
        canAskAgain: true,
      });

      mockRequestCameraPermissions.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  status: 'granted',
                  granted: true,
                  canAskAgain: true,
                }),
              100
            )
          )
      );

      const { result } = renderHook(() => usePermissions(permissionType));

      let requestPromise: Promise<boolean>;
      act(() => {
        requestPromise = result.current.request();
      });

      // Should be requesting immediately
      expect(result.current.isRequesting).toBe(true);

      await act(async () => {
        await requestPromise;
      });

      // Should no longer be requesting
      expect(result.current.isRequesting).toBe(false);
    });

    it('should handle error during permission check', async () => {
      const errorMessage = 'Camera not available';
      mockGetCameraPermissions.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePermissions(permissionType));

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[usePermissions] Error checking camera'),
        expect.any(Error)
      );
    });

    it('should handle error during permission request', async () => {
      mockGetCameraPermissions.mockResolvedValue({
        status: 'undetermined',
        granted: false,
        canAskAgain: true,
      });

      const errorMessage = 'Permission request failed';
      mockRequestCameraPermissions.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePermissions(permissionType));

      let requestResult: boolean = false;
      await act(async () => {
        requestResult = await result.current.request();
      });

      expect(requestResult).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isRequesting).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[usePermissions] Error requesting camera'),
        expect.any(Error)
      );
    });
  });

  describe('Media library permissions', () => {
    const permissionType: PermissionType = 'media-library';

    it('should check media library permission on mount', async () => {
      mockGetMediaLibraryPermissions.mockResolvedValue({
        status: 'granted',
        granted: true,
        canAskAgain: true,
      });

      const { result } = renderHook(() => usePermissions(permissionType));

      await waitFor(() => {
        expect(result.current.status).toBe('granted');
      });

      expect(mockGetMediaLibraryPermissions).toHaveBeenCalledTimes(1);
      expect(result.current.hasPermission).toBe(true);
    });

    it('should request media library permission successfully', async () => {
      mockGetMediaLibraryPermissions.mockResolvedValue({
        status: 'undetermined',
        granted: false,
        canAskAgain: true,
      });

      mockRequestMediaLibraryPermissions.mockResolvedValue({
        status: 'granted',
        granted: true,
        canAskAgain: true,
      });

      const { result } = renderHook(() => usePermissions(permissionType));

      let requestResult: boolean = false;
      await act(async () => {
        requestResult = await result.current.request();
      });

      expect(requestResult).toBe(true);
      expect(result.current.status).toBe('granted');
      expect(mockRequestMediaLibraryPermissions).toHaveBeenCalledTimes(1);
    });

    it('should handle media library permission denial', async () => {
      mockGetMediaLibraryPermissions.mockResolvedValue({
        status: 'undetermined',
        granted: false,
        canAskAgain: true,
      });

      mockRequestMediaLibraryPermissions.mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: true,
      });

      const { result } = renderHook(() => usePermissions(permissionType));

      let requestResult: boolean = false;
      await act(async () => {
        requestResult = await result.current.request();
      });

      expect(requestResult).toBe(false);
      expect(result.current.status).toBe('denied');
    });
  });

  describe('openSettings', () => {
    it('should show alert and open settings for camera permission', async () => {
      mockGetCameraPermissions.mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: false,
      });

      mockLinkingCanOpenURL.mockResolvedValue(true);
      mockLinkingOpenSettings.mockResolvedValue();

      const { result } = renderHook(() => usePermissions('camera'));

      await act(async () => {
        await result.current.openSettings();
      });

      // Verify alert was called with correct parameters
      expect(mockAlertAlert).toHaveBeenCalledWith(
        'Camera Access Needed',
        'Please enable Camera access in Settings to use this feature.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Open Settings',
            onPress: expect.any(Function),
          },
        ]
      );

      // Simulate user pressing "Open Settings"
      const alertCall = mockAlertAlert.mock.calls[0];
      const openSettingsButton = alertCall[2][1];
      await act(async () => {
        await openSettingsButton.onPress();
      });

      expect(mockLinkingCanOpenURL).toHaveBeenCalledWith('app-settings:');
      expect(mockLinkingOpenSettings).toHaveBeenCalled();
    });

    it('should show alert with Media Library text for media-library permission', async () => {
      mockGetMediaLibraryPermissions.mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: false,
      });

      mockLinkingCanOpenURL.mockResolvedValue(true);
      mockLinkingOpenSettings.mockResolvedValue();

      const { result } = renderHook(() => usePermissions('media-library'));

      await act(async () => {
        await result.current.openSettings();
      });

      expect(mockAlertAlert).toHaveBeenCalledWith(
        'Media Library Access Needed',
        'Please enable Media Library access in Settings to use this feature.',
        expect.any(Array)
      );
    });

    it('should handle error when unable to open settings', async () => {
      mockGetCameraPermissions.mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: false,
      });

      mockLinkingCanOpenURL.mockResolvedValue(false);

      const { result } = renderHook(() => usePermissions('camera'));

      await act(async () => {
        await result.current.openSettings();
      });

      // Simulate user pressing "Open Settings"
      const alertCall = mockAlertAlert.mock.calls[0];
      const openSettingsButton = alertCall[2][1];
      await act(async () => {
        await openSettingsButton.onPress();
      });

      expect(result.current.error).toBe('Unable to open settings');
      expect(mockLinkingOpenSettings).not.toHaveBeenCalled();
    });

    it('should handle error during openSettings call', async () => {
      mockGetCameraPermissions.mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: false,
      });

      const errorMessage = 'Settings error';
      mockAlertAlert.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      const { result } = renderHook(() => usePermissions('camera'));

      await act(async () => {
        await result.current.openSettings();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[usePermissions] Error opening settings'),
        expect.any(Error)
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle canAskAgain being undefined', async () => {
      mockGetCameraPermissions.mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: undefined,
      });

      const { result } = renderHook(() => usePermissions('camera'));

      await waitFor(() => {
        expect(result.current.canAskAgain).toBe(true);
      });
    });

    it('should handle non-Error objects in catch blocks', async () => {
      mockGetCameraPermissions.mockRejectedValue('String error');

      const { result } = renderHook(() => usePermissions('camera'));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to check permission');
      });
    });

    it('should map undetermined status correctly', async () => {
      mockGetCameraPermissions.mockResolvedValue({
        status: 'undetermined',
        granted: false,
        canAskAgain: true,
      });

      const { result } = renderHook(() => usePermissions('camera'));

      await waitFor(() => {
        expect(result.current.status).toBe('undetermined');
        expect(result.current.hasPermission).toBe(false);
      });
    });

    it('should clear error on successful request after previous error', async () => {
      mockGetCameraPermissions.mockRejectedValue(new Error('Initial error'));

      const { result } = renderHook(() => usePermissions('camera'));

      await waitFor(() => {
        expect(result.current.error).toBe('Initial error');
      });

      // Now request should succeed
      mockRequestCameraPermissions.mockResolvedValue({
        status: 'granted',
        granted: true,
        canAskAgain: true,
      });

      await act(async () => {
        await result.current.request();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.status).toBe('granted');
    });
  });
});

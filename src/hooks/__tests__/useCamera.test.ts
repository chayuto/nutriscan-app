/**
 * Tests for useCamera hook
 */

// Mock dependencies BEFORE imports
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
  getMediaLibraryPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
}));

jest.mock('expo-camera', () => ({
  Camera: {
    getCameraPermissionsAsync: jest.fn(),
    requestCameraPermissionsAsync: jest.fn(),
  },
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
import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';
import { useCamera } from '../useCamera';

describe('useCamera', () => {
  // Type-safe mocks
  const mockLaunchCamera = ImagePicker.launchCameraAsync as jest.Mock;
  const mockLaunchGallery = ImagePicker.launchImageLibraryAsync as jest.Mock;
  const mockGetCameraPermissions = Camera.Camera.getCameraPermissionsAsync as jest.Mock;
  const mockRequestCameraPermissions = Camera.Camera.requestCameraPermissionsAsync as jest.Mock;
  const mockGetGalleryPermissions = ImagePicker.getMediaLibraryPermissionsAsync as jest.Mock;
  const mockRequestGalleryPermissions =
    ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Default permission mocks
    mockGetCameraPermissions.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    });

    mockGetGalleryPermissions.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    });
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('capturePhoto', () => {
    it('should capture photo successfully with existing permission', async () => {
      const mockUri = 'file:///path/to/photo.jpg';
      mockLaunchCamera.mockResolvedValue({
        canceled: false,
        assets: [{ uri: mockUri }],
      });

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.cameraPermission.hasPermission).toBe(true);
      });

      let uri: string | null = null;
      await act(async () => {
        uri = await result.current.capturePhoto();
      });

      expect(uri).toBe(mockUri);
      expect(mockLaunchCamera).toHaveBeenCalledWith({
        mediaTypes: 'Images',
        allowsEditing: false,
        quality: 1,
        exif: false,
      });
      expect(result.current.error).toBe(null);
    });

    it('should request permission if not granted', async () => {
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

      const mockUri = 'file:///path/to/photo.jpg';
      mockLaunchCamera.mockResolvedValue({
        canceled: false,
        assets: [{ uri: mockUri }],
      });

      const { result } = renderHook(() => useCamera());

      let uri: string | null = null;
      await act(async () => {
        uri = await result.current.capturePhoto();
      });

      expect(mockRequestCameraPermissions).toHaveBeenCalled();
      expect(uri).toBe(mockUri);
    });

    it('should return null if permission denied', async () => {
      mockGetCameraPermissions.mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: false,
      });

      mockRequestCameraPermissions.mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: false,
      });

      const { result } = renderHook(() => useCamera());

      let uri: string | null = null;
      await act(async () => {
        uri = await result.current.capturePhoto();
      });

      expect(uri).toBe(null);
      expect(result.current.error).toBe('Camera permission is required to take photos');
      expect(mockLaunchCamera).not.toHaveBeenCalled();
    });

    it('should return null if user cancels', async () => {
      mockLaunchCamera.mockResolvedValue({
        canceled: true,
        assets: [],
      });

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.cameraPermission.hasPermission).toBe(true);
      });

      let uri: string | null = null;
      await act(async () => {
        uri = await result.current.capturePhoto();
      });

      expect(uri).toBe(null);
      expect(result.current.error).toBe(null); // No error on cancellation
    });

    it('should set isCapturing during operation', async () => {
      mockLaunchCamera.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  canceled: false,
                  assets: [{ uri: 'test.jpg' }],
                }),
              100
            )
          )
      );

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.cameraPermission.hasPermission).toBe(true);
      });

      let capturePromise: Promise<string | null>;
      act(() => {
        capturePromise = result.current.capturePhoto();
      });

      // Should be capturing immediately
      expect(result.current.isCapturing).toBe(true);

      await act(async () => {
        await capturePromise;
      });

      // Should no longer be capturing
      expect(result.current.isCapturing).toBe(false);
    });

    it('should handle error during capture', async () => {
      const errorMessage = 'Camera hardware error';
      mockLaunchCamera.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.cameraPermission.hasPermission).toBe(true);
      });

      let uri: string | null = null;
      await act(async () => {
        uri = await result.current.capturePhoto();
      });

      expect(uri).toBe(null);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isCapturing).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[useCamera] Error capturing photo'),
        expect.any(Error)
      );
    });

    it('should handle empty assets array', async () => {
      mockLaunchCamera.mockResolvedValue({
        canceled: false,
        assets: [],
      });

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.cameraPermission.hasPermission).toBe(true);
      });

      let uri: string | null = null;
      await act(async () => {
        uri = await result.current.capturePhoto();
      });

      expect(uri).toBe(null);
      expect(result.current.error).toBe('No image was captured');
    });
  });

  describe('pickFromGallery', () => {
    it('should pick image successfully with existing permission', async () => {
      const mockUri = 'file:///path/to/gallery.jpg';
      mockLaunchGallery.mockResolvedValue({
        canceled: false,
        assets: [{ uri: mockUri }],
      });

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.galleryPermission.hasPermission).toBe(true);
      });

      let uri: string | null = null;
      await act(async () => {
        uri = await result.current.pickFromGallery();
      });

      expect(uri).toBe(mockUri);
      expect(mockLaunchGallery).toHaveBeenCalledWith({
        mediaTypes: 'Images',
        allowsEditing: false,
        quality: 1,
        exif: false,
      });
      expect(result.current.error).toBe(null);
    });

    it('should request permission if not granted', async () => {
      mockGetGalleryPermissions.mockResolvedValue({
        status: 'undetermined',
        granted: false,
        canAskAgain: true,
      });

      mockRequestGalleryPermissions.mockResolvedValue({
        status: 'granted',
        granted: true,
        canAskAgain: true,
      });

      const mockUri = 'file:///path/to/gallery.jpg';
      mockLaunchGallery.mockResolvedValue({
        canceled: false,
        assets: [{ uri: mockUri }],
      });

      const { result } = renderHook(() => useCamera());

      let uri: string | null = null;
      await act(async () => {
        uri = await result.current.pickFromGallery();
      });

      expect(mockRequestGalleryPermissions).toHaveBeenCalled();
      expect(uri).toBe(mockUri);
    });

    it('should return null if permission denied', async () => {
      mockGetGalleryPermissions.mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: false,
      });

      mockRequestGalleryPermissions.mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: false,
      });

      const { result } = renderHook(() => useCamera());

      let uri: string | null = null;
      await act(async () => {
        uri = await result.current.pickFromGallery();
      });

      expect(uri).toBe(null);
      expect(result.current.error).toBe('Gallery permission is required to select photos');
      expect(mockLaunchGallery).not.toHaveBeenCalled();
    });

    it('should return null if user cancels', async () => {
      mockLaunchGallery.mockResolvedValue({
        canceled: true,
        assets: [],
      });

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.galleryPermission.hasPermission).toBe(true);
      });

      let uri: string | null = null;
      await act(async () => {
        uri = await result.current.pickFromGallery();
      });

      expect(uri).toBe(null);
      expect(result.current.error).toBe(null); // No error on cancellation
    });

    it('should set isPicking during operation', async () => {
      mockLaunchGallery.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  canceled: false,
                  assets: [{ uri: 'test.jpg' }],
                }),
              100
            )
          )
      );

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.galleryPermission.hasPermission).toBe(true);
      });

      let pickPromise: Promise<string | null>;
      act(() => {
        pickPromise = result.current.pickFromGallery();
      });

      // Should be picking immediately
      expect(result.current.isPicking).toBe(true);

      await act(async () => {
        await pickPromise;
      });

      // Should no longer be picking
      expect(result.current.isPicking).toBe(false);
    });

    it('should handle error during pick', async () => {
      const errorMessage = 'Gallery access error';
      mockLaunchGallery.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.galleryPermission.hasPermission).toBe(true);
      });

      let uri: string | null = null;
      await act(async () => {
        uri = await result.current.pickFromGallery();
      });

      expect(uri).toBe(null);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isPicking).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[useCamera] Error picking image'),
        expect.any(Error)
      );
    });

    it('should handle empty assets array', async () => {
      mockLaunchGallery.mockResolvedValue({
        canceled: false,
        assets: [],
      });

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.galleryPermission.hasPermission).toBe(true);
      });

      let uri: string | null = null;
      await act(async () => {
        uri = await result.current.pickFromGallery();
      });

      expect(uri).toBe(null);
      expect(result.current.error).toBe('No image was selected');
    });
  });

  describe('Permission integration', () => {
    it('should expose camera permission methods', async () => {
      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.cameraPermission.hasPermission).toBe(true);
      });

      expect(typeof result.current.cameraPermission.request).toBe('function');
      expect(typeof result.current.cameraPermission.openSettings).toBe('function');
    });

    it('should expose gallery permission methods', async () => {
      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.galleryPermission.hasPermission).toBe(true);
      });

      expect(typeof result.current.galleryPermission.request).toBe('function');
      expect(typeof result.current.galleryPermission.openSettings).toBe('function');
    });

    it('should track both permissions independently', async () => {
      mockGetCameraPermissions.mockResolvedValue({
        status: 'granted',
        granted: true,
        canAskAgain: true,
      });

      mockGetGalleryPermissions.mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: false,
      });

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.cameraPermission.hasPermission).toBe(true);
        expect(result.current.galleryPermission.hasPermission).toBe(false);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle non-Error objects in catch blocks', async () => {
      mockLaunchCamera.mockRejectedValue('String error');

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.cameraPermission.hasPermission).toBe(true);
      });

      let uri: string | null = null;
      await act(async () => {
        uri = await result.current.capturePhoto();
      });

      expect(uri).toBe(null);
      expect(result.current.error).toBe('Failed to capture photo');
    });

    it('should clear error on successful operation after previous error', async () => {
      mockLaunchCamera.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.cameraPermission.hasPermission).toBe(true);
      });

      // First call - error
      await act(async () => {
        await result.current.capturePhoto();
      });

      expect(result.current.error).toBe('First error');

      // Second call - success
      mockLaunchCamera.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'success.jpg' }],
      });

      await act(async () => {
        await result.current.capturePhoto();
      });

      expect(result.current.error).toBe(null);
    });
  });
});

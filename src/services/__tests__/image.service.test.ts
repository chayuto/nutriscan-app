/**
 * Image Service Tests
 *
 * Comprehensive unit tests for image compression, conversion, and validation.
 */

import { imageService, ImageService } from '../image.service';
import { ImageError } from '@/types';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
}));

// Mock React Native Image
jest.mock('react-native', () => ({
  Image: {
    getSize: jest.fn(),
  },
}));

// Type-safe mock helpers
const mockImageGetSize = Image.getSize as jest.MockedFunction<typeof Image.getSize>;
const mockManipulateAsync = ImageManipulator.manipulateAsync as jest.MockedFunction<
  typeof ImageManipulator.manipulateAsync
>;
const mockGetInfoAsync = FileSystem.getInfoAsync as jest.MockedFunction<
  typeof FileSystem.getInfoAsync
>;
const mockReadAsStringAsync = FileSystem.readAsStringAsync as jest.MockedFunction<
  typeof FileSystem.readAsStringAsync
>;

describe('ImageService', () => {
  let service: ImageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ImageService();
  });

  describe('compressImage', () => {
    const mockUri = 'file://test-image.jpg';
    const mockCompressedUri = 'file://test-image-compressed.jpg';

    beforeEach(() => {
      // Default mocks for successful compression
      mockImageGetSize.mockImplementation((_uri, success) => {
        success(2000, 1500); // Large image
      });

      mockGetInfoAsync.mockResolvedValue({
        exists: true,
        size: 500 * 1024, // 500KB (under target)
        uri: mockCompressedUri,
        isDirectory: false,
        modificationTime: Date.now(),
      });

      mockManipulateAsync.mockResolvedValue({
        uri: mockCompressedUri,
        width: 1024,
        height: 768,
      });
    });

    it('should compress large image (2000x1500) to max 1024px', async () => {
      const result = await service.compressImage(mockUri);

      expect(result).toBe(mockCompressedUri);
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        mockUri,
        [{ resize: { width: 1024, height: 768 } }],
        expect.objectContaining({
          compress: 0.8,
          format: 'jpeg',
        })
      );
    });

    it('should maintain aspect ratio on landscape resize', async () => {
      mockImageGetSize.mockImplementation((_uri, success) => {
        success(3000, 2000); // 3:2 aspect ratio
      });

      await service.compressImage(mockUri);

      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        mockUri,
        [{ resize: { width: 1024, height: 683 } }], // Maintains 3:2 ratio
        expect.any(Object)
      );
    });

    it('should maintain aspect ratio on portrait resize', async () => {
      mockImageGetSize.mockImplementation((_uri, success) => {
        success(1500, 2000); // 3:4 aspect ratio
      });

      await service.compressImage(mockUri);

      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        mockUri,
        [{ resize: { width: 768, height: 1024 } }], // Maintains 3:4 ratio
        expect.any(Object)
      );
    });

    it('should not resize images already under limit (800x600)', async () => {
      mockImageGetSize.mockImplementation((_uri, success) => {
        success(800, 600); // Already small
      });

      await service.compressImage(mockUri);

      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        mockUri,
        [], // No resize transformations
        expect.any(Object)
      );
    });

    it('should recursively reduce quality if file > 1MB', async () => {
      let compressionCount = 0;

      // First compression returns file > 800KB (triggers retry)
      // Second compression returns file < 800KB (success)
      mockManipulateAsync.mockImplementation(async () => {
        compressionCount++;
        return {
          uri: `file://compressed-${compressionCount}.jpg`,
          width: 1024,
          height: 768,
        };
      });

      mockGetInfoAsync.mockImplementation(async (uri) => {
        // First compressed file is still too large
        if (uri.includes('compressed-1')) {
          return {
            exists: true,
            size: 900 * 1024, // 900KB (> 800KB target)
            uri,
            isDirectory: false,
            modificationTime: Date.now(),
          };
        }
        // Second compressed file is small enough
        return {
          exists: true,
          size: 700 * 1024, // 700KB (< 800KB target)
          uri,
          isDirectory: false,
          modificationTime: Date.now(),
        };
      });

      const result = await service.compressImage(mockUri);

      // Should be called twice: initial + one retry
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledTimes(2);

      // Second call should have lower quality (0.8 * 0.8 = 0.64)
      // Note: Recursive call uses original URI (by design)
      expect(ImageManipulator.manipulateAsync).toHaveBeenNthCalledWith(
        2,
        mockUri, // Uses original URI for recursive compression
        expect.any(Array),
        expect.objectContaining({
          compress: expect.closeTo(0.64, 2), // 0.8 * 0.8
        })
      );

      expect(result).toBe('file://compressed-2.jpg');
    });

    it('should throw SIZE_LIMIT_EXCEEDED if cannot compress below 1MB', async () => {
      mockGetInfoAsync.mockResolvedValue({
        exists: true,
        size: 900 * 1024, // Always > 800KB
        uri: mockCompressedUri,
        isDirectory: false,
        modificationTime: Date.now(),
      });

      await expect(
        service.compressImage(mockUri, { quality: 0.35 }) // Near MIN_QUALITY (0.3)
      ).rejects.toThrow(ImageError);

      await expect(service.compressImage(mockUri, { quality: 0.35 })).rejects.toThrow(
        'Image exceeds maximum file size'
      );
    });

    it('should respect custom compression options', async () => {
      await service.compressImage(mockUri, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.6,
        format: 'png',
      });

      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        mockUri,
        [{ resize: { width: 512, height: 384 } }],
        expect.objectContaining({
          compress: 0.6,
          format: 'png',
        })
      );
    });

    it('should throw COMPRESSION_FAILED on manipulateAsync error', async () => {
      mockManipulateAsync.mockRejectedValue(new Error('Native module error'));

      await expect(service.compressImage(mockUri)).rejects.toThrow(ImageError);
      await expect(service.compressImage(mockUri)).rejects.toThrow('Failed to compress image');
    });

    it('should throw FILE_NOT_FOUND for invalid URI', async () => {
      mockGetInfoAsync.mockResolvedValue({
        exists: false,
        uri: '',
        isDirectory: false,
      });

      await expect(service.compressImage(mockUri)).rejects.toThrow(ImageError);
      await expect(service.compressImage(mockUri)).rejects.toThrow('Image file not found');
    });
  });

  describe('convertToBase64', () => {
    const mockUri = 'file://test-image.jpg';
    const mockBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD...';

    beforeEach(() => {
      mockGetInfoAsync.mockResolvedValue({
        exists: true,
        uri: mockUri,
        size: 100 * 1024,
        isDirectory: false,
        modificationTime: Date.now(),
      });
      mockReadAsStringAsync.mockResolvedValue(mockBase64);
    });

    it('should convert valid image to base64 string', async () => {
      const result = await service.convertToBase64(mockUri);

      expect(result).toBe(mockBase64);
      expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(mockUri, {
        encoding: 'base64',
      });
    });

    it('should throw CONVERSION_FAILED on readAsStringAsync error', async () => {
      mockReadAsStringAsync.mockRejectedValue(new Error('File system error'));

      await expect(service.convertToBase64(mockUri)).rejects.toThrow(ImageError);
      await expect(service.convertToBase64(mockUri)).rejects.toThrow(
        'Failed to convert image to base64'
      );
    });

    it('should throw FILE_NOT_FOUND if file missing', async () => {
      mockGetInfoAsync.mockResolvedValue({
        exists: false,
        uri: '',
        isDirectory: false,
      });

      await expect(service.convertToBase64(mockUri)).rejects.toThrow(ImageError);
      await expect(service.convertToBase64(mockUri)).rejects.toThrow('Image file not found');
    });
  });

  describe('validateImageUri', () => {
    it('should validate correct file:// URI', async () => {
      mockGetInfoAsync.mockResolvedValue({
        exists: true,
        uri: 'file://test.jpg',
        size: 100 * 1024,
        isDirectory: false,
        modificationTime: Date.now(),
      });

      const result = await service.validateImageUri('file://test.jpg');

      expect(result).toBe(true);
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith('file://test.jpg');
    });

    it('should throw INVALID_URI on empty string', async () => {
      await expect(service.validateImageUri('')).rejects.toThrow(ImageError);
      await expect(service.validateImageUri('')).rejects.toThrow('Invalid image URI');
    });

    it('should throw INVALID_URI on null/undefined', async () => {
      await expect(service.validateImageUri(null as unknown as string)).rejects.toThrow(ImageError);
      await expect(service.validateImageUri(undefined as unknown as string)).rejects.toThrow(
        ImageError
      );
    });

    it('should throw FILE_NOT_FOUND if file does not exist', async () => {
      mockGetInfoAsync.mockResolvedValue({
        exists: false,
        uri: '',
        isDirectory: false,
      });

      await expect(service.validateImageUri('file://missing.jpg')).rejects.toThrow(ImageError);
      await expect(service.validateImageUri('file://missing.jpg')).rejects.toThrow(
        'Image file not found'
      );
    });
  });

  describe('getImageSize', () => {
    it('should get dimensions of valid image', async () => {
      mockImageGetSize.mockImplementation(
        (_uri: string, success: (width: number, height: number) => void) => {
          success(1920, 1080);
        }
      );

      const result = await service.getImageSize('file://test.jpg');

      expect(result).toEqual({ width: 1920, height: 1080 });
    });

    it('should throw error for invalid image', async () => {
      mockImageGetSize.mockImplementation(
        (
          _uri: string,
          _success: (width: number, height: number) => void,
          failure?: (error: Error) => void
        ) => {
          failure?.(new Error('Invalid image format'));
        }
      );

      await expect(service.getImageSize('file://corrupted.jpg')).rejects.toThrow(ImageError);
      await expect(service.getImageSize('file://corrupted.jpg')).rejects.toThrow(
        'Failed to get image dimensions'
      );
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockGetInfoAsync.mockResolvedValue({
        exists: true,
        size: 500 * 1024,
        uri: 'file://test-image-compressed.jpg',
        isDirectory: false,
        modificationTime: Date.now(),
      });
      mockManipulateAsync.mockResolvedValue({
        uri: 'file://compressed.jpg',
        width: 1024,
        height: 768,
      });
    });

    it('should handle very small images (100x100)', async () => {
      mockImageGetSize.mockImplementation((_uri, success) => {
        success(100, 100);
      });

      await service.compressImage('file://tiny.jpg');

      // Should not resize (already under limit)
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        'file://tiny.jpg',
        [],
        expect.any(Object)
      );
    });

    it('should handle square images (1000x1000)', async () => {
      mockImageGetSize.mockImplementation((_uri, success) => {
        success(1000, 1000);
      });

      await service.compressImage('file://square.jpg');

      // Should not resize (already under 1024x1024)
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        'file://square.jpg',
        [],
        expect.any(Object)
      );
    });

    it('should handle ultra-wide images (3000x1000)', async () => {
      mockImageGetSize.mockImplementation((_uri, success) => {
        success(3000, 1000);
      });

      await service.compressImage('file://wide.jpg');

      // Should resize maintaining 3:1 aspect ratio
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        'file://wide.jpg',
        [{ resize: { width: 1024, height: 341 } }],
        expect.any(Object)
      );
    });
  });

  describe('Singleton Export', () => {
    it('should export singleton instance', () => {
      expect(imageService).toBeInstanceOf(ImageService);
    });

    it('should use same instance across imports', () => {
      const instance1 = imageService;
      const instance2 = imageService;

      expect(instance1).toBe(instance2);
    });
  });
});

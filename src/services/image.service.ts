/**
 * Image Service
 *
 * Handles image compression, base64 conversion, and validation
 * for nutrition label scanning.
 *
 * @module services/image.service
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system/next';
import { Image } from 'react-native';
import { IImageService, CompressionOptions, ImageDimensions, ImageError } from '@/types';
import { IMAGE_DEFAULTS, ERROR_MESSAGES } from '@/utils';

/**
 * Image Service Implementation
 *
 * Provides methods for image processing before API upload:
 * - Compression to reduce file size
 * - Base64 conversion for API payload
 * - Validation and dimension checking
 */
export class ImageService implements IImageService {
  /**
   * Compress an image to meet API size requirements
   *
   * Uses recursive quality reduction to ensure file size stays under target.
   * Maintains aspect ratio and converts to JPEG for better compression.
   *
   * @param uri - File URI of the image to compress
   * @param options - Optional compression settings
   * @returns URI of the compressed image
   * @throws {ImageError} If compression fails or file not found
   *
   * @example
   * const compressed = await imageService.compressImage('file://photo.jpg');
   * console.log(compressed); // 'file://photo-compressed.jpg'
   */
  async compressImage(uri: string, options: CompressionOptions = {}): Promise<string> {
    const {
      maxWidth = IMAGE_DEFAULTS.MAX_WIDTH,
      maxHeight = IMAGE_DEFAULTS.MAX_HEIGHT,
      quality = IMAGE_DEFAULTS.COMPRESSION_QUALITY,
      format = IMAGE_DEFAULTS.FORMAT,
    } = options;

    try {
      console.warn('[ImageService] 📸 Starting compression for:', uri);

      // 1. Validate URI exists
      await this.validateImageUri(uri);
      console.warn('[ImageService] ✅ URI validated');

      // 2. Get current dimensions
      const { width, height } = await this.getImageSize(uri);
      console.warn('[ImageService] 📏 Image dimensions:', width, 'x', height);

      // 3. Calculate resize dimensions (maintain aspect ratio)
      const resize = this.calculateResize(width, height, maxWidth, maxHeight);
      console.warn(
        '[ImageService] 🔧 Resize needed:',
        resize ? `${resize.width}x${resize.height}` : 'No'
      );

      // 4. Perform compression
      console.warn('[ImageService] 🗜️  Starting manipulateAsync with quality:', quality);
      const result = await ImageManipulator.manipulateAsync(
        uri,
        resize ? [{ resize }] : [], // Only resize if needed
        {
          compress: quality,
          format:
            format === 'jpeg' ? ImageManipulator.SaveFormat.JPEG : ImageManipulator.SaveFormat.PNG,
        }
      );
      console.warn('[ImageService] ✅ Compression successful:', result.uri);

      // 5. Check file size using new File API
      const file = new File(result.uri);
      const fileSize = await file.size;

      // 6. If still too large and quality can be reduced
      if (fileSize > IMAGE_DEFAULTS.TARGET_FILE_SIZE && quality > IMAGE_DEFAULTS.MIN_QUALITY) {
        const newQuality = quality * IMAGE_DEFAULTS.QUALITY_REDUCTION_FACTOR;

        // Stop if we hit minimum quality threshold
        if (newQuality < IMAGE_DEFAULTS.MIN_QUALITY) {
          throw new ImageError(ERROR_MESSAGES.IMAGE_TOO_LARGE, 'SIZE_LIMIT_EXCEEDED');
        }

        // Recursive call with lower quality
        return this.compressImage(uri, {
          ...options,
          quality: newQuality,
        });
      }

      return result.uri;
    } catch (error) {
      console.error('[ImageService] ❌ Compression failed:', error);
      if (error instanceof ImageError) {
        throw error;
      }
      throw new ImageError(ERROR_MESSAGES.IMAGE_COMPRESSION_FAILED, 'COMPRESSION_FAILED', error);
    }
  }

  /**
   * Convert image to base64 string
   *
   * Reads image file and encodes as base64 for API transmission.
   * Does NOT include data URI prefix (data:image/jpeg;base64,).
   *
   * @param uri - File URI of the image
   * @returns Base64 encoded string
   * @throws {ImageError} If conversion fails
   *
   * @example
   * const base64 = await imageService.convertToBase64('file://photo.jpg');
   * console.log(base64.substring(0, 20)); // '/9j/4AAQSkZJRgABAQAA...'
   */
  async convertToBase64(uri: string): Promise<string> {
    try {
      // Validate before conversion
      await this.validateImageUri(uri);

      // Read file as base64 using new File API
      const file = new File(uri);

      // Read as ArrayBuffer then convert to base64
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Convert to base64 string
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      return base64;
    } catch (error) {
      if (error instanceof ImageError) {
        throw error;
      }
      throw new ImageError(ERROR_MESSAGES.IMAGE_CONVERSION_FAILED, 'CONVERSION_FAILED', error);
    }
  }

  /**
   * Get image dimensions in pixels
   *
   * Uses React Native's Image.getSize which works with file://, http://,
   * and content:// URIs.
   *
   * @param uri - File URI of the image
   * @returns Width and height in pixels
   * @throws {ImageError} If image cannot be read
   *
   * @example
   * const { width, height } = await imageService.getImageSize('file://photo.jpg');
   * console.log(`Image is ${width}x${height}px`);
   */
  async getImageSize(uri: string): Promise<ImageDimensions> {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => {
          resolve({ width, height });
        },
        (error) => {
          reject(new ImageError('Failed to get image dimensions', 'INVALID_URI', error));
        }
      );
    });
  }

  /**
   * Validate that image URI exists and is accessible
   *
   * Performs defensive checks before expensive operations.
   *
   * @param uri - File URI to validate
   * @returns true if valid
   * @throws {ImageError} If invalid or not found
   *
   * @example
   * try {
   *   await imageService.validateImageUri('file://photo.jpg');
   *   console.log('Image is valid');
   * } catch (error) {
   *   console.error('Invalid image:', error.message);
   * }
   */
  async validateImageUri(uri: string): Promise<boolean> {
    // Check URI format
    if (!uri || typeof uri !== 'string') {
      throw new ImageError(ERROR_MESSAGES.IMAGE_INVALID_URI, 'INVALID_URI');
    }

    // Check file exists using new File API
    try {
      const file = new File(uri);
      const exists = await file.exists;

      if (!exists) {
        throw new ImageError(ERROR_MESSAGES.IMAGE_FILE_NOT_FOUND, 'FILE_NOT_FOUND');
      }

      return true;
    } catch (error) {
      if (error instanceof ImageError) {
        throw error;
      }
      throw new ImageError(ERROR_MESSAGES.IMAGE_FILE_NOT_FOUND, 'FILE_NOT_FOUND', error);
    }
  }

  /**
   * Calculate new dimensions maintaining aspect ratio
   *
   * Private helper method for compression logic.
   * Returns null if no resize needed.
   *
   * @param width - Current width in pixels
   * @param height - Current height in pixels
   * @param maxWidth - Maximum allowed width
   * @param maxHeight - Maximum allowed height
   * @returns New dimensions or null if no resize needed
   *
   * @private
   */
  private calculateResize(
    width: number,
    height: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } | null {
    // No resize needed if within limits
    if (width <= maxWidth && height <= maxHeight) {
      return null;
    }

    const aspectRatio = width / height;

    if (aspectRatio > 1) {
      // Landscape orientation
      const newWidth = Math.min(width, maxWidth);
      return {
        width: newWidth,
        height: Math.round(newWidth / aspectRatio),
      };
    } else {
      // Portrait orientation
      const newHeight = Math.min(height, maxHeight);
      return {
        width: Math.round(newHeight * aspectRatio),
        height: newHeight,
      };
    }
  }
}

/**
 * Singleton instance for global use
 *
 * Import this in your code:
 * ```typescript
 * import { imageService } from '@/services/image.service';
 * const compressed = await imageService.compressImage(uri);
 * ```
 */
export const imageService = new ImageService();

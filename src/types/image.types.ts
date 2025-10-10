/**
 * Image Service Type Definitions
 *
 * Types for image compression, conversion, and validation operations.
 */

/**
 * Options for image compression
 */
export interface CompressionOptions {
  /** Maximum width in pixels (default: 1024) */
  maxWidth?: number;
  /** Maximum height in pixels (default: 1024) */
  maxHeight?: number;
  /** Compression quality 0-1 (default: 0.8) */
  quality?: number;
  /** Output format (default: 'jpeg') */
  format?: 'jpeg' | 'png';
}

/**
 * Image dimensions in pixels
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Detailed image information
 */
export interface ImageInfo {
  uri: string;
  width: number;
  height: number;
  size: number; // File size in bytes
  format: string;
}

/**
 * Custom error class for image operations
 *
 * Provides structured error information with error codes
 * for better error handling and debugging.
 */
export class ImageError extends Error {
  constructor(
    message: string,
    public code:
      | 'INVALID_URI'
      | 'COMPRESSION_FAILED'
      | 'CONVERSION_FAILED'
      | 'FILE_NOT_FOUND'
      | 'SIZE_LIMIT_EXCEEDED',
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ImageError';

    // Maintain proper stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ImageError);
    }
  }
}

/**
 * Image service interface for dependency injection and testing
 */
export interface IImageService {
  /**
   * Compress an image to meet size requirements
   * @param uri - File URI of the image
   * @param options - Compression options
   * @returns URI of the compressed image
   * @throws {ImageError} If compression fails
   */
  compressImage(uri: string, options?: CompressionOptions): Promise<string>;

  /**
   * Convert image to base64 string
   * @param uri - File URI of the image
   * @returns Base64 encoded string (without data URI prefix)
   * @throws {ImageError} If conversion fails
   */
  convertToBase64(uri: string): Promise<string>;

  /**
   * Get image dimensions
   * @param uri - File URI of the image
   * @returns Width and height in pixels
   * @throws {ImageError} If image cannot be read
   */
  getImageSize(uri: string): Promise<ImageDimensions>;

  /**
   * Validate that image URI exists and is accessible
   * @param uri - File URI to validate
   * @returns true if valid
   * @throws {ImageError} If invalid or not found
   */
  validateImageUri(uri: string): Promise<boolean>;
}

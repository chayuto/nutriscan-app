# Image Service - Detailed Implementation Plan

**Sprint**: Sprint 2 - Core Services  
**Phase**: 2.2 - Image Service  
**Priority**: HIGH (Required for OpenAI Vision API integration)  
**Estimated Time**: 1-2 hours  
**Target Coverage**: 80%+

---

## 1. Overview

### Purpose

Handle image processing before sending to OpenAI Vision API, ensuring images meet size constraints and are properly formatted.

### Problem Statement

- OpenAI Vision API has base64 payload size limits (~20MB recommended)
- Raw camera photos can be 5-10MB (modern phones)
- Larger images = slower processing + higher API costs
- Network timeouts with large uploads

### Solution

- Compress images to max 1MB before API calls
- Convert to base64 encoding for API payload
- Maintain aspect ratio and acceptable quality (80%)
- Validate images before processing

---

## 2. Architecture & Design Decisions

### Service Pattern (Following Storage Service)

```typescript
// Interface for testability and mocking
export interface IImageService {
  compressImage(uri: string, options?: CompressionOptions): Promise<string>;
  convertToBase64(uri: string): Promise<string>;
  getImageSize(uri: string): Promise<ImageDimensions>;
  validateImageUri(uri: string): Promise<boolean>;
}

// Singleton pattern for global access
export class ImageService implements IImageService {
  // Implementation
}

export const imageService = new ImageService();
```

### Why This Design?

1. **Interface-based**: Enables mocking in tests (same as Storage Service)
2. **Singleton**: One instance, consistent state
3. **Pure functions**: No side effects, testable
4. **Error types**: Custom ImageError for clear debugging
5. **No retry logic**: Local operations (file exists or doesn't)

---

## 3. Type Definitions

### File: `src/types/image.types.ts`

```typescript
/**
 * Options for image compression
 */
export interface CompressionOptions {
  maxWidth?: number; // Default: 1024px
  maxHeight?: number; // Default: 1024px
  quality?: number; // Default: 0.8 (0-1 range)
  format?: 'jpeg' | 'png'; // Default: 'jpeg'
}

/**
 * Image dimensions
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
  }
}
```

### Export in Index

```typescript
// src/types/index.ts
export * from './image.types';
```

---

## 4. Constants

### File: `src/utils/constants.ts`

```typescript
export const IMAGE_DEFAULTS = {
  // Compression settings
  MAX_WIDTH: 1024,
  MAX_HEIGHT: 1024,
  COMPRESSION_QUALITY: 0.8,
  MIN_QUALITY: 0.3, // Don't compress below this (quality loss)

  // Size limits
  MAX_FILE_SIZE: 1024 * 1024, // 1MB in bytes
  TARGET_FILE_SIZE: 800 * 1024, // 800KB (leaves buffer)

  // Format
  FORMAT: 'jpeg' as const,

  // Quality reduction per iteration
  QUALITY_REDUCTION_FACTOR: 0.8,
};

export const ERROR_MESSAGES = {
  ...ERROR_MESSAGES, // Existing messages

  // Image errors
  IMAGE_INVALID_URI: 'Invalid image URI',
  IMAGE_FILE_NOT_FOUND: 'Image file not found',
  IMAGE_COMPRESSION_FAILED: 'Failed to compress image',
  IMAGE_CONVERSION_FAILED: 'Failed to convert image to base64',
  IMAGE_TOO_LARGE: 'Image exceeds maximum file size',
  IMAGE_INVALID_FORMAT: 'Unsupported image format',
};
```

---

## 5. Core Implementation

### File: `src/services/image.service.ts`

#### 5.1 Class Structure

```typescript
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';
import { IImageService, CompressionOptions, ImageDimensions, ImageError } from '@/types';
import { IMAGE_DEFAULTS, ERROR_MESSAGES } from '@/utils';

export class ImageService implements IImageService {
  // Methods: compressImage, convertToBase64, validateImageUri, getImageSize
}

export const imageService = new ImageService();
```

#### 5.2 Image Compression

**Method**: `compressImage(uri: string, options?: CompressionOptions): Promise<string>`

**Algorithm**:

1. Validate URI exists
2. Get current dimensions
3. Calculate new dimensions (maintain aspect ratio)
4. Compress using expo-image-manipulator
5. Check if result < target size (800KB buffer)
6. If still too large, recursively reduce quality
7. Throw if quality falls below MIN_QUALITY
8. Return compressed URI

**Implementation**:

```typescript
async compressImage(
  uri: string,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = IMAGE_DEFAULTS.MAX_WIDTH,
    maxHeight = IMAGE_DEFAULTS.MAX_HEIGHT,
    quality = IMAGE_DEFAULTS.COMPRESSION_QUALITY,
    format = IMAGE_DEFAULTS.FORMAT,
  } = options;

  try {
    // 1. Validate URI
    await this.validateImageUri(uri);

    // 2. Get current dimensions
    const { width, height } = await this.getImageSize(uri);

    // 3. Calculate resize dimensions (maintain aspect ratio)
    const resize = this.calculateResize(width, height, maxWidth, maxHeight);

    // 4. Perform compression
    const result = await ImageManipulator.manipulateAsync(
      uri,
      resize ? [{ resize }] : [], // Only resize if needed
      {
        compress: quality,
        format: format === 'jpeg'
          ? ImageManipulator.SaveFormat.JPEG
          : ImageManipulator.SaveFormat.PNG,
      }
    );

    // 5. Check file size
    const fileInfo = await FileSystem.getInfoAsync(result.uri);

    // 6. If still too large and quality can be reduced
    if (
      fileInfo.exists &&
      fileInfo.size > IMAGE_DEFAULTS.TARGET_FILE_SIZE &&
      quality > IMAGE_DEFAULTS.MIN_QUALITY
    ) {
      const newQuality = quality * IMAGE_DEFAULTS.QUALITY_REDUCTION_FACTOR;

      if (newQuality < IMAGE_DEFAULTS.MIN_QUALITY) {
        throw new ImageError(
          ERROR_MESSAGES.IMAGE_TOO_LARGE,
          'SIZE_LIMIT_EXCEEDED'
        );
      }

      // Recursive call with lower quality
      return this.compressImage(uri, {
        ...options,
        quality: newQuality,
      });
    }

    return result.uri;
  } catch (error) {
    if (error instanceof ImageError) {
      throw error;
    }
    throw new ImageError(
      ERROR_MESSAGES.IMAGE_COMPRESSION_FAILED,
      'COMPRESSION_FAILED',
      error
    );
  }
}

/**
 * Calculate new dimensions maintaining aspect ratio
 * Returns null if no resize needed
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
```

#### 5.3 Base64 Conversion

**Method**: `convertToBase64(uri: string): Promise<string>`

**Algorithm**:

1. Validate URI
2. Read file using FileSystem.readAsStringAsync
3. Return base64 string (no data URI prefix)

**Implementation**:

```typescript
async convertToBase64(uri: string): Promise<string> {
  try {
    // Validate before conversion
    await this.validateImageUri(uri);

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return base64;
  } catch (error) {
    if (error instanceof ImageError) {
      throw error;
    }
    throw new ImageError(
      ERROR_MESSAGES.IMAGE_CONVERSION_FAILED,
      'CONVERSION_FAILED',
      error
    );
  }
}
```

#### 5.4 URI Validation

**Method**: `validateImageUri(uri: string): Promise<boolean>`

**Algorithm**:

1. Check URI is non-empty string
2. Check file exists using FileSystem.getInfoAsync
3. Return true or throw ImageError

**Implementation**:

```typescript
async validateImageUri(uri: string): Promise<boolean> {
  // Check URI format
  if (!uri || typeof uri !== 'string') {
    throw new ImageError(
      ERROR_MESSAGES.IMAGE_INVALID_URI,
      'INVALID_URI'
    );
  }

  // Check file exists
  const fileInfo = await FileSystem.getInfoAsync(uri);

  if (!fileInfo.exists) {
    throw new ImageError(
      ERROR_MESSAGES.IMAGE_FILE_NOT_FOUND,
      'FILE_NOT_FOUND'
    );
  }

  return true;
}
```

#### 5.5 Get Image Dimensions

**Method**: `getImageSize(uri: string): Promise<ImageDimensions>`

**Algorithm**:

1. Use React Native Image.getSize (callback-based)
2. Promisify the callback
3. Return { width, height }

**Implementation**:

```typescript
async getImageSize(uri: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => {
        resolve({ width, height });
      },
      (error) => {
        reject(
          new ImageError(
            'Failed to get image dimensions',
            'INVALID_URI',
            error
          )
        );
      }
    );
  });
}
```

---

## 6. Testing Strategy

### File: `src/services/__tests__/image.service.test.ts`

### Test Cases (Target: 80%+ Coverage)

#### 6.1 Compression Tests (8 tests)

- ✅ Should compress large image (2000x1500) to max 1024px
- ✅ Should maintain aspect ratio on landscape resize
- ✅ Should maintain aspect ratio on portrait resize
- ✅ Should not resize images already under limit (800x600)
- ✅ Should recursively reduce quality if file > 1MB
- ✅ Should throw SIZE_LIMIT_EXCEEDED if can't reach target
- ✅ Should respect custom compression options
- ✅ Should handle compression failure gracefully

#### 6.2 Base64 Conversion Tests (3 tests)

- ✅ Should convert valid image to base64 string
- ✅ Should throw CONVERSION_FAILED on invalid URI
- ✅ Should throw FILE_NOT_FOUND if file missing

#### 6.3 Validation Tests (4 tests)

- ✅ Should validate correct file:// URI
- ✅ Should throw INVALID_URI on empty string
- ✅ Should throw INVALID_URI on null/undefined
- ✅ Should throw FILE_NOT_FOUND if file doesn't exist

#### 6.4 Dimension Tests (2 tests)

- ✅ Should get dimensions of valid image
- ✅ Should throw error for invalid image

#### 6.5 Edge Cases (3 tests)

- ✅ Should handle very small images (100x100)
- ✅ Should handle square images (1000x1000)
- ✅ Should handle ultra-wide images (3000x1000)

**Total: 20 tests**

### Mock Setup

```typescript
import { imageService } from '../image.service';
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
  EncodingType: {
    Base64: 'base64',
  },
}));

// Mock React Native Image
jest.mock('react-native/Libraries/Image/Image', () => ({
  getSize: jest.fn(),
}));

describe('ImageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test suites...
});
```

---

## 7. Dependencies

### New Dependencies Required

```bash
npx expo install expo-file-system
```

### Already Installed (Sprint 1)

- ✅ expo-image-manipulator
- ✅ react-native (Image component)

---

## 8. Integration with OpenAI Service

### Usage Flow (Phase 2.3)

```typescript
// src/services/openai.service.ts

import { imageService } from './image.service';

export class OpenAIService {
  async analyzeImage(imageUri: string): Promise<NutritionData> {
    try {
      // Step 1: Compress image to meet API limits
      const compressedUri = await imageService.compressImage(imageUri);

      // Step 2: Convert to base64 for API payload
      const base64Image = await imageService.convertToBase64(compressedUri);

      // Step 3: Send to OpenAI Vision API
      const response = await this.makeAPIRequest(base64Image);

      // Step 4: Parse and return nutrition data
      return this.parseResponse(response);
    } catch (error) {
      // Handle ImageError vs APIError
      throw this.handleError(error);
    }
  }
}
```

---

## 9. Error Handling

### Error Types

1. **INVALID_URI** - Empty, null, or malformed URI
2. **FILE_NOT_FOUND** - File doesn't exist at URI
3. **COMPRESSION_FAILED** - expo-image-manipulator error
4. **CONVERSION_FAILED** - FileSystem.readAsStringAsync error
5. **SIZE_LIMIT_EXCEEDED** - Can't compress below 1MB even at MIN_QUALITY

### No Retry Logic

Unlike Storage Service, image operations are deterministic:

- File exists or doesn't (retry won't help)
- Compression succeeds or fails (retry won't help)
- Base64 conversion works or doesn't (retry won't help)

**Strategy**: Fail fast with clear error messages

---

## 10. Platform-Specific Considerations

### iOS

- URI format: `file:///var/mobile/Containers/...`
- HEIC images: Convert to JPEG automatically
- Photo library URIs: `ph://...` (handled by expo-image-picker)

### Android

- URI format: `file:///data/user/0/...`
- Content URIs: `content://...` (handled by expo-image-picker)
- Storage permissions: Handled by expo-image-picker

### Solution

Use expo-file-system APIs (platform-agnostic) - URIs are normalized by expo-camera and expo-image-picker.

---

## 11. Performance Considerations

### Memory Usage

- Don't load full image into memory
- Use expo-image-manipulator (native C++ processing)
- Clean up temp files after compression

### Compression Speed

- Average: 200-500ms for typical photo
- Large images (5MB): 1-2 seconds
- Show loading indicator in UI

### Quality vs Size Trade-off

- 0.8 quality: Imperceptible loss, 60-70% size reduction
- 0.6 quality: Slight loss, 80% size reduction
- 0.3 quality: Noticeable loss, 90% size reduction

---

## 12. Implementation Checklist

### Phase 1: Setup (5 min)

- [ ] Install `expo-file-system`
- [ ] Verify expo-image-manipulator installed

### Phase 2: Types (5 min)

- [ ] Create `src/types/image.types.ts`
- [ ] Add CompressionOptions interface
- [ ] Add ImageDimensions interface
- [ ] Add ImageInfo interface
- [ ] Add ImageError class
- [ ] Export in `src/types/index.ts`

### Phase 3: Constants (5 min)

- [ ] Add IMAGE_DEFAULTS to `src/utils/constants.ts`
- [ ] Add image error messages to ERROR_MESSAGES

### Phase 4: Service Implementation (30 min)

- [ ] Create `src/services/image.service.ts`
- [ ] Implement IImageService interface
- [ ] Implement compressImage() method
- [ ] Implement calculateResize() helper
- [ ] Implement convertToBase64() method
- [ ] Implement validateImageUri() method
- [ ] Implement getImageSize() method
- [ ] Export singleton instance

### Phase 5: Testing (30 min)

- [ ] Create `src/services/__tests__/image.service.test.ts`
- [ ] Setup mocks (ImageManipulator, FileSystem, Image)
- [ ] Write compression tests (8 tests)
- [ ] Write base64 conversion tests (3 tests)
- [ ] Write validation tests (4 tests)
- [ ] Write dimension tests (2 tests)
- [ ] Write edge case tests (3 tests)

### Phase 6: Validation (20 min)

- [ ] Run `npm test -- image.service.test.ts`
- [ ] Verify all 20 tests pass
- [ ] Check coverage: `npm test -- --coverage image.service.test.ts`
- [ ] Ensure 80%+ coverage
- [ ] Fix any failing tests
- [ ] Run `npm run type-check`
- [ ] Run `npm run lint`

---

## 13. Success Criteria

- ✅ All 20 tests passing
- ✅ 80%+ code coverage on image.service.ts
- ✅ Compresses 5MB image to < 1MB
- ✅ Maintains aspect ratio correctly
- ✅ Returns valid base64 strings
- ✅ Throws appropriate ImageError for invalid inputs
- ✅ No console errors during test run
- ✅ TypeScript compiles without errors
- ✅ ESLint passes without warnings

---

## 14. Known Limitations

### 1. No Caching

- Compresses same image multiple times
- **Future**: Add cache layer with expo-file-system

### 2. No Progress Callbacks

- Can't show compression progress
- **Future**: Add onProgress callback for large files

### 3. JPEG Only for Compression

- PNG doesn't compress well (lossless)
- **Solution**: Always convert to JPEG (acceptable for photos)

### 4. No Batch Processing

- Processes one image at a time
- **Future**: Add batch compression for multiple images

### 5. Minimum Quality Limit

- Can't compress below 0.3 quality
- **Reason**: Quality loss becomes unacceptable
- **Solution**: Throw error if can't reach target size

---

## 15. Future Enhancements (Post-MVP)

### Phase 2 Features

- [ ] Image caching (avoid re-compression)
- [ ] Progress callbacks for UI
- [ ] Batch compression
- [ ] Support for HEIC, WebP formats

### Phase 3 Features

- [ ] Smart cropping (detect label area)
- [ ] Auto-rotation based on EXIF
- [ ] Image quality assessment
- [ ] Thumbnail generation

---

## 16. Questions & Answers

### Q: Why 1MB limit?

**A:** OpenAI recommends keeping payloads small for speed. 1MB base64 image = ~1.3MB JSON payload. Comfortable margin under 20MB limit.

### Q: Why JPEG over PNG?

**A:** JPEG compression is lossy (smaller files). PNG is lossless (larger files). For photos, JPEG quality loss at 0.8 is imperceptible.

### Q: Why recursive quality reduction?

**A:** Some images (high detail, textures) don't compress well at 0.8. Automatically reducing quality ensures we hit target size.

### Q: Why not use native modules?

**A:** expo-image-manipulator is native (C++), fast, and cross-platform. No need for custom native code.

### Q: Can users upload 10MB photos?

**A:** Yes! Service automatically compresses to 1MB before API upload. User never waits for large uploads.

---

## 17. Related Documentation

- [Storage Service Implementation](../storage-service-implementation-plan.md)
- [OpenAI Service Specification](../../03-api-integration.md)
- [Type System](../../02-type-system.md)
- [Implementation Checklist](../../04-implementation-checklist.md)

---

## 18. Next Steps After Completion

1. **Test with real images** (capture from camera)
2. **Implement OpenAI Service** (Phase 2.3 - uses Image Service)
3. **Create useNutritionAnalysis hook** (Phase 2.4)
4. **Build Camera UI component** (Phase 3)

---

**Status**: 📝 Ready for Implementation  
**Assigned To**: Sprint 2 - Core Services  
**Blocked By**: None (all dependencies installed)  
**Blocking**: OpenAI Service (Phase 2.3)

---

**Created**: 2025-10-10  
**Last Updated**: 2025-10-10  
**Version**: 1.0.0

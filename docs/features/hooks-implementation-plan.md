# Phase 2.4: Custom Hooks Implementation Plan

## 📋 Overview

**Goal**: Create React hooks layer to bridge services with UI components

**Why**: Services (Storage, Image, OpenAI) are ready but cannot be used in React components without state management and side effect handling. Custom hooks provide the React integration layer.

**Status**: Phase 2.1, 2.2, 2.3 complete ✅ (Storage, Image, OpenAI services ready)

---

## 🎯 Objectives

1. **Abstract service complexity** - Hide implementation details from components
2. **Centralize state management** - Loading, error, and data states
3. **Enable reusability** - DRY principle across all screens
4. **Type safety** - Full TypeScript integration
5. **Testability** - Mockable hooks for component testing

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   UI Components                      │
│           (HomeScreen, ReportScreen, etc.)          │
└────────────────────┬────────────────────────────────┘
                     │ uses
                     ▼
┌─────────────────────────────────────────────────────┐
│                  Custom Hooks                        │
│    (useCamera, useNutritionAnalysis, etc.)          │
└────────────────────┬────────────────────────────────┘
                     │ orchestrates
                     ▼
┌─────────────────────────────────────────────────────┐
│                    Services                          │
│  (imageService, openAIService, storageService)      │
└─────────────────────────────────────────────────────┘
```

**Separation of Concerns**:
- **Services**: Pure business logic (API calls, file operations)
- **Hooks**: React integration (useState, useEffect, useCallback)
- **Components**: Pure UI (render logic only)

---

## 📦 Hooks to Implement

### 1. usePermissions (Foundation)

**File**: `src/hooks/usePermissions.ts`  
**Lines**: ~50 (core) + 40 (tests)  
**Dependencies**: `expo-permissions`, `expo-linking`

**Purpose**: Generic permission handling for camera/gallery

**API**:
```typescript
interface UsePermissionsReturn {
  status: PermissionStatus;           // 'granted' | 'denied' | 'undetermined'
  hasPermission: boolean;             // Computed from status
  request: () => Promise<boolean>;    // Request permission
  openSettings: () => void;           // Open app settings
  canAskAgain: boolean;               // iOS: can show permission prompt again
  isRequesting: boolean;              // Loading state during request
  error: string | null;               // Error message
}

const permissions = usePermissions('camera');
```

**Implementation Details**:
- Wrap `expo-permissions` API
- Check current status on mount
- Handle "denied" → "open settings" flow
- Platform-specific behavior (iOS vs Android)
- Clear error messages for users

**Edge Cases**:
- Permission previously denied (iOS: can't re-request)
- Settings app unavailable
- Permission check fails (rare)

**Testing**:
- Mock expo-permissions module
- Test all permission states
- Test permission request flow
- Test settings navigation

---

### 2. useCamera (Hardware Access)

**File**: `src/hooks/useCamera.ts`  
**Lines**: ~70 (core) + 50 (tests)  
**Dependencies**: `expo-camera`, `expo-image-picker`, `usePermissions`

**Purpose**: Camera capture and gallery picker with permission handling

**API**:
```typescript
interface UseCameraReturn {
  capturePhoto: () => Promise<string | null>;      // Returns image URI
  pickFromGallery: () => Promise<string | null>;   // Returns image URI
  hasPermission: boolean;                          // Camera permission
  requestPermission: () => Promise<boolean>;       // Request camera access
  isCapturing: boolean;                            // Loading during capture
  isPicking: boolean;                              // Loading during gallery pick
  error: string | null;                            // Error message
  clearError: () => void;                          // Clear error state
}

const camera = useCamera();
```

**Implementation Details**:
- Use `usePermissions` for camera access
- Wrap `expo-camera` for photo capture
- Wrap `expo-image-picker` for gallery selection
- Return image URI or null (user cancelled)
- Handle platform-specific image formats

**Edge Cases**:
- Permission denied → Show rationale alert
- Camera unavailable (emulator, hardware failure)
- User cancels selection
- Invalid image format
- Storage full

**Testing**:
- Mock expo-camera and expo-image-picker
- Test successful capture
- Test user cancellation
- Test permission denial
- Test error handling

---

### 3. useThresholds (Settings Management)

**File**: `src/hooks/useThresholds.ts`  
**Lines**: ~60 (core) + 45 (tests)  
**Dependencies**: `storageService`, React Context (optional)

**Purpose**: Load, update, and persist nutrition thresholds

**API**:
```typescript
interface UseThresholdsReturn {
  thresholds: NutritionThresholds | null;         // Current values
  updateThreshold: (key: keyof NutritionThresholds, value: number) => void;
  resetToDefaults: () => void;                    // FDA default values
  isLoading: boolean;                             // Loading from storage
  isSaving: boolean;                              // Saving to storage
  hasChanges: boolean;                            // Unsaved changes
  saveChanges: () => Promise<void>;               // Manual save
  error: string | null;                           // Error message
}

const settings = useThresholds();
```

**Implementation Details**:
- Load from `storageService` on mount
- Debounced auto-save (500ms after change)
- Optimistic updates (update UI immediately)
- Validation (positive numbers only)
- Default to FDA guidelines if not found

**Default Values** (FDA):
```typescript
const DEFAULT_THRESHOLDS: NutritionThresholds = {
  calories: 2000,
  protein: 50,
  fat: 70,
  saturatedFat: 20,
  carbohydrates: 275,
  sugars: 50,
  fiber: 25,
  sodium: 2300,
};
```

**Edge Cases**:
- Storage unavailable
- Invalid stored data (corrupt)
- Negative/zero values
- Concurrent updates

**Testing**:
- Mock storageService
- Test load from storage
- Test update with validation
- Test reset to defaults
- Test debounced save
- Test error handling

---

### 4. useNutritionAnalysis (Core Business Logic)

**File**: `src/hooks/useNutritionAnalysis.ts`  
**Lines**: ~80 (core) + 60 (tests)  
**Dependencies**: `imageService`, `openAIService`, `useThresholds`

**Purpose**: Orchestrate image → nutrition data flow with progress tracking

**API**:
```typescript
interface UseNutritionAnalysisReturn {
  analyzeImage: (imageUri: string) => Promise<NutritionData | null>;
  isAnalyzing: boolean;                           // Overall loading state
  progress: string | null;                        // "Compressing..." | "Analyzing..."
  error: string | null;                           // User-friendly error
  lastResult: NutritionData | null;               // Most recent result
  retry: () => Promise<void>;                     // Retry last analysis
  clearError: () => void;                         // Clear error state
  cancel: () => void;                             // Cancel in-progress analysis
}

const analysis = useNutritionAnalysis();
```

**Implementation Details**:
```typescript
async function analyzeImage(imageUri: string) {
  try {
    setIsAnalyzing(true);
    setError(null);
    setProgress('Compressing image...');
    
    // Step 1: Compress image
    const compressed = await imageService.compressImage(imageUri);
    
    setProgress('Converting to base64...');
    
    // Step 2: Convert to base64
    const base64 = await imageService.convertToBase64(compressed);
    
    setProgress('Analyzing nutrition label...');
    
    // Step 3: Analyze with OpenAI
    const nutrition = await openAIService.analyzeImage(base64);
    
    setLastResult(nutrition);
    setProgress(null);
    
    return nutrition;
  } catch (err) {
    setError(enhanceError(err));
    return null;
  } finally {
    setIsAnalyzing(false);
  }
}
```

**Progress States**:
1. `"Compressing image..."` (1-2 seconds)
2. `"Converting to base64..."` (<1 second)
3. `"Analyzing nutrition label..."` (5-25 seconds)

**Error Enhancement**:
```typescript
function enhanceError(err: unknown): string {
  if (err instanceof ImageError) {
    if (err.code === 'SIZE_LIMIT_EXCEEDED') {
      return 'Image is too large. Please try a smaller image.';
    }
    if (err.code === 'COMPRESSION_FAILED') {
      return 'Failed to process image. Please try another photo.';
    }
  }
  
  if (err.message.includes('API authentication')) {
    return 'Service temporarily unavailable. Please try again later.';
  }
  
  if (err.message.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  return 'Analysis failed. Please try again.';
}
```

**Edge Cases**:
- Image compression fails (image too large, corrupt)
- Base64 conversion fails (disk full)
- OpenAI API timeout (30s)
- OpenAI rate limit
- Invalid response format
- Network disconnected
- User navigates away during analysis

**Testing**:
- Mock imageService and openAIService
- Test successful analysis flow
- Test each error scenario
- Test retry functionality
- Test progress updates
- Test cancellation
- Test concurrent analysis prevention

---

## 🧪 Testing Strategy

### Test Setup

```typescript
// src/hooks/__tests__/setup.ts

import { renderHook, act } from '@testing-library/react-hooks';

// Mock services
jest.mock('@/services/image.service');
jest.mock('@/services/openai.service');
jest.mock('@/services/storage.service');

// Mock expo modules
jest.mock('expo-permissions');
jest.mock('expo-camera');
jest.mock('expo-image-picker');
```

### Test Template

```typescript
describe('useHookName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useHookName());
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('success scenarios', () => {
    it('should handle successful operation', async () => {
      // Setup mocks
      mockService.method.mockResolvedValue(mockData);
      
      const { result } = renderHook(() => useHookName());
      
      await act(async () => {
        await result.current.performAction();
      });
      
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });
  });

  describe('error scenarios', () => {
    it('should handle errors gracefully', async () => {
      mockService.method.mockRejectedValue(new Error('Test error'));
      
      const { result } = renderHook(() => useHookName());
      
      await act(async () => {
        await result.current.performAction();
      });
      
      expect(result.current.error).toBeDefined();
    });
  });
});
```

### Coverage Goals

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

---

## 📐 Implementation Order

### Phase 1: Foundation (usePermissions)
**Time**: ~20 minutes  
**Why first**: Other hooks depend on permissions

1. Create `src/hooks/usePermissions.ts`
2. Implement permission check/request logic
3. Handle platform differences
4. Write tests (`usePermissions.test.ts`)
5. Verify 80%+ coverage

**Deliverable**: Working permission hook ready for useCamera

---

### Phase 2: Hardware (useCamera)
**Time**: ~30 minutes  
**Depends on**: usePermissions

1. Create `src/hooks/useCamera.ts`
2. Integrate `usePermissions` for camera access
3. Implement `capturePhoto` with expo-camera
4. Implement `pickFromGallery` with expo-image-picker
5. Write tests (`useCamera.test.ts`)
6. Test on iOS and Android (if possible)

**Deliverable**: Camera/gallery access ready for HomeScreen

---

### Phase 3: Settings (useThresholds)
**Time**: ~25 minutes  
**Why now**: Needed for useNutritionAnalysis

1. Create `src/hooks/useThresholds.ts`
2. Load thresholds from storageService
3. Implement update with debounced save
4. Implement reset to defaults
5. Write tests (`useThresholds.test.ts`)
6. Optional: Create ThresholdContext for global access

**Deliverable**: Settings management ready for SettingsScreen

---

### Phase 4: Core Logic (useNutritionAnalysis)
**Time**: ~40 minutes  
**Depends on**: useThresholds  
**Why last**: Most complex, integrates everything

1. Create `src/hooks/useNutritionAnalysis.ts`
2. Implement multi-step analysis with progress
3. Integrate imageService + openAIService
4. Implement error enhancement
5. Implement retry logic
6. Write tests (`useNutritionAnalysis.test.ts`)
7. Test with real images (manual QA)

**Deliverable**: Core analysis flow ready for UI

---

### Phase 5: Integration & Export
**Time**: ~15 minutes

1. Create `src/hooks/index.ts` barrel export
2. Update `src/types/index.ts` if needed
3. Run all tests (`npm test`)
4. Run lint (`npm run lint`)
5. Run format (`npm run format`)
6. Verify 100% TypeScript compliance

**Deliverable**: All hooks exported and ready for Phase 3

---

## 📊 Success Criteria

### Functional Requirements
- ✅ All hooks return correct TypeScript types
- ✅ Permission flows work on iOS/Android
- ✅ Image analysis completes successfully
- ✅ Settings persist across app restarts
- ✅ Errors are user-friendly
- ✅ Loading states are accurate

### Non-Functional Requirements
- ✅ 80%+ test coverage per hook
- ✅ 0 ESLint errors/warnings
- ✅ 0 TypeScript errors
- ✅ All tests pass (53+ existing + new hook tests)
- ✅ No memory leaks (cleanup in useEffect)
- ✅ Performance: <100ms hook initialization

### Integration Requirements
- ✅ Hooks work in isolation (unit tests)
- ✅ Hooks work together (integration tests)
- ✅ Services remain mocked in tests
- ✅ No circular dependencies
- ✅ Barrel export works correctly

---

## 🚀 After Phase 2.4

### What Becomes Possible

1. **HomeScreen** can capture photos and trigger analysis
2. **ReportScreen** can display results with thresholds
3. **SettingsScreen** can modify and persist thresholds
4. **CameraView** can request permissions elegantly
5. **Error boundaries** can catch hook errors gracefully

### Example Usage

```typescript
// HomeScreen.tsx (Phase 3)
function HomeScreen() {
  const { capturePhoto, hasPermission } = useCamera();
  const { analyzeImage, isAnalyzing, progress } = useNutritionAnalysis();
  const navigation = useNavigation();
  
  const handleTakePhoto = async () => {
    if (!hasPermission) {
      // Show permission rationale
      return;
    }
    
    const uri = await capturePhoto();
    if (!uri) return; // User cancelled
    
    const result = await analyzeImage(uri);
    if (result) {
      navigation.navigate('Report', { nutrition: result });
    }
  };
  
  return (
    <PrimaryButton 
      onPress={handleTakePhoto}
      loading={isAnalyzing}
      disabled={!hasPermission}
    >
      {progress || 'Take Photo'}
    </PrimaryButton>
  );
}
```

### Phase 3 Readiness Checklist
- ✅ Services complete (Storage, Image, OpenAI)
- ✅ Hooks complete (Permissions, Camera, Thresholds, Analysis)
- ✅ Types complete (All interfaces exported)
- ✅ Utils complete (Constants, validators, formatters)
- ✅ Theme complete (Colors, typography, spacing)

**Phase 3 Status**: 🟢 READY TO START

---

## 📁 File Structure (After Phase 2.4)

```
src/
├── hooks/
│   ├── usePermissions.ts           (50 lines)
│   ├── useCamera.ts                (70 lines)
│   ├── useThresholds.ts            (60 lines)
│   ├── useNutritionAnalysis.ts     (80 lines)
│   ├── index.ts                    (10 lines)
│   └── __tests__/
│       ├── usePermissions.test.ts  (40 lines)
│       ├── useCamera.test.ts       (50 lines)
│       ├── useThresholds.test.ts   (45 lines)
│       └── useNutritionAnalysis.test.ts (60 lines)
│
├── services/                       (✅ Complete)
│   ├── image.service.ts
│   ├── openai.service.ts
│   ├── storage.service.ts
│   └── __tests__/
│
├── types/                          (✅ Complete)
├── utils/                          (✅ Complete)
└── theme/                          (✅ Complete)
```

**Total New Files**: 9 files (~455 lines)

---

## ⏱️ Time Estimate

| Task | Estimated Time |
|------|---------------|
| usePermissions (code + tests) | 20 min |
| useCamera (code + tests) | 30 min |
| useThresholds (code + tests) | 25 min |
| useNutritionAnalysis (code + tests) | 40 min |
| Integration & testing | 15 min |
| **Total** | **~2.5 hours** |

---

## 🎯 Next Steps

1. **Review this plan** - Ensure alignment with project goals
2. **Start with usePermissions** - Build foundation first
3. **Test incrementally** - Don't wait until end
4. **Document as you go** - Add JSDoc comments
5. **Commit frequently** - After each hook completion

---

## 📚 References

- [React Hooks Documentation](https://react.dev/reference/react)
- [Expo Permissions](https://docs.expo.dev/versions/latest/sdk/permissions/)
- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Testing Library React Hooks](https://react-hooks-testing-library.com/)

---

**Status**: 📝 Ready for Implementation  
**Dependencies**: Phase 2.1, 2.2, 2.3 complete ✅  
**Blocks**: Phase 3 (UI Components) ⏸️  
**Priority**: 🔴 Critical Path

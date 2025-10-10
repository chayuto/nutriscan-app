# Sprint 2: Core Services Implementation

**Status**: 🔄 Ready to Start  
**Estimated Duration**: 3-4 days  
**Dependencies**: Sprint 1 (Foundation) ✅ Complete

## 🎯 Sprint Goals

Implement the core business logic layer including storage, image processing, and OpenAI Vision API integration.

## 📋 Task Breakdown

### Phase 2.1: Storage Service (Day 1) - HIGH PRIORITY

**Estimated Time**: 4 hours

- [ ] Create `src/services/storage.service.ts`
  - [ ] Implement `saveThresholds(thresholds: NutritionThresholds)`
  - [ ] Implement `loadThresholds(): Promise<NutritionThresholds | null>`
  - [ ] Implement generic `set(key, value)` and `get(key)` methods
  - [ ] Add JSON serialization/deserialization
  - [ ] Handle storage errors gracefully
  - [ ] Export singleton instance

- [ ] Write tests for storage service
  - [ ] Test save/load thresholds
  - [ ] Test error handling
  - [ ] Test null/undefined values
  - [ ] Test invalid JSON

**Acceptance Criteria**:

- ✅ Thresholds persist across app restarts
- ✅ Graceful fallback to default values
- ✅ 80%+ test coverage

---

### Phase 2.2: Image Service (Day 1-2) - HIGH PRIORITY

**Estimated Time**: 4 hours

- [ ] Create `src/services/image.service.ts`
  - [ ] Implement `compressImage(uri: string): Promise<string>`
    - Max width: 1024px
    - Quality: 0.8
    - Format: JPEG
    - Max size: 1MB
  - [ ] Implement `convertToBase64(uri: string): Promise<string>`
  - [ ] Implement `getImageSize(uri: string): Promise<{ width, height }>`
  - [ ] Handle permission requests (camera + gallery)
  - [ ] Export singleton instance

- [ ] Write tests for image service
  - [ ] Test compression with various image sizes
  - [ ] Test base64 conversion
  - [ ] Test permission handling
  - [ ] Test error cases (invalid URI, large files)

**Acceptance Criteria**:

- ✅ Images compressed to < 1MB before upload
- ✅ Base64 encoding works correctly
- ✅ Permission prompts are user-friendly
- ✅ 80%+ test coverage

---

### Phase 2.3: OpenAI Service (Day 2-3) - CRITICAL PRIORITY

**Estimated Time**: 6 hours

- [ ] Create `src/services/openai.service.ts`
  - [ ] Implement `OpenAIService` class
  - [ ] Add `fetchWithTimeout()` with AbortController (30s timeout)
  - [ ] Add `analyzeImage(base64Image: string): Promise<NutritionData>`
  - [ ] Implement retry logic with exponential backoff (3 attempts: 1s, 2s, 4s)
  - [ ] Add system prompt for consistent JSON output
  - [ ] Implement response parsing (handle markdown code blocks)
  - [ ] Add response validation with type guard
  - [ ] Implement error mapping (TIMEOUT, RATE_LIMIT, AUTH_ERROR, etc.)
  - [ ] Export singleton instance

- [ ] Write tests for OpenAI service
  - [ ] Test successful analysis with mock response
  - [ ] Test retry logic on timeout
  - [ ] Test rate limiting handling
  - [ ] Test invalid response parsing
  - [ ] Test error mapping

**System Prompt** (use this exact format):

```
You are a nutrition label analyzer. Extract nutritional values per 100g from food labels.

Return ONLY valid JSON in this exact format:
{
  "calories": <number or null>,
  "protein": <number or null>,
  "fat": <number or null>,
  "saturatedFat": <number or null>,
  "carbohydrates": <number or null>,
  "sugars": <number or null>,
  "fiber": <number or null>,
  "sodium": <number or null>,
  "servingSize": "<string or null>",
  "servingsPerContainer": <number or null>
}

Rules:
- All values in grams or mg (convert sodium to mg)
- Use null if value not found
- No explanatory text, only JSON
- Round to 1 decimal place
```

**Acceptance Criteria**:

- ✅ API calls succeed with valid nutrition labels
- ✅ Retry logic handles transient failures
- ✅ Timeout after 30 seconds with clear error
- ✅ Rate limiting handled gracefully
- ✅ Response validation prevents bad data
- ✅ 80%+ test coverage

---

### Phase 2.4: Custom Hooks (Day 3-4) - HIGH PRIORITY

**Estimated Time**: 4 hours

#### usePermissions Hook

- [ ] Create `src/hooks/usePermissions.ts`
  - [ ] Implement `requestCameraPermission()`
  - [ ] Implement `requestGalleryPermission()`
  - [ ] Return permission status and request functions
  - [ ] Handle permission denial with clear UI

#### useCamera Hook

- [ ] Create `src/hooks/useCamera.ts`
  - [ ] Integrate expo-camera
  - [ ] Implement `capturePhoto(): Promise<string>`
  - [ ] Implement `pickFromGallery(): Promise<string>`
  - [ ] Return image URI and loading states
  - [ ] Handle errors gracefully

#### useNutritionAnalysis Hook

- [ ] Create `src/hooks/useNutritionAnalysis.ts`
  - [ ] Use OpenAI service
  - [ ] Implement `analyzeImage(uri: string): Promise<NutritionData | null>`
  - [ ] Return data, loading state, and error
  - [ ] Handle all error cases

#### useThresholds Hook

- [ ] Create `src/hooks/useThresholds.ts`
  - [ ] Load from storage on mount
  - [ ] Implement `updateThreshold(key, value)`
  - [ ] Implement `resetToDefaults()`
  - [ ] Persist changes automatically
  - [ ] Return thresholds and update functions

**Acceptance Criteria**:

- ✅ All hooks handle loading and error states
- ✅ Hooks are reusable and composable
- ✅ Side effects properly cleaned up
- ✅ TypeScript types are correct

---

## 🧪 Testing Strategy

### Unit Tests

- Storage service CRUD operations
- Image compression logic
- Validators and formatters
- Type guards

### Integration Tests

- OpenAI service with mocked API
- Retry logic with simulated failures
- Image service with test images

### Manual Testing

- Camera permissions on physical device
- Gallery permissions on physical device
- OpenAI API with real nutrition labels (3-5 samples)

---

## 📦 Dependencies

### Required Environment Variables

```bash
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
```

### New Dependencies (if needed)

```bash
npm install --save-dev @testing-library/react-native jest-expo
```

---

## 📊 Success Metrics

- [ ] All services working with 80%+ test coverage
- [ ] Image compression reduces size by 70%+
- [ ] OpenAI API calls complete in < 30 seconds
- [ ] Retry logic successfully handles 429 errors
- [ ] Zero TypeScript errors
- [ ] All hooks properly manage state

---

## 🚧 Blockers & Risks

1. **OpenAI API Key**: Need valid key with Vision API access
   - **Mitigation**: User must provide their own key

2. **Rate Limiting**: Free tier has limits
   - **Mitigation**: Implement exponential backoff, show clear error

3. **Image Quality**: Poor photos may fail analysis
   - **Mitigation**: Add camera tips UI (Phase 3)

4. **Network Issues**: API calls may timeout
   - **Mitigation**: 30s timeout + retry logic + offline error

---

## 🔜 Next Sprint: Camera Integration & UI Components

After Sprint 2, we'll have:

- ✅ All core services working
- ✅ Custom hooks ready
- ✅ API integration complete

Sprint 3 will focus on:

- Camera view component
- Basic UI components (buttons, cards, progress bars)
- Home screen with working camera

---

## 📚 Reference Documentation

- [03-api-integration.md](./03-api-integration.md) - Complete OpenAI implementation
- [02-type-system.md](./02-type-system.md) - Type definitions
- [01-architecture.md](./01-architecture.md) - Service patterns

---

**Ready to start?** Let's begin with the Storage Service!

# NutriScan AI - Copilot Instructions

## Project Context
Mobile app for scanning food nutrition labels using AI. Users photograph labels → AI extracts data → Visual report with threshold alerts.

## Tech Stack
- **Framework**: React Native + Expo (TypeScript)
- **AI**: OpenAI Vision API (gpt-4o)
- **Storage**: expo-secure-store
- **Camera**: expo-camera, expo-image-picker

## Architecture Guidelines

### Code Organization
- Follow single responsibility principle
- Separate business logic from UI components
- Use custom hooks for reusable logic (e.g., `useCamera`, `useNutritionAnalysis`, `useThresholds`)
- Structure: `/src/components`, `/src/hooks`, `/src/services`, `/src/types`, `/src/utils`

### TypeScript Best Practices
- Define strict types for all nutrition data, API responses, and user settings
- Use interfaces for object shapes, types for unions/primitives
- Avoid `any` - use `unknown` with type guards if needed
- Enable strict mode in `tsconfig.json`

### State Management
- Use Context API for global state (user thresholds, settings)
- Keep component state local when possible
- Consider Zustand or Redux Toolkit for complex state
- Implement optimistic updates for better UX

### API Integration
- **Critical**: Implement retry logic with exponential backoff
- Use environment variables for API keys (never commit secrets)
- Add request/response interceptors for logging and error handling
- Implement proper timeout handling (30s for image analysis)
- Cache API responses when appropriate
- Handle rate limiting gracefully

### Error Handling
- Wrap API calls in try-catch with specific error types
- Show user-friendly error messages
- Log errors to crash reporting service (Sentry recommended)
- Implement offline mode fallbacks
- Handle permission denials gracefully (camera, storage)

### Performance Optimization
- Optimize images before API upload (resize, compress)
- Use React.memo for expensive components
- Implement lazy loading for screens
- Debounce user input in settings
- Use FlatList for scrollable content with many items

### Security
- Store API keys in environment variables, never in code
- Use expo-secure-store for sensitive data
- Validate and sanitize all user inputs
- Implement API key rotation strategy
- Use HTTPS only for API calls

### Testing Requirements
- Unit tests for utility functions and data parsing
- Integration tests for API service
- Component tests with React Native Testing Library
- E2E tests for critical flows (capture → analyze → report)
- Test edge cases: null values, malformed labels, API failures

### UI/UX Standards
- Follow iOS/Android platform guidelines
- Implement loading states for all async operations
- Add haptic feedback for user actions
- Ensure accessibility (screen readers, sufficient contrast)
- Support both light and dark themes
- Add skeleton screens for loading states

### Code Quality
- Use ESLint with Airbnb config + React Native rules
- Use Prettier for consistent formatting
- Implement pre-commit hooks (Husky + lint-staged)
- Maintain 80%+ code coverage
- Document complex logic with JSDoc comments

### OpenAI Vision API Guidelines
- System prompt must enforce strict JSON output format
- Include example responses in prompt for consistency
- Handle null/missing values in nutrition data
- Validate API response structure before processing
- Set temperature to 0 for deterministic results
- Use vision detail: "high" for better accuracy

### Progressive Enhancement
- Start with MVP: capture → analyze → display
- Phase 2: Add history, favorites, barcode scanning
- Phase 3: Add meal planning, dietary recommendations
- Keep each feature behind feature flags

## Critical Patterns

### API Response Parsing
```typescript
interface NutritionData {
  calories: number | null;
  fat: number | null;
  sugars: number | null;
  // ... strictly typed
}

// Always validate with Zod or similar
```

### Error Boundaries
Wrap screens in error boundaries to prevent app crashes.

### Analytics
Track key events: photo_taken, analysis_success, analysis_failure, threshold_exceeded.

## Deployment Checklist
- [ ] Environment variables configured
- [ ] Error tracking enabled
- [ ] Analytics integrated
- [ ] App icons and splash screens
- [ ] Privacy policy and terms
- [ ] Store screenshots and descriptions
- [ ] Test on physical devices (iOS + Android)

## Common Pitfalls to Avoid
- Don't block UI thread with image processing
- Don't trust API responses without validation
- Don't store base64 images in state (use URI)
- Don't forget to clean up camera resources
- Don't skip permission request explanations
- Don't hard-code threshold values in components

## When Suggesting Code
1. Check for existing patterns in the codebase first
2. Prioritize type safety and error handling
3. Include loading and error states
4. Add inline comments for complex logic
5. Suggest tests alongside implementation
6. Consider mobile performance implications

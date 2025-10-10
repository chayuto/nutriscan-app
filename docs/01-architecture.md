# Architecture Overview

## Project Structure

```
nutriscan-app/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── NutrientProgressBar.tsx
│   │   ├── CameraView.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── LoadingSpinner.tsx
│   ├── screens/           # Main app screens
│   │   ├── HomeScreen.tsx
│   │   ├── ReportScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useCamera.ts
│   │   ├── useNutritionAnalysis.ts
│   │   ├── useThresholds.ts
│   │   └── usePermissions.ts
│   ├── services/          # Business logic & API
│   │   ├── openai.service.ts
│   │   ├── storage.service.ts
│   │   └── image.service.ts
│   ├── types/             # TypeScript definitions
│   │   ├── nutrition.types.ts
│   │   ├── api.types.ts
│   │   └── navigation.types.ts
│   ├── utils/             # Helper functions
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   ├── context/           # React Context providers
│   │   └── ThresholdContext.tsx
│   └── theme/             # Design system
│       ├── colors.ts
│       ├── spacing.ts
│       └── typography.ts
├── assets/
├── docs/
├── __tests__/
└── App.tsx
```

## Core Architecture Principles

### 1. Separation of Concerns
- **Screens**: Pure UI, no business logic
- **Hooks**: Reusable stateful logic
- **Services**: External integrations (API, storage)
- **Utils**: Pure functions, no side effects

### 2. Data Flow
```
User Action → Hook → Service → API/Storage
                ↓
            State Update
                ↓
            Component Re-render
```

### 3. State Management Strategy

**Local State** (useState):
- Component-specific UI state (loading, errors)
- Form inputs
- Modal visibility

**Context API**:
- User thresholds (global)
- Theme preferences
- App settings

**No Redux** for MVP - keep it simple.

## Key Modules

### OpenAI Service
- Handles image upload and analysis
- Implements retry logic with exponential backoff
- Validates API responses
- Manages timeout and rate limiting

### Storage Service
- Abstracts expo-secure-store
- Handles serialization/deserialization
- Provides type-safe getters/setters

### Image Service
- Compresses images before upload
- Converts to base64
- Handles permissions

## Navigation Strategy

**Single-file approach for MVP** (App.tsx):
- Use `useState` to track current view
- Conditional rendering of screens
- Pass props down

**Future**: Migrate to React Navigation when adding history/favorites.

## Error Handling Strategy

1. **API Errors**: Retry with backoff, then show user-friendly message
2. **Permission Errors**: Clear prompt with action button
3. **Validation Errors**: Inline field-level feedback
4. **Network Errors**: Offline mode message
5. **Unexpected Errors**: Error boundary catches and logs

## Performance Considerations

- Image compression before upload (max 1MB)
- Lazy load screens (future)
- Memoize expensive computations
- Debounce user inputs (settings)
- Use React.memo for static components

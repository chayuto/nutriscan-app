# NutriScan AI - GitHub Copilot Instructions

> **Quick Reference**: This file provides essential guidelines for AI-assisted development. For detailed specifications, see the [Documentation Hub](../docs/README.md).

## 🎯 Project Overview

**NutriScan AI** - Mobile nutrition label scanner using OpenAI Vision API  
**Stack**: React Native + Expo SDK 51+ (TypeScript) + OpenAI gpt-4o  
**Theme**: Neon Clarity (dark mode with glassmorphism)  
**Flow**: Camera → AI Analysis → Visual Report with Threshold Alerts

**Important**: App focuses on **per 100g/100ml values** from Australian nutrition labels (standard column), NOT serving sizes.

## 🎨 Design System Quick Reference

### Colors (NEVER hardcode - import from `@/theme`)

```typescript
background: '#111827'; // Deep Space Blue
primary: '#34D399'; // Vibrant Teal (safe state)
primaryLight: '#A3E635'; // Lime Green (gradient end)
warning: '#F59E0B'; // Amber (caution state)
error: '#EF4444'; // Red (danger state)
text: '#F9FAFB'; // Ghost White
textSecondary: '#9CA3AF'; // Cool Gray
surface: 'rgba(31, 41, 55, 0.5)'; // Glass cards
```

### Typography (Inter Font)

```typescript
h1: Inter_700Bold, 32px
h2: Inter_600SemiBold, 24px
body: Inter_400Regular, 16px
button: Inter_600SemiBold, 16px
```

### Spacing (8px grid)

```typescript
xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
```

### Key Components

- **Gradient Button**: `LinearGradient` with `[#34D399, #A3E635]`
- **Glass Card**: `BlurView` with `surface` background
- **Progress Bar**: Color-coded (green → amber → red) based on threshold %
- **Touch Targets**: Minimum 44x44pt (accessibility requirement)

## 📐 Architecture Principles

### File Structure

```
src/
├── theme/        # Design tokens (colors, typography, spacing)
├── types/        # TypeScript interfaces & types
├── services/     # API & storage (openai, storage, image)
├── hooks/        # Custom hooks (useCamera, useThresholds, useNutritionAnalysis, useSettingsForm, usePermissions)
├── components/   # Reusable UI (8 components: buttons, cards, progress bars, forms)
└── screens/      # Main screens (HomeScreen, ReportScreen, SettingsScreen)
```

### Code Organization Rules

1. **Single Responsibility**: One concern per component/service/hook
2. **Business Logic**: In services & hooks, NOT in components
3. **Type Safety**: Strict TypeScript, NO `any` types
4. **Theme Values**: ALWAYS import from `@/theme`, never hardcode
5. **Error Handling**: Try-catch around ALL async operations
6. **Accessibility**: WCAG AA compliance (contrast 4.5:1, touch 44pt)

## 🔧 Critical Implementation Patterns

### Component Structure (ALWAYS use this)

```typescript
import { colors, spacing, typography } from '@/theme';

interface Props { /* typed props */ }

export const Component: React.FC<Props> = ({ prop }) => {
  // 1. Hooks
  const [state, setState] = useState();

  // 2. Callbacks
  const handleAction = useCallback(() => {}, [deps]);

  // 3. Effects
  useEffect(() => {}, []);

  // 4. Render
  return <View style={styles.container}>{/* JSX */}</View>;
};

// 5. Styles (outside component, use theme values)
const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, padding: spacing.md }
});
```

### API Integration (OpenAI Vision)

```typescript
// MUST include:
// 1. Retry logic with exponential backoff (3 attempts: 1s, 2s, 4s)
// 2. Timeout handling (30s max with AbortController)
// 3. Response validation (Zod schema or type guard)
// 4. Error mapping (TIMEOUT, RATE_LIMIT, AUTH_ERROR, SERVER_ERROR)

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const response = await fetchWithTimeout(url, options, 30000);
    return validateResponse(response);
  } catch (error) {
    if (!isRetryable(error) || attempt === 3) throw error;
    await delay(Math.pow(2, attempt - 1) * 1000);
  }
}
```

### Error Handling (REQUIRED)

```typescript
// 1. Wrap ALL async operations
try {
  const result = await service.method();
} catch (error) {
  if (error.code === 'TIMEOUT') {
    setError('Request timed out. Please try again.');
  }
  // Log to console/Sentry in production
}

// 2. Permission requests with clear rationale
if (status !== 'granted') {
  Alert.alert('Camera Access Needed', 'NutriScan needs...', [
    { text: 'Open Settings', onPress: () => Linking.openSettings() }
  ]);
}

// 3. Error Boundary around all screens
<ErrorBoundary><Screen /></ErrorBoundary>
```

### UI/UX Standards (REQUIRED)

**Loading States** (every async operation):

```typescript
{isLoading && (
  <ActivityIndicator size="large" color={colors.primary} />
  <Text>Analyzing... (up to 30 seconds)</Text>
)}
```

**Gradient Buttons**:

```typescript
<Pressable style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
  <LinearGradient colors={colors.primaryGradient}>
    <Text>{children}</Text>
  </LinearGradient>
</Pressable>
```

**Glass Cards**:

```typescript
<BlurView blurType="dark" blurAmount={10} style={styles.glass}>
  {children}
</BlurView>

styles.glass = {
  backgroundColor: colors.surface,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: colors.border,
}
```

**Accessibility** (WCAG AA):

```typescript
<Pressable
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Take photo of nutrition label"
  accessibilityHint="Opens camera to scan"
>
```

## 📋 When Suggesting Code

### ALWAYS Include:

1. ✅ Import theme values (`colors`, `spacing`, `typography`)
2. ✅ Loading & error states
3. ✅ TypeScript types/interfaces
4. ✅ Accessibility attributes
5. ✅ Error handling (try-catch)
6. ✅ Component/service/hook patterns from above
7. ✅ Comments for complex logic

### NEVER:

1. ❌ Hardcode colors, spacing, or typography
2. ❌ Use `any` type in TypeScript
3. ❌ Skip loading states for async operations
4. ❌ Forget accessibility attributes
5. ❌ Trust API responses without validation
6. ❌ Block UI thread with heavy operations
7. ❌ Commit API keys (use `.env`)

## 🧪 Testing Requirements

- **Coverage**: 80%+ required
- **Unit**: Test utilities, validators, formatters
- **Integration**: Test services with retry logic, error handling
- **Component**: Test UI states (loading, error, success, accessibility)
- **E2E**: Critical flow (camera → analyze → report)

## 📚 Detailed Documentation

For comprehensive specifications, see:

- **[00-design-system-summary.md](../docs/00-design-system-summary.md)** - Complete design tokens & components
- **[01-architecture.md](../docs/01-architecture.md)** - Project structure & patterns
- **[02-type-system.md](../docs/02-type-system.md)** - TypeScript types & Zod schemas
- **[03-api-integration.md](../docs/03-api-integration.md)** - Full OpenAI service implementation
- **[04-implementation-checklist.md](../docs/04-implementation-checklist.md)** - 9-phase build plan (150+ tasks)
- **[05-ui-specifications.md](../docs/05-ui-specifications.md)** - Detailed screen layouts & styling
- **[docs/README.md](../docs/README.md)** - Documentation hub & reading guides

## 🎯 File Naming Conventions

```
Components:  PascalCase.tsx       (NutrientProgressBar.tsx)
Screens:     PascalCase.tsx       (HomeScreen.tsx)
Hooks:       camelCase.ts         (useCamera.ts)
Services:    camelCase.service.ts (openai.service.ts)
Types:       camelCase.types.ts   (nutrition.types.ts)
Theme:       camelCase.ts         (colors.ts)
```

---

**Remember**: Production-grade = type-safe + accessible + performant + well-tested.  
Every component handles loading/error/empty states. Every API call has retry logic + timeout. Every interaction has visual feedback.

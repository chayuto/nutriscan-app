# NutriScan AI - Complete Design System Summary

## 🎨 Neon Clarity Theme

A modern, dark-themed design system combining glassmorphism effects with vibrant neon accents for a premium nutrition scanning experience.

### Core Visual Identity

- **Theme**: Dark mode with glassmorphic elements
- **Accent**: Vibrant teal-to-lime gradient (#34D399 → #A3E635)
- **Background**: Deep space blue (#111827)
- **Typography**: Inter font family
- **Effect**: Blur + transparency for depth

---

## 📦 Quick Setup Checklist

### 1. Install Required Packages

```bash
# Core dependencies
expo install expo-camera expo-image-picker expo-secure-store

# UI dependencies
expo install expo-linear-gradient @react-native-community/blur

# Fonts
expo install expo-font @expo-google-fonts/inter

# Optional: Validation
npm install zod

# Optional: Testing
npm install --save-dev @testing-library/react-native jest-expo
```

### 2. Setup Theme Files

Create the following structure:

```
src/
├── theme/
│   ├── colors.ts          # Color palette
│   ├── typography.ts      # Font styles
│   ├── spacing.ts         # Layout spacing
│   ├── shadows.ts         # Shadow/elevation
│   └── effects.ts         # Glassmorphism
```

### 3. Load Fonts in App.tsx

```typescript
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return <YourApp />;
}
```

---

## 🎯 Key Components to Build

### 1. PrimaryButton (Gradient)

- Gradient background (teal → lime)
- Press animation (scale 0.97, opacity 0.8)
- Shadow with neon glow
- 56px height, 16px vertical padding

### 2. GlassCard

- Uses `BlurView` with dark blur
- Semi-transparent background
- Translucent border
- 20px border radius

### 3. NutrientProgressBar

- Dynamic width based on percentage
- Color-coded: green (safe) → amber (caution) → red (danger)
- Gradient fill when under threshold
- Warning badge when exceeded

### 4. IconButton

- 44x44pt minimum touch target
- Circular glass background
- Press opacity 0.7
- Centered icon

### 5. StyledTextInput

- Dark gray background (#374151)
- Border focus state with glow
- 52px height
- Inter font

---

## 🎭 Screen Components Overview

### HomeScreen

- Gradient title with neon glow
- Two CTAs: "Take Photo" (gradient) + "Choose Photo" (glass)
- Settings icon button (top-right)
- Optional: Scan history link

### CameraView (Modal)

- Full-screen camera preview
- Top controls: Close, Grid, Flash
- Large circular capture button (80x80)
- Bottom controls: Gallery, Flip camera
- Tap-to-focus reticle animation

### ReportScreen

- Food image thumbnail at top
- Glass card containing nutrition data
- 8 nutrient progress bars with labels
- Share button (top-right)
- Save button (bottom)

### SettingsScreen (Modal)

- Centered glass card (80% max height)
- 8 threshold inputs with icons
- Numeric keyboard
- Focus state with neon glow
- Reset to defaults button
- Gradient save button

---

## 🎨 Color Usage Guide

### When to Use Each Color

| Color                 | Use Case               | Example                  |
| --------------------- | ---------------------- | ------------------------ |
| Primary Gradient      | CTAs, active states    | "Take Photo" button      |
| Teal (#34D399)        | Safe progress, success | 0-50% nutrition bars     |
| Amber (#F59E0B)       | Warnings               | 50-80% nutrition bars    |
| Red (#EF4444)         | Errors, exceeded       | >80% nutrition bars      |
| Ghost White (#F9FAFB) | Primary text           | Headings, labels         |
| Cool Gray (#9CA3AF)   | Secondary text         | Descriptions, units      |
| Surface               | Cards, inputs          | Glass cards, text fields |

---

## 📏 Spacing System

Based on 8px grid:

- **xs**: 4px - Tight spacing within components
- **sm**: 8px - Small gaps between related items
- **md**: 16px - Default component padding
- **lg**: 24px - Screen padding, section spacing
- **xl**: 32px - Large separations
- **xxl**: 48px - Major section breaks

---

## ✨ Animation Specifications

### Screen Transitions

- Duration: 300ms
- Easing: `ease-in-out`
- Type: Fade + slide

### Button Press

- Scale: 0.95-0.97
- Duration: 100ms
- Haptic: Light impact

### Progress Bars

- Fill duration: 600ms
- Easing: `ease-out`
- Stagger: 100ms per bar

### Loading Spinner

- Custom neon gradient spinner
- Rotation: 360° continuous
- Duration: 1000ms

### Focus Reticle (Camera)

- Scale: 0.5 → 1
- Opacity: 0 → 1 → 0
- Duration: 300ms

---

## ♿ Accessibility Requirements

### Color Contrast

- Primary text: 4.5:1 minimum (WCAG AA)
- Large text: 3:1 minimum
- Test with: Ghost White (#F9FAFB) on Deep Space (#111827)

### Touch Targets

- Minimum: 44x44pt
- Buttons: 56px height recommended
- Icon buttons: 44x44pt exact

### Screen Readers

```typescript
// Progress bar example
<View
  accessible={true}
  accessibilityRole="progressbar"
  accessibilityLabel={`${label}: ${value} out of ${threshold} ${unit}`}
  accessibilityValue={{ min: 0, max: threshold, now: value }}
>
```

### Focus Order

- Logical top-to-bottom, left-to-right
- Skip to content option for long lists
- Visible focus indicators (neon glow)

---

## 🚀 Implementation Priority

### Phase 1: Foundation (Week 1)

1. ✅ Setup theme system
2. ✅ Create base components (Button, Card, Input)
3. ✅ Build HomeScreen
4. ✅ Implement basic navigation

### Phase 2: Core Features (Week 2)

1. ✅ Camera integration
2. ✅ OpenAI Vision API connection
3. ✅ ReportScreen with progress bars
4. ✅ SettingsScreen with persistence

### Phase 3: Polish (Week 3)

1. ✅ Add animations
2. ✅ Implement error states
3. ✅ Loading states
4. ✅ Accessibility audit
5. ✅ Performance optimization

---

## 🎯 Design Principles

1. **Clarity First**: Information hierarchy is critical for nutrition data
2. **Speed Matters**: Optimize every interaction for quick scanning
3. **Visual Feedback**: Every action gets immediate visual response
4. **Accessible by Default**: Build inclusivity from the start
5. **Performance Conscious**: Dark theme reduces eye strain and battery usage

---

## 📱 Platform-Specific Notes

### iOS

- Use `SafeAreaView` for notch/home indicator
- Haptic feedback: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`
- Status bar: Light content on dark background

### Android

- Elevation instead of shadow for better performance
- Use `StatusBar.setBarStyle('light-content')`
- Material ripple effect on buttons (optional)

---

## 🔧 Development Tools

### VSCode Extensions

- ES7+ React/Redux snippets
- Prettier
- ESLint
- React Native Tools

### Testing

- React Native Testing Library for components
- Jest for unit tests
- Detox for E2E (optional)

### Design Handoff

- Figma/Sketch files should match these specs
- Export assets at 1x, 2x, 3x for different densities
- Use SVG for icons when possible

---

## 📚 Related Documentation

- [01-architecture.md](./01-architecture.md) - Project structure
- [02-type-system.md](./02-type-system.md) - TypeScript types
- [03-api-integration.md](./03-api-integration.md) - OpenAI service
- [04-implementation-checklist.md](./04-implementation-checklist.md) - Build tasks
- [05-ui-specifications.md](./05-ui-specifications.md) - Detailed UI specs

---

## 🎨 Design Tokens Reference

```typescript
// Quick copy-paste for common styles

// Primary button
{
  background: LinearGradient(['#34D399', '#A3E635']),
  borderRadius: 16,
  paddingVertical: 16,
  paddingHorizontal: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 5,
  elevation: 8,
}

// Glass card
{
  backgroundColor: 'rgba(31, 41, 55, 0.5)',
  borderRadius: 20,
  borderWidth: 1,
  borderColor: 'rgba(249, 250, 251, 0.2)',
  padding: 16,
}

// Progress bar (safe state)
{
  backgroundColor: '#374151', // track
  fillColor: '#34D399', // fill
  height: 12,
  borderRadius: 6,
}

// Input field
{
  backgroundColor: '#374151',
  color: '#F9FAFB',
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: 'rgba(249, 250, 251, 0.2)',
}

// Focus state (any input/button)
{
  borderColor: '#34D399',
  shadowColor: '#34D399',
  shadowOpacity: 0.5,
  shadowRadius: 10,
}
```

---

## 💡 Pro Tips

1. **Reuse theme values**: Never hardcode colors or spacing
2. **Test on device**: Glassmorphism looks different on physical devices
3. **Dark mode only**: Focus on perfecting one theme first
4. **Performance**: Use `React.memo` for glass cards (expensive to render)
5. **Accessibility**: Test with VoiceOver/TalkBack from day one

---

Built with ❤️ for better nutrition awareness

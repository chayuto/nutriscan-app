# UI/UX Specifications - Neon Clarity Theme

## Design System

### Color Palette (Neon Clarity Theme)

```typescript
// src/theme/colors.ts

export const colors = {
  // Primary - Neon Gradient
  primary: '#34D399', // Vibrant Teal
  primaryLight: '#A3E635', // Lime Green
  primaryGradient: ['#34D399', '#A3E635'], // Teal to Lime

  // Status Colors
  success: '#34D399', // Vibrant Teal
  warning: '#F59E0B', // Amber
  error: '#EF4444', // Vibrant Red
  info: '#60A5FA', // Sky Blue

  // Background & Surfaces
  background: '#111827', // Deep Space Blue
  surface: 'rgba(31, 41, 55, 0.5)', // Translucent Dark Gray (glassmorphism)
  surfaceDark: '#1F2937', // Solid Dark Gray
  overlay: 'rgba(17, 24, 39, 0.9)', // Modal overlay

  // Text
  text: '#F9FAFB', // Ghost White (primary text)
  textSecondary: '#9CA3AF', // Cool Gray (secondary text)
  textMuted: '#6B7280', // Muted Gray

  // Borders & Dividers
  border: 'rgba(249, 250, 251, 0.2)', // Translucent White
  divider: 'rgba(156, 163, 175, 0.1)', // Subtle divider

  // Progress Bar States
  safe: '#34D399', // Teal (0-50%)
  caution: '#F59E0B', // Amber (50-80%)
  danger: '#EF4444', // Red (80-100%+)
  progressTrack: '#374151', // Dark Gray track

  // Interactive States
  pressed: 'rgba(52, 211, 153, 0.2)', // Teal overlay when pressed
  disabled: 'rgba(156, 163, 175, 0.3)', // Disabled state

  // Light Mode (Optional for future)
  light: {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
  },
};
```

### Typography (Inter Font Family)

```typescript
// src/theme/typography.ts

export const typography = {
  h1: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
    color: colors.text,
  },
  h2: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.3,
    color: colors.text,
  },
  h3: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.2,
    color: colors.text,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  bodyLarge: {
    fontFamily: 'Inter_500Medium',
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 28,
    color: colors.text,
  },
  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: colors.textMuted,
  },
  button: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0.5,
    color: colors.text,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
    color: colors.textSecondary,
  },
};

// Font loading setup
// Install: expo install expo-font @expo-google-fonts/inter
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
```

### Spacing & Layout

```typescript
// src/theme/spacing.ts

// Base unit: 8px
export const spacing = {
  xs: 4, // 0.5 units
  sm: 8, // 1 unit
  md: 16, // 2 units
  lg: 24, // 3 units
  xl: 32, // 4 units
  xxl: 48, // 6 units
  xxxl: 64, // 8 units
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const layout = {
  screenPadding: spacing.lg,
  cardPadding: spacing.md,
  buttonHeight: 56,
  inputHeight: 52,
  iconSize: 24,
  iconSizeLarge: 32,
};
```

### Shadows & Elevation

```typescript
// src/theme/shadows.ts

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 8,
  },
  glow: {
    // Neon glow effect
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
};
```

### Glassmorphism Effect

```typescript
// src/theme/effects.ts
// Requires: expo install @react-native-community/blur

import { BlurView } from '@react-native-community/blur';

export const glassCard = {
  backgroundColor: colors.surface,
  borderRadius: borderRadius.xl,
  borderWidth: 1,
  borderColor: colors.border,
  overflow: 'hidden',
};

// Usage example:
<BlurView
  blurType="dark"
  blurAmount={10}
  reducedTransparencyFallbackColor={colors.surfaceDark}
  style={[glassCard, { padding: spacing.md }]}
>
  {/* Card content */}
</BlurView>
```

---

## Component Library

### Buttons

#### Primary Button (Gradient)

```typescript
// Requires: expo install expo-linear-gradient
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable } from 'react-native';

const PrimaryButton = ({ onPress, children, disabled }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      {
        opacity: pressed ? 0.8 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      },
    ]}
  >
    <LinearGradient
      colors={disabled ? [colors.disabled, colors.disabled] : colors.primaryGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.md,
      }}
    >
      <Text style={typography.button}>{children}</Text>
    </LinearGradient>
  </Pressable>
);

const styles = StyleSheet.create({
  buttonPrimary: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  buttonSecondary: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...typography.button,
  },
});
```

#### Icon Button

```typescript
const IconButton = ({ icon, onPress, size = 44 }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
        ...shadows.sm,
      },
    ]}
  >
    {icon}
  </Pressable>
);
```

### Glass Card Component

```typescript
import { BlurView } from '@react-native-community/blur';

const GlassCard = ({ children, style }) => (
  <BlurView
    blurType="dark"
    blurAmount={10}
    reducedTransparencyFallbackColor={colors.surfaceDark}
    style={[
      {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        overflow: 'hidden',
      },
      style,
    ]}
  >
    {children}
  </BlurView>
);
```

### Text Input

```typescript
const StyledTextInput = ({ value, onChangeText, placeholder, ...props }) => (
  <TextInput
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor={colors.textMuted}
    style={{
      backgroundColor: colors.progressTrack,
      color: colors.text,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
      fontFamily: 'Inter_400Regular',
      ...typography.body,
    }}
    {...props}
  />
);
```

---

## Screen Specifications

### HomeScreen (Neon Clarity)

**Layout:**

```
┌─────────────────────────┐
│  [⚙️]                   │
│                         │
│      [Neon Logo]        │
│         ✨🥗✨          │
│                         │
│    NutriScan AI         │
│  Scan & Analyze Food    │
│                         │
│  ┌───────────────────┐  │
│  │ 📸 Take Photo     │  │
│  │ [Gradient Button] │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ 🖼️  Choose Photo  │  │
│  │ [Glass Button]    │  │
│  └───────────────────┘  │
│                         │
│    [Scan History]       │
└─────────────────────────┘
```

**Styling:**

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    opacity: 0.7,
  },
  buttonsContainer: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  historyLink: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  historyText: {
    ...typography.caption,
    color: colors.primary,
  },
});
```

**Components:**

- Settings icon button: Top-right, glass effect
- Logo: Animated gradient glow
- Title: `typography.h1` with gradient text (optional)
- Subtitle: `typography.body`, semi-transparent
- Primary button: Gradient with neon glow
- Secondary button: Glass effect
- History link: Subtle text button

**Interactions:**

- Settings → Slide in from right
- "Take Photo" → Permission check → Camera modal
- "Choose Photo" → Permission check → Image picker
- History → Navigate to history (Phase 2)

---

### CameraView (Full Screen Modal)

**Layout:**

```
┌─────────────────────────┐
│  [✕]   [Grid] [⚡]      │
│                         │
│                         │
│    [Camera Preview]     │
│     [Focus Reticle]     │
│                         │
│                         │
│      ┌─────────┐        │
│      │    ◉    │        │
│      │ Capture │        │
│      └─────────┘        │
│    [🖼️]      [🔄]       │
└─────────────────────────┘
```

**Styling:**

```typescript
const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.xl + 10, // Safe area
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  controlButtonActive: {
    backgroundColor: colors.primary,
  },
  bottomControls: {
    position: 'absolute',
    bottom: spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    borderWidth: 4,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.md,
  },
  focusReticle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 30,
    // Animated position based on tap
  },
});
```

**Components:**

- Full-screen camera preview
- Close button (✕): Top-left, glass button
- Grid toggle: Top-center, for alignment
- Flash toggle (⚡): Top-right, active state
- Focus reticle: Animated on tap
- Capture button: Large neon ring
- Gallery shortcut (🖼️): Bottom-left
- Flip camera (🔄): Bottom-right

**Interactions:**

- Close → Fade out modal
- Grid → Toggle composition grid overlay
- Flash → Cycle: auto → on → off
- Tap to focus → Show reticle animation
- Capture → Freeze frame → Preview modal
- Gallery → Open image picker
- Flip → Switch front/back camera

**Animations:**

- Focus reticle: Scale + fade in/out (300ms)
- Capture: Flash overlay + scale down (200ms)
- Button press: Scale 0.95 (100ms)

---

### ReportScreen (Neon Glass Design)

**Layout:**

```
┌─────────────────────────┐
│  [← Back]    [Share]    │
│                         │
│  [Food Image Thumbnail] │
│                         │
│  ╔═══════════════════╗  │
│  ║ Nutrition Report  ║  │
│  ║ ─────────────────  ║  │
│  ║                   ║  │
│  ║ Calories          ║  │
│  ║ 250 / 2000 kcal   ║  │
│  ║ ▓▓▓░░░░░░  12%    ║  │
│  ║                   ║  │
│  ║ Fat ⚠️            ║  │
│  ║ 65 / 70 g         ║  │
│  ║ ▓▓▓▓▓▓▓▓▓░  93%   ║  │
│  ║                   ║  │
│  ║ [All nutrients]   ║  │
│  ╚═══════════════════╝  │
│                         │
│  ┌─────────────────┐    │
│  │  💾 Save Report │    │
│  └─────────────────┘    │
└─────────────────────────┘
```

**Styling:**

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  glassCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  reportTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  reportSubtitle: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  nutrientRow: {
    marginBottom: spacing.lg,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  nutrientLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  nutrientLabelExceeded: {
    color: colors.error,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  warningText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  nutrientValues: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: colors.progressTrack,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  progressBarGradient: {
    height: '100%',
  },
  percentageText: {
    ...typography.caption,
    textAlign: 'right',
    marginTop: 4,
  },
  saveButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
});
```

**Progress Bar with Gradient:**

```typescript
const NutrientProgressBar = ({ label, value, threshold, unit }) => {
  const percentage = Math.min((value / threshold) * 100, 100);
  const exceeded = value > threshold;

  const getBarColor = () => {
    if (exceeded) return colors.danger;
    if (percentage > 80) return colors.danger;
    if (percentage > 50) return colors.caution;
    return colors.safe;
  };

  const barColor = getBarColor();

  return (
    <View style={styles.nutrientRow}>
      <View style={styles.nutrientHeader}>
        <Text style={[
          styles.nutrientLabel,
          exceeded && styles.nutrientLabelExceeded
        ]}>
          {label}
        </Text>
        {exceeded && (
          <View style={styles.warningBadge}>
            <Text style={styles.warningText}>⚠️ OVER</Text>
          </View>
        )}
      </View>

      <Text style={styles.nutrientValues}>
        {value} / {threshold} {unit}
      </Text>

      <View style={styles.progressBarContainer}>
        <LinearGradient
          colors={exceeded ? [barColor, barColor] : [colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBarFill, { width: `${percentage}%` }]}
        />
      </View>

      <Text style={styles.percentageText}>{percentage.toFixed(0)}%</Text>
    </View>
  );
};
```

**Components:**

- Back button: Icon button with glass effect
- Share button: Export report image
- Image thumbnail: Captured label photo
- Glass card: Blurred background container
- Title: `typography.h2`
- Each nutrient row:
  - Label with warning badge
  - Value/Threshold text
  - Gradient progress bar
  - Percentage indicator
- Save button: Gradient button at bottom

**Progress Bar States:**

- 0-50%: Teal to Lime gradient
- 50-80%: Amber solid
- 80-100%: Red solid
- > 100%: Red + "OVER" badge

**Interactions:**

- Back → Return to home
- Share → Native share sheet
- Save → Store to history (Phase 2)
- Long-press nutrient → Show details modal

---

### SettingsScreen (Glass Modal)

**Layout:**

```
┌─────────────────────────┐
│  [✕]                    │
│                         │
│  ╔═══════════════════╗  │
│  ║ Daily Thresholds  ║  │
│  ║ ─────────────────  ║  │
│  ║                   ║  │
│  ║ Calories (kcal)   ║  │
│  ║ [ 2000 ]  📊      ║  │
│  ║                   ║  │
│  ║ Protein (g)       ║  │
│  ║ [  50  ]  💪      ║  │
│  ║                   ║  │
│  ║ Fat (g)           ║  │
│  ║ [  70  ]  🥑      ║  │
│  ║                   ║  │
│  ║ Sugars (g)        ║  │
│  ║ [  50  ]  🍬      ║  │
│  ║                   ║  │
│  ║ Sodium (mg)       ║  │
│  ║ [ 2300 ]  🧂      ║  │
│  ║                   ║  │
│  ║ [Reset Defaults]  ║  │
│  ╚═══════════════════╝  │
│                         │
│  ┌─────────────────┐    │
│  │  Save Changes   │    │
│  └─────────────────┘    │
└─────────────────────────┘
```

**Styling:**

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.95)', // Dark overlay
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
  },
  glassCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  scrollContent: {
    paddingVertical: spacing.sm,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.progressTrack,
    color: colors.text,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: 18,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: 'Inter_600SemiBold',
  },
  inputFocused: {
    borderColor: colors.primary,
    ...shadows.glow,
  },
  inputUnit: {
    ...typography.caption,
    width: 50,
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  resetText: {
    ...typography.caption,
    color: colors.primary,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
```

**Input Component with Focus State:**

```typescript
const ThresholdInput = ({ label, value, onChangeText, unit, icon }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <View style={styles.inputLabel}>
        <Text>{icon}</Text>
        <Text style={typography.label}>{label}</Text>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          value={String(value)}
          onChangeText={onChangeText}
          keyboardType="numeric"
          style={[styles.input, isFocused && styles.inputFocused]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType="done"
        />
        <Text style={styles.inputUnit}>{unit}</Text>
      </View>
    </View>
  );
};
```

**Components:**

- Modal overlay: Semi-transparent dark
- Close button (✕): Top-right
- Glass card: Scrollable container
- Title: `typography.h2`
- Input groups:
  - Icon + Label
  - Numeric input with focus glow
  - Unit label
- Reset button: Text link
- Save button: Gradient, full width

**Default Values (FDA Guidelines):**

- Calories: 2000 kcal
- Protein: 50 g
- Fat: 70 g
- Saturated Fat: 20 g
- Carbohydrates: 275 g
- Sugars: 50 g
- Fiber: 25 g
- Sodium: 2300 mg

**Interactions:**

- Close → Discard changes, fade out
- Input focus → Neon glow border
- Input validation → Real-time (positive numbers only)
- Reset → Confirmation modal → Restore defaults
- Save → Validate all → Persist → Success haptic → Close
- Back gesture → Prompt if unsaved changes

**Animations:**

- Modal enter: Slide up + fade in (300ms)
- Modal exit: Slide down + fade out (250ms)
- Input focus: Glow animation (200ms)
- Save success: Button scale + checkmark (400ms)

---

## Component Specifications

### NutrientProgressBar

**Props:**

```typescript
interface NutrientProgressBarProps {
  label: string; // "Calories", "Fat", etc.
  value: number | null; // Actual value
  threshold: number; // Daily limit
  unit: string; // "g", "mg", "kcal"
  color?: string; // Override color
}
```

**Visual States:**

1. **Normal**: Value < threshold \* 0.8 → Green
2. **Caution**: Value >= threshold \* 0.8 → Orange
3. **Exceeded**: Value >= threshold → Red + Warning icon
4. **No Data**: Value is null → Gray with "N/A"

**Layout:**

```
Label                        ⚠️ (if exceeded)
Value / Threshold unit
████████░░░░░░░░  Percentage%
```

**Accessibility:**

- `accessibilityLabel`: "Calories: 250 out of 2000 kcal, 12 percent"
- `accessibilityRole`: "progressbar"
- `accessibilityValue`: { min: 0, max: threshold, now: value }

---

## Loading States

### Image Analysis

```
┌─────────────────────────┐
│                         │
│         (spinner)       │
│                         │
│   Analyzing image...    │
│                         │
│   This may take up to   │
│   30 seconds            │
│                         │
└─────────────────────────┘
```

### Skeleton Screen (Optional)

Show skeleton of ReportScreen while loading.

---

## Error States

### Generic Error

```
┌─────────────────────────┐
│         (!)             │
│                         │
│  Something went wrong   │
│                         │
│  [Error message here]   │
│                         │
│  ┌─────────────────┐    │
│  │   Try Again     │    │
│  └─────────────────┘    │
│                         │
│  [Back to Home]         │
└─────────────────────────┘
```

### Permission Denied

```
┌─────────────────────────┐
│         📷              │
│                         │
│  Camera Access Needed   │
│                         │
│  NutriScan needs access │
│  to your camera to scan │
│  nutrition labels.      │
│                         │
│  ┌─────────────────┐    │
│  │  Open Settings  │    │
│  └─────────────────┘    │
└─────────────────────────┘
```

---

## Animations

### Fade In (Screen transitions)

```typescript
duration: 300ms
easing: ease-in-out
```

### Progress Bar Fill

```typescript
duration: 600ms
easing: ease-out
delay: stagger 100ms per bar
```

### Button Press

```typescript
scale: 0.95
duration: 100ms
```

### Loading Spinner

```typescript
rotation: 360deg
duration: 1000ms
iteration: infinite
```

---

## Responsive Design

### Portrait (default)

- Full-width buttons
- Vertical scroll for report
- Stack all elements

### Landscape (optional)

- Two-column layout for settings
- Side-by-side camera controls

### Safe Areas

- Use `SafeAreaView` on all screens
- Account for notch/home indicator
- Minimum touch target: 44x44pt

---

## Accessibility Requirements

1. **Screen Readers**
   - All buttons have `accessibilityLabel`
   - Progress bars have `accessibilityValue`
   - Images have `accessibilityHint`

2. **Color Contrast**
   - Text: 4.5:1 minimum
   - Large text: 3:1 minimum
   - Interactive elements: 3:1 minimum

3. **Touch Targets**
   - Minimum 44x44pt
   - Adequate spacing between elements

4. **Focus Order**
   - Logical tab order
   - Focus indicators visible

5. **Reduce Motion**
   - Respect `prefers-reduced-motion`
   - Disable animations if requested

React Native Design Guide: Neon Clarity Theme
This guide provides specific implementation details for building the NutriScan AI application with the "Neon Clarity" theme in React Native.

1. Color Palette
Define these colors in a central theme.js or constants.js file for easy access throughout the application.

export const colors = {
  background: '#111827', // Deep Space Blue
  accentGradient: ['#34D399', '#A3E635'], // Vibrant Teal to Lime Green
  warning: '#F59E0B', // Amber
  alert: '#EF4444', // Vibrant Red
  textPrimary: '#F9FAFB', // Ghost White
  textSecondary: '#9CA3AF', // Cool Gray
  cardBackground: 'rgba(31, 41, 55, 0.5)', // Translucent Dark Gray
  cardBorder: 'rgba(249, 250, 251, 0.2)', // Translucent White
  progressBarTrack: '#374151', // Semi-transparent dark gray
};

2. Typography
Use the Inter font family. If not available, fall back to the system default sans-serif font. Define a typography object in your stylesheet.

export const typography = {
  h1: {
    fontFamily: 'Inter_700Bold', // Assumes font is loaded
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  h2: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  button: {
    fontFamily: 'Inter_500Medium',
    fontSize: 18,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
};

3. Spacing
Use a base unit of 8px for all margins, padding, and layout spacing to maintain consistency.

spacing.small: 8px

spacing.medium: 16px

spacing.large: 24px

spacing.xlarge: 32px

4. Component Styles
Buttons (TouchableOpacity)
Primary Button: Use the expo-linear-gradient library for the background.

Pressed State: Wrap the button in a Pressable component and use the style prop's function ({ pressed }) => ({ opacity: pressed ? 0.8 : 1.0, transform: [{ scale: pressed ? 0.97 : 1 }] }) to manage feedback.

// Primary Button Style
buttonPrimary: {
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  // Apply platform-specific shadows
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 5,
  elevation: 8,
},

// Gradient Component inside the TouchableOpacity
<LinearGradient colors={colors.accentGradient} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.buttonPrimary}>
  <Text style={typography.button}>Take Photo</Text>
</LinearGradient>

Nutrient Progress Bar
This is a composite component.

Container (View): Main wrapper for the component.

Label Row (View): A flexDirection: 'row' container with justifyContent: 'space-between' to hold the nutrient name and value text.

Track (View): A container with a fixed height and backgroundColor: colors.progressBarTrack.

Fill (View): An absolutely positioned or child view within the track. Its width should be a percentage calculated from (value / maxValue) * 100. The backgroundColor must change conditionally:

value > maxValue: colors.alert

value > maxValue * 0.8: colors.warning

else: colors.accentGradient[0] (or use a gradient)

// Progress Bar Track Style
progressBarTrack: {
  height: 12,
  width: '100%',
  backgroundColor: colors.progressBarTrack,
  borderRadius: 6,
  overflow: 'hidden',
},
// Progress Bar Fill Style
progressBarFill: {
  height: '100%',
  borderRadius: 6,
},

Cards / Containers (View)
To achieve the "glassmorphism" effect, a library is recommended for the blur. Use @react-native-community/blur.

If a library is not an option, simulate the effect with a semi-transparent background.

card: {
  backgroundColor: colors.cardBackground,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: colors.cardBorder,
  padding: spacing.medium,
  overflow: 'hidden', // Necessary for blur/border radius
}

// With blur library
<BlurView blurType="dark" blurAmount={10} style={styles.card}>
  {/* Content here */}
</BlurView>

Text Inputs (TextInput)
Style inputs to match the dark, clean theme.

input: {
  backgroundColor: colors.progressBarTrack, // Reuse track color
  color: colors.textPrimary,
  padding: 16,
  borderRadius: 12,
  fontSize: 16,
  borderWidth: 1,
  borderColor: colors.cardBorder, // Subtle border
}

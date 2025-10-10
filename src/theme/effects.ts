/**
 * Visual effects configuration for Neon Clarity theme
 * Glassmorphism and blur effects
 */

import { colors } from './colors';
import { borderRadius } from './spacing';

/**
 * Glassmorphism effect configuration
 * Used with BlurView from @react-native-community/blur
 */
export const glassEffect = {
  blurType: 'dark' as const,
  blurAmount: 10,
  reducedTransparencyFallbackColor: colors.surfaceDark,
};

/**
 * Glass card style (to be used with BlurView)
 */
export const glassCard = {
  backgroundColor: colors.surface,
  borderRadius: borderRadius.xl,
  borderWidth: 1,
  borderColor: colors.border,
  overflow: 'hidden' as const,
};

/**
 * Glass button style (to be used with BlurView)
 */
export const glassButton = {
  backgroundColor: colors.surface,
  borderRadius: borderRadius.lg,
  borderWidth: 1,
  borderColor: colors.border,
  overflow: 'hidden' as const,
};

/**
 * Neon glow effect (for focused/active states)
 */
export const neonGlow = {
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  elevation: 10,
};

/**
 * Gradient overlay for images
 */
export const gradientOverlay = {
  colors: ['rgba(17, 24, 39, 0)', 'rgba(17, 24, 39, 0.8)'] as const,
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
};

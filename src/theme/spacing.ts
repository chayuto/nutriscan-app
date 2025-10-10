/**
 * Neon Clarity Theme - Spacing & Layout
 * 8px grid system
 */

// Base unit: 8px
export const spacing = {
  xs: 4, // 0.5 units
  sm: 8, // 1 unit
  md: 16, // 2 units
  lg: 24, // 3 units
  xl: 32, // 4 units
  xxl: 48, // 6 units
  xxxl: 64, // 8 units
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const layout = {
  screenPadding: spacing.lg,
  cardPadding: spacing.md,
  buttonHeight: 56,
  inputHeight: 52,
  iconSize: 24,
  iconSizeLarge: 32,
} as const;

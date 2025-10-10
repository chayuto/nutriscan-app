/**
 * Neon Clarity Theme - Color Palette
 * Dark mode with glassmorphism effects
 */

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
} as const;

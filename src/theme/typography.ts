/**
 * Neon Clarity Theme - Typography
 * Inter Font Family
 */

import { colors } from './colors';

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
} as const;

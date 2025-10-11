/**
 * GlassCard Component
 *
 * A glassmorphism-style card with blur effect and translucent background.
 * Note: BlurView disabled for Expo Go compatibility. Use EAS Dev Build for blur effect.
 *
 * @example
 * ```tsx
 * <GlassCard>
 *   <Text>Content here</Text>
 * </GlassCard>
 * ```
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
// import { BlurView } from '@react-native-community/blur'; // Disabled for Expo Go
import { colors, spacing, borderRadius } from '@/theme';

export interface GlassCardProps {
  /** Child components to render inside the card */
  children: React.ReactNode;
  /** Custom container style */
  style?: ViewStyle;
  /** Blur intensity (0-100). Default: 10 - Currently unused in Expo Go */
  blurAmount?: number;
  /** Test ID for testing */
  testID?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  blurAmount: _blurAmount = 10, // Unused in Expo Go, prefixed with _ to silence linting
  testID = 'glass-card',
}) => {
  // Using regular View instead of BlurView for Expo Go compatibility
  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceDark, // Solid color instead of translucent for Expo Go
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.md,
  },
});

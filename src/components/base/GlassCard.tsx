/**
 * GlassCard Component
 *
 * A glassmorphism-style card with blur effect and translucent background.
 * Uses BlurView for the frosted glass effect on iOS/Android.
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
import { BlurView } from '@react-native-community/blur';
import { colors, spacing, borderRadius } from '@/theme';

export interface GlassCardProps {
  /** Child components to render inside the card */
  children: React.ReactNode;
  /** Custom container style */
  style?: ViewStyle;
  /** Blur intensity (0-100). Default: 10 */
  blurAmount?: number;
  /** Test ID for testing */
  testID?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  blurAmount = 10,
  testID = 'glass-card',
}) => {
  return (
    <BlurView
      blurType="dark"
      blurAmount={blurAmount}
      reducedTransparencyFallbackColor={colors.surfaceDark}
      style={[styles.container, style]}
      testID={testID}
    >
      <View style={styles.content}>{children}</View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.md,
  },
});

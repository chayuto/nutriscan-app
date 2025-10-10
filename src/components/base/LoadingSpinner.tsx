/**
 * LoadingSpinner Component
 *
 * An animated loading indicator with neon gradient colors.
 * Uses ActivityIndicator with customizable size and color.
 *
 * @example
 * ```tsx
 * <LoadingSpinner />
 * <LoadingSpinner size="large" message="Loading..." />
 * ```
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '@/theme';

export interface LoadingSpinnerProps {
  /** Size of the spinner. Default: 'large' */
  size?: 'small' | 'large';
  /** Optional message to display below spinner */
  message?: string;
  /** Custom color for the spinner. Default: colors.primary */
  color?: string;
  /** Custom container style */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  message,
  color = colors.primary,
  style,
  testID = 'loading-spinner',
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <ActivityIndicator size={size} color={color} testID={`${testID}-indicator`} />
      {message && (
        <Text style={styles.message} testID={`${testID}-message`}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

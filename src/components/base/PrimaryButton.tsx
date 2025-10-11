/**
 * PrimaryButton Component
 * Gradient button with press animation and loading state
 * Part of the Neon Clarity design system
 */

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  PressableStateCallbackType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, shadows, borderRadius } from '@/theme';

export interface PrimaryButtonProps {
  /** Button text content */
  children: string;
  /** Press handler */
  onPress: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state (shows spinner, disables interaction) */
  loading?: boolean;
  /** Custom container style */
  style?: ViewStyle;
  /** Custom text style */
  textStyle?: TextStyle;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Primary button with gradient background and press animation
 *
 * @example
 * ```tsx
 * <PrimaryButton onPress={handleSubmit}>
 *   Analyze Label
 * </PrimaryButton>
 *
 * <PrimaryButton onPress={handleSave} loading={isSaving}>
 *   Save Changes
 * </PrimaryButton>
 * ```
 */
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const isDisabled = disabled || loading;

  const getPressableStyle = ({ pressed }: PressableStateCallbackType): ViewStyle => ({
    opacity: pressed ? 0.8 : 1,
    transform: [{ scale: pressed ? 0.97 : 1 }],
  });

  const gradientColors = isDisabled
    ? ([colors.disabled, colors.disabled] as const)
    : colors.primaryGradient;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [getPressableStyle({ pressed }), style]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || children}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={colors.text}
            testID={testID ? `${testID}-spinner` : 'button-spinner'}
          />
        ) : (
          <Text style={[styles.text, textStyle]}>{children}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  gradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // Touch target minimum
    ...shadows.md,
  },
  text: {
    ...typography.button,
    color: colors.text,
  },
});

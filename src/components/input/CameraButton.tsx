import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { LoadingSpinner } from '@/components/base/LoadingSpinner';

export interface CameraButtonProps {
  mode: 'camera' | 'gallery';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  error?: string | null;
  style?: object;
  testID?: string;
}

/**
 * CameraButton - Dual-mode camera/gallery picker button
 *
 * Features:
 * - Two modes: camera (takePhoto) or gallery (pickImage)
 * - Loading states during capture/selection
 * - Disabled state
 * - Error display
 * - Press animation
 * - Custom styling support
 */
export const CameraButton: React.FC<CameraButtonProps> = ({
  mode,
  onPress,
  loading = false,
  disabled = false,
  error = null,
  style,
  testID = 'camera-button',
}) => {
  const iconName = mode === 'camera' ? 'camera' : 'image';
  const label = mode === 'camera' ? 'Take Photo' : 'Choose from Gallery';
  const isDisabled = disabled || loading;

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.button,
          isDisabled && styles.buttonDisabled,
          {
            opacity: pressed && !isDisabled ? 0.8 : 1,
            transform: [{ scale: pressed && !isDisabled ? 0.97 : 1 }],
          },
        ]}
        testID={`${testID}-pressable`}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={
          mode === 'camera'
            ? 'Opens camera to take a photo of nutrition label'
            : 'Opens gallery to select a photo'
        }
        accessibilityState={{
          disabled: isDisabled,
          busy: loading,
        }}
      >
        <View style={styles.content}>
          {loading ? (
            <View style={styles.spinnerContainer}>
              <LoadingSpinner size="small" testID={`${testID}-spinner`} />
            </View>
          ) : (
            <Ionicons
              name={iconName}
              size={24}
              color={isDisabled ? colors.textMuted : colors.text}
              testID={`${testID}-icon`}
            />
          )}
          <Text
            style={[styles.label, isDisabled && styles.labelDisabled]}
            testID={`${testID}-label`}
          >
            {label}
          </Text>
        </View>
      </Pressable>

      {error && (
        <View style={styles.errorContainer} testID={`${testID}-error`}>
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  spinnerContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.button,
    fontSize: 16,
  },
  labelDisabled: {
    color: colors.textMuted,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
});

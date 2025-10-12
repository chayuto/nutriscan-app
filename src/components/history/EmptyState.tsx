/**
 * EmptyState Component
 *
 * Displays friendly empty state messages with:
 * - Icon
 * - Title
 * - Message
 * - Optional action button
 *
 * Part of Sprint 4: History & Favorites feature
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PrimaryButton } from '@/components/base/PrimaryButton';
import { colors, spacing, typography } from '@/theme';

export interface EmptyStateProps {
  /** Emoji or icon to display */
  icon?: string;

  /** Title text */
  title: string;

  /** Message text */
  message: string;

  /** Optional action button label */
  actionLabel?: string;

  /** Optional action button callback */
  onAction?: () => void;

  /** Test ID for testing */
  testID?: string;
}

/**
 * EmptyState - Display when no data available
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="📋"
 *   title="No Scans Yet"
 *   message="Start scanning to build your history"
 *   actionLabel="Scan Now"
 *   onAction={() => navigate('Camera')}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = memo(
  ({ icon = '📋', title, message, actionLabel, onAction, testID }) => {
    return (
      <View style={styles.container} testID={testID}>
        {/* Icon */}
        {icon && <Text style={styles.icon}>{icon}</Text>}

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Message */}
        <Text style={styles.message}>{message}</Text>

        {/* Action Button */}
        {actionLabel && onAction && (
          <View style={styles.actionContainer}>
            <PrimaryButton onPress={onAction} testID={`${testID}-action-button`}>
              {actionLabel}
            </PrimaryButton>
          </View>
        )}
      </View>
    );
  }
);

EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: spacing.lg,
  },
  actionContainer: {
    marginTop: spacing.md,
    width: '100%',
    maxWidth: 200,
  },
});

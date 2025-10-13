/**
 * HistoryListItem Component
 *
 * Displays a single scan history item with:
 * - Product name and brand
 * - Thumbnail image
 * - Key nutrition values
 * - Favorite button
 * - Timestamp
 * - Swipe actions
 *
 * Part of Sprint 4: History & Favorites feature
 */

import React, { memo } from 'react';
import { View, Text, Image, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import type { ScanHistoryItem } from '@/types/history.types';

export interface HistoryListItemProps {
  /** Scan history item to display */
  item: ScanHistoryItem;

  /** Callback when item is pressed */
  onPress?: (item: ScanHistoryItem) => void;

  /** Callback when favorite button is pressed */
  onToggleFavorite?: (id: string) => void;

  /** Callback when delete is triggered */
  onDelete?: (id: string) => void;

  /** Whether favorite toggle is in progress */
  isTogglingFavorite?: boolean;

  /** Whether delete is in progress */
  isDeleting?: boolean;

  /** Whether to show delete button */
  showDelete?: boolean;

  /** Test ID for testing */
  testID?: string;
}

/**
 * HistoryListItem - Display single scan in list
 *
 * @example
 * ```tsx
 * <HistoryListItem
 *   item={scan}
 *   onPress={(item) => navigation.navigate('ScanDetail', { id: item.id })}
 *   onToggleFavorite={(id) => toggleFavorite(id)}
 *   onDelete={(id) => deleteScan(id)}
 * />
 * ```
 */
export const HistoryListItem: React.FC<HistoryListItemProps> = memo(
  ({
    item,
    onPress,
    onToggleFavorite,
    onDelete,
    isTogglingFavorite = false,
    isDeleting = false,
    showDelete = true,
    testID,
  }) => {
    const formatDate = (timestamp: number): string => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    };

    const handlePress = () => {
      if (onPress && !isDeleting) {
        onPress(item);
      }
    };

    const handleFavoritePress = () => {
      if (onToggleFavorite && !isTogglingFavorite && !isDeleting) {
        onToggleFavorite(item.id);
      }
    };

    const handleDeletePress = () => {
      if (onDelete && !isDeleting) {
        onDelete(item.id);
      }
    };

    const getCalorieColor = (): string => {
      const calories = item.nutritionData.calories;
      if (!calories) return colors.textSecondary;
      if (calories < 200) return colors.safe;
      if (calories < 400) return colors.warning;
      return colors.error;
    };

    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.containerPressed,
          isDeleting && styles.containerDeleting,
        ]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${item.productName || 'Scan'}, ${formatDate(item.timestamp)}`}
        accessibilityHint="Double tap to view details"
        accessibilityState={{ disabled: isDeleting }}
        testID={testID}
      >
        <View style={styles.blurContainer}>
          <View style={styles.content}>
            {/* Thumbnail */}
            <View style={styles.thumbnailContainer}>
              {item.imageUri ? (
                <Image
                  source={{ uri: item.imageUri }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                  accessible={true}
                  accessibilityLabel="Product photo"
                />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Text style={styles.thumbnailPlaceholderText}>IMG</Text>
                </View>
              )}
            </View>

            {/* Info */}
            <View style={styles.info}>
              {/* Product Name */}
              <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
                {item.productName || 'Unnamed Product'}
              </Text>

              {/* Brand Name */}
              {item.brandName && (
                <Text style={styles.brandName} numberOfLines={1} ellipsizeMode="tail">
                  {item.brandName}
                </Text>
              )}

              {/* Nutrition Summary */}
              <View style={styles.nutritionRow}>
                <Text style={[styles.calorieText, { color: getCalorieColor() }]}>
                  {item.nutritionData.calories
                    ? `${Math.round(item.nutritionData.calories)} cal`
                    : 'N/A'}
                </Text>
                <Text style={styles.nutritionSeparator}>•</Text>
                <Text style={styles.nutritionText}>
                  {item.nutritionData.protein
                    ? `${item.nutritionData.protein}g protein`
                    : 'No protein data'}
                </Text>
              </View>

              {/* Timestamp and Tags */}
              <View style={styles.metaRow}>
                <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
                {item.tags.length > 0 && (
                  <>
                    <Text style={styles.metaSeparator}>•</Text>
                    <Text style={styles.tagText} numberOfLines={1}>
                      {item.tags.join(', ')}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {/* Favorite Button */}
              <Pressable
                onPress={handleFavoritePress}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}
                disabled={isTogglingFavorite || isDeleting}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                testID={`${testID}-favorite-button`}
              >
                {isTogglingFavorite ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.favoriteIcon}>{item.isFavorite ? '★' : '☆'}</Text>
                )}
              </Pressable>

              {/* Delete Button */}
              {showDelete && (
                <Pressable
                  onPress={handleDeletePress}
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.deleteButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  disabled={isDeleting}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Delete scan"
                  testID={`${testID}-delete-button`}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <Text style={styles.deleteIcon}>X</Text>
                  )}
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    );
  }
);

HistoryListItem.displayName = 'HistoryListItem';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  containerPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  containerDeleting: {
    opacity: 0.5,
  },
  blurContainer: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
  },
  content: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
  },
  thumbnailContainer: {
    marginRight: spacing.md,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceDark,
  },
  thumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPlaceholderText: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    ...typography.bodyLarge,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  brandName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  calorieText: {
    ...typography.caption,
    fontWeight: '600',
  },
  nutritionSeparator: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.xs,
  },
  nutritionText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metaSeparator: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.xs,
  },
  tagText: {
    ...typography.caption,
    color: colors.primary,
    flex: 1,
  },
  actions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.error,
  },
  favoriteIcon: {
    fontSize: 20,
  },
  deleteIcon: {
    fontSize: 18,
  },
});

/**
 * HistoryList Component
 *
 * FlatList wrapper for displaying scan history with:
 * - Pull-to-refresh
 * - Empty state
 * - Loading state
 * - Optimized rendering
 * - Swipe actions
 *
 * Part of Sprint 4: History & Favorites feature
 */

import React, { memo, useCallback } from 'react';
import { FlatList, RefreshControl, View, StyleSheet, ListRenderItemInfo } from 'react-native';
import { colors, spacing } from '@/theme';
import { HistoryListItem } from './HistoryListItem';
import { EmptyState } from './EmptyState';
import type { ScanHistoryItem } from '@/types/history.types';

export interface HistoryListProps {
  /** Array of scan history items to display */
  items: ScanHistoryItem[];

  /** Whether data is being loaded */
  isLoading?: boolean;

  /** Whether a refresh is in progress */
  isRefreshing?: boolean;

  /** Callback when pull-to-refresh is triggered */
  onRefresh?: () => void;

  /** Callback when an item is pressed */
  onItemPress?: (item: ScanHistoryItem) => void;

  /** Callback when favorite is toggled */
  onToggleFavorite?: (id: string) => void;

  /** Callback when item is deleted */
  onDeleteItem?: (id: string) => void;

  /** ID of item currently being toggled */
  togglingItemId?: string | null;

  /** ID of item currently being deleted */
  deletingItemId?: string | null;

  /** Whether to show delete buttons */
  showDelete?: boolean;

  /** Empty state configuration */
  emptyState?: {
    icon?: string;
    title?: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
  };

  /** Test ID for testing */
  testID?: string;
}

/**
 * HistoryList - Optimized FlatList for scan history
 *
 * Features:
 * - Pull-to-refresh
 * - Memoized items
 * - Empty state
 * - Loading state
 * - Accessibility support
 *
 * @example
 * ```tsx
 * <HistoryList
 *   items={historyItems}
 *   isRefreshing={isLoading}
 *   onRefresh={refresh}
 *   onItemPress={(item) => navigate('Detail', { id: item.id })}
 *   onToggleFavorite={(id) => toggleFavorite(id)}
 *   onDeleteItem={(id) => deleteItem(id)}
 * />
 * ```
 */
export const HistoryList: React.FC<HistoryListProps> = memo(
  ({
    items,
    isLoading = false,
    isRefreshing = false,
    onRefresh,
    onItemPress,
    onToggleFavorite,
    onDeleteItem,
    togglingItemId = null,
    deletingItemId = null,
    showDelete = true,
    emptyState,
    testID,
  }) => {
    /**
     * Render individual list item
     * Memoized with useCallback for performance
     */
    const renderItem = useCallback(
      ({ item }: ListRenderItemInfo<ScanHistoryItem>) => (
        <HistoryListItem
          item={item}
          onPress={onItemPress}
          onToggleFavorite={onToggleFavorite}
          onDelete={onDeleteItem}
          isTogglingFavorite={togglingItemId === item.id}
          isDeleting={deletingItemId === item.id}
          showDelete={showDelete}
          testID={`${testID}-item-${item.id}`}
        />
      ),
      [
        onItemPress,
        onToggleFavorite,
        onDeleteItem,
        togglingItemId,
        deletingItemId,
        showDelete,
        testID,
      ]
    );

    /**
     * Extract unique key for each item
     */
    const keyExtractor = useCallback((item: ScanHistoryItem) => item.id, []);

    /**
     * Render empty state when no items
     */
    const renderEmptyComponent = useCallback(() => {
      if (isLoading) return null;

      return (
        <EmptyState
          icon={emptyState?.icon || '📋'}
          title={emptyState?.title || 'No Scans Yet'}
          message={emptyState?.message || 'Start scanning nutrition labels to build your history.'}
          actionLabel={emptyState?.actionLabel}
          onAction={emptyState?.onAction}
          testID={`${testID}-empty-state`}
        />
      );
    }, [isLoading, emptyState, testID]);

    /**
     * Separator between items
     */
    const ItemSeparatorComponent = useCallback(() => <View style={styles.separator} />, []);

    /**
     * Header spacing
     */
    const ListHeaderComponent = useCallback(() => <View style={styles.header} />, []);

    /**
     * Footer spacing
     */
    const ListFooterComponent = useCallback(() => <View style={styles.footer} />, []);

    return (
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderEmptyComponent}
        ItemSeparatorComponent={ItemSeparatorComponent}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.surfaceDark}
            />
          ) : undefined
        }
        contentContainerStyle={[
          styles.contentContainer,
          items.length === 0 && styles.contentContainerEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        updateCellsBatchingPeriod={50}
        accessible={true}
        accessibilityRole="list"
        accessibilityLabel="Scan history list"
        testID={testID}
      />
    );
  }
);

HistoryList.displayName = 'HistoryList';

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
  contentContainerEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  separator: {
    height: 0, // No visual separator, HistoryListItem has its own margin
  },
  header: {
    height: spacing.sm,
  },
  footer: {
    height: spacing.xxl,
  },
});

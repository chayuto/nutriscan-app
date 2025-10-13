/**
 * HistoryStats Component
 *
 * Displays compact scan history statistics:
 * - Total scans count
 * - Favorites count
 *
 * Simplified design to save screen space while showing essential metrics.
 *
 * Part of Sprint 4: History & Favorites feature
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import type { HistoryStats as HistoryStatsType } from '@/types/history.types';

export interface HistoryStatsProps {
  /** Statistics data */
  stats: HistoryStatsType;

  /** Whether data is loading */
  isLoading?: boolean;

  /** Test ID for testing */
  testID?: string;
}

/**
 * HistoryStats - Display statistics card
 *
 * @example
 * ```tsx
 * <HistoryStats
 *   stats={historyStats}
 *   isLoading={isLoading}
 * />
 * ```
 */
export const HistoryStats: React.FC<HistoryStatsProps> = memo(
  ({ stats, isLoading = false, testID }) => {
    if (isLoading) {
      return (
        <View style={styles.container} testID={testID}>
          <View style={styles.blurContainer}>
            <Text style={styles.loadingText}>Loading stats...</Text>
          </View>
        </View>
      );
    }

    const formatNumber = (num: number): string => {
      if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}k`;
      }
      return num.toString();
    };

    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.blurContainer}>
          <View style={styles.content}>
            {/* Compact Stats Row */}
            <View style={styles.statsRow}>
              {/* Total Scans */}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatNumber(stats.totalScans)}</Text>
                <Text style={styles.statLabel}>Total Scans</Text>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Favorites */}
              <View style={styles.statItem}>
                <Text style={[styles.statValue, styles.statValueAccent]}>
                  {formatNumber(stats.favoritesCount)}
                </Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }
);

HistoryStats.displayName = 'HistoryStats';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  blurContainer: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
  },
  content: {
    padding: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    fontSize: 28,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  statValueAccent: {
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
});

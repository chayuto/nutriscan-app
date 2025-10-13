/**
 * HistoryStats Component
 *
 * Displays scan history statistics with:
 * - Total scans
 * - Favorites count
 * - Weekly/monthly activity
 * - Current streak
 * - Average calories
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
            {/* Title */}
            <Text style={styles.title}>Your Statistics</Text>

            {/* Stats Grid */}
            <View style={styles.grid}>
              {/* Total Scans */}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatNumber(stats.totalScans)}</Text>
                <Text style={styles.statLabel}>Total Scans</Text>
              </View>

              {/* Favorites */}
              <View style={styles.statItem}>
                <Text style={[styles.statValue, styles.statValueAccent]}>
                  {formatNumber(stats.favoritesCount)}
                </Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>

              {/* This Week */}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatNumber(stats.scansThisWeek)}</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>

              {/* This Month */}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatNumber(stats.scansThisMonth)}</Text>
                <Text style={styles.statLabel}>This Month</Text>
              </View>
            </View>

            {/* Secondary Stats */}
            <View style={styles.secondaryStats}>
              {/* Streak */}
              {stats.currentStreak > 0 && (
                <View style={styles.secondaryStatItem}>
                  <Text style={styles.streakIcon}>#</Text>
                  <Text style={styles.secondaryStatText}>{stats.currentStreak} day streak</Text>
                </View>
              )}

              {/* Average Calories */}
              {stats.averageCalories > 0 && (
                <View style={styles.secondaryStatItem}>
                  <Text style={styles.secondaryStatText}>
                    Avg: {Math.round(stats.averageCalories)} cal
                  </Text>
                </View>
              )}

              {/* Most Scanned */}
              {stats.mostScannedProduct && (
                <View style={styles.secondaryStatItem}>
                  <Text style={styles.secondaryStatText} numberOfLines={1}>
                    Most: {stats.mostScannedProduct}
                  </Text>
                </View>
              )}
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
    padding: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  statItem: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statValueAccent: {
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  secondaryStats: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  secondaryStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakIcon: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  secondaryStatText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
});

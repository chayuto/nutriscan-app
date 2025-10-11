import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { borderRadius } from '@/theme/spacing';

export interface NutrientProgressBarProps {
  label: string;
  value: number | null; // Value per 100g or 100ml (Australian standard)
  threshold: number; // Daily limit
  unit: string;
  testID?: string;
}

/**
 * NutrientProgressBar - Animated progress bar with color-coded zones
 *
 * Displays nutrient values per 100g/100ml (Australian nutrition label standard)
 * compared against daily thresholds.
 *
 * Features:
 * - Animated width transitions (600ms)
 * - Color zones: safe (green) < 50%, caution (yellow) 50-80%, danger (red) >= 80%
 * - Gradient fills for safe zone
 * - Warning badge when exceeded (> 100%)
 * - Full accessibility with progress values
 */
export const NutrientProgressBar: React.FC<NutrientProgressBarProps> = ({
  label,
  value,
  threshold,
  unit,
  testID = 'nutrient-progress-bar',
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  // Calculate percentage (capped at 100 for display)
  const percentage = value !== null ? Math.min((value / threshold) * 100, 100) : 0;
  const actualPercentage = value !== null ? (value / threshold) * 100 : 0;
  const exceeded = value !== null && value > threshold;

  // Determine color based on percentage
  const getBarColor = (): 'safe' | 'caution' | 'danger' => {
    if (exceeded) return 'danger';
    if (actualPercentage >= 80) return 'danger';
    if (actualPercentage >= 50) return 'caution';
    return 'safe';
  };

  const barColor = getBarColor();

  // Map color to theme colors
  const colorMap: Record<'safe' | 'caution' | 'danger', [string, string]> = {
    safe: [colors.primary, colors.primaryLight],
    caution: [colors.warning, colors.warning],
    danger: [colors.error, colors.error],
  };

  const gradientColors = colorMap[barColor];

  // Animate width when percentage changes
  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percentage,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [percentage, animatedWidth]);

  // Format value display
  const valueText = value !== null ? value.toFixed(1) : 'N/A';
  const percentageText = value !== null ? `${actualPercentage.toFixed(0)}%` : '0%';

  return (
    <View style={styles.container} testID={testID}>
      {/* Header row with label and warning badge */}
      <View style={styles.header}>
        <Text style={[styles.label, exceeded && styles.labelExceeded]} testID={`${testID}-label`}>
          {label}
        </Text>
        {exceeded && (
          <View style={styles.warningBadge} testID={`${testID}-warning-badge`}>
            <Text style={styles.warningText}>⚠️ OVER</Text>
          </View>
        )}
      </View>

      {/* Value row - per 100g/100ml */}
      <Text style={styles.valueText} testID={`${testID}-value`}>
        {valueText} / {threshold} {unit} per 100g/100ml
      </Text>

      {/* Progress bar */}
      <View
        style={styles.progressTrack}
        testID={`${testID}-track`}
        accessible={true}
        accessibilityRole="progressbar"
        accessibilityLabel={`${label}: ${valueText} out of ${threshold} ${unit}`}
        accessibilityValue={{
          min: 0,
          max: threshold,
          now: value || 0,
        }}
      >
        <Animated.View
          style={[
            styles.progressFillContainer,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
          testID={`${testID}-fill`}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressFill}
          />
        </Animated.View>
      </View>

      {/* Percentage text */}
      <Text style={styles.percentageText} testID={`${testID}-percentage`}>
        {percentageText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
  },
  labelExceeded: {
    color: colors.error,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  valueText: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  progressTrack: {
    height: 12,
    backgroundColor: colors.progressTrack,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressFillContainer: {
    height: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  percentageText: {
    ...typography.caption,
    textAlign: 'right',
    marginTop: 4,
  },
});

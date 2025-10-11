import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { GlassCard } from '@/components/base/GlassCard';
import { NutrientProgressBar } from '@/components/nutrition/NutrientProgressBar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { NutritionData, NutritionThresholds } from '@/types/nutrition.types';

export interface NutritionCardProps {
  nutritionData: NutritionData;
  thresholds: NutritionThresholds;
  testID?: string;
}

/**
 * NutritionCard - Complete nutrition display card
 *
 * Displays all 8 key nutrients with progress bars compared to daily thresholds.
 * All values are per 100g/100ml (Australian nutrition label standard).
 *
 * Features:
 * - Glass card container with blur effect
 * - 8 NutrientProgressBar instances
 * - Warning summary for exceeded nutrients
 * - Title and subtitle
 * - Scrollable content
 */
export const NutritionCard: React.FC<NutritionCardProps> = ({
  nutritionData,
  thresholds,
  testID = 'nutrition-card',
}) => {
  // Calculate exceeded nutrients
  const exceededNutrients: string[] = [];

  if (nutritionData.calories !== null && nutritionData.calories > thresholds.calories) {
    exceededNutrients.push('Calories');
  }
  if (nutritionData.protein !== null && nutritionData.protein > thresholds.protein) {
    exceededNutrients.push('Protein');
  }
  if (nutritionData.fat !== null && nutritionData.fat > thresholds.fat) {
    exceededNutrients.push('Fat');
  }
  if (nutritionData.saturatedFat !== null && nutritionData.saturatedFat > thresholds.saturatedFat) {
    exceededNutrients.push('Saturated Fat');
  }
  if (
    nutritionData.carbohydrates !== null &&
    nutritionData.carbohydrates > thresholds.carbohydrates
  ) {
    exceededNutrients.push('Carbohydrates');
  }
  if (nutritionData.sugars !== null && nutritionData.sugars > thresholds.sugars) {
    exceededNutrients.push('Sugars');
  }
  if (nutritionData.fiber !== null && nutritionData.fiber > thresholds.fiber) {
    exceededNutrients.push('Fiber');
  }
  if (nutritionData.sodium !== null && nutritionData.sodium > thresholds.sodium) {
    exceededNutrients.push('Sodium');
  }

  const hasExceededNutrients = exceededNutrients.length > 0;

  return (
    <GlassCard style={styles.card} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title} testID={`${testID}-title`}>
          Nutrition Report
        </Text>
        <Text style={styles.subtitle} testID={`${testID}-subtitle`}>
          Per 100g/100ml
        </Text>
      </View>

      {hasExceededNutrients && (
        <View style={styles.warningContainer} testID={`${testID}-warning`}>
          <Text style={styles.warningTitle}>Warning</Text>
          <Text style={styles.warningText}>
            {exceededNutrients.length} nutrient{exceededNutrients.length > 1 ? 's' : ''} exceed
            {exceededNutrients.length === 1 ? 's' : ''} your daily limit
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID={`${testID}-scroll`}
      >
        <NutrientProgressBar
          label="Calories"
          value={nutritionData.calories}
          threshold={thresholds.calories}
          unit="kcal"
          testID={`${testID}-calories`}
        />

        <NutrientProgressBar
          label="Protein"
          value={nutritionData.protein}
          threshold={thresholds.protein}
          unit="g"
          testID={`${testID}-protein`}
        />

        <NutrientProgressBar
          label="Fat"
          value={nutritionData.fat}
          threshold={thresholds.fat}
          unit="g"
          testID={`${testID}-fat`}
        />

        <NutrientProgressBar
          label="Saturated Fat"
          value={nutritionData.saturatedFat}
          threshold={thresholds.saturatedFat}
          unit="g"
          testID={`${testID}-saturated-fat`}
        />

        <NutrientProgressBar
          label="Carbohydrates"
          value={nutritionData.carbohydrates}
          threshold={thresholds.carbohydrates}
          unit="g"
          testID={`${testID}-carbohydrates`}
        />

        <NutrientProgressBar
          label="Sugars"
          value={nutritionData.sugars}
          threshold={thresholds.sugars}
          unit="g"
          testID={`${testID}-sugars`}
        />

        <NutrientProgressBar
          label="Fiber"
          value={nutritionData.fiber}
          threshold={thresholds.fiber}
          unit="g"
          testID={`${testID}-fiber`}
        />

        <NutrientProgressBar
          label="Sodium"
          value={nutritionData.sodium}
          threshold={thresholds.sodium}
          unit="mg"
          testID={`${testID}-sodium`}
        />
      </ScrollView>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    // Removed maxHeight to allow card to grow with content
  },
  header: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  warningContainer: {
    backgroundColor: `${colors.error}20`,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error,
  },
  warningTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.error,
    marginBottom: spacing.xs,
  },
  warningText: {
    ...typography.caption,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl, // 64px padding to ensure last item (Sodium) is fully visible
  },
});

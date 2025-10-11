import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image } from 'react-native';
import { NutritionCard } from '@/components/nutrition/NutritionCard';
import { PrimaryButton } from '@/components/base/PrimaryButton';
import { useThresholds } from '@/hooks/useThresholds';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { NutritionData } from '@/types/nutrition.types';

export interface ReportScreenProps {
  nutritionData: NutritionData;
  imageUri?: string;
  onBack: () => void;
  testID?: string;
}

/**
 * ReportScreen - Display nutrition analysis results
 *
 * Features:
 * - Display nutrition data in NutritionCard
 * - Show captured image thumbnail
 * - Load user's custom thresholds
 * - Back navigation to HomeScreen
 * - Optional: Share/Save functionality
 *
 * User Flow:
 * 1. User arrives from HomeScreen after successful analysis
 * 2. View nutrition breakdown with threshold warnings
 * 3. Tap back to return to HomeScreen
 * 4. Optional: Share or save report for later
 */
export const ReportScreen: React.FC<ReportScreenProps> = ({
  nutritionData,
  imageUri,
  onBack,
  testID = 'report-screen',
}) => {
  // Load user's thresholds for comparison
  const { thresholds } = useThresholds();

  return (
    <SafeAreaView style={styles.container} testID={testID}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} testID={`${testID}-title`}>
            Nutrition Report
          </Text>
          <Text style={styles.subtitle} testID={`${testID}-subtitle`}>
            Per 100g/100ml (Australian standard)
          </Text>
        </View>

        {/* Image Preview (Optional) */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="cover"
              testID={`${testID}-image`}
            />
          </View>
        )}

        {/* Nutrition Card with Data */}
        <View style={styles.cardContainer}>
          <NutritionCard
            nutritionData={nutritionData}
            thresholds={thresholds}
            testID={`${testID}-nutrition-card`}
          />
        </View>

        {/* Info Text */}
        <Text style={styles.infoText} testID={`${testID}-info`}>
          💡 Tip: Adjust your daily thresholds in Settings to personalize warnings
        </Text>
      </ScrollView>

      {/* Fixed Footer with Back Button */}
      <View style={styles.footer}>
        <PrimaryButton onPress={onBack} testID={`${testID}-back-button`}>
          ← Back to Home
        </PrimaryButton>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceDark,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardContainer: {
    marginBottom: spacing.lg,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});

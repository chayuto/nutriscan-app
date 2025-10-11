import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { ThresholdEditor } from '@/components/input/ThresholdEditor';
import { PrimaryButton } from '@/components/base/PrimaryButton';
import { useThresholds } from '@/hooks/useThresholds';
import type { NutritionThresholds } from '@/types/nutrition.types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export interface SettingsScreenProps {
  onBack: () => void;
  testID?: string;
}

/**
 * SettingsScreen - Customize daily nutrition thresholds
 *
 * Features:
 * - Edit all 8 nutrition thresholds
 * - Auto-save with debouncing (handled by ThresholdEditor)
 * - Reset to FDA defaults
 * - Back navigation
 *
 * User Flow:
 * 1. User arrives from HomeScreen or ReportScreen
 * 2. Edit threshold values with immediate feedback
 * 3. Changes auto-save after 500ms
 * 4. Tap back to return to previous screen
 */
export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  testID = 'settings-screen',
}) => {
  // Load and manage user's thresholds
  const { thresholds, updateThreshold, resetToDefaults, isSaving } = useThresholds();

  // Handle threshold updates from editor
  const handleSave = (updatedThresholds: NutritionThresholds) => {
    // Update each threshold individually to trigger auto-save
    Object.entries(updatedThresholds).forEach(([key, value]) => {
      updateThreshold(key as keyof NutritionThresholds, value);
    });
  };

  // Determine save status for visual feedback
  const saveStatus = isSaving ? 'saving' : 'saved';

  return (
    <SafeAreaView style={styles.container} testID={testID}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} testID={`${testID}-title`}>
            ⚙️ Settings
          </Text>
          <Text style={styles.subtitle} testID={`${testID}-subtitle`}>
            Customize your daily nutrition thresholds
          </Text>
        </View>

        {/* Threshold Editor */}
        <View style={styles.editorContainer}>
          <ThresholdEditor
            thresholds={thresholds}
            onSave={handleSave}
            onReset={resetToDefaults}
            saveStatus={saveStatus}
            testID={`${testID}-threshold-editor`}
          />
        </View>

        {/* Info Text */}
        <Text style={styles.infoText} testID={`${testID}-info`}>
          💡 Changes are saved automatically. Threshold warnings help you track your daily intake
          goals.
        </Text>
      </ScrollView>

      {/* Fixed Footer with Back Button */}
      <View style={styles.footer}>
        <PrimaryButton onPress={onBack} testID={`${testID}-back-button`}>
          ← Done
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
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  editorContainer: {
    marginBottom: spacing.lg,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});

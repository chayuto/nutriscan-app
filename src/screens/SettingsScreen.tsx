import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { ThresholdEditor } from '@/components/input/ThresholdEditor';
import { PrimaryButton } from '@/components/base/PrimaryButton';
import { useThresholds } from '@/hooks/useThresholds';
import { useSettingsForm } from '@/hooks/useSettingsForm';
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
 * - Save & Close button (always visible)
 * - Reset to FDA defaults
 * - Unsaved changes warning
 *
 * User Flow:
 * 1. User arrives from HomeScreen or ReportScreen
 * 2. Edit threshold values with immediate visual feedback
 * 3. Click "Save & Close" to persist and exit
 * 4. Tap "Cancel" to exit without saving (with warning if changed)
 */
export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  testID = 'settings-screen',
}) => {
  // Load and manage user's thresholds
  const { thresholds, saveAll, resetToDefaults, isSaving } = useThresholds();

  // Use custom hook for form state management
  const {
    editedThresholds,
    hasChanges,
    handleChange,
    handleSave,
    handleReset: resetForm,
  } = useSettingsForm(thresholds, saveAll);

  const handleSaveAndClose = async () => {
    try {
      await handleSave();
      onBack();
    } catch (error) {
      console.error('[Settings] Save failed:', error);
      Alert.alert('Save Failed', 'Unable to save your settings. Please try again.');
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to exit without saving?',
        [
          {
            text: 'Keep Editing',
            style: 'cancel',
          },
          {
            text: 'Discard Changes',
            style: 'destructive',
            onPress: onBack,
          },
        ]
      );
    } else {
      onBack();
    }
  };

  const handleReset = async () => {
    await resetToDefaults();
    await resetForm();
  };

  // Placeholder for onSave (not used when hideSaveButton=true)
  const handleSaveFromEditor = async (updatedThresholds: NutritionThresholds) => {
    // This won't be called since we hide the save button
    await saveAll(updatedThresholds);
  };

  // Determine save status for visual feedback
  const saveStatus = isSaving ? 'saving' : 'idle';

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
            Settings
          </Text>
          <Text style={styles.subtitle} testID={`${testID}-subtitle`}>
            Customize your daily nutrition thresholds
          </Text>
        </View>

        {/* Threshold Editor */}
        <View style={styles.editorContainer}>
          <ThresholdEditor
            thresholds={editedThresholds}
            onChange={handleChange}
            onSave={handleSaveFromEditor}
            onReset={handleReset}
            saveStatus={saveStatus}
            hideSaveButton={true}
            testID={`${testID}-threshold-editor`}
          />
        </View>

        {/* Info Text */}
        <Text style={styles.infoText} testID={`${testID}-info`}>
          Edit your daily nutrition thresholds below. Click "Save & Close" when you're done.
        </Text>
      </ScrollView>

      {/* Fixed Footer with Action Buttons */}
      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <View style={styles.buttonHalf}>
            <PrimaryButton onPress={handleCancel} testID={`${testID}-cancel-button`}>
              Cancel
            </PrimaryButton>
          </View>
          <View style={styles.buttonHalf}>
            <PrimaryButton
              onPress={handleSaveAndClose}
              disabled={isSaving}
              testID={`${testID}-save-button`}
            >
              {isSaving ? 'Saving...' : 'Save & Close'}
            </PrimaryButton>
          </View>
        </View>
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
    paddingBottom: 150, // Large padding to ensure all inputs and buttons are fully visible
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl + spacing.lg, // 72px (48 + 24) for Android nav bar
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  buttonHalf: {
    flex: 1,
  },
});

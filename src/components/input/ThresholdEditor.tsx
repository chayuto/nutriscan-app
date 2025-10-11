import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/base/GlassCard';
import { PrimaryButton } from '@/components/base/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import type { NutritionThresholds } from '@/types/nutrition.types';

export interface ThresholdEditorProps {
  thresholds: NutritionThresholds;
  onSave: (thresholds: NutritionThresholds) => void;
  onChange?: (thresholds: NutritionThresholds) => void; // Called on every change
  onReset?: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  hideSaveButton?: boolean;
  testID?: string;
}

// Helper to convert numeric thresholds to string display values
const initDisplayValues = (
  values: NutritionThresholds
): Record<keyof NutritionThresholds, string> => {
  const display: Record<keyof NutritionThresholds, string> = {} as Record<
    keyof NutritionThresholds,
    string
  >;
  (Object.keys(values) as Array<keyof NutritionThresholds>).forEach((key) => {
    display[key] = String(values[key]);
  });
  return display;
};

interface ThresholdField {
  key: keyof NutritionThresholds;
  label: string;
  unit: string;
  icon: keyof typeof Ionicons.glyphMap;
  defaultValue: number;
}

const THRESHOLD_FIELDS: ThresholdField[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal', icon: 'flame', defaultValue: 2000 },
  { key: 'protein', label: 'Protein', unit: 'g', icon: 'fitness', defaultValue: 50 },
  { key: 'fat', label: 'Fat', unit: 'g', icon: 'water', defaultValue: 70 },
  {
    key: 'saturatedFat',
    label: 'Saturated Fat',
    unit: 'g',
    icon: 'alert-circle',
    defaultValue: 20,
  },
  { key: 'carbohydrates', label: 'Carbohydrates', unit: 'g', icon: 'nutrition', defaultValue: 275 },
  { key: 'sugars', label: 'Sugars', unit: 'g', icon: 'ice-cream', defaultValue: 50 },
  { key: 'fiber', label: 'Fiber', unit: 'g', icon: 'leaf', defaultValue: 25 },
  { key: 'sodium', label: 'Sodium', unit: 'mg', icon: 'flask', defaultValue: 2300 },
];

/**
 * ThresholdEditor - Settings form for daily nutrition limits
 *
 * Features:
 * - 8 numeric inputs with icons for each nutrient
 * - Debounced auto-save (500ms delay)
 * - Reset to defaults button
 * - Save status indicator (idle/saving/saved/error)
 * - Input validation (positive numbers only)
 * - Focus state with neon glow
 * - Scrollable content
 */
export const ThresholdEditor: React.FC<ThresholdEditorProps> = ({
  thresholds,
  onSave,
  onChange,
  onReset,
  saveStatus = 'idle',
  hideSaveButton = false,
  testID = 'threshold-editor',
}) => {
  const [localValues, setLocalValues] = useState<NutritionThresholds>(thresholds);
  const [focusedField, setFocusedField] = useState<keyof NutritionThresholds | null>(null);
  const [displayValues, setDisplayValues] = useState<Record<keyof NutritionThresholds, string>>(
    initDisplayValues(thresholds)
  );
  const onChangeRef = useRef(onChange);
  const hasLocalChanges = useRef(false);
  const isFirstRender = useRef(true); // Track first render to skip initial onChange

  // Update ref when onChange changes
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Only update local values when thresholds prop changes from external source
  // (e.g., initial load or reset from parent)
  // BUT: Don't override if user has made local changes OR is currently editing
  useEffect(() => {
    console.warn('🔍 [ThresholdEditor] Prop update effect triggered');
    console.warn('🔍 [ThresholdEditor] hasLocalChanges:', hasLocalChanges.current);
    console.warn('🔍 [ThresholdEditor] focusedField:', focusedField);
    console.warn('🔍 [ThresholdEditor] thresholds from prop:', thresholds);

    if (!hasLocalChanges.current && !focusedField) {
      console.warn('🔄 [ThresholdEditor] Updating from prop:', thresholds);
      setLocalValues(thresholds);
      // Also update display values when syncing from prop (but not during active editing)
      setDisplayValues(initDisplayValues(thresholds));
    } else {
      console.warn(
        '⏭️  [ThresholdEditor] Skipping prop update, has local changes or focused field:',
        focusedField
      );
    }
  }, [thresholds, focusedField]); // Notify parent of changes (skip first render to avoid marking as changed on mount)
  useEffect(() => {
    if (isFirstRender.current) {
      console.warn('🎬 [ThresholdEditor] First render - skipping onChange');
      isFirstRender.current = false;
      return;
    }

    console.warn('🔔 [ThresholdEditor] Local values changed:', localValues);
    if (onChangeRef.current) {
      console.warn('📤 [ThresholdEditor] Calling onChange with:', localValues);
      onChangeRef.current(localValues);
    }
  }, [localValues]);

  const handleValueChange = useCallback((key: keyof NutritionThresholds, value: string) => {
    console.warn('⌨️  [ThresholdEditor] User typing:', key, '=', value);
    hasLocalChanges.current = true; // Mark that user has made changes

    // Update display value immediately (allow empty string, partial numbers like "1.")
    setDisplayValues((prev) => {
      console.warn('📝 [ThresholdEditor] Setting display value:', key, '=', value);
      return { ...prev, [key]: value };
    });

    // Parse and update actual value
    if (value === '') {
      // User deleted everything - set to 0 temporarily (will be fixed on blur)
      console.warn('🗑️  [ThresholdEditor] Empty value, setting to 0');
      setLocalValues((prev) => ({ ...prev, [key]: 0 }));
      return;
    }

    if (value === '.') {
      // Just decimal point - keep old value for now
      console.warn('⏸️  [ThresholdEditor] Just decimal point, keeping old value');
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      console.warn('✅ [ThresholdEditor] Valid number, updating localValues:', key, '=', numValue);
      setLocalValues((prev) => ({ ...prev, [key]: numValue }));
    } else {
      console.warn('❌ [ThresholdEditor] Invalid number:', value);
    }
  }, []);

  const handleReset = useCallback(() => {
    const defaults: NutritionThresholds = {
      calories: 2000,
      protein: 50,
      fat: 70,
      saturatedFat: 20,
      carbohydrates: 275,
      sugars: 50,
      fiber: 25,
      sodium: 2300,
    };
    setLocalValues(defaults);
    setDisplayValues(initDisplayValues(defaults)); // Update display values too
    if (onReset) {
      onReset();
    } else {
      onSave(defaults);
    }
  }, [onReset, onSave]);

  const handleManualSave = useCallback(() => {
    onSave(localValues);
  }, [localValues, onSave]);

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return '✓ Saved';
      case 'error':
        return '✗ Error';
      default:
        return '';
    }
  };

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case 'saved':
        return colors.primary;
      case 'error':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <GlassCard style={styles.card} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title} testID={`${testID}-title`}>
          Daily Thresholds
        </Text>
        <Text style={styles.subtitle} testID={`${testID}-subtitle`}>
          Set your daily nutrition limits
        </Text>
        {saveStatus !== 'idle' && (
          <Text
            style={[styles.saveStatus, { color: getSaveStatusColor() }]}
            testID={`${testID}-save-status`}
          >
            {getSaveStatusText()}
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID={`${testID}-scroll`}
      >
        {THRESHOLD_FIELDS.map((field) => (
          <View key={field.key} style={styles.inputGroup} testID={`${testID}-group-${field.key}`}>
            <View style={styles.labelRow}>
              <Ionicons name={field.icon} size={20} color={colors.primary} />
              <Text style={styles.label}>{field.label}</Text>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                value={
                  displayValues[field.key] !== undefined
                    ? displayValues[field.key]
                    : String(localValues[field.key])
                }
                onChangeText={(value) => handleValueChange(field.key, value)}
                onFocus={() => setFocusedField(field.key)}
                onBlur={() => {
                  setFocusedField(null);
                  // On blur, if empty, reset to actual value or show 0
                  const currentDisplay = displayValues[field.key];
                  if (currentDisplay === '' || currentDisplay === '.') {
                    // If user left it empty, restore the numeric value
                    setDisplayValues((prev) => ({
                      ...prev,
                      [field.key]: String(localValues[field.key]),
                    }));
                  }
                }}
                keyboardType="numeric"
                returnKeyType="done"
                style={[styles.input, focusedField === field.key && styles.inputFocused]}
                testID={`${testID}-input-${field.key}`}
                accessible={true}
                accessibilityLabel={`${field.label} threshold`}
                accessibilityHint={`Enter daily limit for ${field.label.toLowerCase()} in ${field.unit}`}
              />
              <Text style={styles.unit} testID={`${testID}-unit-${field.key}`}>
                {field.unit}
              </Text>
            </View>

            <Text style={styles.defaultText} testID={`${testID}-default-${field.key}`}>
              Default: {field.defaultValue} {field.unit}
            </Text>
          </View>
        ))}

        <Pressable
          onPress={handleReset}
          style={({ pressed }) => [styles.resetButton, { opacity: pressed ? 0.7 : 1 }]}
          testID={`${testID}-reset-button`}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Reset to default values"
        >
          <Ionicons name="refresh" size={20} color={colors.primary} />
          <Text style={styles.resetText}>Reset to Defaults</Text>
        </Pressable>
      </ScrollView>

      {!hideSaveButton && (
        <PrimaryButton
          onPress={handleManualSave}
          testID={`${testID}-save-button`}
          accessibilityLabel="Save threshold changes"
        >
          Save Changes
        </PrimaryButton>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    maxHeight: '95%', // Increased to show more content
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
    marginBottom: spacing.xs,
  },
  saveStatus: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl, // Increased padding to ensure "Reset to Default" button is fully visible
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.label,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.progressTrack,
    color: colors.text,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: 18,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: 'Inter_600SemiBold',
  },
  inputFocused: {
    borderColor: colors.primary,
    ...shadows.glow,
  },
  unit: {
    ...typography.caption,
    width: 50,
    color: colors.textSecondary,
  },
  defaultText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  resetText: {
    ...typography.button,
    color: colors.primary,
    fontSize: 14,
  },
});

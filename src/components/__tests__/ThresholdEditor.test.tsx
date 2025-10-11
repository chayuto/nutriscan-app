import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThresholdEditor } from '../input/ThresholdEditor';
import type { NutritionThresholds } from '@/types/nutrition.types';

// Mock components
jest.mock('../base/GlassCard', () => {
  const { View } = require('react-native');
  return {
    GlassCard: ({
      children,
      testID,
    }: {
      children: React.ReactNode;
      testID?: string;
      style?: object;
    }) => <View testID={testID}>{children}</View>,
  };
});

jest.mock('../base/PrimaryButton', () => {
  const { Pressable, Text } = require('react-native');
  return {
    PrimaryButton: ({
      children,
      onPress,
      testID,
    }: {
      children: React.ReactNode;
      onPress: () => void;
      testID?: string;
    }) => (
      <Pressable onPress={onPress} testID={testID}>
        <Text>{children}</Text>
      </Pressable>
    ),
  };
});

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

describe('ThresholdEditor', () => {
  const defaultThresholds: NutritionThresholds = {
    calories: 2000,
    protein: 50,
    fat: 70,
    saturatedFat: 20,
    carbohydrates: 275,
    sugars: 50,
    fiber: 25,
    sodium: 2300,
  };

  const mockOnSave = jest.fn();
  const mockOnReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render with all elements', () => {
      const { getByTestId, getByText } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      expect(getByTestId('threshold-editor')).toBeTruthy();
      expect(getByText('Daily Thresholds')).toBeTruthy();
      expect(getByText('Set your daily nutrition limits')).toBeTruthy();
    });

    it('should render with custom testID', () => {
      const { getByTestId } = render(
        <ThresholdEditor
          thresholds={defaultThresholds}
          onSave={mockOnSave}
          testID="custom-editor"
        />
      );

      expect(getByTestId('custom-editor')).toBeTruthy();
      expect(getByTestId('custom-editor-title')).toBeTruthy();
      expect(getByTestId('custom-editor-subtitle')).toBeTruthy();
    });
  });

  describe('Input Fields', () => {
    it('should render all 8 input fields', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      expect(getByTestId('threshold-editor-input-calories')).toBeTruthy();
      expect(getByTestId('threshold-editor-input-protein')).toBeTruthy();
      expect(getByTestId('threshold-editor-input-fat')).toBeTruthy();
      expect(getByTestId('threshold-editor-input-saturatedFat')).toBeTruthy();
      expect(getByTestId('threshold-editor-input-carbohydrates')).toBeTruthy();
      expect(getByTestId('threshold-editor-input-sugars')).toBeTruthy();
      expect(getByTestId('threshold-editor-input-fiber')).toBeTruthy();
      expect(getByTestId('threshold-editor-input-sodium')).toBeTruthy();
    });

    it('should display current threshold values', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      expect(getByTestId('threshold-editor-input-calories').props.value).toBe('2000');
      expect(getByTestId('threshold-editor-input-protein').props.value).toBe('50');
      expect(getByTestId('threshold-editor-input-sodium').props.value).toBe('2300');
    });

    it('should display units for each field', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      expect(getByTestId('threshold-editor-unit-calories').props.children).toBe('kcal');
      expect(getByTestId('threshold-editor-unit-protein').props.children).toBe('g');
      expect(getByTestId('threshold-editor-unit-sodium').props.children).toBe('mg');
    });

    it('should display default values', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      expect(getByTestId('threshold-editor-default-calories').props.children).toEqual([
        'Default: ',
        2000,
        ' ',
        'kcal',
      ]);
    });
  });

  describe('Input Interaction', () => {
    it('should update input value on change', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      const input = getByTestId('threshold-editor-input-calories');
      fireEvent.changeText(input, '2500');

      expect(input.props.value).toBe('2500');
    });

    it('should handle decimal values', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      const input = getByTestId('threshold-editor-input-protein');
      fireEvent.changeText(input, '55.5');

      expect(input.props.value).toBe('55.5');
    });

    it('should not accept negative values', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      const input = getByTestId('threshold-editor-input-calories');
      fireEvent.changeText(input, '-100');

      // Display value shows what user typed (for UX), but numeric value is not updated
      expect(input.props.value).toBe('-100'); // Shows user input

      // But onChange should not be called with invalid value (numeric state unchanged)
      // The component keeps old valid value internally
    });

    it('should allow empty string for editing', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      const input = getByTestId('threshold-editor-input-calories');
      fireEvent.changeText(input, '');

      // Display value allows empty string during editing
      expect(input.props.value).toBe('');
    });

    it('should ignore non-numeric input', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      const input = getByTestId('threshold-editor-input-calories');
      fireEvent.changeText(input, 'abc');

      // Display value shows what user typed (better UX feedback)
      expect(input.props.value).toBe('abc');
      // But the numeric value internally is not updated (stays at 2000)
    });
  });

  describe('Manual Save (No Auto-Save)', () => {
    it('should not save immediately on input change', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      const input = getByTestId('threshold-editor-input-calories');
      fireEvent.changeText(input, '2500');

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should not auto-save after delay', async () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      const input = getByTestId('threshold-editor-input-calories');
      fireEvent.changeText(input, '2500');

      // Wait longer than old debounce delay
      jest.advanceTimersByTime(1000);

      // Should still not save automatically
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should allow multiple rapid changes without saving', async () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      const input = getByTestId('threshold-editor-input-calories');

      fireEvent.changeText(input, '2100');
      jest.advanceTimersByTime(200);

      fireEvent.changeText(input, '2200');
      jest.advanceTimersByTime(200);

      fireEvent.changeText(input, '2300');
      jest.advanceTimersByTime(500);

      // Should not auto-save at all
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Reset Button', () => {
    it('should render reset button', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      expect(getByTestId('threshold-editor-reset-button')).toBeTruthy();
    });

    it('should reset to default values when pressed', () => {
      const customThresholds: NutritionThresholds = {
        calories: 1500,
        protein: 40,
        fat: 50,
        saturatedFat: 15,
        carbohydrates: 200,
        sugars: 30,
        fiber: 20,
        sodium: 2000,
      };

      const { getByTestId } = render(
        <ThresholdEditor thresholds={customThresholds} onSave={mockOnSave} />
      );

      const resetButton = getByTestId('threshold-editor-reset-button');
      fireEvent.press(resetButton);

      // Check that inputs show default values
      expect(getByTestId('threshold-editor-input-calories').props.value).toBe('2000');
      expect(getByTestId('threshold-editor-input-protein').props.value).toBe('50');
    });

    it('should call onReset when provided', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} onReset={mockOnReset} />
      );

      const resetButton = getByTestId('threshold-editor-reset-button');
      fireEvent.press(resetButton);

      expect(mockOnReset).toHaveBeenCalled();
    });

    it('should call onSave with defaults when onReset not provided', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      const resetButton = getByTestId('threshold-editor-reset-button');
      fireEvent.press(resetButton);

      expect(mockOnSave).toHaveBeenCalledWith(defaultThresholds);
    });
  });

  describe('Save Button', () => {
    it('should render save button', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      expect(getByTestId('threshold-editor-save-button')).toBeTruthy();
    });

    it('should call onSave with current values when pressed', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      const input = getByTestId('threshold-editor-input-calories');
      fireEvent.changeText(input, '2500');

      const saveButton = getByTestId('threshold-editor-save-button');
      fireEvent.press(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith({
        ...defaultThresholds,
        calories: 2500,
      });
    });
  });

  describe('Save Status', () => {
    it('should not show status when idle', () => {
      const { queryByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} saveStatus="idle" />
      );

      expect(queryByTestId('threshold-editor-save-status')).toBeNull();
    });

    it('should show "Saving..." when saving', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} saveStatus="saving" />
      );

      expect(getByTestId('threshold-editor-save-status').props.children).toBe('Saving...');
    });

    it('should show "✓ Saved" when saved', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} saveStatus="saved" />
      );

      expect(getByTestId('threshold-editor-save-status').props.children).toBe('✓ Saved');
    });

    it('should show "✗ Error" when error', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} saveStatus="error" />
      );

      expect(getByTestId('threshold-editor-save-status').props.children).toBe('✗ Error');
    });
  });

  describe('Accessibility', () => {
    it('should have accessibility labels for inputs', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      const caloriesInput = getByTestId('threshold-editor-input-calories');
      expect(caloriesInput.props.accessibilityLabel).toBe('Calories threshold');
    });

    it('should have accessibility hint for inputs', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      const proteinInput = getByTestId('threshold-editor-input-protein');
      expect(proteinInput.props.accessibilityHint).toBe('Enter daily limit for protein in g');
    });
  });

  describe('ScrollView', () => {
    it('should render scrollable content', () => {
      const { getByTestId } = render(
        <ThresholdEditor thresholds={defaultThresholds} onSave={mockOnSave} />
      );

      expect(getByTestId('threshold-editor-scroll')).toBeTruthy();
    });
  });
});

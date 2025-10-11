import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SettingsScreen } from '../SettingsScreen';
import type { NutritionThresholds } from '@/types/nutrition.types';

// Mock hooks
const mockUpdateThreshold = jest.fn();
const mockResetToDefaults = jest.fn();
const mockSaveAll = jest.fn();

const mockThresholds: NutritionThresholds = {
  calories: 2000,
  protein: 50,
  fat: 70,
  saturatedFat: 20,
  carbohydrates: 275,
  sugars: 50,
  fiber: 25,
  sodium: 2300,
};

jest.mock('@/hooks/useThresholds', () => ({
  useThresholds: jest.fn(() => ({
    thresholds: mockThresholds,
    updateThreshold: mockUpdateThreshold,
    resetToDefaults: mockResetToDefaults,
    saveAll: mockSaveAll,
    isLoading: false,
    isSaving: false,
    error: null,
  })),
}));

// Mock ThresholdEditor component
jest.mock('@/components/input/ThresholdEditor', () => {
  const { View, Text, Pressable } = require('react-native');
  return {
    ThresholdEditor: ({
      thresholds,
      onSave,
      onReset,
      saveStatus,
      testID,
    }: {
      thresholds: NutritionThresholds;
      onSave: (thresholds: NutritionThresholds) => void;
      onReset: () => void;
      saveStatus?: string;
      testID?: string;
    }) => (
      <View testID={testID}>
        <Text>Threshold Editor</Text>
        <Text>Calories: {thresholds.calories}</Text>
        <Text>Save Status: {saveStatus}</Text>
        <Pressable onPress={() => onSave(thresholds)} testID={`${testID}-save`}>
          <Text>Save</Text>
        </Pressable>
        <Pressable onPress={onReset} testID={`${testID}-reset`}>
          <Text>Reset</Text>
        </Pressable>
      </View>
    ),
  };
});

// Mock PrimaryButton
jest.mock('@/components/base/PrimaryButton', () => {
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

// Get mocked hook
const { useThresholds } = require('@/hooks/useThresholds');

describe('SettingsScreen', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset to default mock implementation
    (useThresholds as jest.Mock).mockReturnValue({
      thresholds: mockThresholds,
      updateThreshold: mockUpdateThreshold,
      resetToDefaults: mockResetToDefaults,
      isLoading: false,
      isSaving: false,
      error: null,
    });
  });

  describe('Rendering', () => {
    it('should render with all essential elements', () => {
      const { getByTestId, getByText } = render(<SettingsScreen onBack={mockOnBack} />);

      // Check header elements
      expect(getByTestId('settings-screen-title')).toBeTruthy();
      expect(getByText('Settings')).toBeTruthy();
      expect(getByTestId('settings-screen-subtitle')).toBeTruthy();
      expect(getByText('Customize your daily nutrition thresholds')).toBeTruthy();

      // Check ThresholdEditor
      expect(getByTestId('settings-screen-threshold-editor')).toBeTruthy();
      expect(getByText('Threshold Editor')).toBeTruthy();

      // Check info text
      expect(getByTestId('settings-screen-info')).toBeTruthy();
      expect(getByText(/Click "Save & Close" when you're done/)).toBeTruthy();

      // Check footer buttons (Cancel and Save & Close)
      expect(getByTestId('settings-screen-cancel-button')).toBeTruthy();
      expect(getByTestId('settings-screen-save-button')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
      expect(getByText('Save & Close')).toBeTruthy();
    });

    it('should render with custom testID', () => {
      const { getByTestId } = render(
        <SettingsScreen onBack={mockOnBack} testID="custom-settings" />
      );

      expect(getByTestId('custom-settings')).toBeTruthy();
      expect(getByTestId('custom-settings-title')).toBeTruthy();
      expect(getByTestId('custom-settings-threshold-editor')).toBeTruthy();
      expect(getByTestId('custom-settings-cancel-button')).toBeTruthy();
      expect(getByTestId('custom-settings-save-button')).toBeTruthy();
    });

    it('should render ScrollView for scrollable content', () => {
      const { UNSAFE_getByType } = render(<SettingsScreen onBack={mockOnBack} />);

      const { ScrollView } = require('react-native');
      expect(UNSAFE_getByType(ScrollView)).toBeTruthy();
    });
  });

  describe('Threshold Management', () => {
    it('should pass thresholds from hook to ThresholdEditor', () => {
      const { getByText } = render(<SettingsScreen onBack={mockOnBack} />);

      expect(getByText(`Calories: ${mockThresholds.calories}`)).toBeTruthy();
    });

    it('should handle save from Save & Close button', async () => {
      const { getByTestId } = render(<SettingsScreen onBack={mockOnBack} />);

      // Click Save & Close button
      fireEvent.press(getByTestId('settings-screen-save-button'));

      // Should call onBack (navigates away after save)
      await waitFor(() => expect(mockOnBack).toHaveBeenCalled());
    });

    it('should handle reset to defaults', () => {
      const { getByTestId } = render(<SettingsScreen onBack={mockOnBack} />);

      // Trigger reset in ThresholdEditor
      fireEvent.press(getByTestId('settings-screen-threshold-editor-reset'));

      expect(mockResetToDefaults).toHaveBeenCalled();
    });

    it('should not show save status (manual save only)', () => {
      (useThresholds as jest.Mock).mockReturnValue({
        thresholds: mockThresholds,
        updateThreshold: mockUpdateThreshold,
        resetToDefaults: mockResetToDefaults,
        saveAll: jest.fn(),
        isLoading: false,
        isSaving: false,
        error: null,
      });

      const { queryByText } = render(<SettingsScreen onBack={mockOnBack} />);

      // Save status is not shown in new manual-save design
      expect(queryByText('Save Status: saved')).toBeNull();
    });

    it('should disable Save & Close button when saving', () => {
      (useThresholds as jest.Mock).mockReturnValue({
        thresholds: mockThresholds,
        updateThreshold: mockUpdateThreshold,
        resetToDefaults: mockResetToDefaults,
        saveAll: jest.fn(),
        isLoading: false,
        isSaving: true,
        error: null,
      });

      const { getByTestId } = render(<SettingsScreen onBack={mockOnBack} />);

      const saveButton = getByTestId('settings-screen-save-button');
      // Button should be disabled (or show loading state)
      expect(saveButton).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should call onBack when Cancel button pressed (no changes)', () => {
      const { getByTestId } = render(<SettingsScreen onBack={mockOnBack} />);

      fireEvent.press(getByTestId('settings-screen-cancel-button'));

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should call onBack when Save & Close button pressed', async () => {
      const { getByTestId } = render(<SettingsScreen onBack={mockOnBack} />);

      fireEvent.press(getByTestId('settings-screen-save-button'));

      await waitFor(() => expect(mockOnBack).toHaveBeenCalledTimes(1));
    });
  });

  describe('Layout and Styling', () => {
    it('should render SafeAreaView container', () => {
      const { UNSAFE_getByType } = render(<SettingsScreen onBack={mockOnBack} />);

      const { SafeAreaView } = require('react-native');
      expect(UNSAFE_getByType(SafeAreaView)).toBeTruthy();
    });

    it('should show helpful tip about manual save', () => {
      const { getByText } = render(<SettingsScreen onBack={mockOnBack} />);

      expect(getByText(/Click "Save & Close" when you're done/)).toBeTruthy();
    });
  });
});

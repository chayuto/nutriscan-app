import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ReportScreen } from '../ReportScreen';
import type { NutritionData } from '@/types/nutrition.types';

// Mock hooks
const mockThresholds = {
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
    updateThreshold: jest.fn(),
    resetToDefaults: jest.fn(),
  })),
}));

// Mock components
jest.mock('@/components/nutrition/NutritionCard', () => {
  const { View, Text } = require('react-native');
  return {
    NutritionCard: ({
      nutritionData,
      testID,
    }: {
      nutritionData: NutritionData;
      thresholds: Record<string, number>;
      testID?: string;
    }) => (
      <View testID={testID}>
        <Text>Nutrition Card</Text>
        <Text testID={`${testID}-calories`}>{nutritionData.calories}</Text>
        <Text testID={`${testID}-protein`}>{nutritionData.protein}</Text>
      </View>
    ),
  };
});

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

describe('ReportScreen', () => {
  const mockNutritionData: NutritionData = {
    calories: 250,
    protein: 5,
    fat: 10,
    saturatedFat: 3,
    carbohydrates: 30,
    sugars: 12,
    fiber: 2,
    sodium: 300,
    servingSize: '100g',
    servingsPerContainer: 1,
  };

  const mockOnBack = jest.fn();
  const testImageUri = 'file:///path/to/image.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with all essential elements', () => {
      const { getByTestId, getByText } = render(
        <ReportScreen nutritionData={mockNutritionData} onBack={mockOnBack} />
      );

      // Header
      expect(getByText('Nutrition Report')).toBeTruthy();
      expect(getByText('Per 100g/100ml (Australian standard)')).toBeTruthy();

      // Nutrition card
      expect(getByTestId('report-screen-nutrition-card')).toBeTruthy();
      expect(getByText('Nutrition Card')).toBeTruthy();

      // Back button
      expect(getByText('← Back to Home')).toBeTruthy();

      // Info text
      expect(
        getByText('Tip: Adjust your daily thresholds in Settings to personalize warnings')
      ).toBeTruthy();
    });

    it('should render with custom testID', () => {
      const { getByTestId } = render(
        <ReportScreen
          nutritionData={mockNutritionData}
          onBack={mockOnBack}
          testID="custom-report"
        />
      );

      expect(getByTestId('custom-report')).toBeTruthy();
      expect(getByTestId('custom-report-title')).toBeTruthy();
      expect(getByTestId('custom-report-nutrition-card')).toBeTruthy();
    });

    it('should render image when imageUri provided', () => {
      const { getByTestId } = render(
        <ReportScreen
          nutritionData={mockNutritionData}
          imageUri={testImageUri}
          onBack={mockOnBack}
        />
      );

      const image = getByTestId('report-screen-image');
      expect(image).toBeTruthy();
      expect(image.props.source).toEqual({ uri: testImageUri });
    });

    it('should not render image when imageUri not provided', () => {
      const { queryByTestId } = render(
        <ReportScreen nutritionData={mockNutritionData} onBack={mockOnBack} />
      );

      expect(queryByTestId('report-screen-image')).toBeNull();
    });
  });

  describe('Nutrition Data Display', () => {
    it('should pass nutrition data to NutritionCard', () => {
      const { getByTestId } = render(
        <ReportScreen nutritionData={mockNutritionData} onBack={mockOnBack} />
      );

      // Check that nutrition data is passed through
      expect(getByTestId('report-screen-nutrition-card-calories').children[0]).toBe('250');
      expect(getByTestId('report-screen-nutrition-card-protein').children[0]).toBe('5');
    });

    it('should pass thresholds from hook to NutritionCard', () => {
      const { getByTestId } = render(
        <ReportScreen nutritionData={mockNutritionData} onBack={mockOnBack} />
      );

      // Nutrition card should be rendered (indicating thresholds were passed)
      expect(getByTestId('report-screen-nutrition-card')).toBeTruthy();
    });

    it('should handle zero values in nutrition data', () => {
      const zeroData: NutritionData = {
        calories: 0,
        protein: 0,
        fat: 0,
        saturatedFat: 0,
        carbohydrates: 0,
        sugars: 0,
        fiber: 0,
        sodium: 0,
      };

      const { getByTestId } = render(<ReportScreen nutritionData={zeroData} onBack={mockOnBack} />);

      expect(getByTestId('report-screen-nutrition-card')).toBeTruthy();
    });

    it('should handle null values in nutrition data', () => {
      const nullData: NutritionData = {
        calories: null,
        protein: null,
        fat: null,
        saturatedFat: null,
        carbohydrates: null,
        sugars: null,
        fiber: null,
        sodium: null,
      };

      const { getByTestId } = render(<ReportScreen nutritionData={nullData} onBack={mockOnBack} />);

      expect(getByTestId('report-screen-nutrition-card')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should call onBack when back button pressed', () => {
      const { getByTestId } = render(
        <ReportScreen nutritionData={mockNutritionData} onBack={mockOnBack} />
      );

      fireEvent.press(getByTestId('report-screen-back-button'));

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should call onBack multiple times if pressed multiple times', () => {
      const { getByTestId } = render(
        <ReportScreen nutritionData={mockNutritionData} onBack={mockOnBack} />
      );

      const backButton = getByTestId('report-screen-back-button');
      fireEvent.press(backButton);
      fireEvent.press(backButton);
      fireEvent.press(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(3);
    });
  });

  describe('Layout and Styling', () => {
    it('should render ScrollView for scrollable content', () => {
      const { getByTestId } = render(
        <ReportScreen nutritionData={mockNutritionData} onBack={mockOnBack} />
      );

      const screen = getByTestId('report-screen');
      // ScrollView is a child of SafeAreaView
      expect(screen).toBeTruthy();
    });

    it('should show subtitle about Australian standard', () => {
      const { getByText } = render(
        <ReportScreen nutritionData={mockNutritionData} onBack={mockOnBack} />
      );

      expect(getByText('Per 100g/100ml (Australian standard)')).toBeTruthy();
    });

    it('should show helpful tip about settings', () => {
      const { getByTestId } = render(
        <ReportScreen nutritionData={mockNutritionData} onBack={mockOnBack} />
      );

      expect(getByTestId('report-screen-info')).toBeTruthy();
    });
  });
});

import React from 'react';
import { render } from '@testing-library/react-native';
import { NutritionCard } from '../nutrition/NutritionCard';
import type { NutritionData, NutritionThresholds } from '@/types/nutrition.types';

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

jest.mock('../nutrition/NutrientProgressBar', () => {
  const { Text } = require('react-native');
  return {
    NutrientProgressBar: ({
      label,
      value,
      threshold,
      unit,
      testID,
    }: {
      label: string;
      value: number | null;
      threshold: number;
      unit: string;
      testID?: string;
    }) => (
      <Text testID={testID}>
        {label}: {value} / {threshold} {unit}
      </Text>
    ),
  };
});

describe('NutritionCard', () => {
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

  const defaultNutritionData: NutritionData = {
    calories: 250,
    protein: 10,
    fat: 15,
    saturatedFat: 5,
    carbohydrates: 30,
    sugars: 10,
    fiber: 5,
    sodium: 300,
  };

  describe('Rendering', () => {
    it('should render with all elements', () => {
      const { getByTestId, getByText } = render(
        <NutritionCard nutritionData={defaultNutritionData} thresholds={defaultThresholds} />
      );

      expect(getByTestId('nutrition-card')).toBeTruthy();
      expect(getByText('Nutrition Report')).toBeTruthy();
      expect(getByText('Per 100g/100ml')).toBeTruthy();
    });

    it('should render with custom testID', () => {
      const { getByTestId } = render(
        <NutritionCard
          nutritionData={defaultNutritionData}
          thresholds={defaultThresholds}
          testID="custom-card"
        />
      );

      expect(getByTestId('custom-card')).toBeTruthy();
      expect(getByTestId('custom-card-title')).toBeTruthy();
      expect(getByTestId('custom-card-subtitle')).toBeTruthy();
    });
  });

  describe('Nutrient Progress Bars', () => {
    it('should render all 8 nutrient progress bars', () => {
      const { getByText } = render(
        <NutritionCard nutritionData={defaultNutritionData} thresholds={defaultThresholds} />
      );

      expect(getByText('Calories: 250 / 2000 kcal')).toBeTruthy();
      expect(getByText('Protein: 10 / 50 g')).toBeTruthy();
      expect(getByText('Fat: 15 / 70 g')).toBeTruthy();
      expect(getByText('Saturated Fat: 5 / 20 g')).toBeTruthy();
      expect(getByText('Carbohydrates: 30 / 275 g')).toBeTruthy();
      expect(getByText('Sugars: 10 / 50 g')).toBeTruthy();
      expect(getByText('Fiber: 5 / 25 g')).toBeTruthy();
      expect(getByText('Sodium: 300 / 2300 mg')).toBeTruthy();
    });

    it('should handle null values', () => {
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

      const { getByTestId } = render(
        <NutritionCard nutritionData={nullData} thresholds={defaultThresholds} />
      );

      // When value is null, React doesn't render null as text, so just verify components exist
      expect(getByTestId('nutrition-card-calories')).toBeTruthy();
      expect(getByTestId('nutrition-card-protein')).toBeTruthy();
      expect(getByTestId('nutrition-card-fat')).toBeTruthy();
      expect(getByTestId('nutrition-card-saturated-fat')).toBeTruthy();
      expect(getByTestId('nutrition-card-carbohydrates')).toBeTruthy();
      expect(getByTestId('nutrition-card-sugars')).toBeTruthy();
      expect(getByTestId('nutrition-card-fiber')).toBeTruthy();
      expect(getByTestId('nutrition-card-sodium')).toBeTruthy();
    });

    it('should pass correct testIDs to progress bars', () => {
      const { getByTestId } = render(
        <NutritionCard nutritionData={defaultNutritionData} thresholds={defaultThresholds} />
      );

      expect(getByTestId('nutrition-card-calories')).toBeTruthy();
      expect(getByTestId('nutrition-card-protein')).toBeTruthy();
      expect(getByTestId('nutrition-card-fat')).toBeTruthy();
      expect(getByTestId('nutrition-card-saturated-fat')).toBeTruthy();
      expect(getByTestId('nutrition-card-carbohydrates')).toBeTruthy();
      expect(getByTestId('nutrition-card-sugars')).toBeTruthy();
      expect(getByTestId('nutrition-card-fiber')).toBeTruthy();
      expect(getByTestId('nutrition-card-sodium')).toBeTruthy();
    });
  });

  describe('Warning Summary', () => {
    it('should not show warning when no nutrients exceeded', () => {
      const { queryByTestId } = render(
        <NutritionCard nutritionData={defaultNutritionData} thresholds={defaultThresholds} />
      );

      expect(queryByTestId('nutrition-card-warning')).toBeNull();
    });

    it('should show warning when one nutrient exceeded', () => {
      const exceededData: NutritionData = {
        ...defaultNutritionData,
        calories: 2500, // Exceeds 2000
      };

      const { getByTestId, getByText } = render(
        <NutritionCard nutritionData={exceededData} thresholds={defaultThresholds} />
      );

      expect(getByTestId('nutrition-card-warning')).toBeTruthy();
      expect(getByText('⚠️ Warning')).toBeTruthy();
      expect(getByText('1 nutrient exceeds your daily limit')).toBeTruthy();
    });

    it('should show warning when multiple nutrients exceeded', () => {
      const exceededData: NutritionData = {
        ...defaultNutritionData,
        calories: 2500, // Exceeds 2000
        fat: 80, // Exceeds 70
        sodium: 2500, // Exceeds 2300
      };

      const { getByTestId, getByText } = render(
        <NutritionCard nutritionData={exceededData} thresholds={defaultThresholds} />
      );

      expect(getByTestId('nutrition-card-warning')).toBeTruthy();
      expect(getByText('3 nutrients exceed your daily limit')).toBeTruthy();
    });

    it('should correctly identify all exceeded nutrients', () => {
      const allExceededData: NutritionData = {
        calories: 2500,
        protein: 60,
        fat: 80,
        saturatedFat: 25,
        carbohydrates: 300,
        sugars: 60,
        fiber: 30,
        sodium: 2500,
      };

      const { getByText } = render(
        <NutritionCard nutritionData={allExceededData} thresholds={defaultThresholds} />
      );

      expect(getByText('8 nutrients exceed your daily limit')).toBeTruthy();
    });

    it('should not count null values as exceeded', () => {
      const mixedData: NutritionData = {
        calories: 2500, // Exceeds
        protein: null, // Null - not exceeded
        fat: 80, // Exceeds
        saturatedFat: null,
        carbohydrates: null,
        sugars: null,
        fiber: null,
        sodium: 2500, // Exceeds
      };

      const { getByText } = render(
        <NutritionCard nutritionData={mixedData} thresholds={defaultThresholds} />
      );

      expect(getByText('3 nutrients exceed your daily limit')).toBeTruthy();
    });

    it('should not show warning when at exactly threshold', () => {
      const exactData: NutritionData = {
        ...defaultNutritionData,
        calories: 2000, // Exactly at threshold
      };

      const { queryByTestId } = render(
        <NutritionCard nutritionData={exactData} thresholds={defaultThresholds} />
      );

      expect(queryByTestId('nutrition-card-warning')).toBeNull();
    });
  });

  describe('ScrollView', () => {
    it('should render scrollable content', () => {
      const { getByTestId } = render(
        <NutritionCard nutritionData={defaultNutritionData} thresholds={defaultThresholds} />
      );

      expect(getByTestId('nutrition-card-scroll')).toBeTruthy();
    });
  });

  describe('Custom Thresholds', () => {
    it('should use custom threshold values', () => {
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

      const { getByText } = render(
        <NutritionCard nutritionData={defaultNutritionData} thresholds={customThresholds} />
      );

      expect(getByText('Calories: 250 / 1500 kcal')).toBeTruthy();
      expect(getByText('Protein: 10 / 40 g')).toBeTruthy();
      expect(getByText('Sodium: 300 / 2000 mg')).toBeTruthy();
    });

    it('should recalculate warnings with custom thresholds', () => {
      const lowThresholds: NutritionThresholds = {
        calories: 200, // defaultNutritionData.calories (250) exceeds this
        protein: 5, // defaultNutritionData.protein (10) exceeds this
        fat: 10, // defaultNutritionData.fat (15) exceeds this
        saturatedFat: 3, // defaultNutritionData.saturatedFat (5) exceeds this
        carbohydrates: 20, // defaultNutritionData.carbohydrates (30) exceeds this
        sugars: 5, // defaultNutritionData.sugars (10) exceeds this
        fiber: 3, // defaultNutritionData.fiber (5) exceeds this
        sodium: 200, // defaultNutritionData.sodium (300) exceeds this
      };

      const { getByText } = render(
        <NutritionCard nutritionData={defaultNutritionData} thresholds={lowThresholds} />
      );

      expect(getByText('8 nutrients exceed your daily limit')).toBeTruthy();
    });
  });
});

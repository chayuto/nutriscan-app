/**
 * Nutrition Data Types
 */

export interface NutritionData {
  calories: number | null;
  protein: number | null;
  fat: number | null;
  saturatedFat: number | null;
  carbohydrates: number | null;
  sugars: number | null;
  fiber: number | null;
  sodium: number | null;
  servingSize?: string;
  servingsPerContainer?: number;
}

export interface NutritionThresholds {
  calories: number;
  protein: number;
  fat: number;
  saturatedFat: number;
  carbohydrates: number;
  sugars: number;
  fiber: number;
  sodium: number;
}

export interface NutritionReport {
  data: NutritionData;
  thresholds: NutritionThresholds;
  timestamp: number;
  imageUri?: string;
}

export type NutrientKey = keyof Omit<
  NutritionData,
  'servingSize' | 'servingsPerContainer'
>;

export interface NutrientInfo {
  key: NutrientKey;
  label: string;
  unit: string;
  value: number | null;
  threshold: number;
  color: string;
  isExceeded: boolean;
}

// FDA Daily Value Guidelines (default thresholds)
export const DEFAULT_THRESHOLDS: NutritionThresholds = {
  calories: 2000, // kcal
  protein: 50, // g
  fat: 70, // g
  saturatedFat: 20, // g
  carbohydrates: 275, // g
  sugars: 50, // g
  fiber: 25, // g
  sodium: 2300, // mg
};

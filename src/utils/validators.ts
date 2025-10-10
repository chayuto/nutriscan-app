/**
 * Type Guards and Validators
 */

import type { NutritionData, APIError } from '../types';

/**
 * Type guard to validate NutritionData structure
 */
export function isValidNutritionData(data: unknown): data is NutritionData {
  if (typeof data !== 'object' || data === null) return false;

  const d = data as Record<string, unknown>;

  return (
    (typeof d.calories === 'number' || d.calories === null) &&
    (typeof d.protein === 'number' || d.protein === null) &&
    (typeof d.fat === 'number' || d.fat === null) &&
    (typeof d.saturatedFat === 'number' || d.saturatedFat === null) &&
    (typeof d.carbohydrates === 'number' || d.carbohydrates === null) &&
    (typeof d.sugars === 'number' || d.sugars === null) &&
    (typeof d.fiber === 'number' || d.fiber === null) &&
    (typeof d.sodium === 'number' || d.sodium === null)
  );
}

/**
 * Type guard to check if error is an APIError
 */
export function isAPIError(error: unknown): error is APIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'retryable' in error
  );
}

/**
 * Validate positive number input
 */
export function isPositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && value > 0 && isFinite(value);
}

/**
 * Validate threshold value
 */
export function isValidThreshold(value: unknown): boolean {
  return isPositiveNumber(value) && (value as number) <= 100000;
}

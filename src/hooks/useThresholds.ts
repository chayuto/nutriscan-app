/**
 * useThresholds Hook
 *
 * Manages user's daily nutritional threshold settings with automatic persistence.
 *
 * Features:
 * - Loads thresholds from storage on mount
 * - Optimistic UI updates
 * - Debounced auto-save (500ms delay)
 * - Reset to FDA default values
 * - Loading and saving states
 *
 * @example
 * ```typescript
 * function SettingsScreen() {
 *   const {
 *     thresholds,
 *     updateThreshold,
 *     resetToDefaults,
 *     isLoading,
 *     isSaving,
 *     error
 *   } = useThresholds();
 *
 *   return (
 *     <View>
 *       <TextInput
 *         value={String(thresholds.calories)}
 *         onChangeText={(value) => updateThreshold('calories', Number(value))}
 *       />
 *       {isSaving && <Text>Saving...</Text>}
 *       <Button onPress={resetToDefaults}>Reset to Defaults</Button>
 *     </View>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { storageService } from '@/services/storage.service';
import { NutritionThresholds, DEFAULT_THRESHOLDS } from '@/types/nutrition.types';

export interface UseThresholdsReturn {
  thresholds: NutritionThresholds;
  updateThreshold: (key: keyof NutritionThresholds, value: number) => void;
  resetToDefaults: () => void;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

/**
 * Custom hook for managing nutritional threshold settings
 *
 * @returns {UseThresholdsReturn} Thresholds state and management functions
 */
export function useThresholds(): UseThresholdsReturn {
  const [thresholds, setThresholds] = useState<NutritionThresholds>(DEFAULT_THRESHOLDS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store timeout ID for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store pending thresholds to save
  const pendingThresholdsRef = useRef<NutritionThresholds | null>(null);

  /**
   * Load thresholds from storage on mount
   */
  useEffect(() => {
    const loadStoredThresholds = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const saved = await storageService.loadThresholds();

        // loadThresholds returns DEFAULT_THRESHOLDS if nothing saved
        setThresholds(saved);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load thresholds';
        setError(message);
        console.error('[useThresholds] Load error:', err);
        // Keep DEFAULT_THRESHOLDS on error
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredThresholds();
  }, []);

  /**
   * Save thresholds to storage (debounced)
   */
  const saveThresholds = useCallback(async (thresholdsToSave: NutritionThresholds) => {
    try {
      setIsSaving(true);
      setError(null);

      await storageService.saveThresholds(thresholdsToSave);

      // Clear pending after successful save
      pendingThresholdsRef.current = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save thresholds';
      setError(message);
      console.error('[useThresholds] Save error:', err);
    } finally {
      setIsSaving(false);
    }
  }, []);

  /**
   * Update a single threshold value
   * - Immediately updates UI (optimistic)
   * - Debounces save to storage (500ms)
   */
  const updateThreshold = useCallback(
    (key: keyof NutritionThresholds, value: number) => {
      // Validate value (must be positive number)
      if (isNaN(value) || value < 0) {
        setError('Threshold must be a positive number');
        return;
      }

      // Clear any existing error
      setError(null);

      // Update UI immediately (optimistic update)
      const updated = { ...thresholds, [key]: value };
      setThresholds(updated);

      // Store for debounced save
      pendingThresholdsRef.current = updated;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for debounced save (500ms)
      saveTimeoutRef.current = setTimeout(() => {
        if (pendingThresholdsRef.current) {
          saveThresholds(pendingThresholdsRef.current);
        }
      }, 500);
    },
    [thresholds, saveThresholds]
  );

  /**
   * Reset thresholds to FDA default values
   */
  const resetToDefaults = useCallback(async () => {
    try {
      setError(null);

      // Update UI immediately
      setThresholds(DEFAULT_THRESHOLDS);

      // Clear any pending debounced save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      pendingThresholdsRef.current = null;

      // Save defaults immediately (no debounce for reset)
      setIsSaving(true);
      await storageService.saveThresholds(DEFAULT_THRESHOLDS);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset thresholds';
      setError(message);
      console.error('[useThresholds] Reset error:', err);
    } finally {
      setIsSaving(false);
    }
  }, []);

  /**
   * Cleanup: Clear timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);

        // Save any pending changes immediately on unmount
        if (pendingThresholdsRef.current) {
          // Note: This is a fire-and-forget save on unmount
          // In production, consider using a library like 'react-query' for better handling
          storageService.saveThresholds(pendingThresholdsRef.current).catch((err) => {
            console.error('[useThresholds] Unmount save error:', err);
          });
        }
      }
    };
  }, []);

  return {
    thresholds,
    updateThreshold,
    resetToDefaults,
    isLoading,
    isSaving,
    error,
  };
}

import { useState, useEffect, useCallback } from 'react';
import type { NutritionThresholds } from '@/types/nutrition.types';
import { DEFAULT_THRESHOLDS } from '@/types/nutrition.types';

/**
 * Custom hook to manage settings form state and synchronization
 *
 * Responsibilities:
 * - Track edited thresholds separate from saved values
 * - Detect when user has made changes (for unsaved warning)
 * - Sync from storage on mount and when saved values change
 * - Provide handlers for change, save, and reset operations
 *
 * @param initialThresholds - Thresholds loaded from storage
 * @param saveAll - Function to save all thresholds at once
 * @returns Form state and handlers
 */
export function useSettingsForm(
  initialThresholds: NutritionThresholds,
  saveAll: (thresholds: NutritionThresholds) => Promise<void>
) {
  const [editedThresholds, setEditedThresholds] = useState<NutritionThresholds>(initialThresholds);
  const [hasChanges, setHasChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // MOUNT EFFECT: Reset state and sync from storage when component first mounts
  useEffect(() => {
    // Always sync from storage on mount
    setEditedThresholds(initialThresholds);
    setHasChanges(false);
    setIsInitialized(true);
  }, []); // Empty deps = run only once on mount

  // SYNC EFFECT: Update editedThresholds when thresholds change from storage (after mount)
  useEffect(() => {
    if (isInitialized && !hasChanges) {
      // Only sync if user hasn't made changes
      setEditedThresholds(initialThresholds);
    }
  }, [initialThresholds, hasChanges, isInitialized]);

  /**
   * Handle threshold changes from the editor
   * Marks form as changed for unsaved warning
   */
  const handleChange = useCallback((updatedThresholds: NutritionThresholds) => {
    setEditedThresholds(updatedThresholds);
    setHasChanges(true);
  }, []);

  /**
   * Save changes and reset hasChanges flag
   * @throws Error if save fails
   */
  const handleSave = useCallback(async () => {
    if (hasChanges) {
      await saveAll(editedThresholds);
      setHasChanges(false);
    }
  }, [hasChanges, editedThresholds, saveAll]);

  /**
   * Reset to default FDA values
   */
  const handleReset = useCallback(async () => {
    setEditedThresholds(DEFAULT_THRESHOLDS);
    setHasChanges(false);
  }, []);

  return {
    editedThresholds,
    hasChanges,
    isInitialized,
    handleChange,
    handleSave,
    handleReset,
  };
}

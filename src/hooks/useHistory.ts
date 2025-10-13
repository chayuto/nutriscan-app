/**
 * useHistory Hook
 *
 * React hook for managing scan history with HistoryService.
 * Provides loading states, error handling, and optimistic updates.
 *
 * @example
 * ```tsx
 * function HistoryScreen() {
 *   const {
 *     items,
 *     isLoading,
 *     toggleFavorite,
 *     deleteItems,
 *   } = useHistory();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *
 *   return (
 *     <FlatList
 *       data={items}
 *       renderItem={({ item }) => (
 *         <HistoryItem
 *           item={item}
 *           onFavorite={() => toggleFavorite(item.id, true)}
 *         />
 *       )}
 *     />
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { historyService } from '@/services/history.service';
import type {
  ScanHistoryItem,
  ScanHistory,
  HistoryStats,
  HistoryFilter,
} from '@/types/history.types';

/**
 * Return type for useHistory hook
 */
export interface UseHistoryReturn {
  // Data
  items: ScanHistoryItem[];
  stats: HistoryStats | null;
  history: ScanHistory | null;

  // Loading states
  isLoading: boolean;
  isAdding: boolean;
  isDeleting: boolean;
  isToggling: boolean;
  isClearing: boolean;

  // Actions
  addScan: (
    scan: Omit<ScanHistoryItem, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ) => Promise<string>;
  updateItem: (id: string, updates: Partial<ScanHistoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  deleteItems: (ids: string[]) => Promise<number>;
  toggleFavorite: (id: string, optimistic?: boolean) => Promise<boolean>;
  toggleFavorites: (ids: string[], isFavorite: boolean) => Promise<number>;
  clearHistory: (keepFavorites?: boolean) => Promise<void>;

  // Queries
  getItems: (options?: HistoryFilter) => Promise<ScanHistoryItem[]>;
  getItem: (id: string) => Promise<ScanHistoryItem | null>;
  getStats: () => Promise<HistoryStats>;

  // Error handling
  error: string | null;
  clearError: () => void;

  // Manual refresh
  refresh: () => Promise<void>;
}

/**
 * Hook for managing scan history
 *
 * Provides:
 * - Automatic initialization and loading
 * - Loading states for all operations
 * - Error handling with user-friendly messages
 * - Optimistic updates for instant UI feedback
 * - Batch operations for performance
 *
 * @returns {UseHistoryReturn} History management interface
 */
export function useHistory(): UseHistoryReturn {
  // Data state
  const [items, setItems] = useState<ScanHistoryItem[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [history, setHistory] = useState<ScanHistory | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh all data from service
   */
  const refresh = useCallback(async () => {
    try {
      setError(null);

      const loadedHistory = await historyService.load();
      if (loadedHistory) {
        setHistory(loadedHistory);
        setItems(loadedHistory.items);

        const loadedStats = await historyService.getStats();
        setStats(loadedStats);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh history';
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Initialize history service and load initial data
   */
  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await historyService.initialize();
        const loadedHistory = await historyService.load();

        if (mounted && loadedHistory) {
          setHistory(loadedHistory);
          setItems(loadedHistory.items);

          const loadedStats = await historyService.getStats();
          setStats(loadedStats);
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load history';
          setError(errorMessage);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Add new scan to history
   *
   * @param scan - Scan data without system fields
   * @returns Newly created item ID
   */
  const addScan = useCallback(
    async (
      scan: Omit<ScanHistoryItem, 'id' | 'createdAt' | 'updatedAt' | 'version'>
    ): Promise<string> => {
      try {
        setIsAdding(true);
        setError(null);

        const id = await historyService.addScan(scan);

        // Refresh items
        await refresh();

        return id;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add scan';
        setError(errorMessage);
        throw err;
      } finally {
        setIsAdding(false);
      }
    },
    [refresh]
  );

  /**
   * Update existing item
   *
   * @param id - Item ID to update
   * @param updates - Partial updates to apply
   */
  const updateItem = useCallback(
    async (id: string, updates: Partial<ScanHistoryItem>): Promise<void> => {
      try {
        setError(null);

        await historyService.updateItem(id, updates);

        // Refresh items
        await refresh();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update item';
        setError(errorMessage);
        throw err;
      }
    },
    [refresh]
  );

  /**
   * Delete single item by ID
   *
   * @param id - Item ID to delete
   */
  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      try {
        setIsDeleting(true);
        setError(null);

        await historyService.deleteItem(id);

        // Refresh items
        await refresh();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
        setError(errorMessage);
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    [refresh]
  );

  /**
   * Delete multiple items by IDs (batch operation)
   *
   * More efficient than calling deleteItem() multiple times.
   *
   * @param ids - Array of item IDs to delete
   * @returns Number of items deleted
   */
  const deleteItems = useCallback(
    async (ids: string[]): Promise<number> => {
      try {
        setIsDeleting(true);
        setError(null);

        const deletedCount = await historyService.deleteItems(ids);

        // Refresh items
        await refresh();

        return deletedCount;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete items';
        setError(errorMessage);
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    [refresh]
  );

  /**
   * Toggle favorite status with optional optimistic update
   *
   * When optimistic=true:
   * - UI updates immediately (< 10ms)
   * - Save happens in background
   * - Auto-rollback on failure
   *
   * When optimistic=false:
   * - Waits for save to complete (~150ms)
   * - Guaranteed consistency
   *
   * @param id - Item ID to toggle
   * @param optimistic - If true, update UI immediately
   * @returns New favorite status
   */
  const toggleFavorite = useCallback(
    async (id: string, optimistic: boolean = true): Promise<boolean> => {
      try {
        setIsToggling(true);
        setError(null);

        // Use optimistic update for instant UI feedback
        const newStatus = await historyService.toggleFavorite(id, { optimistic });

        // Update local state immediately if optimistic
        if (optimistic) {
          setItems((prevItems) =>
            prevItems.map((item) => (item.id === id ? { ...item, isFavorite: newStatus } : item))
          );
        }

        // Refresh from service (will reflect rollback if save failed)
        const updatedHistory = await historyService.load();
        if (updatedHistory) {
          setHistory(updatedHistory);
          setItems(updatedHistory.items);
        }

        return newStatus;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to toggle favorite';
        setError(errorMessage);
        throw err;
      } finally {
        setIsToggling(false);
      }
    },
    []
  );

  /**
   * Toggle favorite status for multiple items (batch operation)
   *
   * More efficient than calling toggleFavorite() multiple times.
   *
   * @param ids - Array of item IDs to update
   * @param isFavorite - New favorite status to set
   * @returns Number of items updated
   */
  const toggleFavorites = useCallback(
    async (ids: string[], isFavorite: boolean): Promise<number> => {
      try {
        setIsToggling(true);
        setError(null);

        const updatedCount = await historyService.toggleFavorites(ids, isFavorite);

        // Refresh items
        await refresh();

        return updatedCount;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to toggle favorites';
        setError(errorMessage);
        throw err;
      } finally {
        setIsToggling(false);
      }
    },
    [refresh]
  );

  /**
   * Clear all or non-favorite items
   *
   * @param keepFavorites - If true, only removes non-favorites
   */
  const clearHistory = useCallback(
    async (keepFavorites: boolean = true): Promise<void> => {
      try {
        setIsClearing(true);
        setError(null);

        await historyService.clearHistory(keepFavorites);

        // Refresh items
        await refresh();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to clear history';
        setError(errorMessage);
        throw err;
      } finally {
        setIsClearing(false);
      }
    },
    [refresh]
  );

  /**
   * Get items with optional filtering, sorting, and pagination
   *
   * @param options - Query options
   * @returns Filtered and sorted items
   */
  const getItems = useCallback(async (options?: HistoryFilter): Promise<ScanHistoryItem[]> => {
    try {
      return await historyService.getItems(options);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get items';
      setError(errorMessage);
      return [];
    }
  }, []);

  /**
   * Get single item by ID
   *
   * @param id - Item ID
   * @returns Item or null if not found
   */
  const getItem = useCallback(async (id: string): Promise<ScanHistoryItem | null> => {
    try {
      return await historyService.getItem(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get item';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Get history statistics
   *
   * @returns Statistics object
   */
  const getStats = useCallback(async (): Promise<HistoryStats> => {
    try {
      return await historyService.getStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get stats';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    // Data
    items,
    stats,
    history,

    // Loading states
    isLoading,
    isAdding,
    isDeleting,
    isToggling,
    isClearing,

    // Actions
    addScan,
    updateItem,
    deleteItem,
    deleteItems,
    toggleFavorite,
    toggleFavorites,
    clearHistory,

    // Queries
    getItems,
    getItem,
    getStats,

    // Error handling
    error,
    clearError,

    // Manual refresh
    refresh,
  };
}

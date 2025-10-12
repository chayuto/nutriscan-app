/**
 * Tests for useHistory Hook
 *
 * Tests React hook functionality, state management, and integration
 * with HistoryService.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useHistory } from '@/hooks/useHistory';
import { historyService } from '@/services/history.service';
import type { ScanHistoryItem, HistoryStats } from '@/types/history.types';

// Mock the history service
jest.mock('@/services/history.service', () => ({
  historyService: {
    initialize: jest.fn(),
    load: jest.fn(),
    save: jest.fn(),
    addScan: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    deleteItems: jest.fn(),
    toggleFavorite: jest.fn(),
    toggleFavorites: jest.fn(),
    clearHistory: jest.fn(),
    getItems: jest.fn(),
    getItem: jest.fn(),
    getStats: jest.fn(),
  },
}));

describe('useHistory', () => {
  // Sample data
  const mockItem: ScanHistoryItem = {
    id: '1',
    timestamp: Date.now(),
    productName: 'Test Product',
    brandName: 'Test Brand',
    nutritionData: {
      calories: 250,
      protein: 5,
      fat: 10,
      saturatedFat: 3,
      carbohydrates: 30,
      sugars: 15,
      fiber: 2,
      sodium: 300,
    },
    isFavorite: false,
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
  };

  const mockHistory = {
    version: 1,
    items: [mockItem],
    metadata: {
      totalScans: 1,
      lastScanAt: Date.now(),
      storageVersion: '1.0.0',
    },
  };

  const mockStats: HistoryStats = {
    totalScans: 1,
    favoritesCount: 0,
    scansThisWeek: 1,
    scansThisMonth: 1,
    averageCalories: 250,
    mostScannedProduct: 'Test Product',
    lastScanAt: Date.now(),
    currentStreak: 1,
    allTags: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    (historyService.initialize as jest.Mock).mockResolvedValue(undefined);
    (historyService.load as jest.Mock).mockResolvedValue(mockHistory);
    (historyService.getStats as jest.Mock).mockResolvedValue(mockStats);
  });

  describe('Initialization', () => {
    it('should initialize and load data on mount', async () => {
      const { result } = renderHook(() => useHistory());

      // Should start loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(historyService.initialize).toHaveBeenCalledTimes(1);
      expect(historyService.load).toHaveBeenCalledTimes(1);
      expect(historyService.getStats).toHaveBeenCalledTimes(1);

      expect(result.current.items).toEqual(mockHistory.items);
      expect(result.current.history).toEqual(mockHistory);
      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.error).toBeNull();
    });

    it('should handle initialization errors', async () => {
      const errorMessage = 'Failed to initialize';
      (historyService.initialize as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.items).toEqual([]);
      expect(result.current.history).toBeNull();
    });

    it('should not update state after unmount', async () => {
      (historyService.load as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockHistory), 100))
      );

      const { result, unmount } = renderHook(() => useHistory());

      unmount();

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should not throw or update state after unmount
      expect(result.current.isLoading).toBe(true); // State before unmount
    });
  });

  describe('addScan', () => {
    it('should add new scan and refresh data', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newScan = {
        timestamp: Date.now(),
        productName: 'New Product',
        nutritionData: mockItem.nutritionData,
        isFavorite: false,
        tags: [],
      };

      const newId = 'new-id';
      (historyService.addScan as jest.Mock).mockResolvedValue(newId);

      let returnedId: string | undefined;
      await act(async () => {
        returnedId = await result.current.addScan(newScan);
      });

      expect(returnedId).toBe(newId);
      expect(result.current.isAdding).toBe(false);
      expect(historyService.addScan).toHaveBeenCalledWith(newScan);
      expect(historyService.load).toHaveBeenCalled(); // Refresh called
    });

    it('should set error on add failure', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const errorMessage = 'Failed to add scan';
      (historyService.addScan as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const newScan = {
        timestamp: Date.now(),
        productName: 'New Product',
        nutritionData: mockItem.nutritionData,
        isFavorite: false,
        tags: [],
      };

      await act(async () => {
        try {
          await result.current.addScan(newScan);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isAdding).toBe(false);
    });

    it('should set isAdding state during operation', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (historyService.addScan as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('new-id'), 50))
      );

      const newScan = {
        timestamp: Date.now(),
        productName: 'New Product',
        nutritionData: mockItem.nutritionData,
        isFavorite: false,
        tags: [],
      };

      act(() => {
        result.current.addScan(newScan);
      });

      expect(result.current.isAdding).toBe(true);

      await waitFor(() => {
        expect(result.current.isAdding).toBe(false);
      });
    });
  });

  describe('updateItem', () => {
    it('should update item and refresh data', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updates = { productName: 'Updated Product' };
      (historyService.updateItem as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await result.current.updateItem('1', updates);
      });

      expect(historyService.updateItem).toHaveBeenCalledWith('1', updates);
      expect(historyService.load).toHaveBeenCalled(); // Refresh called
      expect(result.current.error).toBeNull();
    });

    it('should handle update errors', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const errorMessage = 'Item not found';
      (historyService.updateItem as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await result.current.updateItem('999', { productName: 'Updated' });
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('deleteItem', () => {
    it('should delete item and refresh data', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (historyService.deleteItem as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await result.current.deleteItem('1');
      });

      expect(historyService.deleteItem).toHaveBeenCalledWith('1');
      expect(historyService.load).toHaveBeenCalled(); // Refresh called
      expect(result.current.isDeleting).toBe(false);
    });

    it('should set isDeleting state during operation', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (historyService.deleteItem as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined), 50))
      );

      act(() => {
        result.current.deleteItem('1');
      });

      expect(result.current.isDeleting).toBe(true);

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
      });
    });
  });

  describe('deleteItems (batch)', () => {
    it('should delete multiple items and refresh', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (historyService.deleteItems as jest.Mock).mockResolvedValue(2);

      let deletedCount: number | undefined;
      await act(async () => {
        deletedCount = await result.current.deleteItems(['1', '2']);
      });

      expect(deletedCount).toBe(2);
      expect(historyService.deleteItems).toHaveBeenCalledWith(['1', '2']);
      expect(historyService.load).toHaveBeenCalled();
      expect(result.current.isDeleting).toBe(false);
    });

    it('should handle batch delete errors', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const errorMessage = 'Delete failed';
      (historyService.deleteItems as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await result.current.deleteItems(['1', '2']);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isDeleting).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite with optimistic update', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (historyService.toggleFavorite as jest.Mock).mockResolvedValue(true);
      (historyService.load as jest.Mock).mockResolvedValue({
        ...mockHistory,
        items: [{ ...mockItem, isFavorite: true }],
      });

      let newStatus: boolean | undefined;
      await act(async () => {
        newStatus = await result.current.toggleFavorite('1', true);
      });

      expect(newStatus).toBe(true);
      expect(historyService.toggleFavorite).toHaveBeenCalledWith('1', { optimistic: true });
      expect(result.current.isToggling).toBe(false);
    });

    it('should toggle favorite without optimistic update', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (historyService.toggleFavorite as jest.Mock).mockResolvedValue(true);

      await act(async () => {
        await result.current.toggleFavorite('1', false);
      });

      expect(historyService.toggleFavorite).toHaveBeenCalledWith('1', { optimistic: false });
    });

    it('should update local state immediately with optimistic update', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock slow service call but fast optimistic update
      (historyService.toggleFavorite as jest.Mock).mockResolvedValue(true);
      (historyService.load as jest.Mock).mockResolvedValue({
        ...mockHistory,
        items: [{ ...mockItem, isFavorite: true }],
      });

      await act(async () => {
        await result.current.toggleFavorite('1', true);
      });

      // State should be updated after operation completes
      await waitFor(() => {
        expect(result.current.items[0]?.isFavorite).toBe(true);
      });
    });

    it('should set isToggling state during operation', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (historyService.toggleFavorite as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 50))
      );

      act(() => {
        result.current.toggleFavorite('1', true);
      });

      expect(result.current.isToggling).toBe(true);

      await waitFor(() => {
        expect(result.current.isToggling).toBe(false);
      });
    });
  });

  describe('toggleFavorites (batch)', () => {
    it('should toggle multiple favorites and refresh', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (historyService.toggleFavorites as jest.Mock).mockResolvedValue(2);

      let updatedCount: number | undefined;
      await act(async () => {
        updatedCount = await result.current.toggleFavorites(['1', '2'], true);
      });

      expect(updatedCount).toBe(2);
      expect(historyService.toggleFavorites).toHaveBeenCalledWith(['1', '2'], true);
      expect(historyService.load).toHaveBeenCalled();
      expect(result.current.isToggling).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('should clear history keeping favorites', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (historyService.clearHistory as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await result.current.clearHistory(true);
      });

      expect(historyService.clearHistory).toHaveBeenCalledWith(true);
      expect(historyService.load).toHaveBeenCalled();
      expect(result.current.isClearing).toBe(false);
    });

    it('should clear all history including favorites', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (historyService.clearHistory as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await result.current.clearHistory(false);
      });

      expect(historyService.clearHistory).toHaveBeenCalledWith(false);
    });

    it('should set isClearing state during operation', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (historyService.clearHistory as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined), 50))
      );

      act(() => {
        result.current.clearHistory(true);
      });

      expect(result.current.isClearing).toBe(true);

      await waitFor(() => {
        expect(result.current.isClearing).toBe(false);
      });
    });
  });

  describe('getItems', () => {
    it('should get items with filters', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const mockFilteredItems = [mockItem];
      (historyService.getItems as jest.Mock).mockResolvedValue(mockFilteredItems);

      let items: ScanHistoryItem[] | undefined;
      await act(async () => {
        items = await result.current.getItems({ isFavorite: true });
      });

      expect(items).toEqual(mockFilteredItems);
      expect(historyService.getItems).toHaveBeenCalledWith({ isFavorite: true });
    });

    it('should return empty array on error', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (historyService.getItems as jest.Mock).mockRejectedValue(new Error('Query failed'));

      let items: ScanHistoryItem[] | undefined;
      await act(async () => {
        items = await result.current.getItems();
      });

      expect(items).toEqual([]);
      expect(result.current.error).toBe('Query failed');
    });
  });

  describe('getItem', () => {
    it('should get single item by ID', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (historyService.getItem as jest.Mock).mockResolvedValue(mockItem);

      let item: ScanHistoryItem | null | undefined;
      await act(async () => {
        item = await result.current.getItem('1');
      });

      expect(item).toEqual(mockItem);
      expect(historyService.getItem).toHaveBeenCalledWith('1');
    });

    it('should return null on error', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (historyService.getItem as jest.Mock).mockRejectedValue(new Error('Item not found'));

      let item: ScanHistoryItem | null | undefined;
      await act(async () => {
        item = await result.current.getItem('999');
      });

      expect(item).toBeNull();
      expect(result.current.error).toBe('Item not found');
    });
  });

  describe('getStats', () => {
    it('should get history statistics', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (historyService.getStats as jest.Mock).mockResolvedValue(mockStats);

      let stats: HistoryStats | undefined;
      await act(async () => {
        stats = await result.current.getStats();
      });

      expect(stats).toEqual(mockStats);
      expect(historyService.getStats).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should set error state when operations fail', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const errorMessage = 'Operation failed';
      (historyService.deleteItem as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await result.current.deleteItem('1');
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(errorMessage);
    });

    it('should clear error state', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (historyService.deleteItem as jest.Mock).mockRejectedValue(new Error('Error'));

      await act(async () => {
        try {
          await result.current.deleteItem('1');
        } catch {
          // Expected
        }
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should clear error on successful operation', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Cause an error
      (historyService.deleteItem as jest.Mock).mockRejectedValue(new Error('Error'));
      await act(async () => {
        try {
          await result.current.deleteItem('1');
        } catch {
          // Expected
        }
      });

      expect(result.current.error).not.toBeNull();

      // Successful operation should clear error
      (historyService.deleteItem as jest.Mock).mockResolvedValue(undefined);
      await act(async () => {
        await result.current.deleteItem('2');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('refresh', () => {
    it('should manually refresh all data', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.refresh();
      });

      expect(historyService.load).toHaveBeenCalledTimes(1);
      expect(historyService.getStats).toHaveBeenCalledTimes(1);
    });

    it('should handle refresh errors', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const errorMessage = 'Refresh failed';
      (historyService.load as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await result.current.refresh();
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });
});

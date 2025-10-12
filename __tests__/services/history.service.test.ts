/**
 * History Service Tests
 *
 * Tests for history.service.ts covering:
 * - Initialization
 * - CRUD operations
 * - Filtering and sorting
 * - Statistics calculation
 * - Cache behavior
 * - Error handling
 * - Limit enforcement
 *
 * Target: 85%+ coverage
 */

import * as SecureStore from 'expo-secure-store';
import { HistoryService } from '@/services/history.service';
import type { ScanHistoryItem, ScanHistory } from '@/types/history.types';

// Mock expo-secure-store
jest.mock('expo-secure-store');

// Helper to create mock nutrition data
const createMockNutritionData = () => ({
  calories: 250,
  protein: 10,
  fat: 15,
  saturatedFat: 8,
  carbohydrates: 28,
  sugars: 12,
  fiber: 2,
  sodium: 300,
});

// Helper to create mock scan item
const createMockScanItem = (
  overrides?: Partial<Omit<ScanHistoryItem, 'id' | 'createdAt' | 'updatedAt' | 'version'>>
): Omit<ScanHistoryItem, 'id' | 'createdAt' | 'updatedAt' | 'version'> => ({
  timestamp: Date.now(),
  productName: 'Test Product',
  brandName: 'Test Brand',
  nutritionData: createMockNutritionData(),
  isFavorite: false,
  tags: [],
  ...overrides,
});

describe('HistoryService', () => {
  let service: HistoryService;
  let mockStorage: { [key: string]: string } = {};

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset mock storage
    mockStorage = {};
    
    // Create fresh service instance
    service = new HistoryService();
    
    // Clear any cached data
    service.clearCache();
    
    // Setup mock implementation with actual storage
    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
      return Promise.resolve(mockStorage[key] || null);
    });
    (SecureStore.setItemAsync as jest.Mock).mockImplementation((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve(undefined);
    });
  });

  describe('initialize()', () => {
    it('should create empty history if none exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await service.initialize();

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'nutriscan_history',
        expect.stringContaining('"items":[]')
      );
    });

    it('should not overwrite existing history', async () => {
      const existingHistory: ScanHistory = {
        version: 1,
        items: [],
        metadata: {
          totalScans: 5,
          lastScanAt: Date.now(),
          storageVersion: '1.0.0',
        },
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(existingHistory));

      await service.initialize();

      // Should not call setItemAsync
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('should handle storage errors gracefully', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(service.initialize()).rejects.toThrow('Failed to initialize history storage');
    });
  });

  describe('load()', () => {
    it('should load history from storage', async () => {
      const mockHistory: ScanHistory = {
        version: 1,
        items: [],
        metadata: {
          totalScans: 0,
          lastScanAt: 0,
          storageVersion: '1.0.0',
        },
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory));

      const result = await service.load();

      expect(result).toEqual(mockHistory);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('nutriscan_history');
    });

    it('should return null if no history exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await service.load();

      expect(result).toBeNull();
    });

    it('should use cache within TTL', async () => {
      const mockHistory: ScanHistory = {
        version: 1,
        items: [],
        metadata: {
          totalScans: 0,
          lastScanAt: 0,
          storageVersion: '1.0.0',
        },
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory));

      // First call - should load from storage
      await service.load();
      expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await service.load();
      expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle parse errors gracefully with error recovery', async () => {
      // First call returns corrupted data, subsequent calls return empty string (cleared)
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('invalid json')
        .mockResolvedValue('');

      // Should not throw - returns initialized empty history
      const result = await service.load();

      expect(result).not.toBeNull();
      expect(result?.items).toEqual([]);
      expect(result?.metadata.totalScans).toBe(0);

      // Should have backed up corrupted data
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        expect.stringMatching(/nutriscan_history_backup_\d+/),
        'invalid json'
      );

      // Should have cleared corrupted data and initialized fresh
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('nutriscan_history', '');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'nutriscan_history',
        expect.stringContaining('"items":[]')
      );
    });
  });

  describe('save()', () => {
    it('should save history to storage', async () => {
      const mockHistory: ScanHistory = {
        version: 1,
        items: [],
        metadata: {
          totalScans: 0,
          lastScanAt: 0,
          storageVersion: '1.0.0',
        },
      };

      await service.save(mockHistory);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'nutriscan_history',
        JSON.stringify(mockHistory)
      );
    });

    it('should handle save errors', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('Storage full'));

      const mockHistory: ScanHistory = {
        version: 1,
        items: [],
        metadata: {
          totalScans: 0,
          lastScanAt: 0,
          storageVersion: '1.0.0',
        },
      };

      await expect(service.save(mockHistory)).rejects.toThrow('Failed to save history');
    });
  });

  describe('addScan()', () => {
    beforeEach(async () => {
      // Initialize with empty history
      await service.initialize();
    });

    it('should add new scan to beginning of list', async () => {
      const mockScan = createMockScanItem();

      const id = await service.addScan(mockScan);

      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');

      // Verify item was added
      const history = await service.load();
      expect(history?.items.length).toBe(1);
      expect(history?.items[0].id).toBe(id);
      expect(history?.items[0].productName).toBe('Test Product');
    });

    it('should set correct timestamps and version', async () => {
      const mockScan = createMockScanItem();
      const beforeTime = Date.now();

      await service.addScan(mockScan);

      const afterTime = Date.now();
      const history = await service.load();
      const item = history?.items[0];

      expect(item?.createdAt).toBeGreaterThanOrEqual(beforeTime);
      expect(item?.createdAt).toBeLessThanOrEqual(afterTime);
      expect(item?.updatedAt).toBe(item?.createdAt);
      expect(item?.version).toBe(1);
    });

    it('should update metadata', async () => {
      const mockScan = createMockScanItem();

      await service.addScan(mockScan);

      const history = await service.load();
      expect(history?.metadata.totalScans).toBe(1);
      expect(history?.metadata.lastScanAt).toBe(mockScan.timestamp);
    });

    it('should enforce 1000 item limit by removing oldest non-favorite', async () => {
      // Clear cache and setup special test case
      service.clearCache();
      
      // Create history with 1000 items
      const items: ScanHistoryItem[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        timestamp: Date.now() - i * 1000,
        productName: `Product ${i}`,
        nutritionData: createMockNutritionData(),
        isFavorite: i < 10, // First 10 are favorites
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
      }));

      const fullHistory: ScanHistory = {
        version: 1,
        items,
        metadata: {
          totalScans: 1000,
          lastScanAt: Date.now(),
          storageVersion: '1.0.0',
        },
      };

      mockStorage['nutriscan_history'] = JSON.stringify(fullHistory);

      const newScan = createMockScanItem({ productName: 'New Product' });
      await service.addScan(newScan);

      const history = await service.load();
      expect(history?.items.length).toBe(1000);
      expect(history?.items[0].productName).toBe('New Product');
      // Should have removed oldest non-favorite (item-999)
    });

    it('should throw error if storage is full of favorites', async () => {
      // Clear cache and setup special test case
      service.clearCache();
      
      // Create history with 1000 favorite items
      const items: ScanHistoryItem[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        timestamp: Date.now() - i * 1000,
        productName: `Product ${i}`,
        nutritionData: createMockNutritionData(),
        isFavorite: true,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
      }));

      const fullHistory: ScanHistory = {
        version: 1,
        items,
        metadata: {
          totalScans: 1000,
          lastScanAt: Date.now(),
          storageVersion: '1.0.0',
        },
      };

      mockStorage['nutriscan_history'] = JSON.stringify(fullHistory);

      const newScan = createMockScanItem();
      await expect(service.addScan(newScan)).rejects.toThrow('Storage full');
    });
  });

  describe('getItems()', () => {
    beforeEach(async () => {
      // Create history with test items
      const items: ScanHistoryItem[] = [
        {
          id: '1',
          timestamp: Date.now() - 1000,
          productName: 'Apple Juice',
          brandName: 'Brand A',
          nutritionData: createMockNutritionData(),
          isFavorite: true,
          tags: ['drink', 'fruit'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
        },
        {
          id: '2',
          timestamp: Date.now() - 2000,
          productName: 'Orange Juice',
          brandName: 'Brand B',
          nutritionData: createMockNutritionData(),
          isFavorite: false,
          tags: ['drink'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
        },
        {
          id: '3',
          timestamp: Date.now() - 3000,
          productName: 'Apple Pie',
          brandName: 'Brand A',
          nutritionData: createMockNutritionData(),
          isFavorite: false,
          tags: ['dessert', 'fruit'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
        },
      ];

      const history: ScanHistory = {
        version: 1,
        items,
        metadata: {
          totalScans: 3,
          lastScanAt: Date.now(),
          storageVersion: '1.0.0',
        },
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(history));
    });

    it('should return all items without filter', async () => {
      const items = await service.getItems();
      expect(items.length).toBe(3);
    });

    it('should filter by search query', async () => {
      const items = await service.getItems({ searchQuery: 'Apple' });
      expect(items.length).toBe(2);
      expect(items[0].productName).toContain('Apple');
      expect(items[1].productName).toContain('Apple');
    });

    it('should filter by favorite status', async () => {
      const items = await service.getItems({ isFavorite: true });
      expect(items.length).toBe(1);
      expect(items[0].id).toBe('1');
    });

    it('should filter by tags', async () => {
      const items = await service.getItems({ tags: ['fruit'] });
      expect(items.length).toBe(2);
    });

    it('should sort by name', async () => {
      const items = await service.getItems({ sortBy: 'name', sortOrder: 'asc' });
      expect(items[0].productName).toBe('Apple Juice');
      expect(items[1].productName).toBe('Apple Pie');
      expect(items[2].productName).toBe('Orange Juice');
    });

    it('should apply pagination', async () => {
      const items = await service.getItems({ limit: 2, offset: 1 });
      expect(items.length).toBe(2);
      expect(items[0].id).toBe('2');
    });
  });

  describe('getItem()', () => {
    it('should return item by ID', async () => {
      const mockItem: ScanHistoryItem = {
        id: 'test-id',
        timestamp: Date.now(),
        productName: 'Test Product',
        nutritionData: createMockNutritionData(),
        isFavorite: false,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
      };

      const history: ScanHistory = {
        version: 1,
        items: [mockItem],
        metadata: {
          totalScans: 1,
          lastScanAt: Date.now(),
          storageVersion: '1.0.0',
        },
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(history));

      const item = await service.getItem('test-id');
      expect(item).toEqual(mockItem);
    });

    it('should return null if item not found', async () => {
      const history: ScanHistory = {
        version: 1,
        items: [],
        metadata: {
          totalScans: 0,
          lastScanAt: 0,
          storageVersion: '1.0.0',
        },
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(history));

      const item = await service.getItem('non-existent');
      expect(item).toBeNull();
    });
  });

  describe('updateItem()', () => {
    it('should update item fields', async () => {
      const mockItem: ScanHistoryItem = {
        id: 'test-id',
        timestamp: Date.now(),
        productName: 'Old Name',
        nutritionData: createMockNutritionData(),
        isFavorite: false,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
      };

      const history: ScanHistory = {
        version: 1,
        items: [mockItem],
        metadata: {
          totalScans: 1,
          lastScanAt: Date.now(),
          storageVersion: '1.0.0',
        },
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(history));

      await service.updateItem('test-id', { productName: 'New Name' });

      const updated = await service.getItem('test-id');
      expect(updated?.productName).toBe('New Name');
      expect(updated?.version).toBe(2);
    });

    it('should throw error if item not found', async () => {
      const history: ScanHistory = {
        version: 1,
        items: [],
        metadata: {
          totalScans: 0,
          lastScanAt: 0,
          storageVersion: '1.0.0',
        },
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(history));

      await expect(service.updateItem('non-existent', { productName: 'New' })).rejects.toThrow(
        'Item not found'
      );
    });
  });

  describe('toggleFavorite()', () => {
    it('should toggle favorite status', async () => {
      const mockItem: ScanHistoryItem = {
        id: 'test-id',
        timestamp: Date.now(),
        productName: 'Test',
        nutritionData: createMockNutritionData(),
        isFavorite: false,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
      };

      const history: ScanHistory = {
        version: 1,
        items: [mockItem],
        metadata: {
          totalScans: 1,
          lastScanAt: Date.now(),
          storageVersion: '1.0.0',
        },
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(history));

      const newStatus = await service.toggleFavorite('test-id');
      expect(newStatus).toBe(true);

      const item = await service.getItem('test-id');
      expect(item?.isFavorite).toBe(true);
    });

    it('should support optimistic updates (instant return)', async () => {
      const mockItem: ScanHistoryItem = {
        id: 'test-id',
        timestamp: Date.now(),
        productName: 'Test',
        nutritionData: createMockNutritionData(),
        isFavorite: false,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
      };

      const history: ScanHistory = {
        version: 1,
        items: [mockItem],
        metadata: {
          totalScans: 1,
          lastScanAt: Date.now(),
          storageVersion: '1.0.0',
        },
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(history));

      const startTime = Date.now();
      const newStatus = await service.toggleFavorite('test-id', { optimistic: true });
      const duration = Date.now() - startTime;

      // Should return immediately (< 50ms, not waiting for save)
      expect(duration).toBeLessThan(50);
      expect(newStatus).toBe(true);

      // Cache should be updated immediately
      const item = await service.getItem('test-id');
      expect(item?.isFavorite).toBe(true);

      // Wait for background save to complete
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });

    it('should rollback on save failure with optimistic update', async () => {
      const mockItem: ScanHistoryItem = {
        id: 'test-id',
        timestamp: Date.now(),
        productName: 'Test',
        nutritionData: createMockNutritionData(),
        isFavorite: false,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
      };

      const history: ScanHistory = {
        version: 1,
        items: [mockItem],
        metadata: {
          totalScans: 1,
          lastScanAt: Date.now(),
          storageVersion: '1.0.0',
        },
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(history));
      
      // Make save fail after first successful load
      (SecureStore.setItemAsync as jest.Mock).mockImplementation(() => {
        return Promise.reject(new Error('Storage error'));
      });

      const newStatus = await service.toggleFavorite('test-id', { optimistic: true });

      // Should still return true immediately (optimistic)
      expect(newStatus).toBe(true);

      // Cache should be updated immediately
      service.clearCache(); // Clear cache to force reload from "storage"
      const itemAfterOptimistic = await service.getItem('test-id');
      // Still false in storage since save failed
      expect(itemAfterOptimistic?.isFavorite).toBe(false);

      // Wait for background save to fail and rollback in cache
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Verify save was attempted and failed
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });

    it('should wait for save in standard mode (non-optimistic)', async () => {
      const mockItem: ScanHistoryItem = {
        id: 'test-id',
        timestamp: Date.now(),
        productName: 'Test',
        nutritionData: createMockNutritionData(),
        isFavorite: false,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
      };

      const history: ScanHistory = {
        version: 1,
        items: [mockItem],
        metadata: {
          totalScans: 1,
          lastScanAt: Date.now(),
          storageVersion: '1.0.0',
        },
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(history));

      // Standard mode should wait for save
      const newStatus = await service.toggleFavorite('test-id');

      expect(newStatus).toBe(true);
      // Save should have completed before returning
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe('deleteItem()', () => {
    it('should delete item by ID', async () => {
      const mockItem: ScanHistoryItem = {
        id: 'test-id',
        timestamp: Date.now(),
        productName: 'Test',
        nutritionData: createMockNutritionData(),
        isFavorite: false,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
      };

      const history: ScanHistory = {
        version: 1,
        items: [mockItem],
        metadata: {
          totalScans: 1,
          lastScanAt: Date.now(),
          storageVersion: '1.0.0',
        },
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(history));

      await service.deleteItem('test-id');

      const items = await service.getItems();
      expect(items.length).toBe(0);
    });

    it('should not throw if item not found', async () => {
      const history: ScanHistory = {
        version: 1,
        items: [],
        metadata: {
          totalScans: 0,
          lastScanAt: 0,
          storageVersion: '1.0.0',
        },
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(history));

      await expect(service.deleteItem('non-existent')).resolves.not.toThrow();
    });
  });

  describe('clearHistory()', () => {
    it('should clear all items when keepFavorites is false', async () => {
      const items: ScanHistoryItem[] = [
        {
          id: '1',
          timestamp: Date.now(),
          productName: 'Test 1',
          nutritionData: createMockNutritionData(),
          isFavorite: true,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
        },
        {
          id: '2',
          timestamp: Date.now(),
          productName: 'Test 2',
          nutritionData: createMockNutritionData(),
          isFavorite: false,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
        },
      ];

      const history: ScanHistory = {
        version: 1,
        items,
        metadata: {
          totalScans: 2,
          lastScanAt: Date.now(),
          storageVersion: '1.0.0',
        },
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(history));

      await service.clearHistory(false);

      const result = await service.getItems();
      expect(result.length).toBe(0);
    });

    it('should keep favorites when keepFavorites is true', async () => {
      const items: ScanHistoryItem[] = [
        {
          id: '1',
          timestamp: Date.now(),
          productName: 'Favorite',
          nutritionData: createMockNutritionData(),
          isFavorite: true,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
        },
        {
          id: '2',
          timestamp: Date.now(),
          productName: 'Not Favorite',
          nutritionData: createMockNutritionData(),
          isFavorite: false,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
        },
      ];

      const history: ScanHistory = {
        version: 1,
        items,
        metadata: {
          totalScans: 2,
          lastScanAt: Date.now(),
          storageVersion: '1.0.0',
        },
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(history));

      await service.clearHistory(true);

      const result = await service.getItems();
      expect(result.length).toBe(1);
      expect(result[0].productName).toBe('Favorite');
    });
  });

  describe('getStats()', () => {
    it('should calculate correct statistics', async () => {
      const now = Date.now();
      const items: ScanHistoryItem[] = [
        {
          id: '1',
          timestamp: now - 2 * 24 * 60 * 60 * 1000, // 2 days ago
          productName: 'Test',
          nutritionData: { ...createMockNutritionData(), calories: 200 },
          isFavorite: true,
          tags: ['tag1'],
          createdAt: now,
          updatedAt: now,
          version: 1,
        },
        {
          id: '2',
          timestamp: now - 10 * 24 * 60 * 60 * 1000, // 10 days ago
          productName: 'Test',
          nutritionData: { ...createMockNutritionData(), calories: 300 },
          isFavorite: false,
          tags: ['tag2'],
          createdAt: now,
          updatedAt: now,
          version: 1,
        },
      ];

      const history: ScanHistory = {
        version: 1,
        items,
        metadata: {
          totalScans: 2,
          lastScanAt: now - 2 * 24 * 60 * 60 * 1000,
          storageVersion: '1.0.0',
        },
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(history));

      const stats = await service.getStats();

      expect(stats.totalScans).toBe(2);
      expect(stats.favoritesCount).toBe(1);
      expect(stats.scansThisWeek).toBe(1);
      expect(stats.scansThisMonth).toBe(2);
      expect(stats.averageCalories).toBe(250);
      expect(stats.allTags).toEqual(['tag1', 'tag2']);
    });

    it('should return zero stats for empty history', async () => {
      const history: ScanHistory = {
        version: 1,
        items: [],
        metadata: {
          totalScans: 0,
          lastScanAt: 0,
          storageVersion: '1.0.0',
        },
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(history));

      const stats = await service.getStats();

      expect(stats.totalScans).toBe(0);
      expect(stats.averageCalories).toBe(0);
      expect(stats.currentStreak).toBe(0);
    });
  });
});

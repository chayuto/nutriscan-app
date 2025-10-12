/**
 * History Service
 *
 * Manages scan history storage and retrieval using expo-secure-store.
 * Implements JSON-based storage with caching, filtering, and statistics.
 *
 * Features:
 * - CRUD operations for scan history items
 * - In-memory caching with 5-minute TTL
 * - Filtering, sorting, and pagination
 * - Statistics aggregation
 * - Export/import functionality
 * - 1000 item limit enforcement
 *
 * @see docs/SPRINT-4-HISTORY-FAVORITES.md for complete specification
 */

import * as SecureStore from 'expo-secure-store';
import type {
  ScanHistory,
  ScanHistoryItem,
  HistoryFilter,
  HistoryStats,
  ExportOptions,
  ExportResult,
  ImportValidation,
} from '@/types/history.types';

const STORAGE_KEY = 'nutriscan_history';
const STORAGE_VERSION = '1.0.0';
const MAX_ITEMS = 1000;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Service class for managing scan history
 *
 * Uses singleton pattern with in-memory cache for performance.
 */
export class HistoryService {
  private cache: {
    data: ScanHistory | null;
    timestamp: number | null;
  } = {
    data: null,
    timestamp: null,
  };

  /**
   * Initialize storage with empty history structure
   * Safe to call multiple times (won't overwrite existing data)
   */
  async initialize(): Promise<void> {
    try {
      await this.retryOperation(async () => {
        const existing = await SecureStore.getItemAsync(STORAGE_KEY);

        if (!existing) {
          const emptyHistory: ScanHistory = {
            version: 1,
            items: [],
            metadata: {
              totalScans: 0,
              lastScanAt: 0,
              storageVersion: STORAGE_VERSION,
            },
          };

          await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(emptyHistory));
          this.cache.data = emptyHistory;
          this.cache.timestamp = Date.now();
        }
      });
    } catch (error) {
      console.error('[HistoryService] Failed to initialize:', error);
      throw new Error('Failed to initialize history storage');
    }
  }

  /**
   * Load history from storage with caching
   * Returns cached data if within TTL, otherwise fetches from storage
   */
  async load(): Promise<ScanHistory | null> {
    try {
      // Check cache
      if (
        this.cache.data &&
        this.cache.timestamp &&
        Date.now() - this.cache.timestamp < CACHE_TTL
      ) {
        return this.cache.data;
      }

      // Load from storage with retry
      return await this.retryOperation(async () => {
        const data = await SecureStore.getItemAsync(STORAGE_KEY);

        if (!data) {
          return null;
        }

        // Parse and validate data
        try {
          const history: ScanHistory = JSON.parse(data);

          // Validate structure
          if (!this.isValidHistory(history)) {
            console.warn(
              '[HistoryService] Invalid history structure, backing up and reinitializing'
            );
            await this.backupCorruptedData(data);
            // Clear the corrupted data and initialize fresh
            await SecureStore.setItemAsync(STORAGE_KEY, ''); // Clear corrupted data
            await this.initialize();
            // Return the newly initialized empty history from cache
            return this.cache.data;
          }

          // Update cache
          this.cache.data = history;
          this.cache.timestamp = Date.now();

          return history;
        } catch (parseError) {
          console.error('[HistoryService] Failed to parse history, resetting:', parseError);
          await this.backupCorruptedData(data);
          // Clear the corrupted data and initialize fresh
          await SecureStore.setItemAsync(STORAGE_KEY, ''); // Clear corrupted data
          await this.initialize();
          // Return the newly initialized empty history from cache
          return this.cache.data;
        }
      });
    } catch (error) {
      console.error('[HistoryService] Failed to load history:', error);
      throw new Error('Failed to load history');
    }
  }

  /**
   * Validate history structure
   * @internal
   */
  private isValidHistory(history: unknown): history is ScanHistory {
    if (typeof history !== 'object' || history === null) {
      return false;
    }

    const h = history as Record<string, unknown>;

    return (
      typeof h.version === 'number' &&
      Array.isArray(h.items) &&
      typeof h.metadata === 'object' &&
      h.metadata !== null &&
      typeof (h.metadata as Record<string, unknown>).totalScans === 'number' &&
      typeof (h.metadata as Record<string, unknown>).lastScanAt === 'number' &&
      typeof (h.metadata as Record<string, unknown>).storageVersion === 'string'
    );
  }

  /**
   * Backup corrupted data for recovery
   * @internal
   */
  private async backupCorruptedData(data: string): Promise<void> {
    try {
      const backupKey = `${STORAGE_KEY}_backup_${Date.now()}`;
      await SecureStore.setItemAsync(backupKey, data);
      console.warn(`[HistoryService] Corrupted data backed up to: ${backupKey}`);
    } catch (error) {
      console.error('[HistoryService] Failed to backup corrupted data:', error);
      // Don't throw - backup is nice-to-have
    }
  }

  /**
   * Save history to storage and update cache
   */
  async save(history: ScanHistory): Promise<void> {
    try {
      await this.retryOperation(async () => {
        await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(history));
      });

      // Update cache after successful save
      this.cache.data = history;
      this.cache.timestamp = Date.now();
    } catch (error) {
      console.error('[HistoryService] Failed to save history:', error);
      throw new Error('Failed to save history');
    }
  }

  /**
   * Clear cache (for testing purposes)
   * @internal
   */
  clearCache(): void {
    this.cache = { data: null, timestamp: null };
  }

  /**
   * Retry an async operation with exponential backoff
   * @internal
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelayMs: number = 100
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        const errorMessage = (error as Error).message || '';

        // Don't retry on non-retryable errors
        if (errorMessage.includes('not initialized') || errorMessage.includes('Storage full')) {
          throw error;
        }

        // Retry with exponential backoff
        if (attempt < maxRetries) {
          const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError;
  }

  /**
   * Generate unique ID (UUID v4 style)
   */
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Add new scan to history
   * Enforces 1000 item limit (removes oldest non-favorite if needed)
   *
   * @returns ID of newly created item
   */
  async addScan(
    item: Omit<ScanHistoryItem, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<string> {
    const history = await this.load();
    if (!history) throw new Error('History not initialized');

    // Check limit
    if (history.items.length >= MAX_ITEMS) {
      // Remove oldest non-favorite
      const oldestIndex = history.items.findIndex((item) => !item.isFavorite);
      if (oldestIndex !== -1) {
        history.items.splice(oldestIndex, 1);
      } else {
        throw new Error('Storage full. Please remove some favorites.');
      }
    }

    const newItem: ScanHistoryItem = {
      ...item,
      id: this.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
    };

    history.items.unshift(newItem); // Add to beginning (newest first)
    history.metadata.totalScans++;
    history.metadata.lastScanAt = newItem.timestamp;

    await this.save(history);
    return newItem.id;
  }

  /**
   * Get all items with optional filtering and sorting
   */
  async getItems(filter?: HistoryFilter): Promise<ScanHistoryItem[]> {
    const history = await this.load();
    if (!history) return [];

    let items = [...history.items];

    // Apply filters
    if (filter) {
      // Search filter
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        items = items.filter(
          (item) =>
            item.productName?.toLowerCase().includes(query) ||
            item.brandName?.toLowerCase().includes(query) ||
            item.notes?.toLowerCase().includes(query)
        );
      }

      // Favorite filter
      if (filter.isFavorite !== undefined) {
        items = items.filter((item) => item.isFavorite === filter.isFavorite);
      }

      // Date range filter
      if (filter.dateRange) {
        const { start, end } = filter.dateRange;
        items = items.filter((item) => item.timestamp >= start && item.timestamp <= end);
      }

      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        const filterTags = filter.tags;
        items = items.filter((item) => filterTags.some((tag) => item.tags.includes(tag)));
      }

      // Sorting
      items.sort((a, b) => {
        let comparison = 0;
        switch (filter.sortBy) {
          case 'date':
            comparison = b.timestamp - a.timestamp;
            break;
          case 'name':
            comparison = (a.productName || '').localeCompare(b.productName || '');
            break;
          case 'favorite':
            comparison = (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
            break;
        }
        return filter.sortOrder === 'asc' ? comparison : -comparison;
      });

      // Pagination
      if (filter.limit !== undefined) {
        const offset = filter.offset || 0;
        items = items.slice(offset, offset + filter.limit);
      }
    }

    return items;
  }

  /**
   * Get single item by ID
   */
  async getItem(id: string): Promise<ScanHistoryItem | null> {
    const history = await this.load();
    if (!history) return null;

    return history.items.find((item) => item.id === id) || null;
  }

  /**
   * Update existing item
   */
  async updateItem(id: string, updates: Partial<ScanHistoryItem>): Promise<void> {
    const history = await this.load();
    if (!history) throw new Error('History not initialized');

    const itemIndex = history.items.findIndex((item) => item.id === id);
    if (itemIndex === -1) throw new Error('Item not found');

    history.items[itemIndex] = {
      ...history.items[itemIndex],
      ...updates,
      updatedAt: Date.now(),
      version: history.items[itemIndex].version + 1,
    };

    await this.save(history);
  }

  /**
   * Toggle favorite status with optional optimistic update support
   *
   * Standard mode (default):
   * - Updates cache and storage
   * - Waits for save to complete (~150ms)
   * - Returns new favorite status
   *
   * Optimistic mode ({ optimistic: true }):
   * - Updates cache immediately
   * - Returns new status instantly (<10ms)
   * - Saves in background
   * - Auto-rollback on save failure
   *
   * @param id - Item ID to toggle
   * @param options - Optional configuration
   * @param options.optimistic - If true, return immediately and save in background
   * @returns New favorite status
   *
   * @example
   * // Standard mode (wait for save)
   * const newStatus = await historyService.toggleFavorite('item-123');
   *
   * @example
   * // Optimistic mode (instant UI feedback)
   * const newStatus = await historyService.toggleFavorite('item-123', { optimistic: true });
   */
  async toggleFavorite(id: string, options?: { optimistic?: boolean }): Promise<boolean> {
    const history = await this.load();
    if (!history) throw new Error('History not initialized');

    const item = history.items.find((i) => i.id === id);
    if (!item) throw new Error('Item not found');

    const newStatus = !item.isFavorite;

    // Update cache immediately
    item.isFavorite = newStatus;
    item.updatedAt = Date.now();
    item.version++;

    if (options?.optimistic) {
      // Optimistic path: return immediately, save in background
      this.save(history).catch((error) => {
        console.error('[HistoryService] Failed to save favorite toggle:', error);
        // Rollback in cache on failure
        item.isFavorite = !newStatus;
        item.updatedAt = Date.now();
        item.version--;
      });

      return newStatus;
    }

    // Standard path: wait for save to complete
    await this.save(history);
    return newStatus;
  }

  /**
   * Delete item by ID
   */
  async deleteItem(id: string): Promise<void> {
    const history = await this.load();
    if (!history) throw new Error('History not initialized');

    const index = history.items.findIndex((item) => item.id === id);
    if (index !== -1) {
      history.items.splice(index, 1);
      history.metadata.totalScans--;
      await this.save(history);
    }
  }

  /**
   * Delete multiple items by IDs (batch operation)
   *
   * More efficient than calling deleteItem() multiple times.
   * Uses Set for O(1) lookup instead of O(n) per item.
   *
   * @param ids - Array of item IDs to delete
   * @returns Number of items successfully deleted
   *
   * @example
   * // Delete 3 items in one operation
   * const deletedCount = await historyService.deleteItems(['id1', 'id2', 'id3']);
   * console.log(`Deleted ${deletedCount} items`);
   *
   * @example
   * // Delete all non-favorite items
   * const allItems = await historyService.getItems({ isFavorite: false });
   * const ids = allItems.map(item => item.id);
   * await historyService.deleteItems(ids);
   */
  async deleteItems(ids: string[]): Promise<number> {
    const history = await this.load();
    if (!history) throw new Error('History not initialized');

    // Use Set for O(1) lookup instead of O(n) per item
    const idsSet = new Set(ids);
    const initialLength = history.items.length;

    // Filter out items to delete
    history.items = history.items.filter((item) => !idsSet.has(item.id));

    const deletedCount = initialLength - history.items.length;
    history.metadata.totalScans = history.items.length;

    // Update lastScanAt if items were deleted
    if (deletedCount > 0) {
      if (history.items.length > 0) {
        history.metadata.lastScanAt = Math.max(...history.items.map((item) => item.timestamp));
      } else {
        history.metadata.lastScanAt = 0;
      }
      await this.save(history);
    }

    return deletedCount;
  }

  /**
   * Toggle favorite status for multiple items (batch operation)
   *
   * More efficient than calling toggleFavorite() multiple times.
   * Only saves once after all updates are applied.
   *
   * @param ids - Array of item IDs to update
   * @param isFavorite - New favorite status to set
   * @returns Number of items successfully updated
   *
   * @example
   * // Mark multiple items as favorites
   * const count = await historyService.toggleFavorites(['id1', 'id2', 'id3'], true);
   *
   * @example
   * // Unfavorite all items from a specific brand
   * const brandItems = await historyService.getItems({ searchQuery: 'Brand X' });
   * const ids = brandItems.map(item => item.id);
   * await historyService.toggleFavorites(ids, false);
   */
  async toggleFavorites(ids: string[], isFavorite: boolean): Promise<number> {
    const history = await this.load();
    if (!history) throw new Error('History not initialized');

    // Use Set for O(1) lookup
    const idsSet = new Set(ids);
    let updatedCount = 0;

    // Update all matching items
    history.items.forEach((item) => {
      if (idsSet.has(item.id) && item.isFavorite !== isFavorite) {
        item.isFavorite = isFavorite;
        item.updatedAt = Date.now();
        item.version++;
        updatedCount++;
      }
    });

    // Only save if items were actually updated
    if (updatedCount > 0) {
      await this.save(history);
    }

    return updatedCount;
  }

  /**
   * Clear all history items
   * @param keepFavorites - If true, only remove non-favorites
   */
  async clearHistory(keepFavorites: boolean = true): Promise<void> {
    const history = await this.load();
    if (!history) throw new Error('History not initialized');

    if (keepFavorites) {
      history.items = history.items.filter((item) => item.isFavorite);
    } else {
      history.items = [];
    }

    history.metadata.totalScans = history.items.length;
    if (history.items.length > 0) {
      history.metadata.lastScanAt = Math.max(...history.items.map((item) => item.timestamp));
    } else {
      history.metadata.lastScanAt = 0;
    }

    await this.save(history);
  }

  /**
   * Get aggregated statistics
   */
  async getStats(): Promise<HistoryStats> {
    const history = await this.load();
    if (!history || history.items.length === 0) {
      return {
        totalScans: 0,
        favoritesCount: 0,
        scansThisWeek: 0,
        scansThisMonth: 0,
        averageCalories: 0,
        lastScanAt: 0,
        currentStreak: 0,
        allTags: [],
      };
    }

    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const stats: HistoryStats = {
      totalScans: history.items.length,
      favoritesCount: history.items.filter((item) => item.isFavorite).length,
      scansThisWeek: history.items.filter((item) => item.timestamp >= weekAgo).length,
      scansThisMonth: history.items.filter((item) => item.timestamp >= monthAgo).length,
      averageCalories:
        history.items.reduce((sum, item) => sum + (item.nutritionData.calories || 0), 0) /
        history.items.length,
      lastScanAt: history.metadata.lastScanAt,
      firstScanAt: Math.min(...history.items.map((item) => item.timestamp)),
      currentStreak: this.calculateStreak(history.items),
      allTags: Array.from(new Set(history.items.flatMap((item) => item.tags))),
    };

    // Most scanned product
    const productCounts = new Map<string, number>();
    history.items.forEach((item) => {
      if (item.productName) {
        productCounts.set(item.productName, (productCounts.get(item.productName) || 0) + 1);
      }
    });

    if (productCounts.size > 0) {
      const [mostScanned] = Array.from(productCounts.entries()).sort((a, b) => b[1] - a[1]);
      stats.mostScannedProduct = mostScanned[0];
    }

    return stats;
  }

  /**
   * Calculate current streak (consecutive days with scans)
   */
  private calculateStreak(items: ScanHistoryItem[]): number {
    if (items.length === 0) return 0;

    const sortedDates = items
      .map((item) => new Date(item.timestamp).toDateString())
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 1;
    const today = new Date().toDateString();

    if (sortedDates[0] !== today) {
      // No scan today, check if yesterday
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      if (sortedDates[0] !== yesterday) return 0;
    }

    for (let i = 1; i < sortedDates.length; i++) {
      const current = new Date(sortedDates[i - 1]);
      const next = new Date(sortedDates[i]);
      const diffDays = Math.floor((current.getTime() - next.getTime()) / (24 * 60 * 60 * 1000));

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Export history data (placeholder for future implementation)
   */
  async exportData(_options: ExportOptions): Promise<ExportResult> {
    // TODO: Implement in Phase 2
    throw new Error('Export not yet implemented');
  }

  /**
   * Import history data (placeholder for future implementation)
   */
  async importData(_data: string): Promise<ImportValidation> {
    // TODO: Implement in Phase 2
    throw new Error('Import not yet implemented');
  }
}

// Export singleton instance
export const historyService = new HistoryService();

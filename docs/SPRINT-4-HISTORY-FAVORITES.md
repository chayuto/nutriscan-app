# Sprint 4: Scan History & Favorites

**Sprint Goal**: Implement persistent scan history and favorites functionality with a simple JSON storage solution that's architected for future migration to a database.

**Timeline**: 2 weeks (10 working days)  
**Priority**: Medium (Post-MVP enhancement)  
**Status**: Planning 📋

**Related Documents:**
- **UI/UX Design**: [SPRINT-4-UI-UX-SPECS.md](./SPRINT-4-UI-UX-SPECS.md) ⭐
- **Quick Reference**: [SPRINT-4-QUICK-REF.md](./SPRINT-4-QUICK-REF.md)
- **Architecture Decision**: [ARCHITECTURE-DECISIONS.md](./ARCHITECTURE-DECISIONS.md#adr-001-json-storage-for-history-sprint-4)

---

## 🎯 Sprint Objectives

### Primary Goals
1. ✅ Users can save nutrition scan results to history
2. ✅ Users can view, search, and filter scan history
3. ✅ Users can mark scans as favorites
4. ✅ Users can add/edit product names for each scan
5. ✅ History persists across app restarts
6. ✅ Graceful handling of storage limits

### Success Metrics
- Save scan success rate: 99%+
- History retrieval time: < 100ms
- Support for 500+ scans without performance degradation
- Test coverage: 85%+

---

## 🏗️ Architecture Overview

### Storage Strategy: JSON-Based (Phase 1)

**Why JSON Store?**
- ✅ Simple implementation (1-2 days vs 1 week for SQLite)
- ✅ No complex migrations needed
- ✅ Low volume (estimated < 1000 entries in first year)
- ✅ No relationships (flat structure)
- ✅ Easy to debug and inspect
- ✅ Flexible schema changes
- ✅ Built-in expo-secure-store integration

**Trade-offs Accepted:**
- ⚠️ Linear search O(n) - acceptable for < 1000 items
- ⚠️ Full file read/write on updates - acceptable for small datasets
- ⚠️ Memory overhead when loading all data

**Migration Path (Phase 2 - Future):**
```
JSON Store → SQLite → Cloud Database
(< 1K items)  (1K-10K)   (10K+ / multi-device)
```

---

## 📊 Data Model

### Core Types

```typescript
// src/types/history.types.ts

/**
 * Single scan entry in history
 */
export interface ScanHistoryItem {
  id: string;                           // UUID v4
  timestamp: number;                    // Unix timestamp (ms)
  productName?: string;                 // User-editable name
  brandName?: string;                   // User-editable brand
  nutritionData: NutritionData;         // From existing type
  imageUri?: string;                    // Local file path or base64
  isFavorite: boolean;                  // Quick access flag
  tags: string[];                       // User-defined tags
  notes?: string;                       // User notes
  
  // Metadata
  createdAt: number;                    // Creation timestamp
  updatedAt: number;                    // Last modified
  version: number;                      // Schema version (for migrations)
}

/**
 * Complete history storage structure
 */
export interface ScanHistory {
  version: number;                      // Storage schema version (1)
  items: ScanHistoryItem[];             // All scans
  metadata: {
    totalScans: number;
    lastScanAt: number;
    storageVersion: string;             // "1.0.0"
  };
}

/**
 * Filter and sort options
 */
export interface HistoryFilter {
  searchQuery?: string;                 // Search in productName, brandName
  isFavorite?: boolean;                 // Show only favorites
  dateRange?: {                         // Date range filter
    start: number;
    end: number;
  };
  tags?: string[];                      // Filter by tags
  sortBy: 'date' | 'name' | 'favorite'; // Sort field
  sortOrder: 'asc' | 'desc';            // Sort direction
  limit?: number;                       // Pagination limit
  offset?: number;                      // Pagination offset
}

/**
 * Statistics for history overview
 */
export interface HistoryStats {
  totalScans: number;
  favoritesCount: number;
  thisWeekCount: number;
  thisMonthCount: number;
  averageCalories: number;
  topTags: Array<{ tag: string; count: number }>;
  storageSize: number;                  // Bytes
  oldestScan?: number;                  // Timestamp
  newestScan?: number;                  // Timestamp
}
```

---

## 🔧 Service Layer

### HistoryService Implementation

```typescript
// src/services/history.service.ts

import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import { ScanHistory, ScanHistoryItem, HistoryFilter, HistoryStats } from '@/types/history.types';

const HISTORY_STORAGE_KEY = 'nutriscan_scan_history';
const MAX_ITEMS = 1000;                           // Hard limit
const MAX_IMAGE_SIZE_MB = 1;                      // Per image
const MAX_TOTAL_SIZE_MB = 100;                    // Total storage

class HistoryService {
  private cache: ScanHistory | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000;    // 5 minutes

  /**
   * Initialize history storage (create if not exists)
   */
  async initialize(): Promise<void> {
    try {
      const existing = await this.load();
      if (!existing) {
        await this.save({
          version: 1,
          items: [],
          metadata: {
            totalScans: 0,
            lastScanAt: 0,
            storageVersion: '1.0.0',
          },
        });
      }
    } catch (error) {
      console.error('Failed to initialize history:', error);
      throw new Error('History initialization failed');
    }
  }

  /**
   * Load complete history from storage
   * Uses cache to reduce SecureStore reads
   */
  private async load(): Promise<ScanHistory | null> {
    const now = Date.now();
    
    // Return cache if valid
    if (this.cache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.cache;
    }

    try {
      const json = await SecureStore.getItemAsync(HISTORY_STORAGE_KEY);
      if (!json) return null;

      const history = JSON.parse(json) as ScanHistory;
      
      // Validate schema version
      if (history.version !== 1) {
        await this.migrate(history);
      }

      // Update cache
      this.cache = history;
      this.cacheTimestamp = now;

      return history;
    } catch (error) {
      console.error('Failed to load history:', error);
      return null;
    }
  }

  /**
   * Save complete history to storage
   */
  private async save(history: ScanHistory): Promise<void> {
    try {
      const json = JSON.stringify(history);
      const sizeInMB = new Blob([json]).size / (1024 * 1024);

      if (sizeInMB > MAX_TOTAL_SIZE_MB) {
        throw new Error(`Storage limit exceeded: ${sizeInMB.toFixed(2)}MB > ${MAX_TOTAL_SIZE_MB}MB`);
      }

      await SecureStore.setItemAsync(HISTORY_STORAGE_KEY, json);
      
      // Update cache
      this.cache = history;
      this.cacheTimestamp = Date.now();
    } catch (error) {
      console.error('Failed to save history:', error);
      throw new Error('History save failed');
    }
  }

  /**
   * Add new scan to history
   */
  async addScan(item: Omit<ScanHistoryItem, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<string> {
    const history = await this.load() || this.createEmpty();

    // Check limit
    if (history.items.length >= MAX_ITEMS) {
      // Auto-remove oldest non-favorite item
      const oldestIndex = history.items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => !item.isFavorite)
        .sort((a, b) => a.item.timestamp - b.item.timestamp)[0]?.index;

      if (oldestIndex !== undefined) {
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

    history.items.unshift(newItem);  // Add to beginning (newest first)
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
          item =>
            item.productName?.toLowerCase().includes(query) ||
            item.brandName?.toLowerCase().includes(query) ||
            item.notes?.toLowerCase().includes(query)
        );
      }

      // Favorite filter
      if (filter.isFavorite !== undefined) {
        items = items.filter(item => item.isFavorite === filter.isFavorite);
      }

      // Date range filter
      if (filter.dateRange) {
        items = items.filter(
          item =>
            item.timestamp >= filter.dateRange!.start &&
            item.timestamp <= filter.dateRange!.end
        );
      }

      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        items = items.filter(item =>
          filter.tags!.some(tag => item.tags.includes(tag))
        );
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
        return filter.sortOrder === 'asc' ? -comparison : comparison;
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

    return history.items.find(item => item.id === id) || null;
  }

  /**
   * Update existing item
   */
  async updateItem(id: string, updates: Partial<ScanHistoryItem>): Promise<void> {
    const history = await this.load();
    if (!history) throw new Error('History not initialized');

    const index = history.items.findIndex(item => item.id === id);
    if (index === -1) throw new Error('Item not found');

    history.items[index] = {
      ...history.items[index],
      ...updates,
      id, // Prevent ID change
      updatedAt: Date.now(),
    };

    await this.save(history);
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string): Promise<boolean> {
    const history = await this.load();
    if (!history) throw new Error('History not initialized');

    const item = history.items.find(item => item.id === id);
    if (!item) throw new Error('Item not found');

    item.isFavorite = !item.isFavorite;
    item.updatedAt = Date.now();

    await this.save(history);
    return item.isFavorite;
  }

  /**
   * Delete item by ID
   */
  async deleteItem(id: string): Promise<void> {
    const history = await this.load();
    if (!history) throw new Error('History not initialized');

    const index = history.items.findIndex(item => item.id === id);
    if (index === -1) throw new Error('Item not found');

    history.items.splice(index, 1);
    await this.save(history);
  }

  /**
   * Clear all history (except favorites if specified)
   */
  async clearHistory(keepFavorites: boolean = true): Promise<void> {
    const history = await this.load();
    if (!history) return;

    if (keepFavorites) {
      history.items = history.items.filter(item => item.isFavorite);
    } else {
      history.items = [];
    }

    history.metadata.totalScans = history.items.length;
    await this.save(history);
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<HistoryStats> {
    const history = await this.load();
    if (!history || history.items.length === 0) {
      return {
        totalScans: 0,
        favoritesCount: 0,
        thisWeekCount: 0,
        thisMonthCount: 0,
        averageCalories: 0,
        topTags: [],
        storageSize: 0,
      };
    }

    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const thisWeekCount = history.items.filter(item => item.timestamp >= weekAgo).length;
    const thisMonthCount = history.items.filter(item => item.timestamp >= monthAgo).length;

    const totalCalories = history.items.reduce(
      (sum, item) => sum + (item.nutritionData.calories || 0),
      0
    );

    const tagCounts = new Map<string, number>();
    history.items.forEach(item => {
      item.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const json = JSON.stringify(history);
    const storageSize = new Blob([json]).size;

    return {
      totalScans: history.items.length,
      favoritesCount: history.items.filter(item => item.isFavorite).length,
      thisWeekCount,
      thisMonthCount,
      averageCalories: history.items.length > 0 ? totalCalories / history.items.length : 0,
      topTags,
      storageSize,
      oldestScan: history.items[history.items.length - 1]?.timestamp,
      newestScan: history.items[0]?.timestamp,
    };
  }

  /**
   * Export history as JSON
   */
  async exportData(): Promise<string> {
    const history = await this.load();
    if (!history) throw new Error('No history to export');

    return JSON.stringify(history, null, 2);
  }

  /**
   * Import history from JSON (merge or replace)
   */
  async importData(json: string, merge: boolean = false): Promise<void> {
    const imported = JSON.parse(json) as ScanHistory;
    
    if (merge) {
      const existing = await this.load();
      if (existing) {
        // Merge items, avoiding duplicates
        const existingIds = new Set(existing.items.map(item => item.id));
        const newItems = imported.items.filter(item => !existingIds.has(item.id));
        existing.items.push(...newItems);
        await this.save(existing);
      } else {
        await this.save(imported);
      }
    } else {
      await this.save(imported);
    }
  }

  // Private helpers

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private createEmpty(): ScanHistory {
    return {
      version: 1,
      items: [],
      metadata: {
        totalScans: 0,
        lastScanAt: 0,
        storageVersion: '1.0.0',
      },
    };
  }

  /**
   * Schema migration (future-proofing)
   */
  private async migrate(history: ScanHistory): Promise<void> {
    // Placeholder for future schema migrations
    // Example: v1 → v2, v2 → v3, etc.
    console.log('Schema migration not needed');
  }
}

export const historyService = new HistoryService();
```

---

## 🎣 Custom Hooks

### useHistory Hook

```typescript
// src/hooks/useHistory.ts

import { useState, useEffect, useCallback } from 'react';
import { historyService } from '@/services/history.service';
import { ScanHistoryItem, HistoryFilter, HistoryStats } from '@/types/history.types';

export function useHistory() {
  const [items, setItems] = useState<ScanHistoryItem[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load items with optional filter
  const loadItems = useCallback(async (filter?: HistoryFilter) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await historyService.getItems(filter);
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const data = await historyService.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  // Add new scan
  const addScan = useCallback(async (item: Omit<ScanHistoryItem, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
    setError(null);
    try {
      const id = await historyService.addScan(item);
      await loadItems(); // Refresh list
      await loadStats();
      return id;
    } catch (err: any) {
      setError(err.message || 'Failed to add scan');
      throw err;
    }
  }, [loadItems, loadStats]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (id: string) => {
    try {
      const newStatus = await historyService.toggleFavorite(id);
      await loadItems(); // Refresh list
      return newStatus;
    } catch (err: any) {
      setError(err.message || 'Failed to toggle favorite');
      throw err;
    }
  }, [loadItems]);

  // Delete item
  const deleteItem = useCallback(async (id: string) => {
    try {
      await historyService.deleteItem(id);
      await loadItems(); // Refresh list
      await loadStats();
    } catch (err: any) {
      setError(err.message || 'Failed to delete item');
      throw err;
    }
  }, [loadItems, loadStats]);

  // Clear history
  const clearHistory = useCallback(async (keepFavorites: boolean = true) => {
    try {
      await historyService.clearHistory(keepFavorites);
      await loadItems();
      await loadStats();
    } catch (err: any) {
      setError(err.message || 'Failed to clear history');
      throw err;
    }
  }, [loadItems, loadStats]);

  // Initialize on mount
  useEffect(() => {
    historyService.initialize().then(() => {
      loadItems();
      loadStats();
    });
  }, [loadItems, loadStats]);

  return {
    items,
    stats,
    isLoading,
    error,
    loadItems,
    loadStats,
    addScan,
    toggleFavorite,
    deleteItem,
    clearHistory,
  };
}
```

---

## 🎨 UI Components

### Components to Build

1. **HistoryListItem** - Single history entry card
2. **HistoryList** - Scrollable list with pull-to-refresh
3. **HistoryEmptyState** - Empty state illustration
4. **FavoriteButton** - Heart icon toggle
5. **SearchBar** - Search and filter UI
6. **HistoryStats** - Statistics dashboard
7. **HistoryDetailModal** - Full item view with edit
8. **ExportImportDialog** - Data management

---

## 📱 Screens

### HistoryScreen (New)

```
┌─────────────────────────┐
│  [← Back]  History  [⚙️]│
│                         │
│  ┌───────────────────┐  │
│  │ 🔍 Search...      │  │
│  └───────────────────┘  │
│                         │
│  📊 Stats Card          │
│  • 15 scans this week   │
│  • 8 favorites          │
│                         │
│  [All] [Favorites] [⋮]  │
│                         │
│  ╔═══════════════════╗  │
│  ║ [🖼️] Product Name ║  │
│  ║ Brand • 2 days ago║  │
│  ║ 250 kcal  [❤️]    ║  │
│  ╚═══════════════════╝  │
│                         │
│  ╔═══════════════════╗  │
│  ║ [🖼️] Product Name ║  │
│  ║ Brand • 1 week ago║  │
│  ║ 350 kcal  [♡]     ║  │
│  ╚═══════════════════╝  │
│                         │
└─────────────────────────┘
```

### Features:
- Search bar (real-time filter)
- Stats summary card
- Filter tabs (All / Favorites)
- List of scans with swipe actions
- Pull to refresh
- Tap to view details
- Empty state when no scans

---

## 🧪 Testing Strategy

### Unit Tests (8 test files)

```typescript
// __tests__/services/history.service.test.ts
describe('HistoryService', () => {
  beforeEach(() => {
    // Clear storage
  });

  describe('addScan', () => {
    it('should add new scan to history', async () => {});
    it('should generate unique ID', async () => {});
    it('should enforce MAX_ITEMS limit', async () => {});
    it('should throw when storage full of favorites', async () => {});
  });

  describe('getItems', () => {
    it('should return all items without filter', async () => {});
    it('should filter by search query', async () => {});
    it('should filter by favorites', async () => {});
    it('should filter by date range', async () => {});
    it('should sort by date/name/favorite', async () => {});
    it('should paginate results', async () => {});
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status', async () => {});
    it('should update timestamp', async () => {});
  });

  describe('getStats', () => {
    it('should calculate correct statistics', async () => {});
    it('should handle empty history', async () => {});
  });

  describe('exportData', () => {
    it('should export as JSON', async () => {});
  });

  describe('importData', () => {
    it('should import and merge data', async () => {});
    it('should import and replace data', async () => {});
  });
});

// __tests__/hooks/useHistory.test.ts
// Component tests for HistoryScreen, HistoryListItem, etc.
```

### Integration Tests

- End-to-end flow: Scan → Save → View History → Favorite → Delete
- Performance: Load 500 items in < 100ms
- Storage: Handle storage limit gracefully

---

## 📋 Implementation Phases

### **Phase 1: Foundation** (Days 1-2)

#### Tasks:
- [ ] Create `history.types.ts` with all type definitions
- [ ] Implement `HistoryService` base class
- [ ] Add `initialize()`, `load()`, `save()` methods
- [ ] Write unit tests for core service methods
- [ ] Test with 100+ items for performance baseline

**Deliverable**: Working HistoryService with tests

---

### **Phase 2: Service Methods** (Days 3-4)

#### Tasks:
- [ ] Implement `addScan()` with limit enforcement
- [ ] Implement `getItems()` with filtering and sorting
- [ ] Implement `toggleFavorite()`
- [ ] Implement `deleteItem()` and `clearHistory()`
- [ ] Implement `getStats()` for dashboard
- [ ] Add caching layer for performance
- [ ] Write comprehensive unit tests (85%+ coverage)

**Deliverable**: Complete HistoryService with full CRUD

---

### **Phase 3: Hooks** (Day 5)

#### Tasks:
- [ ] Implement `useHistory()` hook
- [ ] Add loading and error states
- [ ] Add auto-refresh on focus
- [ ] Write hook tests with mock service
- [ ] Test concurrent operations

**Deliverable**: useHistory hook ready for UI integration

---

### **Phase 4: UI Components** (Days 6-7)

#### Tasks:
- [ ] Create HistoryListItem component
- [ ] Create HistoryList with FlatList
- [ ] Create SearchBar component
- [ ] Create FavoriteButton with animation
- [ ] Create HistoryEmptyState
- [ ] Create HistoryStats card
- [ ] Add swipe-to-delete gesture
- [ ] Write component tests

**Deliverable**: Reusable history components

---

### **Phase 5: HistoryScreen** (Days 8-9)

#### Tasks:
- [ ] Create HistoryScreen with layout
- [ ] Integrate search and filter UI
- [ ] Add pull-to-refresh
- [ ] Add navigation from HomeScreen
- [ ] Implement detail modal
- [ ] Add empty state handling
- [ ] Polish animations and transitions
- [ ] Write screen tests

**Deliverable**: Complete HistoryScreen

---

### **Phase 6: Integration** (Day 10)

#### Tasks:
- [ ] Update ReportScreen to add "Save to History" button
- [ ] Auto-save scans after analysis (optional toggle in settings)
- [ ] Add history icon to HomeScreen
- [ ] Update navigation flow
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation updates

**Deliverable**: Fully integrated history feature

---

## 🚀 Future Migration Path (Phase 2)

### When to Migrate to SQLite

**Triggers:**
- > 1000 scans in storage
- Search performance > 200ms
- Users request advanced features:
  - Multi-device sync
  - Complex queries
  - Relationships (meal plans, comparisons)

### Migration Strategy

```typescript
// src/services/history.service.v2.ts (SQLite version)

import * as SQLite from 'expo-sqlite';

class HistoryServiceV2 {
  private db: SQLite.SQLiteDatabase;

  async migrate(): Promise<void> {
    // 1. Read existing JSON data
    const jsonHistory = await historyServiceV1.exportData();
    const data = JSON.parse(jsonHistory);

    // 2. Create SQLite tables
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS scans (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        product_name TEXT,
        brand_name TEXT,
        nutrition_data TEXT NOT NULL,
        image_uri TEXT,
        is_favorite INTEGER DEFAULT 0,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        version INTEGER DEFAULT 1
      );

      CREATE INDEX idx_timestamp ON scans(timestamp);
      CREATE INDEX idx_favorite ON scans(is_favorite);
      CREATE INDEX idx_product_name ON scans(product_name);

      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_id TEXT NOT NULL,
        tag TEXT NOT NULL,
        FOREIGN KEY(scan_id) REFERENCES scans(id)
      );

      CREATE INDEX idx_scan_id ON tags(scan_id);
    `);

    // 3. Bulk insert existing data
    for (const item of data.items) {
      await this.db.runAsync(
        'INSERT INTO scans (...) VALUES (...)',
        [/* values */]
      );
      
      for (const tag of item.tags) {
        await this.db.runAsync(
          'INSERT INTO tags (scan_id, tag) VALUES (?, ?)',
          [item.id, tag]
        );
      }
    }

    // 4. Verify migration
    const count = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM scans');
    console.log(`Migrated ${count} scans to SQLite`);
  }

  // Implement same interface as HistoryService
  // All method signatures remain the same
  async addScan(): Promise<string> { /* SQLite implementation */ }
  async getItems(): Promise<ScanHistoryItem[]> { /* SQLite implementation */ }
  // ...
}
```

### Phase 3: Cloud Database (Future)

**When:**
- Multi-device sync required
- > 10K scans
- Social features (sharing, comparisons)

**Options:**
- Firebase Realtime Database
- Supabase (PostgreSQL)
- AWS Amplify DataStore

---

## 📊 Performance Benchmarks

### Target Performance (JSON Store)

| Operation | Target | Method |
|-----------|--------|--------|
| Load 100 items | < 50ms | Cached read |
| Load 500 items | < 100ms | Cached read |
| Load 1000 items | < 200ms | Cached read |
| Search (100 items) | < 20ms | Array.filter |
| Search (500 items) | < 50ms | Array.filter |
| Add scan | < 30ms | Append + write |
| Toggle favorite | < 30ms | Update + write |
| Delete item | < 30ms | Splice + write |
| Get stats | < 50ms | Array.reduce |

### Monitoring Plan

```typescript
// Add performance metrics
const startTime = performance.now();
await historyService.getItems();
const duration = performance.now() - startTime;
console.log(`Load time: ${duration}ms`);
```

---

## 🔒 Data Privacy & Security

### Storage Security

- ✅ Uses `expo-secure-store` (encrypted at rest)
- ✅ No cloud sync (data stays on device)
- ✅ No third-party analytics on history data
- ✅ User-controlled export/delete

### Privacy Features

- [ ] Add "Clear History" in settings
- [ ] Add "Export Data" (GDPR compliance)
- [ ] Add "Auto-delete old scans" setting (30/60/90 days)
- [ ] Confirm before delete all

---

## 📝 Documentation Updates

### Files to Update

- [ ] `README.md` - Add history features to feature list
- [ ] `docs/01-architecture.md` - Add HistoryService section
- [ ] `docs/02-type-system.md` - Add history types
- [ ] `.github/copilot-instructions.md` - Add history patterns
- [ ] Create `docs/SPRINT-4-COMPLETE.md` (on completion)

---

## ✅ Acceptance Criteria

### Must Have
- [ ] Users can save scans to history
- [ ] Users can view list of all scans
- [ ] Users can mark scans as favorites
- [ ] Users can add/edit product names for scans
- [ ] Users can search scans by name
- [ ] Users can delete individual scans
- [ ] Favorites persist after app restart
- [ ] History shows newest scans first
- [ ] 85%+ test coverage
- [ ] No performance issues with 500 scans

### Should Have
- [ ] Stats dashboard (total scans, favorites count)
- [ ] Swipe to delete gesture
- [ ] Pull to refresh
- [ ] Empty state illustration
- [ ] Edit scan name/notes

### Nice to Have
- [ ] Export/import data
- [ ] Tags for categorization
- [ ] Date range filtering
- [ ] Comparison view (compare 2 scans)

---

## 🎯 Success Metrics

### Technical Metrics
- 319 → 400+ tests passing
- Test coverage: 85%+
- Load time: < 100ms (500 items)
- Zero crashes in history feature

### User Metrics (Post-Release)
- 80%+ of users save at least one scan
- 50%+ of users use favorites feature
- Average 20+ scans per active user
- < 1% error rate on save operation

---

## 🚧 Risks & Mitigations

### Risk 1: Storage Size Exceeds Device Limits
**Mitigation:**
- Enforce 1000 item hard limit
- Auto-compress old images
- Provide "Clear Old Scans" option

### Risk 2: Performance Degrades with Many Items
**Mitigation:**
- Implement caching layer
- Paginate list (50 items per page)
- Move to SQLite if > 1000 items

### Risk 3: Data Corruption
**Mitigation:**
- Validate JSON on load
- Auto-backup before writes
- Provide "Reset History" option

---

## � Future Considerations (Post-Sprint 4)

### Image Storage Optimization

**Current Approach (Sprint 4):**
- Store full resolution image URIs in history
- Images saved to device camera roll or temp directory
- Reference stored as file:// path

**Future Enhancement: Resized Image Storage**

**User Preference Option:**
```typescript
interface StorageSettings {
  storeResizedImages: boolean;        // User toggle in settings
  imageQuality: 'low' | 'medium' | 'high'; // Compression level
  maxImageSize: number;               // Max dimensions (e.g., 800px)
}
```

**Benefits:**
- Reduced storage footprint (full image → thumbnail + compressed)
- Faster list rendering (smaller images)
- History can include images even if original deleted
- Better performance with 500+ scans

**Implementation Plan (Phase 2):**

1. **Add Setting Toggle** (SettingsScreen)
   ```typescript
   "Store compressed copies of scanned images"
   Default: false (respect user choice)
   ```

2. **Update ScanHistoryItem Type**
   ```typescript
   interface ScanHistoryItem {
     imageUri?: string;              // Original image path
     thumbnailUri?: string;          // 72x72 thumbnail (always)
     compressedImageUri?: string;    // 800px compressed (if enabled)
     imageMetadata?: {
       originalSize: number;         // Bytes
       compressedSize: number;       // Bytes
       dimensions: { width: number; height: number };
     };
   }
   ```

3. **Image Processing Pipeline**
   ```typescript
   async function processImageForHistory(
     originalUri: string,
     settings: StorageSettings
   ): Promise<ImageData> {
     // Always create thumbnail
     const thumbnail = await createThumbnail(originalUri, 72);
     
     // Optionally create compressed copy
     let compressed = null;
     if (settings.storeResizedImages) {
       compressed = await compressImage(originalUri, {
         maxWidth: 800,
         maxHeight: 800,
         quality: getQualityValue(settings.imageQuality),
       });
     }
     
     return { thumbnail, compressed };
   }
   ```

4. **Storage Management**
   - Store in app's document directory (persistent)
   - Implement cleanup on item deletion
   - Add "Clear Image Cache" option
   - Monitor total storage usage

5. **Migration Strategy**
   ```typescript
   // For existing items without thumbnails
   async function migrateHistoryImages() {
     const items = await historyService.getItems();
     for (const item of items) {
       if (item.imageUri && !item.thumbnailUri) {
         const thumbnail = await createThumbnail(item.imageUri, 72);
         await historyService.updateItem(item.id, { 
           thumbnailUri: thumbnail 
         });
       }
     }
   }
   ```

**Considerations:**
- **Privacy**: User controls whether to keep copies
- **Storage**: Monitor and alert if approaching limits
- **Cleanup**: Auto-delete when clearing history
- **Performance**: Process images in background
- **Fallback**: Gracefully handle missing images

**Estimated Effort:**
- Design settings UI: 2 hours
- Image processing pipeline: 4 hours
- Storage management: 3 hours
- Migration utility: 2 hours
- Testing: 3 hours
- **Total: 1-2 days**

**Dependencies:**
- expo-image-manipulator (already installed)
- expo-file-system for file management

**User Story:**
```
As a user who scans many products,
I want the option to store compressed copies of images,
So that my history doesn't consume excessive storage,
And I can view past scans even if I delete the originals.
```

---

## �📚 References

- [Expo SecureStore Docs](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [React Native FlatList Performance](https://reactnative.dev/docs/optimizing-flatlist-configuration)
- [JSON Storage Best Practices](https://www.sqlite.org/whentouse.html)

---

**Sprint 4 Ready to Start!** 🚀

Next: Create GitHub issues for each phase and assign story points.

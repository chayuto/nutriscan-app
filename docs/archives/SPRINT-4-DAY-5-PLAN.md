# Sprint 4 Day 5: useHistory Hook

## 🎯 Goal
Create a React hook to connect HistoryService to UI components with optimistic updates and loading states.

## ✅ Prerequisites (COMPLETE)
- ✅ Day 1: Type system and HistoryService implemented
- ✅ Day 2: Production-grade improvements (retry, error recovery, optimistic updates, batch operations)
- ✅ 43 tests passing, 86.78% coverage

---

## 📋 What We're Building

### Hook Interface

```typescript
const {
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
  
  // Actions (all async)
  addScan,
  updateItem,
  deleteItem,
  deleteItems,       // Batch operation
  toggleFavorite,
  toggleFavorites,   // Batch operation
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
} = useHistory();
```

---

## 🏗️ Architecture

### 1. Hook Structure

```typescript
// src/hooks/useHistory.ts

import { useState, useEffect, useCallback } from 'react';
import { historyService } from '@/services/history.service';
import type { 
  ScanHistoryItem, 
  ScanHistory, 
  HistoryStats,
  QueryOptions 
} from '@/types/history.types';

interface UseHistoryReturn {
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
  addScan: (scan: Omit<ScanHistoryItem, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => Promise<string>;
  updateItem: (id: string, updates: Partial<ScanHistoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  deleteItems: (ids: string[]) => Promise<number>;
  toggleFavorite: (id: string, optimistic?: boolean) => Promise<boolean>;
  toggleFavorites: (ids: string[], isFavorite: boolean) => Promise<number>;
  clearHistory: (keepFavorites?: boolean) => Promise<void>;
  
  // Queries
  getItems: (options?: QueryOptions) => Promise<ScanHistoryItem[]>;
  getItem: (id: string) => Promise<ScanHistoryItem | null>;
  getStats: () => Promise<HistoryStats>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
  
  // Manual refresh
  refresh: () => Promise<void>;
}

export function useHistory(): UseHistoryReturn {
  // Implementation
}
```

### 2. State Management

```typescript
const [items, setItems] = useState<ScanHistoryItem[]>([]);
const [stats, setStats] = useState<HistoryStats | null>(null);
const [history, setHistory] = useState<ScanHistory | null>(null);

const [isLoading, setIsLoading] = useState(true);
const [isAdding, setIsAdding] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
const [isToggling, setIsToggling] = useState(false);
const [isClearing, setIsClearing] = useState(false);

const [error, setError] = useState<string | null>(null);
```

### 3. Initial Load (useEffect)

```typescript
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
        setError(err instanceof Error ? err.message : 'Failed to load history');
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
```

### 4. Memoized Actions (useCallback)

```typescript
const addScan = useCallback(async (
  scan: Omit<ScanHistoryItem, 'id' | 'createdAt' | 'updatedAt' | 'version'>
): Promise<string> => {
  try {
    setIsAdding(true);
    setError(null);
    
    const id = await historyService.addScan(scan);
    
    // Refresh items
    const updatedHistory = await historyService.load();
    if (updatedHistory) {
      setHistory(updatedHistory);
      setItems(updatedHistory.items);
      setStats(await historyService.getStats());
    }
    
    return id;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to add scan';
    setError(errorMessage);
    throw err;
  } finally {
    setIsAdding(false);
  }
}, []);

const toggleFavorite = useCallback(async (
  id: string, 
  optimistic: boolean = true
): Promise<boolean> => {
  try {
    setIsToggling(true);
    setError(null);
    
    // Use optimistic update for instant UI feedback
    const newStatus = await historyService.toggleFavorite(id, { optimistic });
    
    // Update local state immediately if optimistic
    if (optimistic) {
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === id 
            ? { ...item, isFavorite: newStatus }
            : item
        )
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
}, []);

const deleteItems = useCallback(async (ids: string[]): Promise<number> => {
  try {
    setIsDeleting(true);
    setError(null);
    
    const deletedCount = await historyService.deleteItems(ids);
    
    // Refresh items
    const updatedHistory = await historyService.load();
    if (updatedHistory) {
      setHistory(updatedHistory);
      setItems(updatedHistory.items);
      setStats(await historyService.getStats());
    }
    
    return deletedCount;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete items';
    setError(errorMessage);
    throw err;
  } finally {
    setIsDeleting(false);
  }
}, []);

// ... similar for other actions
```

### 5. Query Methods (useCallback)

```typescript
const getItems = useCallback(async (options?: QueryOptions): Promise<ScanHistoryItem[]> => {
  try {
    return await historyService.getItems(options);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to get items';
    setError(errorMessage);
    return [];
  }
}, []);
```

---

## 🧪 Testing Strategy

### Test File Structure

```typescript
// __tests__/hooks/useHistory.test.ts

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useHistory } from '@/hooks/useHistory';
import { historyService } from '@/services/history.service';

jest.mock('@/services/history.service');

describe('useHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should load initial data on mount', async () => {
      // Test initial load
    });

    it('should handle initialization errors', async () => {
      // Test error handling
    });

    it('should not update state after unmount', async () => {
      // Test cleanup
    });
  });

  describe('Loading States', () => {
    it('should set isLoading during initial load', async () => {});
    it('should set isAdding when adding scan', async () => {});
    it('should set isDeleting when deleting items', async () => {});
    it('should set isToggling when toggling favorite', async () => {});
    it('should set isClearing when clearing history', async () => {});
  });

  describe('Actions', () => {
    it('should add scan and update state', async () => {});
    it('should update item and refresh state', async () => {});
    it('should delete item and update state', async () => {});
    it('should delete multiple items (batch)', async () => {});
    it('should toggle favorite with optimistic update', async () => {});
    it('should toggle multiple favorites (batch)', async () => {});
    it('should clear history and update state', async () => {});
  });

  describe('Optimistic Updates', () => {
    it('should update UI immediately with optimistic toggle', async () => {});
    it('should reflect rollback if save fails', async () => {});
  });

  describe('Error Handling', () => {
    it('should set error on addScan failure', async () => {});
    it('should set error on deleteItems failure', async () => {});
    it('should clear error when clearError is called', async () => {});
  });

  describe('Queries', () => {
    it('should get filtered items', async () => {});
    it('should get single item by ID', async () => {});
    it('should get stats', async () => {});
  });

  describe('Manual Refresh', () => {
    it('should refresh data when refresh is called', async () => {});
  });
});
```

**Target:** 15-20 tests covering all hook functionality

---

## 📊 Success Criteria

- ✅ All actions wrapped in try-catch with error handling
- ✅ All actions update loading states appropriately
- ✅ Optimistic updates work correctly with rollback
- ✅ useCallback memoization for all functions
- ✅ Cleanup on unmount (no memory leaks)
- ✅ 15-20 comprehensive tests
- ✅ 85%+ test coverage for hook
- ✅ TypeScript strict mode compliance

---

## 🚀 Implementation Steps

### Step 1: Create Hook File (30 min)
1. Create `src/hooks/useHistory.ts`
2. Define interface and types
3. Setup state management
4. Implement initial load (useEffect)

### Step 2: Implement Actions (60 min)
1. `addScan()` with loading state
2. `updateItem()` with loading state
3. `deleteItem()` with loading state
4. `deleteItems()` batch operation
5. `toggleFavorite()` with optimistic flag
6. `toggleFavorites()` batch operation
7. `clearHistory()` with loading state

### Step 3: Implement Queries (15 min)
1. `getItems()` with options
2. `getItem()` by ID
3. `getStats()`
4. `refresh()` manual reload

### Step 4: Error Handling (15 min)
1. Error state management
2. `clearError()` method
3. Try-catch in all actions

### Step 5: Write Tests (90 min)
1. Setup test file with mocks
2. Test initialization
3. Test loading states
4. Test actions
5. Test optimistic updates
6. Test error handling
7. Test queries

### Step 6: Integration Testing (30 min)
1. Test with real components
2. Verify optimistic updates in UI
3. Check memory leaks
4. Validate error displays

**Total Estimated Time:** 3.5-4 hours

---

## 🎯 Usage Examples

### Example 1: Basic Usage in Component

```typescript
import { useHistory } from '@/hooks/useHistory';

export function HistoryScreen() {
  const {
    items,
    isLoading,
    deleteItem,
    toggleFavorite,
    error,
  } = useHistory();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => (
        <HistoryItem
          item={item}
          onFavorite={() => toggleFavorite(item.id, true)}
          onDelete={() => deleteItem(item.id)}
        />
      )}
    />
  );
}
```

### Example 2: Optimistic Updates

```typescript
export function FavoriteButton({ itemId }: { itemId: string }) {
  const { toggleFavorite, isToggling } = useHistory();
  
  const handlePress = async () => {
    try {
      // Optimistic: UI updates immediately
      await toggleFavorite(itemId, true);
      // Auto-rollback if save fails
    } catch (error) {
      // Show toast notification
    }
  };
  
  return (
    <Pressable onPress={handlePress} disabled={isToggling}>
      <Icon name="star" />
    </Pressable>
  );
}
```

### Example 3: Batch Operations

```typescript
export function BulkActions({ selectedIds }: { selectedIds: string[] }) {
  const { deleteItems, toggleFavorites, isDeleting } = useHistory();
  
  const handleDeleteAll = async () => {
    const count = await deleteItems(selectedIds);
    showToast(`Deleted ${count} items`);
  };
  
  const handleFavoriteAll = async () => {
    const count = await toggleFavorites(selectedIds, true);
    showToast(`Favorited ${count} items`);
  };
  
  return (
    <>
      <Button onPress={handleDeleteAll} loading={isDeleting}>
        Delete Selected
      </Button>
      <Button onPress={handleFavoriteAll}>
        Favorite All
      </Button>
    </>
  );
}
```

---

## 📁 File Structure After Day 5

```
src/
├── hooks/
│   ├── useCamera.ts              (existing)
│   ├── useNutritionAnalysis.ts   (existing)
│   ├── usePermissions.ts         (existing)
│   ├── useSettingsForm.ts        (existing)
│   ├── useThresholds.ts          (existing)
│   └── useHistory.ts             ⭐ NEW
│
├── services/
│   └── history.service.ts        (enhanced Day 1-2)
│
└── types/
    └── history.types.ts          (created Day 1)

__tests__/
├── hooks/
│   └── useHistory.test.ts        ⭐ NEW (15-20 tests)
│
└── services/
    └── history.service.test.ts   (43 tests)
```

---

## 🎓 Key Concepts

### React Hooks Best Practices

1. **useCallback for all functions**
   - Prevents unnecessary re-renders
   - Stable function references

2. **Cleanup on unmount**
   ```typescript
   useEffect(() => {
     let mounted = true;
     
     loadData().then(() => {
       if (mounted) setData(result);
     });
     
     return () => { mounted = false; };
   }, []);
   ```

3. **Loading states for UX**
   - `isLoading`: Initial load
   - `isAdding`, `isDeleting`, etc.: Action-specific

4. **Error boundaries**
   - Catch and display errors
   - Provide recovery actions

### Optimistic Updates in React

```typescript
// 1. Update UI immediately
setItems(prev => updateOptimistically(prev));

// 2. Save in background
service.save().catch(() => {
  // 3. Rollback on failure
  setItems(prev => rollback(prev));
});
```

---

## 🚀 Ready to Start?

**Next Command:**
```bash
# Create the hook file
touch src/hooks/useHistory.ts

# Create the test file
mkdir -p __tests__/hooks
touch __tests__/hooks/useHistory.test.ts
```

**Let's build Day 5!** 🎉

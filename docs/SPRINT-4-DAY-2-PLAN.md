# Sprint 4 Day 2: Service Refinement & Best Practices

## 🎯 Goal
Apply React Native best practices and production-grade improvements to HistoryService

## ✅ Day 1 Recap
- ✅ Complete type system (history.types.ts)
- ✅ Full HistoryService implementation (445 lines)
- ✅ Comprehensive test suite (31 tests, 89.8% coverage)
- ✅ All CRUD operations working
- ✅ Caching, filtering, sorting, statistics

## 🔧 Day 2 Tasks

### Task 1: Add Retry Logic (HIGH PRIORITY)
**Duration:** 30-45 minutes

**Why:** Storage operations can fail due to disk full, permissions, etc.

**Implementation:**
```typescript
// Add to HistoryService
private async retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (error.message?.includes('not initialized')) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError;
}
```

**Apply to:**
- `initialize()`
- `load()`
- `save()`

**Tests to add:**
- Retry succeeds on second attempt
- Retry fails after max attempts
- Non-retryable errors throw immediately

---

### Task 2: Add Error Recovery (MEDIUM PRIORITY)
**Duration:** 20-30 minutes

**Why:** Corrupted data shouldn't crash the app

**Implementation:**
```typescript
async load(): Promise<ScanHistory | null> {
  try {
    // Check cache...
    
    const data = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!data) return null;

    try {
      const history: ScanHistory = JSON.parse(data);
      
      // Validate structure
      if (!this.isValidHistory(history)) {
        console.warn('[HistoryService] Invalid history structure, initializing fresh');
        await this.initialize();
        return await this.load();
      }
      
      // Update cache
      this.cache.data = history;
      this.cache.timestamp = Date.now();
      
      return history;
    } catch (parseError) {
      console.error('[HistoryService] Failed to parse history, resetting:', parseError);
      // Backup corrupted data
      await this.backupCorruptedData(data);
      // Initialize fresh
      await this.initialize();
      return await this.load();
    }
  } catch (error) {
    console.error('[HistoryService] Failed to load history:', error);
    throw new Error('Failed to load history');
  }
}

private isValidHistory(history: any): history is ScanHistory {
  return (
    typeof history === 'object' &&
    history !== null &&
    typeof history.version === 'number' &&
    Array.isArray(history.items) &&
    typeof history.metadata === 'object'
  );
}

private async backupCorruptedData(data: string): Promise<void> {
  try {
    const backupKey = `${STORAGE_KEY}_backup_${Date.now()}`;
    await SecureStore.setItemAsync(backupKey, data);
    console.log('[HistoryService] Corrupted data backed up to:', backupKey);
  } catch (error) {
    console.error('[HistoryService] Failed to backup corrupted data:', error);
  }
}
```

**Tests to add:**
- Handles invalid JSON gracefully
- Handles missing fields gracefully
- Backs up corrupted data

---

### Task 3: Add Optimistic Updates Support (MEDIUM PRIORITY)
**Duration:** 30-45 minutes

**Why:** Better UX - UI updates immediately even if save is slow

**Implementation:**
```typescript
/**
 * Toggle favorite with optimistic update support
 * Returns immediately with new status, saves in background
 */
async toggleFavorite(
  id: string, 
  options?: { optimistic?: boolean }
): Promise<boolean> {
  const history = await this.load();
  if (!history) throw new Error('History not initialized');

  const item = history.items.find((i) => i.id === id);
  if (!item) throw new Error('Item not found');

  const newStatus = !item.isFavorite;
  
  if (options?.optimistic) {
    // Update cache immediately for optimistic UI
    item.isFavorite = newStatus;
    item.updatedAt = Date.now();
    item.version++;
    
    // Save in background (don't await)
    this.save(history).catch((error) => {
      console.error('[HistoryService] Failed to save favorite toggle:', error);
      // Rollback in cache
      item.isFavorite = !newStatus;
      item.version--;
    });
    
    return newStatus;
  }
  
  // Standard path (wait for save)
  item.isFavorite = newStatus;
  item.updatedAt = Date.now();
  item.version++;
  await this.save(history);
  return newStatus;
}
```

**Apply to:**
- `toggleFavorite()` (primary use case)
- `deleteItem()` (optional)

**Tests to add:**
- Optimistic update returns immediately
- Background save succeeds
- Background save fails and rolls back

---

### Task 4: Add Batch Operations (LOW PRIORITY)
**Duration:** 20-30 minutes

**Why:** Efficient bulk operations (delete multiple, favorite multiple)

**Implementation:**
```typescript
/**
 * Delete multiple items by IDs
 * More efficient than calling deleteItem() multiple times
 */
async deleteItems(ids: string[]): Promise<number> {
  const history = await this.load();
  if (!history) throw new Error('History not initialized');

  const idsSet = new Set(ids);
  const initialLength = history.items.length;
  
  history.items = history.items.filter((item) => !idsSet.has(item.id));
  
  const deletedCount = initialLength - history.items.length;
  history.metadata.totalScans = history.items.length;
  
  if (deletedCount > 0) {
    await this.save(history);
  }
  
  return deletedCount;
}

/**
 * Toggle favorite for multiple items
 */
async toggleFavorites(ids: string[], isFavorite: boolean): Promise<number> {
  const history = await this.load();
  if (!history) throw new Error('History not initialized');

  const idsSet = new Set(ids);
  let updatedCount = 0;
  
  history.items.forEach((item) => {
    if (idsSet.has(item.id) && item.isFavorite !== isFavorite) {
      item.isFavorite = isFavorite;
      item.updatedAt = Date.now();
      item.version++;
      updatedCount++;
    }
  });
  
  if (updatedCount > 0) {
    await this.save(history);
  }
  
  return updatedCount;
}
```

**Tests to add:**
- Delete multiple items
- Toggle multiple favorites
- Handle empty ID arrays

---

### Task 5: Add Performance Monitoring (LOW PRIORITY)
**Duration:** 15-20 minutes

**Why:** Track performance in production

**Implementation:**
```typescript
private performanceLog(operation: string, duration: number): void {
  if (__DEV__) {
    if (duration > 100) {
      console.warn(`[HistoryService] Slow operation: ${operation} took ${duration}ms`);
    } else {
      console.log(`[HistoryService] ${operation} completed in ${duration}ms`);
    }
  }
}

async load(): Promise<ScanHistory | null> {
  const startTime = Date.now();
  
  try {
    // ... existing implementation
    
    const duration = Date.now() - startTime;
    this.performanceLog('load', duration);
    
    return history;
  } catch (error) {
    const duration = Date.now() - startTime;
    this.performanceLog('load (error)', duration);
    throw error;
  }
}
```

---

### Task 6: Add Data Migration Support (LOW PRIORITY)
**Duration:** 20-30 minutes

**Why:** Handle future schema changes gracefully

**Implementation:**
```typescript
private async migrateIfNeeded(history: ScanHistory): Promise<ScanHistory> {
  const currentVersion = 1;
  
  if (history.version < currentVersion) {
    console.log(`[HistoryService] Migrating from v${history.version} to v${currentVersion}`);
    
    // Apply migrations
    if (history.version === 0) {
      history = this.migrateV0toV1(history);
    }
    
    history.version = currentVersion;
    await this.save(history);
  }
  
  return history;
}

private migrateV0toV1(history: any): ScanHistory {
  // Example migration: add new fields
  return {
    ...history,
    version: 1,
    items: history.items.map((item: any) => ({
      ...item,
      tags: item.tags || [],
      notes: item.notes || undefined,
    })),
  };
}
```

---

## 📋 Implementation Order

### Phase A: Critical Improvements (1-2 hours)
1. ✅ Add retry logic to storage operations
2. ✅ Add error recovery for corrupted data
3. ✅ Add validation for loaded data

### Phase B: UX Improvements (1 hour)
4. ✅ Add optimistic updates for toggleFavorite
5. ✅ Add batch operations (deleteItems, toggleFavorites)

### Phase C: Production Polish (30 min)
6. ✅ Add performance monitoring
7. ✅ Add data migration support

---

## 🧪 Testing Strategy

### New Tests to Add (Est. 15-20 tests)
- **Retry logic (5 tests)**
  - Retry succeeds on second attempt
  - Retry succeeds on third attempt
  - Retry fails after max attempts
  - Non-retryable errors throw immediately
  - Delay increases with each retry

- **Error recovery (4 tests)**
  - Handles corrupted JSON
  - Handles missing fields
  - Backs up corrupted data
  - Initializes fresh after corruption

- **Optimistic updates (3 tests)**
  - Returns immediately
  - Background save succeeds
  - Background save fails and rolls back

- **Batch operations (4 tests)**
  - Delete multiple items
  - Toggle multiple favorites on
  - Toggle multiple favorites off
  - Handle empty arrays

- **Performance monitoring (1 test)**
  - Logs slow operations

- **Migration (2 tests)**
  - Migrates old version to new
  - Skips migration if current

**Target:** 46-51 total tests (31 existing + 15-20 new)

---

## 📊 Success Criteria

- ✅ All existing 31 tests still pass
- ✅ 15-20 new tests added and passing
- ✅ Coverage remains 85%+ (ideally 90%+)
- ✅ No breaking changes to public API
- ✅ Retry logic tested with at least 3 scenarios
- ✅ Error recovery handles corrupted data gracefully
- ✅ Performance monitoring works in DEV mode

---

## 🚀 Next Steps After Day 2

**Day 3-4:** Additional refinements based on review
**Day 5:** useHistory hook implementation
**Day 6-7:** UI components
**Day 8-9:** HistoryScreen
**Day 10:** Integration and polish

---

## 📝 Notes

- All improvements should be backwards compatible
- Focus on reliability and production-readiness
- Don't over-engineer - keep it simple
- Performance monitoring only in DEV mode
- Migration system prepares for future schema changes

---

**Estimated Total Time:** 2-4 hours
**Priority:** HIGH (production-readiness improvements)

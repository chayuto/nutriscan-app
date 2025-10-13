# Sprint 4: History & Favorites - Quick Reference

**Timeline**: 2 weeks (10 days)  
**Goal**: Add persistent scan history with favorites using JSON storage

---

## 📊 At a Glance

```
Storage Strategy: JSON (Phase 1) → SQLite (Phase 2) → Cloud (Phase 3)
Max Items: 1000 scans
Target Performance: < 100ms load time for 500 items
Architecture: Service → Hook → Component → Screen
```

---

## 🎯 What We're Building

### Core Features

✅ **Save Scans**
- Auto-save after AI analysis
- Manual save from ReportScreen
- 1000 item limit (auto-prune oldest non-favorites)

✅ **View History**
- List all scans (newest first)
- Search by product name/brand
- Filter by favorites
- Sort by date/name/favorite
- Add/edit product names inline

✅ **Favorites**
- Heart icon toggle
- Protected from auto-deletion
- Quick filter to view only favorites

✅ **Statistics**
- Total scans count
- Favorites count
- This week/month counts
- Average calories
- Storage size

✅ **Data Management**
- Delete individual scans
- Clear all (with "keep favorites" option)
- Export as JSON (future: GDPR compliance)

---

## 🏗️ Architecture Stack

```
┌─────────────────────────────────────────────┐
│           HistoryScreen (New)               │
│  - Search bar                               │
│  - Stats card                               │
│  - FlatList with items                      │
│  - Empty state                              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           useHistory() Hook                 │
│  - items: ScanHistoryItem[]                 │
│  - stats: HistoryStats                      │
│  - loadItems(filter?)                       │
│  - addScan(item)                            │
│  - toggleFavorite(id)                       │
│  - deleteItem(id)                           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         HistoryService (Service Layer)      │
│  - load() → ScanHistory from SecureStore   │
│  - save(history) → SecureStore              │
│  - addScan() → Push new item                │
│  - getItems(filter?) → Filtered array       │
│  - toggleFavorite()                         │
│  - deleteItem()                             │
│  - getStats() → HistoryStats                │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│        expo-secure-store (Storage)          │
│  Key: "nutriscan_scan_history"              │
│  Format: JSON string (encrypted at rest)    │
└─────────────────────────────────────────────┘
```

---

## 📦 Data Structure

```typescript
// Single scan entry
{
  id: "1728741234-abc123def",
  timestamp: 1728741234567,
  productName: "Greek Yogurt",
  brandName: "Chobani",
  nutritionData: { calories: 150, protein: 12, ... },
  imageUri: "file:///...",
  isFavorite: true,
  tags: ["breakfast", "protein"],
  notes: "Good post-workout option",
  createdAt: 1728741234567,
  updatedAt: 1728741234567,
  version: 1
}

// Complete storage
{
  version: 1,
  items: [ /* array of scans */ ],
  metadata: {
    totalScans: 42,
    lastScanAt: 1728741234567,
    storageVersion: "1.0.0"
  }
}
```

---

## 🚀 10-Day Plan

### Week 1 (Foundation)

**Day 1-2**: Types + Service Core
- Create `history.types.ts`
- Implement `HistoryService` (initialize, load, save)
- Unit tests

**Day 3-4**: Service CRUD Methods
- addScan, getItems, toggleFavorite, deleteItem
- Filtering and sorting logic
- getStats method
- Cache layer for performance
- Comprehensive tests

**Day 5**: Custom Hook
- Implement `useHistory()`
- Loading/error states
- Test with mock service

### Week 2 (UI + Integration)

**Day 6-7**: UI Components
- HistoryListItem
- HistoryList (FlatList)
- SearchBar
- FavoriteButton
- HistoryEmptyState
- HistoryStats card

**Day 8-9**: HistoryScreen
- Layout with search/filter
- Pull-to-refresh
- Detail modal
- Navigation from HomeScreen

**Day 10**: Integration & Polish
- Add "Save" button to ReportScreen
- Auto-save toggle in settings (optional)
- E2E testing
- Performance check
- Docs update

---

## 🎯 Success Criteria

### Must Have ✅
- [ ] Users can save scans
- [ ] Users can view history list
- [ ] Users can mark favorites
- [ ] Users can add/edit product names
- [ ] Users can search by name
- [ ] Users can delete scans
- [ ] Data persists after restart
- [ ] 85%+ test coverage
- [ ] < 100ms load time (500 items)

### Should Have 🟡
- [ ] Stats dashboard
- [ ] Swipe-to-delete
- [ ] Pull-to-refresh
- [ ] Empty state illustration

### Nice to Have 🔵
- [ ] Export/import data
- [ ] Tags for organization
- [ ] Date range filter

---

## 🔧 Key Implementation Details

### Storage
- **Location**: expo-secure-store (encrypted)
- **Key**: `nutriscan_scan_history`
- **Max Size**: 100MB
- **Max Items**: 1000 (hard limit)

### Performance
- **Cache**: 5-minute TTL
- **Search**: O(n) - acceptable for < 1K items
- **Target**: < 100ms load, < 50ms search

### Migration Path
1. **Now**: JSON (< 1K items)
2. **Phase 2**: SQLite (1K-10K items) when search > 200ms
3. **Phase 3**: Cloud DB (multi-device sync)

---

## 📝 Files to Create/Modify

### New Files (7)
- `src/types/history.types.ts`
- `src/services/history.service.ts`
- `src/hooks/useHistory.ts`
- `src/components/HistoryListItem.tsx`
- `src/components/HistoryList.tsx`
- `src/components/HistoryStats.tsx`
- `src/screens/HistoryScreen.tsx`

### Modified Files (4)
- `src/screens/ReportScreen.tsx` (add Save button)
- `src/screens/HomeScreen.tsx` (add History link)
- `src/screens/SettingsScreen.tsx` (add auto-save toggle)
- `App.tsx` (add HistoryScreen route)

### Test Files (6)
- `__tests__/services/history.service.test.ts`
- `__tests__/hooks/useHistory.test.ts`
- `__tests__/components/HistoryListItem.test.tsx`
- `__tests__/components/HistoryList.test.tsx`
- `__tests__/screens/HistoryScreen.test.tsx`
- `__tests__/integration/history-flow.test.tsx`

---

## 🎨 UI Mockup

```
┌─────────────────────────────────────┐
│  [← Back]  History        [⚙️]      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔍 Search products...       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📊 Stats                    │   │
│  │ • 42 scans (8 favorites)    │   │
│  │ • 15 this week              │   │
│  │ • Avg 320 kcal/scan         │   │
│  └─────────────────────────────┘   │
│                                     │
│  [All] [Favorites] [This Week]     │
│                                     │
│  ╔═══════════════════════════════╗ │
│  ║ [🖼️] Greek Yogurt            ║ │
│  ║ Chobani • 2 days ago        ║ │
│  ║ 150 kcal  [❤️]               ║ │
│  ╚═══════════════════════════════╝ │
│                                     │
│  ╔═══════════════════════════════╗ │
│  ║ [🖼️] Protein Bar             ║ │
│  ║ Quest • 1 week ago          ║ │
│  ║ 200 kcal  [♡]                ║ │
│  ╚═══════════════════════════════╝ │
│                                     │
└─────────────────────────────────────┘
```

---

## ⚡ Quick Start Commands

```bash
# Create type definitions
touch src/types/history.types.ts

# Create service
touch src/services/history.service.ts

# Create hook
touch src/hooks/useHistory.ts

# Create test files
mkdir -p __tests__/services
touch __tests__/services/history.service.test.ts

# Run tests in watch mode
npm test -- --watch history
```

---

## 🔗 Related Documents

- **Full Plan**: [SPRINT-4-HISTORY-FAVORITES.md](./SPRINT-4-HISTORY-FAVORITES.md)
- **UI/UX Specifications**: [SPRINT-4-UI-UX-SPECS.md](./SPRINT-4-UI-UX-SPECS.md) ⭐ NEW
- **Architecture Decision**: [ARCHITECTURE-DECISIONS.md](./ARCHITECTURE-DECISIONS.md#adr-001-json-storage-for-history-sprint-4)
- **Type System**: [02-type-system.md](./02-type-system.md)
- **Storage Service**: [01-architecture.md](./01-architecture.md)

---

## 🔮 Future Enhancements (Post-Sprint 4)

### Resized Image Storage (Optional)
- User preference to store compressed copies of scanned images
- Reduces storage footprint (original → thumbnail + compressed)
- Improves performance with 500+ scans
- Images persist even if originals deleted
- **Estimated effort**: 1-2 days
- **See full plan**: [SPRINT-4-HISTORY-FAVORITES.md](./SPRINT-4-HISTORY-FAVORITES.md#-future-considerations-post-sprint-4)

---

**Ready to Start Sprint 4?** 🚀

Next steps:
1. Review full plan in SPRINT-4-HISTORY-FAVORITES.md
2. Create GitHub project board for tracking
3. Break down tasks into daily goals
4. Begin Day 1: Type definitions

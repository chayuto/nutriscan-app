# Sprint 4 - Image Storage Strategy

## 🎯 Core Principle: Store RESIZED copies only, NEVER full-resolution duplicates

---

## 📊 Storage Comparison

### ❌ BAD: Storing Full-Resolution Duplicates

```
Original photo: 2-5MB each
500 scans × 3MB = 1.5GB ❌ Unacceptable!

Problems:
- Fills device storage quickly
- Wastes space duplicating camera roll
- Slow to load and render
- May trigger OS storage cleanup
- Poor user experience
```

### ✅ GOOD: Storing Resized Copies (Sprint 4 Future Enhancement)

```
Thumbnail: 72x72px = 2-5KB each
Compressed: 800px = 50-100KB each (optional)

500 scans storage:
- Thumbnails only: 500 × 3KB = 1.5MB ✅ Always acceptable
- With compressed: 500 × 3KB + 500 × 75KB = 39MB ✅ User choice

Benefits:
- 99.9% storage reduction (3KB vs 3MB)
- Fast list rendering
- Images persist even if originals deleted
- User controls storage vs quality trade-off
```

---

## 📐 Image Sizes Explained

### 1. **Original Image** (NOT stored)
- **Source**: Camera/gallery
- **Size**: 2-5MB (full resolution, e.g., 4000×3000px)
- **Storage**: Camera roll or temp directory
- **Usage**: One-time analysis by OpenAI
- **Sprint 4**: Store reference URI only (may not exist later)

### 2. **Thumbnail** (ALWAYS stored in future enhancement)
- **Dimensions**: 72×72px
- **Size**: 2-5KB (~0.1% of original)
- **Quality**: JPEG, 80% compression
- **Storage**: App document directory (permanent)
- **Usage**: History list view
- **Why 72px**: Standard iOS/Android list thumbnail size

### 3. **Compressed Copy** (OPTIONAL, user choice)
- **Dimensions**: Max 800px width (maintain aspect ratio)
- **Size**: 50-100KB (~2-3% of original)
- **Quality**: JPEG, 60-80% compression (user setting)
- **Storage**: App document directory (permanent)
- **Usage**: History detail modal, full-screen view
- **Why 800px**: Sufficient for phone screens, good quality/size balance

---

## 🗂️ Sprint 4 Data Model

### Current (Sprint 4 - Phase 1)

```typescript
interface ScanHistoryItem {
  nutritionData: NutritionData;  // From OpenAI
  imageUri?: string;             // Reference to original (may not exist)
  isFavorite: boolean;
  // ... other fields
}

// Storage per scan:
// - imageUri reference: ~100 bytes
// - nutritionData: ~500 bytes
// Total: ~600 bytes per scan (negligible)
```

### Future Enhancement (Post-Sprint 4)

```typescript
interface ScanHistoryItem {
  nutritionData: NutritionData;
  
  // Image references
  imageUri?: string;             // Original reference (may not exist)
  thumbnailUri?: string;         // 72px RESIZED copy (permanent, ~3KB)
  compressedImageUri?: string;   // 800px RESIZED copy (optional, ~75KB)
  
  // Metadata
  imageMetadata?: {
    thumbnailSize: number;       // Bytes (e.g., 3072)
    compressedSize?: number;     // Bytes (e.g., 76800)
    savingsPercent: number;      // vs original (e.g., 99.9%)
  };
}

// Storage per scan:
// - Without compressed: ~3KB (thumbnail only)
// - With compressed: ~78KB (thumbnail + compressed)
// - Original would be: ~3MB (1000x larger!) ❌
```

---

## ⚙️ Implementation: Image Processing Pipeline

### Step-by-Step Process

```typescript
// When user saves scan to history
async function saveScanhWithImages(
  nutritionData: NutritionData,
  originalUri: string,  // From camera
  settings: StorageSettings
) {
  // STEP 1: Create 72px thumbnail (ALWAYS)
  const thumbnail = await ImageManipulator.manipulateAsync(
    originalUri,
    [{ resize: { width: 72, height: 72 } }],
    { compress: 0.8, format: SaveFormat.JPEG }
  );
  // Result: 72×72px, ~3KB ✅
  
  // STEP 2: Create 800px compressed copy (OPTIONAL)
  let compressed = null;
  if (settings.storeResizedImages) {
    compressed = await ImageManipulator.manipulateAsync(
      originalUri,
      [{ resize: { width: 800 } }], // Height auto-scales
      { compress: 0.7, format: SaveFormat.JPEG }
    );
    // Result: 800×600px (example), ~75KB ✅
  }
  
  // STEP 3: Save to permanent directory
  const thumbnailPath = await saveToAppDirectory(
    thumbnail.uri,
    `thumb_${Date.now()}.jpg`
  );
  
  const compressedPath = compressed
    ? await saveToAppDirectory(compressed.uri, `img_${Date.now()}.jpg`)
    : null;
  
  // STEP 4: Store in history
  await historyService.addScan({
    nutritionData,
    imageUri: originalUri,       // Reference only
    thumbnailUri: thumbnailPath, // Permanent 3KB copy
    compressedImageUri: compressedPath, // Optional 75KB copy
    imageMetadata: {
      thumbnailSize: await getFileSize(thumbnailPath),
      compressedSize: compressedPath 
        ? await getFileSize(compressedPath)
        : undefined,
      savingsPercent: calculateSavings(originalSize, thumbnailSize),
    },
  });
  
  // ⚠️ NEVER copy the full-resolution original!
}
```

---

## 🎨 UI/UX: How Images Are Displayed

### History List (HistoryScreen)

```typescript
// Use 72px thumbnail for fast rendering
<FlatList
  data={items}
  renderItem={({ item }) => (
    <View style={styles.listItem}>
      <Image
        source={{ uri: item.thumbnailUri }}  // ✅ 3KB thumbnail
        style={{ width: 72, height: 72 }}
        cachePolicy="memory-disk"
      />
      {/* ... product name, calories, etc. */}
    </View>
  )}
/>

// Why thumbnail:
// - Loads instantly (3KB vs 3MB = 1000x faster)
// - Smooth scrolling (low memory usage)
// - 500 items in list = 1.5MB total (acceptable)
```

### Detail Modal (HistoryDetailModal)

```typescript
// Use compressed copy (if available) or thumbnail
<Modal>
  <Image
    source={{ 
      uri: item.compressedImageUri || item.thumbnailUri  // ✅ 75KB or 3KB
    }}
    style={{ width: '100%', height: 300 }}
    contentFit="contain"
  />
  {/* ... full nutrition report */}
</Modal>

// Why compressed (800px):
// - Good quality on phone screens
// - Still fast to load (75KB)
// - Falls back to thumbnail if user disabled storage
```

### Original Image (if available)

```typescript
// Optionally show original (may not exist)
{item.imageUri && (
  <TouchableOpacity onPress={() => openOriginal(item.imageUri)}>
    <Text>View Original Quality</Text>
  </TouchableOpacity>
)}

// Opens original from camera roll (if still exists)
// Falls back to compressed copy if original deleted
```

---

## 💾 Storage Management

### User Settings (SettingsScreen)

```typescript
<View>
  <Switch
    value={settings.storeResizedImages}
    onValueChange={(value) => updateSettings({ storeResizedImages: value })}
  />
  <Text>Store compressed copies of scanned images</Text>
  <Text style={styles.subtitle}>
    Keeps 800px copies in app storage. Uses ~40MB for 500 scans.
  </Text>
  
  {settings.storeResizedImages && (
    <Picker
      selectedValue={settings.imageQuality}
      onValueChange={(value) => updateSettings({ imageQuality: value })}
    >
      <Picker.Item label="Low (30KB)" value="low" />
      <Picker.Item label="Medium (75KB)" value="medium" />
      <Picker.Item label="High (150KB)" value="high" />
    </Picker>
  )}
</View>

// Storage indicators
<View>
  <Text>Total Storage Used: {formatBytes(totalImageStorage)}</Text>
  <Text>500 scans: {items.length}</Text>
  <Text>Thumbnails: {formatBytes(thumbnailsSize)} (always)</Text>
  {settings.storeResizedImages && (
    <Text>Compressed: {formatBytes(compressedSize)}</Text>
  )}
  
  <Button title="Clear Image Cache" onPress={clearImageCache} />
</View>
```

### Cleanup Strategy

```typescript
// When user deletes scan
async function deleteHistoryItem(id: string) {
  const item = await historyService.getItem(id);
  
  // Delete thumbnails and compressed copies
  if (item.thumbnailUri) {
    await FileSystem.deleteAsync(item.thumbnailUri);
  }
  if (item.compressedImageUri) {
    await FileSystem.deleteAsync(item.compressedImageUri);
  }
  
  // Remove from history
  await historyService.deleteItem(id);
  
  // ⚠️ Do NOT delete original (may be in camera roll)
}

// Global cleanup
async function clearImageCache() {
  const items = await historyService.getItems();
  
  for (const item of items) {
    if (item.thumbnailUri) {
      await FileSystem.deleteAsync(item.thumbnailUri);
    }
    if (item.compressedImageUri) {
      await FileSystem.deleteAsync(item.compressedImageUri);
    }
  }
  
  // Update items (remove image references)
  await historyService.clearImageReferences();
}
```

---

## 📊 Storage Benchmarks

### Real-World Scenarios

**Scenario 1: Thumbnails Only (Default)**
```
User: Casual scanner (100 scans over 6 months)
Storage:
- Thumbnails: 100 × 3KB = 300KB
- Data: 100 × 600 bytes = 60KB
Total: 360KB ✅ Negligible
```

**Scenario 2: Thumbnails + Compressed (Opt-in)**
```
User: Power user (500 scans over 1 year)
Storage:
- Thumbnails: 500 × 3KB = 1.5MB
- Compressed: 500 × 75KB = 37.5MB
- Data: 500 × 600 bytes = 300KB
Total: 39MB ✅ Acceptable
```

**Scenario 3: Full-Resolution Duplicates (NEVER DO THIS!)**
```
User: 500 scans
Storage:
- Full-res copies: 500 × 3MB = 1.5GB ❌ Unacceptable!
- Would fill most users' storage
- OS would likely delete automatically
- Poor user experience
```

---

## 🎯 Key Takeaways

### DO ✅

1. **Store 72px thumbnails** for list view (~3KB each)
2. **Optionally store 800px compressed** for detail view (~75KB each)
3. **Let user control** storage vs. quality trade-off
4. **Monitor total storage** and provide cleanup options
5. **Fall back gracefully** if images missing

### DON'T ❌

1. **Never store full-resolution duplicates** (wastes storage)
2. **Never assume originals persist** (OS may delete)
3. **Never force storage** (respect user choice)
4. **Never hide storage usage** (be transparent)

---

## 📝 Implementation Timeline

### Sprint 4 (Current)
- ✅ Store reference to original imageUri only
- ✅ Display images from camera/gallery
- ✅ Handle missing images gracefully (placeholder)

### Post-Sprint 4 (Future Enhancement)
- Day 1-2: Add storage settings UI (2h + 4h)
- Day 3-4: Implement image processing pipeline (4h + 3h)
- Day 5: Add cleanup and monitoring (2h)
- Day 6: Testing and optimization (3h)
- **Total: 1-2 days** (14 hours)

---

## 🔗 Related Documents

- [SPRINT-4-HISTORY-FAVORITES.md](./SPRINT-4-HISTORY-FAVORITES.md) - Complete Sprint 4 plan
- [IMAGE-URI-FLOW-CLARIFICATION.md](./IMAGE-URI-FLOW-CLARIFICATION.md) - Where imageUri comes from
- [SPRINT-4-RN-BEST-PRACTICES-REVIEW.md](./SPRINT-4-RN-BEST-PRACTICES-REVIEW.md) - Performance optimizations

---

**Summary**: Store resized copies (3KB thumbnails + optional 75KB compressed), NEVER full-resolution duplicates (3MB each). This achieves 99.9% storage reduction while maintaining good visual quality. User controls the trade-off. 🎯

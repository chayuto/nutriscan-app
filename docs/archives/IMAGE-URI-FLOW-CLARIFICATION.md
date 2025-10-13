# Image URI Flow Clarification

## ❓ Question: "I don't think we have image URIs... do we get this from OpenAI returns?"

**Short Answer**: No, OpenAI **does NOT** return images. We get the `imageUri` from the **camera/gallery** when the user captures/picks a photo, and we store it separately.

---

## 📸 Current Image Flow (Sprint 3 - MVP)

### Step-by-Step Breakdown

```typescript
// 1️⃣ USER CAPTURES/PICKS IMAGE
// In HomeScreen.tsx
const handleTakePhoto = async () => {
  const imageUri = await capturePhoto(); 
  // Returns: "file:///data/user/0/.../photo_123.jpg"
  // ✅ This is a local file path on the device
  
  if (imageUri) {
    setLastImageUri(imageUri); // Store it locally
    await handleAnalyzeImage(imageUri);
  }
};

// 2️⃣ IMAGE IS ANALYZED
// In useNutritionAnalysis.ts
const analyzeImage = async (imageUri: string) => {
  // Compress image
  const compressedUri = await imageService.compressImage(imageUri);
  
  // Convert to base64 (for API upload)
  const base64Image = await imageService.convertToBase64(compressedUri);
  
  // Send to OpenAI Vision API
  const nutritionData = await openAIService.analyzeImage(base64Image);
  // 👆 OpenAI receives the image but ONLY returns nutrition data
  
  return nutritionData;
};

// 3️⃣ OPENAI RETURNS ONLY NUTRITION DATA
// openAIService.analyzeImage() returns:
{
  calories: 250,
  protein: 3.5,
  fat: 15.5,
  carbohydrates: 28.0,
  sugars: 12.5,
  // ... other nutrition values
  
  // ❌ NO imageUri field!
  // ❌ NO image data!
}

// 4️⃣ APP PASSES IMAGEURI SEPARATELY TO REPORTSCREEN
// In HomeScreen.tsx
const handleAnalyzeImage = async (imageUri: string) => {
  const result = await analyzeImage(imageUri);
  
  if (result) {
    onAnalysisComplete(result, imageUri); 
    // ✅ We pass BOTH nutritionData AND imageUri
  }
};

// In App.tsx (navigation)
<ReportScreen
  nutritionData={nutritionData}  // From OpenAI
  imageUri={imageUri}            // From camera ✅
  thresholds={thresholds}
/>
```

---

## 🔄 Image URI Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  📱 Camera/Gallery Picker                                       │
│  • User taps "Take Photo" or "Choose Photo"                    │
│  • ImagePicker returns: "file:///path/to/photo.jpg"            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                       imageUri (local file path)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  🔄 Image Processing (imageService)                             │
│  • Compress image (max 1MB)                                     │
│  • Convert to base64 string                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                       base64 string
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  🤖 OpenAI Vision API (openAIService)                           │
│  • Send base64 image to gpt-4o                                  │
│  • AI extracts nutrition values                                 │
│  • Returns ONLY: { calories, protein, fat, ... }                │
│  • ❌ Does NOT return image or imageUri                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    nutritionData only
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  📊 ReportScreen                                                │
│  • Receives nutritionData (from OpenAI)                         │
│  • Receives imageUri (from camera, passed separately)           │
│  • Displays both:                                               │
│    - Image thumbnail (using imageUri)                           │
│    - Nutrition report (using nutritionData)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💾 Sprint 4: How History Will Store Images

### Data Structure

```typescript
interface ScanHistoryItem {
  id: string;
  timestamp: number;
  nutritionData: NutritionData;  // ✅ From OpenAI response
  imageUri?: string;             // ✅ From camera/gallery (stored separately)
  isFavorite: boolean;
  // ...
}
```

### Where imageUri Comes From

```typescript
// In ReportScreen, when user taps "Save to History"
const handleSaveToHistory = async () => {
  await historyService.addScan({
    nutritionData: nutritionData,  // ← From OpenAI (prop passed to ReportScreen)
    imageUri: imageUri,            // ← From camera (prop passed to ReportScreen)
    timestamp: Date.now(),
    isFavorite: false,
    tags: [],
  });
};
```

### Data Flow Summary

```
Camera/Gallery → imageUri
      ↓
  HomeScreen (stores imageUri locally)
      ↓
  Analyze Image (sends to OpenAI)
      ↓
  OpenAI returns nutritionData (no image!)
      ↓
  ReportScreen receives BOTH:
    - nutritionData (from OpenAI)
    - imageUri (from HomeScreen)
      ↓
  User taps "Save"
      ↓
  History stores BOTH:
    - nutritionData
    - imageUri ✅
```

---

## 🗂️ Why Store imageUri?

### Benefits

1. **Display Thumbnail in History List**
   ```typescript
   <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
   ```

2. **Show Original Label in Detail View**
   - User can see the label they scanned
   - Helps remember which product it was

3. **Re-analyze if Needed (Future)**
   - If OpenAI analysis was wrong
   - If user wants to scan same label again

4. **User Experience**
   - Visual memory aid (easier to find scans)
   - Confirms the scan actually happened
   - Professional feel

---

## ⚠️ Important Considerations

### 1. **Image Storage on Device**

```typescript
// imageUri format: "file:///data/user/0/.../photo_123.jpg"

// The file is stored in:
// - iOS: App's temporary directory
// - Android: App's cache directory

// ⚠️ These files can be deleted by OS if storage is low!
```

**Solutions**:
- ✅ Store reference (imageUri) in history (Sprint 4)
- 🔮 Optional: Copy to permanent app directory (Future consideration)
- 🔮 Optional: Store resized copy (as discussed in Sprint 4 future enhancements)

---

### 2. **Missing Images (Edge Cases)**

What if the original file is deleted?

```typescript
// In HistoryListItem component
<Image
  source={{ uri: item.imageUri }}
  style={styles.thumbnail}
  defaultSource={require('@/assets/placeholder.png')} // ✅ Fallback
  onError={() => {
    console.log('Image not found, showing placeholder');
  }}
/>
```

---

### 3. **Privacy Consideration**

- Images are stored **locally** on device only
- **Not uploaded** to any server (except OpenAI for analysis, then discarded)
- User has full control
- Can delete anytime

---

## 🔮 Future Enhancement: Resized Image Storage (User Opt-in)

See: [SPRINT-4-HISTORY-FAVORITES.md - Future Considerations](./SPRINT-4-HISTORY-FAVORITES.md#-future-considerations-post-sprint-4)

**Problem**: Original images can be deleted by OS

**Solution**: Store **RESIZED/COMPRESSED copies only** in app's permanent directory

> **Important**: Store small resized copies (3-75KB), NOT full-resolution duplicates (2-5MB)

```typescript
interface ScanHistoryItem {
  imageUri?: string;              // Original reference (may not exist)
  thumbnailUri?: string;          // 72x72px RESIZED copy (~3KB, permanent) ✅
  compressedImageUri?: string;    // 800px RESIZED copy (~75KB, optional) ✅
}

// Storage Math:
// - 500 thumbnails × 3KB = 1.5MB ✅ Acceptable
// - 500 compressed × 75KB = 37.5MB ✅ Optional, user choice
// - 500 full-res × 3MB = 1.5GB ❌ NOT acceptable!

// When saving scan:
const thumbnail = await createThumbnail(originalUri, 72); // RESIZED to 72px
const thumbnailUri = await saveToAppDirectory(thumbnail, `thumb_${id}.jpg`);

await historyService.addScan({
  nutritionData,
  imageUri: originalUri,      // Reference only (may be deleted later)
  thumbnailUri: thumbnailUri, // Permanent RESIZED copy ✅
  // ⚠️ Do NOT store full-resolution duplicate!
});
```

---

## 📝 Code References

### Current Implementation (Sprint 3)

1. **Camera/Gallery**: `src/hooks/useCamera.ts`
   - `capturePhoto()` returns `imageUri`
   - `pickFromGallery()` returns `imageUri`

2. **Image Processing**: `src/services/image.service.ts`
   - `compressImage(imageUri)` - Reduces file size
   - `convertToBase64(imageUri)` - For API upload

3. **AI Analysis**: `src/services/openai.service.ts`
   - `analyzeImage(base64Image)` - Returns `NutritionData` only

4. **Screens**:
   - `src/screens/HomeScreen.tsx` - Captures image, stores `imageUri`, passes to ReportScreen
   - `src/screens/ReportScreen.tsx` - Receives `imageUri` as prop

### Sprint 4 Implementation (Planned)

1. **Types**: `src/types/history.types.ts`
   ```typescript
   interface ScanHistoryItem {
     imageUri?: string; // ✅ Stored here
   }
   ```

2. **Service**: `src/services/history.service.ts`
   ```typescript
   async addScan(item: Omit<ScanHistoryItem, 'id' | ...>) {
     // Saves nutritionData + imageUri to secure storage
   }
   ```

3. **UI**: `src/components/HistoryListItem.tsx`
   ```typescript
   <Image source={{ uri: item.imageUri }} />
   ```

---

## ✅ Conclusion

**Question**: "Do we get imageUri from OpenAI?"

**Answer**: 
- ❌ **No**, OpenAI only returns nutrition data
- ✅ **Yes**, we have `imageUri` from camera/gallery
- ✅ We pass it separately from HomeScreen → ReportScreen
- ✅ We'll store it in history alongside nutrition data
- ⚠️ Original files may be deleted by OS (edge case)
- 🔮 Future: Store permanent copies (optional enhancement)

---

**Updated Files**:
1. ✅ `SPRINT-4-HISTORY-FAVORITES.md` - Added imageUri clarification in data model
2. ✅ `SPRINT-4-HISTORY-FAVORITES.md` - Added integration implementation note
3. ✅ `IMAGE-URI-FLOW-CLARIFICATION.md` - This comprehensive explanation

**Next Steps**: Proceed with Sprint 4 implementation as planned. The imageUri handling is already designed correctly! 🚀

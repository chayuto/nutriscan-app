# Sprint 4: History & Favorites - UI/UX Specifications

**Design System**: Neon Clarity (Dark theme with glassmorphism)  
**Focus**: Professional, accessible, and performant

---

## 🎨 Design Principles

### 1. **Visual Hierarchy**
- Primary actions use gradient buttons
- Secondary actions use glass buttons
- Tertiary actions are subtle text links
- Critical info (favorites, alerts) use neon accents

### 2. **Consistency**
- Match existing HomeScreen, ReportScreen, SettingsScreen patterns
- Reuse components: GlassCard, PrimaryButton, IconButton
- Maintain 8px spacing grid
- Use Inter font family throughout

### 3. **Performance**
- Virtualized lists (FlatList) for smooth scrolling
- Lazy load images
- Skeleton screens during load
- Optimistic UI updates

### 4. **Accessibility**
- WCAG AA compliance (4.5:1 contrast)
- 44pt minimum touch targets
- Screen reader support
- Haptic feedback on actions

---

## 📱 Screen 1: HistoryScreen (Main View)

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│  [← Back]         History           [⚙️ Settings]│  ← Header (64px)
│                                                  │
│  ╔════════════════════════════════════════════╗ │
│  ║  🔍  Search by product or brand...        ║ │  ← Search Bar (52px)
│  ╚════════════════════════════════════════════╝ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ 📊 Your Scanning Activity                  │ │  ← Stats Card
│  │                                            │ │  (120px height)
│  │  42 Total Scans    8 Favorites   🔥 15    │ │
│  │  Avg 320 kcal     Last scan: 2h ago       │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  [All] [Favorites ❤️] [This Week] [This Month]  │  ← Filter Tabs (48px)
│                                                  │
│  ╔════════════════════════════════════════════╗ │
│  ║  [IMAGE]  Greek Yogurt           [❤️ 1.2s]║ │  ← History Item
│  ║  Chobani                                  ║ │  (100px height)
│  ║  150 kcal • 12g protein                   ║ │
│  ║  2 days ago                     [View →] ║ │
│  ╚════════════════════════════════════════════╝ │
│                                                  │
│  ╔════════════════════════════════════════════╗ │
│  ║  [IMAGE]  Protein Bar            [♡]     ║ │
│  ║  Quest Nutrition                          ║ │
│  ║  200 kcal • 20g protein                   ║ │
│  ║  1 week ago                     [View →] ║ │
│  ╚════════════════════════════════════════════╝ │
│                                                  │
│  ╔════════════════════════════════════════════╗ │
│  ║  [IMAGE]  Almond Milk            [♡]     ║ │
│  ║  Almond Breeze                            ║ │
│  ║  30 kcal • 1g protein                     ║ │
│  ║  2 weeks ago                    [View →] ║ │
│  ╚════════════════════════════════════════════╝ │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Component Specifications

#### 1. **Search Bar** (GlassCard with Input)

```typescript
// Styling
const styles = StyleSheet.create({
  searchContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
    color: colors.textSecondary,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    height: 40,
  },
  clearButton: {
    padding: spacing.xs,
  },
});

// Features
- Real-time search (debounced 300ms)
- Search icon (🔍) on left
- Clear button (✕) on right (appears when typing)
- Placeholder: "Search by product or brand..."
- Focus state: neon glow border
- Keyboard type: default
- Return key: "search"
```

**Interactions:**
- Tap → Focus + keyboard opens
- Type → Filter results in real-time
- Clear button → Reset search + refocus
- Return key → Dismiss keyboard
- Blur → Keep search active

**Accessibility:**
```typescript
<TextInput
  accessible={true}
  accessibilityLabel="Search history"
  accessibilityHint="Type to filter scans by product or brand name"
  accessibilityRole="search"
/>
```

---

#### 2. **Stats Card** (Glass Dashboard)

```typescript
const styles = StyleSheet.create({
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statsTitle: {
    ...typography.h3,
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
  },
  statValue: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  streakText: {
    ...typography.caption,
    fontWeight: '600',
  },
});

// Layout
<View style={styles.statsCard}>
  <View style={styles.statsHeader}>
    <Text style={styles.statsTitle}>📊 Your Scanning Activity</Text>
    {streak > 0 && (
      <View style={styles.streakBadge}>
        <Text>🔥</Text>
        <Text style={styles.streakText}>{streak} day streak</Text>
      </View>
    )}
  </View>
  
  <View style={styles.statsGrid}>
    <View style={styles.statItem}>
      <Text style={styles.statValue}>42</Text>
      <Text style={styles.statLabel}>Total Scans</Text>
    </View>
    
    <View style={styles.statItem}>
      <Text style={styles.statValue}>8</Text>
      <Text style={styles.statLabel}>Favorites</Text>
    </View>
    
    <View style={styles.statItem}>
      <Text style={styles.statValue}>15</Text>
      <Text style={styles.statLabel}>This Week</Text>
    </View>
    
    <View style={styles.statItem}>
      <Text style={styles.statValue}>320</Text>
      <Text style={styles.statLabel}>Avg Calories</Text>
    </View>
  </View>
  
  <Text style={styles.lastScan}>Last scan: 2 hours ago</Text>
</View>
```

**Data Display:**
- Total Scans (all-time count)
- Favorites (count with heart icon)
- This Week (with 🔥 if > 5)
- Average Calories
- Last scan time (relative: "2h ago", "Yesterday", "1 week ago")

**Interactions:**
- Tap stat → Filter by that criteria (e.g., tap "Favorites" → show favorites filter)
- Tap streak badge → Show achievement modal (future)

**Empty State:**
```typescript
// When no scans exist
<Text style={styles.emptyText}>
  Start scanning to see your stats! 📊
</Text>
```

---

#### 3. **Filter Tabs** (Horizontal Scroll Chips)

```typescript
const styles = StyleSheet.create({
  filterContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.glow,
  },
  filterChipText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
});

// Filters
const filters = [
  { id: 'all', label: 'All', icon: '📋' },
  { id: 'favorites', label: 'Favorites', icon: '❤️' },
  { id: 'week', label: 'This Week', icon: '📅' },
  { id: 'month', label: 'This Month', icon: '📆' },
];
```

**Behavior:**
- Horizontal scroll if doesn't fit
- Single selection (radio button pattern)
- Active state: gradient background + glow
- Haptic feedback on selection
- Smooth animation (200ms)

**Animations:**
```typescript
// Scale animation on press
const scaleAnim = useRef(new Animated.Value(1)).current;

const handlePress = (filterId) => {
  Animated.sequence([
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }),
  ]).start();
  
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  setActiveFilter(filterId);
};
```

---

#### 4. **History List Item** (Swipeable Card)

```typescript
const styles = StyleSheet.create({
  listItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  itemContent: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.md,
    backgroundColor: colors.progressTrack,
  },
  thumbnailPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.md,
    backgroundColor: colors.progressTrack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
  },
  itemDetails: {
    flex: 1,
    gap: spacing.xs,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productName: {
    ...typography.bodyLarge,
    flex: 1,
    marginRight: spacing.sm,
  },
  favoriteButton: {
    padding: spacing.xs,
  },
  brandName: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  nutritionSummary: {
    ...typography.caption,
    color: colors.textMuted,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textMuted,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  viewButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteAction: {
    backgroundColor: colors.error,
  },
  shareAction: {
    backgroundColor: colors.info,
  },
  swipeActionText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});

// Component Structure
<Swipeable
  renderRightActions={() => (
    <>
      <TouchableOpacity style={[styles.swipeAction, styles.shareAction]}>
        <Text style={{ fontSize: 24 }}>📤</Text>
        <Text style={styles.swipeActionText}>Share</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.swipeAction, styles.deleteAction]}>
        <Text style={{ fontSize: 24 }}>🗑️</Text>
        <Text style={styles.swipeActionText}>Delete</Text>
      </TouchableOpacity>
    </>
  )}
>
  <View style={styles.listItem}>
    <View style={styles.itemContent}>
      {/* Thumbnail */}
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Text style={styles.placeholderIcon}>🥗</Text>
        </View>
      )}
      
      {/* Details */}
      <View style={styles.itemDetails}>
        <View style={styles.itemHeader}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.productName || 'Unnamed Product'}
          </Text>
          <IconButton
            icon={item.isFavorite ? '❤️' : '♡'}
            onPress={() => toggleFavorite(item.id)}
            size={32}
            style={styles.favoriteButton}
          />
        </View>
        
        <Text style={styles.brandName} numberOfLines={1}>
          {item.brandName || 'Unknown Brand'}
        </Text>
        
        <Text style={styles.nutritionSummary}>
          {item.nutritionData.calories || 0} kcal • 
          {item.nutritionData.protein || 0}g protein
        </Text>
        
        <View style={styles.itemFooter}>
          <Text style={styles.timestamp}>
            {formatRelativeTime(item.timestamp)}
          </Text>
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={() => navigateToDetail(item.id)}
          >
            <Text style={styles.viewButtonText}>View</Text>
            <Text style={{ color: colors.primary }}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </View>
</Swipeable>
```

**Swipe Actions:**
- **Swipe left**: Reveal Share (blue) and Delete (red)
- **Share**: Native share sheet with nutrition summary
- **Delete**: Confirmation alert → Remove with animation
- **Swipe threshold**: 80px (40% of action width)

**Animations:**
- Press: Scale 0.98 (100ms)
- Favorite: Heart scale 1 → 1.3 → 1 (300ms) + haptic
- Delete: Fade out + scale down (250ms) + haptic (medium)

**Touch Targets:**
- Favorite button: 44x44pt
- View button: 44x44pt (full width of footer area)
- Entire card: Tap to view details

**Accessibility:**
```typescript
<View
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={`${item.productName}, ${item.brandName}, ${item.nutritionData.calories} calories, scanned ${formatRelativeTime(item.timestamp)}`}
  accessibilityActions={[
    { name: 'favorite', label: item.isFavorite ? 'Remove from favorites' : 'Add to favorites' },
    { name: 'delete', label: 'Delete scan' },
  ]}
  onAccessibilityAction={(event) => {
    if (event.nativeEvent.actionName === 'favorite') toggleFavorite(item.id);
    if (event.nativeEvent.actionName === 'delete') deleteItem(item.id);
  }}
/>
```

---

#### 5. **Empty State** (No Scans)

```typescript
const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  emptyIllustration: {
    fontSize: 80,
    marginBottom: spacing.lg,
    opacity: 0.6,
  },
  emptyTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    minWidth: 200,
  },
});

// Layout
<View style={styles.emptyContainer}>
  <Text style={styles.emptyIllustration}>📋</Text>
  <Text style={styles.emptyTitle}>No Scans Yet</Text>
  <Text style={styles.emptySubtitle}>
    Start scanning nutrition labels to build your history
  </Text>
  <PrimaryButton 
    onPress={navigateToCamera}
    style={styles.emptyButton}
  >
    Scan Your First Label
  </PrimaryButton>
</View>
```

**Empty State Variations:**

1. **No scans at all**
   - Icon: 📋
   - Title: "No Scans Yet"
   - CTA: "Scan Your First Label"

2. **No search results**
   - Icon: 🔍
   - Title: "No Results Found"
   - Subtitle: Try different keywords
   - CTA: "Clear Search"

3. **No favorites**
   - Icon: ♡
   - Title: "No Favorites Yet"
   - Subtitle: "Tap the heart icon on scans to save them here"
   - No CTA button

---

#### 6. **Loading States**

```typescript
// Skeleton List Item
const SkeletonItem = () => (
  <View style={styles.listItem}>
    <View style={styles.itemContent}>
      <ShimmerPlaceholder
        style={styles.thumbnail}
        shimmerColors={[colors.progressTrack, colors.surface, colors.progressTrack]}
      />
      <View style={styles.itemDetails}>
        <ShimmerPlaceholder
          style={{ width: '70%', height: 20, borderRadius: 4, marginBottom: 8 }}
        />
        <ShimmerPlaceholder
          style={{ width: '50%', height: 14, borderRadius: 4, marginBottom: 8 }}
        />
        <ShimmerPlaceholder
          style={{ width: '60%', height: 14, borderRadius: 4 }}
        />
      </View>
    </View>
  </View>
);

// Initial Load
if (isLoading && items.length === 0) {
  return (
    <>
      <SkeletonItem />
      <SkeletonItem />
      <SkeletonItem />
    </>
  );
}

// Pull to Refresh
<FlatList
  data={items}
  refreshControl={
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      tintColor={colors.primary}
      colors={[colors.primary]}
    />
  }
/>
```

---

## 📱 Screen 2: History Detail Modal

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│  [✕ Close]                         [⋮ Options]  │  ← Header
│                                                  │
│  ╔════════════════════════════════════════════╗ │
│  ║                                            ║ │
│  ║         [Full Size Image]                 ║ │  ← Image (300px)
│  ║                                            ║ │
│  ╚════════════════════════════════════════════╝ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ 📝 Product Details                         │ │  ← Edit Card
│  │                                            │ │
│  │  Product Name                              │ │
│  │  [Greek Yogurt ✏️]                         │ │
│  │                                            │ │
│  │  Brand                                     │ │
│  │  [Chobani ✏️]                              │ │
│  │                                            │ │
│  │  Tags                                      │ │
│  │  [+ breakfast] [+ protein] [+ Add Tag]    │ │
│  │                                            │ │
│  │  Notes                                     │ │
│  │  [Great post-workout option... ✏️]        │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ 📊 Nutrition Information                   │ │  ← Nutrition Card
│  │                                            │ │
│  │  Calories            150 kcal              │ │
│  │  ▓▓░░░░░░░░ 8%                            │ │
│  │                                            │ │
│  │  Protein             12g                   │ │
│  │  ▓▓▓░░░░░░░ 24%                           │ │
│  │                                            │ │
│  │  [View Full Report →]                     │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ 🕒 Scanned on Oct 10, 2025 at 2:30 PM     │ │  ← Meta Info
│  └────────────────────────────────────────────┘ │
│                                                  │
│  [❤️ Add to Favorites]  [📤 Share]  [🗑️ Delete] │  ← Actions
│                                                  │
└─────────────────────────────────────────────────┘
```

### Component Specifications

#### 1. **Modal Container**

```typescript
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
});

// Presentation
<Modal
  visible={isVisible}
  animationType="slide"
  presentationStyle="pageSheet"
  onRequestClose={onClose}
>
  <SafeAreaView style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <IconButton icon="✕" onPress={onClose} />
        <IconButton icon="⋮" onPress={showOptions} />
      </View>
      
      <ScrollView style={styles.scrollContent}>
        {/* Content */}
      </ScrollView>
    </View>
  </SafeAreaView>
</Modal>
```

#### 2. **Editable Fields**

```typescript
const styles = StyleSheet.create({
  editableField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.progressTrack,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  editableFieldFocused: {
    borderColor: colors.primary,
    ...shadows.glow,
  },
  fieldValue: {
    ...typography.body,
    flex: 1,
  },
  fieldPlaceholder: {
    ...typography.body,
    color: colors.textMuted,
  },
  editIcon: {
    color: colors.primary,
    marginLeft: spacing.sm,
  },
});

// Editable Product Name
<TouchableOpacity 
  style={[styles.editableField, isEditing && styles.editableFieldFocused]}
  onPress={() => setIsEditing(true)}
>
  {isEditing ? (
    <TextInput
      value={productName}
      onChangeText={setProductName}
      style={styles.fieldValue}
      placeholder="Enter product name"
      placeholderTextColor={colors.textMuted}
      autoFocus
      onBlur={() => {
        setIsEditing(false);
        saveChanges();
      }}
    />
  ) : (
    <>
      <Text style={styles.fieldValue}>{productName || 'Tap to add name'}</Text>
      <Text style={styles.editIcon}>✏️</Text>
    </>
  )}
</TouchableOpacity>
```

#### 3. **Tag Management**

```typescript
const styles = StyleSheet.create({
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  tagText: {
    ...typography.caption,
    color: colors.text,
  },
  tagRemove: {
    color: colors.textMuted,
    fontSize: 14,
  },
  addTagButton: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  addTagText: {
    color: colors.primary,
    fontWeight: '600',
  },
});

// Tag List
<View style={styles.tagsContainer}>
  {tags.map(tag => (
    <View key={tag} style={styles.tag}>
      <Text style={styles.tagText}>{tag}</Text>
      <TouchableOpacity onPress={() => removeTag(tag)}>
        <Text style={styles.tagRemove}>✕</Text>
      </TouchableOpacity>
    </View>
  ))}
  
  <TouchableOpacity 
    style={[styles.tag, styles.addTagButton]}
    onPress={showAddTagModal}
  >
    <Text style={styles.addTagText}>+ Add Tag</Text>
  </TouchableOpacity>
</View>
```

#### 4. **Action Buttons**

```typescript
const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    backgroundColor: item.isFavorite ? colors.primary : colors.surface,
    borderColor: item.isFavorite ? colors.primary : colors.border,
  },
  deleteButton: {
    backgroundColor: colors.error + '20',
    borderColor: colors.error,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  actionText: {
    ...typography.caption,
    color: colors.text,
  },
});

// Action Bar
<View style={styles.actionBar}>
  <TouchableOpacity 
    style={[styles.actionButton, styles.favoriteButton]}
    onPress={handleToggleFavorite}
  >
    <Text style={styles.actionIcon}>{item.isFavorite ? '❤️' : '♡'}</Text>
    <Text style={styles.actionText}>Favorite</Text>
  </TouchableOpacity>
  
  <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
    <Text style={styles.actionIcon}>📤</Text>
    <Text style={styles.actionText}>Share</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={[styles.actionButton, styles.deleteButton]}
    onPress={handleDelete}
  >
    <Text style={styles.actionIcon}>🗑️</Text>
    <Text style={styles.actionText}>Delete</Text>
  </TouchableOpacity>
</View>
```

---

## 🎭 Animations & Transitions

### 1. **List Animations**

```typescript
import { LayoutAnimation } from 'react-native';

// When filter changes
const handleFilterChange = (filter) => {
  LayoutAnimation.configureNext(
    LayoutAnimation.create(
      300,
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.opacity
    )
  );
  setActiveFilter(filter);
};

// When item deleted
const handleDelete = async (id) => {
  LayoutAnimation.configureNext(
    LayoutAnimation.create(
      250,
      LayoutAnimation.Types.easeOut,
      LayoutAnimation.Properties.scaleXY
    )
  );
  await deleteItem(id);
};

// FlatList item animation
<Animated.View
  entering={FadeInDown.delay(index * 50).duration(300)}
  exiting={FadeOutUp.duration(200)}
>
  <HistoryListItem item={item} />
</Animated.View>
```

### 2. **Favorite Animation**

```typescript
const FavoriteButton = ({ isFavorite, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePress = () => {
    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    onPress();
  };
  
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPress={handlePress}>
        <Text style={{ fontSize: 28 }}>
          {isFavorite ? '❤️' : '♡'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
```

### 3. **Pull to Refresh**

```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = useCallback(async () => {
  setRefreshing(true);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  
  try {
    await loadItems();
    await loadStats();
  } finally {
    setRefreshing(false);
  }
}, []);
```

### 4. **Swipe Actions Reveal**

```typescript
import Swipeable from 'react-native-gesture-handler/Swipeable';

const renderRightActions = (progress, dragX) => {
  const trans = dragX.interpolate({
    inputRange: [-160, 0],
    outputRange: [0, 160],
    extrapolate: 'clamp',
  });
  
  return (
    <Animated.View
      style={{
        flexDirection: 'row',
        transform: [{ translateX: trans }],
      }}
    >
      <TouchableOpacity style={styles.shareAction} onPress={handleShare}>
        <Text style={{ fontSize: 24 }}>📤</Text>
        <Text style={styles.swipeActionText}>Share</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteAction} onPress={handleDelete}>
        <Text style={{ fontSize: 24 }}>🗑️</Text>
        <Text style={styles.swipeActionText}>Delete</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
```

---

## ⚡ Performance Optimizations

### 1. **Virtualized List**

```typescript
<FlatList
  data={filteredItems}
  renderItem={({ item, index }) => (
    <HistoryListItem item={item} index={index} />
  )}
  keyExtractor={item => item.id}
  
  // Performance props
  initialNumToRender={10}
  maxToRenderPerBatch={5}
  windowSize={5}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: 100, // Fixed item height
    offset: 100 * index,
    index,
  })}
  
  // Optimization
  updateCellsBatchingPeriod={50}
/>
```

### 2. **Image Optimization**

```typescript
<Image
  source={{ uri: item.imageUri }}
  style={styles.thumbnail}
  resizeMode="cover"
  
  // Optimization
  defaultSource={require('@/assets/placeholder.png')}
  loadingIndicatorSource={require('@/assets/loading.png')}
  
  // Cache
  cachePolicy="memory-disk"
/>
```

### 3. **Memoization**

```typescript
const HistoryListItem = React.memo(({ item, onToggleFavorite, onDelete }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.isFavorite === nextProps.item.isFavorite &&
    prevProps.item.updatedAt === nextProps.item.updatedAt
  );
});
```

### 4. **Debounced Search**

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (query) => {
    loadItems({ searchQuery: query });
  },
  300 // 300ms delay
);

const handleSearchChange = (text) => {
  setSearchQuery(text);
  debouncedSearch(text);
};
```

---

## ♿ Accessibility Checklist

### Visual
- [ ] Color contrast 4.5:1 minimum (text/background)
- [ ] Large text 3:1 minimum
- [ ] Focus indicators visible (neon glow)
- [ ] Icon + text labels (not icon-only)

### Touch
- [ ] 44pt minimum touch targets
- [ ] Adequate spacing (8px minimum between elements)
- [ ] Swipe actions have 80px width minimum

### Screen Readers
- [ ] All interactive elements have accessibilityLabel
- [ ] accessibilityRole set correctly
- [ ] accessibilityHint provided
- [ ] accessibilityActions for custom gestures
- [ ] Announce state changes (favorite toggled, item deleted)

### Input
- [ ] Keyboard support (focus order logical)
- [ ] Return key actions (search input)
- [ ] Auto-capitalize/correct disabled where needed
- [ ] Keyboard type appropriate (default for search)

---

## 📐 Responsive Considerations

### Portrait (Default)
- Standard layout as specified
- Full-width cards
- Vertical scrolling

### Landscape
- Grid layout (2 columns) for list items
- Stats card remains single row
- Search bar same

### Tablet/Large Screens
- Max width 768px (centered)
- Larger thumbnails (96px)
- More visible items

---

## 🎨 Design Tokens Quick Reference

```typescript
// From existing theme
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';

// Key colors
colors.primary = '#34D399'        // Teal (favorites, CTAs)
colors.background = '#111827'     // Deep space blue
colors.surface = 'rgba(31, 41, 55, 0.5)' // Glass cards
colors.text = '#F9FAFB'          // Primary text
colors.textSecondary = '#9CA3AF' // Secondary text
colors.border = 'rgba(249, 250, 251, 0.2)' // Borders

// Key spacing
spacing.xs = 4
spacing.sm = 8
spacing.md = 16
spacing.lg = 24
spacing.xl = 32
spacing.xxl = 48

// Key typography
typography.h2 = { fontSize: 24, fontWeight: '600', fontFamily: 'Inter_600SemiBold' }
typography.body = { fontSize: 16, fontWeight: '400', fontFamily: 'Inter_400Regular' }
typography.caption = { fontSize: 14, fontWeight: '400', fontFamily: 'Inter_400Regular' }

// Key border radius
borderRadius.sm = 8
borderRadius.md = 12
borderRadius.lg = 16
borderRadius.xl = 20
borderRadius.full = 9999

// Key shadows
shadows.sm = { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 2 }
shadows.md = { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 }
shadows.glow = { shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 }
```

---

## ✅ UI/UX Checklist

### Before Development
- [ ] Review design system (00-design-system-summary.md)
- [ ] Check existing components for reuse
- [ ] Verify color contrast ratios
- [ ] Plan animations and transitions

### During Development
- [ ] Use theme tokens (no hardcoded values)
- [ ] Test on iOS and Android
- [ ] Test with VoiceOver/TalkBack
- [ ] Test with 500+ items for performance
- [ ] Test all touch targets (44pt minimum)

### Before Merge
- [ ] Accessibility audit complete
- [ ] Animations smooth (60 FPS)
- [ ] Loading states implemented
- [ ] Empty states implemented
- [ ] Error states handled
- [ ] All interactions have visual feedback
- [ ] All actions have haptic feedback

---

**UI/UX Plan Complete!** 🎨

This design maintains NutriScan's premium Neon Clarity aesthetic while ensuring professional, accessible, and performant user experience. Ready to implement! 🚀

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  ScrollView,
  Pressable,
  Alert,
  BackHandler,
} from 'react-native';
import { HistoryList, HistoryStats, SearchBar } from '@/components/history';
import { useHistory } from '@/hooks/useHistory';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { borderRadius } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import type { ScanHistoryItem } from '@/types/history.types';
import type { NutritionData } from '@/types/nutrition.types';

export interface HistoryScreenProps {
  onBack: () => void;
  onNavigateToSettings: () => void;
  onViewReport?: (data: NutritionData, imageUri?: string) => void;
  testID?: string;
}

type FilterTab = 'all' | 'favorites' | 'week' | 'month';

/**
 * HistoryScreen - Complete scan history with search, filters, and stats
 *
 * Features:
 * - Search by product name/brand (debounced)
 * - Filter tabs: All, Favorites, This Week, This Month
 * - Statistics dashboard
 * - Pull-to-refresh
 * - Favorite toggle
 * - Delete with confirmation
 * - Detail modal
 * - Empty states
 *
 * Layout:
 * - Header with back button and settings
 * - Search bar (glass card)
 * - Statistics dashboard
 * - Filter tabs
 * - Scrollable list of history items
 * - Detail modal (full-screen overlay)
 */
export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onBack,
  onNavigateToSettings,
  onViewReport,
  testID = 'history-screen',
}) => {
  // History hook with all operations
  const {
    items,
    stats,
    isLoading,
    error,
    toggleFavorite,
    deleteItem,
    clearHistory,
    refresh,
    updateItem,
  } = useHistory();

  // Local state for UI interactions and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedItem, setSelectedItem] = useState<ScanHistoryItem | null>(null);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Inline editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Filter items based on search query and active filter
  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const productName = item.productName?.toLowerCase() || '';
        const tags = item.tags?.map((t) => t.toLowerCase()).join(' ') || '';
        return productName.includes(query) || tags.includes(query);
      });
    }

    // Apply time/favorite filter
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    if (activeFilter === 'favorites') {
      filtered = filtered.filter((item) => item.isFavorite);
    } else if (activeFilter === 'week') {
      filtered = filtered.filter((item) => item.timestamp >= oneWeekAgo);
    } else if (activeFilter === 'month') {
      filtered = filtered.filter((item) => item.timestamp >= oneMonthAgo);
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [items, searchQuery, activeFilter]);

  // Sync selectedItem with items array when items update
  // This ensures the modal shows fresh data after edits
  useEffect(() => {
    if (selectedItem) {
      const updatedItem = items.find((item) => item.id === selectedItem.id);
      if (updatedItem && updatedItem.productName !== selectedItem.productName) {
        setSelectedItem(updatedItem);
      }
    }
  }, [items, selectedItem]);

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If modal is open, close it
      if (selectedItem) {
        setSelectedItem(null);
        setIsEditingName(false);
        setEditedName('');
        return true; // Prevent default behavior (exit app)
      }

      // Otherwise, navigate back to home
      onBack();
      return true; // Prevent default behavior (exit app)
    });

    return () => backHandler.remove();
  }, [selectedItem, onBack]);

  // Handle search query changes (debounced in SearchBar component)
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle filter tab selection
  const handleFilterChange = useCallback((filter: FilterTab) => {
    setActiveFilter(filter);
  }, []);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  // Handle favorite toggle with optimistic update
  const handleToggleFavorite = useCallback(
    async (id: string) => {
      setTogglingItemId(id);

      try {
        await toggleFavorite(id, true);
      } catch {
        Alert.alert('Error', 'Failed to update favorite. Please try again.');
      } finally {
        setTogglingItemId(null);
      }
    },
    [toggleFavorite]
  );

  // Handle item deletion with confirmation
  const handleDeleteItem = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);
      const productName = item?.productName || 'this scan';

      Alert.alert('Delete Scan', `Are you sure you want to delete "${productName}"?`, [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingItemId(id);

            try {
              await deleteItem(id);
            } catch {
              Alert.alert('Error', 'Failed to delete scan. Please try again.');
            } finally {
              setDeletingItemId(null);
            }
          },
        },
      ]);
    },
    [items, deleteItem]
  );

  // Handle item press - show detail modal
  const handleItemPress = useCallback((item: ScanHistoryItem) => {
    setSelectedItem(item);
  }, []);

  // Close detail modal
  const handleCloseDetail = useCallback(() => {
    setSelectedItem(null);
    setIsEditingName(false);
    setEditedName('');
  }, []);

  // Start editing product name
  const handleStartEditName = useCallback(() => {
    if (selectedItem) {
      setEditedName(selectedItem.productName || '');
      setIsEditingName(true);
    }
  }, [selectedItem]);

  // Save edited product name
  const handleSaveName = useCallback(async () => {
    if (selectedItem && editedName.trim() && editedName.trim() !== selectedItem.productName) {
      const newName = editedName.trim();

      try {
        // Update item in storage (this calls refresh internally in the hook)
        await updateItem(selectedItem.id, { productName: newName });

        // Update the modal's selected item immediately with new name
        setSelectedItem({ ...selectedItem, productName: newName });
      } catch (err) {
        console.error('Failed to save product name:', err);
        Alert.alert('Error', 'Failed to update product name. Please try again.');
      }
    }
    setIsEditingName(false);
  }, [selectedItem, editedName, updateItem]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setIsEditingName(false);
    setEditedName('');
  }, []);

  // Handle view full report from detail modal
  const handleViewFullReport = useCallback(() => {
    if (selectedItem && onViewReport) {
      onViewReport(selectedItem.nutritionData, selectedItem.imageUri);
      setSelectedItem(null);
    }
  }, [selectedItem, onViewReport]);

  // Handle clear all history
  const handleClearHistory = useCallback(() => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to delete all scan history? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearHistory();
            } catch {
              Alert.alert('Error', 'Failed to clear history. Please try again.');
            }
          },
        },
      ]
    );
  }, [clearHistory]);

  // Render filter tabs
  const renderFilterTabs = useMemo(
    () => (
      <View style={styles.filterTabs}>
        <Pressable
          style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
          onPress={() => handleFilterChange('all')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Show all scans"
          accessibilityState={{ selected: activeFilter === 'all' }}
        >
          <Text
            style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}
          >
            All
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterTab, activeFilter === 'favorites' && styles.filterTabActive]}
          onPress={() => handleFilterChange('favorites')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Show favorites"
          accessibilityState={{ selected: activeFilter === 'favorites' }}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === 'favorites' && styles.filterTabTextActive,
            ]}
          >
            Favorites ❤️
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterTab, activeFilter === 'week' && styles.filterTabActive]}
          onPress={() => handleFilterChange('week')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Show this week"
          accessibilityState={{ selected: activeFilter === 'week' }}
        >
          <Text
            style={[styles.filterTabText, activeFilter === 'week' && styles.filterTabTextActive]}
          >
            This Week
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterTab, activeFilter === 'month' && styles.filterTabActive]}
          onPress={() => handleFilterChange('month')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Show this month"
          accessibilityState={{ selected: activeFilter === 'month' }}
        >
          <Text
            style={[styles.filterTabText, activeFilter === 'month' && styles.filterTabTextActive]}
          >
            This Month
          </Text>
        </Pressable>
      </View>
    ),
    [activeFilter, handleFilterChange]
  );

  // Render empty state based on current filter
  const getEmptyState = useMemo(() => {
    if (searchQuery) {
      return {
        icon: '🔍',
        title: 'No Results',
        message: `No scans found matching "${searchQuery}".`,
      };
    }

    if (activeFilter === 'favorites') {
      return {
        icon: '⭐',
        title: 'No Favorites Yet',
        message: 'Star your favorite products to see them here.',
      };
    }

    if (activeFilter === 'week' || activeFilter === 'month') {
      return {
        icon: '📅',
        title: 'No Recent Scans',
        message: `No scans found in this time period.`,
      };
    }

    return {
      icon: '📋',
      title: 'No Scan History',
      message: 'Start scanning nutrition labels to build your history.',
    };
  }, [searchQuery, activeFilter]);

  // Render detail modal
  const renderDetailModal = () => {
    if (!selectedItem) return null;

    const { productName, nutritionData, timestamp, isFavorite } = selectedItem;

    return (
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseDetail}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Pressable
              onPress={handleCloseDetail}
              style={styles.headerButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close detail view"
            >
              <Text style={styles.headerButtonText}>✕</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Scan Details</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Modal Content */}
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
            {/* Product Info */}
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <View style={styles.detailHeaderText}>
                  {isEditingName ? (
                    <View style={styles.editNameContainer}>
                      <TextInput
                        value={editedName}
                        onChangeText={setEditedName}
                        onSubmitEditing={handleSaveName}
                        onBlur={handleSaveName}
                        autoFocus
                        placeholder="Enter product name"
                        placeholderTextColor={colors.textMuted}
                        style={styles.editNameInput}
                        returnKeyType="done"
                        accessible={true}
                        accessibilityLabel="Edit product name"
                        accessibilityHint="Enter new product name and press done"
                      />
                      <Pressable
                        onPress={handleCancelEdit}
                        style={styles.editCancelButton}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Cancel editing"
                      >
                        <Text style={styles.editCancelText}>✕</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.productNameRow}>
                      <Text style={styles.detailProductName}>
                        {productName || 'Unnamed Product'}
                      </Text>
                      <Pressable
                        onPress={handleStartEditName}
                        style={styles.editButton}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Edit product name"
                      >
                        <Text style={styles.editIcon}>✎</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
                <Text style={styles.detailFavoriteIcon}>{isFavorite ? '★' : '☆'}</Text>
              </View>

              <Text style={styles.detailTimestamp}>
                Scanned {new Date(timestamp).toLocaleDateString()}
              </Text>
            </View>

            {/* Nutrition Summary */}
            <View style={styles.detailCard}>
              <Text style={styles.detailSectionTitle}>Nutrition Summary</Text>

              <View style={styles.detailNutritionGrid}>
                <View style={styles.detailNutrientItem}>
                  <Text style={styles.detailNutrientValue}>
                    {nutritionData.calories || '—'} kcal
                  </Text>
                  <Text style={styles.detailNutrientLabel}>Calories</Text>
                </View>

                <View style={styles.detailNutrientItem}>
                  <Text style={styles.detailNutrientValue}>{nutritionData.protein || '—'} g</Text>
                  <Text style={styles.detailNutrientLabel}>Protein</Text>
                </View>

                <View style={styles.detailNutrientItem}>
                  <Text style={styles.detailNutrientValue}>{nutritionData.fat || '—'} g</Text>
                  <Text style={styles.detailNutrientLabel}>Fat</Text>
                </View>

                <View style={styles.detailNutrientItem}>
                  <Text style={styles.detailNutrientValue}>
                    {nutritionData.carbohydrates || '—'} g
                  </Text>
                  <Text style={styles.detailNutrientLabel}>Carbs</Text>
                </View>

                <View style={styles.detailNutrientItem}>
                  <Text style={styles.detailNutrientValue}>{nutritionData.sugars || '—'} g</Text>
                  <Text style={styles.detailNutrientLabel}>Sugars</Text>
                </View>

                <View style={styles.detailNutrientItem}>
                  <Text style={styles.detailNutrientValue}>{nutritionData.fiber || '—'} g</Text>
                  <Text style={styles.detailNutrientLabel}>Fiber</Text>
                </View>

                <View style={styles.detailNutrientItem}>
                  <Text style={styles.detailNutrientValue}>
                    {nutritionData.saturatedFat || '—'} g
                  </Text>
                  <Text style={styles.detailNutrientLabel}>Sat. Fat</Text>
                </View>

                <View style={styles.detailNutrientItem}>
                  <Text style={styles.detailNutrientValue}>{nutritionData.sodium || '—'} mg</Text>
                  <Text style={styles.detailNutrientLabel}>Sodium</Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            {onViewReport && (
              <Pressable
                style={({ pressed }) => [styles.viewReportButton, pressed && styles.buttonPressed]}
                onPress={handleViewFullReport}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="View full nutrition report"
              >
                <Text style={styles.viewReportButtonText}>View Full Report →</Text>
              </Pressable>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={styles.headerButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID={`${testID}-back-button`}
        >
          <Text style={styles.headerButtonText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>History</Text>
        <Pressable
          onPress={onNavigateToSettings}
          style={styles.headerButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          testID={`${testID}-settings-button`}
        >
          <Text style={styles.headerButtonText}>⚙️</Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={handleSearchChange}
        placeholder="Search by product or brand..."
        testID={`${testID}-search-bar`}
      />

      {/* Statistics Dashboard */}
      {!isLoading && items.length > 0 && stats && (
        <View style={styles.statsContainer}>
          <HistoryStats stats={stats} testID={`${testID}-stats`} />
        </View>
      )}

      {/* Filter Tabs */}
      {!isLoading && items.length > 0 && renderFilterTabs}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* History List */}
      <View style={styles.listContainer}>
        <HistoryList
          items={filteredItems}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onItemPress={handleItemPress}
          onToggleFavorite={handleToggleFavorite}
          onDeleteItem={handleDeleteItem}
          togglingItemId={togglingItemId}
          deletingItemId={deletingItemId}
          showDelete={true}
          emptyState={getEmptyState}
          testID={`${testID}-list`}
        />
      </View>

      {/* Clear All Button (only when items exist) */}
      {!isLoading && items.length > 0 && (
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.clearAllButton, pressed && styles.buttonPressed]}
            onPress={handleClearHistory}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Clear all history"
            testID={`${testID}-clear-all-button`}
          >
            <Text style={styles.clearAllButtonText}>Clear All History</Text>
          </Pressable>
        </View>
      )}

      {/* Detail Modal */}
      {renderDetailModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.surfaceDark,
  },
  headerButtonText: {
    fontSize: 20,
    color: colors.text,
  },
  headerTitle: {
    ...typography.h2,
    fontSize: 20,
  },
  statsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: colors.primary,
  },
  filterTabText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  errorContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + spacing.md, // 48px + 16px = 64px for Android nav bar
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearAllButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearAllButtonText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '500',
  },
  buttonPressed: {
    opacity: 0.7,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    fontSize: 18,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  detailCard: {
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  detailHeaderText: {
    flex: 1,
  },
  detailProductName: {
    ...typography.h2,
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  detailBrand: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailFavoriteIcon: {
    fontSize: 28,
    marginLeft: spacing.sm,
    color: colors.primary,
  },
  detailTimestamp: {
    ...typography.caption,
    color: colors.textMuted,
  },
  detailSectionTitle: {
    ...typography.h3,
    fontSize: 18,
    marginBottom: spacing.md,
  },
  detailNutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  detailNutrientItem: {
    width: '22%',
    alignItems: 'center',
  },
  detailNutrientValue: {
    ...typography.h3,
    fontSize: 20,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  detailNutrientLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  viewReportButton: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  viewReportButtonText: {
    ...typography.button,
    color: colors.primary,
  },

  // Inline editing styles
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
  },
  editIcon: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  editNameInput: {
    flex: 1,
    ...typography.h2,
    fontSize: 24,
    color: colors.text,
    backgroundColor: colors.progressTrack,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.glow,
  },
  editCancelButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
  },
  editCancelText: {
    fontSize: 18,
    color: colors.error,
    fontWeight: '700',
  },
});

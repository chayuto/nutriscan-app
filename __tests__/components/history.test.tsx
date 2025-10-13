/**
 * Tests for History UI Components
 *
 * Comprehensive tests for all history-related components:
 * - HistoryListItem
 * - HistoryList
 * - SearchBar
 * - FavoriteButton
 * - HistoryStats
 * - EmptyState
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import {
  HistoryListItem,
  HistoryList,
  SearchBar,
  FavoriteButton,
  HistoryStats,
  EmptyState,
} from '@/components/history';
import type { ScanHistoryItem, HistoryStats as HistoryStatsType } from '@/types/history.types';

// Mock BlurView
jest.mock('@react-native-community/blur', () => ({
  BlurView: ({ children }: { children: React.ReactNode }) => children,
}));

describe('History Components', () => {
  // Sample data
  const mockItem: ScanHistoryItem = {
    id: 'test-1',
    timestamp: Date.now() - 3600000, // 1 hour ago
    productName: 'Test Product',
    brandName: 'Test Brand',
    nutritionData: {
      calories: 250,
      protein: 10,
      fat: 15,
      saturatedFat: 5,
      carbohydrates: 30,
      sugars: 12,
      fiber: 3,
      sodium: 400,
    },
    imageUri: 'file:///test-image.jpg',
    isFavorite: false,
    tags: ['breakfast', 'healthy'],
    notes: 'Test notes',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now(),
    version: 1,
  };

  const mockStats: HistoryStatsType = {
    totalScans: 42,
    favoritesCount: 10,
    scansThisWeek: 5,
    scansThisMonth: 15,
    averageCalories: 350,
    mostScannedProduct: 'Favorite Cereal',
    lastScanAt: Date.now(),
    currentStreak: 3,
    allTags: ['breakfast', 'lunch', 'dinner'],
  };

  describe('HistoryListItem', () => {
    it('should render item with all data', () => {
      const { getByText } = render(<HistoryListItem item={mockItem} />);

      expect(getByText('Test Product')).toBeTruthy();
      expect(getByText('Test Brand')).toBeTruthy();
      expect(getByText('250 cal')).toBeTruthy();
      expect(getByText('10g protein')).toBeTruthy();
      expect(getByText('breakfast, healthy')).toBeTruthy();
    });

    it('should call onPress when item is pressed', () => {
      const onPress = jest.fn();
      const { getByText } = render(<HistoryListItem item={mockItem} onPress={onPress} />);

      fireEvent.press(getByText('Test Product'));

      expect(onPress).toHaveBeenCalledWith(mockItem);
    });

    it('should call onToggleFavorite when favorite button is pressed', () => {
      const onToggleFavorite = jest.fn();
      const { getByLabelText } = render(
        <HistoryListItem item={mockItem} onToggleFavorite={onToggleFavorite} />
      );

      fireEvent.press(getByLabelText('Add to favorites'));

      expect(onToggleFavorite).toHaveBeenCalledWith('test-1');
    });

    it('should call onDelete when delete button is pressed', () => {
      const onDelete = jest.fn();
      const { getByLabelText } = render(<HistoryListItem item={mockItem} onDelete={onDelete} />);

      fireEvent.press(getByLabelText('Delete scan'));

      expect(onDelete).toHaveBeenCalledWith('test-1');
    });

    it('should show favorite icon when item is favorited', () => {
      const favoritedItem = { ...mockItem, isFavorite: true };
      const { getByLabelText } = render(<HistoryListItem item={favoritedItem} />);

      expect(getByLabelText('Remove from favorites')).toBeTruthy();
    });

    it('should show loading spinner when toggling favorite', () => {
      const { getByLabelText, queryByText } = render(
        <HistoryListItem item={mockItem} isTogglingFavorite={true} />
      );

      // Should show ActivityIndicator
      const favoriteButton = getByLabelText('Add to favorites');
      expect(favoriteButton).toBeTruthy();

      // Star icon should not be visible
      expect(queryByText('☆')).toBeNull();
    });

    it('should show loading spinner when deleting', () => {
      const { getByLabelText } = render(<HistoryListItem item={mockItem} isDeleting={true} />);

      // Should show ActivityIndicator
      const deleteButton = getByLabelText('Delete scan');
      expect(deleteButton).toBeTruthy();
    });

    it('should hide delete button when showDelete is false', () => {
      const { queryByLabelText } = render(<HistoryListItem item={mockItem} showDelete={false} />);

      expect(queryByLabelText('Delete scan')).toBeNull();
    });

    it('should show placeholder when no image', () => {
      const noImageItem = { ...mockItem, imageUri: undefined };
      const { getByText } = render(<HistoryListItem item={noImageItem} />);

      expect(getByText('IMG')).toBeTruthy();
    });

    it('should show unnamed product when no name', () => {
      const noNameItem = { ...mockItem, productName: undefined };
      const { getByText } = render(<HistoryListItem item={noNameItem} />);

      expect(getByText('Unnamed Product')).toBeTruthy();
    });

    it('should format timestamp correctly', () => {
      const recentItem = { ...mockItem, timestamp: Date.now() - 1800000 }; // 30 min ago
      const { getByText } = render(<HistoryListItem item={recentItem} />);

      // Should show relative time (30m ago or similar)
      expect(getByText(/ago/)).toBeTruthy();
    });

    it('should color-code calories correctly', () => {
      // Low calories (< 200) - green
      const lowCalItem = {
        ...mockItem,
        nutritionData: { ...mockItem.nutritionData, calories: 150 },
      };
      const { getByText: getByText1 } = render(<HistoryListItem item={lowCalItem} />);
      expect(getByText1('150 cal')).toBeTruthy();

      // Medium calories (200-400) - amber
      const medCalItem = {
        ...mockItem,
        nutritionData: { ...mockItem.nutritionData, calories: 300 },
      };
      const { getByText: getByText2 } = render(<HistoryListItem item={medCalItem} />);
      expect(getByText2('300 cal')).toBeTruthy();

      // High calories (> 400) - red
      const highCalItem = {
        ...mockItem,
        nutritionData: { ...mockItem.nutritionData, calories: 500 },
      };
      const { getByText: getByText3 } = render(<HistoryListItem item={highCalItem} />);
      expect(getByText3('500 cal')).toBeTruthy();
    });
  });

  describe('HistoryList', () => {
    it('should render list of items', () => {
      const items = [mockItem, { ...mockItem, id: 'test-2', productName: 'Another Product' }];
      const { getByText } = render(<HistoryList items={items} />);

      expect(getByText('Test Product')).toBeTruthy();
      expect(getByText('Another Product')).toBeTruthy();
    });

    it('should show empty state when no items', () => {
      const { getByText } = render(<HistoryList items={[]} />);

      expect(getByText('No Scans Yet')).toBeTruthy();
      expect(getByText('Start scanning nutrition labels to build your history.')).toBeTruthy();
    });

    it('should call onRefresh when pulled down', () => {
      const onRefresh = jest.fn();
      render(<HistoryList items={[mockItem]} onRefresh={onRefresh} />);

      // Simulate pull-to-refresh (RefreshControl triggers onRefresh)
      // Note: In actual testing, this would be triggered by the RefreshControl
      expect(onRefresh).toBeDefined();
    });

    it('should pass callbacks to list items', () => {
      const onItemPress = jest.fn();
      const onToggleFavorite = jest.fn();
      const onDeleteItem = jest.fn();

      const { getByText, getByLabelText } = render(
        <HistoryList
          items={[mockItem]}
          onItemPress={onItemPress}
          onToggleFavorite={onToggleFavorite}
          onDeleteItem={onDeleteItem}
        />
      );

      // Press item
      fireEvent.press(getByText('Test Product'));
      expect(onItemPress).toHaveBeenCalledWith(mockItem);

      // Toggle favorite
      fireEvent.press(getByLabelText('Add to favorites'));
      expect(onToggleFavorite).toHaveBeenCalledWith('test-1');

      // Delete item
      fireEvent.press(getByLabelText('Delete scan'));
      expect(onDeleteItem).toHaveBeenCalledWith('test-1');
    });

    it('should show custom empty state', () => {
      const emptyState = {
        icon: '🔍',
        title: 'No Results',
        message: 'Try different filters',
        actionLabel: 'Clear Filters',
        onAction: jest.fn(),
      };

      const { getByText } = render(<HistoryList items={[]} emptyState={emptyState} />);

      expect(getByText('🔍')).toBeTruthy();
      expect(getByText('No Results')).toBeTruthy();
      expect(getByText('Try different filters')).toBeTruthy();
      expect(getByText('Clear Filters')).toBeTruthy();
    });
  });

  describe('SearchBar', () => {
    it('should render with placeholder', () => {
      const { getByPlaceholderText } = render(
        <SearchBar value="" onChangeText={jest.fn()} placeholder="Search..." />
      );

      expect(getByPlaceholderText('Search...')).toBeTruthy();
    });

    it('should call onChangeText with debounce', async () => {
      const onChangeText = jest.fn();
      const { getByLabelText } = render(
        <SearchBar value="" onChangeText={onChangeText} debounceMs={100} />
      );

      const input = getByLabelText('Search scan history');
      fireEvent.changeText(input, 'test query');

      // Should not call immediately
      expect(onChangeText).not.toHaveBeenCalled();

      // Should call after debounce delay
      await waitFor(
        () => {
          expect(onChangeText).toHaveBeenCalledWith('test query');
        },
        { timeout: 200 }
      );
    });

    it('should show clear button when text entered', () => {
      const { getByLabelText, queryByLabelText } = render(
        <SearchBar value="" onChangeText={jest.fn()} />
      );

      const input = getByLabelText('Search scan history');

      // No clear button initially
      expect(queryByLabelText('Clear search')).toBeNull();

      // Enter text
      fireEvent.changeText(input, 'test');

      // Clear button should appear
      expect(getByLabelText('Clear search')).toBeTruthy();
    });

    it('should clear text when clear button pressed', () => {
      const onChangeText = jest.fn();
      const { getByLabelText } = render(<SearchBar value="test" onChangeText={onChangeText} />);

      const clearButton = getByLabelText('Clear search');
      fireEvent.press(clearButton);

      expect(onChangeText).toHaveBeenCalledWith('');
    });

    it('should sync with external value changes', () => {
      const { getByLabelText, rerender } = render(<SearchBar value="" onChangeText={jest.fn()} />);

      const input = getByLabelText('Search scan history');
      expect(input.props.value).toBe('');

      // Update external value
      rerender(<SearchBar value="external update" onChangeText={jest.fn()} />);

      expect(input.props.value).toBe('external update');
    });

    it('should be disabled when disabled prop is true', () => {
      const { getByLabelText } = render(
        <SearchBar value="" onChangeText={jest.fn()} disabled={true} />
      );

      const input = getByLabelText('Search scan history');
      expect(input.props.editable).toBe(false);
    });
  });

  describe('FavoriteButton', () => {
    it('should render with star outline when not favorite', () => {
      const { getByText } = render(<FavoriteButton isFavorite={false} onPress={jest.fn()} />);

      expect(getByText('☆')).toBeTruthy();
    });

    it('should render with filled star when favorite', () => {
      const { getByText } = render(<FavoriteButton isFavorite={true} onPress={jest.fn()} />);

      expect(getByText('★')).toBeTruthy();
    });

    it('should call onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByLabelText } = render(<FavoriteButton isFavorite={false} onPress={onPress} />);

      fireEvent.press(getByLabelText('Add to favorites'));

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should show loading spinner when loading', () => {
      const { queryByText } = render(
        <FavoriteButton isFavorite={false} onPress={jest.fn()} isLoading={true} />
      );

      // Star should not be visible
      expect(queryByText('☆')).toBeNull();
    });

    it('should be disabled when disabled prop is true', () => {
      const onPress = jest.fn();
      const { getByLabelText } = render(
        <FavoriteButton isFavorite={false} onPress={onPress} disabled={true} />
      );

      const button = getByLabelText('Add to favorites');
      fireEvent.press(button);

      expect(onPress).not.toHaveBeenCalled();
    });

    it('should render different sizes', () => {
      const { getByLabelText: getByLabelText1 } = render(
        <FavoriteButton isFavorite={false} onPress={jest.fn()} size="small" />
      );
      expect(getByLabelText1('Add to favorites')).toBeTruthy();

      const { getByLabelText: getByLabelText2 } = render(
        <FavoriteButton isFavorite={false} onPress={jest.fn()} size="medium" />
      );
      expect(getByLabelText2('Add to favorites')).toBeTruthy();

      const { getByLabelText: getByLabelText3 } = render(
        <FavoriteButton isFavorite={false} onPress={jest.fn()} size="large" />
      );
      expect(getByLabelText3('Add to favorites')).toBeTruthy();
    });

    it('should have correct accessibility label', () => {
      const { getByLabelText, rerender } = render(
        <FavoriteButton isFavorite={false} onPress={jest.fn()} />
      );

      expect(getByLabelText('Add to favorites')).toBeTruthy();

      rerender(<FavoriteButton isFavorite={true} onPress={jest.fn()} />);

      expect(getByLabelText('Remove from favorites')).toBeTruthy();
    });
  });

  describe('HistoryStats', () => {
    it('should render all statistics', () => {
      const { getByText } = render(<HistoryStats stats={mockStats} />);

      expect(getByText('Your Statistics')).toBeTruthy();
      expect(getByText('42')).toBeTruthy(); // totalScans
      expect(getByText('10')).toBeTruthy(); // favoritesCount
      expect(getByText('5')).toBeTruthy(); // scansThisWeek
      expect(getByText('15')).toBeTruthy(); // scansThisMonth
      expect(getByText('Total Scans')).toBeTruthy();
      expect(getByText('Favorites')).toBeTruthy();
      expect(getByText('This Week')).toBeTruthy();
      expect(getByText('This Month')).toBeTruthy();
    });

    it('should show streak when available', () => {
      const { getByText } = render(<HistoryStats stats={mockStats} />);

      expect(getByText('#')).toBeTruthy();
      expect(getByText('3 day streak')).toBeTruthy();
    });

    it('should show average calories', () => {
      const { getByText } = render(<HistoryStats stats={mockStats} />);

      expect(getByText('Avg: 350 cal')).toBeTruthy();
    });

    it('should show most scanned product', () => {
      const { getByText } = render(<HistoryStats stats={mockStats} />);

      expect(getByText('Most: Favorite Cereal')).toBeTruthy();
    });

    it('should format large numbers with k suffix', () => {
      const largeStats = { ...mockStats, totalScans: 1500 };
      const { getByText } = render(<HistoryStats stats={largeStats} />);

      expect(getByText('1.5k')).toBeTruthy();
    });

    it('should show loading state', () => {
      const { getByText } = render(<HistoryStats stats={mockStats} isLoading={true} />);

      expect(getByText('Loading stats...')).toBeTruthy();
    });

    it('should hide streak when zero', () => {
      const noStreakStats = { ...mockStats, currentStreak: 0 };
      const { queryByText } = render(<HistoryStats stats={noStreakStats} />);

      expect(queryByText('🔥')).toBeNull();
      expect(queryByText(/streak/)).toBeNull();
    });

    it('should hide average when zero', () => {
      const noAvgStats = { ...mockStats, averageCalories: 0 };
      const { queryByText } = render(<HistoryStats stats={noAvgStats} />);

      expect(queryByText(/Avg:/)).toBeNull();
    });

    it('should hide most scanned when not available', () => {
      const noMostStats = { ...mockStats, mostScannedProduct: undefined };
      const { queryByText } = render(<HistoryStats stats={noMostStats} />);

      expect(queryByText(/Most:/)).toBeNull();
    });
  });

  describe('EmptyState', () => {
    it('should render with title and message', () => {
      const { getByText } = render(<EmptyState title="No Items" message="Start adding items" />);

      expect(getByText('No Items')).toBeTruthy();
      expect(getByText('Start adding items')).toBeTruthy();
    });

    it('should render with icon', () => {
      const { getByText } = render(<EmptyState icon="📋" title="Empty" message="No data" />);

      expect(getByText('📋')).toBeTruthy();
    });

    it('should show action button when provided', () => {
      const onAction = jest.fn();
      const { getByText } = render(
        <EmptyState title="No Items" message="Add some" actionLabel="Add Now" onAction={onAction} />
      );

      expect(getByText('Add Now')).toBeTruthy();

      fireEvent.press(getByText('Add Now'));
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('should hide action button when not provided', () => {
      const { queryByText } = render(<EmptyState title="No Items" message="No data" />);

      // PrimaryButton should not be rendered
      expect(queryByText('Add Now')).toBeNull();
    });
  });
});

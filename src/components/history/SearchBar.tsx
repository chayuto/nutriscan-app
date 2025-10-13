/**
 * SearchBar Component
 *
 * Search input for filtering history items with:
 * - Real-time search
 * - Clear button
 * - Debounced input
 * - Icon
 *
 * Part of Sprint 4: History & Favorites feature
 */

import React, { memo, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Pressable, Text } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/theme';

export interface SearchBarProps {
  /** Current search query */
  value: string;

  /** Callback when search query changes */
  onChangeText: (text: string) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Debounce delay in milliseconds */
  debounceMs?: number;

  /** Whether input is disabled */
  disabled?: boolean;

  /** Test ID for testing */
  testID?: string;
}

/**
 * SearchBar - Search input with debouncing
 *
 * @example
 * ```tsx
 * <SearchBar
 *   value={searchQuery}
 *   onChangeText={setSearchQuery}
 *   placeholder="Search scans..."
 *   debounceMs={300}
 * />
 * ```
 */
export const SearchBar: React.FC<SearchBarProps> = memo(
  ({
    value,
    onChangeText,
    placeholder = 'Search scans...',
    debounceMs = 300,
    disabled = false,
    testID,
  }) => {
    const [localValue, setLocalValue] = useState(value);
    const [isFocused, setIsFocused] = useState(false);

    // Debounce search input
    useEffect(() => {
      const timer = setTimeout(() => {
        if (localValue !== value) {
          onChangeText(localValue);
        }
      }, debounceMs);

      return () => clearTimeout(timer);
    }, [localValue, debounceMs, onChangeText, value]);

    // Sync with external value changes
    useEffect(() => {
      if (value !== localValue) {
        setLocalValue(value);
      }
    }, [value]); // Only depend on value prop

    const handleClear = () => {
      setLocalValue('');
      onChangeText('');
    };

    return (
      <View style={styles.container} testID={testID}>
        <View style={[styles.blurContainer, isFocused && styles.blurContainerFocused]}>
          <View style={styles.inputContainer}>
            {/* Search Icon */}
            <Text style={styles.icon}>Q</Text>

            {/* Text Input */}
            <TextInput
              value={localValue}
              onChangeText={setLocalValue}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              editable={!disabled}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="never"
              accessible={true}
              accessibilityRole="search"
              accessibilityLabel="Search scan history"
              accessibilityHint="Type to filter your scans"
              testID={`${testID}-input`}
            />

            {/* Clear Button */}
            {localValue.length > 0 && (
              <Pressable
                onPress={handleClear}
                style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
                hitSlop={8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                testID={`${testID}-clear-button`}
              >
                <Text style={styles.clearIcon}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  }
);

SearchBar.displayName = 'SearchBar';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  blurContainer: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  blurContainerFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  icon: {
    fontSize: 18,
    color: colors.textMuted,
    marginRight: spacing.sm,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  clearButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  clearIcon: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
});

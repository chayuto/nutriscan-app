/**
 * GlassCard Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { GlassCard } from '../base/GlassCard';

// Mock @react-native-community/blur
jest.mock('@react-native-community/blur', () => {
  const { View } = require('react-native');
  return {
    BlurView: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
      <View testID={testID}>{children}</View>
    ),
  };
});

describe('GlassCard', () => {
  describe('Rendering', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <GlassCard>
          <Text>Test Content</Text>
        </GlassCard>
      );

      expect(getByText('Test Content')).toBeTruthy();
    });

    it('should render with default testID', () => {
      const { getByTestId } = render(
        <GlassCard>
          <Text>Content</Text>
        </GlassCard>
      );

      expect(getByTestId('glass-card')).toBeTruthy();
    });

    it('should render with custom testID', () => {
      const { getByTestId } = render(
        <GlassCard testID="custom-card">
          <Text>Content</Text>
        </GlassCard>
      );

      expect(getByTestId('custom-card')).toBeTruthy();
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom container style', () => {
      const customStyle = { margin: 20 };
      const { getByTestId } = render(
        <GlassCard style={customStyle} testID="glass-card">
          <Text>Custom styled card</Text>
        </GlassCard>
      );

      // BlurView is mocked, so just verify it renders
      const card = getByTestId('glass-card');
      expect(card).toBeTruthy();
    });
  });

  describe('Multiple Children', () => {
    it('should render multiple children', () => {
      const { getByText } = render(
        <GlassCard>
          <Text>First</Text>
          <Text>Second</Text>
          <Text>Third</Text>
        </GlassCard>
      );

      expect(getByText('First')).toBeTruthy();
      expect(getByText('Second')).toBeTruthy();
      expect(getByText('Third')).toBeTruthy();
    });
  });

  describe('Nested Components', () => {
    it('should render nested complex components', () => {
      const { getByTestId } = render(
        <GlassCard>
          <View testID="nested-view">
            <Text>Nested Text</Text>
          </View>
        </GlassCard>
      );

      expect(getByTestId('nested-view')).toBeTruthy();
    });
  });
});

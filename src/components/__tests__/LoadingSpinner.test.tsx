/**
 * LoadingSpinner Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { colors } from '@/theme';

describe('LoadingSpinner', () => {
  describe('Rendering', () => {
    it('should render spinner with default props', () => {
      const { getByTestId } = render(<LoadingSpinner />);

      expect(getByTestId('loading-spinner')).toBeTruthy();
      expect(getByTestId('loading-spinner-indicator')).toBeTruthy();
    });

    it('should render with custom testID', () => {
      const { getByTestId } = render(<LoadingSpinner testID="custom-spinner" />);

      expect(getByTestId('custom-spinner')).toBeTruthy();
      expect(getByTestId('custom-spinner-indicator')).toBeTruthy();
    });

    it('should render without message by default', () => {
      const { queryByTestId } = render(<LoadingSpinner />);

      expect(queryByTestId('loading-spinner-message')).toBeNull();
    });

    it('should render with message when provided', () => {
      const message = 'Loading data...';
      const { getByTestId, getByText } = render(<LoadingSpinner message={message} />);

      expect(getByTestId('loading-spinner-message')).toBeTruthy();
      expect(getByText(message)).toBeTruthy();
    });
  });

  describe('Size Prop', () => {
    it('should render with small size', () => {
      const { getByTestId } = render(<LoadingSpinner size="small" />);
      const indicator = getByTestId('loading-spinner-indicator');

      expect(indicator.props.size).toBe('small');
    });

    it('should render with large size (default)', () => {
      const { getByTestId } = render(<LoadingSpinner />);
      const indicator = getByTestId('loading-spinner-indicator');

      expect(indicator.props.size).toBe('large');
    });

    it('should render with large size when explicitly set', () => {
      const { getByTestId } = render(<LoadingSpinner size="large" />);
      const indicator = getByTestId('loading-spinner-indicator');

      expect(indicator.props.size).toBe('large');
    });
  });

  describe('Color Prop', () => {
    it('should use primary color by default', () => {
      const { getByTestId } = render(<LoadingSpinner />);
      const indicator = getByTestId('loading-spinner-indicator');

      expect(indicator.props.color).toBe(colors.primary);
    });

    it('should accept custom color', () => {
      const customColor = '#FF0000';
      const { getByTestId } = render(<LoadingSpinner color={customColor} />);
      const indicator = getByTestId('loading-spinner-indicator');

      expect(indicator.props.color).toBe(customColor);
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom container style', () => {
      const customStyle = { backgroundColor: '#000', padding: 32 };
      const { getByTestId } = render(<LoadingSpinner style={customStyle} />);

      const container = getByTestId('loading-spinner');
      expect(container.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining(customStyle)])
      );
    });
  });

  describe('Message Variations', () => {
    it('should render empty string message', () => {
      const { queryByTestId } = render(<LoadingSpinner message="" />);

      expect(queryByTestId('loading-spinner-message')).toBeNull();
    });

    it('should render long message', () => {
      const longMessage = 'This is a very long loading message that should still render correctly';
      const { getByText } = render(<LoadingSpinner message={longMessage} />);

      expect(getByText(longMessage)).toBeTruthy();
    });

    it('should render message with special characters', () => {
      const message = 'Loading... 50% complete!';
      const { getByText } = render(<LoadingSpinner message={message} />);

      expect(getByText(message)).toBeTruthy();
    });
  });
});

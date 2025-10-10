/**
 * Tests for PrimaryButton component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PrimaryButton } from '../base/PrimaryButton';

describe('PrimaryButton', () => {
  describe('Rendering', () => {
    it('should render with children text', () => {
      const { getByText } = render(<PrimaryButton onPress={() => {}}>Click Me</PrimaryButton>);

      expect(getByText('Click Me')).toBeTruthy();
    });

    it('should render with custom testID', () => {
      const { getByTestId } = render(
        <PrimaryButton onPress={() => {}} testID="custom-button">
          Click Me
        </PrimaryButton>
      );

      expect(getByTestId('custom-button')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('should call onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByText } = render(<PrimaryButton onPress={onPress}>Click Me</PrimaryButton>);

      fireEvent.press(getByText('Click Me'));

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when disabled', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <PrimaryButton onPress={onPress} disabled={true}>
          Click Me
        </PrimaryButton>
      );

      fireEvent.press(getByText('Click Me'));

      expect(onPress).not.toHaveBeenCalled();
    });

    it('should not call onPress when loading', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <PrimaryButton onPress={onPress} loading={true} testID="button">
          Click Me
        </PrimaryButton>
      );

      fireEvent.press(getByTestId('button'));

      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show spinner when loading', () => {
      const { getByTestId, queryByText } = render(
        <PrimaryButton onPress={() => {}} loading={true} testID="button">
          Click Me
        </PrimaryButton>
      );

      expect(getByTestId('button-spinner')).toBeTruthy();
      expect(queryByText('Click Me')).toBeNull();
    });

    it('should not show spinner when not loading', () => {
      const { queryByTestId, getByText } = render(
        <PrimaryButton onPress={() => {}} loading={false} testID="button">
          Click Me
        </PrimaryButton>
      );

      expect(queryByTestId('button-spinner')).toBeNull();
      expect(getByText('Click Me')).toBeTruthy();
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled state to accessibility', () => {
      const { getByRole } = render(
        <PrimaryButton onPress={() => {}} disabled={true}>
          Click Me
        </PrimaryButton>
      );

      const button = getByRole('button');
      expect(button).toHaveAccessibilityState({ disabled: true, busy: false });
    });

    it('should apply busy state when loading', () => {
      const { getByRole } = render(
        <PrimaryButton onPress={() => {}} loading={true}>
          Click Me
        </PrimaryButton>
      );

      const button = getByRole('button');
      expect(button).toHaveAccessibilityState({ disabled: true, busy: true });
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      const { getByRole } = render(<PrimaryButton onPress={() => {}}>Click Me</PrimaryButton>);

      expect(getByRole('button')).toBeTruthy();
    });

    it('should use children as default accessibility label', () => {
      const { getByLabelText } = render(<PrimaryButton onPress={() => {}}>Click Me</PrimaryButton>);

      expect(getByLabelText('Click Me')).toBeTruthy();
    });

    it('should use custom accessibility label when provided', () => {
      const { getByLabelText } = render(
        <PrimaryButton onPress={() => {}} accessibilityLabel="Custom Label">
          Click Me
        </PrimaryButton>
      );

      expect(getByLabelText('Custom Label')).toBeTruthy();
    });

    it('should have accessibility hint when provided', () => {
      const { getByRole } = render(
        <PrimaryButton onPress={() => {}} accessibilityHint="Submits the form">
          Submit
        </PrimaryButton>
      );

      const button = getByRole('button');
      expect(button.props.accessibilityHint).toBe('Submits the form');
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom container style', () => {
      const customStyle = { marginTop: 20 };
      const { getByRole } = render(
        <PrimaryButton onPress={() => {}} style={customStyle}>
          Click Me
        </PrimaryButton>
      );

      const button = getByRole('button');
      expect(button.props.style).toContainEqual(customStyle);
    });

    it('should accept custom text style', () => {
      const customTextStyle = { fontSize: 20 };
      const { getByText } = render(
        <PrimaryButton onPress={() => {}} textStyle={customTextStyle}>
          Click Me
        </PrimaryButton>
      );

      const text = getByText('Click Me');
      expect(text.props.style).toContainEqual(customTextStyle);
    });
  });
});

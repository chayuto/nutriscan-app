import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CameraButton } from '@/components/input/CameraButton';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, testID }: { name: string; testID?: string }) => {
    const { Text } = require('react-native');
    return <Text testID={testID}>{name}</Text>;
  },
}));

// Mock LoadingSpinner
jest.mock('@/components/base/LoadingSpinner', () => ({
  LoadingSpinner: ({ testID }: { testID?: string }) => {
    const { Text } = require('react-native');
    return <Text testID={testID}>Loading...</Text>;
  },
}));

describe('CameraButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render camera mode correctly', () => {
      const { getByTestId, getByText } = render(
        <CameraButton mode="camera" onPress={mockOnPress} />
      );

      expect(getByTestId('camera-button')).toBeTruthy();
      expect(getByTestId('camera-button-icon')).toBeTruthy();
      expect(getByText('Take Photo')).toBeTruthy();
    });

    it('should render gallery mode correctly', () => {
      const { getByTestId, getByText } = render(
        <CameraButton mode="gallery" onPress={mockOnPress} />
      );

      expect(getByTestId('camera-button')).toBeTruthy();
      expect(getByTestId('camera-button-icon')).toBeTruthy();
      expect(getByText('Choose from Gallery')).toBeTruthy();
    });

    it('should render with custom testID', () => {
      const { getByTestId } = render(
        <CameraButton mode="camera" onPress={mockOnPress} testID="custom-button" />
      );

      expect(getByTestId('custom-button')).toBeTruthy();
      expect(getByTestId('custom-button-pressable')).toBeTruthy();
    });
  });

  describe('Icons', () => {
    it('should show camera icon for camera mode', () => {
      const { getByTestId } = render(<CameraButton mode="camera" onPress={mockOnPress} />);

      const icon = getByTestId('camera-button-icon');
      expect(icon.props.children).toBe('camera');
    });

    it('should show image icon for gallery mode', () => {
      const { getByTestId } = render(<CameraButton mode="gallery" onPress={mockOnPress} />);

      const icon = getByTestId('camera-button-icon');
      expect(icon.props.children).toBe('image');
    });
  });

  describe('Press Interaction', () => {
    it('should call onPress when pressed', () => {
      const { getByTestId } = render(<CameraButton mode="camera" onPress={mockOnPress} />);

      fireEvent.press(getByTestId('camera-button-pressable'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when disabled', () => {
      const { getByTestId } = render(
        <CameraButton mode="camera" onPress={mockOnPress} disabled={true} />
      );

      fireEvent.press(getByTestId('camera-button-pressable'));
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should not call onPress when loading', () => {
      const { getByTestId } = render(
        <CameraButton mode="camera" onPress={mockOnPress} loading={true} />
      );

      fireEvent.press(getByTestId('camera-button-pressable'));
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      const { getByTestId, queryByTestId } = render(
        <CameraButton mode="camera" onPress={mockOnPress} loading={true} />
      );

      expect(getByTestId('camera-button-spinner')).toBeTruthy();
      expect(queryByTestId('camera-button-icon')).toBeNull();
    });

    it('should hide icon when loading', () => {
      const { queryByTestId } = render(
        <CameraButton mode="camera" onPress={mockOnPress} loading={true} />
      );

      expect(queryByTestId('camera-button-icon')).toBeNull();
    });

    it('should show icon when not loading', () => {
      const { getByTestId, queryByTestId } = render(
        <CameraButton mode="camera" onPress={mockOnPress} loading={false} />
      );

      expect(getByTestId('camera-button-icon')).toBeTruthy();
      expect(queryByTestId('camera-button-spinner')).toBeNull();
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled styles when disabled', () => {
      const { getByTestId } = render(
        <CameraButton mode="camera" onPress={mockOnPress} disabled={true} />
      );

      const pressable = getByTestId('camera-button-pressable');
      expect(pressable.props.accessibilityState.disabled).toBe(true);
    });

    it('should apply disabled styles when loading', () => {
      const { getByTestId } = render(
        <CameraButton mode="camera" onPress={mockOnPress} loading={true} />
      );

      const pressable = getByTestId('camera-button-pressable');
      expect(pressable.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Error Display', () => {
    it('should not show error when error is null', () => {
      const { queryByTestId } = render(
        <CameraButton mode="camera" onPress={mockOnPress} error={null} />
      );

      expect(queryByTestId('camera-button-error')).toBeNull();
    });

    it('should show error message when error is provided', () => {
      const errorMessage = 'Camera permission denied';
      const { getByTestId, getByText } = render(
        <CameraButton mode="camera" onPress={mockOnPress} error={errorMessage} />
      );

      expect(getByTestId('camera-button-error')).toBeTruthy();
      expect(getByText(errorMessage)).toBeTruthy();
    });

    it('should show alert icon with error message', () => {
      const { getByTestId } = render(
        <CameraButton mode="camera" onPress={mockOnPress} error="Error message" />
      );

      const errorContainer = getByTestId('camera-button-error');
      expect(errorContainer).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have correct accessibility role', () => {
      const { getByTestId } = render(<CameraButton mode="camera" onPress={mockOnPress} />);

      const pressable = getByTestId('camera-button-pressable');
      expect(pressable.props.accessibilityRole).toBe('button');
    });

    it('should have correct accessibility label for camera mode', () => {
      const { getByTestId } = render(<CameraButton mode="camera" onPress={mockOnPress} />);

      const pressable = getByTestId('camera-button-pressable');
      expect(pressable.props.accessibilityLabel).toBe('Take Photo');
    });

    it('should have correct accessibility label for gallery mode', () => {
      const { getByTestId } = render(<CameraButton mode="gallery" onPress={mockOnPress} />);

      const pressable = getByTestId('camera-button-pressable');
      expect(pressable.props.accessibilityLabel).toBe('Choose from Gallery');
    });

    it('should have accessibility hint for camera mode', () => {
      const { getByTestId } = render(<CameraButton mode="camera" onPress={mockOnPress} />);

      const pressable = getByTestId('camera-button-pressable');
      expect(pressable.props.accessibilityHint).toBe(
        'Opens camera to take a photo of nutrition label'
      );
    });

    it('should have accessibility hint for gallery mode', () => {
      const { getByTestId } = render(<CameraButton mode="gallery" onPress={mockOnPress} />);

      const pressable = getByTestId('camera-button-pressable');
      expect(pressable.props.accessibilityHint).toBe('Opens gallery to select a photo');
    });

    it('should set busy state when loading', () => {
      const { getByTestId } = render(
        <CameraButton mode="camera" onPress={mockOnPress} loading={true} />
      );

      const pressable = getByTestId('camera-button-pressable');
      expect(pressable.props.accessibilityState.busy).toBe(true);
    });

    it('should not set busy state when not loading', () => {
      const { getByTestId } = render(
        <CameraButton mode="camera" onPress={mockOnPress} loading={false} />
      );

      const pressable = getByTestId('camera-button-pressable');
      expect(pressable.props.accessibilityState.busy).toBe(false);
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom container style', () => {
      const customStyle = { marginTop: 20 };
      const { getByTestId } = render(
        <CameraButton mode="camera" onPress={mockOnPress} style={customStyle} />
      );

      const container = getByTestId('camera-button');
      expect(container.props.style).toContainEqual(customStyle);
    });
  });

  describe('Labels', () => {
    it('should show correct label for camera mode', () => {
      const { getByTestId } = render(<CameraButton mode="camera" onPress={mockOnPress} />);

      const label = getByTestId('camera-button-label');
      expect(label.props.children).toBe('Take Photo');
    });

    it('should show correct label for gallery mode', () => {
      const { getByTestId } = render(<CameraButton mode="gallery" onPress={mockOnPress} />);

      const label = getByTestId('camera-button-label');
      expect(label.props.children).toBe('Choose from Gallery');
    });
  });
});

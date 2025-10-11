import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { HomeScreen } from '../HomeScreen';
import type { NutritionData } from '@/types/nutrition.types';

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock hooks
const mockCapturePhoto = jest.fn();
const mockPickFromGallery = jest.fn();
const mockAnalyzeImage = jest.fn();
const mockRetry = jest.fn();

jest.mock('@/hooks/useCamera', () => ({
  useCamera: jest.fn(() => ({
    capturePhoto: mockCapturePhoto,
    pickFromGallery: mockPickFromGallery,
    isCapturing: false,
    isPicking: false,
    error: null,
  })),
}));

jest.mock('@/hooks/useNutritionAnalysis', () => ({
  useNutritionAnalysis: jest.fn(() => ({
    analyzeImage: mockAnalyzeImage,
    retry: mockRetry,
    isAnalyzing: false,
    progress: { step: 'idle', message: '', percentage: 0 },
    error: null,
    lastResult: null,
  })),
}));

// Mock components
jest.mock('@/components/input/CameraButton', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    CameraButton: ({
      onPress,
      loading,
      testID,
      mode,
    }: {
      onPress: () => void;
      loading?: boolean;
      testID?: string;
      mode: 'camera' | 'gallery';
    }) => (
      <Pressable onPress={onPress} testID={testID} disabled={loading}>
        <View>
          <Text>{mode === 'camera' ? '📸' : '🖼️'}</Text>
          <Text>{mode === 'camera' ? 'Take Photo' : 'Choose Photo'}</Text>
          {loading && <Text>Loading...</Text>}
        </View>
      </Pressable>
    ),
  };
});

jest.mock('@/components/nutrition/AnalysisProgress', () => {
  const { View, Text } = require('react-native');
  return {
    AnalysisProgress: ({
      currentStep,
      progress,
      testID,
    }: {
      currentStep: string;
      progress: number;
      testID?: string;
    }) => (
      <View testID={testID}>
        <Text>Analyzing...</Text>
        <Text>{currentStep}</Text>
        <Text>{progress}%</Text>
      </View>
    ),
  };
});

jest.mock('@/components/base/PrimaryButton', () => {
  const { Pressable, Text } = require('react-native');
  return {
    PrimaryButton: ({
      children,
      onPress,
      disabled,
      testID,
    }: {
      children: React.ReactNode;
      onPress: () => void;
      disabled?: boolean;
      testID?: string;
    }) => (
      <Pressable onPress={onPress} testID={testID} disabled={disabled}>
        <Text>{children}</Text>
      </Pressable>
    ),
  };
});

// Get mocked hooks
const { useCamera } = require('@/hooks/useCamera');
const { useNutritionAnalysis } = require('@/hooks/useNutritionAnalysis');

describe('HomeScreen', () => {
  const mockOnAnalysisComplete = jest.fn();
  const mockOnNavigateToSettings = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset to default implementations
    (useCamera as jest.Mock).mockReturnValue({
      capturePhoto: mockCapturePhoto,
      pickFromGallery: mockPickFromGallery,
      isCapturing: false,
      isPicking: false,
      error: null,
    });

    (useNutritionAnalysis as jest.Mock).mockReturnValue({
      analyzeImage: mockAnalyzeImage,
      retry: mockRetry,
      isAnalyzing: false,
      progress: { step: 'idle', message: '', percentage: 0 },
      error: null,
      lastResult: null,
    });
  });

  describe('Rendering', () => {
    it('should render with all elements', () => {
      const { getByTestId, getByText } = render(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
        />
      );

      expect(getByTestId('home-screen')).toBeTruthy();
      expect(getByText('🥗 NutriScan AI')).toBeTruthy();
      expect(getByText('Scan nutrition labels instantly')).toBeTruthy();
      expect(getByTestId('home-screen-camera-button')).toBeTruthy();
      expect(getByTestId('home-screen-gallery-button')).toBeTruthy();
      expect(getByTestId('home-screen-settings-button')).toBeTruthy();
    });

    it('should render with custom testID', () => {
      const { getByTestId } = render(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
          testID="custom-home"
        />
      );

      expect(getByTestId('custom-home')).toBeTruthy();
      expect(getByTestId('custom-home-title')).toBeTruthy();
      expect(getByTestId('custom-home-subtitle')).toBeTruthy();
    });
  });

  describe('Camera Photo Capture', () => {
    it('should capture photo when camera button pressed', async () => {
      mockCapturePhoto.mockResolvedValue('file:///test-image.jpg');

      const { getByTestId } = render(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
        />
      );

      fireEvent.press(getByTestId('home-screen-camera-button'));

      await waitFor(() => {
        expect(mockCapturePhoto).toHaveBeenCalled();
      });
    });

    it('should analyze image after capture', async () => {
      const imageUri = 'file:///test-image.jpg';
      const nutritionData: NutritionData = {
        calories: 250,
        protein: 5,
        fat: 10,
        saturatedFat: 3,
        carbohydrates: 30,
        sugars: 15,
        fiber: 2,
        sodium: 200,
      };

      mockCapturePhoto.mockResolvedValue(imageUri);
      mockAnalyzeImage.mockResolvedValue(nutritionData);

      const { getByTestId } = render(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
        />
      );

      fireEvent.press(getByTestId('home-screen-camera-button'));

      await waitFor(() => {
        expect(mockAnalyzeImage).toHaveBeenCalledWith(imageUri);
        expect(mockOnAnalysisComplete).toHaveBeenCalledWith(nutritionData, imageUri);
      });
    });

    it('should not analyze if capture cancelled', async () => {
      mockCapturePhoto.mockResolvedValue(null);

      const { getByTestId } = render(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
        />
      );

      fireEvent.press(getByTestId('home-screen-camera-button'));

      await waitFor(() => {
        expect(mockCapturePhoto).toHaveBeenCalled();
      });

      expect(mockAnalyzeImage).not.toHaveBeenCalled();
    });
  });

  describe('Gallery Photo Selection', () => {
    it('should pick image when gallery button pressed', async () => {
      mockPickFromGallery.mockResolvedValue('file:///gallery-image.jpg');

      const { getByTestId } = render(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
        />
      );

      fireEvent.press(getByTestId('home-screen-gallery-button'));

      await waitFor(() => {
        expect(mockPickFromGallery).toHaveBeenCalled();
      });
    });

    it('should analyze image after selection', async () => {
      const imageUri = 'file:///gallery-image.jpg';
      const nutritionData: NutritionData = {
        calories: 300,
        protein: 8,
        fat: 15,
        saturatedFat: 5,
        carbohydrates: 35,
        sugars: 20,
        fiber: 3,
        sodium: 250,
      };

      mockPickFromGallery.mockResolvedValue(imageUri);
      mockAnalyzeImage.mockResolvedValue(nutritionData);

      const { getByTestId } = render(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
        />
      );

      fireEvent.press(getByTestId('home-screen-gallery-button'));

      await waitFor(() => {
        expect(mockAnalyzeImage).toHaveBeenCalledWith(imageUri);
        expect(mockOnAnalysisComplete).toHaveBeenCalledWith(nutritionData, imageUri);
      });
    });
  });

  describe('Analysis Progress', () => {
    it('should show analysis progress when analyzing', () => {
      (useNutritionAnalysis as jest.Mock).mockReturnValue({
        analyzeImage: mockAnalyzeImage,
        retry: mockRetry,
        isAnalyzing: true,
        progress: { step: 'analyzing', message: 'Extracting data...', percentage: 66 },
        error: null,
        lastResult: null,
      });

      const { getByTestId, getByText } = render(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
        />
      );

      expect(getByTestId('home-screen-analysis-progress')).toBeTruthy();
      expect(getByText('Analyzing...')).toBeTruthy();
      expect(getByText('analyzing')).toBeTruthy();
      expect(getByText('66%')).toBeTruthy();
    });

    it('should hide buttons when analyzing', () => {
      (useNutritionAnalysis as jest.Mock).mockReturnValue({
        analyzeImage: mockAnalyzeImage,
        retry: mockRetry,
        isAnalyzing: true,
        progress: { step: 'compressing', message: 'Compressing...', percentage: 33 },
        error: null,
        lastResult: null,
      });

      const { queryByTestId } = render(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
        />
      );

      // Buttons should not be visible during analysis
      expect(queryByTestId('home-screen-camera-button')).toBeNull();
      expect(queryByTestId('home-screen-gallery-button')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should display camera error', () => {
      (useCamera as jest.Mock).mockReturnValue({
        capturePhoto: mockCapturePhoto,
        pickFromGallery: mockPickFromGallery,
        isCapturing: false,
        isPicking: false,
        error: 'Camera permission denied',
      });

      const { getByTestId, getByText } = render(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
        />
      );

      expect(getByTestId('home-screen-error')).toBeTruthy();
      expect(getByText('Something went wrong')).toBeTruthy();
      expect(getByText('Camera permission denied')).toBeTruthy();
    });

    it('should display analysis error', () => {
      (useNutritionAnalysis as jest.Mock).mockReturnValue({
        analyzeImage: mockAnalyzeImage,
        retry: mockRetry,
        isAnalyzing: false,
        progress: { step: 'idle', message: '', percentage: 0 },
        error: 'Failed to analyze image',
        lastResult: null,
      });

      const { getByTestId, getByText } = render(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
        />
      );

      expect(getByTestId('home-screen-error')).toBeTruthy();
      expect(getByText('Failed to analyze image')).toBeTruthy();
    });

    it('should show retry button with error', () => {
      (useNutritionAnalysis as jest.Mock).mockReturnValue({
        analyzeImage: mockAnalyzeImage,
        retry: mockRetry,
        isAnalyzing: false,
        progress: { step: 'idle', message: '', percentage: 0 },
        error: 'Analysis failed',
        lastResult: null,
      });

      const { getByTestId } = render(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
        />
      );

      expect(getByTestId('home-screen-retry-button')).toBeTruthy();
    });

    it('should call retry when retry button pressed', async () => {
      // Setup: Return image URI from capture
      mockCapturePhoto.mockResolvedValue('file:///test.jpg');
      mockRetry.mockResolvedValue(null);

      const { getByTestId, rerender } = render(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
        />
      );

      // First capture an image
      fireEvent.press(getByTestId('home-screen-camera-button'));

      await waitFor(() => {
        expect(mockCapturePhoto).toHaveBeenCalled();
      });

      // Now show error state with the hook
      (useNutritionAnalysis as jest.Mock).mockReturnValue({
        analyzeImage: mockAnalyzeImage,
        retry: mockRetry,
        isAnalyzing: false,
        progress: { step: 'idle', message: '', percentage: 0 },
        error: 'Analysis failed',
        lastResult: null,
      });

      // Rerender to apply new hook state
      rerender(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
        />
      );

      // Press retry button
      fireEvent.press(getByTestId('home-screen-retry-button'));

      expect(mockRetry).toHaveBeenCalled();
    });

    it('should show alert when retry without image', () => {
      // Start with error but no captured image
      (useNutritionAnalysis as jest.Mock).mockReturnValue({
        analyzeImage: mockAnalyzeImage,
        retry: mockRetry,
        isAnalyzing: false,
        progress: { step: 'idle', message: '', percentage: 0 },
        error: 'Analysis failed',
        lastResult: null,
      });

      const { getByTestId, getByText } = render(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
        />
      );

      // Button should show "Capture Photo First"
      expect(getByText('Capture Photo First')).toBeTruthy();

      // Press retry without capturing image first
      fireEvent.press(getByTestId('home-screen-retry-button'));

      // Should show alert
      expect(Alert.alert).toHaveBeenCalledWith('No Image', 'Please capture a photo first.');

      // Should not call retry
      expect(mockRetry).not.toHaveBeenCalled();
    });
  });

  describe('Settings Navigation', () => {
    it('should navigate to settings when button pressed', () => {
      const { getByTestId } = render(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
        />
      );

      fireEvent.press(getByTestId('home-screen-settings-button'));

      expect(mockOnNavigateToSettings).toHaveBeenCalled();
    });

    it('should disable settings button during analysis', () => {
      (useNutritionAnalysis as jest.Mock).mockReturnValue({
        analyzeImage: mockAnalyzeImage,
        retry: mockRetry,
        isAnalyzing: true,
        progress: { step: 'analyzing', message: '', percentage: 50 },
        error: null,
        lastResult: null,
      });

      const { getByTestId } = render(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
        />
      );

      const settingsButton = getByTestId('home-screen-settings-button');

      // Since we're mocking PrimaryButton as Pressable, check if it's disabled
      // The mocked Pressable should have disabled prop
      fireEvent.press(settingsButton);

      // If disabled, onNavigateToSettings should not be called
      expect(mockOnNavigateToSettings).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading on camera button when capturing', () => {
      (useCamera as jest.Mock).mockReturnValue({
        capturePhoto: mockCapturePhoto,
        pickFromGallery: mockPickFromGallery,
        isCapturing: true,
        isPicking: false,
        error: null,
      });

      const { getByTestId, getByText } = render(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
        />
      );

      // Check if loading indicator is shown
      expect(getByText('Loading...')).toBeTruthy();

      // Try to press the disabled button
      const cameraButton = getByTestId('home-screen-camera-button');
      fireEvent.press(cameraButton);

      // If disabled, capturePhoto should not be called
      expect(mockCapturePhoto).not.toHaveBeenCalled();
    });

    it('should show loading on gallery button when picking', () => {
      (useCamera as jest.Mock).mockReturnValue({
        capturePhoto: mockCapturePhoto,
        pickFromGallery: mockPickFromGallery,
        isCapturing: false,
        isPicking: true,
        error: null,
      });

      const { getByTestId, getByText } = render(
        <HomeScreen
          onAnalysisComplete={mockOnAnalysisComplete}
          onNavigateToSettings={mockOnNavigateToSettings}
        />
      );

      // Check if loading indicator is shown
      expect(getByText('Loading...')).toBeTruthy();

      // Try to press the disabled button
      const galleryButton = getByTestId('home-screen-gallery-button');
      fireEvent.press(galleryButton);

      // If disabled, pickFromGallery should not be called
      expect(mockPickFromGallery).not.toHaveBeenCalled();
    });
  });
});

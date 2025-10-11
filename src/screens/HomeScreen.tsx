import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { CameraButton } from '@/components/input/CameraButton';
import { AnalysisProgress } from '@/components/nutrition/AnalysisProgress';
import { PrimaryButton } from '@/components/base/PrimaryButton';
import { useCamera } from '@/hooks/useCamera';
import { useNutritionAnalysis } from '@/hooks/useNutritionAnalysis';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { NutritionData } from '@/types/nutrition.types';

export interface HomeScreenProps {
  onAnalysisComplete: (data: NutritionData, imageUri: string) => void;
  onNavigateToSettings: () => void;
  testID?: string;
}

/**
 * HomeScreen - Main entry point for NutriScan AI
 *
 * Features:
 * - Dual photo capture (camera or gallery)
 * - AI nutrition analysis with progress tracking
 * - Permission handling
 * - Error recovery
 * - Settings navigation
 *
 * User Flow:
 * 1. User taps "Take Photo" or "Choose Photo"
 * 2. Camera/gallery opens (permission handled by useCamera)
 * 3. Photo captured → AI analysis starts
 * 4. Progress shown (compressing → converting → analyzing)
 * 5. Analysis complete → Navigate to ReportScreen
 * 6. OR error → Show error, allow retry
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({
  onAnalysisComplete,
  onNavigateToSettings,
  testID = 'home-screen',
}) => {
  const [lastImageUri, setLastImageUri] = useState<string | null>(null);

  // Camera hook for photo capture/selection
  const { capturePhoto, pickFromGallery, isCapturing, isPicking, error: cameraError } = useCamera();

  // Nutrition analysis hook with progress tracking
  const {
    analyzeImage,
    isAnalyzing,
    progress,
    error: analysisError,
    retry,
  } = useNutritionAnalysis();

  // Handle photo capture from camera
  const handleTakePhoto = async () => {
    try {
      const imageUri = await capturePhoto();

      if (imageUri) {
        setLastImageUri(imageUri);
        await handleAnalyzeImage(imageUri);
      }
    } catch (error) {
      // Error already handled by useCamera
      console.error('Photo capture failed:', error);
    }
  };

  // Handle photo selection from gallery
  const handlePickImage = async () => {
    try {
      const imageUri = await pickFromGallery();

      if (imageUri) {
        setLastImageUri(imageUri);
        await handleAnalyzeImage(imageUri);
      }
    } catch (error) {
      // Error already handled by useCamera
      console.error('Image selection failed:', error);
    }
  };

  // Analyze image with AI
  const handleAnalyzeImage = async (imageUri: string) => {
    try {
      const result = await analyzeImage(imageUri);

      if (result) {
        // Analysis successful - navigate to report
        onAnalysisComplete(result, imageUri);
      }
    } catch (error) {
      // Error already handled by useNutritionAnalysis
      console.error('Analysis failed:', error);
    }
  };

  // Retry last analysis
  const handleRetry = () => {
    if (lastImageUri) {
      retry();
    } else {
      Alert.alert('No Image', 'Please capture a photo first.');
    }
  };

  // Combined error message
  const errorMessage = cameraError || analysisError;

  // Show loading state during capture or analysis
  const isLoading = isCapturing || isPicking || isAnalyzing;

  return (
    <SafeAreaView style={styles.container} testID={testID}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} testID={`${testID}-title`}>
            🥗 NutriScan AI
          </Text>
          <Text style={styles.subtitle} testID={`${testID}-subtitle`}>
            Scan nutrition labels instantly
          </Text>
        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {isAnalyzing && progress.step !== 'idle' ? (
            // Show analysis progress
            <AnalysisProgress
              currentStep={progress.step as 'compressing' | 'converting' | 'analyzing' | 'complete'}
              progress={progress.percentage}
              testID={`${testID}-analysis-progress`}
            />
          ) : (
            // Show capture buttons
            <View style={styles.buttonsContainer}>
              <CameraButton
                mode="camera"
                onPress={handleTakePhoto}
                loading={isCapturing}
                testID={`${testID}-camera-button`}
              />

              <View style={styles.buttonSpacer} />

              <CameraButton
                mode="gallery"
                onPress={handlePickImage}
                loading={isPicking}
                testID={`${testID}-gallery-button`}
              />
            </View>
          )}

          {/* Error Display */}
          {errorMessage && !isAnalyzing && (
            <View style={styles.errorContainer} testID={`${testID}-error`}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>Something went wrong</Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>

              <PrimaryButton onPress={handleRetry} testID={`${testID}-retry-button`}>
                {lastImageUri ? 'Try Again' : 'Capture Photo First'}
              </PrimaryButton>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <PrimaryButton
            onPress={onNavigateToSettings}
            disabled={isLoading}
            testID={`${testID}-settings-button`}
          >
            ⚙️ Settings
          </PrimaryButton>

          {lastImageUri && !isAnalyzing && !errorMessage && (
            <Text style={styles.footerHint} testID={`${testID}-retry-hint`}>
              Tap Settings to adjust thresholds
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 400,
  },
  buttonSpacer: {
    height: spacing.md,
  },
  errorContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: `${colors.error}10`,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

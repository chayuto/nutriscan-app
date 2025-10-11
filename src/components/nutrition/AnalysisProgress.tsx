import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { LoadingSpinner } from '@/components/base/LoadingSpinner';

export interface AnalysisProgressProps {
  currentStep: 'compressing' | 'converting' | 'analyzing' | 'complete';
  progress?: number;
  testID?: string;
}

/**
 * AnalysisProgress - Multi-step progress indicator for image analysis
 *
 * Features:
 * - 3-step process visualization (compress → convert → analyze)
 * - Progress percentage display
 * - Status messages for each step
 * - Animated loading spinner
 * - Complete state with success indicator
 */
export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  currentStep,
  progress = 0,
  testID = 'analysis-progress',
}) => {
  // Step configuration
  const steps = [
    { key: 'compressing', label: 'Compressing', message: 'Optimizing image size...' },
    { key: 'converting', label: 'Converting', message: 'Preparing for analysis...' },
    { key: 'analyzing', label: 'Analyzing', message: 'Extracting nutrition data...' },
  ];

  // Get current step index
  const currentStepIndex = steps.findIndex((step) => step.key === currentStep);
  const isComplete = currentStep === 'complete';

  // Get status message
  const getStatusMessage = () => {
    if (isComplete) return 'Analysis complete!';
    const step = steps.find((s) => s.key === currentStep);
    return step?.message || 'Processing...';
  };

  // Calculate overall progress (each step is 33.33%)
  const getOverallProgress = () => {
    if (isComplete) return 100;
    if (currentStepIndex === -1) return 0;
    const stepProgress = currentStepIndex * 33.33;
    const withinStepProgress = progress * 0.3333;
    return Math.min(stepProgress + withinStepProgress, 100);
  };

  const overallProgress = getOverallProgress();

  return (
    <View style={styles.container} testID={testID}>
      {/* Header with spinner or checkmark */}
      <View style={styles.header}>
        {isComplete ? (
          <View style={styles.checkmark} testID={`${testID}-checkmark`}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        ) : (
          <LoadingSpinner testID={`${testID}-spinner`} />
        )}
      </View>

      {/* Status message */}
      <Text style={styles.statusMessage} testID={`${testID}-message`}>
        {getStatusMessage()}
      </Text>

      {/* Progress percentage */}
      <Text style={styles.progressText} testID={`${testID}-percentage`}>
        {Math.round(overallProgress)}%
      </Text>

      {/* Progress bar */}
      <View style={styles.progressTrack} testID={`${testID}-track`}>
        <View
          style={[styles.progressFill, { width: `${overallProgress}%` }]}
          testID={`${testID}-fill`}
        />
      </View>

      {/* Step indicators */}
      <View style={styles.stepsContainer} testID={`${testID}-steps`}>
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isPassed = index < currentStepIndex || isComplete;
          const stepStatus = isPassed ? 'passed' : isActive ? 'active' : 'pending';

          return (
            <View key={step.key} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  isPassed && styles.stepDotPassed,
                  isActive && styles.stepDotActive,
                ]}
                testID={`${testID}-step-${step.key}`}
                accessibilityLabel={`${step.label} step ${stepStatus}`}
              />
              <Text style={[styles.stepLabel, (isPassed || isActive) && styles.stepLabelActive]}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Time estimate */}
      {!isComplete && (
        <Text style={styles.timeEstimate} testID={`${testID}-time-estimate`}>
          This may take up to 30 seconds
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  checkmark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusMessage: {
    ...typography.bodyLarge,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  progressText: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: colors.progressTrack,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.progressTrack,
    marginBottom: spacing.xs,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stepDotPassed: {
    backgroundColor: colors.success,
  },
  stepLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.text,
    fontWeight: '600',
  },
  timeEstimate: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

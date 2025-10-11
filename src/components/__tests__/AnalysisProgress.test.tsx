import React from 'react';
import { render } from '@testing-library/react-native';
import { AnalysisProgress } from '../nutrition/AnalysisProgress';

// Mock LoadingSpinner
jest.mock('@/components/base/LoadingSpinner', () => ({
  LoadingSpinner: ({ testID }: { testID?: string }) => {
    const { View } = require('react-native');
    return <View testID={testID} />;
  },
}));

// Mock expo-linear-gradient (used by LoadingSpinner)
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, testID }: { children: React.ReactNode; testID?: string }) => {
    const { View } = require('react-native');
    return <View testID={testID}>{children}</View>;
  },
}));

describe('AnalysisProgress', () => {
  describe('Rendering', () => {
    it('should render with all elements', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="compressing" progress={30} />);

      expect(getByTestId('analysis-progress')).toBeTruthy();
      expect(getByTestId('analysis-progress-spinner')).toBeTruthy();
      expect(getByTestId('analysis-progress-message')).toBeTruthy();
      expect(getByTestId('analysis-progress-percentage')).toBeTruthy();
      expect(getByTestId('analysis-progress-track')).toBeTruthy();
      expect(getByTestId('analysis-progress-fill')).toBeTruthy();
      expect(getByTestId('analysis-progress-steps')).toBeTruthy();
    });

    it('should render with custom testID', () => {
      const { getByTestId } = render(
        <AnalysisProgress currentStep="analyzing" testID="custom-progress" />
      );

      expect(getByTestId('custom-progress')).toBeTruthy();
    });
  });

  describe('Step Messages', () => {
    it('should show compressing message', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="compressing" />);

      const message = getByTestId('analysis-progress-message');
      expect(message.props.children).toBe('Optimizing image size...');
    });

    it('should show converting message', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="converting" />);

      const message = getByTestId('analysis-progress-message');
      expect(message.props.children).toBe('Preparing for analysis...');
    });

    it('should show analyzing message', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="analyzing" />);

      const message = getByTestId('analysis-progress-message');
      expect(message.props.children).toBe('Extracting nutrition data...');
    });

    it('should show complete message', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="complete" />);

      const message = getByTestId('analysis-progress-message');
      expect(message.props.children).toBe('Analysis complete!');
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate 0% for compressing start', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="compressing" progress={0} />);

      const percentage = getByTestId('analysis-progress-percentage');
      expect(percentage.props.children).toEqual([0, '%']);
    });

    it('should calculate progress within compressing step', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="compressing" progress={50} />);

      const percentage = getByTestId('analysis-progress-percentage');
      // 0 (step base) + 50 * 0.3333 = ~17%
      expect(percentage.props.children).toEqual([17, '%']);
    });

    it('should calculate progress for converting step', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="converting" progress={50} />);

      const percentage = getByTestId('analysis-progress-percentage');
      // 33.33 (step base) + 50 * 0.3333 = ~50%
      expect(percentage.props.children).toEqual([50, '%']);
    });

    it('should calculate progress for analyzing step', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="analyzing" progress={50} />);

      const percentage = getByTestId('analysis-progress-percentage');
      // 66.66 (step base) + 50 * 0.3333 = ~83%
      expect(percentage.props.children).toEqual([83, '%']);
    });

    it('should show 100% when complete', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="complete" />);

      const percentage = getByTestId('analysis-progress-percentage');
      expect(percentage.props.children).toEqual([100, '%']);
    });

    it('should default to 0 progress if not provided', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="compressing" />);

      const percentage = getByTestId('analysis-progress-percentage');
      expect(percentage.props.children).toEqual([0, '%']);
    });
  });

  describe('Progress Bar Fill', () => {
    it('should set width based on progress', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="converting" progress={50} />);

      const fill = getByTestId('analysis-progress-fill');
      // Check that width style exists and is approximately 50%
      const widthStyle = fill.props.style.find((s: { width?: string }) => s.width !== undefined);
      expect(widthStyle).toBeDefined();
      expect(widthStyle.width).toMatch(/49\.9|50\.0/); // Approximately 50%
    });

    it('should show 100% width when complete', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="complete" />);

      const fill = getByTestId('analysis-progress-fill');
      const widthStyle = fill.props.style.find((s: { width?: string }) => s.width !== undefined);
      expect(widthStyle.width).toBe('100%');
    });
  });

  describe('Step Indicators', () => {
    it('should render all 3 step indicators', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="compressing" />);

      expect(getByTestId('analysis-progress-step-compressing')).toBeTruthy();
      expect(getByTestId('analysis-progress-step-converting')).toBeTruthy();
      expect(getByTestId('analysis-progress-step-analyzing')).toBeTruthy();
    });

    it('should mark compressing as active when on that step', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="compressing" />);

      const step = getByTestId('analysis-progress-step-compressing');
      expect(step.props.accessibilityLabel).toBe('Compressing step active');
    });

    it('should mark previous steps as passed', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="analyzing" />);

      const compressingStep = getByTestId('analysis-progress-step-compressing');
      const convertingStep = getByTestId('analysis-progress-step-converting');

      expect(compressingStep.props.accessibilityLabel).toBe('Compressing step passed');
      expect(convertingStep.props.accessibilityLabel).toBe('Converting step passed');
    });

    it('should mark future steps as pending', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="compressing" />);

      const convertingStep = getByTestId('analysis-progress-step-converting');
      const analyzingStep = getByTestId('analysis-progress-step-analyzing');

      expect(convertingStep.props.accessibilityLabel).toBe('Converting step pending');
      expect(analyzingStep.props.accessibilityLabel).toBe('Analyzing step pending');
    });

    it('should mark all steps as passed when complete', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="complete" />);

      const compressingStep = getByTestId('analysis-progress-step-compressing');
      const convertingStep = getByTestId('analysis-progress-step-converting');
      const analyzingStep = getByTestId('analysis-progress-step-analyzing');

      expect(compressingStep.props.accessibilityLabel).toBe('Compressing step passed');
      expect(convertingStep.props.accessibilityLabel).toBe('Converting step passed');
      expect(analyzingStep.props.accessibilityLabel).toBe('Analyzing step passed');
    });
  });

  describe('Complete State', () => {
    it('should show checkmark when complete', () => {
      const { getByTestId, queryByTestId } = render(<AnalysisProgress currentStep="complete" />);

      expect(getByTestId('analysis-progress-checkmark')).toBeTruthy();
      expect(queryByTestId('analysis-progress-spinner')).toBeNull();
    });

    it('should hide time estimate when complete', () => {
      const { queryByTestId } = render(<AnalysisProgress currentStep="complete" />);

      expect(queryByTestId('analysis-progress-time-estimate')).toBeNull();
    });
  });

  describe('In Progress State', () => {
    it('should show loading spinner when in progress', () => {
      const { getByTestId, queryByTestId } = render(<AnalysisProgress currentStep="analyzing" />);

      expect(getByTestId('analysis-progress-spinner')).toBeTruthy();
      expect(queryByTestId('analysis-progress-checkmark')).toBeNull();
    });

    it('should show time estimate when in progress', () => {
      const { getByTestId } = render(<AnalysisProgress currentStep="analyzing" />);

      const timeEstimate = getByTestId('analysis-progress-time-estimate');
      expect(timeEstimate.props.children).toBe('This may take up to 30 seconds');
    });
  });
});

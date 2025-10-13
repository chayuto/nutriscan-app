import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

import { HomeScreen, ReportScreen, SettingsScreen, HistoryScreen } from './src/screens';
import type { NutritionData } from './src/types/nutrition.types';

// Prevent auto-hide of splash screen
SplashScreen.preventAutoHideAsync();

/**
 * App - Main application component with simple navigation
 *
 * Navigation Strategy:
 * - Uses local state for screen management (simple, no external deps)
 * - Three screens: Home, Report, Settings
 * - Data passed via props between screens
 *
 * Flow:
 * Home → (capture + analyze) → Report → Back to Home
 * Home → Settings → Back to Home
 */
export default function App() {
  // Navigation state
  type Screen = 'home' | 'report' | 'settings' | 'history';
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  // Report data (passed from Home to Report)
  const [reportData, setReportData] = useState<{
    nutritionData: NutritionData;
    imageUri: string;
    isFromHistory?: boolean; // Flag to indicate if viewing from history
  } | null>(null);

  // Load Inter fonts
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Show loading screen while fonts load
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Navigation handlers
  const handleAnalysisComplete = (nutritionData: NutritionData, imageUri: string) => {
    setReportData({ nutritionData, imageUri });
    setCurrentScreen('report');
  };

  const handleNavigateToSettings = () => {
    setCurrentScreen('settings');
  };

  const handleNavigateToHistory = () => {
    setCurrentScreen('history');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  // Handle view report from history (imageUri may be missing if image was deleted)
  const handleViewReportFromHistory = (data: NutritionData, imageUri?: string) => {
    setReportData({ nutritionData: data, imageUri: imageUri || '', isFromHistory: true });
    setCurrentScreen('report');
  };

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            onAnalysisComplete={handleAnalysisComplete}
            onNavigateToSettings={handleNavigateToSettings}
            onNavigateToHistory={handleNavigateToHistory}
          />
        );

      case 'report':
        if (!reportData) {
          // Fallback if no data (shouldn't happen in normal flow)
          setCurrentScreen('home');
          return null;
        }
        return (
          <ReportScreen
            nutritionData={reportData.nutritionData}
            imageUri={reportData.imageUri}
            isFromHistory={reportData.isFromHistory}
            onBack={handleBackToHome}
          />
        );

      case 'settings':
        return <SettingsScreen onBack={handleBackToHome} />;

      case 'history':
        return (
          <HistoryScreen
            onBack={handleBackToHome}
            onNavigateToSettings={handleNavigateToSettings}
            onViewReport={handleViewReportFromHistory}
          />
        );

      default:
        return (
          <HomeScreen
            onAnalysisComplete={handleAnalysisComplete}
            onNavigateToSettings={handleNavigateToSettings}
          />
        );
    }
  };

  return (
    <>
      {renderScreen()}
      <StatusBar style="light" />
    </>
  );
}

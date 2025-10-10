import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

import { colors, spacing, typography } from './src/theme';

// Prevent auto-hide of splash screen
SplashScreen.preventAutoHideAsync();

export default function App() {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🥗 NutriScan AI</Text>
      <Text style={styles.subtitle}>Neon Clarity Theme Loaded! ✨</Text>
      <Text style={styles.body}>Foundation setup complete.</Text>
      <Text style={styles.body}>Ready to build screens!</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  body: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
});

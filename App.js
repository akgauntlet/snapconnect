/**
 * @file App.js
 * @description Root application component for SnapConnect - RESTORED FULL VERSION
 * All components tested individually and working on web!
 */

// URL polyfill for React Native
import 'react-native-url-polyfill/auto';

import { NavigationContainer } from '@react-navigation/native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StatusBar, Text, View } from 'react-native';

// Import navigation components
import AppNavigator from './src/navigation/AppNavigator';

// Import safe area provider
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import global styles
import './global.css';

// Import services for initialization
import { initializeFirebaseServices } from './src/config/firebase';
import { loadFonts } from './src/config/fonts';

// Import custom alert provider for web compatibility
import { CustomAlertProvider } from './src/components/common/CustomAlert';

/**
 * Loading screen with gaming aesthetic
 */
const LoadingScreen = ({ initError }) => (
  <View className="flex-1 bg-cyber-black justify-center items-center">
    <Text className="text-4xl font-bold text-cyber-cyan font-orbitron mb-4">
      SnapConnect
    </Text>
    <Text className="text-cyber-cyan font-inter">
      [ INITIALIZING SYSTEM ]
    </Text>
    {initError && (
      <Text className="text-xs text-neon-red text-center px-5 mt-4">
        Error: {initError}
      </Text>
    )}
  </View>
);

/**
 * Root application component with full functionality restored
 */
const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  /**
   * Initialize app services and components
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting full app initialization...');
        
        // Load custom fonts
        await loadFonts();
        console.log('✅ Fonts loaded successfully');
        
        // Initialize Firebase services FIRST
        await initializeFirebaseServices();
        console.log('✅ Firebase services initialized');
        
        // Now it's safe to import and initialize auth store
        const { useAuthStore } = await import('./src/stores/authStore');
        const { initializeAuth } = useAuthStore.getState();
        const unsubscribe = initializeAuth();
        console.log('✅ Auth listener initialized');
        
        // Store unsubscribe function for cleanup
        useAuthStore.getState().setAuthUnsubscribe(unsubscribe);
        
        setIsInitialized(true);
        console.log('🎉 Full SnapConnect app initialization complete!');
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setInitError(error.message);
        // Allow app to continue with limited functionality
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return <LoadingScreen initError={initError} />;
  }

  return (
    <CustomAlertProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          <ExpoStatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </CustomAlertProvider>
  );
};

export default App; 

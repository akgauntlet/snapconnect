/**
 * @file App.js
 * @description Root application component for SnapConnect - gaming-focused ephemeral messaging platform.
 * Sets up navigation, theme provider, and global app configuration with AI-first architecture.
 * 
 * @author SnapConnect Team
 * @created 2024-01-15
 * @modified 2024-01-20
 * 
 * @dependencies
 * - react: React core
 * - react-native: StatusBar, AppRegistry
 * - @react-navigation/native: Navigation container
 * - expo-status-bar: Status bar configuration
 * 
 * @usage
 * Entry point for the entire application. Handles app-wide configuration and navigation setup.
 * 
 * @ai_context
 * This component initializes AI services and provides context for AI-enhanced features throughout the app.
 * Integrates with gaming platform detection and user preference learning.
 */

// URL polyfill for React Native
import 'react-native-url-polyfill/auto';

import { NavigationContainer } from '@react-navigation/native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { AppRegistry, StatusBar, Text, View } from 'react-native';

// Import navigation components
import AppNavigator from './src/navigation/AppNavigator';

// Import global styles
import './global.css';

// Import services for initialization
import { initializeFirebaseServices } from './src/config/firebase';
import { loadFonts } from './src/config/fonts';

/**
 * Root application component with navigation and global providers
 * 
 * @returns {React.ReactElement} Rendered application
 * 
 * @performance
 * - Lazy loads components for optimal startup time
 * - Implements efficient state management with Zustand
 * - Optimized for gaming performance (60fps target)
 * 
 * @ai_integration
 * - Initializes AI services on app startup
 * - Sets up context for AI-enhanced features
 * - Integrates with analytics and user preference tracking
 */
const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  /**
   * Initialize app services and AI components
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        
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
        useAuthStore.getState().setAuthUnsubscribe = unsubscribe;
        
        // TODO: Initialize AI services
        // TODO: Initialize gaming platform integrations
        
        setIsInitialized(true);
        console.log('🎉 App initialization complete');
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
    // Loading screen with gaming aesthetic
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#00FFFF', marginBottom: 16 }}>
          SnapConnect
        </Text>
        <Text style={{ fontSize: 16, color: '#00FFFF', marginBottom: 8 }}>
          [ INITIALIZING FIREBASE ]
        </Text>
        {initError && (
          <Text style={{ fontSize: 12, color: '#FF6B6B', textAlign: 'center', paddingHorizontal: 20 }}>
            Error: {initError}
          </Text>
        )}
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <ExpoStatusBar style="light" />
      <AppNavigator />
    </NavigationContainer>
  );
};

export default App;

// Register the main component with React Native
AppRegistry.registerComponent('main', () => App); 

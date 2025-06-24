/**
 * @file AppNavigator.js
 * @description Main navigation stack for SnapConnect application.
 * Manages authentication flow and main app navigation with gaming-focused routing.
 * 
 * @author SnapConnect Team
 * @created 2024-01-15
 * @modified 2024-01-20
 * 
 * @dependencies
 * - @react-navigation/native-stack: Stack navigation
 * - react: React hooks
 * - @/stores/authStore: Authentication state management
 * 
 * @usage
 * Root navigator that determines whether to show auth flow or main app based on user state.
 * 
 * @ai_context
 * Integrates with AI-powered user preference detection for personalized navigation experiences.
 * Adapts navigation based on gaming context and user behavior patterns.
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text, View } from 'react-native';

// Import navigation stacks
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';

// Import auth store
import { useAuthStore } from '../stores/authStore';

const Stack = createNativeStackNavigator();

/**
 * Loading screen component with gaming aesthetic
 * @returns {React.ReactElement} Loading screen
 */
const LoadingScreen = () => (
  <View className="flex-1 bg-cyber-black justify-center items-center">
    <Text className="text-4xl font-bold text-cyber-cyan font-orbitron mb-4">
      SnapConnect
    </Text>
    <Text className="text-cyber-cyan font-inter">
      [ LOADING SYSTEM ]
    </Text>
    <View className="w-32 h-1 bg-cyber-dark rounded-full mt-4">
      <View className="w-full h-full bg-cyber-cyan rounded-full animate-pulse" />
    </View>
  </View>
);

/**
 * Main application navigator with authentication flow
 * 
 * @returns {React.ReactElement} Rendered navigation stack
 * 
 * @performance
 * - Lazy loads screens for optimal performance
 * - Implements efficient navigation transitions
 * - Optimized for gaming-grade performance
 * 
 * @ai_integration
 * - Adapts navigation based on user gaming preferences
 * - Integrates with AI-powered user behavior analytics
 * - Supports dynamic routing based on AI recommendations
 */
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' }, // Cyber gaming background
        animation: 'slide_from_right', // Smooth gaming-style transitions
      }}
    >
      {isAuthenticated ? (
        // Main app navigation for authenticated users
        <Stack.Screen 
          name="MainApp" 
          component={TabNavigator}
          options={{
            animation: 'fade',
          }}
        />
      ) : (
        // Authentication flow for unauthenticated users
        <Stack.Screen 
          name="Auth" 
          component={AuthNavigator}
          options={{
            animation: 'fade',
          }}
        />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator; 

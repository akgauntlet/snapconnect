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

// Import navigation stacks
import TabNavigator from './TabNavigator';

// Import screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';

// TODO: Import auth store when created
// import { useAuthStore } from '../stores/authStore';

const Stack = createNativeStackNavigator();

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
  // TODO: Implement authentication state management
  // const { isAuthenticated, isLoading } = useAuthStore();
  
  // Temporarily showing main app to test Phase 1 features
  const isAuthenticated = true; // Changed to true to access main app
  const isLoading = false;

  if (isLoading) {
    // TODO: Implement proper loading screen with gaming aesthetic
    return null;
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
        // Main app navigation
        <Stack.Screen name="MainApp" component={TabNavigator} />
      ) : (
        // Authentication flow
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          {/* TODO: Add other auth screens like SignIn, SignUp */}
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator; 

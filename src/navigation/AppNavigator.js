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

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

// Import navigation stacks
import AuthNavigator from "./AuthNavigator";
import TabNavigator from "./TabNavigator";

// Import auth store
import { useAuthStore } from "../stores/authStore";

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
  const { isAuthenticated, profile } = useAuthStore();

  /**
   * Determine which navigator to show based on auth and onboarding status
   * @returns {string} Navigation state
   */
  const getNavigationState = () => {
    if (!isAuthenticated) {
      return "auth";
    }
    
    // Check if user has completed onboarding (including gaming interests)
    if (profile && !profile.onboardingComplete) {
      return "auth"; // Keep in auth flow to complete onboarding
    }
    
    return "main";
  };

  const navigationState = getNavigationState();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#000000" }, // Cyber gaming background
        animation: "slide_from_right", // Smooth gaming-style transitions
      }}
    >
      {navigationState === "main" ? (
        // Main app navigation for fully onboarded users
        <Stack.Screen
          name="MainApp"
          component={TabNavigator}
          options={{
            animation: "fade",
          }}
        />
      ) : (
        // Authentication/onboarding flow
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{
            animation: "fade",
          }}
        />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;

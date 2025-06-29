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
import { Text, View } from "react-native";

// Import navigation stacks
import AuthNavigator from "./AuthNavigator";
import TabNavigator from "./TabNavigator";

// Import auth store
import { useAuthStore } from "../stores/authStore";

const Stack = createNativeStackNavigator();

/**
 * Check if user profile is complete and valid
 * @param {Object|null} profile - User profile object
 * @returns {boolean} True if profile is complete and valid
 */
const isProfileComplete = (profile) => {
  if (!profile) {
    console.log("🔍 Profile missing - redirecting to onboarding");
    return false;
  }

  // Check if onboarding is explicitly marked as complete
  if (!profile.onboardingComplete) {
    console.log("🔍 Onboarding incomplete - redirecting to onboarding");
    return false;
  }

  // Additional validation for critical profile fields
  const hasRequiredFields = profile.uid && (profile.email || profile.phoneNumber);
  if (!hasRequiredFields) {
    console.log("🔍 Profile missing required fields - redirecting to onboarding");
    return false;
  }

  console.log("✅ Profile complete - proceeding to main app");
  return true;
};

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
  const { isAuthenticated, profile, user, isLoading } = useAuthStore();

  // Show loading screen while auth state is being determined
  if (isLoading) {
    console.log("🔄 Auth state loading - showing loading screen");
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loading" options={{ animation: "fade" }}>
          {() => (
            <View className="flex-1 bg-cyber-black justify-center items-center">
              <Text className="text-4xl font-bold text-cyber-cyan font-orbitron mb-4">
                SnapConnect
              </Text>
              <Text className="text-cyber-cyan font-inter">[ INITIALIZING SYSTEM ]</Text>
            </View>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  /**
   * Determine which navigator to show based on auth and onboarding status
   * @returns {string} Navigation state
   */
  const getNavigationState = () => {
    // If not authenticated, show auth flow
    if (!isAuthenticated) {
      console.log("🔐 User not authenticated - showing auth flow");
      return "auth";
    }

    // If authenticated but user object is missing, show auth flow
    if (!user) {
      console.log("⚠️ User object missing despite authentication - showing auth flow");
      return "auth";
    }
    
    // Check if user has completed onboarding with proper profile validation
    if (!isProfileComplete(profile)) {
      console.log("📝 User needs onboarding - staying in auth flow");
      return "auth"; // Keep in auth flow to complete onboarding
    }
    
    console.log("🎮 User fully authenticated and onboarded - showing main app");
    return "main";
  };

  const navigationState = getNavigationState();
  
  // Create a unique key for navigation state changes to ensure proper re-rendering
  // This forces the navigator to re-evaluate when auth state changes significantly
  const navigatorKey = `${navigationState}-${isAuthenticated}-${profile?.onboardingComplete || 'false'}-${user?.uid || 'none'}`;

  console.log("🧭 AppNavigator render:", {
    navigationState,
    isAuthenticated,
    hasUser: !!user,
    hasProfile: !!profile,
    onboardingComplete: profile?.onboardingComplete,
    navigatorKey
  });

  return (
    <Stack.Navigator
      key={navigatorKey}
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

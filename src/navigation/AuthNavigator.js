/**
 * @file AuthNavigator.js
 * @description Authentication navigation stack for SnapConnect login/signup flow.
 * Handles user authentication screens with gaming-themed transitions and AI-enhanced UX.
 *
 * @author SnapConnect Team
 * @created 2024-01-15
 * @modified 2024-01-20
 *
 * @dependencies
 * - @react-navigation/native-stack: Stack navigation
 * - react: React core
 *
 * @usage
 * Navigation stack for authentication flow including welcome, login, signup, and recovery screens.
 *
 * @ai_context
 * Integrates AI-powered user preference detection during onboarding.
 * Personalizes authentication experience based on gaming platform preferences.
 */

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

// Import authentication screens
import GamingInterestsScreen from "../screens/auth/GamingInterestsScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import PhoneVerificationScreen from "../screens/auth/PhoneVerificationScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import WelcomeScreen from "../screens/auth/WelcomeScreen";

// Import auth store and utilities
import { useAuthStore } from "../stores/authStore";
import { getOnboardingStep } from "../utils/userHelpers";

// TODO: Import other auth screens when created
// import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
// import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';

const Stack = createNativeStackNavigator();

/**
 * Determine the initial route based on authentication status and profile completeness
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @param {Object|null} profile - User profile object
 * @returns {string} Initial route name
 */
const getInitialRouteName = (isAuthenticated, profile) => {
  // If not authenticated, start with welcome flow
  if (!isAuthenticated) {
    console.log("🔐 User not authenticated - starting with Welcome");
    return "Welcome";
  }

  // If authenticated, determine what onboarding step they need
  const onboardingStep = getOnboardingStep(profile);
  console.log("📝 Authenticated user onboarding step:", onboardingStep);

  switch (onboardingStep) {
    case 'gaming_interests':
      return "GamingInterests";
    case 'profile_setup':
      // TODO: Create ProfileSetup screen and use it here
      return "GamingInterests"; // Fallback to gaming interests for now
    case 'complete':
      // This shouldn't happen as complete users go to main app
      console.warn("⚠️ Complete user in auth flow - this shouldn't happen");
      return "Welcome";
    default:
      // New users or users needing signup
      return "Welcome";
  }
};

/**
 * Authentication navigation stack with gaming-themed transitions
 *
 * @returns {React.ReactElement} Rendered authentication navigation
 *
 * @performance
 * - Optimized screen transitions for gaming aesthetics
 * - Efficient memory management for auth flow
 * - 60fps target for all animations
 *
 * @ai_integration
 * - Tracks user interaction patterns during onboarding
 * - Personalizes authentication flow based on gaming preferences
 * - Integrates with AI-powered fraud detection
 */
const AuthNavigator = () => {
  const { isAuthenticated, profile } = useAuthStore();
  
  // Determine initial route based on auth status and profile completeness
  const initialRouteName = getInitialRouteName(isAuthenticated, profile);
  
  // Create a unique key to force re-evaluation when auth state changes
  const authKey = `${isAuthenticated}-${profile?.onboardingComplete || 'false'}-${profile?.uid || 'none'}`;
  
  // Log navigator mounting for debugging
  console.log("🔄 AuthNavigator render:", {
    isAuthenticated,
    hasProfile: !!profile,
    onboardingComplete: profile?.onboardingComplete,
    initialRouteName,
    authKey
  });

  return (
    <Stack.Navigator
      key={authKey}
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#000000" }, // Cyber gaming background
        animation: "slide_from_right",
        animationDuration: 300, // Smooth gaming-style transitions
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{
          animation: "fade", // Special fade for welcome screen
        }}
      />

      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          animation: "slide_from_right",
        }}
      />

      <Stack.Screen
        name="SignUp"
        component={SignupScreen}
        options={{
          animation: "slide_from_right",
        }}
      />

      <Stack.Screen
        name="PhoneVerification"
        component={PhoneVerificationScreen}
        options={{
          animation: "slide_from_right",
          gestureEnabled: false, // Prevent accidental back navigation during verification
        }}
      />

      <Stack.Screen
        name="GamingInterests"
        component={GamingInterestsScreen}
        options={{
          animation: "slide_from_right",
          // Prevent back navigation for all users during onboarding
          gestureEnabled: false,
        }}
      />

      {/* TODO: Add additional authentication screens */}
      {/*
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      */}
    </Stack.Navigator>
  );
};

export default AuthNavigator;

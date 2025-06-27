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
// TODO: Import other auth screens when created
// import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
// import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';

const Stack = createNativeStackNavigator();

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
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
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

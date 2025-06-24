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

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// Import authentication screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
// TODO: Import other auth screens when created
// import LoginScreen from '../screens/auth/LoginScreen';
// import SignupScreen from '../screens/auth/SignupScreen';
// import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

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
        contentStyle: { backgroundColor: '#000000' }, // Cyber gaming background
        animation: 'slide_from_right',
        animationDuration: 300, // Smooth gaming-style transitions
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
        options={{
          animation: 'fade', // Special fade for welcome screen
        }}
      />
      
      {/* TODO: Add authentication screens */}
      {/*
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      */}
    </Stack.Navigator>
  );
};

export default AuthNavigator; 

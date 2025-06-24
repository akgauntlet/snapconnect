/**
 * @file SignupScreen.tsx
 * @description Sign up screen with email and phone registration options.
 * Features gaming aesthetic and seamless registration flow.
 * 
 * @author SnapConnect Team
 * @created 2024-01-24
 * @modified 2024-01-24
 * 
 * @dependencies
 * - react-native: Core components
 * - @react-navigation/native: Navigation
 * - @/stores/authStore: Authentication state
 * 
 * @usage
 * Used in authentication flow for user registration.
 * 
 * @ai_context
 * Integrates with AI-powered fraud detection and user behavior analysis.
 */

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';

// Type definitions
type SignupScreenNavigationProp = NativeStackNavigationProp<any, 'SignUp'>;

interface SignupScreenProps {
  navigation?: SignupScreenNavigationProp;
}

/**
 * Sign up screen component with email registration
 * 
 * @param props - Component properties
 * @returns {React.ReactElement} Rendered signup screen
 */
const SignupScreen: React.FC<SignupScreenProps> = () => {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  
  // Auth store
  const { 
    signUpWithEmail, 
    isLoading, 
    error, 
    clearError 
  } = useAuthStore();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  /**
   * Handle email signup
   */
  const handleEmailSignup = async () => {
    if (!email || !password || !confirmPassword || !displayName) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    try {
      await signUpWithEmail(email, password, displayName);
      // Navigation will be handled by auth state change
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    }
  };

  /**
   * Navigate to login screen
   */
  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  /**
   * Clear error when input changes
   */
  const handleInputChange = () => {
    if (error) {
      clearError();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="bg-cyber-black"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-1 justify-center py-8">
          <View className="items-center mb-8">
            <Text className="text-4xl font-bold text-cyber-cyan font-orbitron mb-2">
              Create Account
            </Text>
            <Text className="text-lg text-gray-300 font-inter text-center">
              Join the gaming revolution
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4 mb-6">
            <View>
              <Text className="text-cyber-cyan font-inter mb-2">Display Name</Text>
              <TextInput
                value={displayName}
                onChangeText={(text) => {
                  setDisplayName(text);
                  handleInputChange();
                }}
                placeholder="Enter your display name"
                placeholderTextColor="#6B7280"
                className="bg-cyber-dark border border-cyber-gray rounded-lg px-4 py-3 text-white font-inter"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View>
              <Text className="text-cyber-cyan font-inter mb-2">Email</Text>
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  handleInputChange();
                }}
                placeholder="Enter your email"
                placeholderTextColor="#6B7280"
                className="bg-cyber-dark border border-cyber-gray rounded-lg px-4 py-3 text-white font-inter"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View>
              <Text className="text-cyber-cyan font-inter mb-2">Password</Text>
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  handleInputChange();
                }}
                placeholder="Enter your password"
                placeholderTextColor="#6B7280"
                className="bg-cyber-dark border border-cyber-gray rounded-lg px-4 py-3 text-white font-inter"
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View>
              <Text className="text-cyber-cyan font-inter mb-2">Confirm Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  handleInputChange();
                }}
                placeholder="Confirm your password"
                placeholderTextColor="#6B7280"
                className="bg-cyber-dark border border-cyber-gray rounded-lg px-4 py-3 text-white font-inter"
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Error Display */}
          {error && (
            <View className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
              <Text className="text-red-400 font-inter text-center">{error}</Text>
            </View>
          )}

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={handleEmailSignup}
            disabled={isLoading}
            className={`bg-cyber-cyan py-4 rounded-lg shadow-lg ${
              isLoading ? 'opacity-50' : ''
            }`}
            style={{
              shadowColor: '#00ffff',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
            }}
          >
            <Text className="text-cyber-black font-bold text-lg font-orbitron text-center">
              {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </Text>
          </TouchableOpacity>

          {/* Gaming Aesthetic Elements */}
          <View className="items-center my-6">
            <View className="w-full h-px bg-cyber-cyan opacity-30 mb-4" />
            <Text className="text-green-400 text-sm font-mono">
              [ SECURE REGISTRATION ]
            </Text>
          </View>

          {/* Sign In Link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-gray-300 font-inter">
              Already have an account? 
            </Text>
            <TouchableOpacity onPress={handleSignIn} className="ml-2">
              <Text className="text-cyber-cyan font-inter font-medium">
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignupScreen; 

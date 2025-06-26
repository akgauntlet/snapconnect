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
 * - @/utils/alertService: Web-compatible alerts
 * 
 * @usage
 * Used in authentication flow for user registration.
 * 
 * @ai_context
 * Integrates with AI-powered fraud detection and user behavior analysis.
 */

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { showErrorAlert } from '../../utils/alertService';
import { REGEX_PATTERNS } from '../../utils/constants';

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
    checkUsernameAvailability,
    isLoading, 
    error, 
    clearError 
  } = useAuthStore();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  
  // Timeout ref for debouncing username checks
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Validate username format
   * @param {string} username - Username to validate
   * @returns {boolean} True if valid format
   */
  const isValidUsernameFormat = (username: string): boolean => {
    return REGEX_PATTERNS.USERNAME.test(username);
  };

  /**
   * Check username availability with debouncing
   * @param {string} username - Username to check
   */
  const checkUsernameAvailabilityDebounced = async (username: string) => {
    if (!username) {
      setUsernameError('');
      return;
    }

    if (!isValidUsernameFormat(username)) {
      setUsernameError('Username must be 3-20 characters, letters, numbers, and underscores only');
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError('');

    try {
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        setUsernameError('Username is already taken');
      }
    } catch (error) {
      console.error('Username check failed:', error);
      setUsernameError('Unable to check username availability');
    } finally {
      setIsCheckingUsername(false);
    }
  };

  /**
   * Handle username input change
   * @param {string} text - New username value
   */
  const handleUsernameChange = (text: string) => {
    setUsername(text.toLowerCase().trim());
    setUsernameError('');
    
    // Clear previous timeout
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }
    
    // Set new timeout for debounced availability check
    usernameTimeoutRef.current = setTimeout(() => {
      checkUsernameAvailabilityDebounced(text.toLowerCase().trim());
    }, 500);
  };

  /**
   * Handle email signup
   */
  const handleEmailSignup = async () => {
    if (!email || !password || !confirmPassword || !displayName || !username) {
      showErrorAlert('Please fill in all fields.');
      return;
    }

    if (!isValidUsernameFormat(username)) {
      showErrorAlert('Username must be 3-20 characters, letters, numbers, and underscores only.');
      return;
    }

    if (usernameError) {
      showErrorAlert('Please resolve username issues before continuing.');
      return;
    }

    if (password !== confirmPassword) {
      showErrorAlert('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      showErrorAlert('Password must be at least 6 characters long.');
      return;
    }

    // Final username availability check
    setIsCheckingUsername(true);
    try {
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        setUsernameError('Username is already taken');
        setIsCheckingUsername(false);
        return;
      }
    } catch (error) {
      setIsCheckingUsername(false);
      showErrorAlert('Unable to verify username availability. Please try again.');
      return;
    }
    setIsCheckingUsername(false);

    try {
      await signUpWithEmail(email, password, displayName, { username });
      // Navigation will be handled by auth state change
    } catch (error: any) {
      // Check if this is the "email already exists" error
      if (error.message === 'An account already exists with this email address.') {
        // For email already exists, the error is already set in the store state
        // and will be displayed inline. Don't show modal.
        return;
      }
      
      // For all other errors, show the modal as before
      showErrorAlert(error.message, 'Sign Up Failed');
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
          <View className="mb-6">
            <View className="mb-4">
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

            <View className="mb-4">
              <Text className="text-cyber-cyan font-inter mb-2">
                Username <Text className="text-red-400">*</Text>
              </Text>
              <TextInput
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="Choose a unique username"
                placeholderTextColor="#6B7280"
                className={`bg-cyber-dark border rounded-lg px-4 py-3 text-white font-inter ${
                  usernameError ? 'border-red-500' : 'border-cyber-gray'
                }`}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading && !isCheckingUsername}
              />
              {isCheckingUsername ? (
                <Text className="text-yellow-400 text-sm font-inter mt-1">
                  Checking availability...
                </Text>
              ) : null}
              {usernameError ? (
                <Text className="text-red-400 text-sm font-inter mt-1">
                  {usernameError}
                </Text>
              ) : null}
              {username && !usernameError && !isCheckingUsername ? (
                <Text className="text-green-400 text-sm font-inter mt-1">
                  ✓ Username available
                </Text>
              ) : null}
            </View>

            <View className="mb-4">
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

            <View className="mb-4">
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
          {error ? (
            <View className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
              <Text className="text-red-400 font-inter text-center">{error}</Text>
            </View>
          ) : null}

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={handleEmailSignup}
            disabled={isLoading || isCheckingUsername || !!usernameError}
            className={`bg-cyber-cyan py-4 rounded-lg shadow-lg ${
              isLoading || isCheckingUsername || usernameError ? 'opacity-50' : ''
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
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={handleSignIn}>
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

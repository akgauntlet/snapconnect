/**
 * @file EditProfileScreen.tsx
 * @description Profile editing interface allowing users to modify their personal information.
 * Features input validation, real-time username availability checking, and seamless updates.
 *
 * @author SnapConnect Team
 * @created 2024-01-24
 * @modified 2024-01-24
 *
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @react-navigation/native: Navigation
 * - @/stores/authStore: Authentication state
 * - @/stores/themeStore: Theme management
 *
 * @usage
 * Profile editing interface accessible from ProfileScreen.
 *
 * @ai_context
 * AI-powered profile optimization suggestions and content moderation.
 * Smart profile completion recommendations.
 */

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import { showDestructiveAlert, showErrorAlert } from "../../utils/alertService";
import { REGEX_PATTERNS } from "../../utils/constants";

// Type definitions
type EditProfileNavigationProp = NativeStackNavigationProp<any, "EditProfile">;

/**
 * Edit profile screen component
 *
 * @returns {React.ReactElement} Rendered edit profile interface
 *
 * @performance
 * - Debounced username availability checking
 * - Optimized form validation and state management
 * - Efficient keyboard handling and scroll management
 *
 * @ai_integration
 * - Smart profile completion suggestions
 * - Content moderation for bio and display name
 * - Profile optimization recommendations
 */
const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileNavigationProp>();
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());

  // Auth store
  const { updateProfile, checkUsernameAvailability, isLoading, profile } =
    useAuthStore();

  // Form state
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [originalUsername] = useState(profile?.username || "");

  // Validation state
  const [usernameError, setUsernameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Timeout ref for debouncing username checks
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Check for unsaved changes
   */
  useEffect(() => {
    const originalData = {
      displayName: profile?.displayName || "",
      username: profile?.username || "",
      bio: profile?.bio || "",
    };

    const currentData = {
      displayName,
      username,
      bio,
    };

    const changes = Object.keys(originalData).some(
      (key) =>
        originalData[key as keyof typeof originalData] !==
        currentData[key as keyof typeof currentData],
    );

    setHasChanges(changes);
  }, [displayName, username, bio, profile]);

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
    // Skip check if username hasn't changed
    if (username === originalUsername) {
      setUsernameError("");
      return;
    }

    if (!username) {
      setUsernameError("");
      return;
    }

    if (!isValidUsernameFormat(username)) {
      setUsernameError(
        "Username must be 3-20 characters, letters, numbers, and underscores only",
      );
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError("");

    try {
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        setUsernameError("Username is already taken");
      }
    } catch {
      console.error("Username check failed");
      setUsernameError("Unable to check username availability");
    } finally {
      setIsCheckingUsername(false);
    }
  };

  /**
   * Handle username input change
   * @param {string} text - New username value
   */
  const handleUsernameChange = (text: string) => {
    const cleanText = text.toLowerCase().trim();
    setUsername(cleanText);
    setUsernameError("");

    // Clear previous timeout
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }

    // Set new timeout for debounced availability check
    usernameTimeoutRef.current = setTimeout(() => {
      checkUsernameAvailabilityDebounced(cleanText);
    }, 500);
  };

  /**
   * Handle form submission with improved error handling
   */
  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      showErrorAlert("Display name is required.");
      return;
    }

    if (!username.trim()) {
      showErrorAlert("Username is required.");
      return;
    }

    if (!isValidUsernameFormat(username)) {
      showErrorAlert(
        "Username must be 3-20 characters, letters, numbers, and underscores only.",
      );
      return;
    }

    if (usernameError) {
      showErrorAlert("Please resolve username issues before saving.");
      return;
    }

    // Final username availability check if username changed
    if (username !== originalUsername) {
      setIsCheckingUsername(true);
      try {
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
          setUsernameError("Username is already taken");
          setIsCheckingUsername(false);
          return;
        }
      } catch {
        setIsCheckingUsername(false);
        showErrorAlert(
          "Unable to verify username availability. Please try again.",
        );
        return;
      }
      setIsCheckingUsername(false);
    }

    

    try {
      const updates = {
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
      };

      

      await updateProfile(updates);

      

      // Show success state and navigate back immediately
      setSaveSuccess(true);

      // Navigate back immediately since we're using optimistic updates
      
      navigation.goBack();
    } catch (updateError: any) {
      console.error("❌ Profile update failed:", updateError);

      // Reset success state if there was an error
      setSaveSuccess(false);

      // Show user-friendly error message
      const errorMessage =
        updateError.message || "Failed to update profile. Please try again.";
      console.error("User will see error:", errorMessage);

      showErrorAlert(errorMessage, "Profile Update Failed");
    }
  };

  /**
   * Handle navigation back with unsaved changes warning
   */
  const handleGoBack = () => {
    if (hasChanges) {
      showDestructiveAlert(
        "Unsaved Changes",
        "You have unsaved changes. Are you sure you want to go back?",
        () => navigation.goBack(),
        undefined,
        "Discard",
      );
    } else {
      navigation.goBack();
    }
  };

  // Cleanup timeout when component unmounts
  useEffect(() => {
    return () => {
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.background.primary}
      />

      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray">
        <TouchableOpacity onPress={handleGoBack} className="p-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text className="text-white font-orbitron text-xl">Edit Profile</Text>

        <TouchableOpacity
          onPress={handleSaveProfile}
          disabled={
            isLoading ||
            isCheckingUsername ||
            !!usernameError ||
            !hasChanges ||
            saveSuccess
          }
          className={`px-4 py-2 rounded-lg ${
            saveSuccess
              ? "bg-green-500"
              : hasChanges &&
                  !usernameError &&
                  !isLoading &&
                  !isCheckingUsername
                ? "bg-cyber-cyan"
                : "bg-cyber-gray opacity-50"
          }`}
        >
          <Text
            className={`font-inter font-semibold ${
              saveSuccess
                ? "text-white"
                : hasChanges &&
                    !usernameError &&
                    !isLoading &&
                    !isCheckingUsername
                  ? "text-cyber-black"
                  : "text-white/50"
            }`}
          >
            {saveSuccess ? "✓ Saved!" : isLoading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Photo Section */}
          <View className="items-center py-8">
            <View className="w-24 h-24 bg-cyber-cyan/20 rounded-full justify-center items-center mb-4">
              <Ionicons name="person" size={40} color={accentColor} />
            </View>
            <TouchableOpacity className="bg-cyber-dark px-4 py-2 rounded-lg">
              <Text className="text-cyber-cyan font-inter font-medium">
                Change Photo
              </Text>
            </TouchableOpacity>
            <Text className="text-white/40 font-inter text-xs mt-2 text-center">
              Profile photo coming soon
            </Text>
          </View>

          {/* Form Fields */}
          <View className="mb-8">
            {/* Display Name */}
            <View className="mb-6">
              <Text className="text-cyber-cyan font-inter mb-2 font-medium">
                Display Name <Text className="text-red-400">*</Text>
              </Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your display name"
                placeholderTextColor="#6B7280"
                className="bg-cyber-dark border border-cyber-gray rounded-lg px-4 py-3 text-white font-inter"
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isLoading}
                maxLength={50}
              />
              <Text className="text-white/40 font-inter text-xs mt-1">
                {displayName.length}/50 characters
              </Text>
            </View>

            {/* Username */}
            <View className="mb-6">
              <Text className="text-cyber-cyan font-inter mb-2 font-medium">
                Username <Text className="text-red-400">*</Text>
              </Text>
              <TextInput
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="Choose a unique username"
                placeholderTextColor="#6B7280"
                className={`bg-cyber-dark border rounded-lg px-4 py-3 text-white font-inter ${
                  usernameError ? "border-red-500" : "border-cyber-gray"
                }`}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading && !isCheckingUsername}
                maxLength={20}
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

              {username &&
              !usernameError &&
              !isCheckingUsername &&
              username !== originalUsername ? (
                <Text className="text-green-400 text-sm font-inter mt-1">
                  ✓ Username available
                </Text>
              ) : null}

              <Text className="text-white/40 font-inter text-xs mt-1">
                {username.length}/20 characters • Letters, numbers, and
                underscores only
              </Text>
            </View>

            {/* Bio */}
            <View className="mb-6">
              <Text className="text-cyber-cyan font-inter mb-2 font-medium">
                Bio
              </Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Tell people about yourself"
                placeholderTextColor="#6B7280"
                className="bg-cyber-dark border border-cyber-gray rounded-lg px-4 py-3 text-white font-inter"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoCapitalize="sentences"
                autoCorrect={true}
                editable={!isLoading}
                maxLength={150}
              />
              <Text className="text-white/40 font-inter text-xs mt-1">
                {bio.length}/150 characters
              </Text>
            </View>
          </View>

          {/* Gaming Aesthetic Elements */}
          <View className="items-center mb-8">
            <View className="w-full h-px bg-cyber-cyan opacity-30 mb-4" />
            <Text className="text-green-400 text-sm font-mono">
              [ PROFILE CUSTOMIZATION ]
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

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
    Image,
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
import { GamingGenreSelector } from "../../components/common";
import { AvatarUploader, BannerUploader, StatusMessageEditor } from "../../components/profile";
import { mediaService } from "../../services/media";
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
  const [gamingInterests, setGamingInterests] = useState<string[]>(profile?.gamingInterests || []);
  const [originalUsername] = useState(profile?.username || "");

  // Avatar state
  const [showAvatarUploader, setShowAvatarUploader] = useState(false);

  // Banner state
  const [showBannerUploader, setShowBannerUploader] = useState(false);

  // Status message state
  const [showStatusMessageEditor, setShowStatusMessageEditor] = useState(false);

  // Validation state
  const [usernameError, setUsernameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showGamingInterests, setShowGamingInterests] = useState(false);

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
      gamingInterests: profile?.gamingInterests || [],
    };

    const currentData = {
      displayName,
      username,
      bio,
      gamingInterests,
    };

    const changes = Object.keys(originalData).some(
      (key) => {
        const originalValue = originalData[key as keyof typeof originalData];
        const currentValue = currentData[key as keyof typeof currentData];
        
        // Special handling for arrays
        if (Array.isArray(originalValue) && Array.isArray(currentValue)) {
          return JSON.stringify(originalValue.sort()) !== JSON.stringify(currentValue.sort());
        }
        
        return originalValue !== currentValue;
      }
    );

    setHasChanges(changes);
  }, [displayName, username, bio, gamingInterests, profile]);

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
  const checkUsernameWithDebounce = (username: string) => {
    // Clear previous timeout
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }

    // Clear error immediately if username is empty or same as original
    if (!username || username === originalUsername) {
      setUsernameError("");
      setIsCheckingUsername(false);
      return;
    }

    // Validate format first
    if (!isValidUsernameFormat(username)) {
      setUsernameError(
        "Username must be 3-20 characters with letters, numbers, and underscores only"
      );
      setIsCheckingUsername(false);
      return;
    }

    // Set checking state
    setIsCheckingUsername(true);
    setUsernameError("");

    // Set timeout for availability check
    usernameTimeoutRef.current = setTimeout(async () => {
      try {
        const isAvailable = await checkUsernameAvailability(username);
        
        if (!isAvailable) {
          setUsernameError("Username is already taken");
        } else {
          setUsernameError("");
        }
      } catch (error) {
        console.error("Username availability check failed:", error);
        setUsernameError("Unable to check username availability");
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500); // 500ms debounce
  };

  /**
   * Handle username change
   * @param {string} text - New username value
   */
  const handleUsernameChange = (text: string) => {
    // Convert to lowercase and remove spaces
    const cleanedText = text.toLowerCase().replace(/\s/g, '');
    setUsername(cleanedText);
    
    // Check availability with debouncing
    checkUsernameWithDebounce(cleanedText);
  };

  /**
   * Handle profile save
   */
  const handleSaveProfile = async () => {
    // Validate required fields
    if (!displayName.trim()) {
      showErrorAlert("Display name is required", "Validation Error");
      return;
    }

    if (!username.trim()) {
      showErrorAlert("Username is required", "Validation Error");
      return;
    }

    if (usernameError) {
      showErrorAlert("Please fix username errors before saving", "Validation Error");
      return;
    }

    try {
      const updates = {
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        gamingInterests: gamingInterests,
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

  /**
   * Handle avatar upload complete
   */
  const handleAvatarUploadComplete = (avatarData: any) => {
    console.log("✅ Avatar upload completed:", avatarData);
    setShowAvatarUploader(false);
    // Profile will be updated automatically by the auth store
  };

  /**
   * Handle banner upload complete
   */
  const handleBannerUploadComplete = (bannerData: any) => {
    console.log("✅ Banner upload completed:", bannerData);
    setShowBannerUploader(false);
    // Profile will be updated automatically by the auth store
  };

  /**
   * Handle banner upload error
   */
  const handleBannerUploadError = (error: string) => {
    console.error("❌ Banner upload error:", error);
    showErrorAlert(error, "Banner Upload Failed");
  };

  /**
   * Get current avatar URL with fallback
   */
  const getCurrentAvatarUrl = () => {
    // Use the optimized avatar URL if available
    if (profile?.avatar?.urls) {
      return mediaService.getOptimizedAvatarUrl(profile.avatar, '96');
    }
    
    // Fallback to old profilePhoto field
    return profile?.profilePhoto || null;
  };

  /**
   * Get current banner URL with fallback
   */
  const getCurrentBannerUrl = () => {
    // Use the optimized banner URL if available
    if (profile?.profileBanner?.urls) {
      return mediaService.getOptimizedBannerUrl(profile.profileBanner, 'large');
    }
    
    // Fallback to old banner URL field
    return profile?.profileBanner?.url || null;
  };

  /**
   * Get availability status color
   * @param {string} availability - Availability status
   * @returns {string} Color hex code
   */
  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return '#10B981'; // Green
      case 'busy':
        return '#EF4444'; // Red
      case 'gaming':
        return '#8B5CF6'; // Purple
      case 'afk':
        return '#6B7280'; // Gray
      default:
        return '#10B981'; // Default to green
    }
  };

  /**
   * Get availability status label
   * @param {string} availability - Availability status
   * @returns {string} Human readable label
   */
  const getAvailabilityLabel = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'Available';
      case 'busy':
        return 'Busy';
      case 'gaming':
        return 'Gaming';
      case 'afk':
        return 'Away';
      default:
        return 'Available';
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
          {/* Profile Banner Section */}
          <View className="mb-8">
            <Text className="text-cyber-cyan font-inter mb-3 font-medium">
              Profile Banner
            </Text>
            
            {/* Banner Preview/Upload Area */}
            <TouchableOpacity
              onPress={() => setShowBannerUploader(true)}
              className="w-full h-32 rounded-xl overflow-hidden bg-cyber-dark border-2 border-dashed border-cyber-gray/50"
            >
              {getCurrentBannerUrl() ? (
                <View className="relative w-full h-full">
                  <Image
                    source={{ uri: getCurrentBannerUrl() }}
                    className="w-full h-full"
                    style={{ resizeMode: 'cover' }}
                  />
                  {/* Edit Overlay */}
                  <View className="absolute inset-0 bg-black/50 justify-center items-center">
                    <Ionicons name="camera-outline" size={24} color="white" />
                    <Text className="text-white font-inter text-sm mt-1">
                      Change Banner
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="flex-1 justify-center items-center">
                  <Ionicons name="image-outline" size={32} color="#6B7280" />
                  <Text className="text-white/60 font-inter text-sm mt-2">
                    Add Profile Banner
                  </Text>
                  <Text className="text-white/40 font-inter text-xs mt-1">
                    Landscape images work best
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Status Message Section */}
          <View className="mb-8">
            <Text className="text-cyber-cyan font-inter mb-3 font-medium">
              Status Message
            </Text>
            
            {/* Status Message Preview/Edit Area */}
            <TouchableOpacity
              onPress={() => setShowStatusMessageEditor(true)}
              className="w-full p-4 rounded-xl bg-cyber-dark border border-cyber-gray/50"
            >
              {profile?.statusMessage && (profile?.statusMessage?.text || profile?.statusMessage?.emoji) ? (
                <View className="flex-row items-center">
                  {/* Availability Indicator */}
                  <View 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: getAvailabilityColor(profile.statusMessage.availability) }}
                  />
                  <View className="flex-1">
                    <Text className="text-white font-inter">
                      {profile.statusMessage.emoji && `${profile.statusMessage.emoji} `}
                      {profile.statusMessage.text}
                    </Text>
                    <Text className="text-white/60 font-inter text-xs mt-1">
                      {getAvailabilityLabel(profile.statusMessage.availability)}
                      {profile.statusMessage.gameContext && ` • ${profile.statusMessage.gameContext}`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="chatbubble-outline" size={24} color="#6B7280" />
                  <View className="flex-1 ml-3">
                    <Text className="text-white/60 font-inter text-sm">
                      Set Status Message
                    </Text>
                                         <Text className="text-white/40 font-inter text-xs mt-1">
                       Let friends know what you&apos;re up to
                     </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Profile Photo Section */}
          <View className="items-center py-8">
            {/* Avatar Display */}
            <TouchableOpacity
              onPress={() => setShowAvatarUploader(true)}
              className="mb-4"
            >
              {getCurrentAvatarUrl() ? (
                <View className="relative">
                  <Image
                    source={{ uri: getCurrentAvatarUrl() }}
                    className="w-24 h-24 rounded-full"
                    style={{ backgroundColor: '#2a2a2a' }}
                  />
                  {/* Edit Overlay */}
                  <View className="absolute inset-0 bg-black/50 rounded-full justify-center items-center">
                    <Ionicons name="camera-outline" size={24} color="white" />
                  </View>
                </View>
              ) : (
                <View className="w-24 h-24 bg-cyber-cyan/20 rounded-full justify-center items-center">
                  <Ionicons name="person" size={40} color={accentColor} />
                </View>
              )}
            </TouchableOpacity>

            {/* Change Photo Button */}
            <TouchableOpacity 
              onPress={() => setShowAvatarUploader(true)}
              className="bg-cyber-dark px-4 py-2 rounded-lg border border-cyber-cyan/30"
            >
              <Text className="text-cyber-cyan font-inter font-medium">
                {getCurrentAvatarUrl() ? 'Change Photo' : 'Add Photo'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View className="space-y-6">
            {/* Display Name */}
            <View className="mb-6">
              <Text className="text-cyber-cyan font-inter mb-2 font-medium">
                Display Name
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
            </View>

            {/* Username */}
            <View className="mb-6">
              <Text className="text-cyber-cyan font-inter mb-2 font-medium">
                Username
              </Text>
              <View className="relative">
                <TextInput
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="Enter your username"
                  placeholderTextColor="#6B7280"
                  className={`bg-cyber-dark border rounded-lg px-4 py-3 text-white font-jetbrains pr-10 ${
                    usernameError
                      ? "border-red-500"
                      : username && !usernameError && !isCheckingUsername
                      ? "border-green-500"
                      : "border-cyber-gray"
                  }`}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  maxLength={20}
                />
                
                {/* Username validation indicator */}
                <View className="absolute right-3 top-4">
                  {isCheckingUsername ? (
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                  ) : usernameError ? (
                    <Ionicons name="close-circle" size={16} color="#ef4444" />
                  ) : username && username !== originalUsername ? (
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  ) : null}
                </View>
              </View>
              
              {/* Username error or help text */}
              {usernameError ? (
                <Text className="text-red-400 font-inter text-sm mt-1">
                  {usernameError}
                </Text>
              ) : (
                <Text className="text-white/40 font-inter text-xs mt-1">
                  3-20 characters, letters, numbers, and underscores only
                </Text>
              )}
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

            {/* Gaming Interests */}
            <View className="mb-6">
              <TouchableOpacity
                onPress={() => setShowGamingInterests(!showGamingInterests)}
                className="flex-row justify-between items-center mb-3"
              >
                <Text className="text-cyber-cyan font-inter font-medium">
                  Gaming Interests
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-white/60 font-inter text-sm mr-2">
                    {gamingInterests.length} selected
                  </Text>
                  <Ionicons
                    name={showGamingInterests ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#00ffff"
                  />
                </View>
              </TouchableOpacity>

              {showGamingInterests && (
                <View className="bg-cyber-dark border border-cyber-gray rounded-lg p-4">
                  <GamingGenreSelector
                    selectedGenres={gamingInterests}
                    onGenresChange={setGamingInterests}
                    maxSelections={8}
                    showPresets={false}
                    showCategories={true}
                    compact={true}
                    disabled={isLoading}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Advanced Customization Link */}
          <View className="mb-8">
            <TouchableOpacity
              onPress={() => navigation.navigate("ProfileCustomization")}
              className="bg-cyber-dark/50 p-4 rounded-xl border border-cyber-cyan/30"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="color-palette-outline" size={24} color={accentColor} />
                  <View className="ml-3">
                    <Text className="text-cyber-cyan font-inter font-medium">
                      Advanced Customization
                    </Text>
                    <Text className="text-white/60 font-inter text-sm">
                      Avatars, banners, status showcase
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={accentColor} />
              </View>
            </TouchableOpacity>
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

      {/* Avatar Uploader Modal */}
      <AvatarUploader
        visible={showAvatarUploader}
        onUploadComplete={handleAvatarUploadComplete}
        onCancel={() => setShowAvatarUploader(false)}
      />

      {/* Banner Uploader Modal */}
      {showBannerUploader && profile?.uid && (
        <View className="absolute inset-0 bg-black/80 z-50">
          <SafeAreaView className="flex-1">
            <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray/20">
              <Text className="text-white font-orbitron text-xl">Profile Banner</Text>
              <TouchableOpacity onPress={() => setShowBannerUploader(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView className="flex-1 p-6">
              <BannerUploader
                userId={profile.uid}
                currentBanner={profile.profileBanner}
                onUploadComplete={handleBannerUploadComplete}
                onUploadError={handleBannerUploadError}
                aspectRatio="16:9"
              />
            </ScrollView>
          </SafeAreaView>
        </View>
      )}

      {/* Status Message Editor Modal */}
      <StatusMessageEditor
        visible={showStatusMessageEditor}
        onClose={() => setShowStatusMessageEditor(false)}
        initialStatus={{
          text: profile?.statusMessage?.text || '',
          emoji: profile?.statusMessage?.emoji || '',
          gameContext: profile?.statusMessage?.gameContext || '',
          availability: profile?.statusMessage?.availability || 'available',
          expiresAt: profile?.statusMessage?.expiresAt || undefined,
        }}
        onSave={(statusData: any) => {
          console.log('✅ Status message saved:', statusData);
          setShowStatusMessageEditor(false);
          // Profile will be updated automatically by the auth store
        }}
      />
    </SafeAreaView>
  );
};

export default EditProfileScreen;

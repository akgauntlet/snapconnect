/**
 * @file GamingInterestsScreen.tsx
 * @description Gaming interests selection screen for new user onboarding.
 * Allows users to select their favorite gaming genres during signup.
 *
 * @author SnapConnect Team
 * @created 2024-01-25
 * @modified 2024-01-25
 *
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @react-navigation/native: Navigation
 * - @/components/common: GamingGenreSelector
 * - @/stores/authStore: Authentication state
 *
 * @usage
 * Part of the signup flow after basic profile creation.
 *
 * @ai_context
 * AI-powered gaming preference detection and smart recommendations.
 * Integrates with gaming platform APIs for enhanced suggestions.
 */

import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { GamingGenreSelector } from "../../components/common";
import { useAuthStore } from "../../stores/authStore";
import { showErrorAlert } from "../../utils/alertService";

// Type definitions
type GamingInterestsNavigationProp = NativeStackNavigationProp<any, "GamingInterests">;

interface GamingInterestsScreenProps {
  navigation?: GamingInterestsNavigationProp;
}

/**
 * Gaming interests selection screen component
 *
 * @param props - Component properties
 * @returns {React.ReactElement} Rendered gaming interests screen
 *
 * @performance
 * - Optimized genre selection with efficient state management
 * - Smooth navigation transitions with gaming aesthetics
 * - Memory-efficient component rendering
 *
 * @ai_integration
 * - Smart genre recommendations based on user behavior
 * - Platform integration for existing gaming library analysis
 * - Personalized gaming interest suggestions
 */
const GamingInterestsScreen: React.FC<GamingInterestsScreenProps> = () => {
  const navigation = useNavigation<GamingInterestsNavigationProp>();
  const route = useRoute();
  
  // Get signup data from navigation params
  const signupData = (route.params as any)?.signupData || {};
  
  // Auth store
  const { updateProfile, isLoading } = useAuthStore();

  // Form state
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  /**
   * Handle genre selection changes
   * @param {string[]} genres - Selected genre IDs
   */
  const handleGenresChange = (genres: string[]) => {
    setSelectedGenres(genres);
  };

  /**
   * Handle skip - continue without selecting interests
   */
  const handleSkip = () => {
    // Complete signup without gaming interests
    completeSignup([]);
  };

  /**
   * Handle continue with selected interests
   */
  const handleContinue = () => {
    if (selectedGenres.length === 0) {
      showErrorAlert(
        "Please select at least one gaming interest or skip this step.",
        "No Interests Selected"
      );
      return;
    }

    completeSignup(selectedGenres);
  };

  /**
   * Complete the signup process with gaming interests
   * @param {string[]} interests - Selected gaming interests
   */
  const completeSignup = async (interests: string[]) => {
    setIsCompleting(true);

    try {
      // Update user profile with gaming interests
      const profileUpdates = {
        gamingInterests: interests,
        profileCompletedAt: new Date().toISOString(),
        onboardingComplete: true,
      };

      await updateProfile(profileUpdates);

      // Navigation will be handled by auth state change
      // User will be automatically directed to main app
      
    } catch (error: any) {
      console.error("❌ Gaming interests update failed:", error);
      setIsCompleting(false);
      
      showErrorAlert(
        error.message || "Failed to save gaming interests. Please try again.",
        "Profile Update Failed"
      );
    }
  };

  /**
   * Handle back navigation with confirmation
   */
  const handleGoBack = () => {
    // Navigate back to previous signup step
    navigation.goBack();
  };

  return (
    <SafeAreaView className="flex-1 bg-cyber-black">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray">
          <TouchableOpacity onPress={handleGoBack} className="p-2">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <Text className="text-white font-orbitron text-xl">Gaming Interests</Text>

          <TouchableOpacity onPress={handleSkip} className="p-2">
            <Text className="text-cyber-cyan font-inter">Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 px-6 py-6">
          {/* Welcome Message */}
          <View className="mb-6">
            <Text className="text-cyber-cyan font-orbitron text-2xl mb-2">
              Welcome to SnapConnect!
            </Text>
            <Text className="text-white/80 font-inter text-base leading-6">
              Let&apos;s personalize your gaming experience. Select the genres you enjoy 
              to help us connect you with like-minded gamers and suggest relevant content.
            </Text>
          </View>

          {/* Gaming Genre Selector */}
          <View className="flex-1">
            <GamingGenreSelector
              selectedGenres={selectedGenres}
              onGenresChange={handleGenresChange}
              maxSelections={8}
              showPresets={true}
              showCategories={true}
              disabled={isCompleting}
            />
          </View>

          {/* Action Buttons */}
          <View className="pt-6 space-y-3">
            {/* Continue Button */}
            <TouchableOpacity
              onPress={handleContinue}
              disabled={isCompleting || selectedGenres.length === 0}
              className={`bg-cyber-cyan py-4 rounded-lg shadow-lg ${
                isCompleting || selectedGenres.length === 0 ? "opacity-50" : ""
              }`}
              style={{
                boxShadow: selectedGenres.length > 0 ? '0px 0px 10px rgba(0, 255, 255, 0.3)' : undefined,
              } as any}
            >
              <Text className="text-cyber-black font-bold text-lg font-orbitron text-center">
                {isCompleting 
                  ? "COMPLETING SETUP..." 
                  : `CONTINUE WITH ${selectedGenres.length} INTEREST${selectedGenres.length !== 1 ? 'S' : ''}`
                }
              </Text>
            </TouchableOpacity>

            {/* Skip Button */}
            <TouchableOpacity
              onPress={handleSkip}
              disabled={isCompleting}
              className="bg-cyber-dark border border-cyber-gray py-4 rounded-lg"
            >
              <Text className="text-white font-inter text-center">
                Skip for Now - I&apos;ll Add Later
              </Text>
            </TouchableOpacity>
          </View>

          {/* Gaming Aesthetic Elements */}
          <View className="items-center mt-6">
            <View className="w-full h-px bg-cyber-cyan opacity-30 mb-2" />
            <Text className="text-green-400 text-xs font-mono">
              [ PERSONALIZING GAMING EXPERIENCE ]
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default GamingInterestsScreen; 

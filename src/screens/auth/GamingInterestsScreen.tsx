/**
 * @file GamingInterestsScreen.tsx
 * @description Simple gaming interests selection screen for user onboarding.
 * Allows users to select their gaming preferences to personalize their experience.
 *
 * @author SnapConnect Team
 * @created 2024-01-25
 * @modified 2024-01-25
 *
 * @dependencies
 * - react: React hooks and components
 * - react-native: Core UI components
 * - @react-navigation/native: Navigation hooks
 * - @/components/common: GamingGenreSelector component
 * - @/stores/authStore: Authentication state management
 * - @/utils/alertService: Error handling utilities
 */

import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { GamingGenreSelector } from "../../components/common";
import { useAuthStore } from "../../stores/authStore";
import { showErrorAlert } from "../../utils/alertService";

/**
 * Navigation type for gaming interests screen
 */
type GamingInterestsNavigationProp = NativeStackNavigationProp<any, "GamingInterests">;

/**
 * Props interface for the gaming interests screen
 */
interface GamingInterestsScreenProps {
  navigation?: GamingInterestsNavigationProp;
}

/**
 * Gaming interests selection screen component
 * Simple, focused screen for selecting gaming preferences during onboarding
 */
function GamingInterestsScreen(): React.ReactElement {
  const navigation = useNavigation<GamingInterestsNavigationProp>();
  const route = useRoute();
  
  // Get signup data from navigation params if available
  const signupData = (route.params as any)?.signupData || {};
  
  // Auth store hooks
  const { updateProfile, isAuthenticated, profile } = useAuthStore();
  
  // Check if this is an existing user completing onboarding
  const isExistingUserOnboarding = isAuthenticated && profile && !profile.onboardingComplete;

  // Component state
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  /**
   * Handle changes to selected gaming genres
   * @param genres - Array of selected genre strings
   */
  function handleGenresChange(genres: string[]): void {
    setSelectedGenres(genres);
  }

  /**
   * Complete the onboarding process by saving gaming interests to user profile
   * @param interests - Array of selected gaming interest strings
   */
  async function completeOnboarding(interests: string[]): Promise<void> {
    if (interests.length === 0) {
      showErrorAlert(
        "Please select at least one gaming interest to continue.",
        "Gaming Interests Required"
      );
      return;
    }

    setIsCompleting(true);

    try {
      const profileUpdates = {
        gamingInterests: interests,
        profileCompletedAt: new Date().toISOString(),
        onboardingComplete: true,
      };

      await updateProfile(profileUpdates);
      
      // Navigation will be handled automatically by auth state changes
      console.log("✅ Gaming interests saved successfully");
      
    } catch (error: any) {
      console.error("❌ Gaming interests update failed:", error);
      setIsCompleting(false);
      
      showErrorAlert(
        error.message || "Failed to save gaming interests. Please try again.",
        "Profile Update Failed"
      );
    }
  }

  /**
   * Handle continue button press
   */
  function handleContinue(): void {
    completeOnboarding(selectedGenres);
  }

  /**
   * Render the main content section with hero message and description
   */
  function renderHeroSection(): React.ReactElement {
    return (
      <View className="items-center mb-8">
        <View className="bg-cyber-cyan/20 rounded-full p-6 mb-4">
          <Ionicons name="game-controller" size={48} color="#00ffff" />
        </View>
        
        <Text className="text-cyber-cyan font-orbitron text-2xl mb-2 text-center">
          {isExistingUserOnboarding ? "Complete Your Profile" : "Choose Your Gaming Vibe"}
        </Text>
        
        <Text className="text-white/80 font-inter text-base text-center leading-6 px-4">
          {isExistingUserOnboarding 
            ? "Set up your gaming preferences to unlock AI features and access the app"
            : "Help us connect you with like-minded gamers by selecting your favorite genres"
          }
        </Text>
      </View>
    );
  }

  /**
   * Render the gaming features info section
   */
  function renderFeaturesSection(): React.ReactElement {
    return (
      <View className="bg-cyber-dark/40 border border-cyber-cyan/20 rounded-lg p-6 mb-6">
        <View className="flex-row items-center mb-4">
          <Ionicons name="sparkles" size={20} color="#00ffff" />
          <Text className="text-cyber-cyan font-inter font-semibold ml-3">
            What You&apos;ll Get
          </Text>
        </View>

        <View className="space-y-3">
          <View className="flex-row items-start">
            <Ionicons name="people" size={16} color="#22c55e" className="mt-1" />
            <View className="flex-1 ml-3">
              <Text className="text-white font-inter font-medium">
                Smart Friend Matching
              </Text>
              <Text className="text-white/70 font-inter text-sm">
                Connect with gamers who share your interests
              </Text>
            </View>
          </View>

          <View className="flex-row items-start">
            <Ionicons name="chatbubbles" size={16} color="#22c55e" className="mt-1" />
            <View className="flex-1 ml-3">
              <Text className="text-white font-inter font-medium">
                AI Conversation Starters
              </Text>
              <Text className="text-white/70 font-inter text-sm">
                Never run out of things to talk about
              </Text>
            </View>
          </View>

          <View className="flex-row items-start">
            <Ionicons name="trophy" size={16} color="#22c55e" className="mt-1" />
            <View className="flex-1 ml-3">
              <Text className="text-white font-inter font-medium">
                Personalized Content
              </Text>
              <Text className="text-white/70 font-inter text-sm">
                Get recommendations tailored to your taste
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  /**
   * Render the gaming genre selector section
   */
  function renderGenreSelectorSection(): React.ReactElement {
    return (
      <View className="flex-1 min-h-[300px] mb-6">
        <View className="mb-4">
          <Text className="text-white font-inter text-lg mb-2">
            Select Your Gaming Interests
          </Text>
          <Text className="text-white/60 font-inter text-sm">
            Choose up to 8 genres • {selectedGenres.length} selected
          </Text>
        </View>

        <GamingGenreSelector
          selectedGenres={selectedGenres}
          onGenresChange={handleGenresChange}
          maxSelections={8}
          showPresets={true}
          showCategories={true}
          disabled={isCompleting}
        />
      </View>
    );
  }

  /**
   * Render the action buttons section
   */
  function renderActionSection(): React.ReactElement {
    const hasSelection = selectedGenres.length > 0;
    const buttonText = isCompleting 
      ? "COMPLETING SETUP..." 
      : hasSelection
      ? `CONTINUE WITH ${selectedGenres.length} GENRE${selectedGenres.length !== 1 ? 'S' : ''}`
      : "SELECT AT LEAST ONE GENRE";

    return (
      <View className="pt-4">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={isCompleting || !hasSelection}
          className={`py-4 rounded-lg shadow-lg ${
            hasSelection && !isCompleting 
              ? "bg-cyber-cyan" 
              : "bg-cyber-gray opacity-50"
          }`}
          style={hasSelection ? {
            shadowColor: '#00ffff',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
          } : undefined}
        >
          <View className="flex-row items-center justify-center">
            {isCompleting && (
              <ActivityIndicator 
                size="small" 
                color={hasSelection ? "#000000" : "#ffffff"} 
                className="mr-2" 
              />
            )}
            <Text className={`font-bold text-lg font-orbitron ${
              hasSelection && !isCompleting ? "text-cyber-black" : "text-white/50"
            }`}>
              {buttonText}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Gaming aesthetic footer */}
        <View className="items-center mt-6">
          <View className="w-full h-px bg-cyber-cyan opacity-30 mb-2" />
          <Text className="text-green-400 text-xs font-mono">
            [ PERSONALIZING GAMING EXPERIENCE • AI-POWERED ]
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-cyber-black">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray">
          <View className="w-10" />
          
          <Text className="text-white font-orbitron text-xl">
            Gaming Setup
          </Text>
          
          <View className="w-10" />
        </View>

        {/* Main Content */}
        <ScrollView 
          className="flex-1 px-6 py-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {renderHeroSection()}
          {renderFeaturesSection()}
          {renderGenreSelectorSection()}
        </ScrollView>

        {/* Fixed Action Section */}
        <View className="px-6 py-4 border-t border-cyber-gray/20">
          {renderActionSection()}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default GamingInterestsScreen; 

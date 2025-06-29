/**
 * @file SettingsScreen.tsx
 * @description Settings interface for SnapConnect gaming preferences and app configuration.
 * Provides theme customization, notification settings, privacy controls, and gaming preferences.
 *
 * @author SnapConnect Team
 * @created 2024-01-26
 * @modified 2024-01-26
 *
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @/stores/themeStore: Theme management
 * - @/stores/authStore: Authentication state
 * - @/components/common: Shared components
 *
 * @usage
 * Settings screen accessible from Profile tab for user preferences.
 *
 * @ai_context
 * AI-powered settings recommendations based on user behavior patterns.
 * Smart defaults and personalized configuration suggestions.
 */

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { CyberButton } from "../../components/common";
import { useTabBarHeight } from "../../hooks/useTabBarHeight";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";

/**
 * Settings screen component
 *
 * @returns {React.ReactElement} Rendered settings interface
 *
 * @performance
 * - Optimized switch animations and state updates
 * - Efficient theme switching with minimal re-renders
 * - Smooth navigation and scrolling performance
 *
 * @ai_integration
 * - Personalized setting recommendations
 * - Gaming behavior analysis for optimal configurations
 * - Smart notification scheduling based on gaming patterns
 */
const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const preferences = useThemeStore((state) => state.preferences);
  const { tabBarHeight } = useTabBarHeight();
  
  // Theme store actions
  const setAccentColor = useThemeStore((state) => state.setAccentColor);
  const resetTheme = useThemeStore((state) => state.resetTheme);

  // Auth store
  const { user, profile, updatePreferences } = useAuthStore();
  const userPreferences = useAuthStore((state) => state.preferences);

  // Local state for temporary settings
  const [privacyMode, setPrivacyMode] = useState(userPreferences.privacy);

  /**
   * Handle accent color selection
   */
  const handleAccentColorChange = (color: string) => {
    setAccentColor(color);
  };

  /**
   * Handle privacy mode change
   */
  const handlePrivacyModeChange = (mode: string) => {
    setPrivacyMode(mode);
    updatePreferences({ privacy: mode });
  };

  /**
   * Handle theme reset with confirmation
   */
  const handleResetTheme = () => {
    Alert.alert(
      "Reset Theme",
      "Are you sure you want to reset all theme settings to default?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: resetTheme,
        },
      ]
    );
  };

  /**
   * Render settings section
   */
  const renderSection = (title: string, children: React.ReactNode) => (
    <View className="mb-6">
      <Text className="text-white font-orbitron text-lg mb-4 px-6">
        {title}
      </Text>
      <View className="bg-cyber-dark rounded-lg mx-6">
        {children}
      </View>
    </View>
  );

  /**
   * Render settings item with switch
   */
  const renderSwitchItem = (
    title: string,
    subtitle: string,
    value: boolean,
    onToggle: (value: boolean) => void,
    icon: string
  ) => (
    <View className="flex-row items-center justify-between p-4 border-b border-cyber-gray/10 last:border-b-0">
      <View className="flex-row items-center flex-1">
        <View className="w-10 h-10 bg-cyber-cyan/20 rounded-full justify-center items-center mr-4">
          <Ionicons name={icon as any} size={20} color={accentColor} />
        </View>
        <View className="flex-1">
          <Text className="text-white font-inter font-medium mb-1">
            {title}
          </Text>
          <Text className="text-white/70 font-inter text-sm">
            {subtitle}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#2a2a2a", true: accentColor }}
        thumbColor={value ? "#ffffff" : "#707070"}
        ios_backgroundColor="#2a2a2a"
      />
    </View>
  );

  /**
   * Render accent color picker
   */
  const renderAccentColorPicker = () => {
    const colors = [
      { name: "cyan", color: "#00ffff", label: "Cyber Cyan" },
      { name: "magenta", color: "#ff00ff", label: "Neon Magenta" },
      { name: "green", color: "#00ff00", label: "Matrix Green" },
      { name: "orange", color: "#ff8800", label: "Gaming Orange" },
    ];

    return (
      <View className="p-4">
        <View className="flex-row items-center mb-4">
          <View className="w-10 h-10 bg-cyber-cyan/20 rounded-full justify-center items-center mr-4">
            <Ionicons name="color-palette-outline" size={20} color={accentColor} />
          </View>
          <View>
            <Text className="text-white font-inter font-medium">
              Accent Color
            </Text>
            <Text className="text-white/70 font-inter text-sm">
              Choose your preferred theme color
            </Text>
          </View>
        </View>
        
        <View className="flex-row justify-between">
          {colors.map((colorOption) => (
            <TouchableOpacity
              key={colorOption.name}
              onPress={() => handleAccentColorChange(colorOption.name)}
              className={`w-12 h-12 rounded-full border-2 ${
                preferences.accentColor === colorOption.name
                  ? "border-white"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: colorOption.color }}
            >
              {preferences.accentColor === colorOption.name && (
                <View className="w-full h-full justify-center items-center">
                  <Ionicons name="checkmark" size={20} color="#000000" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  /**
   * Render privacy mode selector
   */
  const renderPrivacyModeSelector = () => {
    const privacyModes = [
      { key: "public", label: "Public", description: "Anyone can find you" },
      { key: "friends", label: "Friends Only", description: "Only friends can see your content" },
      { key: "private", label: "Private", description: "Maximum privacy protection" },
    ];

    return (
      <View className="p-4">
        <View className="flex-row items-center mb-4">
          <View className="w-10 h-10 bg-cyber-cyan/20 rounded-full justify-center items-center mr-4">
            <Ionicons name="shield-outline" size={20} color={accentColor} />
          </View>
          <View>
            <Text className="text-white font-inter font-medium">
              Privacy Mode
            </Text>
            <Text className="text-white/70 font-inter text-sm">
              Control who can see your content
            </Text>
          </View>
        </View>

        {privacyModes.map((mode) => (
          <TouchableOpacity
            key={mode.key}
            onPress={() => handlePrivacyModeChange(mode.key)}
            className={`flex-row items-center p-3 rounded-lg mb-2 ${
              privacyMode === mode.key
                ? "bg-cyber-cyan/20 border border-cyber-cyan/40"
                : "bg-cyber-gray/10"
            }`}
          >
            <View className={`w-6 h-6 rounded-full border-2 mr-3 justify-center items-center ${
              privacyMode === mode.key
                ? "border-cyber-cyan bg-cyber-cyan"
                : "border-white/30"
            }`}>
              {privacyMode === mode.key && (
                <View className="w-2 h-2 bg-cyber-black rounded-full" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-white font-inter font-medium">
                {mode.label}
              </Text>
              <Text className="text-white/70 font-inter text-sm">
                {mode.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.background.primary}
      />

      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray/10">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <Ionicons name="arrow-back" size={24} color={accentColor} />
          </TouchableOpacity>
          <Text className="text-white font-orbitron text-2xl">Settings</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      >
        {/* Theme Settings */}
        {renderSection(
          "Theme & Appearance",
          renderAccentColorPicker()
        )}

        {/* Privacy Settings */}
        {renderSection(
          "Privacy & Security",
          renderPrivacyModeSelector()
        )}

        {/* Account Actions */}
        {renderSection(
          "Account",
          <View className="p-4">
            <CyberButton
              variant="ghost"
              icon="refresh-outline"
              fullWidth
              onPress={handleResetTheme}
              className="mb-3"
            >
              Reset Theme Settings
            </CyberButton>
            
            <CyberButton
              variant="secondary"
              icon="create-outline"
              fullWidth
              onPress={() => navigation.navigate("EditProfile")}
              className="mb-3"
            >
              Edit Profile
            </CyberButton>
          </View>
        )}

        {/* App Information */}
        <View className="px-6 py-4">
          <Text className="text-white/50 font-inter text-sm text-center">
            SnapConnect v1.0.0
          </Text>
          <Text className="text-white/50 font-inter text-sm text-center">
            Gaming-First Ephemeral Messaging
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen; 

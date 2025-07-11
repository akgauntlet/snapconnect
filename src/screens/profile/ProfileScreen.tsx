/**
 * @file ProfileScreen.tsx
 * @description User profile interface with gaming statistics and preferences.
 * Displays gaming achievements, preferences, and account management.
 *
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-20
 *
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @/stores/themeStore: Theme management
 * - @/stores/authStore: Authentication state
 *
 * @usage
 * User profile management and gaming statistics interface.
 *
 * @ai_context
 * AI-powered gaming insights and personalized recommendations.
 * Smart profile optimization based on gaming behavior patterns.
 */

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GameCard } from "../../components/common";
import { AchievementShowcase } from "../../components/profile";
import { useFriendCount } from "../../hooks/useFriendCount";
import { useTabBarHeight } from "../../hooks/useTabBarHeight";
import { mediaService } from "../../services/media";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import { getActualAchievementCount } from "../../utils/achievementHelpers";
import {
  getProfileCompletionPercentage,
  getUserBio,
  getUserDisplayName,
  getUserStats,
  getUserUsername
} from "../../utils/userHelpers";

/**
 * Profile screen component
 *
 * @returns {React.ReactElement} Rendered profile interface
 *
 * @performance
 * - Optimized image loading for profile content
 * - Efficient statistics calculations and caching
 * - Smooth navigation between profile sections
 *
 * @ai_integration
 * - Personalized gaming insights and recommendations
 * - Smart profile completion suggestions
 * - Automated gaming achievement tracking
 */
const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const { tabBarHeight } = useTabBarHeight();

  // Auth store
  const { signOut, isLoading, user, profile } = useAuthStore();

  // Fetch real friend count
  const { friendCount, isLoading: isFriendCountLoading } = useFriendCount(user?.uid);

  // Debug logging for profile data
  React.useEffect(() => {
    
  }, [user, profile, friendCount]);

  // Use helper functions for consistent user data with proper fallbacks
  const baseStats = getUserStats(profile);
  // Get the actual achievement count instead of using stored value
  const actualAchievementCount = getActualAchievementCount(profile);
  
  const userData = {
    name: getUserDisplayName(user, profile, isLoading),
    username: getUserUsername(profile, isLoading),
    bio: getUserBio(profile),
    stats: {
      ...baseStats,
      // Override achievement count with actual calculated count
      achievements: actualAchievementCount,
      // Friends count removed since it's now in its own tab
    },
    completionPercentage: getProfileCompletionPercentage(profile),
  };

  /**
   * Get current avatar URL with fallback
   */
  const getCurrentAvatarUrl = () => {
    // Use the optimized avatar URL if available
    if (profile?.avatar?.urls) {
      return mediaService.getOptimizedAvatarUrl(profile.avatar, 'large');
    }
    
    // Fallback to old avatar URL field
    return profile?.profilePhoto || null;
  };

  /**
   * Get availability color based on status
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
   * Handle menu item navigation
   */
  const handleMenuItemPress = (item: any) => {
    // If item has custom onPress, use that
    if (item.onPress) {
      item.onPress();
      return;
    }

    switch (item.title) {
      case "Customize Profile":
        navigation.navigate("EditProfile");
        break;
      case "Settings":
        navigation.navigate("Settings");
        break;
      case "Achievements":
        navigation.navigate("Achievements");
        break;
      default:
        console.log(`No handler for menu item: ${item.title}`);
    }
  };

  /**
   * Handle achievement showcase edit
   */
  const handleAchievementShowcaseEdit = () => {
    navigation.navigate("Achievements");
  };

  /**
   * Convert achievement showcase data for display
   */
  const getShowcaseAchievements = () => {
    if (!profile?.achievementShowcase) return [];
    
    return profile.achievementShowcase.map((achievement: any) => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      tier: achievement.tier || achievement.rarity || "bronze",
      points: achievement.points || 10,
      unlockedAt: achievement.unlockedAt || Date.now(),
    }));
  };

  const menuItems = [
    {
      icon: "color-palette-outline",
      title: "Customize Profile",
      subtitle: "Avatars, status",
    },
    {
      icon: "settings-outline",
      title: "Settings",
      subtitle: "App preferences",
    },
    {
      icon: "trophy-outline",
      title: "Achievements",
      subtitle: "Gaming milestones",
    },
  ];

  /**
   * Handle sign out directly without confirmation
   */
  const handleSignOut = async () => {
    try {
          await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      // For web compatibility, use console.error instead of Alert
      console.error("Sign out failed. Please try again.");
    }
  };

  /**
   * Render profile avatar with image support
   */
  const renderProfileAvatar = () => {
    const avatarUrl = getCurrentAvatarUrl();
    
    if (avatarUrl) {
      return (
        <View className="relative mb-4">
          <Image
            source={{ uri: avatarUrl }}
            className="w-24 h-24 rounded-full"
            style={{ backgroundColor: '#2a2a2a' }}
          />
          {/* Status indicator (can be used for online status in the future) */}
          <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-cyber-black" />
        </View>
      );
    } else {
      return (
        <View className="w-24 h-24 bg-cyber-cyan/20 rounded-full justify-center items-center mb-4">
          <Ionicons name="person" size={40} color={accentColor} />
        </View>
      );
    }
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
        <Text className="text-white font-orbitron text-2xl">Profile</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("EditProfile")}
          className="bg-cyber-cyan/10 border border-cyber-cyan/20 p-3 rounded-full"
        >
          <Ionicons name="create-outline" size={20} color={accentColor} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      >
        {/* Profile Header */}
        <View className="items-center px-6 py-8">
          {/* Avatar */}
          {renderProfileAvatar()}

          {/* User Info */}
          <Text className="text-white font-orbitron text-xl mb-1">
            {userData.name}
          </Text>
          <Text className="text-cyber-cyan font-inter text-sm mb-3">
            {userData.username}
          </Text>
          
          {/* Status Message */}
          {profile?.statusMessage && (profile?.statusMessage?.text || profile?.statusMessage?.emoji) && (
            <View className="flex-row items-center justify-center mb-3 px-4">
              {/* Availability Indicator */}
              <View 
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: getAvailabilityColor(profile.statusMessage.availability) }}
              />
              <Text className="text-white font-inter text-sm text-center">
                {profile.statusMessage.emoji && `${profile.statusMessage.emoji} `}
                {profile.statusMessage.text}
              </Text>
            </View>
          )}
          
          {/* Bio - only show if user has set one */}
          {userData.bio && (
            <Text
              className="text-white/70 font-inter text-sm text-center"
              numberOfLines={1}
            >
              {userData.bio}
            </Text>
          )}
        </View>

        {/* Gaming Stats Card */}
        <View className="mx-6 mb-6">
          <GameCard
            title="Gaming Statistics"
            type="stats"
            rarity="epic"
            stats={[
              {
                label: "Victories",
                value: userData.stats.victories,
                icon: "trophy",
              },
              {
                label: "Highlights",
                value: userData.stats.highlights,
                icon: "play-circle",
              },

              {
                label: "Achievements",
                value: userData.stats.achievements,
                icon: "medal",
              },
            ]}
          />
        </View>

        {/* Achievement Showcase */}
        <AchievementShowcase
          achievements={getShowcaseAchievements()}
          isOwner={true}
          onEdit={handleAchievementShowcaseEdit}
          loading={isLoading}
        />

        {/* Menu Items */}
        <View className="px-6 mt-6">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.title}
              onPress={() => handleMenuItemPress(item)}
              className="flex-row items-center py-4 px-4 mb-2 bg-cyber-dark rounded-lg"
            >
              <View className="w-10 h-10 bg-cyber-cyan/20 rounded-full justify-center items-center mr-4">
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={accentColor}
                />
              </View>

              <View className="flex-1">
                <Text className="text-white font-inter font-medium">
                  {item.title}
                </Text>
                <Text className="text-white/70 font-inter text-sm">
                  {item.subtitle}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.text.tertiary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Account Actions */}
        <View className="px-6 mt-6 mb-4">
          <View className="border-t border-cyber-gray/20 pt-6">           
            {/* Sign Out Button */}
            <TouchableOpacity
              onPress={handleSignOut}
              disabled={isLoading}
              className="flex-row items-center justify-center py-4 px-4 border border-red-500/30 rounded-lg bg-red-500/10"
            >
              <Ionicons 
                name="log-out-outline" 
                size={20} 
                color="#EF4444" 
              />
              <Text className="text-red-400 font-inter font-medium ml-2">
                {isLoading ? "Signing out..." : "Sign Out"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

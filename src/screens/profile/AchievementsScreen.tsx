/**
 * @file AchievementsScreen.tsx
 * @description Gaming achievements and milestones interface for SnapConnect.
 * Displays user accomplishments, gaming statistics, and unlockable content.
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
 * Achievements screen accessible from Profile tab for gaming milestones.
 *
 * @ai_context
 * AI-powered achievement tracking and personalized milestone suggestions.
 * Smart gaming behavior analysis and accomplishment recognition.
 */

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { GameCard } from "../../components/common";
import { useTabBarHeight } from "../../hooks/useTabBarHeight";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import {
    convertToShowcaseFormat,
    getAchievementProgress,
    getAchievements,
    getAchievementsByCategory,
    type AchievementData
} from "../../utils/achievementHelpers";
import { getUserStats } from "../../utils/userHelpers";

/**
 * Achievements screen component
 *
 * @returns {React.ReactElement} Rendered achievements interface
 *
 * @performance
 * - Optimized achievement rendering with FlatList patterns
 * - Efficient progress calculations and animations
 * - Smooth scrolling and responsive interactions
 *
 * @ai_integration
 * - Personalized achievement suggestions based on gaming behavior
 * - Smart milestone tracking and progress optimization
 * - Dynamic achievement generation based on user patterns
 */
const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const { tabBarHeight } = useTabBarHeight();

  // Auth store
  const { profile, updateAchievementShowcase } = useAuthStore();
  const userStats = getUserStats(profile);

  // Get achievements using shared utility
  const achievements = getAchievements(profile);
  const totalProgress = getAchievementProgress(profile);

  // Local state
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [pinnedAchievements, setPinnedAchievements] = useState<string[]>([]);
  const [isUpdatingShowcase, setIsUpdatingShowcase] = useState(false);

  // Initialize pinned achievements from profile
  useEffect(() => {
    if (profile?.achievementShowcase) {
      const pinnedIds = profile.achievementShowcase.map((achievement: any) => achievement.id);
      setPinnedAchievements(pinnedIds);
    }
  }, [profile?.achievementShowcase]);

  /**
   * Handle pinning/unpinning achievement
   */
  const handleTogglePin = async (achievement: AchievementData) => {
    if (!achievement.unlocked) {
      Alert.alert(
        "Achievement Locked",
        "You can only pin unlocked achievements to your showcase.",
        [{ text: "OK" }]
      );
      return;
    }

    const isCurrentlyPinned = pinnedAchievements.includes(achievement.id);
    
    if (!isCurrentlyPinned && pinnedAchievements.length >= 5) {
      Alert.alert(
        "Showcase Full",
        "You can only pin up to 5 achievements to your showcase. Remove one first.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsUpdatingShowcase(true);

    try {
      let newPinnedIds: string[];
      
      if (isCurrentlyPinned) {
        // Unpin achievement
        newPinnedIds = pinnedAchievements.filter(id => id !== achievement.id);
      } else {
        // Pin achievement
        newPinnedIds = [...pinnedAchievements, achievement.id];
      }

      // Convert to showcase format using shared utility
      const showcaseAchievements = achievements
        .filter(a => newPinnedIds.includes(a.id) && a.unlocked)
        .map(convertToShowcaseFormat);

      await updateAchievementShowcase(showcaseAchievements);
      setPinnedAchievements(newPinnedIds);

      console.log(`✅ Achievement ${isCurrentlyPinned ? 'unpinned' : 'pinned'}: ${achievement.title}`);
    } catch (error) {
      console.error("❌ Failed to update achievement showcase:", error);
      Alert.alert(
        "Update Failed",
        "Failed to update your achievement showcase. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsUpdatingShowcase(false);
    }
  };

  const categories = [
    { key: "all", label: "All", icon: "grid-outline" },
    { key: "social", label: "Social", icon: "people-outline" },
    { key: "gaming", label: "Gaming", icon: "game-controller-outline" },
    { key: "creative", label: "Creative", icon: "brush-outline" },
  ];

  /**
   * Filter achievements by category using shared utility
   */
  const getFilteredAchievements = () => {
    return getAchievementsByCategory(profile, selectedCategory);
  };

  /**
   * Get rarity color
   */
  const getRarityColor = (rarity: AchievementData["rarity"]) => {
    switch (rarity) {
      case "common": return "#a0a0a0";
      case "rare": return "#00ffff";
      case "epic": return "#ff00ff";
      case "legendary": return "#ffd700";
      default: return "#a0a0a0";
    }
  };

  /**
   * Get rarity label
   */
  const getRarityLabel = (rarity: AchievementData["rarity"]) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  /**
   * Render achievement item
   */
  const renderAchievement = (achievement: AchievementData) => {
    const rarityColor = getRarityColor(achievement.rarity);
    const progress = achievement.progress;
    const progressPercentage = progress ? (progress.current / progress.total) * 100 : 0;
    const isPinned = pinnedAchievements.includes(achievement.id);
    const canPin = achievement.unlocked && pinnedAchievements.length < 5;
    const canUnpin = achievement.unlocked && isPinned;

    return (
      <View
        key={achievement.id}
        className={`bg-cyber-dark rounded-lg p-4 mx-6 mb-4 border ${
          achievement.unlocked 
            ? "border-cyber-green/50" 
            : "border-cyber-gray/20"
        }`}
        style={{
          boxShadow: achievement.unlocked ? '0px 0px 8px rgba(0, 255, 0, 0.3)' : 'none',
          elevation: achievement.unlocked ? 8 : 0,
        } as any}
      >
        <View className="flex-row items-start">
          {/* Achievement Icon */}
          <View 
            className={`w-16 h-16 rounded-full justify-center items-center mr-4 ${
              achievement.unlocked ? "bg-cyber-green/20" : "bg-cyber-gray/20"
            }`}
            style={{
              borderWidth: 2,
              borderColor: achievement.unlocked ? "#00ff00" : "#404040",
            }}
          >
            <Ionicons
              name={achievement.icon as any}
              size={24}
              color={achievement.unlocked ? "#00ff00" : "#707070"}
            />
          </View>

          {/* Achievement Info */}
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-2">
              <Text 
                className={`font-orbitron text-lg ${
                  achievement.unlocked ? "text-white" : "text-white/70"
                }`}
              >
                {achievement.title}
              </Text>
              <View className="flex-row items-center">
                <View 
                  className="px-2 py-1 rounded-full mr-2"
                  style={{ backgroundColor: `${rarityColor}20` }}
                >
                  <Text 
                    className="font-inter text-xs font-medium"
                    style={{ color: rarityColor }}
                  >
                    {getRarityLabel(achievement.rarity)}
                  </Text>
                </View>
                
                {/* Pin Button */}
                {achievement.unlocked && (
                  <TouchableOpacity
                    onPress={() => handleTogglePin(achievement)}
                    disabled={isUpdatingShowcase || (!canPin && !canUnpin)}
                    className={`p-2 rounded-full ${
                      isPinned 
                        ? "bg-cyber-cyan/20 border border-cyber-cyan/40" 
                        : canPin 
                          ? "bg-cyber-gray/20 border border-cyber-gray/40" 
                          : "bg-cyber-gray/10 border border-cyber-gray/20"
                    }`}
                  >
                    <Ionicons
                      name={isPinned ? "bookmark" : "bookmark-outline"}
                      size={16}
                      color={
                        isPinned 
                          ? accentColor 
                          : canPin 
                            ? "#ffffff" 
                            : "#606060"
                      }
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text className="text-white/70 font-inter text-sm mb-3">
              {achievement.description}
            </Text>

            {/* Progress Bar */}
            {progress && !achievement.unlocked && (
              <View className="mb-3">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-white/50 font-inter text-xs">
                    Progress
                  </Text>
                  <Text className="text-white/70 font-inter text-xs">
                    {progress.current}/{progress.total}
                  </Text>
                </View>
                <View className="h-2 bg-cyber-gray/20 rounded-full overflow-hidden">
                  <View 
                    className="h-full bg-cyber-cyan rounded-full"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </View>
              </View>
            )}

            {/* Reward */}
            {achievement.reward && (
              <View className="flex-row items-center">
                <Ionicons
                  name="gift-outline"
                  size={14}
                  color={achievement.unlocked ? accentColor : "#707070"}
                />
                <Text 
                  className={`ml-2 font-inter text-sm ${
                    achievement.unlocked ? "text-cyber-cyan" : "text-white/50"
                  }`}
                >
                  {achievement.reward.type === "badge" && "Badge: "}
                  {achievement.reward.type === "title" && "Title: "}
                  {achievement.reward.type === "filter" && "Filter: "}
                  {achievement.reward.type === "boost" && "Boost: "}
                  {achievement.reward.value}
                </Text>
              </View>
            )}

            {/* Pinned Status */}
            {isPinned && (
              <View className="flex-row items-center mt-2">
                <Ionicons
                  name="bookmark"
                  size={12}
                  color={accentColor}
                />
                <Text className="text-cyber-cyan font-inter text-xs ml-1 font-medium">
                  Pinned to showcase
                </Text>
              </View>
            )}

            {/* Unlocked Date */}
            {achievement.unlocked && achievement.unlockedAt && (
              <Text className="text-white/50 font-inter text-xs mt-2">
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
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
          <Text className="text-white font-orbitron text-2xl">Achievements</Text>
        </View>
        
        {/* Showcase Info */}
        <View className="flex-row items-center bg-cyber-dark px-3 py-2 rounded-lg">
          <Ionicons name="bookmark" size={16} color={accentColor} />
          <Text className="text-cyber-cyan font-inter text-sm ml-2 font-medium">
            {pinnedAchievements.length}/5
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      >
        {/* Progress Overview */}
        <View className="mx-6 my-6">
          <GameCard
            title="Achievement Progress"
            type="stats"
            rarity="epic"
            stats={[
              {
                label: "Unlocked",
                value: totalProgress.unlocked,
                icon: "trophy",
              },
              {
                label: "Total",
                value: totalProgress.total,
                icon: "list",
              },
              {
                label: "Completion",
                value: `${totalProgress.percentage}%`,
                icon: "stats-chart",
              },
            ]}
          />
        </View>

        {/* Pin Instructions */}
        <View className="mx-6 mb-6 bg-cyber-cyan/10 border border-cyber-cyan/20 rounded-lg p-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="information-circle" size={16} color={accentColor} />
            <Text className="text-cyber-cyan font-inter text-sm ml-2 font-medium">
              Showcase Your Achievements
            </Text>
          </View>
          <Text className="text-white/70 font-inter text-xs">
            Tap the bookmark icon on unlocked achievements to pin them to your profile showcase. 
            You can pin up to 5 achievements to show off your best accomplishments.
          </Text>
        </View>

        {/* Category Filters */}
        <View className="flex-row px-6 mb-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 24 }}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                onPress={() => setSelectedCategory(category.key)}
                className={`flex-row items-center px-4 py-2 rounded-full mr-3 ${
                  selectedCategory === category.key
                    ? "bg-cyber-cyan/20 border border-cyber-cyan/40"
                    : "bg-cyber-dark border border-cyber-gray/20"
                }`}
              >
                <Ionicons
                  name={category.icon as any}
                  size={16}
                  color={selectedCategory === category.key ? accentColor : "#707070"}
                />
                <Text
                  className={`ml-2 font-inter text-sm ${
                    selectedCategory === category.key
                      ? "text-white font-medium"
                      : "text-white/70"
                  }`}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Achievements List */}
        <View className="pb-4">
          {getFilteredAchievements().map(renderAchievement)}
        </View>

        {/* Empty State */}
        {getFilteredAchievements().length === 0 && (
          <View className="items-center justify-center py-16">
            <Ionicons name="trophy-outline" size={48} color="#404040" />
            <Text className="text-white/50 font-inter text-lg mt-4">
              No achievements in this category
            </Text>
            <Text className="text-white/30 font-inter text-sm mt-2">
              Keep playing to unlock new achievements!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AchievementsScreen; 

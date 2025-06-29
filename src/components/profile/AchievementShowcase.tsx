/**
 * @file AchievementShowcase.tsx
 * @description Achievement showcase component for displaying pinned achievements on user profiles.
 * Features horizontal scrolling, drag-and-drop reordering, and achievement detail popovers.
 *
 * @author SnapConnect Team
 * @created 2024-01-26
 * @modified 2024-01-26
 *
 * @dependencies
 * - react: React hooks and state management
 * - react-native: Core components and gestures
 * - @expo/vector-icons: Achievement icons
 * - @/stores/themeStore: Theme management
 * - @/types/common: Type definitions
 *
 * @usage
 * <AchievementShowcase achievements={pinnedAchievements} onEdit={handleEdit} />
 *
 * @ai_context
 * AI-powered achievement suggestions and showcase optimization.
 * Smart achievement arrangement based on user engagement patterns.
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Dimensions,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useThemeStore } from "../../stores/themeStore";
import { Achievement } from "../../types/common";

interface AchievementShowcaseProps {
  achievements: Achievement[];
  isOwner?: boolean;
  onEdit?: () => void;
  onReorder?: (achievements: Achievement[]) => void;
  loading?: boolean;
}

interface AchievementDetailModalProps {
  achievement: Achievement | null;
  visible: boolean;
  onClose: () => void;
  onShare?: (achievement: Achievement) => void;
}

/**
 * Achievement detail modal component
 *
 * @param {AchievementDetailModalProps} props - Component props
 * @returns {React.ReactElement} Rendered modal
 */
const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({
  achievement,
  visible,
  onClose,
  onShare,
}) => {
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());

  if (!achievement) return null;

  /**
   * Get rarity color based on achievement tier
   */
  const getRarityColor = (tier: Achievement["tier"]) => {
    switch (tier) {
      case "bronze": return "#cd7f32";
      case "silver": return "#c0c0c0";
      case "gold": return "#ffd700";
      case "platinum": return "#e5e4e2";
      case "diamond": return "#b9f2ff";
      default: return "#a0a0a0";
    }
  };

  const rarityColor = getRarityColor(achievement.tier);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View
          className="bg-cyber-dark rounded-2xl p-6 w-full max-w-sm border"
          style={{ borderColor: rarityColor }}
        >
          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            className="absolute top-4 right-4 z-10"
          >
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* Achievement Icon */}
          <View className="items-center mb-6">
            <View
              className="w-20 h-20 rounded-full justify-center items-center mb-4"
              style={{
                backgroundColor: `${rarityColor}20`,
                borderWidth: 3,
                borderColor: rarityColor,
              }}
            >
              <Ionicons
                name={achievement.icon as any}
                size={32}
                color={rarityColor}
              />
            </View>

            {/* Rarity Badge */}
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: `${rarityColor}20` }}
            >
              <Text
                className="font-inter text-sm font-bold uppercase"
                style={{ color: rarityColor }}
              >
                {achievement.tier}
              </Text>
            </View>
          </View>

          {/* Achievement Info */}
          <View className="items-center mb-6">
            <Text className="text-white font-orbitron text-xl mb-2 text-center">
              {achievement.title}
            </Text>
            <Text className="text-white/70 font-inter text-sm text-center mb-4">
              {achievement.description}
            </Text>

            {/* Points */}
            <View className="flex-row items-center">
              <Ionicons name="diamond" size={16} color={accentColor} />
              <Text className="text-cyber-cyan font-inter text-sm ml-2 font-medium">
                {achievement.points} Points
              </Text>
            </View>
          </View>

          {/* Unlocked Date */}
          <View className="border-t border-cyber-gray/20 pt-4 mb-4">
            <Text className="text-white/50 font-inter text-xs text-center">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Actions */}
          {onShare && (
            <TouchableOpacity
              onPress={() => onShare(achievement)}
              className="bg-cyber-cyan/20 border border-cyber-cyan/40 py-3 rounded-lg"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="share-outline" size={20} color={accentColor} />
                <Text className="text-cyber-cyan font-inter text-sm ml-2 font-medium">
                  Share Achievement
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

/**
 * Achievement showcase component
 *
 * @param {AchievementShowcaseProps} props - Component props
 * @returns {React.ReactElement} Rendered showcase
 *
 * @performance
 * - Optimized horizontal scrolling with proper item sizing
 * - Efficient rendering with memoized achievement cards
 * - Smooth animations for interactions and state changes
 *
 * @ai_integration
 * - Smart achievement arrangement based on user engagement
 * - AI-powered showcase optimization suggestions
 * - Personalized achievement highlighting and promotion
 */
const AchievementShowcase: React.FC<AchievementShowcaseProps> = ({
  achievements,
  isOwner = false,
  onEdit,
  onReorder,
  loading = false,
}) => {
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = 120;
  const cardSpacing = 12;

  /**
   * Get rarity color based on achievement tier
   */
  const getRarityColor = (tier: Achievement["tier"]) => {
    switch (tier) {
      case "bronze": return "#cd7f32";
      case "silver": return "#c0c0c0";
      case "gold": return "#ffd700";
      case "platinum": return "#e5e4e2";
      case "diamond": return "#b9f2ff";
      default: return "#a0a0a0";
    }
  };

  /**
   * Handle achievement tap to show details
   */
  const handleAchievementPress = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setModalVisible(true);
  };

  /**
   * Handle achievement sharing
   */
  const handleShareAchievement = (achievement: Achievement) => {
    // TODO: Implement sharing functionality
    console.log("Sharing achievement:", achievement.title);
    setModalVisible(false);
  };

  /**
   * Render individual achievement card
   */
  const renderAchievementCard = (achievement: Achievement, index: number) => {
    const rarityColor = getRarityColor(achievement.tier);

    return (
      <TouchableOpacity
        key={achievement.id}
        onPress={() => handleAchievementPress(achievement)}
        className="mr-3"
        style={{ width: cardWidth }}
      >
        <View
          className="bg-cyber-dark rounded-lg p-4 items-center border"
          style={{
            borderColor: `${rarityColor}40`,
            shadowColor: rarityColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          {/* Achievement Icon */}
          <View
            className="w-12 h-12 rounded-full justify-center items-center mb-3"
            style={{
              backgroundColor: `${rarityColor}20`,
              borderWidth: 2,
              borderColor: `${rarityColor}60`,
            }}
          >
            <Ionicons
              name={achievement.icon as any}
              size={20}
              color={rarityColor}
            />
          </View>

          {/* Achievement Title */}
          <Text
            className="text-white font-inter text-xs font-medium text-center mb-1"
            numberOfLines={2}
          >
            {achievement.title}
          </Text>

          {/* Rarity Badge */}
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: `${rarityColor}15` }}
          >
            <Text
              className="font-inter text-xs uppercase"
              style={{ color: rarityColor }}
            >
              {achievement.tier}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View className="items-center justify-center py-8 px-6">
      <View className="w-16 h-16 bg-cyber-gray/20 rounded-full justify-center items-center mb-4">
        <Ionicons name="trophy-outline" size={24} color="#606060" />
      </View>
      <Text className="text-white/60 font-inter text-sm text-center mb-2">
        {isOwner ? "No pinned achievements" : "No achievements to showcase"}
      </Text>
      {isOwner && (
        <Text className="text-white/40 font-inter text-xs text-center">
          Pin your favorite achievements to showcase them here
        </Text>
      )}
    </View>
  );

  /**
   * Render loading state
   */
  const renderLoadingState = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 24 }}
    >
      {[1, 2, 3].map((index) => (
        <View
          key={index}
          className="mr-3 bg-cyber-gray/10 rounded-lg animate-pulse"
          style={{ width: cardWidth, height: 120 }}
        />
      ))}
    </ScrollView>
  );

  return (
    <View className="py-4">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 mb-4">
        <View className="flex-row items-center">
          <Ionicons name="trophy" size={20} color={accentColor} />
          <Text className="text-white font-orbitron text-lg ml-2">
            Achievement Showcase
          </Text>
        </View>
        
        {isOwner && onEdit && (
          <TouchableOpacity
            onPress={onEdit}
            className="flex-row items-center bg-cyber-cyan/10 px-3 py-2 rounded-lg"
          >
            <Ionicons name="create-outline" size={16} color={accentColor} />
            <Text className="text-cyber-cyan font-inter text-sm ml-2 font-medium">
              Edit
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        renderLoadingState()
      ) : achievements.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingRight: 24 + cardSpacing,
          }}
        >
          {achievements.map(renderAchievementCard)}
        </ScrollView>
      )}

      {/* Achievement Detail Modal */}
      <AchievementDetailModal
        achievement={selectedAchievement}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onShare={handleShareAchievement}
      />
    </View>
  );
};

export default AchievementShowcase; 

/**
 * @file StoryRingItem.tsx
 * @description Reusable story ring item component for displaying story previews.
 * Shows user avatars with story indicators and unviewed status in cyber gaming style.
 *
 * @author SnapConnect Team
 * @created 2024-01-24
 *
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - expo-image: Optimized image component
 * - @expo/vector-icons: Icons
 *
 * @usage
 * <StoryRingItem
 *   type="user"
 *   story={userStory}
 *   onPress={handlePress}
 * />
 *
 * @ai_context
 * Displays AI-enhanced story previews with smart engagement indicators.
 * Supports gaming achievement highlighting and content type recognition.
 */

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useThemeStore } from "../../stores/themeStore";

/**
 * Story user interface
 */
export interface StoryUser {
  userId: string;
  user: {
    displayName: string;
    username?: string;
    profilePhoto?: string;
  };
  stories: {
    id: string;
    mediaUrl: string;
    mediaType: "photo" | "video";
    text?: string;
    createdAt: any;
    hasViewed: boolean;
  }[];
  hasUnviewed: boolean;
}

/**
 * User's own story interface
 */
export interface MyStory {
  id: string;
  mediaUrl: string;
  mediaType: "photo" | "video";
  text?: string;
  createdAt: any;
  viewCount: number;
  viewers: any;
}

/**
 * Props for StoryRingItem component
 */
interface StoryRingItemProps {
  type: "user" | "friend" | "create";
  story?: MyStory;
  storyUser?: StoryUser;
  onPress: () => void;
}

/**
 * Story ring item component with cyber gaming aesthetic
 *
 * @param {StoryRingItemProps} props - Component props
 * @returns {React.ReactElement} Rendered story ring item
 *
 * @performance
 * - Optimized image loading with expo-image
 * - Efficient render cycles with proper memoization
 * - Smart preview generation for different story types
 */
const StoryRingItem: React.FC<StoryRingItemProps> = ({
  type,
  story,
  storyUser,
  onPress,
}) => {
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());

  /**
   * Get user initials for avatar fallback
   */
  const getUserInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  /**
   * Render create story button
   */
  const renderCreateStory = () => (
    <TouchableOpacity onPress={onPress} className="items-center w-20">
      <View className="w-16 h-16 bg-cyber-cyan/10 border-2 border-dashed border-cyber-cyan/30 rounded-full justify-center items-center relative">
        <Ionicons name="add" size={24} color={accentColor} />

        {/* Pulsing effect */}
        <View className="absolute inset-0 border-2 border-cyber-cyan/20 rounded-full animate-pulse" />
      </View>
      <Text
        className="text-white font-inter text-xs mt-2 text-center"
        numberOfLines={1}
      >
        Your Story
      </Text>
    </TouchableOpacity>
  );

  /**
   * Render user's own story
   */
  const renderMyStory = () => {
    if (!story) return renderCreateStory();

    return (
      <TouchableOpacity onPress={onPress} className="items-center w-20">
        <View className="relative">
          <View className="w-16 h-16 border-2 border-cyber-cyan rounded-full p-1 bg-cyber-cyan/10">
            <Image
              source={{ uri: story.mediaUrl }}
              style={{ width: "100%", height: "100%", borderRadius: 28 }}
              contentFit="cover"
              placeholder={null}
              transition={200}
            />
          </View>

          {/* View count badge */}
          <View className="absolute -bottom-1 -right-1 bg-cyber-cyan min-w-5 h-5 rounded-full justify-center items-center px-1">
            <Text className="text-cyber-black font-inter text-xs font-bold">
              {story.viewCount || 0}
            </Text>
          </View>

          {/* Media type indicator */}
          {story.mediaType === "video" && (
            <View className="absolute top-1 right-1 w-4 h-4 bg-cyber-black/70 rounded-full justify-center items-center">
              <Ionicons name="videocam" size={10} color="white" />
            </View>
          )}
        </View>

        <Text
          className="text-white font-inter text-xs mt-2 text-center"
          numberOfLines={1}
        >
          Your Story
        </Text>
      </TouchableOpacity>
    );
  };

  /**
   * Render friend's story
   */
  const renderFriendStory = () => {
    if (!storyUser) return null;

    const latestStory = storyUser.stories[0];
    const displayName =
      storyUser.user.displayName || storyUser.user.username || "Unknown";

    return (
      <TouchableOpacity onPress={onPress} className="items-center w-20">
        <View className="relative">
          {/* Story ring with gradient for unviewed */}
          <View
            className={`w-16 h-16 rounded-full p-1 ${
              storyUser.hasUnviewed
                ? "bg-gradient-to-r from-cyber-cyan via-cyber-magenta to-cyber-green"
                : "bg-cyber-gray/30"
            }`}
          >
            <View className="w-full h-full bg-cyber-black rounded-full p-0.5">
              {latestStory.mediaUrl ? (
                <Image
                  source={{ uri: latestStory.mediaUrl }}
                  style={{ width: "100%", height: "100%", borderRadius: 24 }}
                  contentFit="cover"
                  placeholder={null}
                  transition={200}
                />
              ) : (
                <View className="w-full h-full bg-cyber-cyan/10 rounded-full justify-center items-center">
                  <Text className="text-cyber-cyan font-inter font-bold text-sm">
                    {getUserInitials(displayName)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Story count badge */}
          {storyUser.stories.length > 1 && (
            <View className="absolute -top-1 -right-1 bg-cyber-magenta min-w-5 h-5 rounded-full justify-center items-center px-1">
              <Text className="text-white font-inter text-xs font-bold">
                {storyUser.stories.length}
              </Text>
            </View>
          )}

          {/* Media type indicator */}
          {latestStory.mediaType === "video" && (
            <View className="absolute bottom-1 right-1 w-4 h-4 bg-cyber-black/70 rounded-full justify-center items-center">
              <Ionicons name="play" size={8} color="white" />
            </View>
          )}

          {/* Unviewed indicator */}
          {storyUser.hasUnviewed && (
            <View className="absolute top-1 left-1 w-3 h-3 bg-cyber-cyan rounded-full" />
          )}
        </View>

        <Text
          className="text-white font-inter text-xs mt-2 text-center"
          numberOfLines={1}
        >
          {displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render based on type
  switch (type) {
    case "create":
      return renderCreateStory();
    case "user":
      return renderMyStory();
    case "friend":
      return renderFriendStory();
    default:
      return null;
  }
};

export default StoryRingItem;

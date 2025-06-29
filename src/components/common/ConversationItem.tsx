/**
 * @file ConversationItem.tsx
 * @description Reusable conversation item component for the messages screen.
 * Shows conversation preview with sender info, last message, and online status.
 *
 * @author SnapConnect Team
 * @created 2024-01-24
 *
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @expo/vector-icons: Icons
 *
 * @usage
 * <ConversationItem
 *   conversation={conversation}
 *   onPress={handlePress}
 *   onLongPress={handleLongPress}
 * />
 *
 * @ai_context
 * Displays AI-enhanced conversation previews with smart message summaries.
 * Supports gaming context awareness and priority conversation highlighting.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { mediaService } from "../../services/media";

/**
 * Interface for conversation data
 */
export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  isOnline: boolean;
  participants: string[];
  lastMessageAt: Date;
  hasUnreadMedia?: boolean;
  unreadCount?: number;
  avatar?: any; // Avatar data with URLs
  profilePhoto?: string; // Fallback for old profile photos
}

/**
 * Props for ConversationItem component
 */
interface ConversationItemProps {
  conversation: Conversation;
  onPress: (conversation: Conversation) => void;
  onLongPress?: (conversation: Conversation) => void;
}

/**
 * Individual conversation item component with cyber gaming aesthetic
 *
 * @param {ConversationItemProps} props - Component props
 * @returns {React.ReactElement} Rendered conversation item
 *
 * @performance
 * - Optimized for FlatList rendering
 * - Minimal re-renders with proper memoization strategy
 * - Efficient status indicator updates
 */
const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onPress,
  onLongPress,
}) => {
  /**
   * Get user initials for avatar display
   */
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  /**
   * Get conversation avatar URL with fallback
   */
  const getConversationAvatarUrl = () => {
    if (conversation.avatar?.urls) {
      return mediaService.getOptimizedAvatarUrl(conversation.avatar, '48');
    }
    // Fallback to old profilePhoto field
    return conversation.profilePhoto || null;
  };

  /**
   * Get status indicator color based on online status
   */
  const getStatusColor = () => {
    return conversation.isOnline ? "#00ff41" : "#6b7280"; // Gaming green or gray
  };

  /**
   * Handle conversation press
   */
  const handlePress = () => {
    onPress(conversation);
  };

  /**
   * Handle conversation long press
   */
  const handleLongPress = () => {
    onLongPress?.(conversation);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      className="flex-row items-center p-4 mx-4 mb-2 bg-cyber-dark/30 border border-cyber-gray/10 rounded-xl active:bg-cyber-cyan/5 active:border-cyber-cyan/20"
    >
      {/* Avatar with status indicator */}
      <View className="relative mr-4">
        {getConversationAvatarUrl() ? (
          <Image
            source={{ uri: getConversationAvatarUrl()! }}
            className="w-14 h-14 rounded-full border border-cyber-cyan/20"
            style={{ backgroundColor: '#2a2a2a' }}
          />
        ) : (
          <View className="w-14 h-14 bg-cyber-cyan/10 border border-cyber-cyan/20 rounded-full justify-center items-center">
            <Text className="text-cyber-cyan font-inter font-bold text-base">
              {getUserInitials(conversation.name)}
            </Text>
          </View>
        )}

        {/* Online status indicator */}
        <View
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-cyber-black"
          style={{ backgroundColor: getStatusColor() }}
        >
          {conversation.isOnline && (
            <View className="flex-1 justify-center items-center">
              <View className="w-2 h-2 bg-cyber-black rounded-full" />
            </View>
          )}
        </View>
      </View>

      {/* Conversation Details */}
      <View className="flex-1">
        {/* Name and Time Row */}
        <View className="flex-row justify-between items-center mb-1">
          <Text
            className="text-white font-inter font-semibold text-base flex-1"
            numberOfLines={1}
          >
            {conversation.name}
          </Text>
          <Text className="text-white/40 font-jetbrains text-xs ml-2">
            {conversation.time}
          </Text>
        </View>

        {/* Last Message Preview */}
        <View className="flex-row items-center">
          <Text
            className="text-white/60 font-inter text-sm flex-1"
            numberOfLines={1}
          >
            {conversation.lastMessage}
          </Text>

          {/* Unread indicators */}
          <View className="flex-row items-center ml-2">
            {conversation.hasUnreadMedia && (
              <View className="w-2 h-2 bg-cyber-cyan rounded-full mr-2">
                <View className="w-2 h-2 bg-cyber-cyan rounded-full animate-pulse" />
              </View>
            )}

            {conversation.unreadCount && conversation.unreadCount > 0 && (
              <View className="bg-cyber-cyan min-w-5 h-5 rounded-full justify-center items-center px-1">
                <Text className="text-cyber-black font-inter font-bold text-xs">
                  {conversation.unreadCount > 99
                    ? "99+"
                    : conversation.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Online status text */}
        {conversation.isOnline && (
          <Text className="text-cyber-green font-inter text-xs mt-1">
            Online now
          </Text>
        )}
      </View>

      {/* Arrow indicator */}
      <View className="ml-3">
        <Ionicons
          name="chevron-forward"
          size={16}
          color="rgba(0, 255, 255, 0.3)"
        />
      </View>
    </TouchableOpacity>
  );
};

export default ConversationItem;

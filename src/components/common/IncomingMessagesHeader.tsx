/**
 * @file IncomingMessagesHeader.tsx
 * @description Header component for displaying incoming ephemeral media messages.
 * Shows preview thumbnails and sender information with gaming aesthetics.
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
 * <IncomingMessagesHeader
 *   messages={incomingMessages}
 *   onViewMessage={handleViewMessage}
 * />
 *
 * @ai_context
 * Displays AI-filtered incoming messages with smart content preview.
 * Supports automated content moderation and priority message highlighting.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useThemeStore } from "../../stores/themeStore";

/**
 * Interface for incoming message data
 */
export interface IncomingMessage {
  id: string;
  senderId: string;
  recipientId: string;
  mediaUrl?: string;
  mediaType?: "photo" | "video";
  text?: string;
  timer: number;
  createdAt: any; // Firebase Timestamp or Date
  viewed: boolean;
  senderName?: string;
}

/**
 * Props for IncomingMessagesHeader component
 */
interface IncomingMessagesHeaderProps {
  messages: IncomingMessage[];
  onViewMessage: (message: IncomingMessage) => void;
}

/**
 * Header component for displaying incoming media messages with cyber aesthetics
 *
 * @param {IncomingMessagesHeaderProps} props - Component props
 * @returns {React.ReactElement | null} Rendered incoming messages header
 *
 * @performance
 * - Efficient horizontal scrolling for large message counts
 * - Optimized preview rendering with proper caching
 * - Smart visibility management based on message availability
 */
const IncomingMessagesHeader: React.FC<IncomingMessagesHeaderProps> = ({
  messages,
  onViewMessage,
}) => {
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());

  // Don't render if no messages
  if (!messages || messages.length === 0) {
    return null;
  }

  /**
   * Get media type icon
   */
  const getMediaIcon = (mediaType?: string) => {
    switch (mediaType) {
      case "photo":
        return "camera-outline";
      case "video":
        return "videocam-outline";
      default:
        return "chatbubble-outline";
    }
  };

  /**
   * Format message time - handles Firebase Timestamps and Date objects
   */
  const formatMessageTime = (createdAt: any) => {
    try {
      let dateObj: Date;

      // Handle Firebase Timestamp
      if (createdAt && typeof createdAt.toDate === "function") {
        dateObj = createdAt.toDate();
      }
      // Handle JavaScript Date
      else if (createdAt instanceof Date) {
        dateObj = createdAt;
      }
      // Handle timestamp number
      else if (typeof createdAt === "number") {
        dateObj = new Date(createdAt);
      }
      // Handle timestamp seconds (Firebase sometimes returns seconds)
      else if (createdAt && typeof createdAt.seconds === "number") {
        dateObj = new Date(createdAt.seconds * 1000);
      }
      // Fallback
      else {
        return "Unknown";
      }

      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;

      return "Today";
    } catch (error) {
      console.error("Error formatting message time:", error);
      return "Unknown";
    }
  };

  /**
   * Handle message press
   */
  const handleMessagePress = (message: IncomingMessage) => {
    onViewMessage(message);
  };

  return (
    <View className="pb-4">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pb-3">
        <Text className="text-white font-orbitron text-lg">New Snaps</Text>
        <View className="bg-cyber-cyan/20 px-3 py-1 rounded-full">
          <Text className="text-cyber-cyan font-inter font-bold text-sm">
            {messages.length}
          </Text>
        </View>
      </View>

      {/* Incoming Messages Horizontal List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
        className="flex-grow-0"
      >
        {messages.map((message, index) => (
          <TouchableOpacity
            key={message.id}
            onPress={() => handleMessagePress(message)}
            className="w-20 mr-4 items-center"
          >
            {/* Message Preview Container */}
            <View className="relative mb-2">
              {/* Main Preview Circle */}
              <View className="w-16 h-16 bg-cyber-cyan/10 border-2 border-cyber-cyan/30 rounded-full justify-center items-center">
                <Ionicons
                  name={getMediaIcon(message.mediaType)}
                  size={24}
                  color={accentColor}
                />
              </View>

              {/* Timer Badge */}
              <View className="absolute -top-1 -right-1 w-6 h-6 bg-cyber-black border border-cyber-cyan rounded-full justify-center items-center">
                <Text className="text-cyber-cyan font-jetbrains text-xs font-bold">
                  {message.timer}
                </Text>
              </View>

              {/* Media Type Badge */}
              <View className="absolute -bottom-1 -right-1 w-5 h-5 bg-cyber-magenta rounded-full justify-center items-center">
                <Ionicons
                  name={message.mediaType === "video" ? "play" : "camera"}
                  size={10}
                  color="white"
                />
              </View>

              {/* Pulsing Effect for New Messages */}
              <View className="absolute inset-0 border-2 border-cyber-cyan/50 rounded-full animate-pulse" />
            </View>

            {/* Sender Info */}
            <View className="items-center">
              <Text
                className="text-white font-inter font-medium text-xs text-center"
                numberOfLines={1}
              >
                {message.senderName || "Someone"}
              </Text>
              <Text className="text-white/40 font-jetbrains text-xs mt-0.5">
                {formatMessageTime(message.createdAt)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Divider */}
      <View className="mx-6 mt-4 h-px bg-cyber-gray/20" />
    </View>
  );
};

export default IncomingMessagesHeader;

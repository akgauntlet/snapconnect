/**
 * @file FriendProfileExample.tsx
 * @description Example friend profile screen showcasing the new base components.
 * Demonstrates proper usage of GameCard, CyberButton, GamingInput, and other components.
 *
 * @author SnapConnect Team
 * @created 2024-01-25
 *
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @/components/common: Base gaming components
 *
 * @usage
 * Example screen showing base component integration
 *
 * @ai_context
 * Demonstrates gaming-themed UI patterns and component composition.
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import {
  CyberButton,
  GameCard,
  GamingInput,
  IconButton,
  LoadingSpinner,
} from "../../components/common";

/**
 * Friend Profile Example Component
 * Showcases how to properly integrate base components
 */
const FriendProfileExample: React.FC = () => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle sending a message
   */
  const handleSendMessage = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setMessage("");
    }, 2000);
  };

  /**
   * Handle adding friend
   */
  const handleAddFriend = () => {
    console.log("Adding friend...");
  };

  /**
   * Handle viewing achievements
   */
  const handleViewAchievements = () => {
    console.log("Viewing achievements...");
  };

  return (
    <SafeAreaView className="flex-1 bg-cyber-black">
      {/* Header with back button */}
      <View className="flex-row items-center justify-between p-6 border-b border-cyber-gray/20">
        <IconButton
          icon="arrow-back"
          variant="ghost"
          size="medium"
          onPress={() => console.log("Go back")}
        />
        <Text className="text-white font-orbitron text-xl">Friend Profile</Text>
        <IconButton
          icon="ellipsis-vertical"
          variant="ghost"
          size="medium"
          onPress={() => console.log("More options")}
        />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="items-center py-8">
          <View className="w-24 h-24 bg-cyber-cyan/20 rounded-full justify-center items-center mb-4">
            <Ionicons name="person" size={40} color="#00ffff" />
          </View>
          <Text className="text-white font-orbitron text-2xl mb-2">
            GamerPro2024
          </Text>
          <Text className="text-cyber-cyan font-inter text-sm mb-4">
            @gamerpro2024
          </Text>
          <Text className="text-white/70 font-inter text-center px-6">
            Competitive FPS player • Stream enthusiast • Clan leader
          </Text>
        </View>

        {/* Gaming Stats Card */}
        <View className="px-6 mb-6">
          <GameCard
            title="Gaming Statistics"
            subtitle="Last 30 days"
            type="stats"
            rarity="legendary"
            status="online"
            stats={[
              { label: "Wins", value: 127, icon: "trophy" },
              { label: "Kills", value: 2456, icon: "skull" },
              { label: "Hours", value: 89, icon: "time" },
              { label: "Rank", value: "Diamond", icon: "diamond" },
            ]}
            onPress={handleViewAchievements}
          />
        </View>

        {/* Recent Achievements */}
        <View className="px-6 mb-6">
          <Text className="text-white font-orbitron text-lg mb-4">
            Recent Achievements
          </Text>

          <GameCard
            title="First Blood Master"
            subtitle="Achievement Unlocked"
            description="Get the first kill in 50 matches"
            type="achievement"
            rarity="epic"
            stats={[
              { label: "Unlocked", value: "2 days ago", icon: "calendar" },
              { label: "Rarity", value: "5.2%", icon: "star" },
            ]}
            className="mb-3"
          />

          <GameCard
            title="Headshot Specialist"
            subtitle="Achievement Unlocked"
            description="Land 1000 headshots with any weapon"
            type="achievement"
            rarity="rare"
            stats={[
              { label: "Unlocked", value: "1 week ago", icon: "calendar" },
              { label: "Rarity", value: "12.8%", icon: "star" },
            ]}
          />
        </View>

        {/* Quick Message */}
        <View className="px-6 mb-6">
          <Text className="text-white font-orbitron text-lg mb-4">
            Send Message
          </Text>

          <GamingInput
            placeholder="Type a quick message..."
            value={message}
            onChangeText={setMessage}
            leftIcon="chatbubble-outline"
            variant="default"
            multiline
            numberOfLines={3}
            maxLength={200}
            className="mb-4"
          />

          <View className="flex-row space-x-3">
            <CyberButton
              variant="primary"
              icon="send"
              loading={isLoading}
              onPress={handleSendMessage}
              disabled={!message.trim()}
              className="flex-1"
            >
              Send Message
            </CyberButton>

            <IconButton
              icon="gift"
              variant="legendary"
              size="large"
              onPress={() => console.log("Send gift")}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-6 mb-8 space-y-3">
          <CyberButton
            variant="success"
            icon="person-add"
            fullWidth
            onPress={handleAddFriend}
          >
            Add Friend
          </CyberButton>

          <CyberButton
            variant="secondary"
            icon="game-controller"
            fullWidth
            onPress={() => console.log("Invite to game")}
          >
            Invite to Game
          </CyberButton>

          <CyberButton
            variant="warning"
            icon="flag"
            fullWidth
            onPress={() => console.log("Report user")}
          >
            Report User
          </CyberButton>
        </View>

        {/* Loading State Example */}
        {isLoading && (
          <View className="items-center py-8">
            <LoadingSpinner
              variant="cyber"
              size="large"
              message="Sending message..."
              color="#00ffff"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default FriendProfileExample;

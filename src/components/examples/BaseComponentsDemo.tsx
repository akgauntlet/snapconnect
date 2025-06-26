/**
 * @file BaseComponentsDemo.tsx
 * @description Demo component showcasing all the gaming-themed base components.
 * Useful for testing component functionality and as a reference guide.
 *
 * @author SnapConnect Team
 * @created 2024-01-25
 *
 * @dependencies
 * - react: React hooks
 * - react-native: ScrollView, View, Text
 * - @/components/common: All base components
 *
 * @usage
 * import BaseComponentsDemo from '@/components/examples/BaseComponentsDemo';
 * <BaseComponentsDemo />
 *
 * @ai_context
 * Reference implementation showing gaming UI components in various states.
 * Demonstrates consistent theming and interaction patterns.
 */

import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import {
  CyberButton,
  GameCard,
  GamingInput,
  IconButton,
  LoadingSpinner,
} from "../common";

/**
 * BaseComponentsDemo Component
 * Showcases all gaming-themed base components
 *
 * @returns Demo component with all base components
 */
const BaseComponentsDemo: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);

  /**
   * Handle demo actions
   */
  const handleDemoAction = (action: string) => {
    console.log(`Demo action: ${action}`);
    setActiveButton(action);

    if (action === "loading") {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 3000);
    }
  };

  return (
    <ScrollView className="flex-1 bg-cyber-black">
      <View className="p-6">
        {/* Header */}
        <Text className="text-3xl font-orbitron text-cyber-cyan text-center mb-8">
          Base Components Demo
        </Text>

        {/* CyberButton Section */}
        <View className="mb-8">
          <Text className="text-xl font-orbitron text-white mb-4">
            CyberButton
          </Text>
          <View className="space-y-3">
            <CyberButton
              variant="primary"
              onPress={() => handleDemoAction("primary")}
            >
              Primary Button
            </CyberButton>

            <CyberButton
              variant="secondary"
              icon="rocket"
              onPress={() => handleDemoAction("secondary")}
            >
              Secondary with Icon
            </CyberButton>

            <CyberButton
              variant="legendary"
              size="large"
              icon="trophy"
              onPress={() => handleDemoAction("legendary")}
            >
              Legendary Large
            </CyberButton>

            <CyberButton
              variant="ghost"
              size="small"
              onPress={() => handleDemoAction("ghost")}
            >
              Ghost Small
            </CyberButton>

            <CyberButton variant="danger" disabled onPress={() => {}}>
              Disabled Button
            </CyberButton>
          </View>
        </View>

        {/* IconButton Section */}
        <View className="mb-8">
          <Text className="text-xl font-orbitron text-white mb-4">
            IconButton
          </Text>
          <View className="flex-row space-x-3 flex-wrap">
            <IconButton
              icon="play"
              variant="primary"
              active={activeButton === "play"}
              onPress={() => handleDemoAction("play")}
            />

            <IconButton
              icon="pause"
              variant="secondary"
              size="large"
              onPress={() => handleDemoAction("pause")}
            />

            <IconButton
              icon="star"
              variant="legendary"
              size="medium"
              active
              onPress={() => handleDemoAction("star")}
            />

            <IconButton
              icon="settings"
              variant="ghost"
              size="small"
              onPress={() => handleDemoAction("settings")}
            />

            <IconButton
              icon="trash"
              variant="danger"
              onPress={() => handleDemoAction("delete")}
            />
          </View>
        </View>

        {/* GamingInput Section */}
        <View className="mb-8">
          <Text className="text-xl font-orbitron text-white mb-4">
            GamingInput
          </Text>
          <View className="space-y-4">
            <GamingInput
              label="Gamer Tag"
              placeholder="Enter your gamer tag"
              value={inputValue}
              onChangeText={setInputValue}
              leftIcon="game-controller"
              variant="default"
              maxLength={20}
            />

            <GamingInput
              label="Password"
              placeholder="Enter password"
              value=""
              onChangeText={() => {}}
              leftIcon="lock-closed"
              secureTextEntry
              variant="legendary"
            />

            <GamingInput
              placeholder="Email address"
              value=""
              onChangeText={() => {}}
              leftIcon="mail"
              keyboardType="email-address"
              error="Please enter a valid email"
            />

            <GamingInput
              placeholder="Success state"
              value="Valid input"
              onChangeText={() => {}}
              leftIcon="checkmark-circle"
              success="Looks good!"
            />
          </View>
        </View>

        {/* GameCard Section */}
        <View className="mb-8">
          <Text className="text-xl font-orbitron text-white mb-4">
            GameCard
          </Text>
          <View className="space-y-4">
            <GameCard
              title="Apex Legends"
              subtitle="Battle Royale"
              description="Fast-paced battle royale with unique legends and abilities"
              type="game"
              rarity="legendary"
              status="playing"
              stats={[
                { label: "Level", value: 127, icon: "trending-up" },
                { label: "Wins", value: 45, icon: "trophy" },
                { label: "Kills", value: 1204, icon: "skull" },
              ]}
              onPress={() => handleDemoAction("apex")}
            />

            <GameCard
              title="Legendary Achievement"
              subtitle="Master of Combat"
              type="achievement"
              rarity="mythic"
              stats={[
                { label: "Unlocked", value: "Today", icon: "time" },
                { label: "Rarity", value: "0.1%", icon: "star" },
              ]}
              onPress={() => handleDemoAction("achievement")}
            />

            <GameCard
              title="Pro Gaming Clan"
              subtitle="Elite Esports Team"
              type="clan"
              rarity="epic"
              status="online"
              stats={[
                { label: "Members", value: 25, icon: "people" },
                { label: "Rank", value: "#12", icon: "trophy" },
              ]}
            />
          </View>
        </View>

        {/* LoadingSpinner Section */}
        <View className="mb-8">
          <Text className="text-xl font-orbitron text-white mb-4">
            LoadingSpinner
          </Text>
          <View className="items-center space-y-6">
            <LoadingSpinner
              variant="cyber"
              size="large"
              message="Loading game data..."
              visible={isLoading}
            />

            <LoadingSpinner
              variant="dots"
              size="medium"
              message="Connecting to servers..."
            />

            <LoadingSpinner variant="bars" size="small" color="#ff00ff" />

            <LoadingSpinner
              variant="matrix"
              size="medium"
              message="Entering the Matrix..."
            />
          </View>
        </View>

        {/* Demo Actions */}
        <View className="mb-8">
          <Text className="text-xl font-orbitron text-white mb-4">
            Demo Actions
          </Text>
          <CyberButton
            variant="legendary"
            icon="refresh"
            fullWidth
            loading={isLoading}
            onPress={() => handleDemoAction("loading")}
          >
            {isLoading ? "Loading..." : "Test Loading State"}
          </CyberButton>
        </View>

        {/* Footer */}
        <Text className="text-center text-white/60 font-inter text-sm mt-8">
          All components support cyber gaming theme with RGB effects
        </Text>
      </View>
    </ScrollView>
  );
};

export default BaseComponentsDemo;

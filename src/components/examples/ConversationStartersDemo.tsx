/**
 * @file ConversationStartersDemo.tsx
 * @description Demo component showcasing the AI-powered conversation starter system
 * Demonstrates integration with Pinecone RAG and OpenAI GPT-3.5-turbo
 * 
 * @author SnapConnect Team
 * @created 2024-01-25
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ConversationStarters } from "../common";

/**
 * Demo component for conversation starters with sample gaming genre data
 * 
 * @returns {React.ReactElement} Rendered demo interface
 */
const ConversationStartersDemo: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<string>("demo1");

  // Sample gaming genre combinations for testing
  const demoScenarios = {
    demo1: {
      name: "FPS Enthusiasts",
      description: "Two players who love first-person shooters",
      user1Genres: ["fps", "action", "battle_royale"],
      user2Genres: ["fps", "competitive", "strategy"],
    },
    demo2: {
      name: "RPG & Adventure",
      description: "Players with shared interest in story-driven games", 
      user1Genres: ["rpg", "adventure", "fantasy"],
      user2Genres: ["rpg", "mmorpg", "story"],
    },
    demo3: {
      name: "Diverse Interests",
      description: "Players with different but overlapping gaming tastes",
      user1Genres: ["strategy", "simulation", "building"],
      user2Genres: ["strategy", "puzzle", "casual"],
    },
    demo4: {
      name: "Competitive Gamers",
      description: "Esports and competitive gaming focus",
      user1Genres: ["moba", "fps", "competitive"],
      user2Genres: ["moba", "fighting", "esports"],
    },
    demo5: {
      name: "No Overlap",
      description: "Testing when users have completely different interests",
      user1Genres: ["horror", "survival", "indie"],
      user2Genres: ["racing", "sports", "mobile"],
    },
  };

  /**
   * Handle starter selection (demo purposes)
   */
  const handleStarterSelect = (starter: string) => {
    console.log('Demo: Conversation starter selected:', starter);
    // In a real chat, this would send the message
    alert(`Demo: Would send message: "${starter}"`);
  };

  /**
   * Render demo scenario button
   */
  const renderScenarioButton = (scenarioId: string) => {
    const scenario = demoScenarios[scenarioId as keyof typeof demoScenarios];
    const isSelected = selectedDemo === scenarioId;

    return (
      <TouchableOpacity
        key={scenarioId}
        onPress={() => setSelectedDemo(scenarioId)}
        className={`p-4 rounded-lg border mb-3 ${
          isSelected 
            ? 'bg-cyber-cyan/20 border-cyber-cyan' 
            : 'bg-cyber-dark/30 border-cyber-gray/20'
        }`}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className={`font-inter font-medium text-base ${
              isSelected ? 'text-cyber-cyan' : 'text-white'
            }`}>
              {scenario.name}
            </Text>
            <Text className="text-white/60 font-inter text-sm mt-1">
              {scenario.description}
            </Text>
            <View className="flex-row mt-2">
              <Text className="text-green-400 font-jetbrains text-xs">
                User 1: {scenario.user1Genres.join(", ")}
              </Text>
            </View>
            <View className="flex-row mt-1">
              <Text className="text-blue-400 font-jetbrains text-xs">
                User 2: {scenario.user2Genres.join(", ")}
              </Text>
            </View>
          </View>
          
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="#00ffff" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const currentScenario = demoScenarios[selectedDemo as keyof typeof demoScenarios];

  return (
    <SafeAreaView className="flex-1 bg-cyber-black">
      {/* Header */}
      <View className="px-6 py-4 border-b border-cyber-gray/10">
        <View className="flex-row items-center">
          <Ionicons name="flask" size={24} color="#00ffff" />
          <Text className="text-cyber-cyan font-orbitron text-xl ml-3">
            Conversation Starters Demo
          </Text>
        </View>
        <Text className="text-white/60 font-inter text-sm mt-2">
          Test the AI-powered conversation starter system with different gaming genre combinations
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Scenario Selection */}
        <View className="px-6 py-4">
          <Text className="text-white font-inter font-medium text-lg mb-4">
            Choose a Demo Scenario
          </Text>
          
          {Object.keys(demoScenarios).map(renderScenarioButton)}
        </View>

        {/* Live Demo */}
        <View className="flex-1 bg-cyber-dark/10 border-t border-cyber-gray/10">
          <View className="px-6 py-4">
            <View className="flex-row items-center mb-4">
              <Ionicons name="play-circle" size={20} color="#00ffff" />
              <Text className="text-cyber-cyan font-inter font-medium text-lg ml-2">
                Live Demo: {currentScenario.name}
              </Text>
            </View>
            
            <View className="bg-cyber-dark/20 border border-cyber-cyan/20 rounded-lg p-4 mb-4">
              <Text className="text-white/80 font-inter text-sm leading-6">
                <Text className="text-cyber-cyan font-medium">Scenario:</Text> {currentScenario.description}
              </Text>
              <View className="mt-3 pt-3 border-t border-cyber-gray/20">
                <Text className="text-green-400 font-jetbrains text-xs">
                  User 1 Genres: [{currentScenario.user1Genres.join(", ")}]
                </Text>
                <Text className="text-blue-400 font-jetbrains text-xs mt-1">
                  User 2 Genres: [{currentScenario.user2Genres.join(", ")}]
                </Text>
              </View>
            </View>
          </View>

          {/* Conversation Starters Component */}
          <View className="flex-1">
            <ConversationStarters
              user1Genres={currentScenario.user1Genres}
              user2Genres={currentScenario.user2Genres}
              onStarterSelect={handleStarterSelect}
              disabled={false}
            />
          </View>
        </View>

        {/* Technical Info */}
        <View className="px-6 py-6 bg-cyber-dark/5 border-t border-cyber-gray/10">
          <Text className="text-cyber-cyan font-inter font-medium text-lg mb-3">
            Technical Architecture
          </Text>
          
          <View className="space-y-3">
            <View className="flex-row items-start">
              <Ionicons name="server" size={16} color="#00ffff" className="mt-1" />
              <View className="ml-3 flex-1">
                <Text className="text-white font-inter font-medium">Pinecone Vector Database</Text>
                <Text className="text-white/60 font-inter text-sm">
                  Stores conversation starter embeddings with gaming genre metadata
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-start">
              <Ionicons name="bulb" size={16} color="#00ffff" className="mt-1" />
              <View className="ml-3 flex-1">
                <Text className="text-white font-inter font-medium">OpenAI GPT-3.5-turbo</Text>
                <Text className="text-white/60 font-inter text-sm">
                  Generates personalized starters using retrieved examples
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-start">
              <Ionicons name="cloud" size={16} color="#00ffff" className="mt-1" />
              <View className="ml-3 flex-1">
                <Text className="text-white font-inter font-medium">Firebase Cloud Functions</Text>
                <Text className="text-white/60 font-inter text-sm">
                  Orchestrates the RAG pipeline on the server-side
                </Text>
              </View>
            </View>
          </View>
          
          <View className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text className="text-green-400 font-inter font-medium ml-2">System Status</Text>
            </View>
            <Text className="text-green-300 font-jetbrains text-xs mt-1">
              ✓ RAG System Active ✓ Cloud Functions Deployed ✓ AI Models Online
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ConversationStartersDemo; 

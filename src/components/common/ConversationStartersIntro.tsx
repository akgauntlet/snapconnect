/**
 * @file ConversationStartersIntro.tsx
 * @description Component for introducing users to AI-powered conversation starters
 * Shows how gaming preferences power the RAG system for personalized conversations
 * 
 * @author SnapConnect Team
 * @created 2024-01-25
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Text,
    View,
} from "react-native";

interface ConversationStartersIntroProps {
  compact?: boolean;
  showExamples?: boolean;
}

/**
 * Introduction component for conversation starters feature
 * 
 * Educates users about how their gaming preferences power AI-generated conversation suggestions
 */
const ConversationStartersIntro: React.FC<ConversationStartersIntroProps> = ({
  compact = false,
  showExamples = true,
}) => {
  const exampleStarters = [
    "What&apos;s your favorite FPS map of all time?",
    "Which RPG has the best character customization?",
    "Have you tried any good co-op games recently?",
  ];

  return (
    <View className="bg-cyber-dark/40 border border-cyber-cyan/20 rounded-lg p-4">
      <View className="flex-row items-center mb-3">
        <Ionicons name="sparkles" size={20} color="#00ffff" />
        <Text className="text-cyber-cyan font-inter font-semibold ml-2">
          AI-Powered Conversation Starters
        </Text>
      </View>
      
      <Text className="text-white/80 font-inter text-sm mb-3">
        Your gaming preferences help our AI suggest perfect conversation topics when chatting with other gamers.
      </Text>

      {showExamples && (
        <View className="bg-cyber-black/30 rounded-lg p-3">
          <Text className="text-cyber-cyan font-inter text-xs font-semibold mb-2">
            EXAMPLE SUGGESTIONS:
          </Text>
          {exampleStarters.map((starter, index) => (
            <View key={index} className="flex-row items-start mb-2">
              <View className="bg-cyber-cyan/20 rounded-full p-1 mr-2 mt-0.5">
                <Ionicons name="chatbubble" size={8} color="#00ffff" />
              </View>
              <Text className="text-white/70 font-inter text-xs flex-1">
                {starter}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View className="flex-row items-center justify-center mt-3 pt-3 border-t border-cyber-gray/20">
        <Ionicons name="information-circle" size={14} color="#00ffff" />
        <Text className="text-cyber-cyan font-jetbrains text-xs ml-1">
          The more specific your interests, the better the suggestions!
        </Text>
      </View>
    </View>
  );
};

export default ConversationStartersIntro; 

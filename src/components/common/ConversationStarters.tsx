/**
 * @file ConversationStarters.tsx
 * @description Component for displaying AI-generated conversation starters based on gaming preferences
 * Uses the RAG system with Pinecone and OpenAI to suggest relevant conversation topics
 * Falls back to predefined starters when AI services aren't available
 * 
 * @author SnapConnect Team
 * @created 2024-01-25
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { generateConversationStarters } from "../../services/ai";

// Type definitions
interface ConversationStartersProps {
  user1Genres: string[];
  user2Genres: string[];
  onStarterSelect: (starter: string) => void;
  disabled?: boolean;
}

interface ConversationStarterData {
  starters: string[];
  sharedGenres: string[];
  retrievedCount: number;
}

/**
 * Conversation starters component with AI-powered suggestions
 * 
 * @param props - Component properties
 * @returns {React.ReactElement} Rendered conversation starters
 * 
 * @features
 * - AI-generated conversation starters based on shared gaming interests
 * - Loading states with gaming-themed indicators
 * - Error handling with retry functionality
 * - Smooth animations and haptic feedback
 * - Responsive design adapting to different shared interest counts
 */
const ConversationStarters: React.FC<ConversationStartersProps> = ({
  user1Genres,
  user2Genres,
  onStarterSelect,
  disabled = false,
}) => {
  const [starterData, setStarterData] = useState<ConversationStarterData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch conversation starters from the AI service
   */
  const fetchStarters = async () => {
    if (!user1Genres.length && !user2Genres.length) {
      setError("No gaming preferences available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching conversation starters for genres:', {
        user1Genres,
        user2Genres,
      });

      const result = await generateConversationStarters(user1Genres, user2Genres);
      setStarterData(result);

      console.log('Successfully fetched conversation starters:', {
        starterCount: result.starters.length,
        sharedGenres: result.sharedGenres,
        usingAI: result.retrievedCount > 0,
      });

    } catch (error) {
      console.error('Failed to fetch conversation starters:', error);
      let errorMessage = 'Failed to generate conversation starters';
      
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initialize conversation starters when component mounts or genres change
   */
  useEffect(() => {
    fetchStarters();
  }, [user1Genres, user2Genres]);

  /**
   * Handle starter selection
   * Clean up formatting characters (dashes, quotes) before sending
   */
  const handleStarterPress = (starter: string) => {
    if (disabled) return;
    
    // Clean the starter text by removing leading dashes and surrounding quotes
    const cleanedStarter = starter
      .replace(/^-\s*/, '') // Remove leading dash and optional space
      .replace(/^["'`]|["'`]$/g, '') // Remove surrounding quotes (single, double, or backticks)
      .trim(); // Remove any extra whitespace
    
    onStarterSelect(cleanedStarter);
  };

  /**
   * Handle retry when there's an error
   */
  const handleRetry = () => {
    fetchStarters();
  };

  /**
   * Render loading state
   */
  const renderLoading = () => (
    <View className="items-center py-8">
      <ActivityIndicator size="large" color="#00ffff" />
      <Text className="text-cyber-cyan font-inter text-sm mt-3">
        Generating conversation starters...
      </Text>
      <Text className="text-white/40 font-jetbrains text-xs mt-1">
        [ AI PROCESSING GAMING PREFERENCES ]
      </Text>
    </View>
  );

  /**
   * Render error state
   */
  const renderError = () => (
    <View className="items-center py-6">
      <Ionicons name="warning-outline" size={32} color="#ff6b6b" />
      <Text className="text-white font-inter text-base mt-3 text-center">
        Failed to Generate Starters
      </Text>
      <Text className="text-white/60 font-inter text-sm mt-1 text-center px-4">
        {error}
      </Text>
      <TouchableOpacity
        onPress={handleRetry}
        className="bg-cyber-cyan/20 border border-cyber-cyan/30 px-4 py-2 rounded-lg mt-4"
        activeOpacity={0.7}
      >
        <Text className="text-cyber-cyan font-inter font-medium">
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render shared genres badge
   */
  const renderSharedGenres = () => {
    if (!starterData?.sharedGenres.length) return null;

    return (
      <View className="flex-row justify-center mb-4">
        <View className="bg-cyber-dark/40 border border-cyber-cyan/20 px-3 py-1 rounded-full">
          <Text className="text-cyber-cyan font-jetbrains text-xs">
            Shared Interests: {starterData.sharedGenres.join(", ").toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };

  /**
   * Render conversation starters list
   */
  const renderStarters = () => {
    if (!starterData?.starters.length) {
      return (
        <View className="items-center py-6">
          <Ionicons name="chatbubbles-outline" size={32} color="#666" />
          <Text className="text-white/60 font-inter text-base mt-3">
            No conversation starters available
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {starterData.starters.map((starter, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleStarterPress(starter)}
            disabled={disabled}
            className={`bg-cyber-dark/30 border border-cyber-gray/20 rounded-lg p-4 mb-3 ${
              disabled ? 'opacity-50' : ''
            }`}
            activeOpacity={0.7}
            style={{
              boxShadow: '0px 2px 4px rgba(0, 255, 255, 0.1)',
              elevation: 2,
            } as any}
          >
            <View className="flex-row items-start">
              <View className="bg-cyber-cyan/10 border border-cyber-cyan/20 rounded-full p-2 mr-3">
                <Ionicons name="chatbubble" size={16} color="#00ffff" />
              </View>
              
              <View className="flex-1">
                <Text className="text-white font-inter text-base leading-6">
                  {starter}
                </Text>
                
                <View className="flex-row items-center mt-2">
                  <Ionicons name="send" size={12} color="#00ffff" />
                  <Text className="text-cyber-cyan font-jetbrains text-xs ml-1">
                    Tap to send
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View className="flex-1 px-4">
      {/* Header */}
      <View className="items-center mb-6">
        <View className="flex-row items-center mb-2">
          <Ionicons name="sparkles" size={20} color="#00ffff" />
          <Text className="text-cyber-cyan font-orbitron text-lg ml-2">
            Conversation Starters
          </Text>
        </View>
        <Text className="text-white/60 font-inter text-sm text-center">
          AI-powered suggestions based on your gaming interests
        </Text>
      </View>

      {/* Shared Genres */}
      {renderSharedGenres()}

      {/* Content */}
      <View className="flex-1">
        {isLoading ? renderLoading() : error ? renderError() : renderStarters()}
      </View>

      {/* Gaming Aesthetic Elements */}
      <View className="items-center mt-4">
        <View className="w-full h-px bg-cyber-cyan opacity-20 mb-2" />
        <Text className="text-green-400 text-xs font-mono">
          [ {starterData?.retrievedCount ? 'AI-POWERED' : 'CURATED'} • GAMING FOCUSED ]
        </Text>
      </View>
    </View>
  );
};

export default ConversationStarters; 

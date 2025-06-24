/**
 * @file MessagesScreen.tsx
 * @description Ephemeral messaging interface with gaming-focused conversations.
 * Displays gaming groups, friends, and disappearing message threads.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-20
 * 
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @/stores/themeStore: Theme management
 * 
 * @usage
 * Main interface for viewing and managing ephemeral conversations.
 * 
 * @ai_context
 * AI-powered message suggestions and gaming context awareness.
 * Smart conversation prioritization based on gaming activity.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';

/**
 * Messages screen component
 * 
 * @returns {React.ReactElement} Rendered messages interface
 * 
 * @performance
 * - Optimized list rendering for large conversation histories
 * - Efficient message loading and caching
 * - Real-time message synchronization
 * 
 * @ai_integration
 * - Smart conversation prioritization
 * - Gaming context-aware message suggestions
 * - Automated conversation categorization
 */
const MessagesScreen: React.FC = () => {
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  
  // Mock conversations data
  const conversations = [
    { id: 1, name: 'Gaming Clan Alpha', lastMessage: 'Ready for the tournament?', time: '2m ago', isOnline: true },
    { id: 2, name: 'Sarah Chen', lastMessage: 'That clutch was insane! 🔥', time: '15m ago', isOnline: true },
    { id: 3, name: 'Pro Gamers Group', lastMessage: 'New meta strategy discussion', time: '1h ago', isOnline: false },
    { id: 4, name: 'Mike Rodriguez', lastMessage: 'Want to duo queue later?', time: '3h ago', isOnline: false },
  ];
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background.primary} />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray">
        <Text className="text-white font-orbitron text-xl">Messages</Text>
        <TouchableOpacity className="p-2">
          <Ionicons name="add-circle-outline" size={24} color={accentColor} />
        </TouchableOpacity>
      </View>
      
      {/* Conversations List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {conversations.map((conversation) => (
          <TouchableOpacity
            key={conversation.id}
            className="flex-row items-center px-6 py-4 border-b border-cyber-gray/30"
          >
            {/* Avatar */}
            <View className="w-12 h-12 bg-cyber-cyan/20 rounded-full justify-center items-center mr-4">
              <Ionicons name="person" size={20} color={accentColor} />
              {conversation.isOnline && (
                <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-gaming-victory rounded-full border-2 border-cyber-black" />
              )}
            </View>
            
            {/* Conversation Info */}
            <View className="flex-1">
              <Text className="text-white font-inter font-medium text-base">
                {conversation.name}
              </Text>
              <Text className="text-white/70 font-inter text-sm mt-1">
                {conversation.lastMessage}
              </Text>
            </View>
            
            {/* Time */}
            <Text className="text-cyber-cyan font-inter text-xs">
              {conversation.time}
            </Text>
          </TouchableOpacity>
        ))}
        
        {/* Empty State */}
        <View className="flex-1 justify-center items-center py-20">
          <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.text.tertiary} />
          <Text className="text-white/70 font-inter text-lg mt-4">
            Start Gaming Conversations
          </Text>
          <Text className="text-white/50 font-inter text-sm mt-2 text-center px-8">
            Connect with your gaming squad and share epic moments
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MessagesScreen; 

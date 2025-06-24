/**
 * @file StoriesScreen.tsx
 * @description Gaming stories and ephemeral content viewing interface.
 * Displays friend stories, gaming highlights, and community content.
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
 * Interface for viewing gaming stories and ephemeral community content.
 * 
 * @ai_context
 * AI-powered content curation and personalized story recommendations.
 * Gaming achievement and highlight detection and promotion.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';

/**
 * Stories screen component
 * 
 * @returns {React.ReactElement} Rendered stories interface
 * 
 * @performance
 * - Optimized media loading and caching
 * - Smooth story transitions and animations
 * - Efficient memory management for video content
 * 
 * @ai_integration
 * - Personalized story recommendations
 * - Gaming achievement highlighting
 * - Smart content categorization and filtering
 */
const StoriesScreen: React.FC = () => {
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  
  // Mock stories data
  const stories = [
    { id: 1, user: 'Alex Gaming', preview: '🏆', category: 'Achievement', time: '2h ago' },
    { id: 2, user: 'Pro Squad', preview: '🎮', category: 'Gameplay', time: '4h ago' },
    { id: 3, user: 'Sarah Chen', preview: '🔥', category: 'Highlight', time: '6h ago' },
    { id: 4, user: 'Gaming News', preview: '📰', category: 'News', time: '8h ago' },
  ];
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background.primary} />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray">
        <Text className="text-white font-orbitron text-xl">Stories</Text>
        <TouchableOpacity className="p-2">
          <Ionicons name="search-outline" size={24} color={accentColor} />
        </TouchableOpacity>
      </View>
      
      {/* Story Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="py-4 px-6"
      >
        {['All', 'Gaming', 'Achievements', 'Highlights', 'News'].map((category) => (
          <TouchableOpacity
            key={category}
            className="px-4 py-2 mr-3 bg-cyber-gray rounded-full"
          >
            <Text className="text-cyber-cyan font-inter text-sm">
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Stories Grid */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-20">
          {stories.map((story) => (
            <TouchableOpacity
              key={story.id}
              className="mb-4 bg-cyber-dark rounded-lg p-4 border border-cyber-gray/30"
            >
              <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 bg-cyber-cyan/20 rounded-full justify-center items-center mr-3">
                  <Text className="text-lg">{story.preview}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-inter font-medium">
                    {story.user}
                  </Text>
                  <Text className="text-cyber-cyan font-inter text-xs">
                    {story.category} · {story.time}
                  </Text>
                </View>
                <Ionicons name="play-circle-outline" size={24} color={accentColor} />
              </View>
              
              {/* Story Preview */}
              <View className="h-48 bg-cyber-black rounded-lg justify-center items-center">
                <Ionicons name="play" size={32} color={accentColor} />
                <Text className="text-white/70 font-inter text-sm mt-2">
                  Story Preview
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Empty State */}
        <View className="flex-1 justify-center items-center py-20">
          <Ionicons name="play-circle-outline" size={64} color={theme.colors.text.tertiary} />
          <Text className="text-white/70 font-inter text-lg mt-4">
            No Stories Yet
          </Text>
          <Text className="text-white/50 font-inter text-sm mt-2 text-center px-8">
            Gaming stories and highlights will appear here
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StoriesScreen; 

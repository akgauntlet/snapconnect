/**
 * @file StoryGridItem.tsx
 * @description Reusable story grid item component for displaying stories in grid layout.
 * Shows story preview with user info, timestamps, and interaction indicators.
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
 * <StoryGridItem
 *   storyUser={storyUser}
 *   onPress={handlePress}
 * />
 * 
 * @ai_context
 * Displays AI-enhanced story grid items with smart content preview.
 * Supports gaming achievement highlighting and engagement metrics.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';

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
    mediaType: 'photo' | 'video';
    text?: string;
    createdAt: any;
    hasViewed: boolean;
  }[];
  hasUnviewed: boolean;
}

/**
 * Props for StoryGridItem component
 */
interface StoryGridItemProps {
  storyUser: StoryUser;
  onPress: (storyUser: StoryUser, storyIndex?: number) => void;
}

/**
 * Story grid item component with cyber gaming aesthetic
 * 
 * @param {StoryGridItemProps} props - Component props
 * @returns {React.ReactElement} Rendered story grid item
 * 
 * @performance
 * - Optimized image loading with expo-image
 * - Efficient gradient overlays for readability
 * - Smart content preview with proper aspect ratios
 */
const StoryGridItem: React.FC<StoryGridItemProps> = ({
  storyUser,
  onPress
}) => {
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());

  const latestStory = storyUser.stories[0];
  const displayName = storyUser.user.displayName || storyUser.user.username || 'Unknown';

  /**
   * Format time ago display
   */
  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  /**
   * Get user initials for avatar fallback
   */
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  /**
   * Handle press with story index
   */
  const handlePress = () => {
    onPress(storyUser, 0);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="mb-4 rounded-xl overflow-hidden border border-cyber-gray/20 bg-cyber-dark/30 active:scale-98"
    >
      <View className="relative aspect-[4/3]">
        {/* Story Media */}
        <Image
          source={{ uri: latestStory.mediaUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          placeholder={null}
          transition={200}
        />
        
        {/* Gradient Overlay */}
        <View className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Content Overlay */}
        <View className="absolute inset-0 justify-end p-4">
          {/* User Info Row */}
          <View className="flex-row items-center mb-3">
            {/* User Avatar */}
            <View className="w-8 h-8 bg-cyber-cyan/20 border border-cyber-cyan/30 rounded-full justify-center items-center mr-3">
              <Text className="text-cyber-cyan font-inter font-bold text-xs">
                {getUserInitials(displayName)}
              </Text>
            </View>
            
            {/* User Details */}
            <View className="flex-1">
              <Text className="text-white font-inter font-semibold text-sm" numberOfLines={1}>
                {displayName}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-white/70 font-inter text-xs">
                  {formatTimeAgo(latestStory.createdAt)}
                </Text>
                <View className="w-1 h-1 bg-white/50 rounded-full mx-2" />
                <Text className="text-white/70 font-inter text-xs">
                  {storyUser.stories.length} {storyUser.stories.length === 1 ? 'story' : 'stories'}
                </Text>
              </View>
            </View>

            {/* Play Button */}
            <View className="w-8 h-8 bg-white/20 rounded-full justify-center items-center">
              <Ionicons 
                name={latestStory.mediaType === 'video' ? 'play' : 'eye'} 
                size={14} 
                color="white" 
              />
            </View>
          </View>
          
          {/* Story Text Preview */}
          {latestStory.text && (
            <Text className="text-white font-inter text-sm leading-5" numberOfLines={2}>
              {latestStory.text}
            </Text>
          )}
        </View>

        {/* Top Indicators */}
        <View className="absolute top-3 left-3 right-3 flex-row justify-between items-start">
          {/* Media Type Badge */}
          <View className="bg-cyber-black/70 px-2 py-1 rounded-full flex-row items-center">
            <Ionicons 
              name={latestStory.mediaType === 'video' ? 'videocam' : 'camera'} 
              size={12} 
              color="white" 
            />
            <Text className="text-white font-inter text-xs ml-1 font-medium">
              {latestStory.mediaType.toUpperCase()}
            </Text>
          </View>

          {/* Unviewed Indicator */}
          {storyUser.hasUnviewed && (
            <View className="flex-row items-center">
              <View className="w-2 h-2 bg-cyber-cyan rounded-full animate-pulse" />
              <Text className="text-cyber-cyan font-inter text-xs ml-1 font-bold">
                NEW
              </Text>
            </View>
          )}
        </View>

        {/* Multiple Stories Indicator */}
        {storyUser.stories.length > 1 && (
          <View className="absolute top-3 right-3">
            <View className="bg-cyber-magenta px-2 py-1 rounded-full">
              <Text className="text-white font-inter text-xs font-bold">
                +{storyUser.stories.length - 1}
              </Text>
            </View>
          </View>
        )}

        {/* Gaming Achievement Badge (example) */}
        {latestStory.text && latestStory.text.includes('achievement') && (
          <View className="absolute top-3 left-3">
            <View className="bg-cyber-green px-2 py-1 rounded-full flex-row items-center">
              <Ionicons name="trophy" size={10} color="#000" />
              <Text className="text-cyber-black font-inter text-xs ml-1 font-bold">
                ACHIEVEMENT
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default StoryGridItem; 

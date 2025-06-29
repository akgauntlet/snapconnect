/**
 * @file ProfileCard.tsx
 * @description Profile card component for SnapConnect social sharing.
 * Renders visual profile cards for sharing on social platforms.
 *
 * @author SnapConnect Team
 * @created 2024-01-26
 *
 * @dependencies
 * - react-native: Core components
 * - @/stores/themeStore: Theme management
 *
 * @usage
 * <ProfileCard user={user} profile={profile} format="square" theme="cyber" />
 *
 * @ai_context
 * Visual profile representation optimized for social media sharing
 * and community engagement in gaming contexts.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, View } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';

interface ProfileCardProps {
  user: any;
  profile: any;
  stats?: {
    victories: number;
    achievements: number;
    highlights: number;
    friends: number;
  };
  format?: 'square' | 'story' | 'banner';
  theme?: 'cyber' | 'gaming' | 'minimal' | 'neon';
}

/**
 * Profile card component for social sharing
 */
const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  profile,
  stats,
  format = 'square',
  theme = 'cyber',
}) => {
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());

  /**
   * Get card dimensions based on format
   */
  const getCardStyle = () => {
    switch (format) {
      case 'story':
        return 'w-48 h-80'; // 9:16 aspect ratio
      case 'banner':
        return 'w-80 h-32'; // 5:2 aspect ratio
      default:
        return 'w-64 h-64'; // Square
    }
  };

  /**
   * Get theme colors
   */
  const getThemeColors = () => {
    const themes = {
      cyber: {
        primary: '#00FFFF',
        background: '#0A0A0A',
        secondary: '#FF00FF',
      },
      gaming: {
        primary: '#FF6B6B',
        background: '#2C3E50',
        secondary: '#4ECDC4',
      },
      neon: {
        primary: '#FF0080',
        background: '#000000',
        secondary: '#00FF80',
      },
      minimal: {
        primary: '#333333',
        background: '#FFFFFF',
        secondary: '#666666',
      },
    };
    
    return themes[theme];
  };

  const themeColors = getThemeColors();

  return (
    <View 
      className={`${getCardStyle()} rounded-lg p-4 justify-between`}
      style={{ backgroundColor: themeColors.background }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          {profile.avatar?.urls?.small ? (
            <Image
              source={{ uri: profile.avatar.urls.small }}
              className="w-8 h-8 rounded-full mr-2"
            />
          ) : (
            <View 
              className="w-8 h-8 rounded-full justify-center items-center mr-2"
              style={{ backgroundColor: `${themeColors.primary}20` }}
            >
              <Ionicons name="person" size={16} color={themeColors.primary} />
            </View>
          )}
          <View>
            <Text 
              className="font-inter font-medium text-sm"
              style={{ color: theme === 'minimal' ? '#333' : '#FFF' }}
            >
              {profile.displayName || user.displayName}
            </Text>
            <Text 
              className="font-inter text-xs"
              style={{ color: themeColors.primary }}
            >
              @{profile.username}
            </Text>
          </View>
        </View>
                 <Ionicons name="game-controller" size={20} color={themeColors.primary} />
      </View>

      {/* Status Message */}
      {profile.statusMessage?.text && format !== 'banner' && (
        <View className="flex-1 justify-center">
          <Text 
            className="font-inter text-sm text-center"
            style={{ color: theme === 'minimal' ? '#666' : '#FFF' }}
          >
            {profile.statusMessage.emoji} {profile.statusMessage.text}
          </Text>
        </View>
      )}

      {/* Stats (if not banner format) */}
      {stats && format !== 'banner' && (
        <View className="flex-row justify-around">
          <View className="items-center">
            <Text 
              className="font-inter text-lg font-bold"
              style={{ color: themeColors.primary }}
            >
              {stats.victories}
            </Text>
            <Text 
              className="font-inter text-xs"
              style={{ color: theme === 'minimal' ? '#666' : '#FFF' }}
            >
              Wins
            </Text>
          </View>
          <View className="items-center">
            <Text 
              className="font-inter text-lg font-bold"
              style={{ color: themeColors.primary }}
            >
              {stats.achievements}
            </Text>
            <Text 
              className="font-inter text-xs"
              style={{ color: theme === 'minimal' ? '#666' : '#FFF' }}
            >
              Achievements
            </Text>
          </View>
          <View className="items-center">
            <Text 
              className="font-inter text-lg font-bold"
              style={{ color: themeColors.primary }}
            >
              {stats.highlights}
            </Text>
            <Text 
              className="font-inter text-xs"
              style={{ color: theme === 'minimal' ? '#666' : '#FFF' }}
            >
              Highlights
            </Text>
          </View>
        </View>
      )}

      {/* Banner format content */}
      {format === 'banner' && (
        <View className="flex-row items-center justify-between flex-1">
          <View>
            <Text 
              className="font-inter text-lg font-bold"
              style={{ color: theme === 'minimal' ? '#333' : '#FFF' }}
            >
              {profile.displayName || user.displayName}
            </Text>
            <Text 
              className="font-inter text-sm"
              style={{ color: themeColors.primary }}
            >
              @{profile.username}
            </Text>
          </View>
          {stats && (
            <View className="flex-row space-x-4">
              <View className="items-center">
                <Text 
                  className="font-inter text-sm font-bold"
                  style={{ color: themeColors.primary }}
                >
                  {stats.victories}
                </Text>
                <Text 
                  className="font-inter text-xs"
                  style={{ color: theme === 'minimal' ? '#666' : '#FFF' }}
                >
                  Wins
                </Text>
              </View>
              <View className="items-center">
                <Text 
                  className="font-inter text-sm font-bold"
                  style={{ color: themeColors.primary }}
                >
                  {stats.achievements}
                </Text>
                <Text 
                  className="font-inter text-xs"
                  style={{ color: theme === 'minimal' ? '#666' : '#FFF' }}
                >
                  Achievements
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Footer */}
      <View className="flex-row items-center justify-center">
        <Text 
          className="font-inter text-xs"
          style={{ color: themeColors.secondary }}
        >
          SnapConnect Gaming
        </Text>
      </View>
    </View>
  );
};

export default ProfileCard; 

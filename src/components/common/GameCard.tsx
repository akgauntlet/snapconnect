/**
 * @file GameCard.tsx
 * @description Gaming-themed card component for displaying game content, user stats, and gaming activities.
 * Features RGB borders, glow effects, and gaming context indicators.
 * 
 * @author SnapConnect Team
 * @created 2024-01-25
 * 
 * @dependencies
 * - react: React hooks and types
 * - react-native: TouchableOpacity, Text, View, Image
 * - @expo/vector-icons: Gaming icons
 * - expo-image: Optimized image component
 * 
 * @usage
 * import { GameCard } from '@/components/common/GameCard';
 * <GameCard title="Fortnite" status="online" onPress={handlePress} />
 * 
 * @ai_context
 * Displays gaming content with AI-powered recommendations and dynamic theming.
 * Supports various gaming contexts and user engagement metrics.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

/**
 * Gaming context types for different card purposes
 */
export type GameCardType = 
  | 'game'         // Game information card
  | 'achievement'  // Achievement/trophy card
  | 'stats'        // Gaming statistics card
  | 'friend'       // Gaming friend card
  | 'clan'         // Clan/guild information
  | 'tournament';  // Tournament/event card

/**
 * Gaming rarity levels for visual hierarchy
 */
export type GameCardRarity = 
  | 'common'       // Gray accent
  | 'rare'         // Blue accent
  | 'epic'         // Purple accent
  | 'legendary'    // Gold accent
  | 'mythic';      // RGB cycling accent

/**
 * Online status for gaming contexts
 */
export type GameCardStatus = 
  | 'online'       // Currently active
  | 'offline'      // Inactive
  | 'playing'      // Currently in game
  | 'away'         // Away from game
  | 'busy';        // Do not disturb

/**
 * GameCard component props
 */
export interface GameCardProps {
  /** Card title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Optional description */
  description?: string;
  /** Card image URL */
  imageUrl?: string;
  /** Gaming context type */
  type?: GameCardType;
  /** Rarity level for visual styling */
  rarity?: GameCardRarity;
  /** Online/gaming status */
  status?: GameCardStatus;
  /** Optional stats object */
  stats?: {
    label: string;
    value: string | number;
    icon?: keyof typeof Ionicons.glyphMap;
  }[];
  /** Press handler */
  onPress?: () => void;
  /** Whether card is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Get rarity-specific styling classes
 * @param rarity - Card rarity level
 * @returns CSS classes for rarity styling
 */
function getRarityClasses(rarity: GameCardRarity): {
  border: string;
  glow: string;
  accent: string;
} {
  switch (rarity) {
    case 'common':
      return {
        border: 'border-gaming-common',
        glow: 'shadow-md',
        accent: 'text-gaming-common',
      };
    case 'rare':
      return {
        border: 'border-gaming-rare',
        glow: 'shadow-glow-blue',
        accent: 'text-gaming-rare',
      };
    case 'epic':
      return {
        border: 'border-gaming-epic',
        glow: 'shadow-glow-magenta',
        accent: 'text-gaming-epic',
      };
    case 'legendary':
      return {
        border: 'border-gaming-legendary',
        glow: 'shadow-glow-orange',
        accent: 'text-gaming-legendary',
      };
    case 'mythic':
      return {
        border: 'border-cyber-cyan',
        glow: 'shadow-glow-cyan',
        accent: 'text-cyber-cyan',
      };
    default:
      return {
        border: 'border-gaming-common',
        glow: 'shadow-md',
        accent: 'text-gaming-common',
      };
  }
}

/**
 * Get status indicator styling
 * @param status - Gaming status
 * @returns Status indicator classes and color
 */
function getStatusClasses(status: GameCardStatus): {
  color: string;
  bgColor: string;
  text: string;
} {
  switch (status) {
    case 'online':
      return {
        color: '#00ff41',
        bgColor: 'bg-cyber-green',
        text: 'Online',
      };
    case 'playing':
      return {
        color: '#00ffff',
        bgColor: 'bg-cyber-cyan',
        text: 'Playing',
      };
    case 'away':
      return {
        color: '#ff8000',
        bgColor: 'bg-cyber-orange',
        text: 'Away',
      };
    case 'busy':
      return {
        color: '#ff0040',
        bgColor: 'bg-neon-red',
        text: 'Busy',
      };
    case 'offline':
    default:
      return {
        color: '#808080',
        bgColor: 'bg-gray-500',
        text: 'Offline',
      };
  }
}

/**
 * Get type-specific icon
 * @param type - Card type
 * @returns Icon name for the type
 */
function getTypeIcon(type: GameCardType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'game':
      return 'game-controller';
    case 'achievement':
      return 'trophy';
    case 'stats':
      return 'stats-chart';
    case 'friend':
      return 'person';
    case 'clan':
      return 'people';
    case 'tournament':
      return 'medal';
    default:
      return 'game-controller';
  }
}

/**
 * GameCard Component
 * Gaming-themed card with rarity system and status indicators
 * 
 * @param props - Component props
 * @returns Rendered card component
 * 
 * @example
 * <GameCard
 *   title="Apex Legends"
 *   subtitle="Battle Royale"
 *   type="game"
 *   rarity="legendary"
 *   status="playing"
 *   stats={[
 *     { label: 'Level', value: 127, icon: 'trending-up' },
 *     { label: 'Wins', value: 45, icon: 'trophy' }
 *   ]}
 *   onPress={handleGamePress}
 * />
 */
export const GameCard: React.FC<GameCardProps> = ({
  title,
  subtitle,
  description,
  imageUrl,
  type = 'game',
  rarity = 'common',
  status,
  stats,
  onPress,
  disabled = false,
  className = '',
  testID,
}) => {
  const rarityClasses = getRarityClasses(rarity);
  const statusClasses = status ? getStatusClasses(status) : null;
  const typeIcon = getTypeIcon(type);

  /**
   * Handle card press
   */
  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  /**
   * Render status indicator
   */
  const renderStatusIndicator = () => {
    if (!status || !statusClasses) return null;

    return (
      <View className="flex-row items-center">
        <View 
          className={`w-2 h-2 rounded-full ${statusClasses.bgColor} mr-2`}
        />
        <Text className="text-xs text-white/70 font-inter">
          {statusClasses.text}
        </Text>
      </View>
    );
  };

  /**
   * Render stats section
   */
  const renderStats = () => {
    if (!stats || stats.length === 0) return null;

    return (
      <View className="flex-row justify-between mt-3 pt-3 border-t border-cyber-gray/30">
        {stats.map((stat, index) => (
          <View key={index} className="flex-1 items-center">
            {stat.icon && (
              <Ionicons
                name={stat.icon}
                size={16}
                color="#00ffff"
                style={{ marginBottom: 4 }}
              />
            )}
            <Text className="text-white font-inter-semibold text-lg">
              {stat.value}
            </Text>
            <Text className="text-white/60 font-inter text-xs">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      onPress={onPress ? handlePress : undefined}
      disabled={disabled}
      testID={testID}
      className={`
        bg-cyber-dark 
        border-2 
        ${rarityClasses.border} 
        ${rarityClasses.glow}
        rounded-xl 
        p-4 
        ${disabled ? 'opacity-50' : onPress ? 'active:scale-95' : ''}
        ${className}
      `}
    >
      {/* Header with image and title */}
      <View className="flex-row items-start">
        {/* Image */}
        {imageUrl && (
          <View className="mr-3">
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: 60,
                height: 60,
                borderRadius: 8,
              }}
              contentFit="cover"
            />
          </View>
        )}

        {/* Content */}
        <View className="flex-1">
          {/* Title row with type icon */}
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center flex-1">
              <Ionicons
                name={typeIcon}
                size={16}
                color={rarityClasses.accent.includes('text-') ? 
                  rarityClasses.accent.replace('text-', '#') : '#00ffff'
                }
                style={{ marginRight: 6 }}
              />
              <Text className={`font-orbitron font-medium ${rarityClasses.accent} flex-1`} numberOfLines={1}>
                {title}
              </Text>
            </View>
            {renderStatusIndicator()}
          </View>

          {/* Subtitle */}
          {subtitle && (
            <Text className="text-white/80 font-inter text-sm mb-1" numberOfLines={1}>
              {subtitle}
            </Text>
          )}

          {/* Description */}
          {description && (
            <Text className="text-white/60 font-inter text-xs" numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>
      </View>

      {/* Stats section */}
      {renderStats()}
    </CardWrapper>
  );
};

export default GameCard; 

/**
 * @file CommunityDiscovery.tsx
 * @description Community discovery component for SnapConnect gaming teams.
 * Helps users find and join gaming communities based on their preferences.
 *
 * @author SnapConnect Team
 * @created 2024-01-26
 *
 * @dependencies
 * - react-native: Core components
 * - @/services/social: Community services
 *
 * @usage
 * <CommunityDiscovery userId={userId} preferences={preferences} />
 *
 * @ai_context
 * Facilitates gaming community discovery and team formation
 * based on gaming preferences and skill levels.
 */

import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import { CyberButton } from '../common';

interface CommunityDiscoveryProps {
  userId: string;
  preferences?: {
    games: string[];
    platforms: string[];
    skillLevel: string;
    playstyle: string;
  };
  onTeamSelect?: (teamId: string) => void;
}

/**
 * Community discovery component for team finding
 */
const CommunityDiscovery: React.FC<CommunityDiscoveryProps> = ({
  userId,
  preferences,
  onTeamSelect,
}) => {
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Mock teams for demonstration
   */
  const mockTeams = [
    {
      id: 'team_1',
      name: 'Cyber Legends',
      description: 'Competitive FPS team',
      members: 5,
      maxMembers: 8,
      games: ['Valorant', 'CS2'],
      platforms: ['PC'],
      theme: 'cyber',
    },
    {
      id: 'team_2',
      name: 'Neon Runners',
      description: 'Casual gaming community',
      members: 12,
      maxMembers: 15,
      games: ['Multiple'],
      platforms: ['PC', 'Console'],
      theme: 'neon',
    },
  ];

  return (
    <View className="flex-1 bg-cyber-dark">
      {/* Header */}
      <View className="p-6 border-b border-cyber-gray/20">
        <Text className="text-white font-orbitron text-xl mb-2">
          Discover Teams
        </Text>
        <Text className="text-white/70 font-inter text-sm">
          Find gaming communities that match your style
        </Text>
      </View>

      {/* Team List */}
      <ScrollView className="flex-1 p-6">
        {mockTeams.map((team) => (
          <TouchableOpacity
            key={team.id}
            onPress={() => onTeamSelect?.(team.id)}
            className="bg-cyber-gray/20 rounded-lg p-4 mb-4 border border-cyber-gray/10"
          >
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1">
                <Text className="text-white font-inter font-bold text-lg mb-1">
                  {team.name}
                </Text>
                <Text className="text-white/70 font-inter text-sm">
                  {team.description}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-cyber-cyan font-inter text-sm">
                  {team.members}/{team.maxMembers} members
                </Text>
              </View>
            </View>

            {/* Team Info */}
            <View className="flex-row flex-wrap gap-2 mb-3">
              {team.games.map((game, index) => (
                <View
                  key={index}
                  className="bg-cyber-cyan/20 px-2 py-1 rounded"
                >
                  <Text className="text-cyber-cyan font-inter text-xs">
                    {game}
                  </Text>
                </View>
              ))}
              {team.platforms.map((platform, index) => (
                <View
                  key={index}
                  className="bg-cyber-gray/40 px-2 py-1 rounded"
                >
                  <Text className="text-white/70 font-inter text-xs">
                    {platform}
                  </Text>
                </View>
              ))}
            </View>

            {/* Join Button */}
            <CyberButton
              variant="ghost"
              size="small"
              icon="add-outline"
              onPress={() => onTeamSelect?.(team.id)}
            >
              Request to Join
            </CyberButton>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Create Team Button */}
      <View className="p-6 border-t border-cyber-gray/20">
        <CyberButton
          variant="primary"
          fullWidth
          icon="people-outline"
          loading={isLoading}
          onPress={() => console.log('Create team functionality coming soon!')}
        >
          Create New Team
        </CyberButton>
      </View>
    </View>
  );
};

export default CommunityDiscovery; 

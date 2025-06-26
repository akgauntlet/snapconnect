/**
 * @file MessageFriendSelector.tsx
 * @description Friend selection component for starting new conversations.
 * Allows users to select friends from their friend list to begin messaging.
 * 
 * @author SnapConnect Team
 * @created 2024-01-24
 * 
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - expo-haptics: Haptic feedback
 * - @/services/firebase/friendsService: Friends management
 * 
 * @usage
 * <MessageFriendSelector
 *   visible={isVisible}
 *   onSelectFriend={handleFriendSelect}
 *   onClose={handleClose}
 * />
 * 
 * @ai_context
 * Integrates with AI-powered friend suggestions based on conversation patterns.
 * Supports smart friend recommendations and recent interaction analysis.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { friendsService } from '../../services/firebase/friendsService';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';

/**
 * Friend interface for selection
 */
interface Friend {
  id: string;
  displayName: string;
  username: string;
  profilePhoto?: string;
  lastActive?: Date;
  isOnline?: boolean;
  status: 'online' | 'offline' | 'away';
}

/**
 * Props for MessageFriendSelector component
 */
interface MessageFriendSelectorProps {
  visible: boolean;
  onSelectFriend: (friendId: string, friendData: Friend) => void;
  onClose: () => void;
}

/**
 * Friend selector component for starting new conversations
 */
const MessageFriendSelector: React.FC<MessageFriendSelectorProps> = ({
  visible,
  onSelectFriend,
  onClose
}) => {
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const { user } = useAuthStore();
  
  // Component state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load friends from Firebase
   */
  const loadFriends = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get friends from Firebase
      const friendsData = await friendsService.getFriends(user.uid);
      
      // Get real presence data for all friends
      const friendIds = friendsData.map(friend => friend.id);
      const presenceData = await friendsService.getBatchUserPresence(friendIds) as Record<string, {
        status: 'online' | 'offline' | 'away';
        lastActive: Date;
        isOnline: boolean;
      }>;
      
      // Transform to our interface format with real presence data
      const formattedFriends: Friend[] = friendsData.map(friend => {
        const presence = presenceData[friend.id] || { status: 'offline', lastActive: new Date(), isOnline: false };
        
        return {
          id: friend.id,
          displayName: friend.displayName || friend.username || 'Unknown',
          username: friend.username || 'no-username',
          profilePhoto: friend.profilePhoto,
          lastActive: presence.lastActive,
          isOnline: presence.isOnline,
          status: presence.status,
        };
      });
      
      // Sort by online status, then by display name
      formattedFriends.sort((a, b) => {
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (b.status === 'online' && a.status !== 'online') return 1;
        return a.displayName.localeCompare(b.displayName);
      });
      
      setFriends(formattedFriends);
      
      // If no friends, show helpful message
      if (formattedFriends.length === 0) {
        setError('No friends found. Add friends to start messaging!');
      }
      
    } catch (error) {
      console.error('Load friends failed:', error);
      setError('Failed to load friends. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Load friends list on component mount
   */
  useEffect(() => {
    if (visible && user) {
      loadFriends();
    }
  }, [visible, user, loadFriends]);

  /**
   * Filter friends based on search query
   */
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend =>
        friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [friends, searchQuery]);

  /**
   * Handle friend selection
   */
  const handleSelectFriend = useCallback(async (friend: Friend) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelectFriend(friend.id, friend);
      handleClose();
    } catch (error) {
      console.error('Select friend failed:', error);
    }
  }, [onSelectFriend]);

  /**
   * Handle close modal
   */
  const handleClose = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Clear search
      setSearchQuery('');
      setError(null);
      
      onClose();
    } catch (error) {
      console.error('Handle close failed:', error);
    }
  }, [onClose]);

  /**
   * Get status color
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981'; // green
      case 'away': return '#f59e0b'; // yellow
      default: return '#6b7280'; // gray
    }
  };

  /**
   * Format last seen time
   */
  const formatLastSeen = (lastActive: Date, isOnline: boolean) => {
    if (isOnline) return 'Online now';
    
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  /**
   * Get friend's initials for avatar
   */
  const getFriendInitials = (friend: Friend) => {
    const name = friend.displayName || friend.username;
    return name.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  /**
   * Render friend item
   */
  const renderFriendItem = ({ item }: { item: Friend }) => {
    return (
      <TouchableOpacity
        onPress={() => handleSelectFriend(item)}
        className="flex-row items-center p-4 mx-4 mb-2 rounded-lg bg-cyber-gray/10 active:bg-cyber-cyan/20"
      >
        {/* Avatar with status indicator */}
        <View className="relative mr-4">
          <View className="w-12 h-12 bg-cyber-cyan/20 rounded-full justify-center items-center">
            <Text className="text-cyber-cyan font-inter font-semibold text-sm">
              {getFriendInitials(item)}
            </Text>
          </View>
          {/* Status indicator */}
          <View 
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-cyber-black"
            style={{ backgroundColor: getStatusColor(item.status) }}
          />
        </View>
        
        {/* Friend info */}
        <View className="flex-1">
          <Text className="text-white font-inter font-medium text-base">
            {item.displayName}
          </Text>
          <Text className="text-white/60 font-inter text-sm">
            @{item.username}
          </Text>
          <Text className="text-white/40 font-inter text-xs mt-1">
            {item.lastActive ? formatLastSeen(item.lastActive, item.isOnline || false) : 'Offline'}
          </Text>
        </View>
        
        {/* Arrow indicator */}
        <View className="ml-3">
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View className="items-center py-20 px-8">
          <ActivityIndicator size="large" color={accentColor} />
          <Text className="text-white/60 font-inter text-base mt-4 text-center">
            Loading friends...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="items-center py-20 px-8">
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text className="text-white/70 font-inter text-base mt-4 mb-2 text-center">
            {error}
          </Text>
          <TouchableOpacity
            onPress={loadFriends}
            className="bg-cyber-cyan/20 px-6 py-3 rounded-lg mt-4"
          >
            <Text className="text-cyber-cyan font-inter font-semibold">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (searchQuery && filteredFriends.length === 0) {
      return (
        <View className="items-center py-20 px-8">
          <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.3)" />
          <Text className="text-white/60 font-inter text-base mt-4 mb-2 text-center">
            No friends found
          </Text>
          <Text className="text-white/40 font-inter text-sm text-center">
            Try searching with a different name or username
          </Text>
        </View>
      );
    }

    return (
      <View className="items-center py-20 px-8">
        <Ionicons name="people-outline" size={48} color="rgba(255,255,255,0.3)" />
        <Text className="text-white/60 font-inter text-base mt-4 mb-2 text-center">
          No friends yet
        </Text>
        <Text className="text-white/40 font-inter text-sm text-center">
          Add friends to start conversations!
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
        <View className="flex-1 bg-cyber-black">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray/20">
            <TouchableOpacity onPress={handleClose} className="p-2">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            
            <Text className="text-white font-orbitron text-lg">
              New Message
            </Text>
            
            <View className="w-8" />
          </View>

          {/* Search */}
          <View className="px-6 py-4">
            <View className="flex-row items-center bg-cyber-gray/20 rounded-lg px-4 py-3">
              <Ionicons name="search" size={20} color="white" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search friends..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                className="flex-1 text-white font-inter ml-3"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Instructions */}
          <View className="px-6 pb-4">
            <Text className="text-white/60 font-inter text-sm">
              Select a friend to start a conversation
            </Text>
          </View>

          {/* Friends List */}
          <FlatList
            data={filteredFriends}
            renderItem={renderFriendItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={renderEmptyState}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default MessageFriendSelector; 

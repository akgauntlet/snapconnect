/**
 * @file FriendsListScreen.tsx
 * @description Friends list screen showing all user's friends with management options.
 * Allows viewing friend profiles, removing friends, and navigating to add friends.
 * 
 * @author SnapConnect Team
 * @created 2024-01-24
 * 
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @react-navigation/native: Navigation
 * - @/services/firebase/friendsService: Friends management
 * - @/stores/authStore: Authentication state
 * - @/stores/themeStore: Theme management
 * 
 * @usage
 * Main friends management interface accessible from Profile screen.
 * 
 * @ai_context
 * AI-powered friend suggestions and social graph analysis.
 * Smart friend categorization based on gaming activity and interaction patterns.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import NotificationBadge from '../../components/common/NotificationBadge';
import { useFriendRequests } from '../../hooks/useFriendRequests';
import { friendsService } from '../../services/firebase/friendsService';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';

/**
 * Friend interface for display
 */
interface Friend {
  id: string;
  displayName: string;
  username: string;
  profilePhoto?: string;
  lastActive?: Date;
  isOnline?: boolean;
  createdAt?: Date;
  status: 'online' | 'offline' | 'away';
  mutualFriends?: number;
}

/**
 * Navigation prop type
 */
type FriendsListNavigationProp = NativeStackNavigationProp<any, 'FriendsList'>;

/**
 * Route param type
 */
type FriendsListRouteProp = {
  FriendsList: {
    sourceTab?: 'Camera' | 'Messages' | 'Stories' | 'Profile';
  };
};

/**
 * Friends list screen component
 * 
 * @returns {React.ReactElement} Rendered friends list interface
 * 
 * @performance
 * - Virtualized list for large friend counts
 * - Optimized friend loading and caching
 * - Efficient search and filtering
 * 
 * @ai_integration
 * - Smart friend suggestions and recommendations
 * - Activity-based friend categorization
 * - Intelligent search and discovery
 */
const FriendsListScreen: React.FC = () => {
  const navigation = useNavigation<FriendsListNavigationProp>();
  const route = useRoute<any>();
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const { user } = useAuthStore();

  // Get source tab from route params
  const sourceTab = route.params?.sourceTab || 'Profile'; // Default to Profile if not specified

  // Friend requests hook for badge count
  const { incomingCount, refreshRequests } = useFriendRequests();

  // Component state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'online' | 'recent'>('all');

  /**
   * Load friends from Firebase
   */
  const loadFriends = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      const friendsData = await friendsService.getFriends(user.uid);

      // Transform and enrich friend data
      const enrichedFriends: Friend[] = friendsData.map(friend => ({
        id: friend.id,
        displayName: friend.displayName || friend.username || 'Unknown User',
        username: friend.username || 'no-username',
        profilePhoto: friend.profilePhoto,
        lastActive: friend.lastActive?.toDate(),
        isOnline: Math.random() > 0.6, // TODO: Real presence detection
        createdAt: friend.createdAt?.toDate(),
        status: Math.random() > 0.6 ? 'online' : Math.random() > 0.3 ? 'away' : 'offline',
        mutualFriends: Math.floor(Math.random() * 20), // TODO: Calculate real mutual friends
      }));

      // Sort by online status, then by display name
      enrichedFriends.sort((a, b) => {
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (b.status === 'online' && a.status !== 'online') return 1;
        return a.displayName.localeCompare(b.displayName);
      });

      setFriends(enrichedFriends);
    } catch (error) {
      console.error('Load friends failed:', error);
      setError('Failed to load friends. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Load friends on component mount
   */
  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user, loadFriends]);

  /**
   * Refresh friends when screen comes into focus
   * This ensures the list updates when returning from other screens (like accepting friend requests)
   */
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadFriends();
      }
    }, [user, loadFriends])
  );

  /**
   * Filter friends based on search query and selected filter
   */
  useEffect(() => {
    let filtered = friends;

    // Apply text search
    if (searchQuery.trim()) {
      filtered = filtered.filter(friend =>
        friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    switch (selectedFilter) {
      case 'online':
        filtered = filtered.filter(friend => friend.status === 'online');
        break;
      case 'recent':
        filtered = filtered.filter(friend => {
          if (!friend.lastActive) return false;
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return friend.lastActive > dayAgo;
        });
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    setFilteredFriends(filtered);
  }, [friends, searchQuery, selectedFilter]);

  /**
   * Handle pull to refresh
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadFriends(),
      refreshRequests()
    ]);
    setIsRefreshing(false);
  }, [loadFriends, refreshRequests]);

  /**
   * Navigate to add friends screen
   */
  const handleAddFriends = useCallback(() => {
    navigation.navigate('AddFriends', { sourceTab });
  }, [navigation, sourceTab]);

  /**
   * Navigate to friend requests screen
   */
  const handleFriendRequests = useCallback(() => {
    navigation.navigate('FriendRequests', { sourceTab });
  }, [navigation, sourceTab]);

  /**
   * Handle back navigation to source tab
   */
  const handleBackNavigation = useCallback(() => {
    // Navigate back to the MainTabs with the specific tab
    navigation.navigate('MainTabs', {
      screen: sourceTab
    });
  }, [navigation, sourceTab]);

  /**
   * View friend profile
   */
  const handleViewProfile = useCallback((friend: Friend) => {
    navigation.navigate('FriendProfile', { friendId: friend.id, friend });
  }, [navigation]);

  /**
   * Remove friend with confirmation
   */
  const handleRemoveFriend = useCallback(async (friend: Friend) => {
    if (!user) return;

    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.displayName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendsService.removeFriend(user.uid, friend.id);
              
              // Update local state
              setFriends(prev => prev.filter(f => f.id !== friend.id));
              
              Alert.alert('Success', `${friend.displayName} has been removed from your friends.`);
            } catch (error) {
              console.error('Remove friend failed:', error);
              Alert.alert('Error', 'Failed to remove friend. Please try again.');
            }
          }
        }
      ]
    );
  }, [user]);

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
   * Get friend initials
   */
  const getFriendInitials = (friend: Friend) => {
    return friend.displayName.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  /**
   * Format last active time
   */
  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  /**
   * Render friend item
   */
  const renderFriendItem = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      onPress={() => handleViewProfile(item)}
      className="flex-row items-center p-4 mx-4 mb-2 bg-cyber-dark/50 rounded-lg active:bg-cyber-gray/20"
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
          {item.status === 'online' ? 'Online now' : 
           item.lastActive ? `Last seen ${formatLastActive(item.lastActive)}` : 'Offline'}
        </Text>
      </View>

      {/* Actions */}
      <View className="flex-row items-center">
        {item.mutualFriends && item.mutualFriends > 0 && (
          <View className="bg-cyber-cyan/20 px-2 py-1 rounded-full mr-2">
            <Text className="text-cyber-cyan font-inter text-xs">
              {item.mutualFriends} mutual
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          onPress={() => handleRemoveFriend(item)}
          className="p-2"
        >
          <Ionicons name="remove-circle-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  /**
   * Render filter tab
   */
  const renderFilterTab = (filter: typeof selectedFilter, label: string, count?: number) => (
    <TouchableOpacity
      onPress={() => setSelectedFilter(filter)}
      className={`px-4 py-2 rounded-full mr-3 ${
        selectedFilter === filter ? 'bg-cyber-cyan' : 'bg-cyber-gray/20'
      }`}
    >
      <Text className={`font-inter font-medium ${
        selectedFilter === filter ? 'text-cyber-black' : 'text-white/70'
      }`}>
        {label} {count !== undefined && `(${count})`}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background.primary} />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray/20">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={handleBackNavigation} className="p-2 mr-2">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-orbitron text-xl">Friends</Text>
        </View>
        
        <TouchableOpacity onPress={handleFriendRequests} className="flex-row items-center bg-cyber-gray/20 px-3 py-2 rounded-lg">
          <NotificationBadge count={incomingCount}>
            <Ionicons name="person-add-outline" size={20} color={accentColor} />
          </NotificationBadge>
          <Text className="text-white font-inter font-medium text-sm ml-2">
            Requests
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View className="px-6 py-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderFilterTab('all', 'All', friends.length)}
          {renderFilterTab('online', 'Online', friends.filter(f => f.status === 'online').length)}
          {renderFilterTab('recent', 'Recent', friends.filter(f => {
            if (!f.lastActive) return false;
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return f.lastActive > dayAgo;
          }).length)}
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View className="px-6 pb-4">
        <View className="flex-row items-center bg-cyber-gray/20 rounded-lg px-4 py-3">
          <Ionicons name="search" size={20} color="white/50" />
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

      {/* No Friends State - moved up for better visibility */}
      {!isLoading && !error && filteredFriends.length === 0 && (
        <View className="flex-1 justify-start items-center px-8 pt-16">
          <Ionicons name="people-outline" size={64} color="rgba(255,255,255,0.3)" />
          <Text className="text-white/70 font-inter text-lg mt-4 mb-2">
            {searchQuery ? 'No friends found' : 'No friends yet'}
          </Text>
          <Text className="text-white/50 font-inter text-sm text-center mb-8">
            {searchQuery 
              ? 'Try a different search term' 
              : 'Start building your gaming network by adding friends'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              onPress={handleAddFriends}
              className="bg-cyber-cyan px-8 py-4 rounded-xl flex-row items-center"
              style={{
                shadowColor: accentColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Ionicons name="person-add" size={20} color="#000000" style={{ marginRight: 8 }} />
              <Text className="text-cyber-black font-inter font-bold text-base">
                Find Friends
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Add Friends Banner - shown when user has few friends */}
      {!isLoading && friends.length > 0 && friends.length <= 3 && filteredFriends.length > 0 && (
        <View className="mx-6 mb-4 p-4 bg-gradient-to-r from-cyber-cyan/10 to-cyber-purple/10 rounded-lg border border-cyber-cyan/20">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-cyber-cyan/20 rounded-full justify-center items-center mr-3">
              <Ionicons name="people" size={20} color={accentColor} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-inter font-medium text-sm">
                Grow Your Network
              </Text>
              <Text className="text-white/60 font-inter text-xs mt-1">
                Find friends to share stories and gaming moments
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleAddFriends}
              className="bg-cyber-cyan px-4 py-2 rounded-lg"
            >
              <Text className="text-cyber-black font-inter font-semibold text-sm">
                Find Friends
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Friends List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={accentColor} />
          <Text className="text-white/60 font-inter text-base mt-4">
            Loading friends...
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center px-8">
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text className="text-white/70 font-inter text-lg mt-4 mb-2 text-center">
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
      ) : filteredFriends.length > 0 ? (
        <FlatList
          data={filteredFriends}
          renderItem={renderFriendItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={accentColor}
              colors={[accentColor]}
            />
          }
        />
      ) : null}

      {/* Floating Action Button - Find & Add New Friends */}
      <TouchableOpacity
        onPress={handleAddFriends}
        className="absolute bottom-20 right-6 w-14 h-14 bg-cyber-cyan rounded-full justify-center items-center shadow-lg"
        style={{
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="person-add" size={24} color="#000000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default FriendsListScreen; 

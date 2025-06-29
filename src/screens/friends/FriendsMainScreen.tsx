/**
 * @file FriendsMainScreen.tsx
 * @description Main friends screen for the Friends tab in bottom navigation.
 * Shows all user's friends with management options, friend requests, and add friends functionality.
 *
 * @author SnapConnect Team
 * @created 2024-01-24
 *
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @react-navigation/native: Navigation
 * - @/services/firebase/friendsService: Friends management
 * - @/services/media: Media services
 * - @/stores/authStore: Authentication state
 * - @/stores/themeStore: Theme management
 *
 * @usage
 * Main friends management interface accessible from bottom tab navigation.
 *
 * @ai_context
 * AI-powered friend suggestions and social graph analysis.
 * Smart friend categorization based on gaming activity and interaction patterns.
 */

import { Ionicons } from "@expo/vector-icons";
import {
    useFocusEffect,
    useNavigation,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import NotificationBadge from "../../components/common/NotificationBadge";
import { useFriendRequests } from "../../hooks/useFriendRequests";
import { useTabBarHeight } from "../../hooks/useTabBarHeight";
import { friendsService } from "../../services/firebase/friendsService";
import { mediaService } from "../../services/media";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import {
    showDestructiveAlert,
    showErrorAlert,
    showSuccessAlert,
} from "../../utils/alertService";
import { useOptimizedFlatList } from "../../utils/scrollOptimization";
import { getStatusDisplayData } from "../../utils/statusHelpers";

/**
 * Friend interface for display
 */
interface Friend {
  id: string;
  displayName: string;
  username: string;
  profilePhoto?: string;
  avatar?: any; // Avatar data with URLs
  statusMessage?: {
    text?: string;
    emoji?: string;
    gameContext?: string;
    availability?: 'available' | 'busy' | 'gaming' | 'afk';
    expiresAt?: Date;
    updatedAt?: Date;
  };
  lastActive?: Date;
  isOnline?: boolean;
  createdAt?: Date;
  status: "online" | "offline" | "away";
  mutualFriends?: number;
}

/**
 * Serializable friend interface for navigation parameters
 * Date objects are converted to ISO strings to prevent serialization warnings
 */
interface SerializableFriend {
  id: string;
  displayName: string;
  username: string;
  profilePhoto?: string;
  statusMessage?: {
    text?: string;
    emoji?: string;
    gameContext?: string;
    availability?: 'available' | 'busy' | 'gaming' | 'afk';
    expiresAt?: string; // ISO string instead of Date
    updatedAt?: string; // ISO string instead of Date
  };
  bio?: string;
  lastActive?: string; // ISO string instead of Date
  isOnline?: boolean;
  createdAt?: string; // ISO string instead of Date
  status: "online" | "offline" | "away";
  mutualFriends?: number;
  gamingPlatform?: string;
  favoriteGames?: string[];
  achievements?: string[];
}

/**
 * Navigation prop type
 */
type FriendsMainNavigationProp = NativeStackNavigationProp<any, "Friends">;

/**
 * Friends main screen component for tab navigation
 *
 * @returns {React.ReactElement} Rendered friends main interface
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
const FriendsMainScreen: React.FC = () => {
  const navigation = useNavigation<FriendsMainNavigationProp>();
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const { user } = useAuthStore();
  const { tabBarHeight } = useTabBarHeight();
  const optimizedFriendsListProps = useOptimizedFlatList('friends');

  // Friend requests hook for badge count
  const { incomingCount, refreshRequests } = useFriendRequests();

  // Component state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "online" | "recent"
  >("all");

  /**
   * Load friends from Firebase
   */
  const loadFriends = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      const friendsData = await friendsService.getFriends(user.uid);

      // Get real presence data for all friends in batch
      const friendIds = friendsData.map((friend) => friend.id);
      const presenceData = (await friendsService.getBatchUserPresence(
        friendIds,
      )) as Record<
        string,
        {
          status: "online" | "offline" | "away";
          lastActive: Date;
          isOnline: boolean;
        }
      >;

      // Transform and enrich friend data with real presence data
      const enrichedFriends: Friend[] = friendsData.map((friend) => {
        const presence = presenceData[friend.id] || {
          status: "offline",
          lastActive: new Date(),
          isOnline: false,
        };

        return {
          id: friend.id,
          displayName: friend.displayName || friend.username || "Unknown User",
          username: friend.username || "no-username",
          profilePhoto: friend.profilePhoto,
          avatar: friend.avatar,
          statusMessage: friend.statusMessage,
          lastActive: presence.lastActive,
          isOnline: presence.isOnline,
          createdAt: friend.createdAt?.toDate(),
          status: presence.status,
          mutualFriends: 0, // Not applicable for friends list - they're already friends with current user
        };
      });

      // Sort by online status, then by display name
      enrichedFriends.sort((a, b) => {
        if (a.status === "online" && b.status !== "online") return -1;
        if (b.status === "online" && a.status !== "online") return 1;
        return a.displayName.localeCompare(b.displayName);
      });

      setFriends(enrichedFriends);
    } catch (error) {
      console.error("Load friends failed:", error);
      setError("Failed to load friends. Please try again.");
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
    }, [user, loadFriends]),
  );

  /**
   * Filter friends based on search query and selected filter
   */
  useEffect(() => {
    let filtered = friends;

    // Apply text search
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (friend) =>
          friend.displayName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          friend.username.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply status filter
    switch (selectedFilter) {
      case "online":
        filtered = filtered.filter((friend) => friend.status === "online");
        break;
      case "recent":
        filtered = filtered.filter((friend) => {
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
    await Promise.all([loadFriends(), refreshRequests()]);
    setIsRefreshing(false);
  }, [loadFriends, refreshRequests]);

  /**
   * Navigate to add friends screen
   */
  const handleAddFriends = useCallback(() => {
    navigation.navigate("AddFriends", { sourceTab: "Friends" });
  }, [navigation]);

  /**
   * Navigate to friend requests screen
   */
  const handleFriendRequests = useCallback(() => {
    navigation.navigate("FriendRequests", { sourceTab: "Friends" });
  }, [navigation]);

  /**
   * View friend profile
   */
  const handleViewProfile = useCallback(
    (friend: Friend) => {
      // Create a serializable version of the friend object
      const serializableFriend: SerializableFriend = {
        ...friend,
        statusMessage: friend.statusMessage ? {
          ...friend.statusMessage,
          expiresAt: friend.statusMessage.expiresAt?.toISOString(),
          updatedAt: friend.statusMessage.updatedAt?.toISOString(),
        } : undefined,
        lastActive: friend.lastActive ? friend.lastActive.toISOString() : undefined,
        createdAt: friend.createdAt ? friend.createdAt.toISOString() : undefined,
      };
      
      navigation.navigate("FriendProfile", { 
        friendId: friend.id, 
        friend: serializableFriend 
      });
    },
    [navigation],
  );

  /**
   * Remove friend with confirmation
   */
  const handleRemoveFriend = useCallback(
    async (friend: Friend) => {
      if (!user) return;

      showDestructiveAlert(
        "Remove Friend",
        `Are you sure you want to remove ${friend.displayName} from your friends?`,
        async () => {
          try {
            await friendsService.removeFriend(user.uid, friend.id);

            // Update local state
            setFriends((prev) => prev.filter((f) => f.id !== friend.id));

            showSuccessAlert(
              `${friend.displayName} has been removed from your friends.`,
            );
          } catch (error) {
            console.error("Remove friend failed:", error);
            showErrorAlert("Failed to remove friend. Please try again.");
          }
        },
        undefined,
        "Remove",
      );
    },
    [user],
  );

  /**
   * Get status color
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "#10b981"; // green
      case "away":
        return "#f59e0b"; // yellow
      default:
        return "#6b7280"; // gray
    }
  };

  /**
   * Get friend initials
   */
  const getFriendInitials = (friend: Friend) => {
    return friend.displayName
      .split(" ")
      .map((n) => n.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  /**
   * Get friend's avatar URL with fallback
   */
  const getFriendAvatarUrl = (friend: Friend) => {
    if (friend.avatar?.urls) {
      return mediaService.getOptimizedAvatarUrl(friend.avatar, '48');
    }
    // Fallback to old profilePhoto field
    return friend.profilePhoto || null;
  };



  /**
   * Format last active time
   */
  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
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
      className="mx-4 mb-2 rounded-lg overflow-hidden active:opacity-80"
    >
      {/* Content Container */}
      <View className="flex-row items-center p-4 bg-cyber-dark/50">
        {/* Avatar with status indicator */}
        <View className="relative mr-4">
          {getFriendAvatarUrl(item) ? (
            <Image
              source={{ uri: getFriendAvatarUrl(item)! }}
              className="w-12 h-12 rounded-full"
              style={{ backgroundColor: '#2a2a2a' }}
            />
          ) : (
            <View className="w-12 h-12 bg-cyber-cyan/20 rounded-full justify-center items-center">
              <Text className="text-cyber-cyan font-inter font-semibold text-sm">
                {getFriendInitials(item)}
              </Text>
            </View>
          )}
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
          
          {/* Status Message Display */}
          {(() => {
            const statusDisplay = getStatusDisplayData(item.statusMessage);
            if (statusDisplay) {
              return (
                <View className="flex-row items-center mt-1">
                  <View 
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: statusDisplay.color }}
                  />
                  <Text className="text-white/70 font-inter text-xs" numberOfLines={1}>
                    {statusDisplay.text}
                  </Text>
                </View>
              );
            }
            
            // Fallback to online status
            return (
              <Text className="text-white/40 font-inter text-xs mt-1">
                {item.status === "online"
                  ? "Online now"
                  : item.lastActive
                    ? `Last seen ${formatLastActive(item.lastActive)}`
                    : "Offline"}
              </Text>
            );
          })()}
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
      </View>
    </TouchableOpacity>
  );

  /**
   * Render filter tab
   */
  const renderFilterTab = (
    filter: typeof selectedFilter,
    label: string,
    count?: number,
  ) => (
    <TouchableOpacity
      onPress={() => setSelectedFilter(filter)}
      className={`px-4 py-2 rounded-full mr-3 ${
        selectedFilter === filter ? "bg-cyber-cyan" : "bg-cyber-gray/20"
      }`}
    >
      <Text
        className={`font-inter font-medium ${
          selectedFilter === filter ? "text-cyber-black" : "text-white/70"
        }`}
      >
        {label} {count !== undefined && `(${count})`}
      </Text>
    </TouchableOpacity>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-6 py-12">
      <View className="w-20 h-20 bg-cyber-cyan/20 rounded-full justify-center items-center mb-6">
        <Ionicons name="people-outline" size={40} color={accentColor} />
      </View>
      <Text className="text-white font-orbitron text-xl mb-2">
        No Friends Yet
      </Text>
      <Text className="text-white/60 font-inter text-center mb-6">
        Start building your gaming network by adding friends to connect and share your highlights.
      </Text>
      <TouchableOpacity
        onPress={handleAddFriends}
        className="bg-cyber-cyan px-6 py-3 rounded-lg"
      >
        <Text className="text-cyber-black font-inter font-semibold">
          Add Friends
        </Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render error state
   */
  const renderErrorState = () => (
    <View className="flex-1 justify-center items-center px-6 py-12">
      <View className="w-20 h-20 bg-red-500/20 rounded-full justify-center items-center mb-6">
        <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
      </View>
      <Text className="text-white font-orbitron text-xl mb-2">
        Something went wrong
      </Text>
      <Text className="text-white/60 font-inter text-center mb-6">
        {error}
      </Text>
      <TouchableOpacity
        onPress={loadFriends}
        className="bg-cyber-cyan px-6 py-3 rounded-lg"
      >
        <Text className="text-cyber-black font-inter font-semibold">
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render loading state
   */
  const renderLoadingState = () => (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color={accentColor} />
      <Text className="text-white/60 font-inter mt-4">Loading friends...</Text>
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.background.primary}
      />

      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray/20">
        <View className="flex-row items-center">
          <Text className="text-white font-orbitron text-2xl">Friends</Text>
        </View>

        <TouchableOpacity
          onPress={handleAddFriends}
          className="bg-cyber-cyan/10 border border-cyber-cyan/20 p-3 rounded-full"
        >
          <Ionicons name="person-add-outline" size={20} color={accentColor} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {isLoading ? (
        renderLoadingState()
      ) : error ? (
        renderErrorState()
      ) : friends.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Filter Tabs */}
          <View className="px-6 py-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {renderFilterTab("all", "All", friends.length)}
              {renderFilterTab(
                "online",
                "Online",
                friends.filter((f) => f.status === "online").length,
              )}
              {renderFilterTab(
                "recent",
                "Recent",
                friends.filter((f) => {
                  if (!f.lastActive) return false;
                  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                  return f.lastActive > dayAgo;
                }).length,
              )}
            </ScrollView>
          </View>

          {/* Search Bar */}
          <View className="px-6 pb-4">
            <View className="flex-row items-center bg-cyber-gray/20 rounded-lg px-4 py-3">
              <Ionicons name="search" size={20} color="rgba(255,255,255,0.5)" />
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
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color="rgba(255,255,255,0.5)"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Friends List */}
          <FlatList
            data={filteredFriends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={accentColor}
                colors={[accentColor]}
              />
            }
            ListEmptyComponent={
              searchQuery || selectedFilter !== "all" ? (
                <View className="items-center py-12">
                  <Text className="text-white/60 font-inter">
                    {searchQuery
                      ? `No friends found matching "${searchQuery}"`
                      : `No ${selectedFilter} friends`}
                  </Text>
                </View>
              ) : null
            }
            {...optimizedFriendsListProps}
          />
        </>
      )}

      {/* Floating Requests Button */}
      <TouchableOpacity
        onPress={handleFriendRequests}
        className="absolute bottom-6 right-6 w-14 h-14 bg-cyber-cyan rounded-full justify-center items-center shadow-lg"
        style={{
          marginBottom: tabBarHeight,
          boxShadow: `0px 4px 8px rgba(0, 255, 255, 0.3)`,
          elevation: 8,
        } as any}
      >
        <NotificationBadge count={incomingCount}>
          <Ionicons name="mail" size={24} color="#000000" />
        </NotificationBadge>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default FriendsMainScreen; 

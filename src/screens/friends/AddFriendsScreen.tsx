/**
 * @file AddFriendsScreen.tsx
 * @description Add friends screen with user search, contact sync, and friend suggestions.
 * Allows searching for users by username/phone and sending friend requests.
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
 * Friend discovery and addition interface with multiple discovery methods.
 *
 * @ai_context
 * AI-powered friend suggestions based on gaming patterns and mutual connections.
 * Smart contact matching and recommendation algorithms.
 */

import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
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
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import { showErrorAlert, showSuccessAlert } from "../../utils/alertService";
import { GAMING_GENRES } from "../../utils/constants";

/**
 * User search result interface
 */
interface SearchUser {
  id: string;
  displayName: string;
  username: string;
  profilePhoto?: string;
  mutualFriends?: number;
  isFriend?: boolean;
  requestSent?: boolean;
  bio?: string;
  gamingPlatform?: string;
}

/**
 * Friend suggestion interface
 */
interface FriendSuggestion {
  id: string;
  displayName: string;
  username: string;
  profilePhoto?: string;
  mutualFriends: number;
  reason: "mutual" | "contact" | "gaming" | "mutual_friend";
  bio?: string;
  sharedGenres?: string[];
  similarityScore?: number;
  sharedGenreCount?: number;
}

/**
 * Navigation prop type
 */
type AddFriendsNavigationProp = NativeStackNavigationProp<any, "AddFriends">;

/**
 * Add friends screen component
 *
 * @returns {React.ReactElement} Rendered add friends interface
 *
 * @performance
 * - Debounced search for optimal API usage
 * - Lazy loading of suggestions and results
 * - Efficient friend request state management
 *
 * @ai_integration
 * - Smart friend suggestions based on gaming activity
 * - Contact analysis for potential friends
 * - Mutual friend recommendations
 */
const AddFriendsScreen: React.FC = () => {
  const navigation = useNavigation<AddFriendsNavigationProp>();
  const route = useRoute<any>();
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const { user } = useAuthStore();
  const { tabBarHeight } = useTabBarHeight();

  // Get source tab from route params
  const sourceTab = route.params?.sourceTab || "Profile";

  // Friend requests hook for badge count
  const { incomingCount } = useFriendRequests();

  // Component state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "search" | "suggestions" | "contacts"
  >("suggestions");
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(
    new Set(),
  );

  /**
   * Load friend suggestions
   */
  const loadSuggestions = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      setIsLoadingSuggestions(true);

      // Get friend suggestions from Firebase
      const suggestionsData = await friendsService.getFriendSuggestions(
        user.uid,
        [],
      );

      // Transform to display format with batch mutual friends count calculation
      const userIds = suggestionsData.map((suggestion) => suggestion.id);
      const mutualFriendsCounts =
        (await friendsService.getBatchMutualFriendsCount(
          user.uid,
          userIds,
        )) as Record<string, number>;

      const formattedSuggestions: FriendSuggestion[] = suggestionsData.map(
        (suggestion) => ({
          id: suggestion.id,
          displayName:
            suggestion.displayName || suggestion.username || "Unknown User",
          username: suggestion.username || "no-username",
          profilePhoto: suggestion.profilePhoto,
          mutualFriends: mutualFriendsCounts[suggestion.id] || 0,
          reason: suggestion.reason || "mutual",
          bio: suggestion.bio || "Gaming enthusiast • SnapConnect user",
          // Include gaming-specific properties if available
          sharedGenres: suggestion.sharedGenres,
          similarityScore: suggestion.similarityScore,
          sharedGenreCount: suggestion.sharedGenreCount,
        }),
      );

      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error("Load suggestions failed:", error);
      setError("Failed to load friend suggestions.");
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [user]);

  /**
   * Perform user search
   */
  const performSearch = useCallback(
    async (query: string) => {
      if (!user || query.length < 2) return;

      try {
        setIsSearching(true);
        setError(null);

        const results = await friendsService.searchUsers(query, user.uid);

        // Transform to display format with batch mutual friends count calculation
        const resultUserIds = results.map((result) => result.id);
        const mutualFriendsCounts =
          (await friendsService.getBatchMutualFriendsCount(
            user.uid,
            resultUserIds,
          )) as Record<string, number>;

        const formattedResults: SearchUser[] = results.map((result) => ({
          id: result.id,
          displayName: result.displayName || result.username || "Unknown User",
          username: result.username || "no-username",
          profilePhoto: result.profilePhoto,
          mutualFriends: mutualFriendsCounts[result.id] || 0,
          isFriend: false, // TODO: Check if already friends
          requestSent: false, // TODO: Check if request already sent
          bio: result.bio || "SnapConnect user",
          gamingPlatform: result.gamingPlatform,
        }));

        setSearchResults(formattedResults);
      } catch (error) {
        console.error("Search failed:", error);
        setError("Search failed. Please try again.");
      } finally {
        setIsSearching(false);
      }
    },
    [user],
  );

  /**
   * Load suggestions on component mount
   */
  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  /**
   * Debounced search effect
   */
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery.trim());
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  /**
   * Send friend request
   */
  const sendFriendRequest = useCallback(
    async (targetUser: SearchUser | FriendSuggestion) => {
      if (!user) return;

      try {
        // Add to pending requests immediately for UI feedback
        setPendingRequests((prev) => new Set(prev).add(targetUser.id));

        await friendsService.sendFriendRequest(user.uid, targetUser.id);

        showSuccessAlert(
          `Friend request sent to ${targetUser.displayName}!`,
          "Friend Request Sent",
        );

        // Update local state
        if ("reason" in targetUser) {
          // It's a suggestion - remove from suggestions
          setSuggestions((prev) => prev.filter((s) => s.id !== targetUser.id));
        } else {
          // It's a search result - mark as request sent
          setSearchResults((prev) =>
            prev.map((r) =>
              r.id === targetUser.id ? { ...r, requestSent: true } : r,
            ),
          );
        }
      } catch (error) {
        console.error("Send friend request failed:", error);
        setPendingRequests((prev) => {
          const newSet = new Set(prev);
          newSet.delete(targetUser.id);
          return newSet;
        });

        showErrorAlert("Failed to send friend request. Please try again.");
      }
    },
    [user],
  );

  /**
   * Get user initials for avatar
   */
  const getUserInitials = (user: SearchUser | FriendSuggestion) => {
    return user.displayName
      .split(" ")
      .map((n) => n.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  /**
   * Get reason color for suggestions
   */
  const getReasonColor = (reason: string) => {
    switch (reason) {
      case "mutual":
        return "#10b981"; // green
      case "contact":
        return "#3b82f6"; // blue
      case "gaming":
        return "#8b5cf6"; // purple
      default:
        return "#6b7280"; // gray
    }
  };

  /**
   * Get reason text for suggestions
   */
  const getReasonText = (suggestion: FriendSuggestion) => {
    switch (suggestion.reason) {
      case "mutual":
        return `${suggestion.mutualFriends} mutual friends`;
      case "contact":
        return "From your contacts";
      case "gaming":
        // Show shared genres if available
        if (suggestion.sharedGenres && suggestion.sharedGenres.length > 0) {
          const genreCount = suggestion.sharedGenres.length;
          return `${genreCount} shared gaming ${genreCount === 1 ? 'interest' : 'interests'}`;
        }
        return "Similar gaming interests";
      default:
        return "Suggested for you";
    }
  };

  /**
   * Format gaming genre name for display
   * @param {string} genreId - Genre ID
   * @returns {string} Formatted genre name
   */
  const formatGenreName = (genreId: string): string => {
    const genre = GAMING_GENRES[genreId.toUpperCase() as keyof typeof GAMING_GENRES];
    return genre ? genre.name : genreId.charAt(0).toUpperCase() + genreId.slice(1).toLowerCase();
  };

  /**
   * Render search result item
   */
  const renderSearchResult = ({ item }: { item: SearchUser }) => (
    <TouchableOpacity className="flex-row items-center p-4 mx-4 mb-2 bg-cyber-dark/50 rounded-lg">
      {/* Avatar */}
      <View className="w-12 h-12 bg-cyber-cyan/20 rounded-full justify-center items-center mr-4">
        <Text className="text-cyber-cyan font-inter font-semibold text-sm">
          {getUserInitials(item)}
        </Text>
      </View>

      {/* User info */}
      <View className="flex-1">
        <Text className="text-white font-inter font-medium text-base">
          {item.displayName}
        </Text>
        <Text className="text-white/60 font-inter text-sm">
          @{item.username}
        </Text>
        {item.bio && (
          <Text
            className="text-white/40 font-inter text-xs mt-1"
            numberOfLines={1}
          >
            {item.bio}
          </Text>
        )}
        {item.mutualFriends && item.mutualFriends > 0 && (
          <Text className="text-cyber-cyan font-inter text-xs mt-1">
            {item.mutualFriends} mutual friends
          </Text>
        )}
      </View>

      {/* Action button */}
      <View>
        {item.isFriend ? (
          <View className="bg-green-500/20 px-4 py-2 rounded-lg">
            <Text className="text-green-400 font-inter text-sm font-medium">
              Friends
            </Text>
          </View>
        ) : item.requestSent || pendingRequests.has(item.id) ? (
          <View className="bg-cyber-gray/20 px-4 py-2 rounded-lg">
            <Text className="text-white/60 font-inter text-sm font-medium">
              Sent
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => sendFriendRequest(item)}
            className="bg-cyber-cyan px-4 py-2 rounded-lg"
          >
            <Text className="text-cyber-black font-inter text-sm font-medium">
              Add
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  /**
   * Render suggestion item
   */
  const renderSuggestion = ({ item }: { item: FriendSuggestion }) => (
    <TouchableOpacity className="flex-row items-center p-4 mx-4 mb-2 bg-cyber-dark/50 rounded-lg">
      {/* Avatar */}
      <View className="w-12 h-12 bg-cyber-cyan/20 rounded-full justify-center items-center mr-4">
        <Text className="text-cyber-cyan font-inter font-semibold text-sm">
          {getUserInitials(item)}
        </Text>
      </View>

      {/* User info */}
      <View className="flex-1">
        <Text className="text-white font-inter font-medium text-base">
          {item.displayName}
        </Text>
        <Text className="text-white/60 font-inter text-sm">
          @{item.username}
        </Text>
        <View className="flex-row items-center mt-1">
          <View
            className="w-2 h-2 rounded-full mr-2"
            style={{ backgroundColor: getReasonColor(item.reason) }}
          />
          <Text className="text-white/40 font-inter text-xs">
            {getReasonText(item)}
          </Text>
        </View>
        {/* Show shared genres for gaming suggestions */}
        {item.reason === "gaming" && item.sharedGenres && item.sharedGenres.length > 0 && (
          <View className="mt-1">
            <Text className="text-cyber-cyan/60 font-inter text-xs">
              {item.sharedGenres.slice(0, 3).map((genre) => formatGenreName(genre)).join(" • ")}
              {item.sharedGenres.length > 3 && ` • +${item.sharedGenres.length - 3} more`}
            </Text>
          </View>
        )}
      </View>

      {/* Add button */}
      <TouchableOpacity
        onPress={() => sendFriendRequest(item)}
        disabled={pendingRequests.has(item.id)}
        className={`px-4 py-2 rounded-lg ${
          pendingRequests.has(item.id) ? "bg-cyber-gray/20" : "bg-cyber-cyan"
        }`}
      >
        <Text
          className={`font-inter text-sm font-medium ${
            pendingRequests.has(item.id) ? "text-white/60" : "text-cyber-black"
          }`}
        >
          {pendingRequests.has(item.id) ? "Sent" : "Add"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  /**
   * Render tab button
   */
  const renderTab = (
    tab: typeof activeTab,
    label: string,
    icon: string,
    count?: number,
  ) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      className={`flex-1 items-center py-3 ${
        activeTab === tab ? "border-b-2 border-cyber-cyan" : ""
      }`}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={activeTab === tab ? accentColor : "rgba(255,255,255,0.6)"}
      />
      <Text
        className={`font-inter text-sm mt-1 ${
          activeTab === tab ? "text-cyber-cyan font-medium" : "text-white/60"
        }`}
      >
        {label} {count !== undefined && `(${count})`}
      </Text>
    </TouchableOpacity>
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
          <TouchableOpacity
            onPress={() => navigation.navigate("MainTabs", { screen: sourceTab })}
            className="p-2 mr-2"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-orbitron text-xl">Add Friends</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("FriendRequests", { sourceTab })}
          className="p-2"
        >
          <NotificationBadge count={incomingCount}>
            <Ionicons name="mail-outline" size={24} color={accentColor} />
          </NotificationBadge>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row px-6 mb-4">
        {renderTab(
          "suggestions",
          "Suggestions",
          "people-outline",
          suggestions.length,
        )}
        {renderTab("search", "Search", "search-outline", searchResults.length)}
        {renderTab("contacts", "Contacts", "phone-portrait-outline")}
      </View>

      {/* Search Bar - Only show on search tab */}
      {activeTab === "search" && (
        <View className="px-6 pb-4">
          <View className="flex-row items-center bg-cyber-gray/20 rounded-lg px-4 py-3">
            <Ionicons name="search" size={20} color="white/50" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by username or phone number..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              className="flex-1 text-white font-inter ml-3"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isSearching && (
              <ActivityIndicator size="small" color={accentColor} />
            )}
          </View>
        </View>
      )}

      {/* Content */}
      <View className="flex-1">
        {activeTab === "suggestions" &&
          (isLoadingSuggestions ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={accentColor} />
              <Text className="text-white/60 font-inter text-base mt-4">
                Loading suggestions...
              </Text>
            </View>
          ) : suggestions.length > 0 ? (
            <FlatList
              data={suggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
            />
          ) : (
            <View className="flex-1 justify-center items-center px-8">
              <Ionicons
                name="people-outline"
                size={64}
                color="rgba(255,255,255,0.3)"
              />
              <Text className="text-white/70 font-inter text-lg mt-4 mb-2">
                No suggestions yet
              </Text>
              <Text className="text-white/50 font-inter text-sm text-center">
                Friend suggestions will appear here based on your activity and
                connections
              </Text>
            </View>
          ))}

        {activeTab === "search" &&
          (searchQuery.length < 2 ? (
            <View className="flex-1 justify-center items-center px-8">
              <Ionicons
                name="search-outline"
                size={64}
                color="rgba(255,255,255,0.3)"
              />
              <Text className="text-white/70 font-inter text-lg mt-4 mb-2">
                Search for Friends
              </Text>
              <Text className="text-white/50 font-inter text-sm text-center">
                Enter a username or phone number to find friends on SnapConnect
              </Text>
            </View>
          ) : isSearching ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={accentColor} />
              <Text className="text-white/60 font-inter text-base mt-4">
                Searching...
              </Text>
            </View>
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
            />
          ) : (
            <View className="flex-1 justify-center items-center px-8">
              <Ionicons
                name="search-outline"
                size={64}
                color="rgba(255,255,255,0.3)"
              />
              <Text className="text-white/70 font-inter text-lg mt-4 mb-2">
                No users found
              </Text>
              <Text className="text-white/50 font-inter text-sm text-center">
                Try searching with a different username or phone number
              </Text>
            </View>
          ))}

        {activeTab === "contacts" && (
          <View className="flex-1 justify-center items-center px-8">
            <Ionicons
              name="phone-portrait-outline"
              size={64}
              color="rgba(255,255,255,0.3)"
            />
            <Text className="text-white/70 font-inter text-lg mt-4 mb-2">
              Contact Sync Coming Soon
            </Text>
            <Text className="text-white/50 font-inter text-sm text-center mb-6">
              Sync your contacts to find friends who are already on SnapConnect
            </Text>
            <TouchableOpacity className="bg-cyber-cyan/20 px-6 py-3 rounded-lg">
              <Text className="text-cyber-cyan font-inter font-semibold">
                Enable Contact Sync
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Error Display */}
      {error && (
        <View
          className="absolute left-4 right-4 bg-red-500/20 border border-red-500 rounded-lg p-3"
          style={{
            bottom: tabBarHeight + 8,
          }}
        >
          <Text className="text-red-400 font-inter text-center">{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default AddFriendsScreen;

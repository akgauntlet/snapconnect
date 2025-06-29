/**
 * @file FriendProfileScreen.tsx
 * @description Friend profile viewing screen with detailed user information and friendship management.
 * Allows viewing friend details, gaming stats, and managing the friendship relationship.
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
 * Friend profile interface accessible from friends list and friend requests.
 *
 * @ai_context
 * AI-powered friendship analytics and interaction insights.
 * Gaming compatibility analysis and shared interests.
 */

import { Ionicons } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { friendsService } from "../../services/firebase/friendsService";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import {
    showDestructiveAlert,
    showErrorAlert,
    showSuccessAlert,
} from "../../utils/alertService";
import { GAMING_GENRES } from "../../utils/constants";

/**
 * Friend profile interface
 */
interface FriendProfile {
  id: string;
  displayName: string;
  username: string;
  profilePhoto?: string;
  bio?: string;
  joinedDate?: Date;
  lastActive?: Date;
  isOnline?: boolean;
  mutualFriends?: number;
  totalFriends?: number;
  snapsSent?: number;
  snapsReceived?: number;
  streaks?: number;
  gamingPlatform?: string;
  favoriteGames?: string[];
  gamingInterests?: string[];
  achievements?: string[];
  status: "online" | "offline" | "away";
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
  bio?: string;
  lastActive?: string; // ISO string instead of Date
  isOnline?: boolean;
  createdAt?: string; // ISO string instead of Date
  status: "online" | "offline" | "away";
  mutualFriends?: number;
  gamingPlatform?: string;
  favoriteGames?: string[];
  gamingInterests?: string[];
  achievements?: string[];
}

/**
 * Friendship status type - updated to match service response
 */
type FriendshipStatus =
  | "friends"
  | "pending_sent"
  | "pending_received"
  | "none"
  | "self";

/**
 * Navigation prop types
 */
type FriendProfileNavigationProp = NativeStackNavigationProp<
  any,
  "FriendProfile"
>;
type FriendProfileRouteProp = RouteProp<
  {
    FriendProfile: {
      friendId: string;
      friend?: SerializableFriend;
      isRequest?: boolean;
    };
  },
  "FriendProfile"
>;

/**
 * Friend profile screen component
 *
 * @returns {React.ReactElement} Rendered friend profile interface
 *
 * @performance
 * - Efficient profile data loading and caching
 * - Optimized image loading for profile photos
 * - Smart data refresh and real-time status updates
 *
 * @ai_integration
 * - Gaming compatibility analysis
 * - Shared interest recommendations
 * - Friendship quality insights
 */
const FriendProfileScreen: React.FC = () => {
  const navigation = useNavigation<FriendProfileNavigationProp>();
  const route = useRoute<FriendProfileRouteProp>();
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const { user } = useAuthStore();

  const { friendId, friend: initialFriend } = route.params;

  // Component state
  const [friendProfile, setFriendProfile] = useState<FriendProfile | null>(
    null,
  );
  const [friendshipStatus, setFriendshipStatus] =
    useState<FriendshipStatus>("none");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Helper function to safely convert Firestore timestamp or Date to Date object
   */
  const safeToDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();

    // If it's already a Date object, return it
    if (dateValue instanceof Date) {
      return dateValue;
    }

    // If it's a Firestore Timestamp with toDate method
    if (dateValue && typeof dateValue.toDate === "function") {
      return dateValue.toDate();
    }

    // If it's a timestamp number
    if (typeof dateValue === "number") {
      return new Date(dateValue);
    }

    // If it's a string that can be parsed
    if (typeof dateValue === "string") {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }

    // Fallback to current date
    return new Date();
  };

  /**
   * Helper function to get genre data from constants
   * @param genreId - Genre ID to look up
   * @returns Genre data object or null
   */
  const getGenreData = (genreId: string) => {
    const genreKey = genreId.toUpperCase();
    return GAMING_GENRES[genreKey as keyof typeof GAMING_GENRES] || null;
  };

  /**
   * Load friend profile data - enhanced to handle all scenarios
   */
  const loadFriendProfile = useCallback(async () => {
    try {
      setError(null);

      if (!user) {
        setError("Authentication required to view profiles.");
        setIsLoading(false);
        return;
      }

      // If we have initial friend data, use optimized path but also fetch full profile for fresh data
      if (initialFriend) {
        // Get real data in parallel for better performance
        const [
          userProfileData,
          mutualFriendsCount,
          friendIds,
          userStats,
          userPresence,
        ] = await Promise.all([
          friendsService.getUserProfile(initialFriend.id),
          friendsService.getMutualFriendsCount(user.uid, initialFriend.id),
          friendsService.getFriendIds(initialFriend.id),
          friendsService.getUserStats(initialFriend.id),
          friendsService.getUserPresence(initialFriend.id),
        ]);

        const fullUserProfile = { ...initialFriend, ...userProfileData };

        // Type assertions for Firebase data
        const stats = userStats as {
          snapsSent?: number;
          snapsReceived?: number;
          streaks?: number;
          storiesShared?: number;
          joinedDate?: Date;
          lastActive?: Date;
        };

        const presence = userPresence as {
          status: "online" | "offline" | "away";
          lastActive: Date;
          isOnline: boolean;
        };

        const enrichedProfile: FriendProfile = {
          id: fullUserProfile.id,
          displayName: fullUserProfile.displayName || "Unknown User",
          username: fullUserProfile.username || "no-username",
          profilePhoto: fullUserProfile.profilePhoto,
          bio: fullUserProfile.bio || "Gaming enthusiast • SnapConnect user",
          joinedDate:
            safeToDate(fullUserProfile.createdAt) ||
            stats.joinedDate ||
            new Date(),
          lastActive: presence.lastActive,
          isOnline: presence.isOnline,
          mutualFriends: mutualFriendsCount,
          totalFriends: friendIds.length,
          snapsSent: stats.snapsSent || 0,
          snapsReceived: stats.snapsReceived || 0,
          streaks: stats.streaks || 0,
          gamingPlatform: fullUserProfile.gamingPlatform || "Multiple Platforms",
          favoriteGames: fullUserProfile.favoriteGames || [],
          gamingInterests: fullUserProfile.gamingInterests || [],
          achievements: fullUserProfile.achievements || [],
          status: presence.status,
        };

        setFriendProfile(enrichedProfile);
      } else {
        // Fallback: fetch complete profile using new enriched method
        const enrichedProfileData = await friendsService.getEnrichedUserProfile(
          user.uid,
          friendId,
        );

        if (!enrichedProfileData) {
          setError("User profile not found.");
          setIsLoading(false);
          return;
        }

        // Type assertion for the enriched profile data
        const enrichedProfile = enrichedProfileData as any;

        // Transform enriched profile to match our interface
        const transformedProfile: FriendProfile = {
          id: enrichedProfile.id,
          displayName: enrichedProfile.displayName || "Unknown User",
          username: enrichedProfile.username || "no-username",
          profilePhoto: enrichedProfile.profilePhoto,
          bio: enrichedProfile.bio || "Gaming enthusiast • SnapConnect user",
          joinedDate: safeToDate(enrichedProfile.joinedDate),
          lastActive: safeToDate(enrichedProfile.lastActive),
          isOnline: enrichedProfile.isOnline || false,
          mutualFriends: enrichedProfile.mutualFriends || 0,
          totalFriends: enrichedProfile.totalFriends || 0,
          snapsSent: enrichedProfile.snapsSent || 0,
          snapsReceived: enrichedProfile.snapsReceived || 0,
          streaks: enrichedProfile.streaks || 0,
          gamingPlatform:
            enrichedProfile.gamingPlatform || "Multiple Platforms",
          favoriteGames: enrichedProfile.favoriteGames || [],
          gamingInterests: enrichedProfile.gamingInterests || [],
          achievements: enrichedProfile.achievements || [],
          status: enrichedProfile.status || "offline",
        };

        setFriendProfile(transformedProfile);

        // Set friendship status from enriched data
        if (enrichedProfile.friendshipStatus) {
          setFriendshipStatus(enrichedProfile.friendshipStatus);
        }
      }
    } catch (error) {
      console.error("❌ Load friend profile failed:", error);
      setError(
        "Failed to load friend profile. Please check your connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [initialFriend, friendId, user]);

  /**
   * Check friendship status - enhanced to use new service method
   */
  const checkFriendshipStatus = useCallback(async () => {
    if (!user || user.uid === friendId) {
      setFriendshipStatus("self");
      return;
    }

    try {
      // Use the new enhanced friendship status check
      const status = await friendsService.checkFriendshipStatus(
        user.uid,
        friendId,
      );

      // Map service status to component status
      switch (status) {
        case "friends":
          setFriendshipStatus("friends");
          break;
        case "pending_sent":
          setFriendshipStatus("pending_sent");
          break;
        case "pending_received":
          setFriendshipStatus("pending_received");
          break;
        case "none":
        default:
          setFriendshipStatus("none");
          break;
      }
    } catch (error) {
      console.error("❌ Check friendship status failed:", error);
      // Default to none if check fails
      setFriendshipStatus("none");
    }
  }, [user, friendId]);

  /**
   * Load friend profile on component mount
   */
  useEffect(() => {
    loadFriendProfile();
    checkFriendshipStatus();
  }, [loadFriendProfile, checkFriendshipStatus]);

  /**
   * Send friend request
   */
  const sendFriendRequest = useCallback(async () => {
    if (!user || !friendProfile) return;

    try {
      setIsProcessing(true);
      await friendsService.sendFriendRequest(user.uid, friendId);
      setFriendshipStatus("pending_sent");

      showSuccessAlert(
        `Friend request sent to ${friendProfile.displayName}!`,
        "Friend Request Sent",
      );
    } catch (error) {
      console.error("Send friend request failed:", error);
      showErrorAlert("Failed to send friend request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [user, friendId, friendProfile]);

  /**
   * Remove friend
   */
  const removeFriend = useCallback(async () => {
    if (!user || !friendProfile) return;

    showDestructiveAlert(
      "Remove Friend",
      `Are you sure you want to remove ${friendProfile.displayName} from your friends?`,
      async () => {
        try {
          setIsProcessing(true);
          await friendsService.removeFriend(user.uid, friendId);
          setFriendshipStatus("none");

          showSuccessAlert(
            `${friendProfile.displayName} has been removed from your friends.`,
            "Friend Removed",
          );
        } catch (error) {
          console.error("Remove friend failed:", error);
          showErrorAlert("Failed to remove friend. Please try again.");
        } finally {
          setIsProcessing(false);
        }
      },
      undefined,
      "Remove",
    );
  }, [user, friendId, friendProfile]);

  /**
   * Send message to friend
   */
  const sendMessage = useCallback(() => {
    if (!user || !friendProfile) return;

    // Create conversation ID using the messaging service pattern
    const conversationId = `${[user.uid, friendId].sort().join("_")}`;
    
    // Navigate directly to Chat screen with the friend's information
    navigation.navigate("Chat", {
      conversationId: conversationId,
      friendId: friendId,
      friendName: friendProfile.displayName,
    });
  }, [navigation, friendId, friendProfile, user]);

  /**
   * Accept friend request
   */
  const acceptFriendRequest = useCallback(async () => {
    if (!user || !friendProfile) return;

    try {
      setIsProcessing(true);

      // Find the pending request to get the request ID
      const pendingRequests = await friendsService.getPendingFriendRequests(
        user.uid,
      );
      const incomingRequest = pendingRequests.find(
        (req) => req.type === "incoming" && req.fromUserId === friendId,
      );

      if (incomingRequest) {
        await friendsService.acceptFriendRequest(incomingRequest.id, user.uid);
        setFriendshipStatus("friends");

        showSuccessAlert(
          `You and ${friendProfile.displayName} are now friends!`,
          "Friend Request Accepted",
        );
      } else {
        showErrorAlert("Friend request not found. It may have been cancelled.");
      }
    } catch (error) {
      console.error("Accept friend request failed:", error);
      showErrorAlert("Failed to accept friend request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [user, friendId, friendProfile]);

  /**
   * Decline friend request
   */
  const declineFriendRequest = useCallback(async () => {
    if (!user || !friendProfile) return;

    showDestructiveAlert(
      "Decline Friend Request",
      `Are you sure you want to decline the friend request from ${friendProfile.displayName}?`,
      async () => {
        try {
          setIsProcessing(true);

          // Find the pending request to get the request ID
          const pendingRequests = await friendsService.getPendingFriendRequests(
            user.uid,
          );
          const incomingRequest = pendingRequests.find(
            (req) => req.type === "incoming" && req.fromUserId === friendId,
          );

          if (incomingRequest) {
            await friendsService.declineFriendRequest(
              incomingRequest.id,
              user.uid,
            );
            setFriendshipStatus("none");

            showSuccessAlert(
              `Friend request from ${friendProfile.displayName} has been declined.`,
            );
          } else {
            showErrorAlert(
              "Friend request not found. It may have been cancelled.",
            );
          }
        } catch (error) {
          console.error("Decline friend request failed:", error);
          showErrorAlert("Failed to decline friend request. Please try again.");
        } finally {
          setIsProcessing(false);
        }
      },
      undefined,
      "Decline",
    );
  }, [user, friendId, friendProfile]);

  /**
   * Get user initials
   */
  const getUserInitials = () => {
    if (!friendProfile) return "UN";
    return friendProfile.displayName
      .split(" ")
      .map((n) => n.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

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
   * Format join date
   */
  const formatJoinDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  /**
   * Format last active
   */
  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Active now";
    if (diffMins < 60) return `Active ${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Active ${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `Active ${diffDays}d ago`;
  };

  /**
   * Render stat item
   */
  const renderStatItem = (
    label: string,
    value: string | number,
    icon: string,
    color?: string,
  ) => (
    <View 
      className="bg-cyber-dark/40 border border-white/10 p-4 rounded-xl flex-1 items-center"
      style={{
        shadowColor: color || accentColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}
    >
      <View 
        className="w-12 h-12 rounded-full justify-center items-center mb-3"
        style={{ backgroundColor: (color || accentColor) + '20' }}
      >
        <Ionicons name={icon as any} size={24} color={color || accentColor} />
      </View>
      <Text className="text-white font-inter font-bold text-xl mb-1">
        {value}
      </Text>
      <Text className="text-white/60 font-inter text-sm text-center">
        {label}
      </Text>
    </View>
  );

  /**
   * Render enhanced profile avatar with glow effects
   */
  const renderProfileAvatar = () => {
    if (!friendProfile) return null;

    const statusColor = getStatusColor(friendProfile.status);
    
    return (
      <View className="relative mb-6">
        {/* Glow Effect Background */}
        <View 
          className="absolute inset-0 w-32 h-32 rounded-full opacity-20"
          style={{
            backgroundColor: statusColor,
            transform: [{ scale: 1.2 }],
            shadowColor: statusColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 20,
          }}
        />
        
        {/* Main Avatar */}
        <View className="w-32 h-32 rounded-full border-4 border-white/20 overflow-hidden">
          {friendProfile.profilePhoto ? (
            <Image
              source={{ uri: friendProfile.profilePhoto }}
              className="w-full h-full"
              onError={() => {
                console.warn(
                  "Failed to load profile photo for:",
                  friendProfile.displayName,
                );
              }}
            />
          ) : (
            <View className="w-full h-full bg-cyber-cyan/20 justify-center items-center">
              <Text className="text-cyber-cyan font-inter font-bold text-3xl">
                {getUserInitials()}
              </Text>
            </View>
          )}
        </View>
        
        {/* Enhanced Status Indicator */}
        <View className="absolute -bottom-2 -right-2">
          <View
            className="w-8 h-8 rounded-full border-4 border-cyber-black flex items-center justify-center"
            style={{ backgroundColor: statusColor }}
          >
            <View 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: 'white', opacity: 0.9 }}
            />
          </View>
        </View>
      </View>
    );
  };

  /**
   * Render enhanced action buttons with better styling
   */
  const renderActionButton = () => {
    if (isProcessing) {
      return (
        <View className="bg-cyber-gray/30 border border-cyber-gray/50 px-6 py-4 rounded-xl flex-row items-center justify-center">
          <ActivityIndicator size="small" color={accentColor} />
          <Text className="text-white/60 font-inter font-medium ml-2">
            Processing...
          </Text>
        </View>
      );
    }

    switch (friendshipStatus) {
      case "self":
        return (
          <View className="bg-cyber-dark/50 border border-cyber-cyan/30 px-6 py-4 rounded-xl">
            <Text className="text-cyber-cyan font-inter font-medium text-center">
              This is your profile
            </Text>
          </View>
        );

      case "friends":
        return (
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={sendMessage}
              className="flex-1 bg-cyber-cyan px-6 py-4 rounded-xl flex-row items-center justify-center shadow-lg"
              style={{
                shadowColor: '#00ffff',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <Ionicons name="chatbubble" size={20} color="#0a0a0a" />
              <Text className="text-cyber-black font-inter font-bold ml-2">
                Message
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={removeFriend}
              className="bg-red-500/20 border border-red-500/30 px-4 py-4 rounded-xl"
            >
              <Ionicons name="person-remove" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        );

      case "pending_sent":
        return (
          <View className="bg-amber-500/20 border border-amber-500/30 px-6 py-4 rounded-xl">
            <Text className="text-amber-400 font-inter font-medium text-center">
              Friend Request Sent
            </Text>
          </View>
        );

      case "pending_received":
        return (
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={acceptFriendRequest}
              className="flex-1 bg-green-500/20 border border-green-500/30 px-6 py-4 rounded-xl flex-row items-center justify-center"
            >
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text className="text-green-400 font-inter font-semibold ml-2">
                Accept
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={declineFriendRequest}
              className="bg-red-500/20 border border-red-500/30 px-4 py-4 rounded-xl"
            >
              <Ionicons name="close-circle" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        );

      case "none":
      default:
        return (
          <TouchableOpacity
            onPress={sendFriendRequest}
            className="bg-cyber-cyan px-6 py-4 rounded-xl flex-row items-center justify-center shadow-lg"
            style={{
              shadowColor: '#00ffff',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <Ionicons name="person-add" size={20} color="#0a0a0a" />
            <Text className="text-cyber-black font-inter font-bold ml-2">
              Add Friend
            </Text>
          </TouchableOpacity>
        );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.colors.background.primary}
        />
        <View className="flex-1 justify-center items-center">
          <View className="bg-cyber-cyan/10 w-20 h-20 rounded-full justify-center items-center mb-6">
            <ActivityIndicator size="large" color={accentColor} />
          </View>
          <Text className="text-white/60 font-inter text-base">
            Loading profile...
          </Text>
          <Text className="text-cyber-cyan font-mono text-xs mt-2">
            [ FETCHING USER DATA ]
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !friendProfile) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.colors.background.primary}
        />
        <View className="flex-1 justify-center items-center px-8">
          <View className="bg-red-500/10 w-24 h-24 rounded-full justify-center items-center mb-6">
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          </View>
          <Text className="text-white/70 font-inter text-xl font-semibold mb-2 text-center">
            Profile Not Found
          </Text>
          <Text className="text-white/50 font-inter text-base mb-6 text-center">
            {error || "This user profile could not be loaded"}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-cyber-cyan/20 border border-cyber-cyan/30 px-8 py-4 rounded-xl"
          >
            <Text className="text-cyber-cyan font-inter font-semibold">
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.background.primary}
      />

      {/* Enhanced Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-white/5">
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 bg-cyber-dark/50 rounded-full justify-center items-center"
        >
          <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>

        <View className="flex-1 items-center">
          <Text className="text-white font-orbitron text-lg">
            {friendProfile.displayName}
          </Text>
          <Text className="text-cyber-cyan font-mono text-xs">
            [ USER PROFILE ]
          </Text>
        </View>

        <TouchableOpacity className="w-10 h-10 bg-cyber-dark/50 rounded-full justify-center items-center">
          <Ionicons name="ellipsis-vertical" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Hero Profile Section */}
        <View className="items-center px-6 py-12">
          {/* Avatar */}
          {renderProfileAvatar()}

          {/* Name and Username */}
          <Text className="text-white font-inter font-bold text-3xl mb-2 text-center">
            {friendProfile.displayName}
          </Text>
          <Text className="text-cyber-cyan font-inter text-lg mb-1">
            @{friendProfile.username}
          </Text>

          {/* Enhanced Status */}
          <View className="flex-row items-center mb-6">
            <View 
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: getStatusColor(friendProfile.status) }}
            />
            <Text className="text-white/60 font-inter text-sm">
              {friendProfile.status === "online"
                ? "Online now"
                : friendProfile.lastActive
                  ? formatLastActive(friendProfile.lastActive)
                  : "Offline"}
            </Text>
          </View>

          {/* Bio */}
          {friendProfile.bio && (
            <View className="bg-cyber-dark/30 border border-white/10 p-4 rounded-xl mb-6 w-full">
              <Text className="text-white/80 font-inter text-center text-base leading-6">
                {friendProfile.bio}
              </Text>
            </View>
          )}

          {/* Action Button */}
          <View className="w-full">{renderActionButton()}</View>
        </View>

        {/* Enhanced Stats Section */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center mb-6">
            <View className="bg-cyber-cyan/20 rounded-full p-2 mr-3">
              <Ionicons name="stats-chart" size={20} color="#00ffff" />
            </View>
            <Text className="text-white font-orbitron text-xl">Statistics</Text>
          </View>

          <View className="space-y-4">
            <View className="flex-row space-x-4">
              {renderStatItem(
                "Friends",
                friendProfile.totalFriends || 0,
                "people",
                "#00ff41"
              )}
              {renderStatItem(
                "Mutual",
                friendProfile.mutualFriends || 0,
                "heart",
                "#ff00ff"
              )}
            </View>

            <View className="flex-row space-x-4">
              {renderStatItem(
                "Snaps Sent",
                friendProfile.snapsSent || 0,
                "paper-plane",
                "#0080ff"
              )}
              {renderStatItem(
                "Streaks",
                friendProfile.streaks || 0,
                "flame",
                "#ff8000"
              )}
            </View>
          </View>
        </View>

        {/* Gaming Section */}
        {(friendProfile.favoriteGames &&
          friendProfile.favoriteGames.length > 0) ||
        (friendProfile.gamingInterests &&
          friendProfile.gamingInterests.length > 0) ? (
          <View className="px-6 mb-8">
            <View className="flex-row items-center mb-6">
              <View className="bg-gaming-epic/20 rounded-full p-2 mr-3">
                <Ionicons name="game-controller" size={20} color="#a335ee" />
              </View>
              <Text className="text-white font-orbitron text-xl">Gaming Profile</Text>
            </View>

            {/* Gaming Platform */}
            <View className="bg-cyber-dark/40 border border-white/10 p-4 rounded-xl mb-4">
              <View className="flex-row items-center">
                <Ionicons name="desktop" size={20} color="#00ffff" />
                <View className="ml-3">
                  <Text className="text-white/60 font-inter text-sm">
                    Primary Platform
                  </Text>
                  <Text className="text-white font-inter font-semibold text-base">
                    {friendProfile.gamingPlatform}
                  </Text>
                </View>
              </View>
            </View>

            {friendProfile.gamingInterests &&
              friendProfile.gamingInterests.length > 0 && (
                <View className="bg-cyber-dark/40 border border-white/10 p-4 rounded-xl mb-4">
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <View className="bg-gaming-epic/20 rounded-full p-2 mr-3">
                        <Ionicons name="game-controller" size={16} color="#a335ee" />
                      </View>
                      <Text className="text-white/60 font-inter text-sm font-medium">
                        Gaming Interests
                      </Text>
                    </View>
                    <View className="bg-gaming-epic/10 px-2 py-1 rounded-full">
                      <Text className="text-gaming-epic font-mono text-xs">
                        {friendProfile.gamingInterests.length}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="space-y-3">
                    {friendProfile.gamingInterests.map((interest, index) => {
                      const genreData = getGenreData(interest);
                      const genreColor = genreData?.color || "#a335ee";
                      const genreIcon = genreData?.icon || "game-controller";
                      const genreName = genreData?.name || interest;
                      const genreDescription = genreData?.description;
                      
                      return (
                        <View
                          key={index}
                          className="bg-cyber-dark/50 border border-white/10 rounded-lg p-3 flex-row items-center"
                          style={{
                            shadowColor: genreColor,
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.2,
                            shadowRadius: 3,
                          }}
                        >
                          {/* Genre Icon */}
                          <View 
                            className="w-10 h-10 rounded-full justify-center items-center mr-3"
                            style={{ backgroundColor: genreColor + '20' }}
                          >
                            <Ionicons 
                              name={genreIcon as any} 
                              size={18} 
                              color={genreColor} 
                            />
                          </View>
                          
                          {/* Genre Info */}
                          <View className="flex-1">
                            <Text 
                              className="font-inter font-semibold text-base"
                              style={{ color: genreColor }}
                            >
                              {genreName}
                            </Text>
                            {genreDescription && (
                              <Text className="text-white/60 font-inter text-xs mt-1">
                                {genreDescription}
                              </Text>
                            )}
                          </View>
                          
                          {/* Gaming Accent */}
                          <View className="w-1 h-8 rounded-full" style={{ backgroundColor: genreColor }} />
                        </View>
                      );
                    })}
                  </View>
                  
                  {/* Gaming Stats Footer */}
                  <View className="mt-4 pt-3 border-t border-white/10">
                    <View className="flex-row items-center justify-center">
                      <Ionicons name="stats-chart" size={12} color="#00ffff" />
                      <Text className="text-cyber-cyan font-mono text-xs ml-2">
                        GAMING PROFILE • {friendProfile.gamingInterests.length} GENRES
                      </Text>
                    </View>
                  </View>
                </View>
              )}

            {friendProfile.favoriteGames &&
              friendProfile.favoriteGames.length > 0 && (
                <View className="bg-cyber-dark/40 border border-white/10 p-4 rounded-xl">
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <View className="bg-cyber-cyan/20 rounded-full p-2 mr-3">
                        <Ionicons name="trophy" size={16} color="#00ffff" />
                      </View>
                      <Text className="text-white/60 font-inter text-sm font-medium">
                        Favorite Games
                      </Text>
                    </View>
                    <View className="bg-cyber-cyan/10 px-2 py-1 rounded-full">
                      <Text className="text-cyber-cyan font-mono text-xs">
                        {friendProfile.favoriteGames.length}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row flex-wrap">
                    {friendProfile.favoriteGames.map((game, index) => (
                      <View
                        key={index}
                        className="bg-cyber-cyan/10 border border-cyber-cyan/30 px-4 py-2 rounded-full mr-2 mb-2 flex-row items-center"
                        style={{
                          shadowColor: '#00ffff',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.2,
                          shadowRadius: 3,
                        }}
                      >
                        <Ionicons name="game-controller" size={14} color="#00ffff" />
                        <Text className="text-cyber-cyan font-inter text-sm ml-2 font-medium">
                          {game}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  {/* Gaming Stats Footer */}
                  <View className="mt-4 pt-3 border-t border-white/10">
                    <View className="flex-row items-center justify-center">
                      <Ionicons name="library" size={12} color="#00ffff" />
                      <Text className="text-cyber-cyan font-mono text-xs ml-2">
                        GAME LIBRARY • {friendProfile.favoriteGames.length} FAVORITES
                      </Text>
                    </View>
                  </View>
                </View>
              )}
          </View>
        ) : null}

        {/* Enhanced Achievements Section */}
        {friendProfile.achievements &&
          friendProfile.achievements.length > 0 && (
            <View className="px-6 mb-8">
              <View className="flex-row items-center mb-6">
                <View className="bg-yellow-500/20 rounded-full p-2 mr-3">
                  <Ionicons name="trophy" size={20} color="#f59e0b" />
                </View>
                <Text className="text-white font-orbitron text-xl">Achievements</Text>
              </View>

              <View className="space-y-3">
                {friendProfile.achievements.map((achievement, index) => (
                  <View
                    key={index}
                    className="flex-row items-center bg-cyber-dark/40 border border-white/10 p-4 rounded-xl"
                    style={{
                      shadowColor: '#f59e0b',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 3,
                    }}
                  >
                    <View className="w-12 h-12 bg-yellow-500/20 rounded-full justify-center items-center mr-4">
                      <Ionicons name="trophy" size={24} color="#f59e0b" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-inter font-semibold text-base">
                        {achievement}
                      </Text>
                      <Text className="text-yellow-400 font-mono text-xs mt-1">
                        ACHIEVEMENT UNLOCKED
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

        {/* Enhanced Member Since */}
        <View className="px-6 mb-8">
          <View className="bg-cyber-dark/40 border border-white/10 p-4 rounded-xl">
            <View className="flex-row items-center">
              <View className="bg-cyber-cyan/20 rounded-full p-2 mr-3">
                <Ionicons name="calendar" size={20} color="#00ffff" />
              </View>
              <View>
                <Text className="text-white/60 font-inter text-sm">
                  Member Since
                </Text>
                <Text className="text-white font-inter font-semibold text-base">
                  {friendProfile.joinedDate
                    ? formatJoinDate(friendProfile.joinedDate)
                    : "Unknown"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Gaming Footer */}
        <View className="items-center mb-12">
          <View className="w-full h-px bg-cyber-cyan opacity-20 mb-4" />
          <Text className="text-cyber-cyan font-mono text-xs">
            [ SNAPCONNECT GAMING PROFILE ]
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FriendProfileScreen;

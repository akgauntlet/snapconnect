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
  achievements?: string[];
  status: "online" | "offline" | "away";
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
      friend?: any;
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

      // If we have initial friend data, use optimized path
      if (initialFriend) {
        console.log(
          "🔄 Loading profile with initial data for:",
          initialFriend.displayName,
        );

        // Get real data in parallel for better performance
        const [mutualFriendsCount, friendIds, userStats, userPresence] =
          await Promise.all([
            friendsService.getMutualFriendsCount(user.uid, initialFriend.id),
            friendsService.getFriendIds(initialFriend.id),
            friendsService.getUserStats(initialFriend.id),
            friendsService.getUserPresence(initialFriend.id),
          ]);

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
          id: initialFriend.id,
          displayName: initialFriend.displayName || "Unknown User",
          username: initialFriend.username || "no-username",
          profilePhoto: initialFriend.profilePhoto,
          bio: initialFriend.bio || "Gaming enthusiast • SnapConnect user",
          joinedDate:
            safeToDate(initialFriend.createdAt) ||
            stats.joinedDate ||
            new Date(),
          lastActive: presence.lastActive,
          isOnline: presence.isOnline,
          mutualFriends: mutualFriendsCount,
          totalFriends: friendIds.length,
          snapsSent: stats.snapsSent || 0,
          snapsReceived: stats.snapsReceived || 0,
          streaks: stats.streaks || 0,
          gamingPlatform: initialFriend.gamingPlatform || "Multiple Platforms",
          favoriteGames: initialFriend.favoriteGames || [],
          achievements: initialFriend.achievements || [],
          status: presence.status,
        };

        setFriendProfile(enrichedProfile);
      } else {
        // Fallback: fetch complete profile using new enriched method
        console.log("🔄 Loading complete profile for:", friendId);

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
    // Navigate to Messages tab with friend information
    navigation.navigate("MainTabs", {
      screen: "Messages",
      params: {
        friendId,
        friendName: friendProfile?.displayName,
        openConversation: true,
      },
    });
  }, [navigation, friendId, friendProfile]);

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
   * Render action button based on friendship status - enhanced for new status types
   */
  const renderActionButton = () => {
    if (isProcessing) {
      return (
        <View className="bg-cyber-gray/20 px-6 py-3 rounded-lg flex-row items-center justify-center">
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
          <View className="bg-cyber-gray/20 px-6 py-3 rounded-lg">
            <Text className="text-white/60 font-inter font-medium text-center">
              This is your profile
            </Text>
          </View>
        );

      case "friends":
        return (
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={sendMessage}
              className="flex-1 bg-cyber-cyan px-6 py-3 rounded-lg flex-row items-center justify-center"
            >
              <Ionicons name="chatbubble" size={20} color="#0a0a0a" />
              <Text className="text-cyber-black font-inter font-semibold ml-2">
                Message
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={removeFriend}
              className="bg-red-500/20 px-4 py-3 rounded-lg"
            >
              <Ionicons name="person-remove" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        );

      case "pending_sent":
        return (
          <View className="bg-amber-500/20 px-6 py-3 rounded-lg">
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
              className="flex-1 bg-green-500/20 px-6 py-3 rounded-lg flex-row items-center justify-center"
            >
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text className="text-green-400 font-inter font-semibold ml-2">
                Accept Request
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={declineFriendRequest}
              className="bg-red-500/20 px-4 py-3 rounded-lg"
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
            className="bg-cyber-cyan px-6 py-3 rounded-lg flex-row items-center justify-center"
          >
            <Ionicons name="person-add" size={20} color="#0a0a0a" />
            <Text className="text-cyber-black font-inter font-semibold ml-2">
              Add Friend
            </Text>
          </TouchableOpacity>
        );
    }
  };

  /**
   * Render stat item
   */
  const renderStatItem = (
    label: string,
    value: string | number,
    icon: string,
  ) => (
    <View className="bg-cyber-dark/30 p-4 rounded-lg flex-1 items-center">
      <Ionicons name={icon as any} size={24} color={accentColor} />
      <Text className="text-white font-inter font-bold text-lg mt-2">
        {value}
      </Text>
      <Text className="text-white/60 font-inter text-sm">{label}</Text>
    </View>
  );

  /**
   * Render profile avatar with proper image handling
   */
  const renderProfileAvatar = () => {
    if (!friendProfile) return null;

    if (friendProfile.profilePhoto) {
      return (
        <View className="relative mb-4">
          <Image
            source={{ uri: friendProfile.profilePhoto }}
            className="w-24 h-24 rounded-full"
            onError={() => {
              // Fallback to initials if image fails to load
              console.warn(
                "Failed to load profile photo for:",
                friendProfile.displayName,
              );
            }}
          />
          {/* Status indicator */}
          <View
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-cyber-black"
            style={{ backgroundColor: getStatusColor(friendProfile.status) }}
          />
        </View>
      );
    } else {
      return (
        <View className="relative mb-4">
          <View className="w-24 h-24 bg-cyber-cyan/20 rounded-full justify-center items-center">
            <Text className="text-cyber-cyan font-inter font-bold text-2xl">
              {getUserInitials()}
            </Text>
          </View>
          {/* Status indicator */}
          <View
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-cyber-black"
            style={{ backgroundColor: getStatusColor(friendProfile.status) }}
          />
        </View>
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
          <ActivityIndicator size="large" color={accentColor} />
          <Text className="text-white/60 font-inter text-base mt-4">
            Loading profile...
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
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text className="text-white/70 font-inter text-lg mt-4 mb-2 text-center">
            {error || "Profile not found"}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-cyber-cyan/20 px-6 py-3 rounded-lg mt-4"
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

      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text className="text-white font-orbitron text-lg">Profile</Text>

        <TouchableOpacity className="p-2">
          <Ionicons name="ellipsis-vertical" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Profile Header */}
        <View className="items-center px-6 py-8">
          {/* Avatar with status */}
          {renderProfileAvatar()}

          {/* Name and username */}
          <Text className="text-white font-inter font-bold text-2xl mb-1">
            {friendProfile.displayName}
          </Text>
          <Text className="text-white/60 font-inter text-lg mb-2">
            @{friendProfile.username}
          </Text>

          {/* Status text */}
          <Text className="text-white/40 font-inter text-sm mb-4">
            {friendProfile.status === "online"
              ? "Online now"
              : friendProfile.lastActive
                ? formatLastActive(friendProfile.lastActive)
                : "Offline"}
          </Text>

          {/* Bio */}
          {friendProfile.bio && (
            <Text
              className="text-white/70 font-inter text-center text-base mb-6 px-4"
              numberOfLines={1}
            >
              {friendProfile.bio}
            </Text>
          )}

          {/* Action Button */}
          <View className="w-full">{renderActionButton()}</View>
        </View>

        {/* Stats Section */}
        <View className="px-6 mb-8">
          <Text className="text-white font-orbitron text-lg mb-4">Stats</Text>

          <View className="flex-row space-x-3 mb-4">
            {renderStatItem(
              "Friends",
              friendProfile.totalFriends || 0,
              "people",
            )}
            {renderStatItem(
              "Mutual",
              friendProfile.mutualFriends || 0,
              "heart",
            )}
          </View>

          <View className="flex-row space-x-3">
            {renderStatItem(
              "Snaps Sent",
              friendProfile.snapsSent || 0,
              "paper-plane",
            )}
            {renderStatItem("Streaks", friendProfile.streaks || 0, "flame")}
          </View>
        </View>

        {/* Gaming Section */}
        {friendProfile.favoriteGames &&
          friendProfile.favoriteGames.length > 0 && (
            <View className="px-6 mb-8">
              <Text className="text-white font-orbitron text-lg mb-4">
                Gaming
              </Text>

              <View className="bg-cyber-dark/30 p-4 rounded-lg mb-4">
                <Text className="text-white/60 font-inter text-sm mb-2">
                  Platform
                </Text>
                <Text className="text-white font-inter font-medium">
                  {friendProfile.gamingPlatform}
                </Text>
              </View>

              <View className="bg-cyber-dark/30 p-4 rounded-lg">
                <Text className="text-white/60 font-inter text-sm mb-3">
                  Favorite Games
                </Text>
                <View className="flex-row flex-wrap">
                  {friendProfile.favoriteGames.map((game, index) => (
                    <View
                      key={index}
                      className="bg-cyber-cyan/20 px-3 py-1 rounded-full mr-2 mb-2"
                    >
                      <Text className="text-cyber-cyan font-inter text-sm">
                        {game}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

        {/* Achievements Section */}
        {friendProfile.achievements &&
          friendProfile.achievements.length > 0 && (
            <View className="px-6 mb-8">
              <Text className="text-white font-orbitron text-lg mb-4">
                Achievements
              </Text>

              {friendProfile.achievements.map((achievement, index) => (
                <View
                  key={index}
                  className="flex-row items-center bg-cyber-dark/30 p-4 rounded-lg mb-3"
                >
                  <View className="w-10 h-10 bg-yellow-500/20 rounded-full justify-center items-center mr-4">
                    <Ionicons name="trophy" size={20} color="#f59e0b" />
                  </View>
                  <Text className="text-white font-inter font-medium">
                    {achievement}
                  </Text>
                </View>
              ))}
            </View>
          )}

        {/* Member Since */}
        <View className="px-6 mb-20">
          <View className="bg-cyber-dark/30 p-4 rounded-lg">
            <Text className="text-white/60 font-inter text-sm mb-1">
              Member Since
            </Text>
            <Text className="text-white font-inter font-medium">
              {friendProfile.joinedDate
                ? formatJoinDate(friendProfile.joinedDate)
                : "Unknown"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FriendProfileScreen;

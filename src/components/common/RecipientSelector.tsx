/**
 * @file RecipientSelector.tsx
 * @description Enhanced recipient selection component for sending snaps to friends.
 * Handles real Firebase friend list, search, and multiple recipient selection.
 *
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-24
 *
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - expo-haptics: Haptic feedback
 * - @/services/firebase/friendsService: Friends management
 * - @/services/firebase/messagingService: Message sending
 *
 * @usage
 * <RecipientSelector
 *   visible={isVisible}
 *   mediaData={capturedMedia}
 *   onSend={handleSend}
 *   onClose={handleClose}
 * />
 *
 * @ai_context
 * Integrates with AI-powered friend suggestions and interaction analytics.
 * Supports smart recipient recommendations based on communication patterns.
 */

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { friendsService } from "../../services/firebase/friendsService";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import { showErrorAlert } from "../../utils/alertService";

/**
 * Friend interface for typing
 */
interface Friend {
  id: string;
  displayName: string;
  username: string;
  profilePhoto?: string;
  lastActive?: Date;
  isOnline?: boolean;
}

/**
 * Media data interface for sending
 */
interface MediaData {
  uri: string;
  type: "photo" | "video";
  size: number;
}

/**
 * Props for RecipientSelector component
 */
interface RecipientSelectorProps {
  visible: boolean;
  mediaData: MediaData | null;
  onSend: (recipients: string[], timer: number) => Promise<void>;
  onClose: () => void;
}

/**
 * Enhanced recipient selector component for choosing snap recipients
 */
const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  visible,
  mediaData,
  onSend,
  onClose,
}) => {
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const { user } = useAuthStore();

  // Component state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimer, setSelectedTimer] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer options
  const timerOptions = [1, 3, 5, 10];

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

      // Transform to our interface format with real presence data
      const formattedFriends: Friend[] = friendsData.map((friend) => {
        const presence = presenceData[friend.id] || {
          status: "offline",
          lastActive: new Date(),
          isOnline: false,
        };

        return {
          id: friend.id,
          displayName: friend.displayName || friend.username || "Unknown",
          username: friend.username || "no-username",
          profilePhoto: friend.profilePhoto,
          lastActive: presence.lastActive,
          isOnline: presence.isOnline,
        };
      });

      setFriends(formattedFriends);

      // Don't set error for empty friends list - it's a normal state
      // Empty friends list will be handled by renderEmptyState
    } catch (error) {
      console.error("Load friends failed:", error);
      setError("Failed to load friends. Please try again.");
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
    if (searchQuery.trim() === "") {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(
        (friend) =>
          friend.displayName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          friend.username.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredFriends(filtered);
    }
  }, [friends, searchQuery]);

  /**
   * Toggle recipient selection
   */
  const toggleRecipient = useCallback(async (friendId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setSelectedRecipients((prev) => {
        if (prev.includes(friendId)) {
          return prev.filter((id) => id !== friendId);
        } else {
          return [...prev, friendId];
        }
      });
    } catch (error) {
      console.error("Toggle recipient failed:", error);
    }
  }, []);

  /**
   * Handle sending snap to selected recipients
   */
  const handleSendSnap = async () => {
    if (selectedRecipients.length === 0) {
      showErrorAlert(
        "Please select at least one friend to send to.",
        "No Recipients",
      );
      return;
    }

    if (!mediaData) {
      showErrorAlert("No media available to send.", "No Media");
      return;
    }

    try {
      setIsSending(true);

      // Send to each selected recipient using original callback
      await onSend(selectedRecipients, selectedTimer);

      // Clear selections
      setSelectedRecipients([]);
      setSearchQuery("");

      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Close modal
      onClose();
    } catch (error) {
      console.error("Send snap failed:", error);
      showErrorAlert("Failed to send snap. Please try again.", "Send Failed");
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Handle close modal
   */
  const handleClose = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Clear selections
      setSelectedRecipients([]);
      setSearchQuery("");
      setError(null);

      onClose();
    } catch (error) {
      console.error("Handle close failed:", error);
    }
  }, [onClose]);

  /**
   * Format last seen time
   */
  const formatLastSeen = (lastActive: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
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
    return name
      .split(" ")
      .map((n) => n.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  /**
   * Render friend item
   */
  const renderFriendItem = ({ item }: { item: Friend }) => {
    const isSelected = selectedRecipients.includes(item.id);

    return (
      <TouchableOpacity
        onPress={() => toggleRecipient(item.id)}
        className={`flex-row items-center p-4 mx-4 mb-2 rounded-lg ${
          isSelected
            ? "bg-cyber-cyan/20 border border-cyber-cyan"
            : "bg-cyber-gray/10"
        }`}
        disabled={isSending}
      >
        {/* Avatar */}
        <View
          className={`w-12 h-12 rounded-full justify-center items-center mr-3 ${
            item.isOnline
              ? "bg-green-500/20 border-2 border-green-500"
              : "bg-gray-500/20 border-2 border-gray-500"
          }`}
        >
          <Text className="text-white font-inter font-semibold text-sm">
            {getFriendInitials(item)}
          </Text>

          {/* Online indicator */}
          {item.isOnline && (
            <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-cyber-black" />
          )}
        </View>

        {/* Friend info */}
        <View className="flex-1">
          <Text className="text-white font-inter font-medium text-base">
            {item.displayName}
          </Text>
          <Text className="text-white/60 font-inter text-sm">
            @{item.username} •{" "}
            {item.isOnline
              ? "Online"
              : item.lastActive
                ? formatLastSeen(item.lastActive)
                : "Offline"}
          </Text>
        </View>

        {/* Selection indicator */}
        <View className="ml-3">
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={24} color={accentColor} />
          ) : (
            <View className="w-6 h-6 border-2 border-white/30 rounded-full" />
          )}
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
        <View className="items-center py-20">
          <ActivityIndicator size="large" color={accentColor} />
          <Text className="text-white/60 font-inter text-base mt-4">
            Loading friends...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="items-center py-20">
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text className="text-white/70 font-inter text-lg mt-4 mb-2">
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
        <View className="items-center py-20">
          <Ionicons
            name="search-outline"
            size={48}
            color="rgba(255,255,255,0.3)"
          />
          <Text className="text-white/60 font-inter text-lg mt-4 mb-2">
            No friends found
          </Text>
          <Text className="text-white/40 font-inter text-sm text-center px-8">
            Try searching with a different name or username
          </Text>
        </View>
      );
    }

    return (
      <View className="items-center py-20">
        <Ionicons
          name="people-outline"
          size={48}
          color="rgba(255,255,255,0.3)"
        />
        <Text className="text-white/60 font-inter text-lg mt-4 mb-2">
          No friends yet
        </Text>
        <Text className="text-white/40 font-inter text-sm text-center px-8 mb-4">
          Add friends to start sending snaps!
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
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
      >
        <View className="flex-1 bg-cyber-black">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray/20">
            <TouchableOpacity onPress={handleClose} className="p-2">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            <Text className="text-white font-orbitron text-lg">Send To</Text>

            <TouchableOpacity
              onPress={handleSendSnap}
              disabled={selectedRecipients.length === 0 || isSending}
              className={`px-4 py-2 rounded-lg ${
                selectedRecipients.length > 0 && !isSending
                  ? "bg-cyber-cyan"
                  : "bg-cyber-gray/20"
              }`}
            >
              <Text
                className={`font-inter font-semibold ${
                  selectedRecipients.length > 0 && !isSending
                    ? "text-cyber-black"
                    : "text-white/40"
                }`}
              >
                {isSending ? "Sending..." : "Send"}
              </Text>
            </TouchableOpacity>
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

          {/* Timer Selection */}
          <View className="px-6 pb-4">
            <Text className="text-white font-inter font-medium mb-3">
              Timer: {selectedTimer}s
            </Text>
            <View className="flex-row justify-around">
              {timerOptions.map((timer) => (
                <TouchableOpacity
                  key={timer}
                  onPress={() => setSelectedTimer(timer)}
                  className={`w-12 h-12 rounded-full justify-center items-center ${
                    selectedTimer === timer
                      ? "bg-cyber-cyan"
                      : "bg-cyber-gray/20 border border-cyber-gray/40"
                  }`}
                >
                  <Text
                    className={`font-inter font-semibold ${
                      selectedTimer === timer
                        ? "text-cyber-black"
                        : "text-white"
                    }`}
                  >
                    {timer}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Selected count */}
          {selectedRecipients.length > 0 && (
            <View className="px-6 pb-2">
              <Text className="text-cyber-cyan font-inter text-sm">
                {selectedRecipients.length} recipient
                {selectedRecipients.length !== 1 ? "s" : ""} selected
              </Text>
            </View>
          )}

          {/* Friends List */}
          <FlatList
            data={filteredFriends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={renderEmptyState}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default RecipientSelector;

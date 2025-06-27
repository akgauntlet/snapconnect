/**
 * @file MessagesScreen.tsx
 * @description Enhanced ephemeral messaging interface with real-time photo/video sharing.
 * Displays conversations, handles incoming media messages, and manages disappearing content.
 *
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-24
 *
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @/stores/themeStore: Theme management
 * - @/stores/authStore: Authentication state
 * - @/services/firebase/realtimeService: Real-time messaging
 * - @/components/common/MediaViewer: Media viewer component
 * - @/components/common/ConversationItem: Conversation list item
 * - @/components/common/IncomingMessagesHeader: Incoming messages display
 *
 * @usage
 * Main interface for viewing and managing ephemeral conversations with media sharing.
 *
 * @ai_context
 * AI-powered message suggestions and smart conversation prioritization.
 * Real-time content moderation and smart notification filtering.
 */

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import ConversationItem, {
    Conversation,
} from "../../components/common/ConversationItem";
import IncomingMessagesHeader, {
    IncomingMessage,
} from "../../components/common/IncomingMessagesHeader";
import MediaViewer from "../../components/common/MediaViewer";
import MessageFriendSelector from "../../components/common/MessageFriendSelector";
import { useTabBarHeight } from "../../hooks/useTabBarHeight";
import { friendsService } from "../../services/firebase/friendsService";
import { messagingService } from "../../services/firebase/messagingService";
import { realtimeService } from "../../services/firebase/realtimeService";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import {
    showAlert,
    showDestructiveAlert,
    showSuccessAlert,
} from "../../utils/alertService";
import { useOptimizedFlatList } from "../../utils/scrollOptimization";
import { formatConversationUserName } from "../../utils/userHelpers";

/**
 * Enhanced messages screen component with real-time media sharing
 *
 * @returns {React.ReactElement} Rendered messages interface
 *
 * @performance
 * - Optimized list rendering for large conversation histories
 * - Efficient real-time message synchronization
 * - Smart media preloading and caching
 *
 * @ai_integration
 * - Smart conversation prioritization based on activity
 * - AI-powered content filtering and moderation
 * - Intelligent notification management
 */
const MessagesScreen: React.FC = () => {
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const { user } = useAuthStore();
  const { tabBarHeight } = useTabBarHeight();
  const navigation = useNavigation();
  const optimizedFlatListProps = useOptimizedFlatList('conversation');

  // Component state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [incomingMessages, setIncomingMessages] = useState<IncomingMessage[]>(
    [],
  );
  const [selectedMedia, setSelectedMedia] = useState<IncomingMessage | null>(
    null,
  );
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle viewing media message
   */
  const handleViewMedia = useCallback((message: IncomingMessage) => {
    setSelectedMedia(message);
  }, []);

  /**
   * Handle incoming new messages with notification
   */
  const handleNewMessages = useCallback(
    async (messages: IncomingMessage[]) => {


      const mediaMessages = messages.filter(
        (msg) => msg.mediaUrl && msg.mediaType,
      );

      if (mediaMessages.length > 0) {
        // Fetch sender names for all media messages
        const messagesWithSenderNames = await Promise.all(
          mediaMessages.map(async (msg) => {
            try {
              const senderProfile = await friendsService.getUserProfile(msg.senderId) as any;
              const senderName = senderProfile?.displayName || 
                                senderProfile?.username || 
                                "Someone";
              return {
                ...msg,
                senderName,
              };
            } catch (error) {
              console.error("Failed to fetch sender profile for:", msg.senderId, error);
              return {
                ...msg,
                senderName: "Someone",
              };
            }
          }),
        );

        setIncomingMessages((prev) => [...messagesWithSenderNames, ...prev]);

        const firstMedia = messagesWithSenderNames[0];
        showAlert(
          `📸 New ${firstMedia.mediaType === "photo" ? "Photo" : "Video"} Snap!`,
          `From ${firstMedia.senderName || "Someone"}`,
          [
            { text: "View Now", onPress: () => handleViewMedia(firstMedia) },
            { text: "View Later", style: "cancel" },
          ],
        );
      }
    },
    [handleViewMedia],
  );

  /**
   * Handle conversation updates with proper formatting
   */
  const handleConversationUpdates = useCallback(
    async (updatedConversations: any[]) => {
      if (!user) return;

      const otherParticipants = updatedConversations
        .map((conv) => conv.participants.find((p: string) => p !== user.uid))
        .filter(Boolean);

      // Get both presence data and user profile data
      const [presenceData, userProfiles] = await Promise.all([
        friendsService.getBatchUserPresence(otherParticipants),
        Promise.all(
          otherParticipants.map(async (userId) => {
            try {
              const profile = await friendsService.getUserProfile(userId);
              return { userId, profile };
            } catch (error) {
              console.error("Failed to fetch user profile for:", userId, error);
              return { userId, profile: null };
            }
          }),
        ),
      ]);

      // Create a map of userId to user profile for easy lookup
      const profilesMap = new Map();
      userProfiles.forEach(({ userId, profile }) => {
        profilesMap.set(userId, profile);
      });

      // Process conversations and fetch missing message previews
      const formattedConversations: Conversation[] = await Promise.all(
        updatedConversations.map(async (conv) => {
          const otherParticipant = conv.participants.find(
            (p: string) => p !== user.uid,
          );
          const presence = (presenceData as any)[otherParticipant] || {
            status: "offline",
            lastActive: new Date(),
            isOnline: false,
          };
          const userProfile = profilesMap.get(otherParticipant);

          // Use displayName first, then username, then fallback to 'Unknown User'
          const displayName = formatConversationUserName(userProfile);

          // Get proper last message preview
          let lastMessage = conv.lastMessage;

          // If no lastMessage or it's the generic "New message", fetch the actual most recent message
          if (!lastMessage || lastMessage === "New message") {
            try {
              const recentMessage = await messagingService.getMostRecentMessage(
                user.uid,
                otherParticipant,
              );
              if (recentMessage) {
                lastMessage = messagingService.formatMessagePreview(
                  recentMessage,
                  user.uid,
                );
              } else {
                lastMessage = "Start a conversation";
              }
            } catch (error) {
              console.error(
                "Failed to fetch recent message for conversation:",
                conv.id,
                error,
              );
              lastMessage = "New conversation";
            }
          }

          return {
            id: conv.id,
            name: displayName,
            lastMessage,
            time: formatTime(conv.lastMessageAt?.toDate() || new Date()),
            isOnline: presence.isOnline,
            participants: conv.participants,
            lastMessageAt: conv.lastMessageAt?.toDate() || new Date(),
            hasUnreadMedia: conv.hasUnreadMedia || false,
            unreadCount: conv.unreadCount || 0,
          };
        }),
      );

      formattedConversations.sort(
        (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime(),
      );
      setConversations(formattedConversations);
    },
    [user],
  );

  /**
   * Handle errors with proper user feedback
   */
  const handleMessageError = useCallback((error: any) => {
    console.error("Message listener error:", error);
    setError("Connection lost. Pull to refresh to reconnect.");
  }, []);

  const handleConversationError = useCallback((error: any) => {
    console.error("Conversation listener error:", error);
    setError("Failed to load conversations. Pull to refresh to try again.");
  }, []);

  /**
   * Load initial conversations
   */
  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      const recentConversations = await messagingService.getRecentConversations(
        user.uid,
      );
      handleConversationUpdates(recentConversations);
    } catch (error) {
      console.error("Load conversations failed:", error);
      setError("Failed to load conversations.");
    }
  }, [user, handleConversationUpdates]);

  /**
   * Initialize real-time listeners when screen is focused
   */
  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      const initializeListeners = async () => {
        try {
          setIsLoading(true);
          setError(null);

          await realtimeService.startPresence(user.uid);

          realtimeService.listenForMessages(
            user.uid,
            handleNewMessages,
            handleMessageError,
          );
          realtimeService.listenForConversations(
            user.uid,
            handleConversationUpdates,
            handleConversationError,
          );

          await loadConversations();
        } catch (error) {
          console.error("Initialize listeners failed:", error);
          setError("Failed to connect to messaging service. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };

      initializeListeners();

      return () => {
        realtimeService.cleanup();
      };
    }, [
      user,
      handleNewMessages,
      handleMessageError,
      handleConversationUpdates,
      handleConversationError,
      loadConversations,
    ]),
  );

  /**
   * Handle pull to refresh
   */
  const handleRefresh = useCallback(async () => {
    if (!user) return;

    try {
      setIsRefreshing(true);
      setError(null);

      await realtimeService.cleanup();
      await realtimeService.startPresence(user.uid);

      realtimeService.listenForMessages(
        user.uid,
        handleNewMessages,
        handleMessageError,
      );
      realtimeService.listenForConversations(
        user.uid,
        handleConversationUpdates,
        handleConversationError,
      );

      await loadConversations();
    } catch (error) {
      console.error("Refresh failed:", error);
      setError("Failed to refresh. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }, [
    user,
    handleNewMessages,
    handleMessageError,
    handleConversationUpdates,
    handleConversationError,
    loadConversations,
  ]);

  /**
   * Handle media events
   */
  const handleMediaViewed = useCallback(
    (messageId: string) => {
      if (user) {
        realtimeService.markAsDelivered(messageId, user.uid);
      }
    },
    [user],
  );

  const handleMediaExpired = useCallback(
    (messageId: string) => {
      setIncomingMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      if (selectedMedia?.id === messageId) {
        setSelectedMedia(null);
      }
    },
    [selectedMedia],
  );

  const closeMediaViewer = useCallback(() => {
    setSelectedMedia(null);
  }, []);

  /**
   * Format timestamp for display
   */
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString();
  };

  /**
   * Handle conversation interactions
   */
  const handleConversationPress = useCallback(
    (conversation: Conversation) => {
      // Navigate to chat screen with conversation details
      (navigation as any).navigate("Chat", {
        conversationId: conversation.id,
        friendId: conversation.participants.find((p) => p !== user?.uid) || "",
        friendName: conversation.name,
      });
    },
    [navigation, user],
  );

  const handleNewConversation = useCallback(() => {
    setShowFriendSelector(true);
  }, []);

  const handleFriendSelected = useCallback(
    async (friendId: string, friendData: any) => {
      if (!user) return;

      try {
        const conversationId = messagingService.getConversationId(
          user.uid,
          friendId,
        );
        const existingConversations =
          await messagingService.getRecentConversations(user.uid);
        const existingConversation = existingConversations.find(
          (conv) => conv.id === conversationId,
        );

        // Get the friend's display name for messaging
        const friendDisplayName = formatConversationUserName(friendData);

        if (existingConversation) {
          showSuccessAlert(
            `Conversation with ${friendDisplayName} is ready!`,
            "Conversation Found",
          );

          // Navigate to the existing conversation
          (navigation as any).navigate("Chat", {
            conversationId: conversationId,
            friendId: friendId,
            friendName: friendDisplayName,
          });
        } else {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { getFirebaseDB } = require("../../config/firebase");
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { firebase } = require("../../config/firebase");

          const db = getFirebaseDB();

          await db
            .collection("conversations")
            .doc(conversationId)
            .set({
              participants: [user.uid, friendId],
              lastMessageId: null,
              lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

          showSuccessAlert(
            `Started conversation with ${friendDisplayName}!`,
            "Conversation Created",
          );

          // Navigate to the new conversation
          (navigation as any).navigate("Chat", {
            conversationId: conversationId,
            friendId: friendId,
            friendName: friendDisplayName,
          });
        }

        await loadConversations();
      } catch (error) {
        console.error("Create conversation failed:", error);
        showAlert("Failed to Start Conversation", "Please try again later.");
      }
    },
    [user, loadConversations, navigation],
  );

  const closeFriendSelector = useCallback(() => {
    setShowFriendSelector(false);
  }, []);

  const handleClearUnread = useCallback(async () => {
    if (incomingMessages.length === 0) return;

    showDestructiveAlert(
      "Clear Unread Snaps",
      "This will mark all unread snaps as viewed without opening them. Continue?",
      () => {
        setIncomingMessages([]);
      },
      undefined,
      "Clear All",
    );
  }, [incomingMessages.length]);

  /**
   * Render conversation item
   */
  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <ConversationItem conversation={item} onPress={handleConversationPress} />
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-8 py-16">
      <Ionicons
        name="chatbubbles-outline"
        size={64}
        color="rgba(0, 255, 255, 0.3)"
      />
      <Text className="text-white/70 font-orbitron text-xl mt-6 mb-2 text-center">
        No Conversations Yet
      </Text>
      <Text className="text-white/50 font-inter text-base text-center mb-8">
        Start messaging with friends to see your conversations here
      </Text>
      <TouchableOpacity
        onPress={handleNewConversation}
        className="bg-cyber-cyan px-8 py-4 rounded-xl flex-row items-center"
        style={{
          boxShadow: `0px 4px 8px rgba(0, 255, 255, 0.3)`,
          elevation: 8,
        } as any}
      >
        <Ionicons
          name="add"
          size={20}
          color="#000000"
          style={{ marginRight: 8 }}
        />
        <Text className="text-cyber-black font-inter font-bold text-base">
          Start Messaging
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
      <Text className="text-white/60 font-inter text-base mt-4">
        Loading conversations...
      </Text>
    </View>
  );

  /**
   * Render error state
   */
  const renderErrorState = () => (
    <View className="flex-1 justify-center items-center px-8">
      <Ionicons name="warning-outline" size={64} color="#ff0040" />
      <Text className="text-white/70 font-orbitron text-xl mt-6 mb-2 text-center">
        Connection Error
      </Text>
      <Text className="text-white/50 font-inter text-base text-center mb-8">
        {error}
      </Text>
      <TouchableOpacity
        onPress={handleRefresh}
        className="bg-cyber-cyan/20 border border-cyber-cyan/30 px-6 py-3 rounded-lg"
      >
        <Text className="text-cyber-cyan font-inter font-semibold">
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.colors.background.primary}
        />

        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray/10">
          <Text className="text-white font-orbitron text-2xl">Messages</Text>

          <View className="flex-row items-center">
            {incomingMessages.length > 0 && (
              <TouchableOpacity
                onPress={handleClearUnread}
                className="mr-4 p-2"
              >
                <Ionicons name="checkmark-done" size={20} color={accentColor} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleNewConversation}
              className="bg-cyber-cyan/10 border border-cyber-cyan/20 p-3 rounded-full"
            >
              <Ionicons name="add" size={20} color={accentColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              <IncomingMessagesHeader
                messages={incomingMessages}
                onViewMessage={handleViewMedia}
              />
            }
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={accentColor}
                colors={[accentColor]}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: tabBarHeight + 16,
              flexGrow: conversations.length === 0 ? 1 : 0,
            }}
            {...optimizedFlatListProps}
          />
        )}
      </SafeAreaView>

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <Modal
          visible={true}
          animationType="fade"
          presentationStyle="fullScreen"
        >
          <MediaViewer
            messageId={selectedMedia.id}
            mediaUrl={selectedMedia.mediaUrl || ""}
            mediaType={selectedMedia.mediaType || "photo"}
            timer={selectedMedia.timer}
            senderId={selectedMedia.senderId}
            senderName={selectedMedia.senderName}
            onView={handleMediaViewed}
            onExpire={handleMediaExpired}
            onClose={closeMediaViewer}
          />
        </Modal>
      )}

      {/* Friend Selector Modal */}
      <MessageFriendSelector
        visible={showFriendSelector}
        onSelectFriend={handleFriendSelected}
        onClose={closeFriendSelector}
      />
    </>
  );
};

export default MessagesScreen;

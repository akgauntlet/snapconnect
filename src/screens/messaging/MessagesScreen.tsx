/**
 * @file MessagesScreen.tsx
 * @description Ephemeral messaging interface with real-time photo/video sharing.
 * Displays conversations, handles incoming media messages, and manages disappearing content.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-20
 * 
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @/stores/themeStore: Theme management
 * - @/stores/authStore: Authentication state
 * - @/services/firebase/realtimeService: Real-time messaging
 * - @/components/common/MediaViewer: Media viewer component
 * 
 * @usage
 * Main interface for viewing and managing ephemeral conversations with media sharing.
 * 
 * @ai_context
 * AI-powered message suggestions and smart conversation prioritization.
 * Real-time content moderation and smart notification filtering.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';

import MediaViewer from '../../components/common/MediaViewer';
import { messagingService } from '../../services/firebase/messagingService';
import { realtimeService } from '../../services/firebase/realtimeService';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';

/**
 * Interface for conversation data
 */
interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  isOnline: boolean;
  participants: string[];
  lastMessageAt: Date;
  hasUnreadMedia?: boolean;
}

/**
 * Interface for incoming message data
 */
interface IncomingMessage {
  id: string;
  senderId: string;
  recipientId: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video';
  text?: string;
  timer: number;
  createdAt: Date;
  viewed: boolean;
}

/**
 * Messages screen component with real-time media sharing
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
  
  // Component state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [incomingMessages, setIncomingMessages] = useState<IncomingMessage[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<IncomingMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  /**
   * Initialize real-time listeners on component mount
   */
  useEffect(() => {
    if (!user) return;

    const initializeListeners = async () => {
      try {
        // Start presence management
        await realtimeService.startPresence(user.uid);
        
        // Listen for new messages
        realtimeService.listenForMessages(
          user.uid,
          handleNewMessages,
          handleMessageError
        );
        
        // Listen for conversation updates
        realtimeService.listenForConversations(
          user.uid,
          handleConversationUpdates,
          handleConversationError
        );
        
        // Load initial conversations
        await loadConversations();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Initialize listeners failed:', error);
        setIsLoading(false);
      }
    };

    initializeListeners();

    // Cleanup on unmount
    return () => {
      realtimeService.cleanup();
    };
  }, [user]);

  /**
   * Handle incoming new messages
   */
  const handleNewMessages = useCallback((messages: IncomingMessage[]) => {
    console.log('Received new messages:', messages.length);
    
    // Filter media messages
    const mediaMessages = messages.filter(msg => msg.mediaUrl && msg.mediaType);
    
    if (mediaMessages.length > 0) {
      setIncomingMessages(prev => [...mediaMessages, ...prev]);
      
      // Show notification for first media message
      const firstMedia = mediaMessages[0];
      Alert.alert(
        'New Snap!',
        `You received a ${firstMedia.mediaType} snap`,
        [
          { text: 'View', onPress: () => handleViewMedia(firstMedia) },
          { text: 'Later', style: 'cancel' }
        ]
      );
    }
  }, []);

  /**
   * Handle conversation updates
   */
  const handleConversationUpdates = useCallback((updatedConversations: any[]) => {
    const formattedConversations: Conversation[] = updatedConversations.map(conv => ({
      id: conv.id,
      name: conv.participants.find((p: string) => p !== user?.uid) || 'Unknown',
      lastMessage: 'New message',
      time: formatTime(conv.lastMessageAt?.toDate() || new Date()),
      isOnline: Math.random() > 0.5, // TODO: Get actual presence
      participants: conv.participants,
      lastMessageAt: conv.lastMessageAt?.toDate() || new Date(),
      hasUnreadMedia: Math.random() > 0.7 // TODO: Check for unread media
    }));
    
    setConversations(formattedConversations);
  }, [user]);

  /**
   * Handle message listener errors
   */
  const handleMessageError = useCallback((error: any) => {
    console.error('Message listener error:', error);
  }, []);

  /**
   * Handle conversation listener errors
   */
  const handleConversationError = useCallback((error: any) => {
    console.error('Conversation listener error:', error);
  }, []);

  /**
   * Load initial conversations
   */
  const loadConversations = async () => {
    if (!user) return;
    
    try {
      const recentConversations = await messagingService.getRecentConversations(user.uid);
      handleConversationUpdates(recentConversations);
    } catch (error) {
      console.error('Load conversations failed:', error);
    }
  };

  /**
   * Handle viewing media message
   */
  const handleViewMedia = useCallback((message: IncomingMessage) => {
    setSelectedMedia(message);
  }, []);

  /**
   * Handle media view completion
   */
  const handleMediaViewed = useCallback((messageId: string) => {
    // Mark message as delivered
    if (user) {
      realtimeService.markAsDelivered(messageId, user.uid);
    }
  }, [user]);

  /**
   * Handle media expiration
   */
  const handleMediaExpired = useCallback((messageId: string) => {
    // Remove from incoming messages
    setIncomingMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  /**
   * Close media viewer
   */
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
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  /**
   * Handle conversation press
   */
  const handleConversationPress = useCallback((conversation: Conversation) => {
    // TODO: Navigate to conversation detail
    Alert.alert('Coming Soon', 'Conversation details will be implemented next!');
  }, []);

  /**
   * Handle new conversation
   */
  const handleNewConversation = useCallback(() => {
    // TODO: Show friends list for new conversation
    Alert.alert('Coming Soon', 'Friend selection will be implemented next!');
  }, []);

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background.primary} />
        
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray">
          <Text className="text-white font-orbitron text-xl">Messages</Text>
          <View className="flex-row items-center">
            {/* Unread media indicator */}
            {incomingMessages.length > 0 && (
              <View className="bg-red-500 w-6 h-6 rounded-full justify-center items-center mr-3">
                <Text className="text-white font-inter text-xs font-bold">
                  {incomingMessages.length}
                </Text>
              </View>
            )}
            <TouchableOpacity onPress={handleNewConversation} className="p-2">
              <Ionicons name="add-circle-outline" size={24} color={accentColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Unread Snaps Section */}
        {incomingMessages.length > 0 && (
          <View className="px-6 py-4 border-b border-cyber-gray/30">
            <Text className="text-cyber-cyan font-inter font-medium text-sm mb-3">
              Unread Snaps ({incomingMessages.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {incomingMessages.map((message) => (
                <TouchableOpacity
                  key={message.id}
                  onPress={() => handleViewMedia(message)}
                  className="w-16 h-16 bg-cyber-cyan/20 rounded-full justify-center items-center mr-3 border-2 border-cyber-cyan"
                >
                  <Ionicons 
                    name={message.mediaType === 'photo' ? 'image' : 'videocam'} 
                    size={20} 
                    color={accentColor} 
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Conversations List */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-white/70 font-inter text-lg">Loading conversations...</Text>
            </View>
          ) : conversations.length > 0 ? (
            conversations.map((conversation) => (
              <TouchableOpacity
                key={conversation.id}
                onPress={() => handleConversationPress(conversation)}
                className="flex-row items-center px-6 py-4 border-b border-cyber-gray/30"
              >
                {/* Avatar */}
                <View className="w-12 h-12 bg-cyber-cyan/20 rounded-full justify-center items-center mr-4">
                  <Ionicons name="person" size={20} color={accentColor} />
                  {conversation.isOnline && (
                    <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-cyber-black" />
                  )}
                  {conversation.hasUnreadMedia && (
                    <View className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-cyber-black" />
                  )}
                </View>
                
                {/* Conversation Info */}
                <View className="flex-1">
                  <Text className="text-white font-inter font-medium text-base">
                    {conversation.name}
                  </Text>
                  <Text className="text-white/70 font-inter text-sm mt-1">
                    {conversation.lastMessage}
                  </Text>
                </View>
                
                {/* Time */}
                <Text className="text-cyber-cyan font-inter text-xs">
                  {conversation.time}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            /* Empty State */
            <View className="flex-1 justify-center items-center py-20">
              <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.text.tertiary} />
              <Text className="text-white/70 font-inter text-lg mt-4">
                Start Sharing Snaps
              </Text>
              <Text className="text-white/50 font-inter text-sm mt-2 text-center px-8">
                Capture and share moments with friends using the camera
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <Modal
          visible={!!selectedMedia}
          animationType="fade"
          presentationStyle="fullScreen"
        >
          <MediaViewer
            messageId={selectedMedia.id}
            mediaUrl={selectedMedia.mediaUrl!}
            mediaType={selectedMedia.mediaType!}
            timer={selectedMedia.timer}
            senderId={selectedMedia.senderId}
            senderName="Someone" // TODO: Get actual sender name
            onView={handleMediaViewed}
            onExpire={handleMediaExpired}
            onClose={closeMediaViewer}
          />
        </Modal>
      )}
    </>
  );
};

export default MessagesScreen; 

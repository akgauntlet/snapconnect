/**
 * @file ChatScreen.tsx
 * @description Individual chat screen for ephemeral messaging with media sharing.
 * Provides full chat interface with message bubbles, camera integration, and real-time updates.
 * 
 * @author SnapConnect Team
 * @created 2024-01-24
 * 
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @expo/vector-icons: Icons
 * - @/stores/themeStore: Theme management
 * - @/stores/authStore: Authentication state
 * - @/services/firebase/messagingService: Message handling
 * - @/services/firebase/realtimeService: Real-time updates
 * 
 * @usage
 * Navigation: MessagesScreen -> ChatScreen
 * Route params: { conversationId, friendId, friendName }
 * 
 * @ai_context
 * AI-powered message suggestions, content moderation, and smart replies.
 * Gaming context awareness for enhanced communication experience.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import MediaViewer from '../../components/common/MediaViewer';
import { friendsService } from '../../services/firebase/friendsService';
import { messagingService } from '../../services/firebase/messagingService';
import { realtimeService } from '../../services/firebase/realtimeService';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { showAlert } from '../../utils/alertService';

/**
 * Route parameters interface
 */
interface ChatScreenParams {
  conversationId: string;
  friendId: string;
  friendName: string;
}

/**
 * Message interface
 */
interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video';
  timer?: number;
  createdAt: Date;
  viewed: boolean;
  viewedAt?: Date;
  expiresAt?: Date;
  status: 'sent' | 'delivered' | 'viewed' | 'expired';
}

/**
 * Individual chat screen component with ephemeral messaging
 * 
 * @returns {React.ReactElement} Rendered chat interface
 * 
 * @performance
 * - Optimized FlatList for message rendering
 * - Efficient real-time message synchronization
 * - Smart keyboard handling and auto-scroll
 * 
 * @ai_integration
 * - Smart message suggestions based on context
 * - AI-powered content filtering and moderation
 * - Gaming context-aware communication features
 */
const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const { user } = useAuthStore();
  
  // Get route parameters
  const params = route.params as ChatScreenParams;
  const { friendId, friendName } = params;
  
  // Component state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [friendOnlineStatus, setFriendOnlineStatus] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [friendDisplayName, setFriendDisplayName] = useState(friendName || 'Loading...');
  const [selectedMedia, setSelectedMedia] = useState<{
    messageId: string;
    mediaUrl: string;
    mediaType: 'photo' | 'video';
    timer: number;
    senderId: string;
    senderName: string;
  } | null>(null);
  
  // Refs
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  /**
   * Handle back navigation
   */
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  /**
   * Load conversation messages
   */
  const loadMessages = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Query messages between the two users directly instead of using getConversationMessages
      const db = messagingService.getDB() as any;
      
      // Get messages where current user is sender and friend is recipient, OR vice versa
      const [sentMessages, receivedMessages] = await Promise.all([
        db.collection('messages')
          .where('senderId', '==', user.uid)
          .where('recipientId', '==', friendId)
          .orderBy('createdAt', 'desc')
          .limit(25)
          .get(),
        db.collection('messages')
          .where('senderId', '==', friendId)
          .where('recipientId', '==', user.uid)
          .orderBy('createdAt', 'desc')
          .limit(25)
          .get()
      ]);
      
      const allMessages: any[] = [];
      
      // Combine sent and received messages
      sentMessages.forEach((doc: any) => {
        const data = doc.data();
        // Only include non-expired messages
        if (!data.expiresAt || data.expiresAt.toDate() > new Date()) {
          allMessages.push({ id: doc.id, ...data });
        }
      });
      
      receivedMessages.forEach((doc: any) => {
        const data = doc.data();
        // Only include non-expired messages
        if (!data.expiresAt || data.expiresAt.toDate() > new Date()) {
          allMessages.push({ id: doc.id, ...data });
        }
      });
      
      // Sort by creation time (oldest first for proper display)
      const sortedMessages = allMessages.sort((a, b) => 
        a.createdAt?.toDate()?.getTime() - b.createdAt?.toDate()?.getTime()
      );
      
      const formattedMessages: Message[] = sortedMessages.map(msg => ({
        id: msg.id,
        senderId: msg.senderId,
        recipientId: msg.recipientId,
        text: msg.text || '',
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType,
        timer: msg.timer,
        createdAt: msg.createdAt?.toDate() || new Date(),
        viewed: msg.viewed || false,
        viewedAt: msg.viewedAt?.toDate(),
        expiresAt: msg.expiresAt?.toDate(),
        status: msg.status || 'sent'
      }));
      
      setMessages(formattedMessages);
      
      // Auto-scroll to bottom after messages load
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Load messages failed:', error);
      showAlert('Error', 'Failed to load messages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user, friendId]);

  /**
   * Load friend online status
   */
  const loadFriendStatus = useCallback(async () => {
    try {
      const presence = await friendsService.getUserPresence(friendId) as { isOnline?: boolean } | null;
      setFriendOnlineStatus(presence?.isOnline || false);
    } catch (error) {
      console.error('Load friend status failed:', error);
    }
  }, [friendId]);

  /**
   * Load friend profile data including display name
   */
  const loadFriendProfile = useCallback(async () => {
    try {
      const friendProfile = await friendsService.getUserProfile(friendId) as any;
      if (friendProfile) {
        // Use displayName first, then username, then fallback
        const displayName = friendProfile.displayName || friendProfile.username || friendName || 'Unknown User';
        setFriendDisplayName(displayName);
      }
    } catch (error) {
      console.error('Load friend profile failed:', error);
      // Keep the original friendName if profile loading fails
      setFriendDisplayName(friendName || 'Unknown User');
    }
  }, [friendId, friendName]);

  /**
   * Handle new message from real-time listener
   */
  const handleNewMessage = useCallback((newMessages: any[]) => {
    const relevantMessages = newMessages.filter(msg => 
      (msg.senderId === friendId && msg.recipientId === user?.uid) ||
      (msg.senderId === user?.uid && msg.recipientId === friendId)
    );
    
    if (relevantMessages.length > 0) {
      const formattedMessages: Message[] = relevantMessages.map(msg => ({
        id: msg.id,
        senderId: msg.senderId,
        recipientId: msg.recipientId,
        text: msg.text || '',
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType,
        timer: msg.timer,
        createdAt: msg.createdAt?.toDate() || new Date(),
        viewed: msg.viewed || false,
        viewedAt: msg.viewedAt?.toDate(),
        expiresAt: msg.expiresAt?.toDate(),
        status: msg.status || 'sent'
      }));
      
      setMessages(prev => {
        const existing = prev.filter(msg => !formattedMessages.find(newMsg => newMsg.id === msg.id));
        const combined = [...existing, ...formattedMessages].sort((a, b) => 
          a.createdAt.getTime() - b.createdAt.getTime()
        );
        return combined;
      });
      
      // Auto-scroll to bottom for new messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [friendId, user]);

  /**
   * Handle friend presence updates
   */
  const handlePresenceUpdate = useCallback((presenceData: any) => {
    if (presenceData.userId === friendId) {
      setFriendOnlineStatus(presenceData.isOnline || false);
    }
  }, [friendId]);

  /**
   * Initialize screen and listeners
   */
  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      const initializeScreen = async () => {
        await Promise.all([
          loadMessages(),
          loadFriendStatus(),
          loadFriendProfile()
        ]);
        
        // Set up real-time listeners
        realtimeService.listenForMessages(user.uid, handleNewMessage, console.error);
        realtimeService.listenForPresence(friendId, handlePresenceUpdate, console.error);
      };

      initializeScreen();

      return () => {
        realtimeService.cleanup();
      };
    }, [user, friendId, loadMessages, loadFriendStatus, loadFriendProfile, handleNewMessage, handlePresenceUpdate])
  );

  /**
   * Handle keyboard show/hide
   */
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    
    const keyboardWillHide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardWillShow?.remove();
      keyboardWillHide?.remove();
    };
  }, []);

  /**
   * Send media message (photo or video)
   */
  const sendMediaMessage = useCallback(async (asset: ImagePicker.ImagePickerAsset) => {
    if (!user || isSending) return;
    
    setIsSending(true);
    
    const mediaType = asset.type === 'video' ? 'video' : 'photo';
    
    // Create optimistic message to show immediately
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`, // Temporary ID
      senderId: user.uid,
      recipientId: friendId,
      text: '',
      mediaUrl: asset.uri, // Use local URI for preview
      mediaType: mediaType,
      timer: 5,
      createdAt: new Date(),
      viewed: false,
      viewedAt: undefined,
      expiresAt: undefined,
      status: 'sent'
    };
    
    // Add optimistic message to UI immediately
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Auto-scroll to show the new message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      // Get file size
      let fileSize = 0;
      try {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        fileSize = blob.size;
      } catch (sizeError) {
        console.warn('Could not determine file size:', sizeError);
      }
      
      const mediaData = {
        uri: asset.uri,
        type: mediaType,
        size: fileSize
      };
      
      const messageId = await messagingService.sendMessage(
        user.uid,
        friendId,
        mediaData,
        5, // 5 second timer
        '' // No text for media messages
      );
      
      // Update the optimistic message with the real message ID and uploaded URL
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id 
          ? { ...msg, id: messageId, status: 'delivered' }
          : msg
      ));
      
      // Haptic feedback for success
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      console.log('✅ Media message sent successfully:', messageId);
    } catch (error) {
      console.error('Send media message failed:', error);
      
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      showAlert('Error', 'Failed to send media. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [user, friendId, isSending]);

  /**
   * Handle camera/media picker
   */
  const handleCameraPress = useCallback(async () => {
    console.log('📸 Camera button pressed');
    
    if (!user) {
      console.error('❌ User not authenticated');
      showAlert('Authentication Error', 'Please log in to send media.');
      return;
    }
    
    console.log('✅ User authenticated, showing media options');
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Show options for media - simplified for web compatibility
      if (Platform.OS === 'web') {
        // On web, both options use file picker, so just show one option
        showAlert(
          'Select Media',
          'Choose a photo or video from your device',
          [
            {
              text: 'Select File',
              onPress: async () => {
                console.log('📁 File selection for web');
                try {
                  // Request media library permissions (works on web as file picker)
                  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  console.log('📁 Media library permission status:', status);
                  
                  if (status !== 'granted') {
                    showAlert('Permission Required', 'File access is needed to select media.');
                    return;
                  }
                  
                  // Launch file picker (works reliably on web)
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.All,
                    allowsEditing: false,
                    quality: 0.8,
                  });

                  console.log('📁 File picker result:', result);

                  if (!result.canceled && result.assets && result.assets.length > 0) {
                    const asset = result.assets[0];
                    console.log('📁 Selected asset:', asset);
                    await sendMediaMessage(asset);
                  }
                } catch (error) {
                  console.error('File selection failed:', error);
                  showAlert('Error', 'Failed to select file. Please try again.');
                }
              }
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => console.log('❌ Media selection canceled')
            }
          ]
        );
      } else {
        // On mobile, show both camera and photo library options
        showAlert(
          'Send Photo or Video',
          'Choose how you\'d like to add media',
          [
            {
              text: 'Camera',
              onPress: async () => {
                console.log('📷 Camera option selected');
                try {
                  // Request camera permissions
                  const { status } = await ImagePicker.requestCameraPermissionsAsync();
                  console.log('📷 Camera permission status:', status);
                  
                  if (status !== 'granted') {
                    showAlert('Permission Required', 'Camera access is needed to take photos and videos.');
                    return;
                  }
                  
                  // Launch camera
                  const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.All,
                    allowsEditing: false,
                    quality: 0.8,
                    videoMaxDuration: 60, // 60 seconds max
                  });

                  console.log('📷 Camera result:', result);

                  if (!result.canceled && result.assets && result.assets.length > 0) {
                    const asset = result.assets[0];
                    console.log('📷 Selected asset:', asset);
                    await sendMediaMessage(asset);
                  }
                } catch (error) {
                  console.error('Camera launch failed:', error);
                  showAlert('Error', 'Failed to open camera. Please try again.');
                }
              }
            },
            {
              text: 'Photo Library',
              onPress: async () => {
                console.log('🖼️ Photo library option selected');
                try {
                  // Request media library permissions
                  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  console.log('🖼️ Media library permission status:', status);
                  
                  if (status !== 'granted') {
                    showAlert('Permission Required', 'Photo library access is needed to select media.');
                    return;
                  }
                  
                  // Launch media library
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.All,
                    allowsEditing: false,
                    quality: 0.8,
                  });

                  console.log('🖼️ Photo library result:', result);

                  if (!result.canceled && result.assets && result.assets.length > 0) {
                    const asset = result.assets[0];
                    console.log('🖼️ Selected asset:', asset);
                    await sendMediaMessage(asset);
                  }
                } catch (error) {
                  console.error('Media library launch failed:', error);
                  showAlert('Error', 'Failed to open photo library. Please try again.');
                }
              }
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => console.log('❌ Media selection canceled')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Camera press failed:', error);
      showAlert('Error', 'Something went wrong. Please try again.');
    }
  }, [user, sendMediaMessage]);

  /**
   * Send text message
   */
  const handleSendMessage = useCallback(async () => {
    if (!user || !inputText.trim() || isSending) return;
    
    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);
    
    // Create optimistic message to show immediately
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`, // Temporary ID
      senderId: user.uid,
      recipientId: friendId,
      text: messageText,
      mediaUrl: undefined,
      mediaType: undefined,
      timer: 5,
      createdAt: new Date(),
      viewed: false,
      viewedAt: undefined,
      expiresAt: undefined,
      status: 'sent'
    };
    
    // Add optimistic message to UI immediately
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Auto-scroll to show the new message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      const messageId = await messagingService.sendMessage(
        user.uid,
        friendId,
        {}, // No media
        5, // 5 second timer
        messageText
      );
      
      // Update the optimistic message with the real message ID
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id 
          ? { ...msg, id: messageId, status: 'delivered' }
          : msg
      ));
      
      console.log('✅ Text message sent successfully:', messageId);
    } catch (error) {
      console.error('Send text message failed:', error);
      
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      // Restore the input text
      setInputText(messageText);
      
      showAlert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [user, friendId, inputText, isSending]);

  /**
   * Format timestamp for display
   */
  const formatMessageTime = useCallback((date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  }, []);

  /**
   * Handle opening media in fullscreen viewer
   */
  const handleMediaPress = useCallback((message: Message) => {
    if (!message.mediaUrl) return;
    
    // Get sender display name
    const senderName = message.senderId === user?.uid 
      ? 'You' 
      : friendDisplayName;
    
    setSelectedMedia({
      messageId: message.id,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType || 'photo',
      timer: message.timer || 5,
      senderId: message.senderId,
      senderName: senderName
    });
  }, [user, friendDisplayName]);

  /**
   * Handle closing media viewer
   */
  const handleCloseMediaViewer = useCallback(() => {
    setSelectedMedia(null);
  }, []);

  /**
   * Handle media view event
   */
  const handleMediaView = useCallback((messageId: string) => {
    console.log('Media viewed:', messageId);
    // Update message status if needed
  }, []);

  /**
   * Handle media expire event
   */
  const handleMediaExpire = useCallback((messageId: string) => {
    console.log('Media expired:', messageId);
    // Could remove the message from UI or mark as expired
  }, []);

  /**
   * Render individual message bubble
   */
  const renderMessage = useCallback(({ item: message }: { item: Message }) => {
    const isFromMe = message.senderId === user?.uid;
    const hasMedia = !!message.mediaUrl;
    const hasText = !!message.text && message.text.trim().length > 0;
    
    return (
      <View
        className={`mb-3 mx-4 ${isFromMe ? 'items-end' : 'items-start'}`}
      >
        <TouchableOpacity
          className={`max-w-xs rounded-2xl px-4 py-3 ${
            isFromMe 
              ? 'bg-cyber-cyan/20 border border-cyber-cyan/30' 
              : 'bg-cyber-dark/40 border border-cyber-gray/20'
          }`}
          style={{
            shadowColor: isFromMe ? accentColor : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          {/* Media content */}
          {hasMedia && message.mediaUrl && (
            <View className="mb-2 rounded-lg overflow-hidden">
              {message.mediaType === 'photo' ? (
                <TouchableOpacity
                  onPress={() => handleMediaPress(message)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: message.mediaUrl }}
                    style={{
                      width: 200,
                      height: 200,
                      borderRadius: 8,
                    }}
                    contentFit="cover"
                    placeholder={{
                      blurhash: 'LGFFaXYk^6#M@-5c,1J5@[or[Q6.'
                    }}
                  />
                </TouchableOpacity>
              ) : message.mediaType === 'video' ? (
                <TouchableOpacity
                  onPress={() => handleMediaPress(message)}
                  activeOpacity={0.8}
                >
                  <View style={{ width: 200, height: 200, borderRadius: 8, overflow: 'hidden' }}>
                    <Video
                      source={{ uri: message.mediaUrl }}
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                      useNativeControls
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={false}
                      isLooping={false}
                    />
                  </View>
                </TouchableOpacity>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons 
                    name={message.mediaType === 'video' ? 'videocam' : 'camera'} 
                    size={16} 
                    color={isFromMe ? accentColor : '#ffffff'} 
                  />
                  <Text className={`ml-2 font-inter text-sm ${
                    isFromMe ? 'text-cyber-cyan' : 'text-white'
                  }`}>
                    {message.mediaType === 'video' ? 'Video' : 'Photo'}
                    {message.timer && ` • ${message.timer}s`}
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Text content */}
          {hasText && (
            <Text className={`font-inter text-base ${
              isFromMe ? 'text-white' : 'text-white'
            } ${hasMedia ? 'mt-2' : ''}`}>
              {message.text}
            </Text>
          )}
          
          {/* Message status and time */}
          <View className={`flex-row items-center justify-between ${hasText || hasMedia ? 'mt-2' : ''}`}>
            <Text className={`font-jetbrains text-xs ${
              isFromMe ? 'text-cyber-cyan/60' : 'text-white/40'
            }`}>
              {formatMessageTime(message.createdAt)}
            </Text>
            
            {isFromMe && (
              <View className="ml-2">
                <Ionicons 
                  name={
                    message.status === 'viewed' ? 'checkmark-done' :
                    message.status === 'delivered' ? 'checkmark' : 'time'
                  }
                  size={12} 
                  color={
                    message.status === 'viewed' ? '#00ff41' :
                    message.status === 'delivered' ? accentColor : '#808080'
                  }
                />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [user, accentColor, formatMessageTime, handleMediaPress]);

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-8">
      <Ionicons name="chatbubbles-outline" size={64} color="rgba(0, 255, 255, 0.3)" />
      <Text className="text-white/70 font-orbitron text-xl mt-6 mb-2 text-center">
        Start the Conversation
      </Text>
      <Text className="text-white/50 font-inter text-base text-center">
        Send a message or snap to {friendDisplayName}
      </Text>
    </View>
  );

  /**
   * Render loading state
   */
  const renderLoadingState = () => (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color={accentColor} />
      <Text className="text-white/60 font-inter text-base mt-4">
        Loading messages...
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background.primary} />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-cyber-gray/10">
        <TouchableOpacity
          onPress={handleBack}
          className="p-2 -ml-2"
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View className="flex-1 ml-3">
          <Text className="text-white font-inter font-semibold text-lg" numberOfLines={1}>
            {friendDisplayName}
          </Text>
          <Text className={`font-inter text-sm ${
            friendOnlineStatus ? 'text-cyber-green' : 'text-white/40'
          }`}>
            {friendOnlineStatus ? 'Online now' : 'Offline'}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => showAlert('Info', 'Profile and options coming soon!')}
          className="p-2"
        >
          <Ionicons name="information-circle-outline" size={24} color={accentColor} />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          renderLoadingState()
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: 16,
              flexGrow: messages.length === 0 ? 1 : 0
            }}
            onContentSizeChange={() => {
              // Auto-scroll to bottom when content changes
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />
        )}

        {/* Input Area */}
        <View 
          className="flex-row items-end px-4 py-3 bg-cyber-dark/20 border-t border-cyber-gray/10"
          style={{ paddingBottom: Math.max(keyboardHeight > 0 ? 8 : 16, 16) }}
        >
          <TouchableOpacity
            onPress={handleCameraPress}
            className="p-3 bg-cyber-cyan/10 border border-cyber-cyan/20 rounded-full mr-3"
            activeOpacity={0.7}
            disabled={isSending}
            style={{ opacity: isSending ? 0.5 : 1 }}
          >
            <Ionicons name="camera" size={20} color={accentColor} />
          </TouchableOpacity>
          
          <View className="flex-1 flex-row items-end">
            <TextInput
              ref={inputRef}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Send a message..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
              maxLength={500}
              className="flex-1 bg-cyber-dark/30 border border-cyber-gray/20 rounded-2xl px-4 py-3 text-white font-inter text-base"
              style={{
                maxHeight: 100,
                minHeight: 44,
                textAlignVertical: 'center',
              }}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={false}
            />
            
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isSending}
              className={`ml-3 p-3 rounded-full ${
                inputText.trim() && !isSending
                  ? 'bg-cyber-cyan' 
                  : 'bg-cyber-gray/20'
              }`}
              style={{
                opacity: inputText.trim() && !isSending ? 1 : 0.5,
              }}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={inputText.trim() ? '#000000' : '#ffffff'} 
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      
      {/* Media Viewer */}
      {selectedMedia && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
          <MediaViewer
            messageId={selectedMedia.messageId}
            mediaUrl={selectedMedia.mediaUrl}
            mediaType={selectedMedia.mediaType}
            timer={selectedMedia.timer}
            senderId={selectedMedia.senderId}
            senderName={selectedMedia.senderName}
            onView={handleMediaView}
            onExpire={handleMediaExpire}
            onClose={handleCloseMediaViewer}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default ChatScreen; 

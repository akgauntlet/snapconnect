/**
 * @file RecipientSelector.tsx
 * @description Recipient selection component for sending snaps to friends.
 * Handles friend list, search, and multiple recipient selection.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
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

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useThemeStore } from '../../stores/themeStore';

/**
 * Friend interface for typing
 */
interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  lastSeen?: Date;
  isOnline?: boolean;
}

/**
 * Media data interface for sending
 */
interface MediaData {
  uri: string;
  type: 'photo' | 'video';
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
 * Recipient selector component for choosing snap recipients
 */
const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  visible,
  mediaData,
  onSend,
  onClose
}) => {
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  
  // Component state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimer, setSelectedTimer] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Timer options
  const timerOptions = [1, 3, 5, 10];

  /**
   * Load friends list on component mount
   */
  useEffect(() => {
    if (visible) {
      loadFriends();
    }
  }, [visible]);

  /**
   * Filter friends based on search query
   */
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend =>
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [friends, searchQuery]);

  /**
   * Load friends from Firebase
   */
  const loadFriends = async () => {
    try {
      setIsLoading(true);
      
      // TODO: Implement actual friends loading from Firebase
      // For now, using mock data
      const mockFriends: Friend[] = [
        {
          id: 'friend-1',
          name: 'Alex Johnson',
          username: 'alexj',
          isOnline: true,
        },
        {
          id: 'friend-2',
          name: 'Sarah Williams',
          username: 'sarahw',
          isOnline: false,
          lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
        },
        {
          id: 'friend-3',
          name: 'Mike Chen',
          username: 'mikec',
          isOnline: true,
        },
        {
          id: 'friend-4',
          name: 'Emma Davis',
          username: 'emmad',
          isOnline: false,
          lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
        },
      ];
      
      setFriends(mockFriends);
    } catch (error) {
      console.error('Load friends failed:', error);
      Alert.alert('Error', 'Failed to load friends list.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle recipient selection
   */
  const toggleRecipient = useCallback(async (friendId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      setSelectedRecipients(prev => {
        if (prev.includes(friendId)) {
          return prev.filter(id => id !== friendId);
        } else {
          return [...prev, friendId];
        }
      });
    } catch (error) {
      console.error('Toggle recipient failed:', error);
    }
  }, []);

  /**
   * Handle sending to selected recipients
   */
  const handleSend = useCallback(async () => {
    if (selectedRecipients.length === 0) {
      Alert.alert('No Recipients', 'Please select at least one friend to send to.');
      return;
    }

    if (!mediaData) {
      Alert.alert('No Media', 'No media available to send.');
      return;
    }

    try {
      setIsSending(true);
      
      // Send to all selected recipients
      await onSend(selectedRecipients, selectedTimer);
      
      // Clear selections
      setSelectedRecipients([]);
      setSearchQuery('');
      
      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error('Send failed:', error);
      Alert.alert('Send Failed', 'Failed to send snap. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [selectedRecipients, selectedTimer, mediaData, onSend, onClose]);

  /**
   * Handle close modal
   */
  const handleClose = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Clear selections
      setSelectedRecipients([]);
      setSearchQuery('');
      
      onClose();
    } catch (error) {
      console.error('Handle close failed:', error);
    }
  }, [onClose]);

  /**
   * Format last seen time
   */
  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
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
  const renderFriendItem = ({ item }: { item: Friend }) => {
    const isSelected = selectedRecipients.includes(item.id);
    
    return (
      <TouchableOpacity
        onPress={() => toggleRecipient(item.id)}
        className={`flex-row items-center p-4 mx-4 mb-2 rounded-lg ${
          isSelected ? 'bg-cyber-cyan/20 border border-cyber-cyan' : 'bg-cyber-gray/20'
        }`}
        disabled={isSending}
      >
        {/* Avatar */}
        <View className={`w-12 h-12 rounded-full justify-center items-center mr-3 ${
          item.isOnline ? 'bg-green-500/20 border border-green-500' : 'bg-gray-500/20 border border-gray-500'
        }`}>
          <Text className="text-white font-inter font-semibold text-lg">
            {item.name.charAt(0).toUpperCase()}
          </Text>
          
          {/* Online indicator */}
          {item.isOnline && (
            <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-cyber-black" />
          )}
        </View>
        
        {/* Friend info */}
        <View className="flex-1">
          <Text className="text-white font-inter font-medium text-base">
            {item.name}
          </Text>
          <Text className="text-white/60 font-inter text-sm">
            @{item.username} • {item.isOnline ? 'Online' : formatLastSeen(item.lastSeen!)}
          </Text>
        </View>
        
        {/* Selection indicator */}
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={accentColor} />
        )}
      </TouchableOpacity>
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
              Send To
            </Text>
            
            <TouchableOpacity
              onPress={handleSend}
              disabled={selectedRecipients.length === 0 || isSending}
              className={`px-4 py-2 rounded-lg ${
                selectedRecipients.length > 0 && !isSending
                  ? 'bg-cyber-cyan'
                  : 'bg-cyber-gray/20'
              }`}
            >
              <Text
                className={`font-inter font-semibold ${
                  selectedRecipients.length > 0 && !isSending
                    ? 'text-cyber-black'
                    : 'text-white/40'
                }`}
              >
                {isSending ? 'Sending...' : 'Send'}
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
            </View>
          </View>

          {/* Timer Selection */}
          <View className="px-6 pb-4">
            <Text className="text-white font-inter font-medium mb-3">
              Timer: {selectedTimer}s
            </Text>
            <View className="flex-row justify-around">
              {timerOptions.map(timer => (
                <TouchableOpacity
                  key={timer}
                  onPress={() => setSelectedTimer(timer)}
                  className={`w-12 h-12 rounded-full justify-center items-center ${
                    selectedTimer === timer
                      ? 'bg-cyber-cyan'
                      : 'bg-cyber-gray/20 border border-cyber-gray/40'
                  }`}
                >
                  <Text
                    className={`font-inter font-semibold ${
                      selectedTimer === timer ? 'text-cyber-black' : 'text-white'
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
                {selectedRecipients.length} recipient{selectedRecipients.length !== 1 ? 's' : ''} selected
              </Text>
            </View>
          )}

          {/* Friends List */}
          <FlatList
            data={filteredFriends}
            renderItem={renderFriendItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View className="items-center py-12">
                <Ionicons name="people-outline" size={48} color="rgba(255,255,255,0.3)" />
                <Text className="text-white/60 font-inter text-lg mt-4 mb-2">
                  {isLoading ? 'Loading friends...' : 'No friends found'}
                </Text>
                {!isLoading && searchQuery && (
                  <Text className="text-white/40 font-inter text-sm text-center px-8">
                    Try searching with a different name or username
                  </Text>
                )}
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default RecipientSelector;

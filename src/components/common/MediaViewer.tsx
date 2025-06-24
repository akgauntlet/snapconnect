/**
 * @file MediaViewer.tsx
 * @description Media viewer component for displaying ephemeral photos and videos.
 * Handles disappearing message timer and interaction tracking.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * 
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - expo-image: Optimized image display
 * - expo-haptics: Haptic feedback
 * - @/services/firebase/messagingService: Message management
 * 
 * @usage
 * <MediaViewer
 *   messageId="message-id"
 *   mediaUrl="https://..."
 *   mediaType="photo"
 *   timer={5}
 *   senderId="sender-id"
 *   onView={handleView}
 *   onExpire={handleExpire}
 * />
 * 
 * @ai_context
 * Integrates with AI content moderation and viewing analytics.
 * Supports screenshot detection and automated content filtering.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { messagingService } from '../../services/firebase/messagingService';
import { useAuthStore } from '../../stores/authStore';

/**
 * Props for MediaViewer component
 */
interface MediaViewerProps {
  messageId: string;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  timer: number;
  senderId: string;
  senderName?: string;
  onView?: (messageId: string) => void;
  onExpire?: (messageId: string) => void;
  onClose?: () => void;
}

/**
 * Media viewer component with disappearing timer functionality
 */
const MediaViewer: React.FC<MediaViewerProps> = ({
  messageId,
  mediaUrl,
  mediaType,
  timer,
  senderId,
  senderName,
  onView,
  onExpire,
  onClose
}) => {
  const { user } = useAuthStore();
  
  // Component state
  const [isViewing, setIsViewing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timer);
  const [hasViewed, setHasViewed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  
  // Refs
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  /**
   * Start viewing the message and begin countdown
   */
  const startViewing = useCallback(async () => {
    if (isViewing || hasViewed) return;
    
    try {
      setIsViewing(true);
      setHasViewed(true);
      
      // Mark message as viewed
      if (user) {
        await messagingService.viewMessage(messageId, user.uid);
        onView?.(messageId);
      }
      
      // Start countdown timer
      timerInterval.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleExpire();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Start progress animation
      Animated.timing(progressAnimation, {
        toValue: 1,
        duration: timer * 1000,
        useNativeDriver: false,
      }).start();
      
      // Fade in content
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
    } catch (error) {
      console.error('Start viewing failed:', error);
      Alert.alert('Error', 'Failed to view message.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isViewing, hasViewed, messageId, timer, user, onView, fadeAnimation, progressAnimation]);

  /**
   * Handle message expiration
   */
  const handleExpire = useCallback(async () => {
    try {
      setIsViewing(false);
      
      // Clear timer
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      
      // Fade out content
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Notify parent
      onExpire?.(messageId);
      
      // Auto-close after fade out
      setTimeout(() => {
        onClose?.();
      }, 500);
      
    } catch (error) {
      console.error('Handle expire failed:', error);
    }
  }, [messageId, onExpire, onClose, fadeAnimation]);

  /**
   * Handle manual close
   */
  const handleClose = useCallback(async () => {
    try {
      // Clear timer
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      onClose?.();
    } catch (error) {
      console.error('Handle close failed:', error);
    }
  }, [onClose]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Top Controls */}
      <View className="flex-row justify-between items-center px-6 py-4 absolute top-0 left-0 right-0 z-20">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={handleClose} className="p-2 mr-3">
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          <View>
            <Text className="text-white font-inter font-medium">
              {senderName || 'Someone'}
            </Text>
            <Text className="text-white/60 font-inter text-sm">
              {isViewing ? `${timeRemaining}s remaining` : 'Tap to view'}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      {isViewing && (
        <View className="absolute top-16 left-0 right-0 z-20">
          <View className="h-1 bg-white/20 mx-6">
            <Animated.View
              className="h-full bg-white"
              style={{
                width: progressAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }}
            />
          </View>
        </View>
      )}

      {/* Media Content */}
      <Pressable
        style={{ flex: 1 }}
        onPress={startViewing}
        disabled={isViewing || hasViewed}
      >
        <View className="flex-1 justify-center items-center bg-black">
          {!hasViewed ? (
            // Tap to view state
            <View className="items-center">
              <View className="w-24 h-24 border-2 border-white/30 rounded-full justify-center items-center mb-6">
                <Ionicons 
                  name={mediaType === 'photo' ? 'image' : 'videocam'} 
                  size={32} 
                  color="white" 
                />
              </View>
              <Text className="text-white font-inter text-lg mb-2">
                Tap to view
              </Text>
              <Text className="text-white/60 font-inter text-sm text-center px-8">
                {mediaType === 'photo' ? 'Photo' : 'Video'} • {timer}s
              </Text>
            </View>
          ) : loadError ? (
            // Error state
            <View className="items-center">
              <Ionicons name="warning" size={48} color="#ef4444" />
              <Text className="text-white font-inter text-lg mt-4 mb-2">
                Failed to load media
              </Text>
              <Text className="text-white/60 font-inter text-sm text-center px-8">
                This snap may have expired or been removed.
              </Text>
            </View>
          ) : (
            // Media display
            <Animated.View
              style={{
                flex: 1,
                width: '100%',
                opacity: fadeAnimation,
              }}
            >
              {mediaType === 'photo' ? (
                <Image
                  source={{ uri: mediaUrl }}
                  style={{
                    flex: 1,
                    width: '100%',
                  }}
                  contentFit="contain"
                  onLoad={() => setIsLoading(false)}
                  onError={() => setLoadError(true)}
                  placeholder={null}
                  transition={200}
                />
              ) : (
                // TODO: Implement video player
                <View className="flex-1 justify-center items-center">
                  <Ionicons name="play-circle" size={64} color="white" />
                  <Text className="text-white font-inter text-lg mt-4">
                    Video playback coming soon
                  </Text>
                </View>
              )}
              
              {isLoading && (
                <View className="absolute inset-0 justify-center items-center bg-black/50">
                  <Text className="text-white font-inter">Loading...</Text>
                </View>
              )}
            </Animated.View>
          )}
        </View>
      </Pressable>
    </SafeAreaView>
  );
};

export default MediaViewer;

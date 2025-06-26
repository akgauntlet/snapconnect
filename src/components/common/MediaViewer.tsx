/**
 * @file MediaViewer.tsx
 * @description Enhanced media viewer component for displaying ephemeral photos and videos.
 * Handles disappearing message timer, video playback, and interaction tracking.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-24
 * 
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - expo-image: Optimized image display
 * - expo-av: Video playback
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
import { ResizeMode, Video } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Pressable,
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { messagingService } from '../../services/firebase/messagingService';
import { useAuthStore } from '../../stores/authStore';
import { showAlert, showErrorAlert } from '../../utils/alertService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  onScreenshot?: (messageId: string) => void;
}

/**
 * Enhanced media viewer component with disappearing timer functionality
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
  onClose,
  onScreenshot
}) => {
  const { user } = useAuthStore();
  
  // Component state
  const [isViewing, setIsViewing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timer);
  const [hasViewed, setHasViewed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // Video status state removed as it was unused
  
  // Refs
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<Video>(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.9)).current;

  /**
   * Handle message expiration
   */
  const handleExpire = useCallback(async () => {
    try {
      setIsViewing(false);
      
      // Pause video if playing
      if (mediaType === 'video' && videoRef.current) {
        await videoRef.current.pauseAsync();
      }
      
      // Clear timer
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      
      // Fade out and scale down content
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Notify parent
      onExpire?.(messageId);
      
      // Auto-close after fade out
      setTimeout(() => {
        onClose?.();
      }, 400);
      
    } catch (error) {
      console.error('Handle expire failed:', error);
      onClose?.();
    }
  }, [messageId, onExpire, onClose, fadeAnimation, scaleAnimation, mediaType]);

  /**
   * Start viewing the message and begin countdown
   */
  const startViewing = useCallback(async () => {
    if (isViewing || hasViewed) return;
    
    try {
      setIsViewing(true);
      setHasViewed(true);
      
      // Mark message as viewed in Firebase
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
      
      // Fade in and scale up content
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
      
      // Start video playback if it's a video
      if (mediaType === 'video' && videoRef.current) {
        await videoRef.current.playAsync();
      }
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
    } catch (error) {
      console.error('Start viewing failed:', error);
      showErrorAlert('Failed to view message.');
      handleExpire();
    }
  }, [isViewing, hasViewed, messageId, timer, user, onView, fadeAnimation, progressAnimation, scaleAnimation, mediaType, handleExpire]);

  /**
   * Handle manual close
   */
  const handleClose = useCallback(async () => {
    try {
      // Pause video if playing
      if (mediaType === 'video' && videoRef.current) {
        await videoRef.current.pauseAsync();
      }
      
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
      onClose?.();
    }
  }, [onClose, mediaType]);

  /**
   * Handle screenshot detection (placeholder - would need native module)
   */
  const handleScreenshotDetected = useCallback(async () => {
    try {
      if (user && onScreenshot) {
        await messagingService.reportScreenshot(messageId, user.uid);
        onScreenshot(messageId);
        
        // Show alert
        showAlert(
          'Screenshot Detected',
          'The sender has been notified that you took a screenshot.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Screenshot detection failed:', error);
    }
  }, [messageId, user, onScreenshot]);

  /**
   * Handle image load
   */
  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setLoadError(false);
  }, []);

  /**
   * Handle image error
   */
  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setLoadError(true);
  }, []);

  /**
   * Handle video load
   */
  const handleVideoLoad = useCallback((status: any) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setLoadError(false);
    }
  }, []);

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
            <Text className="text-white font-inter font-medium text-base">
              {senderName || 'Someone'}
            </Text>
            <Text className="text-white/60 font-inter text-sm">
              {isViewing ? `${timeRemaining}s remaining` : 'Tap to view'}
            </Text>
          </View>
        </View>

        {/* Timer display */}
        {isViewing && (
          <View className="bg-white/20 px-3 py-1 rounded-full">
            <Text className="text-white font-mono font-bold text-sm">
              {timeRemaining}
            </Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      {isViewing && (
        <View className="absolute top-20 left-0 right-0 z-20">
          <View className="h-1 bg-white/20 mx-6 rounded-full overflow-hidden">
            <Animated.View
              className="h-full bg-white rounded-full"
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
        onLongPress={handleScreenshotDetected}
      >
        <View className="flex-1 justify-center items-center bg-black">
          {!hasViewed ? (
            // Tap to view state
            <Animated.View 
              className="items-center"
              style={{
                transform: [{ scale: scaleAnimation }]
              }}
            >
              <View className="w-24 h-24 border-2 border-white/30 rounded-full justify-center items-center mb-6">
                <Ionicons 
                  name={mediaType === 'photo' ? 'image' : 'videocam'} 
                  size={32} 
                  color="white" 
                />
              </View>
              <Text className="text-white font-inter text-xl mb-2">
                Tap to view
              </Text>
              <Text className="text-white/60 font-inter text-base text-center px-8">
                {mediaType === 'photo' ? 'Photo' : 'Video'} • {timer}s
              </Text>
              <Text className="text-white/40 font-inter text-sm text-center px-8 mt-2">
                From {senderName || 'Someone'}
              </Text>
            </Animated.View>
          ) : loadError ? (
            // Error state
            <View className="items-center">
              <Ionicons name="warning" size={64} color="#ef4444" />
              <Text className="text-white font-inter text-xl mt-6 mb-2">
                Failed to load media
              </Text>
              <Text className="text-white/60 font-inter text-base text-center px-8">
                This snap may have expired or been removed.
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                className="mt-6 bg-white/20 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-inter font-semibold">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Media display
            <Animated.View
              style={{
                flex: 1,
                width: '100%',
                opacity: fadeAnimation,
                transform: [{ scale: scaleAnimation }]
              }}
            >
              {mediaType === 'photo' ? (
                <Image
                  source={{ uri: mediaUrl }}
                  style={{
                    width: screenWidth,
                    height: screenHeight,
                  }}
                  contentFit="contain"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  placeholder={null}
                  transition={200}
                />
              ) : (
                <Video
                  ref={videoRef}
                  source={{ uri: mediaUrl }}
                  style={{
                    width: screenWidth,
                    height: screenHeight,
                  }}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={false}
                  isLooping={false}
                  onPlaybackStatusUpdate={handleVideoLoad}
                  onError={handleImageError}
                />
              )}
              
              {isLoading && (
                <View className="absolute inset-0 justify-center items-center bg-black/50">
                  <Text className="text-white font-inter text-lg">Loading...</Text>
                </View>
              )}
            </Animated.View>
          )}
        </View>
      </Pressable>

      {/* Bottom hint */}
      {isViewing && (
        <View className="absolute bottom-8 left-0 right-0 items-center z-20">
          <Text className="text-white/60 font-inter text-sm">
            Hold to report • Tap elsewhere to close
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default MediaViewer;

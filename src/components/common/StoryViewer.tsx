/**
 * @file StoryViewer.tsx
 * @description Full-screen story viewer component for browsing through stories.
 * Features tap navigation, progress indicators, and story metadata display.
 *
 * @author SnapConnect Team
 * @created 2024-01-20
 *
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - expo-image: Optimized image display
 * - expo-haptics: Haptic feedback
 * - @/services/firebase/storiesService: Story management
 *
 * @usage
 * <StoryViewer
 *   stories={storyData}
 *   initialIndex={0}
 *   onClose={handleClose}
 *   onStoryViewed={handleViewed}
 * />
 *
 * @ai_context
 * Integrates with AI content analysis and viewing behavior tracking.
 * Supports smart story recommendations and engagement analytics.
 */

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTabBarHeight } from "../../hooks/useTabBarHeight";
import { storiesService } from "../../services/firebase/storiesService";
import { useAuthStore } from "../../stores/authStore";

/**
 * Story interface
 */
interface Story {
  id: string;
  mediaUrl: string;
  mediaType: "photo" | "video";
  text?: string;
  createdAt: any;
  hasViewed: boolean;
}

/**
 * Story user interface
 */
interface StoryUser {
  userId: string;
  user: {
    displayName: string;
    username?: string;
    profilePhoto?: string;
  };
  stories: Story[];
  hasUnviewed: boolean;
}

/**
 * Props for StoryViewer component
 */
interface StoryViewerProps {
  storyUsers: StoryUser[];
  initialUserIndex?: number;
  initialStoryIndex?: number;
  onClose: () => void;
  onStoryViewed?: (storyId: string) => void;
}

/**
 * Full-screen story viewer component
 */
const StoryViewer: React.FC<StoryViewerProps> = ({
  storyUsers,
  initialUserIndex = 0,
  initialStoryIndex = 0,
  onClose,
  onStoryViewed,
}) => {
  const { user } = useAuthStore();
  const { tabBarHeight } = useTabBarHeight();

  // Component state
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Story timing
  const [storyDuration] = useState(5000); // 5 seconds per story

  // Refs
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Current story data
  const currentUser = storyUsers[currentUserIndex];
  const currentStory = currentUser?.stories[currentStoryIndex];

  /**
   * Handle next story
   */
  const handleNextStory = useCallback(() => {
    if (
      currentUserIndex >= storyUsers.length - 1 &&
      currentStoryIndex >= currentUser.stories.length - 1
    ) {
      // Last story, close viewer
      onClose();
      return;
    }

    if (currentStoryIndex < currentUser.stories.length - 1) {
      // Next story in current user
      setCurrentStoryIndex((prev) => prev + 1);
    } else {
      // Next user's first story
      setCurrentUserIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
    }
  }, [
    currentUserIndex,
    currentStoryIndex,
    currentUser,
    storyUsers.length,
    onClose,
  ]);

  /**
   * Start story progress timer
   */
  const startProgress = useCallback(() => {
    if (isPaused) return;

    // Reset progress
    progressAnimation.setValue(0);

    // Clear existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    // Start progress animation
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: storyDuration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isPaused) {
        handleNextStory();
      }
    });

    // Progress tracking for cleanup
    const startTime = Date.now();
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / storyDuration, 1);

      if (newProgress >= 1) {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      }
    }, 50);
  }, [isPaused, storyDuration, progressAnimation, handleNextStory]);

  /**
   * Pause story progress
   */
  const pauseProgress = useCallback(() => {
    setIsPaused(true);
    progressAnimation.stopAnimation();
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
  }, [progressAnimation]);

  /**
   * Resume story progress
   */
  const resumeProgress = useCallback(() => {
    setIsPaused(false);
    startProgress();
  }, [startProgress]);

  /**
   * Handle previous story
   */
  const handlePreviousStory = useCallback(() => {
    if (currentUserIndex === 0 && currentStoryIndex === 0) {
      // First story, do nothing or close
      return;
    }

    if (currentStoryIndex > 0) {
      // Previous story in current user
      setCurrentStoryIndex((prev) => prev - 1);
    } else {
      // Previous user's last story
      const prevUserIndex = currentUserIndex - 1;
      if (prevUserIndex >= 0) {
        setCurrentUserIndex(prevUserIndex);
        setCurrentStoryIndex(storyUsers[prevUserIndex].stories.length - 1);
      }
    }
  }, [currentUserIndex, currentStoryIndex, storyUsers]);

  /**
   * Mark story as viewed
   */
  const markStoryAsViewed = useCallback(async () => {
    if (!currentStory || !user) return;

    try {
      await storiesService.viewStory(currentStory.id, user.uid);
      onStoryViewed?.(currentStory.id);
    } catch (error) {
      console.error("Mark story as viewed failed:", error);
    }
  }, [currentStory, user, onStoryViewed]);

  /**
   * Handle story change
   */
  useEffect(() => {
    if (currentStory) {
      setIsLoading(true);
      markStoryAsViewed();

      // Simulate loading time
      setTimeout(() => {
        setIsLoading(false);
        startProgress();
      }, 500);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentStory, markStoryAsViewed, startProgress]);

  /**
   * Handle tap on left/right sides
   */
  const handleTap = useCallback(
    (side: "left" | "right") => {
      if (side === "left") {
        handlePreviousStory();
      } else {
        handleNextStory();
      }
    },
    [handlePreviousStory, handleNextStory],
  );

  /**
   * Handle long press to pause
   */
  const handleLongPress = useCallback(() => {
    pauseProgress();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [pauseProgress]);

  /**
   * Handle press out to resume
   */
  const handlePressOut = useCallback(() => {
    if (isPaused) {
      resumeProgress();
    }
  }, [isPaused, resumeProgress]);

  /**
   * Format time ago
   */
  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return "";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  if (!currentUser || !currentStory) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Progress Bars */}
      <View className="absolute top-0 left-0 right-0 z-30 pt-12 px-4">
        <View className="flex-row space-x-1">
          {currentUser.stories.map((_, index) => (
            <View
              key={index}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              {index < currentStoryIndex ? (
                <View className="w-full h-full bg-white" />
              ) : index === currentStoryIndex ? (
                <Animated.View
                  className="h-full bg-white"
                  style={{
                    width: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  }}
                />
              ) : null}
            </View>
          ))}
        </View>
      </View>

      {/* Header */}
      <View className="absolute top-16 left-0 right-0 z-20 px-4 py-2">
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-cyber-cyan/20 rounded-full justify-center items-center mr-3">
            <Text className="text-white font-inter font-bold text-xs">
              {(
                currentUser.user.displayName ||
                currentUser.user.username ||
                "U"
              )
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View className="flex-1">
            <Text className="text-white font-inter font-medium">
              {currentUser.user.displayName ||
                currentUser.user.username ||
                "Unknown"}
            </Text>
            <Text className="text-white/70 font-inter text-xs">
              {formatTimeAgo(currentStory.createdAt)}
            </Text>
          </View>

          <TouchableOpacity onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Story Content */}
      <View className="flex-1">
        <View className="flex-1 relative">
          {/* Tap Areas */}
          <Pressable
            onPress={() => handleTap("left")}
            onLongPress={handleLongPress}
            onPressOut={handlePressOut}
            className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
          />

          <Pressable
            onPress={() => handleTap("right")}
            onLongPress={handleLongPress}
            onPressOut={handlePressOut}
            className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
          />

          {/* Media Content */}
          {currentStory.mediaType === "photo" ? (
            <Image
              source={{ uri: currentStory.mediaUrl }}
              style={{ flex: 1 }}
              contentFit="contain"
              onLoad={() => setIsLoading(false)}
              transition={200}
            />
          ) : (
            // TODO: Implement video player
            <View className="flex-1 justify-center items-center bg-black">
              <Ionicons name="play-circle" size={64} color="white" />
              <Text className="text-white font-inter text-lg mt-4">
                Video Story
              </Text>
            </View>
          )}

          {/* Text Overlay */}
          {currentStory.text && (
            <View
              className="absolute left-4 right-4"
              style={{
                bottom: tabBarHeight + 20,
              }}
            >
              <Text className="text-white font-inter text-lg text-center bg-black/50 p-3 rounded-lg">
                {currentStory.text}
              </Text>
            </View>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <View className="absolute inset-0 justify-center items-center bg-black/50">
              <Text className="text-white font-inter">Loading...</Text>
            </View>
          )}

          {/* Pause Indicator */}
          {isPaused && (
            <View className="absolute inset-0 justify-center items-center">
              <View className="bg-black/70 rounded-full p-4">
                <Ionicons name="pause" size={32} color="white" />
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default StoryViewer;

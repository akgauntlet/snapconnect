/**
 * @file StoriesScreen.tsx
 * @description Gaming stories and ephemeral content viewing interface.
 * Displays friend stories, gaming highlights, and community content.
 *
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-24
 *
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @/stores/themeStore: Theme management
 * - @/services/firebase/storiesService: Stories management
 * - @/components/common/StoryRingItem: Story preview component
 * - @/components/common/StoryGridItem: Story grid component
 * - @/components/common/StoryStatsModal: Story statistics modal
 *
 * @usage
 * Interface for viewing gaming stories and ephemeral community content.
 *
 * @ai_context
 * AI-powered content curation and personalized story recommendations.
 * Gaming achievement and highlight detection and promotion.
 */

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import StoryGridItem, {
  StoryUser,
} from "../../components/common/StoryGridItem";
import StoryRingItem, { MyStory } from "../../components/common/StoryRingItem";
import StoryStatsModal from "../../components/common/StoryStatsModal";
import StoryViewer from "../../components/common/StoryViewer";
import { useTabBarHeight } from "../../hooks/useTabBarHeight";
import { storiesService } from "../../services/firebase/storiesService";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import { showErrorAlert, showSuccessAlert } from "../../utils/alertService";

/**
 * Story stats data interface
 */
interface StoryStatsData {
  story: MyStory;
  viewers: any[];
  viewerNames: string;
}

/**
 * Enhanced stories screen component with gaming aesthetics
 *
 * @returns {React.ReactElement} Rendered stories interface
 *
 * @performance
 * - Optimized media loading and caching
 * - Smooth story transitions and animations
 * - Efficient memory management for video content
 *
 * @ai_integration
 * - Personalized story recommendations
 * - Gaming achievement highlighting
 * - Smart content categorization and filtering
 */
const StoriesScreen: React.FC = () => {
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const { tabBarHeight } = useTabBarHeight();

  // Component state
  const [friendsStories, setFriendsStories] = useState<StoryUser[]>([]);
  const [myStories, setMyStories] = useState<MyStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Story viewer state
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [storyViewerData, setStoryViewerData] = useState<StoryUser[]>([]);
  const [initialUserIndex, setInitialUserIndex] = useState(0);
  const [initialStoryIndex, setInitialStoryIndex] = useState(0);

  // Story stats modal state
  const [showStoryStats, setShowStoryStats] = useState(false);
  const [storyStatsData, setStoryStatsData] = useState<StoryStatsData | null>(
    null,
  );

  /**
   * Load all stories (friends' and user's own)
   */
  const loadStories = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const [friendsStoriesData, userStoriesData] = await Promise.all([
        storiesService.getFriendsStories(user.uid),
        storiesService.getUserStories(user.uid),
      ]);

      setFriendsStories(friendsStoriesData);
      setMyStories(userStoriesData);

      console.log("✅ Stories loaded:", {
        friendsStories: friendsStoriesData.length,
        myStories: userStoriesData.length,
      });
    } catch (error) {
      console.error("❌ Load stories failed:", error);
      setError("Failed to load stories. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Load stories when screen is focused
   */
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadStories();
      }
    }, [user, loadStories]),
  );

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadStories();
    setIsRefreshing(false);
  }, [loadStories]);

  /**
   * Handle story press to view
   */
  const handleStoryPress = useCallback(
    (storyUser: StoryUser, storyIndex: number = 0) => {
      if (!user) return;

      try {
        setStoryViewerData([storyUser]);
        setInitialUserIndex(0);
        setInitialStoryIndex(storyIndex);
        setShowStoryViewer(true);
      } catch (error) {
        console.error("❌ View story failed:", error);
        showErrorAlert("Failed to view story.");
      }
    },
    [user],
  );

  /**
   * Handle story viewed callback
   */
  const handleStoryViewed = useCallback((storyId: string) => {
    setFriendsStories((prev) =>
      prev.map((user) => ({
        ...user,
        stories: user.stories.map((story) =>
          story.id === storyId ? { ...story, hasViewed: true } : story,
        ),
        hasUnviewed: user.stories.some(
          (story) => story.id !== storyId && !story.hasViewed,
        ),
      })),
    );
  }, []);

  /**
   * Close story viewer
   */
  const closeStoryViewer = useCallback(() => {
    setShowStoryViewer(false);
    setStoryViewerData([]);
  }, []);

  /**
   * Handle my story press (show stats)
   */
  const handleMyStoryPress = useCallback(
    async (story: MyStory) => {
      if (!story || !story.id || !user) {
        showErrorAlert("Invalid story data.");
        return;
      }

      try {
        const viewers = await storiesService.getStoryViewers(
          story.id,
          user.uid,
        );

        const viewerNames =
          viewers.length > 0
            ? viewers
                .map((v) => v.displayName || v.username || "Unknown")
                .join(", ")
            : "No viewers yet";

        setStoryStatsData({
          story,
          viewers,
          viewerNames,
        });
        setShowStoryStats(true);
      } catch (error) {
        console.error("❌ Get story stats failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        setStoryStatsData({
          story,
          viewers: [],
          viewerNames: `Error: ${errorMessage}`,
        });
        setShowStoryStats(true);
      }
    },
    [user],
  );

  /**
   * Handle create story (navigate to camera)
   */
  const handleCreateStory = useCallback(() => {
    try {
      (navigation as any).navigate("Camera", { mode: "story" });
    } catch (error) {
      console.error("Navigation to camera failed:", error);
      showErrorAlert(
        "Switch to the Camera tab to create your story!",
        "Create Story",
      );
    }
  }, [navigation]);

  /**
   * Handle delete story
   */
  const handleDeleteStory = useCallback(
    async (storyId: string) => {
      try {
        await storiesService.deleteStory(storyId);
        showSuccessAlert("Story deleted successfully.");
        await loadStories();
      } catch (error) {
        console.error("❌ Delete story failed:", error);
        showErrorAlert("Failed to delete story.");
      }
    },
    [loadStories],
  );

  /**
   * Close story stats modal
   */
  const closeStoryStats = useCallback(() => {
    setShowStoryStats(false);
    setStoryStatsData(null);
  }, []);

  /**
   * Render story ring item
   */
  const renderStoryRingItem = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    if (index === 0) {
      // First item is always the user's story or create button
      const latestStory = myStories.length > 0 ? myStories[0] : undefined;
      return (
        <StoryRingItem
          type={latestStory ? "user" : "create"}
          story={latestStory}
          onPress={
            latestStory
              ? () => handleMyStoryPress(latestStory)
              : handleCreateStory
          }
        />
      );
    }

    // Friend stories
    const friendStory = friendsStories[index - 1];
    if (!friendStory) return null;

    return (
      <StoryRingItem
        type="friend"
        storyUser={friendStory}
        onPress={() => handleStoryPress(friendStory)}
      />
    );
  };

  /**
   * Render story grid item
   */
  const renderStoryGridItem = ({ item }: { item: StoryUser }) => (
    <StoryGridItem storyUser={item} onPress={handleStoryPress} />
  );

  /**
   * Render loading state
   */
  const renderLoadingState = () => (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color={accentColor} />
      <Text className="text-white/60 font-inter text-base mt-4">
        Loading stories...
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

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-8 py-16">
      <Ionicons
        name="play-circle-outline"
        size={64}
        color="rgba(0, 255, 255, 0.3)"
      />
      <Text className="text-white/70 font-orbitron text-xl mt-6 mb-2 text-center">
        No Stories Yet
      </Text>
      <Text className="text-white/50 font-inter text-base text-center mb-8">
        Stories from your friends will appear here
      </Text>
      <TouchableOpacity
        onPress={handleCreateStory}
        className="bg-cyber-cyan px-8 py-4 rounded-xl flex-row items-center"
        style={{
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons
          name="camera"
          size={20}
          color="#000000"
          style={{ marginRight: 8 }}
        />
        <Text className="text-cyber-black font-inter font-bold text-base">
          Create Story
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Prepare ring data (user story + friend stories)
  const ringData = [
    { type: "user" },
    ...friendsStories.map((item) => ({ type: "friend", data: item })),
  ];

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
          <Text className="text-white font-orbitron text-2xl">Stories</Text>
          <TouchableOpacity
            onPress={handleCreateStory}
            className="bg-cyber-cyan/10 border border-cyber-cyan/20 p-3 rounded-full"
          >
            <Ionicons name="camera" size={20} color={accentColor} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : (
          <View className="flex-1">
            {/* Story Ring (Horizontal scroll) */}
            <View className="py-4">
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={ringData}
                renderItem={renderStoryRingItem}
                keyExtractor={(item, index) => `story-ring-${index}`}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
              />
            </View>

            {/* Recent Stories Section */}
            <View className="flex-1 px-6">
              <Text className="text-white font-inter font-semibold text-lg mb-4">
                Recent Stories
              </Text>

              <FlatList
                data={friendsStories}
                renderItem={renderStoryGridItem}
                keyExtractor={(item) => item.userId}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    tintColor={accentColor}
                    colors={[accentColor]}
                  />
                }
                contentContainerStyle={{
                  paddingBottom: tabBarHeight + 16,
                  flexGrow: friendsStories.length === 0 ? 1 : 0,
                }}
                ListEmptyComponent={renderEmptyState}
              />
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* Story Viewer Modal */}
      {showStoryViewer && storyViewerData.length > 0 && (
        <StoryViewer
          storyUsers={storyViewerData}
          initialUserIndex={initialUserIndex}
          initialStoryIndex={initialStoryIndex}
          onClose={closeStoryViewer}
          onStoryViewed={handleStoryViewed}
        />
      )}

      {/* Story Stats Modal */}
      <StoryStatsModal
        visible={showStoryStats}
        storyData={storyStatsData}
        onClose={closeStoryStats}
        onDeleteStory={handleDeleteStory}
      />
    </>
  );
};

export default StoriesScreen;

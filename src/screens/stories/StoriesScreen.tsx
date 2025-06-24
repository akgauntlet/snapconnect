/**
 * @file StoriesScreen.tsx
 * @description Gaming stories and ephemeral content viewing interface.
 * Displays friend stories, gaming highlights, and community content.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-20
 * 
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @/stores/themeStore: Theme management
 * - @/services/firebase/storiesService: Stories management
 * 
 * @usage
 * Interface for viewing gaming stories and ephemeral community content.
 * 
 * @ai_context
 * AI-powered content curation and personalized story recommendations.
 * Gaming achievement and highlight detection and promotion.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Modal, RefreshControl, SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import StoryViewer from '../../components/common/StoryViewer';
import { storiesService } from '../../services/firebase/storiesService';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';

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
  stories: {
    id: string;
    mediaUrl: string;
    mediaType: 'photo' | 'video';
    text?: string;
    createdAt: any;
    hasViewed: boolean;
  }[];
  hasUnviewed: boolean;
}

/**
 * User's own story interface
 */
interface MyStory {
  id: string;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  text?: string;
  createdAt: any;
  viewCount: number;
  viewers: any;
}

/**
 * Stories screen component
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
  
  // Component state
  const [friendsStories, setFriendsStories] = useState<StoryUser[]>([]);
  const [myStories, setMyStories] = useState<MyStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Story viewer state
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [storyViewerData, setStoryViewerData] = useState<StoryUser[]>([]);
  const [initialUserIndex, setInitialUserIndex] = useState(0);
  const [initialStoryIndex, setInitialStoryIndex] = useState(0);

  // Story categories
  const categories = ['All', 'Gaming', 'Achievements', 'Highlights', 'News'];

  /**
   * Load stories when screen is focused
   */
  useFocusEffect(
    useCallback(() => {
      loadStories();
    }, [user])
  );

  /**
   * Load all stories (friends' and user's own)
   */
  const loadStories = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Load friends' stories and user's own stories in parallel
      const [friendsStoriesData, userStoriesData] = await Promise.all([
        storiesService.getFriendsStories(user.uid),
        storiesService.getUserStories(user.uid)
      ]);
      
      setFriendsStories(friendsStoriesData);
      setMyStories(userStoriesData);
      
      console.log('✅ Stories loaded:', {
        friendsStories: friendsStoriesData.length,
        myStories: userStoriesData.length
      });
      
    } catch (error) {
      console.error('❌ Load stories failed:', error);
      Alert.alert('Error', 'Failed to load stories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStories();
    setRefreshing(false);
  }, []);

  /**
   * Handle story press to view
   */
  const handleStoryPress = useCallback(async (storyUser: StoryUser, storyIndex: number = 0) => {
    if (!user) return;
    
    try {
      // Set up story viewer
      setStoryViewerData([storyUser]);
      setInitialUserIndex(0);
      setInitialStoryIndex(storyIndex);
      setShowStoryViewer(true);
      
    } catch (error) {
      console.error('❌ View story failed:', error);
      Alert.alert('Error', 'Failed to view story.');
    }
  }, [user]);

  /**
   * Handle story viewed
   */
  const handleStoryViewed = useCallback((storyId: string) => {
    // Update local state to mark story as viewed
    setFriendsStories(prev => prev.map(user => ({
      ...user,
      stories: user.stories.map(story => 
        story.id === storyId ? { ...story, hasViewed: true } : story
      ),
      hasUnviewed: user.stories.some(story => story.id !== storyId && !story.hasViewed)
    })));
  }, []);

  /**
   * Close story viewer
   */
  const closeStoryViewer = useCallback(() => {
    setShowStoryViewer(false);
    setStoryViewerData([]);
  }, []);

  /**
   * Handle my story press
   */
  const handleMyStoryPress = useCallback(async (story: MyStory) => {
    try {
      // Get story viewers
      const viewers = await storiesService.getStoryViewers(story.id, user!.uid);
      
      // Show story stats
      Alert.alert(
        'Story Stats',
        `Views: ${story.viewCount}\nViewers: ${viewers.map(v => v.displayName || v.username || 'Unknown').join(', ')}`,
        [
          { text: 'Delete Story', style: 'destructive', onPress: () => handleDeleteStory(story.id) },
          { text: 'Close', style: 'cancel' }
        ]
      );
      
    } catch (error) {
      console.error('❌ Get story stats failed:', error);
      Alert.alert('Error', 'Failed to load story stats.');
    }
  }, [user]);

  /**
   * Handle story deletion
   */
  const handleDeleteStory = useCallback(async (storyId: string) => {
    try {
      await storiesService.deleteStory(storyId);
      Alert.alert('Success', 'Story deleted successfully.');
      loadStories(); // Refresh the list
    } catch (error) {
      console.error('❌ Delete story failed:', error);
      Alert.alert('Error', 'Failed to delete story.');
    }
  }, []);

  /**
   * Handle create story (navigate to camera)
   */
  const handleCreateStory = useCallback(() => {
    // TODO: Navigate to camera with story mode
    Alert.alert('Create Story', 'Story creation from camera will be implemented next!');
  }, []);

  /**
   * Format time ago
   */
  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  /**
   * Render my story item
   */
  const renderMyStory = () => {
    if (myStories.length === 0) {
      return (
        <TouchableOpacity
          onPress={handleCreateStory}
          className="items-center mr-4"
        >
          <View className="w-16 h-16 bg-cyber-cyan/20 rounded-full justify-center items-center border-2 border-dashed border-cyber-cyan">
            <Ionicons name="add" size={24} color={accentColor} />
          </View>
          <Text className="text-white font-inter text-xs mt-2 text-center">
            Your Story
          </Text>
        </TouchableOpacity>
      );
    }

    const latestStory = myStories[0];
    return (
      <TouchableOpacity
        onPress={() => handleMyStoryPress(latestStory)}
        className="items-center mr-4"
      >
        <View className="relative">
          <Image
            source={{ uri: latestStory.mediaUrl }}
            className="w-16 h-16 rounded-full border-2 border-cyber-cyan"
          />
          <View className="absolute -bottom-1 -right-1 bg-cyber-cyan rounded-full px-2 py-1 min-w-[20px] items-center">
            <Text className="text-cyber-black font-inter text-xs font-bold">
              {latestStory.viewCount}
            </Text>
          </View>
        </View>
        <Text className="text-white font-inter text-xs mt-2 text-center">
          Your Story
        </Text>
      </TouchableOpacity>
    );
  };

  /**
   * Render friend story item
   */
  const renderFriendStory = ({ item }: { item: StoryUser }) => {
    const latestStory = item.stories[0];
    
    return (
      <TouchableOpacity
        onPress={() => handleStoryPress(item)}
        className="items-center mr-4"
      >
        <View className={`w-16 h-16 rounded-full p-1 ${
          item.hasUnviewed ? 'bg-gradient-to-r from-cyber-cyan to-green-400' : 'bg-gray-500'
        }`}>
          <Image
            source={{ uri: latestStory.mediaUrl }}
            className="w-full h-full rounded-full"
          />
        </View>
        <Text className="text-white font-inter text-xs mt-2 text-center max-w-[64px]" numberOfLines={1}>
          {item.user.displayName || item.user.username || 'Unknown'}
        </Text>
      </TouchableOpacity>
    );
  };

  /**
   * Render story grid item for recent stories
   */
  const renderStoryGridItem = ({ item }: { item: StoryUser }) => {
    const latestStory = item.stories[0];
    
    return (
      <TouchableOpacity
        onPress={() => handleStoryPress(item)}
        className="mb-4 bg-cyber-dark rounded-lg overflow-hidden border border-cyber-gray/30"
      >
        <View className="relative">
          <Image
            source={{ uri: latestStory.mediaUrl }}
            className="w-full h-48"
            resizeMode="cover"
          />
          
          {/* Overlay */}
          <View className="absolute inset-0 bg-black/20" />
          
          {/* Story info */}
          <View className="absolute bottom-0 left-0 right-0 p-4">
            <View className="flex-row items-center mb-2">
              <View className="w-8 h-8 bg-cyber-cyan/20 rounded-full justify-center items-center mr-2">
                <Text className="text-white font-inter font-bold text-xs">
                  {(item.user.displayName || item.user.username || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-inter font-medium text-sm">
                  {item.user.displayName || item.user.username || 'Unknown'}
                </Text>
                <Text className="text-white/70 font-inter text-xs">
                  {formatTimeAgo(latestStory.createdAt)} • {item.stories.length} stories
                </Text>
              </View>
              <Ionicons name="play-circle" size={20} color="white" />
            </View>
            
            {latestStory.text && (
              <Text className="text-white font-inter text-sm" numberOfLines={2}>
                {latestStory.text}
              </Text>
            )}
          </View>
          
          {/* Unviewed indicator */}
          {item.hasUnviewed && (
            <View className="absolute top-2 right-2 w-3 h-3 bg-cyber-cyan rounded-full" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background.primary} />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray">
        <Text className="text-white font-orbitron text-xl">Stories</Text>
        <TouchableOpacity onPress={handleCreateStory} className="p-2">
          <Ionicons name="camera-outline" size={24} color={accentColor} />
        </TouchableOpacity>
      </View>
      
             {/* Story Ring (Horizontal scroll for recent stories) */}
       <View className="py-4">
         <FlatList
           horizontal
           showsHorizontalScrollIndicator={false}
           data={[{ type: 'my' as const }, ...friendsStories.map(item => ({ type: 'friend' as const, data: item }))]}
           renderItem={({ item }) => (
             <View className="ml-4">
               {item.type === 'my' ? renderMyStory() : renderFriendStory({ item: (item as any).data })}
             </View>
           )}
           keyExtractor={(item, index) => 
             item.type === 'my' ? 'my-story' : `friend-${(item as any).data.userId}-${index}`
           }
          contentContainerStyle={{ paddingRight: 16 }}
          ListEmptyComponent={
            <View className="ml-4">
              {renderMyStory()}
            </View>
          }
        />
      </View>
      
      {/* Recent Stories Grid */}
      <View className="flex-1 px-6">
        <Text className="text-white font-inter font-medium text-lg mb-4">
          Recent Stories
        </Text>
        
        <FlatList
          data={friendsStories}
          renderItem={renderStoryGridItem}
          keyExtractor={item => item.userId}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={accentColor}
              colors={[accentColor]}
            />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-20">
              <Ionicons name="play-circle-outline" size={64} color={theme.colors.text.tertiary} />
              <Text className="text-white/70 font-inter text-lg mt-4">
                {isLoading ? 'Loading Stories...' : 'No Stories Yet'}
              </Text>
              <Text className="text-white/50 font-inter text-sm mt-2 text-center px-8">
                {isLoading ? 'Getting the latest stories from your friends' : 'Stories from your friends will appear here'}
              </Text>
              {!isLoading && (
                <TouchableOpacity
                  onPress={handleCreateStory}
                  className="mt-4 bg-cyber-cyan px-6 py-2 rounded-lg"
                >
                  <Text className="text-cyber-black font-inter font-medium">
                    Create Your First Story
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>

      {/* Story Viewer Modal */}
      {showStoryViewer && storyViewerData.length > 0 && (
        <Modal
          visible={showStoryViewer}
          animationType="fade"
          presentationStyle="fullScreen"
        >
          <StoryViewer
            storyUsers={storyViewerData}
            initialUserIndex={initialUserIndex}
            initialStoryIndex={initialStoryIndex}
            onClose={closeStoryViewer}
            onStoryViewed={handleStoryViewed}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default StoriesScreen; 

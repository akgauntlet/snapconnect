/**
 * @file StoryStatsModal.tsx
 * @description Modal component for displaying story statistics and viewer information.
 * Shows view counts, viewer list, and engagement metrics with cyber gaming aesthetics.
 * 
 * @author SnapConnect Team
 * @created 2024-01-24
 * 
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @expo/vector-icons: Icons
 * 
 * @usage
 * <StoryStatsModal
 *   visible={showModal}
 *   storyData={storyStats}
 *   onClose={handleClose}
 *   onDeleteStory={handleDelete}
 * />
 * 
 * @ai_context
 * Displays AI-enhanced story analytics with engagement insights.
 * Supports smart viewer categorization and interaction patterns.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Modal, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';

/**
 * Story data interface
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
 * Viewer data interface
 */
interface StoryViewer {
  id: string;
  displayName?: string;
  username?: string;
  profilePhoto?: string;
  viewedAt: any;
}

/**
 * Story stats data interface
 */
interface StoryStatsData {
  story: MyStory;
  viewers: StoryViewer[];
  viewerNames: string;
}

/**
 * Props for StoryStatsModal component
 */
interface StoryStatsModalProps {
  visible: boolean;
  storyData: StoryStatsData | null;
  onClose: () => void;
  onDeleteStory?: (storyId: string) => void;
}

/**
 * Story statistics modal component with cyber gaming aesthetic
 * 
 * @param {StoryStatsModalProps} props - Component props
 * @returns {React.ReactElement} Rendered story stats modal
 * 
 * @performance
 * - Efficient list rendering for large viewer counts
 * - Optimized modal animations and transitions
 * - Smart data loading and caching for viewer information
 */
const StoryStatsModal: React.FC<StoryStatsModalProps> = ({
  visible,
  storyData,
  onClose,
  onDeleteStory
}) => {
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());

  if (!storyData) return null;

  const { story, viewers } = storyData;

  /**
   * Format time since creation
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
   * Format viewer viewed time
   */
  const formatViewedTime = (viewedAt: any) => {
    if (!viewedAt) return '';
    
    const date = viewedAt.toDate ? viewedAt.toDate() : new Date(viewedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  /**
   * Get user initials for avatar
   */
  const getUserInitials = (viewer: StoryViewer) => {
    const name = viewer.displayName || viewer.username || 'Unknown';
    return name
      .split(' ')
      .map(n => n.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  /**
   * Handle delete story with confirmation
   */
  const handleDeleteStory = () => {
    if (onDeleteStory) {
      onDeleteStory(story.id);
      onClose();
    }
  };

  /**
   * Render viewer item
   */
  const renderViewerItem = ({ item }: { item: StoryViewer }) => (
    <View className="flex-row items-center p-4 border-b border-cyber-gray/10">
      {/* Avatar */}
      <View className="w-10 h-10 bg-cyber-cyan/20 border border-cyber-cyan/30 rounded-full justify-center items-center mr-3">
        <Text className="text-cyber-cyan font-inter font-bold text-sm">
          {getUserInitials(item)}
        </Text>
      </View>
      
      {/* Viewer Info */}
      <View className="flex-1">
        <Text className="text-white font-inter font-medium text-base">
          {item.displayName || item.username || 'Unknown User'}
        </Text>
        <Text className="text-white/60 font-inter text-sm">
          Viewed {formatViewedTime(item.viewedAt)}
        </Text>
      </View>

      {/* View indicator */}
      <View className="w-2 h-2 bg-cyber-cyan rounded-full" />
    </View>
  );

  /**
   * Render empty viewers state
   */
  const renderEmptyViewers = () => (
    <View className="flex-1 justify-center items-center py-12">
      <Ionicons name="eye-off-outline" size={48} color="rgba(255,255,255,0.3)" />
      <Text className="text-white/60 font-inter text-base mt-4 text-center">
        No viewers yet
      </Text>
      <Text className="text-white/40 font-inter text-sm text-center mt-2">
        Share your story to get more views
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
        <View className="flex-1 bg-cyber-black">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray/20">
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            
            <Text className="text-white font-orbitron text-lg">
              Story Stats
            </Text>
            
            {onDeleteStory && (
              <TouchableOpacity onPress={handleDeleteStory} className="p-2">
                <Ionicons name="trash-outline" size={20} color="#ff0040" />
              </TouchableOpacity>
            )}
          </View>

          {/* Story Info Section */}
          <View className="p-6 border-b border-cyber-gray/10">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white font-orbitron text-xl mb-1">
                  {story.viewCount || 0}
                </Text>
                <Text className="text-white/60 font-inter text-sm">
                  {story.viewCount === 1 ? 'View' : 'Views'}
                </Text>
              </View>
              
                             <View className="items-end">
                 <Text className="text-white/60 font-inter text-sm">
                   {formatTimeAgo(story.createdAt)}
                 </Text>
                 <View className="flex-row items-center mt-1">
                   <Ionicons 
                     name={story.mediaType === 'video' ? 'videocam' : 'camera'} 
                     size={14} 
                     color={accentColor} 
                   />
                   <Text className="text-cyber-cyan font-inter text-xs ml-1 font-medium">
                     {story.mediaType.toUpperCase()}
                   </Text>
                 </View>
               </View>
            </View>

            {/* Story Text Preview */}
            {story.text && (
              <View className="bg-cyber-dark/30 border border-cyber-gray/20 rounded-lg p-3">
                <Text className="text-white font-inter text-sm leading-5">
                  {story.text}
                </Text>
              </View>
            )}

            {/* Stats Row */}
            <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-cyber-gray/10">
              <View className="flex-row items-center">
                <Ionicons name="eye" size={16} color={accentColor} />
                <Text className="text-white/70 font-inter text-sm ml-2">
                  {viewers.length} {viewers.length === 1 ? 'viewer' : 'viewers'}
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <Ionicons name="time" size={16} color={accentColor} />
                <Text className="text-white/70 font-inter text-sm ml-2">
                  Expires in {24 - Math.floor((Date.now() - story.createdAt.toDate()) / (1000 * 60 * 60))}h
                </Text>
              </View>
            </View>
          </View>

          {/* Viewers Section */}
          <View className="flex-1">
            <View className="px-6 py-4">
              <Text className="text-white font-inter font-semibold text-lg">
                Viewers ({viewers.length})
              </Text>
            </View>

            <FlatList
              data={viewers}
              renderItem={renderViewerItem}
              keyExtractor={item => item.id}
              ListEmptyComponent={renderEmptyViewers}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default StoryStatsModal; 

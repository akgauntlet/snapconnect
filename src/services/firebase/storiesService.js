/**
 * @file storiesService.js
 * @description Firebase stories service for SnapConnect Phase 2.
 * Handles 24-hour disappearing stories creation, viewing, and management.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-20
 * 
 * @dependencies
 * - @react-native-firebase/database: Realtime Database
 * - @react-native-firebase/storage: File storage
 * 
 * @usage
 * import { storiesService } from '@/services/firebase/storiesService';
 * 
 * @ai_context
 * Integrates with AI services for content moderation and story engagement analytics.
 */

import { database, storage } from '../../config/firebase';

/**
 * Stories service class for story management
 */
class StoriesService {
  /**
   * Create a new story
   * @param {string} userId - User ID creating the story
   * @param {Object} mediaData - Media file data (uri, type, size)
   * @param {string} text - Optional text overlay
   * @param {string} privacy - Privacy setting ('public', 'friends', 'custom')
   * @param {Array} allowedUsers - Array of user IDs for custom privacy
   * @returns {Promise<string>} Story ID
   */
  async createStory(userId, mediaData, text = '', privacy = 'friends', allowedUsers = []) {
    try {
      // Upload media to Firebase Storage
      const mediaUrl = await this.uploadStoryMedia(mediaData, userId);
      
      // Create story object
      const storyId = database().ref('stories').push().key;
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
      
      const story = {
        id: storyId,
        userId,
        mediaUrl,
        mediaType: mediaData.type,
        text: text || null,
        privacy,
        allowedUsers: privacy === 'custom' ? allowedUsers : null,
        createdAt: database.ServerValue.TIMESTAMP,
        expiresAt,
        viewers: {},
        viewCount: 0
      };
      
      // Save story to database
      await database().ref(`stories/${storyId}`).set(story);
      
      // Add to user's stories list
      await database().ref(`userStories/${userId}/${storyId}`).set(true);
      
      // Schedule automatic deletion
      this.scheduleStoryDeletion(storyId, 24 * 60 * 60 * 1000);
      
      return storyId;
    } catch (error) {
      console.error('Create story failed:', error);
      throw error;
    }
  }

  /**
   * View a story (record the view)
   * @param {string} storyId - Story ID
   * @param {string} viewerId - Viewer user ID
   * @returns {Promise<Object>} Story data
   */
  async viewStory(storyId, viewerId) {
    try {
      const storyRef = database().ref(`stories/${storyId}`);
      const snapshot = await storyRef.once('value');
      const story = snapshot.val();
      
      if (!story) {
        throw new Error('Story not found');
      }
      
      // Check if story has expired
      if (Date.now() > story.expiresAt) {
        await this.deleteStory(storyId);
        throw new Error('Story has expired');
      }
      
      // Check privacy permissions
      const canView = await this.canUserViewStory(story, viewerId);
      if (!canView) {
        throw new Error('Not authorized to view this story');
      }
      
      // Record the view if not already viewed by this user
      if (!story.viewers || !story.viewers[viewerId]) {
        await storyRef.update({
          [`viewers/${viewerId}`]: database.ServerValue.TIMESTAMP,
          viewCount: (story.viewCount || 0) + 1
        });
        
        // Notify story owner of the view (if not viewing own story)
        if (story.userId !== viewerId) {
          await this.notifyStoryViewed(story.userId, viewerId, storyId);
        }
      }
      
      return story;
    } catch (error) {
      console.error('View story failed:', error);
      throw error;
    }
  }

  /**
   * Get stories from friends for viewing
   * @param {string} userId - Current user ID
   * @returns {Promise<Array>} Array of viewable stories grouped by user
   */
  async getFriendsStories(userId) {
    try {
      // Get user's friends
      const friendsSnapshot = await database().ref(`friends/${userId}`).once('value');
      const friends = friendsSnapshot.val() || {};
      const friendIds = Object.keys(friends);
      
      // Add own user ID to see own stories
      friendIds.push(userId);
      
      const storiesByUser = [];
      
      // Get stories for each friend
      for (const friendId of friendIds) {
        const userStoriesSnapshot = await database().ref(`userStories/${friendId}`).once('value');
        const userStoryIds = userStoriesSnapshot.val() || {};
        
        const userStories = [];
        
        // Get story details for each story ID
        for (const storyId of Object.keys(userStoryIds)) {
          const storySnapshot = await database().ref(`stories/${storyId}`).once('value');
          const story = storySnapshot.val();
          
          if (story && Date.now() <= story.expiresAt) {
            // Check if user can view this story
            const canView = await this.canUserViewStory(story, userId);
            if (canView) {
              userStories.push(story);
            }
          } else if (story && Date.now() > story.expiresAt) {
            // Clean up expired story
            this.deleteStory(storyId);
          }
        }
        
        if (userStories.length > 0) {
          // Get user data
          const userSnapshot = await database().ref(`users/${friendId}`).once('value');
          const userData = userSnapshot.val();
          
          storiesByUser.push({
            user: userData,
            stories: userStories.sort((a, b) => a.createdAt - b.createdAt),
            hasUnviewed: this.hasUnviewedStories(userStories, userId)
          });
        }
      }
      
      // Sort by most recent story and prioritize unviewed
      return storiesByUser.sort((a, b) => {
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        
        const latestA = Math.max(...a.stories.map(s => s.createdAt));
        const latestB = Math.max(...b.stories.map(s => s.createdAt));
        return latestB - latestA;
      });
    } catch (error) {
      console.error('Get friends stories failed:', error);
      throw error;
    }
  }

  /**
   * Get user's own stories
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of user's stories
   */
  async getUserStories(userId) {
    try {
      const userStoriesSnapshot = await database().ref(`userStories/${userId}`).once('value');
      const storyIds = userStoriesSnapshot.val() || {};
      
      const stories = [];
      
      // Get story details for each story ID
      for (const storyId of Object.keys(storyIds)) {
        const storySnapshot = await database().ref(`stories/${storyId}`).once('value');
        const story = storySnapshot.val();
        
        if (story && Date.now() <= story.expiresAt) {
          stories.push(story);
        } else if (story && Date.now() > story.expiresAt) {
          // Clean up expired story
          this.deleteStory(storyId);
        }
      }
      
      return stories.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Get user stories failed:', error);
      throw error;
    }
  }

  /**
   * Get story viewers
   * @param {string} storyId - Story ID
   * @param {string} ownerId - Story owner ID (for authorization)
   * @returns {Promise<Array>} Array of viewers with user data
   */
  async getStoryViewers(storyId, ownerId) {
    try {
      const storySnapshot = await database().ref(`stories/${storyId}`).once('value');
      const story = storySnapshot.val();
      
      if (!story || story.userId !== ownerId) {
        throw new Error('Not authorized to view story viewers');
      }
      
      const viewers = [];
      const viewerIds = story.viewers || {};
      
      // Get user data for each viewer
      for (const [viewerId, viewedAt] of Object.entries(viewerIds)) {
        const userSnapshot = await database().ref(`users/${viewerId}`).once('value');
        const userData = userSnapshot.val();
        
        if (userData) {
          viewers.push({
            ...userData,
            viewedAt
          });
        }
      }
      
      return viewers.sort((a, b) => b.viewedAt - a.viewedAt);
    } catch (error) {
      console.error('Get story viewers failed:', error);
      throw error;
    }
  }

  /**
   * Delete a story
   * @param {string} storyId - Story ID
   * @returns {Promise<void>}
   */
  async deleteStory(storyId) {
    try {
      // Get story data first
      const storySnapshot = await database().ref(`stories/${storyId}`).once('value');
      const story = storySnapshot.val();
      
      if (story) {
        // Delete media file from storage
        if (story.mediaUrl) {
          await this.deleteStoryMedia(story.mediaUrl);
        }
        
        // Remove from user's stories list
        await database().ref(`userStories/${story.userId}/${storyId}`).remove();
      }
      
      // Delete story from database
      await database().ref(`stories/${storyId}`).remove();
      
      console.log(`Story ${storyId} deleted`);
    } catch (error) {
      console.error('Delete story failed:', error);
      throw error;
    }
  }

  /**
   * Upload story media to Firebase Storage
   * @param {Object} mediaData - Media file data
   * @param {string} userId - User ID for path organization
   * @returns {Promise<string>} Download URL
   */
  async uploadStoryMedia(mediaData, userId) {
    try {
      const timestamp = Date.now();
      const fileExtension = mediaData.type === 'video' ? 'mp4' : 'jpg';
      const fileName = `${userId}_${timestamp}.${fileExtension}`;
      const storagePath = `stories/${userId}/${fileName}`;
      
      const reference = storage().ref(storagePath);
      const uploadTask = reference.putFile(mediaData.uri);
      
      // Wait for upload completion
      await uploadTask;
      
      // Get download URL
      const downloadURL = await reference.getDownloadURL();
      
      return downloadURL;
    } catch (error) {
      console.error('Upload story media failed:', error);
      throw error;
    }
  }

  /**
   * Delete story media from storage
   * @param {string} mediaUrl - Media download URL
   * @returns {Promise<void>}
   */
  async deleteStoryMedia(mediaUrl) {
    try {
      const reference = storage().refFromURL(mediaUrl);
      await reference.delete();
    } catch (error) {
      console.error('Delete story media failed:', error);
      // Don't throw - file might already be deleted
    }
  }

  /**
   * Check if user can view a story based on privacy settings
   * @param {Object} story - Story object
   * @param {string} userId - User ID checking permission
   * @returns {Promise<boolean>} True if user can view
   */
  async canUserViewStory(story, userId) {
    try {
      // Story owner can always view
      if (story.userId === userId) {
        return true;
      }
      
      // Check privacy settings
      switch (story.privacy) {
        case 'public':
          return true;
          
        case 'friends':
          // Check if users are friends
          const friendshipSnapshot = await database().ref(`friends/${story.userId}/${userId}`).once('value');
          return friendshipSnapshot.exists();
          
        case 'custom':
          // Check if user is in allowed list
          return story.allowedUsers && story.allowedUsers.includes(userId);
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Check story view permission failed:', error);
      return false;
    }
  }

  /**
   * Check if user has unviewed stories
   * @param {Array} stories - Array of stories
   * @param {string} userId - User ID checking
   * @returns {boolean} True if has unviewed stories
   */
  hasUnviewedStories(stories, userId) {
    return stories.some(story => !story.viewers || !story.viewers[userId]);
  }

  /**
   * Schedule automatic story deletion
   * @param {string} storyId - Story ID
   * @param {number} delayMs - Delay in milliseconds
   * @returns {void}
   */
  scheduleStoryDeletion(storyId, delayMs) {
    setTimeout(async () => {
      try {
        await this.deleteStory(storyId);
      } catch (error) {
        console.error(`Scheduled deletion failed for story ${storyId}:`, error);
      }
    }, delayMs);
  }

  /**
   * Notify story owner of view
   * @param {string} ownerId - Story owner user ID
   * @param {string} viewerId - Viewer user ID
   * @param {string} storyId - Story ID
   * @returns {Promise<void>}
   */
  async notifyStoryViewed(ownerId, viewerId, storyId) {
    try {
      await database().ref(`userNotifications/${ownerId}`).push({
        type: 'story_viewed',
        viewerId,
        storyId,
        timestamp: database.ServerValue.TIMESTAMP
      });
    } catch (error) {
      console.error('Notify story viewed failed:', error);
    }
  }

  /**
   * Clean up expired stories (batch operation)
   * @returns {Promise<void>}
   */
  async cleanupExpiredStories() {
    try {
      const storiesSnapshot = await database().ref('stories').once('value');
      const stories = storiesSnapshot.val() || {};
      
      const currentTime = Date.now();
      const expiredStories = [];
      
      // Find expired stories
      Object.entries(stories).forEach(([storyId, story]) => {
        if (currentTime > story.expiresAt) {
          expiredStories.push(storyId);
        }
      });
      
      // Delete expired stories
      for (const storyId of expiredStories) {
        await this.deleteStory(storyId);
      }
      
      console.log(`Cleaned up ${expiredStories.length} expired stories`);
    } catch (error) {
      console.error('Cleanup expired stories failed:', error);
    }
  }
}

export const storiesService = new StoriesService();
export default storiesService; 

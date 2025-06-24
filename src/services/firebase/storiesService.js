/**
 * @file storiesService.js
 * @description Firebase stories service for SnapConnect Phase 2.
 * Handles 24-hour disappearing stories creation, viewing, and management.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-24
 * 
 * @dependencies
 * - firebase/firestore: Firestore Web SDK
 * - firebase/storage: Firebase Storage Web SDK
 * 
 * @usage
 * import { storiesService } from '@/services/firebase/storiesService';
 * 
 * @ai_context
 * Integrates with AI services for content moderation and story engagement analytics.
 */

import { getFirebaseDB, getFirebaseStorage } from '../../config/firebase';

/**
 * Stories service class for story management
 */
class StoriesService {
  /**
   * Get Firestore instance (lazy-loaded)
   * @returns {object} Firestore instance
   */
  getDB() {
    return getFirebaseDB();
  }

  /**
   * Get Firebase Storage instance (lazy-loaded)
   * @returns {object} Firebase Storage instance
   */
  getStorage() {
    return getFirebaseStorage();
  }

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
      const db = this.getDB();
      
      // Upload media
      const mediaUrl = await this.uploadStoryMedia(mediaData, userId);
      
      // Calculate expiration time (24 hours from now)
      const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000));
      
      // Create story document
      const storyData = {
        userId,
        mediaUrl,
        mediaType: mediaData.type,
        text: text || '',
        privacy,
        allowedUsers: privacy === 'custom' ? allowedUsers : [],
        createdAt: db.FieldValue.serverTimestamp(),
        expiresAt,
        viewers: {}, // Object to track viewers and view times
        viewCount: 0
      };
      
      const storyRef = await db.collection('stories').add(storyData);
      
      // Schedule automatic deletion
      this.scheduleStoryDeletion(storyRef.id, 24 * 60 * 60 * 1000);
      
      console.log('✅ Story created successfully:', storyRef.id);
      return storyRef.id;
    } catch (error) {
      console.error('❌ Create story failed:', error);
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
      const db = this.getDB();
      const storyRef = db.collection('stories').doc(storyId);
      const storyDoc = await storyRef.get();
      
      if (!storyDoc.exists) {
        throw new Error('Story not found');
      }
      
      const storyData = storyDoc.data();
      
      // Check if story has expired
      if (storyData.expiresAt.toDate() < new Date()) {
        throw new Error('Story has expired');
      }
      
      // Check if user can view this story
      if (!(await this.canUserViewStory(storyData, viewerId))) {
        throw new Error('Unauthorized to view this story');
      }
      
      // Record the view if not already viewed by this user
      if (!storyData.viewers[viewerId]) {
        await storyRef.update({
          [`viewers.${viewerId}`]: db.FieldValue.serverTimestamp(),
          viewCount: db.FieldValue.increment(1)
        });
        
        // Notify story owner (unless they're viewing their own story)
        if (storyData.userId !== viewerId) {
          await this.notifyStoryViewed(storyData.userId, viewerId, storyId);
        }
      }
      
      console.log('✅ Story viewed successfully:', storyId);
      return { id: storyId, ...storyData };
    } catch (error) {
      console.error('❌ View story failed:', error);
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
      const db = this.getDB();
      const { friendsService } = require('./friendsService');
      
      // Get user's friends
      const friendIds = await friendsService.getFriendIds(userId);
      
      if (friendIds.length === 0) {
        return [];
      }
      
      // Get all non-expired stories from friends
      const cutoffTime = new Date();
      const storiesSnapshot = await db
        .collection('stories')
        .where('userId', 'in', friendIds.slice(0, 10)) // Firestore limit
        .where('expiresAt', '>', cutoffTime)
        .orderBy('expiresAt')
        .orderBy('createdAt', 'desc')
        .get();
      
      // Group stories by user
      const storiesByUser = {};
      storiesSnapshot.forEach(doc => {
        const storyData = doc.data();
        const storyUserId = storyData.userId;
        
        if (!storiesByUser[storyUserId]) {
          storiesByUser[storyUserId] = [];
        }
        
        storiesByUser[storyUserId].push({
          id: doc.id,
          ...storyData,
          hasViewed: !!storyData.viewers[userId]
        });
      });
      
      // Convert to array and get user data
      const result = [];
      for (const [storyUserId, stories] of Object.entries(storiesByUser)) {
        const userDoc = await db.collection('users').doc(storyUserId).get();
        
        if (userDoc.exists) {
          result.push({
            userId: storyUserId,
            user: userDoc.data(),
            stories,
            hasUnviewed: stories.some(story => !story.hasViewed)
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ Get friends stories failed:', error);
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
      const db = this.getDB();
      
      const cutoffTime = new Date();
      const snapshot = await db
        .collection('stories')
        .where('userId', '==', userId)
        .where('expiresAt', '>', cutoffTime)
        .orderBy('expiresAt')
        .orderBy('createdAt', 'desc')
        .get();
      
      const stories = [];
      snapshot.forEach(doc => {
        stories.push({ id: doc.id, ...doc.data() });
      });
      
      return stories;
    } catch (error) {
      console.error('❌ Get user stories failed:', error);
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
      const db = this.getDB();
      const storyRef = db.collection('stories').doc(storyId);
      const storyDoc = await storyRef.get();
      
      if (!storyDoc.exists) {
        throw new Error('Story not found');
      }
      
      const storyData = storyDoc.data();
      
      // Verify owner authorization
      if (storyData.userId !== ownerId) {
        throw new Error('Unauthorized to view story viewers');
      }
      
      const viewers = [];
      const viewerIds = Object.keys(storyData.viewers || {});
      
      // Get viewer user data
      for (const viewerId of viewerIds) {
        const userDoc = await db.collection('users').doc(viewerId).get();
        
        if (userDoc.exists) {
          viewers.push({
            id: viewerId,
            ...userDoc.data(),
            viewedAt: storyData.viewers[viewerId]
          });
        }
      }
      
      // Sort by view time (most recent first)
      viewers.sort((a, b) => b.viewedAt.seconds - a.viewedAt.seconds);
      
      return viewers;
    } catch (error) {
      console.error('❌ Get story viewers failed:', error);
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
      const db = this.getDB();
      const storyRef = db.collection('stories').doc(storyId);
      const storyDoc = await storyRef.get();
      
      if (storyDoc.exists) {
        const storyData = storyDoc.data();
        
        // Delete media file
        if (storyData.mediaUrl) {
          await this.deleteStoryMedia(storyData.mediaUrl);
        }
        
        // Delete story document
        await storyRef.delete();
        console.log('✅ Story deleted successfully:', storyId);
      }
    } catch (error) {
      console.error('❌ Delete story failed:', error);
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
      const storage = this.getStorage();
      const timestamp = Date.now();
      const fileName = `stories/${userId}/${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
      
      // For React Native, mediaData.uri contains the file URI
      const response = await fetch(mediaData.uri);
      const blob = await response.blob();
      
      const storageRef = storage.ref().child(fileName);
      const uploadTask = await storageRef.put(blob);
      const downloadUrl = await uploadTask.ref.getDownloadURL();
      
      console.log('✅ Story media uploaded successfully');
      return downloadUrl;
    } catch (error) {
      console.error('❌ Upload story media failed:', error);
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
      const storage = this.getStorage();
      const fileRef = storage.refFromURL(mediaUrl);
      await fileRef.delete();
      console.log('✅ Story media deleted successfully');
    } catch (error) {
      console.error('❌ Delete story media failed:', error);
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
      // Owner can always view their own story
      if (story.userId === userId) {
        return true;
      }
      
      // Check privacy settings
      switch (story.privacy) {
        case 'public':
          return true;
        
        case 'friends':
          const { friendsService } = require('./friendsService');
          return await friendsService.areFriends(story.userId, userId);
        
        case 'custom':
          return story.allowedUsers.includes(userId);
        
        default:
          return false;
      }
    } catch (error) {
      console.error('❌ Check story view permission failed:', error);
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
        console.log('✅ Scheduled story deletion completed:', storyId);
      } catch (error) {
        console.error(`❌ Scheduled deletion failed for story ${storyId}:`, error);
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
      const db = this.getDB();
      
      const notificationData = {
        userId: ownerId,
        type: 'story_viewed',
        viewerId,
        storyId,
        createdAt: db.FieldValue.serverTimestamp(),
        read: false
      };
      
      await db.collection('notifications').add(notificationData);
      console.log('✅ Story view notification sent');
    } catch (error) {
      console.error('❌ Notify story viewed failed:', error);
    }
  }

  /**
   * Clean up expired stories (batch operation)
   * @returns {Promise<void>}
   */
  async cleanupExpiredStories() {
    try {
      const db = this.getDB();
      const cutoffTime = new Date();
      
      const expiredSnapshot = await db
        .collection('stories')
        .where('expiresAt', '<=', cutoffTime)
        .limit(100) // Process in batches
        .get();
      
      const batch = db.batch();
      let deletedCount = 0;
      
      for (const doc of expiredSnapshot.docs) {
        const storyData = doc.data();
        
        // Delete media file first
        if (storyData.mediaUrl) {
          await this.deleteStoryMedia(storyData.mediaUrl);
        }
        
        // Add to batch delete
        batch.delete(doc.ref);
        deletedCount++;
      }
      
      if (deletedCount > 0) {
        await batch.commit();
        console.log(`✅ Cleaned up ${deletedCount} expired stories`);
      }
    } catch (error) {
      console.error('❌ Cleanup expired stories failed:', error);
    }
  }
}

export const storiesService = new StoriesService();
export default storiesService; 

/**
 * @file messagingService.js
 * @description Firebase messaging service for SnapConnect Phase 2.
 * Handles ephemeral message sending, receiving, and automatic deletion.
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
 * import { messagingService } from '@/services/firebase/messagingService';
 * 
 * @ai_context
 * Integrates with AI services for content moderation and smart message suggestions.
 */

import { database, storage } from '../../config/firebase';

/**
 * Messaging service class for ephemeral messaging
 */
class MessagingService {
  /**
   * Send an ephemeral message
   * @param {string} senderId - Sender user ID
   * @param {string} recipientId - Recipient user ID
   * @param {Object} mediaData - Media file data (uri, type, size)
   * @param {number} timer - Timer in seconds (1, 3, 5, 10)
   * @param {string} text - Optional text message
   * @returns {Promise<string>} Message ID
   */
  async sendMessage(senderId, recipientId, mediaData, timer = 5, text = '') {
    try {
      // Upload media to Firebase Storage
      const mediaUrl = await this.uploadMedia(mediaData, senderId);
      
      // Create message object
      const messageId = database().ref('messages').push().key;
      const message = {
        id: messageId,
        senderId,
        recipientId,
        mediaUrl,
        mediaType: mediaData.type,
        text: text || null,
        timer,
        sentAt: database.ServerValue.TIMESTAMP,
        viewedAt: null,
        expiresAt: null,
        status: 'sent',
        screenshotDetected: false
      };
      
      // Save message to database
      await database().ref(`messages/${messageId}`).set(message);
      
      // Add to user's message lists
      await this.addToMessageLists(senderId, recipientId, messageId);
      
      // Send push notification (placeholder)
      await this.sendPushNotification(recipientId, senderId, 'message');
      
      return messageId;
    } catch (error) {
      console.error('Send message failed:', error);
      throw error;
    }
  }

  /**
   * View a message (starts the timer)
   * @param {string} messageId - Message ID
   * @param {string} viewerId - Viewer user ID
   * @returns {Promise<Object>} Message data with timer started
   */
  async viewMessage(messageId, viewerId) {
    try {
      const messageRef = database().ref(`messages/${messageId}`);
      const snapshot = await messageRef.once('value');
      const message = snapshot.val();
      
      if (!message) {
        throw new Error('Message not found');
      }
      
      // Verify user can view this message
      if (message.recipientId !== viewerId) {
        throw new Error('Unauthorized to view this message');
      }
      
      // Start timer if not already viewed
      if (!message.viewedAt) {
        const viewedAt = Date.now();
        const expiresAt = viewedAt + (message.timer * 1000);
        
        await messageRef.update({
          viewedAt,
          expiresAt,
          status: 'viewed'
        });
        
        // Schedule automatic deletion
        this.scheduleMessageDeletion(messageId, message.timer * 1000);
        
        // Notify sender that message was viewed
        await this.notifyMessageViewed(message.senderId, messageId);
        
        return {
          ...message,
          viewedAt,
          expiresAt
        };
      }
      
      return message;
    } catch (error) {
      console.error('View message failed:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   * @param {string} userId - Current user ID
   * @param {string} otherUserId - Other user ID
   * @param {number} limit - Number of messages to fetch
   * @returns {Promise<Array>} Array of messages
   */
  async getConversationMessages(userId, otherUserId, limit = 50) {
    try {
      const messagesRef = database().ref('messages');
      
      // Query messages where user is sender or recipient
      const snapshot = await messagesRef
        .orderByChild('sentAt')
        .limitToLast(limit)
        .once('value');
      
      const allMessages = snapshot.val() || {};
      
      // Filter messages for this conversation
      const conversationMessages = Object.values(allMessages).filter(
        message => 
          (message.senderId === userId && message.recipientId === otherUserId) ||
          (message.senderId === otherUserId && message.recipientId === userId)
      );
      
      // Remove expired messages
      const validMessages = conversationMessages.filter(message => {
        if (message.expiresAt && Date.now() > message.expiresAt) {
          // Delete expired message
          this.deleteMessage(message.id);
          return false;
        }
        return true;
      });
      
      return validMessages.sort((a, b) => a.sentAt - b.sentAt);
    } catch (error) {
      console.error('Get conversation messages failed:', error);
      throw error;
    }
  }

  /**
   * Get recent conversations for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of recent conversations
   */
  async getRecentConversations(userId) {
    try {
      const conversationsRef = database().ref(`userConversations/${userId}`);
      const snapshot = await conversationsRef
        .orderByChild('lastMessageAt')
        .limitToLast(20)
        .once('value');
      
      const conversations = snapshot.val() || {};
      
      return Object.values(conversations).sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    } catch (error) {
      console.error('Get recent conversations failed:', error);
      throw error;
    }
  }

  /**
   * Report screenshot detection
   * @param {string} messageId - Message ID
   * @param {string} viewerId - Viewer who took screenshot
   * @returns {Promise<void>}
   */
  async reportScreenshot(messageId, viewerId) {
    try {
      await database().ref(`messages/${messageId}`).update({
        screenshotDetected: true,
        screenshotAt: database.ServerValue.TIMESTAMP
      });
      
      // Get message to notify sender
      const messageSnapshot = await database().ref(`messages/${messageId}`).once('value');
      const message = messageSnapshot.val();
      
      if (message) {
        await this.notifyScreenshot(message.senderId, viewerId, messageId);
      }
    } catch (error) {
      console.error('Report screenshot failed:', error);
      throw error;
    }
  }

  /**
   * Delete a message (immediate deletion)
   * @param {string} messageId - Message ID
   * @returns {Promise<void>}
   */
  async deleteMessage(messageId) {
    try {
      // Get message data first
      const messageSnapshot = await database().ref(`messages/${messageId}`).once('value');
      const message = messageSnapshot.val();
      
      if (message && message.mediaUrl) {
        // Delete media file from storage
        await this.deleteMediaFile(message.mediaUrl);
      }
      
      // Delete message from database
      await database().ref(`messages/${messageId}`).remove();
      
      console.log(`Message ${messageId} deleted`);
    } catch (error) {
      console.error('Delete message failed:', error);
      throw error;
    }
  }

  /**
   * Upload media file to Firebase Storage
   * @param {Object} mediaData - Media file data
   * @param {string} userId - User ID for path organization
   * @returns {Promise<string>} Download URL
   */
  async uploadMedia(mediaData, userId) {
    try {
      const timestamp = Date.now();
      const fileExtension = mediaData.type === 'video' ? 'mp4' : 'jpg';
      const fileName = `${userId}_${timestamp}.${fileExtension}`;
      const storagePath = `messages/${userId}/${fileName}`;
      
      const reference = storage().ref(storagePath);
      const uploadTask = reference.putFile(mediaData.uri);
      
      // Wait for upload completion
      await uploadTask;
      
      // Get download URL
      const downloadURL = await reference.getDownloadURL();
      
      return downloadURL;
    } catch (error) {
      console.error('Upload media failed:', error);
      throw error;
    }
  }

  /**
   * Delete media file from storage
   * @param {string} mediaUrl - Media download URL
   * @returns {Promise<void>}
   */
  async deleteMediaFile(mediaUrl) {
    try {
      const reference = storage().refFromURL(mediaUrl);
      await reference.delete();
    } catch (error) {
      console.error('Delete media file failed:', error);
      // Don't throw - file might already be deleted
    }
  }

  /**
   * Add message to user conversation lists
   * @param {string} senderId - Sender ID
   * @param {string} recipientId - Recipient ID
   * @param {string} messageId - Message ID
   * @returns {Promise<void>}
   */
  async addToMessageLists(senderId, recipientId, messageId) {
    try {
      const conversationData = {
        lastMessageId: messageId,
        lastMessageAt: database.ServerValue.TIMESTAMP
      };
      
      // Update sender's conversation list
      await database()
        .ref(`userConversations/${senderId}/${recipientId}`)
        .update(conversationData);
      
      // Update recipient's conversation list
      await database()
        .ref(`userConversations/${recipientId}/${senderId}`)
        .update(conversationData);
    } catch (error) {
      console.error('Add to message lists failed:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic message deletion
   * @param {string} messageId - Message ID
   * @param {number} delayMs - Delay in milliseconds
   * @returns {void}
   */
  scheduleMessageDeletion(messageId, delayMs) {
    setTimeout(async () => {
      try {
        await this.deleteMessage(messageId);
      } catch (error) {
        console.error(`Scheduled deletion failed for message ${messageId}:`, error);
      }
    }, delayMs);
  }

  /**
   * Send push notification (placeholder implementation)
   * @param {string} recipientId - Recipient user ID
   * @param {string} senderId - Sender user ID
   * @param {string} type - Notification type
   * @returns {Promise<void>}
   */
  async sendPushNotification(recipientId, senderId, type) {
    try {
      // TODO: Implement actual push notification using Firebase Cloud Messaging
      console.log(`Push notification: ${type} from ${senderId} to ${recipientId}`);
    } catch (error) {
      console.error('Send push notification failed:', error);
    }
  }

  /**
   * Notify sender that message was viewed
   * @param {string} senderId - Sender user ID
   * @param {string} messageId - Message ID
   * @returns {Promise<void>}
   */
  async notifyMessageViewed(senderId, messageId) {
    try {
      // Add to sender's notifications
      await database().ref(`userNotifications/${senderId}`).push({
        type: 'message_viewed',
        messageId,
        timestamp: database.ServerValue.TIMESTAMP
      });
    } catch (error) {
      console.error('Notify message viewed failed:', error);
    }
  }

  /**
   * Notify sender of screenshot
   * @param {string} senderId - Sender user ID
   * @param {string} viewerId - Viewer user ID
   * @param {string} messageId - Message ID
   * @returns {Promise<void>}
   */
  async notifyScreenshot(senderId, viewerId, messageId) {
    try {
      // Add to sender's notifications
      await database().ref(`userNotifications/${senderId}`).push({
        type: 'screenshot_detected',
        viewerId,
        messageId,
        timestamp: database.ServerValue.TIMESTAMP
      });
      
      // Send push notification
      await this.sendPushNotification(senderId, viewerId, 'screenshot');
    } catch (error) {
      console.error('Notify screenshot failed:', error);
    }
  }
}

export const messagingService = new MessagingService();
export default messagingService; 

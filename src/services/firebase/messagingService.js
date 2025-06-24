/**
 * @file messagingService.js
 * @description Firebase messaging service for SnapConnect Phase 2.
 * Handles ephemeral message sending, receiving, and automatic deletion.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-24
 * 
 * @dependencies
 * - firebase/firestore: Firestore Web SDK
 * - firebase/storage: Firebase Storage Web SDK
 * - expo-file-system: File system access for React Native
 * 
 * @usage
 * import { messagingService } from '@/services/firebase/messagingService';
 * 
 * @ai_context
 * Integrates with AI services for content moderation and smart message suggestions.
 */

import { getFirebaseDB, getFirebaseStorage } from '../../config/firebase';

/**
 * Messaging service class for ephemeral messaging
 */
class MessagingService {
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
   * Get Firebase Auth instance (lazy-loaded)
   * @returns {object} Firebase Auth instance
   */
  getAuth() {
    return require('../../config/firebase').getFirebaseAuth();
  }

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
      const db = this.getDB();
      const { firebase } = require('../../config/firebase');
      const now = firebase.firestore.FieldValue.serverTimestamp();
      
      // Upload media if provided
      let mediaUrl = null;
      if (mediaData) {
        mediaUrl = await this.uploadMedia(mediaData, senderId);
      }
      
      // Create message document
      const messageData = {
        senderId,
        recipientId,
        text: text || '',
        mediaUrl,
        mediaType: mediaData?.type || null,
        timer,
        createdAt: now,
        viewed: false,
        viewedAt: null,
        expiresAt: null, // Set when viewed
        status: 'sent'
      };
      
      // Add message to messages collection
      const messageRef = await db.collection('messages').add(messageData);
      const messageId = messageRef.id;
      
      // Update conversation lists for both users
      await this.addToConversationLists(senderId, recipientId, messageId, now);
      
      // Send push notification
      await this.sendPushNotification(recipientId, senderId, 'new_message');
      
      console.log('✅ Message sent successfully:', messageId);
      return messageId;
    } catch (error) {
      console.error('❌ Send message failed:', error);
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
      const db = this.getDB();
      const messageRef = db.collection('messages').doc(messageId);
      const messageDoc = await messageRef.get();
      
      if (!messageDoc.exists) {
        throw new Error('Message not found');
      }
      
      const messageData = messageDoc.data();
      
      // Check if viewer is authorized (sender or recipient)
      if (messageData.senderId !== viewerId && messageData.recipientId !== viewerId) {
        throw new Error('Unauthorized to view this message');
      }
      
      // If already viewed, return existing data
      if (messageData.viewed) {
        return { id: messageId, ...messageData };
      }
      
      // Mark as viewed and set expiration
      const { firebase } = require('../../config/firebase');
      const viewedAt = firebase.firestore.FieldValue.serverTimestamp();
      const expiresAt = new Date(Date.now() + (messageData.timer * 1000));
      
      await messageRef.update({
        viewed: true,
        viewedAt,
        expiresAt
      });
      
      // Schedule automatic deletion
      this.scheduleMessageDeletion(messageId, messageData.timer * 1000);
      
      // Notify sender if viewer is recipient
      if (messageData.recipientId === viewerId) {
        await this.notifyMessageViewed(messageData.senderId, messageId);
      }
      
      console.log('✅ Message viewed successfully:', messageId);
      return { 
        id: messageId, 
        ...messageData, 
        viewed: true, 
        viewedAt, 
        expiresAt 
      };
    } catch (error) {
      console.error('❌ View message failed:', error);
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
      const db = this.getDB();
      const conversationId = this.getConversationId(userId, otherUserId);
      
      const snapshot = await db
        .collection('messages')
        .where('conversationId', '==', conversationId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      const messages = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Only include non-expired messages
        if (!data.expiresAt || data.expiresAt.toDate() > new Date()) {
          messages.push({ id: doc.id, ...data });
        }
      });
      
      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('❌ Get conversation messages failed:', error);
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
      const db = this.getDB();
      
      const snapshot = await db
        .collection('conversations')
        .where('participants', 'array-contains', userId)
        .orderBy('lastMessageAt', 'desc')
        .limit(20)
        .get();
      
      const conversations = [];
      snapshot.forEach(doc => {
        conversations.push({ id: doc.id, ...doc.data() });
      });
      
      return conversations;
    } catch (error) {
      console.error('❌ Get recent conversations failed:', error);
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
      console.log('🔄 Starting media upload process...');
      console.log('📱 Media data:', { uri: mediaData.uri, type: mediaData.type, size: mediaData.size });
      console.log('👤 User ID:', userId);
      
      // Check authentication first
      const auth = this.getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated. Please log in first.');
      }
      
      console.log('✅ User authenticated:', currentUser.uid);
      
      const storage = this.getStorage();
      const timestamp = Date.now();
      const fileExtension = mediaData.type === 'video' ? 'mp4' : 'jpg';
      const fileName = `messages/${userId}/${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      
      console.log('📁 Storage path:', fileName);
      
      const storageRef = storage.ref().child(fileName);
      console.log('📂 Storage ref created:', storageRef.fullPath);
      
      // Create file blob using fetch API (React Native compatible)
      console.log('🔄 Fetching file from URI...');
      const response = await fetch(mediaData.uri);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('📦 Blob created successfully:', {
        size: blob.size,
        type: blob.type,
        sizeFormatted: `${(blob.size / 1024 / 1024).toFixed(2)} MB`
      });
      
      // Validate blob
      if (blob.size === 0) {
        throw new Error('File is empty or could not be read');
      }
      
      // Upload the blob
      console.log('📤 Starting Firebase Storage upload...');
      const uploadTask = await storageRef.put(blob, {
        contentType: mediaData.type === 'video' ? 'video/mp4' : 'image/jpeg',
        customMetadata: {
          uploadedBy: userId,
          originalType: mediaData.type,
          timestamp: timestamp.toString()
        }
      });
      
      console.log('✅ Upload completed, getting download URL...');
      const downloadUrl = await uploadTask.ref.getDownloadURL();
      
      console.log('✅ Media uploaded successfully:', downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.error('❌ Upload media failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        serverResponse: error.serverResponse,
        customData: error.customData,
        stack: error.stack
      });
      
      // Re-throw with more context
      throw new Error(`Media upload failed: ${error.message}`);
    }
  }



  /**
   * Delete a message (immediate deletion)
   * @param {string} messageId - Message ID
   * @returns {Promise<void>}
   */
  async deleteMessage(messageId) {
    try {
      const db = this.getDB();
      const messageRef = db.collection('messages').doc(messageId);
      const messageDoc = await messageRef.get();
      
      if (messageDoc.exists) {
        const messageData = messageDoc.data();
        
        // Delete media file if exists
        if (messageData.mediaUrl) {
          await this.deleteMediaFile(messageData.mediaUrl);
        }
        
        // Delete the message document
        await messageRef.delete();
        console.log('✅ Message deleted successfully:', messageId);
      }
    } catch (error) {
      console.error('❌ Delete message failed:', error);
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
      const storage = this.getStorage();
      const fileRef = storage.refFromURL(mediaUrl);
      await fileRef.delete();
      console.log('✅ Media file deleted successfully');
    } catch (error) {
      console.error('❌ Delete media file failed:', error);
      // Don't throw - file might already be deleted
    }
  }

  /**
   * Add message to conversation lists for both users
   * @param {string} senderId - Sender ID
   * @param {string} recipientId - Recipient ID
   * @param {string} messageId - Message ID
   * @param {Object} timestamp - Server timestamp
   * @returns {Promise<void>}
   */
  async addToConversationLists(senderId, recipientId, messageId, timestamp) {
    try {
      const db = this.getDB();
      const { firebase } = require('../../config/firebase');
      const conversationId = this.getConversationId(senderId, recipientId);
      
      const conversationData = {
        participants: [senderId, recipientId],
        lastMessageId: messageId,
        lastMessageAt: timestamp,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Use set with merge to create or update conversation
      await db.collection('conversations').doc(conversationId).set(conversationData, { merge: true });
      
      console.log('✅ Conversation lists updated');
    } catch (error) {
      console.error('❌ Add to conversation lists failed:', error);
      throw error;
    }
  }

  /**
   * Generate consistent conversation ID for two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {string} Conversation ID
   */
  getConversationId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
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
        console.log('✅ Scheduled message deletion completed:', messageId);
      } catch (error) {
        console.error(`❌ Scheduled deletion failed for message ${messageId}:`, error);
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
      console.log(`📱 Push notification: ${type} from ${senderId} to ${recipientId}`);
    } catch (error) {
      console.error('❌ Send push notification failed:', error);
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
      const db = this.getDB();
      const { firebase } = require('../../config/firebase');
      
      const notificationData = {
        userId: senderId,
        type: 'message_viewed',
        messageId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
      };
      
      await db.collection('notifications').add(notificationData);
      console.log('✅ Message viewed notification sent');
    } catch (error) {
      console.error('❌ Notify message viewed failed:', error);
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
      const db = this.getDB();
      const { firebase } = require('../../config/firebase');
      const messageRef = db.collection('messages').doc(messageId);
      const messageDoc = await messageRef.get();
      
      if (messageDoc.exists) {
        const messageData = messageDoc.data();
        
        // Log screenshot event
        await db.collection('screenshots').add({
          messageId,
          senderId: messageData.senderId,
          viewerId,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Notify sender
        await this.notifyScreenshot(messageData.senderId, viewerId, messageId);
        
        console.log('✅ Screenshot reported successfully');
      }
    } catch (error) {
      console.error('❌ Report screenshot failed:', error);
      throw error;
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
      const db = this.getDB();
      const { firebase } = require('../../config/firebase');
      
      const notificationData = {
        userId: senderId,
        type: 'screenshot_taken',
        messageId,
        viewerId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
      };
      
      await db.collection('notifications').add(notificationData);
      
      // Also send push notification
      await this.sendPushNotification(senderId, viewerId, 'screenshot_taken');
      
      console.log('✅ Screenshot notification sent');
    } catch (error) {
      console.error('❌ Notify screenshot failed:', error);
    }
  }
}

export const messagingService = new MessagingService();
export default messagingService; 

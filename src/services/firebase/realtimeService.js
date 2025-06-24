/**
 * @file realtimeService.js
 * @description Real-time messaging service for SnapConnect.
 * Handles real-time message listening, notifications, and presence management.
 * 
 * @author SnapConnect Team  
 * @created 2024-01-20
 * 
 * @dependencies
 * - firebase/firestore: Firestore Web SDK
 * - @/config/firebase: Firebase configuration
 * 
 * @usage
 * import { realtimeService } from '@/services/firebase/realtimeService';
 * 
 * @ai_context
 * Integrates with AI services for intelligent message routing and content analysis.
 * Supports real-time AI-powered content moderation and smart notifications.
 */

import { getFirebaseDB } from '../../config/firebase';

/**
 * Real-time messaging service class
 */
class RealtimeService {
  constructor() {
    this.listeners = new Map();
    this.presenceInterval = null;
    this.currentUserId = null;
  }

  /**
   * Get Firestore instance (lazy-loaded)
   * @returns {object} Firestore instance
   */
  getDB() {
    return getFirebaseDB();
  }

  /**
   * Start listening for new messages for a user
   * @param {string} userId - User ID to listen for messages
   * @param {function} onMessage - Callback for new messages
   * @param {function} onError - Error callback
   * @returns {function} Unsubscribe function
   */
  listenForMessages(userId, onMessage, onError) {
    try {
      const db = this.getDB();
      
      // Listen for messages where user is recipient
      const unsubscribe = db
        .collection('messages')
        .where('recipientId', '==', userId)
        .where('viewed', '==', false)
        .orderBy('createdAt', 'desc')
        .onSnapshot(
          (snapshot) => {
            const newMessages = [];
            
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const messageData = change.doc.data();
                newMessages.push({
                  id: change.doc.id,
                  ...messageData
                });
              }
            });
            
            if (newMessages.length > 0) {
              console.log(`📨 Received ${newMessages.length} new message(s)`);
              onMessage(newMessages);
            }
          },
          (error) => {
            console.error('❌ Message listener error:', error);
            onError?.(error);
          }
        );
      
      // Store listener for cleanup
      this.listeners.set(`messages_${userId}`, unsubscribe);
      
      console.log('✅ Started listening for messages:', userId);
      return unsubscribe;
    } catch (error) {
      console.error('❌ Listen for messages failed:', error);
      onError?.(error);
      return () => {};
    }
  }

  /**
   * Listen for conversation updates
   * @param {string} userId - User ID to listen for conversations
   * @param {function} onUpdate - Callback for conversation updates
   * @param {function} onError - Error callback
   * @returns {function} Unsubscribe function
   */
  listenForConversations(userId, onUpdate, onError) {
    try {
      const db = this.getDB();
      
      const unsubscribe = db
        .collection('conversations')
        .where('participants', 'array-contains', userId)
        .orderBy('lastMessageAt', 'desc')
        .onSnapshot(
          (snapshot) => {
            const conversations = [];
            
            snapshot.forEach((doc) => {
              conversations.push({
                id: doc.id,
                ...doc.data()
              });
            });
            
            onUpdate(conversations);
          },
          (error) => {
            console.error('❌ Conversation listener error:', error);
            onError?.(error);
          }
        );
      
      // Store listener for cleanup
      this.listeners.set(`conversations_${userId}`, unsubscribe);
      
      console.log('✅ Started listening for conversations:', userId);
      return unsubscribe;
    } catch (error) {
      console.error('❌ Listen for conversations failed:', error);
      onError?.(error);
      return () => {};
    }
  }

  /**
   * Listen for user presence updates
   * @param {string} userId - User ID to listen for presence
   * @param {function} onPresenceUpdate - Callback for presence updates
   * @param {function} onError - Error callback
   * @returns {function} Unsubscribe function
   */
  listenForPresence(userId, onPresenceUpdate, onError) {
    try {
      const db = this.getDB();
      
      const unsubscribe = db
        .collection('presence')
        .doc(userId)
        .onSnapshot(
          (doc) => {
            if (doc.exists) {
              const presenceData = doc.data();
              onPresenceUpdate(presenceData);
            }
          },
          (error) => {
            console.error('❌ Presence listener error:', error);
            onError?.(error);
          }
        );
      
      // Store listener for cleanup
      this.listeners.set(`presence_${userId}`, unsubscribe);
      
      console.log('✅ Started listening for presence:', userId);
      return unsubscribe;
    } catch (error) {
      console.error('❌ Listen for presence failed:', error);
      onError?.(error);
      return () => {};
    }
  }

  /**
   * Start presence management for a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async startPresence(userId) {
    try {
      const db = this.getDB();
      const { firebase } = require('../../config/firebase');
      
      this.currentUserId = userId;
      
      // Set initial online status
      await db.collection('presence').doc(userId).set({
        isOnline: true,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update presence every 30 seconds
      this.presenceInterval = setInterval(async () => {
        try {
          await db.collection('presence').doc(userId).update({
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        } catch (error) {
          console.error('❌ Presence update failed:', error);
        }
      }, 30000);
      
      // Set offline on disconnect (using onDisconnect in a real implementation)
      // For now, we'll handle this in stopPresence
      
      console.log('✅ Started presence management:', userId);
    } catch (error) {
      console.error('❌ Start presence failed:', error);
      throw error;
    }
  }

  /**
   * Stop presence management
   * @returns {Promise<void>}
   */
  async stopPresence() {
    try {
      // Clear presence interval
      if (this.presenceInterval) {
        clearInterval(this.presenceInterval);
        this.presenceInterval = null;
      }
      
      // Set user offline
      if (this.currentUserId) {
        const db = this.getDB();
        const { firebase } = require('../../config/firebase');
        
        await db.collection('presence').doc(this.currentUserId).update({
          isOnline: false,
          lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Stopped presence management:', this.currentUserId);
        this.currentUserId = null;
      }
    } catch (error) {
      console.error('❌ Stop presence failed:', error);
    }
  }

  /**
   * Send typing indicator
   * @param {string} senderId - Sender user ID
   * @param {string} recipientId - Recipient user ID
   * @param {boolean} isTyping - Whether user is typing
   * @returns {Promise<void>}
   */
  async sendTypingIndicator(senderId, recipientId, isTyping) {
    try {
      const db = this.getDB();
      const { firebase } = require('../../config/firebase');
      const conversationId = this.getConversationId(senderId, recipientId);
      
      if (isTyping) {
        await db.collection('typing').doc(conversationId).set({
          userId: senderId,
          isTyping: true,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else {
        await db.collection('typing').doc(conversationId).delete();
      }
    } catch (error) {
      console.error('❌ Send typing indicator failed:', error);
    }
  }

  /**
   * Listen for typing indicators
   * @param {string} conversationId - Conversation ID
   * @param {function} onTypingUpdate - Callback for typing updates
   * @param {function} onError - Error callback
   * @returns {function} Unsubscribe function
   */
  listenForTyping(conversationId, onTypingUpdate, onError) {
    try {
      const db = this.getDB();
      
      const unsubscribe = db
        .collection('typing')
        .doc(conversationId)
        .onSnapshot(
          (doc) => {
            if (doc.exists) {
              const typingData = doc.data();
              onTypingUpdate(typingData);
            } else {
              onTypingUpdate(null);
            }
          },
          (error) => {
            console.error('❌ Typing listener error:', error);
            onError?.(error);
          }
        );
      
      // Store listener for cleanup
      this.listeners.set(`typing_${conversationId}`, unsubscribe);
      
      return unsubscribe;
    } catch (error) {
      console.error('❌ Listen for typing failed:', error);
      onError?.(error);
      return () => {};
    }
  }

  /**
   * Mark message as delivered
   * @param {string} messageId - Message ID
   * @param {string} recipientId - Recipient user ID
   * @returns {Promise<void>}
   */
  async markAsDelivered(messageId, recipientId) {
    try {
      const db = this.getDB();
      const { firebase } = require('../../config/firebase');
      
      await db.collection('messages').doc(messageId).update({
        delivered: true,
        deliveredAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Message marked as delivered:', messageId);
    } catch (error) {
      console.error('❌ Mark as delivered failed:', error);
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
   * Stop listening for a specific listener
   * @param {string} listenerKey - Listener key
   */
  stopListener(listenerKey) {
    const unsubscribe = this.listeners.get(listenerKey);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(listenerKey);
      console.log('✅ Stopped listener:', listenerKey);
    }
  }

  /**
   * Stop all active listeners
   */
  stopAllListeners() {
    this.listeners.forEach((unsubscribe, key) => {
      try {
        unsubscribe();
        console.log('✅ Stopped listener:', key);
      } catch (error) {
        console.error('❌ Stop listener failed:', key, error);
      }
    });
    
    this.listeners.clear();
    console.log('✅ Stopped all listeners');
  }

  /**
   * Clean up all services
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      await this.stopPresence();
      this.stopAllListeners();
      console.log('✅ Real-time service cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;

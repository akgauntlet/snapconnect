/**
 * @file friendsService.js
 * @description Firebase friends service for SnapConnect Phase 2.
 * Handles friend discovery, requests, management, and contact sync.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-24
 * 
 * @dependencies
 * - firebase/firestore: Firestore Web SDK
 * 
 * @usage
 * import { friendsService } from '@/services/firebase/friendsService';
 * 
 * @ai_context
 * Integrates with AI services for smart friend suggestions and social graph analysis.
 */

import { getFirebaseDB } from '../../config/firebase';

/**
 * Friends service class for friend management
 */
class FriendsService {
  /**
   * Get Firestore instance (lazy-loaded)
   * @returns {object} Firestore instance
   */
  getDB() {
    return getFirebaseDB();
  }

  /**
   * Send a friend request
   * @param {string} fromUserId - Requesting user ID
   * @param {string} toUserId - Target user ID
   * @returns {Promise<string>} Request ID
   */
  async sendFriendRequest(fromUserId, toUserId) {
    try {
      const db = this.getDB();
      const { firebase } = require('../../config/firebase');
      
      // Check if users are already friends
      if (await this.areFriends(fromUserId, toUserId)) {
        throw new Error('Users are already friends');
      }
      
      // Check if request already exists
      const existingRequest = await this.getFriendRequest(fromUserId, toUserId);
      if (existingRequest) {
        throw new Error('Friend request already sent');
      }
      
      // Create friend request
      const requestData = {
        fromUserId,
        toUserId,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const requestRef = await db.collection('friendRequests').add(requestData);
      
      // Send notification
      await this.sendFriendRequestNotification(toUserId, fromUserId);
      
      console.log('✅ Friend request sent successfully:', requestRef.id);
      return requestRef.id;
    } catch (error) {
      console.error('❌ Send friend request failed:', error);
      throw error;
    }
  }

  /**
   * Accept a friend request
   * @param {string} requestId - Friend request ID
   * @param {string} userId - User accepting the request
   * @returns {Promise<void>}
   */
  async acceptFriendRequest(requestId, userId) {
    try {
      const db = this.getDB();
      const { firebase } = require('../../config/firebase');
      const batch = db.batch();
      
      // Get the friend request
      const requestRef = db.collection('friendRequests').doc(requestId);
      const requestDoc = await requestRef.get();
      
      if (!requestDoc.exists) {
        throw new Error('Friend request not found');
      }
      
      const requestData = requestDoc.data();
      
      // Verify user is the recipient
      if (requestData.toUserId !== userId) {
        throw new Error('Unauthorized to accept this request');
      }
      
      // Update request status
      batch.update(requestRef, {
        status: 'accepted',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Create friendship records for both users
      const friendship1Ref = db.collection('friendships').doc();
      const friendship2Ref = db.collection('friendships').doc();
      
      const now = firebase.firestore.FieldValue.serverTimestamp();
      
      batch.set(friendship1Ref, {
        userId: requestData.fromUserId,
        friendId: requestData.toUserId,
        createdAt: now
      });
      
      batch.set(friendship2Ref, {
        userId: requestData.toUserId,
        friendId: requestData.fromUserId,
        createdAt: now
      });
      
      await batch.commit();
      
      // Send notification
      await this.sendFriendAcceptedNotification(requestData.fromUserId, userId);
      
      console.log('✅ Friend request accepted successfully');
    } catch (error) {
      console.error('❌ Accept friend request failed:', error);
      throw error;
    }
  }

  /**
   * Decline a friend request
   * @param {string} requestId - Friend request ID
   * @param {string} userId - User declining the request
   * @returns {Promise<void>}
   */
  async declineFriendRequest(requestId, userId) {
    try {
      const db = this.getDB();
      const { firebase } = require('../../config/firebase');
      const requestRef = db.collection('friendRequests').doc(requestId);
      const requestDoc = await requestRef.get();
      
      if (!requestDoc.exists) {
        throw new Error('Friend request not found');
      }
      
      const requestData = requestDoc.data();
      
      // Verify user is the recipient
      if (requestData.toUserId !== userId) {
        throw new Error('Unauthorized to decline this request');
      }
      
      // Update request status
      await requestRef.update({
        status: 'declined',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Friend request declined successfully');
    } catch (error) {
      console.error('❌ Decline friend request failed:', error);
      throw error;
    }
  }

  /**
   * Remove a friend
   * @param {string} userId - Current user ID
   * @param {string} friendId - Friend to remove
   * @returns {Promise<void>}
   */
  async removeFriend(userId, friendId) {
    try {
      const db = this.getDB();
      const batch = db.batch();
      
      // Find and delete both friendship records
      const friendship1Query = await db
        .collection('friendships')
        .where('userId', '==', userId)
        .where('friendId', '==', friendId)
        .get();
      
      const friendship2Query = await db
        .collection('friendships')
        .where('userId', '==', friendId)
        .where('friendId', '==', userId)
        .get();
      
      friendship1Query.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      friendship2Query.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      console.log('✅ Friend removed successfully');
    } catch (error) {
      console.error('❌ Remove friend failed:', error);
      throw error;
    }
  }

  /**
   * Get user's friends list
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of friend objects with user data
   */
  async getFriends(userId) {
    try {
      const db = this.getDB();
      
      // Get friendship records
      const friendshipsSnapshot = await db
        .collection('friendships')
        .where('userId', '==', userId)
        .get();
      
      if (friendshipsSnapshot.empty) {
        return [];
      }
      
      // Get friend IDs
      const friendIds = friendshipsSnapshot.docs.map(doc => doc.data().friendId);
      
      // Get friend user data (batch get for efficiency)
      const friends = [];
      
      // Firestore has a limit of 10 items for 'in' queries, so we need to batch
      const batchSize = 10;
      for (let i = 0; i < friendIds.length; i += batchSize) {
        const batch = friendIds.slice(i, i + batchSize);
        
        const usersSnapshot = await db
          .collection('users')
          .where(db.FieldPath.documentId(), 'in', batch)
          .get();
        
        usersSnapshot.forEach(doc => {
          friends.push({ id: doc.id, ...doc.data() });
        });
      }
      
      return friends;
    } catch (error) {
      console.error('❌ Get friends failed:', error);
      throw error;
    }
  }

  /**
   * Get pending friend requests for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of pending friend requests
   */
  async getPendingFriendRequests(userId) {
    try {
      const db = this.getDB();
      
      // Get incoming requests
      const incomingSnapshot = await db
        .collection('friendRequests')
        .where('toUserId', '==', userId)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .get();
      
      // Get outgoing requests
      const outgoingSnapshot = await db
        .collection('friendRequests')
        .where('fromUserId', '==', userId)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .get();
      
      const requests = [];
      
      // Process incoming requests
      for (const doc of incomingSnapshot.docs) {
        const requestData = doc.data();
        const userDoc = await db.collection('users').doc(requestData.fromUserId).get();
        
        requests.push({
          id: doc.id,
          type: 'incoming',
          user: userDoc.exists ? userDoc.data() : null,
          ...requestData
        });
      }
      
      // Process outgoing requests
      for (const doc of outgoingSnapshot.docs) {
        const requestData = doc.data();
        const userDoc = await db.collection('users').doc(requestData.toUserId).get();
        
        requests.push({
          id: doc.id,
          type: 'outgoing',
          user: userDoc.exists ? userDoc.data() : null,
          ...requestData
        });
      }
      
      return requests;
    } catch (error) {
      console.error('❌ Get pending friend requests failed:', error);
      throw error;
    }
  }

  /**
   * Search for users by username or phone number
   * @param {string} query - Search query (username or phone)
   * @param {string} currentUserId - Current user ID (to exclude from results)
   * @returns {Promise<Array>} Array of matching users
   */
  async searchUsers(query, currentUserId) {
    try {
      const db = this.getDB();
      const results = [];
      
      // Search by username (case-insensitive)
      const usernameSnapshot = await db
        .collection('users')
        .where('username', '>=', query.toLowerCase())
        .where('username', '<=', query.toLowerCase() + '\uf8ff')
        .limit(20)
        .get();
      
      usernameSnapshot.forEach(doc => {
        const userData = doc.data();
        if (doc.id !== currentUserId) {
          results.push({ id: doc.id, ...userData });
        }
      });
      
      // Search by display name
      const displayNameSnapshot = await db
        .collection('users')
        .where('displayName', '>=', query)
        .where('displayName', '<=', query + '\uf8ff')
        .limit(20)
        .get();
      
      displayNameSnapshot.forEach(doc => {
        const userData = doc.data();
        if (doc.id !== currentUserId && !results.find(user => user.id === doc.id)) {
          results.push({ id: doc.id, ...userData });
        }
      });
      
      return results;
    } catch (error) {
      console.error('❌ Search users failed:', error);
      throw error;
    }
  }

  /**
   * Get friend suggestions based on mutual friends and contacts
   * @param {string} userId - User ID
   * @param {Array} contactNumbers - User's contact phone numbers
   * @returns {Promise<Array>} Array of suggested friends
   */
  async getFriendSuggestions(userId, contactNumbers = []) {
    try {
      const db = this.getDB();
      const suggestions = [];
      
      // Get current friends to exclude them
      const currentFriends = await this.getFriendIds(userId);
      const excludeIds = [...currentFriends, userId];
      
      // Find users by phone numbers from contacts
      if (contactNumbers.length > 0) {
        const batchSize = 10;
        for (let i = 0; i < contactNumbers.length; i += batchSize) {
          const batch = contactNumbers.slice(i, i + batchSize);
          
          const contactSnapshot = await db
            .collection('users')
            .where('phoneNumber', 'in', batch)
            .get();
          
          contactSnapshot.forEach(doc => {
            if (!excludeIds.includes(doc.id)) {
              suggestions.push({
                id: doc.id,
                ...doc.data(),
                reason: 'contact'
              });
            }
          });
        }
      }
      
      // Get mutual friend suggestions
      const mutualSuggestions = await this.getMutualFriendSuggestions(userId, currentFriends);
      suggestions.push(...mutualSuggestions);
      
      // Remove duplicates and limit results
      const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
        index === self.findIndex(s => s.id === suggestion.id)
      );
      
      return uniqueSuggestions.slice(0, 20);
    } catch (error) {
      console.error('❌ Get friend suggestions failed:', error);
      throw error;
    }
  }

  /**
   * Check if two users are friends
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<boolean>} True if users are friends
   */
  async areFriends(userId1, userId2) {
    try {
      const db = this.getDB();
      
      const friendshipSnapshot = await db
        .collection('friendships')
        .where('userId', '==', userId1)
        .where('friendId', '==', userId2)
        .get();
      
      return !friendshipSnapshot.empty;
    } catch (error) {
      console.error('❌ Check friendship failed:', error);
      return false;
    }
  }

  /**
   * Get existing friend request between users
   * @param {string} fromUserId - Requesting user ID
   * @param {string} toUserId - Target user ID
   * @returns {Promise<Object|null>} Existing request or null
   */
  async getFriendRequest(fromUserId, toUserId) {
    try {
      const db = this.getDB();
      
      const requestSnapshot = await db
        .collection('friendRequests')
        .where('fromUserId', '==', fromUserId)
        .where('toUserId', '==', toUserId)
        .where('status', '==', 'pending')
        .get();
      
      if (requestSnapshot.empty) {
        return null;
      }
      
      const doc = requestSnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('❌ Get friend request failed:', error);
      return null;
    }
  }

  /**
   * Get friend IDs for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of friend IDs
   */
  async getFriendIds(userId) {
    try {
      const db = this.getDB();
      
      const friendshipsSnapshot = await db
        .collection('friendships')
        .where('userId', '==', userId)
        .get();
      
      return friendshipsSnapshot.docs.map(doc => doc.data().friendId);
    } catch (error) {
      console.error('❌ Get friend IDs failed:', error);
      return [];
    }
  }

  /**
   * Get mutual friend suggestions
   * @param {string} userId - User ID
   * @param {Array} currentFriends - Current friend IDs
   * @returns {Promise<Array>} Array of mutual friend suggestions
   */
  async getMutualFriendSuggestions(userId, currentFriends) {
    try {
      const db = this.getDB();
      const suggestions = [];
      const excludeIds = [...currentFriends, userId];
      
      // For each friend, get their friends
      for (const friendId of currentFriends.slice(0, 10)) { // Limit to avoid too many queries
        const friendsFriendsSnapshot = await db
          .collection('friendships')
          .where('userId', '==', friendId)
          .get();
        
        const friendsFriends = friendsFriendsSnapshot.docs.map(doc => doc.data().friendId);
        
        // Find potential suggestions (friends of friends)
        for (const potentialFriendId of friendsFriends) {
          if (!excludeIds.includes(potentialFriendId)) {
            // Get user data
            const userDoc = await db.collection('users').doc(potentialFriendId).get();
            
            if (userDoc.exists) {
              suggestions.push({
                id: potentialFriendId,
                ...userDoc.data(),
                reason: 'mutual_friend',
                mutualFriendId: friendId
              });
              
              excludeIds.push(potentialFriendId); // Avoid duplicates
            }
          }
        }
      }
      
      return suggestions.slice(0, 10); // Limit results
    } catch (error) {
      console.error('❌ Get mutual friend suggestions failed:', error);
      return [];
    }
  }

  /**
   * Send friend request notification
   * @param {string} recipientId - Recipient user ID
   * @param {string} senderId - Sender user ID
   * @returns {Promise<void>}
   */
  async sendFriendRequestNotification(recipientId, senderId) {
    try {
      const db = this.getDB();
      const { firebase } = require('../../config/firebase');
      
      const notificationData = {
        userId: recipientId,
        type: 'friend_request',
        senderId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
      };
      
      await db.collection('notifications').add(notificationData);
      console.log('✅ Friend request notification sent');
    } catch (error) {
      console.error('❌ Send friend request notification failed:', error);
    }
  }

  /**
   * Send friend accepted notification
   * @param {string} recipientId - Recipient user ID
   * @param {string} accepterId - User who accepted the request
   * @returns {Promise<void>}
   */
  async sendFriendAcceptedNotification(recipientId, accepterId) {
    try {
      const db = this.getDB();
      const { firebase } = require('../../config/firebase');
      
      const notificationData = {
        userId: recipientId,
        type: 'friend_accepted',
        accepterId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
      };
      
      await db.collection('notifications').add(notificationData);
      console.log('✅ Friend accepted notification sent');
    } catch (error) {
      console.error('❌ Send friend accepted notification failed:', error);
    }
  }
}

export const friendsService = new FriendsService();
export default friendsService; 

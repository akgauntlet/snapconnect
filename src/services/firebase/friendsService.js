/**
 * @file friendsService.js
 * @description Firebase friends service for SnapConnect Phase 2.
 * Handles friend discovery, requests, management, and contact sync.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-20
 * 
 * @dependencies
 * - @react-native-firebase/database: Realtime Database
 * 
 * @usage
 * import { friendsService } from '@/services/firebase/friendsService';
 * 
 * @ai_context
 * Integrates with AI services for smart friend suggestions and social graph analysis.
 */

import { database } from '../../config/firebase';

/**
 * Friends service class for friend management
 */
class FriendsService {
  /**
   * Send a friend request
   * @param {string} fromUserId - Requesting user ID
   * @param {string} toUserId - Target user ID
   * @returns {Promise<string>} Request ID
   */
  async sendFriendRequest(fromUserId, toUserId) {
    try {
      // Check if users are already friends
      const existingFriendship = await this.areFriends(fromUserId, toUserId);
      if (existingFriendship) {
        throw new Error('Users are already friends');
      }
      
      // Check if request already exists
      const existingRequest = await this.getFriendRequest(fromUserId, toUserId);
      if (existingRequest) {
        throw new Error('Friend request already sent');
      }
      
      // Create friend request
      const requestId = database().ref('friendRequests').push().key;
      const request = {
        id: requestId,
        fromUserId,
        toUserId,
        status: 'pending',
        sentAt: database.ServerValue.TIMESTAMP
      };
      
      await database().ref(`friendRequests/${requestId}`).set(request);
      
      // Add to recipient's pending requests
      await database().ref(`userFriendRequests/${toUserId}/${requestId}`).set(true);
      
      // Send notification to recipient
      await this.sendFriendRequestNotification(toUserId, fromUserId);
      
      return requestId;
    } catch (error) {
      console.error('Send friend request failed:', error);
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
      // Get request details
      const requestSnapshot = await database().ref(`friendRequests/${requestId}`).once('value');
      const request = requestSnapshot.val();
      
      if (!request || request.toUserId !== userId) {
        throw new Error('Invalid friend request');
      }
      
      const { fromUserId, toUserId } = request;
      const timestamp = database.ServerValue.TIMESTAMP;
      
      // Create friendship records
      await database().ref(`friends/${fromUserId}/${toUserId}`).set(timestamp);
      await database().ref(`friends/${toUserId}/${fromUserId}`).set(timestamp);
      
      // Update request status
      await database().ref(`friendRequests/${requestId}`).update({
        status: 'accepted',
        acceptedAt: timestamp
      });
      
      // Clean up pending request
      await database().ref(`userFriendRequests/${userId}/${requestId}`).remove();
      
      // Notify requester
      await this.sendFriendAcceptedNotification(fromUserId, toUserId);
      
    } catch (error) {
      console.error('Accept friend request failed:', error);
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
      // Get request details
      const requestSnapshot = await database().ref(`friendRequests/${requestId}`).once('value');
      const request = requestSnapshot.val();
      
      if (!request || request.toUserId !== userId) {
        throw new Error('Invalid friend request');
      }
      
      // Update request status
      await database().ref(`friendRequests/${requestId}`).update({
        status: 'declined',
        declinedAt: database.ServerValue.TIMESTAMP
      });
      
      // Clean up pending request
      await database().ref(`userFriendRequests/${userId}/${requestId}`).remove();
      
    } catch (error) {
      console.error('Decline friend request failed:', error);
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
      // Remove friendship records
      await database().ref(`friends/${userId}/${friendId}`).remove();
      await database().ref(`friends/${friendId}/${userId}`).remove();
      
    } catch (error) {
      console.error('Remove friend failed:', error);
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
      const friendsSnapshot = await database().ref(`friends/${userId}`).once('value');
      const friendIds = friendsSnapshot.val() || {};
      
      const friends = [];
      
      // Get user data for each friend
      for (const [friendId, friendshipTimestamp] of Object.entries(friendIds)) {
        const userSnapshot = await database().ref(`users/${friendId}`).once('value');
        const userData = userSnapshot.val();
        
        if (userData) {
          friends.push({
            ...userData,
            friendshipTimestamp
          });
        }
      }
      
      return friends.sort((a, b) => b.friendshipTimestamp - a.friendshipTimestamp);
    } catch (error) {
      console.error('Get friends failed:', error);
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
      const requestsSnapshot = await database().ref(`userFriendRequests/${userId}`).once('value');
      const requestIds = requestsSnapshot.val() || {};
      
      const requests = [];
      
      // Get request details for each ID
      for (const requestId of Object.keys(requestIds)) {
        const requestSnapshot = await database().ref(`friendRequests/${requestId}`).once('value');
        const request = requestSnapshot.val();
        
        if (request && request.status === 'pending') {
          // Get sender user data
          const senderSnapshot = await database().ref(`users/${request.fromUserId}`).once('value');
          const senderData = senderSnapshot.val();
          
          requests.push({
            ...request,
            sender: senderData
          });
        }
      }
      
      return requests.sort((a, b) => b.sentAt - a.sentAt);
    } catch (error) {
      console.error('Get pending friend requests failed:', error);
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
      const users = [];
      
      // Search by username
      if (query.length >= 3) {
        const usernameSnapshot = await database()
          .ref('users')
          .orderByChild('username')
          .startAt(query.toLowerCase())
          .endAt(query.toLowerCase() + '\uf8ff')
          .limitToFirst(20)
          .once('value');
        
        const usernameResults = usernameSnapshot.val() || {};
        
        Object.values(usernameResults).forEach(user => {
          if (user.uid !== currentUserId) {
            users.push(user);
          }
        });
      }
      
      // Search by phone number (exact match only)
      if (query.startsWith('+')) {
        const phoneSnapshot = await database()
          .ref('users')
          .orderByChild('phoneNumber')
          .equalTo(query)
          .once('value');
        
        const phoneResults = phoneSnapshot.val() || {};
        
        Object.values(phoneResults).forEach(user => {
          if (user.uid !== currentUserId && !users.find(u => u.uid === user.uid)) {
            users.push(user);
          }
        });
      }
      
      return users;
    } catch (error) {
      console.error('Search users failed:', error);
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
      const suggestions = [];
      const currentFriends = await this.getFriendIds(userId);
      
      // Get suggestions from contacts
      if (contactNumbers.length > 0) {
        for (const phoneNumber of contactNumbers) {
          const userSnapshot = await database()
            .ref('users')
            .orderByChild('phoneNumber')
            .equalTo(phoneNumber)
            .once('value');
          
          const users = userSnapshot.val() || {};
          
          Object.values(users).forEach(user => {
            if (user.uid !== userId && !currentFriends.includes(user.uid)) {
              suggestions.push({
                ...user,
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
        index === self.findIndex(s => s.uid === suggestion.uid)
      );
      
      return uniqueSuggestions.slice(0, 20);
    } catch (error) {
      console.error('Get friend suggestions failed:', error);
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
      const friendshipSnapshot = await database().ref(`friends/${userId1}/${userId2}`).once('value');
      return friendshipSnapshot.exists();
    } catch (error) {
      console.error('Check friendship failed:', error);
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
      const requestsSnapshot = await database()
        .ref('friendRequests')
        .orderByChild('fromUserId')
        .equalTo(fromUserId)
        .once('value');
      
      const requests = requestsSnapshot.val() || {};
      
      for (const request of Object.values(requests)) {
        if (request.toUserId === toUserId && request.status === 'pending') {
          return request;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Get friend request failed:', error);
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
      const friendsSnapshot = await database().ref(`friends/${userId}`).once('value');
      const friends = friendsSnapshot.val() || {};
      return Object.keys(friends);
    } catch (error) {
      console.error('Get friend IDs failed:', error);
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
      const suggestions = [];
      const mutualCounts = {};
      
      // For each friend, get their friends
      for (const friendId of currentFriends) {
        const friendsFriendsSnapshot = await database().ref(`friends/${friendId}`).once('value');
        const friendsFriends = friendsFriendsSnapshot.val() || {};
        
        // Count mutual connections
        Object.keys(friendsFriends).forEach(mutualFriendId => {
          if (mutualFriendId !== userId && !currentFriends.includes(mutualFriendId)) {
            mutualCounts[mutualFriendId] = (mutualCounts[mutualFriendId] || 0) + 1;
          }
        });
      }
      
      // Get user data for suggestions with mutual friends
      for (const [mutualFriendId, count] of Object.entries(mutualCounts)) {
        if (count >= 2) { // At least 2 mutual friends
          const userSnapshot = await database().ref(`users/${mutualFriendId}`).once('value');
          const userData = userSnapshot.val();
          
          if (userData) {
            suggestions.push({
              ...userData,
              reason: 'mutual_friends',
              mutualCount: count
            });
          }
        }
      }
      
      return suggestions.sort((a, b) => b.mutualCount - a.mutualCount);
    } catch (error) {
      console.error('Get mutual friend suggestions failed:', error);
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
      await database().ref(`userNotifications/${recipientId}`).push({
        type: 'friend_request',
        senderId,
        timestamp: database.ServerValue.TIMESTAMP
      });
    } catch (error) {
      console.error('Send friend request notification failed:', error);
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
      await database().ref(`userNotifications/${recipientId}`).push({
        type: 'friend_accepted',
        accepterId,
        timestamp: database.ServerValue.TIMESTAMP
      });
    } catch (error) {
      console.error('Send friend accepted notification failed:', error);
    }
  }
}

export const friendsService = new FriendsService();
export default friendsService; 

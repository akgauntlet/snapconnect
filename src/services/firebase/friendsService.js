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

import { getFirebaseDB } from "../../config/firebase";

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
      const { firebase } = require("../../config/firebase");

      // Check if users are already friends
      if (await this.areFriends(fromUserId, toUserId)) {
        throw new Error("Users are already friends");
      }

      // Check if request already exists
      const existingRequest = await this.getFriendRequest(fromUserId, toUserId);
      if (existingRequest) {
        throw new Error("Friend request already sent");
      }

      // Create friend request
      const requestData = {
        fromUserId,
        toUserId,
        status: "pending",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      const requestRef = await db.collection("friendRequests").add(requestData);

      // Send notification
      await this.sendFriendRequestNotification(toUserId, fromUserId);


      return requestRef.id;
    } catch (error) {
      console.error("❌ Send friend request failed:", error);
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
      const { firebase } = require("../../config/firebase");
      const batch = db.batch();

      const requestRef = db.collection("friendRequests").doc(requestId);
      const requestDoc = await requestRef.get();

      if (!requestDoc.exists) {
        throw new Error("Friend request not found");
      }

      const requestData = requestDoc.data();

      // Verify user is the recipient
      if (requestData.toUserId !== userId) {
        throw new Error("Unauthorized to accept this request");
      }

      // Update request status
      batch.update(requestRef, {
        status: "accepted",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      // Create friendship records for both users using subcollections
      const friendship1Ref = db
        .collection("users")
        .doc(requestData.fromUserId)
        .collection("friends")
        .doc(requestData.toUserId);
      const friendship2Ref = db
        .collection("users")
        .doc(requestData.toUserId)
        .collection("friends")
        .doc(requestData.fromUserId);

      const now = firebase.firestore.FieldValue.serverTimestamp();

      batch.set(friendship1Ref, {
        userId: requestData.toUserId,
        createdAt: now,
      });

      batch.set(friendship2Ref, {
        userId: requestData.fromUserId,
        createdAt: now,
      });

      await batch.commit();

      // Send notification
      await this.sendFriendAcceptedNotification(requestData.fromUserId, userId);


    } catch (error) {
      console.error("❌ Accept friend request failed:", error);
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
      const { firebase } = require("../../config/firebase");
      const requestRef = db.collection("friendRequests").doc(requestId);
      const requestDoc = await requestRef.get();

      if (!requestDoc.exists) {
        throw new Error("Friend request not found");
      }

      const requestData = requestDoc.data();

      // Verify user is the recipient
      if (requestData.toUserId !== userId) {
        throw new Error("Unauthorized to decline this request");
      }

      // Update request status
      await requestRef.update({
        status: "declined",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });


    } catch (error) {
      console.error("❌ Decline friend request failed:", error);
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

      // Delete friendship records from both user's subcollections
      const friendship1Ref = db
        .collection("users")
        .doc(userId)
        .collection("friends")
        .doc(friendId);
      const friendship2Ref = db
        .collection("users")
        .doc(friendId)
        .collection("friends")
        .doc(userId);

      batch.delete(friendship1Ref);
      batch.delete(friendship2Ref);

      await batch.commit();


    } catch (error) {
      console.error("❌ Remove friend failed:", error);
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
      const { firebase } = require("../../config/firebase");

      // Get friendship records from user's subcollection
      const friendsSnapshot = await db
        .collection("users")
        .doc(userId)
        .collection("friends")
        .get();

      if (friendsSnapshot.empty) {
        return [];
      }

      // Get friend IDs
      const friendIds = friendsSnapshot.docs.map((doc) => doc.id);

      // Get friend user data (batch get for efficiency)
      const friends = [];
      const danglingFriendships = []; // Track friendships pointing to non-existent users

      // Firestore has a limit of 10 items for 'in' queries, so we need to batch
      const batchSize = 10;
      for (let i = 0; i < friendIds.length; i += batchSize) {
        const batch = friendIds.slice(i, i + batchSize);

        const usersSnapshot = await db
          .collection("users")
          .where(firebase.firestore.FieldPath.documentId(), "in", batch)
          .get();

        // Track which users were found
        const foundUserIds = new Set();
        usersSnapshot.forEach((doc) => {
          friends.push({ id: doc.id, ...doc.data() });
          foundUserIds.add(doc.id);
        });

        // Find dangling friendships (friend IDs that don't have user documents)
        const missingUserIds = batch.filter(
          (friendId) => !foundUserIds.has(friendId),
        );
        if (missingUserIds.length > 0) {
          danglingFriendships.push(...missingUserIds);
        }
      }

      // Clean up dangling friendships
      if (danglingFriendships.length > 0) {
        await this.cleanupDanglingFriendships(userId, danglingFriendships);
      }

      return friends;
    } catch (error) {
      console.error("❌ Get friends failed:", error);
      throw error;
    }
  }

  /**
   * Clean up friendship documents that point to non-existent users
   * @param {string} userId - Current user ID
   * @param {Array} danglingFriendIds - Array of friend IDs that don't exist
   * @returns {Promise<void>}
   */
  async cleanupDanglingFriendships(userId, danglingFriendIds) {
    try {
      const db = this.getDB();
      const batch = db.batch();

      for (const friendId of danglingFriendIds) {
        const friendshipRef = db
          .collection("users")
          .doc(userId)
          .collection("friends")
          .doc(friendId);
        batch.delete(friendshipRef);
      }

      await batch.commit();
    } catch (error) {
      console.error("❌ Failed to clean up dangling friendships:", error);
      // Don't throw - this is cleanup, main function should continue
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
        .collection("friendRequests")
        .where("toUserId", "==", userId)
        .where("status", "==", "pending")
        .orderBy("createdAt", "desc")
        .get();

      // Get outgoing requests
      const outgoingSnapshot = await db
        .collection("friendRequests")
        .where("fromUserId", "==", userId)
        .where("status", "==", "pending")
        .orderBy("createdAt", "desc")
        .get();

      const requests = [];

      // Process incoming requests
      for (const doc of incomingSnapshot.docs) {
        const requestData = doc.data();
        const userDoc = await db
          .collection("users")
          .doc(requestData.fromUserId)
          .get();

        requests.push({
          id: doc.id,
          type: "incoming",
          user: userDoc.exists ? userDoc.data() : null,
          ...requestData,
        });
      }

      // Process outgoing requests
      for (const doc of outgoingSnapshot.docs) {
        const requestData = doc.data();
        const userDoc = await db
          .collection("users")
          .doc(requestData.toUserId)
          .get();

        requests.push({
          id: doc.id,
          type: "outgoing",
          user: userDoc.exists ? userDoc.data() : null,
          ...requestData,
        });
      }

      return requests;
    } catch (error) {
      console.error("❌ Get pending friend requests failed:", error);
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
        .collection("users")
        .where("username", ">=", query.toLowerCase())
        .where("username", "<=", query.toLowerCase() + "\uf8ff")
        .limit(20)
        .get();

      usernameSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (doc.id !== currentUserId) {
          results.push({ id: doc.id, ...userData });
        }
      });

      // Search by display name
      const displayNameSnapshot = await db
        .collection("users")
        .where("displayName", ">=", query)
        .where("displayName", "<=", query + "\uf8ff")
        .limit(20)
        .get();

      displayNameSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (
          doc.id !== currentUserId &&
          !results.find((user) => user.id === doc.id)
        ) {
          results.push({ id: doc.id, ...userData });
        }
      });

      return results;
    } catch (error) {
      console.error("❌ Search users failed:", error);
      throw error;
    }
  }

  /**
   * Get friend suggestions based on mutual friends, contacts, and gaming genre similarities
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

      console.log('🤝 Getting friend suggestions for user:', { userId, excludeCount: excludeIds.length });

      // Find users by phone numbers from contacts
      if (contactNumbers.length > 0) {
        const batchSize = 10;
        for (let i = 0; i < contactNumbers.length; i += batchSize) {
          const batch = contactNumbers.slice(i, i + batchSize);

          const contactSnapshot = await db
            .collection("users")
            .where("phoneNumber", "in", batch)
            .get();

          contactSnapshot.forEach((doc) => {
            if (!excludeIds.includes(doc.id)) {
              suggestions.push({
                id: doc.id,
                ...doc.data(),
                reason: "contact",
              });
              excludeIds.push(doc.id); // Prevent duplicates in other suggestion types
            }
          });
        }
      }

      // Get mutual friend suggestions
      const mutualSuggestions = await this.getMutualFriendSuggestions(
        userId,
        currentFriends,
      );
      
      // Filter out already found suggestions and add to exclude list
      const filteredMutualSuggestions = mutualSuggestions.filter(suggestion => {
        if (excludeIds.includes(suggestion.id)) {
          return false;
        }
        excludeIds.push(suggestion.id);
        return true;
      });
      
      suggestions.push(...filteredMutualSuggestions);

      // Get genre-based friend suggestions
      const genreSuggestions = await this.getGenreSimilarityFriendSuggestions(
        userId,
        excludeIds,
      );
      suggestions.push(...genreSuggestions);

      console.log('🤝 Friend suggestions summary:', {
        contactSuggestions: suggestions.filter(s => s.reason === "contact").length,
        mutualSuggestions: suggestions.filter(s => s.reason === "mutual_friend").length,
        genreSuggestions: suggestions.filter(s => s.reason === "gaming").length,
        total: suggestions.length
      });

      // Sort suggestions by priority and relevance
      const sortedSuggestions = this.prioritizeFriendSuggestions(suggestions);

      return sortedSuggestions.slice(0, 20);
    } catch (error) {
      console.error("❌ Get friend suggestions failed:", error);
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

      const friendDoc = await db
        .collection("users")
        .doc(userId1)
        .collection("friends")
        .doc(userId2)
        .get();

      return friendDoc.exists;
    } catch (error) {
      console.error("❌ Check friendship failed:", error);
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
        .collection("friendRequests")
        .where("fromUserId", "==", fromUserId)
        .where("toUserId", "==", toUserId)
        .where("status", "==", "pending")
        .get();

      if (requestSnapshot.empty) {
        return null;
      }

      const doc = requestSnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error("❌ Get friend request failed:", error);
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

      const friendsSnapshot = await db
        .collection("users")
        .doc(userId)
        .collection("friends")
        .get();

      return friendsSnapshot.docs.map((doc) => doc.id);
    } catch (error) {
      console.error("❌ Get friend IDs failed:", error);
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
      for (const friendId of currentFriends.slice(0, 10)) {
        // Limit to avoid too many queries
        const friendsFriendsSnapshot = await db
          .collection("users")
          .doc(friendId)
          .collection("friends")
          .get();

        const friendsFriends = friendsFriendsSnapshot.docs.map((doc) => doc.id);

        // Find potential suggestions (friends of friends)
        for (const potentialFriendId of friendsFriends) {
          if (!excludeIds.includes(potentialFriendId)) {
            // Get user data
            const userDoc = await db
              .collection("users")
              .doc(potentialFriendId)
              .get();

            if (userDoc.exists) {
              suggestions.push({
                id: potentialFriendId,
                ...userDoc.data(),
                reason: "mutual_friend",
                mutualFriendId: friendId,
              });

              excludeIds.push(potentialFriendId); // Avoid duplicates
            }
          }
        }
      }

      return suggestions.slice(0, 10); // Limit results
    } catch (error) {
      console.error("❌ Get mutual friend suggestions failed:", error);
      return [];
    }
  }

  /**
   * Get friend suggestions based on gaming genre similarities
   * @param {string} userId - User ID
   * @param {Array} excludeIds - User IDs to exclude from suggestions
   * @returns {Promise<Array>} Array of genre-based friend suggestions
   */
  async getGenreSimilarityFriendSuggestions(userId, excludeIds = []) {
    try {
      const db = this.getDB();
      const suggestions = [];

      // Get current user's gaming interests
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return [];
      }

      const userData = userDoc.data();
      const userGenres = userData.gamingInterests || [];

      // If user has no gaming interests, return empty suggestions
      if (userGenres.length === 0) {
        return [];
      }

      console.log('🎮 Finding genre-based suggestions for user:', { userId, userGenres });

      // Find users who have at least one shared gaming interest
      // We'll use array-contains-any to find users with any matching genre
      const usersQuery = await db
        .collection("users")
        .where("gamingInterests", "array-contains-any", userGenres)
        .limit(50) // Limit initial query for performance
        .get();

      console.log('🎮 Found potential users with shared genres:', usersQuery.size);

      // Calculate genre similarity for each user
      const candidates = [];
      usersQuery.forEach((doc) => {
        const candidateId = doc.id;
        const candidateData = doc.data();

        // Skip if user should be excluded
        if (excludeIds.includes(candidateId)) {
          return;
        }

        const candidateGenres = candidateData.gamingInterests || [];
        if (candidateGenres.length === 0) {
          return;
        }

        // Calculate shared genres and similarity score
        const sharedGenres = this.calculateSharedGenres(userGenres, candidateGenres);
        const similarityScore = this.calculateGenreSimilarity(userGenres, candidateGenres);

        // Only include users with meaningful similarity (at least 1 shared genre)
        if (sharedGenres.length > 0 && similarityScore > 0.1) {
          candidates.push({
            id: candidateId,
            ...candidateData,
            reason: "gaming",
            sharedGenres,
            similarityScore,
            sharedGenreCount: sharedGenres.length,
          });
        }
      });

      // Sort by similarity score (descending) and take top candidates
      candidates.sort((a, b) => {
        // Primary sort: similarity score
        if (b.similarityScore !== a.similarityScore) {
          return b.similarityScore - a.similarityScore;
        }
        // Secondary sort: number of shared genres
        return b.sharedGenreCount - a.sharedGenreCount;
      });

      console.log('🎮 Genre similarity candidates:', {
        totalCandidates: candidates.length,
        topScores: candidates.slice(0, 5).map(c => ({
          id: c.id,
          score: c.similarityScore,
          sharedGenres: c.sharedGenreCount
        }))
      });

      return candidates.slice(0, 10); // Return top 10 suggestions

    } catch (error) {
      console.error("❌ Get genre similarity friend suggestions failed:", error);
      return [];
    }
  }

  /**
   * Calculate shared gaming genres between two users
   * @param {Array} genres1 - First user's genres
   * @param {Array} genres2 - Second user's genres
   * @returns {Array} Array of shared genre IDs
   */
  calculateSharedGenres(genres1, genres2) {
    if (!genres1 || !genres2) {
      return [];
    }

    const set2 = new Set(genres2.map(g => g.toLowerCase()));
    return genres1.filter(genre => set2.has(genre.toLowerCase()));
  }

  /**
   * Calculate genre similarity score between two users
   * Uses Jaccard similarity coefficient: |intersection| / |union|
   * @param {Array} genres1 - First user's genres
   * @param {Array} genres2 - Second user's genres
   * @returns {number} Similarity score between 0 and 1
   */
  calculateGenreSimilarity(genres1, genres2) {
    if (!genres1 || !genres2 || genres1.length === 0 || genres2.length === 0) {
      return 0;
    }

    // Convert to lowercase for case-insensitive comparison
    const set1 = new Set(genres1.map(g => g.toLowerCase()));
    const set2 = new Set(genres2.map(g => g.toLowerCase()));

    // Calculate intersection (shared genres)
    const intersection = new Set([...set1].filter(x => set2.has(x)));

    // Calculate union (all unique genres)
    const union = new Set([...set1, ...set2]);

    // Jaccard similarity: |intersection| / |union|
    const similarity = intersection.size / union.size;

    return similarity;
  }

  /**
   * Prioritize and sort friend suggestions by relevance and priority
   * @param {Array} suggestions - Array of friend suggestions
   * @returns {Array} Sorted array of suggestions
   */
  prioritizeFriendSuggestions(suggestions) {
    return suggestions.sort((a, b) => {
      // Priority order: contact > mutual_friend > gaming
      const priorityOrder = { contact: 3, mutual_friend: 2, gaming: 1 };
      
      const aPriority = priorityOrder[a.reason] || 0;
      const bPriority = priorityOrder[b.reason] || 0;

      // First sort by reason priority
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      // Within same reason category, sort by specific metrics
      if (a.reason === "gaming" && b.reason === "gaming") {
        // For gaming suggestions, prioritize by similarity score
        const aScore = a.similarityScore || 0;
        const bScore = b.similarityScore || 0;
        if (aScore !== bScore) {
          return bScore - aScore;
        }
        // Then by number of shared genres
        const aSharedCount = a.sharedGenreCount || 0;
        const bSharedCount = b.sharedGenreCount || 0;
        return bSharedCount - aSharedCount;
      }

      // For other suggestion types, could add additional sorting logic here
      // For now, maintain existing order within the same reason category
      return 0;
    });
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
      const { firebase } = require("../../config/firebase");

      const notificationData = {
        userId: recipientId,
        type: "friend_request",
        senderId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false,
      };

      await db.collection("notifications").add(notificationData);

    } catch (error) {
      console.error("❌ Send friend request notification failed:", error);
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
      const { firebase } = require("../../config/firebase");

      const notificationData = {
        userId: recipientId,
        type: "friend_accepted",
        accepterId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false,
      };

      await db.collection("notifications").add(notificationData);

    } catch (error) {
      console.error("❌ Send friend accepted notification failed:", error);
    }
  }

  /**
   * Get mutual friends count between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<number>} Number of mutual friends
   */
  async getMutualFriendsCount(userId1, userId2) {
    try {
      // Get friends of both users
      const [user1Friends, user2Friends] = await Promise.all([
        this.getFriendIds(userId1),
        this.getFriendIds(userId2),
      ]);

      // Find intersection (mutual friends)
      const mutualFriends = user1Friends.filter((friendId) =>
        user2Friends.includes(friendId),
      );

      return mutualFriends.length;
    } catch (error) {
      console.error("❌ Get mutual friends count failed:", error);
      return 0;
    }
  }

  /**
   * Get mutual friends list between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<Array>} Array of mutual friends with user data
   */
  async getMutualFriends(userId1, userId2) {
    try {
      const db = this.getDB();
      const { firebase } = require("../../config/firebase");

      // Get friends of both users
      const [user1Friends, user2Friends] = await Promise.all([
        this.getFriendIds(userId1),
        this.getFriendIds(userId2),
      ]);

      // Find intersection (mutual friends)
      const mutualFriendIds = user1Friends.filter((friendId) =>
        user2Friends.includes(friendId),
      );

      if (mutualFriendIds.length === 0) {
        return [];
      }

      // Get user data for mutual friends
      const mutualFriends = [];
      const batchSize = 10;

      for (let i = 0; i < mutualFriendIds.length; i += batchSize) {
        const batch = mutualFriendIds.slice(i, i + batchSize);

        const usersSnapshot = await db
          .collection("users")
          .where(firebase.firestore.FieldPath.documentId(), "in", batch)
          .get();

        usersSnapshot.forEach((doc) => {
          mutualFriends.push({ id: doc.id, ...doc.data() });
        });
      }

      return mutualFriends;
    } catch (error) {
      console.error("❌ Get mutual friends failed:", error);
      return [];
    }
  }

  /**
   * Get mutual friends count for multiple users (batch operation for performance)
   * @param {string} currentUserId - Current user ID
   * @param {Array} userIds - Array of user IDs to calculate mutual friends for
   * @returns {Promise<Object>} Object with userId as key and mutual friends count as value
   */
  async getBatchMutualFriendsCount(currentUserId, userIds) {
    try {
      if (!userIds || userIds.length === 0) {
        return {};
      }

      // Get current user's friends once
      const currentUserFriends = await this.getFriendIds(currentUserId);

      // Get all other users' friends in parallel
      const otherUsersFriends = await Promise.all(
        userIds.map((userId) => this.getFriendIds(userId)),
      );

      // Calculate mutual friends count for each user
      const results = {};
      userIds.forEach((userId, index) => {
        const otherUserFriends = otherUsersFriends[index];
        const mutualFriends = currentUserFriends.filter((friendId) =>
          otherUserFriends.includes(friendId),
        );
        results[userId] = mutualFriends.length;
      });

      return results;
    } catch (error) {
      console.error("❌ Get batch mutual friends count failed:", error);
      return {};
    }
  }

  /**
   * Get user stats (snaps sent/received, streaks, etc.)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User stats object
   */
  async getUserStats(userId) {
    try {
      const db = this.getDB();

      // Get user stats document - handle gracefully if collection doesn't exist
      const statsDoc = await db.collection("userStats").doc(userId).get();

      if (statsDoc.exists) {
        return statsDoc.data();
      } else {
        // Return default stats if document doesn't exist
        return {
          snapsSent: 0,
          snapsReceived: 0,
          streaks: 0,
          storiesShared: 0,
          totalFriends: 0,
          joinedDate: new Date(),
          lastActive: new Date(),
        };
      }
    } catch (error) {
      console.warn("⚠️ Get user stats failed (using defaults):", error.message);
      // Return default stats instead of throwing - this prevents the entire profile load from failing
      return {
        snapsSent: 0,
        snapsReceived: 0,
        streaks: 0,
        storiesShared: 0,
        totalFriends: 0,
        joinedDate: new Date(),
        lastActive: new Date(),
      };
    }
  }

  /**
   * Update user stats
   * @param {string} userId - User ID
   * @param {Object} updates - Stats updates
   * @returns {Promise<void>}
   */
  async updateUserStats(userId, updates) {
    try {
      const db = this.getDB();
      const { firebase } = require("../../config/firebase");

      await db
        .collection("userStats")
        .doc(userId)
        .set(
          {
            ...updates,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );


    } catch (error) {
      console.error("❌ Update user stats failed:", error);
      throw error;
    }
  }

  /**
   * Get user presence status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Presence object with status and lastActive
   */
  async getUserPresence(userId) {
    try {
      const db = this.getDB();

      const presenceDoc = await db.collection("presence").doc(userId).get();

      if (presenceDoc.exists) {
        const data = presenceDoc.data();
        return {
          status: data.status || "offline",
          lastActive: data.lastActive?.toDate() || new Date(),
          isOnline: data.status === "online",
        };
      } else {
        return {
          status: "offline",
          lastActive: new Date(),
          isOnline: false,
        };
      }
    } catch (error) {
      console.warn(
        "⚠️ Get user presence failed (using defaults):",
        error.message,
      );
      // Return default presence instead of throwing
      return {
        status: "offline",
        lastActive: new Date(),
        isOnline: false,
      };
    }
  }

  /**
   * Get batch presence for multiple users
   * @param {Array} userIds - Array of user IDs
   * @returns {Promise<Object>} Object with userId as key and presence as value
   */
  async getBatchUserPresence(userIds) {
    try {
      if (!userIds || userIds.length === 0) {
        return {};
      }

      const db = this.getDB();
      const { firebase } = require("../../config/firebase");
      const results = {};

      // Batch get presence documents
      const batchSize = 10;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);

        const presenceSnapshot = await db
          .collection("presence")
          .where(firebase.firestore.FieldPath.documentId(), "in", batch)
          .get();

        // Process found presence data
        presenceSnapshot.forEach((doc) => {
          const data = doc.data();
          results[doc.id] = {
            status: data.status || "offline",
            lastActive: data.lastActive?.toDate() || new Date(),
            isOnline: data.status === "online",
          };
        });

        // Set default for users not found
        batch.forEach((userId) => {
          if (!results[userId]) {
            results[userId] = {
              status: "offline",
              lastActive: new Date(),
              isOnline: false,
            };
          }
        });
      }

      return results;
    } catch (error) {
      console.error("❌ Get batch user presence failed:", error);
      return {};
    }
  }

  /**
   * Get complete user profile by ID (for friend profile viewing)
   * @param {string} userId - User ID to get profile for
   * @returns {Promise<Object|null>} Complete user profile or null if not found
   */
  async getUserProfile(userId) {
    try {
      const db = this.getDB();

      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        console.warn("⚠️ User profile not found:", userId);
        return null;
      }

      return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
      console.error("❌ Get user profile failed:", error);
      return null;
    }
  }

  /**
   * Check specific friendship status between two users
   * @param {string} currentUserId - Current user ID
   * @param {string} targetUserId - Target user ID to check friendship with
   * @returns {Promise<string>} Friendship status: 'friends', 'pending_sent', 'pending_received', 'none'
   */
  async checkFriendshipStatus(currentUserId, targetUserId) {
    try {
      const db = this.getDB();

      // Check if they're friends first (most common case)
      const isFriend = await this.areFriends(currentUserId, targetUserId);
      if (isFriend) {
        return "friends";
      }

      // Check for pending friend requests
      const [sentRequest, receivedRequest] = await Promise.all([
        // Check if current user sent a request to target user
        db
          .collection("friendRequests")
          .where("fromUserId", "==", currentUserId)
          .where("toUserId", "==", targetUserId)
          .where("status", "==", "pending")
          .get(),
        // Check if current user received a request from target user
        db
          .collection("friendRequests")
          .where("fromUserId", "==", targetUserId)
          .where("toUserId", "==", currentUserId)
          .where("status", "==", "pending")
          .get(),
      ]);

      if (!sentRequest.empty) {
        return "pending_sent";
      }

      if (!receivedRequest.empty) {
        return "pending_received";
      }

      return "none";
    } catch (error) {
      console.error("❌ Check friendship status failed:", error);
      return "none";
    }
  }

  /**
   * Get enriched user profile with stats, presence, and friendship data
   * @param {string} currentUserId - Current user ID (for calculating mutual friends)
   * @param {string} targetUserId - Target user ID to get profile for
   * @returns {Promise<Object|null>} Enriched user profile or null
   */
  async getEnrichedUserProfile(currentUserId, targetUserId) {
    try {
      // Get basic profile data
      const userProfile = await this.getUserProfile(targetUserId);
      if (!userProfile) {
        return null;
      }

      // Get additional data in parallel for better performance
      const [
        friendIds,
        userStats,
        userPresence,
        mutualFriendsCount,
        friendshipStatus,
      ] = await Promise.all([
        this.getFriendIds(targetUserId),
        this.getUserStats(targetUserId),
        this.getUserPresence(targetUserId),
        currentUserId !== targetUserId
          ? this.getMutualFriendsCount(currentUserId, targetUserId)
          : Promise.resolve(0),
        currentUserId !== targetUserId
          ? this.checkFriendshipStatus(currentUserId, targetUserId)
          : Promise.resolve("self"),
      ]);

      // Helper function to safely convert dates
      const safeToDate = (dateValue) => {
        if (!dateValue) return new Date();
        if (dateValue instanceof Date) return dateValue;
        if (dateValue && typeof dateValue.toDate === "function")
          return dateValue.toDate();
        if (typeof dateValue === "number") return new Date(dateValue);
        if (typeof dateValue === "string") {
          const parsed = new Date(dateValue);
          return isNaN(parsed.getTime()) ? new Date() : parsed;
        }
        return new Date();
      };

      // Combine all data into enriched profile
      return {
        ...userProfile,
        totalFriends: friendIds.length,
        snapsSent: userStats.snapsSent || 0,
        snapsReceived: userStats.snapsReceived || 0,
        streaks: userStats.streaks || 0,
        storiesShared: userStats.storiesShared || 0,
        joinedDate:
          safeToDate(userProfile.createdAt) || safeToDate(userStats.joinedDate),
        lastActive: userPresence.lastActive,
        isOnline: userPresence.isOnline,
        status: userPresence.status,
        mutualFriends: mutualFriendsCount,
        friendshipStatus: friendshipStatus,
      };
    } catch (error) {
      console.error("❌ Get enriched user profile failed:", error);
      return null;
    }
  }
}

export const friendsService = new FriendsService();
export default friendsService;

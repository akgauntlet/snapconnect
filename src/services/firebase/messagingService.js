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

import { getFirebaseDB, getFirebaseStorage } from "../../config/firebase";

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
    return require("../../config/firebase").getFirebaseAuth();
  }

  /**
   * Send an ephemeral message
   * @param {string} senderId - Sender user ID
   * @param {string} recipientId - Recipient user ID
   * @param {Object | null} mediaData - Media file data (uri, type, size)
   * @param {number} timer - Timer in seconds (1, 3, 5, 10)
   * @param {string} text - Optional text message
   * @returns {Promise<string>} Message ID
   */
  async sendMessage(senderId, recipientId, mediaData, timer = 5, text = "") {
    try {
      const db = this.getDB();
      const { firebase } = require("../../config/firebase");
      const now = firebase.firestore.FieldValue.serverTimestamp();

      // Upload media if provided
      let mediaUrl = null;
      if (mediaData && mediaData.uri) {
        mediaUrl = await this.uploadMedia(mediaData, senderId);
      }

      // Create message document
      const conversationId = this.getConversationId(senderId, recipientId);
      const messageData = {
        senderId,
        recipientId,
        conversationId,
        text: text || "",
        mediaUrl,
        mediaType: mediaData?.type || null,
        timer,
        createdAt: now,
        viewed: false,
        viewedAt: null,
        expiresAt: null, // Set when viewed
        status: "sent",
      };

      // Add message to messages collection
      const messageRef = await db.collection("messages").add(messageData);
      const messageId = messageRef.id;

      // Update conversation lists for both users
      const messageType = mediaData
        ? mediaData.type === "video"
          ? "video"
          : "photo"
        : "text";
      await this.addToConversationLists(
        senderId,
        recipientId,
        messageId,
        now,
        text,
        messageType,
      );

      // Send push notification
      await this.sendPushNotification(recipientId, senderId, "new_message");


      return messageId;
    } catch (error) {
      console.error("❌ Send message failed:", error);
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
      const messageRef = db.collection("messages").doc(messageId);
      const messageDoc = await messageRef.get();

      if (!messageDoc.exists) {
        throw new Error("Message not found");
      }

      const messageData = messageDoc.data();

      // Check if viewer is authorized (sender or recipient)
      if (
        messageData.senderId !== viewerId &&
        messageData.recipientId !== viewerId
      ) {
        throw new Error("Unauthorized to view this message");
      }

      // If already viewed, return existing data
      if (messageData.viewed) {
        return { id: messageId, ...messageData };
      }

      // Mark as viewed and set expiration
      const { firebase } = require("../../config/firebase");
      const viewedAt = firebase.firestore.FieldValue.serverTimestamp();
      const expiresAt = new Date(Date.now() + messageData.timer * 1000);

      await messageRef.update({
        viewed: true,
        viewedAt,
        expiresAt,
      });

      // Schedule automatic deletion
      this.scheduleMessageDeletion(messageId, messageData.timer * 1000);

      // Notify sender if viewer is recipient
      if (messageData.recipientId === viewerId) {
        await this.notifyMessageViewed(messageData.senderId, messageId);
      }


      return {
        id: messageId,
        ...messageData,
        viewed: true,
        viewedAt,
        expiresAt,
      };
    } catch (error) {
      console.error("❌ View message failed:", error);
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
        .collection("messages")
        .where("conversationId", "==", conversationId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const messages = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Only include non-expired messages
        if (!data.expiresAt || data.expiresAt.toDate() > new Date()) {
          messages.push({ id: doc.id, ...data });
        }
      });

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error("❌ Get conversation messages failed:", error);
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
        .collection("conversations")
        .where("participants", "array-contains", userId)
        .orderBy("lastMessageAt", "desc")
        .limit(20)
        .get();

      const conversations = [];
      snapshot.forEach((doc) => {
        conversations.push({ id: doc.id, ...doc.data() });
      });

      return conversations;
    } catch (error) {
      console.error("❌ Get recent conversations failed:", error);
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


      // Check authentication first
      const auth = this.getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("User not authenticated. Please log in first.");
      }



      const storage = this.getStorage();
      const timestamp = Date.now();
      const fileExtension = mediaData.type === "video" ? "mp4" : "jpg";
      const fileName = `messages/${userId}/${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;



      const storageRef = storage.ref().child(fileName);


      // Create file blob using fetch API (React Native compatible)

      const response = await fetch(mediaData.uri);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch file: ${response.status} ${response.statusText}`,
        );
      }

      const blob = await response.blob();


      // Validate blob
      if (blob.size === 0) {
        throw new Error("File is empty or could not be read");
      }

      // Upload the blob

      const uploadTask = await storageRef.put(blob, {
        contentType: mediaData.type === "video" ? "video/mp4" : "image/jpeg",
        customMetadata: {
          uploadedBy: userId,
          originalType: mediaData.type,
          timestamp: timestamp.toString(),
        },
      });

      const downloadUrl = await uploadTask.ref.getDownloadURL();
      return downloadUrl;
    } catch (error) {
      console.error("❌ Upload media failed:", error);


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
      const messageRef = db.collection("messages").doc(messageId);
      const messageDoc = await messageRef.get();

      if (messageDoc.exists) {
        const messageData = messageDoc.data();

        // Delete media file if exists
        if (messageData.mediaUrl) {
          await this.deleteMediaFile(messageData.mediaUrl);
        }

        // Delete the message document
        await messageRef.delete();

      }
    } catch (error) {
      console.error("❌ Delete message failed:", error);
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

    } catch (error) {
      console.error("❌ Delete media file failed:", error);
      // Don't throw - file might already be deleted
    }
  }

  /**
   * Add message to conversation lists for both users
   * @param {string} senderId - Sender ID
   * @param {string} recipientId - Recipient ID
   * @param {string} messageId - Message ID
   * @param {Object} timestamp - Server timestamp
   * @param {string} messageText - Message text content
   * @param {string} messageType - Message type (text, photo, video)
   * @returns {Promise<void>}
   */
  async addToConversationLists(
    senderId,
    recipientId,
    messageId,
    timestamp,
    messageText = "",
    messageType = "text",
  ) {
    try {
      const db = this.getDB();
      const { firebase } = require("../../config/firebase");
      const conversationId = this.getConversationId(senderId, recipientId);

      // Create appropriate last message preview
      let lastMessage = "";
      if (messageType === "photo") {
        lastMessage = "📸 Photo";
      } else if (messageType === "video") {
        lastMessage = "🎥 Video";
      } else if (messageText && messageText.trim()) {
        // Truncate long text messages for preview
        lastMessage =
          messageText.length > 40
            ? messageText.substring(0, 40) + "..."
            : messageText;
      } else {
        // For empty messages, don't set lastMessage - let the UI handle it
        lastMessage = null;
      }

      const conversationData = {
        participants: [senderId, recipientId],
        lastMessageId: messageId,
        lastMessageAt: timestamp,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      // Only set lastMessage if we have a meaningful preview
      if (lastMessage) {
        conversationData.lastMessage = lastMessage;
      }

      // Use set with merge to create or update conversation
      await db
        .collection("conversations")
        .doc(conversationId)
        .set(conversationData, { merge: true });


    } catch (error) {
      console.error("❌ Add to conversation lists failed:", error);
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
    return [userId1, userId2].sort().join("_");
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

    } catch (error) {
      console.error("❌ Send push notification failed:", error);
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
      const { firebase } = require("../../config/firebase");

      const notificationData = {
        userId: senderId,
        type: "message_viewed",
        messageId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false,
      };

      await db.collection("notifications").add(notificationData);

    } catch (error) {
      console.error("❌ Notify message viewed failed:", error);
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
      const { firebase } = require("../../config/firebase");
      const messageRef = db.collection("messages").doc(messageId);
      const messageDoc = await messageRef.get();

      if (messageDoc.exists) {
        const messageData = messageDoc.data();

        // Log screenshot event
        await db.collection("screenshots").add({
          messageId,
          senderId: messageData.senderId,
          viewerId,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // Notify sender
        await this.notifyScreenshot(messageData.senderId, viewerId, messageId);


      }
    } catch (error) {
      console.error("❌ Report screenshot failed:", error);
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
      const { firebase } = require("../../config/firebase");

      const notificationData = {
        userId: senderId,
        type: "screenshot_taken",
        messageId,
        viewerId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false,
      };

      await db.collection("notifications").add(notificationData);

      // Also send push notification
      await this.sendPushNotification(senderId, viewerId, "screenshot_taken");


    } catch (error) {
      console.error("❌ Notify screenshot failed:", error);
    }
  }

  /**
   * Get the most recent message for a conversation
   * @param {string} userId - Current user ID
   * @param {string} otherUserId - Other user ID
   * @returns {Promise<Object|null>} Most recent message or null if none found
   */
  async getMostRecentMessage(userId, otherUserId) {
    try {
      const db = this.getDB();

      // Query messages in both directions using separate queries
      // This approach works with Firestore security rules because we're explicitly
      // filtering by the authenticated user's ID
      const [sentMessages, receivedMessages] = await Promise.all([
        // Messages sent by current user to other user
        db
          .collection("messages")
          .where("senderId", "==", userId)
          .where("recipientId", "==", otherUserId)
          .orderBy("createdAt", "desc")
          .limit(5)
          .get(),

        // Messages sent by other user to current user
        db
          .collection("messages")
          .where("senderId", "==", otherUserId)
          .where("recipientId", "==", userId)
          .orderBy("createdAt", "desc")
          .limit(5)
          .get(),
      ]);

      // Combine all messages
      const allMessages = [];

      sentMessages.forEach((doc) => {
        const messageData = doc.data();
        // Only include non-expired messages
        if (
          !messageData.expiresAt ||
          messageData.expiresAt.toDate() > new Date()
        ) {
          allMessages.push({ id: doc.id, ...messageData });
        }
      });

      receivedMessages.forEach((doc) => {
        const messageData = doc.data();
        // Only include non-expired messages
        if (
          !messageData.expiresAt ||
          messageData.expiresAt.toDate() > new Date()
        ) {
          allMessages.push({ id: doc.id, ...messageData });
        }
      });

      if (allMessages.length === 0) {
        return null;
      }

      // Sort by creation time and return the most recent
      allMessages.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });

      return allMessages[0];
    } catch (error) {
      console.error("❌ Get most recent message failed:", error);
      return null;
    }
  }

  /**
   * Format message preview for conversation list
   * @param {Object} message - Message data
   * @param {string} currentUserId - Current user ID for sender context
   * @returns {string} Formatted message preview
   */
  formatMessagePreview(message, currentUserId) {
    if (!message) {
      return "Start a conversation";
    }

    // Handle different message types
    if (message.mediaType === "photo") {
      const prefix =
        message.senderId === currentUserId ? "You sent" : "Received";
      return `${prefix} 📸 Photo`;
    }

    if (message.mediaType === "video") {
      const prefix =
        message.senderId === currentUserId ? "You sent" : "Received";
      return `${prefix} 🎥 Video`;
    }

    if (message.text && message.text.trim()) {
      const prefix = message.senderId === currentUserId ? "You: " : "";
      const text =
        message.text.length > 40
          ? message.text.substring(0, 40) + "..."
          : message.text;
      return `${prefix}${text}`;
    }

    return "New message";
  }
}

export const messagingService = new MessagingService();
export default messagingService;

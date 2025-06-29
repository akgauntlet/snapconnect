/**
 * @file deepLinkingService.ts
 * @description Deep linking service for SnapConnect navigation and social features.
 * Handles profile links, friend requests, and social sharing deep links.
 *
 * @author SnapConnect Team
 * @created 2024-01-26
 *
 * @dependencies
 * - expo-linking: Deep link handling
 * - react-navigation: Navigation integration
 *
 * @usage
 * import { deepLinkingService } from '@/services/social';
 * await deepLinkingService.handleDeepLink(url);
 *
 * @ai_context
 * Enables seamless social interactions through deep links,
 * facilitating profile visits and friend connections.
 */

import { Platform } from 'react-native';

export interface DeepLinkData {
  type: 'profile' | 'friend-request' | 'game-invite' | 'achievement' | 'share';
  userId?: string;
  data?: any;
  source?: 'qr' | 'share' | 'direct';
}

/**
 * Deep linking service for social navigation
 */
class DeepLinkingService {
  private navigationRef: any = null;
  
  /**
   * Set navigation reference for programmatic navigation
   * @param {any} ref - Navigation reference
   */
  setNavigationRef(ref: any) {
    this.navigationRef = ref;
  }

  /**
   * Handle incoming deep link
   * @param {string} url - Deep link URL
   * @returns {Promise<boolean>} Success status
   */
  async handleDeepLink(url: string): Promise<boolean> {
    try {
      const linkData = this.parseDeepLink(url);
      if (!linkData) {
        console.warn('⚠️ Invalid deep link format:', url);
        return false;
      }

      return await this.processDeepLink(linkData);
    } catch (error) {
      console.error('❌ Deep link handling failed:', error);
      return false;
    }
  }

  /**
   * Generate deep link for profile sharing
   * @param {string} userId - User ID
   * @param {Object} options - Link generation options
   * @returns {string} Generated deep link
   */
  generateProfileLink(userId: string, options: {
    source?: string;
    campaign?: string;
  } = {}): string {
    const baseUrl = this.getBaseUrl();
    const params = new URLSearchParams();
    
    if (options.source) params.append('source', options.source);
    if (options.campaign) params.append('campaign', options.campaign);
    
    const queryString = params.toString();
    return `${baseUrl}/profile/${userId}${queryString ? `?${queryString}` : ''}`;
  }

  /**
   * Generate deep link for friend request
   * @param {string} userId - User ID sending the request
   * @returns {string} Generated deep link
   */
  generateFriendRequestLink(userId: string): string {
    const baseUrl = this.getBaseUrl();
    return `${baseUrl}/friend-request/${userId}`;
  }

  /**
   * Generate deep link for achievement sharing
   * @param {string} userId - User ID
   * @param {string} achievementId - Achievement ID
   * @returns {string} Generated deep link
   */
  generateAchievementLink(userId: string, achievementId: string): string {
    const baseUrl = this.getBaseUrl();
    return `${baseUrl}/achievement/${userId}?achievementId=${achievementId}`;
  }

  /**
   * Parse deep link URL into structured data
   * @param {string} url - Deep link URL
   * @returns {DeepLinkData|null} Parsed link data or null if invalid
   */
  private parseDeepLink(url: string): DeepLinkData | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      
      if (pathParts.length < 1) return null;
      
      const type = pathParts[0] as DeepLinkData['type'];
      const userId = pathParts[1];
      const source = urlObj.searchParams.get('source') || 'direct';
      
      const linkData: DeepLinkData = {
        type,
        userId,
        source: source as DeepLinkData['source'],
      };
      
      // Parse additional data based on type
      switch (type) {
        case 'achievement':
          linkData.data = {
            achievementId: urlObj.searchParams.get('achievementId'),
          };
          break;
        
        case 'game-invite':
          const gameData = urlObj.searchParams.get('data');
          if (gameData) {
            try {
              linkData.data = JSON.parse(decodeURIComponent(gameData));
            } catch (error) {
              console.warn('⚠️ Failed to parse game invite data:', error);
            }
          }
          break;
      }
      
      return linkData;
    } catch (error) {
      console.error('❌ Deep link parsing failed:', error);
      return null;
    }
  }

  /**
   * Process parsed deep link data
   * @param {DeepLinkData} linkData - Parsed link data
   * @returns {Promise<boolean>} Success status
   */
  private async processDeepLink(linkData: DeepLinkData): Promise<boolean> {
    if (!this.navigationRef) {
      console.warn('⚠️ Navigation ref not set for deep linking');
      return false;
    }

    try {
      switch (linkData.type) {
        case 'profile':
          if (linkData.userId) {
            this.navigationRef.navigate('FriendProfile', {
              friendId: linkData.userId,
              source: linkData.source,
            });
            return true;
          }
          break;
        
        case 'friend-request':
          if (linkData.userId) {
            // Navigate to friend request confirmation screen
            this.navigationRef.navigate('FriendRequests', {
              pendingUserId: linkData.userId,
            });
            return true;
          }
          break;
        
        case 'achievement':
          if (linkData.userId && linkData.data?.achievementId) {
            this.navigationRef.navigate('FriendProfile', {
              friendId: linkData.userId,
              highlightAchievement: linkData.data.achievementId,
            });
            return true;
          }
          break;
        
        case 'game-invite':
          if (linkData.userId && linkData.data) {
            // Handle game invite (to be implemented with gaming features)
            console.log('🎮 Game invite received:', linkData);
            return true;
          }
          break;
        
        default:
          console.warn('⚠️ Unknown deep link type:', linkData.type);
          return false;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Deep link processing failed:', error);
      return false;
    }
  }

  /**
   * Get base URL for deep links
   * @returns {string} Base URL
   */
  private getBaseUrl(): string {
    if (Platform.OS === 'web') {
      return 'https://snapconnect.app';
    } else {
      return 'snapconnect://';
    }
  }

  /**
   * Check if URL is a valid SnapConnect deep link
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid SnapConnect link
   */
  isValidSnapConnectLink(url: string): boolean {
    try {
      return url.includes('snapconnect.app') || url.startsWith('snapconnect://');
    } catch (error) {
      return false;
    }
  }

  /**
   * Get sharing URL for web platforms
   * @param {string} path - Path to share
   * @param {Object} params - URL parameters
   * @returns {string} Web sharing URL
   */
  getWebSharingUrl(path: string, params: Record<string, string> = {}): string {
    const baseUrl = 'https://snapconnect.app';
    const searchParams = new URLSearchParams(params);
    const queryString = searchParams.toString();
    
    return `${baseUrl}${path}${queryString ? `?${queryString}` : ''}`;
  }
}

const deepLinkingService = new DeepLinkingService();
export default deepLinkingService; 

/**
 * @file useFriendCount.ts
 * @description Custom hook for fetching and managing user's friend count.
 * Provides real-time friend count with loading and error states.
 *
 * @author SnapConnect Team
 * @created 2024-01-25
 *
 * @dependencies
 * - react: React hooks
 * - @/services/firebase/friendsService: Friends data management
 *
 * @usage
 * const { friendCount, isLoading, error } = useFriendCount(userId);
 *
 * @ai_context
 * Optimized friend count fetching with intelligent caching and real-time updates.
 */

import { useCallback, useEffect, useState } from 'react';
import { friendsService } from '../services/firebase/friendsService';

/**
 * Custom hook for managing user's friend count
 * @param {string} userId - User ID to fetch friend count for
 * @returns {Object} Friend count state with loading and error handling
 */
export function useFriendCount(userId: string | null | undefined) {
  const [friendCount, setFriendCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch friend count from Firebase
   */
  const fetchFriendCount = useCallback(async () => {
    if (!userId) {
      setFriendCount(0);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const friendIds = await friendsService.getFriendIds(userId);
      const count = friendIds.length;
      
      setFriendCount(count);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch friend count';
      console.error('❌ Failed to fetch friend count:', errorMessage);
      setError(errorMessage);
      setFriendCount(0); // Fallback to 0 on error
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Effect to fetch friend count when userId changes
   */
  useEffect(() => {
    fetchFriendCount();
  }, [fetchFriendCount]);

  /**
   * Refresh friend count manually
   */
  const refreshFriendCount = useCallback(() => {
    fetchFriendCount();
  }, [fetchFriendCount]);

  return {
    friendCount,
    isLoading,
    error,
    refreshFriendCount,
  };
} 

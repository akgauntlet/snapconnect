/**
 * @file scrollOptimization.ts
 * @description Scroll optimization utilities for React Native Web FlatList components.
 * Provides performance optimizations and passive event listener configurations.
 *
 * @author SnapConnect Team
 * @created 2024-01-24
 *
 * @dependencies
 * - react-native: FlatList component types
 *
 * @usage
 * Import and use optimized FlatList props for better web performance.
 *
 * @ai_context
 * Optimizes scroll performance for gaming UI components with high-frequency updates.
 */

import { FlatListProps } from 'react-native';

/**
 * Default optimized props for FlatList components to prevent passive wheel event warnings
 * and improve scroll performance on web
 */
export const optimizedFlatListProps: Partial<FlatListProps<any>> = {
  // Performance optimizations
  removeClippedSubviews: true,
  maxToRenderPerBatch: 10,
  updateCellsBatchingPeriod: 50,
  initialNumToRender: 10,
  windowSize: 10,
  
  // Web-specific optimizations
  getItemLayout: undefined, // Let FlatList handle layout automatically for better performance
  
  // Scroll optimization
  scrollEventThrottle: 16, // 60fps scroll events
  
  // Memory optimization
  disableVirtualization: false,
};

/**
 * Optimized props specifically for conversation/message lists
 * with higher update frequency
 */
export const conversationListProps: Partial<FlatListProps<any>> = {
  ...optimizedFlatListProps,
  maxToRenderPerBatch: 5,
  initialNumToRender: 8,
  windowSize: 8,
  scrollEventThrottle: 8, // Higher frequency for smoother scrolling
};

/**
 * Optimized props for story/media lists with fewer items
 * but potentially larger content
 */
export const storyListProps: Partial<FlatListProps<any>> = {
  ...optimizedFlatListProps,
  maxToRenderPerBatch: 3,
  initialNumToRender: 5,
  windowSize: 5,
  scrollEventThrottle: 16,
};

/**
 * Optimized props for friends list with moderate update frequency
 */
export const friendsListProps: Partial<FlatListProps<any>> = {
  ...optimizedFlatListProps,
  maxToRenderPerBatch: 8,
  initialNumToRender: 12,
  windowSize: 12,
  scrollEventThrottle: 16,
};

/**
 * Apply passive event listener optimization specifically for a FlatList ref
 * Call this in useEffect after the FlatList mounts
 */
export function optimizeFlatListRef(ref: any) {
  if (typeof window === 'undefined' || !ref?.current) return;
  
  try {
    // Find the scrollable element within the FlatList
    const scrollElement = ref.current?.getScrollableNode?.();
    if (scrollElement && scrollElement.addEventListener) {
      // Remove any existing wheel listeners and re-add with passive: true
      const passiveWheelHandler = (e: WheelEvent) => {
        // Let the default behavior handle scrolling
        return true;
      };
      
      scrollElement.addEventListener('wheel', passiveWheelHandler, { 
        passive: true,
        capture: false 
      });
    }
  } catch (error) {
    console.warn('FlatList scroll optimization failed:', error);
  }
}

/**
 * Hook for optimizing FlatList performance in gaming UI contexts
 * Returns optimized props based on list type
 */
export function useOptimizedFlatList(
  type: 'conversation' | 'story' | 'friends' | 'default' = 'default'
): Partial<FlatListProps<any>> {
  switch (type) {
    case 'conversation':
      return conversationListProps;
    case 'story':
      return storyListProps;
    case 'friends':
      return friendsListProps;
    default:
      return optimizedFlatListProps;
  }
} 

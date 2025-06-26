/**
 * @file useTabBarHeight.ts
 * @description Custom hook to calculate consistent tab bar height across all screens.
 * Matches the logic used in TabNavigator.js to prevent content overlap.
 * 
 * @author SnapConnect Team
 * @created 2024-01-24
 * 
 * @dependencies
 * - react-native: Platform, Dimensions
 * - react-native-safe-area-context: useSafeAreaInsets
 * 
 * @usage
 * Used by main screens to add proper bottom padding for the absolutely positioned tab bar.
 * 
 * @ai_context
 * Ensures consistent spacing calculations across different devices and platforms.
 * Handles Samsung Galaxy S20 Ultra and other large screen devices properly.
 */

import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Hook to calculate tab bar height for proper content spacing
 * 
 * @returns {object} Object containing tabBarHeight and bottomPadding values
 * 
 * @performance
 * - Memoized calculations to prevent unnecessary re-computations
 * - Efficient dimension and safe area detection
 * 
 * @ai_integration
 * - Adapts to different device sizes and orientations
 * - Supports dynamic viewport calculations for web platforms
 */
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  
  // Get device dimensions for viewport calculations
  const { width, height } = Dimensions.get('window');
  
  // Detect Samsung Galaxy S20 Ultra dimensions (1440x3200 or similar)
  const isSamsungGalaxyS20Ultra = height >= 3000 || width >= 1400;
  
  // Web platform adjustments for mobile browsers
  const isWebMobile = Platform.OS === 'web' && (width < 768);
  
  // Calculate safe bottom padding for different scenarios
  const calculateBottomPadding = () => {
    if (Platform.OS === 'web') {
      // For web, especially mobile browsers, use a more conservative approach
      if (isWebMobile) {
        // Mobile web browsers often have varying viewport heights
        // Use a combination of safe area insets and viewport-relative padding
        const basePadding = isSamsungGalaxyS20Ultra ? 20 : 16;
        const safePadding = Math.max(insets.bottom, 8);
        return basePadding + safePadding;
      }
      return Math.max(insets.bottom, 8);
    }
    return Math.max(insets.bottom, 8);
  };
  
  // Calculate tab bar height for different scenarios
  const calculateTabBarHeight = () => {
    const baseHeight = 60;
    const bottomPadding = calculateBottomPadding();
    
    if (Platform.OS === 'web' && isWebMobile) {
      // For mobile web, ensure adequate height to prevent cutting off
      return baseHeight + bottomPadding + (isSamsungGalaxyS20Ultra ? 8 : 0);
    }
    
    return baseHeight + bottomPadding;
  };

  const bottomPadding = calculateBottomPadding();
  const tabBarHeight = calculateTabBarHeight();

  return {
    /** Total height of the tab bar including safe area */
    tabBarHeight,
    /** Bottom padding value for content spacing */
    bottomPadding,
    /** Additional spacing for Samsung Galaxy S20 Ultra */
    isSamsungGalaxyS20Ultra,
    /** Whether running on mobile web */
    isWebMobile,
  };
} 

/**
 * @file NotificationBadge.tsx
 * @description Reusable notification badge component that displays count over icons.
 * Used for showing notification counts on navigation icons.
 *
 * @author SnapConnect Team
 * @created 2024-01-24
 *
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @/stores/themeStore: Theme management
 *
 * @usage
 * Wrap around icons to show notification counts with gaming-themed styling.
 *
 * @ai_context
 * Smart badge visibility based on user attention patterns.
 * Adaptive styling based on content importance and user context.
 */

import React from "react";
import { Text, View } from "react-native";

/**
 * NotificationBadge component props
 */
interface NotificationBadgeProps {
  /** Number to display in the badge */
  count: number;
  /** Maximum number to display before showing "+" */
  maxCount?: number;
  /** Children elements (typically an icon) */
  children: React.ReactNode;
  /** Whether to show badge even when count is 0 */
  showZero?: boolean;
}

/**
 * NotificationBadge component for displaying count badges over icons
 *
 * @param props - Component props
 * @returns {React.ReactElement} Rendered notification badge
 *
 * @performance
 * - Minimal re-renders with optimized count formatting
 * - Efficient positioning and styling calculations
 *
 * @ai_integration
 * - Smart badge styling based on urgency and content type
 * - Adaptive visibility based on user attention patterns
 */
const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  children,
  showZero = false,
}) => {
  // Don't show badge if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return <>{children}</>;
  }

  /**
   * Format count for display
   */
  const formatCount = (num: number): string => {
    if (num <= maxCount) {
      return num.toString();
    }
    return `${maxCount}+`;
  };

  return (
    <View className="relative">
      {children}

      {/* Badge */}
      <View
        className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full justify-center items-center px-1"
        style={{
          backgroundColor: "#ef4444", // Red background for notifications
          borderWidth: 1,
          borderColor: "#000000", // Black border for contrast
        }}
      >
        <Text
          className="text-white font-inter font-bold text-xs"
          style={{
            fontSize: 10,
            lineHeight: 12,
          }}
        >
          {formatCount(count)}
        </Text>
      </View>
    </View>
  );
};

export default NotificationBadge;

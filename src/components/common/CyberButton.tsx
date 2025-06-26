/**
 * @file CyberButton.tsx
 * @description Cyber gaming themed button component with RGB effects and gaming aesthetics.
 * Provides consistent button styling throughout the SnapConnect application.
 *
 * @author SnapConnect Team
 * @created 2024-01-25
 *
 * @dependencies
 * - react: React hooks and types
 * - react-native: TouchableOpacity, Text, View
 * - @expo/vector-icons: Optional icons
 *
 * @usage
 * import { CyberButton } from '@/components/common/CyberButton';
 * <CyberButton variant="primary" onPress={handlePress}>Click Me</CyberButton>
 *
 * @ai_context
 * Core UI component that adapts based on gaming context and user preferences.
 * Supports dynamic theming and accessibility features.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

/**
 * Button variant types for different gaming contexts
 */
export type CyberButtonVariant =
  | "primary" // Cyan accent - main actions
  | "secondary" // Magenta accent - secondary actions
  | "success" // Green accent - positive actions
  | "danger" // Red accent - destructive actions
  | "warning" // Orange accent - warning actions
  | "ghost" // Transparent with border - subtle actions
  | "legendary"; // Gold gradient - premium actions

/**
 * Button size variants
 */
export type CyberButtonSize = "small" | "medium" | "large";

/**
 * CyberButton component props
 */
export interface CyberButtonProps {
  /** Button text content */
  children: React.ReactNode;
  /** Button press handler */
  onPress: () => void;
  /** Visual variant of the button */
  variant?: CyberButtonVariant;
  /** Size of the button */
  size?: CyberButtonSize;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Whether button is in loading state */
  loading?: boolean;
  /** Optional icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Icon position relative to text */
  iconPosition?: "left" | "right";
  /** Whether button should take full width */
  fullWidth?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Optional test ID for testing */
  testID?: string;
}

/**
 * Get variant-specific styling classes
 * @param variant - Button variant
 * @param disabled - Whether button is disabled
 * @returns CSS classes for the variant
 */
function getVariantClasses(
  variant: CyberButtonVariant,
  disabled: boolean,
): string {
  if (disabled) {
    return "bg-gray-600 border-gray-500";
  }

  switch (variant) {
    case "primary":
      return "bg-cyber-cyan border-cyber-cyan shadow-glow-cyan";
    case "secondary":
      return "bg-cyber-magenta border-cyber-magenta shadow-glow-magenta";
    case "success":
      return "bg-cyber-green border-cyber-green shadow-glow-green";
    case "danger":
      return "bg-neon-red border-neon-red shadow-glow-red";
    case "warning":
      return "bg-cyber-orange border-cyber-orange shadow-glow-orange";
    case "ghost":
      return "bg-transparent border-cyber-cyan text-cyber-cyan";
    case "legendary":
      return "bg-gradient-legendary border-gaming-legendary shadow-glow-orange";
    default:
      return "bg-cyber-cyan border-cyber-cyan shadow-glow-cyan";
  }
}

/**
 * Get text color classes based on variant
 * @param variant - Button variant
 * @param disabled - Whether button is disabled
 * @returns CSS classes for text color
 */
function getTextClasses(
  variant: CyberButtonVariant,
  disabled: boolean,
): string {
  if (disabled) {
    return "text-gray-300";
  }

  switch (variant) {
    case "ghost":
      return "text-cyber-cyan";
    case "primary":
    case "secondary":
    case "success":
    case "danger":
    case "warning":
    case "legendary":
      return "text-cyber-black";
    default:
      return "text-cyber-black";
  }
}

/**
 * Get size-specific styling classes
 * @param size - Button size
 * @returns CSS classes for the size
 */
function getSizeClasses(size: CyberButtonSize): {
  container: string;
  text: string;
  icon: number;
} {
  switch (size) {
    case "small":
      return {
        container: "px-3 py-2 rounded-lg",
        text: "text-sm font-inter-medium",
        icon: 16,
      };
    case "large":
      return {
        container: "px-6 py-4 rounded-xl",
        text: "text-lg font-inter-semibold",
        icon: 24,
      };
    case "medium":
    default:
      return {
        container: "px-4 py-3 rounded-lg",
        text: "text-base font-inter-medium",
        icon: 20,
      };
  }
}

/**
 * CyberButton Component
 * Gaming-themed button with RGB effects and multiple variants
 *
 * @param props - Component props
 * @returns Rendered button component
 *
 * @example
 * <CyberButton
 *   variant="primary"
 *   icon="rocket"
 *   onPress={handleLaunch}
 * >
 *   Launch Game
 * </CyberButton>
 */
export const CyberButton: React.FC<CyberButtonProps> = ({
  children,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  className = "",
  testID,
}) => {
  const variantClasses = getVariantClasses(variant, disabled || loading);
  const textClasses = getTextClasses(variant, disabled || loading);
  const sizeClasses = getSizeClasses(size);

  const isDisabled = disabled || loading;

  /**
   * Handle button press with haptic feedback
   */
  const handlePress = () => {
    if (!isDisabled) {
      onPress();
    }
  };

  /**
   * Render button content with optional icon and loading state
   */
  const renderContent = () => {
    if (loading) {
      return (
        <View className="flex-row items-center justify-center">
          <ActivityIndicator
            size="small"
            color={variant === "ghost" ? "#00ffff" : "#0a0a0a"}
          />
          <Text className={`ml-2 ${textClasses} ${sizeClasses.text}`}>
            Loading...
          </Text>
        </View>
      );
    }

    const content = (
      <>
        {icon && iconPosition === "left" && (
          <Ionicons
            name={icon}
            size={sizeClasses.icon}
            color={variant === "ghost" ? "#00ffff" : "#0a0a0a"}
            style={{ marginRight: 8 }}
          />
        )}

        <Text className={`${textClasses} ${sizeClasses.text}`}>{children}</Text>

        {icon && iconPosition === "right" && (
          <Ionicons
            name={icon}
            size={sizeClasses.icon}
            color={variant === "ghost" ? "#00ffff" : "#0a0a0a"}
            style={{ marginLeft: 8 }}
          />
        )}
      </>
    );

    return icon ? (
      <View className="flex-row items-center justify-center">{content}</View>
    ) : (
      <View className="items-center justify-center">{content}</View>
    );
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      testID={testID}
      className={`
        border-2 
        ${variantClasses} 
        ${sizeClasses.container}
        ${fullWidth ? "w-full" : "self-start"}
        ${isDisabled ? "opacity-50" : "active:scale-95"}
        ${className}
      `}
      style={{
        shadowColor: variant === "ghost" ? "transparent" : "#00ffff",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: isDisabled ? 0 : 0.3,
        shadowRadius: 8,
        elevation: isDisabled ? 0 : 8,
      }}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

export default CyberButton;

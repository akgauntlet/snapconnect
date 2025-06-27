/**
 * @file IconButton.tsx
 * @description Cyber gaming themed icon button component with RGB effects and gaming aesthetics.
 * Perfect for action buttons, navigation controls, and interactive gaming elements.
 *
 * @author SnapConnect Team
 * @created 2024-01-25
 *
 * @dependencies
 * - react: React hooks and types
 * - react-native: TouchableOpacity, View
 * - @expo/vector-icons: Icon library
 *
 * @usage
 * import { IconButton } from '@/components/common/IconButton';
 * <IconButton icon="play" variant="primary" onPress={handlePlay} />
 *
 * @ai_context
 * Icon-based UI component that adapts to gaming context and provides intuitive interactions.
 * Supports haptic feedback and accessibility features for enhanced UX.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity } from "react-native";

/**
 * Icon button variant types for different gaming contexts
 */
export type IconButtonVariant =
  | "primary" // Cyan accent - main actions
  | "secondary" // Magenta accent - secondary actions
  | "success" // Green accent - positive actions
  | "danger" // Red accent - destructive actions
  | "warning" // Orange accent - warning actions
  | "ghost" // Transparent with border - subtle actions
  | "legendary" // Gold gradient - premium actions
  | "transparent"; // No background - icon only

/**
 * Icon button size variants
 */
export type IconButtonSize = "small" | "medium" | "large" | "xlarge";

/**
 * IconButton component props
 */
export interface IconButtonProps {
  /** Icon name from Ionicons */
  icon: keyof typeof Ionicons.glyphMap;
  /** Button press handler */
  onPress: () => void;
  /** Visual variant of the button */
  variant?: IconButtonVariant;
  /** Size of the button */
  size?: IconButtonSize;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Whether button is active/selected */
  active?: boolean;
  /** Custom icon color (overrides variant color) */
  iconColor?: string;
  /** Custom background color (overrides variant) */
  backgroundColor?: string;
  /** Additional CSS classes */
  className?: string;
  /** Optional test ID for testing */
  testID?: string;
}

/**
 * Get variant-specific styling classes
 * @param variant - Button variant
 * @param disabled - Whether button is disabled
 * @param active - Whether button is active
 * @returns CSS classes for the variant
 */
function getVariantClasses(
  variant: IconButtonVariant,
  disabled: boolean,
  active: boolean,
): {
  background: string;
  border: string;
  glow: string;
} {
  if (disabled) {
    return {
      background: "bg-gray-600",
      border: "border-gray-500",
      glow: "",
    };
  }

  switch (variant) {
    case "primary":
      return {
        background: "bg-cyber-cyan/20",
        border: "border-cyber-cyan",
        glow: active ? "shadow-glow-cyan" : "",
      };
    case "secondary":
      return {
        background: "bg-cyber-magenta/20",
        border: "border-cyber-magenta",
        glow: active ? "shadow-glow-magenta" : "",
      };
    case "success":
      return {
        background: "bg-cyber-green/20",
        border: "border-cyber-green",
        glow: active ? "shadow-glow-green" : "",
      };
    case "danger":
      return {
        background: "bg-neon-red/20",
        border: "border-neon-red",
        glow: active ? "shadow-glow-red" : "",
      };
    case "warning":
      return {
        background: "bg-cyber-orange/20",
        border: "border-cyber-orange",
        glow: active ? "shadow-glow-orange" : "",
      };
    case "ghost":
      return {
        background: "bg-transparent",
        border: "border-cyber-cyan",
        glow: active ? "shadow-glow-cyan" : "",
      };
    case "legendary":
      return {
        background: "bg-gaming-legendary/20",
        border: "border-gaming-legendary",
        glow: active ? "shadow-glow-orange" : "",
      };
    case "transparent":
      return {
        background: "bg-transparent",
        border: "border-transparent",
        glow: "",
      };
    default:
      return {
        background: "bg-cyber-cyan/20",
        border: "border-cyber-cyan",
        glow: active ? "shadow-glow-cyan" : "",
      };
  }
}

/**
 * Get icon color based on variant
 * @param variant - Button variant
 * @param disabled - Whether button is disabled
 * @param active - Whether button is active
 * @returns Icon color
 */
function getIconColor(
  variant: IconButtonVariant,
  disabled: boolean,
  active: boolean,
): string {
  if (disabled) {
    return "#9ca3af";
  }

  switch (variant) {
    case "primary":
      return active ? "#00ffff" : "#00d4ff";
    case "secondary":
      return active ? "#ff00ff" : "#e100e1";
    case "success":
      return active ? "#00ff41" : "#00e63b";
    case "danger":
      return active ? "#ff0040" : "#e6003a";
    case "warning":
      return active ? "#ff8000" : "#e67300";
    case "ghost":
      return active ? "#00ffff" : "#00d4ff";
    case "legendary":
      return active ? "#ffd700" : "#e6c200";
    case "transparent":
      return active ? "#00ffff" : "#ffffff";
    default:
      return active ? "#00ffff" : "#00d4ff";
  }
}

/**
 * Get size-specific styling
 * @param size - Button size
 * @returns Size configuration
 */
function getSizeConfig(size: IconButtonSize): {
  container: string;
  iconSize: number;
  borderWidth: string;
} {
  switch (size) {
    case "small":
      return {
        container: "w-8 h-8 rounded-lg",
        iconSize: 16,
        borderWidth: "border",
      };
    case "large":
      return {
        container: "w-14 h-14 rounded-xl",
        iconSize: 28,
        borderWidth: "border-2",
      };
    case "xlarge":
      return {
        container: "w-16 h-16 rounded-xl",
        iconSize: 32,
        borderWidth: "border-2",
      };
    case "medium":
    default:
      return {
        container: "w-10 h-10 rounded-lg",
        iconSize: 20,
        borderWidth: "border",
      };
  }
}

/**
 * IconButton Component
 * Gaming-themed icon button with RGB effects and multiple variants
 *
 * @param props - Component props
 * @returns Rendered icon button component
 *
 * @example
 * <IconButton
 *   icon="play"
 *   variant="primary"
 *   size="large"
 *   active={isPlaying}
 *   onPress={handlePlayToggle}
 * />
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  active = false,
  iconColor,
  backgroundColor,
  className = "",
  testID,
}) => {
  const variantClasses = getVariantClasses(variant, disabled, active);
  const sizeConfig = getSizeConfig(size);
  const defaultIconColor = getIconColor(variant, disabled, active);

  /**
   * Handle button press
   */
  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      testID={testID}
      className={`
        ${sizeConfig.container}
        ${variantClasses.background}
        ${sizeConfig.borderWidth}
        ${variantClasses.border}
        ${variantClasses.glow}
        items-center
        justify-center
        ${disabled ? "opacity-50" : "active:scale-95"}
        ${className}
      `}
      style={{
        backgroundColor: backgroundColor || undefined,
        boxShadow: (variantClasses.glow && !disabled) ? `0px 0px ${active ? 12 : 8}px rgba(0, 255, 255, 0.3)` : 'none',
        elevation: disabled ? 0 : active ? 12 : 8,
      } as any}
    >
      <Ionicons
        name={icon}
        size={sizeConfig.iconSize}
        color={iconColor || defaultIconColor}
      />
    </TouchableOpacity>
  );
};

export default IconButton;

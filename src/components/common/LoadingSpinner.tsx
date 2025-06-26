/**
 * @file LoadingSpinner.tsx
 * @description Cyber gaming themed loading spinner with RGB effects and customizable animations.
 * Provides consistent loading indicators throughout the SnapConnect application.
 *
 * @author SnapConnect Team
 * @created 2024-01-25
 *
 * @dependencies
 * - react: React hooks and types
 * - react-native: View, Text, Animated
 * - react-native-reanimated: Advanced animations
 *
 * @usage
 * import { LoadingSpinner } from '@/components/common/LoadingSpinner';
 * <LoadingSpinner variant="cyber" size="large" message="Loading game..." />
 *
 * @ai_context
 * Loading component that adapts to gaming context and provides engaging feedback.
 * Supports various animation styles and customizable messaging.
 */

import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/**
 * Loading spinner variants for different contexts
 */
export type LoadingSpinnerVariant =
  | "cyber" // Cyber gaming themed
  | "matrix" // Matrix rain effect
  | "pulse" // Pulsing glow effect
  | "dots" // Animated dots
  | "bars" // Audio bars style
  | "orbital"; // Orbital ring animation

/**
 * Spinner size variants
 */
export type LoadingSpinnerSize = "small" | "medium" | "large";

/**
 * LoadingSpinner component props
 */
export interface LoadingSpinnerProps {
  /** Visual variant of the spinner */
  variant?: LoadingSpinnerVariant;
  /** Size of the spinner */
  size?: LoadingSpinnerSize;
  /** Loading message to display */
  message?: string;
  /** Custom color for the spinner */
  color?: string;
  /** Whether to show the spinner */
  visible?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Get size-specific dimensions
 * @param size - Spinner size
 * @returns Size configuration
 */
function getSizeConfig(size: LoadingSpinnerSize): {
  spinnerSize: number;
  strokeWidth: number;
  textSize: string;
  spacing: number;
} {
  switch (size) {
    case "small":
      return {
        spinnerSize: 24,
        strokeWidth: 2,
        textSize: "text-sm",
        spacing: 8,
      };
    case "large":
      return {
        spinnerSize: 60,
        strokeWidth: 4,
        textSize: "text-lg",
        spacing: 16,
      };
    case "medium":
    default:
      return {
        spinnerSize: 40,
        strokeWidth: 3,
        textSize: "text-base",
        spacing: 12,
      };
  }
}

/**
 * Cyber Ring Spinner Component
 */
const CyberRingSpinner: React.FC<{
  size: number;
  strokeWidth: number;
  color: string;
}> = ({ size, strokeWidth, color }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[animatedStyle, { width: size, height: size }]}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: "transparent",
          borderTopColor: color,
          borderRightColor: color,
        }}
      />
    </Animated.View>
  );
};

/**
 * Pulse Dots Spinner Component
 */
const PulseDotsSpinner: React.FC<{
  size: number;
  color: string;
}> = ({ size, color }) => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animateDot = (dot: Animated.SharedValue<number>, delay: number) => {
      dot.value = withRepeat(
        withTiming(1, {
          duration: 800,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      );
    };

    animateDot(dot1, 0);
    setTimeout(() => animateDot(dot2, 200), 200);
    setTimeout(() => animateDot(dot3, 400), 400);
  }, [dot1, dot2, dot3]);

  const useDotStyle = (dot: Animated.SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: interpolate(dot.value, [0, 1], [0.3, 1]),
      transform: [
        {
          scale: interpolate(dot.value, [0, 1], [0.8, 1.2]),
        },
      ],
    }));

  const dotSize = size / 4;

  return (
    <View className="flex-row items-center" style={{ gap: size / 8 }}>
      <Animated.View
        style={[
          useDotStyle(dot1),
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
          },
        ]}
      />
      <Animated.View
        style={[
          useDotStyle(dot2),
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
          },
        ]}
      />
      <Animated.View
        style={[
          useDotStyle(dot3),
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

/**
 * Audio Bars Spinner Component
 */
const AudioBarsSpinner: React.FC<{
  size: number;
  color: string;
}> = ({ size, color }) => {
  const bar1 = useSharedValue(0);
  const bar2 = useSharedValue(0);
  const bar3 = useSharedValue(0);
  const bar4 = useSharedValue(0);

  useEffect(() => {
    const animateBar = (bar: Animated.SharedValue<number>, delay: number) => {
      setTimeout(() => {
        bar.value = withRepeat(
          withTiming(1, {
            duration: 600,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true,
        );
      }, delay);
    };

    animateBar(bar1, 0);
    animateBar(bar2, 150);
    animateBar(bar3, 300);
    animateBar(bar4, 450);
  }, [bar1, bar2, bar3, bar4]);

  const useBarStyle = (bar: Animated.SharedValue<number>) =>
    useAnimatedStyle(() => ({
      height: interpolate(bar.value, [0, 1], [size * 0.2, size]),
    }));

  const barWidth = size / 6;

  return (
    <View className="flex-row items-end" style={{ gap: size / 12 }}>
      <Animated.View
        style={[
          useBarStyle(bar1),
          {
            width: barWidth,
            backgroundColor: color,
            borderRadius: barWidth / 2,
          },
        ]}
      />
      <Animated.View
        style={[
          useBarStyle(bar2),
          {
            width: barWidth,
            backgroundColor: color,
            borderRadius: barWidth / 2,
          },
        ]}
      />
      <Animated.View
        style={[
          useBarStyle(bar3),
          {
            width: barWidth,
            backgroundColor: color,
            borderRadius: barWidth / 2,
          },
        ]}
      />
      <Animated.View
        style={[
          useBarStyle(bar4),
          {
            width: barWidth,
            backgroundColor: color,
            borderRadius: barWidth / 2,
          },
        ]}
      />
    </View>
  );
};

/**
 * LoadingSpinner Component
 * Gaming-themed loading spinner with multiple animation variants
 *
 * @param props - Component props
 * @returns Rendered spinner component
 *
 * @example
 * <LoadingSpinner
 *   variant="cyber"
 *   size="large"
 *   message="Connecting to game servers..."
 *   color="#00ffff"
 * />
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  variant = "cyber",
  size = "medium",
  message,
  color = "#00ffff",
  visible = true,
  className = "",
  testID,
}) => {
  const sizeConfig = getSizeConfig(size);

  if (!visible) return null;

  /**
   * Render the appropriate spinner variant
   */
  const renderSpinner = () => {
    switch (variant) {
      case "cyber":
      case "orbital":
        return (
          <CyberRingSpinner
            size={sizeConfig.spinnerSize}
            strokeWidth={sizeConfig.strokeWidth}
            color={color}
          />
        );
      case "pulse":
      case "dots":
        return <PulseDotsSpinner size={sizeConfig.spinnerSize} color={color} />;
      case "bars":
        return <AudioBarsSpinner size={sizeConfig.spinnerSize} color={color} />;
      case "matrix":
        return (
          <CyberRingSpinner
            size={sizeConfig.spinnerSize}
            strokeWidth={sizeConfig.strokeWidth}
            color="#00ff41"
          />
        );
      default:
        return (
          <CyberRingSpinner
            size={sizeConfig.spinnerSize}
            strokeWidth={sizeConfig.strokeWidth}
            color={color}
          />
        );
    }
  };

  return (
    <View
      className={`items-center justify-center ${className}`}
      testID={testID}
    >
      {/* Spinner */}
      <View style={{ marginBottom: message ? sizeConfig.spacing : 0 }}>
        {renderSpinner()}
      </View>

      {/* Loading Message */}
      {message && (
        <Text
          className={`text-white/80 font-inter ${sizeConfig.textSize} text-center`}
          style={{ color: color }}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

export default LoadingSpinner;

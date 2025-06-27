/**
 * @file GamingOverlay.tsx
 * @description Gaming-themed overlay components for AR filters including HUD, stats, and achievement frames.
 * Optimized for real-time rendering with gaming aesthetic.
 */

import React from 'react';
import { Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { useThemeStore } from '../../stores/themeStore';

export type OverlayType = 'hud' | 'health-bar' | 'minimap' | 'achievement' | 'stats';

interface GamingOverlayProps {
  type: OverlayType;
  data?: Record<string, any>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  animated?: boolean;
}

/**
 * Gaming overlay component with various HUD elements
 */
const GamingOverlay: React.FC<GamingOverlayProps> = ({
  type,
  data = {},
  position = { x: 0, y: 0 },
  size = { width: 200, height: 100 },
  animated = true,
}) => {
  const theme = useThemeStore((state) => state.theme);
  
  const glowOpacity = useSharedValue(0.5);
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (animated) {
      glowOpacity.value = withRepeat(
        withTiming(1, { duration: 1000 }),
        -1,
        true
      );
      pulseScale.value = withRepeat(
        withTiming(1.05, { duration: 2000 }),
        -1,
        true
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const renderHUD = () => (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
        },
        animated && animatedStyle,
      ]}
    >
      <Svg width={size.width} height={size.height}>
        {/* HUD Frame */}
        <Rect
          x="2"
          y="2"
          width={size.width - 4}
          height={size.height - 4}
          fill="none"
          stroke={theme.colors.accent.cyan}
          strokeWidth="2"
          rx="8"
        />
        
        {/* Corner Brackets */}
        <Path
          d={`M10,2 L2,2 L2,10 M${size.width-10},2 L${size.width-2},2 L${size.width-2},10`}
          stroke={theme.colors.accent.cyan}
          strokeWidth="3"
          fill="none"
        />
        <Path
          d={`M2,${size.height-10} L2,${size.height-2} L10,${size.height-2} M${size.width-2},${size.height-10} L${size.width-2},${size.height-2} L${size.width-10},${size.height-2}`}
          stroke={theme.colors.accent.cyan}
          strokeWidth="3"
          fill="none"
        />
        
        {/* Crosshair */}
        <Circle
          cx={size.width / 2}
          cy={size.height / 2}
          r="8"
          fill="none"
          stroke={theme.colors.accent.red}
          strokeWidth="2"
        />
        <Line
          x1={size.width / 2 - 12}
          y1={size.height / 2}
          x2={size.width / 2 + 12}
          y2={size.height / 2}
          stroke={theme.colors.accent.red}
          strokeWidth="1"
        />
        <Line
          x1={size.width / 2}
          y1={size.height / 2 - 12}
          x2={size.width / 2}
          y2={size.height / 2 + 12}
          stroke={theme.colors.accent.red}
          strokeWidth="1"
        />
      </Svg>
      
      {/* HUD Text */}
      <View className="absolute top-3 left-3">
        <Text
          className="text-xs font-bold"
          style={{
            color: theme.colors.accent.cyan,
            fontFamily: theme.typography.fonts.mono,
            textShadow: `0px 0px 3px ${theme.colors.accent.cyan}`,
          } as any}
        >
          {data.gameMode || 'GAMING MODE'}
        </Text>
      </View>
    </Animated.View>
  );

  const renderHealthBar = () => {
    const health = data.health || 100;
    const maxHealth = data.maxHealth || 100;
    const healthPercent = (health / maxHealth) * 100;
    
    return (
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: position.x,
            top: position.y,
            width: size.width,
            height: size.height,
          },
          animated && animatedStyle,
        ]}
      >
        <Svg width={size.width} height={size.height}>
          {/* Background Bar */}
          <Rect
            x="4"
            y="4"
            width={size.width - 8}
            height="20"
            fill={theme.colors.background.tertiary}
            stroke={theme.colors.accent.red}
            strokeWidth="1"
            rx="10"
          />
          
          {/* Health Bar Fill */}
          <Rect
            x="6"
            y="6"
            width={(size.width - 12) * (healthPercent / 100)}
            height="16"
            fill={healthPercent > 50 ? theme.colors.accent.green : theme.colors.accent.red}
            rx="8"
          />
          
          {/* Health Bar Segments */}
          {[...Array(4)].map((_, i) => (
            <Line
              key={i}
              x1={6 + (size.width - 12) * (i / 4)}
              y1="6"
              x2={6 + (size.width - 12) * (i / 4)}
              y2="22"
              stroke={theme.colors.background.primary}
              strokeWidth="1"
            />
          ))}
        </Svg>
        
        <View className="absolute top-1 left-2">
          <Text
            className="text-xs font-bold"
            style={{
              color: theme.colors.text.primary,
              fontFamily: theme.typography.fonts.mono,
            }}
          >
            HP: {health}/{maxHealth}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderMinimap = () => (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
        },
        animated && animatedStyle,
      ]}
    >
      <Svg width={size.width} height={size.height}>
        {/* Minimap Background */}
        <Rect
          x="2"
          y="2"
          width={size.width - 4}
          height={size.height - 4}
          fill={theme.colors.background.primary + '80'}
          stroke={theme.colors.accent.blue}
          strokeWidth="2"
          rx="4"
        />
        
        {/* Player Position */}
        <Circle
          cx={size.width / 2}
          cy={size.height / 2}
          r="3"
          fill={theme.colors.accent.cyan}
        />
        
        {/* Enemy Positions */}
        {(data.enemies || []).map((enemy: any, i: number) => (
          <Circle
            key={i}
            cx={enemy.x * size.width}
            cy={enemy.y * size.height}
            r="2"
            fill={theme.colors.accent.red}
          />
        ))}
        
        {/* Objective Markers */}
        {(data.objectives || []).map((obj: any, i: number) => (
          <Rect
            key={i}
            x={obj.x * size.width - 2}
            y={obj.y * size.height - 2}
            width="4"
            height="4"
            fill={theme.colors.accent.orange}
          />
        ))}
      </Svg>
    </Animated.View>
  );

  const renderAchievement = () => (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
        },
        animated && animatedStyle,
      ]}
    >
      <Svg width={size.width} height={size.height}>
        {/* Achievement Frame */}
        <Rect
          x="4"
          y="4"
          width={size.width - 8}
          height={size.height - 8}
          fill={theme.colors.accent.orange + '20'}
          stroke={theme.colors.accent.orange}
          strokeWidth="3"
          rx="12"
        />
        
        {/* Achievement Glow */}
        <Rect
          x="2"
          y="2"
          width={size.width - 4}
          height={size.height - 4}
          fill="none"
          stroke={theme.colors.accent.orange}
          strokeWidth="1"
          strokeOpacity="0.5"
          rx="14"
        />
      </Svg>
      
      <View className="absolute inset-0 items-center justify-center">
        <Text
          className="text-lg font-bold mb-1"
          style={{
            color: theme.colors.accent.orange,
            fontFamily: theme.typography.fonts.display,
            textShadow: `0px 0px 5px ${theme.colors.accent.orange}`,
          } as any}
        >
          🏆
        </Text>
        <Text
          className="text-xs font-bold text-center"
          style={{
            color: theme.colors.text.primary,
            fontFamily: theme.typography.fonts.body,
          }}
        >
          {data.title || 'ACHIEVEMENT'}
        </Text>
      </View>
    </Animated.View>
  );

  const renderStats = () => (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
        },
        animated && animatedStyle,
      ]}
    >
      <View
        className="p-3 rounded-lg"
        style={{
          backgroundColor: theme.colors.background.primary + 'CC',
          borderWidth: 1,
          borderColor: theme.colors.accent.cyan + '50',
        }}
      >
        <Text
          className="text-xs font-bold mb-2"
          style={{
            color: theme.colors.accent.cyan,
            fontFamily: theme.typography.fonts.display,
          }}
        >
          GAME STATS
        </Text>
        
        <View className="space-y-1">
          <Text
            className="text-xs"
            style={{
              color: theme.colors.text.secondary,
              fontFamily: theme.typography.fonts.mono,
            }}
          >
            Score: {data.score || 0}
          </Text>
          <Text
            className="text-xs"
            style={{
              color: theme.colors.text.secondary,
              fontFamily: theme.typography.fonts.mono,
            }}
          >
            Level: {data.level || 1}
          </Text>
          <Text
            className="text-xs"
            style={{
              color: theme.colors.text.secondary,
              fontFamily: theme.typography.fonts.mono,
            }}
          >
            Time: {data.time || '00:00'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  switch (type) {
    case 'hud':
      return renderHUD();
    case 'health-bar':
      return renderHealthBar();
    case 'minimap':
      return renderMinimap();
    case 'achievement':
      return renderAchievement();
    case 'stats':
      return renderStats();
    default:
      return null;
  }
};

export default GamingOverlay; 

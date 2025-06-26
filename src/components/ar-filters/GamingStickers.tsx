/**
 * @file GamingStickers.tsx
 * @description Gaming-specific stickers and emojis for AR content creation.
 * Features animated gaming-themed stickers with interactive placement.
 */

import React, { useState } from 'react';
import {
    FlatList,
    Pressable,
    Text,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useThemeStore } from '../../stores/themeStore';

interface GamingSticker {
  id: string;
  emoji: string;
  name: string;
  category: 'gaming' | 'victory' | 'defeat' | 'stats' | 'weapons' | 'effects';
  animated?: boolean;
  premium?: boolean;
}

interface GamingStickersProps {
  onStickerSelect: (sticker: GamingSticker) => void;
  visible: boolean;
  onClose?: () => void;
}

/**
 * Individual animated sticker component with proper hook usage
 */
const AnimatedSticker: React.FC<{ 
  sticker: GamingSticker; 
  onStickerSelect: (sticker: GamingSticker) => void;
  theme: any;
}> = ({ sticker, onStickerSelect, theme }) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (sticker.animated) {
      scale.value = withRepeat(
        withSpring(1.2, { duration: 1000 }),
        -1,
        true
      );
      rotation.value = withRepeat(
        withTiming(10, { duration: 2000 }),
        -1,
        true
      );
    }
  }, [sticker.animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.8, { duration: 100 }, () => {
      scale.value = withSpring(1, { duration: 100 });
    });
    onStickerSelect(sticker);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="w-16 h-16 items-center justify-center m-2"
    >
      <Animated.View
        style={[
          {
            backgroundColor: theme.colors.background.secondary,
            borderRadius: 12,
            width: 56,
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: sticker.premium ? 2 : 0,
            borderColor: sticker.premium ? theme.colors.accent.orange : 'transparent',
          },
          sticker.animated && animatedStyle,
        ]}
      >
        <Text style={{ fontSize: 24 }}>{sticker.emoji}</Text>
        
        {sticker.premium && (
          <View
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full items-center justify-center"
            style={{ backgroundColor: theme.colors.accent.orange }}
          >
            <Text style={{ fontSize: 8, color: 'white' }}>★</Text>
          </View>
        )}
      </Animated.View>
      
      <Text
        className="text-xs mt-1 text-center"
        style={{
          color: theme.colors.text.secondary,
          fontFamily: theme.typography.fonts.body,
        }}
        numberOfLines={1}
      >
        {sticker.name}
      </Text>
    </Pressable>
  );
};

/**
 * Gaming stickers and emojis selector component
 */
const GamingStickers: React.FC<GamingStickersProps> = ({
  onStickerSelect,
  visible,
  onClose,
}) => {
  const theme = useThemeStore((state) => state.theme);
  const [selectedCategory, setSelectedCategory] = useState<string>('gaming');

  const translateY = useSharedValue(visible ? 0 : 300);
  const opacity = useSharedValue(visible ? 1 : 0);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0);
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(300);
    }
  }, [visible]);

  const gamingStickers: GamingSticker[] = [
    // Gaming Category
    { id: '1', emoji: '🎮', name: 'Controller', category: 'gaming' },
    { id: '2', emoji: '🕹️', name: 'Joystick', category: 'gaming' },
    { id: '3', emoji: '🎯', name: 'Target', category: 'gaming' },
    { id: '4', emoji: '🏁', name: 'Racing Flag', category: 'gaming' },
    { id: '5', emoji: '👾', name: 'Pixel Monster', category: 'gaming', animated: true },
    { id: '6', emoji: '🤖', name: 'Robot', category: 'gaming' },

    // Victory Category
    { id: '7', emoji: '🏆', name: 'Trophy', category: 'victory', animated: true },
    { id: '8', emoji: '🥇', name: 'Gold Medal', category: 'victory' },
    { id: '9', emoji: '👑', name: 'Crown', category: 'victory' },
    { id: '10', emoji: '⭐', name: 'Star', category: 'victory', animated: true },
    { id: '11', emoji: '💎', name: 'Diamond', category: 'victory' },
    { id: '12', emoji: '🔥', name: 'Fire', category: 'victory', animated: true },

    // Defeat Category
    { id: '13', emoji: '💀', name: 'Skull', category: 'defeat' },
    { id: '14', emoji: '😵', name: 'Knocked Out', category: 'defeat' },
    { id: '15', emoji: '💥', name: 'Explosion', category: 'defeat', animated: true },
    { id: '16', emoji: '⚰️', name: 'Coffin', category: 'defeat' },

    // Stats Category
    { id: '17', emoji: '📊', name: 'Chart', category: 'stats' },
    { id: '18', emoji: '🔢', name: 'Numbers', category: 'stats' },
    { id: '19', emoji: '⏱️', name: 'Timer', category: 'stats', animated: true },
    { id: '20', emoji: '📈', name: 'Growth', category: 'stats' },

    // Weapons Category
    { id: '21', emoji: '⚔️', name: 'Swords', category: 'weapons' },
    { id: '22', emoji: '🏹', name: 'Bow Arrow', category: 'weapons' },
    { id: '23', emoji: '🔫', name: 'Gun', category: 'weapons' },
    { id: '24', emoji: '🛡️', name: 'Shield', category: 'weapons' },

    // Effects Category
    { id: '25', emoji: '✨', name: 'Sparkles', category: 'effects', animated: true },
    { id: '26', emoji: '💫', name: 'Dizzy', category: 'effects', animated: true },
    { id: '27', emoji: '⚡', name: 'Lightning', category: 'effects', animated: true },
    { id: '28', emoji: '🌟', name: 'Glowing Star', category: 'effects', animated: true },
  ];

  const categories = [
    { id: 'gaming', name: 'Gaming', icon: '🎮' },
    { id: 'victory', name: 'Victory', icon: '🏆' },
    { id: 'defeat', name: 'Defeat', icon: '💀' },
    { id: 'stats', name: 'Stats', icon: '📊' },
    { id: 'weapons', name: 'Weapons', icon: '⚔️' },
    { id: 'effects', name: 'Effects', icon: '✨' },
  ];

  const filteredStickers = gamingStickers.filter(
    sticker => sticker.category === selectedCategory
  );

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <View className="absolute inset-0 z-50">
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
        onPress={onClose}
      />
      
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.colors.background.primary,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 20,
            paddingBottom: 40,
            borderTopWidth: 1,
            borderTopColor: theme.colors.accent.cyan + '30',
            maxHeight: '60%',
          },
          animatedContainerStyle,
        ]}
      >
        {/* Header */}
        <View className="px-6 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="text-lg font-bold"
              style={{
                color: theme.colors.text.primary,
                fontFamily: theme.typography.fonts.display,
              }}
            >
              Gaming Stickers
            </Text>
            
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: theme.colors.background.tertiary }}
            >
              <Text style={{ color: theme.colors.text.secondary }}>✕</Text>
            </Pressable>
          </View>

          {/* Category Selector */}
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedCategory(item.id)}
                className="mr-3 py-2 px-3 rounded-lg"
                style={{
                  backgroundColor: selectedCategory === item.id
                    ? theme.colors.accent.cyan + '20'
                    : theme.colors.background.secondary,
                  borderWidth: 1,
                  borderColor: selectedCategory === item.id
                    ? theme.colors.accent.cyan
                    : theme.colors.background.tertiary,
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: selectedCategory === item.id
                      ? theme.colors.accent.cyan
                      : theme.colors.text.secondary,
                  }}
                >
                  {item.icon} {item.name}
                </Text>
              </Pressable>
            )}
          />
        </View>

        {/* Stickers Grid */}
        <FlatList
          data={filteredStickers}
          numColumns={4}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AnimatedSticker 
              sticker={item} 
              onStickerSelect={onStickerSelect}
              theme={theme}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </View>
  );
};

export default GamingStickers; 

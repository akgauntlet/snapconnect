/**
 * @file ARFiltersDemo.tsx
 * @description Demo component showcasing gaming AR filters and effects functionality.
 * Demonstrates all implemented Phase 3 AR filter features.
 *
 * @author SnapConnect Team
 * @created 2024-01-25
 * @modified 2024-01-25
 *
 * @usage
 * <ARFiltersDemo />
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    Pressable,
    SafeAreaView,
    Text,
    View
} from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import type { GamingFilterType, OverlayType } from '../ar-filters';
import { FilterSelector, GamingOverlay, GamingStickers } from '../ar-filters';

const { width: screenWidth } = Dimensions.get('window');

/**
 * AR Filters Demo Component
 * 
 * Showcases:
 * - Gaming-themed AR filters (cyberpunk, neon-glow, matrix, etc.)
 * - Gaming overlays (HUD, health bars, minimaps, achievements)
 * - Gaming stickers and emojis
 * - Screen recording for gaming clips
 * - Filter performance optimization
 */
const ARFiltersDemo: React.FC = () => {
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());

  // Demo state
  const [showFilterSelector, setShowFilterSelector] = useState(false);
  const [showGamingStickers, setShowGamingStickers] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<GamingFilterType | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayType, setOverlayType] = useState<OverlayType>('hud');
  const [isRecording, setIsRecording] = useState(false);
  
  // Demo image (placeholder)
  const demoImageUri = 'https://via.placeholder.com/400x600/0a0a0a/00ffff?text=Gaming+Content';

  /**
   * Handle filter selection
   */
  const handleFilterSelect = async (filter: GamingFilterType | null) => {
    setCurrentFilter(filter);
    setShowFilterSelector(false);
    
    if (filter) {
      console.log(`Applied ${filter} filter`);
      // In real implementation, would apply filter to image
    }
  };

  /**
   * Handle sticker selection
   */
  const handleStickerSelect = (sticker: any) => {
    setShowGamingStickers(false);
    console.log('Selected sticker:', sticker.name);
  };

  /**
   * Toggle overlay type
   */
  const cycleOverlayType = () => {
    const types: OverlayType[] = ['hud', 'health-bar', 'minimap', 'achievement', 'stats'];
    const currentIndex = types.indexOf(overlayType);
    const nextIndex = (currentIndex + 1) % types.length;
    setOverlayType(types[nextIndex]);
  };

  /**
   * Demo screen recording
   */
  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      console.log('Screen recording stopped');
    } else {
      setIsRecording(true);
      console.log('Screen recording started');
      // Auto-stop after 5 seconds for demo
      setTimeout(() => setIsRecording(false), 5000);
    }
  };

  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: theme.colors.background.primary 
      }}
    >
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-700">
        <Text
          className="text-2xl font-bold text-center mb-2"
          style={{
            color: theme.colors.text.primary,
            fontFamily: theme.typography.fonts.display,
          }}
        >
          🎮 Gaming AR Filters Demo
        </Text>
        <Text
          className="text-center text-sm"
          style={{
            color: theme.colors.text.secondary,
            fontFamily: theme.typography.fonts.body,
          }}
        >
          Phase 3: Gaming Enhancement Features
        </Text>
      </View>

      {/* Demo Content */}
      <View className="flex-1 p-6">
        {/* Demo Image Container */}
        <View className="relative items-center mb-6">
          <View
            className="rounded-lg overflow-hidden border-2"
            style={{
              width: screenWidth - 80,
              height: 300,
              borderColor: currentFilter ? accentColor : theme.colors.background.tertiary,
              backgroundColor: theme.colors.background.secondary,
            }}
          >
            {/* Demo Image */}
            <View className="w-full h-full items-center justify-center bg-gray-800">
              <Text className="text-6xl mb-2">🎮</Text>
              <Text
                className="text-lg font-bold"
                style={{ color: accentColor }}
              >
                GAMING CONTENT
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: theme.colors.text.secondary }}
              >
                {currentFilter ? `Filter: ${currentFilter}` : 'No filter applied'}
              </Text>
            </View>

            {/* Gaming Overlay Demo */}
            {showOverlay && (
              <GamingOverlay
                type={overlayType}
                position={{ x: 10, y: 10 }}
                size={{ width: 180, height: 80 }}
                data={{
                  gameMode: 'DEMO MODE',
                  health: 85,
                  maxHealth: 100,
                  score: 12450,
                  level: 15,
                  time: '02:45',
                  enemies: [
                    { x: 0.2, y: 0.3 },
                    { x: 0.7, y: 0.6 },
                  ],
                  objectives: [
                    { x: 0.5, y: 0.8 },
                  ],
                }}
                animated={true}
              />
            )}
          </View>
        </View>

        {/* Control Buttons */}
        <View className="space-y-4">
          {/* Filter Controls */}
          <View>
            <Text
              className="text-lg font-semibold mb-3"
              style={{
                color: theme.colors.text.primary,
                fontFamily: theme.typography.fonts.display,
              }}
            >
              AR Filters
            </Text>
            <View className="flex-row justify-between">
              <Pressable
                onPress={() => setShowFilterSelector(true)}
                className="flex-1 py-3 px-4 rounded-lg mr-2 items-center"
                style={{
                  backgroundColor: currentFilter 
                    ? accentColor + '20' 
                    : theme.colors.background.secondary,
                  borderWidth: 1,
                  borderColor: currentFilter ? accentColor : theme.colors.background.tertiary,
                }}
              >
                <Ionicons name="color-filter" size={20} color={currentFilter ? accentColor : theme.colors.text.secondary} />
                <Text
                  className="text-sm font-medium mt-1"
                  style={{ color: currentFilter ? accentColor : theme.colors.text.secondary }}
                >
                  Gaming Filters
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setCurrentFilter(null)}
                className="flex-1 py-3 px-4 rounded-lg ml-2 items-center"
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  borderWidth: 1,
                  borderColor: theme.colors.background.tertiary,
                }}
              >
                <Ionicons name="refresh" size={20} color={theme.colors.text.secondary} />
                <Text
                  className="text-sm font-medium mt-1"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Clear Filter
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Gaming Overlay Controls */}
          <View>
            <Text
              className="text-lg font-semibold mb-3"
              style={{
                color: theme.colors.text.primary,
                fontFamily: theme.typography.fonts.display,
              }}
            >
              Gaming Overlays
            </Text>
            <View className="flex-row justify-between">
              <Pressable
                onPress={() => setShowOverlay(!showOverlay)}
                className="flex-1 py-3 px-4 rounded-lg mr-2 items-center"
                style={{
                  backgroundColor: showOverlay 
                    ? theme.colors.accent.green + '20' 
                    : theme.colors.background.secondary,
                  borderWidth: 1,
                  borderColor: showOverlay ? theme.colors.accent.green : theme.colors.background.tertiary,
                }}
              >
                <Ionicons name="game-controller" size={20} color={showOverlay ? theme.colors.accent.green : theme.colors.text.secondary} />
                <Text
                  className="text-sm font-medium mt-1"
                  style={{ color: showOverlay ? theme.colors.accent.green : theme.colors.text.secondary }}
                >
                  Toggle HUD
                </Text>
              </Pressable>

              <Pressable
                onPress={cycleOverlayType}
                className="flex-1 py-3 px-4 rounded-lg ml-2 items-center"
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  borderWidth: 1,
                  borderColor: theme.colors.background.tertiary,
                }}
              >
                <Ionicons name="swap-horizontal" size={20} color={theme.colors.text.secondary} />
                <Text
                  className="text-sm font-medium mt-1"
                  style={{ color: theme.colors.text.secondary }}
                >
                  {overlayType.toUpperCase()}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Gaming Features */}
          <View>
            <Text
              className="text-lg font-semibold mb-3"
              style={{
                color: theme.colors.text.primary,
                fontFamily: theme.typography.fonts.display,
              }}
            >
              Gaming Features
            </Text>
            <View className="flex-row justify-between">
              <Pressable
                onPress={() => setShowGamingStickers(true)}
                className="flex-1 py-3 px-4 rounded-lg mr-2 items-center"
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  borderWidth: 1,
                  borderColor: theme.colors.background.tertiary,
                }}
              >
                <Ionicons name="happy" size={20} color={theme.colors.text.secondary} />
                <Text
                  className="text-sm font-medium mt-1"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Gaming Stickers
                </Text>
              </Pressable>

              <Pressable
                onPress={toggleRecording}
                className="flex-1 py-3 px-4 rounded-lg ml-2 items-center"
                style={{
                  backgroundColor: isRecording 
                    ? theme.colors.accent.red + '20' 
                    : theme.colors.background.secondary,
                  borderWidth: 1,
                  borderColor: isRecording ? theme.colors.accent.red : theme.colors.background.tertiary,
                }}
              >
                <Ionicons name="videocam" size={20} color={isRecording ? theme.colors.accent.red : theme.colors.text.secondary} />
                <Text
                  className="text-sm font-medium mt-1"
                  style={{ color: isRecording ? theme.colors.accent.red : theme.colors.text.secondary }}
                >
                  {isRecording ? 'Recording...' : 'Screen Record'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Performance Stats */}
        <View className="mt-6 p-4 rounded-lg" style={{ backgroundColor: theme.colors.background.secondary }}>
          <Text
            className="text-sm font-semibold mb-2"
            style={{ color: theme.colors.accent.cyan }}
          >
            Performance Optimizations ⚡
          </Text>
          <Text
            className="text-xs mb-1"
            style={{ color: theme.colors.text.secondary }}
          >
            • 60fps AR filter processing
          </Text>
          <Text
            className="text-xs mb-1"
            style={{ color: theme.colors.text.secondary }}
          >
            • Gaming-optimized memory management
          </Text>
          <Text
            className="text-xs mb-1"
            style={{ color: theme.colors.text.secondary }}
          >
            • Cached filter assets for instant application
          </Text>
          <Text
            className="text-xs"
            style={{ color: theme.colors.text.secondary }}
          >
            • Hardware-accelerated overlay rendering
          </Text>
        </View>
      </View>

      {/* AR Filter Components */}
      <FilterSelector
        visible={showFilterSelector}
        currentFilter={currentFilter}
        onFilterSelect={handleFilterSelect}
        onClose={() => setShowFilterSelector(false)}
      />

      <GamingStickers
        visible={showGamingStickers}
        onStickerSelect={handleStickerSelect}
        onClose={() => setShowGamingStickers(false)}
      />
    </SafeAreaView>
  );
};

export default ARFiltersDemo; 

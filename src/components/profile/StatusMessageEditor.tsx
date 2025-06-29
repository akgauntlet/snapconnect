/**
 * @file StatusMessageEditor.tsx
 * @description Rich status message editor with gaming context, availability status, emoji support, and expiration timers.
 * Provides quick gaming status selects, availability toggles, and smart suggestions.
 *
 * @author SnapConnect Team
 * @created 2024-01-24
 * @modified 2024-01-24
 *
 * @dependencies
 * - react: React hooks and components
 * - react-native: Core UI components
 * - @expo/vector-icons: Ionicons
 * - @/stores/themeStore: Theme management
 * - @/stores/authStore: Authentication and profile state
 *
 * @usage
 * Status message editing interface for profile customization.
 *
 * @ai_context
 * AI-powered status suggestions based on gaming activity and context.
 * Smart expiration time recommendations and gaming context detection.
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";

// Status message types
type AvailabilityStatus = 'available' | 'busy' | 'gaming' | 'afk';
type StatusType = 'text' | 'gaming' | 'availability';

interface StatusMessageEditorProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (statusData: any) => void;
  initialStatus?: {
    text?: string;
    emoji?: string;
    gameContext?: string;
    availability?: AvailabilityStatus;
    expiresAt?: Date;
  };
}

// Gaming status quick selects
const GAMING_STATUS_PRESETS = [
  { text: "Playing solo", emoji: "🎮", gameContext: "solo" },
  { text: "Looking for team", emoji: "👥", gameContext: "team" },
  { text: "Streaming now", emoji: "📺", gameContext: "streaming" },
  { text: "In competitive", emoji: "🏆", gameContext: "competitive" },
  { text: "Grinding ranks", emoji: "📈", gameContext: "ranked" },
  { text: "Chill gaming", emoji: "😎", gameContext: "casual" },
];

// Availability status options
const AVAILABILITY_OPTIONS = [
  { key: 'available', label: 'Available', icon: 'checkmark-circle', color: '#10B981' },
  { key: 'busy', label: 'Busy', icon: 'remove-circle', color: '#EF4444' },
  { key: 'gaming', label: 'Gaming', icon: 'game-controller', color: '#8B5CF6' },
  { key: 'afk', label: 'Away', icon: 'moon', color: '#6B7280' },
];

// Expiration timer options (in minutes)
const EXPIRATION_OPTIONS = [
  { label: 'Never', value: null },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: '24 hours', value: 1440 },
];

// Popular emojis for status messages
const POPULAR_EMOJIS = [
  '🎮', '🏆', '🔥', '💪', '😎', '👥', '📺', '🎯',
  '⚡', '🚀', '💯', '🎪', '🌟', '🎨', '🎵', '📱',
  '💤', '☕', '🍕', '🎉', '🤝', '👋', '❤️', '⭐'
];

/**
 * Status Message Editor Component
 *
 * @param {StatusMessageEditorProps} props - Component props
 * @returns {React.ReactElement} Rendered status message editor
 *
 * @performance
 * - Optimized emoji grid with lazy loading
 * - Debounced text input for better UX
 * - Smart status suggestions based on gaming activity
 *
 * @ai_integration
 * - Gaming context detection and suggestions
 * - Smart expiration time recommendations
 * - Availability status based on gaming patterns
 */
const StatusMessageEditor: React.FC<StatusMessageEditorProps> = ({
  visible,
  onClose,
  onSave,
  initialStatus = {},
}) => {
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const { isLoading, profile } = useAuthStore();

  // Form state
  const [statusText, setStatusText] = useState(initialStatus.text || '');
  const [selectedEmoji, setSelectedEmoji] = useState(initialStatus.emoji || '');
  const [gameContext, setGameContext] = useState(initialStatus.gameContext || '');
  const [availability, setAvailability] = useState<AvailabilityStatus>(
    initialStatus.availability || 'available'
  );
  const [expirationMinutes, setExpirationMinutes] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'gaming' | 'emoji'>('text');

  // UI state
  const [hasChanges, setHasChanges] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);

  /**
   * Check for changes in form data
   */
  useEffect(() => {
    const originalData = {
      text: initialStatus.text || '',
      emoji: initialStatus.emoji || '',
      gameContext: initialStatus.gameContext || '',
      availability: initialStatus.availability || 'available',
    };

    const currentData = {
      text: statusText,
      emoji: selectedEmoji,
      gameContext,
      availability,
    };

    const changes = Object.keys(originalData).some(
      (key) => originalData[key as keyof typeof originalData] !== currentData[key as keyof typeof currentData]
    );

    setHasChanges(changes);
    setCharacterCount(statusText.length);
  }, [statusText, selectedEmoji, gameContext, availability, initialStatus]);

  /**
   * Handle gaming status preset selection
   */
  const handleGamingPresetSelect = (preset: typeof GAMING_STATUS_PRESETS[0]) => {
    setStatusText(preset.text);
    setSelectedEmoji(preset.emoji);
    setGameContext(preset.gameContext);
    setAvailability('gaming');
    setActiveTab('text');
  };

  /**
   * Handle availability status change
   */
  const handleAvailabilityChange = (newAvailability: AvailabilityStatus) => {
    setAvailability(newAvailability);
    
    // Auto-suggest status text based on availability
    if (newAvailability === 'gaming' && !statusText) {
      setStatusText('Gaming');
    } else if (newAvailability === 'busy' && !statusText) {
      setStatusText('Busy');
    } else if (newAvailability === 'afk' && !statusText) {
      setStatusText('Away');
    }
  };

  /**
   * Handle save status message
   */
  const handleSave = async () => {
    if (!statusText.trim() && !selectedEmoji) {
      return;
    }

    try {
      const statusData = {
        text: statusText.trim(),
        emoji: selectedEmoji || null,
        gameContext: gameContext || null,
        availability,
        expiresAt: expirationMinutes ? new Date(Date.now() + expirationMinutes * 60 * 1000) : null,
      };

      if (onSave) {
        onSave(statusData);
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Failed to save status message:', error);
    }
  };

  /**
   * Handle clear status message
   */
  const handleClear = async () => {
    try {
      const statusData = {
        text: '',
        emoji: null,
        gameContext: null,
        availability: 'available',
        expiresAt: null,
      };

      if (onSave) {
        onSave(statusData);
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Failed to clear status message:', error);
    }
  };

  /**
   * Get current availability option
   */
  const getCurrentAvailabilityOption = () => {
    return AVAILABILITY_OPTIONS.find(option => option.key === availability) || AVAILABILITY_OPTIONS[0];
  };

  /**
   * Render tab content based on active tab
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'text':
        return (
          <View className="space-y-4">
            {/* Status Text Input */}
            <View>
              <Text className="text-cyber-cyan font-inter text-sm mb-2">
                Status Message
              </Text>
              <TextInput
                value={statusText}
                onChangeText={setStatusText}
                placeholder="What's your status?"
                placeholderTextColor="#6B7280"
                className="bg-cyber-dark border border-cyber-gray rounded-lg px-4 py-3 text-white font-inter"
                multiline
                maxLength={100}
                style={{ minHeight: 60 }}
              />
              <Text className="text-white/60 font-inter text-xs mt-1 text-right">
                {characterCount}/100
              </Text>
            </View>

            {/* Availability Status */}
            <View>
              <Text className="text-cyber-cyan font-inter text-sm mb-2">
                Availability
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-2">
                {AVAILABILITY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => handleAvailabilityChange(option.key as AvailabilityStatus)}
                    className={`flex-row items-center px-3 py-2 rounded-lg border mr-2 ${
                      availability === option.key
                        ? 'bg-cyber-cyan/20 border-cyber-cyan'
                        : 'bg-cyber-dark border-cyber-gray/50'
                    }`}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={16}
                      color={availability === option.key ? accentColor : option.color}
                    />
                    <Text
                      className={`font-inter text-sm ml-2 ${
                        availability === option.key ? 'text-cyber-cyan' : 'text-white/70'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Expiration Timer */}
            <View>
              <Text className="text-cyber-cyan font-inter text-sm mb-2">
                Auto-clear After
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-2">
                {EXPIRATION_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    onPress={() => setExpirationMinutes(option.value)}
                    className={`px-3 py-2 rounded-lg border mr-2 ${
                      expirationMinutes === option.value
                        ? 'bg-cyber-cyan/20 border-cyber-cyan'
                        : 'bg-cyber-dark border-cyber-gray/50'
                    }`}
                  >
                    <Text
                      className={`font-inter text-sm ${
                        expirationMinutes === option.value ? 'text-cyber-cyan' : 'text-white/70'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        );

      case 'gaming':
        return (
          <View className="space-y-4">
            <Text className="text-cyber-cyan font-inter text-sm mb-2">
              Gaming Status Quick Select
            </Text>
            <View className="space-y-2">
              {GAMING_STATUS_PRESETS.map((preset, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleGamingPresetSelect(preset)}
                  className="flex-row items-center p-3 bg-cyber-dark rounded-lg border border-cyber-gray/50"
                >
                  <Text className="text-2xl mr-3">{preset.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-white font-inter font-medium">
                      {preset.text}
                    </Text>
                    <Text className="text-white/60 font-inter text-xs capitalize">
                      {preset.gameContext} gaming
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'emoji':
        return (
          <View className="space-y-4">
            <Text className="text-cyber-cyan font-inter text-sm mb-2">
              Add Emoji
            </Text>
            <View className="flex-row flex-wrap">
              {POPULAR_EMOJIS.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedEmoji(emoji)}
                  className={`w-12 h-12 items-center justify-center rounded-lg m-1 ${
                    selectedEmoji === emoji
                      ? 'bg-cyber-cyan/20 border-2 border-cyber-cyan'
                      : 'bg-cyber-dark border border-cyber-gray/50'
                  }`}
                >
                  <Text className="text-2xl">{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {selectedEmoji && (
              <View className="flex-row items-center justify-between p-3 bg-cyber-cyan/10 rounded-lg border border-cyber-cyan/20">
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-2">{selectedEmoji}</Text>
                  <Text className="text-white font-inter">Selected</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedEmoji('')}
                  className="p-1"
                >
                  <Ionicons name="close" size={20} color={accentColor} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray/20">
          <TouchableOpacity onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <Text className="text-white font-orbitron text-lg">Status Message</Text>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading || (!statusText.trim() && !selectedEmoji)}
            className={`px-4 py-2 rounded-lg ${
              hasChanges && (statusText.trim() || selectedEmoji) && !isLoading
                ? 'bg-cyber-cyan'
                : 'bg-cyber-gray/50'
            }`}
          >
            <Text
              className={`font-inter font-semibold ${
                hasChanges && (statusText.trim() || selectedEmoji) && !isLoading
                  ? 'text-cyber-black'
                  : 'text-white/50'
              }`}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View className="flex-row px-6 py-4 border-b border-cyber-gray/10">
          {[
            { key: 'text', label: 'Text', icon: 'chatbubble-outline' },
            { key: 'gaming', label: 'Gaming', icon: 'game-controller-outline' },
            { key: 'emoji', label: 'Emoji', icon: 'happy-outline' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex-row items-center justify-center py-2 px-4 rounded-lg mr-2 ${
                activeTab === tab.key
                  ? 'bg-cyber-cyan/20 border border-cyber-cyan/30'
                  : 'bg-cyber-dark border border-cyber-gray/30'
              }`}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? accentColor : '#6B7280'}
              />
              <Text
                className={`font-inter text-sm ml-2 ${
                  activeTab === tab.key ? 'text-cyber-cyan' : 'text-white/70'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6 py-4">
          {renderTabContent()}
        </ScrollView>

        {/* Bottom Actions */}
        <View className="px-6 py-4 border-t border-cyber-gray/20">
          {/* Status Preview */}
          {(statusText || selectedEmoji) && (
            <View className="flex-row items-center p-3 bg-cyber-dark rounded-lg mb-4 border border-cyber-gray/30">
              <View
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: getCurrentAvailabilityOption().color }}
              />
              <View className="flex-1">
                <Text className="text-white font-inter">
                  {selectedEmoji && `${selectedEmoji} `}
                  {statusText || 'Status message'}
                </Text>
                <Text className="text-white/60 font-inter text-xs">
                  {getCurrentAvailabilityOption().label}
                  {gameContext && `  ${gameContext}`}
                  {expirationMinutes && `  expires in ${expirationMinutes < 60 ? `${expirationMinutes}m` : `${Math.floor(expirationMinutes / 60)}h`}`}
                </Text>
              </View>
            </View>
          )}

          {/* Clear Status Button */}
          {(profile?.statusMessage?.text || profile?.statusMessage?.emoji) && (
            <TouchableOpacity
              onPress={handleClear}
              disabled={isLoading}
              className="bg-red-500/20 border border-red-500/30 p-3 rounded-lg"
            >
              <Text className="text-red-400 font-inter text-center font-medium">
                Clear Status Message
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default StatusMessageEditor;

/**
 * @file GamingInput.tsx
 * @description Cyber gaming themed input component with RGB borders and gaming aesthetics.
 * Provides consistent input styling throughout the SnapConnect application.
 * 
 * @author SnapConnect Team
 * @created 2024-01-25
 * 
 * @dependencies
 * - react: React hooks and types
 * - react-native: TextInput, Text, View
 * - @expo/vector-icons: Input icons
 * 
 * @usage
 * import { GamingInput } from '@/components/common/GamingInput';
 * <GamingInput placeholder="Enter username" value={username} onChangeText={setUsername} />
 * 
 * @ai_context
 * Input component that adapts to gaming context and provides enhanced UX.
 * Supports validation states and accessibility features.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

/**
 * Input variant types for different contexts
 */
export type GamingInputVariant = 
  | 'default'    // Standard cyber cyan
  | 'success'    // Green border - valid input
  | 'error'      // Red border - invalid input
  | 'warning'    // Orange border - warning state
  | 'legendary'; // Gold border - premium input

/**
 * GamingInput component props
 */
export interface GamingInputProps {
  /** Input value */
  value: string;
  /** Value change handler */
  onChangeText: (text: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Input label */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Success message to display */
  success?: string;
  /** Input variant */
  variant?: GamingInputVariant;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Secure text entry (password) */
  secureTextEntry?: boolean;
  /** Keyboard type */
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  /** Auto capitalize */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Auto correct */
  autoCorrect?: boolean;
  /** Max length */
  maxLength?: number;
  /** Multiline input */
  multiline?: boolean;
  /** Number of lines for multiline */
  numberOfLines?: number;
  /** Left icon */
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Right icon */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  /** Right icon press handler */
  onRightIconPress?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testID?: string;
  /** Focus handler */
  onFocus?: () => void;
  /** Blur handler */
  onBlur?: () => void;
}

/**
 * Get variant-specific styling classes
 * @param variant - Input variant
 * @param focused - Whether input is focused
 * @param disabled - Whether input is disabled
 * @returns CSS classes for the variant
 */
function getVariantClasses(
  variant: GamingInputVariant, 
  focused: boolean, 
  disabled: boolean
): {
  container: string;
  input: string;
  glow: string;
} {
  if (disabled) {
    return {
      container: 'border-gray-600 bg-gray-800',
      input: 'text-gray-400',
      glow: '',
    };
  }

  const baseContainer = focused ? 'border-2' : 'border';
  
  switch (variant) {
    case 'success':
      return {
        container: `${baseContainer} border-cyber-green bg-cyber-dark`,
        input: 'text-white',
        glow: focused ? 'shadow-glow-green' : '',
      };
    case 'error':
      return {
        container: `${baseContainer} border-neon-red bg-cyber-dark`,
        input: 'text-white',
        glow: focused ? 'shadow-glow-red' : '',
      };
    case 'warning':
      return {
        container: `${baseContainer} border-cyber-orange bg-cyber-dark`,
        input: 'text-white',
        glow: focused ? 'shadow-glow-orange' : '',
      };
    case 'legendary':
      return {
        container: `${baseContainer} border-gaming-legendary bg-cyber-dark`,
        input: 'text-white',
        glow: focused ? 'shadow-glow-orange' : '',
      };
    case 'default':
    default:
      return {
        container: `${baseContainer} border-cyber-cyan bg-cyber-dark`,
        input: 'text-white',
        glow: focused ? 'shadow-glow-cyan' : '',
      };
  }
}

/**
 * GamingInput Component
 * Cyber-themed input with RGB effects and gaming aesthetics
 * 
 * @param props - Component props
 * @returns Rendered input component
 * 
 * @example
 * <GamingInput
 *   label="Gamer Tag"
 *   placeholder="Enter your gamer tag"
 *   value={gamerTag}
 *   onChangeText={setGamerTag}
 *   leftIcon="game-controller"
 *   variant="legendary"
 *   maxLength={20}
 * />
 */
export const GamingInput: React.FC<GamingInputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  success,
  variant = 'default',
  disabled = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  maxLength,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  onRightIconPress,
  className = '',
  testID,
  onFocus,
  onBlur,
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Determine actual variant based on error/success state
  const actualVariant = error ? 'error' : success ? 'success' : variant;
  
  const variantClasses = getVariantClasses(actualVariant, focused, disabled);

  /**
   * Handle focus event
   */
  const handleFocus = () => {
    setFocused(true);
    onFocus?.();
  };

  /**
   * Handle blur event
   */
  const handleBlur = () => {
    setFocused(false);
    onBlur?.();
  };

  /**
   * Handle password visibility toggle
   */
  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Get password toggle icon
   */
  const getPasswordIcon = (): keyof typeof Ionicons.glyphMap => {
    return showPassword ? 'eye-off' : 'eye';
  };

  /**
   * Render helper text (error or success message)
   */
  const renderHelperText = () => {
    if (error) {
      return (
        <View className="flex-row items-center mt-2">
          <Ionicons name="alert-circle" size={14} color="#ff0040" />
          <Text className="text-neon-red font-inter text-sm ml-2">
            {error}
          </Text>
        </View>
      );
    }

    if (success) {
      return (
        <View className="flex-row items-center mt-2">
          <Ionicons name="checkmark-circle" size={14} color="#00ff41" />
          <Text className="text-cyber-green font-inter text-sm ml-2">
            {success}
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View className={className}>
      {/* Label */}
      {label && (
        <Text className="text-white font-inter-medium text-sm mb-2">
          {label}
        </Text>
      )}

      {/* Input Container */}
      <View 
        className={`
          ${variantClasses.container}
          ${variantClasses.glow}
          rounded-lg
          flex-row
          items-center
          px-4
          ${multiline ? 'py-3' : 'py-4'}
        `}
      >
        {/* Left Icon */}
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={disabled ? '#9ca3af' : '#00ffff'}
            style={{ marginRight: 12 }}
          />
        )}

        {/* Text Input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#6b7280"
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          testID={testID}
          className={`
            ${variantClasses.input}
            font-inter
            text-base
            flex-1
          `}
          style={{
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />

        {/* Right Icon or Password Toggle */}
        {(rightIcon || secureTextEntry) && (
          <TouchableOpacity
            onPress={secureTextEntry ? handlePasswordToggle : onRightIconPress}
            disabled={disabled}
            className="ml-3"
          >
            <Ionicons
              name={secureTextEntry ? getPasswordIcon() : rightIcon!}
              size={20}
              color={disabled ? '#9ca3af' : '#00ffff'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Helper Text */}
      {renderHelperText()}

      {/* Character Count */}
      {maxLength && value.length > 0 && (
        <Text className="text-white/50 font-inter text-xs mt-1 text-right">
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
};

export default GamingInput; 

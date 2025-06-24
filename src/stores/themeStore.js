/**
 * @file themeStore.js
 * @description Zustand store for theme management in SnapConnect.
 * Handles cyber gaming theme state, preferences, and dynamic theme switching.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-20
 * 
 * @dependencies
 * - zustand: State management
 * - @/config/theme: Theme configuration
 * 
 * @usage
 * import { useThemeStore } from '@/stores/themeStore';
 * 
 * @ai_context
 * Adapts theme based on user gaming preferences and AI-driven personalization.
 * Supports dynamic color schemes based on user behavior patterns.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CyberTheme } from '../config/theme';

/**
 * Theme store with persistent state
 * 
 * @typedef {Object} ThemeState
 * @property {Object} theme - Current theme object
 * @property {string} themeName - Current theme name
 * @property {Object} preferences - Theme preferences
 * @property {boolean} isSystemTheme - Whether following system theme
 */
export const useThemeStore = create(
  persist(
    (set, get) => ({
      // Theme state
      theme: CyberTheme,
      themeName: 'cyber',
      
      // Theme preferences
      preferences: {
        accentColor: 'cyan',
        animationsEnabled: true,
        glowEffects: true,
        highContrast: false,
        gamingMode: false,
      },
      
      // System integration
      isSystemTheme: false,

      /**
       * Set theme accent color
       * @param {string} accentColor - Accent color key (cyan, magenta, green, etc.)
       * @returns {void}
       */
      setAccentColor: (accentColor) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            accentColor,
          },
        }));
      },

      /**
       * Toggle animations
       * @param {boolean} enabled - Whether animations are enabled
       * @returns {void}
       */
      toggleAnimations: (enabled) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            animationsEnabled: enabled,
          },
        }));
      },

      /**
       * Toggle glow effects
       * @param {boolean} enabled - Whether glow effects are enabled
       * @returns {void}
       */
      toggleGlowEffects: (enabled) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            glowEffects: enabled,
          },
        }));
      },

      /**
       * Toggle high contrast mode
       * @param {boolean} enabled - Whether high contrast is enabled
       * @returns {void}
       */
      toggleHighContrast: (enabled) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            highContrast: enabled,
          },
        }));
      },

      /**
       * Toggle gaming mode
       * @param {boolean} enabled - Whether gaming mode is enabled
       * @returns {void}
       */
      toggleGamingMode: (enabled) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            gamingMode: enabled,
          },
        }));
      },

      /**
       * Get current accent color
       * @returns {string} Current accent color value
       */
      getCurrentAccentColor: () => {
        const state = get();
        return state.theme.colors.accent[state.preferences.accentColor] || state.theme.colors.accent.cyan;
      },

      /**
       * Get theme color with alpha
       * @param {string} colorPath - Path to color in theme
       * @param {number} alpha - Alpha value (0-1)
       * @returns {string} Color with alpha
       */
      getColorWithAlpha: (colorPath, alpha = 1) => {
        const state = get();
        const color = colorPath.split('.').reduce((obj, key) => obj?.[key], state.theme.colors);
        
        if (!color) return null;
        
        // Convert hex to rgba
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      },

      /**
       * Get gaming context color
       * @param {string} context - Gaming context (victory, defeat, legendary, etc.)
       * @returns {string} Context color
       */
      getGamingColor: (context) => {
        const state = get();
        return state.theme.colors.gaming[context] || state.theme.colors.accent.cyan;
      },

      /**
       * Update theme preferences
       * @param {Object} newPreferences - New preference values
       * @returns {void}
       */
      updatePreferences: (newPreferences) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...newPreferences,
          },
        }));
      },

      /**
       * Reset theme to defaults
       * @returns {void}
       */
      resetTheme: () => {
        set({
          theme: CyberTheme,
          themeName: 'cyber',
          preferences: {
            accentColor: 'cyan',
            animationsEnabled: true,
            glowEffects: true,
            highContrast: false,
            gamingMode: false,
          },
          isSystemTheme: false,
        });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        themeName: state.themeName,
        isSystemTheme: state.isSystemTheme,
      }),
    }
  )
);

/**
 * Selector hooks for specific theme state
 */
export const useCurrentTheme = () => useThemeStore((state) => state.theme);
export const useThemePreferences = () => useThemeStore((state) => state.preferences);
export const useAccentColor = () => useThemeStore((state) => state.getCurrentAccentColor());
export const useGamingMode = () => useThemeStore((state) => state.preferences.gamingMode); 

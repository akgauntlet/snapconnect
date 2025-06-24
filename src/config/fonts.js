/**
 * @file fonts.js
 * @description Font configuration and loading for SnapConnect cyber gaming theme.
 * Manages Orbitron, Inter, and JetBrains Mono font families with proper loading.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-20
 * 
 * @dependencies
 * - expo-font: Font loading
 * 
 * @usage
 * import { loadFonts, fonts } from '@/config/fonts';
 * 
 * @ai_context
 * Font selection optimized for gaming readability and cyber aesthetic.
 * Typography hierarchy supports AI-generated content display.
 */

import * as Font from 'expo-font';

/**
 * Font configuration map for cyber gaming theme
 * Currently using system fonts with SpaceMono as available custom font
 * TODO: Add Inter, Orbitron, and JetBrains Mono font files to assets/fonts/ directories
 */
export const fonts = {
  // Available custom font
  'SpaceMono-Regular': require('../../assets/fonts/SpaceMono-Regular.ttf'),
};

/**
 * Load all custom fonts
 * @returns {Promise<void>} Promise that resolves when fonts are loaded
 */
export const loadFonts = async () => {
  try {
    await Font.loadAsync(fonts);
    console.log('Custom fonts loaded successfully');
  } catch (error) {
    console.warn('Failed to load custom fonts:', error);
    // App should continue with system fonts
  }
};

/**
 * Font family names for use in styles
 * Using system fonts with SpaceMono as available custom font
 */
export const fontFamilies = {
  // System font fallbacks (will use system defaults)
  interRegular: 'System',
  interMedium: 'System',
  interSemiBold: 'System',
  interBold: 'System',
  
  // System font fallbacks for gaming headers
  orbitronLight: 'System',
  orbitronRegular: 'System', 
  orbitronMedium: 'System',
  orbitronBold: 'System',
  orbitronBlack: 'System',
  
  // System font fallbacks for technical content
  jetbrainsRegular: 'monospace',
  jetbrainsMedium: 'monospace',
  jetbrainsBold: 'monospace',
  
  // Available custom font
  spaceMono: 'SpaceMono-Regular',
};

/**
 * Font presets for common use cases
 * Using system fonts with proper fallbacks
 */
export const fontPresets = {
  // Headers and titles - using system fonts for now
  headerLarge: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerMedium: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '600',
  },
  headerSmall: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Body text - using system fonts
  bodyLarge: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '600',
  },
  bodyMedium: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400',
  },
  bodySmall: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400',
  },
  
  // Technical content - using monospace
  codeLarge: {
    fontFamily: fontFamilies.spaceMono,
    fontSize: 16,
    fontWeight: 'normal',
  },
  codeMedium: {
    fontFamily: fontFamilies.spaceMono,
    fontSize: 14,
    fontWeight: 'normal',
  },
  codeSmall: {
    fontFamily: fontFamilies.spaceMono,
    fontSize: 12,
    fontWeight: 'normal',
  },
  
  // Gaming UI elements
  gamingButton: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
  },
  gamingLabel: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500',
  },
  gamingStats: {
    fontFamily: fontFamilies.spaceMono,
    fontSize: 14,
    fontWeight: 'normal',
  },
};

export default { fonts, loadFonts, fontFamilies, fontPresets }; 

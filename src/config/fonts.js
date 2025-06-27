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

import * as Font from "expo-font";

/**
 * Font configuration map for cyber gaming theme
 * Using Inter 18pt for body text, Orbitron for headers, JetBrains Mono for code
 */
export const fonts = {
  // Inter fonts (18pt for optimal readability)
  "Inter-Regular": require("../../assets/fonts/Inter_18pt-Regular.ttf"),
  "Inter-Medium": require("../../assets/fonts/Inter_18pt-Medium.ttf"),
  "Inter-SemiBold": require("../../assets/fonts/Inter_18pt-SemiBold.ttf"),
  "Inter-Bold": require("../../assets/fonts/Inter_18pt-Bold.ttf"),

  // Orbitron fonts (gaming headers and titles)
  "Orbitron-Regular": require("../../assets/fonts/Orbitron-Regular.ttf"),
  "Orbitron-Medium": require("../../assets/fonts/Orbitron-Medium.ttf"),
  "Orbitron-SemiBold": require("../../assets/fonts/Orbitron-SemiBold.ttf"),
  "Orbitron-Bold": require("../../assets/fonts/Orbitron-Bold.ttf"),
  "Orbitron-Black": require("../../assets/fonts/Orbitron-Black.ttf"),

  // JetBrains Mono fonts (technical content and code)
  "JetBrainsMono-Regular": require("../../assets/fonts/JetBrainsMono-Regular.ttf"),
  "JetBrainsMono-Medium": require("../../assets/fonts/JetBrainsMono-Medium.ttf"),
  "JetBrainsMono-Bold": require("../../assets/fonts/JetBrainsMono-Bold.ttf"),

  // SpaceMono (backup monospace)
  "SpaceMono-Regular": require("../../assets/fonts/SpaceMono-Regular.ttf"),
};

/**
 * Load all custom fonts
 * @returns {Promise<void>} Promise that resolves when fonts are loaded
 */
export const loadFonts = async () => {
  try {
    await Font.loadAsync(fonts);
  } catch (error) {
    console.warn("Failed to load custom fonts:", error);
    // App should continue with system fonts
  }
};

/**
 * Font family names for use in styles
 * Now using actual custom fonts with system fallbacks
 */
export const fontFamilies = {
  // Inter fonts for body text
  interRegular: "Inter-Regular",
  interMedium: "Inter-Medium",
  interSemiBold: "Inter-SemiBold",
  interBold: "Inter-Bold",

  // Orbitron fonts for gaming headers
  orbitronRegular: "Orbitron-Regular",
  orbitronMedium: "Orbitron-Medium",
  orbitronSemiBold: "Orbitron-SemiBold",
  orbitronBold: "Orbitron-Bold",
  orbitronBlack: "Orbitron-Black",

  // JetBrains Mono for technical content
  jetbrainsRegular: "JetBrainsMono-Regular",
  jetbrainsMedium: "JetBrainsMono-Medium",
  jetbrainsBold: "JetBrainsMono-Bold",

  // SpaceMono as backup
  spaceMono: "SpaceMono-Regular",
};

/**
 * Font presets for common use cases
 * Using custom fonts for gaming aesthetic
 */
export const fontPresets = {
  // Headers and titles - using Orbitron for gaming aesthetic
  headerLarge: {
    fontFamily: fontFamilies.orbitronBold,
    fontSize: 24,
    fontWeight: "normal", // Weight is built into font
  },
  headerMedium: {
    fontFamily: fontFamilies.orbitronSemiBold,
    fontSize: 20,
    fontWeight: "normal",
  },
  headerSmall: {
    fontFamily: fontFamilies.orbitronMedium,
    fontSize: 16,
    fontWeight: "normal",
  },

  // Body text - using Inter for readability
  bodyLarge: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: 18,
    fontWeight: "normal",
  },
  bodyMedium: {
    fontFamily: fontFamilies.interRegular,
    fontSize: 16,
    fontWeight: "normal",
  },
  bodySmall: {
    fontFamily: fontFamilies.interRegular,
    fontSize: 14,
    fontWeight: "normal",
  },

  // Technical content - using JetBrains Mono
  codeLarge: {
    fontFamily: fontFamilies.jetbrainsRegular,
    fontSize: 16,
    fontWeight: "normal",
  },
  codeMedium: {
    fontFamily: fontFamilies.jetbrainsRegular,
    fontSize: 14,
    fontWeight: "normal",
  },
  codeSmall: {
    fontFamily: fontFamilies.jetbrainsRegular,
    fontSize: 12,
    fontWeight: "normal",
  },

  // Gaming UI elements - mixing Orbitron and Inter
  gamingButton: {
    fontFamily: fontFamilies.orbitronMedium,
    fontSize: 16,
    fontWeight: "normal",
  },
  gamingLabel: {
    fontFamily: fontFamilies.interMedium,
    fontSize: 12,
    fontWeight: "normal",
  },
  gamingStats: {
    fontFamily: fontFamilies.jetbrainsRegular,
    fontSize: 14,
    fontWeight: "normal",
  },
};

export default { fonts, loadFonts, fontFamilies, fontPresets };

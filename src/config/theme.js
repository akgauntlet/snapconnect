/**
 * @file theme.js
 * @description Cyber gaming theme configuration with RGB color palette and gaming typography.
 * Provides comprehensive theming system for SnapConnect's gaming aesthetic.
 *
 * @author SnapConnect Team
 * @created 2024-01-15
 * @modified 2024-01-20
 *
 * @dependencies
 * - None (Pure configuration object)
 *
 * @usage
 * import { CyberTheme } from '@/config/theme';
 *
 * @ai_context
 * Theme adapts based on user gaming preferences and AI-driven personalization.
 * Supports dynamic color schemes based on user behavior and gaming context.
 */

/**
 * Main cyber gaming theme configuration
 * Following the design system from theme-rules.md
 */
export const CyberTheme = {
  // Color system - Cyber Gaming Palette
  colors: {
    // Background colors
    background: {
      primary: "#0a0a0a", // Deep black
      secondary: "#1a1a1a", // Dark gray
      tertiary: "#2a2a2a", // Medium gray
      card: "#1a1a1a", // Card backgrounds
      modal: "#0f0f0f", // Modal backgrounds
    },

    // Accent colors - RGB Gaming Palette
    accent: {
      cyan: "#00ffff", // Primary brand color
      magenta: "#ff00ff", // Secondary brand color
      green: "#00ff41", // Matrix green (success)
      blue: "#0080ff", // Electric blue (info)
      orange: "#ff8000", // Gaming orange (warning)
      red: "#ff0040", // Neon red (danger)
    },

    // Text colors
    text: {
      primary: "#ffffff", // Primary text
      secondary: "#b0b0b0", // Secondary text
      tertiary: "#808080", // Tertiary text
      disabled: "#505050", // Disabled text
      inverse: "#000000", // Inverse text (on light backgrounds)
    },

    // Gaming context colors
    gaming: {
      victory: "#00ff41", // Victory/success
      defeat: "#ff0040", // Defeat/error
      legendary: "#ffd700", // Legendary items
      epic: "#a335ee", // Epic items
      rare: "#0070dd", // Rare items
      common: "#9d9d9d", // Common items
    },

    // Transparency levels
    alpha: {
      low: "0.1",
      medium: "0.3",
      high: "0.7",
      max: "0.9",
    },
  },

  // Typography system
  typography: {
    // Font families
    fonts: {
      display: "Orbitron-Medium", // Gaming headers (max 20% usage)
      body: "Inter-Regular", // Readable content (70% usage)
      mono: "JetBrainsMono-Regular", // Technical content (10% usage)
    },

    // Font sizes (responsive scale)
    sizes: {
      xs: 12, // 0.75rem
      sm: 14, // 0.875rem
      base: 16, // 1rem
      lg: 18, // 1.125rem
      xl: 20, // 1.25rem
      "2xl": 24, // 1.5rem
      "3xl": 30, // 1.875rem
      "4xl": 36, // 2.25rem
      "5xl": 48, // 3rem
      "6xl": 60, // 3.75rem
    },

    // Font weights
    weights: {
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
    },

    // Line heights
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing scale (4px base unit)
  spacing: {
    xs: 4, // 4px
    sm: 8, // 8px
    md: 12, // 12px
    lg: 16, // 16px
    xl: 20, // 20px
    xxl: 24, // 24px
    xxxl: 32, // 32px
    xxxxl: 40, // 40px
    xxxxxl: 48, // 48px
    xxxxxxl: 64, // 64px
  },

  // Border radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  // Gaming effects and shadows
  effects: {
    // Glow effects
    glows: {
      cyan: "0 0 10px rgba(0, 255, 255, 0.3)",
      magenta: "0 0 10px rgba(255, 0, 255, 0.3)",
      green: "0 0 10px rgba(0, 255, 65, 0.3)",
      blue: "0 0 10px rgba(0, 128, 255, 0.3)",
      orange: "0 0 10px rgba(255, 128, 0, 0.3)",
      red: "0 0 10px rgba(255, 0, 64, 0.3)",
    },

    // Box shadows
    shadows: {
      sm: "0 2px 4px rgba(0, 0, 0, 0.3)",
      md: "0 4px 8px rgba(0, 0, 0, 0.4)",
      lg: "0 8px 16px rgba(0, 0, 0, 0.5)",
      xl: "0 16px 32px rgba(0, 0, 0, 0.6)",
    },

    // Gradient backgrounds
    gradients: {
      primary: "linear-gradient(135deg, #00ffff 0%, #ff00ff 100%)",
      secondary: "linear-gradient(135deg, #0080ff 0%, #00ff41 100%)",
      danger: "linear-gradient(135deg, #ff0040 0%, #ff8000 100%)",
      gaming: "linear-gradient(135deg, #ffd700 0%, #a335ee 100%)",
    },
  },

  // Animation timing
  animations: {
    durations: {
      fast: 150,
      normal: 300,
      slow: 500,
    },

    easings: {
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      easeOut: "cubic-bezier(0, 0, 0.2, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      gaming: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", // Smooth gaming feel
    },
  },

  // Breakpoints for responsive design
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    xxl: 1536,
  },

  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    modal: 2000,
    popover: 3000,
    tooltip: 4000,
    toast: 5000,
  },
};

/**
 * Utility function to get theme values with fallbacks
 *
 * @param {string} path - Dot notation path to theme value
 * @param {any} fallback - Fallback value if path not found
 * @returns {any} Theme value or fallback
 */
export const getThemeValue = (path, fallback = null) => {
  return (
    path.split(".").reduce((obj, key) => obj?.[key], CyberTheme) || fallback
  );
};

/**
 * Get color with alpha transparency
 *
 * @param {string} colorPath - Path to color in theme
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} Color with alpha
 */
export const getColorWithAlpha = (colorPath, alpha = 1) => {
  const color = getThemeValue(colorPath);
  if (!color) return null;

  // Convert hex to rgba
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default CyberTheme;

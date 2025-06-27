/**
 * @file constants.js
 * @description App-wide constants for SnapConnect gaming platform.
 * Centralized configuration values, API endpoints, and gaming-specific constants.
 *
 * @author SnapConnect Team
 * @created 2024-01-15
 * @modified 2024-01-20
 *
 * @dependencies
 * - None (Pure constants)
 *
 * @usage
 * import { APP_CONFIG, GAMING_PLATFORMS } from '@/utils/constants';
 *
 * @ai_context
 * Constants support AI-driven feature flags and gaming platform integrations.
 * Values can be dynamically adjusted based on AI recommendations and A/B testing.
 */

// App Configuration
export const APP_CONFIG = {
  NAME: "SnapConnect",
  VERSION: "1.0.0",
  BUILD_NUMBER: "1",
  BUNDLE_ID: "com.snapconnect.app",

  // Performance targets
  TARGET_FPS: 60,
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_DURATION: 60, // seconds

  // Gaming features
  MAX_GAMING_SESSIONS: 10,
  DEFAULT_MESSAGE_TTL: 24 * 60 * 60 * 1000, // 24 hours in ms
  MAX_GROUP_SIZE: 50,
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? process.env.EXPO_PUBLIC_API_BASE_URL_DEV || "http://localhost:3000"
    : process.env.EXPO_PUBLIC_API_BASE_URL_PROD ||
      "https://api.snapconnect.com",
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,

  // Endpoints
  ENDPOINTS: {
    AUTH: "/auth",
    USERS: "/users",
    MESSAGES: "/messages",
    GAMING: "/gaming",
    AI: "/ai",
    ANALYTICS: "/analytics",
  },
};

// Gaming Platform Integration
export const GAMING_PLATFORMS = {
  STEAM: {
    id: "steam",
    name: "Steam",
    color: "#1b2838",
    apiUrl: "https://api.steampowered.com",
  },
  DISCORD: {
    id: "discord",
    name: "Discord",
    color: "#5c65f3",
    apiUrl: "https://discord.com/api",
  },
  XBOX: {
    id: "xbox",
    name: "Xbox Live",
    color: "#107c10",
    apiUrl: "https://xboxlive.com/api",
  },
  PLAYSTATION: {
    id: "playstation",
    name: "PlayStation Network",
    color: "#003087",
    apiUrl: "https://psn.com/api",
  },
  TWITCH: {
    id: "twitch",
    name: "Twitch",
    color: "#9146ff",
    apiUrl: "https://api.twitch.tv",
  },
};

// Message Types
export const MESSAGE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  GAMING_CLIP: "gaming_clip",
  ACHIEVEMENT: "achievement",
  INVITE: "gaming_invite",
  POLL: "poll",
};

// Gaming Context Types
export const GAMING_CONTEXTS = {
  PLAYING: "playing",
  STREAMING: "streaming",
  WATCHING: "watching",
  IDLE: "idle",
  OFFLINE: "offline",
};

// AI Features
export const AI_FEATURES = {
  CONTENT_GENERATION: "content_generation",
  SMART_REPLIES: "smart_replies",
  GAMING_INSIGHTS: "gaming_insights",
  FRIEND_SUGGESTIONS: "friend_suggestions",
  CONTENT_MODERATION: "content_moderation",
  PERSONALIZATION: "personalization",
};

// Storage Keys (for AsyncStorage/SecureStore)
export const STORAGE_KEYS = {
  AUTH_TOKEN: "@snapconnect:auth_token",
  USER_PROFILE: "@snapconnect:user_profile",
  GAMING_PREFERENCES: "@snapconnect:gaming_preferences",
  AI_PREFERENCES: "@snapconnect:ai_preferences",
  THEME_SETTINGS: "@snapconnect:theme_settings",
  ONBOARDING_COMPLETE: "@snapconnect:onboarding_complete",
};

// Error Types
export const ERROR_TYPES = {
  NETWORK: "network_error",
  AUTH: "auth_error",
  VALIDATION: "validation_error",
  GAMING_API: "gaming_api_error",
  AI_SERVICE: "ai_service_error",
  CAMERA: "camera_error",
  STORAGE: "storage_error",
};

// Feature Flags (can be controlled by AI/backend)
export const FEATURE_FLAGS = {
  AI_CONTENT_GENERATION: true,
  GAMING_PLATFORM_SYNC: true,
  ADVANCED_FILTERS: true,
  VOICE_MESSAGES: true,
  LIVE_STREAMING: false, // Beta feature
  AR_FILTERS: false, // Coming soon
};

// UI Constants
export const UI_CONSTANTS = {
  HEADER_HEIGHT: 60,
  TAB_BAR_HEIGHT: 80,
  BOTTOM_SAFE_AREA: 34, // iPhone safe area

  // Animation durations
  ANIMATION_SHORT: 150,
  ANIMATION_MEDIUM: 300,
  ANIMATION_LONG: 500,

  // Touch targets
  MIN_TOUCH_TARGET: 44,
  BUTTON_HEIGHT: 48,

  // Gaming UI specific
  GAMING_CARD_HEIGHT: 120,
  ACHIEVEMENT_BADGE_SIZE: 60,
  STATUS_INDICATOR_SIZE: 12,
};

// Gaming Achievement Tiers
export const ACHIEVEMENT_TIERS = {
  BRONZE: {
    id: "bronze",
    name: "Bronze",
    color: "#cd7f32",
    points: 10,
  },
  SILVER: {
    id: "silver",
    name: "Silver",
    color: "#c0c0c0",
    points: 25,
  },
  GOLD: {
    id: "gold",
    name: "Gold",
    color: "#ffd700",
    points: 50,
  },
  PLATINUM: {
    id: "platinum",
    name: "Platinum",
    color: "#e5e4e2",
    points: 100,
  },
  DIAMOND: {
    id: "diamond",
    name: "Diamond",
    color: "#b9f2ff",
    points: 250,
  },
};

// Gaming Genres for user interests
export const GAMING_GENRES = {
  ACTION: {
    id: "action",
    name: "Action",
    description: "Fast-paced games with combat and challenges",
    color: "#ff4444",
    icon: "flash",
  },
  ADVENTURE: {
    id: "adventure",
    name: "Adventure",
    description: "Story-driven exploration games",
    color: "#44ff44",
    icon: "map",
  },
  RPG: {
    id: "rpg",
    name: "RPG",
    description: "Role-playing games with character progression",
    color: "#4444ff",
    icon: "shield",
  },
  MMORPG: {
    id: "mmorpg",
    name: "MMORPG",
    description: "Massive multiplayer online role-playing games",
    color: "#ff44ff",
    icon: "people",
  },
  FPS: {
    id: "fps",
    name: "FPS",
    description: "First-person shooter games",
    color: "#ff8800",
    icon: "locate",
  },
  STRATEGY: {
    id: "strategy",
    name: "Strategy",
    description: "Tactical and strategic thinking games",
    color: "#8800ff",
    icon: "extension-puzzle",
  },
  SIMULATION: {
    id: "simulation",
    name: "Simulation",
    description: "Real-world activity simulation games",
    color: "#00ff88",
    icon: "construct",
  },
  RACING: {
    id: "racing",
    name: "Racing",
    description: "High-speed vehicle racing games",
    color: "#ffff00",
    icon: "car-sport",
  },
  SPORTS: {
    id: "sports",
    name: "Sports",
    description: "Athletic and sports simulation games",
    color: "#ff6600",
    icon: "football",
  },
  FIGHTING: {
    id: "fighting",
    name: "Fighting",
    description: "Combat-focused competitive games",
    color: "#cc0000",
    icon: "hand-right",
  },
  PUZZLE: {
    id: "puzzle",
    name: "Puzzle",
    description: "Brain teasers and logical challenges",
    color: "#00ccff",
    icon: "grid",
  },
  PLATFORMER: {
    id: "platformer",
    name: "Platformer",
    description: "Jump and run adventure games",
    color: "#cc8800",
    icon: "trending-up",
  },
  HORROR: {
    id: "horror",
    name: "Horror",
    description: "Scary and suspenseful games",
    color: "#330033",
    icon: "skull",
  },
  BATTLE_ROYALE: {
    id: "battle_royale",
    name: "Battle Royale",
    description: "Last-player-standing competitive games",
    color: "#ff0088",
    icon: "trophy",
  },
  MOBA: {
    id: "moba",
    name: "MOBA",
    description: "Multiplayer online battle arena games",
    color: "#8800cc",
    icon: "git-network",
  },
  SANDBOX: {
    id: "sandbox",
    name: "Sandbox",
    description: "Open-world creative building games",
    color: "#88cc00",
    icon: "cube",
  },
  SURVIVAL: {
    id: "survival",
    name: "Survival",
    description: "Resource management and survival games",
    color: "#666600",
    icon: "leaf",
  },
  ROGUELIKE: {
    id: "roguelike",
    name: "Roguelike",
    description: "Procedurally generated dungeon crawlers",
    color: "#cc6600",
    icon: "refresh",
  },
  CARD_GAMES: {
    id: "card_games",
    name: "Card Games",
    description: "Digital card and deck-building games",
    color: "#0066cc",
    icon: "card",
  },
  INDIE: {
    id: "indie",
    name: "Indie",
    description: "Independent developer games",
    color: "#cc00cc",
    icon: "diamond",
  },
  CASUAL: {
    id: "casual",
    name: "Casual",
    description: "Easy-to-play relaxing games",
    color: "#00cc66",
    icon: "happy",
  },
  RETRO: {
    id: "retro",
    name: "Retro",
    description: "Classic and vintage-style games",
    color: "#cc6666",
    icon: "game-controller",
  },
  VR: {
    id: "vr",
    name: "VR",
    description: "Virtual reality immersive games",
    color: "#6600ff",
    icon: "eye",
  },
  MOBILE: {
    id: "mobile",
    name: "Mobile",
    description: "Mobile and touch-screen games",
    color: "#ff6666",
    icon: "phone-portrait",
  },
};

// Gaming Genre Categories for better organization
export const GAMING_GENRE_CATEGORIES = {
  CORE: ["action", "adventure", "rpg", "strategy", "simulation"],
  COMPETITIVE: ["fps", "fighting", "battle_royale", "moba", "sports"],
  CREATIVE: ["sandbox", "simulation", "puzzle", "indie"],
  SOCIAL: ["mmorpg", "moba", "card_games", "casual"],
  SPECIALTY: ["horror", "roguelike", "vr", "retro", "mobile"],
};

// Gaming Interest Presets for quick selection
export const GAMING_INTEREST_PRESETS = {
  CASUAL_GAMER: {
    id: "casual_gamer",
    name: "Casual Gamer",
    description: "Relaxed gaming sessions",
    genres: ["casual", "puzzle", "mobile", "simulation"],
  },
  COMPETITIVE_PLAYER: {
    id: "competitive_player",
    name: "Competitive Player",
    description: "Loves competition and esports",
    genres: ["fps", "moba", "battle_royale", "fighting"],
  },
  STORY_LOVER: {
    id: "story_lover",
    name: "Story Lover",
    description: "Enjoys narrative-driven games",
    genres: ["rpg", "adventure", "indie", "horror"],
  },
  SOCIAL_GAMER: {
    id: "social_gamer",
    name: "Social Gamer",
    description: "Prefers multiplayer experiences",
    genres: ["mmorpg", "moba", "sports", "card_games"],
  },
  CREATIVE_BUILDER: {
    id: "creative_builder",
    name: "Creative Builder",
    description: "Loves creating and building",
    genres: ["sandbox", "simulation", "strategy", "indie"],
  },
  HARDCORE_GAMER: {
    id: "hardcore_gamer",
    name: "Hardcore Gamer",
    description: "Enjoys challenging experiences",
    genres: ["roguelike", "survival", "strategy", "horror"],
  },
};

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  GAMING_TAG: /^[a-zA-Z0-9_#-]{3,25}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
};

// AI Model Configuration
export const AI_CONFIG = {
  OPENAI: {
    MODEL: "gpt-4-turbo-preview",
    MAX_TOKENS: 150,
    TEMPERATURE: 0.7,
  },

  CONTENT_GENERATION: {
    MAX_LENGTH: 280, // Twitter-like limit
    MIN_LENGTH: 10,
    GAMING_CONTEXT_BOOST: 1.2,
  },

  PERSONALIZATION: {
    LEARNING_RATE: 0.1,
    MIN_INTERACTIONS: 5,
    DECAY_FACTOR: 0.95,
  },
};

// User Experience Configuration
export const UX_CONFIG = {
  // Database query limits (user-configurable)
  DEFAULT_MESSAGE_LIMIT: 50,
  DEFAULT_CONVERSATION_LIMIT: 20,
  DEFAULT_FRIEND_LIMIT: 100,
  DEFAULT_SEARCH_LIMIT: 20,
  
  // Batch processing sizes
  DEFAULT_BATCH_SIZE: 10,
  MAX_BATCH_SIZE: 30,
  
  // User fallback values
  DEFAULT_DISPLAY_NAME: "SnapConnect User",
  DEFAULT_USERNAME_PREFIX: "@user",
  DEFAULT_BIO: "Welcome to SnapConnect!",
  UNKNOWN_USER_LABEL: "Unknown User",
  
  // Profile defaults
  DEFAULT_PROFILE_STATS: {
    victories: 0,
    highlights: 0,
    friends: 0,
    achievements: 0,
  },
  
  // Loading states
  LOADING_TEXT: "Loading...",
  LOADING_USERNAME: "@loading...",
  
  // Timer defaults
  DEFAULT_STORY_DURATION: 5000, // 5 seconds
  DEFAULT_SNAP_TIMER: 5, // 5 seconds
  STORY_EXPIRY_HOURS: 24,
};

// Export all constants as a single object for convenience
export const CONSTANTS = {
  APP_CONFIG,
  API_CONFIG,
  GAMING_PLATFORMS,
  MESSAGE_TYPES,
  GAMING_CONTEXTS,
  AI_FEATURES,
  STORAGE_KEYS,
  ERROR_TYPES,
  FEATURE_FLAGS,
  UI_CONSTANTS,
  ACHIEVEMENT_TIERS,
  REGEX_PATTERNS,
  AI_CONFIG,
  UX_CONFIG,
  GAMING_GENRES,
  GAMING_GENRE_CATEGORIES,
  GAMING_INTEREST_PRESETS,
};

export default CONSTANTS;

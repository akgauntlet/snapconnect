/**
 * @file common.ts
 * @description Common TypeScript type definitions for SnapConnect application.
 * Provides shared types across the entire application with gaming-specific extensions.
 *
 * @author SnapConnect Team
 * @created 2024-01-15
 * @modified 2024-01-20
 *
 * @dependencies
 * - None (Pure type definitions)
 *
 * @usage
 * import type { User, APIResponse, GamingContext } from '@/types/common';
 *
 * @ai_context
 * Types include AI-enhanced features and gaming platform integrations.
 * Extensible for future AI capabilities and gaming context awareness.
 */

// Base utility types
export type ID = string;
export type Timestamp = number;
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONObject
  | JSONArray;
export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = JSONValue[];

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  timestamp: Timestamp;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// User types
export interface User {
  id: ID;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  gamingProfile?: GamingProfile;
  preferences: UserPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isOnline: boolean;
  lastSeen: Timestamp;
}

export interface GamingProfile {
  platforms: GamingPlatformConnection[];
  currentGame?: CurrentGame;
  achievements: Achievement[];
  stats: GamingStats;
  preferences: GamingPreferences;
}

export interface GamingPlatformConnection {
  platform: "steam" | "discord" | "xbox" | "playstation" | "twitch";
  platformId: string;
  username: string;
  isVerified: boolean;
  isPublic: boolean;
  connectedAt: Timestamp;
}

export interface CurrentGame {
  name: string;
  platform: string;
  gameId: string;
  status: "playing" | "streaming" | "idle";
  startedAt: Timestamp;
  metadata?: Record<string, any>;
}

export interface Achievement {
  id: ID;
  title: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  unlockedAt: Timestamp;
  points: number;
}

export interface GamingStats {
  totalPlaytime: number; // milliseconds
  favoriteGames: string[];
  weeklyActivity: number[];
  platformDistribution: Record<string, number>;
}

export interface GamingPreferences {
  showOnlineStatus: boolean;
  shareCurrentGame: boolean;
  allowGameInvites: boolean;
  preferredPlatforms: string[];
  gamingHours: { start: number; end: number };
}

// User preferences
export interface UserPreferences {
  theme: "dark" | "light" | "auto";
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  gaming: GamingPreferences;
  ai: AIPreferences;
}

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  gameInvites: boolean;
  friendRequests: boolean;
  achievements: boolean;
  aiSuggestions: boolean;
}

export interface PrivacyPreferences {
  profileVisibility: "public" | "friends" | "private";
  shareGamingActivity: boolean;
  allowFriendRequests: boolean;
  showOnlineStatus: boolean;
}

// AI-related types
export interface AIPreferences {
  enableContentGeneration: boolean;
  enableSmartReplies: boolean;
  enableGamingInsights: boolean;
  personalizationLevel: "minimal" | "moderate" | "aggressive";
  dataSharing: "none" | "anonymous" | "full";
}

export interface AIContext {
  userId: ID;
  currentGame?: CurrentGame;
  recentActivity: ActivityData[];
  preferences: AIPreferences;
  gamingContext: GamingContext;
}

export interface ActivityData {
  type: "message" | "game_session" | "social_interaction";
  timestamp: Timestamp;
  data: Record<string, any>;
}

// Gaming context types
export type GamingContext =
  | "playing"
  | "streaming"
  | "watching"
  | "idle"
  | "offline";

// Message types
export interface Message {
  id: ID;
  type: MessageType;
  content: MessageContent;
  sender: User;
  recipients: User[];
  timestamp: Timestamp;
  expiresAt?: Timestamp;
  isRead: boolean;
  reactions?: Reaction[];
  gamingContext?: GamingContext;
  aiGenerated?: boolean;
}

export type MessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "gaming_clip"
  | "achievement"
  | "gaming_invite"
  | "poll";

export interface MessageContent {
  text?: string;
  media?: MediaContent;
  gaming?: GamingContent;
  poll?: PollContent;
  metadata?: Record<string, any>;
}

export interface MediaContent {
  url: string;
  thumbnail?: string;
  duration?: number; // for video/audio
  size: number;
  mimeType: string;
  dimensions?: { width: number; height: number };
}

export interface GamingContent {
  gameId: string;
  gameName: string;
  platform: string;
  contentType: "clip" | "achievement" | "invite" | "stats";
  data: Record<string, any>;
}

export interface PollContent {
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  expiresAt: Timestamp;
}

export interface PollOption {
  id: ID;
  text: string;
  votes: number;
  voters?: ID[];
}

export interface Reaction {
  emoji: string;
  users: ID[];
  count: number;
}

// Navigation types
export interface NavigationState {
  currentRoute: string;
  previousRoute?: string;
  params?: Record<string, any>;
}

// Theme types
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  error: string;
  text: string;
  textSecondary: string;
}

export interface ThemeConfig {
  colors: ThemeColors;
  spacing: Record<string, number>;
  borderRadius: Record<string, number>;
  animations: Record<string, number>;
}

// Error types
export interface AppError extends Error {
  code: string;
  type: "network" | "auth" | "validation" | "gaming" | "ai" | "unknown";
  recoverable: boolean;
  metadata?: Record<string, any>;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  style?: any;
  testID?: string;
}

// Form types
export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FormState<T = Record<string, any>> {
  data: T;
  validation: FormValidation;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Utility types for gaming
export type GamePlatform =
  | "steam"
  | "discord"
  | "xbox"
  | "playstation"
  | "twitch";
export type UserStatus = "online" | "away" | "busy" | "invisible" | "offline";
export type MessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

// Export a collection type for convenience
export interface AppTypes {
  User: User;
  Message: Message;
  GamingProfile: GamingProfile;
  AIContext: AIContext;
  APIResponse: APIResponse;
  AppError: AppError;
}

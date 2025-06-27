/**
 * @file index.ts
 * @description Central export file for common/base components in SnapConnect.
 * Provides easy imports for all gaming-themed base components.
 *
 * @author SnapConnect Team
 * @created 2024-01-25
 *
 * @usage
 * import { CyberButton, GameCard, GamingInput } from '@/components/common';
 *
 * @ai_context
 * Centralized component exports for consistent gaming UI elements.
 * All components follow cyber gaming design system.
 */

// Base Components
export { CyberButton } from "./CyberButton";
export type {
    CyberButtonProps,
    CyberButtonSize,
    CyberButtonVariant
} from "./CyberButton";

export { GameCard } from "./GameCard";
export type {
    GameCardProps,
    GameCardRarity,
    GameCardStatus,
    GameCardType
} from "./GameCard";

export { GamingInput } from "./GamingInput";
export type { GamingInputProps, GamingInputVariant } from "./GamingInput";

export { default as GamingGenreSelector } from "./GamingGenreSelector";

export { LoadingSpinner } from "./LoadingSpinner";
export type {
    LoadingSpinnerProps,
    LoadingSpinnerSize,
    LoadingSpinnerVariant
} from "./LoadingSpinner";

export { IconButton } from "./IconButton";
export type {
    IconButtonProps,
    IconButtonSize,
    IconButtonVariant
} from "./IconButton";

// Utility Components (existing)
export { default as ConversationItem } from "./ConversationItem";
export { default as ConversationStarters } from "./ConversationStarters";
export { AlertManager, customAlert, CustomAlertProvider } from "./CustomAlert";
export { default as IncomingMessagesHeader } from "./IncomingMessagesHeader";
export { default as MediaViewer } from "./MediaViewer";
export { default as MessageFriendSelector } from "./MessageFriendSelector";
export { default as NotificationBadge } from "./NotificationBadge";
export { default as RecipientSelector } from "./RecipientSelector";
export { default as StoryGridItem } from "./StoryGridItem";
export { default as StoryRingItem } from "./StoryRingItem";
export { default as StoryStatsModal } from "./StoryStatsModal";
export { default as StoryViewer } from "./StoryViewer";

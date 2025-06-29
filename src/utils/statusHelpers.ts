/**
 * @file statusHelpers.ts
 * @description Shared utility functions for status message display and handling.
 * Provides consistent status message rendering and availability color management.
 *
 * @author SnapConnect Team
 * @created 2024-01-25
 *
 * @usage
 * import { getAvailabilityColor, getAvailabilityLabel, formatStatusMessage } from '@/utils/statusHelpers';
 */

// Status message types
export type AvailabilityStatus = 'available' | 'busy' | 'gaming' | 'afk';

export interface StatusMessage {
  text?: string;
  emoji?: string;
  gameContext?: string;
  availability?: AvailabilityStatus;
  expiresAt?: Date;
  updatedAt?: Date;
}

/**
 * Get availability status color
 * @param {AvailabilityStatus} availability - Availability status
 * @returns {string} Color hex code
 */
export function getAvailabilityColor(availability?: AvailabilityStatus): string {
  switch (availability) {
    case 'available':
      return '#10B981'; // Green
    case 'busy':
      return '#EF4444'; // Red
    case 'gaming':
      return '#8B5CF6'; // Purple
    case 'afk':
      return '#6B7280'; // Gray
    default:
      return '#10B981'; // Default to available green
  }
}

/**
 * Get availability status label
 * @param {AvailabilityStatus} availability - Availability status
 * @returns {string} Human-readable label
 */
export function getAvailabilityLabel(availability?: AvailabilityStatus): string {
  switch (availability) {
    case 'available':
      return 'Available';
    case 'busy':
      return 'Busy';
    case 'gaming':
      return 'Gaming';
    case 'afk':
      return 'Away';
    default:
      return 'Available';
  }
}

/**
 * Format status message for display
 * @param {StatusMessage} statusMessage - Status message object
 * @returns {string} Formatted status text
 */
export function formatStatusMessage(statusMessage?: StatusMessage): string {
  if (!statusMessage || (!statusMessage.text && !statusMessage.emoji)) {
    return '';
  }

  let formatted = '';
  
  if (statusMessage.emoji) {
    formatted += `${statusMessage.emoji} `;
  }
  
  if (statusMessage.text) {
    formatted += statusMessage.text;
  }

  return formatted.trim();
}

/**
 * Check if status message has expired
 * @param {StatusMessage} statusMessage - Status message object
 * @returns {boolean} True if expired
 */
export function isStatusExpired(statusMessage?: StatusMessage): boolean {
  if (!statusMessage?.expiresAt) {
    return false;
  }

  return new Date() > new Date(statusMessage.expiresAt);
}

/**
 * Check if status message should be displayed
 * @param {StatusMessage} statusMessage - Status message object
 * @returns {boolean} True if should display
 */
export function shouldDisplayStatus(statusMessage?: StatusMessage): boolean {
  if (!statusMessage) {
    return false;
  }

  // Don't display if expired
  if (isStatusExpired(statusMessage)) {
    return false;
  }

  // Must have text or emoji to display
  return !!(statusMessage.text || statusMessage.emoji);
}

/**
 * Get status message display text with context
 * @param {StatusMessage} statusMessage - Status message object
 * @returns {object} Formatted display data
 */
export function getStatusDisplayData(statusMessage?: StatusMessage) {
  if (!shouldDisplayStatus(statusMessage)) {
    return null;
  }

  return {
    text: formatStatusMessage(statusMessage),
    availability: statusMessage!.availability || 'available',
    color: getAvailabilityColor(statusMessage!.availability),
    label: getAvailabilityLabel(statusMessage!.availability),
    gameContext: statusMessage!.gameContext,
  };
} 

/**
 * @file index.ts
 * @description Export barrel for profile customization components.
 * Provides centralized access to all profile-related UI components.
 *
 * @author SnapConnect Team
 * @created 2024-01-26
 * @modified 2024-01-26
 *
 * @usage
 * import { AvatarSelector, BannerUploader, AchievementShowcase } from '@/components/profile';
 *
 * @ai_context
 * Profile components with AI-enhanced customization and personalization features.
 * Smart component suggestions and automated profile optimization capabilities.
 */

// Avatar components
export { default as AvatarSelector } from './AvatarSelector';
export { default as AvatarUploader } from './AvatarUploader';

// Banner components
export { default as BannerSelector } from './BannerSelector';
export { default as BannerUploader } from './BannerUploader';

// Status message components
export { default as StatusMessageEditor } from './StatusMessageEditor';

// Achievement components
export { default as AchievementShowcase } from './AchievementShowcase';

// Preview components
export { default as ProfilePreview } from './ProfilePreview';

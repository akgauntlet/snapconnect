/**
 * @file mediaService.js
 * @description Media service for handling image uploads, compression, and avatar management.
 * Provides optimized image handling for profile customization with gaming-focused UX.
 *
 * @author SnapConnect Team
 * @created 2024-01-26
 *
 * @dependencies
 * - expo-image-picker: Image selection from gallery/camera
 * - expo-image-manipulator: Image compression and resizing
 * - firebase/storage: Cloud storage for images
 *
 * @usage
 * import { mediaService } from '@/services/media/mediaService';
 *
 * @ai_context
 * AI-powered image optimization and content moderation for profile photos.
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { getFirebaseStorage } from '../../config/firebase';

/**
 * Media service class for profile image management
 */
class MediaService {
  constructor() {
    this.storage = null;
    // Supported image formats
    this.supportedFormats = ['jpg', 'jpeg', 'png', 'webp'];
    // Maximum file size (5MB)
    this.maxFileSize = 5 * 1024 * 1024;
  }

  /**
   * Get Firebase Storage instance
   * @returns {object} Firebase Storage instance
   */
  getStorage() {
    if (!this.storage) {
      this.storage = getFirebaseStorage();
    }
    return this.storage;
  }

  /**
   * Request camera and media library permissions
   * @returns {Promise<boolean>} True if permissions granted
   */
  async requestPermissions() {
    try {
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      // Request media library permissions
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      const hasPermissions = 
        cameraPermission.status === 'granted' && 
        mediaPermission.status === 'granted';

      if (!hasPermissions) {
        console.warn('⚠️ Camera or media library permissions not granted');
      }

      return hasPermissions;
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      return false;
    }
  }

  /**
   * Select image from gallery with optimized settings
   * @returns {Promise<Object|null>} Selected image result or null
   */
  async selectImageFromGallery() {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Media library permissions required');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for avatars
        quality: 0.8,
        allowsMultipleSelection: false,
        exif: false, // Remove EXIF data for privacy
      });

      if (result.canceled) {
        return null;
      }

      return result.assets[0];
    } catch (error) {
      console.error('❌ Image selection failed:', error);
      throw error;
    }
  }

  /**
   * Capture image from camera with optimized settings
   * @returns {Promise<Object|null>} Captured image result or null
   */
  async captureImageFromCamera() {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Camera permissions required');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for avatars
        quality: 0.8,
        exif: false, // Remove EXIF data for privacy
      });

      if (result.canceled) {
        return null;
      }

      return result.assets[0];
    } catch (error) {
      console.error('❌ Image capture failed:', error);
      throw error;
    }
  }

  /**
   * Compress and resize image for different avatar sizes
   * @param {string} imageUri - Local image URI
   * @param {Object} options - Compression options
   * @returns {Promise<Object>} Object with different sized images
   */
  async processAvatarImage(imageUri, options = {}) {
    try {
      const {
        quality = 0.8,
        generateSizes = true,
      } = options;

      const baseResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: 256,
              height: 256,
            },
          },
        ],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false,
        }
      );

      if (!generateSizes) {
        return { 
          main: baseResult,
          sizes: { '256': baseResult }
        };
      }

      // Generate different sizes for performance optimization
      const sizes = {
        '256': baseResult, // Profile screens
        '96': null,        // Medium size
        '48': null,        // Small size
        '24': null,        // Tiny size
      };

      // Generate smaller sizes
      const sizePromises = [
        { size: 96, key: '96' },
        { size: 48, key: '48' },
        { size: 24, key: '24' },
      ].map(async ({ size, key }) => {
        const result = await ImageManipulator.manipulateAsync(
          imageUri,
          [
            {
              resize: {
                width: size,
                height: size,
              },
            },
          ],
          {
            compress: quality,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: false,
          }
        );
        return { key, result };
      });

      const sizeResults = await Promise.all(sizePromises);
      sizeResults.forEach(({ key, result }) => {
        sizes[key] = result;
      });

      return {
        main: baseResult,
        sizes,
      };
    } catch (error) {
      console.error('❌ Image processing failed:', error);
      throw error;
    }
  }

  /**
   * Upload avatar image to Firebase Storage
   * @param {string} userId - User ID
   * @param {Object} processedImage - Processed image data
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload result with URLs
   */
  async uploadAvatar(userId, processedImage, onProgress) {
    try {
      const storage = this.getStorage();
      const timestamp = Date.now();
      
      // Upload all sizes
      const uploadPromises = Object.entries(processedImage.sizes).map(
        async ([size, imageData]) => {
          const fileName = `avatar_${size}_${timestamp}.jpg`;
          const storagePath = `avatars/${userId}/${fileName}`;
          
          // Convert to blob for upload
          const response = await fetch(imageData.uri);
          const blob = await response.blob();
          
          // Create storage reference
          const storageRef = storage.ref(storagePath);
          
          // Upload with progress tracking
          const uploadTask = storageRef.put(blob);
          
          return new Promise((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.(progress, size);
              },
              (error) => {
                console.error(`❌ Upload failed for size ${size}:`, error);
                reject(error);
              },
              async () => {
                try {
                  const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                  resolve({ size, url: downloadURL, path: storagePath });
                } catch (error) {
                  reject(error);
                }
              }
            );
          });
        }
      );

      const uploadResults = await Promise.all(uploadPromises);
      
      // Organize results by size
      const urls = {};
      const paths = {};
      
      uploadResults.forEach(({ size, url, path }) => {
        urls[size] = url;
        paths[size] = path;
      });

      return {
        urls,
        paths,
        mainUrl: urls['256'], // Primary avatar URL
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Avatar upload failed:', error);
      throw error;
    }
  }

  /**
   * Delete avatar from Firebase Storage
   * @param {string} userId - User ID
   * @param {Object} avatarPaths - Object with storage paths for different sizes
   * @returns {Promise<void>}
   */
  async deleteAvatar(userId, avatarPaths) {
    try {
      const storage = this.getStorage();
      
      const deletePromises = Object.values(avatarPaths).map(async (path) => {
        try {
          const storageRef = storage.ref(path);
          await storageRef.delete();
          console.log(`✅ Deleted avatar: ${path}`);
        } catch (error) {
          console.warn(`⚠️ Failed to delete avatar: ${path}`, error);
          // Don't throw - continue with other deletions
        }
      });

      await Promise.allSettled(deletePromises);
    } catch (error) {
      console.error('❌ Avatar deletion failed:', error);
      throw error;
    }
  }

  /**
   * Validate image file
   * @param {Object} imageAsset - Image asset from picker
   * @returns {Object} Validation result
   */
  validateImage(imageAsset) {
    const errors = [];

    // Check file size
    if (imageAsset.fileSize && imageAsset.fileSize > this.maxFileSize) {
      errors.push(`File size too large. Maximum size is ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check dimensions
    if (imageAsset.width && imageAsset.height) {
      const minDimension = 100;
      const maxDimension = 4000;
      
      if (imageAsset.width < minDimension || imageAsset.height < minDimension) {
        errors.push(`Image too small. Minimum size is ${minDimension}x${minDimension}px`);
      }
      
      if (imageAsset.width > maxDimension || imageAsset.height > maxDimension) {
        errors.push(`Image too large. Maximum size is ${maxDimension}x${maxDimension}px`);
      }
    }

    // Check format
    if (imageAsset.type && !imageAsset.type.includes('image/')) {
      errors.push('File must be an image');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get optimized avatar URL for specific size
   * @param {Object} avatarData - Avatar data with URLs
   * @param {string} size - Requested size ('24', '48', '96', '256')
   * @returns {string|null} Optimized avatar URL or null
   */
  getOptimizedAvatarUrl(avatarData, size = '256') {
    if (!avatarData || !avatarData.urls) {
      return null;
    }

    // Return requested size or fallback to larger sizes
    const fallbackOrder = ['256', '96', '48', '24'];
    const requestedIndex = fallbackOrder.indexOf(size);
    
    if (requestedIndex === -1) {
      return avatarData.urls['256'] || avatarData.mainUrl || null;
    }

    // Try requested size first, then larger sizes
    for (let i = requestedIndex; i >= 0; i--) {
      const fallbackSize = fallbackOrder[i];
      if (avatarData.urls[fallbackSize]) {
        return avatarData.urls[fallbackSize];
      }
    }

    return avatarData.mainUrl || null;
  }

  /**
   * Process banner image for different sizes and aspect ratios
   * @param {string} imageUri - Local image URI
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Object with different sized banner images
   */
  async processBannerImage(imageUri, options = {}) {
    try {
      const {
        quality = 0.8,
        aspectRatio = '16:9', // '16:9' or '3:1'
        generateSizes = true,
      } = options;

      // Calculate dimensions based on aspect ratio
      const aspectRatios = {
        '16:9': { width: 800, height: 450 },
        '3:1': { width: 900, height: 300 },
      };

      const dimensions = aspectRatios[aspectRatio] || aspectRatios['16:9'];

      const baseResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: dimensions,
          },
        ],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false,
        }
      );

      if (!generateSizes) {
        return { 
          main: baseResult,
          sizes: { 'large': baseResult },
          aspectRatio,
        };
      }

      // Generate different sizes for performance optimization
      const sizes = {
        'large': baseResult,   // Full size for profile
        'medium': null,        // Medium size for previews
        'small': null,         // Small size for thumbnails
      };

      // Generate smaller sizes maintaining aspect ratio
      const ratio = dimensions.width / dimensions.height;
      const sizeConfigs = [
        { width: 400, height: Math.round(400 / ratio), key: 'medium' },
        { width: 200, height: Math.round(200 / ratio), key: 'small' },
      ];

      const sizePromises = sizeConfigs.map(async ({ width, height, key }) => {
        const result = await ImageManipulator.manipulateAsync(
          imageUri,
          [
            {
              resize: { width, height },
            },
          ],
          {
            compress: quality,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: false,
          }
        );
        return { key, result };
      });

      const sizeResults = await Promise.all(sizePromises);
      sizeResults.forEach(({ key, result }) => {
        sizes[key] = result;
      });

      return {
        main: baseResult,
        sizes,
        aspectRatio,
      };
    } catch (error) {
      console.error('❌ Banner processing failed:', error);
      throw error;
    }
  }

  /**
   * Upload banner image to Firebase Storage
   * @param {string} userId - User ID
   * @param {Object} processedBanner - Processed banner data
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload result with URLs
   */
  async uploadBanner(userId, processedBanner, onProgress) {
    try {
      const storage = this.getStorage();
      const timestamp = Date.now();
      
      // Upload all sizes
      const uploadPromises = Object.entries(processedBanner.sizes).map(
        async ([size, imageData]) => {
          const fileName = `banner_${size}_${timestamp}.jpg`;
          const storagePath = `banners/${userId}/${fileName}`;
          
          // Convert to blob for upload
          const response = await fetch(imageData.uri);
          const blob = await response.blob();
          
          // Create storage reference
          const storageRef = storage.ref(storagePath);
          
          // Upload with progress tracking
          const uploadTask = storageRef.put(blob);
          
          return new Promise((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.(progress, size);
              },
              (error) => {
                console.error(`❌ Banner upload failed for size ${size}:`, error);
                reject(error);
              },
              async () => {
                try {
                  const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                  resolve({ size, url: downloadURL, path: storagePath });
                } catch (error) {
                  reject(error);
                }
              }
            );
          });
        }
      );

      const uploadResults = await Promise.all(uploadPromises);
      
      // Organize results by size
      const urls = {};
      const paths = {};
      
      uploadResults.forEach(({ size, url, path }) => {
        urls[size] = url;
        paths[size] = path;
      });

      return {
        urls,
        paths,
        mainUrl: urls['large'], // Primary banner URL
        aspectRatio: processedBanner.aspectRatio,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Banner upload failed:', error);
      throw error;
    }
  }

  /**
   * Delete banner from Firebase Storage
   * @param {string} userId - User ID
   * @param {Object} bannerPaths - Object with storage paths for different sizes
   * @returns {Promise<void>}
   */
  async deleteBanner(userId, bannerPaths) {
    try {
      const storage = this.getStorage();
      
      const deletePromises = Object.values(bannerPaths).map(async (path) => {
        try {
          const storageRef = storage.ref(path);
          await storageRef.delete();
          console.log(`✅ Deleted banner: ${path}`);
        } catch (error) {
          console.warn(`⚠️ Failed to delete banner: ${path}`, error);
          // Don't throw - continue with other deletions
        }
      });

      await Promise.allSettled(deletePromises);
    } catch (error) {
      console.error('❌ Banner deletion failed:', error);
      throw error;
    }
  }

  /**
   * Get optimized banner URL for specific size
   * @param {Object} bannerData - Banner data with URLs
   * @param {string} size - Requested size ('small', 'medium', 'large')
   * @returns {string|null} Optimized banner URL or null
   */
  getOptimizedBannerUrl(bannerData, size = 'large') {
    if (!bannerData || !bannerData.urls) {
      return null;
    }

    // Return requested size or fallback to larger sizes
    const fallbackOrder = ['large', 'medium', 'small'];
    const requestedIndex = fallbackOrder.indexOf(size);
    
    if (requestedIndex === -1) {
      return bannerData.urls['large'] || bannerData.mainUrl || null;
    }

    // Try requested size first, then larger sizes
    for (let i = requestedIndex; i >= 0; i--) {
      const fallbackSize = fallbackOrder[i];
      if (bannerData.urls[fallbackSize]) {
        return bannerData.urls[fallbackSize];
      }
    }

    return bannerData.mainUrl || null;
  }

  /**
   * Validate banner image file
   * @param {Object} imageAsset - Image asset from picker
   * @returns {Object} Validation result
   */
  validateBannerImage(imageAsset) {
    const errors = [];

    // Check file size (larger limit for banners)
    const maxBannerSize = 8 * 1024 * 1024; // 8MB for banners
    if (imageAsset.fileSize && imageAsset.fileSize > maxBannerSize) {
      errors.push(`File size too large. Maximum size is ${maxBannerSize / (1024 * 1024)}MB`);
    }

    // Check dimensions for landscape orientation
    if (imageAsset.width && imageAsset.height) {
      const minWidth = 300;
      const minHeight = 150;
      const maxDimension = 5000;
      
      if (imageAsset.width < minWidth || imageAsset.height < minHeight) {
        errors.push(`Image too small. Minimum size is ${minWidth}x${minHeight}px`);
      }
      
      if (imageAsset.width > maxDimension || imageAsset.height > maxDimension) {
        errors.push(`Image too large. Maximum size is ${maxDimension}x${maxDimension}px`);
      }

      // Check aspect ratio is landscape
      const aspectRatio = imageAsset.width / imageAsset.height;
      if (aspectRatio < 1.5) {
        errors.push('Banner should be landscape orientation (width > height)');
      }
    }

    // Check format
    if (imageAsset.type && !imageAsset.type.includes('image/')) {
      errors.push('File must be an image');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const mediaService = new MediaService();
export default mediaService; 

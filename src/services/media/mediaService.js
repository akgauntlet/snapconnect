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
import { Platform } from 'react-native';
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
      // On web, we don't need explicit permissions
      if (Platform.OS === 'web') {
        return true;
      }

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
   * Select image from gallery with web compatibility
   * @param {Object} options - Selection options (aspectRatio, allowsEditing, etc.)
   * @returns {Promise<Object|null>} Selected image result or null
   */
  async selectImageFromGallery(options = {}) {
    try {
      if (Platform.OS === 'web') {
        return await this.selectImageFromGalleryWeb();
      }

      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Media library permissions required');
      }

      const {
        aspectRatio = [1, 1], // Default to square for avatars
        allowsEditing = true,
        quality = 0.8,
      } = options;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect: aspectRatio,
        quality,
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
   * Select avatar image from gallery (square optimized)
   * @returns {Promise<Object|null>} Selected image result or null
   */
  async selectAvatarFromGallery() {
    return this.selectImageFromGallery({
      aspectRatio: [1, 1], // Square aspect ratio for avatars
      allowsEditing: true,
      quality: 0.8,
    });
  }

  /**
   * Web-specific image selection using HTML input
   * @returns {Promise<Object|null>} Selected image result or null
   */
  async selectImageFromGalleryWeb() {
    return new Promise((resolve, reject) => {
      try {
        // Create file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = false;
        
        input.onchange = async (event) => {
          try {
            const file = event.target.files[0];
            if (!file) {
              resolve(null);
              return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
              throw new Error('Please select an image file');
            }

            // Validate file size
            if (file.size > this.maxFileSize) {
              throw new Error(`File size too large. Maximum size is ${this.maxFileSize / (1024 * 1024)}MB`);
            }

            // Create object URL for the file
            const uri = URL.createObjectURL(file);
            
            // Create an image element to get dimensions
            const img = new Image();
            img.onload = () => {
              const imageAsset = {
                uri,
                width: img.width,
                height: img.height,
                type: file.type,
                fileSize: file.size,
                fileName: file.name,
                webFile: file, // Store original file for web processing
                isWebFile: true, // Flag to identify web files for cleanup
              };
              
              resolve(imageAsset);
            };
            
            img.onerror = () => {
              URL.revokeObjectURL(uri);
              reject(new Error('Failed to load selected image'));
            };
            
            img.src = uri;
          } catch (error) {
            reject(error);
          }
        };

        input.oncancel = () => {
          resolve(null);
        };

        // Trigger file selection
        input.click();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Capture image from camera with web compatibility
   * @param {Object} options - Capture options (aspectRatio, allowsEditing, etc.)
   * @returns {Promise<Object|null>} Captured image result or null
   */
  async captureImageFromCamera(options = {}) {
    try {
      if (Platform.OS === 'web') {
        return await this.captureImageFromCameraWeb();
      }

      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Camera permissions required');
      }

      const {
        aspectRatio = [1, 1], // Default to square for avatars
        allowsEditing = true,
        quality = 0.8,
      } = options;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect: aspectRatio,
        quality,
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
   * Capture avatar image from camera (square optimized)
   * @returns {Promise<Object|null>} Captured image result or null
   */
  async captureAvatarFromCamera() {
    return this.captureImageFromCamera({
      aspectRatio: [1, 1], // Square aspect ratio for avatars
      allowsEditing: true,
      quality: 0.8,
    });
  }

  /**
   * Web-specific camera capture using getUserMedia
   * @returns {Promise<Object|null>} Captured image result or null
   */
  async captureImageFromCameraWeb() {
    return new Promise((resolve, reject) => {
      try {
        // For web, we'll fall back to file selection since camera capture
        // requires a more complex implementation with getUserMedia
        console.warn('⚠️ Camera capture on web - falling back to file selection');
        this.selectImageFromGalleryWeb().then(resolve).catch(reject);
      } catch (error) {
        reject(new Error('Camera capture not supported on web. Please select an image from your files.'));
      }
    });
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
      return avatarData.urls['256'] || null;
    }

    // Try requested size first, then larger sizes
    for (let i = requestedIndex; i >= 0; i--) {
      const fallbackSize = fallbackOrder[i];
      if (avatarData.urls[fallbackSize]) {
        return avatarData.urls[fallbackSize];
      }
    }

    return avatarData.urls['256'] || null;
  }

  /**
   * Clean up web object URLs to prevent memory leaks
   * @param {Object} imageAsset - Image asset that may contain web object URLs
   */
  cleanupWebObjectUrl(imageAsset) {
    if (Platform.OS === 'web' && imageAsset && imageAsset.isWebFile && imageAsset.uri) {
      try {
        URL.revokeObjectURL(imageAsset.uri);
        console.log('✅ Cleaned up web object URL');
      } catch (error) {
        console.warn('⚠️ Failed to cleanup web object URL:', error);
      }
    }
  }
}

// Export singleton instance
export const mediaService = new MediaService();
export default mediaService; 

/**
 * @file BannerUploader.tsx
 * @description Banner upload component with image selection, processing and upload.
 * Handles custom banner image upload with landscape optimization and progress tracking.
 *
 * @author SnapConnect Team
 * @created 2024-01-26
 *
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @expo/vector-icons: Icon library
 * - @/services/media: Media service for banner handling
 * - @/services/firebase/authService: Authentication service
 *
 * @usage
 * <BannerUploader
 *   userId={user.uid}
 *   onUploadComplete={handleBannerUpload}
 *   onUploadError={handleError}
 * />
 *
 * @ai_context
 * AI-powered banner optimization and content moderation for profile banners.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { authService } from '../../services/firebase/authService';
import { mediaService } from '../../services/media';
import { useThemeStore } from '../../stores/themeStore';

/**
 * Banner upload component interface
 */
interface BannerUploaderProps {
  userId: string;
  currentBanner?: any;
  onUploadComplete: (bannerData: any) => void;
  onUploadError: (error: string) => void;
  aspectRatio?: '16:9' | '3:1';
  disabled?: boolean;
}

/**
 * Banner uploader component
 *
 * @param {BannerUploaderProps} props - Component props
 * @returns {React.ReactElement} Rendered banner uploader
 *
 * @performance
 * - Optimized image processing for banner dimensions
 * - Efficient upload progress tracking
 * - Smooth user feedback and error handling
 *
 * @ai_integration
 * - Smart banner cropping suggestions
 * - Content moderation for uploaded images
 * - Aesthetic quality assessment
 */
const BannerUploader: React.FC<BannerUploaderProps> = ({
  userId,
  currentBanner,
  onUploadComplete,
  onUploadError,
  aspectRatio = '16:9',
  disabled = false,
}) => {
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Get screen dimensions for responsive banner sizing
  const screenWidth = Dimensions.get('window').width;
  const bannerWidth = screenWidth * 0.9;
  const bannerHeight = aspectRatio === '16:9' ? bannerWidth * 0.5625 : bannerWidth * 0.333;

  /**
   * Handle image selection from gallery
   */
  const handleSelectFromGallery = async () => {
    if (disabled || isUploading) return;

    try {
      const result = await mediaService.selectImageFromGallery();
      if (result) {
        await processSelectedImage(result);
      }
    } catch (error) {
      console.error('❌ Gallery selection failed:', error);
      onUploadError('Failed to select image from gallery');
    }
  };

  /**
   * Handle image capture from camera
   */
  const handleCaptureFromCamera = async () => {
    if (disabled || isUploading) return;

    try {
      const result = await mediaService.captureImageFromCamera();
      if (result) {
        await processSelectedImage(result);
      }
    } catch (error) {
      console.error('❌ Camera capture failed:', error);
      onUploadError('Failed to capture image from camera');
    }
  };

  /**
   * Process selected image for banner upload
   */
  const processSelectedImage = async (imageResult: any) => {
    try {
             // Validate banner image
       const validation = mediaService.validateBannerImage(imageResult) as { isValid: boolean; errors: string[] };
       if (!validation.isValid) {
         onUploadError(validation.errors.join(', '));
         return;
       }

      setSelectedImage(imageResult);
      setPreviewImage(imageResult.uri);
    } catch (error) {
      console.error('❌ Image processing failed:', error);
      onUploadError('Failed to process selected image');
    }
  };

  /**
   * Handle banner upload
   */
  const handleUpload = async () => {
    if (!selectedImage || disabled || isUploading) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Process banner image with specified aspect ratio
      const processedBanner = await mediaService.processBannerImage(
        selectedImage.uri,
        { 
          aspectRatio,
          quality: 0.85,
          generateSizes: true,
        }
      );

      // Upload banner to Firebase Storage
      const uploadResult = await mediaService.uploadBanner(
        userId,
        processedBanner,
        (progress: number, size: string) => {
          // Update progress based on all uploads
          setUploadProgress(Math.min(progress, 95));
        }
      );

             // Update user profile with banner data
       const updatedProfile = await authService.updateProfileBanner(userId, {
         ...uploadResult,
         position: 'center', // Default position
       }) as { profileBanner: any };

       setUploadProgress(100);
       onUploadComplete(updatedProfile.profileBanner);

      // Reset state
      setSelectedImage(null);
      setPreviewImage(null);
      setUploadProgress(0);

    } catch (error) {
      console.error('❌ Banner upload failed:', error);
      onUploadError('Failed to upload banner. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Show image selection options
   */
  const showImageSelectionOptions = () => {
    Alert.alert(
      'Select Banner Image',
      'Choose how you want to add your banner image',
      [
        {
          text: 'Camera',
          onPress: handleCaptureFromCamera,
        },
        {
          text: 'Gallery',
          onPress: handleSelectFromGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  /**
   * Clear selected image
   */
  const clearSelectedImage = () => {
    setSelectedImage(null);
    setPreviewImage(null);
  };

  /**
   * Get current banner URL for display
   */
  const getCurrentBannerUrl = () => {
    if (previewImage) return previewImage;
    if (currentBanner?.urls) {
      return mediaService.getOptimizedBannerUrl(currentBanner, 'medium');
    }
    return currentBanner?.url || null;
  };

  const currentBannerUrl = getCurrentBannerUrl();

  return (
    <View className="w-full">
      {/* Banner Preview Area */}
      <View 
        className="rounded-xl overflow-hidden border-2 border-dashed border-cyber-gray/30 bg-cyber-dark/50"
        style={{ 
          width: bannerWidth,
          height: bannerHeight,
          alignSelf: 'center',
        }}
      >
        {currentBannerUrl ? (
          // Show current/preview banner
          <View className="flex-1 relative">
            <Image
              source={{ uri: currentBannerUrl }}
              className="flex-1"
              style={{ 
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
            
            {/* Overlay for selected image */}
            {previewImage && (
              <View className="absolute inset-0 bg-black/40 justify-center items-center">
                <Text className="text-white font-inter text-sm text-center px-4">
                  Preview - Tap upload to save
                </Text>
              </View>
            )}

            {/* Clear preview button */}
            {previewImage && (
              <TouchableOpacity
                onPress={clearSelectedImage}
                className="absolute top-2 right-2 bg-black/60 rounded-full p-2"
                disabled={isUploading}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          // Show empty state
          <TouchableOpacity
            onPress={showImageSelectionOptions}
            className="flex-1 justify-center items-center"
            disabled={disabled || isUploading}
          >
            <Ionicons 
              name="image-outline" 
              size={48} 
              color={disabled ? '#666' : accentColor} 
            />
            <Text className={`font-inter text-sm mt-2 ${
              disabled ? 'text-white/40' : 'text-cyber-cyan'
            }`}>
              Add Banner Image
            </Text>
            <Text className="text-white/60 font-inter text-xs text-center mt-1 px-4">
              {aspectRatio === '16:9' ? '16:9 aspect ratio recommended' : '3:1 aspect ratio recommended'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Upload Progress */}
      {isUploading && (
        <View className="mt-4 px-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white font-inter text-sm">
              Uploading banner...
            </Text>
            <Text className="text-cyber-cyan font-inter text-sm">
              {Math.round(uploadProgress)}%
            </Text>
          </View>
          <View className="h-2 bg-cyber-gray/20 rounded-full overflow-hidden">
            <View 
              className="h-full bg-cyber-cyan rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View className="mt-4 px-4">
        <View className="flex-row justify-center space-x-3">
          {/* Select Image Button */}
          <TouchableOpacity
            onPress={showImageSelectionOptions}
            className={`flex-1 py-3 px-4 rounded-lg border ${
              disabled || isUploading
                ? 'bg-cyber-gray/20 border-cyber-gray/20'
                : 'bg-cyber-cyan/10 border-cyber-cyan/30'
            }`}
            disabled={disabled || isUploading}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons 
                name="camera-outline" 
                size={18} 
                color={disabled || isUploading ? '#666' : accentColor} 
              />
              <Text className={`ml-2 font-inter font-medium ${
                disabled || isUploading ? 'text-white/40' : 'text-cyber-cyan'
              }`}>
                {currentBannerUrl ? 'Change' : 'Select'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Upload Button */}
          {selectedImage && (
            <TouchableOpacity
              onPress={handleUpload}
              className={`flex-1 py-3 px-4 rounded-lg ${
                isUploading
                  ? 'bg-cyber-gray/20'
                  : 'bg-cyber-cyan'
              }`}
              disabled={isUploading}
            >
              <View className="flex-row items-center justify-center">
                {isUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={18} color="#000" />
                )}
                <Text className={`ml-2 font-inter font-medium ${
                  isUploading ? 'text-white/60' : 'text-black'
                }`}>
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Banner Tips */}
      <View className="mt-4 p-3 bg-cyber-dark/30 rounded-lg mx-4">
        <Text className="text-cyber-cyan font-inter text-sm font-medium mb-1">
          Banner Tips
        </Text>
        <Text className="text-white/70 font-inter text-xs">
          • Use landscape images for best results{'\n'}
          • Minimum size: 300x150px{'\n'}
          • Maximum file size: 8MB{'\n'}
          • Text will overlay on your banner
        </Text>
      </View>
    </View>
  );
};

export default BannerUploader; 

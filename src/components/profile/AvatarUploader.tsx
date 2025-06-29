/**
 * @file AvatarUploader.tsx
 * @description Avatar uploader component with image selection, processing, and upload.
 * Handles camera/gallery selection, image validation, compression, and Firebase upload.
 *
 * @author SnapConnect Team
 * @created 2024-01-26
 *
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - @expo/vector-icons: Icon library
 * - @/services/media: Media service for image handling
 * - @/stores/authStore: Authentication state
 *
 * @usage
 * <AvatarUploader
 *   onUploadComplete={handleUploadComplete}
 *   onCancel={handleCancel}
 * />
 *
 * @ai_context
 * AI-powered image enhancement and automatic cropping optimization.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { mediaService } from '../../services/media';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { showErrorAlert, showSuccessAlert } from '../../utils/alertService';

/**
 * Upload progress interface
 */
interface UploadProgress {
  size: string;
  progress: number;
}

/**
 * Image validation result interface
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Avatar uploader component props
 */
interface AvatarUploaderProps {
  onUploadComplete: (avatarData: any) => void;
  onCancel: () => void;
  visible: boolean;
}

/**
 * Avatar uploader component
 *
 * @param {AvatarUploaderProps} props - Component props
 * @returns {React.ReactElement} Rendered avatar uploader
 *
 * @performance
 * - Optimized image processing with multiple size generation
 * - Progressive upload with real-time progress tracking
 * - Efficient memory management for large images
 *
 * @ai_integration
 * - Smart image cropping suggestions
 * - Automatic image quality optimization
 * - Content-aware image enhancement
 */
const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  onUploadComplete,
  onCancel,
  visible,
}) => {
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const { user } = useAuthStore();

  // Component state
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [processedImage, setProcessedImage] = useState<any>(null);

  /**
   * Handle image selection from gallery
   */
  const handleSelectFromGallery = async () => {
    try {
      setIsProcessing(true);
      
      const result = await mediaService.selectImageFromGallery();
      
      if (result) {
        setSelectedImage(result);
        await processImage(result);
      }
    } catch (error) {
      console.error('❌ Gallery selection failed:', error);
      showErrorAlert(
        (error as Error).message || 'Failed to select image from gallery',
        'Image Selection Failed'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle image capture from camera
   */
  const handleCaptureFromCamera = async () => {
    try {
      setIsProcessing(true);
      
      const result = await mediaService.captureImageFromCamera();
      
      if (result) {
        setSelectedImage(result);
        await processImage(result);
      }
    } catch (error) {
      console.error('❌ Camera capture failed:', error);
      showErrorAlert(
        (error as Error).message || 'Failed to capture image from camera',
        'Camera Capture Failed'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Process selected image for upload
   */
  const processImage = async (imageAsset: any) => {
    try {
      setIsProcessing(true);

      // Validate image
      const validation = mediaService.validateImage(imageAsset) as ValidationResult;
      if (!validation.isValid) {
        throw new Error(validation.errors[0]);
      }

      // Process image with multiple sizes
      const processed = await mediaService.processAvatarImage(imageAsset.uri, {
        quality: 0.8,
        generateSizes: true,
      });

      setProcessedImage(processed);
      console.log('✅ Image processed successfully');
    } catch (error) {
      console.error('❌ Image processing failed:', error);
      showErrorAlert(
        (error as Error).message || 'Failed to process image',
        'Image Processing Failed'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Upload processed image to Firebase
   */
  const handleUpload = async () => {
    if (!processedImage || !user) {
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress([]);

      // Upload with progress tracking
      const uploadResult = await mediaService.uploadAvatar(
        user.uid,
        processedImage,
        (progress: number, size: string) => {
          setUploadProgress(prev => {
            const updated = [...prev];
            const existingIndex = updated.findIndex(p => p.size === size);
            
            if (existingIndex >= 0) {
              updated[existingIndex] = { size, progress };
            } else {
              updated.push({ size, progress });
            }
            
            return updated;
          });
        }
      );

      console.log('✅ Avatar uploaded successfully');
      
      // Update user profile with new avatar
      await useAuthStore.getState().updateAvatar(uploadResult);
      
      showSuccessAlert('Avatar updated successfully!');
      onUploadComplete(uploadResult);
      
      // Reset state
      resetState();
    } catch (error) {
      console.error('❌ Avatar upload failed:', error);
      showErrorAlert(
        (error as Error).message || 'Failed to upload avatar',
        'Upload Failed'
      );
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Reset component state
   */
  const resetState = () => {
    setSelectedImage(null);
    setProcessedImage(null);
    setUploadProgress([]);
    setIsProcessing(false);
    setIsUploading(false);
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    resetState();
    onCancel();
  };

  /**
   * Calculate overall upload progress
   */
  const getOverallProgress = () => {
    if (uploadProgress.length === 0) return 0;
    
    const totalProgress = uploadProgress.reduce((sum, p) => sum + p.progress, 0);
    return Math.round(totalProgress / uploadProgress.length);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={handleCancel}
    >
      <View 
        className="flex-1"
        style={{ backgroundColor: theme.colors.background.primary }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center p-6 border-b border-cyber-gray/20">
          <TouchableOpacity onPress={handleCancel}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          <Text className="text-white font-orbitron text-lg">
            Upload Avatar
          </Text>
          
          {processedImage && !isUploading && (
            <TouchableOpacity
              onPress={handleUpload}
              className="bg-cyber-cyan px-4 py-2 rounded-lg"
            >
              <Text className="text-cyber-black font-inter font-semibold">
                Upload
              </Text>
            </TouchableOpacity>
          )}
          
          {!processedImage && (
            <View className="w-16" />
          )}
        </View>

        {/* Content */}
        <View className="flex-1 p-6">
          {!selectedImage && !isProcessing && (
            <View className="flex-1 justify-center items-center">
              {/* Upload Options */}
              <View className="items-center mb-8">
                <View className="w-32 h-32 bg-cyber-cyan/20 rounded-full justify-center items-center mb-6">
                  <Ionicons name="camera-outline" size={48} color={accentColor} />
                </View>
                
                <Text className="text-white font-inter text-lg font-medium mb-2">
                  Choose Your Avatar
                </Text>
                <Text className="text-white/60 font-inter text-center">
                  Select an image from your gallery or take a new photo
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="w-full max-w-sm space-y-4">
                <TouchableOpacity
                  onPress={handleSelectFromGallery}
                  className="flex-row items-center justify-center bg-cyber-dark border border-cyber-cyan/30 rounded-lg p-4"
                >
                  <Ionicons name="images-outline" size={24} color={accentColor} />
                  <Text className="text-cyber-cyan font-inter font-medium ml-3">
                    Choose from Gallery
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCaptureFromCamera}
                  className="flex-row items-center justify-center bg-cyber-dark border border-cyber-cyan/30 rounded-lg p-4"
                >
                  <Ionicons name="camera-outline" size={24} color={accentColor} />
                  <Text className="text-cyber-cyan font-inter font-medium ml-3">
                    Take Photo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Processing State */}
          {isProcessing && (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={accentColor} />
              <Text className="text-white font-inter mt-4">
                Processing image...
              </Text>
            </View>
          )}

          {/* Image Preview */}
          {processedImage && !isUploading && (
            <View className="flex-1">
              <Text className="text-white font-inter font-medium mb-4">
                Preview
              </Text>
              
              <View className="items-center mb-6">
                <View className="w-48 h-48 rounded-full overflow-hidden border-2 border-cyber-cyan/30">
                  <Image
                    source={{ uri: processedImage.main.uri }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
              </View>

              <View className="bg-cyber-dark border border-cyber-gray/20 rounded-lg p-4">
                <Text className="text-white/60 font-inter text-sm mb-2">
                  Image Details:
                </Text>
                <Text className="text-white font-inter text-sm">
                  • Multiple sizes will be generated for optimization
                </Text>
                <Text className="text-white font-inter text-sm">
                  • Image will be compressed for faster loading
                </Text>
                <Text className="text-white font-inter text-sm">
                  • Square aspect ratio maintained
                </Text>
              </View>
            </View>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <View className="flex-1 justify-center items-center">
              <View className="items-center mb-6">
                <View className="w-24 h-24 bg-cyber-cyan/20 rounded-full justify-center items-center mb-4">
                  <Ionicons name="cloud-upload-outline" size={32} color={accentColor} />
                </View>
                
                <Text className="text-white font-inter text-lg font-medium mb-2">
                  Uploading Avatar
                </Text>
                <Text className="text-white/60 font-inter text-center">
                  {getOverallProgress()}% complete
                </Text>
              </View>

              {/* Progress Details */}
              <View className="w-full max-w-sm">
                {uploadProgress.map((progress) => (
                  <View key={progress.size} className="mb-3">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-white/70 font-inter text-sm">
                        Size {progress.size}px
                      </Text>
                      <Text className="text-white/70 font-inter text-sm">
                        {Math.round(progress.progress)}%
                      </Text>
                    </View>
                    <View className="h-1 bg-cyber-gray/30 rounded-full">
                      <View
                        className="h-full bg-cyber-cyan rounded-full"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default AvatarUploader; 

/**
 * @file CameraScreen.tsx
 * @description Main camera interface for content capture with real-time photo/video sharing.
 * Primary screen of SnapConnect with camera-first design philosophy.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-20
 * 
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - expo-camera: Camera functionality
 * - expo-haptics: Haptic feedback
 * - expo-image-picker: Media library access
 * - @/stores/themeStore: Theme management
 * - @/services/firebase/messagingService: Message sending
 * 
 * @usage
 * Primary interface for capturing photos, videos, and sharing content.
 * 
 * @ai_context
 * Integrates with AI-powered content suggestions and gaming context detection.
 * Supports smart filter recommendations based on content analysis.
 */

import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, FlashMode, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import RecipientSelector from '../../components/common/RecipientSelector';
import { messagingService } from '../../services/firebase/messagingService';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Camera screen component with full photo/video capture and sharing functionality
 * 
 * @returns {React.ReactElement} Rendered camera interface
 * 
 * @performance
 * - Optimized for real-time camera operations
 * - Minimal UI overlay for unobstructed capture experience
 * - Gaming-grade 60fps performance target
 * 
 * @ai_integration
 * - Smart content detection and filter suggestions
 * - Gaming context awareness for appropriate overlays
 * - Real-time AR effects with AI enhancement
 */
const CameraScreen: React.FC = () => {
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const { user } = useAuthStore();
  
  // Camera permissions and state
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  
  // Camera configuration
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  
  // Media handling
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Recipient selector
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);
  
  // Refs
  const cameraRef = useRef<CameraView>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const recordingPromise = useRef<Promise<any> | null>(null);
  const captureButtonScale = useRef(new Animated.Value(1)).current;

  /**
   * Request media library and microphone permissions on component mount
   */
  useEffect(() => {
    requestMediaLibraryPermissions();
    requestAllPermissions();
  }, []);

  /**
   * Debug camera state changes
   */
  useEffect(() => {
    console.log('📷 Camera state changed - Ready:', cameraReady, 'Facing:', facing, 'Flash:', flash);
  }, [cameraReady, facing, flash]);

  /**
   * Request media library permissions
   */
  const requestMediaLibraryPermissions = async () => {
    try {
      const { status: mediaLibraryStatus } = await MediaLibrary.requestPermissionsAsync();
      if (mediaLibraryStatus !== 'granted') {
        console.warn('Media library permission not granted');
      }
    } catch (error) {
      console.error('Media library permission request failed:', error);
    }
  };

  /**
   * Request all necessary permissions
   */
  const requestAllPermissions = async () => {
    try {
      // Request microphone permission for video recording
      if (microphonePermission && !microphonePermission.granted) {
        await requestMicrophonePermission();
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  };

  /**
   * Handle camera ready state with additional delay for stability
   */
  const handleCameraReady = () => {
    // Add a small delay to ensure camera is fully stable
    setTimeout(() => {
      setCameraReady(true);
      setCameraInitialized(true);
      console.log('📷 Camera is ready for capture');
    }, 500);
  };

  /**
   * Force camera re-initialization if needed
   */
  const reinitializeCamera = () => {
    console.log('📷 Reinitializing camera...');
    setCameraReady(false);
    setCameraInitialized(false);
    // The camera will reinitialize when onCameraReady is called again
  };

  /**
   * Toggle camera facing direction
   */
  const toggleCameraFacing = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setFacing(current => current === 'back' ? 'front' : 'back');
    } catch (error) {
      console.error('Toggle camera facing failed:', error);
    }
  };

  /**
   * Toggle flash mode
   */
  const toggleFlash = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setFlash(current => {
        switch (current) {
          case 'off': return 'auto';
          case 'auto': return 'on';
          case 'on': return 'off';
          default: return 'off';
        }
      });
    } catch (error) {
      console.error('Toggle flash failed:', error);
    }
  };

  /**
   * Capture photo with enhanced error handling and debugging
   */
  const takePicture = async () => {
    console.log('📷 Taking picture - Camera ready:', cameraReady, 'Camera ref:', !!cameraRef.current);
    
    if (!cameraRef.current) {
      console.warn('📷 Camera ref not available');
      Alert.alert('Error', 'Camera not available. Please try again.');
      return;
    }
    
    if (!cameraReady) {
      console.warn('📷 Camera not ready');
      Alert.alert('Error', 'Camera is still initializing. Please wait a moment and try again.');
      return;
    }
    
    try {
      setIsProcessing(true);
      console.log('📷 Starting photo capture...');
      
      // Animate capture button
      Animated.sequence([
        Animated.timing(captureButtonScale, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(captureButtonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Small delay to ensure camera is stable
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Take photo with enhanced options
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: false,
        skipProcessing: false,
        exif: false, // Disable EXIF to reduce processing time
        imageType: 'jpg',
      });
      
      console.log('📷 Photo captured:', photo);
      
      if (photo?.uri) {
        console.log('📷 Photo URI received:', photo.uri);
        setCapturedMedia(photo.uri);
        setMediaType('photo');
      } else {
        console.error('📷 No photo URI received');
        Alert.alert('Error', 'Photo capture failed - no image data received.');
      }
    } catch (error) {
      console.error('📷 Photo capture failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('📷 Error details:', error);
      Alert.alert('Error', `Failed to capture photo: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Start video recording
   */
  const startRecording = async () => {
    if (!cameraRef.current || !cameraReady || isRecording) return;

    try {
      console.log('🎬 Starting video recording...');
      const startTime = Date.now();
      setRecordingStartTime(startTime);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start recording timer
      recordingInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Small delay to ensure camera is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Start recording - don't await here!
      recordingPromise.current = cameraRef.current.recordAsync({
        maxDuration: 60, // 60 seconds max
      });
      
      // Handle recording result when it completes
      recordingPromise.current
        .then((video) => {
          console.log('🎬 Recording completed:', video);
          if (video?.uri) {
            setCapturedMedia(video.uri);
            setMediaType('video');
          }
        })
        .catch((error) => {
          console.error('🎬 Recording promise failed:', error);
          if (!error.message.includes('Recording was cancelled')) {
            Alert.alert('Error', 'Video recording failed. Please try again.');
          }
        })
        .finally(() => {
          recordingPromise.current = null;
          setIsRecording(false);
          setRecordingDuration(0);
          if (recordingInterval.current) {
            clearInterval(recordingInterval.current);
            recordingInterval.current = null;
          }
        });
        
    } catch (error) {
      console.error('🎬 Start recording failed:', error);
      setIsRecording(false);
      setRecordingDuration(0);
      setRecordingStartTime(0);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  /**
   * Stop video recording with minimum duration check
   */
  const stopRecording = async () => {
    if (!isRecording || !cameraRef.current) return;

    try {
      const currentTime = Date.now();
      const recordingTime = currentTime - recordingStartTime;
      const minimumRecordingTime = 500; // 500ms minimum
      
      console.log(`🛑 Attempting to stop recording after ${recordingTime}ms`);
      
      // Ensure minimum recording time
      if (recordingTime < minimumRecordingTime) {
        console.log(`🛑 Recording too short (${recordingTime}ms), waiting...`);
        setTimeout(() => {
          if (isRecording) {
            stopRecording();
          }
        }, minimumRecordingTime - recordingTime);
        return;
      }
      
      console.log('🛑 Stopping video recording...');
      
      // Stop recording
      cameraRef.current.stopRecording();
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('🛑 Stop recording failed:', error);
    }
  };

  /**
   * Handle capture button press
   */
  const handleCapturePress = () => {
    takePicture();
  };

  /**
   * Handle capture button long press for video
   */
  const handleCaptureLongPress = () => {
    startRecording();
  };

  /**
   * Handle capture button press out - only stop if recording for minimum time
   */
  const handlePressOut = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  /**
   * Access media library
   */
  const openMediaLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCapturedMedia(asset.uri);
        setMediaType(asset.type === 'video' ? 'video' : 'photo');
      }
    } catch (error) {
      console.error('Media library access failed:', error);
      Alert.alert('Error', 'Failed to access media library.');
    }
  };

  /**
   * Navigate to messages screen
   */
  const handleMessagesPress = () => {
    // TODO: Navigate to messages
    Alert.alert('Coming Soon', 'Messages feature will be implemented next!');
  };

  /**
   * Navigate to stories screen  
   */
  const handleStoriesPress = () => {
    // TODO: Navigate to stories
    Alert.alert('Coming Soon', 'Stories feature will be implemented next!');
  };

  /**
   * Handle sending to multiple recipients  
   */
  const handleSendToRecipients = async (recipients: string[], timer: number) => {
    if (!capturedMedia || !mediaType || !user) return;
    
    try {
      setIsProcessing(true);
      
      // Get file size for better tracking
      let fileSize = 0;
      try {
        const response = await fetch(capturedMedia);
        const blob = await response.blob();
        fileSize = blob.size;
      } catch (sizeError) {
        console.warn('Could not determine file size:', sizeError);
      }
      
      const mediaData = {
        uri: capturedMedia,
        type: mediaType,
        size: fileSize
      };
      
      console.log('📤 Sending media:', { mediaType, fileSize, recipients: recipients.length, timer });
      
      // Send to all recipients
      for (const recipientId of recipients) {
        await messagingService.sendMessage(
          user.uid,
          recipientId,
          mediaData,
          timer
        );
      }
      
      // Clear captured media
      setCapturedMedia(null);
      setMediaType(null);
      setShowRecipientSelector(false);
      
      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert('Sent!', `Your snap has been sent to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}.`);
    } catch (error) {
      console.error('Send media failed:', error);
      Alert.alert('Error', 'Failed to send snap. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Show recipient selector
   */
  const showSendOptions = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowRecipientSelector(true);
    } catch (error) {
      console.error('Show send options failed:', error);
    }
  };

  /**
   * Discard captured media
   */
  const discardMedia = async () => {
    try {
      setCapturedMedia(null);
      setMediaType(null);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Discard media failed:', error);
    }
  };

  /**
   * Get flash icon based on current mode
   */
  const getFlashIcon = () => {
    switch (flash) {
      case 'on': return 'flash';
      case 'auto': return 'flash-outline';  
      case 'off': return 'flash-off';
      default: return 'flash-off';
    }
  };

  /**
   * Format recording duration
   */
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show permission request if not granted
  if (!cameraPermission || !microphonePermission) {
    return (
      <View className="flex-1 justify-center items-center bg-cyber-black">
        <Text className="text-white font-orbitron text-lg">Requesting permissions...</Text>
      </View>
    );
  }

  if (!cameraPermission.granted || !microphonePermission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-cyber-black p-6">
        <Ionicons name="camera" size={64} color={accentColor} />
        <Text className="text-cyber-cyan font-orbitron text-xl mt-4 mb-2">
          Camera & Microphone Access Required
        </Text>
        <Text className="text-white/80 font-inter text-center mb-6">
          SnapConnect needs camera and microphone access to capture photos and record videos with audio.
        </Text>
        <TouchableOpacity
          onPress={async () => {
            if (!cameraPermission.granted) await requestCameraPermission();
            if (!microphonePermission.granted) await requestMicrophonePermission();
          }}
          className="bg-cyber-cyan px-6 py-3 rounded-lg"
        >
          <Text className="text-cyber-black font-inter font-semibold">
            Grant Permissions
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show media preview and sharing options if media is captured
  if (capturedMedia) {
    return (
      <>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
          <StatusBar barStyle="light-content" backgroundColor={theme.colors.background.primary} />
          
          <View className="flex-1 bg-cyber-black">
            {/* Media Preview */}
            <View className="flex-1 justify-center items-center">
              <Text className="text-cyber-cyan font-orbitron text-xl mb-4">
                {mediaType === 'photo' ? 'Photo Captured!' : 'Video Recorded!'}
              </Text>
              <Text className="text-white/80 font-inter text-center px-8 mb-8">
                Select recipients to send your snap, or discard to take another.
              </Text>
              
              {/* Actual Media Preview */}
              <View className="w-64 h-80 bg-gray-800 rounded-lg overflow-hidden mb-8 border-2 border-cyber-cyan">
                {mediaType === 'photo' && capturedMedia ? (
                  <Image
                    source={{ uri: capturedMedia }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full justify-center items-center">
                    <Ionicons 
                      name={mediaType === 'photo' ? 'image' : 'videocam'} 
                      size={48} 
                      color={accentColor} 
                    />
                  </View>
                )}
              </View>
            </View>
            
            {/* Action Buttons */}
            <View className="flex-row justify-around items-center px-6 py-8">
              <TouchableOpacity
                onPress={discardMedia}
                className="w-16 h-16 bg-red-500/20 border-2 border-red-500 rounded-full justify-center items-center"
                disabled={isProcessing}
              >
                <Ionicons name="trash-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={showSendOptions}
                className="w-20 h-20 bg-cyber-cyan rounded-full justify-center items-center"
                disabled={isProcessing}
              >
                <Ionicons name="send" size={28} color="#000" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={openMediaLibrary}
                className="w-16 h-16 bg-cyber-gray rounded-full justify-center items-center"
                disabled={isProcessing}
              >
                <Ionicons name="images-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
        
        {/* Recipient Selector Modal */}
        <RecipientSelector
          visible={showRecipientSelector}
          mediaData={capturedMedia && mediaType ? {
            uri: capturedMedia,
            type: mediaType,
            size: 0
          } : null}
          onSend={handleSendToRecipients}
          onClose={() => setShowRecipientSelector(false)}
        />
      </>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background.primary} />
      
      {/* Camera Container */}
      <View className="flex-1 relative">
        {/* Camera View */}
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing={facing}
          flash={flash}
          onCameraReady={handleCameraReady}
          mode="picture"
          pictureSize="1920x1080"
          enableTorch={false}
          mute={false}
        />
        
        {/* Top Controls - Absolutely positioned */}
        <View className="absolute top-0 left-0 right-0 z-10 flex-row justify-between items-center px-6 py-4 bg-black/30">
          <TouchableOpacity onPress={toggleFlash} className="p-2">
            <Ionicons name={getFlashIcon()} size={24} color="white" />
          </TouchableOpacity>
          
          <View className="flex-1 justify-center items-center">
            <Text className="text-white font-orbitron text-lg">
              SnapConnect
            </Text>
            {!cameraReady && (
              <TouchableOpacity onPress={reinitializeCamera} className="mt-1">
                <Text className="text-cyber-cyan font-inter text-xs">
                  Camera initializing... Tap to retry
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity onPress={handleMessagesPress} className="p-2">
            <Ionicons name="chatbubble-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Recording Indicator - Absolutely positioned */}
        {isRecording && (
          <View className="absolute top-20 left-6 z-10 bg-red-500 px-3 py-1 rounded-full flex-row items-center">
            <View className="w-2 h-2 bg-white rounded-full mr-2" />
            <Text className="text-white font-inter font-medium">
              {formatDuration(recordingDuration)}
            </Text>
          </View>
        )}

        {/* Bottom Controls - Absolutely positioned */}
        <View className="absolute bottom-0 left-0 right-0 z-10 flex-row justify-between items-center px-6 py-8 bg-black/30">
          {/* Media Library Button */}
          <TouchableOpacity 
            onPress={openMediaLibrary}
            className="w-12 h-12 bg-cyber-gray rounded-lg justify-center items-center"
          >
            <Ionicons name="images-outline" size={20} color="white" />
          </TouchableOpacity>
          
          {/* Capture Button */}
          <Animated.View style={{ transform: [{ scale: captureButtonScale }] }}>
            <Pressable
              onPress={handleCapturePress}
              onLongPress={handleCaptureLongPress}
              onPressOut={handlePressOut}
              className={`w-20 h-20 border-4 rounded-full justify-center items-center ${
                isRecording ? 'border-red-500' : 'border-cyber-cyan'
              }`}
              style={{ borderColor: isRecording ? '#ef4444' : accentColor }}
              disabled={!cameraReady || isProcessing}
            >
              <View 
                className={`w-16 h-16 rounded-full ${
                  isRecording ? 'bg-red-500' : 'bg-white'
                }`}
              />
            </Pressable>
          </Animated.View>
          
          {/* Switch Camera Button */}
          <TouchableOpacity 
            onPress={toggleCameraFacing}
            className="w-12 h-12 bg-cyber-gray rounded-lg justify-center items-center"
          >
            <Ionicons name="camera-reverse-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CameraScreen; 

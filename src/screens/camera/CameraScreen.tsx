/**
 * @file CameraScreen.tsx
 * @description Main camera interface for content capture with real-time photo/video sharing.
 * Primary screen of SnapConnect with camera-first design philosophy.
 * 
 * @author SnapConnect Team
 * @created 2024-01-20
 * @modified 2024-01-24
 * 
 * @dependencies
 * - react: React hooks
 * - react-native: Core components
 * - expo-camera: Camera functionality
 * - expo-haptics: Haptic feedback
 * - expo-image-picker: Media library access
 * - @/stores/themeStore: Theme management
 * - @/services/firebase/messagingService: Message sending
 * - @/utils/alertService: Web-compatible alerts
 * 
 * @usage
 * Primary interface for capturing photos, videos, and sharing content.
 * 
 * @ai_context
 * Integrates with AI-powered content suggestions and gaming context detection.
 * Supports smart filter recommendations based on content analysis.
 */

// Web API declarations for React Native Web compatibility
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import { CameraType, CameraView, FlashMode, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RecipientSelector from '../../components/common/RecipientSelector';
import { useTabBarHeight } from '../../hooks/useTabBarHeight';
import { messagingService } from '../../services/firebase/messagingService';
import { storiesService } from '../../services/firebase/storiesService';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { showAlert, showErrorAlert, showSuccessAlert } from '../../utils/alertService';

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
  const insets = useSafeAreaInsets();
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.getCurrentAccentColor());
  const { user } = useAuthStore();
  const route = useRoute();
  const { tabBarHeight } = useTabBarHeight();
  
  // Camera permissions and state
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [cameraReady, setCameraReady] = useState(false);
  
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
  
  // Story mode state
  const [isStoryMode, setIsStoryMode] = useState(false);
  const [showStoryOptions, setShowStoryOptions] = useState(false);
  
  // Recipient selector
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);
  
  // Refs
  const cameraRef = useRef<CameraView>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const recordingPromise = useRef<Promise<any> | null>(null);
  const captureButtonScale = useRef(new Animated.Value(1)).current;

  // Web-specific recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Web camera device selection (for automatic selection)
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  /**
   * Handle navigation parameters and story mode
   */
  useFocusEffect(
    React.useCallback(() => {
      // Check if we're navigating with story mode parameter
      const params = route.params as { mode?: string } | undefined;
      if (params?.mode === 'story') {
        setIsStoryMode(true);
      }
    }, [route.params])
  );

  /**
   * Check if web recording is supported in the current browser
   */
  const isWebRecordingSupported = (): boolean => {
    if (Platform.OS !== 'web') return false;
    
    return !!(
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      'getUserMedia' in navigator.mediaDevices &&
      typeof window !== 'undefined' &&
      window.MediaRecorder
    );
  };

  /**
   * Enumerate available camera devices and select the best one
   */
  const enumerateCameras = useCallback(async (): Promise<void> => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.mediaDevices) {
      return;
    }

    try {
      // First, request permission to get device labels
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately to just get permissions
      } catch (permError) {
        console.warn('Could not get permissions for device enumeration:', permError);
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // Auto-select the best camera (avoid virtual cameras)
      if (videoDevices.length > 0) {
        const preferredCamera = selectBestCamera(videoDevices);
        setSelectedCameraId(preferredCamera.deviceId);
      }
    } catch (error) {
      console.error('Failed to enumerate cameras:', error);
    }
  }, []);

  /**
   * Select the best camera device, avoiding virtual cameras
   */
  const selectBestCamera = (devices: MediaDeviceInfo[]): MediaDeviceInfo => {
    // Prioritize cameras that are NOT virtual/OBS cameras
    const realCameras = devices.filter(device => {
      const label = device.label.toLowerCase();
      const isVirtual = label.includes('obs') || 
                       label.includes('virtual') || 
                       label.includes('software') ||
                       label.includes('screen') ||
                       label.includes('capture') ||
                       label.includes('streamlabs') ||
                       label.includes('xsplit');
      
      return !isVirtual;
    });
    
    if (realCameras.length > 0) {
      // Prefer built-in cameras or webcams
      const builtInCamera = realCameras.find(device => {
        const label = device.label.toLowerCase();
        return label.includes('built-in') || 
               label.includes('integrated') || 
               label.includes('facetime') ||
               label.includes('webcam') ||
               label.includes('camera');
      });
      
      const selected = builtInCamera || realCameras[0];
      return selected;
    }
    
    // Fall back to any available camera if no "real" cameras found
    return devices[0];
  };

  /**
   * Request media library permissions
   */
  const requestMediaLibraryPermissions = useCallback(async () => {
    try {
      const { status: mediaLibraryStatus } = await MediaLibrary.requestPermissionsAsync();
      if (mediaLibraryStatus !== 'granted') {
        console.warn('Media library permission not granted');
      }
    } catch (error) {
      console.error('Media library permission request failed:', error);
    }
  }, []);

  /**
   * Request all necessary permissions
   */
  const requestAllPermissions = useCallback(async () => {
    try {
      // Request camera permission for photo/video capture
      if (cameraPermission && !cameraPermission.granted) {
        await requestCameraPermission();
      }
      
      // Request microphone permission for video recording
      if (microphonePermission && !microphonePermission.granted) {
        await requestMicrophonePermission();
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  }, [cameraPermission, microphonePermission, requestCameraPermission, requestMicrophonePermission]);

  /**
   * Request media library and microphone permissions on component mount
   */
  useEffect(() => {
    requestMediaLibraryPermissions();
    requestAllPermissions();
    
    // Enumerate cameras for web platform
    if (Platform.OS === 'web') {
      // Small delay to ensure permissions are processed first
      setTimeout(() => {
        enumerateCameras();
      }, 1000);
    }
  }, [enumerateCameras, requestAllPermissions, requestMediaLibraryPermissions]);

  /**
   * Re-enumerate cameras when permissions change
   */
  useEffect(() => {
    if (Platform.OS === 'web' && cameraPermission?.granted && microphonePermission?.granted) {
      setTimeout(() => {
        enumerateCameras();
      }, 500);
    }
  }, [cameraPermission?.granted, microphonePermission?.granted, enumerateCameras]);

  /**
   * Cleanup web media streams on unmount
   */
  useEffect(() => {
    return () => {
      // Cleanup web recording resources
      if (Platform.OS === 'web') {
        if (videoStreamRef.current) {
          videoStreamRef.current.getTracks().forEach(track => track.stop());
          videoStreamRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }
      
      // Clear recording interval
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }
    };
  }, []);

  /**
   * Handle camera ready state with additional delay for stability
   */
  const handleCameraReady = () => {
    // Add a small delay to ensure camera is fully stable
    setTimeout(() => {
      setCameraReady(true);
    }, 500);
  };

  /**
   * Force camera re-initialization if needed
   */
  const reinitializeCamera = () => {
    setCameraReady(false);
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
    if (!cameraRef.current) {
      showErrorAlert('Camera not available. Please try again.');
      return;
    }
    
    if (!cameraReady) {
      showErrorAlert('Camera is still initializing. Please wait a moment and try again.');
      return;
    }
    
    try {
      setIsProcessing(true);
      
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
      
      if (photo?.uri) {
        setCapturedMedia(photo.uri);
        setMediaType('photo');
      } else {
        console.error('Photo capture failed - no image data received');
        showErrorAlert('Photo capture failed - no image data received.');
      }
    } catch (error) {
      console.error('Photo capture failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showErrorAlert(`Failed to capture photo: ${errorMessage}`);
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
      // Check web recording support
      if (Platform.OS === 'web' && !isWebRecordingSupported()) {
        showAlert(
          'Recording Not Supported',
          'Video recording is not supported in your current browser. Please try using a modern browser like Chrome, Firefox, or Safari.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
      
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
      
      if (Platform.OS === 'web') {
        // Web-specific recording using MediaRecorder API
        await startWebRecording();
      } else {
        // Mobile recording using Expo Camera
        await startMobileRecording();
      }
        
    } catch (error) {
      console.error('Start recording failed:', error);
      setIsRecording(false);
      setRecordingDuration(0);
      setRecordingStartTime(0);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }
      
      // Provide more specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (Platform.OS === 'web' && errorMessage.includes('MediaDevices API not available')) {
        showErrorAlert('Please allow camera and microphone access in your browser to record videos.', 'Camera Access Required');
      } else if (Platform.OS === 'web' && errorMessage.includes('MediaRecorder API not available')) {
        showErrorAlert('Your browser does not support video recording. Please try using Chrome, Firefox, or Safari.', 'Browser Not Supported');
      } else {
        showErrorAlert(`Failed to start recording: ${errorMessage}`);
      }
    }
  };

  /**
   * Start mobile recording using Expo Camera
   */
  const startMobileRecording = async () => {
    try {
      // Small delay to ensure camera is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Start recording - don't await here!
      recordingPromise.current = cameraRef.current!.recordAsync({
        maxDuration: 60, // 60 seconds max
      });
      
      // Handle recording result when it completes
      recordingPromise.current
        .then((video) => {
          if (video?.uri) {
            setCapturedMedia(video.uri);
            setMediaType('video');
          }
        })
        .catch((error) => {
          console.error('Recording promise failed:', error);
          if (!error.message.includes('Recording was cancelled')) {
            showErrorAlert('Video recording failed. Please try again.');
          }
        })
        .finally(() => {
          recordingPromise.current = null;
          setIsRecording(false);
          if (recordingInterval.current) {
            clearInterval(recordingInterval.current);
            recordingInterval.current = null;
          }
        });
    } catch (error) {
      console.error('Mobile recording failed:', error);
      throw error; // Re-throw to be handled by startRecording
    }
  };

  /**
   * Start web recording using MediaRecorder API
   */
  const startWebRecording = async () => {
    try {
      // Get user media stream
      const constraints = {
        video: {
          facingMode: facing === 'front' ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          ...(selectedCameraId && { deviceId: { exact: selectedCameraId } })
        },
        audio: true
      };
      
      videoStreamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Initialize MediaRecorder
      recordedChunksRef.current = [];
      
      const options = {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2000000, // 2 Mbps
      };
      
      // Fallback for browsers that don't support VP9
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
      }
      
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
      }
      
      mediaRecorderRef.current = new MediaRecorder(videoStreamRef.current, options);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setCapturedMedia(url);
        setMediaType('video');
        
        // Cleanup stream
        if (videoStreamRef.current) {
          videoStreamRef.current.getTracks().forEach(track => track.stop());
          videoStreamRef.current = null;
        }
      };
      
      // Start recording
      mediaRecorderRef.current.start();
      
    } catch (error) {
      console.error('Web recording failed:', error);
      throw error; // Re-throw to be handled by startRecording
    }
  };

  /**
   * Stop video recording
   */
  const stopRecording = async () => {
    if (!isRecording) return;

    try {
      if (Platform.OS === 'web') {
        // Stop web recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      } else {
        // Stop mobile recording
        if (cameraRef.current && recordingPromise.current) {
          await cameraRef.current.stopRecording();
        }
      }
      
      // Clear recording timer
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }
      
      setIsRecording(false);
      setRecordingDuration(0);
      setRecordingStartTime(0);
      
    } catch (error) {
      console.error('Stop recording failed:', error);
      setIsRecording(false);
      setRecordingDuration(0);
      setRecordingStartTime(0);
    }
  };

  /**
   * Handle capture button press (photo)
   */
  const handleCapturePress = () => {
    if (!isRecording && !isProcessing) {
      takePicture();
    }
  };

  /**
   * Handle capture button long press (video recording start)
   */
  const handleCaptureLongPress = () => {
    if (!isRecording && !isProcessing) {
      startRecording();
    }
  };

  /**
   * Handle capture button press out (video recording stop)
   */
  const handlePressOut = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  /**
   * Open media library to select existing media
   */
  const openMediaLibrary = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setCapturedMedia(asset.uri);
        setMediaType(asset.type === 'video' ? 'video' : 'photo');
      }
    } catch (error) {
      console.error('Media library access failed:', error);
      showErrorAlert('Failed to access media library.');
    }
  };

  /**
   * Handle messages press - placeholder for messaging feature
   */
  const handleMessagesPress = () => {
    showAlert('Coming Soon', 'Messages feature will be implemented next!');
  };

  /**
   * Handle sending to recipients
   */
  const handleSendToRecipients = async (recipients: string[], timer: number) => {
    if (!capturedMedia || !mediaType || !user) return;

    try {
      setIsProcessing(true);
      
      // Get file size for tracking
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
      
      // Send to each recipient
      for (const recipientId of recipients) {
        await messagingService.sendMessage(
          user.uid,
          recipientId,
          mediaData,
          timer,
          '' // text message
        );
      }
      
      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Clear captured media
      setCapturedMedia(null);
      setMediaType(null);
      setShowRecipientSelector(false);
      
      showSuccessAlert(`Your snap has been sent to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}.`, 'Sent!');
    } catch (error) {
      console.error('Send snap failed:', error);
      showErrorAlert('Failed to send snap. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle story creation
   */
  const handleCreateStory = async (privacy: 'public' | 'friends' | 'custom' = 'friends', allowedUsers: string[] = []) => {
    if (!capturedMedia || !mediaType || !user) return;

    try {
      setIsProcessing(true);
      
      // Get file size for tracking
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
      
      // Create story
      await storiesService.createStory(
        user.uid,
        mediaData,
        '', // No text overlay for now
        privacy,
        allowedUsers
      );
      
      // Clear captured media
      setCapturedMedia(null);
      setMediaType(null);
      setShowStoryOptions(false);
      setIsStoryMode(false);
      
      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      showSuccessAlert('Your story has been shared successfully.', 'Story Created!');
    } catch (error) {
      console.error('Create story failed:', error);
      showErrorAlert('Failed to create story. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Show story options modal
   */
  const showStoryPrivacyOptions = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowStoryOptions(true);
    } catch (error) {
      console.error('Show story options failed:', error);
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
    const cameraBlocked = cameraPermission?.status === 'denied';
    
    return (
      <View className="flex-1 justify-center items-center bg-cyber-black p-6">
        <Ionicons name="camera" size={64} color={accentColor} />
        <Text className="text-cyber-cyan font-orbitron text-xl mt-4 mb-2">
          {cameraBlocked ? 'Camera Access Blocked' : 'Camera & Microphone Access Required'}
        </Text>
        
        {cameraBlocked ? (
          <View className="mb-6">
            <Text className="text-white/80 font-inter text-center mb-4">
              Camera access was previously denied. Please enable it manually in your browser settings.
            </Text>
            
            {/* Browser-specific instructions */}
            <View className="bg-cyber-gray/20 p-4 rounded-lg mb-4">
              <Text className="text-cyber-cyan font-inter font-semibold mb-2">
                📍 How to Enable Camera Access:
              </Text>
              <Text className="text-white/80 font-inter text-sm mb-1">
                1. Look for the camera icon 📷 in your address bar
              </Text>
              <Text className="text-white/80 font-inter text-sm mb-1">
                2. Click it and select &quot;Allow&quot;
              </Text>
              <Text className="text-white/80 font-inter text-sm mb-1">
                3. Or go to browser Settings → Privacy → Site Settings → Camera
              </Text>
              <Text className="text-white/80 font-inter text-sm">
                4. Find this site and change to &quot;Allow&quot;
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={() => {
                // Force a page reload to re-check permissions
                window.location.reload();
              }}
              className="bg-cyber-green px-6 py-3 rounded-lg mb-3"
            >
              <Text className="text-black font-inter font-semibold">
                I&apos;ve Enabled Camera - Refresh Page
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text className="text-white/80 font-inter text-center mb-6">
            SnapConnect needs camera and microphone access to capture photos and record videos with audio.
          </Text>
        )}
        
        <TouchableOpacity
          onPress={async () => {
            try {
              await requestAllPermissions();
              
              if (!cameraPermission?.granted) {
                showAlert(
                  'Camera Access Required',
                  'Please check the camera icon in your browser address bar and allow camera access, then refresh the page.',
                  [{ text: 'OK', style: 'default' }]
                );
              }
            } catch (error) {
              console.error('Permission request failed:', error);
              showErrorAlert('Failed to request permissions. Please check your browser settings.');
            }
          }}
          className="bg-cyber-cyan px-6 py-3 rounded-lg"
        >
          <Text className="text-cyber-black font-inter font-semibold">
            {cameraBlocked ? 'Try Again' : 'Grant Permissions'}
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
              <View className="w-80 h-96 bg-gray-800 rounded-lg overflow-hidden mb-8 border-2 border-cyber-cyan">
                {mediaType === 'photo' && capturedMedia ? (
                  <Image
                    source={{ uri: capturedMedia }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : mediaType === 'video' && capturedMedia ? (
                  <Video
                    source={{ uri: capturedMedia }}
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      backgroundColor: 'transparent'
                    }}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={false}
                    isLooping={false}
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
                 onPress={isStoryMode ? showStoryPrivacyOptions : showSendOptions}
                 className="w-20 h-20 bg-cyber-cyan rounded-full justify-center items-center"
                 disabled={isProcessing}
                >
                 <Ionicons name={isStoryMode ? "add-circle" : "send"} size={28} color="#000" />
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
        
        {/* Story Options Modal */}
        {showStoryOptions && (
          <Modal
            visible={showStoryOptions}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowStoryOptions(false)}
          >
            <SafeAreaView className="flex-1 bg-cyber-black">
              <View className="flex-1">
                {/* Header */}
                <View className="flex-row justify-between items-center px-6 py-4 border-b border-cyber-gray/20">
                  <TouchableOpacity onPress={() => setShowStoryOptions(false)} className="p-2">
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                  
                  <Text className="text-white font-orbitron text-lg">
                    Share Story
                  </Text>
                  
                  <View className="w-8" />
                </View>
                
                {/* Story Privacy Options */}
                <View className="px-6 py-8">
                  <Text className="text-white font-inter font-medium text-lg mb-6">
                    Who can see this story?
                  </Text>
                  
                  <TouchableOpacity
                    onPress={() => {
                      handleCreateStory('friends');
                      setShowStoryOptions(false);
                    }}
                    className="flex-row items-center p-4 bg-cyber-gray/20 rounded-lg mb-3"
                  >
                    <Ionicons name="people" size={24} color={accentColor} />
                    <View className="ml-4">
                      <Text className="text-white font-inter font-medium">Friends</Text>
                      <Text className="text-white/60 font-inter text-sm">Only your friends can see</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => {
                      handleCreateStory('public');
                      setShowStoryOptions(false);
                    }}
                    className="flex-row items-center p-4 bg-cyber-gray/20 rounded-lg mb-3"
                  >
                    <Ionicons name="globe" size={24} color={accentColor} />
                    <View className="ml-4">
                      <Text className="text-white font-inter font-medium">Public</Text>
                      <Text className="text-white/60 font-inter text-sm">Everyone can see</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          </Modal>
        )}
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
        <View className="absolute top-0 left-0 right-0 z-10 px-6 py-4 bg-black/30">
          {/* First Row: Flash, Title, Messages */}
          <View className="flex-row justify-between items-center">
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

          {/* Second Row: Mode Toggle */}
          <View className="items-center mt-4">
            <View className="flex-row bg-black/60 rounded-full p-1">
              <TouchableOpacity
                onPress={() => setIsStoryMode(false)}
                className={`px-4 py-2 rounded-full ${!isStoryMode ? 'bg-white/20' : ''}`}
              >
                <Text className={`font-inter text-sm font-medium ${!isStoryMode ? 'text-white' : 'text-white/60'}`}>
                  SNAP
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsStoryMode(true)}
                className={`px-4 py-2 rounded-full ${isStoryMode ? 'bg-white/20' : ''}`}
              >
                <Text className={`font-inter text-sm font-medium ${isStoryMode ? 'text-white' : 'text-white/60'}`}>
                  STORY
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
        <View 
          className="absolute bottom-0 left-0 right-0 z-10 px-6 bg-black/30"
          style={{
            paddingTop: 32,
            paddingBottom: Math.max(tabBarHeight + 8, 32), // Dynamic tab bar height + padding
          }}
        >
          <View className="flex-row justify-between items-center">
            {/* Media Library Button */}
            <TouchableOpacity 
              onPress={openMediaLibrary}
              className="w-12 h-12 bg-cyber-gray rounded-lg justify-center items-center"
            >
              <Ionicons name="images-outline" size={20} color="white" />
            </TouchableOpacity>
            
            {/* Capture Button with Instructions */}
            <View className="items-center">
              <Animated.View style={{ transform: [{ scale: captureButtonScale }] }}>
                <Pressable
                  onPress={handleCapturePress}
                  onLongPress={handleCaptureLongPress}
                  onPressOut={handlePressOut}
                  className={`w-20 h-20 border-4 rounded-full justify-center items-center ${
                    isRecording ? 'border-red-500' : isStoryMode ? 'border-green-400' : 'border-cyber-cyan'
                  }`}
                  style={{ borderColor: isRecording ? '#ef4444' : isStoryMode ? '#4ade80' : accentColor }}
                  disabled={!cameraReady || isProcessing}
                >
                  <View 
                    className={`w-16 h-16 rounded-full ${
                      isRecording ? 'bg-red-500' : 'bg-white'
                    }`}
                  />
                </Pressable>
              </Animated.View>
              
              {/* Mode Instructions */}
              <Text className="text-white font-inter text-xs mt-2 opacity-80 text-center">
                {isStoryMode ? 'TAP FOR STORY' : Platform.OS === 'web' ? 
                  (isWebRecordingSupported() ? 'TAP • HOLD FOR VIDEO' : 'TAP FOR PHOTO ONLY') : 
                  'TAP • HOLD FOR VIDEO'
                }
              </Text>
            </View>
            
            {/* Switch Camera Button */}
            <TouchableOpacity 
              onPress={toggleCameraFacing}
              className="w-12 h-12 bg-cyber-gray rounded-lg justify-center items-center"
            >
              <Ionicons name="camera-reverse-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Media Preview Modal */}
      {capturedMedia && (
        <Modal
          visible={!!capturedMedia}
          animationType="fade"
          presentationStyle="fullScreen"
        >
          <SafeAreaView className="flex-1 bg-black">
            {/* Header */}
            <View className="flex-row justify-between items-center px-6 py-4">
              <TouchableOpacity onPress={discardMedia} className="p-2">
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              
              <Text className="text-white font-inter font-medium">
                {isStoryMode ? 'Add to Story' : 'Send Snap'}
              </Text>
              
              <View className="w-8" />
            </View>

            {/* Media Display */}
            <View className="flex-1 justify-center items-center px-4">
              {mediaType === 'photo' ? (
                <Image
                  source={{ uri: capturedMedia }}
                  style={{
                    width: screenWidth - 32,
                    height: screenHeight * 0.7,
                  }}
                  resizeMode="contain"
                />
              ) : mediaType === 'video' && capturedMedia ? (
                <View 
                  style={{
                    width: screenWidth - 32,
                    height: screenHeight * 0.7,
                    backgroundColor: '#000',
                    borderRadius: 8,
                    overflow: 'hidden'
                  }}
                >
                  <Video
                    source={{ uri: capturedMedia }}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={false}
                    isLooping={false}
                  />
                </View>
              ) : (
                <View className="w-full h-96 bg-cyber-dark rounded-lg justify-center items-center">
                  <Ionicons name="play-circle" size={64} color="white" />
                  <Text className="text-white font-inter mt-4">
                    Video Preview
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View className="px-6 pb-8">
              {isStoryMode ? (
                // Story Mode Actions
                <TouchableOpacity
                  onPress={showStoryPrivacyOptions}
                  disabled={isProcessing}
                  className={`bg-cyber-cyan py-4 rounded-lg ${isProcessing ? 'opacity-50' : ''}`}
                >
                  <Text className="text-cyber-black font-bold text-lg font-orbitron text-center">
                    {isProcessing ? 'CREATING STORY...' : 'ADD TO STORY'}
                  </Text>
                </TouchableOpacity>
              ) : (
                // Snap Mode Actions
                <TouchableOpacity
                  onPress={showSendOptions}
                  disabled={isProcessing}
                  className={`bg-cyber-cyan py-4 rounded-lg ${isProcessing ? 'opacity-50' : ''}`}
                >
                  <Text className="text-cyber-black font-bold text-lg font-orbitron text-center">
                    {isProcessing ? 'SENDING...' : 'SEND SNAP'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default CameraScreen; 

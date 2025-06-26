/**
 * @file CustomAlert.tsx
 * @description Web-compatible custom alert modal that replaces React Native's Alert.alert
 * Provides proper modal-based alerts for web builds while maintaining native functionality.
 * 
 * @author SnapConnect Team
 * @created 2024-01-24
 * 
 * @dependencies
 * - react: React hooks
 * - react-native: Modal, SafeAreaView, TouchableOpacity
 * - @expo/vector-icons: Icons
 * 
 * @usage
 * import { customAlert } from '@/components/common/CustomAlert';
 * customAlert('Title', 'Message', [{ text: 'OK' }]);
 * 
 * @ai_context
 * Essential for web build compatibility - React Native Alert.alert doesn't work on web
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, Platform, Text, TouchableOpacity, View } from 'react-native';


/**
 * Alert button interface
 */
interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

/**
 * Alert data interface
 */
interface AlertData {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

/**
 * Global alert state management
 */
class AlertManager {
  private static instance: AlertManager;
  private setAlertData: ((data: AlertData | null) => void) | null = null;
  private setVisible: ((visible: boolean) => void) | null = null;

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  setCallbacks(
    setAlertData: (data: AlertData | null) => void,
    setVisible: (visible: boolean) => void
  ) {
    this.setAlertData = setAlertData;
    this.setVisible = setVisible;
  }

  show(title: string, message?: string, buttons: AlertButton[] = [{ text: 'OK' }]) {
    if (Platform.OS === 'web') {
      // Use custom modal on web
      if (this.setAlertData && this.setVisible) {
        this.setAlertData({ title, message, buttons });
        this.setVisible(true);
      }
    } else {
      // Use native Alert on mobile
      Alert.alert(title, message, buttons);
    }
  }

  hide() {
    if (this.setVisible) {
      this.setVisible(false);
    }
  }
}

/**
 * Custom Alert Modal Component
 * Web-compatible modal that mimics Alert.alert behavior
 */
const CustomAlertModal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [alertData, setAlertData] = useState<AlertData | null>(null);

  // Register callbacks with AlertManager
  React.useEffect(() => {
    const manager = AlertManager.getInstance();
    manager.setCallbacks(setAlertData, setVisible);
  }, []);

  /**
   * Handle button press
   */
  const handleButtonPress = (button: AlertButton) => {
    setVisible(false);
    setAlertData(null);
    
    // Call button's onPress after a small delay to allow modal to close
    setTimeout(() => {
      if (button.onPress) {
        button.onPress();
      }
    }, 100);
  };

  /**
   * Get button style based on button type
   */
  const getButtonStyle = (style?: AlertButton['style']) => {
    switch (style) {
      case 'destructive':
        return 'bg-red-500';
      case 'cancel':
        return 'bg-gray-600';
      default:
        return 'bg-cyber-cyan';
    }
  };

  /**
   * Get button text color based on button type
   */
  const getButtonTextStyle = (style?: AlertButton['style']) => {
    switch (style) {
      case 'destructive':
        return 'text-white';
      case 'cancel':
        return 'text-white';
      default:
        return 'text-cyber-black';
    }
  };

  if (!alertData) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        // Don't allow closing by back button - must use buttons
      }}
    >
      <View className="flex-1 justify-center items-center bg-black/50 px-6">
        <View className="bg-cyber-black border border-cyber-gray rounded-lg p-6 max-w-sm w-full">
          {/* Alert Icon */}
          <View className="items-center mb-4">
            <View className="w-12 h-12 bg-cyber-cyan/20 rounded-full justify-center items-center">
              <Ionicons name="alert-circle" size={24} color="#00d4ff" />
            </View>
          </View>

          {/* Title */}
          <Text className="text-white font-orbitron text-lg text-center mb-3">
            {alertData.title}
          </Text>

          {/* Message */}
          {alertData.message && (
            <Text className="text-white/80 font-inter text-center mb-6 leading-5">
              {alertData.message}
            </Text>
          )}

          {/* Buttons */}
          <View className="space-y-3">
            {alertData.buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleButtonPress(button)}
                className={`px-4 py-3 rounded-lg ${getButtonStyle(button.style)}`}
              >
                <Text className={`font-inter font-medium text-center ${getButtonTextStyle(button.style)}`}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Custom Alert Provider Component
 * Wrap your app with this to enable custom alerts
 */
export const CustomAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <CustomAlertModal />
    </>
  );
};

/**
 * Custom alert function - replacement for Alert.alert
 * @param title - Alert title
 * @param message - Alert message (optional)
 * @param buttons - Array of buttons (optional)
 */
export const customAlert = (
  title: string,
  message?: string,
  buttons: AlertButton[] = [{ text: 'OK' }]
) => {
  const manager = AlertManager.getInstance();
  manager.show(title, message, buttons);
};

/**
 * Export AlertManager for advanced usage
 */
export { AlertManager };

export default CustomAlertModal; 

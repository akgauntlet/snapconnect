/**
 * @file alertService.ts
 * @description Centralized alert service for web-compatible alerts
 * Provides a simple interface to show alerts that work on both web and mobile
 *
 * @author SnapConnect Team
 * @created 2024-01-24
 *
 * @usage
 * import { showAlert } from '@/utils/alertService';
 * showAlert('Title', 'Message');
 * showAlert('Title', 'Message', [{ text: 'OK' }, { text: 'Cancel', style: 'cancel' }]);
 *
 * @ai_context
 * Essential for web build compatibility - replaces React Native Alert.alert
 */

import { customAlert } from "../components/common/CustomAlert";

/**
 * Alert button interface
 */
export interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

/**
 * Show an alert dialog
 * @param title - Alert title
 * @param message - Alert message (optional)
 * @param buttons - Array of buttons (optional, defaults to single OK button)
 */
export const showAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
) => {
  customAlert(title, message, buttons);
};

/**
 * Show a simple alert with just an OK button
 * @param title - Alert title
 * @param message - Alert message
 */
export const showSimpleAlert = (title: string, message: string) => {
  customAlert(title, message, [{ text: "OK" }]);
};

/**
 * Show a confirmation alert with Yes/No buttons
 * @param title - Alert title
 * @param message - Alert message
 * @param onConfirm - Callback for Yes button
 * @param onCancel - Callback for No button (optional)
 */
export const showConfirmAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
) => {
  customAlert(title, message, [
    { text: "No", style: "cancel", onPress: onCancel },
    { text: "Yes", style: "default", onPress: onConfirm },
  ]);
};

/**
 * Show an error alert
 * @param message - Error message
 * @param title - Error title (optional, defaults to "Error")
 */
export const showErrorAlert = (message: string, title: string = "Error") => {
  customAlert(title, message, [{ text: "OK" }]);
};

/**
 * Show a success alert
 * @param message - Success message
 * @param title - Success title (optional, defaults to "Success")
 */
export const showSuccessAlert = (
  message: string,
  title: string = "Success",
) => {
  customAlert(title, message, [{ text: "OK" }]);
};

/**
 * Show a destructive confirmation alert (for delete actions)
 * @param title - Alert title
 * @param message - Alert message
 * @param onConfirm - Callback for destructive action
 * @param onCancel - Callback for cancel (optional)
 * @param confirmText - Text for confirm button (optional, defaults to "Delete")
 */
export const showDestructiveAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmText: string = "Delete",
) => {
  customAlert(title, message, [
    { text: "Cancel", style: "cancel", onPress: onCancel },
    { text: confirmText, style: "destructive", onPress: onConfirm },
  ]);
};

export default {
  showAlert,
  showSimpleAlert,
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
  showDestructiveAlert,
};

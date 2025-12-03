import { NativeModules } from 'react-native';

const { AccessibilityServiceModule } = NativeModules;

if (!AccessibilityServiceModule) {
  console.warn('AccessibilityServiceModule native module is not available');
}

/**
 * Check if the accessibility service is enabled in device settings
 * @returns Promise<boolean>
 */
export const isAccessibilityEnabled = (): Promise<boolean> => {
  return AccessibilityServiceModule?.isAccessibilityEnabled() ?? Promise.resolve(false);
};

/**
 * Open the accessibility settings screen
 * User needs to manually enable the service
 * @returns Promise<boolean>
 */
export const openAccessibilitySettings = (): Promise<boolean> => {
  return AccessibilityServiceModule?.openAccessibilitySettings() ?? Promise.resolve(false);
};

/**
 * Check if the accessibility service is currently running
 * @returns Promise<boolean>
 */
export const isServiceRunning = (): Promise<boolean> => {
  return AccessibilityServiceModule?.isServiceRunning() ?? Promise.resolve(false);
};

export default {
  isAccessibilityEnabled,
  openAccessibilitySettings,
  isServiceRunning,
};

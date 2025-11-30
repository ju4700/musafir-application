import { NativeModules } from 'react-native';

const { DeviceAdminModule } = NativeModules;

interface DeviceAdmin {
  requestDeviceAdmin: () => Promise<boolean>;
  isDeviceAdmin: () => Promise<boolean>;
  removeDeviceAdmin: () => Promise<void>;
}

if (!DeviceAdminModule) {
  throw new Error('DeviceAdminModule native module is not available');
}

/**
 * Request device admin privileges
 * This will show a system dialog to the user
 * @returns Promise<boolean> - true if granted, false if denied
 */
export const requestDeviceAdmin = (): Promise<boolean> => {
  return DeviceAdminModule.requestDeviceAdmin();
};

/**
 * Check if app currently has device admin privileges
 * @returns Promise<boolean>
 */
export const isDeviceAdmin = (): Promise<boolean> => {
  return DeviceAdminModule.isDeviceAdmin();
};

/**
 * Remove device admin privileges (for cleanup)
 * @returns Promise<void>
 */
export const removeDeviceAdmin = (): Promise<void> => {
  return DeviceAdminModule.removeDeviceAdmin();
};

export default DeviceAdminModule as DeviceAdmin;

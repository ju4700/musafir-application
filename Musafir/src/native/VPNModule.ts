import { NativeModules } from 'react-native';

const { VPNModule } = NativeModules;

interface VPN {
  startVPN: () => Promise<boolean>;
  stopVPN: () => Promise<void>;
  isVPNActive: () => Promise<boolean>;
  prepareVPN: () => Promise<boolean>;
}

if (!VPNModule) {
  throw new Error('VPNModule native module is not available');
}

/**
 * Prepare VPN (shows system permission dialog if needed)
 * Must be called before startVPN
 * @returns Promise<boolean> - true if permission granted
 */
export const prepareVPN = (): Promise<boolean> => {
  return VPNModule.prepareVPN();
};

/**
 * Start VPN service with AI-powered content filtering
 * No blocklist needed - filtering is autonomous
 * @returns Promise<boolean> - true if started successfully
 */
export const startVPN = (): Promise<boolean> => {
  // Pass empty array for backwards compatibility, but VPN uses AI filter now
  return VPNModule.startVPN([]);
};

/**
 * Stop VPN service
 * @returns Promise<void>
 */
export const stopVPN = (): Promise<void> => {
  return VPNModule.stopVPN();
};

/**
 * Check if VPN is currently active
 * @returns Promise<boolean>
 */
export const isVPNActive = (): Promise<boolean> => {
  return VPNModule.isVPNActive();
};

export default VPNModule as VPN;

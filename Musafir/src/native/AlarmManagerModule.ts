import { NativeModules } from 'react-native';

const { AlarmManagerModule } = NativeModules;

interface AlarmManager {
  scheduleTimerExpiry: (timestampMs: number) => Promise<void>;
  cancelTimerAlarm: () => Promise<void>;
}

if (!AlarmManagerModule) {
  throw new Error('AlarmManagerModule native module is not available');
}

/**
 * Schedule an exact alarm to trigger when timer expires
 * This will re-enable the app icon and stop VPN
 * @param timestampMs - Unix timestamp in milliseconds when timer should expire
 * @returns Promise<void>
 */
export const scheduleTimerExpiry = (timestampMs: number): Promise<void> => {
  return AlarmManagerModule.scheduleTimerExpiry(timestampMs);
};

/**
 * Cancel the scheduled timer expiry alarm
 * @returns Promise<void>
 */
export const cancelTimerAlarm = (): Promise<void> => {
  return AlarmManagerModule.cancelTimerAlarm();
};

export default AlarmManagerModule as AlarmManager;

import { Alert, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';
import BackgroundActions from 'react-native-background-actions';
import { useAppStore } from '../store/appStore';
import { BlocklistService } from './BlocklistService';
import * as AppIconManager from '../native/AppIconManager';
import * as VPNModule from '../native/VPNModule';
import * as DeviceAdminModule from '../native/DeviceAdminModule';
import * as AlarmManagerModule from '../native/AlarmManagerModule';
import * as AccessibilityServiceModule from '../native/AccessibilityServiceModule';
import SharedPrefsModule from '../native/SharedPrefsModule';
import {
  NOTIFICATION_CHANNEL_ID,
  NOTIFICATION_CHANNEL_NAME,
  TIMER_NOTIFICATION_ID,
} from '../constants/defaultBlocklist';

export class TimerService {

  /**
   * Request all necessary permissions for the app to function
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      // Request notification permission
      const notificationGranted = await TimerService.requestNotificationPermission();
      if (!notificationGranted) {
        Alert.alert(
          'Permission Required',
          'Notification permission is required for the timer to work.'
        );
        return false;
      }

      // Request VPN permission
      const vpnGranted = await VPNModule.prepareVPN();
      if (!vpnGranted) {
        Alert.alert(
          'Permission Required',
          'VPN permission is required to block harmful content.'
        );
        return false;
      }

      // Check accessibility service (critical for content blocking)
      const accessibilityEnabled = await AccessibilityServiceModule.isAccessibilityEnabled();
      if (!accessibilityEnabled) {
        Alert.alert(
          'Accessibility Service Required',
          'The Content Blocker accessibility service must be enabled for Musafir to block harmful search queries and content in browsers.\n\nTap OK to open settings, then find "Musafir" and enable it.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => AccessibilityServiceModule.openAccessibilitySettings(),
            },
          ]
        );
        // Don't return false - allow user to continue but warn them
      }

      // Request device admin (optional but recommended)
      const adminGranted = await DeviceAdminModule.requestDeviceAdmin();
      if (adminGranted) {
        useAppStore.getState().setDeviceAdmin(true);
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  private static async requestNotificationPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    const settings = await notifee.requestPermission();
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
  }

  /**
   * Start the timer with specified duration in minutes
   */
  static async startTimer(durationMinutes: number): Promise<boolean> {
    try {
      // Check accessibility service before starting
      const accessibilityEnabled = await AccessibilityServiceModule.isAccessibilityEnabled();
      if (!accessibilityEnabled) {
        Alert.alert(
          'Content Blocker Not Enabled',
          'The accessibility service is required to block harmful content in browsers. Without it, the protection will be limited.\n\nDo you want to enable it now?',
          [
            { 
              text: 'Continue Anyway', 
              style: 'destructive',
              onPress: () => TimerService.startTimerInternal(durationMinutes),
            },
            {
              text: 'Enable Now',
              onPress: () => AccessibilityServiceModule.openAccessibilitySettings(),
            },
          ]
        );
        return false;
      }

      return await TimerService.startTimerInternal(durationMinutes);
    } catch (error) {
      console.error('Error starting timer:', error);
      Alert.alert('Error', 'Failed to start timer: ' + (error as Error).message);
      return false;
    }
  }

  /**
   * Internal method to actually start the timer
   */
  private static async startTimerInternal(durationMinutes: number): Promise<boolean> {
    try {
      const store = useAppStore.getState();

      // Calculate end time
      const endTime = Date.now() + durationMinutes * 60 * 1000;

      // Save timer state for persistence
      await BlocklistService.saveTimerState(endTime, durationMinutes);
      await SharedPrefsModule.saveTimerState(endTime, durationMinutes);

      // Start VPN with AI-powered filtering (no blocklist needed)
      const vpnStarted = await VPNModule.startVPN();
      if (!vpnStarted) {
        Alert.alert('Error', 'Failed to start VPN service');
        return false;
      }
      store.setVPNActive(true);

      // Hide app icon
      await AppIconManager.hideAppIcon();
      store.setAppHidden(true);

      // Schedule timer expiry with AlarmManager
      await AlarmManagerModule.scheduleTimerExpiry(endTime);

      // Update store
      store.setTimerActive(true);
      store.setTimerEndTime(endTime);
      store.setDurationMinutes(durationMinutes);

      // Start foreground background task
      await TimerService.startBackgroundTask(endTime);

      return true;
    } catch (error) {
      console.error('Error starting timer:', error);
      Alert.alert('Error', 'Failed to start timer: ' + (error as Error).message);
      return false;
    }
  }

  /**
   * Stop the timer manually
   */
  static async stopTimer(): Promise<void> {
    try {
      const store = useAppStore.getState();

      // Stop background task
      await BackgroundActions.stop();

      // Stop VPN
      await VPNModule.stopVPN();
      store.setVPNActive(false);

      // Show app icon
      await AppIconManager.showAppIcon();
      store.setAppHidden(false);

      // Cancel alarm
      await AlarmManagerModule.cancelTimerAlarm();

      // Clear timer state
      await BlocklistService.clearTimerState();
      await SharedPrefsModule.clearTimerState();
      store.setTimerActive(false);
      store.setTimerEndTime(null);
      store.setRemainingSeconds(0);

      // Cancel notification
      await notifee.cancelNotification(TIMER_NOTIFICATION_ID.toString());

      Alert.alert('Timer Stopped', 'The timer has been stopped and the app is now visible.');
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  }

  /**
   * Start background task to update timer notification
   */
  private static async startBackgroundTask(endTime: number): Promise<void> {
    const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), ms));

    const veryIntensiveTask = async (_taskData?: any) => {
      const store = useAppStore.getState();

      while (BackgroundActions.isRunning()) {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

        if (remaining <= 0) {
          // Timer expired
          await TimerService.handleTimerExpiry();
          break;
        }

        store.setRemainingSeconds(remaining);

        // Update notification
        await TimerService.updateTimerNotification(remaining);

        // Wait 10 seconds before next update
        await sleep(10000);
      }
    };

    const options = {
      taskName: 'Musafir Timer',
      taskTitle: 'مسافر Protection Active',
      taskDesc: 'AI content filtering is running',
      taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
      },
      color: '#ff00ff',
      linkingURI: 'musafir://timer',
      progressBar: {
        max: 100,
        value: 0,
      },
    };

    await BackgroundActions.start(veryIntensiveTask, options);
  }

  /**
   * Update timer notification with remaining time
   */
  private static async updateTimerNotification(remainingSeconds: number): Promise<void> {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    const timeString =
      hours > 0
        ? `${hours}h ${minutes}m ${seconds}s`
        : minutes > 0
        ? `${minutes}m ${seconds}s`
        : `${seconds}s`;

    await notifee.displayNotification({
      id: TIMER_NOTIFICATION_ID.toString(),
      title: 'مسافر Protection Active',
      body: `Time remaining: ${timeString}`,
      android: {
        channelId: NOTIFICATION_CHANNEL_ID,
        importance: AndroidImportance.LOW,
        ongoing: true,
        smallIcon: 'ic_launcher',
      },
    });
  }

  /**
   * Handle timer expiry
   */
  private static async handleTimerExpiry(): Promise<void> {
    const store = useAppStore.getState();

    // Stop VPN
    await VPNModule.stopVPN();
    store.setVPNActive(false);

    // Show app icon
    await AppIconManager.showAppIcon();
    store.setAppHidden(false);

    // Clear timer state
    await BlocklistService.clearTimerState();
    await SharedPrefsModule.clearTimerState();
    store.setTimerActive(false);
    store.setTimerEndTime(null);
    store.setRemainingSeconds(0);

    // Stop background task
    await BackgroundActions.stop();

    // Show expiry notification
    await notifee.displayNotification({
      title: 'Protection Complete',
      body: 'Musafir timer has ended. The app is now visible.',
      android: {
        channelId: NOTIFICATION_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
      },
    });
  }

  /**
   * Initialize notification channel
   */
  static async initializeNotificationChannel(): Promise<void> {
    await notifee.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: NOTIFICATION_CHANNEL_NAME,
      importance: AndroidImportance.LOW,
    });
  }

  /**
   * Check and restore timer state on app startup
   */
  static async restoreTimerState(): Promise<void> {
    try {
      const timerState = await BlocklistService.loadTimerState();
      if (!timerState) return;

      const { endTime, durationMinutes } = timerState;
      const now = Date.now();

      if (endTime > now) {
        // Timer is still active
        const store = useAppStore.getState();
        const remainingSeconds = Math.floor((endTime - now) / 1000);

        store.setTimerActive(true);
        store.setTimerEndTime(endTime);
        store.setDurationMinutes(durationMinutes);
        store.setRemainingSeconds(remainingSeconds);

        // Restart background task
        await TimerService.startBackgroundTask(endTime);

        // Check VPN status
        const isVPNActive = await VPNModule.isVPNActive();
        store.setVPNActive(isVPNActive);

        // Check icon status
        const isIconVisible = await AppIconManager.isIconVisible();
        store.setAppHidden(!isIconVisible);
      } else {
        // Timer expired while app was closed
        await BlocklistService.clearTimerState();
        await TimerService.handleTimerExpiry();
      }
    } catch (error) {
      console.error('Error restoring timer state:', error);
    }
  }
}

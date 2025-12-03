import { Alert, Platform, BackHandler } from 'react-native';
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
    const store = useAppStore.getState();
    
    try {
      // Calculate end time
      const endTime = Date.now() + durationMinutes * 60 * 1000;

      // Initialize notification channel first (required for Android)
      await TimerService.initializeNotificationChannel();

      // Save timer state for persistence FIRST
      try {
        await BlocklistService.saveTimerState(endTime, durationMinutes);
        await SharedPrefsModule.saveTimerState(endTime, durationMinutes);
      } catch (saveError) {
        console.error('Failed to save timer state:', saveError);
        // Continue anyway - not critical
      }

      // Start VPN with AI-powered filtering
      try {
        const vpnStarted = await VPNModule.startVPN();
        if (!vpnStarted) {
          Alert.alert('Error', 'Failed to start VPN service. Please grant VPN permission.');
          return false;
        }
        store.setVPNActive(true);
        console.log('VPN started successfully');
      } catch (vpnError) {
        console.error('VPN start error:', vpnError);
        Alert.alert('VPN Error', 'Could not start VPN protection. Please try again.');
        return false;
      }

      // Update store state
      store.setTimerActive(true);
      store.setTimerEndTime(endTime);
      store.setDurationMinutes(durationMinutes);

      // Schedule timer expiry with AlarmManager (non-critical)
      try {
        await AlarmManagerModule.scheduleTimerExpiry(endTime);
        console.log('Alarm scheduled successfully');
      } catch (alarmError) {
        console.error('Alarm scheduling error (non-fatal):', alarmError);
      }

      // Start foreground background task (non-critical)
      try {
        await TimerService.startBackgroundTask(endTime);
        console.log('Background task started successfully');
      } catch (bgError) {
        console.error('Background task error (non-fatal):', bgError);
      }

      // Show success message
      // Icon hiding is handled separately after user confirms
      Alert.alert(
        'Protection Activated',
        'Musafir AI protection is now active!\n\nThe VPN is filtering harmful content. Tap OK to minimize the app.',
        [{ 
          text: 'OK',
          onPress: () => {
            // Schedule icon hiding for after the alert closes
            // Use a native approach to minimize the app
            setTimeout(() => {
              TimerService.hideAppAndMinimize(store);
            }, 300);
          }
        }]
      );

      return true;
    } catch (error) {
      console.error('Error starting timer:', error);
      // Reset state on failure
      store.setTimerActive(false);
      store.setVPNActive(false);
      Alert.alert('Error', 'Failed to start timer: ' + (error as Error).message);
      return false;
    }
  }

  /**
   * Helper to hide app icon and minimize - runs async, won't block
   */
  private static hideAppAndMinimize(store: ReturnType<typeof useAppStore.getState>) {
    // Run icon hiding in background - don't await to prevent blocking
    (async () => {
      try {
        // First try to hide the icon
        await AppIconManager.hideAppIcon();
        store.setAppHidden(true);
        console.log('App icon hidden successfully');
      } catch (hideError) {
        console.error('Icon hide error (continuing anyway):', hideError);
        // Don't crash - just leave icon visible
      }
      
      // Then minimize the app (exit to home)
      try {
        BackHandler.exitApp();
      } catch (exitError) {
        console.error('Exit app error:', exitError);
      }
    })();
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
      try {
        const store = useAppStore.getState();

        while (BackgroundActions.isRunning()) {
          try {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

            if (remaining <= 0) {
              // Timer expired
              await TimerService.handleTimerExpiry();
              break;
            }

            store.setRemainingSeconds(remaining);

            // Update notification (non-critical)
            try {
              await TimerService.updateTimerNotification(remaining);
            } catch (notifError) {
              console.error('Notification update error:', notifError);
            }

            // Wait 10 seconds before next update
            await sleep(10000);
          } catch (loopError) {
            console.error('Background loop error:', loopError);
            await sleep(5000); // Wait and retry
          }
        }
      } catch (taskError) {
        console.error('Background task error:', taskError);
      }
    };

    const options = {
      taskName: 'MusafirTimer',
      taskTitle: 'Musafir Protection Active',
      taskDesc: 'AI content filtering is running',
      taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
      },
      color: '#1e3a5f',
      // Removed linkingURI as it can cause issues
      // Removed progressBar as it can cause issues on some devices
    };

    // Wrap in try-catch to prevent crash
    try {
      await BackgroundActions.start(veryIntensiveTask, options);
    } catch (startError) {
      console.error('Failed to start background actions:', startError);
      // Continue without background task - VPN and alarm still work
    }
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

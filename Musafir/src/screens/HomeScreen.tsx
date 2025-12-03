import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useAppStore } from '../store/appStore';
import { TimerService } from '../services/TimerService';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { Header } from '../components/Header';
import * as DeviceAdminModule from '../native/DeviceAdminModule';

export const HomeScreen = () => {
  const {
    timer,
    isVPNActive,
    isAppHidden,
    isDeviceAdmin,
    setDeviceAdmin,
  } = useAppStore();

  const [customDuration, setCustomDuration] = useState('');

  useEffect(() => {
    // Check for permissions on mount
    TimerService.requestPermissions();
    // Restore timer state
    TimerService.restoreTimerState();
  }, []);

  const handleToggleAdmin = async () => {
    if (isDeviceAdmin) {
      Alert.alert(
        'Remove Protection?',
        'This will allow the app to be uninstalled. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                await DeviceAdminModule.removeDeviceAdmin();
                setDeviceAdmin(false);
              } catch (error) {
                Alert.alert('Error', 'Failed to remove device admin.');
              }
            },
          },
        ],
      );
    } else {
      try {
        const granted = await DeviceAdminModule.requestDeviceAdmin();
        setDeviceAdmin(granted);
        if (granted) {
          Alert.alert('Success', 'Uninstall protection is now enabled.');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to enable device admin.');
      }
    }
  };

  const handleStartTimer = async (minutes: number) => {
    if (minutes <= 0) {
      Alert.alert(
        'Invalid Duration',
        'Please enter a valid duration in minutes.',
      );
      return;
    }

    Alert.alert(
      'Activate Musafir Protection?',
      `This will:\n\n• Hide the app icon\n• Enable AI-powered content filtering\n• Block all haram & adult content\n• Run for ${formatDuration(minutes)}\n\n⚠️ You cannot easily cancel this.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          style: 'destructive',
          onPress: async () => {
            const success = await TimerService.startTimer(minutes);
            if (success) {
              setCustomDuration('');
            }
          },
        },
      ],
    );
  };

  const handleStopTimer = () => {
    Alert.alert(
      'Emergency Stop?',
      'Are you absolutely sure? This should only be used in genuine emergencies.\n\nRemember: "Indeed, Allah is ever, over you, an Observer." (4:1)',
      [
        { text: 'Keep Protection', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => TimerService.stopTimer(),
        },
      ],
    );
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} minutes`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours`;
    if (minutes < 10080) return `${Math.floor(minutes / 1440)} days`;
    return `${Math.floor(minutes / 10080)} weeks`;
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="light-content" />

      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Timer Section */}
        {timer.isActive ? (
          <View style={styles.activeContainer}>
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>Musafir Active</Text>
              <Text style={styles.countdown}>
                {formatTime(timer.remainingSeconds)}
              </Text>
              <Text style={styles.statusSubtitle}>
                App is hidden. Content is blocked.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={handleStopTimer}
            >
              <Text style={styles.buttonText}>Emergency Stop</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.controlPanel}>
            <View style={styles.modeOptions}>
              <TouchableOpacity
                style={styles.modeButton}
                onPress={() => handleStartTimer(60)}
              >
                <Text style={styles.modeButtonText}>1 Hour</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modeButton}
                onPress={() => handleStartTimer(1440)}
              >
                <Text style={styles.modeButtonText}>24 Hours</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modeButton}
                onPress={() => handleStartTimer(10080)}
              >
                <Text style={styles.modeButtonText}>1 Week</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modeButton}
                onPress={() => handleStartTimer(43200)}
              >
                <Text style={styles.modeButtonText}>1 Month</Text>
              </TouchableOpacity>
            </View>

            

            <View style={styles.customInputContainer}>
              <Text style={styles.customLabel}>Custom (minutes)</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 30"
                  keyboardType="numeric"
                  value={customDuration}
                  onChangeText={setCustomDuration}
                  placeholderTextColor={colors.textLight}
                />
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={() =>
                    handleStartTimer(parseInt(customDuration) || 0)
                  }
                >
                  <Text style={styles.buttonText}>Activate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        {/* Ayah Card - centered between presets and custom input */}
            <View style={styles.ayahCard}>
              <Text style={styles.ayahCardText}>
                ...And protect their private parts (from illegal sexual Acts e.g). That is pure for them. Verily Allah is All aware what they do” [24:30].
              </Text>
            </View>
        {/* AI Protection Info Card */}
        <View style={styles.aiInfoCard}>
          <Text style={styles.aiInfoTitle}>🤖 AI-Powered Protection</Text>
          <Text style={styles.aiInfoText}>
            Musafir uses intelligent content filtering to automatically detect and block:
          </Text>
          <View style={styles.aiFeatureList}>
            <Text style={styles.aiFeatureItem}>• Adult & pornographic content</Text>
            <Text style={styles.aiFeatureItem}>• Gambling websites</Text>
            <Text style={styles.aiFeatureItem}>• Harmful search queries</Text>
            <Text style={styles.aiFeatureItem}>• Dating & hookup apps</Text>
            <Text style={styles.aiFeatureItem}>• Drug & alcohol content</Text>
          </View>
          <Text style={styles.aiInfoNote}>
            No manual configuration needed - protection is autonomous.
          </Text>
        </View>

        {/* Status Section */}
        <View style={styles.statusSection}>
          <Text style={styles.statusSectionTitle}>Status</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, isVPNActive && styles.statusActive]} />
            <Text style={styles.statusLabel}>
              VPN Filter: {isVPNActive ? 'Active' : 'Ready'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, isAppHidden && styles.statusActive]} />
            <Text style={styles.statusLabel}>
              App Icon: {isAppHidden ? 'Hidden' : 'Visible'}
            </Text>
          </View>
          <TouchableOpacity style={styles.statusRow} onPress={handleToggleAdmin}>
            <View style={[styles.statusIndicator, isDeviceAdmin && styles.statusActive]} />
            <Text style={styles.statusLabel}>
              Uninstall Protection: {isDeviceAdmin ? 'Enabled' : 'Disabled'}
            </Text>
            <Text style={styles.statusAction}>
              {isDeviceAdmin ? 'Tap to disable' : 'Tap to enable'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    flexGrow: 1,
    paddingBottom: 20,
  },
  controlPanel: {
    marginBottom: 20,
  },
  modeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modeButton: {
    width: '48%',
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modeButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.primary,
  },
  customInputContainer: {
    marginBottom: 20,
  },
  customLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 2,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  stopButton: {
    backgroundColor: '#D32F2F',
    marginTop: 20,
    width: '100%',
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
    fontFamily: fonts.primary,
  },
  activeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  statusCard: {
    backgroundColor: colors.statusBg,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.statusText,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  countdown: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.statusText,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 1,
  },
  statusSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  ayahCard: {
    backgroundColor: colors.primaryDark,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  ayahCardText: {
    color: colors.white,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: fonts.primary,
    fontStyle: 'italic',
  },
  // AI Info Card Styles
  aiInfoCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  aiInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    fontFamily: fonts.primary,
  },
  aiInfoText: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 12,
    lineHeight: 20,
  },
  aiFeatureList: {
    marginBottom: 12,
  },
  aiFeatureItem: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 6,
    paddingLeft: 8,
  },
  aiInfoNote: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  // Status Section Styles
  statusSection: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginRight: 12,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusLabel: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  statusSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  statusAction: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
});

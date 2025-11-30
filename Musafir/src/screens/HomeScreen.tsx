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
} from 'react-native';
import { useAppStore } from '../store/appStore';
import { TimerService } from '../services/TimerService';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

export const HomeScreen = () => {
  const { timer, isVPNActive, isAppHidden } = useAppStore();

  const [customDuration, setCustomDuration] = useState('');

  useEffect(() => {
    // Check for permissions on mount
    TimerService.requestPermissions();
    // Restore timer state
    TimerService.restoreTimerState();
  }, []);

  const handleStartTimer = async (minutes: number) => {
    if (minutes <= 0) {
      Alert.alert(
        'Invalid Duration',
        'Please enter a valid duration in minutes.',
      );
      return;
    }

    Alert.alert(
      'Start HaramBlocker?',
      `This will hide the app and block harmful content for ${minutes} minutes. You cannot cancel this easily.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
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
      'Stop Timer?',
      'Are you sure you want to stop the timer? This will re-enable access to all content.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => TimerService.stopTimer(),
        },
      ],
    );
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={colors.primaryDark}
        barStyle="light-content"
      />

      <View style={styles.header}>
        <Text style={styles.title}>Musafir</Text>
        <Text style={styles.tagline}>Musafir - Guardian of Digital Purity</Text>
        <Text style={styles.ayah}>
          "Tell the believing men to lower their gaze..." (Quran 24:30)
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {timer.isActive ? (
          <View style={styles.activeContainer}>
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>HaramBlocker Active</Text>
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
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          VPN: {isVPNActive ? 'Active' : 'Inactive'} | Icon:{' '}
          {isAppHidden ? 'Hidden' : 'Visible'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primaryDark,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontFamily: fonts.primary,
    fontSize: 32,
    color: colors.white,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: colors.tagline,
    fontWeight: '600',
    marginBottom: 8,
  },
  ayah: {
    fontSize: 14,
    color: colors.ayah,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  content: {
    padding: 20,
    flexGrow: 1,
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
  },
  activeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
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
  footer: {
    padding: 16,
    backgroundColor: '#eff8ef',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textLight,
  },
});

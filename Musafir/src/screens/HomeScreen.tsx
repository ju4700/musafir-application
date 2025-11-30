import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/appStore';
import { TimerService } from '../services/TimerService';
import { TimerInput } from '../components/TimerInput';
import { StatusCard } from '../components/StatusCard';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [isStarting, setIsStarting] = useState(false);

  const timer = useAppStore(state => state.timer);
  const isVPNActive = useAppStore(state => state.isVPNActive);
  const isAppHidden = useAppStore(state => state.isAppHidden);

  useEffect(() => {
    // Initialize notification channel
    TimerService.initializeNotificationChannel();

    // Restore timer state if app was closed
    TimerService.restoreTimerState();
  }, []);

  const handleStartTimer = async () => {
    if (durationMinutes <= 0) {
      Alert.alert('Invalid Duration', 'Please set a duration greater than 0');
      return;
    }

    Alert.alert(
      'Start Timer?',
      `Starting the timer for ${Math.floor(durationMinutes / 60)}h ${
        durationMinutes % 60
      }m will:\n\n` +
        '• Hide this app from your home screen\n' +
        '• Block harmful content via VPN\n' +
        '• Make it hard to stop until timer expires\n\n' +
        'Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          style: 'destructive',
          onPress: async () => {
            setIsStarting(true);
            const success = await TimerService.startTimer(durationMinutes);
            setIsStarting(false);

            if (success) {
              Alert.alert(
                'Timer Started!',
                'The app will now hide. Open from settings if you need to check the timer.',
                [{ text: 'OK' }],
              );
            }
          },
        },
      ],
    );
  };

  const handleStopTimer = async () => {
    Alert.alert(
      'Stop Timer?',
      'This will stop the timer and re-enable the app. Are you sure?',
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

  const navigateToSettings = () => {
    navigation.navigate('Settings' as never);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🛡️ HaramBlocker</Text>
      <Text style={styles.subtitle}>Content Blocking Timer</Text>

      <StatusCard
        isActive={timer.isActive}
        endTime={timer.endTime}
        isVPNActive={isVPNActive}
        isHidden={isAppHidden}
        remainingSeconds={timer.remainingSeconds}
        onStop={timer.isActive ? handleStopTimer : undefined}
      />

      {!timer.isActive && (
        <>
          <TimerInput
            onDurationChange={setDurationMinutes}
            initialDuration={timer.durationMinutes}
          />

          <TouchableOpacity
            style={[
              styles.startButton,
              isStarting && styles.startButtonDisabled,
            ]}
            onPress={handleStartTimer}
            disabled={isStarting}
          >
            <Text style={styles.startButtonText}>
              {isStarting ? 'Starting...' : '🚀 Start Timer'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={navigateToSettings}
          >
            <Text style={styles.settingsButtonText}>⚙️ Manage Blocklist</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ How it works:</Text>
        <Text style={styles.infoText}>
          1. Set your desired timer duration{'\n'}
          2. Start the timer{'\n'}
          3. App will hide and block harmful sites{'\n'}
          4. App reappears when timer ends{'\n'}
          5. VPN filters all browser traffic
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200EE',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  settingsButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#6200EE',
  },
  settingsButtonText: {
    color: '#6200EE',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoBox: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 22,
  },
});

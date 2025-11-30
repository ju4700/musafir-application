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
  FlatList,
} from 'react-native';
import { useAppStore } from '../store/appStore';
import { TimerService } from '../services/TimerService';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { Header } from '../components/Header';

export const HomeScreen = () => {
  const {
    timer,
    isVPNActive,
    isAppHidden,
    blocklist,
    addBlockedDomain,
    removeBlockedDomain,
    resetBlocklist,
  } = useAppStore();

  const [customDuration, setCustomDuration] = useState('');
  const [newDomain, setNewDomain] = useState('');

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

  const handleAddDomain = () => {
    if (!newDomain.trim()) {
      Alert.alert('Error', 'Please enter a domain');
      return;
    }

    const domainRegex =
      /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newDomain)) {
      Alert.alert('Error', 'Please enter a valid domain (e.g., example.com)');
      return;
    }

    if (blocklist.includes(newDomain)) {
      Alert.alert('Error', 'Domain is already in the blocklist');
      return;
    }

    addBlockedDomain(newDomain);
    setNewDomain('');
  };

  const handleRemoveDomain = (domain: string) => {
    Alert.alert(
      'Remove Domain',
      `Are you sure you want to remove ${domain} from the blocklist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeBlockedDomain(domain),
        },
      ],
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Blocklist',
      'This will restore the default blocklist. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: resetBlocklist,
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
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />

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

        {/* Settings Section */}
        <View style={styles.settingsSection}>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add to Blocklist</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="e.g., facebook.com"
                value={newDomain}
                onChangeText={setNewDomain}
                autoCapitalize="none"
                placeholderTextColor={colors.textLight}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddDomain}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              Blocked Domains ({blocklist.length})
            </Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset Default</Text>
            </TouchableOpacity>
          </View>

          {blocklist.map(item => (
            <View key={item} style={styles.listItem}>
              <View style={styles.domainInfo}>
                <Text style={styles.domainIcon}>🚫</Text>
                <Text style={styles.domainText}>{item}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveDomain(item)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            VPN: {isVPNActive ? 'Active' : 'Inactive'} | Icon:{' '}
            {isAppHidden ? 'Hidden' : 'Visible'}
          </Text>
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
  },
  controlPanel: {
    marginBottom: 30,
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
  settingsSection: {
    marginTop: -30,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    fontFamily: fonts.primary,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    fontFamily: fonts.primary,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily: fonts.primary,
  },
  resetText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  domainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  domainIcon: {
    fontSize: 16,
  },
  domainText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  removeButtonText: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: colors.textLight,
  },
});

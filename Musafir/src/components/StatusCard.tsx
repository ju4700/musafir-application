import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface StatusCardProps {
  isActive: boolean;
  endTime: number | null;
  isVPNActive: boolean;
  isHidden: boolean;
  remainingSeconds: number;
  onStop?: () => void;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  isActive,
  endTime,
  isVPNActive,
  isHidden,
  remainingSeconds,
  onStop,
}) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (!isActive) {
    return (
      <View style={[styles.container, styles.inactiveContainer]}>
        <Text style={styles.statusText}>Timer Inactive</Text>
        <Text style={styles.description}>
          Set a duration and start the timer to begin
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.activeContainer]}>
      <Text style={styles.statusText}>🔒 Timer Active</Text>

      <View style={styles.timeContainer}>
        <Text style={styles.timeLabel}>Time Remaining:</Text>
        <Text style={styles.timeValue}>{formatTime(remainingSeconds)}</Text>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>VPN:</Text>
          <Text style={[styles.statusDot, isVPNActive && styles.activeDot]}>
            {isVPNActive ? '● Active' : '○ Inactive'}
          </Text>
        </View>

        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>App Hidden:</Text>
          <Text style={[styles.statusDot, isHidden && styles.activeDot]}>
            {isHidden ? '● Yes' : '○ No'}
          </Text>
        </View>
      </View>

      {onStop && (
        <TouchableOpacity style={styles.stopButton} onPress={onStop}>
          <Text style={styles.stopButtonText}>Stop Timer (Testing Only)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inactiveContainer: {
    backgroundColor: '#F5F5F5',
  },
  activeContainer: {
    backgroundColor: '#C8E6C9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  statusText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statusDot: {
    fontSize: 14,
    color: '#999',
  },
  activeDot: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

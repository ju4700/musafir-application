import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface TimerInputProps {
  onDurationChange: (minutes: number) => void;
  initialDuration?: number;
}

export const TimerInput: React.FC<TimerInputProps> = ({
  onDurationChange,
  initialDuration = 60,
}) => {
  const [hours, setHours] = useState(
    Math.floor(initialDuration / 60).toString(),
  );
  const [minutes, setMinutes] = useState((initialDuration % 60).toString());

  const handleHoursChange = (text: string) => {
    const value = text.replace(/[^0-9]/g, '');
    setHours(value);
    const totalMinutes = (parseInt(value) || 0) * 60 + (parseInt(minutes) || 0);
    onDurationChange(totalMinutes);
  };

  const handleMinutesChange = (text: string) => {
    const value = text.replace(/[^0-9]/g, '');
    if (parseInt(value) > 59) return;
    setMinutes(value);
    const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(value) || 0);
    onDurationChange(totalMinutes);
  };

  const setQuickDuration = (totalMinutes: number) => {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    setHours(hrs.toString());
    setMinutes(mins.toString());
    onDurationChange(totalMinutes);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Set Timer Duration</Text>

      <View style={styles.inputContainer}>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            value={hours}
            onChangeText={handleHoursChange}
            keyboardType="numeric"
            maxLength={2}
            placeholder="0"
            placeholderTextColor="#888"
          />
          <Text style={styles.unit}>hours</Text>
        </View>

        <Text style={styles.separator}>:</Text>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            value={minutes}
            onChangeText={handleMinutesChange}
            keyboardType="numeric"
            maxLength={2}
            placeholder="0"
            placeholderTextColor="#888"
          />
          <Text style={styles.unit}>minutes</Text>
        </View>
      </View>

      <View style={styles.quickButtons}>
        <Text style={styles.quickLabel}>Quick Select:</Text>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => setQuickDuration(30)}
        >
          <Text style={styles.quickButtonText}>30m</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => setQuickDuration(60)}
        >
          <Text style={styles.quickButtonText}>1h</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => setQuickDuration(120)}
        >
          <Text style={styles.quickButtonText}>2h</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => setQuickDuration(240)}
        >
          <Text style={styles.quickButtonText}>4h</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    alignItems: 'center',
  },
  input: {
    width: 80,
    height: 60,
    borderWidth: 2,
    borderColor: '#6200EE',
    borderRadius: 8,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  unit: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  separator: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200EE',
    marginHorizontal: 12,
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  quickLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
    width: '100%',
    textAlign: 'center',
    marginBottom: 8,
  },
  quickButton: {
    backgroundColor: '#E1BEE7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickButtonText: {
    color: '#6200EE',
    fontWeight: '600',
    fontSize: 14,
  },
});

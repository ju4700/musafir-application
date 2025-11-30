import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useAppStore } from '../store/appStore';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { Navbar } from '../components/Navbar';

export const SettingsScreen = () => {
  const { blocklist, addBlockedDomain, removeBlockedDomain, resetBlocklist } =
    useAppStore();
  const [newDomain, setNewDomain] = useState('');

  const handleAddDomain = () => {
    if (!newDomain.trim()) {
      Alert.alert('Error', 'Please enter a domain');
      return;
    }

    // Simple validation
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Blocklist Settings</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add domain (e.g., example.com)"
          value={newDomain}
          onChangeText={setNewDomain}
          autoCapitalize="none"
          placeholderTextColor={colors.textLight}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddDomain}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={blocklist}
        keyExtractor={item => item}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text style={styles.itemText}>{item}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveDomain(item)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>
              Blocked Domains ({blocklist.length})
            </Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset to Default</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <Navbar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primaryDark,
    padding: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontFamily: fonts.primary,
    fontSize: 24,
    color: colors.white,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: '#FAFAFA',
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontFamily: fonts.primary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding for Navbar
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  resetText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '600',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  itemText: {
    fontSize: 14,
    color: colors.text,
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '600',
  },
});

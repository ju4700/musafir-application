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
  StatusBar,
} from 'react-native';
import { useAppStore } from '../store/appStore';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { Navbar } from '../components/Navbar';
import { Header } from '../components/Header';

export const SettingsScreen = () => {
  const { blocklist, addBlockedDomain, removeBlockedDomain, resetBlocklist } =
    useAppStore();
  const [newDomain, setNewDomain] = useState('');

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
      <Header />

      <View style={styles.content}>
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

        <FlatList
          data={blocklist}
          keyExtractor={item => item}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
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
          )}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          VPN: {useAppStore.getState().isVPNActive ? 'Active' : 'Inactive'} |
          Icon: {useAppStore.getState().isAppHidden ? 'Hidden' : 'Visible'}
        </Text>
      </View>
      <Navbar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
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
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: 'transparent',
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
  listContent: {
    paddingBottom: 20,
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
    marginBottom: 90, // Space for Navbar
  },
  footerText: {
    fontSize: 12,
    color: colors.textLight,
  },
});

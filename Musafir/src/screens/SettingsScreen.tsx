import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppStore } from '../store/appStore';
import { BlocklistService } from '../services/BlocklistService';

export const SettingsScreen: React.FC = () => {
  const blocklist = useAppStore(state => state.blocklist);
  const setBlocklist = useAppStore(state => state.setBlocklist);
  const [newDomain, setNewDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBlocklist();
  }, []);

  const loadBlocklist = async () => {
    const loaded = await BlocklistService.loadBlocklist();
    setBlocklist(loaded);
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      Alert.alert('Error', 'Please enter a domain');
      return;
    }

    setIsLoading(true);
    try {
      const updated = await BlocklistService.addDomain(
        blocklist,
        newDomain.trim(),
      );
      setBlocklist(updated);
      setNewDomain('');
      Alert.alert('Success', 'Domain added to blocklist');
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDomain = async (domain: string) => {
    Alert.alert('Remove Domain?', `Remove "${domain}" from blocklist?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = await BlocklistService.removeDomain(
              blocklist,
              domain,
            );
            setBlocklist(updated);
          } catch (error) {
            Alert.alert('Error', (error as Error).message);
          }
        },
      },
    ]);
  };

  const handleResetToDefault = async () => {
    Alert.alert(
      'Reset Blocklist?',
      'This will reset the blocklist to default harmful domains. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const reset = await BlocklistService.resetToDefault();
            setBlocklist(reset);
            Alert.alert('Success', 'Blocklist reset to default');
          },
        },
      ],
    );
  };

  const renderDomainItem = ({ item }: { item: string }) => (
    <View style={styles.domainItem}>
      <Text style={styles.domainText}>{item}</Text>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveDomain(item)}
      >
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Blocklist</Text>
      <Text style={styles.subtitle}>Domains to block across all browsers</Text>

      <View style={styles.addContainer}>
        <TextInput
          style={styles.input}
          value={newDomain}
          onChangeText={setNewDomain}
          placeholder="example.com"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.addButton, isLoading && styles.addButtonDisabled]}
          onPress={handleAddDomain}
          disabled={isLoading}
        >
          <Text style={styles.addButtonText}>{isLoading ? '...' : '+'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>
          {blocklist.length} {blocklist.length === 1 ? 'domain' : 'domains'}{' '}
          blocked
        </Text>
        <TouchableOpacity onPress={handleResetToDefault}>
          <Text style={styles.resetButton}>Reset to Default</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={blocklist}
        renderItem={renderDomainItem}
        keyExtractor={(item, index) => `${item}-${index}`}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No domains in blocklist. Add some above.
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  addContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  addButton: {
    width: 50,
    height: 50,
    backgroundColor: '#6200EE',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeaderText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  resetButton: {
    color: '#6200EE',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  domainItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  domainText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#F44336',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 40,
  },
});

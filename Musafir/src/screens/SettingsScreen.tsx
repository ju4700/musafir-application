import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAppStore } from '../store/appStore';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { Navbar } from '../components/Navbar';
import { Header } from '../components/Header';
import * as DeviceAdminModule from '../native/DeviceAdminModule';

export const SettingsScreen = () => {
  const { isVPNActive, isAppHidden, isDeviceAdmin, setDeviceAdmin } = useAppStore();

  const handleRequestAdmin = async () => {
    try {
      const granted = await DeviceAdminModule.requestDeviceAdmin();
      setDeviceAdmin(granted);
      if (granted) {
        Alert.alert('Success', 'Uninstall protection is now enabled.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request device admin permission.');
    }
  };

  const handleRemoveAdmin = () => {
    Alert.alert(
      'Remove Protection?',
      'This will allow the app to be uninstalled normally. Are you sure?',
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
      <Header />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* AI Protection Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤖 AI Content Filter</Text>
          <Text style={styles.cardDescription}>
            Musafir uses an intelligent AI-powered system to automatically detect and block harmful content. The filter analyzes:
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Domain names and URLs</Text>
            <Text style={styles.featureItem}>• Search queries and keywords</Text>
            <Text style={styles.featureItem}>• Content patterns and categories</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.statusBadgeText}>Always Active When Timer Running</Text>
          </View>
        </View>

        {/* Blocked Categories */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚫 Blocked Categories</Text>
          <View style={styles.categoryGrid}>
            <View style={styles.categoryItem}>
              <Text style={styles.categoryEmoji}>🔞</Text>
              <Text style={styles.categoryText}>Adult Content</Text>
            </View>
            <View style={styles.categoryItem}>
              <Text style={styles.categoryEmoji}>🎰</Text>
              <Text style={styles.categoryText}>Gambling</Text>
            </View>
            <View style={styles.categoryItem}>
              <Text style={styles.categoryEmoji}>🍺</Text>
              <Text style={styles.categoryText}>Alcohol</Text>
            </View>
            <View style={styles.categoryItem}>
              <Text style={styles.categoryEmoji}>💊</Text>
              <Text style={styles.categoryText}>Drugs</Text>
            </View>
            <View style={styles.categoryItem}>
              <Text style={styles.categoryEmoji}>💔</Text>
              <Text style={styles.categoryText}>Dating Apps</Text>
            </View>
            <View style={styles.categoryItem}>
              <Text style={styles.categoryEmoji}>⚠️</Text>
              <Text style={styles.categoryText}>Violence</Text>
            </View>
          </View>
        </View>

        {/* Uninstall Protection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛡️ Uninstall Protection</Text>
          <Text style={styles.cardDescription}>
            {isDeviceAdmin 
              ? 'Device admin is enabled. The app cannot be easily uninstalled while the timer is active.'
              : 'Enable device admin to prevent the app from being uninstalled during active protection.'}
          </Text>
          <TouchableOpacity
            style={[
              styles.adminButton,
              isDeviceAdmin ? styles.adminButtonRemove : styles.adminButtonEnable,
            ]}
            onPress={isDeviceAdmin ? handleRemoveAdmin : handleRequestAdmin}
          >
            <Text style={[
              styles.adminButtonText,
              isDeviceAdmin ? styles.adminButtonTextRemove : styles.adminButtonTextEnable,
            ]}>
              {isDeviceAdmin ? 'Remove Protection' : 'Enable Protection'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Current Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Current Status</Text>
          <View style={styles.statusList}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>VPN Filter</Text>
              <View style={[styles.statusPill, isVPNActive && styles.statusPillActive]}>
                <Text style={[styles.statusPillText, isVPNActive && styles.statusPillTextActive]}>
                  {isVPNActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>App Icon</Text>
              <View style={[styles.statusPill, isAppHidden && styles.statusPillActive]}>
                <Text style={[styles.statusPillText, isAppHidden && styles.statusPillTextActive]}>
                  {isAppHidden ? 'Hidden' : 'Visible'}
                </Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Uninstall Lock</Text>
              <View style={[styles.statusPill, isDeviceAdmin && styles.statusPillActive]}>
                <Text style={[styles.statusPillText, isDeviceAdmin && styles.statusPillTextActive]}>
                  {isDeviceAdmin ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ℹ️ About Musafir</Text>
          <Text style={styles.cardDescription}>
            Musafir (مسافر) means "traveler" in Arabic. This app is designed to help Muslims on their spiritual journey by protecting them from harmful digital content.
          </Text>
          <Text style={styles.ayahText}>
            "Indeed, Allah is ever, over you, an Observer." (4:1)
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    marginBottom: 12,
    fontFamily: fonts.primary,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 22,
    marginBottom: 12,
  },
  featureList: {
    marginBottom: 16,
  },
  featureItem: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 6,
    paddingLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 10,
  },
  categoryItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  adminButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  adminButtonEnable: {
    backgroundColor: colors.primary,
  },
  adminButtonRemove: {
    backgroundColor: '#FFEBEE',
  },
  adminButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  adminButtonTextEnable: {
    color: colors.white,
  },
  adminButtonTextRemove: {
    color: '#D32F2F',
  },
  statusList: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  statusPillActive: {
    backgroundColor: '#E8F5E9',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  statusPillTextActive: {
    color: '#2E7D32',
  },
  ayahText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.primary,
    marginTop: 12,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});

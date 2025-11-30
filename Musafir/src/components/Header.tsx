import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

export const Header = () => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>مسافر</Text>
      <Text style={styles.tagline}>Musafir - Guardian of Digital Purity</Text>
      <Text style={styles.ayah}>
        "Tell the believing men to lower their gaze..." (Quran 24:30)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primaryDark,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    paddingTop: 40, // Extra padding for status bar
  },
  title: {
    marginTop: 8,
    fontWeight: '700',
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
});

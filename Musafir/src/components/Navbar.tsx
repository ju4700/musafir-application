import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

const { width } = Dimensions.get('window');

export const Navbar = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const isActive = (routeName: string) => route.name === routeName;

  return (
    <View style={styles.container}>
      <View style={styles.navBackground}>
        {/* Home Button */}
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => navigation.navigate('Home' as never)}
        >
          <View
            style={[
              styles.iconContainer,
              isActive('Home') && styles.activeIconContainer,
            ]}
          >
            <Text
              style={[
                styles.iconText,
                isActive('Home') && styles.activeIconText,
              ]}
            >
              🏠
            </Text>
          </View>
          <Text style={[styles.label, isActive('Home') && styles.activeLabel]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* Settings Button */}
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => navigation.navigate('Settings' as never)}
        >
          <View
            style={[
              styles.iconContainer,
              isActive('Settings') && styles.activeIconContainer,
            ]}
          >
            <Text
              style={[
                styles.iconText,
                isActive('Settings') && styles.activeIconText,
              ]}
            >
              ⚙️
            </Text>
          </View>
          <Text
            style={[styles.label, isActive('Settings') && styles.activeLabel]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  navBackground: {
    flexDirection: 'row',
    backgroundColor: colors.primaryDark,
    width: '100%',
    height: 80,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 10, // Adjust for safe area if needed, or just visual balance
    elevation: 20, // High elevation for shadow
    shadowColor: 'rgba(10, 14, 18, 0.10)',
    shadowOffset: { width: 0, height: -4 }, // Negative height for top shadow
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeIconContainer: {
    backgroundColor: '#f0f0f0',
  },
  iconText: {
    fontSize: 24,
    color: colors.textLight,
  },
  activeIconText: {
    color: colors.primary,
  },
  label: {
    fontSize: 12,
    color: colors.textLight,
    fontFamily: fonts.primary,
    fontWeight: '600',
  },
  activeLabel: {
    color: colors.primary,
  },
});

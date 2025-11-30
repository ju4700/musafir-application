import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { HomeIcon } from './icons/HomeIcon';
import { SettingsIcon } from './icons/SettingsIcon';

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
            <HomeIcon
              color={
                isActive('Home') ? colors.white : 'rgba(255, 255, 255, 0.5)'
              }
              size={28}
            />
          </View>
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
            <SettingsIcon
              color={
                isActive('Settings') ? colors.white : 'rgba(255, 255, 255, 0.5)'
              }
              size={28}
            />
          </View>
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
    paddingBottom: 0,
    elevation: 20,
    shadowColor: 'rgba(10, 14, 18, 0.10)',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});

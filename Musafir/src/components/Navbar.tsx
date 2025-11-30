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

const { width } = Dimensions.get('window');

export const Navbar = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const isActive = (routeName: string) => route.name === routeName;

  return (
    <View style={styles.container}>
      {/* Black background container */}
      <View style={styles.navBackground}>
        {/* Home Button Container */}
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => navigation.navigate('Home' as never)}
        >
          <View
            style={[
              styles.iconBackground,
              isActive('Home') && styles.activeIconBackground,
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

        {/* Settings Button Container */}
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => navigation.navigate('Settings' as never)}
        >
          <View
            style={[
              styles.iconBackground,
              isActive('Settings') && styles.activeIconBackground,
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
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  navBackground: {
    flexDirection: 'row',
    backgroundColor: 'black',
    width: width * 0.85,
    height: 70,
    borderRadius: 35,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activeIconBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconText: {
    fontSize: 20,
    color: '#888',
  },
  activeIconText: {
    color: '#fff',
  },
  label: {
    fontSize: 10,
    color: '#888',
    fontWeight: '600',
  },
  activeLabel: {
    color: '#fff',
  },
});

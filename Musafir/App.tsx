/**
 * HaramBlocker - Content Blocking Timer App
 * Main entry point with navigation
 */

import React from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#6200EE',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                title: 'HaramBlocker',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                title: 'Blocklist Settings',
                headerShown: true,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;

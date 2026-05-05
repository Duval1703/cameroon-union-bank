import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Platform } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Colors } from './src/constants/Colors';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          {Platform.OS === 'web' ? (
            <View style={styles.webOuter}>
              <View style={styles.webInner}>
                <RootNavigator />
              </View>
            </View>
          ) : (
            <RootNavigator />
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  webOuter: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webInner: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
});

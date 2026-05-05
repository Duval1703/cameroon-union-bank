import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/Dashboard/HomeScreen';
import { NotificationsScreen } from '../screens/Dashboard/NotificationsScreen';
import { OfflineModeScreen } from '../screens/Dashboard/OfflineModeScreen';
import { HelpScreen } from '../screens/Dashboard/HelpScreen';
import { MobileMoneyTransactionsScreen } from '../screens/Dashboard/MobileMoneyTransactionsScreen';

const Stack = createStackNavigator();

export const HomeNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="OfflineMode" component={OfflineModeScreen} />
    <Stack.Screen name="Help" component={HelpScreen} />
    <Stack.Screen name="MobileMoneyTransactions" component={MobileMoneyTransactionsScreen} />
  </Stack.Navigator>
);

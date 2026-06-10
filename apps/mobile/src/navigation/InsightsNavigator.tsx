import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { InventoryHubScreen } from '../screens/Inventory/InventoryHubScreen';

const Stack = createStackNavigator();

export const InsightsNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="InventoryCapture" component={InventoryHubScreen} />
  </Stack.Navigator>
);

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { InventoryHubScreen } from '../screens/Inventory/InventoryHubScreen';

const Stack = createStackNavigator();

export const InventoryNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="RepaymentHub" component={InventoryHubScreen} />
  </Stack.Navigator>
);

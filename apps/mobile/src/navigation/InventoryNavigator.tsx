import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RepaymentHubScreen } from '../screens/Inventory/RepaymentHubScreen';

const Stack = createStackNavigator();

export const InventoryNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="RepaymentHub" component={RepaymentHubScreen} />
  </Stack.Navigator>
);

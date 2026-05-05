import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileScreen } from '../screens/Dashboard/ProfileScreen';
import { LanguageScreen } from '../screens/Dashboard/LanguageScreen';
import { EditProfileScreen } from '../screens/Dashboard/EditProfileScreen';

const Stack = createStackNavigator();

export const ProfileNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="Language" component={LanguageScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
  </Stack.Navigator>
);

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { WelcomeScreen } from '../screens/Landing/WelcomeScreen';
import { OnboardingScreen } from '../screens/Landing/OnboardingScreen';

const Stack = createStackNavigator();

export const OnboardingNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="OnboardingSlides" component={OnboardingScreen} />
  </Stack.Navigator>
);

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/Auth/ForgotPasswordScreen';
import { OTPVerifyScreen } from '../screens/Auth/OTPVerifyScreen';
import { ResetPINScreen } from '../screens/Auth/ResetPINScreen';
import { PrivacyConsentScreen } from '../screens/Auth/PrivacyConsentScreen';
import { DocumentUploadScreen } from '../screens/Verification/DocumentUploadScreen';
import { LivenessScreen } from '../screens/Verification/LivenessScreen';

const Stack = createStackNavigator();

export const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
    <Stack.Screen name="ResetPIN" component={ResetPINScreen} />
    <Stack.Screen name="PrivacyConsent" component={PrivacyConsentScreen} />
    <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
    <Stack.Screen name="Liveness" component={LivenessScreen} />
  </Stack.Navigator>
);

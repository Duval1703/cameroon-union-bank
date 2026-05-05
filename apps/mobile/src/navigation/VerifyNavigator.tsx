import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CaptureScreen } from '../screens/Verification/CaptureScreen';
import { ResultConfirmedScreen } from '../screens/Verification/ResultConfirmedScreen';
import { ResultSuspiciousScreen } from '../screens/Verification/ResultSuspiciousScreen';
import { ResultPendingScreen } from '../screens/Verification/ResultPendingScreen';
import { VerifyHistoryScreen } from '../screens/Verification/VerifyHistoryScreen';
import { DocumentUploadScreen } from '../screens/Verification/DocumentUploadScreen';
import { LivenessScreen } from '../screens/Verification/LivenessScreen';
import { VerificationHubScreen } from '../screens/TrustScore/VerificationHubScreen';

const Stack = createStackNavigator();

export const VerifyNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="VerificationHub" component={VerificationHubScreen} />
    <Stack.Screen name="Capture" component={CaptureScreen} />
    <Stack.Screen name="ResultConfirmed" component={ResultConfirmedScreen} />
    <Stack.Screen name="ResultSuspicious" component={ResultSuspiciousScreen} />
    <Stack.Screen name="ResultPending" component={ResultPendingScreen} />
    <Stack.Screen name="VerifyHistory" component={VerifyHistoryScreen} />
    <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
    <Stack.Screen name="Liveness" component={LivenessScreen} />
  </Stack.Navigator>
);

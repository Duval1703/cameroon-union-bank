import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AIInsightsScreen } from '../screens/Dashboard/AIInsightsScreen';
import { FinancialSummaryScreen } from '../screens/TrustScore/FinancialSummaryScreen';
import { TrustScoreDetailScreen } from '../screens/TrustScore/TrustScoreDetailScreen';
import { StatisticsScreen } from '../screens/Statistics/StatisticsScreen';
import { AIPredictionsScreen } from '../screens/Statistics/AIPredictionsScreen';

const Stack = createStackNavigator();

export const InsightsNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AIInsights" component={AIInsightsScreen} />
    <Stack.Screen name="FinancialSummary" component={FinancialSummaryScreen} />
    <Stack.Screen name="TrustScoreDetail" component={TrustScoreDetailScreen} />
    <Stack.Screen name="Statistics" component={StatisticsScreen} />
    <Stack.Screen name="AIPredictions" component={AIPredictionsScreen} />
  </Stack.Navigator>
);

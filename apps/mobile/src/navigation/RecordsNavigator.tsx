import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RecordsHubScreen } from '../screens/Records/RecordsHubScreen';
import { AddSaleScreen } from '../screens/Records/AddSaleScreen';
import { SalesHistoryScreen } from '../screens/Records/SalesHistoryScreen';
import { AddExpenseScreen } from '../screens/Records/AddExpenseScreen';
import { ExpenseHistoryScreen } from '../screens/Records/ExpenseHistoryScreen';
import { AddStockScreen } from '../screens/Records/AddStockScreen';
import { StockHistoryScreen } from '../screens/Records/StockHistoryScreen';
import { RecordSuccessScreen } from '../screens/Records/RecordSuccessScreen';

const Stack = createStackNavigator();

export const RecordsNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="RecordsHub" component={RecordsHubScreen} />
    <Stack.Screen name="AddSale" component={AddSaleScreen} />
    <Stack.Screen name="SalesHistory" component={SalesHistoryScreen} />
    <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
    <Stack.Screen name="ExpenseHistory" component={ExpenseHistoryScreen} />
    <Stack.Screen name="AddStock" component={AddStockScreen} />
    <Stack.Screen name="StockHistory" component={StockHistoryScreen} />
    <Stack.Screen name="RecordSuccess" component={RecordSuccessScreen} />
  </Stack.Navigator>
);

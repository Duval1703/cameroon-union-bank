import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { HomeNavigator } from './HomeNavigator';
import { VerifyNavigator } from './VerifyNavigator';
import { RecordsNavigator } from './RecordsNavigator';
import { InventoryNavigator } from './InventoryNavigator';
import { InsightsNavigator } from './InsightsNavigator';
import { ProfileNavigator } from './ProfileNavigator';

import { Colors } from '../constants/Colors';
import { rs, vs, ms } from '../utils/responsive';
import { FontSize, FontWeight, Radius } from '../constants/Theme';
import { MainTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabs = [
  { name: 'Home' as const,    label: 'Home',    icon: 'home-outline',           iconActive: 'home' },
  { name: 'Verify' as const,  label: 'Verify',  icon: 'shield-outline',         iconActive: 'shield-checkmark' },
  { name: 'Records' as const, label: 'Records', icon: 'document-text-outline',  iconActive: 'document-text' },
  { name: 'Inventory' as const,label: 'Inventory', icon: 'storefront-outline',   iconActive: 'storefront' },
  { name: 'Insights' as const,label: 'Insights',icon: 'trending-up-outline',    iconActive: 'trending-up' },
  { name: 'Profile' as const, label: 'Profile', icon: 'person-outline',         iconActive: 'person' },
];

export const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} insets={insets} />}
    >
      <Tab.Screen name="Home"     component={HomeNavigator} />
      <Tab.Screen name="Verify"   component={VerifyNavigator} />
      <Tab.Screen name="Records"  component={RecordsNavigator} />
      <Tab.Screen name="Inventory" component={InventoryNavigator} />
      <Tab.Screen name="Insights" component={InsightsNavigator} />
      <Tab.Screen name="Profile"  component={ProfileNavigator} />
    </Tab.Navigator>
  );
};

const CustomTabBar = ({ state, navigation, insets }: any) => {
  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : vs(8) }]}>
      {state.routes.map((route: any, index: number) => {
        const tab = tabs[index];
        const isFocused = state.index === index;
        const isVerify = route.name === 'Verify';

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        if (isVerify) {
          return (
            <View key={route.key} style={styles.tabItem}>
              <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.verifyBtnWrap}>
                <LinearGradient
                  colors={isFocused ? ['#065F46','#059669'] : ['#0D4A35','#1B5E4B']}
                  style={styles.verifyBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Ionicons
                    name={(isFocused ? tab.iconActive : tab.icon) as any}
                    size={rs(22)}
                    color="#fff"
                  />
                </LinearGradient>
              </TouchableOpacity>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </View>
          );
        }

        return (
          <TouchableOpacity key={route.key} style={styles.tabItem} onPress={onPress} activeOpacity={0.8}>
            <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
              <Ionicons
                name={(isFocused ? tab.iconActive : tab.icon) as any}
                size={rs(20)}
                color={isFocused ? '#1B5E4B' : '#9CA3AF'}
              />
              {isFocused && <View style={styles.activeIndicator} />}
            </View>
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: vs(8),
    paddingHorizontal: rs(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: rs(3),
  },
  iconWrap: {
    width: rs(44),
    height: rs(30),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rs(15),
    position: 'relative',
  },
  iconWrapActive: {
    backgroundColor: '#ECFDF5',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: rs(-2),
    width: rs(4),
    height: rs(4),
    borderRadius: rs(2),
    backgroundColor: '#1B5E4B',
  },
  verifyBtnWrap: {
    marginTop: vs(-16),
    shadowColor: '#1B5E4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  verifyBtn: {
    width: rs(52),
    height: rs(52),
    borderRadius: rs(26),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: '#1B5E4B',
    fontWeight: FontWeight.bold,
  },
});

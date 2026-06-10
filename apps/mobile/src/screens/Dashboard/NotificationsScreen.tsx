import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { getPreferences, updatePreferences } from '../../services/api';
import { getAuthToken } from '../../services/storage';

export const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<Record<string,boolean>>({
    fraud: true, sales: true, insights: false, promotions: false, stock: true,
  });

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const token = await getAuthToken();
      if (!token) return;
      const result = await getPreferences(token);
      if (active && result.success) {
        setPrefs(p => ({
          ...p,
          fraud: result.data.push_notifications,
          sales: result.data.push_notifications,
          stock: result.data.push_notifications,
          insights: result.data.email_notifications,
          promotions: result.data.sms_notifications,
        }));
      }
    })();
    return () => { active = false; };
  }, []));

  const toggle = async (key: string) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    const token = await getAuthToken();
    if (!token) return;
    await updatePreferences(token, {
      push_notifications: next.fraud || next.sales || next.stock,
      email_notifications: next.insights,
      sms_notifications: next.promotions,
    });
  };

  const groups = [
    { title: 'Security', items: [
      { key: 'fraud', label: 'Fraud Alerts', sub: 'Immediate alert on suspicious payments' },
    ]},
    { title: 'Business', items: [
      { key: 'sales', label: 'Sales Summaries', sub: 'Daily and weekly revenue reports' },
      { key: 'stock', label: 'Stock Alerts', sub: 'Restock reminders and low inventory' },
      { key: 'insights', label: 'AI Insights', sub: 'Business recommendations' },
    ]},
    { title: 'Other', items: [
      { key: 'promotions', label: 'Promotions', sub: 'Product updates and offers' },
    ]},
  ];

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#00172F','#002853','#002853']} style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: rs(36) }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {groups.map((g, gi) => (
          <View key={gi} style={styles.group}>
            <Text style={styles.groupLabel}>{g.title}</Text>
            <View style={styles.card}>
              {g.items.map((item, ii) => (
                <View key={ii} style={[styles.notifRow, ii < g.items.length - 1 && styles.notifDiv]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifLabel}>{item.label}</Text>
                    <Text style={styles.notifSub}>{item.sub}</Text>
                  </View>
                  <Switch
                    value={prefs[item.key]}
                    onValueChange={() => toggle(item.key)}
                    trackColor={{ false: '#E5E7EB', true: '#DCE7F3' }}
                    thumbColor={prefs[item.key] ? '#002853' : '#9CA3AF'}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  header: { paddingHorizontal: rs(20), paddingBottom: rs(20) },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  content: { padding: rs(16), gap: rs(20), paddingBottom: vs(40) },
  group: { gap: rs(8) },
  groupLabel: { fontSize: FontSize.xs, color: '#9CA3AF', fontWeight: FontWeight.semibold, letterSpacing: 0.8, paddingLeft: rs(4) },
  card: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  notifRow: { flexDirection: 'row', alignItems: 'center', padding: rs(16), gap: rs(12) },
  notifDiv: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  notifLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: '#111827' },
  notifSub: { fontSize: FontSize.xs, color: '#9CA3AF', marginTop: rs(2) },
});

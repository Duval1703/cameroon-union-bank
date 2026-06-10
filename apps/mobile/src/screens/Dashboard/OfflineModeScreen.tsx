import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';

export const OfflineModeScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [offlineEnabled, setOfflineEnabled] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  const status = [
    { label: 'Local records cached', value: '347', icon: 'save-outline', color: '#059669' },
    { label: 'Pending sync', value: '12', icon: 'cloud-upload-outline', color: '#D97706' },
    { label: 'Last synced', value: '2h ago', icon: 'time-outline', color: '#2563EB' },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#00172F','#002853','#002853']} style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Offline Mode</Text>
          <View style={{ width: rs(36) }} />
        </View>
        <View style={styles.statusRow}>
          {status.map((s, i) => (
            <View key={i} style={styles.statusItem}>
              <Ionicons name={s.icon as any} size={rs(16)} color={s.color} />
              <Text style={[styles.statusVal, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statusLbl}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Enable Offline Mode</Text>
              <Text style={styles.toggleSub}>Use the app without internet</Text>
            </View>
            <Switch value={offlineEnabled} onValueChange={setOfflineEnabled} trackColor={{ false: '#E5E7EB', true: '#DCE7F3' }} thumbColor={offlineEnabled ? '#002853' : '#9CA3AF'} />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Auto Sync When Online</Text>
              <Text style={styles.toggleSub}>Upload pending records automatically</Text>
            </View>
            <Switch value={autoSync} onValueChange={setAutoSync} trackColor={{ false: '#E5E7EB', true: '#DCE7F3' }} thumbColor={autoSync ? '#002853' : '#9CA3AF'} />
          </View>
        </View>

        <TouchableOpacity style={styles.syncNowBtn} activeOpacity={0.85}>
          <LinearGradient colors={['#002853','#133E72']} style={styles.syncNowGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="cloud-upload-outline" size={rs(18)} color="#fff" />
            <Text style={styles.syncNowText}>Sync Now (12 pending)</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  header: { paddingHorizontal: rs(20), paddingBottom: rs(24) },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(16) },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  statusRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.xl, padding: rs(14), borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  statusItem: { flex: 1, alignItems: 'center', gap: rs(3) },
  statusVal: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  statusLbl: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  content: { padding: rs(16), gap: rs(14), paddingBottom: vs(40) },
  card: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(4), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12), padding: rs(16) },
  toggleLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: '#111827' },
  toggleSub: { fontSize: FontSize.xs, color: '#9CA3AF', marginTop: rs(2) },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  syncNowBtn: { borderRadius: Radius.full, overflow: 'hidden', shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  syncNowGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: rs(14), gap: rs(8) },
  syncNowText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#FFFFFF' },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';

export const FinancialSummaryScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const kpis = [
    { label: 'Total Revenue',  value: '1,245,000', unit: 'FCFA', change: '+18%', up: true,  icon: 'trending-up-outline',  color: '#059669' },
    { label: 'Total Expenses', value: '487,000',   unit: 'FCFA', change: '+5%',  up: false, icon: 'trending-down-outline', color: '#DC2626' },
    { label: 'Net Profit',     value: '758,000',   unit: 'FCFA', change: '+28%', up: true,  icon: 'cash-outline',          color: '#2563EB' },
    { label: 'Avg Daily Sale', value: '42,500',    unit: 'FCFA', change: '+12%', up: true,  icon: 'bar-chart-outline',     color: '#D97706' },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#00172F','#002853','#002853']} style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.orb} />
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Financial Summary</Text>
          <TouchableOpacity style={styles.shareBtn}>
            <Ionicons name="share-outline" size={rs(18)} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
        <Text style={styles.periodLabel}>MONTHLY REPORT — MAY 2026</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {kpis.map((k, i) => (
          <View key={i} style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: `${k.color}15` }]}>
              <Ionicons name={k.icon as any} size={rs(22)} color={k.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.kpiLabel}>{k.label}</Text>
              <Text style={[styles.kpiValue, { color: k.color }]}>{k.value} <Text style={styles.kpiUnit}>{k.unit}</Text></Text>
            </View>
            <View style={[styles.changeBadge, { backgroundColor: k.up ? '#ECFDF5' : '#FEF2F2' }]}>
              <Ionicons name={k.up ? 'trending-up' : 'trending-down'} size={rs(11)} color={k.up ? '#059669' : '#DC2626'} />
              <Text style={[styles.changeText, { color: k.up ? '#059669' : '#DC2626' }]}>{k.change}</Text>
            </View>
          </View>
        ))}

        {/* Profit margin visual */}
        <View style={styles.marginCard}>
          <Text style={styles.marginTitle}>Profit Margin</Text>
          <View style={styles.marginBarTrack}>
            <LinearGradient colors={['#002853','#133E72']} style={[styles.marginBarFill, { width: '61%' }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          </View>
          <Text style={styles.marginPct}>61% margin this month</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  header: { paddingHorizontal: rs(20), paddingBottom: rs(24), overflow: 'hidden' },
  orb: { position: 'absolute', top: rs(-40), right: rs(-40), width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.06)' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(10) },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  shareBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  periodLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.55)', letterSpacing: 1, fontWeight: FontWeight.semibold },
  list: { padding: rs(16), gap: rs(12), paddingBottom: vs(60) },
  kpiCard: { flexDirection: 'row', alignItems: 'center', gap: rs(12), backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(16), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  kpiIcon: { width: rs(48), height: rs(48), borderRadius: rs(24), alignItems: 'center', justifyContent: 'center' },
  kpiLabel: { fontSize: FontSize.sm, color: '#6B7280', marginBottom: rs(3) },
  kpiValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  kpiUnit: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  changeBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(3), paddingHorizontal: rs(8), paddingVertical: rs(4), borderRadius: Radius.full },
  changeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  marginCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(18), gap: rs(10), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  marginTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#111827' },
  marginBarTrack: { height: rs(12), backgroundColor: '#F3F4F6', borderRadius: rs(6), overflow: 'hidden' },
  marginBarFill: { height: '100%', borderRadius: rs(6) },
  marginPct: { fontSize: FontSize.sm, color: '#059669', fontWeight: FontWeight.semibold },
});

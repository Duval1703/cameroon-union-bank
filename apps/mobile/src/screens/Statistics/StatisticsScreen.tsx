import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { getStatistics } from '../../services/api';
import { getAuthToken } from '../../services/storage';

const { width: SW } = Dimensions.get('window');
const CHART_W = SW - rs(32);

const fallbackWeekData = [
  { day: 'Mon', sales: 42000, expenses: 18000 },
  { day: 'Tue', sales: 58000, expenses: 22000 },
  { day: 'Wed', sales: 35000, expenses: 12000 },
  { day: 'Thu', sales: 75000, expenses: 28000 },
  { day: 'Fri', sales: 91000, expenses: 35000 },
  { day: 'Sat', sales: 68000, expenses: 20000 },
  { day: 'Sun', sales: 83000, expenses: 25000 },
];

const CHART_H = rs(100);

const fallbackCategories = [
  { label: 'Grocery',   pct: 45, color: '#059669' },
  { label: 'Wholesale', pct: 28, color: '#2563EB' },
  { label: 'Food',      pct: 17, color: '#D97706' },
  { label: 'Other',     pct: 10, color: '#7C3AED' },
];

export const StatisticsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<'week'|'month'|'year'>('week');
  const [stats, setStats] = useState<any | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const token = await getAuthToken();
      if (!token) return;
      const period = range === 'week' ? 'weekly' : range === 'month' ? 'monthly' : 'annual';
      const result = await getStatistics(token, period as any);
      if (active && result.success) {
        setStats(result.data);
      }
    })();
    return () => { active = false; };
  }, [range]));

  const weekData = stats?.trend?.length
    ? stats.trend.map((d: any) => ({ day: new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }), sales: d.sales, expenses: d.expenses + d.stock }))
    : fallbackWeekData;
  const maxVal = Math.max(1, ...weekData.map((d: any) => Math.max(d.sales, d.expenses)));
  const totalSales = stats?.sales ?? weekData.reduce((s: number, d: any) => s + d.sales, 0);
  const totalExp = (stats?.expenses ?? weekData.reduce((s: number, d: any) => s + d.expenses, 0)) + (stats?.stock_cost ?? 0);
  const profit = stats?.profit ?? (totalSales - totalExp);
  const categories = stats?.category_totals?.length
    ? stats.category_totals.map((c: any, i: number) => ({
      label: c.category,
      pct: Math.round((c.amount / Math.max(1, totalExp)) * 100),
      color: ['#059669', '#2563EB', '#D97706', '#7C3AED'][i % 4],
    }))
    : fallbackCategories;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(100) }}>
        <LinearGradient colors={['#061E14','#0D4A35','#1B5E4B']} style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
          <View style={styles.orb} />
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Statistics</Text>
            <TouchableOpacity style={styles.exportBtn}>
              <Ionicons name="download-outline" size={rs(18)} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>

          {/* Period toggle */}
          <View style={styles.toggleRow}>
            {(['week','month','year'] as const).map(r => (
              <TouchableOpacity key={r} style={[styles.toggleBtn, range === r && styles.toggleBtnActive]} onPress={() => setRange(r)} activeOpacity={0.8}>
                <Text style={[styles.toggleText, range === r && styles.toggleTextActive]}>{r.charAt(0).toUpperCase()+r.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Summary */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLbl}>Revenue</Text>
              <Text style={styles.summaryVal}>{(totalSales/1000).toFixed(0)}K</Text>
              <View style={styles.upBadge}><Text style={styles.upText}>+12%</Text></View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLbl}>Expenses</Text>
              <Text style={[styles.summaryVal, { color: '#F87171' }]}>{(totalExp/1000).toFixed(0)}K</Text>
              <View style={styles.dnBadge}><Text style={styles.dnText}>+5%</Text></View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLbl}>Profit</Text>
              <Text style={[styles.summaryVal, { color: '#4ADE80' }]}>{(profit/1000).toFixed(0)}K</Text>
              <View style={styles.upBadge}><Text style={styles.upText}>+18%</Text></View>
            </View>
          </View>
        </LinearGradient>

        {/* Bar chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Sales vs Expenses</Text>
          <View style={styles.chart}>
            {weekData.map((d: any, i: number) => (
              <View key={i} style={styles.barGroup}>
                <View style={styles.barPair}>
                  <LinearGradient colors={['#0D4A35','#059669']} style={[styles.bar, { height: CHART_H * (d.sales / maxVal) }]} />
                  <View style={[styles.bar, { height: CHART_H * (d.expenses / maxVal), backgroundColor: '#FCA5A5' }]} />
                </View>
                <Text style={styles.barLabel}>{d.day}</Text>
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#059669' }]} /><Text style={styles.legendText}>Sales</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#FCA5A5' }]} /><Text style={styles.legendText}>Expenses</Text></View>
          </View>
        </View>

        {/* Top categories */}
        <View style={styles.catCard}>
          <Text style={styles.chartTitle}>Revenue by Category</Text>
          {categories.map((c: any, i: number) => (
            <View key={i} style={styles.catRow}>
              <View style={[styles.catDot, { backgroundColor: c.color }]} />
              <Text style={styles.catLabel}>{c.label}</Text>
              <View style={styles.catBarTrack}>
                <View style={[styles.catBarFill, { width: `${c.pct}%` as any, backgroundColor: c.color }]} />
              </View>
              <Text style={[styles.catPct, { color: c.color }]}>{c.pct}%</Text>
            </View>
          ))}
        </View>

        {/* Key metrics */}
        <View style={styles.metricsGrid}>
          {[
            { label: 'Avg Transaction', value: '18,500 FCFA', icon: 'stats-chart-outline', color: '#2563EB' },
            { label: 'Best Day', value: 'Friday', icon: 'trophy-outline', color: '#D97706' },
            { label: 'Top Product', value: '5kg Rice', icon: 'cube-outline', color: '#059669' },
            { label: 'Payment Split', value: '65% Cash', icon: 'pie-chart-outline', color: '#7C3AED' },
          ].map((m, i) => (
            <View key={i} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: `${m.color}15` }]}>
                <Ionicons name={m.icon as any} size={rs(20)} color={m.color} />
              </View>
              <Text style={styles.metricVal}>{m.value}</Text>
              <Text style={styles.metricLbl}>{m.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F4F2' },
  header: { paddingHorizontal: rs(20), paddingBottom: rs(24), overflow: 'hidden' },
  orb: { position: 'absolute', top: rs(-40), right: rs(-40), width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.06)' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(16) },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  exportBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  toggleRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: Radius.xl, padding: rs(3), marginBottom: rs(16) },
  toggleBtn: { flex: 1, paddingVertical: rs(8), alignItems: 'center', borderRadius: Radius.lg },
  toggleBtnActive: { backgroundColor: '#FFFFFF' },
  toggleText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)', fontWeight: FontWeight.medium },
  toggleTextActive: { color: '#0D4A35', fontWeight: FontWeight.bold },
  summaryRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.xl, padding: rs(16), borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  summaryItem: { flex: 1, alignItems: 'center', gap: rs(4) },
  summaryLbl: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.55)' },
  summaryVal: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  upBadge: { backgroundColor: 'rgba(74,222,128,0.2)', paddingHorizontal: rs(6), paddingVertical: rs(2), borderRadius: Radius.full },
  upText: { fontSize: FontSize.xs, color: '#4ADE80', fontWeight: FontWeight.bold },
  dnBadge: { backgroundColor: 'rgba(248,113,113,0.2)', paddingHorizontal: rs(6), paddingVertical: rs(2), borderRadius: Radius.full },
  dnText: { fontSize: FontSize.xs, color: '#F87171', fontWeight: FontWeight.bold },
  chartCard: { margin: rs(16), backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(18), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  chartTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#111827', marginBottom: rs(16) },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: CHART_H + rs(20) },
  barGroup: { alignItems: 'center', gap: rs(4), flex: 1 },
  barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: rs(2) },
  bar: { width: rs(10), borderRadius: rs(3), minHeight: rs(2) },
  barLabel: { fontSize: FontSize.xs, color: '#9CA3AF' },
  legend: { flexDirection: 'row', gap: rs(16), marginTop: rs(8) },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: rs(5) },
  legendDot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  legendText: { fontSize: FontSize.xs, color: '#6B7280' },
  catCard: { marginHorizontal: rs(16), marginBottom: rs(16), backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(18), gap: rs(12), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  catDot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  catLabel: { fontSize: FontSize.sm, color: '#374151', width: rs(72) },
  catBarTrack: { flex: 1, height: rs(8), backgroundColor: '#F3F4F6', borderRadius: rs(4), overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: rs(4) },
  catPct: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, width: rs(34), textAlign: 'right' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: rs(16), gap: rs(10) },
  metricCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(16), gap: rs(6), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  metricIcon: { width: rs(40), height: rs(40), borderRadius: rs(20), alignItems: 'center', justifyContent: 'center' },
  metricVal: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#111827' },
  metricLbl: { fontSize: FontSize.xs, color: '#9CA3AF' },
});

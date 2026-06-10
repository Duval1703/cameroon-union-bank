import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';

const insights = [
  {
    title: 'Sales Peak Window',
    body: 'Your highest sales happen between 4 PM and 7 PM. Consider launching a Flash Bundle during this window tomorrow.',
    icon: 'trending-up-outline', color: '#059669', bg: '#ECFDF5',
    priority: 'HIGH', action: 'Set Reminder',
  },
  {
    title: 'Low Stock Alert',
    body: 'Rice and Palm Oil levels are below your 3-day average. Restock to avoid stockouts this weekend.',
    icon: 'cube-outline', color: '#D97706', bg: '#FFFBEB',
    priority: 'MEDIUM', action: 'Add Stock',
  },
  {
    title: 'Fraud Pattern Detected',
    body: 'Unusual small amounts from 3 different numbers last Tuesday. Our AI flagged these as potential fraud rings.',
    icon: 'shield-outline', color: '#DC2626', bg: '#FEF2F2',
    priority: 'CRITICAL', action: 'View Details',
  },
  {
    title: 'Weekly Revenue Up',
    body: 'You are 12.5% above last week. Your top product is 5kg Rice bags — consider bundling with Palm Oil.',
    icon: 'bar-chart-outline', color: '#2563EB', bg: '#EFF6FF',
    priority: 'INFO', action: 'View Report',
  },
];

const priorityColor: Record<string,string> = {
  CRITICAL: '#DC2626', HIGH: '#D97706', MEDIUM: '#2563EB', INFO: '#6B7280',
};

export const AIInsightsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#00172F','#002853','#002853']} style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.orb} />
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Ionicons name="sparkles" size={rs(16)} color="#F5A623" />
            <Text style={styles.headerTitle}>AI Insights</Text>
          </View>
          <View style={styles.aiBadge}>
            <View style={styles.aiDot} />
            <Text style={styles.aiText}>LIVE</Text>
          </View>
        </View>
        <Text style={styles.heroSub}>Personalized intelligence for your business</Text>
        <View style={styles.heroStats}>
          {[
            { val: '4', label: 'New insights', icon: 'bulb-outline', color: '#F5A623' },
            { val: '1', label: 'Urgent alert', icon: 'alert-circle-outline', color: '#F87171' },
            { val: '94%', label: 'Accuracy', icon: 'checkmark-circle-outline', color: '#4ADE80' },
          ].map((s, i) => (
            <View key={i} style={styles.heroStat}>
              <Ionicons name={s.icon as any} size={rs(16)} color={s.color} />
              <Text style={[styles.heroStatVal, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.heroStatLbl}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {insights.map((ins, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: ins.bg }]}>
                <Ionicons name={ins.icon as any} size={rs(22)} color={ins.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{ins.title}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor[ins.priority]}15` }]}>
                  <Text style={[styles.priorityText, { color: priorityColor[ins.priority] }]}>{ins.priority}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.cardBody}>{ins.body}</Text>
            <TouchableOpacity style={[styles.cardBtn, { borderColor: ins.color }]} activeOpacity={0.8}>
              <Text style={[styles.cardBtnText, { color: ins.color }]}>{ins.action}</Text>
              <Ionicons name="arrow-forward" size={rs(14)} color={ins.color} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  header: { paddingHorizontal: rs(20), paddingBottom: rs(24), overflow: 'hidden' },
  orb: { position: 'absolute', top: rs(-40), right: rs(-40), width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.06)' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(6) },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(4), backgroundColor: 'rgba(74,222,128,0.15)', paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: Radius.full },
  aiDot: { width: rs(6), height: rs(6), borderRadius: rs(3), backgroundColor: '#4ADE80' },
  aiText: { fontSize: FontSize.xs, color: '#4ADE80', fontWeight: FontWeight.bold },
  heroSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)', marginBottom: rs(16) },
  heroStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.xl, padding: rs(14), borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  heroStat: { flex: 1, alignItems: 'center', gap: rs(3) },
  heroStatVal: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  heroStatLbl: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  list: { padding: rs(16), paddingBottom: vs(100), gap: rs(12) },
  card: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(16), gap: rs(12), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(12) },
  cardIcon: { width: rs(46), height: rs(46), borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#111827', marginBottom: rs(4) },
  priorityBadge: { paddingHorizontal: rs(8), paddingVertical: rs(2), borderRadius: Radius.full, alignSelf: 'flex-start' },
  priorityText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  cardBody: { fontSize: FontSize.sm, color: '#6B7280', lineHeight: ms(14) * 1.6 },
  cardBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(5), alignSelf: 'flex-start', paddingHorizontal: rs(14), paddingVertical: rs(8), borderRadius: Radius.full, borderWidth: 1.5 },
  cardBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});

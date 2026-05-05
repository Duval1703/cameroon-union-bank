import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { getRecordsSummary } from '../../services/api';
import { getAuthToken } from '../../services/storage';

const categories = [
  { icon: 'cash-outline',         label: 'Add Sale',        sub: 'Log a new sale',       color: '#059669', bg: '#ECFDF5', grad: ['#065F46','#059669'] as const, screen: 'AddSale' },
  { icon: 'receipt-outline',      label: 'Sales History',   sub: 'View all sales',        color: '#1B5E4B', bg: '#D1EAE0', grad: ['#0D4A35','#1B5E4B'] as const, screen: 'SalesHistory' },
  { icon: 'trending-down-outline',label: 'Add Expense',     sub: 'Record an expense',     color: '#DC2626', bg: '#FEF2F2', grad: ['#991B1B','#DC2626'] as const, screen: 'AddExpense' },
  { icon: 'document-outline',     label: 'Expense History', sub: 'View all expenses',     color: '#D97706', bg: '#FFFBEB', grad: ['#92400E','#D97706'] as const, screen: 'ExpenseHistory' },
  { icon: 'cube-outline',         label: 'Add Stock',       sub: 'Log a purchase',        color: '#2563EB', bg: '#EFF6FF', grad: ['#1D4ED8','#2563EB'] as const, screen: 'AddStock' },
  { icon: 'archive-outline',      label: 'Stock History',   sub: 'View stock records',    color: '#7C3AED', bg: '#F5F3FF', grad: ['#5B21B6','#7C3AED'] as const, screen: 'StockHistory' },
];

export const RecordsHubScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const [summary, setSummary] = useState<any | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 4 }),
    ]).start();
  }, []);

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const token = await getAuthToken();
      if (!token) return;
      const result = await getRecordsSummary(token);
      if (active && result.success) {
        setSummary(result.data);
      }
    })();
    return () => { active = false; };
  }, []));

  const stats = [
    { label: 'Sales Today', value: String(summary?.sales_count_today ?? 0), color: '#059669', icon: 'trending-up-outline' },
    { label: 'Expenses',    value: String(summary?.expenses_count_today ?? 0),  color: '#DC2626', icon: 'trending-down-outline' },
    { label: 'Stock In',    value: String(summary?.stock_count_today ?? 0),  color: '#2563EB', icon: 'cube-outline' },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={['#061E14', '#0D4A35', '#1B5E4B']}
        style={[styles.header, { paddingTop: insets.top + rs(14) }]}
      >
        <View style={styles.orb} />
        <View style={styles.navRow}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Ionicons name="checkmark" size={rs(11)} color="#fff" />
            </View>
            <Text style={styles.logoText}>MboaTrust AI</Text>
          </View>
          <View style={styles.syncPill}>
            <View style={styles.syncDot} />
            <Text style={styles.syncText}>SYNCED</Text>
          </View>
        </View>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.heroTitle}>Business Records</Text>
          <Text style={styles.heroSub}>Track sales, expenses & inventory</Text>
        </Animated.View>

        {/* Stats strip */}
        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          {stats.map((s, i) => (
            <View key={i} style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${s.color}25` }]}>
                <Ionicons name={s.icon as any} size={rs(14)} color={s.color} />
              </View>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {categories.map((c, i) => (
            <TouchableOpacity
              key={i}
              style={styles.card}
              onPress={() => navigation.navigate(c.screen)}
              activeOpacity={0.8}
            >
              <LinearGradient colors={c.grad} style={styles.cardIconWrap}>
                <Ionicons name={c.icon as any} size={rs(24)} color="#fff" />
              </LinearGradient>
              <View style={styles.cardBody}>
                <Text style={styles.cardLabel}>{c.label}</Text>
                <Text style={styles.cardSub}>{c.sub}</Text>
              </View>
              <View style={[styles.cardChevron, { backgroundColor: `${c.color}12` }]}>
                <Ionicons name="chevron-forward" size={rs(14)} color={c.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F4F2' },
  header: { paddingHorizontal: rs(20), paddingBottom: rs(24), overflow: 'hidden' },
  orb: { position: 'absolute', top: rs(-30), right: rs(-30), width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.05)' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(14) },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: rs(7) },
  logoBox: { width: rs(24), height: rs(24), borderRadius: rs(6), backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  syncPill: { flexDirection: 'row', alignItems: 'center', gap: rs(5), backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: Radius.full },
  syncDot: { width: rs(6), height: rs(6), borderRadius: rs(3), backgroundColor: '#4ADE80' },
  syncText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#4ADE80', letterSpacing: 0.5 },
  heroTitle: { fontSize: ms(26), fontWeight: FontWeight.extrabold, color: '#FFFFFF', marginBottom: rs(4) },
  heroSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)', marginBottom: rs(18) },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.xl, padding: rs(14), borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  statItem: { flex: 1, alignItems: 'center', gap: rs(5) },
  statIcon: { width: rs(32), height: rs(32), borderRadius: rs(16), alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  statLbl: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  content: { padding: rs(16), paddingBottom: vs(100) },
  grid: { gap: rs(10) },
  card: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(16), flexDirection: 'row', alignItems: 'center', gap: rs(14), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardIconWrap: { width: rs(50), height: rs(50), borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: rs(3) },
  cardLabel: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#111827' },
  cardSub: { fontSize: FontSize.sm, color: '#9CA3AF' },
  cardChevron: { width: rs(30), height: rs(30), borderRadius: rs(15), alignItems: 'center', justifyContent: 'center' },
});

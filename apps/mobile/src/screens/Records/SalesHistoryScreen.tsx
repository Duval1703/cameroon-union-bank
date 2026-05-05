import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { listSaleRecords } from '../../services/api';
import { getAuthToken } from '../../services/storage';

const methodColor: Record<string,string> = {
  'Cash': '#059669',
  cash: '#059669',
  mobile: '#F59E0B',
  'MTN MoMo': '#F59E0B',
  'Orange Money': '#EA580C',
};

export const SalesHistoryScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const total = sales.reduce((s, i) => s + i.amount, 0);

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const token = await getAuthToken();
      if (!token) {
        if (active) setIsLoading(false);
        return;
      }
      const result = await listSaleRecords(token);
      if (active && result.success) {
        setSales(result.data || []);
      }
      if (active) setIsLoading(false);
    })();
    return () => { active = false; };
  }, []));

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#065F46','#059669','#10B981']} style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.orb} />
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sales History</Text>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="filter-outline" size={rs(18)} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>TOTAL SALES - THIS WEEK</Text>
          <Text style={styles.totalAmount}>{total.toLocaleString()} <Text style={styles.totalCur}>FCFA</Text></Text>
          <View style={styles.totalMeta}>
            <View style={styles.growthBadge}>
              <Ionicons name="trending-up" size={rs(11)} color="#4ADE80" />
              <Text style={styles.growthText}>+12.5% vs last week</Text>
            </View>
            <Text style={styles.countText}>{sales.length} transactions</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {isLoading ? (
          <View style={styles.emptyCard}>
            <Ionicons name="hourglass-outline" size={rs(28)} color="#059669" />
            <Text style={styles.emptyTitle}>Loading sales</Text>
            <Text style={styles.emptyText}>Fetching your saved records...</Text>
          </View>
        ) : sales.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cash-outline" size={rs(30)} color="#059669" />
            <Text style={styles.emptyTitle}>No sales yet</Text>
            <Text style={styles.emptyText}>Add your first sale and it will appear here.</Text>
          </View>
        ) : sales.map((s, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.cardLeft}>
              <LinearGradient colors={['#065F46','#059669']} style={styles.cardIcon}>
                <Ionicons name="cash-outline" size={rs(18)} color="#fff" />
              </LinearGradient>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardItem}>{s.item || s.item_note || 'Sale recorded'}</Text>
                <Text style={styles.cardAmount}>+{s.amount.toLocaleString()}</Text>
              </View>
              <View style={styles.cardMetaRow}>
                <Text style={styles.cardTime}>{s.time || new Date(s.record_date || s.created_at).toLocaleString()}</Text>
                <View style={[styles.methodBadge, { backgroundColor: `${methodColor[s.method || s.payment_method] || '#6B7280'}15` }]}>
                  <Text style={[styles.methodText, { color: methodColor[s.method || s.payment_method] || '#6B7280' }]}>{s.method || s.payment_method}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F4F2' },
  header: { paddingHorizontal: rs(20), paddingBottom: rs(24), overflow: 'hidden' },
  orb: { position: 'absolute', top: rs(-40), right: rs(-40), width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.08)' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(18) },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  filterBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  totalSection: { gap: rs(6) },
  totalLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.2, fontWeight: FontWeight.semibold },
  totalAmount: { fontSize: ms(34), fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  totalCur: { fontSize: FontSize.lg },
  totalMeta: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  growthBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(4), backgroundColor: 'rgba(74,222,128,0.2)', paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: Radius.full },
  growthText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: '#4ADE80' },
  countText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)' },
  list: { padding: rs(16), paddingBottom: vs(100), gap: rs(10) },
  card: { flexDirection: 'row', gap: rs(12), backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(14), alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardLeft: {},
  cardIcon: { width: rs(44), height: rs(44), borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(4) },
  cardItem: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: '#111827', flex: 1, marginRight: rs(8) },
  cardAmount: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#059669' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  cardTime: { fontSize: FontSize.xs, color: '#9CA3AF' },
  methodBadge: { paddingHorizontal: rs(8), paddingVertical: rs(2), borderRadius: Radius.full },
  methodText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(24), alignItems: 'center', gap: rs(8), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#111827' },
  emptyText: { fontSize: FontSize.sm, color: '#9CA3AF', textAlign: 'center' },
});

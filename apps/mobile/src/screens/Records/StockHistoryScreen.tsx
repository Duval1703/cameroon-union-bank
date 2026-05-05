import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { listStockRecords } from '../../services/api';
import { getAuthToken } from '../../services/storage';

export const StockHistoryScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [stocks, setStocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const total = stocks.reduce((s, e) => s + (e.amount || e.purchase_cost || 0), 0);

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const token = await getAuthToken();
      if (!token) {
        if (active) setIsLoading(false);
        return;
      }
      const result = await listStockRecords(token);
      if (active && result.success) {
        setStocks(result.data || []);
      }
      if (active) setIsLoading(false);
    })();
    return () => { active = false; };
  }, []));

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#1E3A8A','#2563EB','#3B82F6']} style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.orb} />
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Stock History</Text>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="filter-outline" size={rs(18)} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>TOTAL PURCHASES - THIS WEEK</Text>
          <Text style={styles.totalAmount}>{total.toLocaleString()} <Text style={styles.totalCur}>FCFA</Text></Text>
          <Text style={styles.countText}>{stocks.length} entries</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {isLoading ? (
          <View style={styles.emptyCard}>
            <Ionicons name="hourglass-outline" size={rs(28)} color="#2563EB" />
            <Text style={styles.emptyTitle}>Loading stock</Text>
            <Text style={styles.emptyText}>Fetching your saved records...</Text>
          </View>
        ) : stocks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cube-outline" size={rs(30)} color="#2563EB" />
            <Text style={styles.emptyTitle}>No stock records yet</Text>
            <Text style={styles.emptyText}>Log stock purchases and they will appear here.</Text>
          </View>
        ) : stocks.map((s, i) => (
          <View key={i} style={styles.card}>
            <LinearGradient colors={['#1E3A8A','#2563EB']} style={styles.cardIcon}>
              <Ionicons name="cube-outline" size={rs(20)} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardItem}>{s.item || s.item_name}</Text>
                <Text style={styles.cardAmount}>{`-${(s.amount || s.purchase_cost || 0).toLocaleString()}`}</Text>
              </View>
              <View style={styles.cardMetaRow}>
                <Text style={styles.cardTime}>{s.time || new Date(s.record_date || s.created_at).toLocaleString()}</Text>
                <View style={styles.qtyBadge}>
                  <Ionicons name="layers-outline" size={rs(10)} color="#2563EB" />
                  <Text style={styles.qtyText}>{s.qty || `${s.quantity} ${s.unit || 'unit'}`}</Text>
                </View>
              </View>
              <Text style={styles.supplierText}>{s.supplier}</Text>
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
  totalSection: { gap: rs(5) },
  totalLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.2, fontWeight: FontWeight.semibold },
  totalAmount: { fontSize: ms(34), fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  totalCur: { fontSize: FontSize.lg },
  countText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)' },
  list: { padding: rs(16), paddingBottom: vs(100), gap: rs(10) },
  card: { flexDirection: 'row', gap: rs(12), backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(14), alignItems: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardIcon: { width: rs(44), height: rs(44), borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: rs(4) },
  cardItem: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: '#111827', flex: 1, marginRight: rs(8) },
  cardAmount: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#2563EB' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(2) },
  cardTime: { fontSize: FontSize.xs, color: '#9CA3AF' },
  qtyBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(3), backgroundColor: '#EFF6FF', paddingHorizontal: rs(7), paddingVertical: rs(2), borderRadius: Radius.full },
  qtyText: { fontSize: FontSize.xs, color: '#2563EB', fontWeight: FontWeight.semibold },
  supplierText: { fontSize: FontSize.xs, color: '#6B7280' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(24), alignItems: 'center', gap: rs(8), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#111827' },
  emptyText: { fontSize: FontSize.sm, color: '#9CA3AF', textAlign: 'center' },
});

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { listExpenseRecords } from '../../services/api';
import { getAuthToken } from '../../services/storage';

const catColor: Record<string,string> = {
  Supplies: '#2563EB', Salary: '#7C3AED', Transport: '#059669', Other: '#6B7280', Rent: '#D97706',
};

export const ExpenseHistoryScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const token = await getAuthToken();
      if (!token) {
        if (active) setIsLoading(false);
        return;
      }
      const result = await listExpenseRecords(token);
      if (active && result.success) {
        setExpenses(result.data || []);
      }
      if (active) setIsLoading(false);
    })();
    return () => { active = false; };
  }, []));

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#7F1D1D','#DC2626','#EF4444']} style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.orb} />
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expense History</Text>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="filter-outline" size={rs(18)} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>TOTAL EXPENSES - THIS WEEK</Text>
          <Text style={styles.totalAmount}>{total.toLocaleString()} <Text style={styles.totalCur}>FCFA</Text></Text>
          <Text style={styles.countText}>{expenses.length} transactions</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {isLoading ? (
          <View style={styles.emptyCard}>
            <Ionicons name="hourglass-outline" size={rs(28)} color="#DC2626" />
            <Text style={styles.emptyTitle}>Loading expenses</Text>
            <Text style={styles.emptyText}>Fetching your saved records...</Text>
          </View>
        ) : expenses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="trending-down-outline" size={rs(30)} color="#DC2626" />
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptyText}>Record an expense and it will appear here.</Text>
          </View>
        ) : expenses.map((e, i) => {
          const color = catColor[e.category] || '#6B7280';
          return (
            <View key={i} style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: `${color}18` }]}>
                <Ionicons name="trending-down-outline" size={rs(20)} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardItem}>{e.item || e.note || e.category}</Text>
                  <Text style={styles.cardAmount}>{`-${e.amount.toLocaleString()}`}</Text>
                </View>
                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardTime}>{e.time || new Date(e.record_date || e.created_at).toLocaleString()}</Text>
                  <View style={[styles.catBadge, { backgroundColor: `${color}15` }]}>
                    <Text style={[styles.catText, { color }]}>{e.category}</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
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
  card: { flexDirection: 'row', gap: rs(12), backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(14), alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardIcon: { width: rs(44), height: rs(44), borderRadius: rs(22), alignItems: 'center', justifyContent: 'center' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(4) },
  cardItem: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: '#111827', flex: 1, marginRight: rs(8) },
  cardAmount: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#DC2626' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  cardTime: { fontSize: FontSize.xs, color: '#9CA3AF' },
  catBadge: { paddingHorizontal: rs(8), paddingVertical: rs(2), borderRadius: Radius.full },
  catText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(24), alignItems: 'center', gap: rs(8), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#111827' },
  emptyText: { fontSize: FontSize.sm, color: '#9CA3AF', textAlign: 'center' },
});

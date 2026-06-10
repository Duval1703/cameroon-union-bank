import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { listReceiptVerifications } from '../../services/api';
import { getAuthToken } from '../../services/storage';

const resultConfig: Record<string,{color:string;bg:string;icon:string;label:string}> = {
  safe:       { color: '#059669', bg: '#ECFDF5', icon: 'shield-checkmark', label: 'SAFE' },
  suspicious: { color: '#DC2626', bg: '#FEF2F2', icon: 'warning',          label: 'RISKY' },
  pending:    { color: '#D97706', bg: '#FFFBEB', icon: 'time-outline',      label: 'PENDING' },
};

export const VerifyHistoryScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const safeCount = verifications.filter((v) => v.result === 'safe').length;
  const riskyCount = verifications.filter((v) => v.result === 'suspicious').length;

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const token = await getAuthToken();
      if (!token) {
        if (active) setIsLoading(false);
        return;
      }
      const result = await listReceiptVerifications(token);
      if (active && result.success) {
        setVerifications((result.data || []).map((receipt: any) => ({
          phone: receipt.supplier || 'Receipt verification',
          amount: `${Number(receipt.amount || 0).toLocaleString()} FCFA`,
          time: new Date(receipt.created_at).toLocaleString(),
          network: 'Receipt',
          result: receipt.verdict === 'authentic' ? 'safe' : receipt.verdict === 'suspicious' ? 'suspicious' : 'pending',
          score: Math.round(receipt.confidence || 0),
        })));
      }
      if (active) setIsLoading(false);
    })();
    return () => { active = false; };
  }, []));

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#030712','#0A1628','#0D2040']} style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.orb} />
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verify History</Text>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="filter-outline" size={rs(18)} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          {[
            { val: String(verifications.length), label: 'Total', color: '#FFFFFF' },
            { val: String(safeCount), label: 'Authentic',  color: '#4ADE80' },
            { val: String(riskyCount),   label: 'Suspicious', color: '#F87171' },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {isLoading ? (
          <View style={styles.emptyCard}>
            <Ionicons name="hourglass-outline" size={rs(28)} color="#D97706" />
            <Text style={styles.emptyTitle}>Loading receipts</Text>
            <Text style={styles.emptyText}>Fetching your verification history...</Text>
          </View>
        ) : verifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={rs(30)} color="#D97706" />
            <Text style={styles.emptyTitle}>No receipts verified yet</Text>
            <Text style={styles.emptyText}>Upload a purchase receipt or save a manual entry to start building proof.</Text>
          </View>
        ) : verifications.map((v, i) => {
          const cfg = resultConfig[v.result];
          const resultScreen = v.result === 'safe' ? 'ResultConfirmed' : v.result === 'suspicious' ? 'ResultSuspicious' : 'ResultPending';
          return (
            <TouchableOpacity key={i} style={styles.card} activeOpacity={0.8} onPress={() => navigation.navigate(resultScreen, v)}>
              <View style={[styles.cardIcon, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon as any} size={rs(22)} color={cfg.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardPhone}>{v.phone}</Text>
                  <View style={[styles.resultBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.resultText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardTime}>{v.time}</Text>
                  <Text style={styles.cardNetwork}>{v.network}</Text>
                  <Text style={styles.cardAmount}>{v.amount}</Text>
                </View>
                {v.result !== 'pending' && (
                  <View style={styles.scoreBar}>
                    <View style={[styles.scoreFill, { width: `${v.score}%` as any, backgroundColor: cfg.color }]} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  header: { paddingHorizontal: rs(20), paddingBottom: rs(24), overflow: 'hidden' },
  orb: { position: 'absolute', top: rs(-40), right: rs(-40), width: rs(150), height: rs(150), borderRadius: rs(75), backgroundColor: 'rgba(255,255,255,0.04)' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(18) },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  filterBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.xl, padding: rs(14), borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statItem: { flex: 1, alignItems: 'center', gap: rs(3) },
  statVal: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold },
  statLbl: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)' },
  list: { padding: rs(16), paddingBottom: vs(100), gap: rs(10) },
  card: { flexDirection: 'row', gap: rs(12), backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(14), alignItems: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardIcon: { width: rs(44), height: rs(44), borderRadius: rs(22), alignItems: 'center', justifyContent: 'center' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(5) },
  cardPhone: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: '#111827' },
  resultBadge: { paddingHorizontal: rs(8), paddingVertical: rs(2), borderRadius: Radius.full },
  resultText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(8) },
  cardTime: { fontSize: FontSize.xs, color: '#9CA3AF' },
  cardNetwork: { fontSize: FontSize.xs, color: '#6B7280', fontWeight: FontWeight.medium },
  cardAmount: { fontSize: FontSize.xs, color: '#111827', fontWeight: FontWeight.semibold, marginLeft: 'auto' },
  scoreBar: { height: rs(4), backgroundColor: '#F3F4F6', borderRadius: rs(2), overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: rs(2) },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(24), alignItems: 'center', gap: rs(8), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#111827' },
  emptyText: { fontSize: FontSize.sm, color: '#9CA3AF', textAlign: 'center', lineHeight: ms(14) * 1.4 },
});

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { listRepaymentSchedule, payRepayment } from '../../services/api';
import { getAuthToken } from '../../services/storage';

const demoSchedule = [
  {
    id: 'demo-1',
    amount: 52500,
    principal_amount: 47500,
    interest_amount: 5000,
    due_date: '2026-07-15',
    status: 'pending',
    payment_method: null,
    payment_reference: null,
    days_overdue: 0,
    late_fee: 0,
  },
  {
    id: 'demo-2',
    amount: 52500,
    principal_amount: 47500,
    interest_amount: 5000,
    due_date: '2026-08-15',
    status: 'pending',
    payment_method: null,
    payment_reference: null,
    days_overdue: 0,
    late_fee: 0,
  },
  {
    id: 'demo-3',
    amount: 52500,
    principal_amount: 47500,
    interest_amount: 5000,
    due_date: '2026-09-15',
    status: 'pending',
    payment_method: null,
    payment_reference: null,
    days_overdue: 0,
    late_fee: 0,
  },
];

const paymentMethods = [
  { id: 'MTN', label: 'MTN MoMo', icon: 'phone-portrait-outline', color: '#F0D980' },
  { id: 'ORANGE', label: 'Orange Money', icon: 'radio-outline', color: '#FFB45C' },
  { id: 'bank_transfer', label: 'Bank transfer', icon: 'business-outline', color: '#DCE7F3' },
] as const;

function formatFcfa(value?: number): string {
  if (!value) return '0';
  return Math.round(value).toLocaleString();
}

function formatDate(value?: string): string {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusTone(status?: string) {
  if (status === 'paid') return { bg: '#DDFBEA', text: '#004829', icon: 'checkmark-circle-outline' };
  if (status === 'overdue' || status === 'missed') return { bg: '#FEE2E2', text: '#B91C1C', icon: 'warning-outline' };
  return { bg: '#DCE7F3', text: '#002853', icon: 'time-outline' };
}

export const RepaymentHubScreen = () => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const [schedule, setSchedule] = useState<any[]>(demoSchedule);
  const [selectedMethod, setSelectedMethod] = useState<typeof paymentMethods[number]['id']>('MTN');
  const [loading, setLoading] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 4 }),
    ]).start();
  }, []);

  const loadSchedule = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      setSchedule(demoSchedule);
      return;
    }

    setLoading(true);
    const result = await listRepaymentSchedule(token);
    setLoading(false);

    if (result.success) {
      setSchedule(result.data?.length ? result.data : demoSchedule);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadSchedule();
  }, [loadSchedule]));

  const handlePay = async (repayment: any) => {
    if (String(repayment.id).startsWith('demo-')) {
      Alert.alert('Preview repayment', 'Sign in with a funded CUB loan to execute a real MTN or Orange repayment.');
      return;
    }

    const token = await getAuthToken();
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in before making a repayment.');
      return;
    }

    setPayingId(repayment.id);
    const result = await payRepayment(token, repayment.id, {
      payment_method: selectedMethod,
      payment_reference: `${selectedMethod}-${Date.now()}`,
    });
    setPayingId(null);

    if (!result.success) {
      Alert.alert('Payment failed', result.error || 'Could not process this repayment.');
      return;
    }

    Alert.alert('Repayment recorded', 'Your repayment has been recorded and your CUB Score can improve after review.');
    await loadSchedule();
  };

  const paidTotal = schedule
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const pendingTotal = schedule
    .filter((item) => item.status !== 'paid')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const overdueCount = schedule.filter((item) => item.status === 'overdue' || item.status === 'missed').length;
  const nextDue = schedule.find((item) => item.status !== 'paid');

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#00172F', '#002853', '#133E72']}
        style={[styles.header, { paddingTop: insets.top + rs(14) }]}
      >
        <View style={styles.orb} />
        <View style={styles.navRow}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Ionicons name="wallet" size={rs(13)} color="#fff" />
            </View>
            <Text style={styles.logoText}>CUB Repay</Text>
          </View>
          <TouchableOpacity style={styles.refreshPill} onPress={loadSchedule} disabled={loading}>
            <Ionicons name="refresh" size={rs(12)} color="#F0D980" />
            <Text style={styles.refreshText}>{loading ? 'LOADING' : 'SYNC'}</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.heroTitle}>Repayment Management</Text>
          <Text style={styles.heroSub}>Track instalments, pay with MTN or Orange Money, and keep your CUB Score moving upward.</Text>
        </Animated.View>

        <Animated.View style={[styles.summaryCard, { opacity: fadeAnim }]}>
          <View style={styles.summaryTop}>
            <Text style={styles.summaryLabel}>NEXT INSTALMENT</Text>
            <View style={[styles.statusPill, nextDue && { backgroundColor: getStatusTone(nextDue.status).bg }]}>
              <Text style={[styles.statusPillText, nextDue && { color: getStatusTone(nextDue.status).text }]}>
                {nextDue ? String(nextDue.status).toUpperCase() : 'CLEAR'}
              </Text>
            </View>
          </View>
          <Text style={styles.summaryAmount}>{formatFcfa(Number(nextDue?.amount || 0))} <Text style={styles.currency}>FCFA</Text></Text>
          <Text style={styles.summaryDue}>{nextDue ? `Due ${formatDate(nextDue.due_date)}` : 'No pending repayment'}</Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatFcfa(pendingTotal)}</Text>
            <Text style={styles.statLabel}>Outstanding FCFA</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatFcfa(paidTotal)}</Text>
            <Text style={styles.statLabel}>Paid FCFA</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, overdueCount > 0 && { color: '#B91C1C' }]}>{overdueCount}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <Text style={styles.sectionMeta}>Mobile money ready</Text>
        </View>
        <View style={styles.methodRow}>
          {paymentMethods.map((method) => {
            const selected = selectedMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.methodTile, selected && styles.methodTileActive]}
                onPress={() => setSelectedMethod(method.id)}
                activeOpacity={0.85}
              >
                <View style={[styles.methodIcon, { backgroundColor: method.color }]}>
                  <Ionicons name={method.icon as any} size={rs(18)} color={method.id === 'bank_transfer' ? '#002853' : '#241A00'} />
                </View>
                <Text style={[styles.methodText, selected && styles.methodTextActive]}>{method.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Instalment Schedule</Text>
          <Text style={styles.sectionMeta}>{schedule.length} rows</Text>
        </View>

        <View style={styles.scheduleList}>
          {schedule.map((item, index) => {
            const tone = getStatusTone(item.status);
            const isPayable = item.status !== 'paid';
            return (
              <View key={item.id || index} style={styles.repaymentCard}>
                <View style={styles.repaymentTop}>
                  <View style={[styles.repaymentIcon, { backgroundColor: tone.bg }]}>
                    <Ionicons name={tone.icon as any} size={rs(20)} color={tone.text} />
                  </View>
                  <View style={styles.repaymentTitleWrap}>
                    <Text style={styles.repaymentTitle}>Instalment {index + 1}</Text>
                    <Text style={styles.repaymentSub}>Due {formatDate(item.due_date)}</Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.statusChipText, { color: tone.text }]}>{String(item.status).toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.amountRow}>
                  <View>
                    <Text style={styles.amountValue}>{formatFcfa(Number(item.amount))} FCFA</Text>
                    <Text style={styles.amountMeta}>
                      Principal {formatFcfa(Number(item.principal_amount || 0))} · Interest {formatFcfa(Number(item.interest_amount || 0))}
                    </Text>
                  </View>
                  {Number(item.late_fee || 0) > 0 && (
                    <Text style={styles.lateFee}>+{formatFcfa(Number(item.late_fee))} fee</Text>
                  )}
                </View>

                {isPayable ? (
                  <TouchableOpacity
                    style={[styles.payButton, payingId === item.id && { opacity: 0.7 }]}
                    onPress={() => handlePay(item)}
                    disabled={payingId === item.id}
                    activeOpacity={0.86}
                  >
                    <LinearGradient colors={['#002853', '#133E72']} style={styles.payButtonBg}>
                      <Text style={styles.payButtonText}>{payingId === item.id ? 'Processing...' : `Pay with ${selectedMethod}`}</Text>
                      {payingId !== item.id && <Ionicons name="arrow-forward" size={rs(16)} color="#fff" />}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.paidReceipt}>
                    <Ionicons name="checkmark-circle" size={rs(15)} color="#004829" />
                    <Text style={styles.paidReceiptText}>Paid via {item.payment_method || 'CUB'} · {item.payment_reference || 'recorded'}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.warningCard}>
          <Ionicons name="shield-checkmark-outline" size={rs(22)} color="#002853" />
          <View style={{ flex: 1 }}>
            <Text style={styles.warningTitle}>Repayment affects CUB Score</Text>
            <Text style={styles.warningText}>On-time repayments strengthen your borrower profile. Overdue instalments may trigger warnings, freeze review, and lender alerts.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  header: { paddingHorizontal: rs(20), paddingBottom: rs(24), overflow: 'hidden' },
  orb: { position: 'absolute', top: rs(-36), right: rs(-38), width: rs(170), height: rs(170), borderRadius: rs(85), backgroundColor: 'rgba(240,217,128,0.09)' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(14) },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: rs(7) },
  logoBox: { width: rs(26), height: rs(26), borderRadius: rs(7), backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  refreshPill: { flexDirection: 'row', alignItems: 'center', gap: rs(5), backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: rs(10), paddingVertical: rs(5), borderRadius: Radius.full },
  refreshText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#F0D980', letterSpacing: 0.5 },
  heroTitle: { fontSize: ms(28), fontWeight: FontWeight.extrabold, color: '#FFFFFF', marginBottom: rs(6) },
  heroSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', lineHeight: ms(20), marginBottom: rs(18) },
  summaryCard: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.xl, padding: rs(16) },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.68)', fontWeight: FontWeight.bold, letterSpacing: 0.8 },
  statusPill: { borderRadius: Radius.full, backgroundColor: '#DCE7F3', paddingHorizontal: rs(10), paddingVertical: rs(5) },
  statusPillText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#002853' },
  summaryAmount: { fontSize: ms(34), fontWeight: FontWeight.extrabold, color: '#FFFFFF', marginTop: rs(8) },
  currency: { fontSize: FontSize.lg },
  summaryDue: { fontSize: FontSize.sm, color: '#F0D980', marginTop: rs(2), fontWeight: FontWeight.semibold },
  content: { padding: rs(16), paddingBottom: vs(110), gap: rs(16) },
  statsGrid: { flexDirection: 'row', gap: rs(10) },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(12), shadowColor: '#002853', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  statValue: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: '#002853' },
  statLabel: { fontSize: FontSize.xs, color: '#6B7280', marginTop: rs(4) },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: rs(2) },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: '#181C1E' },
  sectionMeta: { fontSize: FontSize.sm, color: '#5A7FA8', fontWeight: FontWeight.semibold },
  methodRow: { flexDirection: 'row', gap: rs(10) },
  methodTile: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(12), gap: rs(8), alignItems: 'center', shadowColor: '#002853', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 9, elevation: 2 },
  methodTileActive: { backgroundColor: '#DCE7F3' },
  methodIcon: { width: rs(38), height: rs(38), borderRadius: rs(14), alignItems: 'center', justifyContent: 'center' },
  methodText: { fontSize: FontSize.xs, color: '#4B5563', fontWeight: FontWeight.semibold, textAlign: 'center' },
  methodTextActive: { color: '#002853', fontWeight: FontWeight.bold },
  scheduleList: { gap: rs(12) },
  repaymentCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(15), gap: rs(13), shadowColor: '#002853', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  repaymentTop: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  repaymentIcon: { width: rs(42), height: rs(42), borderRadius: rs(14), alignItems: 'center', justifyContent: 'center' },
  repaymentTitleWrap: { flex: 1 },
  repaymentTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#181C1E' },
  repaymentSub: { fontSize: FontSize.xs, color: '#6B7280', marginTop: rs(2) },
  statusChip: { borderRadius: Radius.full, paddingHorizontal: rs(9), paddingVertical: rs(5) },
  statusChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountValue: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: '#002853' },
  amountMeta: { fontSize: FontSize.xs, color: '#6B7280', marginTop: rs(3) },
  lateFee: { fontSize: FontSize.xs, color: '#B91C1C', fontWeight: FontWeight.bold },
  payButton: { borderRadius: Radius.full, overflow: 'hidden' },
  payButtonBg: { minHeight: rs(46), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8) },
  payButtonText: { fontSize: FontSize.sm, color: '#FFFFFF', fontWeight: FontWeight.bold },
  paidReceipt: { flexDirection: 'row', alignItems: 'center', gap: rs(6), backgroundColor: '#DDFBEA', borderRadius: Radius.lg, padding: rs(10) },
  paidReceiptText: { flex: 1, fontSize: FontSize.xs, color: '#004829', fontWeight: FontWeight.semibold },
  warningCard: { flexDirection: 'row', gap: rs(12), backgroundColor: '#FFF7D1', borderRadius: Radius.xl, padding: rs(15), marginTop: rs(2) },
  warningTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#241A00', marginBottom: rs(3) },
  warningText: { fontSize: FontSize.sm, color: '#735C00', lineHeight: ms(20) },
});

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { createLoanRequest, listLoanMarketplace, listMyLoans } from '../../services/api';
import { getAuthToken } from '../../services/storage';

const demoOffers = [
  {
    id: 'demo-growth',
    title: 'Community Growth Loan',
    min_amount: 50000,
    max_amount: 500000,
    interest_rate: 8.5,
    duration_months: 6,
    risk_band: 'balanced',
    funding_speed: '24 hours',
    requirements: ['Verified CUB Score', 'MTN or Orange history'],
  },
  {
    id: 'demo-market',
    title: 'Market Expansion Credit',
    min_amount: 150000,
    max_amount: 1200000,
    interest_rate: 11,
    duration_months: 9,
    risk_band: 'watch',
    funding_speed: '48 hours',
    requirements: ['KYC completed', 'Guardian approval if minor'],
  },
];

function formatFcfa(value?: number): string {
  if (!value) return '0';
  return Math.round(value).toLocaleString();
}

export const RecordsHubScreen = () => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const [offers, setOffers] = useState<any[]>(demoOffers);
  const [loans, setLoans] = useState<any[]>([]);
  const [amount, setAmount] = useState('250000');
  const [duration, setDuration] = useState('6');
  const [purpose, setPurpose] = useState('Working capital');
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 4 }),
    ]).start();
  }, []);

  const loadMarketplace = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      setOffers(demoOffers);
      return;
    }

    setLoading(true);
    const [offersResult, loansResult] = await Promise.all([
      listLoanMarketplace(token, {
        amount: Number(amount) || undefined,
        duration_months: Number(duration) || undefined,
      }),
      listMyLoans(token),
    ]);
    setLoading(false);

    if (offersResult.success) {
      setOffers(offersResult.data?.length ? offersResult.data : demoOffers);
    }
    if (loansResult.success) {
      setLoans(loansResult.data || []);
    }
  }, [amount, duration]);

  useFocusEffect(useCallback(() => {
    loadMarketplace();
  }, [loadMarketplace]));

  const submitLoanRequest = async () => {
    const token = await getAuthToken();
    if (!token) {
      Alert.alert('Sign in required', 'Create or sign in to your CUB profile before requesting a loan.');
      return;
    }

    const requestedAmount = Number(amount);
    const durationMonths = Number(duration);
    if (!requestedAmount || requestedAmount <= 0 || !durationMonths || durationMonths <= 0) {
      Alert.alert('Loan details needed', 'Enter a valid amount and repayment duration.');
      return;
    }

    setRequesting(true);
    const result = await createLoanRequest(token, {
      requested_amount: requestedAmount,
      duration_months: durationMonths,
      interest_rate: 9.5,
      loan_purpose: purpose || 'CUB credit request',
      description: `Borrower request from CUB marketplace for ${formatFcfa(requestedAmount)} FCFA over ${durationMonths} months.`,
    });
    setRequesting(false);

    if (!result.success) {
      Alert.alert('Request failed', result.error || 'Could not create the loan request.');
      return;
    }

    Alert.alert('Loan request created', 'Your request is now visible for lender negotiation.');
    await loadMarketplace();
  };

  const stats = [
    { label: 'Open offers', value: String(offers.length), icon: 'storefront-outline' },
    { label: 'My loans', value: String(loans.length), icon: 'document-text-outline' },
    { label: 'Target', value: `${formatFcfa(Number(amount))}`, icon: 'cash-outline' },
  ];

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
              <Ionicons name="swap-horizontal" size={rs(13)} color="#fff" />
            </View>
            <Text style={styles.logoText}>CUB Loans</Text>
          </View>
          <TouchableOpacity style={styles.refreshPill} onPress={loadMarketplace} disabled={loading}>
            <Ionicons name="refresh" size={rs(12)} color="#F0D980" />
            <Text style={styles.refreshText}>{loading ? 'LOADING' : 'LIVE'}</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.heroTitle}>P2P Loan Marketplace</Text>
          <Text style={styles.heroSub}>Match with community lenders, negotiate terms, and track funding in one CUB workspace.</Text>
        </Animated.View>

        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name={s.icon as any} size={rs(14)} color="#F0D980" />
              </View>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.requestPanel}>
          <Text style={styles.sectionTitle}>Request Credit</Text>
          <View style={styles.inputGrid}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>AMOUNT FCFA</Text>
              <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" style={styles.input} placeholder="250000" placeholderTextColor="#9CA3AF" />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>MONTHS</Text>
              <TextInput value={duration} onChangeText={setDuration} keyboardType="numeric" style={styles.input} placeholder="6" placeholderTextColor="#9CA3AF" />
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>PURPOSE</Text>
            <TextInput value={purpose} onChangeText={setPurpose} style={styles.input} placeholder="Working capital" placeholderTextColor="#9CA3AF" />
          </View>
          <TouchableOpacity style={[styles.primaryBtn, requesting && { opacity: 0.7 }]} onPress={submitLoanRequest} disabled={requesting}>
            <LinearGradient colors={['#002853', '#133E72']} style={styles.primaryBtnBg}>
              <Text style={styles.primaryBtnText}>{requesting ? 'Creating request...' : 'Create loan request'}</Text>
              {!requesting && <Ionicons name="arrow-forward" size={rs(17)} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Matched Offers</Text>
          <Text style={styles.sectionMeta}>{offers.length} available</Text>
        </View>

        <View style={styles.offerList}>
          {offers.map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <View style={styles.offerTop}>
                <View style={styles.offerIcon}>
                  <Ionicons name="business-outline" size={rs(20)} color="#002853" />
                </View>
                <View style={styles.offerTitleWrap}>
                  <Text style={styles.offerTitle}>{offer.title}</Text>
                  <Text style={styles.offerSub}>{offer.funding_speed} funding · {offer.risk_band} risk</Text>
                </View>
                <Text style={styles.rateText}>{offer.interest_rate}%</Text>
              </View>
              <View style={styles.offerStats}>
                <View style={styles.offerStat}>
                  <Text style={styles.offerStatValue}>{formatFcfa(Number(offer.min_amount))}</Text>
                  <Text style={styles.offerStatLabel}>Min FCFA</Text>
                </View>
                <View style={styles.offerStat}>
                  <Text style={styles.offerStatValue}>{formatFcfa(Number(offer.max_amount))}</Text>
                  <Text style={styles.offerStatLabel}>Max FCFA</Text>
                </View>
                <View style={styles.offerStat}>
                  <Text style={styles.offerStatValue}>{offer.duration_months}</Text>
                  <Text style={styles.offerStatLabel}>Months</Text>
                </View>
              </View>
              <View style={styles.requirements}>
                {(offer.requirements || []).slice(0, 3).map((item: string) => (
                  <View key={item} style={styles.requirementChip}>
                    <Ionicons name="checkmark-circle" size={rs(12)} color="#002853" />
                    <Text style={styles.requirementText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Loan Pipeline</Text>
          <Text style={styles.sectionMeta}>{loans.length} loans</Text>
        </View>
        <View style={styles.pipelineCard}>
          {loans.length === 0 ? (
            <>
              <Ionicons name="document-text-outline" size={rs(24)} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No active loan requests yet</Text>
              <Text style={styles.emptyText}>Create a request above to begin lender matching and negotiation.</Text>
            </>
          ) : loans.slice(0, 4).map((loan) => (
            <View key={loan.id} style={styles.loanRow}>
              <View>
                <Text style={styles.loanAmount}>{formatFcfa(Number(loan.requested_amount))} FCFA</Text>
                <Text style={styles.loanMeta}>{loan.loan_purpose || 'Credit request'} · {loan.duration_months} months</Text>
              </View>
              <View style={styles.statusChip}>
                <Text style={styles.statusText}>{String(loan.status).toUpperCase()}</Text>
              </View>
            </View>
          ))}
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
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.xl, padding: rs(14) },
  statItem: { flex: 1, alignItems: 'center', gap: rs(5) },
  statIcon: { width: rs(32), height: rs(32), borderRadius: rs(16), backgroundColor: 'rgba(240,217,128,0.15)', alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  statLbl: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.62)', textAlign: 'center' },
  content: { padding: rs(16), paddingBottom: vs(110), gap: rs(16) },
  requestPanel: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(16), gap: rs(12), shadowColor: '#002853', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: '#181C1E' },
  inputGrid: { flexDirection: 'row', gap: rs(10) },
  field: { flex: 1, gap: rs(7) },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#5A7FA8', letterSpacing: 0.7 },
  input: { backgroundColor: '#F4F7FB', borderRadius: Radius.lg, paddingHorizontal: rs(12), paddingVertical: rs(12), fontSize: FontSize.base, color: '#181C1E' },
  primaryBtn: { borderRadius: Radius.full, overflow: 'hidden' },
  primaryBtnBg: { minHeight: rs(50), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8) },
  primaryBtnText: { fontSize: FontSize.md, color: '#FFFFFF', fontWeight: FontWeight.bold },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: rs(2) },
  sectionMeta: { fontSize: FontSize.sm, color: '#5A7FA8', fontWeight: FontWeight.semibold },
  offerList: { gap: rs(12) },
  offerCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(15), gap: rs(14), shadowColor: '#002853', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  offerTop: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  offerIcon: { width: rs(42), height: rs(42), borderRadius: rs(14), backgroundColor: '#DCE7F3', alignItems: 'center', justifyContent: 'center' },
  offerTitleWrap: { flex: 1 },
  offerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#181C1E' },
  offerSub: { fontSize: FontSize.xs, color: '#6B7280', marginTop: rs(2) },
  rateText: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: '#735C00' },
  offerStats: { flexDirection: 'row', gap: rs(8) },
  offerStat: { flex: 1, backgroundColor: '#F4F7FB', borderRadius: Radius.md, padding: rs(10) },
  offerStatValue: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: '#002853' },
  offerStatLabel: { fontSize: FontSize.xs, color: '#6B7280', marginTop: rs(2) },
  requirements: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(7) },
  requirementChip: { flexDirection: 'row', alignItems: 'center', gap: rs(5), backgroundColor: '#FFF7D1', borderRadius: Radius.full, paddingHorizontal: rs(9), paddingVertical: rs(6) },
  requirementText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: '#241A00' },
  pipelineCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(16), gap: rs(10), alignItems: 'center', shadowColor: '#002853', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  emptyTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#374151' },
  emptyText: { fontSize: FontSize.sm, color: '#9CA3AF', textAlign: 'center', lineHeight: ms(20) },
  loanRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F4F7FB', borderRadius: Radius.lg, padding: rs(12) },
  loanAmount: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#181C1E' },
  loanMeta: { fontSize: FontSize.xs, color: '#6B7280', marginTop: rs(3) },
  statusChip: { backgroundColor: '#DCE7F3', borderRadius: Radius.full, paddingHorizontal: rs(9), paddingVertical: rs(5) },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#002853' },
});

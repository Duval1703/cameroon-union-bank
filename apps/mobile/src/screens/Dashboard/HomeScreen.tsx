import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrustScoreRing } from '../../components/common/TrustScoreRing';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import {
  generateCreditScore,
  getCurrentUser,
  getPredictions,
  getRecordsSummary,
  getTrustScore,
  listReceiptVerifications,
} from '../../services/api';
import { getAuthToken, getUserData, saveUserData } from '../../services/storage';
import {
  CollectedFinancialData,
  MoneyProvider,
  filterCollectionsForUser,
  getCollectedFinancialData,
  requestApiDataCollection,
} from '../../services/data_collection';

const { width: SW } = Dimensions.get('window');

const quickActions = [
  { icon: 'finger-print-outline',     label: 'Complete\nKYC',     color: '#002853', bg: '#DCE7F3', screen: 'Verify' },
  { icon: 'cash-outline',             label: 'Request\nLoan',     color: '#735C00', bg: '#FFF7D1', screen: 'Records' },
  { icon: 'wallet-outline',           label: 'Repay\nLoan',       color: '#004829', bg: '#DDFBEA', screen: 'Inventory' },
  { icon: 'bar-chart-outline',        label: 'Portfolio',         color: '#1F5D9A', bg: '#EFF6FF', screen: 'Insights' },
];

type DashboardUser = {
  id?: string;
  full_name?: string;
  phone?: string;
  credit_score?: number | null;
  trust_score?: number | null;
  kyc_status?: string;
  liveness_verified?: boolean;
};

type RecordsSummary = {
  sales_today?: number;
  expenses_today?: number;
  stock_today?: number;
  profit_today?: number;
  sales_count_today?: number;
  expenses_count_today?: number;
  stock_count_today?: number;
  sales_week?: number;
  expenses_week?: number;
  stock_week?: number;
  profit_week?: number;
  recent_activity?: Array<{ type: string; title: string; amount: number; created_at: string }>;
};

function toTrustPercent(user?: DashboardUser | null): number {
  const rawScore = user?.credit_score ?? user?.trust_score ?? 500;
  const score = rawScore > 100 ? Math.round(rawScore / 10) : Math.round(rawScore);

  return Math.max(0, Math.min(100, score));
}

function getTrustLabel(score: number): string {
  if (score >= 80) return 'STRONG';
  if (score >= 65) return 'GOOD';
  if (score >= 45) return 'BUILDING';
  return 'STARTING';
}

function formatFcfa(value?: number): string {
  if (!value) return '0';
  return Math.round(value).toLocaleString();
}

function formatActivityTime(value?: string): string {
  if (!value) return 'Recently';
  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) return 'Recently';

  const diffMinutes = Math.max(0, Math.round((Date.now() - createdAt.getTime()) / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  return createdAt.toLocaleDateString();
}

function getActivityMeta(type?: string) {
  if (type === 'sale') return { icon: 'cash-outline', color: '#059669', prefix: '+' };
  if (type === 'expense') return { icon: 'trending-down-outline', color: '#DC2626', prefix: '-' };
  if (type === 'stock') return { icon: 'cube-outline', color: '#2563EB', prefix: '-' };
  return { icon: 'document-text-outline', color: '#6B7280', prefix: '' };
}

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [user, setUser] = React.useState<DashboardUser | null>(null);
  const [financialData, setFinancialData] = React.useState<CollectedFinancialData[]>([]);
  const [recordsSummary, setRecordsSummary] = React.useState<RecordsSummary | null>(null);
  const [receiptHistory, setReceiptHistory] = React.useState<any[]>([]);
  const [trustData, setTrustData] = React.useState<any | null>(null);
  const [predictions, setPredictions] = React.useState<any | null>(null);
  const [collectingProvider, setCollectingProvider] = React.useState<MoneyProvider | null>(null);
  const [scoring, setScoring] = React.useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const trustScore = trustData?.score ?? toTrustPercent(user);
  const trustLabel = getTrustLabel(trustScore);
  const latestCollection = financialData[0];
  const latestSummary = latestCollection?.data?.summary;
  const latestTransactions = latestCollection?.data?.transactions?.length ?? latestSummary?.total_transactions ?? 0;
  const firstName = user?.full_name?.split(' ')[0] || 'Member';
  const recordsToday = (recordsSummary?.sales_count_today || 0) + (recordsSummary?.expenses_count_today || 0) + (recordsSummary?.stock_count_today || 0);
  const suspiciousReceipts = receiptHistory.filter((item) => item.verdict === 'suspicious').length;
  const predictionTip = predictions?.recommendations?.[0] || 'Connect mobile money data, complete KYC, and maintain repayment history to unlock sharper credit insights.';
  const recentRecords = recordsSummary?.recent_activity || [];

  const loadDashboardData = React.useCallback(async () => {
    const [storedUser, token, collections] = await Promise.all([
      getUserData(),
      getAuthToken(),
      getCollectedFinancialData(),
    ]);

    if (storedUser) {
      setUser(storedUser);
      setFinancialData(filterCollectionsForUser(collections, storedUser));
    } else {
      setFinancialData([]);
    }

    if (token) {
      const [userResponse, recordsResponse, receiptsResponse, trustResponse, predictionsResponse] = await Promise.all([
        getCurrentUser(token),
        getRecordsSummary(token),
        listReceiptVerifications(token),
        getTrustScore(token),
        getPredictions(token),
      ]);

      if (userResponse.success && userResponse.data) {
        setUser(userResponse.data);
        setFinancialData(filterCollectionsForUser(collections, userResponse.data));
        await saveUserData(userResponse.data);
      }
      if (recordsResponse.success) setRecordsSummary(recordsResponse.data || null);
      if (receiptsResponse.success) setReceiptHistory(receiptsResponse.data || []);
      if (trustResponse.success) setTrustData(trustResponse.data || null);
      if (predictionsResponse.success) setPredictions(predictionsResponse.data || null);
    }
  }, []);

  const handleCollect = async (provider: MoneyProvider) => {
    if (!user?.phone) {
      Alert.alert('Phone number needed', 'Please log in again or complete your CUB profile before syncing Mobile Money data.');
      return;
    }

    setCollectingProvider(provider);
    const response = await requestApiDataCollection({
      userPhone: user.phone,
      provider,
      userId: user.id,
    });
    setCollectingProvider(null);

    if (!response.success) {
      Alert.alert('Collection Request Failed', response.error || 'Could not start Mobile Money sync.');
      return;
    }

    Alert.alert(
      'Approve in ntfy',
      `${provider} sync request sent. Open the ntfy notification and tap Approve, then return here to refresh your collected transactions.`
    );
  };

  const handleRefreshCollections = async () => {
    const collections = await getCollectedFinancialData();
    setFinancialData(filterCollectionsForUser(collections, user));
  };

  const navigateToTab = (tabName: string) => {
    navigation.getParent()?.navigate(tabName);
  };

  const handleGenerateScore = async () => {
    const token = await getAuthToken();
    if (!token) {
      Alert.alert('Login required', 'Please log in before generating your CUB Score.');
      return;
    }

    setScoring(true);
    const response = await generateCreditScore(token);
    setScoring(false);

    if (!response.success) {
      Alert.alert('CUB Score Failed', response.error || 'Could not generate your CUB Score.');
      return;
    }

    const updatedUser = response.data?.user || response.data;
    if (updatedUser) {
      const mergedUser = { ...(user || {}), ...updatedUser };
      setUser(mergedUser);
      await saveUserData(mergedUser);
    }

    await handleRefreshCollections();
    const trustResponse = await getTrustScore(token);
    if (trustResponse.success) setTrustData(trustResponse.data || null);
    Alert.alert('CUB Score Updated', 'Your Mobile Money transactions have been scored successfully.');
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 5 }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(110) }}>

        {/* ── Hero gradient header ── */}
        <LinearGradient
          colors={['#00172F', '#002853', '#133E72']}
          style={[styles.hero, { paddingTop: insets.top + rs(14) }]}
        >
          {/* Decorative orbs */}
          <View style={styles.orb1} />
          <View style={styles.orb2} />

          {/* Nav row */}
          <View style={styles.navRow}>
            <View style={styles.logoRow}>
              <View style={styles.logoBox}>
                <Ionicons name="checkmark" size={rs(11)} color="#fff" />
              </View>
              <Text style={styles.logoText}>CUB</Text>
            </View>
            <View style={styles.navRight}>
              <View style={styles.syncPill}>
                <View style={styles.syncDot} />
                <Text style={styles.syncText}>LIVE</Text>
              </View>
              <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
                <Ionicons name="notifications-outline" size={rs(20)} color="rgba(255,255,255,0.9)" />
                <View style={styles.notifDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Greeting */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.greeting}>Good morning, {firstName}</Text>
            <Text style={styles.greetingSub}>Here's your financial identity overview</Text>
          </Animated.View>

          {/* Sales card */}
          <Animated.View style={[styles.salesCard, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient
              colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.06)']}
              style={styles.salesCardInner}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={styles.salesCardBorder} />
              <Text style={styles.salesLabel}>AVAILABLE CREDIT SNAPSHOT</Text>
              <Text style={styles.salesAmount}>{formatFcfa(recordsSummary?.sales_today)} <Text style={styles.salesCur}>FCFA</Text></Text>
              <View style={styles.salesMetaRow}>
                <View style={styles.growthBadge}>
                  <Ionicons name="trending-up" size={rs(11)} color="#059669" />
                  <Text style={styles.growthText}>{formatFcfa(recordsSummary?.sales_week)} weekly inflow</Text>
                </View>
                <Text style={styles.profitLine}>Net flow: <Text style={styles.profitAmt}>{formatFcfa(recordsSummary?.profit_today)}</Text></Text>
              </View>
              <View style={styles.salesDivider} />
              <View style={styles.salesStatsRow}>
                {[
                  { label: 'Income', value: String(recordsSummary?.sales_count_today || 0) },
                  { label: 'Outflow', value: String(recordsSummary?.expenses_count_today || 0) },
                  { label: 'Records', value: String(recordsSummary?.stock_count_today || 0) },
                ].map((s, i) => (
                  <View key={i} style={styles.salesStat}>
                    <Text style={styles.salesStatVal}>{s.value}</Text>
                    <Text style={styles.salesStatLbl}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </Animated.View>
        </LinearGradient>

        {/* CUB Score */}
        <Animated.View style={[styles.trustRow, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.trustCard}
            onPress={() => navigation.getParent()?.navigate('Insights', { screen: 'TrustScoreDetail' })}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#00172F', '#002853']} style={styles.trustGradient}>
              <Text style={styles.trustLabel}>CUB SCORE</Text>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TrustScoreRing score={trustScore} size={rs(80)} strokeWidth={rs(6)} showLabel={false} />
              </Animated.View>
              <Text style={styles.trustScore}>{trustScore}</Text>
              <View style={styles.trustBadge}>
                <Ionicons name="star" size={rs(10)} color="#F0D980" />
                <Text style={styles.trustBadgeText}>{trustLabel}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.trustStats}>
            {[
              { label: 'KYC proofs', value: String(receiptHistory.length), icon: 'receipt-outline', color: '#002853' },
              { label: 'Records today', value: String(recordsToday), icon: 'trending-up-outline', color: '#1F5D9A' },
              { label: 'Risk flags', value: String(suspiciousReceipts), icon: 'warning-outline', color: '#735C00' },
            ].map((s, i) => (
              <View key={i} style={styles.trustStatCard}>
                <View style={[styles.trustStatIcon, { backgroundColor: `${s.color}18` }]}>
                  <Ionicons name={s.icon as any} size={rs(16)} color={s.color} />
                </View>
                <Text style={styles.trustStatVal}>{s.value}</Text>
                <Text style={styles.trustStatLbl}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Quick Actions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((a, i) => (
              <TouchableOpacity
                key={i}
                style={styles.actionCard}
                onPress={() => navigateToTab(a.screen)}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: a.bg }]}>
                  <Ionicons name={a.icon as any} size={rs(24)} color={a.color} />
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Mobile Money data sync ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mobile Money Sync</Text>
            <TouchableOpacity onPress={handleRefreshCollections}>
              <Text style={styles.seeAll}>Refresh</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.syncCard}>
            <View style={styles.syncHeader}>
              <View style={styles.syncIconLarge}>
                <Ionicons name="wallet-outline" size={rs(22)} color="#002853" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.syncTitle}>Consent-based transaction data</Text>
                <Text style={styles.syncSub}>
                  {latestTransactions
                    ? `${latestTransactions} transactions ready for scoring`
                    : 'Start with MTN or Orange, then approve the ntfy request.'}
                </Text>
              </View>
            </View>
            <View style={styles.collectionStats}>
              <View style={styles.collectionStat}>
                <Text style={styles.collectionValue}>{latestTransactions}</Text>
                <Text style={styles.collectionLabel}>Transactions</Text>
              </View>
              <View style={styles.collectionStat}>
                <Text style={styles.collectionValue}>{formatFcfa(latestSummary?.total_received)}</Text>
                <Text style={styles.collectionLabel}>Received</Text>
              </View>
              <View style={styles.collectionStat}>
                <Text style={styles.collectionValue}>{latestCollection?.data?.provider || '--'}</Text>
                <Text style={styles.collectionLabel}>Provider</Text>
              </View>
            </View>
            <View style={styles.syncActions}>
              {(['MTN', 'ORANGE'] as MoneyProvider[]).map((provider) => (
                <TouchableOpacity
                  key={provider}
                  style={[styles.providerBtn, provider === 'ORANGE' && styles.providerBtnOrange]}
                  onPress={() => handleCollect(provider)}
                  disabled={!!collectingProvider || scoring}
                  activeOpacity={0.85}
                >
                  <Ionicons name="notifications-outline" size={rs(16)} color="#FFFFFF" />
                  <Text style={styles.providerBtnText}>
                    {collectingProvider === provider ? 'Sending...' : `Sync ${provider}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.scoreBtn, scoring && { opacity: 0.7 }]}
              onPress={handleGenerateScore}
              disabled={scoring || !!collectingProvider}
              activeOpacity={0.85}
            >
              <Ionicons name="analytics-outline" size={rs(18)} color="#002853" />
              <Text style={styles.scoreBtnText}>{scoring ? 'Generating CUB Score...' : 'Generate CUB Score'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.transactionsBtn}
              onPress={() => navigation.navigate('MobileMoneyTransactions')}
              activeOpacity={0.85}
            >
              <Ionicons name="list-outline" size={rs(18)} color="#002853" />
              <Text style={styles.transactionsBtnText}>View uploaded transactions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── AI Insight banner ── */}
        <TouchableOpacity
          style={styles.insightWrap}
          onPress={() => navigateToTab('Insights')}
          activeOpacity={0.88}
        >
          <LinearGradient colors={['#00172F', '#002853', '#133E72']} style={styles.insightBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.insightOrb} />
            <View style={styles.insightLeft}>
              <View style={styles.insightChip}>
                <Ionicons name="sparkles" size={rs(10)} color="#F0D980" />
                <Text style={styles.insightChipText}>{predictions ? `${Math.round(predictions.confidence || 0)}% CONFIDENCE` : 'AI INSIGHT'}</Text>
              </View>
              <Text style={styles.insightTitle}>
                {predictions ? `${formatFcfa(predictions.predicted_profit_next_week)} FCFA projected capacity` : 'Keep building your financial history'}
              </Text>
              <Text style={styles.insightBody}>{predictionTip}</Text>
              <Text style={styles.insightCTA}>View Insights  →</Text>
            </View>
            <View style={styles.insightIconBox}>
              <Ionicons name="hardware-chip-outline" size={rs(28)} color="rgba(255,255,255,0.9)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Recent Activity ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigateToTab('Records')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityCard}>
            {recentRecords.length === 0 ? (
              <View style={styles.emptyActivity}>
                <Ionicons name="document-text-outline" size={rs(24)} color="#9CA3AF" />
                <Text style={styles.emptyActivityTitle}>No recent records yet</Text>
                <Text style={styles.emptyActivityText}>Add income, expenses, mobile money records, or KYC proofs to build your dashboard.</Text>
              </View>
            ) : recentRecords.map((item, i) => {
              const meta = getActivityMeta(item.type);
              return (
                <View key={`${item.type}-${item.created_at}-${i}`} style={[styles.activityRow, i < recentRecords.length - 1 && styles.activityDiv]}>
                  <View style={[styles.activityIcon, { backgroundColor: `${meta.color}18` }]}>
                    <Ionicons name={meta.icon as any} size={rs(18)} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activitySub}>{formatActivityTime(item.created_at)} • {item.type}</Text>
                  </View>
                  <Text style={[styles.activityAmt, { color: meta.color }]}>{meta.prefix}{formatFcfa(item.amount)}</Text>
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigateToTab('Records')} activeOpacity={0.85}>
        <LinearGradient colors={['#F0D980', '#735C00']} style={styles.fabGrad}>
          <Ionicons name="add" size={rs(28)} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F4F2' },

  // Hero
  hero: { paddingHorizontal: rs(20), paddingBottom: rs(28), overflow: 'hidden' },
  orb1: { position: 'absolute', top: rs(-40), right: rs(-40), width: rs(180), height: rs(180), borderRadius: rs(90), backgroundColor: 'rgba(255,255,255,0.06)' },
  orb2: { position: 'absolute', bottom: rs(10), left: rs(-30), width: rs(120), height: rs(120), borderRadius: rs(60), backgroundColor: 'rgba(255,255,255,0.04)' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(16) },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: rs(7) },
  logoBox: { width: rs(24), height: rs(24), borderRadius: rs(6), backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  syncPill: { flexDirection: 'row', alignItems: 'center', gap: rs(4), backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: Radius.full },
  syncDot: { width: rs(6), height: rs(6), borderRadius: rs(3), backgroundColor: '#4ADE80' },
  syncText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#4ADE80', letterSpacing: 0.5 },
  notifBtn: { position: 'relative' },
  notifDot: { position: 'absolute', top: 0, right: 0, width: rs(8), height: rs(8), borderRadius: rs(4), backgroundColor: '#F87171', borderWidth: 1, borderColor: '#002853' },
  greeting: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: '#FFFFFF', marginBottom: rs(2) },
  greetingSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)', marginBottom: rs(16) },

  // Sales card
  salesCard: { borderRadius: Radius.xl, overflow: 'hidden' },
  salesCardInner: { padding: rs(18), borderRadius: Radius.xl, position: 'relative' },
  salesCardBorder: { position: 'absolute', inset: 0, borderRadius: Radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  salesLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.2, fontWeight: FontWeight.semibold, marginBottom: rs(4) },
  salesAmount: { fontSize: ms(36), fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  salesCur: { fontSize: FontSize.lg },
  salesMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: rs(8) },
  growthBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(4), backgroundColor: 'rgba(74,222,128,0.2)', paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: Radius.full },
  growthText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: '#4ADE80' },
  profitLine: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)' },
  profitAmt: { color: '#FFFFFF', fontWeight: FontWeight.semibold },
  salesDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: rs(12) },
  salesStatsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  salesStat: { alignItems: 'center', gap: rs(2) },
  salesStatVal: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  salesStatLbl: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.55)' },

  // Trust
  trustRow: { flexDirection: 'row', marginHorizontal: rs(16), marginTop: rs(16), gap: rs(12) },
  trustCard: { borderRadius: Radius.xl, overflow: 'hidden', shadowColor: '#002853', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  trustGradient: { padding: rs(16), alignItems: 'center', gap: rs(4) },
  trustLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', letterSpacing: 1, fontWeight: FontWeight.semibold },
  trustScore: { fontSize: ms(28), fontWeight: FontWeight.extrabold, color: '#FFFFFF', marginTop: rs(-8) },
  trustBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(4), backgroundColor: 'rgba(245,166,35,0.25)', paddingHorizontal: rs(10), paddingVertical: rs(3), borderRadius: Radius.full },
  trustBadgeText: { fontSize: FontSize.xs, color: '#F0D980', fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  trustStats: { flex: 1, gap: rs(10) },
  trustStatCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: Radius.lg, padding: rs(10), flexDirection: 'row', alignItems: 'center', gap: rs(8), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  trustStatIcon: { width: rs(30), height: rs(30), borderRadius: rs(15), alignItems: 'center', justifyContent: 'center' },
  trustStatVal: { fontSize: FontSize.md, fontWeight: FontWeight.extrabold, color: '#111827' },
  trustStatLbl: { fontSize: FontSize.xs, color: '#9CA3AF', marginTop: rs(1) },

  // Quick actions
  section: { paddingHorizontal: rs(16), marginTop: rs(20), gap: rs(12) },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#111827' },
  seeAll: { fontSize: FontSize.base, color: '#002853', fontWeight: FontWeight.semibold },
  actionsGrid: { flexDirection: 'row', gap: rs(10) },
  actionCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(14), alignItems: 'center', gap: rs(8), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  actionIconBox: { width: rs(48), height: rs(48), borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: '#374151', textAlign: 'center' },

  // Mobile Money sync
  syncCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(14), gap: rs(12), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  syncHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  syncIconLarge: { width: rs(44), height: rs(44), borderRadius: rs(14), backgroundColor: '#DCE7F3', alignItems: 'center', justifyContent: 'center' },
  syncTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#111827' },
  syncSub: { fontSize: FontSize.xs, color: '#6B7280', marginTop: rs(2), lineHeight: ms(12) * 1.4 },
  collectionStats: { flexDirection: 'row', gap: rs(8) },
  collectionStat: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: Radius.md, padding: rs(10), minHeight: rs(62), justifyContent: 'center' },
  collectionValue: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: '#002853' },
  collectionLabel: { fontSize: FontSize.xs, color: '#9CA3AF', marginTop: rs(2) },
  syncActions: { flexDirection: 'row', gap: rs(10) },
  providerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6), backgroundColor: '#D4A000', paddingVertical: rs(12), borderRadius: Radius.lg },
  providerBtnOrange: { backgroundColor: '#D97706' },
  providerBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  scoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), backgroundColor: '#DCE7F3', borderWidth: 1, borderColor: '#B9CCE1', paddingVertical: rs(12), borderRadius: Radius.lg },
  scoreBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#002853' },
  transactionsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1FAE5', paddingVertical: rs(12), borderRadius: Radius.lg },
  transactionsBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#002853' },

  // Insight banner
  insightWrap: { marginHorizontal: rs(16), marginTop: rs(16), borderRadius: Radius.xl, overflow: 'hidden', shadowColor: '#002853', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  insightBanner: { padding: rs(18), flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  insightOrb: { position: 'absolute', top: rs(-20), right: rs(-20), width: rs(100), height: rs(100), borderRadius: rs(50), backgroundColor: 'rgba(255,255,255,0.08)' },
  insightLeft: { flex: 1, gap: rs(5) },
  insightChip: { flexDirection: 'row', alignItems: 'center', gap: rs(4), backgroundColor: 'rgba(245,166,35,0.25)', paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: Radius.full, alignSelf: 'flex-start' },
  insightChipText: { fontSize: FontSize.xs, color: '#F0D980', fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  insightTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  insightBody: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.72)', lineHeight: ms(14) * 1.5 },
  insightCTA: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#F0D980' },
  insightIconBox: { width: rs(52), height: rs(52), borderRadius: rs(26), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  // Activity
  activityCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12), padding: rs(14) },
  activityDiv: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  activityIcon: { width: rs(40), height: rs(40), borderRadius: rs(20), alignItems: 'center', justifyContent: 'center' },
  activityTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: '#111827' },
  activitySub: { fontSize: FontSize.xs, color: '#9CA3AF', marginTop: rs(2) },
  activityAmt: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  emptyActivity: { alignItems: 'center', padding: rs(20), gap: rs(6) },
  emptyActivityTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#374151' },
  emptyActivityText: { fontSize: FontSize.sm, color: '#9CA3AF', textAlign: 'center', lineHeight: ms(14) * 1.4 },

  // FAB
  fab: { position: 'absolute', bottom: vs(96), right: rs(20), borderRadius: rs(28), overflow: 'hidden', shadowColor: '#D97706', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  fabGrad: { width: rs(56), height: rs(56), alignItems: 'center', justifyContent: 'center' },
});

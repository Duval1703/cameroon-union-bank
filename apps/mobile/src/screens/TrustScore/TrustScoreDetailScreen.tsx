import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { TrustScoreRing } from '../../components/common/TrustScoreRing';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { getTrustScore } from '../../services/api';
import { getAuthToken } from '../../services/storage';

const fallbackBreakdown = [
  { label: 'Payment Verifications', score: 92, icon: 'shield-checkmark-outline', color: '#059669', weight: '40%' },
  { label: 'Sales Consistency',     score: 88, icon: 'trending-up-outline',       color: '#2563EB', weight: '30%' },
  { label: 'Fraud Reports',         score: 78, icon: 'flag-outline',              color: '#D97706', weight: '20%' },
  { label: 'Account Age',           score: 70, icon: 'calendar-outline',          color: '#7C3AED', weight: '10%' },
];

const fallbackHistory = [
  { date: 'Today',      score: 85 },
  { date: 'Yesterday',  score: 82 },
  { date: '3 days ago', score: 80 },
  { date: '1 week ago', score: 75 },
];

export const TrustScoreDetailScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(0.8)).current;
  const [scoreData, setScoreData] = useState<any | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 5 }),
      Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 8 }),
    ]).start();
  }, []);

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const token = await getAuthToken();
      if (!token) return;
      const result = await getTrustScore(token);
      if (active && result.success) {
        setScoreData(result.data);
      }
    })();
    return () => { active = false; };
  }, []));

  const score = scoreData?.score ?? 85;
  const breakdown = scoreData?.breakdown?.map((item: any, index: number) => ({
    label: item.label,
    score: item.score,
    icon: fallbackBreakdown[index % fallbackBreakdown.length].icon,
    color: fallbackBreakdown[index % fallbackBreakdown.length].color,
    weight: `${item.weight}%`,
  })) ?? fallbackBreakdown;
  const history = scoreData?.history?.length
    ? scoreData.history.map((item: any) => ({ date: new Date(item.created_at).toLocaleDateString(), score: item.score }))
    : fallbackHistory;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(40) }}>
        {/* Hero */}
        <LinearGradient
          colors={['#061E14','#0D4A35','#1B5E4B']}
          style={[styles.hero, { paddingTop: insets.top + rs(10) }]}
        >
          <View style={styles.orb1} />
          <View style={styles.orb2} />
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>CUB Score</Text>
            <TouchableOpacity style={styles.infoBtn}>
              <Ionicons name="information-circle-outline" size={rs(20)} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.scoreCenter, { opacity: fadeAnim, transform: [{ scale: pulseAnim }] }]}>
            <TrustScoreRing score={score} size={rs(160)} strokeWidth={rs(10)} showLabel={false} />
            <View style={styles.scoreOverlay}>
              <Text style={styles.scoreNumber}>{score}</Text>
              <Text style={styles.scoreOut}>/ 100</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.scoreMeta, { opacity: fadeAnim }]}>
            <View style={styles.statusBadge}>
              <Ionicons name="star" size={rs(12)} color="#F5A623" />
              <Text style={styles.statusText}>{(scoreData?.rating_tier || 'Strong Trust').toUpperCase()}</Text>
            </View>
            <Text style={styles.scoreSubtext}>Updated from saved records</Text>
          </Animated.View>
        </LinearGradient>

        {/* Quick stats */}
        <Animated.View style={[styles.statsRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {[
            { label: 'Verifications', value: '128', icon: 'shield-checkmark-outline', color: '#059669' },
            { label: 'Safe Rate',     value: '94%', icon: 'checkmark-circle-outline',  color: '#2563EB' },
            { label: 'Reports',       value: '2',   icon: 'flag-outline',              color: '#D97706' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${s.color}15` }]}>
                <Ionicons name={s.icon as any} size={rs(18)} color={s.color} />
              </View>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Breakdown */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Score Breakdown</Text>
          {breakdown.map((b: any, i: number) => (
            <View key={i} style={styles.breakdownCard}>
              <View style={[styles.breakdownIcon, { backgroundColor: `${b.color}15` }]}>
                <Ionicons name={b.icon as any} size={rs(18)} color={b.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.breakdownTop}>
                  <Text style={styles.breakdownLabel}>{b.label}</Text>
                  <Text style={[styles.breakdownScore, { color: b.color }]}>{b.score}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${b.score}%` as any, backgroundColor: b.color }]} />
                </View>
                <Text style={styles.weightLabel}>Weight: {b.weight}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* History */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Score History</Text>
          <View style={styles.historyCard}>
            {history.map((h: any, i: number) => (
              <View key={i} style={[styles.historyRow, i < history.length - 1 && styles.historyDiv]}>
                <Text style={styles.historyDate}>{h.date}</Text>
                <View style={styles.historyRight}>
                  <View style={[styles.historyBar, { width: rs(h.score) * 0.7 }]}>
                    <LinearGradient colors={['#0D4A35','#1B5E4B']} style={StyleSheet.absoluteFillObject} />
                  </View>
                  <Text style={styles.historyScore}>{h.score}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F4F2' },
  hero: { paddingHorizontal: rs(20), paddingBottom: rs(32), overflow: 'hidden', alignItems: 'center' },
  orb1: { position: 'absolute', top: rs(-40), right: rs(-40), width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.06)' },
  orb2: { position: 'absolute', bottom: rs(-20), left: rs(-30), width: rs(120), height: rs(120), borderRadius: rs(60), backgroundColor: 'rgba(255,255,255,0.04)' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: rs(16) },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  infoBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  scoreCenter: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: rs(16) },
  scoreOverlay: { position: 'absolute', alignItems: 'center' },
  scoreNumber: { fontSize: ms(44), fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  scoreOut: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  scoreMeta: { alignItems: 'center', gap: rs(6) },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(6), backgroundColor: 'rgba(245,166,35,0.22)', paddingHorizontal: rs(14), paddingVertical: rs(5), borderRadius: Radius.full },
  statusText: { fontSize: FontSize.xs, color: '#F5A623', fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  scoreSubtext: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)' },
  statsRow: { flexDirection: 'row', margin: rs(16), gap: rs(10) },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(14), alignItems: 'center', gap: rs(5), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  statIcon: { width: rs(36), height: rs(36), borderRadius: rs(18), alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: '#111827' },
  statLbl: { fontSize: FontSize.xs, color: '#9CA3AF', textAlign: 'center' },
  section: { paddingHorizontal: rs(16), marginBottom: rs(16), gap: rs(10) },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#111827' },
  breakdownCard: { flexDirection: 'row', alignItems: 'center', gap: rs(12), backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(14), shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  breakdownIcon: { width: rs(40), height: rs(40), borderRadius: rs(20), alignItems: 'center', justifyContent: 'center' },
  breakdownTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(6) },
  breakdownLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: '#374151' },
  breakdownScore: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  progressTrack: { height: rs(6), backgroundColor: '#F3F4F6', borderRadius: rs(3), overflow: 'hidden', marginBottom: rs(3) },
  progressFill: { height: '100%', borderRadius: rs(3) },
  weightLabel: { fontSize: FontSize.xs, color: '#9CA3AF' },
  historyCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: rs(14) },
  historyDiv: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  historyDate: { fontSize: FontSize.base, color: '#6B7280', width: rs(90) },
  historyRight: { flexDirection: 'row', alignItems: 'center', gap: rs(8), flex: 1 },
  historyBar: { height: rs(8), borderRadius: rs(4), overflow: 'hidden', flex: 0 },
  historyScore: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#111827' },
});

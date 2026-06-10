import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { getPredictions } from '../../services/api';
import { getAuthToken } from '../../services/storage';

const fallbackPredictions = [
  { title: 'Tomorrow\'s Sales Forecast', value: '~85,000 FCFA', icon: 'trending-up-outline', color: '#059669', confidence: 87, detail: 'Based on last 4 weeks pattern + today\'s trend' },
  { title: 'Restock Alert',             value: 'Rice & Oil',    icon: 'cube-outline',         color: '#D97706', confidence: 92, detail: 'Stock will run out in 2-3 days at current rate' },
  { title: 'Fraud Risk Window',         value: 'Tues–Wed PM',  icon: 'shield-outline',        color: '#DC2626', confidence: 78, detail: 'Historical spike in suspicious numbers these times' },
  { title: 'Revenue Opportunity',       value: '+15% potential',icon: 'bulb-outline',          color: '#7C3AED', confidence: 72, detail: 'Bundle Rice + Palm Oil for a 15% revenue boost' },
];

export const AIPredictionsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [predictions, setPredictions] = useState<any[]>(fallbackPredictions);

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const token = await getAuthToken();
      if (!token) return;
      const result = await getPredictions(token);
      if (active && result.success) {
        const data = result.data;
        setPredictions([
          {
            title: 'Next Week Sales Forecast',
            value: `~${Math.round(data.predicted_sales_next_week).toLocaleString()} FCFA`,
            icon: 'trending-up-outline',
            color: '#059669',
            confidence: Math.round(data.confidence),
            detail: `Predicted profit: ${Math.round(data.predicted_profit_next_week).toLocaleString()} FCFA`,
          },
          ...(data.recommendations || []).map((detail: string, index: number) => ({
            title: index === 0 ? 'Recommended Action' : 'Business Insight',
            value: index === 0 ? 'Priority' : 'Insight',
            icon: index === 0 ? 'bulb-outline' : 'sparkles-outline',
            color: index === 0 ? '#D97706' : '#2563EB',
            confidence: Math.round(data.confidence),
            detail,
          })),
        ]);
      }
    })();
    return () => { active = false; };
  }, []));

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
            <Text style={styles.headerTitle}>AI Predictions</Text>
          </View>
          <View style={{ width: rs(36) }} />
        </View>
        <Text style={styles.heroSub}>Powered by your business data & market patterns</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {predictions.map((p, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.cardIcon, { backgroundColor: `${p.color}15` }]}>
                <Ionicons name={p.icon as any} size={rs(22)} color={p.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{p.title}</Text>
                <Text style={[styles.cardValue, { color: p.color }]}>{p.value}</Text>
              </View>
              <View style={[styles.confBadge, { backgroundColor: `${p.color}15` }]}>
                <Text style={[styles.confText, { color: p.color }]}>{p.confidence}%</Text>
              </View>
            </View>
            <Text style={styles.cardDetail}>{p.detail}</Text>
            <View style={styles.confBar}>
              <View style={[styles.confFill, { width: `${p.confidence}%` as any, backgroundColor: p.color }]} />
            </View>
            <Text style={styles.confLabel}>Confidence: {p.confidence}%</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  header: { paddingHorizontal: rs(20), paddingBottom: rs(20), overflow: 'hidden' },
  orb: { position: 'absolute', top: rs(-40), right: rs(-40), width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.06)' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(6) },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  heroSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)' },
  list: { padding: rs(16), gap: rs(12), paddingBottom: vs(60) },
  card: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(16), gap: rs(10), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(12) },
  cardIcon: { width: rs(44), height: rs(44), borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: FontSize.sm, color: '#6B7280', marginBottom: rs(3) },
  cardValue: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  confBadge: { paddingHorizontal: rs(8), paddingVertical: rs(4), borderRadius: Radius.full },
  confText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  cardDetail: { fontSize: FontSize.sm, color: '#6B7280', lineHeight: ms(12) * 1.6 },
  confBar: { height: rs(5), backgroundColor: '#F3F4F6', borderRadius: rs(3), overflow: 'hidden' },
  confFill: { height: '100%', borderRadius: rs(3) },
  confLabel: { fontSize: FontSize.xs, color: '#9CA3AF' },
});

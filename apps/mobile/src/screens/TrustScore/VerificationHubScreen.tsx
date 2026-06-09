import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';

export const VerificationHubScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const options = [
    { icon: 'receipt-outline',        label: 'Upload Purchase Receipt', sub: 'AI checks supplier, amount, and authenticity', color: '#059669', bg: '#ECFDF5', screen: 'Capture' },
    { icon: 'time-outline',           label: 'Receipt History', sub: 'Past receipt verification results', color: '#D97706', bg: '#FFFBEB', screen: 'VerifyHistory' },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#030712','#0A1628','#0D2040']} style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.orb} />
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Ionicons name="shield-checkmark" size={rs(16)} color="#4ADE80" />
            <Text style={styles.headerTitle}>Verify Receipts</Text>
          </View>
          <View style={styles.aiBadge}><View style={styles.aiDot} /><Text style={styles.aiText}>AI ON</Text></View>
        </View>
        <View style={styles.trustBadge}>
          <Ionicons name="checkmark-circle" size={rs(14)} color="#4ADE80" />
          <Text style={styles.trustBadgeText}>Verified identity and financial documents strengthen your CUB Score</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {options.map((o, i) => (
          <TouchableOpacity
            key={i}
            style={styles.card}
            onPress={() => o.screen && navigation.navigate(o.screen)}
            activeOpacity={0.8}
          >
            <View style={[styles.cardIcon, { backgroundColor: o.bg }]}>
              <Ionicons name={o.icon as any} size={rs(26)} color={o.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>{o.label}</Text>
              <Text style={styles.cardSub}>{o.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={rs(16)} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F4F2' },
  header: { paddingHorizontal: rs(20), paddingBottom: rs(24), overflow: 'hidden' },
  orb: { position: 'absolute', top: rs(-40), right: rs(-40), width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.04)' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(14) },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(4), backgroundColor: 'rgba(74,222,128,0.15)', paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: Radius.full },
  aiDot: { width: rs(6), height: rs(6), borderRadius: rs(3), backgroundColor: '#4ADE80' },
  aiText: { fontSize: FontSize.xs, color: '#4ADE80', fontWeight: FontWeight.bold },
  trustBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(6), backgroundColor: 'rgba(74,222,128,0.1)', paddingHorizontal: rs(14), paddingVertical: rs(8), borderRadius: Radius.xl, borderWidth: 1, borderColor: 'rgba(74,222,128,0.15)' },
  trustBadgeText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },
  list: { padding: rs(16), gap: rs(12), paddingBottom: vs(60) },
  card: { flexDirection: 'row', alignItems: 'center', gap: rs(14), backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(16), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardIcon: { width: rs(56), height: rs(56), borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#111827', marginBottom: rs(2) },
  cardSub: { fontSize: FontSize.sm, color: '#9CA3AF' },
});

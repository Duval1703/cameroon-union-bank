import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';

export const ResultSuspiciousScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 12 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const flags = [
    { label: 'Number unregistered',   severity: 'high' },
    { label: 'Multiple recent reports', severity: 'high' },
    { label: 'Amount pattern unusual', severity: 'medium' },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#1C0A00','#7C1D1D','#DC2626']} style={StyleSheet.absoluteFillObject} />
      <View style={styles.orb} />

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + rs(16) }]}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }, { translateX: shakeAnim }] }]}>
          <View style={styles.outerRing}>
            <View style={styles.innerRing}>
              <Ionicons name="warning" size={rs(52)} color="#fff" />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.textSection, { opacity: fadeAnim }]}>
          <View style={styles.alertBadge}>
            <Ionicons name="alert-circle" size={rs(14)} color="#FCA5A5" />
            <Text style={styles.alertBadgeText}>HIGH RISK DETECTED</Text>
          </View>
          <Text style={styles.resultTitle}>Suspicious Receipt</Text>
          <Text style={styles.resultSub}>This receipt will not strengthen your credit record until reviewed</Text>
        </Animated.View>

        <Animated.View style={[styles.detailCard, { opacity: fadeAnim }]}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Result</Text>
            <Text style={styles.detailValue}>Receipt flagged</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Risk Level</Text>
            <View style={styles.riskChip}>
              <Text style={styles.riskText}>CRITICAL — 18/100</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.flagsCard, { opacity: fadeAnim }]}>
          <View style={styles.flagsHeader}>
            <Ionicons name="flag" size={rs(14)} color="#FCA5A5" />
            <Text style={styles.flagsTitle}>Risk Flags</Text>
          </View>
          {flags.map((f, i) => (
            <View key={i} style={styles.flagRow}>
              <View style={[styles.flagDot, { backgroundColor: f.severity === 'high' ? '#EF4444' : '#F59E0B' }]} />
              <Text style={styles.flagLabel}>{f.label}</Text>
              <Text style={[styles.flagSev, { color: f.severity === 'high' ? '#FCA5A5' : '#FCD34D' }]}>
                {f.severity.toUpperCase()}
              </Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.reportBtn} onPress={() => navigation.navigate('VerifyHistory')} activeOpacity={0.85}>
            <Ionicons name="flag-outline" size={rs(16)} color="#fff" />
            <Text style={styles.reportBtnText}>View Verification History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('VerificationHub')} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>Verify Another Receipt</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  orb: { position: 'absolute', top: rs(-50), right: rs(-50), width: rs(200), height: rs(200), borderRadius: rs(100), backgroundColor: 'rgba(255,255,255,0.05)' },
  content: { alignItems: 'center', paddingHorizontal: rs(24), paddingBottom: vs(40), gap: rs(24) },
  iconWrap: { alignItems: 'center' },
  outerRing: { width: rs(140), height: rs(140), borderRadius: rs(70), backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(239,68,68,0.4)' },
  innerRing: { width: rs(104), height: rs(104), borderRadius: rs(52), backgroundColor: 'rgba(239,68,68,0.2)', alignItems: 'center', justifyContent: 'center' },
  textSection: { alignItems: 'center', gap: rs(8) },
  alertBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(5), backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: rs(12), paddingVertical: rs(5), borderRadius: Radius.full },
  alertBadgeText: { fontSize: FontSize.xs, color: '#FCA5A5', fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  resultTitle: { fontSize: ms(26), fontWeight: FontWeight.extrabold, color: '#FFFFFF', textAlign: 'center' },
  resultSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  detailCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.xl, padding: rs(18), gap: rs(12), borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)' },
  detailValue: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: '#FFFFFF' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  riskChip: { backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: rs(10), paddingVertical: rs(3), borderRadius: Radius.full },
  riskText: { fontSize: FontSize.xs, color: '#FCA5A5', fontWeight: FontWeight.bold },
  flagsCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: Radius.xl, padding: rs(16), gap: rs(10), borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)' },
  flagsHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(4) },
  flagsTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  flagDot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  flagLabel: { flex: 1, fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)' },
  flagSev: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  actions: { width: '100%', gap: rs(10) },
  reportBtn: { backgroundColor: '#DC2626', borderRadius: Radius.full, paddingVertical: rs(15), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8) },
  reportBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  secondaryBtn: { paddingVertical: rs(12), alignItems: 'center' },
  secondaryBtnText: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.65)', fontWeight: FontWeight.medium },
});

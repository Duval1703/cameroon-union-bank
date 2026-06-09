import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';

export const ResultConfirmedScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const receipt = route.params || {};
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 14 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const signals = [
    { label: 'Receipt metadata stored', ok: true },
    { label: 'Supplier captured',  ok: !!receipt.supplier },
    { label: 'Amount available',   ok: !!receipt.amount },
    { label: 'Ready for CUB Score', ok: true },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#052E16','#065F46','#059669']} style={StyleSheet.absoluteFillObject} />
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + rs(16) }]}>
        {/* Shield icon */}
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.outerRing}>
            <View style={styles.innerRing}>
              <Ionicons name="shield-checkmark" size={rs(52)} color="#fff" />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.textSection, { opacity: fadeAnim }]}>
          <Text style={styles.resultTitle}>Receipt Verified</Text>
          <Text style={styles.resultSub}>{receipt.reason || 'This receipt was added to your verified purchasing history'}</Text>
        </Animated.View>

        {/* Payment details */}
        <Animated.View style={[styles.detailCard, { opacity: fadeAnim }]}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Supplier</Text>
            <Text style={styles.detailValue}>{receipt.supplier || 'Not provided'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.detailValue}>Authentic</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={[styles.detailValue, { fontSize: FontSize.xl, color: '#4ADE80' }]}>{Number(receipt.amount || 0).toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Confidence</Text>
            <View style={styles.scoreChip}>
              <Text style={styles.scoreText}>{Math.round(receipt.confidence || 0)} / 100</Text>
            </View>
          </View>
        </Animated.View>

        {/* AI Signals */}
        <Animated.View style={[styles.signalsCard, { opacity: fadeAnim }]}>
          <View style={styles.signalsHeader}>
            <Ionicons name="sparkles" size={rs(14)} color="#F5A623" />
            <Text style={styles.signalsTitle}>AI Verification Signals</Text>
          </View>
          {signals.map((s, i) => (
            <View key={i} style={styles.signalRow}>
              <View style={styles.signalDot}>
                <Ionicons name="checkmark" size={rs(12)} color="#fff" />
              </View>
              <Text style={styles.signalLabel}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.getParent()?.navigate('Records')} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Add Matching Stock Record</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('VerificationHub')} activeOpacity={0.85}>
            <Ionicons name="receipt-outline" size={rs(16)} color="rgba(255,255,255,0.7)" />
            <Text style={styles.secondaryBtnText}>Verify Another Receipt</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  orb1: { position: 'absolute', top: rs(-50), right: rs(-50), width: rs(200), height: rs(200), borderRadius: rs(100), backgroundColor: 'rgba(255,255,255,0.06)' },
  orb2: { position: 'absolute', bottom: rs(100), left: rs(-50), width: rs(150), height: rs(150), borderRadius: rs(75), backgroundColor: 'rgba(255,255,255,0.04)' },
  content: { alignItems: 'center', paddingHorizontal: rs(24), paddingBottom: vs(40), gap: rs(24) },
  iconWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: rs(180), height: rs(180), borderRadius: rs(90), backgroundColor: 'rgba(74,222,128,0.08)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.15)' },
  outerRing: { width: rs(140), height: rs(140), borderRadius: rs(70), backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  innerRing: { width: rs(104), height: rs(104), borderRadius: rs(52), backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  textSection: { alignItems: 'center', gap: rs(6) },
  resultTitle: { fontSize: ms(28), fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  resultSub: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.65)' },
  detailCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.xl, padding: rs(20), gap: rs(12), borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.55)' },
  detailValue: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: '#FFFFFF' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  scoreChip: { backgroundColor: 'rgba(74,222,128,0.2)', paddingHorizontal: rs(10), paddingVertical: rs(3), borderRadius: Radius.full },
  scoreText: { fontSize: FontSize.sm, color: '#4ADE80', fontWeight: FontWeight.bold },
  signalsCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.xl, padding: rs(16), gap: rs(10), borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  signalsHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(4) },
  signalsTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  signalRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  signalDot: { width: rs(20), height: rs(20), borderRadius: rs(10), backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  signalLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)' },
  actions: { width: '100%', gap: rs(10) },
  primaryBtn: { backgroundColor: '#FFFFFF', borderRadius: Radius.full, paddingVertical: rs(15), alignItems: 'center' },
  primaryBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#065F46' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6), paddingVertical: rs(12) },
  secondaryBtnText: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.7)', fontWeight: FontWeight.medium },
});

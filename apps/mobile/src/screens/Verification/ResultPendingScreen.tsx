import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';

export const ResultPendingScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    const spin = Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
    );
    spin.start();
    return () => spin.stop();
  }, []);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#1C1204','#78350F','#D97706']} style={StyleSheet.absoluteFillObject} />
      <View style={styles.orb} />

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + rs(16) }]}>
        <Animated.View style={[styles.iconWrap, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.spinRing, { transform: [{ rotate: spin }] }]} />
          <View style={styles.outerRing}>
            <View style={styles.innerRing}>
              <Ionicons name="hourglass-outline" size={rs(48)} color="#fff" />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.textSection, { opacity: fadeAnim }]}>
          <View style={styles.pendingBadge}>
            <Ionicons name="time-outline" size={rs(13)} color="#FCD34D" />
            <Text style={styles.pendingBadgeText}>VERIFICATION PENDING</Text>
          </View>
          <Text style={styles.resultTitle}>Analysis in Progress</Text>
          <Text style={styles.resultSub}>This receipt needs more information before it can fully count toward your Trust Score.</Text>
        </Animated.View>

        <Animated.View style={[styles.stepsCard, { opacity: fadeAnim }]}>
          {[
            { label: 'Receipt saved', done: true },
            { label: 'Metadata checked', done: true },
            { label: 'Supplier validation',   done: false },
            { label: 'Score contribution review',      done: false },
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepDot, { backgroundColor: step.done ? '#D97706' : 'rgba(255,255,255,0.15)' }]}>
                {step.done
                  ? <Ionicons name="checkmark" size={rs(11)} color="#fff" />
                  : <View style={styles.stepPending} />}
              </View>
              <Text style={[styles.stepLabel, { color: step.done ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)' }]}>{step.label}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('VerifyHistory')} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Check Later</Text>
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
  iconWrap: { position: 'relative', width: rs(160), height: rs(160), alignItems: 'center', justifyContent: 'center' },
  spinRing: { position: 'absolute', width: rs(160), height: rs(160), borderRadius: rs(80), borderWidth: 2, borderColor: 'transparent', borderTopColor: '#F59E0B', borderRightColor: 'rgba(245,158,11,0.3)' },
  outerRing: { width: rs(130), height: rs(130), borderRadius: rs(65), backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  innerRing: { width: rs(96), height: rs(96), borderRadius: rs(48), backgroundColor: 'rgba(217,119,6,0.2)', alignItems: 'center', justifyContent: 'center' },
  textSection: { alignItems: 'center', gap: rs(8) },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(5), backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: rs(12), paddingVertical: rs(5), borderRadius: Radius.full },
  pendingBadgeText: { fontSize: FontSize.xs, color: '#FCD34D', fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  resultTitle: { fontSize: ms(24), fontWeight: FontWeight.extrabold, color: '#FFFFFF', textAlign: 'center' },
  resultSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: ms(14) * 1.6 },
  stepsCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.xl, padding: rs(18), gap: rs(14), borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  stepDot: { width: rs(24), height: rs(24), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center' },
  stepPending: { width: rs(8), height: rs(8), borderRadius: rs(4), backgroundColor: 'rgba(255,255,255,0.3)' },
  stepLabel: { fontSize: FontSize.base },
  actions: { width: '100%', gap: rs(10) },
  primaryBtn: { backgroundColor: '#FFFFFF', borderRadius: Radius.full, paddingVertical: rs(15), alignItems: 'center' },
  primaryBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#78350F' },
  secondaryBtn: { paddingVertical: rs(12), alignItems: 'center' },
  secondaryBtnText: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.65)', fontWeight: FontWeight.medium },
});

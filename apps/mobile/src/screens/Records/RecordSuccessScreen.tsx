import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';

export const RecordSuccessScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { type = 'sale', amount = 0 } = route.params || {};

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  const config = {
    sale:    { colors: ['#065F46','#059669','#10B981'] as const, icon: 'cash-outline',          label: 'Sale',    word: 'recorded' },
    expense: { colors: ['#7F1D1D','#DC2626','#EF4444'] as const, icon: 'trending-down-outline', label: 'Expense', word: 'recorded' },
    stock:   { colors: ['#1E3A8A','#2563EB','#3B82F6'] as const, icon: 'cube-outline',          label: 'Stock',   word: 'logged' },
  }[type as string] || { colors: ['#065F46','#059669','#10B981'] as const, icon: 'cash-outline', label: 'Record', word: 'saved' };

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 12 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(checkAnim, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 16 }),
    ]).start();
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={config.colors} style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.orb1} />
        <View style={styles.orb2} />

        <View style={styles.content}>
          <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.outerRing}>
              <View style={styles.innerRing}>
                <Animated.View style={{ transform: [{ scale: checkAnim }] }}>
                  <Ionicons name="checkmark" size={rs(52)} color="#fff" />
                </Animated.View>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.textSection, { opacity: fadeAnim }]}>
            <Text style={styles.successTitle}>{config.label} {config.word}!</Text>
            <Text style={styles.successSub}>Successfully saved to your records</Text>
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>AMOUNT</Text>
              <Text style={styles.amountVal}>{amount.toLocaleString()} FCFA</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.popToTop()} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Back to Records</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.getParent()?.navigate('Home')} activeOpacity={0.85}>
              <Ionicons name="home-outline" size={rs(18)} color="rgba(255,255,255,0.8)" />
              <Text style={styles.secondaryBtnText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  orb1: { position: 'absolute', top: rs(-60), right: rs(-60), width: rs(200), height: rs(200), borderRadius: rs(100), backgroundColor: 'rgba(255,255,255,0.07)' },
  orb2: { position: 'absolute', bottom: rs(80), left: rs(-50), width: rs(150), height: rs(150), borderRadius: rs(75), backgroundColor: 'rgba(255,255,255,0.05)' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(32), gap: rs(32) },
  iconWrap: { alignItems: 'center' },
  outerRing: { width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  innerRing: { width: rs(120), height: rs(120), borderRadius: rs(60), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  textSection: { alignItems: 'center', gap: rs(8) },
  successTitle: { fontSize: ms(28), fontWeight: FontWeight.extrabold, color: '#FFFFFF', textAlign: 'center' },
  successSub: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  amountCard: { marginTop: rs(12), backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.xl, paddingHorizontal: rs(32), paddingVertical: rs(16), alignItems: 'center', gap: rs(4), borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  amountLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.2, fontWeight: FontWeight.semibold },
  amountVal: { fontSize: ms(28), fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  actions: { width: '100%', gap: rs(12) },
  primaryBtn: { backgroundColor: '#FFFFFF', borderRadius: Radius.full, paddingVertical: rs(16), alignItems: 'center' },
  primaryBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#111827' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), paddingVertical: rs(14) },
  secondaryBtnText: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.8)', fontWeight: FontWeight.semibold },
});

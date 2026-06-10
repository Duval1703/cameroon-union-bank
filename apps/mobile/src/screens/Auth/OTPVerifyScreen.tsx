import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';

const DIGITS = 6;

export const OTPVerifyScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState<string[]>(Array(DIGITS).fill(''));
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    const interval = setInterval(() => {
      setTimer(t => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleKey = (k: string) => {
    if (k === '⌫') {
      const idx = [...otp].reverse().findIndex(v => v !== '');
      if (idx === -1) return;
      const realIdx = DIGITS - 1 - idx;
      const next = [...otp]; next[realIdx] = '';
      setOtp(next); return;
    }
    const idx = otp.findIndex(v => v === '');
    if (idx === -1) return;
    const next = [...otp]; next[idx] = k;
    setOtp(next);
    if (idx === DIGITS - 1) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        navigation.navigate('PrivacyConsent');
      }, 1200);
    }
  };

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#00172F','#002853','#002853']} style={[styles.hero, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.orb} />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <View style={styles.smsIcon}>
            <Ionicons name="chatbubble-outline" size={rs(28)} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Verify Phone</Text>
          <Text style={styles.heroSub}>Enter the 6-digit code sent to{'\n'}+237 6XX XXX XXX</Text>
        </View>
      </LinearGradient>

      <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
        {/* OTP boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <View key={i} style={[styles.otpBox, digit && styles.otpBoxFilled]}>
              <Text style={styles.otpDigit}>{digit || ''}</Text>
              {!digit && <View style={styles.otpCursor} />}
            </View>
          ))}
        </View>

        {/* Numpad */}
        <View style={styles.numpad}>
          {keys.map((k, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.key, !k && { backgroundColor: 'transparent' }, k === '⌫' && styles.keyDel]}
              onPress={() => k && handleKey(k)}
              activeOpacity={k ? 0.7 : 1}
              disabled={!k}
            >
              {k === '⌫'
                ? <Ionicons name="backspace-outline" size={rs(20)} color="#DC2626" />
                : k
                  ? <Text style={styles.keyText}>{k}</Text>
                  : null}
            </TouchableOpacity>
          ))}
        </View>

        {/* Resend */}
        <View style={styles.resendRow}>
          {timer > 0
            ? <Text style={styles.resendTimer}>Resend code in <Text style={styles.timerVal}>{timer}s</Text></Text>
            : <TouchableOpacity onPress={() => setTimer(30)}>
                <Text style={styles.resendLink}>Resend Code</Text>
              </TouchableOpacity>}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  hero: { paddingHorizontal: rs(20), paddingBottom: rs(28), overflow: 'hidden' },
  orb: { position: 'absolute', top: rs(-40), right: rs(-40), width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.06)' },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: rs(16) },
  heroContent: { alignItems: 'center', gap: rs(10) },
  smsIcon: { width: rs(64), height: rs(64), borderRadius: rs(32), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: ms(26), fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  heroSub: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: ms(14) * 1.6 },
  body: { flex: 1, paddingHorizontal: rs(20), paddingTop: rs(24), gap: rs(24) },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: rs(10) },
  otpBox: { width: rs(46), height: rs(56), borderRadius: Radius.lg, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  otpBoxFilled: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
  otpDigit: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: '#111827' },
  otpCursor: { width: 2, height: rs(22), backgroundColor: '#059669', borderRadius: 1 },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(12) },
  key: { width: '30%', aspectRatio: 1.6, backgroundColor: '#FFFFFF', borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  keyDel: { backgroundColor: '#FEF2F2' },
  keyText: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: '#111827' },
  resendRow: { alignItems: 'center' },
  resendTimer: { fontSize: FontSize.base, color: '#9CA3AF' },
  timerVal: { color: '#002853', fontWeight: FontWeight.bold },
  resendLink: { fontSize: FontSize.base, color: '#002853', fontWeight: FontWeight.bold },
});

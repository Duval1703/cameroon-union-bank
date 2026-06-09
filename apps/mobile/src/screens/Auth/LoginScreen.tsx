import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { AnimatedPressable } from '../../components/common/AnimatedPressable';
import { Input } from '../../components/common/Input';
import { Colors } from '../../constants/Colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { loginUser } from '../../services/api';
import { saveAuthToken, saveUserData } from '../../services/storage';

const features = [
  { icon: 'shield-checkmark', color: '#002853', bg: '#DCE7F3', label: 'Bank-grade Security' },
  { icon: 'flash',            color: '#735C00', bg: '#FFF7D1', label: 'AI Credit Scoring' },
  { icon: 'wallet',           color: '#1F5D9A', bg: '#EFF6FF', label: 'MoMo Ready' },
];

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Information', 'Enter your email and PIN/password.');
      return;
    }

    setLoading(true);
    try {
      const backendPassword = password.length === 4 ? password.repeat(2) : password;
      const result = await loginUser({ email: email.trim(), password: backendPassword });

      if (!result.success) {
        Alert.alert('Sign In Failed', result.error || 'Invalid credentials.');
        return;
      }

      await saveAuthToken(result.data.access_token);
      await saveUserData(result.data.user);
      navigation.replace('Main');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* Hero gradient header */}
      <LinearGradient colors={['#00172F', '#002853', '#133E72']} style={styles.hero}>
        <View style={styles.heroOrb} />
        <Animated.View style={[styles.heroContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield-checkmark" size={rs(32)} color="#fff" />
          </View>
          <Text style={styles.brand}>Cameroon Union Bank</Text>
          <Text style={styles.tagline}>AI financial identity and P2P lending</Text>

          <View style={styles.socialProof}>
            <View style={styles.avatarStack}>
              {['#002853','#F0D980','#1F5D9A'].map((c, i) => (
                <View key={i} style={[styles.avatar, { backgroundColor: c, marginLeft: i > 0 ? rs(-10) : 0 }]}>
                  <Ionicons name="person" size={rs(12)} color="#fff" />
                </View>
              ))}
            </View>
            <Text style={styles.proofText}>Built for borrowers, lenders, and guardians</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Card */}
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSub}>Sign in to your CUB financial profile</Text>

          <View style={styles.form}>
            <View style={styles.phoneWrap}>
              <View style={styles.phonePrefix}>
                <Ionicons name="mail-outline" size={rs(17)} color={Colors.textMuted} />
                <View style={styles.divider} />
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="member@example.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Input
              label="Password / PIN"
              placeholder="Enter your PIN"
              value={password}
              onChangeText={setPassword}
              isPassword
              prefix={<Ionicons name="lock-closed-outline" size={rs(18)} color={Colors.textMuted} />}
            />

            <TouchableOpacity style={styles.forgotRow} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot your PIN?</Text>
            </TouchableOpacity>
          </View>

          <AnimatedPressable onPress={handleLogin} style={styles.loginBtn}>
            <LinearGradient colors={['#002853', '#133E72']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginGradient}>
              {loading
                ? <Text style={styles.loginText}>Signing in...</Text>
                : <>
                    <Text style={styles.loginText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={rs(18)} color="#fff" />
                  </>}
            </LinearGradient>
          </AnimatedPressable>

          {/* Features row */}
          <View style={styles.featuresRow}>
            {features.map((f, i) => (
              <View key={i} style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon as any} size={rs(16)} color={f.color} />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>New to CUB? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Create free account →</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },

  hero: { paddingTop: vs(60), paddingBottom: vs(48), paddingHorizontal: rs(24), overflow: 'hidden' },
  heroOrb: { position: 'absolute', width: rs(300), height: rs(300), borderRadius: rs(150), backgroundColor: 'rgba(255,255,255,0.05)', top: rs(-80), right: rs(-60) },
  heroContent: { gap: rs(8), alignItems: 'flex-start' },
  logoCircle: { width: rs(60), height: rs(60), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginBottom: rs(4) },
  brand: { fontSize: ms(26), fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  tagline: { fontSize: ms(14), color: 'rgba(255,255,255,0.65)', marginBottom: rs(16) },

  socialProof: { flexDirection: 'row', alignItems: 'center', gap: rs(10), backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: rs(12), paddingVertical: rs(8), borderRadius: rs(20), borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  avatarStack: { flexDirection: 'row' },
  avatar: { width: rs(24), height: rs(24), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(0,0,0,0.2)' },
  proofText: { fontSize: ms(12), color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

  scroll: { paddingHorizontal: rs(16), paddingBottom: vs(40) },
  card: { backgroundColor: '#fff', borderRadius: rs(24), padding: rs(24), marginTop: vs(-32), shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 12, gap: rs(4) },
  cardTitle: { fontSize: ms(22), fontWeight: '800', color: '#181C1E', marginBottom: rs(2) },
  cardSub: { fontSize: ms(14), color: Colors.textSecondary, marginBottom: rs(8) },

  form: { gap: rs(4), marginTop: rs(4) },
  phoneWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.inputBg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: rs(4) },
  phonePrefix: { flexDirection: 'row', alignItems: 'center', paddingLeft: rs(12), paddingRight: rs(8), gap: rs(6) },
  flag: { fontSize: ms(18) },
  countryCode: { fontSize: ms(15), fontWeight: '700', color: Colors.textPrimary },
  divider: { width: 1, height: rs(22), backgroundColor: Colors.border, marginRight: rs(4) },
  phoneInput: { flex: 1, fontSize: ms(16), color: Colors.textPrimary, paddingVertical: rs(14), paddingRight: rs(12) },

  forgotRow: { alignSelf: 'flex-end', marginTop: rs(-4) },
  forgotText: { fontSize: ms(13), color: Colors.primary, fontWeight: '600' },

  loginBtn: { borderRadius: rs(14), overflow: 'hidden', marginTop: rs(8) },
  loginGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), paddingVertical: rs(16) },
  loginText: { fontSize: ms(16), fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  featuresRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: rs(4) },
  featureItem: { alignItems: 'center', gap: rs(6) },
  featureIcon: { width: rs(40), height: rs(40), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center' },
  featureLabel: { fontSize: ms(10), color: Colors.textMuted, fontWeight: '600', textAlign: 'center', maxWidth: rs(72) },

  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: rs(4) },
  registerText: { fontSize: ms(14), color: Colors.textSecondary },
  registerLink: { fontSize: ms(14), color: Colors.primary, fontWeight: '700' },
});

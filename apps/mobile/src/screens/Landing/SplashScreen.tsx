import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { rs, vs, ms, SCREEN_W, SCREEN_H } from '../../utils/responsive';
import { isAuthenticated } from '../../services/storage';

export const SplashScreen = () => {
  const navigation = useNavigation<any>();

  const logoScale   = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const ringScale   = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY       = useRef(new Animated.Value(24)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeY       = useRef(new Animated.Value(16)).current;
  const orb1Opacity  = useRef(new Animated.Value(0)).current;
  const orb2Opacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Orbs fade in
      Animated.parallel([
        Animated.timing(orb1Opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(orb2Opacity, { toValue: 1, duration: 800, delay: 200, useNativeDriver: true }),
      ]),
      // Ring pulse + logo pop
      Animated.parallel([
        Animated.spring(ringScale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 80 }),
        Animated.timing(ringOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 100 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      // Brand name slides up
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(textY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      // Tagline
      Animated.timing(tagOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      // Badge
      Animated.parallel([
        Animated.timing(badgeOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(badgeY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();

    const t = setTimeout(async () => {
      const authed = await isAuthenticated();
      navigation.replace(authed ? 'Main' : 'Onboarding');
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <LinearGradient colors={['#00172F', '#002853', '#133E72']} locations={[0, 0.55, 1]} style={styles.screen}>
      <StatusBar style="light" />

      {/* Decorative orbs */}
      <Animated.View style={[styles.orb1, { opacity: orb1Opacity }]} />
      <Animated.View style={[styles.orb2, { opacity: orb2Opacity }]} />
      <Animated.View style={[styles.orb3, { opacity: orb1Opacity }]} />

      {/* Ring glow */}
      <Animated.View style={[styles.ringGlow, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <LinearGradient colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.10)']} style={styles.logoGlass}>
          <View style={styles.logoInner}>
            <Ionicons name="shield-checkmark" size={rs(42)} color="#FFFFFF" />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Brand name */}
      <Animated.View style={{ alignItems: 'center', opacity: textOpacity, transform: [{ translateY: textY }] }}>
        <Text style={styles.brand}>CUB</Text>
        <Text style={styles.brandAi}>CAMEROON UNION BANK</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
        Your Identity. Your Credit. Your Future.
      </Animated.Text>

      {/* Offline badge */}
      <Animated.View style={[styles.badge, { opacity: badgeOpacity, transform: [{ translateY: badgeY }] }]}>
        <View style={styles.badgeDot} />
        <Ionicons name="wifi" size={rs(12)} color="#F5A623" />
        <Text style={styles.badgeText}>AI FINANCIAL IDENTITY · P2P LENDING</Text>
      </Animated.View>

      {/* Footer */}
      <Text style={styles.footer}>Secured End-to-End · Built for Cameroon</Text>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomIndicator} />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: rs(18) },

  orb1: { position: 'absolute', width: rs(320), height: rs(320), borderRadius: rs(160), backgroundColor: 'rgba(240,217,128,0.12)', top: SCREEN_H * 0.05, left: rs(-120) },
  orb2: { position: 'absolute', width: rs(260), height: rs(260), borderRadius: rs(130), backgroundColor: 'rgba(255,255,255,0.07)', bottom: SCREEN_H * 0.1, right: rs(-80) },
  orb3: { position: 'absolute', width: rs(180), height: rs(180), borderRadius: rs(90), backgroundColor: 'rgba(255,255,255,0.04)', top: SCREEN_H * 0.55, left: rs(20) },

  ringGlow: { position: 'absolute', width: rs(220), height: rs(220), borderRadius: rs(110), borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(240,217,128,0.10)' },

  logoWrap: { marginBottom: rs(4) },
  logoGlass: { width: rs(100), height: rs(100), borderRadius: rs(28), alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)' },
  logoInner: { alignItems: 'center', justifyContent: 'center' },

  brand: { fontSize: ms(46), fontWeight: '800', color: '#FFFFFF', letterSpacing: 0 },
  brandAi: { fontSize: ms(11), fontWeight: '700', color: '#F0D980', letterSpacing: 2.2, marginTop: rs(-2) },
  brandAiAccent: { color: '#F0D980' },

  tagline: { fontSize: ms(14), color: 'rgba(255,255,255,0.6)', letterSpacing: 0.3, textAlign: 'center', paddingHorizontal: rs(32) },

  badge: { flexDirection: 'row', alignItems: 'center', gap: rs(6), backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: rs(16), paddingVertical: rs(9), borderRadius: rs(24), borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginTop: rs(8) },
  badgeDot: { width: rs(6), height: rs(6), borderRadius: rs(3), backgroundColor: '#F0D980' },
  badgeText: { fontSize: ms(10), fontWeight: '600', color: 'rgba(255,255,255,0.75)', letterSpacing: 0.8 },

  footer: { position: 'absolute', bottom: vs(48), fontSize: ms(10), color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 },
  bottomBar: { position: 'absolute', bottom: vs(24), alignItems: 'center' },
  bottomIndicator: { width: rs(36), height: rs(4), borderRadius: rs(2), backgroundColor: 'rgba(255,255,255,0.2)' },
});

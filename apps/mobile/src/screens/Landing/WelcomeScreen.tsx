import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { ms, rs, vs } from '../../utils/responsive';

const merchantImage = require('../../../assets/landing-merchant.png');

const featureCards = [
  {
    icon: 'scan-outline',
    title: 'Instant Verification',
    body: 'Stop payment fraud before it happens. MboaTrust AI verifies SMS and digital receipts in milliseconds.',
    tone: '#0B7A63',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Credit Scoring',
    body: 'Turn daily sales into a digital footprint that helps you qualify for small business loans.',
    tone: '#0B6B57',
  },
  {
    icon: 'stats-chart',
    title: 'Profit Tracking',
    body: 'View daily, weekly, and monthly profits with clear AI-driven insights.',
    tone: '#D49319',
  },
];

const communityFaces = [
  { initials: 'MK', color: '#E7F4EE' },
  { initials: 'AA', color: '#F5E8D1' },
  { initials: 'BN', color: '#DDEBE6' },
];

export const WelcomeScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const openAuth = (screen: 'Login' | 'Register') => {
    navigation.getParent()?.navigate('Auth', { screen });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + rs(18) }]}
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Ionicons name="shield-checkmark-outline" size={rs(18)} color={Colors.primary} />
            <Text style={styles.brandText}>MboaTrust AI</Text>
          </View>
          <TouchableOpacity style={styles.langButton} activeOpacity={0.75}>
            <Ionicons name="globe-outline" size={rs(16)} color="#5D6F68" />
            <Text style={styles.langText}>EN</Text>
            <Ionicons name="chevron-down" size={rs(14)} color="#5D6F68" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroImageWrap}>
          <Image source={merchantImage} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.aiPill}>
            <Ionicons name="flash" size={rs(18)} color="#FFFFFF" />
            <Text style={styles.aiPillText}>Instant AI Verification</Text>
          </View>
          <View style={styles.growthCard}>
            <View style={styles.growthIcon}>
              <Ionicons name="trending-up" size={rs(20)} color="#111827" />
            </View>
            <View>
              <Text style={styles.growthLabel}>PROFIT GROWTH</Text>
              <Text style={styles.growthValue}>+24% This Month</Text>
            </View>
          </View>
        </View>

        <View style={styles.trustBadge}>
          <Ionicons name="shield-checkmark" size={rs(15)} color={Colors.primary} />
          <Text style={styles.trustBadgeText}>Trusted by 10,000+ Cameroonian Merchants</Text>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>
            Grow Your Business with <Text style={styles.heroTitleAccent}>MboaTrust AI</Text>
          </Text>
          <Text style={styles.heroBody}>
            Verify mobile payments instantly, track your profits, and build your digital credit score with artificial intelligence.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.88} onPress={() => openAuth('Register')}>
            <LinearGradient colors={['#0B8068', '#006C57']} style={styles.primaryButtonBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={rs(18)} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.82} onPress={() => navigation.navigate('OnboardingSlides')}>
            <Text style={styles.secondaryButtonText}>How it works</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.merchantSection}>
          <Text style={styles.sectionTitleCenter}>Designed for the Modern Merchant</Text>
          <Text style={styles.sectionIntro}>
            Built to work in the heart of your market, ensuring every transaction is safe, verified, and counted.
          </Text>

          <View style={styles.featuresList}>
            {featureCards.map((feature) => (
              <View key={feature.title} style={styles.featureCard}>
                <View style={[styles.featureIcon, { backgroundColor: `${feature.tone}12` }]}>
                  <Ionicons name={feature.icon as any} size={rs(24)} color={feature.tone} />
                </View>
                <View style={styles.featureCopy}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureBody}>{feature.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.securitySection}>
          <Text style={styles.securityTitle}>Your digital partner for financial security</Text>
          <View style={styles.securityItems}>
            <View style={styles.securityItem}>
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={rs(13)} color="#FFFFFF" />
              </View>
              <View style={styles.securityCopy}>
                <Text style={styles.securityItemTitle}>Secure & Encrypted</Text>
                <Text style={styles.securityItemBody}>Your transaction data is protected with bank-grade security protocols.</Text>
              </View>
            </View>
            <View style={styles.securityItem}>
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={rs(13)} color="#FFFFFF" />
              </View>
              <View style={styles.securityCopy}>
                <Text style={styles.securityItemTitle}>Offline-First Tech</Text>
                <Text style={styles.securityItemBody}>Verify payments even with weak internet connection in crowded markets.</Text>
              </View>
            </View>
          </View>
        </View>

        <LinearGradient colors={['#08765F', '#00604F']} style={styles.communityCard}>
          <View style={styles.faceRow}>
            {communityFaces.map((face, index) => (
              <View key={face.initials} style={[styles.faceBubble, { backgroundColor: face.color, marginLeft: index === 0 ? 0 : rs(-8) }]}>
                <Text style={styles.faceInitials}>{face.initials}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.communityTitle}>Join the community of trusted merchants today.</Text>
          <TouchableOpacity style={styles.communityButton} activeOpacity={0.86} onPress={() => openAuth('Register')}>
            <Text style={styles.communityButtonText}>Create Free Account</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <Ionicons name="shield-checkmark-outline" size={rs(16)} color={Colors.primary} />
            <Text style={styles.footerBrandText}>MboaTrust AI</Text>
          </View>
          <Text style={styles.footerText}>2026 MboaTrust AI. Empower your business.</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Privacy</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Terms</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openAuth('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6FBF7' },
  content: { paddingBottom: vs(32) },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(20),
    marginBottom: rs(24),
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  brandText: { fontSize: FontSize.md, fontWeight: FontWeight.extrabold, color: Colors.primary },
  langButton: { flexDirection: 'row', alignItems: 'center', gap: rs(5), paddingVertical: rs(6), paddingHorizontal: rs(8) },
  langText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#5D6F68' },
  heroImageWrap: {
    height: vs(430),
    marginHorizontal: rs(20),
    borderRadius: rs(28),
    overflow: 'visible',
    marginBottom: rs(76),
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: rs(28),
    backgroundColor: '#DDEBE6',
  },
  aiPill: {
    position: 'absolute',
    top: rs(48),
    right: rs(-10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    backgroundColor: '#027763',
    paddingHorizontal: rs(18),
    paddingVertical: rs(14),
    borderRadius: rs(22),
    shadowColor: '#003F34',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 5,
  },
  aiPillText: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  growthCard: {
    position: 'absolute',
    left: rs(-4),
    bottom: rs(-30),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(14),
    backgroundColor: '#FFFFFF',
    borderRadius: rs(18),
    paddingHorizontal: rs(18),
    paddingVertical: rs(16),
    minWidth: rs(218),
    shadowColor: '#0B1A14',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  growthIcon: { width: rs(44), height: rs(44), borderRadius: rs(22), backgroundColor: '#FFC857', alignItems: 'center', justifyContent: 'center' },
  growthLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#7B8A84', letterSpacing: 0.5 },
  growthValue: { fontSize: FontSize.md, fontWeight: FontWeight.extrabold, color: '#101A17', marginTop: rs(3) },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(7),
    alignSelf: 'stretch',
    marginHorizontal: rs(20),
    backgroundColor: '#DCEFE8',
    borderRadius: Radius.full,
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
    marginBottom: rs(28),
  },
  trustBadgeText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  heroCopy: { paddingHorizontal: rs(20), marginBottom: rs(28) },
  heroTitle: { fontSize: ms(44), lineHeight: ms(48), fontWeight: FontWeight.extrabold, color: '#101A17' },
  heroTitleAccent: { color: Colors.primary },
  heroBody: { marginTop: rs(18), fontSize: FontSize.md, lineHeight: ms(25), color: '#6D7B75' },
  actions: { paddingHorizontal: rs(20), gap: rs(12), marginBottom: rs(58) },
  primaryButton: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    shadowColor: '#00604F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 7,
  },
  primaryButtonBg: { minHeight: rs(58), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(10) },
  primaryButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  secondaryButton: { minHeight: rs(58), borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E4ECE7' },
  secondaryButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.extrabold, color: Colors.primary },
  merchantSection: { backgroundColor: '#EEF6F1', paddingTop: rs(56), paddingHorizontal: rs(20), paddingBottom: rs(54) },
  sectionTitleCenter: { textAlign: 'center', fontSize: FontSize.xxl, lineHeight: ms(30), fontWeight: FontWeight.extrabold, color: '#101A17', paddingHorizontal: rs(28) },
  sectionIntro: { marginTop: rs(12), textAlign: 'center', fontSize: FontSize.base, lineHeight: ms(22), color: '#71817A', paddingHorizontal: rs(16) },
  featuresList: { marginTop: rs(36), gap: rs(14) },
  featureCard: { backgroundColor: '#FFFFFF', borderRadius: rs(24), padding: rs(26), gap: rs(20) },
  featureIcon: { width: rs(56), height: rs(56), borderRadius: rs(14), alignItems: 'center', justifyContent: 'center' },
  featureCopy: { gap: rs(12) },
  featureTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: '#101A17' },
  featureBody: { fontSize: FontSize.base, lineHeight: ms(23), color: '#75837E' },
  securitySection: { paddingHorizontal: rs(20), paddingTop: rs(58), paddingBottom: rs(34) },
  securityTitle: { fontSize: ms(34), lineHeight: ms(39), fontWeight: FontWeight.extrabold, color: '#101A17', marginBottom: rs(28) },
  securityItems: { gap: rs(20) },
  securityItem: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(14) },
  checkIcon: { width: rs(24), height: rs(24), borderRadius: rs(12), backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: rs(2) },
  securityCopy: { flex: 1 },
  securityItemTitle: { fontSize: FontSize.md, fontWeight: FontWeight.extrabold, color: '#101A17', marginBottom: rs(4) },
  securityItemBody: { fontSize: FontSize.base, lineHeight: ms(22), color: '#72817B' },
  communityCard: { marginHorizontal: rs(20), borderRadius: rs(28), padding: rs(30), marginBottom: rs(44), minHeight: rs(240), justifyContent: 'center' },
  faceRow: { flexDirection: 'row', marginBottom: rs(18) },
  faceBubble: { width: rs(42), height: rs(42), borderRadius: rs(21), alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#00604F' },
  faceInitials: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: Colors.primary },
  communityTitle: { color: '#FFFFFF', fontSize: FontSize.xxl, lineHeight: ms(31), fontWeight: FontWeight.extrabold, maxWidth: rs(260), marginBottom: rs(24) },
  communityButton: { backgroundColor: '#FFFFFF', borderRadius: Radius.full, minHeight: rs(52), alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(18), alignSelf: 'stretch' },
  communityButtonText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.extrabold },
  footer: { backgroundColor: '#E8F1EC', alignItems: 'center', paddingTop: rs(30), paddingBottom: rs(34), paddingHorizontal: rs(20) },
  footerBrand: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(10) },
  footerBrandText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.extrabold },
  footerText: { fontSize: FontSize.sm, color: '#708078', textAlign: 'center', marginBottom: rs(12) },
  footerLinks: { flexDirection: 'row', gap: rs(28) },
  footerLink: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: '#708078' },
});

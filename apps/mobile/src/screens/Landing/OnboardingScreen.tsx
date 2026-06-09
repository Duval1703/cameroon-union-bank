import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { TrustScoreRing } from '../../components/common/TrustScoreRing';
import { AnimatedPressable } from '../../components/common/AnimatedPressable';
import { Colors } from '../../constants/Colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/Theme';
import { rs, vs, ms, SCREEN_W } from '../../utils/responsive';

const slides = [
  {
    key: 'trust',
    gradient: ['#00172F', '#002853', '#133E72'] as const,
    icon: 'finger-print-outline' as const,
    badge: 'Made for Cameroon',
    title: 'Create Your\nFinancial ID',
    subtitle: 'CUB combines KYC, mobile money history, and AI scoring into one trusted borrower profile.',
    chips: ['KYC Ready', 'AI Scored', 'Mobile Money'],
    score: 74,
    scoreLabel: 'CUB Score',
    metric: '740',
    metricLabel: 'Credit Profile',
  },
  {
    key: 'records',
    gradient: ['#133E72', '#1F5D9A', '#002853'] as const,
    icon: 'swap-horizontal-outline' as const,
    badge: 'Community lending',
    title: 'Access P2P\nLoans',
    subtitle: 'Discover offers, negotiate terms, and keep every loan request transparent from application to funding.',
    chips: ['Loan Offers', 'Negotiation', 'Fair Terms'],
    score: 82,
    scoreLabel: 'Match Rate',
    metric: '3',
    metricLabel: 'Open Offers',
  },
  {
    key: 'verify',
    gradient: ['#735C00', '#A88710', '#002853'] as const,
    icon: 'calendar-outline' as const,
    badge: 'Repayment clarity',
    title: 'Repay With\nConfidence',
    subtitle: 'Track instalments, pay through MTN or Orange Money, and improve your CUB score after every repayment.',
    chips: ['Schedules', 'MoMo Pay', 'Score Growth'],
    score: 96,
    scoreLabel: 'On Time',
    metric: '+18',
    metricLabel: 'Score Boost',
  },
];

export const OnboardingScreen = () => {
  const navigation = useNavigation<any>();
  const [current, setCurrent] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const dotAnim = useRef(slides.map(() => new Animated.Value(0))).current;

  const animateDot = (idx: number) => {
    slides.forEach((_, i) => {
      Animated.timing(dotAnim[i], { toValue: i === idx ? 1 : 0, duration: 250, useNativeDriver: false }).start();
    });
  };

  const next = () => {
    if (current < slides.length - 1) {
      const n = current + 1;
      flatRef.current?.scrollToIndex({ index: n, animated: true });
      setCurrent(n);
      animateDot(n);
    } else {
      navigation.getParent()?.replace('Auth');
    }
  };

  React.useEffect(() => { animateDot(0); }, []);

  const renderSlide = ({ item }: { item: typeof slides[0] }) => (
    <View style={{ width: SCREEN_W }}>
      <LinearGradient colors={item.gradient} style={styles.slideHero}>
        {/* Glass pattern overlay */}
        <View style={styles.heroOrb1} />
        <View style={styles.heroOrb2} />

        {/* Badge */}
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{item.badge}</Text>
        </View>

        {/* Score visual */}
        <View style={styles.scoreVisual}>
          <View style={styles.scoreRingCard}>
            <TrustScoreRing score={item.score} size={rs(130)} strokeWidth={rs(9)} showLabel />
            <Text style={styles.scoreRingLabel}>{item.scoreLabel}</Text>
          </View>
          {/* Floating metric */}
          <View style={styles.floatingMetric}>
            <Text style={styles.metricValue}>{item.metric}</Text>
            <Text style={styles.metricLabel}>{item.metricLabel}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.slideContent}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>

        {/* Feature chips */}
        <View style={styles.chipsRow}>
          {item.chips.map((c, i) => (
            <View key={i} style={styles.chip}>
              <Ionicons name="checkmark-circle" size={rs(13)} color={Colors.primary} />
              <Text style={styles.chipText}>{c}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const slide = slides[current];

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* Skip button */}
      <TouchableOpacity style={styles.skip} onPress={() => navigation.getParent()?.replace('Auth')}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatRef}
        data={slides}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={i => i.key}
        renderItem={renderSlide}
      />

      {/* Bottom controls */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((_, i) => {
            const width = dotAnim[i].interpolate({ inputRange: [0, 1], outputRange: [rs(7), rs(24)] });
            const bg    = dotAnim[i].interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,40,83,0.25)', '#002853'] });
            return <Animated.View key={i} style={[styles.dot, { width, backgroundColor: bg }]} />;
          })}
        </View>

        {/* CTA */}
        <AnimatedPressable onPress={next} style={styles.cta}>
          <LinearGradient colors={['#002853', '#133E72']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
            <Text style={styles.ctaText}>
              {current === slides.length - 1 ? 'Get Started' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={rs(18)} color="#fff" />
          </LinearGradient>
        </AnimatedPressable>

        <Text style={styles.disclaimer}>
          Cameroon Union Bank · Bank-grade security · Built for inclusive credit
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  skip: { position: 'absolute', top: vs(52), right: rs(20), zIndex: 10, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: rs(14), paddingVertical: rs(6), borderRadius: rs(20) },
  skipText: { fontSize: ms(13), color: '#fff', fontWeight: '600' },

  slideHero: { height: vs(380), alignItems: 'center', justifyContent: 'flex-end', paddingBottom: vs(28), paddingHorizontal: rs(20), overflow: 'hidden' },
  heroOrb1: { position: 'absolute', width: rs(280), height: rs(280), borderRadius: rs(140), backgroundColor: 'rgba(255,255,255,0.07)', top: vs(-40), right: rs(-80) },
  heroOrb2: { position: 'absolute', width: rs(200), height: rs(200), borderRadius: rs(100), backgroundColor: 'rgba(0,0,0,0.1)', bottom: vs(-60), left: rs(-40) },

  heroBadge: { position: 'absolute', top: vs(54), backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: rs(14), paddingVertical: rs(6), borderRadius: rs(20), borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  heroBadgeText: { fontSize: ms(12), color: '#fff', fontWeight: '600', letterSpacing: 0.3 },

  scoreVisual: { flexDirection: 'row', alignItems: 'center', gap: rs(16) },
  scoreRingCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: rs(24), padding: rs(16), alignItems: 'center', gap: rs(6), borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  scoreRingLabel: { fontSize: ms(11), color: 'rgba(255,255,255,0.8)', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },

  floatingMetric: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: rs(18), padding: rs(16), alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', gap: rs(4) },
  metricValue: { fontSize: ms(28), fontWeight: '800', color: '#F5A623' },
  metricLabel: { fontSize: ms(11), color: 'rgba(255,255,255,0.75)', fontWeight: '600', textAlign: 'center' },

  slideContent: { paddingHorizontal: rs(24), paddingTop: vs(24), gap: rs(12) },
  slideTitle: { fontSize: ms(28), fontWeight: '800', color: '#181C1E', lineHeight: ms(34), letterSpacing: 0 },
  slideSubtitle: { fontSize: ms(15), color: '#4B5563', lineHeight: ms(22) },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8), marginTop: rs(4) },
  chip: { flexDirection: 'row', alignItems: 'center', gap: rs(5), backgroundColor: '#DCE7F3', paddingHorizontal: rs(10), paddingVertical: rs(6), borderRadius: rs(20) },
  chipText: { fontSize: ms(12), color: Colors.primary, fontWeight: '600' },

  bottom: { paddingHorizontal: rs(24), paddingBottom: vs(40), gap: rs(16) },
  dots: { flexDirection: 'row', gap: rs(6), justifyContent: 'center' },
  dot: { height: rs(7), borderRadius: rs(4) },

  cta: { borderRadius: rs(16), overflow: 'hidden' },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(10), paddingVertical: rs(17) },
  ctaText: { fontSize: ms(17), fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  disclaimer: { fontSize: ms(12), color: '#5A7FA8', textAlign: 'center' },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';

const faqs = [
  { q: 'How does AI fraud detection work?',         a: 'Our AI analyzes the phone number, payment amount, and historical patterns from thousands of transactions to assign a real-time trust score.' },
  { q: 'Does CUB work without internet?',           a: 'Yes. Your records are stored locally where supported. When you reconnect, the app syncs automatically. Verification requires internet.' },
  { q: 'How is my data protected?',                 a: 'All data is encrypted with 256-bit AES. We never sell your data. Your PIN is hashed and never stored in plain text.' },
  { q: 'Can I export my business records?',        a: 'Yes, go to Statistics > Financial Summary and tap the Share button to export a PDF or CSV report.' },
  { q: 'What payment networks are supported?',     a: 'MTN MoMo, Orange Money, Express Union, and cash transactions. More networks coming soon.' },
];

export const HelpScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<number|null>(null);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#00172F','#002853','#002853']} style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & FAQ</Text>
          <View style={{ width: rs(36) }} />
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={rs(16)} color="#9CA3AF" />
          <Text style={styles.searchPlaceholder}>Search for help...</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Contact options */}
        <View style={styles.contactRow}>
          {[
            { icon: 'chatbubble-outline', label: 'Chat', color: '#059669' },
            { icon: 'call-outline',       label: 'Call',  color: '#2563EB' },
            { icon: 'mail-outline',       label: 'Email', color: '#7C3AED' },
          ].map((c, i) => (
            <TouchableOpacity key={i} style={styles.contactCard} activeOpacity={0.8}>
              <View style={[styles.contactIcon, { backgroundColor: `${c.color}15` }]}>
                <Ionicons name={c.icon as any} size={rs(20)} color={c.color} />
              </View>
              <Text style={styles.contactLabel}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
        {faqs.map((f, i) => (
          <TouchableOpacity key={i} style={styles.faqCard} onPress={() => setExpanded(expanded === i ? null : i)} activeOpacity={0.8}>
            <View style={styles.faqQ}>
              <Text style={styles.faqQuestion}>{f.q}</Text>
              <Ionicons name={expanded === i ? 'chevron-up' : 'chevron-down'} size={rs(16)} color="#9CA3AF" />
            </View>
            {expanded === i && <Text style={styles.faqAnswer}>{f.a}</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  header: { paddingHorizontal: rs(20), paddingBottom: rs(20), gap: rs(12) },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: rs(8), backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.xl, paddingHorizontal: rs(14), paddingVertical: rs(10), borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  searchPlaceholder: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.4)' },
  content: { padding: rs(16), gap: rs(14), paddingBottom: vs(40) },
  contactRow: { flexDirection: 'row', gap: rs(10) },
  contactCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(14), alignItems: 'center', gap: rs(6), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  contactIcon: { width: rs(44), height: rs(44), borderRadius: rs(22), alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: '#374151' },
  faqTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#374151' },
  faqCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(16), gap: rs(10), shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  faqQ: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: rs(8) },
  faqQuestion: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: '#111827' },
  faqAnswer: { fontSize: FontSize.sm, color: '#6B7280', lineHeight: ms(14) * 1.6 },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';

export const PrivacyConsentScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [agreed, setAgreed] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const handleContinue = () => {
    if (!agreed) return;
    navigation.getParent()?.replace('Main');
  };

  const consents = [
    { id: 'main', label: 'I agree to Terms of Service & Privacy Policy', required: true, value: agreed, set: setAgreed },
    { id: 'mkt',  label: 'Receive business tips and product updates (optional)', required: false, value: marketing, set: setMarketing },
  ];

  const perms = [
    { icon: 'camera-outline',   label: 'Camera',        sub: 'For payment QR scanning' },
    { icon: 'wifi-outline',     label: 'Network',       sub: 'For AI verification' },
    { icon: 'save-outline',     label: 'Storage',       sub: 'For offline data' },
    { icon: 'notifications-outline', label: 'Notifications', sub: 'For fraud alerts' },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#061E14','#0D4A35','#1B5E4B']} style={[styles.hero, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.orb} />
        <View style={styles.shieldWrap}>
          <View style={styles.shieldIcon}>
            <Ionicons name="shield-checkmark" size={rs(36)} color="#fff" />
          </View>
        </View>
        <Text style={styles.heroTitle}>Privacy & Permissions</Text>
        <Text style={styles.heroSub}>We protect your data. Here is what we need.</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(40) }}>
        {/* Permissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Permissions</Text>
          <View style={styles.card}>
            {perms.map((p, i) => (
              <View key={i} style={[styles.permRow, i < perms.length - 1 && styles.permDiv]}>
                <View style={styles.permIcon}>
                  <Ionicons name={p.icon as any} size={rs(18)} color="#1B5E4B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.permLabel}>{p.label}</Text>
                  <Text style={styles.permSub}>{p.sub}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={rs(20)} color="#059669" />
              </View>
            ))}
          </View>
        </View>

        {/* Consents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Consents</Text>
          {consents.map(c => (
            <TouchableOpacity key={c.id} style={styles.consentRow} onPress={() => c.set((v: boolean) => !v)} activeOpacity={0.8}>
              <View style={[styles.checkbox, c.value && styles.checkboxChecked]}>
                {c.value && <Ionicons name="checkmark" size={rs(14)} color="#fff" />}
              </View>
              <Text style={styles.consentLabel}>
                {c.label}
                {c.required && <Text style={{ color: '#DC2626' }}> *</Text>}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.proceedBtn, !agreed && { opacity: 0.5 }]}
            onPress={handleContinue}
            disabled={!agreed}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#065F46','#059669']} style={styles.proceedBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="checkmark-circle-outline" size={rs(20)} color="#fff" />
              <Text style={styles.proceedBtnText}>Accept & Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.disclaimer}>
            Your data is encrypted and never sold to third parties.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F4F2' },
  hero: { paddingHorizontal: rs(20), paddingBottom: rs(24), overflow: 'hidden', alignItems: 'center', gap: rs(10) },
  orb: { position: 'absolute', top: rs(-40), right: rs(-40), width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.06)' },
  shieldWrap: { marginBottom: rs(8) },
  shieldIcon: { width: rs(72), height: rs(72), borderRadius: rs(36), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: ms(22), fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  heroSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)', textAlign: 'center' },
  section: { padding: rs(16), gap: rs(10) },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#374151' },
  card: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12), padding: rs(14) },
  permDiv: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  permIcon: { width: rs(36), height: rs(36), borderRadius: rs(10), backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  permLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: '#111827' },
  permSub: { fontSize: FontSize.xs, color: '#9CA3AF', marginTop: rs(2) },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(12), backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(16), shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  checkbox: { width: rs(22), height: rs(22), borderRadius: rs(6), borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxChecked: { backgroundColor: '#059669', borderColor: '#059669' },
  consentLabel: { flex: 1, fontSize: FontSize.base, color: '#374151', lineHeight: ms(14) * 1.5 },
  actions: { paddingHorizontal: rs(16), gap: rs(12), paddingBottom: vs(20) },
  proceedBtn: { borderRadius: Radius.full, overflow: 'hidden', shadowColor: '#059669', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  proceedBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: rs(15), gap: rs(8) },
  proceedBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  disclaimer: { fontSize: FontSize.xs, color: '#9CA3AF', textAlign: 'center' },
});

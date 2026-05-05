import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); navigation.navigate('OTPVerify'); }, 1500);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <LinearGradient colors={['#061E14','#0D4A35','#1B5E4B']} style={[styles.hero, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.orb} />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
        </TouchableOpacity>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-open-outline" size={rs(36)} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>Forgot PIN?</Text>
        <Text style={styles.heroSub}>Enter your phone number to receive a reset code</Text>
      </LinearGradient>

      <View style={styles.card}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
          <View style={styles.inputRow}>
            <View style={styles.flagChip}><Text style={styles.flagText}>🇨🇲 +237</Text></View>
            <TextInput style={styles.input} placeholder="6XX XXX XXX" value={phone} onChangeText={setPhone} placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
          </View>
        </View>

        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.75 }]} onPress={handleSend} disabled={loading} activeOpacity={0.85}>
          <LinearGradient colors={['#065F46','#059669']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name={loading ? 'hourglass-outline' : 'send-outline'} size={rs(18)} color="#fff" />
            <Text style={styles.btnText}>{loading ? 'Sending...' : 'Send Reset Code'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLinkRow} activeOpacity={0.8}>
          <Text style={styles.backLinkText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F4F2' },
  hero: { paddingHorizontal: rs(20), paddingBottom: rs(28), overflow: 'hidden', alignItems: 'center', gap: rs(10) },
  orb: { position: 'absolute', top: rs(-40), right: rs(-40), width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.06)' },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', marginBottom: rs(8) },
  iconWrap: { width: rs(72), height: rs(72), borderRadius: rs(36), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: ms(24), fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  heroSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)', textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', margin: rs(16), borderRadius: Radius.xl, padding: rs(20), gap: rs(18), shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6, marginTop: rs(-20) },
  field: { gap: rs(8) },
  fieldLabel: { fontSize: FontSize.xs, color: '#6B7280', letterSpacing: 0.8, fontWeight: FontWeight.semibold },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: Radius.lg, paddingHorizontal: rs(14), paddingVertical: rs(12), borderWidth: 1.5, borderColor: '#E5E7EB' },
  input: { flex: 1, fontSize: FontSize.base, color: '#111827' },
  flagChip: { paddingRight: rs(10), marginRight: rs(4), borderRightWidth: 1, borderRightColor: '#E5E7EB' },
  flagText: { fontSize: FontSize.base, color: '#374151', fontWeight: FontWeight.medium },
  btn: { borderRadius: Radius.full, overflow: 'hidden', shadowColor: '#059669', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  btnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: rs(15), gap: rs(8) },
  btnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  backLinkRow: { alignItems: 'center' },
  backLinkText: { fontSize: FontSize.base, color: '#1B5E4B', fontWeight: FontWeight.bold },
});

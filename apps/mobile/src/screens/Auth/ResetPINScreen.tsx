import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';

const PIN_LENGTH = 4;

export const ResetPINScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState<'new'|'confirm'>('new');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    if (pin !== confirm) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); navigation.navigate('Login'); }, 1500);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#061E14','#0D4A35','#1B5E4B']} style={[styles.hero, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.orb} />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
        </TouchableOpacity>
        <View style={styles.iconWrap}>
          <Ionicons name="key-outline" size={rs(36)} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>Set New PIN</Text>
        <Text style={styles.heroSub}>Choose a secure 4-digit PIN for your account</Text>
      </LinearGradient>

      <View style={styles.card}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>NEW PIN</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
            <TextInput style={styles.input} placeholder="••••" value={pin} onChangeText={t => setPin(t.slice(0,4))} placeholderTextColor="#9CA3AF" keyboardType="numeric" secureTextEntry={!showPin} maxLength={4} />
            <TouchableOpacity onPress={() => setShowPin(s => !s)}>
              <Ionicons name={showPin ? 'eye-off-outline' : 'eye-outline'} size={rs(18)} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>CONFIRM PIN</Text>
          <View style={[styles.inputRow, confirm && pin && confirm !== pin && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
            <TextInput style={styles.input} placeholder="••••" value={confirm} onChangeText={t => setConfirm(t.slice(0,4))} placeholderTextColor="#9CA3AF" keyboardType="numeric" secureTextEntry maxLength={4} />
          </View>
          {confirm && pin && confirm !== pin && (
            <Text style={styles.errorText}>PINs do not match</Text>
          )}
        </View>

        {/* Strength */}
        {pin.length > 0 && (
          <View style={styles.strengthRow}>
            {['Weak','Fair','Strong','Very Strong'].map((l, i) => (
              <View key={i} style={[styles.strengthBar, { backgroundColor: i < pin.length ? '#059669' : '#E5E7EB' }]} />
            ))}
            <Text style={styles.strengthLabel}>{['Weak','Fair','Strong','Very Strong'][pin.length - 1] || ''}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btn, (!pin || !confirm || pin !== confirm || loading) && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={!pin || !confirm || pin !== confirm || loading}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#065F46','#059669']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name={loading ? 'hourglass-outline' : 'save-outline'} size={rs(18)} color="#fff" />
            <Text style={styles.btnText}>{loading ? 'Saving...' : 'Save New PIN'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
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
  field: { gap: rs(6) },
  fieldLabel: { fontSize: FontSize.xs, color: '#6B7280', letterSpacing: 0.8, fontWeight: FontWeight.semibold },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: Radius.lg, paddingHorizontal: rs(14), paddingVertical: rs(12), borderWidth: 1.5, borderColor: '#E5E7EB' },
  inputError: { borderColor: '#DC2626' },
  input: { flex: 1, fontSize: FontSize.base, color: '#111827' },
  errorText: { fontSize: FontSize.xs, color: '#DC2626' },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  strengthBar: { flex: 1, height: rs(4), borderRadius: rs(2) },
  strengthLabel: { fontSize: FontSize.xs, color: '#059669', fontWeight: FontWeight.semibold, marginLeft: rs(4) },
  btn: { borderRadius: Radius.full, overflow: 'hidden', shadowColor: '#059669', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  btnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: rs(15), gap: rs(8) },
  btnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#FFFFFF' },
});

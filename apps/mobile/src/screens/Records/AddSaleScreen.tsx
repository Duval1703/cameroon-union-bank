import React, { useState, useRef, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { createSaleRecord } from '../../services/api';
import { getAuthToken } from '../../services/storage';

const keys = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];

export const AddSaleScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash'|'mobile'>('cash');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const amountAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(amountAnim, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 6 }),
    ]).start();
  }, []);

  const handleKey = (k: string) => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.94, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 8 }),
    ]).start();
    if (k === '⌫') { setAmount(a => a.slice(0, -1)); return; }
    if (k === '.' && amount.includes('.')) return;
    if (amount === '0' && k !== '.') { setAmount(k); return; }
    setAmount(a => a + k);
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Amount required', 'Enter a valid sale amount before saving.');
      return;
    }

    setLoading(true);
    const token = await getAuthToken();
    if (!token) {
      setLoading(false);
      Alert.alert('Session expired', 'Please sign in again.');
      return;
    }

    const result = await createSaleRecord(token, {
      amount: parsedAmount,
      payment_method: method,
      item_note: note || undefined,
      category: note ? 'Manual sale' : 'General',
    });
    setLoading(false);

    if (!result.success) {
      Alert.alert('Sale not saved', result.error || 'Could not save this sale.');
      return;
    }

    navigation.navigate('RecordSuccess', { type: 'sale', amount: parsedAmount });
  };

  const displayAmount = amount ? parseFloat(amount).toLocaleString() : '0';

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* Gradient header */}
      <LinearGradient
        colors={['#002853', '#133E72', '#F0D980']}
        style={[styles.header, { paddingTop: insets.top + rs(10) }]}
      >
        <View style={styles.orb} />
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Sale</Text>
          <View style={styles.headerRight}>
            <Ionicons name="shield-checkmark-outline" size={rs(18)} color="rgba(255,255,255,0.7)" />
            <Ionicons name="wifi" size={rs(18)} color="rgba(255,255,255,0.7)" />
          </View>
        </View>

        {/* Amount display */}
        <Animated.View style={[styles.amountWrap, { transform: [{ scale: amountAnim }], opacity: fadeAnim }]}>
          <Text style={styles.amountLabel}>SALE AMOUNT</Text>
          <Animated.View style={[styles.amountRow, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.currency}>FCFA</Text>
            <Text style={styles.amountText} numberOfLines={1} adjustsFontSizeToFit>{displayAmount}</Text>
          </Animated.View>
          <View style={styles.aiChip}>
            <Ionicons name="sparkles" size={rs(11)} color="#F5A623" />
            <Text style={styles.aiChipText}>AI predicting — Grocery category</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Payment method */}
        <View style={styles.methodSection}>
          {[
            { key: 'cash',   label: 'Cash',         icon: 'cash-outline' },
            { key: 'mobile', label: 'Mobile Money',  icon: 'phone-portrait-outline' },
          ].map(m => (
            <TouchableOpacity
              key={m.key}
              style={[styles.methodBtn, method === m.key && styles.methodBtnActive]}
              onPress={() => setMethod(m.key as any)}
              activeOpacity={0.8}
            >
              {method === m.key && (
                <LinearGradient colors={['#002853','#133E72']} style={[StyleSheet.absoluteFillObject, { borderRadius: Radius.lg }]} />
              )}
              <Ionicons name={m.icon as any} size={rs(16)} color={method === m.key ? '#fff' : '#6B7280'} />
              <Text style={[styles.methodLabel, method === m.key && styles.methodLabelActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Meta chips */}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={rs(13)} color="#059669" />
            <Text style={styles.metaText}>Just now</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="person-add-outline" size={rs(13)} color="#059669" />
            <Text style={styles.metaText}>No customer</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="pricetag-outline" size={rs(13)} color="#059669" />
            <Text style={styles.metaText}>Grocery</Text>
          </View>
        </View>

        {/* Note input */}
        <View style={styles.noteSection}>
          <Text style={styles.noteLabel}>ITEM NOTE</Text>
          <View style={styles.noteInput}>
            <Ionicons name="create-outline" size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
            <TextInput
              style={styles.noteText}
              placeholder="What was sold? (e.g. 5kg Rice)"
              value={note}
              onChangeText={setNote}
              placeholderTextColor="#9CA3AF"
              multiline
            />
          </View>
        </View>

        {/* Numpad */}
        <View style={styles.numpad}>
          {keys.map(k => (
            <TouchableOpacity
              key={k}
              style={[styles.key, k === '⌫' && styles.keyDel]}
              onPress={() => handleKey(k)}
              activeOpacity={0.7}
            >
              {k === '⌫'
                ? <Ionicons name="backspace-outline" size={rs(22)} color="#DC2626" />
                : <Text style={styles.keyText}>{k}</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Save button */}
        <View style={styles.saveSection}>
          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.75 }]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#002853','#133E72','#F0D980']} style={styles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name={loading ? 'hourglass-outline' : 'checkmark-circle-outline'} size={rs(20)} color="#fff" />
              <Text style={styles.saveBtnText}>{loading ? 'Saving Sale...' : 'Save Sale'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },

  // Header
  header: { paddingHorizontal: rs(20), paddingBottom: rs(24), overflow: 'hidden' },
  orb: { position: 'absolute', top: rs(-40), right: rs(-40), width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.08)' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(18) },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  headerRight: { flexDirection: 'row', gap: rs(10) },

  // Amount
  amountWrap: { alignItems: 'center', gap: rs(8), paddingBottom: rs(4) },
  amountLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.2, fontWeight: FontWeight.semibold },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: rs(8) },
  currency: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.8)', paddingBottom: rs(6) },
  amountText: { fontSize: ms(48), fontWeight: FontWeight.extrabold, color: '#FFFFFF', maxWidth: rs(260) },
  aiChip: { flexDirection: 'row', alignItems: 'center', gap: rs(5), backgroundColor: 'rgba(245,166,35,0.25)', paddingHorizontal: rs(12), paddingVertical: rs(5), borderRadius: Radius.full },
  aiChipText: { fontSize: FontSize.xs, color: '#F5A623', fontWeight: FontWeight.semibold },

  // Method
  methodSection: { flexDirection: 'row', marginHorizontal: rs(16), marginTop: rs(16), gap: rs(10) },
  methodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6), paddingVertical: rs(12), borderRadius: Radius.lg, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E5E7EB', overflow: 'hidden' },
  methodBtnActive: { borderColor: '#059669' },
  methodLabel: { fontSize: FontSize.base, color: '#6B7280', fontWeight: FontWeight.semibold },
  methodLabelActive: { color: '#FFFFFF' },

  // Meta
  metaRow: { flexDirection: 'row', gap: rs(8), paddingHorizontal: rs(16), marginTop: rs(12) },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: rs(5), backgroundColor: '#ECFDF5', paddingHorizontal: rs(10), paddingVertical: rs(6), borderRadius: Radius.full },
  metaText: { fontSize: FontSize.xs, color: '#002853', fontWeight: FontWeight.semibold },

  // Note
  noteSection: { paddingHorizontal: rs(16), marginTop: rs(14) },
  noteLabel: { fontSize: FontSize.xs, color: '#6B7280', letterSpacing: 0.8, fontWeight: FontWeight.semibold, marginBottom: rs(8) },
  noteInput: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: Radius.lg, paddingHorizontal: rs(14), paddingVertical: rs(12), borderWidth: 1.5, borderColor: '#E5E7EB' },
  noteText: { flex: 1, fontSize: FontSize.base, color: '#111827', paddingTop: 0 },

  // Numpad
  numpad: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: rs(16), marginTop: rs(16), gap: rs(10) },
  key: { width: '30%', aspectRatio: 1.7, backgroundColor: '#FFFFFF', borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  keyDel: { backgroundColor: '#FEF2F2' },
  keyText: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: '#111827' },

  // Save
  saveSection: { paddingHorizontal: rs(16), paddingVertical: rs(16), paddingBottom: vs(32) },
  saveBtn: { borderRadius: Radius.full, overflow: 'hidden', shadowColor: '#059669', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: rs(16), gap: rs(8) },
  saveBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#FFFFFF' },
});

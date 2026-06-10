import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { createExpenseRecord } from '../../services/api';
import { getAuthToken } from '../../services/storage';

const keys = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];

const expenseCategories = [
  { label: 'Supplies',  icon: 'cube-outline',       color: '#2563EB' },
  { label: 'Rent',      icon: 'home-outline',        color: '#7C3AED' },
  { label: 'Salary',    icon: 'people-outline',      color: '#D97706' },
  { label: 'Transport', icon: 'car-outline',         color: '#059669' },
  { label: 'Other',     icon: 'ellipsis-horizontal', color: '#6B7280' },
];

export const AddExpenseScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Supplies');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKey = (k: string) => {
    if (k === '⌫') { setAmount(a => a.slice(0, -1)); return; }
    if (k === '.' && amount.includes('.')) return;
    if (amount === '0' && k !== '.') { setAmount(k); return; }
    setAmount(a => a + k);
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Amount required', 'Enter a valid expense amount before saving.');
      return;
    }

    setLoading(true);
    const token = await getAuthToken();
    if (!token) {
      setLoading(false);
      Alert.alert('Session expired', 'Please sign in again.');
      return;
    }

    const result = await createExpenseRecord(token, {
      amount: parsedAmount,
      category,
      note: note || undefined,
      payment_method: 'cash',
    });
    setLoading(false);

    if (!result.success) {
      Alert.alert('Expense not saved', result.error || 'Could not save this expense.');
      return;
    }

    navigation.navigate('RecordSuccess', { type: 'expense', amount: parsedAmount });
  };

  const displayAmount = amount ? parseFloat(amount).toLocaleString() : '0';

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#7F1D1D', '#DC2626', '#EF4444']}
        style={[styles.header, { paddingTop: insets.top + rs(10) }]}
      >
        <View style={styles.orb} />
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <View style={styles.headerRight}>
            <Ionicons name="shield-checkmark-outline" size={rs(18)} color="rgba(255,255,255,0.7)" />
          </View>
        </View>
        <View style={styles.amountWrap}>
          <Text style={styles.amountLabel}>EXPENSE AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>FCFA</Text>
            <Text style={styles.amountText} adjustsFontSizeToFit numberOfLines={1}>{displayAmount}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Category */}
        <View style={styles.catSection}>
          <Text style={styles.catLabel}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {expenseCategories.map(c => (
              <TouchableOpacity
                key={c.label}
                style={[styles.catChip, category === c.label && { borderColor: c.color, backgroundColor: `${c.color}12` }]}
                onPress={() => setCategory(c.label)}
                activeOpacity={0.8}
              >
                <Ionicons name={c.icon as any} size={rs(14)} color={category === c.label ? c.color : '#9CA3AF'} />
                <Text style={[styles.catChipText, category === c.label && { color: c.color, fontWeight: FontWeight.bold }]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Note */}
        <View style={styles.noteSection}>
          <Text style={styles.noteLabel}>NOTE</Text>
          <View style={styles.noteInput}>
            <Ionicons name="create-outline" size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
            <TextInput
              style={styles.noteText}
              placeholder="What was the expense for?"
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
            <TouchableOpacity key={k} style={[styles.key, k === '⌫' && styles.keyDel]} onPress={() => handleKey(k)} activeOpacity={0.7}>
              {k === '⌫'
                ? <Ionicons name="backspace-outline" size={rs(22)} color="#DC2626" />
                : <Text style={styles.keyText}>{k}</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Save */}
        <View style={styles.saveSection}>
          <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.75 }]} onPress={handleSave} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={['#7F1D1D','#DC2626','#EF4444']} style={styles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name={loading ? 'hourglass-outline' : 'checkmark-circle-outline'} size={rs(20)} color="#fff" />
              <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Expense'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  header: { paddingHorizontal: rs(20), paddingBottom: rs(24), overflow: 'hidden' },
  orb: { position: 'absolute', top: rs(-40), right: rs(-40), width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.08)' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(18) },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  headerRight: { flexDirection: 'row', gap: rs(10) },
  amountWrap: { alignItems: 'center', gap: rs(8), paddingBottom: rs(4) },
  amountLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.2, fontWeight: FontWeight.semibold },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: rs(8) },
  currency: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.8)', paddingBottom: rs(6) },
  amountText: { fontSize: ms(48), fontWeight: FontWeight.extrabold, color: '#FFFFFF', maxWidth: rs(260) },
  catSection: { paddingTop: rs(16), paddingHorizontal: rs(16) },
  catLabel: { fontSize: FontSize.xs, color: '#6B7280', letterSpacing: 0.8, fontWeight: FontWeight.semibold, marginBottom: rs(10) },
  catRow: { gap: rs(8), paddingRight: rs(16) },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: rs(5), paddingHorizontal: rs(12), paddingVertical: rs(8), borderRadius: Radius.full, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E5E7EB' },
  catChipText: { fontSize: FontSize.sm, color: '#9CA3AF', fontWeight: FontWeight.medium },
  noteSection: { paddingHorizontal: rs(16), marginTop: rs(14) },
  noteLabel: { fontSize: FontSize.xs, color: '#6B7280', letterSpacing: 0.8, fontWeight: FontWeight.semibold, marginBottom: rs(8) },
  noteInput: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: Radius.lg, paddingHorizontal: rs(14), paddingVertical: rs(12), borderWidth: 1.5, borderColor: '#E5E7EB' },
  noteText: { flex: 1, fontSize: FontSize.base, color: '#111827', paddingTop: 0 },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: rs(16), marginTop: rs(16), gap: rs(10) },
  key: { width: '30%', aspectRatio: 1.7, backgroundColor: '#FFFFFF', borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  keyDel: { backgroundColor: '#FEF2F2' },
  keyText: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: '#111827' },
  saveSection: { paddingHorizontal: rs(16), paddingVertical: rs(16), paddingBottom: vs(32) },
  saveBtn: { borderRadius: Radius.full, overflow: 'hidden', shadowColor: '#DC2626', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: rs(16), gap: rs(8) },
  saveBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#FFFFFF' },
});

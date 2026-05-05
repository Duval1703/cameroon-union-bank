import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { createStockRecord } from '../../services/api';
import { getAuthToken } from '../../services/storage';

const keys = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];

export const AddStockScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [qty, setQty] = useState('1');
  const [item, setItem] = useState('');
  const [supplier, setSupplier] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKey = (k: string) => {
    if (k === '⌫') { setAmount(a => a.slice(0, -1)); return; }
    if (k === '.' && amount.includes('.')) return;
    if (amount === '0' && k !== '.') { setAmount(k); return; }
    setAmount(a => a + k);
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    const parsedQty = parseFloat(qty);
    if (!item.trim()) {
      Alert.alert('Item required', 'Enter the stock item name before saving.');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Cost required', 'Enter a valid purchase cost before saving.');
      return;
    }

    setLoading(true);
    const token = await getAuthToken();
    if (!token) {
      setLoading(false);
      Alert.alert('Session expired', 'Please sign in again.');
      return;
    }

    const result = await createStockRecord(token, {
      item_name: item.trim(),
      supplier: supplier.trim() || undefined,
      quantity: parsedQty || 1,
      unit: 'unit',
      purchase_cost: parsedAmount,
    });
    setLoading(false);

    if (!result.success) {
      Alert.alert('Stock not saved', result.error || 'Could not save this stock entry.');
      return;
    }

    navigation.navigate('RecordSuccess', { type: 'stock', amount: parsedAmount });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#1E3A8A','#2563EB','#3B82F6']} style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.orb} />
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Stock</Text>
          <View style={{ width: rs(36) }} />
        </View>
        <View style={styles.amountWrap}>
          <Text style={styles.amountLabel}>PURCHASE COST</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>FCFA</Text>
            <Text style={styles.amountText} adjustsFontSizeToFit numberOfLines={1}>
              {amount ? parseFloat(amount).toLocaleString() : '0'}
            </Text>
          </View>
          <View style={styles.aiChip}>
            <Ionicons name="cube-outline" size={rs(11)} color="rgba(255,255,255,0.8)" />
            <Text style={styles.aiChipText}>Stock purchase entry</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Item & supplier */}
        <View style={styles.fieldsSection}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>ITEM NAME</Text>
            <View style={styles.fieldInput}>
              <Ionicons name="cube-outline" size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
              <TextInput style={styles.fieldText} placeholder="e.g. Rice 50kg bag" value={item} onChangeText={setItem} placeholderTextColor="#9CA3AF" />
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>SUPPLIER</Text>
            <View style={styles.fieldInput}>
              <Ionicons name="person-outline" size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
              <TextInput style={styles.fieldText} placeholder="Supplier name (optional)" value={supplier} onChangeText={setSupplier} placeholderTextColor="#9CA3AF" />
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>QUANTITY</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => String(Math.max(1, parseInt(q)-1)))}>
                <Ionicons name="remove" size={rs(18)} color="#2563EB" />
              </TouchableOpacity>
              <Text style={styles.qtyVal}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => String(parseInt(q)+1))}>
                <Ionicons name="add" size={rs(18)} color="#2563EB" />
              </TouchableOpacity>
            </View>
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

        <View style={styles.saveSection}>
          <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.75 }]} onPress={handleSave} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={['#1E3A8A','#2563EB']} style={styles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name={loading ? 'hourglass-outline' : 'checkmark-circle-outline'} size={rs(20)} color="#fff" />
              <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Stock Entry'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F4F2' },
  header: { paddingHorizontal: rs(20), paddingBottom: rs(24), overflow: 'hidden' },
  orb: { position: 'absolute', top: rs(-40), right: rs(-40), width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.08)' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(18) },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  amountWrap: { alignItems: 'center', gap: rs(8) },
  amountLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.2, fontWeight: FontWeight.semibold },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: rs(8) },
  currency: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.8)', paddingBottom: rs(6) },
  amountText: { fontSize: ms(48), fontWeight: FontWeight.extrabold, color: '#FFFFFF', maxWidth: rs(260) },
  aiChip: { flexDirection: 'row', alignItems: 'center', gap: rs(5), backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: rs(12), paddingVertical: rs(5), borderRadius: Radius.full },
  aiChipText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.9)', fontWeight: FontWeight.semibold },
  fieldsSection: { padding: rs(16), gap: rs(12) },
  field: { gap: rs(6) },
  fieldLabel: { fontSize: FontSize.xs, color: '#6B7280', letterSpacing: 0.8, fontWeight: FontWeight.semibold },
  fieldInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: Radius.lg, paddingHorizontal: rs(14), paddingVertical: rs(12), borderWidth: 1.5, borderColor: '#E5E7EB' },
  fieldText: { flex: 1, fontSize: FontSize.base, color: '#111827' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: rs(16), backgroundColor: '#FFFFFF', borderRadius: Radius.lg, paddingHorizontal: rs(14), paddingVertical: rs(8), borderWidth: 1.5, borderColor: '#E5E7EB', alignSelf: 'flex-start' },
  qtyBtn: { width: rs(32), height: rs(32), borderRadius: rs(16), backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  qtyVal: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: '#111827', minWidth: rs(32), textAlign: 'center' },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: rs(16), gap: rs(10) },
  key: { width: '30%', aspectRatio: 1.7, backgroundColor: '#FFFFFF', borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  keyDel: { backgroundColor: '#FEF2F2' },
  keyText: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: '#111827' },
  saveSection: { paddingHorizontal: rs(16), paddingVertical: rs(16), paddingBottom: vs(32) },
  saveBtn: { borderRadius: Radius.full, overflow: 'hidden', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: rs(16), gap: rs(8) },
  saveBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#FFFFFF' },
});

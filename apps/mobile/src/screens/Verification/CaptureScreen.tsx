import React, { useRef, useEffect, useState } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, Animated, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { verifyReceiptManual, verifyReceiptPhoto } from '../../services/api';
import { getAuthToken } from '../../services/storage';

export const CaptureScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [supplier, setSupplier] = useState('');
  const [amount, setAmount] = useState('');
  const [scanning, setScanning] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const openResult = (verification: any) => {
    const verdict = verification.data?.verdict;
    if (verdict === 'authentic') navigation.navigate('ResultConfirmed', verification.data);
    else if (verdict === 'suspicious') navigation.navigate('ResultSuspicious', verification.data);
    else navigation.navigate('ResultPending', verification.data);
  };

  const submitManualReceipt = async () => {
    const token = await getAuthToken();
    if (!token) {
      Alert.alert('Session expired', 'Please sign in again.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Amount required', 'Enter the receipt amount before saving a manual verification.');
      return;
    }

    setScanning(true);
    const verification = await verifyReceiptManual(token, {
      supplier: supplier || undefined,
      amount: parsedAmount,
    });
    setScanning(false);

    if (!verification.success) {
      Alert.alert('Receipt not saved', verification.error || 'Could not save this receipt.');
      return;
    }

    openResult(verification);
  };

  const uploadReceipt = async () => {
    const token = await getAuthToken();
    if (!token) {
      Alert.alert('Session expired', 'Please sign in again.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    setScanning(true);
    const verification = await verifyReceiptPhoto(token, result.assets[0].uri, {
      supplier: supplier || undefined,
      amount: parseFloat(amount) || undefined,
    });
    setScanning(false);

    if (!verification.success) {
      Alert.alert('Receipt not verified', verification.error || 'Could not verify this receipt.');
      return;
    }

    openResult(verification);
  };

  const scanLineY = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, rs(180)] });

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#030712','#0A1628','#0D2040']} style={StyleSheet.absoluteFillObject} />

      {/* Decorative particles */}
      <View style={styles.particle1} />
      <View style={styles.particle2} />
      <View style={styles.particle3} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="shield-checkmark" size={rs(16)} color="#4ADE80" />
          <Text style={styles.headerTitle}>Verify Receipt</Text>
        </View>
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>AI</Text>
        </View>
      </View>

      {/* Scan viewport */}
      <Animated.View style={[styles.scanContainer, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.scanFrame, scanning && { transform: [{ scale: pulseAnim }] }]}>
          {/* Corner marks */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {scanning && (
            <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />
          )}

          <View style={styles.scanInner}>
            <Ionicons
              name={scanning ? 'hourglass-outline' : 'receipt-outline'}
              size={rs(40)}
              color={scanning ? '#4ADE80' : 'rgba(255,255,255,0.4)'}
            />
            <Text style={styles.scanHint}>
              {scanning ? 'Analyzing receipt...' : 'Upload a receipt photo or enter details below'}
            </Text>
          </View>
        </Animated.View>

        {scanning && (
          <View style={styles.analyzeChip}>
            <View style={styles.analyzeDot} />
            <Text style={styles.analyzeText}>AI checking receipt data...</Text>
          </View>
        )}
      </Animated.View>

      {/* Manual entry */}
      <Animated.View style={[styles.manualCard, { opacity: fadeAnim }]}>
        <Text style={styles.manualTitle}>Receipt details</Text>

        <View style={styles.inputGroup}>
          <View style={styles.inputRow}>
            <View style={styles.inputIcon}>
              <Ionicons name="storefront-outline" size={rs(16)} color="#9CA3AF" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Supplier name"
              value={supplier}
              onChangeText={setSupplier}
              placeholderTextColor="#6B7280"
            />
          </View>
          <View style={styles.inputRow}>
            <View style={styles.inputIcon}>
              <Ionicons name="cash-outline" size={rs(16)} color="#9CA3AF" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Amount (FCFA)"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.verifyBtn, scanning && { opacity: 0.7 }]}
          onPress={submitManualReceipt}
          disabled={scanning}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#059669','#10B981']} style={styles.verifyBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name={scanning ? 'hourglass-outline' : 'create-outline'} size={rs(18)} color="#fff" />
            <Text style={styles.verifyBtnText}>{scanning ? 'Saving...' : 'Save Manual Receipt'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.receiptBtn, scanning && { opacity: 0.7 }]}
          onPress={uploadReceipt}
          disabled={scanning}
          activeOpacity={0.85}
        >
          <Ionicons name="receipt-outline" size={rs(18)} color="#4ADE80" />
          <Text style={styles.receiptBtnText}>Upload Receipt Photo</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          <Ionicons name="lock-closed-outline" size={rs(11)} color="#6B7280" /> Document data is stored privately and used for your CUB Score
        </Text>
      </Animated.View>
    </View>
  );
};

const CORNER = rs(20);
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#030712' },
  particle1: { position: 'absolute', top: rs(80), left: rs(20), width: rs(80), height: rs(80), borderRadius: rs(40), backgroundColor: 'rgba(74,222,128,0.05)' },
  particle2: { position: 'absolute', top: rs(200), right: rs(10), width: rs(50), height: rs(50), borderRadius: rs(25), backgroundColor: 'rgba(59,130,246,0.06)' },
  particle3: { position: 'absolute', bottom: rs(200), left: rs(40), width: rs(60), height: rs(60), borderRadius: rs(30), backgroundColor: 'rgba(167,139,250,0.05)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: rs(20), paddingBottom: rs(12) },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: rs(4), backgroundColor: 'rgba(74,222,128,0.15)', paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: Radius.full },
  liveDot: { width: rs(6), height: rs(6), borderRadius: rs(3), backgroundColor: '#4ADE80' },
  liveText: { fontSize: FontSize.xs, color: '#4ADE80', fontWeight: FontWeight.bold },
  scanContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: rs(16) },
  scanFrame: { width: rs(200), height: rs(200), alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#4ADE80', borderWidth: 2.5 },
  cornerTL: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: rs(4) },
  cornerTR: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: rs(4) },
  cornerBL: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: rs(4) },
  cornerBR: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: rs(4) },
  scanLine: { position: 'absolute', top: 0, left: rs(8), right: rs(8), height: 2, backgroundColor: '#4ADE80', shadowColor: '#4ADE80', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 },
  scanInner: { alignItems: 'center', gap: rs(12) },
  scanHint: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: rs(140) },
  analyzeChip: { flexDirection: 'row', alignItems: 'center', gap: rs(6), backgroundColor: 'rgba(74,222,128,0.12)', paddingHorizontal: rs(14), paddingVertical: rs(8), borderRadius: Radius.full },
  analyzeDot: { width: rs(8), height: rs(8), borderRadius: rs(4), backgroundColor: '#4ADE80' },
  analyzeText: { fontSize: FontSize.sm, color: '#4ADE80', fontWeight: FontWeight.medium },
  manualCard: { backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: rs(16), marginBottom: vs(24), borderRadius: Radius.xl, padding: rs(20), gap: rs(14), borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  manualTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  inputGroup: { gap: rs(10) },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingRight: rs(14) },
  inputIcon: { width: rs(44), height: rs(44), alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, fontSize: FontSize.base, color: '#FFFFFF', height: rs(44) },
  verifyBtn: { borderRadius: Radius.full, overflow: 'hidden', shadowColor: '#059669', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  verifyBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: rs(14), gap: rs(8) },
  verifyBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  receiptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(74,222,128,0.45)', paddingVertical: rs(13) },
  receiptBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#4ADE80' },
  disclaimer: { fontSize: FontSize.xs, color: '#4B5563', textAlign: 'center' },
});

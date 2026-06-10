import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { uploadDocumentPhoto } from '../../services/api';
import { getAuthToken } from '../../services/storage';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs } from '../../utils/responsive';

type DocumentSide = 'id_front' | 'id_back';

export const DocumentUploadScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [uploading, setUploading] = useState<DocumentSide | null>(null);
  const [uploaded, setUploaded] = useState<Record<DocumentSide, boolean>>({
    id_front: false,
    id_back: false,
  });

  const uploadSide = async (side: DocumentSide) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Cameroon Union Bank needs camera access to capture your identity document.');
      return;
    }

    const photo = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.55,
    });

    if (photo.canceled || !photo.assets[0]?.uri) return;

    const token = await getAuthToken();
    if (!token) {
      Alert.alert('Login required', 'Please log in before uploading KYC documents.');
      return;
    }

    setUploading(side);
    const result = await uploadDocumentPhoto(token, photo.assets[0].uri, side);
    setUploading(null);

    if (!result.success) {
      Alert.alert('Document Upload Failed', result.error || 'Please check your connection and try again.');
      return;
    }

    setUploaded((current) => ({ ...current, [side]: true }));
    Alert.alert('Document Uploaded', `${side === 'id_front' ? 'Front' : 'Back'} side uploaded successfully.`);
  };

  const rows = [
    { side: 'id_front' as const, title: 'ID Front', sub: 'Capture the side with your photo and name.' },
    { side: 'id_back' as const, title: 'ID Back', sub: 'Capture the reverse side of the same document.' },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#00172F', '#002853', '#002853']} style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={rs(20)} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CUB Identity KYC</Text>
          <View style={{ width: rs(36) }} />
        </View>
        <Text style={styles.headerSub}>Verify the trader behind the business profile.</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {rows.map((row) => (
          <TouchableOpacity
            key={row.side}
            style={styles.card}
            onPress={() => uploadSide(row.side)}
            disabled={!!uploading}
            activeOpacity={0.85}
          >
            <View style={[styles.cardIcon, uploaded[row.side] && styles.cardIconDone]}>
              {uploading === row.side ? (
                <ActivityIndicator color="#002853" />
              ) : (
                <Ionicons name={uploaded[row.side] ? 'checkmark-circle' : 'card-outline'} size={rs(26)} color={uploaded[row.side] ? '#059669' : '#002853'} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{row.title}</Text>
              <Text style={styles.cardSub}>{row.sub}</Text>
            </View>
            <Ionicons name="camera-outline" size={rs(20)} color="#9CA3AF" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.nextBtn, (!uploaded.id_front || !uploaded.id_back) && { opacity: 0.5 }]}
          onPress={() => {
            if (!uploaded.id_front || !uploaded.id_back) {
              Alert.alert('Documents Required', 'Upload both the front and back of your identity document before face liveness.');
              return;
            }
            navigation.navigate('Liveness');
          }}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#002853', '#133E72']} style={styles.nextBtnGrad}>
            <Ionicons name="scan-outline" size={rs(20)} color="#FFFFFF" />
            <Text style={styles.nextBtnText}>Continue to Face Liveness</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  header: { paddingHorizontal: rs(20), paddingBottom: rs(24) },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(14) },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  headerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.72)' },
  content: { padding: rs(16), gap: rs(12), paddingBottom: vs(48) },
  card: { flexDirection: 'row', alignItems: 'center', gap: rs(14), backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(16), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardIcon: { width: rs(52), height: rs(52), borderRadius: Radius.lg, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  cardIconDone: { backgroundColor: '#D1FAE5' },
  cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#111827' },
  cardSub: { fontSize: FontSize.sm, color: '#6B7280', marginTop: rs(2) },
  nextBtn: { marginTop: rs(8), borderRadius: Radius.full, overflow: 'hidden', shadowColor: '#059669', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
  nextBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), paddingVertical: rs(15) },
  nextBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#FFFFFF' },
});

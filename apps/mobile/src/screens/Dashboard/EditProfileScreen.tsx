import React, { useCallback, useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { updateProfile } from '../../services/api';
import { getAuthToken, getUserData, saveUserData } from '../../services/storage';

export const EditProfileScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [business, setBusiness] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const storedUser = await getUserData();
      if (!active || !storedUser) return;
      setName(storedUser.full_name || '');
      setPhone(storedUser.phone || '');
      setCity(storedUser.city || '');
      setBusiness(storedUser.occupation || '');
    })();
    return () => { active = false; };
  }, []));

  const handleSave = async () => {
    const token = await getAuthToken();
    if (!token) {
      Alert.alert('Session expired', 'Please sign in again.');
      return;
    }
    const result = await updateProfile(token, {
      full_name: name,
      city,
      occupation: business,
    });
    if (!result.success) {
      Alert.alert('Profile not saved', result.error || 'Could not save your profile.');
      return;
    }
    await saveUserData(result.data);
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#00172F','#002853','#002853']} style={[styles.hero, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.orb} />
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'MT'}</Text></View>
            <TouchableOpacity style={styles.avatarEdit}>
              <Ionicons name="camera-outline" size={rs(14)} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {[
          { label: 'FULL NAME',     value: name,    set: setName,    icon: 'person-outline',    type: 'default' },
          { label: 'PHONE NUMBER',  value: phone,   set: setPhone,   icon: 'call-outline',      type: 'phone-pad' },
          { label: 'CITY',          value: city,    set: setCity,    icon: 'location-outline',  type: 'default' },
          { label: 'BUSINESS NAME', value: business,set: setBusiness,icon: 'storefront-outline', type: 'default' },
        ].map((f, i) => (
          <View key={i} style={styles.field}>
            <Text style={styles.fieldLabel}>{f.label}</Text>
            <View style={styles.inputRow}>
              <Ionicons name={f.icon as any} size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
              <TextInput style={styles.input} value={f.value} onChangeText={f.set} keyboardType={f.type as any} autoCapitalize="words" />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  hero: { paddingHorizontal: rs(20), paddingBottom: rs(24), overflow: 'hidden' },
  orb: { position: 'absolute', top: rs(-40), right: rs(-40), width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.06)' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(16) },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  saveBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: rs(14), paddingVertical: rs(7), borderRadius: Radius.full },
  saveBtnText: { fontSize: FontSize.base, color: '#FFFFFF', fontWeight: FontWeight.bold },
  avatarSection: { alignItems: 'center', gap: rs(8) },
  avatarWrap: { position: 'relative' },
  avatar: { width: rs(72), height: rs(72), borderRadius: rs(36), backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { fontSize: ms(24), fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  avatarEdit: { position: 'absolute', bottom: 0, right: 0, width: rs(24), height: rs(24), borderRadius: rs(12), backgroundColor: '#F5A623', alignItems: 'center', justifyContent: 'center' },
  avatarHint: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.55)' },
  content: { padding: rs(16), gap: rs(14), paddingBottom: vs(40) },
  field: { gap: rs(6) },
  fieldLabel: { fontSize: FontSize.xs, color: '#6B7280', letterSpacing: 0.8, fontWeight: FontWeight.semibold },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: Radius.lg, paddingHorizontal: rs(14), paddingVertical: rs(12), borderWidth: 1.5, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  input: { flex: 1, fontSize: FontSize.base, color: '#111827' },
});

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { getPreferences, updatePreferences } from '../../services/api';
import { getAuthToken } from '../../services/storage';

const languages = [
  { label: 'English',  native: 'English',  code: 'EN', value: 'en' },
  { label: 'French',   native: 'Français', code: 'FR', value: 'fr' },
  { label: 'Pidgin',   native: 'Pidgin',   code: 'PC', value: 'pidgin' },
];

export const LanguageScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [language, setLanguage] = useState('en');

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const token = await getAuthToken();
      if (!token) return;
      const result = await getPreferences(token);
      if (active && result.success) {
        setLanguage(result.data.language || 'en');
      }
    })();
    return () => { active = false; };
  }, []));

  const selectLanguage = async (nextLanguage: string) => {
    setLanguage(nextLanguage);
    const token = await getAuthToken();
    if (!token) return;
    await updatePreferences(token, { language: nextLanguage });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#061E14','#0D4A35','#1B5E4B']} style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Language</Text>
          <View style={{ width: rs(36) }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>Choose your preferred language for MboaTrust AI</Text>
        <View style={styles.card}>
          {languages.map((l, i) => (
            <TouchableOpacity key={i} style={[styles.langRow, i < languages.length - 1 && styles.langDiv]} activeOpacity={0.8} onPress={() => selectLanguage(l.value)}>
              <View style={styles.codeBox}><Text style={styles.codeText}>{l.code}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.langLabel}>{l.label}</Text>
                <Text style={styles.langNative}>{l.native}</Text>
              </View>
              {language === l.value && <Ionicons name="checkmark-circle" size={rs(22)} color="#059669" />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F4F2' },
  header: { paddingHorizontal: rs(20), paddingBottom: rs(20) },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  content: { padding: rs(16), gap: rs(12), paddingBottom: vs(40) },
  hint: { fontSize: FontSize.base, color: '#6B7280' },
  card: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12), padding: rs(16) },
  langDiv: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  codeBox: { width: rs(40), height: rs(40), borderRadius: rs(10), backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  codeText: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: '#1B5E4B' },
  langLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: '#111827' },
  langNative: { fontSize: FontSize.xs, color: '#9CA3AF' },
});

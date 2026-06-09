import React, { useCallback, useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { getRecordsSummary, getTrustScore } from '../../services/api';
import { getAuthToken, getUserData, logout } from '../../services/storage';

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [score, setScore] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const [token, storedUser] = await Promise.all([getAuthToken(), getUserData()]);
      if (active) setUser(storedUser);
      if (!token) return;
      const [summaryResult, scoreResult] = await Promise.all([getRecordsSummary(token), getTrustScore(token)]);
      if (!active) return;
      if (summaryResult.success) setSummary(summaryResult.data);
      if (scoreResult.success) setScore(scoreResult.data.score);
    })();
    return () => { active = false; };
  }, []));

  const fullName = user?.full_name || 'CUB Member';
  const initials = fullName.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase();

  const handleSignOut = () => {
    Alert.alert(
      'Sign out',
      'Do you want to sign out of Cameroon Union Bank?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            const rootNavigation = navigation.getParent()?.getParent() ?? navigation;
            rootNavigation.reset({
              index: 0,
              routes: [{ name: 'Onboarding' }],
            });
          },
        },
      ]
    );
  };

  const menuItems = [
    { section: 'Account', items: [
      { icon: 'person-outline',    label: 'Edit Profile',      screen: 'EditProfile' },
      { icon: 'language-outline',  label: 'Language',          screen: 'Language' },
      { icon: 'notifications-outline', label: 'Notifications', screen: 'Notifications' },
    ]},
    { section: 'Business', items: [
      { icon: 'bar-chart-outline', label: 'Statistics',        screen: 'Statistics' },
      { icon: 'document-outline',  label: 'Financial Summary', screen: 'FinancialSummary' },
      { icon: 'wifi-outline',      label: 'Offline Mode',      screen: 'OfflineMode' },
    ]},
    { section: 'Support', items: [
      { icon: 'help-circle-outline', label: 'Help & FAQ',      screen: 'Help' },
      { icon: 'shield-outline',    label: 'Privacy Policy',    screen: null },
      { icon: 'log-out-outline',   label: 'Sign Out',          screen: null, danger: true },
    ]},
  ];

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(100) }}>
        {/* Header */}
        <LinearGradient colors={['#061E14','#0D4A35','#1B5E4B']} style={[styles.header, { paddingTop: insets.top + rs(16) }]}>
          <View style={styles.orb} />
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <TouchableOpacity style={styles.avatarEdit} onPress={() => navigation.navigate('EditProfile')}>
                <Ionicons name="camera-outline" size={rs(14)} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileName}>{fullName}</Text>
            <Text style={styles.profileRole}>{user?.occupation || 'CUB Member'} - {user?.city || 'Cameroon'}</Text>
            <View style={styles.profileChip}>
              <Ionicons name="star" size={rs(12)} color="#F5A623" />
              <Text style={styles.profileChipText}>CUB Score: {score || user?.trust_score || 0} / 100</Text>
            </View>
          </View>

          {/* Stats strip */}
          <View style={styles.statsRow}>
            {[
              { val: `${Math.round((summary?.sales_week || 0) / 1000)}K`, label: 'Sales (week)', icon: 'trending-up-outline' },
              { val: String(summary?.stock_count_today || 0),  label: 'Stock today', icon: 'shield-checkmark-outline' },
              { val: String((summary?.sales_count_today || 0) + (summary?.expenses_count_today || 0)),   label: 'Records today', icon: 'receipt-outline' },
            ].map((s, i) => (
              <View key={i} style={styles.statItem}>
                <Ionicons name={s.icon as any} size={rs(14)} color="rgba(255,255,255,0.65)" />
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLbl}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Menu */}
        <View style={styles.menuSection}>
          {menuItems.map((group, gi) => (
            <View key={gi} style={styles.menuGroup}>
              <Text style={styles.menuGroupLabel}>{group.section}</Text>
              <View style={styles.menuCard}>
                {group.items.map((item: any, ii) => (
                  <TouchableOpacity
                    key={ii}
                    style={[styles.menuItem, ii < group.items.length - 1 && styles.menuDivider]}
                    onPress={() => item.danger ? handleSignOut() : item.screen && navigation.navigate(item.screen)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.menuIconBox, { backgroundColor: item.danger ? '#FEF2F2' : '#F0F4F2' }]}>
                      <Ionicons name={item.icon as any} size={rs(18)} color={item.danger ? '#DC2626' : '#1B5E4B'} />
                    </View>
                    <Text style={[styles.menuLabel, item.danger && { color: '#DC2626' }]}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={rs(16)} color={item.danger ? '#FCA5A5' : '#D1D5DB'} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.version}>Cameroon Union Bank - v1.0.0 - Built in Cameroon</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F4F2' },
  header: { paddingHorizontal: rs(20), paddingBottom: rs(24), overflow: 'hidden' },
  orb: { position: 'absolute', top: rs(-40), right: rs(-40), width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.06)' },
  avatarSection: { alignItems: 'center', gap: rs(6), marginBottom: rs(20) },
  avatarWrap: { position: 'relative' },
  avatar: { width: rs(80), height: rs(80), borderRadius: rs(40), backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { fontSize: ms(28), fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  avatarEdit: { position: 'absolute', bottom: 0, right: 0, width: rs(26), height: rs(26), borderRadius: rs(13), backgroundColor: '#1B5E4B', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  profileName: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  profileRole: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)' },
  profileChip: { flexDirection: 'row', alignItems: 'center', gap: rs(5), backgroundColor: 'rgba(245,166,35,0.22)', paddingHorizontal: rs(12), paddingVertical: rs(4), borderRadius: Radius.full },
  profileChipText: { fontSize: FontSize.xs, color: '#F5A623', fontWeight: FontWeight.bold },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.xl, padding: rs(14), borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  statItem: { flex: 1, alignItems: 'center', gap: rs(3) },
  statVal: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  statLbl: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  menuSection: { padding: rs(16), gap: rs(20) },
  menuGroup: { gap: rs(8) },
  menuGroupLabel: { fontSize: FontSize.xs, color: '#9CA3AF', fontWeight: FontWeight.semibold, letterSpacing: 0.8, paddingLeft: rs(4) },
  menuCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: rs(12), padding: rs(16) },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuIconBox: { width: rs(36), height: rs(36), borderRadius: rs(10), alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.medium, color: '#111827' },
  version: { textAlign: 'center', fontSize: FontSize.xs, color: '#9CA3AF', paddingBottom: rs(8) },
});

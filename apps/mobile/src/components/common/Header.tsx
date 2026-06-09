import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { FontSize, FontWeight, Spacing } from '../../constants/Theme';
import { rs } from '../../utils/responsive';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  dark?: boolean;
  isOffline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title, showBack = false, showLogo = false, onBack,
  rightAction, transparent = false, dark = false, isOffline = false,
}) => {
  const insets = useSafeAreaInsets();
  const textColor = dark ? Colors.textOnPrimary : Colors.textPrimary;

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }, transparent && styles.transparent, dark && styles.dark]}>
      <View style={styles.row}>
        <View style={styles.left}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={rs(22)} color={textColor} />
            </TouchableOpacity>
          )}
          {showLogo && (
            <View style={styles.logoRow}>
              <View style={styles.logoIcon}>
                <Ionicons name="checkmark" size={rs(14)} color={Colors.textOnPrimary} />
              </View>
              <Text style={[styles.logoText, { color: textColor }]}>CUB</Text>
            </View>
          )}
        </View>
        {title && <View style={styles.center}><Text style={[styles.title, { color: textColor }]}>{title}</Text></View>}
        <View style={styles.right}>
          {isOffline && (
            <View style={styles.offlineBadge}>
              <Ionicons name="wifi" size={rs(12)} color={Colors.warning} />
              <Text style={styles.offlineText}>OFFLINE</Text>
            </View>
          )}
          {rightAction}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  transparent: { backgroundColor: Colors.transparent, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  dark: { backgroundColor: Colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: rs(44) },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  center: { flex: 2, alignItems: 'center' },
  right: { flex: 1, alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  logoIcon: { width: rs(24), height: rs(24), borderRadius: rs(6), backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  offlineBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(3), backgroundColor: Colors.warningLight, paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(10) },
  offlineText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.warning, letterSpacing: 0.5 },
});

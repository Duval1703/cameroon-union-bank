import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/Theme';
import { rs } from '../../utils/responsive';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'primary' | 'neutral';
interface BadgeProps { label: string; variant?: BadgeVariant; style?: ViewStyle; dot?: boolean; }

const variantConfig: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: Colors.successLight, text: Colors.successDark },
  warning: { bg: Colors.warningLight, text: Colors.warningDark },
  danger:  { bg: Colors.dangerLight,  text: Colors.dangerDark },
  info:    { bg: Colors.infoLight,    text: Colors.info },
  gold:    { bg: Colors.goldLight,    text: Colors.goldDark },
  primary: { bg: '#DCE7F3',           text: Colors.primary },
  neutral: { bg: Colors.inputBg,      text: Colors.textSecondary },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary', style, dot = false }) => {
  const config = variantConfig[variant];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: config.text }]} />}
      <Text style={[styles.label, { color: config.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: rs(4), borderRadius: Radius.full, alignSelf: 'flex-start' },
  dot: { width: rs(6), height: rs(6), borderRadius: rs(3), marginRight: rs(5) },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
});

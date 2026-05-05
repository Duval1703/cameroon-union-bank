import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/Theme';
import { rs } from '../../utils/responsive';

interface ButtonProps {
  title: string; onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean; disabled?: boolean;
  icon?: React.ReactNode; iconRight?: React.ReactNode;
  style?: ViewStyle; textStyle?: TextStyle; fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', size = 'lg',
  loading = false, disabled = false, icon, iconRight,
  style, textStyle, fullWidth = true,
}) => {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress} disabled={isDisabled} activeOpacity={0.8}
      style={[styles.base, styles[variant], styles[`size_${size}`], fullWidth && styles.fullWidth, isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.textOnPrimary : Colors.primary} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>{title}</Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: { borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  fullWidth: { width: '100%' },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  iconLeft: { marginRight: Spacing.sm },
  iconRight: { marginLeft: Spacing.sm },
  primary:   { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.inputBg },
  outline:   { backgroundColor: Colors.transparent, borderWidth: 1.5, borderColor: Colors.primary },
  ghost:     { backgroundColor: Colors.transparent },
  danger:    { backgroundColor: Colors.danger },
  size_sm: { paddingVertical: rs(8),  paddingHorizontal: Spacing.base },
  size_md: { paddingVertical: rs(12), paddingHorizontal: Spacing.xl },
  size_lg: { paddingVertical: rs(16), paddingHorizontal: Spacing.xl },
  text: { fontWeight: FontWeight.semibold },
  text_primary:   { color: Colors.textOnPrimary },
  text_secondary: { color: Colors.textPrimary },
  text_outline:   { color: Colors.primary },
  text_ghost:     { color: Colors.primary },
  text_danger:    { color: Colors.textOnPrimary },
  textSize_sm: { fontSize: FontSize.base },
  textSize_md: { fontSize: FontSize.md },
  textSize_lg: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  disabled: { opacity: 0.5 },
});

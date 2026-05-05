import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, TextInputProps, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/Theme';
import { rs } from '../../utils/responsive';

interface InputProps extends TextInputProps {
  label?: string; error?: string; helper?: string;
  prefix?: React.ReactNode; suffix?: React.ReactNode;
  isPassword?: boolean; containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({ label, error, helper, prefix, suffix, isPassword = false, containerStyle, style, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        {prefix && <View style={styles.prefix}>{prefix}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword ? (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.suffix}>
            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={rs(20)} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : suffix ? <View style={styles.suffix}>{suffix}</View> : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : helper ? <Text style={styles.helperText}>{helper}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.base },
  label: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.inputBg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, minHeight: rs(52) },
  inputError: { borderColor: Colors.danger },
  input: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, paddingVertical: Spacing.md },
  prefix: { marginRight: Spacing.sm },
  suffix: { marginLeft: Spacing.sm },
  errorText:  { fontSize: FontSize.sm, color: Colors.danger, marginTop: rs(4) },
  helperText: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: rs(4) },
});

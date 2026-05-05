import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Radius, Shadow, Spacing } from '../../constants/Theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = Spacing.base,
  noPadding = false,
}) => {
  return (
    <View
      style={[
        styles.card,
        !noPadding && { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadow.md,
  },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { rs } from '../../utils/responsive';

interface MiniBarChartProps {
  values: number[];
  color?: string;
  height?: number;
  barWidth?: number;
}

export const MiniBarChart: React.FC<MiniBarChartProps> = ({
  values,
  color = Colors.primary,
  height = rs(24),
  barWidth = rs(4),
}) => {
  const max = Math.max(...values, 1);
  return (
    <View style={[styles.row, { height }]}>
      {values.map((v, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            {
              width: barWidth,
              height: (v / max) * height,
              backgroundColor: i === values.length - 1 ? color : `${color}55`,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: rs(2),
  },
  bar: {
    borderRadius: rs(2),
  },
});

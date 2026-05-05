import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import { rs, vs, ms } from '../../utils/responsive';
import { FontSize, FontWeight } from '../../constants/Theme';

interface TrustScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export const TrustScoreRing: React.FC<TrustScoreRingProps> = ({
  score,
  size = rs(160),
  strokeWidth = rs(10),
  showLabel = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  const getScoreColor = (s: number) => {
    if (s >= 80) return Colors.primary;
    if (s >= 60) return Colors.success;
    if (s >= 40) return Colors.warning;
    return Colors.danger;
  };

  const scoreColor = getScoreColor(score);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.score, { color: scoreColor, fontSize: ms(42), lineHeight: ms(50) }]}>{score}</Text>
        {showLabel && (
          <Text style={styles.label}>TRUST SCORE</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontWeight: FontWeight.bold,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
});

import { StyleSheet } from 'react-native';
import { Colors } from './Colors';
import { rs, ms } from '../utils/responsive';

export const Spacing = {
  xs:   rs(4),
  sm:   rs(8),
  md:   rs(12),
  base: rs(16),
  lg:   rs(20),
  xl:   rs(24),
  xxl:  rs(32),
  xxxl: rs(48),
};

export const Radius = {
  xs:   rs(6),
  sm:   rs(8),
  md:   rs(12),
  lg:   rs(16),
  xl:   rs(20),
  xxl:  rs(24),
  full: 9999,
};

export const FontSize = {
  xs:      ms(11),
  sm:      ms(12),
  base:    ms(14),
  md:      ms(16),
  lg:      ms(18),
  xl:      ms(20),
  xxl:     ms(24),
  xxxl:    ms(28),
  display: ms(32),
  hero:    ms(40),
};

export const FontWeight = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const GlobalStyles = StyleSheet.create({
  flex1: { flex: 1 },
  row: { flexDirection: 'row' },
  center: { alignItems: 'center', justifyContent: 'center' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  screen: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: rs(16) },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: rs(16),
    padding: rs(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  section: { marginBottom: rs(24) },
  sectionTitle: {
    fontSize: ms(18),
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    marginBottom: rs(12),
  },
});

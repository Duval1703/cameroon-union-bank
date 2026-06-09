import { Colors } from './Colors';

// Extended premium color palette for Cameroon Union Bank
export const GradientSets = {
  primary:     ['#00172F', '#002853', '#133E72'] as const,
  primaryMid:  ['#002853', '#133E72', '#1F5D9A'] as const,
  gold:        ['#735C00', '#F0D980', '#FFF7D1'] as const,
  danger:      ['#B91C1C', '#DC2626', '#EF4444'] as const,
  success:     ['#065F46', '#059669', '#10B981'] as const,
  dark:        ['#00172F', '#002853', '#133E72'] as const,
  glass:       ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.08)'] as const,
  surface:     ['#FFFFFF', '#F8FAFB'] as const,
  warmGreen:   ['#F4F7FB', '#DCE7F3'] as const,
};

export const ColoredShadow = {
  green: { shadowColor: '#002853', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  gold:  { shadowColor: '#F0D980', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3,  shadowRadius: 12, elevation: 6 },
  dark:  { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  soft:  { shadowColor: '#002853', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,  shadowRadius: 8,  elevation: 3 },
  card:  { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,  elevation: 4 },
};

// Category color system
export const CategoryColors = {
  sale:    { icon: '#059669', bg: '#ECFDF5', gradient: ['#065F46', '#059669'] as const },
  expense: { icon: '#DC2626', bg: '#FEF2F2', gradient: ['#991B1B', '#DC2626'] as const },
  stock:   { icon: '#2563EB', bg: '#EFF6FF', gradient: ['#1D4ED8', '#2563EB'] as const },
  verify:  { icon: '#002853', bg: '#DCE7F3', gradient: ['#00172F', '#002853'] as const },
  insight: { icon: '#7C3AED', bg: '#EDE9FE', gradient: ['#5B21B6', '#7C3AED'] as const },
};

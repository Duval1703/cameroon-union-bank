import { Colors } from './Colors';

// Extended premium color palette for MboaTrust AI
export const GradientSets = {
  primary:     ['#0D4A35', '#1B5E4B', '#2D7A62'] as const,
  primaryMid:  ['#1B5E4B', '#246B56', '#2D8A65'] as const,
  gold:        ['#D4891A', '#F5A623', '#FFC04D'] as const,
  danger:      ['#B91C1C', '#DC2626', '#EF4444'] as const,
  success:     ['#065F46', '#059669', '#10B981'] as const,
  dark:        ['#0A2B1E', '#0D3D2A', '#1B5E4B'] as const,
  glass:       ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.08)'] as const,
  surface:     ['#FFFFFF', '#F8FAFB'] as const,
  warmGreen:   ['#EEF4F0', '#D8EDE4'] as const,
};

export const ColoredShadow = {
  green: { shadowColor: '#1B5E4B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  gold:  { shadowColor: '#F5A623', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3,  shadowRadius: 12, elevation: 6 },
  dark:  { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  soft:  { shadowColor: '#1B5E4B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,  shadowRadius: 8,  elevation: 3 },
  card:  { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,  elevation: 4 },
};

// Category color system
export const CategoryColors = {
  sale:    { icon: '#059669', bg: '#ECFDF5', gradient: ['#065F46', '#059669'] as const },
  expense: { icon: '#DC2626', bg: '#FEF2F2', gradient: ['#991B1B', '#DC2626'] as const },
  stock:   { icon: '#2563EB', bg: '#EFF6FF', gradient: ['#1D4ED8', '#2563EB'] as const },
  verify:  { icon: '#1B5E4B', bg: '#D1EAE0', gradient: ['#0D4A35', '#1B5E4B'] as const },
  insight: { icon: '#7C3AED', bg: '#EDE9FE', gradient: ['#5B21B6', '#7C3AED'] as const },
};

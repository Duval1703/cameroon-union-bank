export const Colors = {
  // Brand
  primary: '#1B5E4B',
  primaryDark: '#0F3D2E',
  primaryMid: '#246B56',
  primaryLight: '#2D8A65',
  primaryMuted: '#4DA880',

  // Backgrounds
  background: '#EEF4F0',
  backgroundAlt: '#F5FAF7',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAF9',

  // Gold / Accent
  gold: '#F5A623',
  goldDark: '#D4891A',
  goldLight: '#FFF3D6',

  // Text
  textPrimary: '#0D1B10',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textOnGold: '#7A4800',

  // Semantic
  success: '#16A34A',
  successLight: '#DCFCE7',
  successDark: '#14532D',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  warningDark: '#92400E',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  dangerDark: '#7F1D1D',
  info: '#2563EB',
  infoLight: '#DBEAFE',

  // UI Elements
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  inputBg: '#F3F4F6',
  inputBorder: '#D1D5DB',
  divider: '#E5E7EB',
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.2)',

  // Status
  online: '#22C55E',
  offline: '#EF4444',
  syncing: '#F59E0B',

  // Transparent
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;

export const Colors = {
  // Brand
  primary: '#002853',
  primaryDark: '#00172F',
  primaryMid: '#133E72',
  primaryLight: '#1F5D9A',
  primaryMuted: '#5A7FA8',

  // Backgrounds
  background: '#F4F7FB',
  backgroundAlt: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF3F8',

  // Gold / Accent
  gold: '#F0D980',
  goldDark: '#735C00',
  goldLight: '#FFF7D1',

  // Text
  textPrimary: '#181C1E',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textOnGold: '#241A00',

  // Semantic
  success: '#004829',
  successLight: '#DDFBEA',
  successDark: '#002F19',
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

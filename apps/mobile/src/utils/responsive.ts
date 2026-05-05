import { Dimensions, Platform } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');
const BASE_W = 390;
const BASE_H = 844;

const effectiveW = Platform.OS === 'web' ? Math.min(W, 480) : W;

export const rs = (n: number): number => Math.round((effectiveW / BASE_W) * n);
export const vs = (n: number): number => Math.round((H / BASE_H) * n);
export const ms = (n: number, f = 0.45): number => Math.round(n + (rs(n) - n) * f);

export const isWeb = Platform.OS === 'web';
export const isTablet = W >= 768;
export const SCREEN_W = effectiveW;
export const SCREEN_H = H;

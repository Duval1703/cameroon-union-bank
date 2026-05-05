import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DATA_AGENT_FALLBACK = 'http://192.168.100.166:8001';
const PRODUCTION_DATA_AGENT_URL = process.env.EXPO_PUBLIC_DATA_AGENT_URL || 'https://data.mboatrust.ai';

export type MoneyProvider = 'MTN' | 'ORANGE';

export type CollectedFinancialData = {
  request_id: string;
  status: string;
  timestamp?: string;
  data?: {
    user_phone?: string;
    provider?: MoneyProvider;
    transactions?: any[];
    summary?: {
      total_transactions?: number;
      total_received?: number;
      total_sent?: number;
      current_balance?: number;
      average_balance?: number;
    };
  };
};

export type CollectionOwner = {
  phone?: string | null;
};

export function normalizeCameroonPhone(value?: string | null): string {
  let digits = (value || '').replace(/\D/g, '');

  while (digits.startsWith('237') && digits.length > 9) {
    digits = digits.slice(3);
  }

  return digits.length > 9 ? digits.slice(-9) : digits;
}

export function filterCollectionsForUser(
  collections: CollectedFinancialData[],
  user?: CollectionOwner | null
): CollectedFinancialData[] {
  const userPhone = normalizeCameroonPhone(user?.phone);

  if (!userPhone) return [];

  return collections
    .filter((collection) => {
      const collectionPhone = normalizeCameroonPhone(collection.data?.user_phone);
      return collection.status === 'collected' && collectionPhone === userPhone;
    })
    .sort((a, b) => {
      const left = new Date(a.timestamp || 0).getTime();
      const right = new Date(b.timestamp || 0).getTime();
      return right - left;
    });
}

function extractHost(hostUri?: string): string | null {
  if (!hostUri) return null;

  const withoutProtocol = hostUri.replace(/^[a-z]+:\/\//i, '');
  const host = withoutProtocol.split('/')[0]?.split(':')[0];

  return host || null;
}

function getDevHost(): string | null {
  const constants = Constants as any;

  return extractHost(
    Constants.expoConfig?.hostUri ||
    constants.manifest2?.extra?.expoClient?.hostUri ||
    constants.manifest?.debuggerHost
  );
}

function getBaseUrl(port: number, fallback: string): string {
  const host = getDevHost();

  return host ? `http://${host}:${port}` : fallback;
}

function getDevAgentBaseUrls(port: number, fallback: string): string[] {
  const primary = getBaseUrl(port, fallback);
  const androidFallbackUrls = Platform.OS === 'android'
    ? [`http://localhost:${port}`, `http://127.0.0.1:${port}`]
    : [];

  return Array.from(new Set([
    primary,
    fallback,
    ...androidFallbackUrls,
  ]));
}

async function agentFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!__DEV__) {
    return fetch(`${PRODUCTION_DATA_AGENT_URL}${path}`, init);
  }

  let lastError: unknown;

  for (const baseUrl of getDevAgentBaseUrls(8001, DATA_AGENT_FALLBACK)) {
    try {
      return await fetch(`${baseUrl}${path}`, init);
    } catch (error) {
      lastError = error;
      console.warn(`Data collection request failed for ${baseUrl}${path}`, error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Network request failed');
}

function getErrorMessage(data: any, fallback: string): string {
  const detail = data?.message ?? data?.detail ?? data?.error;

  if (typeof detail === 'string') return detail;
  if (detail) return JSON.stringify(detail);

  return fallback;
}

export async function requestApiDataCollection(params: {
  userPhone: string;
  provider: MoneyProvider;
  userId?: string;
}): Promise<{ success: boolean; request_id?: string; message?: string; error?: string }> {
  try {
    const response = await agentFetch('/request-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_phone: params.userPhone,
        provider: params.provider,
        user_id: params.userId,
      }),
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: getErrorMessage(data, 'Failed to start data collection') };
    }

    return data;
  } catch (error: any) {
    return { success: false, error: error.message || 'Could not connect to data collection agent' };
  }
}

export async function getCollectedFinancialData(): Promise<CollectedFinancialData[]> {
  try {
    const response = await agentFetch('/collected-data');
    const data = await response.json();

    if (!response.ok) return [];

    return Array.isArray(data.collected_data) ? data.collected_data : [];
  } catch {
    return [];
  }
}

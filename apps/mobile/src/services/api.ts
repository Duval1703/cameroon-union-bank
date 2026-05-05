import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const DEV_API_FALLBACK = 'http://192.168.100.166:8003';
const PRODUCTION_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.mboatrust.ai';

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type RegisterData = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  street_address: string;
  city: string;
  region: string;
  postal_code?: string;
  occupation: string;
  employer_name?: string;
  monthly_income_range: string;
  income_source?: string;
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_phone: string;
  emergency_contact_alt_phone?: string;
  id_type: 'CNI' | 'PASSPORT';
  id_number: string;
  is_minor: boolean;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_relationship?: string;
};

function extractHost(hostUri?: string): string | null {
  if (!hostUri) return null;

  const withoutProtocol = hostUri.replace(/^[a-z]+:\/\//i, '');
  const host = withoutProtocol.split('/')[0]?.split(':')[0];

  return host || null;
}

function getDevApiBaseUrl(): string {
  const constants = Constants as any;
  const host = extractHost(
    Constants.expoConfig?.hostUri ||
    constants.manifest2?.extra?.expoClient?.hostUri ||
    constants.manifest?.debuggerHost
  );

  return host ? `http://${host}:8003` : DEV_API_FALLBACK;
}

function getDevApiBaseUrls(): string[] {
  const primary = getDevApiBaseUrl();
  const androidFallbackUrls = Platform.OS === 'android'
    ? ['http://localhost:8003', 'http://127.0.0.1:8003', 'http://10.0.2.2:8003']
    : [];

  return Array.from(new Set([
    primary,
    DEV_API_FALLBACK,
    ...androidFallbackUrls,
  ]));
}

export const API_BASE_URL = __DEV__ ? getDevApiBaseUrl() : PRODUCTION_API_URL;

function getApiErrorMessage(data: any, fallback: string): string {
  const detail = data?.detail ?? data?.message ?? data?.error;

  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => typeof item === 'string' ? item : item?.msg || JSON.stringify(item)).join('\n');
  }
  if (detail) return JSON.stringify(detail);

  return fallback;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!__DEV__) {
    return fetch(`${API_BASE_URL}${path}`, init);
  }

  let lastError: unknown;

  for (const baseUrl of getDevApiBaseUrls()) {
    try {
      return await fetch(`${baseUrl}${path}`, init);
    } catch (error) {
      lastError = error;
      console.warn(`API request failed for ${baseUrl}${path}`, error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Network request failed');
}

function getImageMimeType(uri: string): string {
  const extension = uri.split('/').pop()?.split('.').pop()?.toLowerCase();

  if (extension === 'png') return 'image/png';
  return 'image/jpeg';
}

async function readImageAsBase64(photoUri: string): Promise<string> {
  return FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export async function registerUser(userData: RegisterData): Promise<ApiResponse<any>> {
  try {
    const response = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const responseText = await response.text();
    const data = JSON.parse(responseText);

    if (!response.ok) {
      return { success: false, error: getApiErrorMessage(data, 'Registration failed') };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' };
  }
}

export async function loginUser(credentials: { email: string; password: string }): Promise<ApiResponse<any>> {
  try {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: getApiErrorMessage(data, 'Login failed') };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' };
  }
}

export async function getCurrentUser(token: string): Promise<ApiResponse<any>> {
  try {
    const response = await apiFetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: getApiErrorMessage(data, 'Failed to get user info') };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' };
  }
}

async function uploadImageMultipart(
  path: string,
  token: string,
  photoUri: string,
  parameters?: Record<string, string>
): Promise<ApiResponse<any>> {
  let lastError = 'Image upload failed';
  const baseUrls = __DEV__ ? getDevApiBaseUrls() : [PRODUCTION_API_URL];

  for (const baseUrl of baseUrls) {
    try {
      const result = await FileSystem.uploadAsync(`${baseUrl}${path}`, photoUri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        mimeType: getImageMimeType(photoUri),
        parameters,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = result.body ? JSON.parse(result.body) : {};

      if (result.status >= 200 && result.status < 300) {
        return { success: true, data };
      }

      lastError = getApiErrorMessage(data, 'Failed to upload image');
    } catch (error: any) {
      lastError = error.message || 'Network error';
    }
  }

  return { success: false, error: lastError };
}

export async function uploadDocumentPhoto(token: string, photoUri: string, documentType: string = 'id_front'): Promise<ApiResponse<any>> {
  const multipartResult = await uploadImageMultipart('/api/upload/document', token, photoUri, { document_type: documentType });
  if (multipartResult.success) return multipartResult;

  try {
    const imageBase64 = await readImageAsBase64(photoUri);
    const response = await apiFetch('/api/upload/document-base64', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: imageBase64,
        filename: photoUri.split('/').pop() || 'document.jpg',
        content_type: getImageMimeType(photoUri),
        document_type: documentType,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: getApiErrorMessage(data, 'Failed to upload document') };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' };
  }
}

export async function uploadSelfiePhoto(token: string, photoUri: string): Promise<ApiResponse<any>> {
  const multipartResult = await uploadImageMultipart('/api/upload/selfie', token, photoUri);
  if (multipartResult.success) return multipartResult;

  try {
    const imageBase64 = await readImageAsBase64(photoUri);
    const response = await apiFetch('/api/upload/selfie-base64', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: imageBase64,
        filename: photoUri.split('/').pop() || 'selfie.jpg',
        content_type: getImageMimeType(photoUri),
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: getApiErrorMessage(data, 'Failed to upload selfie') };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' };
  }
}

export async function submitLivenessVerification(userId: string, livenessScore: number, verified: boolean): Promise<ApiResponse<any>> {
  try {
    const response = await apiFetch('/api/kyc/liveness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        liveness_score: livenessScore,
        verified,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: getApiErrorMessage(data, 'Liveness verification failed') };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' };
  }
}

export async function generateCreditScore(token: string): Promise<ApiResponse<any>> {
  try {
    const response = await apiFetch('/api/credit-score/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: getApiErrorMessage(data, 'Failed to generate credit score') };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' };
  }
}

async function authenticatedJsonRequest(
  path: string,
  token: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, any>
): Promise<ApiResponse<any>> {
  try {
    const response = await apiFetch(path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = response.status === 204 ? {} : await response.json();

    if (!response.ok) {
      return { success: false, error: getApiErrorMessage(data, 'Request failed') };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' };
  }
}

export type SaleRecordInput = {
  amount: number;
  payment_method: 'cash' | 'mobile' | string;
  item_note?: string;
  category?: string;
  customer_name?: string;
};

export type ExpenseRecordInput = {
  amount: number;
  category: string;
  note?: string;
  payment_method?: string;
};

export type StockRecordInput = {
  item_name: string;
  supplier?: string;
  quantity: number;
  unit?: string;
  purchase_cost: number;
};

export async function getRecordsSummary(token: string): Promise<ApiResponse<any>> {
  return authenticatedJsonRequest('/api/records/summary', token);
}

export async function createSaleRecord(token: string, payload: SaleRecordInput): Promise<ApiResponse<any>> {
  return authenticatedJsonRequest('/api/records/sales', token, 'POST', payload);
}

export async function listSaleRecords(token: string): Promise<ApiResponse<any[]>> {
  return authenticatedJsonRequest('/api/records/sales', token);
}

export async function createExpenseRecord(token: string, payload: ExpenseRecordInput): Promise<ApiResponse<any>> {
  return authenticatedJsonRequest('/api/records/expenses', token, 'POST', payload);
}

export async function listExpenseRecords(token: string): Promise<ApiResponse<any[]>> {
  return authenticatedJsonRequest('/api/records/expenses', token);
}

export async function createStockRecord(token: string, payload: StockRecordInput): Promise<ApiResponse<any>> {
  return authenticatedJsonRequest('/api/records/stock', token, 'POST', payload);
}

export async function listStockRecords(token: string): Promise<ApiResponse<any[]>> {
  return authenticatedJsonRequest('/api/records/stock', token);
}

export async function verifyReceiptPhoto(
  token: string,
  photoUri: string,
  metadata: { supplier?: string; amount?: number } = {}
): Promise<ApiResponse<any>> {
  try {
    const imageBase64 = await readImageAsBase64(photoUri);
    return authenticatedJsonRequest('/api/receipts/verify-base64', token, 'POST', {
      image_base64: imageBase64,
      filename: photoUri.split('/').pop() || 'receipt.jpg',
      content_type: getImageMimeType(photoUri),
      ...metadata,
    });
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' };
  }
}

export async function verifyReceiptManual(
  token: string,
  metadata: { supplier?: string; amount?: number; receipt_date?: string } = {}
): Promise<ApiResponse<any>> {
  return authenticatedJsonRequest('/api/receipts/manual', token, 'POST', metadata);
}

export async function listReceiptVerifications(token: string): Promise<ApiResponse<any[]>> {
  return authenticatedJsonRequest('/api/receipts/history', token);
}

export async function getTrustScore(token: string): Promise<ApiResponse<any>> {
  return authenticatedJsonRequest('/api/trust-score', token);
}

export async function getStatistics(token: string, period: 'weekly' | 'monthly' | 'annual' = 'weekly'): Promise<ApiResponse<any>> {
  return authenticatedJsonRequest(`/api/statistics?period=${period}`, token);
}

export async function getPredictions(token: string): Promise<ApiResponse<any>> {
  return authenticatedJsonRequest('/api/predictions', token);
}

export async function getPreferences(token: string): Promise<ApiResponse<any>> {
  return authenticatedJsonRequest('/api/preferences', token);
}

export async function updatePreferences(token: string, payload: Record<string, any>): Promise<ApiResponse<any>> {
  return authenticatedJsonRequest('/api/preferences', token, 'PUT', payload);
}

export async function updateProfile(token: string, payload: Record<string, any>): Promise<ApiResponse<any>> {
  return authenticatedJsonRequest('/api/profile', token, 'PUT', payload);
}

export async function markNotificationRead(token: string, notificationId: string): Promise<ApiResponse<any>> {
  return authenticatedJsonRequest(`/api/notifications/${notificationId}/read`, token, 'POST');
}

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'cub_auth_token';
const USER_KEY = 'cub_user_data';

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return window.localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function saveAuthToken(token: string): Promise<void> {
  await setItem(TOKEN_KEY, token);
}

export async function getAuthToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

export async function removeAuthToken(): Promise<void> {
  await deleteItem(TOKEN_KEY);
}

export async function saveUserData(userData: any): Promise<void> {
  await setItem(USER_KEY, JSON.stringify(userData));
}

export async function getUserData(): Promise<any | null> {
  const data = await getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export async function removeUserData(): Promise<void> {
  await deleteItem(USER_KEY);
}

export async function logout(): Promise<void> {
  await removeAuthToken();
  await removeUserData();
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getAuthToken()) !== null;
}

import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'mboatrust_auth_token';
const USER_KEY = 'mboatrust_user_data';

export async function saveAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveUserData(userData: any): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
}

export async function getUserData(): Promise<any | null> {
  const data = await SecureStore.getItemAsync(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export async function removeUserData(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function logout(): Promise<void> {
  await removeAuthToken();
  await removeUserData();
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getAuthToken()) !== null;
}

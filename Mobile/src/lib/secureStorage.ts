import * as SecureStore from 'expo-secure-store';

// Mobile equivalent of the sessionStorage 'access_token' key used by the web
// app's userSlice (see Client/src/store/userSlice.ts). expo-secure-store is
// the recommended place to persist auth tokens on-device.
const ACCESS_TOKEN_KEY = 'access_token';

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}

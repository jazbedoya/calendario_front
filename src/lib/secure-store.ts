import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
} as const;

const isNative = Platform.OS !== "web";

async function getItem(key: string): Promise<string | null> {
  if (isNative) return SecureStore.getItemAsync(key);
  return localStorage.getItem(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isNative) { await SecureStore.setItemAsync(key, value); return; }
  localStorage.setItem(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (isNative) { await SecureStore.deleteItemAsync(key); return; }
  localStorage.removeItem(key);
}

export const secureStore = {
  async get(key: string): Promise<string | null> {
    return getItem(key);
  },
  async set(key: string, value: string): Promise<void> {
    await setItem(key, value);
  },
  async delete(key: string): Promise<void> {
    await deleteItem(key);
  },
  async getAccessToken(): Promise<string | null> {
    return getItem(KEYS.ACCESS_TOKEN);
  },
  async setAccessToken(token: string): Promise<void> {
    await setItem(KEYS.ACCESS_TOKEN, token);
  },
  async getRefreshToken(): Promise<string | null> {
    return getItem(KEYS.REFRESH_TOKEN);
  },
  async setRefreshToken(token: string): Promise<void> {
    await setItem(KEYS.REFRESH_TOKEN, token);
  },
  async clearTokens(): Promise<void> {
    await Promise.all([
      deleteItem(KEYS.ACCESS_TOKEN),
      deleteItem(KEYS.REFRESH_TOKEN),
    ]);
  },
};

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage may be full or disabled
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Both failed
    }
  }
}

async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      // Both failed
    }
  }
}

export const storage = { getItem, setItem, removeItem };

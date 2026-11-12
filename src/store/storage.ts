import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';
import * as Crypto from 'expo-crypto';

export const persistStorage = createJSONStorage(() => AsyncStorage);

export function uuid(): string {
  try {
    return Crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function nowISO(): string {
  return new Date().toISOString();
}

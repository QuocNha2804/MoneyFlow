import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';

/** Băm SHA-256 cho mật khẩu / mã PIN (không lưu dạng plain-text) */
export async function hashSecret(raw: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
}

export async function verifySecret(raw: string, hash: string): Promise<boolean> {
  const digest = await hashSecret(raw);
  return digest === hash;
}

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;
    return await LocalAuthentication.isEnrolledAsync();
  } catch {
    return false;
  }
}

export async function authenticateBiometric(promptMessage = 'Xác thực để mở khóa MoneyFlow'): Promise<boolean> {
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Dùng mã PIN',
      fallbackLabel: 'Dùng mã PIN',
      disableDeviceFallback: false,
    });
    return res.success;
  } catch {
    return false;
  }
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

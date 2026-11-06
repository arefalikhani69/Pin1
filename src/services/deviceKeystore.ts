/**
 * AutoPin Pro - Client Device Cryptographic Identity Provider
 *
 * Interfaces with:
 * 1. Native Android Keystore via AndroidSecurityBridge (in Android APK)
 * 2. Web Crypto API (SubtleCrypto ECDSA P-256 non-extractable key) in browser/preview
 *
 * Provides tamper-proof deviceId and challenge signing.
 */

import type { AndroidSecurityBridgeInterface } from './androidSecurity';

const WEB_KEY_STORAGE_KEY = 'autopin_pro_device_keystore_raw_v1';
const WEB_DEVICE_ID_KEY = 'autopin_pro_device_hw_id_v1';

export class DeviceKeystoreClient {
  private static instance: DeviceKeystoreClient;
  private cachedDeviceId: string | null = null;
  private cachedPublicKey: string | null = null;

  private constructor() {}

  public static getInstance(): DeviceKeystoreClient {
    if (!DeviceKeystoreClient.instance) {
      DeviceKeystoreClient.instance = new DeviceKeystoreClient();
    }
    return DeviceKeystoreClient.instance;
  }

  /**
   * Checks if the app is executing inside the native Android container (WebView / APK).
   */
  public isNativeAndroidEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    const isBridgePresent = Boolean(window.AndroidSecurityBridge);
    const isAndroidUA = typeof navigator !== 'undefined' && /Android|ir\.autopin\.pro/i.test(navigator.userAgent);
    return isBridgePresent || isAndroidUA;
  }

  /**
   * Checks if native Android Keystore bridge is present.
   */
  public isNativeKeystoreAvailable(): boolean {
    return Boolean(
      typeof window !== 'undefined' &&
      window.AndroidSecurityBridge &&
      typeof window.AndroidSecurityBridge.getHardwareDeviceId === 'function'
    );
  }

  /**
   * Retrieves deterministic hardware device ID (SHA-256 fingerprint).
   * In Android Native mode, strictly enforces hardware Keystore with zero software fallback.
   */
  public async getDeviceId(): Promise<string> {
    if (this.cachedDeviceId) {
      return this.cachedDeviceId;
    }

    if (this.isNativeAndroidEnvironment()) {
      if (this.isNativeKeystoreAvailable()) {
        const nativeId = window.AndroidSecurityBridge!.getHardwareDeviceId!();
        if (nativeId && nativeId.startsWith('dev_hw_')) {
          this.cachedDeviceId = nativeId;
          return nativeId;
        }
        throw new Error('ماژول سخت‌افزاری Android Keystore در دسترس نیست یا اعتبارسنجی آن ناموفق بود.');
      }
      throw new Error('خطای امنیتی: برنامه در محیط اندروید نیتیو اجرا شده است اما ماژول سخت‌افزاری Android Keystore در دسترس نیست. استفاده از شبیه‌ساز نرم‌افزاری در اندروید مجاز نمی‌باشد.');
    }

    // Web Crypto Fallback for browser preview ONLY
    this.cachedDeviceId = await this.getOrCreateWebDeviceId();
    return this.cachedDeviceId;
  }

  /**
   * Retrieves Base64 encoded public key.
   * In Android Native mode, strictly enforces hardware Keystore with zero software fallback.
   */
  public async getDevicePublicKey(): Promise<string> {
    if (this.cachedPublicKey) {
      return this.cachedPublicKey;
    }

    if (this.isNativeAndroidEnvironment()) {
      if (this.isNativeKeystoreAvailable()) {
        const nativeKey = window.AndroidSecurityBridge!.getDevicePublicKeyBase64!();
        if (nativeKey) {
          this.cachedPublicKey = nativeKey;
          return nativeKey;
        }
        throw new Error('کلید عمومی سخت‌افزاری دستگاه در Android Keystore در دسترس نیست.');
      }
      throw new Error('خطای امنیتی: کلید سخت‌افزاری دستگاه در محیط اندروید در دسترس نیست.');
    }

    // Web Crypto Fallback for browser preview ONLY
    const pair = await this.getOrCreateWebCryptoPair();
    const exported = await crypto.subtle.exportKey('spki', pair.publicKey);
    const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    this.cachedPublicKey = b64;
    return b64;
  }

  /**
   * Signs a server-provided challenge to prove physical device custody.
   * In Android Native mode, strictly enforces hardware Keystore with zero software fallback.
   */
  public async signChallenge(challenge: string): Promise<string> {
    if (this.isNativeAndroidEnvironment()) {
      if (this.isNativeKeystoreAvailable()) {
        const sig = window.AndroidSecurityBridge!.signDeviceChallenge!(challenge);
        if (sig) return sig;
        throw new Error('امضای دیجیتال چالش با کلید سخت‌افزاری ناموفق بود.');
      }
      throw new Error('خطای امنیتی: امضای چالش امنیتی در اندروید باید منحصراً با سخت‌افزار Keystore انجام شود.');
    }

    // Web Crypto ECDSA signature for browser preview ONLY
    const pair = await this.getOrCreateWebCryptoPair();
    const enc = new TextEncoder();
    const data = enc.encode(challenge);
    const signature = await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      pair.privateKey,
      data
    );

    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  /**
   * Returns human-readable device model string.
   */
  public getDeviceModelInfo(): string {
    if (this.isNativeKeystoreAvailable()) {
      return window.AndroidSecurityBridge!.getDeviceModelInfo!() || 'Android Device';
    }
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Client';
  }

  // --- Web Crypto Fallback Helpers ---
  private async getOrCreateWebDeviceId(): Promise<string> {
    const existing = localStorage.getItem(WEB_DEVICE_ID_KEY);
    if (existing) return existing;

    const pair = await this.getOrCreateWebCryptoPair();
    const exported = await crypto.subtle.exportKey('spki', pair.publicKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', exported);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
    const id = `dev_web_${hex}`;
    localStorage.setItem(WEB_DEVICE_ID_KEY, id);
    return id;
  }

  private webCryptoPair: CryptoKeyPair | null = null;

  private async getOrCreateWebCryptoPair(): Promise<CryptoKeyPair> {
    if (this.webCryptoPair) return this.webCryptoPair;

    // Generate non-extractable ECDSA P-256 keypair
    const pair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false, // non-extractable private key
      ['sign', 'verify']
    );

    this.webCryptoPair = pair;
    return pair;
  }
}

export const deviceKeystore = DeviceKeystoreClient.getInstance();

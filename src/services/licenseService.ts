/**
 * AutoPin Pro - Client License Validation & Offline Lease Engine
 *
 * Enforces:
 * 1. 1-Year license duration validation.
 * 2. Hardware Keystore device binding (anti-cloning).
 * 3. Max 7-day offline usage with signed cryptographic lease token.
 * 4. Anti-Clock Tampering (prevents bypassing license by rewinding device clock).
 * 5. Monotonic timestamp verification.
 */

import {
  LicenseRecord,
  LicenseRequestRecord,
  OfflineLeaseToken,
  ClientLicenseValidationResult
} from '../types/license';
import { deviceKeystore } from './deviceKeystore';
import { verifyLeaseTokenSignature } from './licenseVerificationKey';
import { functionsInstance } from './firebase';
import { httpsCallable } from 'firebase/functions';

const STORAGE_KEYS = {
  ACTIVE_LICENSE: 'autopin_license_active_record_v1',
  OFFLINE_LEASE: 'autopin_license_offline_lease_v1',
  LAST_KNOWN_SERVER_TIME: 'autopin_license_last_server_time_v1',
  LAST_RECORDED_DEVICE_TIME: 'autopin_license_last_device_time_v1',
  REQUEST_TOKEN: 'autopin_license_pending_request_v1'
};

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const MAX_OFFLINE_GRACE_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days

export class LicenseService {
  private static instance: LicenseService;

  private constructor() {}

  public static getInstance(): LicenseService {
    if (!LicenseService.instance) {
      LicenseService.instance = new LicenseService();
    }
    return LicenseService.instance;
  }

  /**
   * Evaluates the current license status on the device.
   * Works both online and offline (up to 7 days).
   */
  public async validateCurrentLicense(): Promise<ClientLicenseValidationResult> {
    const currentDeviceId = await deviceKeystore.getDeviceId();
    const storedLicense = this.getStoredLicense();
    const storedLease = this.getStoredOfflineLease();

    if (!storedLicense) {
      return {
        isValid: false,
        status: 'no_license',
        messageFa: 'لایسنس فعالی برای این دستگاه یافت نشد. لطفاً کد فعال‌سازی را وارد نمایید.',
        currentDeviceId
      };
    }

    // 1. Device Binding Integrity Check (Anti-Cloning)
    if (storedLicense.boundDeviceId !== currentDeviceId) {
      return {
        isValid: false,
        licenseId: storedLicense.id,
        status: 'unbound_device',
        messageFa: 'این لایسنس به دستگاه دیگری متصل شده است و بر روی این سخت‌افزار معتبر نیست.',
        boundDeviceId: storedLicense.boundDeviceId,
        currentDeviceId
      };
    }

    // 2. Cryptographic Offline Lease Signature Verification (Anti-Tampering)
    if (storedLease) {
      if (storedLease.deviceId !== currentDeviceId || storedLease.licenseId !== storedLicense.id) {
        return {
          isValid: false,
          licenseId: storedLicense.id,
          status: 'unbound_device',
          messageFa: 'توکن مجوز آفلاین به دستگاه یا لایسنس دیگری تعلق دارد.',
          boundDeviceId: storedLicense.boundDeviceId,
          currentDeviceId
        };
      }

      const isSignatureValid = await verifyLeaseTokenSignature(
        storedLease.licenseId,
        storedLease.deviceId,
        storedLease.issuedAtServer,
        storedLease.validUntilServer,
        storedLease.licenseExpiresAt,
        storedLease.signature
      );

      if (!isSignatureValid) {
        return {
          isValid: false,
          licenseId: storedLicense.id,
          status: 'revoked',
          messageFa: 'امضای دیجیتال مجوز آفلاین دستکاری شده یا نامعتبر است. دسترسی موقت لغو شد.',
          boundDeviceId: storedLicense.boundDeviceId,
          currentDeviceId
        };
      }
    }

    // 3. Block / Revocation Check
    if (storedLicense.isBlocked || storedLicense.status === 'revoked' || storedLicense.status === 'suspended') {
      return {
        isValid: false,
        licenseId: storedLicense.id,
        status: 'revoked',
        messageFa: storedLicense.blockReason || 'این لایسنس توسط پشتیبانی یا سیستم امنیتی مسدود شده است.',
        boundDeviceId: storedLicense.boundDeviceId,
        currentDeviceId
      };
    }

    // 3. Monotonic Clock Tampering Detection
    const now = Date.now();
    const lastKnownServerTime = this.getLastKnownServerTime();
    const lastRecordedDeviceTime = this.getLastRecordedDeviceTime();

    // A) Cryptographic check against server token issuance time (clock rewound to before issuance)
    if (storedLease && storedLease.issuedAtServer > 0 && now < storedLease.issuedAtServer - (5 * 60 * 1000)) {
      return {
        isValid: false,
        licenseId: storedLicense.id,
        status: 'clock_tampered',
        isClockTampered: true,
        messageFa: 'تاریخ یا ساعت گوشی عقب کشیده شده است. لطفاً تاریخ دستگاه را به حالت خودکار تنظیم کنید.',
        boundDeviceId: storedLicense.boundDeviceId,
        currentDeviceId
      };
    }

    // B) Monotonic server time regression
    if (lastKnownServerTime > 0 && now < lastKnownServerTime - (5 * 60 * 1000)) {
      return {
        isValid: false,
        licenseId: storedLicense.id,
        status: 'clock_tampered',
        isClockTampered: true,
        messageFa: 'تاریخ یا ساعت گوشی تغییر یافته است. لطفاً تاریخ دستگاه را به حالت خودکار شبکه تنظیم کنید.',
        boundDeviceId: storedLicense.boundDeviceId,
        currentDeviceId
      };
    }

    // C) Monotonic local device time regression
    if (lastRecordedDeviceTime > 0 && now < lastRecordedDeviceTime - (5 * 60 * 1000)) {
      return {
        isValid: false,
        licenseId: storedLicense.id,
        status: 'clock_tampered',
        isClockTampered: true,
        messageFa: 'دستکاری در ساعت آفلاین گوشی شناسایی شد. لطفاً به اینترنت متصل شوید.',
        boundDeviceId: storedLicense.boundDeviceId,
        currentDeviceId
      };
    }

    // D) Cryptographically-signed offline lease expiration check
    if (storedLease && storedLease.validUntilServer > 0 && now > storedLease.validUntilServer) {
      return {
        isValid: false,
        licenseId: storedLicense.id,
        status: 'valid_offline_grace',
        messageFa: 'اعتبار توکن مجوز آفلاین منقضی شده است. لطفاً جهت همگام‌سازی، به اینترنت متصل شوید.',
        offlineDaysRemaining: 0,
        expiresAt: storedLicense.expiresAt,
        daysRemaining: Math.max(0, Math.ceil((storedLicense.expiresAt - now) / (24 * 60 * 60 * 1000))),
        boundDeviceId: storedLicense.boundDeviceId,
        currentDeviceId
      };
    }

    // 4. Global Expiration Check
    if (now >= storedLicense.expiresAt) {
      return {
        isValid: false,
        licenseId: storedLicense.id,
        status: 'expired',
        expiresAt: storedLicense.expiresAt,
        daysRemaining: 0,
        messageFa: 'اعتبار یک‌ساله لایسنس شما به پایان رسیده است. جهت تمدید با پشتیبانی تماس بگیرید.',
        boundDeviceId: storedLicense.boundDeviceId,
        currentDeviceId
      };
    }

    // 5. Offline Lease Grace Check (Max 7 days without online server verification)
    const timeSinceLastCheck = now - (storedLicense.lastOnlineCheckAt || storedLicense.startsAt);
    const offlineDaysRemaining = Math.max(0, Math.ceil((MAX_OFFLINE_GRACE_MS - timeSinceLastCheck) / (24 * 60 * 60 * 1000)));

    if (timeSinceLastCheck > MAX_OFFLINE_GRACE_MS) {
      return {
        isValid: false,
        licenseId: storedLicense.id,
        status: 'valid_offline_grace',
        messageFa: 'مهلت ۷ روزه استفاده آفلاین به پایان رسیده است. جهت اعتبارسنجی آنلاین، به اینترنت متصل شوید.',
        offlineDaysRemaining: 0,
        expiresAt: storedLicense.expiresAt,
        daysRemaining: Math.ceil((storedLicense.expiresAt - now) / (24 * 60 * 60 * 1000)),
        boundDeviceId: storedLicense.boundDeviceId,
        currentDeviceId
      };
    }

    // Update monotonic time checkpoints
    this.recordServerTime(now);
    this.recordDeviceTime(now);

    const daysRemaining = Math.ceil((storedLicense.expiresAt - now) / (24 * 60 * 60 * 1000));

    return {
      isValid: true,
      licenseId: storedLicense.id,
      status: timeSinceLastCheck < (24 * 60 * 60 * 1000) ? 'valid_online' : 'valid_offline_grace',
      messageFa: `لایسنس معتبر است (${daysRemaining} روز اعتبار باقی‌مانده).`,
      expiresAt: storedLicense.expiresAt,
      daysRemaining,
      offlineDaysRemaining,
      boundDeviceId: storedLicense.boundDeviceId,
      currentDeviceId
    };
  }

  /**
   * Saves or updates authoritative license record locally.
   */
  public storeLicense(license: LicenseRecord, lease?: OfflineLeaseToken): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_LICENSE, JSON.stringify(license));
    if (lease) {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_LEASE, JSON.stringify(lease));
    }
    if (license.lastOnlineCheckAt) {
      this.recordServerTime(license.lastOnlineCheckAt);
    }
  }

  public getStoredLicense(): LicenseRecord | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_LICENSE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public getStoredOfflineLease(): OfflineLeaseToken | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_LEASE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public clearLicense(): void {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_LICENSE);
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_LEASE);
  }

  private getLastKnownServerTime(): number {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_KNOWN_SERVER_TIME);
    return raw ? parseInt(raw, 10) : 0;
  }

  public recordServerTime(serverTimeMs: number): void {
    const current = this.getLastKnownServerTime();
    if (serverTimeMs > current) {
      localStorage.setItem(STORAGE_KEYS.LAST_KNOWN_SERVER_TIME, serverTimeMs.toString());
    }
  }

  private getLastRecordedDeviceTime(): number {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_RECORDED_DEVICE_TIME);
    return raw ? parseInt(raw, 10) : 0;
  }

  public recordDeviceTime(deviceTimeMs: number): void {
    const current = this.getLastRecordedDeviceTime();
    if (deviceTimeMs > current) {
      localStorage.setItem(STORAGE_KEYS.LAST_RECORDED_DEVICE_TIME, deviceTimeMs.toString());
    }
  }

  /**
   * Translates Firebase Functions errors into user-friendly Persian error messages.
   */
  public mapFirebaseErrorToFa(err: any): string {
    const code = err?.code || '';
    const message = err?.message || '';

    if (code.includes('resource-exhausted') || message.includes('تعداد تلاش‌های ناموفق')) {
      return message || 'تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر مجدداً تلاش کنید.';
    }
    if (code.includes('not-found') || message.includes('معتبر نمی‌باشد')) {
      return 'کد فعال‌سازی وارد شده نامعتبر است یا در سیستم یافت نشد.';
    }
    if (code.includes('already-exists') || message.includes('قبلاً روی دستگاه دیگری')) {
      return 'این کد فعال‌سازی قبلاً روی دستگاه دیگری متصل شده است و امکان استفاده هم‌زمان ندارد.';
    }
    if (code.includes('permission-denied') || message.includes('امضای دیجیتال')) {
      return message || 'امضای دیجیتال یا احراز هویت دستگاه مورد تایید سرور قرار نگرفت.';
    }
    if (code.includes('failed-precondition')) {
      return message || 'این لایسنس مسدود یا منقضی شده است.';
    }
    if (code.includes('deadline-exceeded')) {
      return 'مهلت اعتبار لایسنس به پایان رسیده است.';
    }
    if (code.includes('unavailable') || code.includes('network')) {
      return 'ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید.';
    }
    return message || 'خطایی در ارتباط با سرور رخ داده است. لطفاً مجدداً تلاش کنید.';
  }

  /**
   * End-to-End Online Activation via Firebase Cloud Functions.
   * Zero-Trust Hardware Challenge-Response Handshake:
   * 1. Requests fresh 32-byte nonce from server
   * 2. Signs nonce via Android Keystore hardware private key
   * 3. Sends rawKey + signature + devicePublicKey to activateLicense
   * 4. Receives 7-day signed offline lease and stores it locally.
   */
  public async activateWithServer(rawActivationKey: string): Promise<ClientLicenseValidationResult> {
    try {
      const deviceId = await deviceKeystore.getDeviceId();
      const devicePublicKey = await deviceKeystore.getDevicePublicKey();
      const deviceModel = deviceKeystore.getDeviceModelInfo();
      const isWebClient = !deviceKeystore.isNativeAndroidEnvironment();

      // Step 1: Request single-use challenge from server
      const requestChallengeFn = httpsCallable<{
        deviceId: string;
        devicePublicKey: string;
        isWebClient: boolean;
      }, { challenge: string; expiresAt: number }>(functionsInstance, 'requestDeviceChallenge');

      const challengeRes = await requestChallengeFn({
        deviceId,
        devicePublicKey,
        isWebClient
      });

      const { challenge } = challengeRes.data;

      // Step 2: Sign challenge using hardware Keystore
      const signature = await deviceKeystore.signChallenge(challenge);

      // Step 3: Call activateLicense
      const activateLicenseFn = httpsCallable<{
        activationKey: string;
        devicePublicKey: string;
        challenge: string;
        signature: string;
        deviceModel: string;
        isWebClient: boolean;
      }, {
        success: boolean;
        license: LicenseRecord;
        leaseToken: OfflineLeaseToken;
      }>(functionsInstance, 'activateLicense');

      const activationRes = await activateLicenseFn({
        activationKey: rawActivationKey,
        devicePublicKey,
        challenge,
        signature,
        deviceModel,
        isWebClient
      });

      const { license, leaseToken } = activationRes.data;

      // Step 4: Persist authoritative records locally
      this.storeLicense(license, leaseToken);

      return await this.validateCurrentLicense();
    } catch (err: any) {
      const errorMsg = this.mapFirebaseErrorToFa(err);
      return {
        isValid: false,
        status: 'invalid_signature',
        messageFa: errorMsg,
        currentDeviceId: await deviceKeystore.getDeviceId().catch(() => 'unknown')
      };
    }
  }

  /**
   * Online Handshake & Offline Lease Renewal via Firebase Cloud Functions.
   * Keeps the 7-day offline rolling window fresh whenever connected to the internet.
   */
  public async verifyWithServer(): Promise<ClientLicenseValidationResult> {
    const storedLicense = this.getStoredLicense();
    if (!storedLicense) {
      return {
        isValid: false,
        status: 'no_license',
        messageFa: 'هیچ لایسنسی برای استعلام آنلاین یافت نشد.',
        currentDeviceId: await deviceKeystore.getDeviceId().catch(() => 'unknown')
      };
    }

    try {
      const deviceId = await deviceKeystore.getDeviceId();
      const devicePublicKey = await deviceKeystore.getDevicePublicKey();
      const isWebClient = !deviceKeystore.isNativeAndroidEnvironment();

      // Step 1: Request challenge
      const requestChallengeFn = httpsCallable<{
        deviceId: string;
        devicePublicKey: string;
        isWebClient: boolean;
      }, { challenge: string; expiresAt: number }>(functionsInstance, 'requestDeviceChallenge');

      const challengeRes = await requestChallengeFn({
        deviceId,
        devicePublicKey,
        isWebClient
      });

      const { challenge } = challengeRes.data;

      // Step 2: Hardware sign
      const signature = await deviceKeystore.signChallenge(challenge);

      // Step 3: Call verifyLicense
      const verifyLicenseFn = httpsCallable<{
        licenseId: string;
        challenge: string;
        signature: string;
        devicePublicKey: string;
        isWebClient: boolean;
      }, {
        isValid: boolean;
        license: LicenseRecord;
        leaseToken: OfflineLeaseToken;
      }>(functionsInstance, 'verifyLicense');

      const verifyRes = await verifyLicenseFn({
        licenseId: storedLicense.id,
        challenge,
        signature,
        devicePublicKey,
        isWebClient
      });

      const { license, leaseToken } = verifyRes.data;
      this.storeLicense(license, leaseToken);

      return await this.validateCurrentLicense();
    } catch (err: any) {
      // In case of network error, fallback to offline validation
      console.warn('Online license verification failed, falling back to local validation:', err);
      return await this.validateCurrentLicense();
    }
  }

  /**
   * Generates formatted activation request payload with hardware Keystore binding.
   */
  public async prepareActivationRequest(userEmail?: string, notes?: string): Promise<Omit<LicenseRequestRecord, 'id'>> {
    const deviceId = await deviceKeystore.getDeviceId();
    const devicePublicKey = await deviceKeystore.getDevicePublicKey();
    const deviceModel = deviceKeystore.getDeviceModelInfo();

    const requestToken = `REQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    return {
      requestToken,
      deviceId,
      devicePublicKey,
      requestedAt: Date.now(),
      status: 'pending',
      userEmail,
      deviceModel,
      notes
    };
  }
}

export const licenseService = LicenseService.getInstance();

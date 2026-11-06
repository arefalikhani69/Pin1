/**
 * AutoPin Pro - License & Device Security Architecture Types
 * Pure independent module for 1-year cryptographic licensing and Android Keystore binding.
 */

export type LicenseDuration = '1m' | '3m' | '6m' | '1y' | 'lifetime';

export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'suspended';

export type DeviceStatus = 'trusted' | 'blacklisted' | 'pending';

export type LicenseRequestStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled';

export type LicenseAuditAction =
  | 'issue'
  | 'activate'
  | 'renew'
  | 'revoke'
  | 'transfer'
  | 'verify'
  | 'block';

export interface LicenseRequestRecord {
  id: string;
  requestToken: string;
  deviceId: string;
  devicePublicKey: string;
  requestedAt: number; // Unix timestamp ms
  status: LicenseRequestStatus;
  userId?: string;
  userEmail?: string;
  notes?: string;
  deviceModel?: string;
}

export interface LicenseRecord {
  id: string; // Document ID (e.g., "lic_1730000000_abc")
  activationKey: string; // Formatted 16-char code (e.g., "AUTO-PIN1-YEAR-2026")
  userId?: string; // Bound Firebase Auth User UID
  userEmail?: string;
  boundDeviceId: string; // SHA-256 fingerprint of hardware Keystore public key
  issuedAt: number; // Unix timestamp ms
  startsAt: number; // Effective start time
  expiresAt: number; // Effective expiration time (startsAt + 365 days)
  duration: LicenseDuration; // Currently '1y'
  status: LicenseStatus;
  lastOnlineCheckAt: number;
  isBlocked: boolean;
  blockReason?: string;
  maxOfflineDays: number; // Default: 7 days
}

export interface DeviceRecord {
  deviceId: string; // Unique hash derived from Android Keystore public key
  devicePublicKey: string; // Base64 DER encoded public key from Hardware TEE/Keystore
  firstBoundAt: number;
  licenseId?: string;
  status: DeviceStatus;
  deviceModel?: string;
  androidVersion?: string;
  lastIp?: string;
  lastHandshakeAt?: number;
}

export interface LicenseAuditLogRecord {
  id: string;
  action: LicenseAuditAction;
  adminId?: string;
  adminEmail?: string;
  userId?: string;
  timestamp: number;
  details: string;
  targetId: string; // licenseId, deviceId, or requestId
  ip?: string;
}

/**
 * Cryptographic Offline Lease Token
 * Signed by Firebase Cloud Functions private key / secret HMAC.
 * Valid for at most 7 days of offline usage without server contact.
 */
export interface OfflineLeaseToken {
  licenseId: string;
  deviceId: string;
  userId?: string;
  issuedAtServer: number; // Authoritative server timestamp ms
  validUntilServer: number; // issuedAtServer + (7 * 24 * 60 * 60 * 1000)
  licenseExpiresAt: number; // Global license expiration timestamp
  signature: string; // HMAC-SHA256 signature calculated on server
}

/**
 * Client validation state evaluated at runtime
 */
export interface ClientLicenseValidationResult {
  isValid: boolean;
  licenseId?: string;
  status: 'valid_online' | 'valid_offline_grace' | 'expired' | 'revoked' | 'unbound_device' | 'clock_tampered' | 'no_license' | 'invalid_signature';
  messageFa: string;
  expiresAt?: number;
  daysRemaining?: number;
  offlineDaysRemaining?: number;
  boundDeviceId?: string;
  currentDeviceId?: string;
  isClockTampered?: boolean;
}

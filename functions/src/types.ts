export type AdminRole = 'super_admin' | 'admin' | 'support';

export type AdminPermission =
  | 'manage_admins'
  | 'issue_license'
  | 'renew_license'
  | 'revoke_license'
  | 'transfer_license'
  | 'review_requests'
  | 'view_requests'
  | 'view_audit_logs'
  | 'view_licenses'
  | 'view_devices';


export interface VerifiedAdminContext {
  uid: string;
  email: string;
  role: AdminRole;
}

export interface SecurityAuditLogRecord {
  actorUid: string;
  actorRole: AdminRole;
  actorEmail?: string;
  action: string;
  targetId: string;
  timestamp: number;
  result: 'success' | 'failure';
  details?: string;
  metadata?: Record<string, unknown>;
  adminId?: string; // Phase 1 compatibility
  adminEmail?: string; // Phase 1 compatibility
}

export type LicenseDuration = '1m' | '3m' | '6m' | '1y' | 'lifetime';
export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'suspended';
export type DeviceStatus = 'trusted' | 'blacklisted' | 'pending';
export type LicenseRequestStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled';


export interface LicenseRecord {
  id: string;
  activationKeyHash: string; // SHA-256 hash of normalized activation key (never stored in plaintext)
  keyHint: string; // Masked representation for identification, e.g. "APRO-****-****-1Y"
  userId?: string;
  userEmail?: string;
  boundDeviceId: string;
  issuedAt: number;
  startsAt: number;
  expiresAt: number;
  duration: LicenseDuration;
  status: LicenseStatus;
  lastOnlineCheckAt: number;
  isBlocked: boolean;
  blockReason?: string;
  maxOfflineDays: number;
}

export interface DeviceRecord {
  deviceId: string;
  devicePublicKey: string;
  firstBoundAt: number;
  licenseId?: string;
  status: DeviceStatus;
  deviceModel?: string;
  lastIp?: string;
  lastHandshakeAt?: number;
  isWebClient?: boolean;
}

export interface OfflineLeaseToken {
  licenseId: string;
  deviceId: string;
  userId?: string;
  issuedAtServer: number;
  validUntilServer: number;
  licenseExpiresAt: number;
  signature: string; // ECDSA P-256 signature Base64
}

export interface DeviceChallengeRecord {
  challenge: string;
  devicePublicKey: string;
  createdAt: number;
  expiresAt: number;
  userId?: string;
}

export interface LicenseAttemptLimitRecord {
  identifier: string; // IP or userId
  failedAttempts: number;
  lockedUntil: number;
  lastAttemptAt: number;
}

export interface TransferDevicePayload {
  licenseId: string;
  newDevicePublicKey: string;
  challenge: string;
  signature: string;
  newDeviceModel?: string;
  reason?: string;
  isWebClient?: boolean;
}

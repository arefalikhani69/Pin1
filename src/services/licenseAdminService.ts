/**
 * AutoPin Pro - License Administration Service (Phase 1: Real-time Read-only)
 *
 * Provides real-time subscriptions and snapshot queries to Firestore collections:
 * - `licenses`
 * - `devices`
 * - `licenseRequests`
 * - `licenseAuditLogs`
 * - `admins`
 * - `system_config/bootstrap`
 *
 * NOTE: Phase 1 is strictly read-only. Action mutations (issuance, transfer, renewal,
 * revocation, role changes) are deferred to Phase 2 and cannot be executed here.
 */

import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import {
  LicenseRecord,
  DeviceRecord,
  LicenseRequestRecord,
  LicenseAuditLogRecord
} from '../types/license';

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

export const ROLE_PERMISSIONS: Record<AdminRole, ReadonlyArray<AdminPermission>> = {
  super_admin: [
    'manage_admins',
    'issue_license',
    'renew_license',
    'revoke_license',
    'transfer_license',
    'review_requests',
    'view_requests',
    'view_audit_logs',
    'view_licenses',
    'view_devices'
  ],
  admin: [
    'issue_license',
    'renew_license',
    'revoke_license',
    'transfer_license',
    'review_requests',
    'view_requests',
    'view_audit_logs',
    'view_licenses',
    'view_devices'
  ],
  support: [
    'view_requests',
    'view_licenses',
    'view_devices'
  ]
};


export function hasAdminPermission(
  role: AdminRole | null | undefined,
  permission: AdminPermission
): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return Boolean(permissions && permissions.includes(permission));
}

export function getRoleBadgeInfo(role: AdminRole | null | undefined): {
  label: string;
  badgeClass: string;
  description: string;
} {
  switch (role) {
    case 'super_admin':
      return {
        label: 'مدیر ارشد (Super Admin)',
        badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
        description: 'دسترسی کامل مدیریتی و انتصاب نقش‌ها'
      };
    case 'admin':
      return {
        label: 'مدیر عملیاتی (Admin)',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        description: 'مدیریت لایسنس‌ها، تمدید، ابطال و انتقال (فاقد امکان مدیریت مدیران)'
      };
    case 'support':
      return {
        label: 'پشتیبان سیستم (Support)',
        badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        description: 'فقط مشاهده لایسنس‌ها، دستگاه‌ها و درخواست‌ها'
      };
    default:
      return {
        label: 'کاربر عادی',
        badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        description: 'فاقد دسترسی مدیریتی'
      };
  }
}

export interface AdminUserRecord {
  uid: string;
  email: string;
  role: AdminRole;
  active: boolean;
  migratedAt?: number;
  createdAt?: number;
  method?: string;
  isCustomClaim?: boolean;
}


export interface LicenseDashboardStats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  blockedLicenses: number;
  pendingRequests: number;
  activeDevices: number;
  totalTransfers: number;
  expiringIn30Days: number;
}

export interface SystemBootstrapConfig {
  completed: boolean;
  completedAt?: number;
  initialAdminEmail?: string;
  initialAdminUid?: string;
  method?: string;
}

class LicenseAdminService {
  private static instance: LicenseAdminService;

  private constructor() {}

  public static getInstance(): LicenseAdminService {
    if (!LicenseAdminService.instance) {
      LicenseAdminService.instance = new LicenseAdminService();
    }
    return LicenseAdminService.instance;
  }

  /**
   * Real-time subscription to aggregate dashboard stats.
   * Efficiently computes operational metrics from Firestore collections.
   */
  public subscribeDashboardStats(
    onUpdate: (stats: LicenseDashboardStats) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    let latestLicenses: LicenseRecord[] = [];
    let latestRequestsCount = 0;
    let latestDevicesCount = 0;
    let latestTransfersCount = 0;

    const recompute = () => {
      const now = Date.now();
      const in30Days = now + 30 * 24 * 60 * 60 * 1000;

      let active = 0;
      let expired = 0;
      let blocked = 0;
      let expiringSoon = 0;

      for (const lic of latestLicenses) {
        if (lic.isBlocked || lic.status === 'revoked' || lic.status === 'suspended') {
          blocked++;
        } else if (lic.expiresAt < now || lic.status === 'expired') {
          expired++;
        } else {
          active++;
          if (lic.expiresAt <= in30Days) {
            expiringSoon++;
          }
        }
      }

      onUpdate({
        totalLicenses: latestLicenses.length,
        activeLicenses: active,
        expiredLicenses: expired,
        blockedLicenses: blocked,
        pendingRequests: latestRequestsCount,
        activeDevices: latestDevicesCount,
        totalTransfers: latestTransfersCount,
        expiringIn30Days: expiringSoon
      });
    };

    const unsubLicenses = onSnapshot(
      collection(db, 'licenses'),
      (snap) => {
        latestLicenses = snap.docs.map((d) => ({
          ...(d.data() as LicenseRecord),
          id: d.id
        }));
        recompute();
      },
      (err) => onError?.(err)
    );

    const unsubRequests = onSnapshot(
      collection(db, 'licenseRequests'),
      (snap) => {
        latestRequestsCount = snap.docs.filter((d) => d.data().status === 'pending').length;
        recompute();
      },
      (err) => onError?.(err)
    );

    const unsubDevices = onSnapshot(
      collection(db, 'devices'),
      (snap) => {
        latestDevicesCount = snap.docs.length;
        recompute();
      },
      (err) => onError?.(err)
    );

    const unsubAudit = onSnapshot(
      collection(db, 'licenseAuditLogs'),
      (snap) => {
        latestTransfersCount = snap.docs.filter((d) => d.data().action === 'transfer').length;
        recompute();
      },
      (err) => onError?.(err)
    );

    return () => {
      unsubLicenses();
      unsubRequests();
      unsubDevices();
      unsubAudit();
    };
  }

  /**
   * Real-time subscription to the `licenses` collection.
   */
  public subscribeLicenses(
    onUpdate: (licenses: LicenseRecord[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const q = query(collection(db, 'licenses'));
    return onSnapshot(
      q,
      (snap) => {
        const list: LicenseRecord[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            activationKey: data.activationKey || data.keyHint || 'AUTO-****-****-****',
            userId: data.userId || '',
            userEmail: data.userEmail || '',
            boundDeviceId: data.boundDeviceId || '',
            issuedAt: data.issuedAt || 0,
            startsAt: data.startsAt || data.issuedAt || 0,
            expiresAt: data.expiresAt || 0,
            duration: data.duration || '1y',
            status: data.status || 'active',
            lastOnlineCheckAt: data.lastOnlineCheckAt || 0,
            isBlocked: Boolean(data.isBlocked),
            blockReason: data.blockReason || '',
            maxOfflineDays: data.maxOfflineDays || 7
          };
        });
        // Sort by issuedAt desc
        list.sort((a, b) => (b.issuedAt || 0) - (a.issuedAt || 0));
        onUpdate(list);
      },
      (err) => onError?.(err)
    );
  }

  /**
   * Real-time subscription to `licenseRequests`.
   */
  public subscribeRequests(
    onUpdate: (requests: LicenseRequestRecord[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const q = query(collection(db, 'licenseRequests'));
    return onSnapshot(
      q,
      (snap) => {
        const list: LicenseRequestRecord[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            requestToken: data.requestToken || d.id,
            deviceId: data.deviceId || '',
            devicePublicKey: data.devicePublicKey || '',
            requestedAt: data.requestedAt || 0,
            status: data.status || 'pending',
            userId: data.userId || '',
            userEmail: data.userEmail || '',
            notes: data.notes || '',
            deviceModel: data.deviceModel || ''
          };
        });
        list.sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
        onUpdate(list);
      },
      (err) => onError?.(err)
    );
  }

  /**
   * Real-time subscription to `devices`.
   */
  public subscribeDevices(
    onUpdate: (devices: DeviceRecord[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const q = query(collection(db, 'devices'));
    return onSnapshot(
      q,
      (snap) => {
        const list: DeviceRecord[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            deviceId: d.id,
            devicePublicKey: data.devicePublicKey || '',
            firstBoundAt: data.firstBoundAt || 0,
            licenseId: data.licenseId || '',
            status: data.status || 'trusted',
            deviceModel: data.deviceModel || '',
            androidVersion: data.androidVersion || '',
            lastIp: data.lastIp || '',
            lastHandshakeAt: data.lastHandshakeAt || data.firstBoundAt || 0
          };
        });
        list.sort((a, b) => (b.lastHandshakeAt || 0) - (a.lastHandshakeAt || 0));
        onUpdate(list);
      },
      (err) => onError?.(err)
    );
  }

  /**
   * Real-time subscription to `licenseAuditLogs`.
   */
  public subscribeAuditLogs(
    onUpdate: (logs: LicenseAuditLogRecord[]) => void,
    maxItems = 150,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'licenseAuditLogs'),
      orderBy('timestamp', 'desc'),
      limit(maxItems)
    );
    return onSnapshot(
      q,
      (snap) => {
        const list: LicenseAuditLogRecord[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            action: data.action || 'verify',
            adminId: data.adminId || '',
            adminEmail: data.adminEmail || '',
            userId: data.userId || '',
            timestamp: data.timestamp || 0,
            details: data.details || '',
            targetId: data.targetId || '',
            ip: data.ip || ''
          };
        });
        onUpdate(list);
      },
      (err) => {
        // Fallback without orderBy if index is still indexing
        const fallbackQ = query(collection(db, 'licenseAuditLogs'), limit(maxItems));
        return onSnapshot(
          fallbackQ,
          (snap) => {
            const list: LicenseAuditLogRecord[] = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                action: data.action || 'verify',
                adminId: data.adminId || '',
                adminEmail: data.adminEmail || '',
                userId: data.userId || '',
                timestamp: data.timestamp || 0,
                details: data.details || '',
                targetId: data.targetId || '',
                ip: data.ip || ''
              };
            });
            list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            onUpdate(list);
          },
          (fErr) => onError?.(fErr || err)
        );
      }
    );
  }

  /**
   * Real-time subscription to `admins` collection.
   */
  public subscribeAdmins(
    onUpdate: (admins: AdminUserRecord[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const q = query(collection(db, 'admins'));
    return onSnapshot(
      q,
      (snap) => {
        const list: AdminUserRecord[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            uid: d.id,
            email: data.email || '',
            role: data.role || 'admin',
            active: data.active !== false,
            migratedAt: data.migratedAt || 0,
            createdAt: data.createdAt || data.migratedAt || 0,
            method: data.method || 'direct_grant'
          };
        });
        onUpdate(list);
      },
      (err) => onError?.(err)
    );
  }

  /**
   * Fetch system bootstrap configuration document.
   */
  public async getSystemBootstrapConfig(): Promise<SystemBootstrapConfig | null> {
    try {
      const snap = await getDoc(doc(db, 'system_config', 'bootstrap'));
      if (snap.exists()) {
        const data = snap.data();
        return {
          completed: Boolean(data.completed),
          completedAt: data.completedAt,
          initialAdminEmail: data.initialAdminEmail,
          initialAdminUid: data.initialAdminUid,
          method: data.method
        };
      }
      return { completed: false };
    } catch (err) {
      console.warn('Could not read system_config/bootstrap:', err);
      return null;
    }
  }
}

export const licenseAdminService = LicenseAdminService.getInstance();

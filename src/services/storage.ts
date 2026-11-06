import {
  Manufacturer,
  Vehicle,
  ECU,
  Connector,
  FuseBox,
  WiringDiagram,
  FavoriteItem,
  RecentVehicle,
  AppImage,
  MediaItem,
  TechnicalDataVersion,
  VersionEntityType,
  VersionOperation,
  FieldDiff,
  PublicationStatus,
  ApprovalEntityType,
  ApprovalItemSummary,
  AppUserProfile,
  AppUserRole,
  AppNotification,
  NotificationType,
  NotificationTarget,
  AuditLogEntry,
  AuditActionType,
  AuditTargetType,
  AuditLogFilterParams,
  UserDisplaySettings,
  DEFAULT_DISPLAY_SETTINGS
} from '../types';
import { deduplicateMediaList, getMediaCanonicalKey } from '../utils/imageDeduplication';
import {
  SEED_MANUFACTURERS,
  SEED_VEHICLES,
  SEED_ECUS,
  SEED_CONNECTORS,
  SEED_FUSEBOXES,
  SEED_WIRING_DIAGRAMS
} from '../data/seedData';

export const SEED_USERS: AppUserProfile[] = [
  {
    id: 'user-master-admin',
    email: 'arefalikhani69@gmail.com',
    displayName: 'مهندس عارف علیخانی (مدیر ارشد سامانه)',
    role: 'admin',
    isActive: true,
    createdAt: 1700000000000,
    lastLoginAt: Date.now(),
    notes: 'حساب مدیر کل و معمار سیستم (Bootstrap Admin)'
  },
  {
    id: 'user-tech-1',
    email: 'tech.rezaei@autopin.ir',
    displayName: 'مهندس رضا رضایی (تکنسین برق خودرو)',
    role: 'technician',
    isActive: true,
    createdAt: 1705000000000,
    lastLoginAt: 1708000000000,
    notes: 'تکنسین عیب‌یابی و پیشنهاد پین‌آوت‌های ECU'
  },
  {
    id: 'user-mechanic-1',
    email: 'mechanic.karimi@gmail.com',
    displayName: 'علی کریمی (کاربر و برق‌کار خودرو)',
    role: 'user',
    isActive: true,
    createdAt: 1708000000000,
    lastLoginAt: 1709500000000,
    notes: 'کاربر آزاد / دسترسی مطالعه اطلاعات منتشرشده'
  }
];

export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-welcome-1',
    type: 'system',
    title: 'به سامانه تخصصی AutoPin Pro خوش آمدید',
    message: 'مرکز نقشه‌های الکتریکی، سوکت‌های ECU، پین‌آوت‌ها و راهنمای فیوز و رله خودروها با دسته‌بندی استاندارد در دسترس شماست.',
    target: 'all',
    isRead: false,
    readByUserIds: [],
    createdAt: Date.now() - 3600000 * 24 * 3,
    priority: 'normal',
    broadcastStatus: 'active',
    uniqueEventKey: 'welcome-announcement'
  },
  {
    id: 'notif-admin-init',
    type: 'approval_pending',
    title: 'سیستم گردش تأیید و انتشار اطلاعات فعال است',
    message: 'تکنسین‌ها و کاربران می‌توانند پیشنهادات فنی را برای بازبینی ارسال کنند. جهت بررسی رکوردها به پنل مدیریت بخش بررسی و تأیید مراجعه نمایید.',
    target: 'admins',
    isRead: false,
    readByUserIds: [],
    createdAt: Date.now() - 3600000 * 14,
    priority: 'high',
    linkEntity: {
      entityType: 'approvals'
    },
    uniqueEventKey: 'admin-approval-system-ready'
  }
];

export const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-seed-1',
    actionType: 'auth_login',
    timestamp: Date.now() - 3600000 * 24 * 2,
    userId: 'user-master-admin',
    userEmail: 'arefalikhani69@gmail.com',
    userRole: 'admin',
    targetType: 'auth',
    targetTitle: 'ورود مدیر ارشد سامانه',
    status: 'success',
    summary: 'ورود موفق مدیر ارشد سیستم و شروع نشست کاری'
  },
  {
    id: 'audit-seed-2',
    actionType: 'technical_publish',
    timestamp: Date.now() - 3600000 * 18,
    userId: 'user-master-admin',
    userEmail: 'arefalikhani69@gmail.com',
    userRole: 'admin',
    targetType: 'ecu',
    targetId: 'bosch-me744-206',
    targetTitle: 'Bosch ME7.4.4',
    status: 'success',
    summary: 'تأیید و انتشار عمومی اطلاعات فنی ECU بوش ME7.4.4 پژو ۲۰۶'
  },
  {
    id: 'audit-seed-3',
    actionType: 'broadcast_create',
    timestamp: Date.now() - 3600000 * 6,
    userId: 'user-master-admin',
    userEmail: 'arefalikhani69@gmail.com',
    userRole: 'admin',
    targetType: 'broadcast',
    targetTitle: 'به سامانه تخصصی AutoPin Pro خوش آمدید',
    status: 'success',
    summary: 'ارسال اعلان عمومی سراسری برای تمام کاربران و تکنسین‌ها'
  }
];

const STORAGE_KEYS = {
  MANUFACTURERS: 'autopin_manufacturers_v1',
  VEHICLES: 'autopin_vehicles_v1',
  ECUS: 'autopin_ecus_v1',
  CONNECTORS: 'autopin_connectors_v1',
  FUSEBOXES: 'autopin_fuseboxes_v1',
  DIAGRAMS: 'autopin_diagrams_v1',
  FAVORITES: 'autopin_favorites_v1',
  RECENT_VEHICLES: 'autopin_recent_vehicles_v1',
  IMAGES: 'autopin_images_v1',
  MEDIA: 'autopin_media_v1',
  ADMIN_PASS: 'autopin_admin_passcode_v1',
  VERSIONS: 'autopin_technical_versions_v1',
  USERS: 'autopin_users_v2',
  NOTIFICATIONS: 'autopin_notifications_v1',
  AUDIT_LOGS: 'autopin_audit_logs_v1'
};

class StorageService {
  private isClient = typeof window !== 'undefined';

  private getItem<T>(key: string, fallback: T): T {
    if (!this.isClient) return fallback;
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data) as T;
    } catch (err) {
      console.warn(`Error reading key ${key} from storage:`, err);
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (!this.isClient) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err: unknown) {
      console.warn(`Error saving key ${key} to storage:`, err);
      // Auto-heal QuotaExceededError by trimming non-critical version snapshots
      const isQuota =
        (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) ||
        (typeof err === 'object' && err !== null && (err as any).name === 'QuotaExceededError');

      if (isQuota) {
        try {
          const versions = this.getItem<any[]>(STORAGE_KEYS.VERSIONS, []);
          if (versions.length > 8) {
            localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(versions.slice(0, 8)));
          }
          localStorage.setItem(key, JSON.stringify(value));
        } catch {
          // ignore
        }
      }
    }
  }

  // Initialize seed database on first visit
  public initDatabase(): void {
    if (!this.isClient) return;
    if (!localStorage.getItem(STORAGE_KEYS.MANUFACTURERS)) {
      this.setItem(STORAGE_KEYS.MANUFACTURERS, SEED_MANUFACTURERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.VEHICLES)) {
      this.setItem(STORAGE_KEYS.VEHICLES, SEED_VEHICLES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ECUS)) {
      this.setItem(STORAGE_KEYS.ECUS, SEED_ECUS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONNECTORS)) {
      this.setItem(STORAGE_KEYS.CONNECTORS, SEED_CONNECTORS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.FUSEBOXES)) {
      this.setItem(STORAGE_KEYS.FUSEBOXES, SEED_FUSEBOXES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DIAGRAMS)) {
      this.setItem(STORAGE_KEYS.DIAGRAMS, SEED_WIRING_DIAGRAMS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ADMIN_PASS)) {
      this.setItem(STORAGE_KEYS.ADMIN_PASS, '1234');
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.setItem(STORAGE_KEYS.USERS, SEED_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    }
  }

  // Reset database back to default factory seed data
  public resetToFactory(): void {
    if (!this.isClient) return;
    this.setItem(STORAGE_KEYS.MANUFACTURERS, SEED_MANUFACTURERS);
    this.setItem(STORAGE_KEYS.VEHICLES, SEED_VEHICLES);
    this.setItem(STORAGE_KEYS.ECUS, SEED_ECUS);
    this.setItem(STORAGE_KEYS.CONNECTORS, SEED_CONNECTORS);
    this.setItem(STORAGE_KEYS.FUSEBOXES, SEED_FUSEBOXES);
    this.setItem(STORAGE_KEYS.DIAGRAMS, SEED_WIRING_DIAGRAMS);
    this.setItem(STORAGE_KEYS.ADMIN_PASS, '1234');
    this.setItem(STORAGE_KEYS.USERS, SEED_USERS);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
  }

  // --- Manufacturers ---
  public getManufacturers(): Manufacturer[] {
    return this.getItem<Manufacturer[]>(STORAGE_KEYS.MANUFACTURERS, SEED_MANUFACTURERS);
  }

  public saveManufacturer(man: Manufacturer): void {
    const list = this.getManufacturers();
    const index = list.findIndex(m => m.id === man.id);
    if (index >= 0) {
      list[index] = man;
    } else {
      list.push(man);
    }
    this.setItem(STORAGE_KEYS.MANUFACTURERS, list);
  }

  public deleteManufacturer(id: string): void {
    const list = this.getManufacturers().filter(m => m.id !== id);
    this.setItem(STORAGE_KEYS.MANUFACTURERS, list);
  }

  // --- Vehicles ---
  public getVehicles(onlyPublished = false): Vehicle[] {
    const rawList = this.getItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, SEED_VEHICLES);
    const seen = new Set<string>();
    const list: Vehicle[] = [];
    for (const v of rawList) {
      if (v && v.id && !seen.has(v.id)) {
        seen.add(v.id);
        list.push(v);
      }
    }
    if (onlyPublished) {
      return list.filter(v => v.status === 'published' || v.status === 'verified' || !v.status);
    }
    return list;
  }

  public getVehicleById(id: string): Vehicle | undefined {
    return this.getVehicles().find(v => v.id === id);
  }

  public saveVehicle(vehicle: Vehicle, adminInfo?: { uid?: string; email?: string }, skipVersionLog = false): void {
    const list = this.getVehicles();
    const idx = list.findIndex(v => v.id === vehicle.id);
    const existing = idx >= 0 ? list[idx] : undefined;

    if (!skipVersionLog) {
      this.recordVersionChange({
        recordId: vehicle.id,
        entityType: 'vehicle',
        entityTitle: vehicle.persianName || vehicle.name || 'خودرو',
        previousData: existing ? JSON.parse(JSON.stringify(existing)) : null,
        newData: JSON.parse(JSON.stringify(vehicle)),
        operation: existing ? 'update' : 'create',
        adminId: adminInfo?.uid,
        adminEmail: adminInfo?.email
      });
    }

    if (idx >= 0) {
      list[idx] = vehicle;
    } else {
      list.unshift(vehicle);
    }
    this.setItem(STORAGE_KEYS.VEHICLES, list);
  }

  public deleteVehicle(id: string, adminInfo?: { uid?: string; email?: string }): void {
    const existing = this.getVehicleById(id);
    if (existing) {
      this.recordVersionChange({
        recordId: id,
        entityType: 'vehicle',
        entityTitle: existing.persianName || existing.name || 'خودرو',
        previousData: JSON.parse(JSON.stringify(existing)),
        newData: {},
        operation: 'delete',
        adminId: adminInfo?.uid,
        adminEmail: adminInfo?.email
      });
    }
    const list = this.getVehicles().filter(v => v.id !== id);
    this.setItem(STORAGE_KEYS.VEHICLES, list);
    // Also remove from recents & favorites
    this.removeFavorite('vehicle', id);
    this.removeRecentVehicle(id);
  }

  // --- ECUs ---
  public getECUs(vehicleId?: string, onlyPublished = false): ECU[] {
    let all = this.getItem<ECU[]>(STORAGE_KEYS.ECUS, SEED_ECUS);
    if (vehicleId) {
      all = all.filter(e => e.vehicleId === vehicleId);
    }
    if (onlyPublished) {
      all = all.filter(e => e.status === 'published' || e.status === 'verified' || !e.status);
    }
    return all;
  }

  public getECUById(id: string): ECU | undefined {
    return this.getECUs().find(e => e.id === id);
  }

  public saveECU(ecu: ECU, adminInfo?: { uid?: string; email?: string }, skipVersionLog = false): void {
    const list = this.getECUs();
    const idx = list.findIndex(e => e.id === ecu.id);
    const existing = idx >= 0 ? list[idx] : undefined;

    if (!skipVersionLog) {
      this.recordVersionChange({
        recordId: ecu.id,
        entityType: 'ecu',
        entityTitle: `${ecu.brand} ${ecu.model}`,
        previousData: existing ? JSON.parse(JSON.stringify(existing)) : null,
        newData: JSON.parse(JSON.stringify(ecu)),
        operation: existing ? 'update' : 'create',
        adminId: adminInfo?.uid,
        adminEmail: adminInfo?.email
      });
    }

    if (idx >= 0) {
      list[idx] = ecu;
    } else {
      list.push(ecu);
    }
    this.setItem(STORAGE_KEYS.ECUS, list);
  }

  public deleteECU(id: string, adminInfo?: { uid?: string; email?: string }): void {
    const existing = this.getECUById(id);
    if (existing) {
      this.recordVersionChange({
        recordId: id,
        entityType: 'ecu',
        entityTitle: `${existing.brand} ${existing.model}`,
        previousData: JSON.parse(JSON.stringify(existing)),
        newData: {},
        operation: 'delete',
        adminId: adminInfo?.uid,
        adminEmail: adminInfo?.email
      });
    }
    const list = this.getECUs().filter(e => e.id !== id);
    this.setItem(STORAGE_KEYS.ECUS, list);
  }

  // --- Dependency Checker for Safe Deletion ---
  public checkRecordDependencies(type: 'vehicle' | 'ecu' | 'connector' | 'fusebox' | 'diagram', id: string): {
    hasDependencies: boolean;
    summary: string;
    items: { typeFa: string; count: number; details: string[] };
  } {
    const details: string[] = [];
    let count = 0;

    if (type === 'vehicle') {
      const conns = this.getConnectors(id);
      const fbs = this.getFuseBoxes(id);
      const ecus = this.getECUs(id);
      const diags = this.getWiringDiagrams(id);
      const media = this.getMediaItems().filter(m => m.vehicleId === id || m.entityId === id);

      if (conns.length > 0) {
        count += conns.length;
        details.push(`${conns.length} سوکت / پیناوت مرتبط (${conns.map(c => c.name).slice(0, 3).join('، ')}${conns.length > 3 ? '...' : ''})`);
      }
      if (fbs.length > 0) {
        count += fbs.length;
        details.push(`${fbs.length} جعبه‌فیوز مرتبط (${fbs.map(f => f.name).join('، ')})`);
      }
      if (ecus.length > 0) {
        count += ecus.length;
        details.push(`${ecus.length} ای‌سی‌یو ثبت‌شده (${ecus.map(e => e.brand + ' ' + e.model).join('، ')})`);
      }
      if (diags.length > 0) {
        count += diags.length;
        details.push(`${diags.length} نقشه سیم‌کشی`);
      }
      if (media.length > 0) {
        count += media.length;
        details.push(`${media.length} تصویر و مستند فنی`);
      }

      return {
        hasDependencies: count > 0,
        summary: count > 0 ? `این خودرو دارای ${count} رکورد وابسته در بخش‌های مختلف است.` : 'هیچ رکورد وابسته‌ای به این خودرو یافت نشد.',
        items: { typeFa: 'خودرو', count, details }
      };
    } else if (type === 'ecu') {
      const conns = this.getConnectors().filter(c => c.ecuId === id);
      if (conns.length > 0) {
        count += conns.length;
        details.push(`${conns.length} سوکت متصل به این ECU`);
      }
      return {
        hasDependencies: count > 0,
        summary: count > 0 ? `این ECU دارای ${count} سوکت متصل است.` : 'هیچ سوکت وابسته‌ای به این ECU یافت نشد.',
        items: { typeFa: 'ECU', count, details }
      };
    } else if (type === 'connector') {
      const conn = this.getConnectorById(id);
      const pinCount = conn?.pins?.length || 0;
      const media = this.getMediaItems(id);
      if (pinCount > 0) {
        count += pinCount;
        details.push(`${pinCount} پین و سیم‌کشی تعریف‌شده در این سوکت`);
      }
      if (media.length > 0) {
        count += media.length;
        details.push(`${media.length} تصویر اختصاصی سوکت`);
      }
      return {
        hasDependencies: count > 0,
        summary: count > 0 ? `این سوکت دارای ${count} پین و مستند وابسته است.` : 'هیچ رکورد وابسته‌ای یافت نشد.',
        items: { typeFa: 'سوکت', count, details }
      };
    } else if (type === 'fusebox') {
      const fb = this.getFuseBoxById(id);
      const fuseCount = fb?.fuses?.length || 0;
      const relayCount = fb?.relays?.length || 0;
      const media = this.getMediaItems(id);
      if (fuseCount > 0) {
        count += fuseCount;
        details.push(`${fuseCount} فیوز تعریف‌شده`);
      }
      if (relayCount > 0) {
        count += relayCount;
        details.push(`${relayCount} رله تعریف‌شده`);
      }
      if (media.length > 0) {
        count += media.length;
        details.push(`${media.length} نقشه و تصویر اختصاصی`);
      }
      return {
        hasDependencies: count > 0,
        summary: count > 0 ? `این جعبه‌فیوز دارای ${count} فیوز، رله و مستند وابسته است.` : 'هیچ رکورد وابسته‌ای یافت نشد.',
        items: { typeFa: 'جعبه‌فیوز', count, details }
      };
    }

    return {
      hasDependencies: false,
      summary: 'هیچ رکورد وابسته‌ای یافت نشد.',
      items: { typeFa: 'رکورد', count: 0, details: [] }
    };
  }

  // --- Connectors ---
  public getConnectors(vehicleId?: string, ecuId?: string, onlyPublished = false): Connector[] {
    let list = this.getItem<Connector[]>(STORAGE_KEYS.CONNECTORS, SEED_CONNECTORS);
    if (ecuId) {
      list = list.filter(c => c.ecuId === ecuId);
    } else if (vehicleId) {
      list = list.filter(c => c.vehicleId === vehicleId);
    }

    if (onlyPublished) {
      list = list
        .filter(c => c.status === 'published' || c.status === 'verified' || !c.status)
        .map(c => ({
          ...c,
          pins: (c.pins || []).filter(p => p.status === 'published' || p.status === 'verified' || !p.status)
        }));
    }
    return list;
  }

  public getConnectorById(id: string): Connector | undefined {
    return this.getConnectors().find(c => c.id === id);
  }

  public saveConnector(connector: Connector, adminInfo?: { uid?: string; email?: string }, skipVersionLog = false): void {
    const list = this.getConnectors();
    const idx = list.findIndex(c => c.id === connector.id);
    const existing = idx >= 0 ? list[idx] : undefined;

    if (!skipVersionLog) {
      this.recordVersionChange({
        recordId: connector.id,
        entityType: 'connector',
        entityTitle: connector.name || connector.codeName || 'سوکت',
        previousData: existing ? JSON.parse(JSON.stringify(existing)) : null,
        newData: JSON.parse(JSON.stringify(connector)),
        operation: existing ? 'update' : 'create',
        adminId: adminInfo?.uid,
        adminEmail: adminInfo?.email
      });
    }

    if (idx >= 0) {
      list[idx] = connector;
    } else {
      list.unshift(connector);
    }
    this.setItem(STORAGE_KEYS.CONNECTORS, list);
  }

  public deleteConnector(id: string, adminInfo?: { uid?: string; email?: string }): void {
    const existing = this.getConnectorById(id);
    if (existing) {
      this.recordVersionChange({
        recordId: id,
        entityType: 'connector',
        entityTitle: existing.name || existing.codeName || 'سوکت',
        previousData: JSON.parse(JSON.stringify(existing)),
        newData: {},
        operation: 'delete',
        adminId: adminInfo?.uid,
        adminEmail: adminInfo?.email
      });
    }
    const list = this.getConnectors().filter(c => c.id !== id);
    this.setItem(STORAGE_KEYS.CONNECTORS, list);
    this.removeFavorite('connector', id);
  }

  // --- FuseBoxes ---
  public getFuseBoxes(vehicleId?: string, onlyPublished = false): FuseBox[] {
    let list = this.getItem<FuseBox[]>(STORAGE_KEYS.FUSEBOXES, SEED_FUSEBOXES);
    if (vehicleId) {
      list = list.filter(f => f.vehicleId === vehicleId);
    }

    if (onlyPublished) {
      list = list
        .filter(f => f.status === 'published' || f.status === 'verified' || !f.status)
        .map(f => ({
          ...f,
          fuses: (f.fuses || []).filter(fu => fu.status === 'published' || fu.status === 'verified' || !fu.status),
          relays: (f.relays || []).filter(r => r.status === 'published' || r.status === 'verified' || !r.status)
        }));
    }
    return list;
  }

  public getFuseBoxById(id: string): FuseBox | undefined {
    return this.getFuseBoxes().find(f => f.id === id);
  }

  public saveFuseBox(fb: FuseBox, adminInfo?: { uid?: string; email?: string }, skipVersionLog = false): void {
    const list = this.getFuseBoxes();
    const idx = list.findIndex(f => f.id === fb.id);
    const existing = idx >= 0 ? list[idx] : undefined;

    if (!skipVersionLog) {
      this.recordVersionChange({
        recordId: fb.id,
        entityType: 'fusebox',
        entityTitle: fb.name || 'جعبه‌فیوز',
        previousData: existing ? JSON.parse(JSON.stringify(existing)) : null,
        newData: JSON.parse(JSON.stringify(fb)),
        operation: existing ? 'update' : 'create',
        adminId: adminInfo?.uid,
        adminEmail: adminInfo?.email
      });
    }

    if (idx >= 0) {
      list[idx] = fb;
    } else {
      list.unshift(fb);
    }
    this.setItem(STORAGE_KEYS.FUSEBOXES, list);
  }

  public deleteFuseBox(id: string, adminInfo?: { uid?: string; email?: string }): void {
    const existing = this.getFuseBoxById(id);
    if (existing) {
      this.recordVersionChange({
        recordId: id,
        entityType: 'fusebox',
        entityTitle: existing.name || 'جعبه‌فیوز',
        previousData: JSON.parse(JSON.stringify(existing)),
        newData: {},
        operation: 'delete',
        adminId: adminInfo?.uid,
        adminEmail: adminInfo?.email
      });
    }
    const list = this.getFuseBoxes().filter(f => f.id !== id);
    this.setItem(STORAGE_KEYS.FUSEBOXES, list);
    this.removeFavorite('fusebox', id);
  }

  // --- Wiring Diagrams ---
  public getWiringDiagrams(vehicleId?: string, onlyPublished = false): WiringDiagram[] {
    let list = this.getItem<WiringDiagram[]>(STORAGE_KEYS.DIAGRAMS, SEED_WIRING_DIAGRAMS);
    if (vehicleId) {
      list = list.filter(d => d.vehicleId === vehicleId);
    }
    if (onlyPublished) {
      list = list.filter(d => d.status === 'published' || d.status === 'verified' || !d.status);
    }
    return list;
  }

  public saveWiringDiagram(diagram: WiringDiagram): void {
    const list = this.getWiringDiagrams();
    const idx = list.findIndex(d => d.id === diagram.id);
    if (idx >= 0) {
      list[idx] = diagram;
    } else {
      list.unshift(diagram);
    }
    this.setItem(STORAGE_KEYS.DIAGRAMS, list);
  }

  public deleteWiringDiagram(id: string): void {
    const list = this.getWiringDiagrams().filter(d => d.id !== id);
    this.setItem(STORAGE_KEYS.DIAGRAMS, list);
    this.removeFavorite('diagram', id);
  }

  // --- Favorites ---
  public getFavorites(userId?: string): FavoriteItem[] {
    const all = this.getItem<FavoriteItem[]>(STORAGE_KEYS.FAVORITES, []);
    const filtered = userId ? all.filter(f => !f.userId || f.userId === userId) : all;
    const seen = new Set<string>();
    const deduplicated: FavoriteItem[] = [];
    for (const f of filtered) {
      if (!f) continue;
      const key = `${f.type}_${f.itemId}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(f);
      }
    }
    return deduplicated;
  }

  public isFavorite(type: FavoriteItem['type'], itemId: string, userId?: string): boolean {
    const list = this.getFavorites(userId);
    return list.some(f => f.type === type && f.itemId === itemId && (userId ? f.userId === userId : true));
  }

  public toggleFavorite(item: Omit<FavoriteItem, 'id' | 'addedAt'>): boolean {
    const list = this.getItem<FavoriteItem[]>(STORAGE_KEYS.FAVORITES, []);
    const idx = list.findIndex(
      f => f.type === item.type && f.itemId === item.itemId && (item.userId ? f.userId === item.userId : !f.userId)
    );
    if (idx >= 0) {
      list.splice(idx, 1);
      this.setItem(STORAGE_KEYS.FAVORITES, list);
      return false;
    } else {
      list.unshift({
        ...item,
        id: `fav-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        addedAt: Date.now()
      });
      this.setItem(STORAGE_KEYS.FAVORITES, list);
      return true;
    }
  }

  public removeFavorite(type: FavoriteItem['type'], itemId: string, userId?: string): void {
    const list = this.getItem<FavoriteItem[]>(STORAGE_KEYS.FAVORITES, []).filter(
      f => !(f.type === type && f.itemId === itemId && (userId ? f.userId === userId : true))
    );
    this.setItem(STORAGE_KEYS.FAVORITES, list);
  }

  public removeFavoriteById(id: string): void {
    const list = this.getItem<FavoriteItem[]>(STORAGE_KEYS.FAVORITES, []).filter(f => f.id !== id);
    this.setItem(STORAGE_KEYS.FAVORITES, list);
  }

  // --- Recent Vehicles ---
  public getRecentVehicles(userId?: string): RecentVehicle[] {
    const all = this.getItem<RecentVehicle[]>(STORAGE_KEYS.RECENT_VEHICLES, []);
    const filtered = userId ? all.filter(r => !r.userId || r.userId === userId) : all;
    // Deduplicate by vehicleId so each vehicle appears only once in recent list (most recent first)
    const seen = new Set<string>();
    const deduplicated: RecentVehicle[] = [];
    for (const r of filtered) {
      if (r && r.vehicleId && !seen.has(r.vehicleId)) {
        seen.add(r.vehicleId);
        deduplicated.push(r);
      }
    }
    return deduplicated;
  }

  public addRecentVehicle(vehicleId: string, userId?: string): void {
    let recents = this.getItem<RecentVehicle[]>(STORAGE_KEYS.RECENT_VEHICLES, []);
    // Remove any existing entry for this vehicle (whether guest or current user) to prevent duplicate cards
    recents = recents.filter(r => !(r.vehicleId === vehicleId && (userId ? (r.userId === userId || !r.userId) : true)));
    recents.unshift({ vehicleId, timestamp: Date.now(), userId });
    // Also deduplicate entire list by vehicleId as a safety net
    const seen = new Set<string>();
    recents = recents.filter(r => {
      const key = `${r.userId || 'guest'}_${r.vehicleId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (recents.length > 10) {
      recents = recents.slice(0, 10);
    }
    this.setItem(STORAGE_KEYS.RECENT_VEHICLES, recents);
  }

  public removeRecentVehicle(vehicleId: string, userId?: string): void {
    const recents = this.getItem<RecentVehicle[]>(STORAGE_KEYS.RECENT_VEHICLES, []).filter(
      r => !(r.vehicleId === vehicleId && (userId ? r.userId === userId : true))
    );
    this.setItem(STORAGE_KEYS.RECENT_VEHICLES, recents);
  }

  // --- User Profiles & RBAC ---
  public getUsers(): AppUserProfile[] {
    const users = this.getItem<AppUserProfile[]>(STORAGE_KEYS.USERS, SEED_USERS);
    // Guarantee bootstrap admin exists and has admin role
    if (!users.some(u => u.email?.toLowerCase() === 'arefalikhani69@gmail.com')) {
      users.unshift(SEED_USERS[0]);
      this.setItem(STORAGE_KEYS.USERS, users);
    }
    return users;
  }

  public getUserById(id: string): AppUserProfile | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  public getUserByEmail(email: string): AppUserProfile | undefined {
    const clean = email.trim().toLowerCase();
    return this.getUsers().find(u => u.email?.toLowerCase() === clean);
  }

  public saveUser(user: AppUserProfile): void {
    const list = this.getUsers();
    const idx = list.findIndex(u => u.id === user.id || u.email?.toLowerCase() === user.email?.toLowerCase());
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...user };
    } else {
      list.push(user);
    }
    this.setItem(STORAGE_KEYS.USERS, list);
  }

  public updateUserRole(
    userId: string,
    newRole: AppUserRole,
    adminEmail?: string
  ): { success: boolean; message: string } {
    const list = this.getUsers();
    const user = list.find(u => u.id === userId);
    if (!user) {
      return { success: false, message: 'کاربر مورد نظر یافت نشد.' };
    }
    if (user.email?.toLowerCase() === 'arefalikhani69@gmail.com' && newRole !== 'admin') {
      return {
        success: false,
        message: 'امکان تغییر نقش مدیر اصلی و صاحب پروژه (Bootstrap Admin) وجود ندارد.'
      };
    }
    user.role = newRole;
    this.setItem(STORAGE_KEYS.USERS, list);

    this.recordAuditLog({
      actionType: 'user_role_change',
      userId: 'admin',
      userEmail: adminEmail || 'admin@autopin.ir',
      userRole: 'admin',
      targetType: 'user',
      targetId: userId,
      targetTitle: user.displayName || user.email,
      status: 'success',
      summary: `تغییر نقش کاربر «${user.email}» به «${
        newRole === 'admin' ? 'مدیر سیستم' : newRole === 'technician' ? 'تکنسین فنی' : 'کاربر عادی'
      }»`
    });

    return {
      success: true,
      message: `نقش کاربری «${user.displayName || user.email}» با موفقیت به «${
        newRole === 'admin' ? 'مدیر سیستم' : newRole === 'technician' ? 'تکنسین فنی' : 'کاربر عادی'
      }» تغییر یافت.`
    };
  }

  public toggleUserStatus(
    userId: string,
    adminEmail?: string
  ): { success: boolean; message: string; newStatus: boolean } {
    const list = this.getUsers();
    const user = list.find(u => u.id === userId);
    if (!user) {
      return { success: false, message: 'کاربر مورد نظر یافت نشد.', newStatus: false };
    }
    if (user.email?.toLowerCase() === 'arefalikhani69@gmail.com') {
      return {
        success: false,
        message: 'امکان غیرفعال‌سازی حساب مدیر اصلی سامانه وجود ندارد.',
        newStatus: true
      };
    }
    user.isActive = !user.isActive;
    this.setItem(STORAGE_KEYS.USERS, list);

    this.recordAuditLog({
      actionType: 'user_status_change',
      userId: 'admin',
      userEmail: adminEmail || 'admin@autopin.ir',
      userRole: 'admin',
      targetType: 'user',
      targetId: userId,
      targetTitle: user.displayName || user.email,
      status: 'success',
      summary: `${user.isActive ? 'فعال‌سازی مجدد' : 'تعلیق و غیرفعال‌سازی'} حساب کاربر «${user.email}»`
    });

    return {
      success: true,
      message: `وضعیت حساب «${user.displayName || user.email}» به «${user.isActive ? 'فعال' : 'غیرفعال / تعلیق‌شده'}» تغییر یافت.`,
      newStatus: user.isActive
    };
  }

  public deleteUser(userId: string): { success: boolean; message: string } {
    const list = this.getUsers();
    const user = list.find(u => u.id === userId);
    if (!user) {
      return { success: false, message: 'کاربر مورد نظر یافت نشد.' };
    }
    if (user.email?.toLowerCase() === 'arefalikhani69@gmail.com') {
      return { success: false, message: 'حساب مدیر اصلی پروژه به هیچ عنوان قابل حذف نیست.' };
    }
    const filtered = list.filter(u => u.id !== userId);
    this.setItem(STORAGE_KEYS.USERS, filtered);
    return { success: true, message: `حساب کاربری «${user.displayName || user.email}» با موفقیت حذف شد.` };
  }

  public syncUserOnAuth(authUser: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
  }): AppUserProfile {
    const email = authUser.email?.toLowerCase() || '';
    const isMasterAdmin = email === 'arefalikhani69@gmail.com';
    const existing = this.getUserById(authUser.uid) || this.getUserByEmail(email);

    if (existing) {
      const updated: AppUserProfile = {
        ...existing,
        id: authUser.uid,
        email: email || existing.email,
        displayName: authUser.displayName || existing.displayName || (email ? email.split('@')[0] : 'کاربر'),
        photoURL: authUser.photoURL || existing.photoURL,
        role: isMasterAdmin ? 'admin' : existing.role,
        lastLoginAt: Date.now()
      };
      this.saveUser(updated);
      return updated;
    }

    const newUser: AppUserProfile = {
      id: authUser.uid,
      email: email,
      displayName: authUser.displayName || (email ? email.split('@')[0] : 'کاربر جدید'),
      role: isMasterAdmin ? 'admin' : 'user',
      isActive: true,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      photoURL: authUser.photoURL || undefined
    };
    this.saveUser(newUser);
    return newUser;
  }

  // --- Internal In-App Notifications (مرکز اعلان‌های داخلی) ---
  public getNotifications(userId?: string, userRole?: AppUserRole): AppNotification[] {
    const all = this.getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    const role = userRole || 'user';

    // Filter relevant notifications for current user/audience
    const relevant = all.filter(n => {
      // Exclude inactive broadcasts for non-admins
      if (n.broadcastStatus === 'inactive' && role !== 'admin') {
        return false;
      }

      if (n.target === 'all') {
        return true;
      }
      if (n.target === 'admins') {
        return role === 'admin';
      }
      if (n.target === 'technicians') {
        return role === 'technician' || role === 'admin';
      }
      if (n.target === 'user') {
        if (n.userId && userId) {
          return n.userId === userId;
        }
        return role === 'admin' || (userId ? n.userId === userId : false);
      }
      return true;
    });

    // Compute user-specific read status for public broadcasts
    const list = relevant.map(n => {
      let isRead = n.isRead;
      if (n.target === 'all' && userId) {
        isRead = Boolean(n.readByUserIds && n.readByUserIds.includes(userId));
      }
      return {
        ...n,
        isRead
      };
    });

    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  public getUnreadNotificationsCount(userId?: string, userRole?: AppUserRole): number {
    const list = this.getNotifications(userId, userRole);
    return list.filter(n => !n.isRead).length;
  }

  public markNotificationAsRead(id: string, userId?: string): boolean {
    const all = this.getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    const target = all.find(n => n.id === id);
    if (!target) return false;

    if (target.target === 'all' && userId) {
      if (!target.readByUserIds) target.readByUserIds = [];
      if (!target.readByUserIds.includes(userId)) {
        target.readByUserIds.push(userId);
      }
    } else {
      target.isRead = true;
    }

    this.setItem(STORAGE_KEYS.NOTIFICATIONS, all);
    return true;
  }

  public markAllNotificationsAsRead(userId?: string, userRole?: AppUserRole): void {
    const all = this.getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    const role = userRole || 'user';

    all.forEach(n => {
      if (n.target === 'all' && userId) {
        if (!n.readByUserIds) n.readByUserIds = [];
        if (!n.readByUserIds.includes(userId)) {
          n.readByUserIds.push(userId);
        }
      } else if (
        (n.target === 'admins' && role === 'admin') ||
        (n.target === 'technicians' && (role === 'technician' || role === 'admin')) ||
        (n.target === 'user' && (!n.userId || n.userId === userId))
      ) {
        n.isRead = true;
      }
    });

    this.setItem(STORAGE_KEYS.NOTIFICATIONS, all);
  }

  public deleteNotification(
    id: string,
    userId?: string,
    isAdmin = false
  ): { success: boolean; message: string } {
    const all = this.getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    const target = all.find(n => n.id === id);
    if (!target) {
      return { success: false, message: 'اعلان مورد نظر یافت نشد.' };
    }

    if (!isAdmin && target.target === 'all') {
      return { success: false, message: 'فقط مدیر سیستم مجاز به حذف اعلان‌های عمومی است.' };
    }

    if (!isAdmin && target.userId && target.userId !== userId) {
      return { success: false, message: 'شما مجاز به حذف اعلان این کاربر نیستید.' };
    }

    const filtered = all.filter(n => n.id !== id);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, filtered);
    return { success: true, message: 'اعلان با موفقیت حذف گردید.' };
  }

  public createNotification(
    params: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>
  ): AppNotification | null {
    const all = this.getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);

    // Rule: Deduplication check to prevent duplicate notifications for a single event
    if (params.uniqueEventKey) {
      const existing = all.find(n => n.uniqueEventKey === params.uniqueEventKey);
      if (existing) {
        return existing;
      }
    }

    const newNotif: AppNotification = {
      ...params,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      isRead: false,
      readByUserIds: [],
      broadcastStatus: params.broadcastStatus || 'active'
    };

    all.unshift(newNotif);
    if (all.length > 50) {
      all.splice(50);
    }
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, all);
    return newNotif;
  }

  public toggleBroadcastStatus(id: string, isActive: boolean): boolean {
    const all = this.getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    const notif = all.find(n => n.id === id);
    if (!notif) return false;
    notif.broadcastStatus = isActive ? 'active' : 'inactive';
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, all);
    return true;
  }

  // --- Audit Log Service (گزارش فعالیت‌های مدیریتی) ---
  public recordAuditLog(
    entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: number }
  ): AuditLogEntry {
    const logs = this.getItem<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    const newLog: AuditLogEntry = {
      id: entry.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: entry.timestamp || Date.now(),
      actionType: entry.actionType,
      userId: entry.userId || 'system',
      userEmail: entry.userEmail || 'system@autopin.ir',
      userRole: entry.userRole || 'system',
      targetType: entry.targetType,
      targetId: entry.targetId,
      targetTitle: entry.targetTitle,
      status: entry.status || 'success',
      summary: entry.summary,
      details: sanitizeAuditDetails(entry.details),
      diffSummary: entry.diffSummary
    };

    // Keep up to 200 logs to prevent QuotaExceededError
    const updated = [newLog, ...logs].slice(0, 200);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, updated);

    return newLog;
  }

  public getAuditLogs(filters?: AuditLogFilterParams): AuditLogEntry[] {
    let logs = this.getItem<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);

    if (!filters) {
      return logs.sort((a, b) => b.timestamp - a.timestamp);
    }

    if (filters.actionType && filters.actionType !== 'all') {
      logs = logs.filter(l => l.actionType === filters.actionType);
    }
    if (filters.targetType && filters.targetType !== 'all') {
      logs = logs.filter(l => l.targetType === filters.targetType);
    }
    if (filters.userId && filters.userId !== 'all') {
      const targetUid = filters.userId.toLowerCase();
      logs = logs.filter(l => l.userId === targetUid || l.userEmail.toLowerCase() === targetUid);
    }
    if (filters.status && filters.status !== 'all') {
      logs = logs.filter(l => l.status === filters.status);
    }
    if (filters.timeRange && filters.timeRange !== 'all') {
      const now = Date.now();
      const cutoff =
        filters.timeRange === 'today'
          ? now - 24 * 3600 * 1000
          : filters.timeRange === '7days'
          ? now - 7 * 24 * 3600 * 1000
          : now - 30 * 24 * 3600 * 1000;
      logs = logs.filter(l => l.timestamp >= cutoff);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      logs = logs.filter(l =>
        l.summary.toLowerCase().includes(q) ||
        (l.targetTitle && l.targetTitle.toLowerCase().includes(q)) ||
        l.userEmail.toLowerCase().includes(q) ||
        l.actionType.toLowerCase().includes(q)
      );
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  // --- Images ---
  public getImages(): AppImage[] {
    return this.getItem<AppImage[]>(STORAGE_KEYS.IMAGES, []);
  }

  public saveImage(image: AppImage): void {
    const list = this.getImages();
    const idx = list.findIndex(i => i.id === image.id);
    if (idx >= 0) {
      list[idx] = image;
    } else {
      list.unshift(image);
    }
    this.setItem(STORAGE_KEYS.IMAGES, list);
  }

  public deleteImage(id: string): void {
    const list = this.getImages().filter(i => i.id !== id);
    this.setItem(STORAGE_KEYS.IMAGES, list);
  }

  // --- Technical Media Items (Local Cache & Offline Persistence) ---
  public getMediaItems(entityId?: string, onlyPublished = false): MediaItem[] {
    const raw = this.getItem<MediaItem[]>(STORAGE_KEYS.MEDIA, []);
    let deduplicated = deduplicateMediaList(raw);
    // If duplicates were pruned, self-heal localStorage
    if (deduplicated.length !== raw.length) {
      this.setItem(STORAGE_KEYS.MEDIA, deduplicated);
    }
    if (entityId) {
      deduplicated = deduplicated.filter(m => m.entityId === entityId);
    }
    if (onlyPublished) {
      deduplicated = deduplicated.filter(m => m.status === 'published' || m.status === 'verified' || !m.status);
    }
    return deduplicated;
  }

  public saveMediaItem(item: MediaItem): void {
    const raw = this.getItem<MediaItem[]>(STORAGE_KEYS.MEDIA, []);
    const targetKey = getMediaCanonicalKey(item);
    const idx = raw.findIndex(m => m.id === item.id || getMediaCanonicalKey(m) === targetKey);
    
    if (idx >= 0) {
      // Merge with existing record to keep most complete data
      raw[idx] = {
        ...raw[idx],
        ...item,
        id: raw[idx].id || item.id, // retain stable original ID
        title: item.title || raw[idx].title,
        description: item.description || raw[idx].description,
        source: item.source || raw[idx].source,
        imageType: item.imageType || raw[idx].imageType,
        createdAt: item.createdAt || raw[idx].createdAt || Date.now()
      };
    } else {
      raw.unshift(item);
    }
    const cleanList = deduplicateMediaList(raw);
    this.setItem(STORAGE_KEYS.MEDIA, cleanList);
  }

  public deleteMediaItem(id: string): void {
    const raw = this.getItem<MediaItem[]>(STORAGE_KEYS.MEDIA, []);
    const list = raw.filter(m => m.id !== id);
    this.setItem(STORAGE_KEYS.MEDIA, deduplicateMediaList(list));
  }

  // --- Admin Passcode ---
  public getAdminPasscode(): string {
    return this.getItem<string>(STORAGE_KEYS.ADMIN_PASS, '1234');
  }

  public verifyAdminPasscode(input: string): boolean {
    return input.trim() === this.getAdminPasscode().trim();
  }

  public setAdminPasscode(newPass: string): void {
    this.setItem(STORAGE_KEYS.ADMIN_PASS, newPass.trim());
  }

  // --- Technical Data Versioning (مدیریت نسخه‌های اطلاعات فنی) ---
  public getTechnicalVersions(recordId?: string, entityType?: VersionEntityType): TechnicalDataVersion[] {
    const all = this.getItem<TechnicalDataVersion[]>(STORAGE_KEYS.VERSIONS, []);
    let filtered = all;
    if (recordId) {
      filtered = filtered.filter(v => v.recordId === recordId);
    }
    if (entityType) {
      filtered = filtered.filter(v => v.entityType === entityType);
    }
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  public getVersionById(versionId: string): TechnicalDataVersion | undefined {
    return this.getTechnicalVersions().find(v => v.id === versionId);
  }

  public recordVersionChange(params: {
    recordId: string;
    entityType: VersionEntityType;
    entityTitle: string;
    previousData: Record<string, any> | null;
    newData: Record<string, any>;
    operation: VersionOperation;
    adminId?: string;
    adminEmail?: string;
    comment?: string;
  }): TechnicalDataVersion | null {
    const { recordId, entityType, entityTitle, previousData, newData, operation, adminId, adminEmail, comment } = params;

    // Sanitize to prevent storing passwords or sensitive security credentials
    const cleanPrev = sanitizeVersionSnapshot(previousData);
    const cleanNew = sanitizeVersionSnapshot(newData);

    // Compute field-by-field diff
    const { changedFields, diffs } = calculateSnapshotDiffs(cleanPrev, cleanNew, operation);

    // Rule 1.3: If it's an update and no actual differences exist, do NOT record a new version
    if (operation === 'update' && changedFields.length === 0) {
      return null;
    }

    const allVersions = this.getTechnicalVersions();
    const recordVersions = allVersions.filter(v => v.recordId === recordId);
    const nextVersionNumber = recordVersions.length > 0
      ? Math.max(...recordVersions.map(v => v.versionNumber || 0)) + 1
      : 1;

    const newVersion: TechnicalDataVersion = {
      id: `ver-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      recordId,
      entityType,
      entityTitle,
      versionNumber: nextVersionNumber,
      timestamp: Date.now(),
      previousData: cleanPrev,
      newData: cleanNew,
      changedFields,
      diffs,
      operation,
      adminId,
      adminEmail: adminEmail || 'مدیر سیستم',
      comment
    };

    allVersions.unshift(newVersion);
    if (allVersions.length > 25) {
      allVersions.splice(25);
    }
    this.setItem(STORAGE_KEYS.VERSIONS, allVersions);
    return newVersion;
  }

  public rollbackTechnicalVersion(
    versionId: string,
    adminInfo?: { uid?: string; email?: string }
  ): { success: boolean; message: string; restoredRecord?: any } {
    const versions = this.getTechnicalVersions();
    const targetVersion = versions.find(v => v.id === versionId);

    if (!targetVersion) {
      return { success: false, message: 'نسخه مورد نظر برای بازیابی در سیستم یافت نشد.' };
    }

    const dataToRestore = targetVersion.newData && Object.keys(targetVersion.newData).length > 0
      ? JSON.parse(JSON.stringify(targetVersion.newData))
      : targetVersion.previousData ? JSON.parse(JSON.stringify(targetVersion.previousData)) : null;

    if (!dataToRestore) {
      return { success: false, message: 'اطلاعات معتبری در این نسخه برای بازگردانی وجود ندارد.' };
    }

    // Referential integrity verification
    if (targetVersion.entityType === 'connector' || targetVersion.entityType === 'fusebox' || targetVersion.entityType === 'ecu') {
      const parentVehicleId = dataToRestore.vehicleId;
      if (parentVehicleId) {
        const vehicleExists = this.getVehicles().some(v => v.id === parentVehicleId);
        if (!vehicleExists) {
          return {
            success: false,
            message: `توقف بازیابی به علت عدم یکپارچگی ارجاعات: خودروی والد این رکورد (شناسه: ${parentVehicleId}) قبلاً از سیستم حذف شده است. لطفاً ابتدا خودروی مربوطه را ایجاد یا بازیابی کنید.`
          };
        }
      }
    }

    // Capture current live state before rollback
    let currentLiveState: any = null;
    if (targetVersion.entityType === 'connector') {
      currentLiveState = this.getConnectorById(targetVersion.recordId);
      this.saveConnector(dataToRestore as Connector, adminInfo, true);
    } else if (targetVersion.entityType === 'fusebox') {
      currentLiveState = this.getFuseBoxById(targetVersion.recordId);
      this.saveFuseBox(dataToRestore as FuseBox, adminInfo, true);
    } else if (targetVersion.entityType === 'ecu') {
      currentLiveState = this.getECUById(targetVersion.recordId);
      this.saveECU(dataToRestore as ECU, adminInfo, true);
    } else if (targetVersion.entityType === 'vehicle') {
      currentLiveState = this.getVehicleById(targetVersion.recordId);
      this.saveVehicle(dataToRestore as Vehicle, adminInfo, true);
    } else if (targetVersion.entityType === 'diagram') {
      currentLiveState = this.getWiringDiagrams().find(d => d.id === targetVersion.recordId);
      this.saveWiringDiagram(dataToRestore as WiringDiagram);
    } else if (targetVersion.entityType === 'media') {
      currentLiveState = this.getMediaItems().find(m => m.id === targetVersion.recordId);
      this.saveMediaItem(dataToRestore as MediaItem);
    }

    // Record new revision as 'restore'
    this.recordVersionChange({
      recordId: targetVersion.recordId,
      entityType: targetVersion.entityType,
      entityTitle: targetVersion.entityTitle,
      previousData: currentLiveState ? JSON.parse(JSON.stringify(currentLiveState)) : null,
      newData: dataToRestore,
      operation: 'restore',
      adminId: adminInfo?.uid,
      adminEmail: adminInfo?.email,
      comment: `بازیابی از نسخه شماره ${targetVersion.versionNumber}`
    });

    this.recordAuditLog({
      actionType: 'version_restore',
      userId: adminInfo?.uid || 'admin',
      userEmail: adminInfo?.email || 'admin@autopin.ir',
      userRole: 'admin',
      targetType: targetVersion.entityType as any,
      targetId: targetVersion.recordId,
      targetTitle: targetVersion.entityTitle,
      status: 'success',
      summary: `بازیابی نسخه قبلی اطلاعات فنی «${targetVersion.entityTitle}» (نسخه ${targetVersion.versionNumber})`
    });

    return {
      success: true,
      message: `رکورد با موفقیت به داده‌های نسخه ${targetVersion.versionNumber} بازگردانی شد و نسخه جدید ثبت گردید.`,
      restoredRecord: dataToRestore
    };
  }

  public deleteTechnicalVersion(versionId: string): void {
    const list = this.getTechnicalVersions().filter(v => v.id !== versionId);
    this.setItem(STORAGE_KEYS.VERSIONS, list);
  }

  public clearTechnicalVersions(recordId?: string): void {
    if (!recordId) {
      this.setItem(STORAGE_KEYS.VERSIONS, []);
      return;
    }
    const list = this.getTechnicalVersions().filter(v => v.recordId !== recordId);
    this.setItem(STORAGE_KEYS.VERSIONS, list);
  }

  // --- Technical Data Approval & Publishing System (سیستم تأیید و انتشار اطلاعات فنی) ---
  public getAllApprovalItems(
    statusFilter?: PublicationStatus | 'all',
    typeFilter?: ApprovalEntityType | 'all'
  ): ApprovalItemSummary[] {
    const items: ApprovalItemSummary[] = [];

    // 1. Vehicles
    const vehicles = this.getVehicles(false);
    for (const v of vehicles) {
      const status = v.status || 'published';
      items.push({
        id: v.id,
        entityType: 'vehicle',
        entityTypeFa: 'خودرو و مشخصات موتور',
        title: v.persianName || v.name,
        subtitle: `${v.generation || ''} (${v.modelYears || ''}) - ${v.engines?.length || 0} موتور`,
        vehicleName: v.persianName || v.name,
        status,
        rejectionReason: v.rejectionReason,
        proposedChanges: v.proposedChanges,
        submittedBy: v.submittedBy || v.updatedBy,
        submittedAt: v.updatedAt || v.createdAt,
        reviewedBy: v.reviewedBy,
        reviewedAt: v.reviewedAt,
        imageUrl: v.imageUrl,
        hasProposedChanges: Boolean(v.proposedChanges && Object.keys(v.proposedChanges).length > 0),
        rawData: v
      });
    }

    // 2. ECUs
    const ecus = this.getECUs(undefined, false);
    for (const ecu of ecus) {
      const parentVehicle = vehicles.find(v => v.id === ecu.vehicleId);
      const status = ecu.status || 'published';
      items.push({
        id: ecu.id,
        entityType: 'ecu',
        entityTypeFa: 'ای‌سی‌یو (ECU)',
        title: `${ecu.brand} ${ecu.model}`,
        subtitle: `سخت‌افزار: ${ecu.hardwareVersion || 'نامشخص'} - ${ecu.connectorCount || 0} سوکت`,
        vehicleName: parentVehicle ? (parentVehicle.persianName || parentVehicle.name) : undefined,
        status,
        rejectionReason: ecu.rejectionReason,
        proposedChanges: ecu.proposedChanges,
        submittedBy: ecu.submittedBy,
        submittedAt: undefined,
        reviewedBy: ecu.reviewedBy,
        reviewedAt: ecu.reviewedAt,
        imageUrl: ecu.imageUrl,
        hasProposedChanges: Boolean(ecu.proposedChanges && Object.keys(ecu.proposedChanges).length > 0),
        rawData: ecu
      });
    }

    // 3. Connectors
    const connectors = this.getConnectors(undefined, undefined, false);
    for (const conn of connectors) {
      const parentVehicle = vehicles.find(v => v.id === conn.vehicleId);
      const status = conn.status || 'published';
      items.push({
        id: conn.id,
        entityType: 'connector',
        entityTypeFa: 'سوکت و پین‌اوت',
        title: conn.name || conn.codeName,
        subtitle: `${conn.codeName} - ${conn.pins?.length || 0} از ${conn.pinCount} پایه فعال`,
        vehicleName: parentVehicle ? (parentVehicle.persianName || parentVehicle.name) : undefined,
        status,
        rejectionReason: conn.rejectionReason,
        proposedChanges: conn.proposedChanges,
        submittedBy: conn.submittedBy || conn.updatedBy,
        submittedAt: conn.updatedAt || conn.createdAt,
        reviewedBy: conn.reviewedBy,
        reviewedAt: conn.reviewedAt,
        imageUrl: conn.frontImageUrl || conn.realImageUrl || conn.pinoutDiagramUrl,
        hasProposedChanges: Boolean(conn.proposedChanges && Object.keys(conn.proposedChanges).length > 0),
        rawData: conn
      });
    }

    // 4. FuseBoxes
    const fuseBoxes = this.getFuseBoxes(undefined, false);
    for (const fb of fuseBoxes) {
      const parentVehicle = vehicles.find(v => v.id === fb.vehicleId);
      const status = fb.status || 'published';
      items.push({
        id: fb.id,
        entityType: 'fusebox',
        entityTypeFa: 'جعبه‌فیوز و رله‌ها',
        title: fb.name,
        subtitle: `${fb.locationFa || fb.location} - ${fb.fuses?.length || 0} فیوز و ${fb.relays?.length || 0} رله`,
        vehicleName: parentVehicle ? (parentVehicle.persianName || parentVehicle.name) : undefined,
        status,
        rejectionReason: fb.rejectionReason,
        proposedChanges: fb.proposedChanges,
        submittedBy: fb.submittedBy,
        submittedAt: undefined,
        reviewedBy: fb.reviewedBy,
        reviewedAt: fb.reviewedAt,
        imageUrl: fb.realImageUrl || fb.diagramImageUrl || fb.coverDiagramUrl,
        hasProposedChanges: Boolean(fb.proposedChanges && Object.keys(fb.proposedChanges).length > 0),
        rawData: fb
      });
    }

    // 5. Diagrams
    const diagrams = this.getWiringDiagrams(undefined, false);
    for (const diag of diagrams) {
      const parentVehicle = vehicles.find(v => v.id === diag.vehicleId);
      const status = diag.status || 'published';
      items.push({
        id: diag.id,
        entityType: 'diagram',
        entityTypeFa: 'نقشه سیم‌کشی',
        title: diag.title,
        subtitle: `${diag.categoryFa || diag.category} - ${diag.description || ''}`,
        vehicleName: parentVehicle ? (parentVehicle.persianName || parentVehicle.name) : undefined,
        status,
        rejectionReason: diag.rejectionReason,
        proposedChanges: diag.proposedChanges,
        submittedBy: diag.submittedBy,
        submittedAt: diag.createdAt,
        reviewedBy: diag.reviewedBy,
        reviewedAt: diag.reviewedAt,
        imageUrl: diag.diagramImageUrl,
        hasProposedChanges: Boolean(diag.proposedChanges && Object.keys(diag.proposedChanges).length > 0),
        rawData: diag
      });
    }

    // 6. Media Items
    const media = this.getMediaItems(undefined, false);
    for (const m of media) {
      const parentVehicle = vehicles.find(v => v.id === m.vehicleId);
      const status = m.status || 'published';
      items.push({
        id: m.id,
        entityType: 'media',
        entityTypeFa: 'تصویر و مستند فنی',
        title: m.title,
        subtitle: `${m.imageType} - ${m.description || ''}`,
        vehicleName: parentVehicle ? (parentVehicle.persianName || parentVehicle.name) : undefined,
        status,
        rejectionReason: m.rejectionReason,
        submittedBy: m.uploadedBy,
        submittedAt: m.createdAt,
        reviewedBy: m.reviewedBy,
        reviewedAt: m.reviewedAt,
        imageUrl: m.fileUrl,
        hasProposedChanges: false,
        rawData: m
      });
    }

    return items.filter(item => {
      if (statusFilter && statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      if (typeFilter && typeFilter !== 'all' && item.entityType !== typeFilter) {
        return false;
      }
      return true;
    });
  }

  public getPendingReviewItems(): ApprovalItemSummary[] {
    return this.getAllApprovalItems('pending');
  }

  public approveAndPublishRecord(
    entityType: ApprovalEntityType,
    id: string,
    adminInfo?: { uid?: string; email?: string }
  ): { success: boolean; message: string } {
    const adminEmail = adminInfo?.email || 'مدیر فنی سیستم';
    const now = Date.now();

    if (entityType === 'vehicle') {
      const v = this.getVehicleById(id);
      if (!v) return { success: false, message: 'خودروی مورد نظر یافت نشد.' };
      const updated: Vehicle = {
        ...v,
        ...(v.proposedChanges || {}),
        status: 'published',
        rejectionReason: undefined,
        proposedChanges: undefined,
        reviewedBy: adminEmail,
        reviewedAt: now,
        updatedAt: now
      };
      this.saveVehicle(updated, adminInfo);
      this.createNotification({
        type: 'data_published',
        title: `انتشار خودرو جدید: ${updated.persianName || updated.name}`,
        message: `مشخصات فنی خودرو «${updated.persianName || updated.name}» تأیید و در سامانه منتشر شد.`,
        target: 'all',
        priority: 'normal',
        linkEntity: { entityType: 'vehicle', entityId: id },
        uniqueEventKey: `notif-pub-vehicle-${id}`
      });
      return { success: true, message: `خودروی «${updated.persianName || updated.name}» با موفقیت تأیید و منتشر گردید.` };
    }

    if (entityType === 'ecu') {
      const ecu = this.getECUById(id);
      if (!ecu) return { success: false, message: 'ECU مورد نظر یافت نشد.' };
      const updated: ECU = {
        ...ecu,
        ...(ecu.proposedChanges || {}),
        status: 'published',
        rejectionReason: undefined,
        proposedChanges: undefined,
        reviewedBy: adminEmail,
        reviewedAt: now
      };
      this.saveECU(updated, adminInfo);
      this.createNotification({
        type: 'data_published',
        title: `انتشار ECU جدید: ${updated.brand} ${updated.model}`,
        message: `مشخصات فنی و پین‌آوت‌های ECU «${updated.brand} ${updated.model}» تأیید و منتشر شد.`,
        target: 'all',
        priority: 'normal',
        linkEntity: { entityType: 'ecu', entityId: id },
        uniqueEventKey: `notif-pub-ecu-${id}`
      });
      return { success: true, message: `ای‌سی‌یوی «${updated.brand} ${updated.model}» با موفقیت تأیید و منتشر گردید.` };
    }

    if (entityType === 'connector') {
      const conn = this.getConnectorById(id);
      if (!conn) return { success: false, message: 'سوکت مورد نظر یافت نشد.' };
      const updated: Connector = {
        ...conn,
        ...(conn.proposedChanges || {}),
        status: 'published',
        rejectionReason: undefined,
        proposedChanges: undefined,
        reviewedBy: adminEmail,
        reviewedAt: now,
        updatedAt: now
      };
      if (updated.pins) {
        updated.pins = updated.pins.map(p => ({
          ...p,
          status: p.status === 'rejected' ? 'rejected' : 'published'
        }));
      }
      this.saveConnector(updated, adminInfo);
      this.createNotification({
        type: 'data_published',
        title: `انتشار سوکت و پین‌آوت: ${updated.name || updated.codeName}`,
        message: `نقشه و جدول پایه‌های سوکت «${updated.name || updated.codeName}» تأیید و منتشر شد.`,
        target: 'all',
        priority: 'normal',
        linkEntity: { entityType: 'connector', entityId: id },
        uniqueEventKey: `notif-pub-connector-${id}`
      });
      return { success: true, message: `سوکت «${updated.name || updated.codeName}» با موفقیت تأیید و منتشر گردید.` };
    }

    if (entityType === 'fusebox') {
      const fb = this.getFuseBoxById(id);
      if (!fb) return { success: false, message: 'جعبه‌فیوز مورد نظر یافت نشد.' };
      const updated: FuseBox = {
        ...fb,
        ...(fb.proposedChanges || {}),
        status: 'published',
        rejectionReason: undefined,
        proposedChanges: undefined,
        reviewedBy: adminEmail,
        reviewedAt: now
      };
      if (updated.fuses) {
        updated.fuses = updated.fuses.map(f => ({
          ...f,
          status: f.status === 'rejected' ? 'rejected' : 'published'
        }));
      }
      if (updated.relays) {
        updated.relays = updated.relays.map(r => ({
          ...r,
          status: r.status === 'rejected' ? 'rejected' : 'published'
        }));
      }
      this.saveFuseBox(updated, adminInfo);
      this.createNotification({
        type: 'data_published',
        title: `انتشار راهنمای جعبه‌فیوز: ${updated.name}`,
        message: `جدول فیوزها و رله‌های «${updated.name}» تأیید و در سامانه منتشر شد.`,
        target: 'all',
        priority: 'normal',
        linkEntity: { entityType: 'fusebox', entityId: id },
        uniqueEventKey: `notif-pub-fusebox-${id}`
      });
      return { success: true, message: `جعبه‌فیوز «${updated.name}» با موفقیت تأیید و منتشر گردید.` };
    }

    if (entityType === 'diagram') {
      const diags = this.getWiringDiagrams(undefined, false);
      const diag = diags.find(d => d.id === id);
      if (!diag) return { success: false, message: 'نقشه سیم‌کشی مورد نظر یافت نشد.' };
      const updated: WiringDiagram = {
        ...diag,
        ...(diag.proposedChanges || {}),
        status: 'published',
        rejectionReason: undefined,
        proposedChanges: undefined,
        reviewedBy: adminEmail,
        reviewedAt: now
      };
      this.saveWiringDiagram(updated);
      this.createNotification({
        type: 'data_published',
        title: `انتشار نقشه الکتریکی جدید: ${updated.title}`,
        message: `نقشه سیم‌کشی «${updated.title}» بررسی و با موفقیت منتشر گردید.`,
        target: 'all',
        priority: 'normal',
        linkEntity: { entityType: 'diagram', entityId: id },
        uniqueEventKey: `notif-pub-diagram-${id}`
      });
      return { success: true, message: `نقشه سیم‌کشی «${updated.title}» با موفقیت تأیید و منتشر شد.` };
    }

    if (entityType === 'media') {
      const mediaList = this.getMediaItems(undefined, false);
      const m = mediaList.find(x => x.id === id);
      if (!m) return { success: false, message: 'تصویر مورد نظر یافت نشد.' };
      const updated: MediaItem = {
        ...m,
        status: 'published',
        rejectionReason: undefined,
        reviewedBy: adminEmail,
        reviewedAt: now
      };
      this.saveMediaItem(updated);
      return { success: true, message: `تصویر «${updated.title}» با موفقیت تأیید و منتشر گردید.` };
    }

    return { success: false, message: 'نوع رکورد نامشخص است.' };
  }

  public rejectRecord(
    entityType: ApprovalEntityType,
    id: string,
    reason: string,
    adminInfo?: { uid?: string; email?: string }
  ): { success: boolean; message: string } {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      return { success: false, message: 'لطفاً علت رد اطلاعات را به صورت دقیق و شفاف برای نویسنده بنویسید.' };
    }

    const adminEmail = adminInfo?.email || 'مدیر فنی سیستم';
    const now = Date.now();

    if (entityType === 'vehicle') {
      const v = this.getVehicleById(id);
      if (!v) return { success: false, message: 'خودروی مورد نظر یافت نشد.' };
      const updated: Vehicle = {
        ...v,
        status: 'rejected',
        rejectionReason: trimmedReason,
        reviewedBy: adminEmail,
        reviewedAt: now,
        updatedAt: now
      };
      this.saveVehicle(updated, adminInfo);
      return { success: true, message: `خودروی «${updated.persianName || updated.name}» با ثبت دلیل رد گردید.` };
    }

    if (entityType === 'ecu') {
      const ecu = this.getECUById(id);
      if (!ecu) return { success: false, message: 'ECU مورد نظر یافت نشد.' };
      const updated: ECU = {
        ...ecu,
        status: 'rejected',
        rejectionReason: trimmedReason,
        reviewedBy: adminEmail,
        reviewedAt: now
      };
      this.saveECU(updated, adminInfo);
      return { success: true, message: `ای‌سی‌یوی «${updated.brand} ${updated.model}» با ثبت دلیل رد گردید.` };
    }

    if (entityType === 'connector') {
      const conn = this.getConnectorById(id);
      if (!conn) return { success: false, message: 'سوکت مورد نظر یافت نشد.' };
      const updated: Connector = {
        ...conn,
        status: 'rejected',
        rejectionReason: trimmedReason,
        reviewedBy: adminEmail,
        reviewedAt: now,
        updatedAt: now
      };
      this.saveConnector(updated, adminInfo);
      return { success: true, message: `سوکت «${updated.name || updated.codeName}» با ثبت دلیل رد گردید.` };
    }

    if (entityType === 'fusebox') {
      const fb = this.getFuseBoxById(id);
      if (!fb) return { success: false, message: 'جعبه‌فیوز مورد نظر یافت نشد.' };
      const updated: FuseBox = {
        ...fb,
        status: 'rejected',
        rejectionReason: trimmedReason,
        reviewedBy: adminEmail,
        reviewedAt: now
      };
      this.saveFuseBox(updated, adminInfo);
      return { success: true, message: `جعبه‌فیوز «${updated.name}» با ثبت دلیل رد گردید.` };
    }

    if (entityType === 'diagram') {
      const diags = this.getWiringDiagrams(undefined, false);
      const diag = diags.find(d => d.id === id);
      if (!diag) return { success: false, message: 'نقشه مورد نظر یافت نشد.' };
      const updated: WiringDiagram = {
        ...diag,
        status: 'rejected',
        rejectionReason: trimmedReason,
        reviewedBy: adminEmail,
        reviewedAt: now
      };
      this.saveWiringDiagram(updated);
      return { success: true, message: `نقشه «${updated.title}» با ثبت دلیل رد گردید.` };
    }

    if (entityType === 'media') {
      const mediaList = this.getMediaItems(undefined, false);
      const m = mediaList.find(x => x.id === id);
      if (!m) return { success: false, message: 'تصویر مورد نظر یافت نشد.' };
      const updated: MediaItem = {
        ...m,
        status: 'rejected',
        rejectionReason: trimmedReason,
        reviewedBy: adminEmail,
        reviewedAt: now
      };
      this.saveMediaItem(updated);
      return { success: true, message: `تصویر «${updated.title}» با ثبت دلیل رد گردید.` };
    }

    return { success: false, message: 'نوع رکورد نامعتبر است.' };
  }

  public returnRecordToDraft(
    entityType: ApprovalEntityType,
    id: string,
    adminInfo?: { uid?: string; email?: string }
  ): { success: boolean; message: string } {
    const adminEmail = adminInfo?.email || 'مدیر سیستم';
    const now = Date.now();

    if (entityType === 'vehicle') {
      const v = this.getVehicleById(id);
      if (!v) return { success: false, message: 'خودرو یافت نشد.' };
      this.saveVehicle({ ...v, status: 'draft', reviewedBy: adminEmail, reviewedAt: now }, adminInfo);
      return { success: true, message: 'خودرو به وضعیت پیش‌نویس جهت اصلاح بازگردانده شد.' };
    }

    if (entityType === 'ecu') {
      const ecu = this.getECUById(id);
      if (!ecu) return { success: false, message: 'ECU یافت نشد.' };
      this.saveECU({ ...ecu, status: 'draft', reviewedBy: adminEmail, reviewedAt: now }, adminInfo);
      return { success: true, message: 'ECU به وضعیت پیش‌نویس جهت اصلاح بازگردانده شد.' };
    }

    if (entityType === 'connector') {
      const conn = this.getConnectorById(id);
      if (!conn) return { success: false, message: 'سوکت یافت نشد.' };
      this.saveConnector({ ...conn, status: 'draft', reviewedBy: adminEmail, reviewedAt: now }, adminInfo);
      return { success: true, message: 'سوکت به وضعیت پیش‌نویس جهت اصلاح بازگردانده شد.' };
    }

    if (entityType === 'fusebox') {
      const fb = this.getFuseBoxById(id);
      if (!fb) return { success: false, message: 'جعبه‌فیوز یافت نشد.' };
      this.saveFuseBox({ ...fb, status: 'draft', reviewedBy: adminEmail, reviewedAt: now }, adminInfo);
      return { success: true, message: 'جعبه‌فیوز به وضعیت پیش‌نویس جهت اصلاح بازگردانده شد.' };
    }

    if (entityType === 'diagram') {
      const diags = this.getWiringDiagrams(undefined, false);
      const diag = diags.find(d => d.id === id);
      if (!diag) return { success: false, message: 'نقشه یافت نشد.' };
      this.saveWiringDiagram({ ...diag, status: 'draft', reviewedBy: adminEmail, reviewedAt: now });
      return { success: true, message: 'نقشه به وضعیت پیش‌نویس جهت اصلاح بازگردانده شد.' };
    }

    if (entityType === 'media') {
      const media = this.getMediaItems(undefined, false);
      const m = media.find(x => x.id === id);
      if (!m) return { success: false, message: 'تصویر یافت نشد.' };
      this.saveMediaItem({ ...m, status: 'draft', reviewedBy: adminEmail, reviewedAt: now });
      return { success: true, message: 'تصویر به وضعیت پیش‌نویس جهت اصلاح بازگردانده شد.' };
    }

    return { success: false, message: 'نوع رکورد نامعتبر است.' };
  }

  public submitRecordForReview(
    entityType: ApprovalEntityType,
    id: string,
    adminInfo?: { uid?: string; email?: string }
  ): { success: boolean; message: string } {
    const adminEmail = adminInfo?.email || 'کاربر سیستم';
    const now = Date.now();

    if (entityType === 'vehicle') {
      const v = this.getVehicleById(id);
      if (!v) return { success: false, message: 'خودرو یافت نشد.' };
      this.saveVehicle({ ...v, status: 'pending', submittedBy: adminEmail, updatedAt: now }, adminInfo);
      this.createNotification({
        type: 'approval_pending',
        title: `خودرو در انتظار بررسی: ${v.persianName || v.name}`,
        message: `اطلاعات خودرو توسط ${adminEmail} جهت بررسی و تأیید به صف ارسال گردید.`,
        target: 'admins',
        priority: 'high',
        linkEntity: { entityType: 'approvals', entityId: id },
        uniqueEventKey: `notif-pending-vehicle-${id}-${Math.floor(now / 60000)}`
      });
      return { success: true, message: 'خودرو برای بررسی و تأیید ثبت گردید.' };
    }

    if (entityType === 'ecu') {
      const ecu = this.getECUById(id);
      if (!ecu) return { success: false, message: 'ECU یافت نشد.' };
      this.saveECU({ ...ecu, status: 'pending', submittedBy: adminEmail }, adminInfo);
      this.createNotification({
        type: 'approval_pending',
        title: `ECU در انتظار بررسی: ${ecu.brand} ${ecu.model}`,
        message: `مشخصات ECU توسط ${adminEmail} جهت بررسی و تأیید ارسال شد.`,
        target: 'admins',
        priority: 'high',
        linkEntity: { entityType: 'approvals', entityId: id },
        uniqueEventKey: `notif-pending-ecu-${id}-${Math.floor(now / 60000)}`
      });
      return { success: true, message: 'ECU برای بررسی و تأیید ثبت گردید.' };
    }

    if (entityType === 'connector') {
      const conn = this.getConnectorById(id);
      if (!conn) return { success: false, message: 'سوکت یافت نشد.' };
      this.saveConnector({ ...conn, status: 'pending', submittedBy: adminEmail, updatedAt: now }, adminInfo);
      this.createNotification({
        type: 'approval_pending',
        title: `سوکت و پین‌اوت در انتظار بررسی: ${conn.name || conn.codeName}`,
        message: `اطلاعات سوکت توسط ${adminEmail} جهت بازبینی و تأیید ارسال گردید.`,
        target: 'admins',
        priority: 'high',
        linkEntity: { entityType: 'approvals', entityId: id },
        uniqueEventKey: `notif-pending-conn-${id}-${Math.floor(now / 60000)}`
      });
      return { success: true, message: 'سوکت برای بررسی و تأیید ثبت گردید.' };
    }

    if (entityType === 'fusebox') {
      const fb = this.getFuseBoxById(id);
      if (!fb) return { success: false, message: 'جعبه‌فیوز یافت نشد.' };
      this.saveFuseBox({ ...fb, status: 'pending', submittedBy: adminEmail }, adminInfo);
      this.createNotification({
        type: 'approval_pending',
        title: `جعبه‌فیوز در انتظار بررسی: ${fb.name}`,
        message: `اطلاعات جعبه‌فیوز توسط ${adminEmail} جهت بررسی ارسال شد.`,
        target: 'admins',
        priority: 'high',
        linkEntity: { entityType: 'approvals', entityId: id },
        uniqueEventKey: `notif-pending-fb-${id}-${Math.floor(now / 60000)}`
      });
      return { success: true, message: 'جعبه‌فیوز برای بررسی و تأیید ثبت گردید.' };
    }

    if (entityType === 'diagram') {
      const diags = this.getWiringDiagrams(undefined, false);
      const diag = diags.find(d => d.id === id);
      if (!diag) return { success: false, message: 'نقشه یافت نشد.' };
      this.saveWiringDiagram({ ...diag, status: 'pending', submittedBy: adminEmail });
      this.createNotification({
        type: 'approval_pending',
        title: `نقشه الکتریکی در انتظار بررسی: ${diag.title}`,
        message: `نقشه سیم‌کشی توسط ${adminEmail} جهت بازبینی ارسال شد.`,
        target: 'admins',
        priority: 'high',
        linkEntity: { entityType: 'approvals', entityId: id },
        uniqueEventKey: `notif-pending-diag-${id}-${Math.floor(now / 60000)}`
      });
      return { success: true, message: 'نقشه برای بررسی و تأیید ثبت گردید.' };
    }

    if (entityType === 'media') {
      const media = this.getMediaItems(undefined, false);
      const m = media.find(x => x.id === id);
      if (!m) return { success: false, message: 'تصویر یافت نشد.' };
      this.saveMediaItem({ ...m, status: 'pending', uploadedBy: adminEmail });
      return { success: true, message: 'تصویر برای بررسی و تأیید ثبت گردید.' };
    }

    return { success: false, message: 'نوع رکورد نامعتبر است.' };
  }

  // --- Backup & Restore ---
  public exportBackupJson(): string {
    const backup = {
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      manufacturers: this.getManufacturers(),
      vehicles: this.getVehicles(),
      ecus: this.getECUs(),
      connectors: this.getConnectors(),
      fuseboxes: this.getFuseBoxes(),
      diagrams: this.getWiringDiagrams(),
      images: this.getImages(),
      versions: this.getTechnicalVersions(),
      users: this.getUsers().map(u => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        notes: u.notes
      }))
    };
    return JSON.stringify(backup, null, 2);
  }

  public importBackupJson(jsonStr: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'فایل پشتیبان نامعتبر است.' };
      }
      if (Array.isArray(data.manufacturers)) this.setItem(STORAGE_KEYS.MANUFACTURERS, data.manufacturers);
      if (Array.isArray(data.vehicles)) this.setItem(STORAGE_KEYS.VEHICLES, data.vehicles);
      if (Array.isArray(data.ecus)) this.setItem(STORAGE_KEYS.ECUS, data.ecus);
      if (Array.isArray(data.connectors)) this.setItem(STORAGE_KEYS.CONNECTORS, data.connectors);
      if (Array.isArray(data.fuseboxes)) this.setItem(STORAGE_KEYS.FUSEBOXES, data.fuseboxes);
      if (Array.isArray(data.diagrams)) this.setItem(STORAGE_KEYS.DIAGRAMS, data.diagrams);
      if (Array.isArray(data.images)) this.setItem(STORAGE_KEYS.IMAGES, data.images);
      if (Array.isArray(data.versions)) this.setItem(STORAGE_KEYS.VERSIONS, data.versions);
      if (Array.isArray(data.users)) {
        // Ensure master admin stays preserved
        const importedUsers: AppUserProfile[] = data.users;
        if (!importedUsers.some(u => u.email?.toLowerCase() === 'arefalikhani69@gmail.com')) {
          importedUsers.unshift(SEED_USERS[0]);
        }
        this.setItem(STORAGE_KEYS.USERS, importedUsers);
      }

      return { success: true, message: 'بانک اطلاعاتی با موفقیت بازیابی شد.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطای ناشناخته';
      return { success: false, message: `خطا در خواندن فایل پشتیبان: ${msg}` };
    }
  }

  // --- User Display & UX Customization Settings ---
  public getDisplaySettings(userId?: string): UserDisplaySettings {
    const key = `autopin_display_settings_${userId || 'guest'}`;
    const raw = this.getItem<UserDisplaySettings | null>(key, null);
    if (!raw) return { ...DEFAULT_DISPLAY_SETTINGS };
    return {
      ...DEFAULT_DISPLAY_SETTINGS,
      ...raw
    };
  }

  public saveDisplaySettings(settings: UserDisplaySettings, userId?: string): void {
    const key = `autopin_display_settings_${userId || 'guest'}`;
    this.setItem(key, settings);
  }

  public resetDisplaySettings(userId?: string): UserDisplaySettings {
    const key = `autopin_display_settings_${userId || 'guest'}`;
    if (this.isClient) {
      localStorage.removeItem(key);
    }
    return { ...DEFAULT_DISPLAY_SETTINGS };
  }
}

const FIELD_LABELS_FA: Record<string, string> = {
  name: 'نام / عنوان',
  persianName: 'نام فارسی خودرو',
  generation: 'نسل و تیپ',
  modelYears: 'سال‌های تولید',
  electricalSystem: 'سیستم برق',
  codeName: 'کد فنی و نام سوکت',
  brand: 'برند / سازنده',
  model: 'مدل و پارت‌نامبر',
  hardwareVersion: 'نسخه سخت‌افزار',
  softwareVersion: 'نسخه نرم‌افزار',
  connectorCount: 'تعداد سوکت‌ها',
  category: 'دسته‌بندی',
  pinCount: 'ظرفیت کل پایه‌ها',
  rows: 'تعداد ردیف‌ها',
  cols: 'تعداد ستون‌ها',
  shape: 'طرح چیدمان سوکت',
  socketColor: 'رنگ بدنه سوکت',
  location: 'موقعیت نصب',
  locationFa: 'موقعیت نصب (فارسی)',
  vehicleId: 'شناسه خودرو',
  ecuId: 'شناسه ECU',
  pins: 'پین‌اوت و سیم‌بندی پایه‌ها',
  fuses: 'جدول مشخصات فیوزها',
  relays: 'جدول مشخصات رله‌ها',
  notes: 'توضیحات و نکات فنی',
  source: 'مرجع اطلاعات',
  status: 'وضعیت انتشار',
  rejectionReason: 'علت رد اطلاعات',
  description: 'توضیحات تکمیلی',
  realImageUrl: 'تصویر واقعی',
  diagramImageUrl: 'تصویر نقشه',
  frontImageUrl: 'نمای روبه‌روی سوکت',
  backImageUrl: 'نمای پشت سوکت',
  pinoutDiagramUrl: 'نقشه پین‌اوت'
};

function sanitizeAuditDetails(details?: Record<string, any>): Record<string, any> | undefined {
  if (!details || typeof details !== 'object') return undefined;
  const clone = JSON.parse(JSON.stringify(details));
  const sensitiveKeys = ['password', 'passcode', 'adminPass', 'token', 'secret', 'apiKey', 'authToken'];
  for (const k of sensitiveKeys) {
    delete clone[k];
  }
  for (const k of Object.keys(clone)) {
    if (typeof clone[k] === 'string' && clone[k].startsWith('data:image/') && clone[k].length > 100) {
      clone[k] = '[تصویر_فشرده]';
    }
  }
  return clone;
}

function sanitizeVersionSnapshot(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = JSON.parse(JSON.stringify(obj));
  const sensitiveKeys = ['password', 'passcode', 'adminPass', 'token', 'secret', 'updatedAt'];
  for (const k of sensitiveKeys) {
    delete clone[k];
  }
  for (const k of Object.keys(clone)) {
    if (typeof clone[k] === 'string' && clone[k].startsWith('data:image/') && clone[k].length > 300) {
      clone[k] = '[تصویر_فشرده_شده]';
    }
  }
  return clone;
}

function calculateSnapshotDiffs(
  cleanPrev: any,
  cleanNew: any,
  operation: VersionOperation
): { changedFields: string[]; diffs: FieldDiff[] } {
  const diffs: FieldDiff[] = [];
  const changedFields: string[] = [];

  if (operation === 'create' || !cleanPrev) {
    changedFields.push('ایجاد رکورد');
    return { changedFields, diffs };
  }

  if (operation === 'delete' || !cleanNew || Object.keys(cleanNew).length === 0) {
    changedFields.push('حذف رکورد');
    return { changedFields, diffs };
  }

  const allKeys = Array.from(new Set([...Object.keys(cleanPrev), ...Object.keys(cleanNew)]));

  for (const key of allKeys) {
    const oldVal = cleanPrev[key];
    const newVal = cleanNew[key];

    // Array comparison (pins, fuses, relays)
    if (Array.isArray(oldVal) || Array.isArray(newVal)) {
      const oldArr = Array.isArray(oldVal) ? oldVal : [];
      const newArr = Array.isArray(newVal) ? newVal : [];
      const oldStr = JSON.stringify(oldArr);
      const newStr = JSON.stringify(newArr);

      if (oldStr !== newStr) {
        changedFields.push(key);
        const label = FIELD_LABELS_FA[key] || key;

        let oldSummary = `${oldArr.length} مورد`;
        let newSummary = `${newArr.length} مورد`;

        if (key === 'pins') {
          oldSummary = `${oldArr.length} پایه (${oldArr.map((p: any) => p.pinNumber).slice(0, 5).join('، ')}${oldArr.length > 5 ? '...' : ''})`;
          newSummary = `${newArr.length} پایه (${newArr.map((p: any) => p.pinNumber).slice(0, 5).join('، ')}${newArr.length > 5 ? '...' : ''})`;
        } else if (key === 'fuses') {
          oldSummary = `${oldArr.length} فیوز (${oldArr.map((f: any) => f.code).slice(0, 5).join('، ')}${oldArr.length > 5 ? '...' : ''})`;
          newSummary = `${newArr.length} فیوز (${newArr.map((f: any) => f.code).slice(0, 5).join('، ')}${newArr.length > 5 ? '...' : ''})`;
        } else if (key === 'relays') {
          oldSummary = `${oldArr.length} رله (${oldArr.map((r: any) => r.code).slice(0, 5).join('، ')}${oldArr.length > 5 ? '...' : ''})`;
          newSummary = `${newArr.length} رله (${newArr.map((r: any) => r.code).slice(0, 5).join('، ')}${newArr.length > 5 ? '...' : ''})`;
        }

        diffs.push({
          field: key,
          fieldLabelFa: label,
          oldValue: oldSummary,
          newValue: newSummary
        });
      }
      continue;
    }

    // Primitive values
    const oldStr = JSON.stringify(oldVal === undefined ? null : oldVal);
    const newStr = JSON.stringify(newVal === undefined ? null : newVal);

    if (oldStr !== newStr) {
      changedFields.push(key);
      const label = FIELD_LABELS_FA[key] || key;
      diffs.push({
        field: key,
        fieldLabelFa: label,
        oldValue: oldVal ?? '—',
        newValue: newVal ?? '—'
      });
    }
  }

  return { changedFields, diffs };
}

export const storage = new StorageService();
// Initialize right away
storage.initDatabase();

import JSZip from 'jszip';
import {
  Vehicle,
  ECU,
  Connector,
  FuseBox,
  WiringDiagram,
  MediaItem,
  AppImage,
  Manufacturer
} from '../types';
import { storage } from './storage';
import { onlineStorage, sanitizeForFirestore } from './onlineStorage';

export const BACKUP_SCHEMA_VERSION = '2.1.0';
const LAST_BACKUP_STORAGE_KEY = 'autopin_last_backup_meta_v2';
const LOCAL_SNAPSHOTS_KEY = 'autopin_backup_snapshots_v1';

export type BackupType = 'full' | 'data_only' | 'images_only';

export interface BackupManifest {
  appName: 'AutoPin Pro';
  version: string;
  schemaVersion: string;
  backupType: BackupType;
  createdAt: string;
  createdAtTimestamp: number;
  authorEmail?: string;
  checksum: string;
  recordCounts: {
    manufacturers: number;
    vehicles: number;
    ecus: number;
    connectors: number;
    pins: number;
    fuseBoxes: number;
    fuses: number;
    relays: number;
    wiringDiagrams: number;
    mediaItems: number;
    appImages: number;
  };
  totalImagesCount: number;
  description: string;
}

export interface BackupDataPayload {
  manifest: BackupManifest;
  data: {
    manufacturers: Manufacturer[];
    vehicles: Vehicle[];
    ecus: ECU[];
    connectors: Connector[];
    fuseBoxes: FuseBox[];
    wiringDiagrams: WiringDiagram[];
    mediaItems: MediaItem[];
    appImages: AppImage[];
  };
  imagesData?: Record<string, string>; // imageId/filename -> dataUrl base64
}

export interface BackupIntegrityCheckResult {
  isValid: boolean;
  manifest: BackupManifest;
  warnings: string[];
  errors: string[];
  conflicts: {
    newVehicles: number;
    existingVehicles: number;
    newConnectors: number;
    existingConnectors: number;
    newFuseBoxes: number;
    existingFuseBoxes: number;
    newEcus: number;
    existingEcus: number;
  };
  payload: BackupDataPayload;
}

export interface LastBackupInfo {
  timestamp: number;
  formattedDate: string;
  backupType: BackupType;
  fileName: string;
  fileSizeBytes: number;
  recordCounts: BackupManifest['recordCounts'];
}

export interface LocalSnapshotItem {
  id: string;
  createdAt: number;
  formattedDate: string;
  description: string;
  recordCounts: BackupManifest['recordCounts'];
  jsonPayload: string;
}

/**
 * Calculates a lightweight deterministic hash code for integrity verification.
 */
function calculateSimpleChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash-${Math.abs(hash).toString(16)}`;
}

class BackupService {
  /**
   * Reads information about the last created backup.
   */
  public getLastBackupInfo(): LastBackupInfo | null {
    try {
      const data = localStorage.getItem(LAST_BACKUP_STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data) as LastBackupInfo;
    } catch {
      return null;
    }
  }

  /**
   * Saves information about the latest backup.
   */
  private saveLastBackupInfo(info: LastBackupInfo): void {
    try {
      localStorage.setItem(LAST_BACKUP_STORAGE_KEY, JSON.stringify(info));
    } catch (err) {
      console.warn('Failed to save last backup metadata:', err);
    }
  }

  /**
   * Retrieves automatic pre-restore safety snapshots.
   */
  public getLocalSnapshots(): LocalSnapshotItem[] {
    try {
      const data = localStorage.getItem(LOCAL_SNAPSHOTS_KEY);
      if (!data) return [];
      return JSON.parse(data) as LocalSnapshotItem[];
    } catch {
      return [];
    }
  }

  /**
   * Saves a safety snapshot of current data before overwriting.
   */
  public createSafetySnapshot(description = 'پیش از بازیابی اطلاعات'): LocalSnapshotItem {
    const currentPayload = this.collectCurrentData('data_only', 'سیستم خودکار امنیتی');
    const item: LocalSnapshotItem = {
      id: `snap-${Date.now()}`,
      createdAt: Date.now(),
      formattedDate: new Intl.DateTimeFormat('fa-IR', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date()),
      description,
      recordCounts: currentPayload.manifest.recordCounts,
      jsonPayload: JSON.stringify(currentPayload)
    };

    const snapshots = this.getLocalSnapshots();
    // Keep maximum 5 snapshots
    const updated = [item, ...snapshots].slice(0, 5);
    localStorage.setItem(LOCAL_SNAPSHOTS_KEY, JSON.stringify(updated));
    return item;
  }

  /**
   * Gathers all technical entities safely from storage without sensitive keys.
   */
  public collectCurrentData(type: BackupType = 'full', authorEmail?: string): BackupDataPayload {
    const manufacturers = storage.getManufacturers();
    const vehicles = storage.getVehicles();
    const ecus = storage.getECUs();
    const connectors = storage.getConnectors();
    const fuseBoxes = storage.getFuseBoxes();
    const wiringDiagrams = storage.getWiringDiagrams();
    const mediaItems = storage.getMediaItems();
    const appImages = storage.getImages();

    let pinsCount = 0;
    connectors.forEach(c => {
      pinsCount += c.pins?.length || 0;
    });

    let fusesCount = 0;
    let relaysCount = 0;
    fuseBoxes.forEach(fb => {
      fusesCount += fb.fuses?.length || 0;
      relaysCount += fb.relays?.length || 0;
    });

    const recordCounts = {
      manufacturers: manufacturers.length,
      vehicles: vehicles.length,
      ecus: ecus.length,
      connectors: connectors.length,
      pins: pinsCount,
      fuseBoxes: fuseBoxes.length,
      fuses: fusesCount,
      relays: relaysCount,
      wiringDiagrams: wiringDiagrams.length,
      mediaItems: mediaItems.length,
      appImages: appImages.length
    };

    const now = new Date();
    const rawDataForHash = JSON.stringify({ vehicles, connectors, fuseBoxes, ecus });
    const checksum = calculateSimpleChecksum(rawDataForHash);

    const manifest: BackupManifest = {
      appName: 'AutoPin Pro',
      version: '1.0.0',
      schemaVersion: BACKUP_SCHEMA_VERSION,
      backupType: type,
      createdAt: now.toISOString(),
      createdAtTimestamp: now.getTime(),
      authorEmail: authorEmail ? authorEmail.trim() : undefined,
      checksum,
      recordCounts,
      totalImagesCount: mediaItems.length + wiringDiagrams.length + appImages.length,
      description: `پشتیبان اطلاعات فنی AutoPin Pro شامل اطلاعات تخصصی خودروها، ECU، سوکت‌ها و جعبه‌فیوزها`
    };

    // Filter data based on backup type
    const data = {
      manufacturers: type === 'images_only' ? [] : manufacturers,
      vehicles: type === 'images_only' ? [] : vehicles,
      ecus: type === 'images_only' ? [] : ecus,
      connectors: type === 'images_only' ? [] : connectors,
      fuseBoxes: type === 'images_only' ? [] : fuseBoxes,
      wiringDiagrams: wiringDiagrams,
      mediaItems: mediaItems,
      appImages: appImages
    };

    return {
      manifest,
      data
    };
  }

  /**
   * Generates a packaged ZIP file containing structured JSON, media files, and manifest.
   */
  public async generateZipBackup(
    type: BackupType = 'full',
    authorEmail?: string,
    onProgress?: (progressPct: number, stageName: string) => void
  ): Promise<{ blob: Blob; fileName: string; sizeBytes: number; manifest: BackupManifest }> {
    onProgress?.(5, 'در حال گردآوری اطلاعات پایگاه داده...');
    const payload = this.collectCurrentData(type, authorEmail);

    const zip = new JSZip();
    onProgress?.(20, 'در حال سازمان‌دهی ساختار فایل پشتیبان...');

    // 1. Add manifest
    zip.file('manifest.json', JSON.stringify(payload.manifest, null, 2));

    // 2. Add technical report
    const faDate = new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'full',
      timeStyle: 'medium'
    }).format(new Date());

    const reportContent = `=====================================================
گزارش رسمی تهیه نسخه پشتیبان بانک اطلاعاتی AutoPin Pro
=====================================================
تاریخ ایجاد: ${faDate}
شناسه اعتبارسنجی: ${payload.manifest.checksum}
نسخه ساختار داده: ${payload.manifest.schemaVersion}
نوع نسخه: ${type === 'full' ? 'پشتیبان کامل (داده‌ها + تصاویر)' : type === 'data_only' ? 'پشتیبان سبک (فقط داده‌های فنی)' : 'پشتیبان تصاویر و نقشه‌ها'}
تهیه‌کننده: ${payload.manifest.authorEmail || 'مدیر سیستم'}

آمار رکوردهای ثبت‌شده:
- تعداد خودروها: ${payload.manifest.recordCounts.vehicles}
- تعداد ECUها: ${payload.manifest.recordCounts.ecus}
- تعداد سوکت‌ها: ${payload.manifest.recordCounts.connectors}
- تعداد کل پایه‌ها (پین‌ها): ${payload.manifest.recordCounts.pins}
- تعداد جعبه‌فیوزها: ${payload.manifest.recordCounts.fuseBoxes}
- تعداد فیوزها: ${payload.manifest.recordCounts.fuses}
- تعداد رله‌ها: ${payload.manifest.recordCounts.relays}
- تعداد نقشه‌های سیم‌کشی: ${payload.manifest.recordCounts.wiringDiagrams}
- تعداد تصاویر و مستندات فنی: ${payload.manifest.recordCounts.mediaItems}
=====================================================
نکته امنیتی: اطلاعات ورود، رمزهای عبور و توکن‌ها در این فایل وارد نشده‌اند.
`;
    zip.file('backup_report.txt', reportContent);

    // 3. Database folder
    const dbFolder = zip.folder('database');
    if (dbFolder) {
      dbFolder.file('manufacturers.json', JSON.stringify(payload.data.manufacturers, null, 2));
      dbFolder.file('vehicles.json', JSON.stringify(payload.data.vehicles, null, 2));
      dbFolder.file('ecus.json', JSON.stringify(payload.data.ecus, null, 2));
      dbFolder.file('connectors.json', JSON.stringify(payload.data.connectors, null, 2));
      dbFolder.file('fuseBoxes.json', JSON.stringify(payload.data.fuseBoxes, null, 2));
      dbFolder.file('wiringDiagrams.json', JSON.stringify(payload.data.wiringDiagrams, null, 2));
      dbFolder.file('mediaItems.json', JSON.stringify(payload.data.mediaItems, null, 2));
      dbFolder.file('appImages.json', JSON.stringify(payload.data.appImages, null, 2));
    }

    // 4. Images folder (If full or images_only)
    if (type !== 'data_only') {
      onProgress?.(45, 'در حال پردازش و فشرده‌سازی فایل‌های تصویری...');
      const imagesFolder = zip.folder('images');
      if (imagesFolder) {
        // Collect actual base64/data URLs
        let imgIdx = 0;
        const totalImgs = payload.data.mediaItems.length + payload.data.appImages.length;

        for (const media of payload.data.mediaItems) {
          if (media.fileUrl && media.fileUrl.startsWith('data:image')) {
            try {
              const base64Data = media.fileUrl.split(',')[1];
              const ext = media.fileUrl.includes('png') ? 'png' : 'jpg';
              imagesFolder.file(`media_${media.id}.${ext}`, base64Data, { base64: true });
            } catch (err) {
              console.warn('Error archiving media item:', media.id, err);
            }
          }
          imgIdx++;
          if (totalImgs > 0 && imgIdx % 5 === 0) {
            const pct = 45 + Math.round((imgIdx / totalImgs) * 35);
            onProgress?.(pct, `در حال بسته‌بندی تصویر ${imgIdx} از ${totalImgs}...`);
          }
        }

        for (const appImg of payload.data.appImages) {
          if (appImg.dataUrl && appImg.dataUrl.startsWith('data:image')) {
            try {
              const base64Data = appImg.dataUrl.split(',')[1];
              imagesFolder.file(`app_img_${appImg.id}.jpg`, base64Data, { base64: true });
            } catch (err) {
              console.warn('Error archiving app image:', appImg.id, err);
            }
          }
        }
      }
    }

    onProgress?.(85, 'در حال تولید نهایی فایل فشرده ZIP...');

    const blob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      },
      (metadata) => {
        const pct = 85 + Math.round((metadata.percent / 100) * 12);
        onProgress?.(pct, `در حال فشرده‌سازی نهایی: ${Math.round(metadata.percent)}%`);
      }
    );

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `AutoPinPro-Backup-${type}-${dateStr}.zip`;

    // Record last backup info
    this.saveLastBackupInfo({
      timestamp: Date.now(),
      formattedDate: faDate,
      backupType: type,
      fileName,
      fileSizeBytes: blob.size,
      recordCounts: payload.manifest.recordCounts
    });

    onProgress?.(100, 'فایل پشتیبان با موفقیت ساخته شد.');
    return {
      blob,
      fileName,
      sizeBytes: blob.size,
      manifest: payload.manifest
    };
  }

  /**
   * Generates a lightweight single JSON file.
   */
  public generateJsonBackup(
    type: BackupType = 'data_only',
    authorEmail?: string
  ): { jsonStr: string; fileName: string; sizeBytes: number; manifest: BackupManifest } {
    const payload = this.collectCurrentData(type, authorEmail);
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `AutoPinPro-Backup-${dateStr}.json`;

    const faDate = new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'full',
      timeStyle: 'medium'
    }).format(new Date());

    this.saveLastBackupInfo({
      timestamp: Date.now(),
      formattedDate: faDate,
      backupType: type,
      fileName,
      fileSizeBytes: blob.size,
      recordCounts: payload.manifest.recordCounts
    });

    return {
      jsonStr,
      fileName,
      sizeBytes: blob.size,
      manifest: payload.manifest
    };
  }

  /**
   * Pre-inspects and validates an uploaded backup file (either ZIP or JSON).
   */
  public async inspectAndValidateBackupFile(file: File): Promise<BackupIntegrityCheckResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    const isZip = file.name.endsWith('.zip') || file.type.includes('zip');
    let payload: BackupDataPayload | null = null;

    if (isZip) {
      try {
        const zip = await JSZip.loadAsync(file);

        // Check manifest.json
        const manifestFile = zip.file('manifest.json');
        if (!manifestFile) {
          errors.push('فایل مانیفست (manifest.json) در بسته پشتیبان یافت نشد.');
        } else {
          const manifestJson = await manifestFile.async('text');
          const parsedManifest = JSON.parse(manifestJson) as BackupManifest;

          if (parsedManifest.appName !== 'AutoPin Pro') {
            warnings.push('نام برنامه در فایل پشتیبان با AutoPin Pro یکسان نیست.');
          }

          // Read database JSON files
          const readJsonFromZip = async <T>(path: string, fallback: T): Promise<T> => {
            const f = zip.file(path);
            if (!f) return fallback;
            try {
              const text = await f.async('text');
              return JSON.parse(text) as T;
            } catch {
              warnings.push(`فایل ${path} قابل بازخوانی نبود.`);
              return fallback;
            }
          };

          const manufacturers = await readJsonFromZip<Manufacturer[]>('database/manufacturers.json', []);
          const vehicles = await readJsonFromZip<Vehicle[]>('database/vehicles.json', []);
          const ecus = await readJsonFromZip<ECU[]>('database/ecus.json', []);
          const connectors = await readJsonFromZip<Connector[]>('database/connectors.json', []);
          const fuseBoxes = await readJsonFromZip<FuseBox[]>('database/fuseBoxes.json', []);
          const wiringDiagrams = await readJsonFromZip<WiringDiagram[]>('database/wiringDiagrams.json', []);
          const mediaItems = await readJsonFromZip<MediaItem[]>('database/mediaItems.json', []);
          const appImages = await readJsonFromZip<AppImage[]>('database/appImages.json', []);

          // Verify images present in images/ folder
          const imgFiles = zip.file(/^images\//);
          if (imgFiles.length > 0) {
            // Map image blobs back into dataUrls for restore
            for (const imgFile of imgFiles) {
              if (!imgFile.dir) {
                const base64 = await imgFile.async('base64');
                const isPng = imgFile.name.endsWith('.png');
                const dataUrl = `data:image/${isPng ? 'png' : 'jpeg'};base64,${base64}`;

                // Associate with media item or connector if found
                const mediaIdMatch = imgFile.name.match(/media_([^.]+)/);
                if (mediaIdMatch) {
                  const mediaId = mediaIdMatch[1];
                  const m = mediaItems.find(item => item.id === mediaId);
                  if (m) m.fileUrl = dataUrl;
                }
              }
            }
          }

          payload = {
            manifest: parsedManifest,
            data: {
              manufacturers,
              vehicles,
              ecus,
              connectors,
              fuseBoxes,
              wiringDiagrams,
              mediaItems,
              appImages
            }
          };
        }
      } catch (err: unknown) {
        errors.push(`خطا در باز کردن فایل فشرده ZIP: ${err instanceof Error ? err.message : 'فرمت نامعتبر'}`);
      }
    } else {
      // JSON File
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);

        // Check format: modern package with manifest vs legacy flat format
        if (parsed.manifest && parsed.data) {
          payload = parsed as BackupDataPayload;
        } else if (parsed.vehicles || parsed.connectors || parsed.fuseboxes) {
          // Legacy format compatibility
          const v = parsed.vehicles || [];
          const c = parsed.connectors || [];
          const fb = parsed.fuseboxes || parsed.fuseBoxes || [];
          const e = parsed.ecus || [];

          warnings.push('این فایل از قالب نسخه قبلی برنامه (Legacy JSON) است و به ساختار جدید تبدیل خواهد شد.');

          payload = {
            manifest: {
              appName: 'AutoPin Pro',
              version: '1.0.0',
              schemaVersion: '1.0.0',
              backupType: 'data_only',
              createdAt: parsed.exportedAt || new Date().toISOString(),
              createdAtTimestamp: Date.now(),
              checksum: 'legacy-import',
              recordCounts: {
                manufacturers: (parsed.manufacturers || []).length,
                vehicles: v.length,
                ecus: e.length,
                connectors: c.length,
                pins: 0,
                fuseBoxes: fb.length,
                fuses: 0,
                relays: 0,
                wiringDiagrams: (parsed.diagrams || []).length,
                mediaItems: 0,
                appImages: (parsed.images || []).length
              },
              totalImagesCount: (parsed.images || []).length,
              description: 'ورود اطلاعات از نسخه قبلی'
            },
            data: {
              manufacturers: parsed.manufacturers || [],
              vehicles: v,
              ecus: e,
              connectors: c,
              fuseBoxes: fb,
              wiringDiagrams: parsed.diagrams || [],
              mediaItems: [],
              appImages: parsed.images || []
            }
          };
        } else {
          errors.push('ساختار فایل JSON با استانداردهای AutoPin Pro مطابقت ندارد.');
        }
      } catch (err: unknown) {
        errors.push(`خطا در پردازش فایل JSON: ${err instanceof Error ? err.message : 'فرمت نامعتبر'}`);
      }
    }

    if (!payload) {
      return {
        isValid: false,
        manifest: {
          appName: 'AutoPin Pro',
          version: '1.0.0',
          schemaVersion: BACKUP_SCHEMA_VERSION,
          backupType: 'data_only',
          createdAt: new Date().toISOString(),
          createdAtTimestamp: Date.now(),
          checksum: '',
          recordCounts: {
            manufacturers: 0,
            vehicles: 0,
            ecus: 0,
            connectors: 0,
            pins: 0,
            fuseBoxes: 0,
            fuses: 0,
            relays: 0,
            wiringDiagrams: 0,
            mediaItems: 0,
            appImages: 0
          },
          totalImagesCount: 0,
          description: 'فایل نامعتبر'
        },
        warnings,
        errors,
        conflicts: {
          newVehicles: 0,
          existingVehicles: 0,
          newConnectors: 0,
          existingConnectors: 0,
          newFuseBoxes: 0,
          existingFuseBoxes: 0,
          newEcus: 0,
          existingEcus: 0
        },
        payload: {
          manifest: {} as any,
          data: {} as any
        }
      };
    }

    // Deep Integrity & Relational Validation
    const currentVehicles = storage.getVehicles();
    const currentConnectors = storage.getConnectors();
    const currentFuseBoxes = storage.getFuseBoxes();
    const currentEcus = storage.getECUs();

    let newVeh = 0;
    let existVeh = 0;
    payload.data.vehicles?.forEach(v => {
      if (currentVehicles.some(cv => cv.id === v.id || cv.name.toLowerCase() === v.name.toLowerCase())) {
        existVeh++;
      } else {
        newVeh++;
      }
    });

    let newConn = 0;
    let existConn = 0;
    payload.data.connectors?.forEach(c => {
      if (currentConnectors.some(cc => cc.id === c.id)) {
        existConn++;
      } else {
        newConn++;
      }
    });

    let newFb = 0;
    let existFb = 0;
    payload.data.fuseBoxes?.forEach(fb => {
      if (currentFuseBoxes.some(cfb => cfb.id === fb.id)) {
        existFb++;
      } else {
        newFb++;
      }
    });

    let newE = 0;
    let existE = 0;
    payload.data.ecus?.forEach(e => {
      if (currentEcus.some(ce => ce.id === e.id)) {
        existE++;
      } else {
        newE++;
      }
    });

    // Check essential schema fields
    if (payload.data.vehicles?.some(v => !v.id || !v.name)) {
      warnings.push('برخی از رکوردهای خودرو فاقد شناسه یکتا یا نام هستند.');
    }
    if (payload.data.connectors?.some(c => !c.id || !c.name)) {
      warnings.push('برخی از سوکت‌ها فاقد عنوان یا شناسه معتبر هستند.');
    }

    return {
      isValid: errors.length === 0,
      manifest: payload.manifest,
      warnings,
      errors,
      conflicts: {
        newVehicles: newVeh,
        existingVehicles: existVeh,
        newConnectors: newConn,
        existingConnectors: existConn,
        newFuseBoxes: newFb,
        existingFuseBoxes: existFb,
        newEcus: newE,
        existingEcus: existE
      },
      payload
    };
  }

  /**
   * Executes the restoration process either as Smart Merge or Complete Overwrite.
   */
  public async executeRestore(
    payload: BackupDataPayload,
    mode: 'merge' | 'overwrite',
    isAdmin: boolean,
    isOnlineDbConnected: boolean,
    onProgress?: (progressPct: number, statusText: string) => void
  ): Promise<{
    success: boolean;
    summary: string;
    stats: {
      added: number;
      updated: number;
      skipped: number;
    };
  }> {
    let added = 0;
    let updated = 0;
    let skipped = 0;

    // If overwrite mode, automatically create safety snapshot first!
    if (mode === 'overwrite') {
      onProgress?.(5, 'در حال تهیه نسخه پشتیبان اضطراری پیش از جایگزینی کامل...');
      this.createSafetySnapshot('پشتیبان خودکار پیش از جایگزینی کامل اطلاعات');
    }

    onProgress?.(15, 'در حال پردازش موجودیت‌های پشتیبان...');

    const incoming = payload.data;

    // 1. Manufacturers
    if (incoming.manufacturers && incoming.manufacturers.length > 0) {
      if (mode === 'overwrite') {
        incoming.manufacturers.forEach(m => storage.saveManufacturer(m));
      } else {
        const existing = storage.getManufacturers();
        incoming.manufacturers.forEach(m => {
          if (!existing.some(em => em.id === m.id)) {
            storage.saveManufacturer(m);
            added++;
          }
        });
      }
    }

    // 2. Vehicles
    if (incoming.vehicles && incoming.vehicles.length > 0) {
      onProgress?.(30, 'در حال بازیابی خودروها و مشخصات موتورها...');
      const existingVehicles = storage.getVehicles();

      for (const veh of incoming.vehicles) {
        const isExisting = existingVehicles.some(v => v.id === veh.id);
        if (isExisting) {
          if (mode === 'overwrite' || mode === 'merge') {
            storage.saveVehicle(veh);
            if (isAdmin && isOnlineDbConnected) {
              try {
                await onlineStorage.saveVehicle(veh);
              } catch (e) {
                console.warn('Sync vehicle failed:', e);
              }
            }
            updated++;
          } else {
            skipped++;
          }
        } else {
          storage.saveVehicle(veh);
          if (isAdmin && isOnlineDbConnected) {
            try {
              await onlineStorage.saveVehicle(veh);
            } catch (e) {
              console.warn('Sync vehicle failed:', e);
            }
          }
          added++;
        }
      }
    }

    // 3. ECUs
    if (incoming.ecus && incoming.ecus.length > 0) {
      onProgress?.(50, 'در حال بازیابی اطلاعات ECUها...');
      const existingEcus = storage.getECUs();
      for (const ecu of incoming.ecus) {
        const isExisting = existingEcus.some(e => e.id === ecu.id);
        storage.saveECU(ecu);
        if (isAdmin && isOnlineDbConnected) {
          try {
            await onlineStorage.saveECU(ecu);
          } catch (e) {
            console.warn('Sync ECU failed:', e);
          }
        }
        if (isExisting) updated++;
        else added++;
      }
    }

    // 4. Connectors & Pins
    if (incoming.connectors && incoming.connectors.length > 0) {
      onProgress?.(70, 'در حال بازیابی سوکت‌ها و نقشه‌های پین‌اوت...');
      const existingConnectors = storage.getConnectors();
      for (const conn of incoming.connectors) {
        const isExisting = existingConnectors.some(c => c.id === conn.id);
        storage.saveConnector(conn);
        if (isAdmin && isOnlineDbConnected) {
          try {
            await onlineStorage.saveConnector(conn);
          } catch (e) {
            console.warn('Sync connector failed:', e);
          }
        }
        if (isExisting) updated++;
        else added++;
      }
    }

    // 5. FuseBoxes, Fuses, Relays & Hotspots
    if (incoming.fuseBoxes && incoming.fuseBoxes.length > 0) {
      onProgress?.(85, 'در حال بازیابی جعبه‌فیوزها، فیوزها و موقعیت‌های رله...');
      const existingFb = storage.getFuseBoxes();
      for (const fb of incoming.fuseBoxes) {
        const isExisting = existingFb.some(f => f.id === fb.id);
        storage.saveFuseBox(fb);
        if (isAdmin && isOnlineDbConnected) {
          try {
            await onlineStorage.saveFuseBox(fb);
          } catch (e) {
            console.warn('Sync fusebox failed:', e);
          }
        }
        if (isExisting) updated++;
        else added++;
      }
    }

    // 6. Wiring Diagrams
    if (incoming.wiringDiagrams && incoming.wiringDiagrams.length > 0) {
      onProgress?.(92, 'در حال بازیابی نقشه‌های سیم‌کشی...');
      for (const diag of incoming.wiringDiagrams) {
        storage.saveWiringDiagram(diag);
        if (isAdmin && isOnlineDbConnected) {
          try {
            await onlineStorage.saveWiringDiagram(diag);
          } catch (e) {
            console.warn('Sync diagram failed:', e);
          }
        }
      }
    }

    // 7. Media & Technical Images
    if (incoming.mediaItems && incoming.mediaItems.length > 0) {
      onProgress?.(96, 'در حال بازیابی تصاویر و مستندات فنی...');
      for (const media of incoming.mediaItems) {
        storage.saveMediaItem(media);
        if (isAdmin && isOnlineDbConnected) {
          try {
            await onlineStorage.saveMedia(media);
          } catch (e) {
            console.warn('Sync media failed:', e);
          }
        }
      }
    }

    onProgress?.(100, 'بازیابی اطلاعات با موفقیت به پایان رسید.');

    return {
      success: true,
      summary: `عملیات بازیابی با موفقیت انجام شد: ${added} رکورد جدید اضافه شد، ${updated} رکورد به‌روزرسانی شد.`,
      stats: { added, updated, skipped }
    };
  }
}

export const backupService = new BackupService();

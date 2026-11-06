import {
  Vehicle,
  ECU,
  Connector,
  ConnectorPin,
  FuseBox,
  Fuse,
  Relay,
  MediaItem,
  WiringDiagram,
  AppImage
} from '../types';
import { storage } from '../services/storage';
import { parseAmperage, getFuseColor, extractRelayContactAmps } from './fuseColors';
import { getMediaCanonicalKey } from './imageDeduplication';

export type IssueSeverity = 'critical' | 'warning' | 'info';
export type IssueCategory = 'vehicle' | 'ecu' | 'connector' | 'pin' | 'fusebox' | 'fuse' | 'relay' | 'media';
export type IssueType = 'missing_data' | 'duplicate' | 'inconsistency' | 'broken_link' | 'orphan_media';

export interface QualityIssue {
  id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  type: IssueType;
  title: string;
  entityId: string;
  entityName: string;
  vehicleId?: string;
  vehicleName?: string;
  description: string;
  recommendation: string;
  targetTab?: 'vehicles' | 'ecus' | 'connectors' | 'fuseboxes' | 'media';
  details?: Record<string, any>;
  isDismissed?: boolean;
}

export interface QualityReportSummary {
  timestamp: number;
  totalRecordsChecked: {
    vehicles: number;
    ecus: number;
    connectors: number;
    pins: number;
    fuseBoxes: number;
    fuses: number;
    relays: number;
    media: number;
    total: number;
  };
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  healthyCount: number;
  duplicateCount: number;
  inconsistencyCount: number;
  missingDataCount: number;
  orphanMediaCount: number;
  healthScorePercent: number;
  issues: QualityIssue[];
}

const STANDARD_BLADE_AMPS = [1, 2, 3, 4, 5, 7.5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 100];
const DISMISSED_STORAGE_KEY = 'autopin_qc_dismissed_issues_v1';

/**
 * Returns saved IDs of user-reviewed/dismissed issues so verified intentional setups are ignored.
 */
export function getDismissedIssueIds(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Saves or updates dismissed issue IDs.
 */
export function toggleDismissIssue(issueId: string): boolean {
  const current = getDismissedIssueIds();
  const exists = current.includes(issueId);
  const updated = exists ? current.filter(id => id !== issueId) : [...current, issueId];
  try {
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save dismissed QC issues:', err);
  }
  return !exists;
}

/**
 * Runs a comprehensive, non-destructive audit over all technical database records.
 */
export function runQualityControlAudit(): QualityReportSummary {
  const vehicles = storage.getVehicles();
  const ecus = storage.getECUs();
  const connectors = storage.getConnectors();
  const fuseBoxes = storage.getFuseBoxes();
  const wiringDiagrams = storage.getWiringDiagrams();
  const mediaItems = storage.getMediaItems();
  const appImages = storage.getImages();
  const manufacturers = storage.getManufacturers();
  const dismissedIds = new Set(getDismissedIssueIds());

  const issues: QualityIssue[] = [];

  let totalPins = 0;
  let totalFuses = 0;
  let totalRelays = 0;

  // Helper maps for lightning-fast relational integrity checks
  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));
  const ecuMap = new Map(ecus.map(e => [e.id, e]));
  const connectorMap = new Map(connectors.map(c => [c.id, c]));
  const fuseBoxMap = new Map(fuseBoxes.map(fb => [fb.id, fb]));

  // ==========================================
  // 1. AUDIT VEHICLES
  // ==========================================
  const seenVehicleNames = new Map<string, string>(); // normalized name -> id

  vehicles.forEach(veh => {
    // Missing required fields
    if (!veh.name || !veh.name.trim()) {
      issues.push({
        id: `veh-missing-name-${veh.id}`,
        severity: 'critical',
        category: 'vehicle',
        type: 'missing_data',
        title: 'خودرو فاقد عنوان یا نام مشخص است',
        entityId: veh.id,
        entityName: 'خودروی نامشخص',
        vehicleId: veh.id,
        vehicleName: 'نامشخص',
        description: 'یک رکورد خودرو بدون وارد کردن نام رسمی در سیستم ثبت شده است.',
        recommendation: 'نام فارسی و استاندارد خودرو را در فرم مشخصات وارد نمایید.',
        targetTab: 'vehicles'
      });
    }

    if (!veh.generation || !veh.generation.trim()) {
      issues.push({
        id: `veh-missing-gen-${veh.id}`,
        severity: 'info',
        category: 'vehicle',
        type: 'missing_data',
        title: 'عدم ثبت نسل یا تیپ خودرو',
        entityId: veh.id,
        entityName: veh.name,
        vehicleId: veh.id,
        vehicleName: veh.name,
        description: `برای خودروی «${veh.name}» مدل یا تیپ مشخصی ثبت نشده است.`,
        recommendation: 'تیپ خودرو (مانند تیپ ۵ یا استاندارد) را جهت تفکیک دقیق‌تر وارد کنید.',
        targetTab: 'vehicles'
      });
    }

    // Check engine definitions
    if (!veh.engines || veh.engines.length === 0) {
      issues.push({
        id: `veh-no-engine-${veh.id}`,
        severity: 'warning',
        category: 'vehicle',
        type: 'missing_data',
        title: 'عدم ثبت مشخصات پیشرانه یا موتور',
        entityId: veh.id,
        entityName: veh.name,
        vehicleId: veh.id,
        vehicleName: veh.name,
        description: `هیچ کد موتوری (مانند TU5 یا XU7) برای خودروی «${veh.name}» تعریف نشده است.`,
        recommendation: 'مشخصات موتور و سیستم سوخت‌رسانی را در فرم ویرایش خودرو اضافه فرمایید.',
        targetTab: 'vehicles'
      });
    } else {
      veh.engines.forEach(eng => {
        if (!eng.code || !eng.code.trim()) {
          issues.push({
            id: `eng-no-code-${veh.id}-${eng.id}`,
            severity: 'warning',
            category: 'vehicle',
            type: 'missing_data',
            title: 'موتور فاقد کد فنی',
            entityId: veh.id,
            entityName: `${veh.name} - ${eng.name || 'موتور'}`,
            vehicleId: veh.id,
            vehicleName: veh.name,
            description: `یکی از موتورهای خودروی «${veh.name}» فاقد کد فنی است.`,
            recommendation: 'کد فنی رسمی موتور (مثلاً TU3A یا EF7) را ثبت کنید.',
            targetTab: 'vehicles'
          });
        }
      });
    }

    // Suspicious Duplicate Vehicle Check
    const normVehName = `${veh.name.trim()}_${veh.generation?.trim() || ''}`.toLowerCase();
    if (seenVehicleNames.has(normVehName)) {
      const priorId = seenVehicleNames.get(normVehName)!;
      issues.push({
        id: `veh-dup-${veh.id}-${priorId}`,
        severity: 'warning',
        category: 'vehicle',
        type: 'duplicate',
        title: 'احتمال ثبت خودروی تکراری',
        entityId: veh.id,
        entityName: veh.name,
        vehicleId: veh.id,
        vehicleName: veh.name,
        description: `خودرویی با عنوان «${veh.name}» و مدل مشابه قبلاً در بانک اطلاعاتی ثبت شده است.`,
        recommendation: 'بررسی کنید آیا این دو خودرو یکسان هستند یا سال ساخت و مشخصات متفاوتی دارند.',
        targetTab: 'vehicles'
      });
    } else {
      seenVehicleNames.set(normVehName, veh.id);
    }
  });

  // ==========================================
  // 2. AUDIT ECUS
  // ==========================================
  const seenEcus = new Map<string, string>(); // vehicleId_brand_model -> id

  ecus.forEach(ecu => {
    const parentVeh = ecu.vehicleId ? vehicleMap.get(ecu.vehicleId) : undefined;

    if (!ecu.model || !ecu.model.trim()) {
      issues.push({
        id: `ecu-no-model-${ecu.id}`,
        severity: 'critical',
        category: 'ecu',
        type: 'missing_data',
        title: 'واحد ECU فاقد مدل یا کد تجاری است',
        entityId: ecu.id,
        entityName: ecu.brand || 'ECU نامشخص',
        vehicleId: ecu.vehicleId,
        vehicleName: parentVeh?.name,
        description: 'یک رکورد ECU بدون وارد کردن مدل (مانند ME7.4.4 یا SSAT) ثبت شده است.',
        recommendation: 'مدل دقیق ECU را ثبت کنید تا در جست‌وجو و مقایسه فنی قابل استفاده باشد.',
        targetTab: 'ecus'
      });
    }

    if (!ecu.vehicleId || !parentVeh) {
      issues.push({
        id: `ecu-orphan-${ecu.id}`,
        severity: 'warning',
        category: 'ecu',
        type: 'broken_link',
        title: 'عدم ارتباط مشخص ECU با خودرو',
        entityId: ecu.id,
        entityName: `${ecu.brand} ${ecu.model}`,
        description: `واحد الکترونیکی «${ecu.brand} ${ecu.model}» به هیچ خودروی معتبری در سیستم متصل نیست.`,
        recommendation: 'خودروی مربوطه را در بخش ویرایش ECU انتخاب کنید.',
        targetTab: 'ecus'
      });
    }

    // Suspicious duplicate ECU
    const ecuKey = `${ecu.vehicleId || 'none'}_${ecu.brand.trim()}_${ecu.model.trim()}`.toLowerCase();
    if (seenEcus.has(ecuKey)) {
      issues.push({
        id: `ecu-dup-${ecu.id}`,
        severity: 'warning',
        category: 'ecu',
        type: 'duplicate',
        title: 'ثبت چندباره یک مدل ECU برای یک خودرو',
        entityId: ecu.id,
        entityName: `${ecu.brand} ${ecu.model}`,
        vehicleId: ecu.vehicleId,
        vehicleName: parentVeh?.name,
        description: `مدل «${ecu.brand} ${ecu.model}» بیش از یک بار برای خودروی «${parentVeh?.name || 'مشترک'}» ثبت شده است.`,
        recommendation: 'بررسی کنید آیا این دو رکورد مربوط به نسخه‌های سخت‌افزاری متفاوت هستند یا تکراری‌اند.',
        targetTab: 'ecus'
      });
    } else {
      seenEcus.set(ecuKey, ecu.id);
    }
  });

  // ==========================================
  // 3. AUDIT CONNECTORS & PINS
  // ==========================================
  const seenConnectors = new Map<string, string>(); // vehicleId_codename -> id

  connectors.forEach(conn => {
    const parentVeh = conn.vehicleId ? vehicleMap.get(conn.vehicleId) : undefined;
    const pins = conn.pins || [];
    totalPins += pins.length;

    // Missing Name
    if (!conn.name || !conn.name.trim()) {
      issues.push({
        id: `conn-no-name-${conn.id}`,
        severity: 'critical',
        category: 'connector',
        type: 'missing_data',
        title: 'سوکت فاقد عنوان کامل است',
        entityId: conn.id,
        entityName: 'سوکت نامشخص',
        vehicleId: conn.vehicleId,
        vehicleName: parentVeh?.name,
        description: 'یک سوکت بدون عنوان یا نام تجاری در سیستم ثبت شده است.',
        recommendation: 'نام کامل سوکت (مانند سوکت ۳۲ پایه خاکستری بوش) را وارد کنید.',
        targetTab: 'connectors'
      });
    }

    // Broken vehicle link
    if (conn.vehicleId && !parentVeh) {
      issues.push({
        id: `conn-broken-veh-${conn.id}`,
        severity: 'warning',
        category: 'connector',
        type: 'broken_link',
        title: 'ارتباط سوکت با شناسه خودروی ناموجود',
        entityId: conn.id,
        entityName: conn.name,
        vehicleId: conn.vehicleId,
        description: `شناسه خودروی منتسب به سوکت «${conn.name}» در فهرست خودروهای برنامه یافت نشد.`,
        recommendation: 'خودروی مربوط به این سوکت را دوباره انتخاب فرمایید.',
        targetTab: 'connectors'
      });
    }

    // Broken ECU link if specified
    if (conn.ecuId && !ecuMap.has(conn.ecuId)) {
      issues.push({
        id: `conn-broken-ecu-${conn.id}`,
        severity: 'info',
        category: 'connector',
        type: 'broken_link',
        title: 'ارجاع به شناسه ECU ناموجود',
        entityId: conn.id,
        entityName: conn.name,
        vehicleId: conn.vehicleId,
        vehicleName: parentVeh?.name,
        description: `سوکت «${conn.name}» به ECU با شناسه «${conn.ecuId}» متصل است که در سیستم موجود نیست.`,
        recommendation: 'واحد کنترل الکترونیکی متصل به سوکت را دوباره تعیین فرمایید.',
        targetTab: 'connectors'
      });
    }

    // Declared vs registered pin count inconsistency
    const expectedCapacity = (conn.rows || 0) * (conn.cols || 0);
    const nominalPins = conn.pinCount || expectedCapacity || 0;

    if (pins.length === 0) {
      issues.push({
        id: `conn-zero-pins-${conn.id}`,
        severity: 'warning',
        category: 'connector',
        type: 'missing_data',
        title: 'سوکت بدون پایه (پین) ثبت‌شده',
        entityId: conn.id,
        entityName: conn.name,
        vehicleId: conn.vehicleId,
        vehicleName: parentVeh?.name,
        description: `برای سوکت «${conn.name}» با ظرفیت ${nominalPins} پایه، هیچ پایه‌ای تعریف نشده است.`,
        recommendation: 'پایه‌ها و سیم‌کشی سوکت را از طریق بخش ویرایش سوکت یا ورود اکسل ثبت نمایید.',
        targetTab: 'connectors'
      });
    } else if (pins.length > nominalPins && nominalPins > 0) {
      // More pins than declared socket slots! (Critical Inconsistency)
      issues.push({
        id: `conn-overflow-pins-${conn.id}`,
        severity: 'critical',
        category: 'connector',
        type: 'inconsistency',
        title: 'تعداد پایه‌های ثبت‌شده بیش از ظرفیت فیزیکی سوکت است',
        entityId: conn.id,
        entityName: conn.name,
        vehicleId: conn.vehicleId,
        vehicleName: parentVeh?.name,
        description: `تعداد پایه‌های ثبت‌شده (${pins.length}) از ظرفیت فیزیکی تعیین‌شده برای سوکت (${nominalPins}) بیشتر است!`,
        recommendation: 'تعداد ردیف‌ها و ستون‌های سوکت را افزایش داده یا پایه‌های اضافه را بررسی فرمایید.',
        targetTab: 'connectors'
      });
    } else if (pins.length < nominalPins && pins.length > 0) {
      // Partially populated socket (informational / normal in real automotive harnesses)
      issues.push({
        id: `conn-partial-pins-${conn.id}`,
        severity: 'info',
        category: 'connector',
        type: 'inconsistency',
        title: 'تکمیل نبودن تمام خانه‌های سوکت',
        entityId: conn.id,
        entityName: conn.name,
        vehicleId: conn.vehicleId,
        vehicleName: parentVeh?.name,
        description: `تعداد پایه‌های فعال ثبت‌شده (${pins.length}) کمتر از ظرفیت اسمی سوکت (${nominalPins}) است. خانه‌های خالی ممکن است در خودرو پایه‌های آزاد (NC) باشند.`,
        recommendation: 'در صورت وجود سیم‌کشی در سایر پایه‌ها، اطلاعات آنها را تکمیل نمایید.',
        targetTab: 'connectors'
      });
    }

    // AUDIT PINS OF THIS CONNECTOR
    const seenPinNumbers = new Map<string, string>(); // pinNumber -> pinId

    pins.forEach(pin => {
      const pinNum = pin.pinNumber ? pin.pinNumber.trim() : '';

      // Missing Pin Number (Critical)
      if (!pinNum) {
        issues.push({
          id: `pin-no-number-${pin.id}`,
          severity: 'critical',
          category: 'pin',
          type: 'missing_data',
          title: 'پایه بدون شماره در سوکت',
          entityId: conn.id,
          entityName: `${conn.name} (پایه نامشخص)`,
          vehicleId: conn.vehicleId,
          vehicleName: parentVeh?.name,
          description: `یکی از پایه‌های سوکت «${conn.name}» فاقد شماره یا کد است. این موضوع می‌تواند موجب اشتباه مرگبار در سیم‌کشی خودرو شود.`,
          recommendation: 'شماره پایه (مانند A1، 15 یا 1) را در جدول پین‌ها وارد نمایید.',
          targetTab: 'connectors'
        });
      } else {
        // DUPLICATE PIN NUMBER IN SAME CONNECTOR (CRITICAL INCONSISTENCY!)
        const normalizedPinNum = pinNum.toLowerCase();
        if (seenPinNumbers.has(normalizedPinNum)) {
          issues.push({
            id: `pin-duplicate-${conn.id}-${normalizedPinNum}`,
            severity: 'critical',
            category: 'pin',
            type: 'duplicate',
            title: `شماره پایه تکراری «${pinNum}» در سوکت`,
            entityId: conn.id,
            entityName: `${conn.name} - پایه ${pinNum}`,
            vehicleId: conn.vehicleId,
            vehicleName: parentVeh?.name,
            description: `شماره پایه «${pinNum}» دو بار در سوکت «${conn.name}» ثبت شده است. این تناقض می‌تواند منجر به اتصال اشتباه و سوختن ایسیو یا سیم‌کشی گردد!`,
            recommendation: 'شماره پایه‌های تکراری را بررسی و شماره صحیح را طبق دیاگرام فنی کارخانه اصلاح فرمایید.',
            targetTab: 'connectors'
          });
        } else {
          seenPinNumbers.set(normalizedPinNum, pin.id);
        }
      }

      // Missing function name
      if (!pin.functionName || !pin.functionName.trim()) {
        issues.push({
          id: `pin-no-func-${pin.id}`,
          severity: 'warning',
          category: 'pin',
          type: 'missing_data',
          title: `پایه ${pinNum || 'نامشخص'} فاقد شرح عملکرد است`,
          entityId: conn.id,
          entityName: `${conn.name} - پایه ${pinNum}`,
          vehicleId: conn.vehicleId,
          vehicleName: parentVeh?.name,
          description: `عملکرد پایه «${pinNum}» در سوکت «${conn.name}» خالی رها شده است.`,
          recommendation: 'نقش این پایه (مانند تغذیه سنسور، ورودی پالس یا انژکتور) را وارد نمایید.',
          targetTab: 'connectors'
        });
      }

      // Missing wire color
      if (!pin.wireColor || pin.wireColor === 'نامشخص') {
        issues.push({
          id: `pin-no-color-${pin.id}`,
          severity: 'info',
          category: 'pin',
          type: 'missing_data',
          title: `رنگ سیم پایه ${pinNum} ثبت نشده است`,
          entityId: conn.id,
          entityName: `${conn.name} - پایه ${pinNum}`,
          vehicleId: conn.vehicleId,
          vehicleName: parentVeh?.name,
          description: `رنگ سیم برای پایه «${pinNum}» تعیین نشده است.`,
          recommendation: 'رنگ اصلی و خط سیم را جهت سهولت در ردیابی دسته‌سیم وارد نمایید.',
          targetTab: 'connectors'
        });
      }
    });

    // Duplicate Connector Check
    const connKey = `${conn.vehicleId || 'none'}_${conn.codeName?.trim() || conn.name.trim()}`.toLowerCase();
    if (seenConnectors.has(connKey)) {
      issues.push({
        id: `conn-dup-${conn.id}`,
        severity: 'warning',
        category: 'connector',
        type: 'duplicate',
        title: 'سوکت با عنوان یا کد مشابه',
        entityId: conn.id,
        entityName: conn.name,
        vehicleId: conn.vehicleId,
        vehicleName: parentVeh?.name,
        description: `سوکتی با کد «${conn.codeName || conn.name}» برای خودروی «${parentVeh?.name || 'مشترک'}» قبلاً ثبت شده است.`,
        recommendation: 'بررسی کنید آیا این دو سوکت متعلق به پورت‌های مختلف یک قطعه هستند یا تکرار شده‌اند.',
        targetTab: 'connectors'
      });
    } else {
      seenConnectors.set(connKey, conn.id);
    }
  });

  // ==========================================
  // 4. AUDIT FUSEBOXES, FUSES & RELAYS
  // ==========================================
  const seenFuseBoxes = new Map<string, string>(); // vehicleId_name -> id

  fuseBoxes.forEach(fb => {
    const parentVeh = fb.vehicleId ? vehicleMap.get(fb.vehicleId) : undefined;
    const fuses = fb.fuses || [];
    const relays = fb.relays || [];
    totalFuses += fuses.length;
    totalRelays += relays.length;

    // Missing Name
    if (!fb.name || !fb.name.trim()) {
      issues.push({
        id: `fb-no-name-${fb.id}`,
        severity: 'critical',
        category: 'fusebox',
        type: 'missing_data',
        title: 'جعبه‌فیوز فاقد عنوان و نام مشخص است',
        entityId: fb.id,
        entityName: 'جعبه‌فیوز نامشخص',
        vehicleId: fb.vehicleId,
        vehicleName: parentVeh?.name,
        description: 'یک جعبه‌فیوز بدون عنوان در پایگاه داده ثبت شده است.',
        recommendation: 'نام جعبه‌فیوز (مانند جعبه‌فیوز کالسکه روی باتری) را تعیین کنید.',
        targetTab: 'fuseboxes'
      });
    }

    // Broken vehicle link
    if (fb.vehicleId && !parentVeh) {
      issues.push({
        id: `fb-broken-veh-${fb.id}`,
        severity: 'warning',
        category: 'fusebox',
        type: 'broken_link',
        title: 'ارتباط جعبه‌فیوز با شناسه خودروی ناموجود',
        entityId: fb.id,
        entityName: fb.name,
        vehicleId: fb.vehicleId,
        description: `جعبه‌فیوز «${fb.name}» به خودرویی ارجاع دارد که در سیستم یافت نشد.`,
        recommendation: 'خودروی مربوطه را در بخش ویرایش جعبه‌فیوز مجدداً انتخاب فرمایید.',
        targetTab: 'fuseboxes'
      });
    }

    // Empty fusebox
    if (fuses.length === 0 && relays.length === 0) {
      issues.push({
        id: `fb-empty-${fb.id}`,
        severity: 'warning',
        category: 'fusebox',
        type: 'missing_data',
        title: 'جعبه‌فیوز فاقد فیوز و رله ثبت‌شده',
        entityId: fb.id,
        entityName: fb.name,
        vehicleId: fb.vehicleId,
        vehicleName: parentVeh?.name,
        description: `هیچ فیوز یا رله‌ای برای جعبه‌فیوز «${fb.name}» تعریف نشده است.`,
        recommendation: 'فیوزها و رله‌های این جعبه‌فیوز را ثبت کنید.',
        targetTab: 'fuseboxes'
      });
    }

    // Duplicate fuse box check
    const fbKey = `${fb.vehicleId || 'none'}_${fb.name.trim()}_${fb.location || ''}`.toLowerCase();
    if (seenFuseBoxes.has(fbKey)) {
      issues.push({
        id: `fb-dup-${fb.id}`,
        severity: 'warning',
        category: 'fusebox',
        type: 'duplicate',
        title: 'احتمال ثبت جعبه‌فیوز تکراری',
        entityId: fb.id,
        entityName: fb.name,
        vehicleId: fb.vehicleId,
        vehicleName: parentVeh?.name,
        description: `جعبه‌فیوزی با عنوان «${fb.name}» در همین موقعیت برای خودروی «${parentVeh?.name || 'مشترک'}» ثبت شده است.`,
        recommendation: 'بررسی کنید آیا این دو جعبه‌فیوز یکسان هستند یا برای تیپ‌های متفاوتی عرضه شده‌اند.',
        targetTab: 'fuseboxes'
      });
    } else {
      seenFuseBoxes.set(fbKey, fb.id);
    }

    // AUDIT FUSES
    const seenFuseCodes = new Map<string, string>(); // code -> id

    fuses.forEach(fuse => {
      const code = fuse.code ? fuse.code.trim() : '';

      // Missing Fuse Code
      if (!code) {
        issues.push({
          id: `fuse-no-code-${fuse.id}`,
          severity: 'critical',
          category: 'fuse',
          type: 'missing_data',
          title: 'فیوز بدون شماره یا کد در جعبه‌فیوز',
          entityId: fb.id,
          entityName: `${fb.name} (فیوز بدون کد)`,
          vehicleId: fb.vehicleId,
          vehicleName: parentVeh?.name,
          description: `یکی از فیوزهای جعبه‌فیوز «${fb.name}» فاقد کد (مانند F15 یا MF2) است.`,
          recommendation: 'کد استاندارد فیوز را ثبت فرمایید.',
          targetTab: 'fuseboxes'
        });
      } else {
        // DUPLICATE FUSE CODE (CRITICAL INCONSISTENCY)
        const normCode = code.toLowerCase();
        if (seenFuseCodes.has(normCode)) {
          issues.push({
            id: `fuse-dup-${fb.id}-${normCode}`,
            severity: 'critical',
            category: 'fuse',
            type: 'duplicate',
            title: `کد فیوز تکراری «${code}» در یک جعبه‌فیوز`,
            entityId: fb.id,
            entityName: `${fb.name} - فیوز ${code}`,
            vehicleId: fb.vehicleId,
            vehicleName: parentVeh?.name,
            description: `کد فیوز «${code}» دو بار در جعبه‌فیوز «${fb.name}» ثبت شده است.`,
            recommendation: 'کد یکی از فیوزها اشتباه وارد شده است؛ لطفاً شماره صحیح را جایگزین کنید.',
            targetTab: 'fuseboxes'
          });
        } else {
          seenFuseCodes.set(normCode, fuse.id);
        }
      }

      // Amperage validation
      const amps = parseAmperage(fuse.ratingAmps);
      if (amps === null || amps <= 0) {
        issues.push({
          id: `fuse-no-amps-${fuse.id}`,
          severity: 'critical',
          category: 'fuse',
          type: 'missing_data',
          title: `آمپراژ فیوز ${code || 'نامشخص'} تعیین نشده است`,
          entityId: fb.id,
          entityName: `${fb.name} - فیوز ${code}`,
          vehicleId: fb.vehicleId,
          vehicleName: parentVeh?.name,
          description: `فیوز «${code}» دارای آمپراژ نامعتبر یا صفر است. مشخص نبودن آمپراژ ممکن است موجب نصب فیوز نادرست و آتش‌سوزی سیم‌کشی شود!`,
          recommendation: 'آمپراژ استاندارد فیوز (مانند 10، 15، 20 آمپر) را مشخص فرمایید.',
          targetTab: 'fuseboxes'
        });
      } else if (!STANDARD_BLADE_AMPS.includes(amps)) {
        // Non-standard blade fuse amperage
        issues.push({
          id: `fuse-nonstandard-amps-${fuse.id}`,
          severity: 'warning',
          category: 'fuse',
          type: 'inconsistency',
          title: `آمپراژ غیراستاندارد ${amps}A برای فیوز ${code}`,
          entityId: fb.id,
          entityName: `${fb.name} - فیوز ${code}`,
          vehicleId: fb.vehicleId,
          vehicleName: parentVeh?.name,
          description: `مقدار ${amps} آمپر جزو استانداردهای رایج فیوزهای تیغه‌ای خودرو (SAE J2077) نیست.`,
          recommendation: 'بررسی کنید آیا آمپراژ اشتباه تایپ شده یا مربوط به یک فیوز خاص است.',
          targetTab: 'fuseboxes'
        });
      }

      // Missing circuit details or function
      if (!fuse.functionName || !fuse.functionName.trim()) {
        issues.push({
          id: `fuse-no-func-${fuse.id}`,
          severity: 'warning',
          category: 'fuse',
          type: 'missing_data',
          title: `فیوز ${code} فاقد مدار تحت حفاظت یا شرح مصرف‌کننده است`,
          entityId: fb.id,
          entityName: `${fb.name} - فیوز ${code}`,
          vehicleId: fb.vehicleId,
          vehicleName: parentVeh?.name,
          description: `عملکرد فیوز «${code}» ثبت نشده و مشخص نیست چه مداری را تغذیه می‌کند.`,
          recommendation: 'شرح مدار (مثلاً پمپ بنزین، بوق یا شیشه‌بالابر) را وارد نمایید.',
          targetTab: 'fuseboxes'
        });
      }

      // Missing hotspot coordinates on fusebox image
      if (fb.realImageUrl || fb.diagramImageUrl || fb.coverDiagramUrl) {
        if (fuse.xPercent === undefined || fuse.yPercent === undefined) {
          issues.push({
            id: `fuse-no-hotspot-${fuse.id}`,
            severity: 'info',
            category: 'fuse',
            type: 'missing_data',
            title: `موقعیت مکانی فیوز ${code} روی نقشه ثبت نشده است`,
            entityId: fb.id,
            entityName: `${fb.name} - فیوز ${code}`,
            vehicleId: fb.vehicleId,
            vehicleName: parentVeh?.name,
            description: `برای فیوز «${code}» نقطه موقعیت مکانی روی تصویر جعبه‌فیوز کالیبره نشده است.`,
            recommendation: 'با لمس نقطه مربوطه در تب موقعیت‌یابی جعبه‌فیوز، جایگاه فیزیکی آن را مشخص کنید.',
            targetTab: 'fuseboxes'
          });
        }
      }
    });

    // AUDIT RELAYS
    const seenRelayCodes = new Map<string, string>(); // code -> id

    relays.forEach(relay => {
      const code = relay.code ? relay.code.trim() : '';

      // Missing Relay Code
      if (!code) {
        issues.push({
          id: `relay-no-code-${relay.id}`,
          severity: 'critical',
          category: 'relay',
          type: 'missing_data',
          title: 'رله بدون شماره یا عنوان در جعبه‌فیوز',
          entityId: fb.id,
          entityName: `${fb.name} (رله بدون کد)`,
          vehicleId: fb.vehicleId,
          vehicleName: parentVeh?.name,
          description: `یکی از رله‌های جعبه‌فیوز «${fb.name}» فاقد کد است.`,
          recommendation: 'کد شناسایی رله (مانند R1 یا رله فن دور تند) را ثبت کنید.',
          targetTab: 'fuseboxes'
        });
      } else {
        // DUPLICATE RELAY CODE
        const normCode = code.toLowerCase();
        if (seenRelayCodes.has(normCode)) {
          issues.push({
            id: `relay-dup-${fb.id}-${normCode}`,
            severity: 'critical',
            category: 'relay',
            type: 'duplicate',
            title: `کد رله تکراری «${code}» در یک جعبه‌فیوز`,
            entityId: fb.id,
            entityName: `${fb.name} - رله ${code}`,
            vehicleId: fb.vehicleId,
            vehicleName: parentVeh?.name,
            description: `کد رله «${code}» دو بار در جعبه‌فیوز «${fb.name}» ثبت شده است.`,
            recommendation: 'کد رله‌های تکراری را بررسی و اصلاح فرمایید.',
            targetTab: 'fuseboxes'
          });
        } else {
          seenRelayCodes.set(normCode, relay.id);
        }
      }

      // Relay Pins check (coil pins & contact pins)
      if (!relay.coilPins || !relay.coilPins.trim()) {
        issues.push({
          id: `relay-no-coil-${relay.id}`,
          severity: 'warning',
          category: 'relay',
          type: 'missing_data',
          title: `پایه‌های بوبین رله ${code} مشخص نشده است`,
          entityId: fb.id,
          entityName: `${fb.name} - رله ${code}`,
          vehicleId: fb.vehicleId,
          vehicleName: parentVeh?.name,
          description: `پایه‌های تحریک سیم‌پیچ برای رله «${code}» ثبت نشده‌اند. طبق استاندارد رله‌های خودرویی پایه‌های ۸۵ و ۸۶ معمولاً بوبین هستند.`,
          recommendation: 'پایه‌های بوبین (تحریک) را در جدول رله مشخص فرمایید.',
          targetTab: 'fuseboxes'
        });
      }

      if (!relay.contactPins || !relay.contactPins.trim()) {
        issues.push({
          id: `relay-no-contact-${relay.id}`,
          severity: 'warning',
          category: 'relay',
          type: 'missing_data',
          title: `پایه‌های کنتاکت قدرت رله ${code} مشخص نشده است`,
          entityId: fb.id,
          entityName: `${fb.name} - رله ${code}`,
          vehicleId: fb.vehicleId,
          vehicleName: parentVeh?.name,
          description: `پایه‌های سوییچ کنتاکت قدرت (معمولاً ۳۰ و ۸۷) برای رله «${code}» مشخص نیست.`,
          recommendation: 'پایه‌های کنتاکت قدرت را ثبت نمایید.',
          targetTab: 'fuseboxes'
        });
      }

      // Relay Rating Check
      const contactAmps = extractRelayContactAmps(relay.rating, relay.contactAmps);
      if (!contactAmps || contactAmps <= 0) {
        issues.push({
          id: `relay-no-amps-${relay.id}`,
          severity: 'info',
          category: 'relay',
          type: 'missing_data',
          title: `جریان نامی کنتاکت رله ${code} مشخص نشده است`,
          entityId: fb.id,
          entityName: `${fb.name} - رله ${code}`,
          vehicleId: fb.vehicleId,
          vehicleName: parentVeh?.name,
          description: `ظرفیت جریانی کنتاکت رله «${code}» ثبت نشده است (مانند 30A یا 40A).`,
          recommendation: 'جریان مجاز عبوری از رله را مشخص فرمایید.',
          targetTab: 'fuseboxes'
        });
      }
    });
  });

  // ==========================================
  // 5. AUDIT MEDIA & TECHNICAL IMAGES
  // ==========================================
  const seenMediaUrls = new Map<string, string>(); // canonicalKey -> id

  mediaItems.forEach(media => {
    // Check if broken URL
    if (!media.fileUrl || !media.fileUrl.trim()) {
      issues.push({
        id: `media-broken-url-${media.id}`,
        severity: 'critical',
        category: 'media',
        type: 'missing_data',
        title: 'رکورد تصویر فاقد فایل یا آدرس تصویر است',
        entityId: media.id,
        entityName: media.title || 'تصویر بدون عنوان',
        vehicleId: media.vehicleId,
        description: `رکورد «${media.title}» فاقد داده تصویری یا آدرس معتبر است.`,
        recommendation: 'تصویر مربوطه را مجدداً بارگذاری فرمایید.',
        targetTab: 'media'
      });
    }

    // Check Orphan Media (referring to non-existent entity)
    if (media.entityId) {
      let entityExists = false;
      if (media.entityType === 'vehicle') entityExists = vehicleMap.has(media.entityId);
      else if (media.entityType === 'connector') entityExists = connectorMap.has(media.entityId);
      else if (media.entityType === 'fusebox') entityExists = fuseBoxMap.has(media.entityId);
      else if (media.entityType === 'diagram') entityExists = wiringDiagrams.some(d => d.id === media.entityId);
      else {
        // General check across all
        entityExists = vehicleMap.has(media.entityId) || connectorMap.has(media.entityId) || fuseBoxMap.has(media.entityId);
      }

      if (!entityExists) {
        issues.push({
          id: `media-orphan-${media.id}`,
          severity: 'warning',
          category: 'media',
          type: 'orphan_media',
          title: 'تصویر بدون اتصال به قطعه یا خودرو (Orphan)',
          entityId: media.id,
          entityName: media.title,
          vehicleId: media.vehicleId,
          description: `تصویر «${media.title}» به رکوردی با شناسه «${media.entityId}» متصل است که در بانک اطلاعاتی وجود ندارد.`,
          recommendation: 'این تصویر را به قطعه، سوکت یا جعبه‌فیوز مرتبط متصل نمایید.',
          targetTab: 'media'
        });
      }
    }

    // Check duplicate media
    const canonicalKey = getMediaCanonicalKey(media);
    if (seenMediaUrls.has(canonicalKey)) {
      issues.push({
        id: `media-dup-${media.id}`,
        severity: 'info',
        category: 'media',
        type: 'duplicate',
        title: 'تصویر تکراری در سیستم',
        entityId: media.id,
        entityName: media.title,
        vehicleId: media.vehicleId,
        description: `تصویر «${media.title}» با همان محتوا یا آدرس برای بخش دیگری نیز ثبت شده است.`,
        recommendation: 'بررسی کنید آیا این تصویر عمداً برای دو بخش مشترک استفاده شده یا تکراری بارگذاری شده است.',
        targetTab: 'media'
      });
    } else {
      seenMediaUrls.set(canonicalKey, media.id);
    }
  });

  // Calculate Summary Statistics
  const totalRecords =
    vehicles.length +
    ecus.length +
    connectors.length +
    totalPins +
    fuseBoxes.length +
    totalFuses +
    totalRelays +
    mediaItems.length +
    wiringDiagrams.length;

  // Mark dismissed issues
  const activeIssues = issues.map(iss => ({
    ...iss,
    isDismissed: dismissedIds.has(iss.id)
  }));

  const visibleUndismissed = activeIssues.filter(i => !i.isDismissed);

  const criticalCount = visibleUndismissed.filter(i => i.severity === 'critical').length;
  const warningCount = visibleUndismissed.filter(i => i.severity === 'warning').length;
  const infoCount = visibleUndismissed.filter(i => i.severity === 'info').length;

  const duplicateCount = visibleUndismissed.filter(i => i.type === 'duplicate').length;
  const inconsistencyCount = visibleUndismissed.filter(i => i.type === 'inconsistency').length;
  const missingDataCount = visibleUndismissed.filter(i => i.type === 'missing_data').length;
  const orphanMediaCount = visibleUndismissed.filter(i => i.type === 'orphan_media').length;

  // Quality score formula: 100 - (critical * 5 + warning * 1.5 + info * 0.2)
  const penalty = criticalCount * 5 + warningCount * 1.5 + infoCount * 0.2;
  const healthScorePercent = Math.max(0, Math.min(100, Math.round(100 - (penalty / Math.max(1, totalRecords / 5)) * 25)));

  return {
    timestamp: Date.now(),
    totalRecordsChecked: {
      vehicles: vehicles.length,
      ecus: ecus.length,
      connectors: connectors.length,
      pins: totalPins,
      fuseBoxes: fuseBoxes.length,
      fuses: totalFuses,
      relays: totalRelays,
      media: mediaItems.length + wiringDiagrams.length,
      total: totalRecords
    },
    totalIssues: visibleUndismissed.length,
    criticalCount,
    warningCount,
    infoCount,
    healthyCount: Math.max(0, totalRecords - visibleUndismissed.length),
    duplicateCount,
    inconsistencyCount,
    missingDataCount,
    orphanMediaCount,
    healthScorePercent,
    issues: activeIssues
  };
}

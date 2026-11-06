export type SignalType =
  | '12V_BAT'       // برق ۱۲ ولت دائم باتری (خط ۳۰)
  | '12V_IGN'       // برق ۱۲ ولت سوئیچ (خط ۱۵)
  | '5V_REF'        // ولتاژ ۵ ولت رفرنس سنسورها
  | 'GROUND'        // اتصال بدنه / منفی سنسورها (خط ۳۱)
  | 'ANALOG_IN'     // ورودی سیگنال آنالوگ سنسور
  | 'ANALOG_OUT'    // خروجی سیگنال آنالوگ
  | 'PWM_PULSE'     // خروجی پالس یا کنترل عرض پالس (انژکتور/کوئیل/شیر برقی)
  | 'CAN_BUS'       // شبکه کن (CAN-H / CAN-L)
  | 'K_LINE'        // خط عیب‌یابی K-Line
  | 'DISCONNECTED'; // پایه آزاد / بدون اتصال (NC)

export type ConnectorCategory = 'ecu' | 'sensor' | 'actuator' | 'relay' | 'body' | 'fusebox';

export type FuseSupplyType = '+30 (دائم باتری)' | '+15 (سوئیچ باز)' | '+50 (استارت)' | 'ACC (تجهیزات)' | 'رله کمکی';

export type PublicationStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'verified' | 'archived';

export interface Manufacturer {
  id: string;
  name: string;
  englishName: string;
  country: string;
  logoText: string;
  category: 'iranian' | 'chinese' | 'korean' | 'japanese' | 'european' | 'other';
  status?: PublicationStatus;
}

export interface Engine {
  id: string;
  vehicleId: string;
  code: string;
  name: string;
  fuelSystem: string;
  valves: number;
  displacementCc: number;
  notes?: string;
  status?: PublicationStatus;
}

export interface Vehicle {
  id: string;
  manufacturerId: string;
  name: string;
  persianName: string;
  generation: string;
  modelYears: string;
  electricalSystem: string;
  description: string;
  imageUrl?: string;
  engines: Engine[];
  ecuIds?: string[];
  status?: PublicationStatus;
  rejectionReason?: string;
  proposedChanges?: Record<string, any>;
  submittedBy?: string;
  reviewedBy?: string;
  reviewedAt?: number;
  source?: string;
  updatedBy?: string;
  updatedAt?: number;
  createdAt: number;
}

export interface ECU {
  id: string;
  vehicleId: string;
  engineId?: string;
  brand: string;
  model: string;
  hardwareVersion?: string;
  softwareVersion?: string;
  connectorCount: number;
  description?: string;
  imageUrl?: string;
  status?: PublicationStatus;
  rejectionReason?: string;
  proposedChanges?: Record<string, any>;
  submittedBy?: string;
  reviewedBy?: string;
  reviewedAt?: number;
}

export interface ConnectorPin {
  id: string;
  connectorId: string;
  pinNumber: string; // e.g., "A1", "B2", "1", "15"
  pinName?: string; // e.g., "INJ_1", "MAP_SIG", "VREF_5V"
  row?: number;
  col?: number;
  wireColor: string; // e.g. "سفید با خط قرمز"
  wireHex: string;   // e.g. "#ffffff"
  wireStripeHex?: string; // e.g. "#ef4444"
  functionName: string; // e.g. "فرمان پاشش سوزن انژکتور ۱"
  dutyCategory?: string; // e.g. "انژکتور و سوخت", "جرقه و کوئیل", "سنسورها", "تغذیه و بدنه", "شبکه و ارتباط", "عملگرها"
  pulseType?: string; // e.g. "پالس منفی انژکتور", "پالس ترانزیستوری کوئیل", "پالس فرکانسی PWM", "موج مربعی ۵ ولت", "بدون پالس"
  signalType: SignalType;
  voltageRange: string; // e.g. "12V-14.4V" or "0.5V-4.5V"
  testGuide?: string; // e.g. "با مولتی‌متر ولتاژ نسبت به بدنه سنجیده شود"
  notes?: string;
  source?: string;
  status?: PublicationStatus;
  rejectionReason?: string;
}

export interface Connector {
  id: string;
  vehicleId?: string;
  ecuId?: string;
  name: string;
  codeName: string; // e.g. "سوکت ۳۲ پایه خاکستری (CH32)"
  category: ConnectorCategory;
  pinCount: number;
  rows: number;
  cols: number;
  shape: 'grid' | 'double_row' | 'single_row' | 'circular';
  socketColor: string; // e.g. "خاکستری", "مشکی", "قهوه‌ای"
  socketColorHex: string;
  realImageUrl?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  pinoutDiagramUrl?: string;
  source: string;
  status: PublicationStatus;
  rejectionReason?: string;
  proposedChanges?: Record<string, any>;
  submittedBy?: string;
  reviewedBy?: string;
  reviewedAt?: number;
  notes?: string;
  pins: ConnectorPin[];
  updatedBy?: string;
  updatedAt?: number;
  createdAt: number;
}

export interface Fuse {
  id: string;
  fuseBoxId: string;
  code: string; // e.g. "F1", "F15", "MF2"
  ratingAmps: number; // e.g. 10, 15, 20
  fuseType?: 'standard' | 'mini' | 'maxi' | 'micro2' | 'micro3' | 'midi' | 'mega'; // نوع استاندارد فیوز
  functionName: string; // e.g. "پمپ بنزین و گرمکن سنسور اکسیژن"
  circuitDetails: string; // e.g. "تغذیه رله پمپ بنزین و انژکتورها"
  powerSupplyType: FuseSupplyType;
  xPercent?: number; // Hotspot coordinate on fusebox image (0-100)
  yPercent?: number; // Hotspot coordinate on fusebox image (0-100)
  testTips?: string;
  source?: string;
  status?: PublicationStatus;
  rejectionReason?: string;
}

export interface Relay {
  id: string;
  fuseBoxId: string;
  code: string; // e.g. "R1", "رله دوبل", "رله فن دور تند"
  name: string;
  rating: string; // e.g. "12V 30/40A"
  contactAmps?: number; // جریان نامی کنتاکت قدرت (آمپر)
  coilVoltage?: string; // ولتاژ تحریک سیم‌پیچ (مثلاً 12V DC)
  relayType?: 'cube_4pin' | 'cube_5pin' | 'mini' | 'micro' | 'double' | 'solid_state' | 'flasher' | 'timer' | 'other';
  coilPins: string; // e.g. "85 و 86"
  contactPins: string; // e.g. "30 و 87"
  functionName: string;
  circuitDetails?: string; // مدار مرتبط
  diagnostics?: string;
  notes?: string;
  source?: string;
  xPercent?: number;
  yPercent?: number;
  status?: PublicationStatus;
  rejectionReason?: string;
}

export interface FuseBox {
  id: string;
  vehicleId: string;
  manufacturer?: string;
  modelYears?: string;
  trim?: string;
  engineCode?: string;
  name: string; // e.g. "جعبه‌فیوز داخل کابین (BSI)"
  location: 'cabin' | 'engine' | 'battery' | 'trunk' | 'other';
  locationFa: string;
  realImageUrl?: string;
  diagramImageUrl?: string;
  coverDiagramUrl?: string;
  notes?: string;
  source: string;
  status?: PublicationStatus;
  rejectionReason?: string;
  proposedChanges?: Record<string, any>;
  submittedBy?: string;
  reviewedBy?: string;
  reviewedAt?: number;
  fuses: Fuse[];
  relays: Relay[];
}

export interface WiringDiagram {
  id: string;
  vehicleId: string;
  title: string;
  category: 'injection_ignition' | 'cooling_fan' | 'lighting' | 'starter_charging' | 'abs_esp' | 'multiplex' | 'sensor';
  categoryFa: string;
  diagramImageUrl: string;
  description: string;
  source: string;
  status?: PublicationStatus;
  rejectionReason?: string;
  proposedChanges?: Record<string, any>;
  submittedBy?: string;
  reviewedBy?: string;
  reviewedAt?: number;
  createdAt: number;
}

export type TechnicalImageType =
  | 'real_part'         // ۱. تصویر واقعی قطعه
  | 'socket_front'      // ۲. تصویر نمای روبه‌رو سوکت
  | 'socket_back'       // ۳. تصویر پشت سوکت
  | 'socket_schematic'  // ۴. تصویر شماتیک سوکت
  | 'pinout_diagram'    // ۵. تصویر پیناوت
  | 'fusebox_real'      // ۶. تصویر کلی جعبه‌فیوز
  | 'fusebox_cover'     // ۷. تصویر درپوش جعبه‌فیوز
  | 'fusebox_diagram'   // ۸. تصویر نقشه فیوزها
  | 'relays_layout'     // ۹. تصویر چیدمان رله‌ها
  | 'wiring_diagram'    // ۱۰. نقشه سیم‌کشی
  | 'supplementary';    // ۱۱. تصویر تکمیلی

export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  storagePath?: string;
  mimeType?: string;
  fileSize?: number;
  entityType: 'vehicle' | 'connector' | 'fusebox' | 'pin' | 'diagram';
  entityId: string;
  vehicleId?: string;
  imageType: TechnicalImageType | string;
  source?: string;
  status?: PublicationStatus;
  rejectionReason?: string;
  uploadedBy?: string;
  reviewedBy?: string;
  reviewedAt?: number;
  createdAt: number;
}

export interface AppImage {
  id: string;
  title: string;
  description?: string;
  dataUrl: string;
  category: 'connector' | 'fusebox' | 'diagram' | 'vehicle';
  linkedEntityId?: string;
  createdAt: number;
}

export type FavoriteType = 'vehicle' | 'ecu' | 'connector' | 'fusebox' | 'fuse' | 'relay' | 'diagram';

export interface FavoriteItem {
  id: string;
  userId?: string;
  type: FavoriteType;
  itemId: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  vehicleId?: string;
  vehicleName?: string;
  extraInfo?: string;
  addedAt: number;
}

export interface RecentVehicle {
  vehicleId: string;
  timestamp: number;
  userId?: string;
}

export type AppUserRole = 'admin' | 'technician' | 'user';

export interface AppUserProfile {
  id: string; // matches firebase uid or local user id
  email: string;
  displayName: string;
  role: AppUserRole;
  isActive: boolean;
  createdAt: number;
  lastLoginAt?: number;
  photoURL?: string;
  notes?: string;
}

export type VersionEntityType = 'vehicle' | 'ecu' | 'connector' | 'fusebox' | 'fuse' | 'relay' | 'diagram' | 'media';
export type VersionOperation = 'create' | 'update' | 'delete' | 'restore';

export interface FieldDiff {
  field: string;
  fieldLabelFa: string;
  oldValue: any;
  newValue: any;
}

export interface TechnicalDataVersion {
  id: string;
  recordId: string;
  entityType: VersionEntityType;
  entityTitle: string;
  versionNumber: number;
  timestamp: number;
  previousData: Record<string, any> | null;
  newData: Record<string, any>;
  changedFields: string[];
  diffs?: FieldDiff[];
  operation: VersionOperation;
  adminId?: string;
  adminEmail?: string;
  comment?: string;
}

export type ApprovalEntityType = 'vehicle' | 'ecu' | 'connector' | 'fusebox' | 'diagram' | 'media';

export interface ApprovalItemSummary {
  id: string;
  entityType: ApprovalEntityType;
  entityTypeFa: string;
  title: string;
  subtitle: string;
  vehicleName?: string;
  status: PublicationStatus;
  rejectionReason?: string;
  proposedChanges?: Record<string, any>;
  submittedBy?: string;
  submittedAt?: number;
  reviewedBy?: string;
  reviewedAt?: number;
  imageUrl?: string;
  hasProposedChanges: boolean;
  rawData: any;
  publishedSnapshot?: any;
}

export type NotificationType =
  | 'system'              // اعلان‌های عمومی سیستم
  | 'approval_pending'    // برای ادمین: رکورد در انتظار تأیید
  | 'approval_submitted'  // برای تکنسین: اطلاعات ارسال شد
  | 'data_published'      // برای کاربران: انتشار اطلاعات فنی جدید
  | 'data_updated'        // برای کاربران: تغییر مهم در اطلاعات فنی
  | 'admin_broadcast'     // پیام و اطلاعیه عمومی مدیر
  | 'bulk_import_done'    // تکمیل عملیات ورود اطلاعات گروهی
  | 'error_alert';        // بروز خطا در عملیات مهم

export type NotificationTarget = 'all' | 'admins' | 'technicians' | 'user';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  target: NotificationTarget;
  userId?: string;          // If target is a specific user, or null if broadcast
  targetRole?: 'admin' | 'technician' | 'user';
  isRead: boolean;
  readByUserIds?: string[]; // For public broadcasts: tracks which user IDs have marked it as read
  createdAt: number;
  priority?: 'normal' | 'high' | 'urgent';
  linkEntity?: {
    entityType: 'vehicle' | 'connector' | 'fusebox' | 'diagram' | 'ecu' | 'qc' | 'approvals';
    entityId?: string;
  };
  broadcastStatus?: 'active' | 'inactive';
  createdBy?: string;       // Admin email if manual broadcast
  uniqueEventKey?: string;  // Deduplication key to prevent duplicate notifications for the same event
}

export type AuditActionType =
  | 'auth_login'
  | 'auth_logout'
  | 'vehicle_create'
  | 'vehicle_update'
  | 'vehicle_delete'
  | 'ecu_create'
  | 'ecu_update'
  | 'ecu_delete'
  | 'connector_create'
  | 'connector_update'
  | 'connector_delete'
  | 'pin_change'
  | 'fusebox_create'
  | 'fusebox_update'
  | 'fusebox_delete'
  | 'fuse_change'
  | 'relay_change'
  | 'media_add'
  | 'media_replace'
  | 'media_delete'
  | 'technical_approve'
  | 'technical_reject'
  | 'technical_publish'
  | 'technical_submit'
  | 'version_restore'
  | 'bulk_import'
  | 'user_role_change'
  | 'user_status_change'
  | 'broadcast_create'
  | 'broadcast_toggle'
  | 'security_flag_secure'
  | 'security_screenshot_blocked';

export type AuditTargetType =
  | 'auth'
  | 'vehicle'
  | 'ecu'
  | 'connector'
  | 'pin'
  | 'fusebox'
  | 'fuse'
  | 'relay'
  | 'diagram'
  | 'media'
  | 'version'
  | 'bulk'
  | 'user'
  | 'broadcast'
  | 'security';

export interface AuditLogEntry {
  id: string;
  actionType: AuditActionType;
  timestamp: number;
  userId: string;
  userEmail: string;
  userRole: 'admin' | 'technician' | 'user' | 'system';
  targetType: AuditTargetType;
  targetId?: string;
  targetTitle?: string;
  status: 'success' | 'failure';
  summary: string;
  details?: Record<string, any>;
  diffSummary?: {
    field: string;
    fieldLabelFa: string;
    oldValue?: any;
    newValue?: any;
  }[];
  ipAddress?: string;
}

export interface AuditLogFilterParams {
  search?: string;
  actionType?: AuditActionType | 'all';
  targetType?: AuditTargetType | 'all';
  userId?: string | 'all';
  status?: 'success' | 'failure' | 'all';
  timeRange?: 'today' | '7days' | '30days' | 'all';
}

export * from './settings';

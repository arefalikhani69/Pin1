import * as XLSX from 'xlsx';
import {
  Vehicle,
  ECU,
  Connector,
  ConnectorPin,
  FuseBox,
  Fuse,
  Relay,
  WiringDiagram,
  MediaItem,
  PublicationStatus,
  SignalType,
  FuseSupplyType
} from '../types';
import { storage } from '../services/storage';
import { getFuseColor } from './fuseColors';
import { normalizeSearchText } from './searchEngine';

export type BulkEntityType =
  | 'vehicles'
  | 'ecus'
  | 'connectors'
  | 'pins'
  | 'fuseboxes'
  | 'fuses'
  | 'relays'
  | 'images';

export interface ColumnDefinition {
  key: string;
  labelFa: string;
  required: boolean;
  type: 'string' | 'number' | 'status' | 'enum';
  aliases: string[];
  descriptionFa: string;
  example: string;
}

export interface ValidationErrorItem {
  rowIndex: number; // 1-based index (including header)
  columnKey: string;
  columnLabel: string;
  value: unknown;
  messageFa: string;
}

export interface ProbableDuplicateItem {
  rowIndex: number;
  existingId: string;
  existingTitle: string;
  matchReasonFa: string;
  targetData: Record<string, unknown>;
}

export interface MissingDependencyItem {
  rowIndex: number;
  dependentField: string;
  dependentValue: string;
  missingEntityFa: string;
  messageFa: string;
}

export interface ValidationSummary {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  missingDependencyCount: number;
  missingRequiredCount: number;
  errors: ValidationErrorItem[];
  duplicates: ProbableDuplicateItem[];
  missingDependencies: MissingDependencyItem[];
  parsedValidRows: Record<string, unknown>[];
}

// Standard Schema definitions according to prompt specifications
export const BULK_SCHEMAS: Record<BulkEntityType, { titleFa: string; columns: ColumnDefinition[] }> = {
  vehicles: {
    titleFa: 'خودروها',
    columns: [
      { key: 'manufacturer', labelFa: 'شرکت سازنده', required: true, type: 'string', aliases: ['سازنده', 'کمپانی', 'برند', 'manufacturer', 'brand', 'company'], descriptionFa: 'نام کمپانی سازنده (مانند ایران خودرو، سایپا)', example: 'ایران خودرو' },
      { key: 'vehicleName', labelFa: 'نام خودرو', required: true, type: 'string', aliases: ['نام خودرو', 'خودرو', 'vehicleName', 'name', 'title', 'car'], descriptionFa: 'نام تجاری و مدل خودرو', example: 'پژو ۲۰۶ تیپ ۵' },
      { key: 'model', labelFa: 'مدل و تیپ', required: false, type: 'string', aliases: ['مدل', 'تیپ', 'نسل', 'model', 'generation', 'trim'], descriptionFa: 'مدل یا نسل خودرو', example: 'تیپ ۵ فرانسه' },
      { key: 'yearFrom', labelFa: 'سال شروع تولید', required: false, type: 'number', aliases: ['سال از', 'از سال', 'yearFrom', 'startYear'], descriptionFa: 'سال شمسی یا میلادی شروع', example: '1385' },
      { key: 'yearTo', labelFa: 'سال پایان تولید', required: false, type: 'number', aliases: ['سال تا', 'تا سال', 'yearTo', 'endYear'], descriptionFa: 'سال پایان تولید', example: '1391' },
      { key: 'engineCode', labelFa: 'کد موتور', required: false, type: 'string', aliases: ['موتور', 'کد موتور', 'engineCode', 'engine'], descriptionFa: 'کد فنی پیشرانه (مانند TU5، XU7، EF7)', example: 'TU5' },
      { key: 'fuelSystem', labelFa: 'سیستم سوخت‌رسانی', required: false, type: 'string', aliases: ['سیستم سوخت', 'سوخت رسانی', 'fuelSystem', 'fuel'], descriptionFa: 'نوع سیستم پاشش و انژکتور', example: 'انژکتوری چندنقطه‌ای بوش' },
      { key: 'ecuIds', labelFa: 'شناسه ECUها', required: false, type: 'string', aliases: ['ای سی یو', 'ecuIds', 'ecus', 'ecu'], descriptionFa: 'شناسه یا نام کامپیوترها (جدا شده با کاما)', example: 'bosch-me744' },
      { key: 'notes', labelFa: 'توضیحات و نکات فنی', required: false, type: 'string', aliases: ['نکات', 'توضیحات', 'notes', 'description'], descriptionFa: 'یادداشت‌های تکنسین و دیاگ', example: 'سیستم برق مالتی‌پلکس فرانسوی' },
      { key: 'source', labelFa: 'منبع اطلاعات', required: false, type: 'string', aliases: ['منبع', 'source'], descriptionFa: 'مرجع مستندات یا نقشه', example: 'دفترچه رسمی ایساکو' },
      { key: 'verificationStatus', labelFa: 'وضعیت تأیید', required: false, type: 'status', aliases: ['وضعیت', 'وضعیت تایید', 'verificationStatus', 'status'], descriptionFa: 'published | verified | pending | draft', example: 'published' }
    ]
  },
  ecus: {
    titleFa: 'کامپیوترهای خودرو (ECU)',
    columns: [
      { key: 'manufacturer', labelFa: 'سازنده ECU', required: true, type: 'string', aliases: ['سازنده', 'برند ecu', 'manufacturer', 'brand'], descriptionFa: 'برند سازنده کنترل‌یونیت (Bosch, Siemens, Valeo)', example: 'Bosch' },
      { key: 'ecuName', labelFa: 'نام مدل ECU', required: true, type: 'string', aliases: ['نام ecu', 'مدل ecu', 'ecuName', 'name', 'model'], descriptionFa: 'مدل تجاری مانند ME 7.4.4', example: 'ME 7.4.4' },
      { key: 'partNumber', labelFa: 'شماره فنی / پارت‌نامبر', required: false, type: 'string', aliases: ['پارت نامبر', 'شماره قطعه', 'partNumber', 'partNo'], descriptionFa: 'شماره سریال یا کد کالا', example: '0261206839' },
      { key: 'hardwareVersion', labelFa: 'نسخه سخت‌افزار', required: false, type: 'string', aliases: ['سخت افزار', 'ورژن سخت افزار', 'hardwareVersion', 'hw'], descriptionFa: 'نسخه برد الکترونیکی', example: 'HW 1.2' },
      { key: 'softwareVersion', labelFa: 'نسخه نرم‌افزار / کالیبراسیون', required: false, type: 'string', aliases: ['نرم افزار', 'ورژن نرم افزار', 'softwareVersion', 'sw'], descriptionFa: 'کد دامپ و نرم‌افزار', example: 'SW 35.8' },
      { key: 'compatibleEngineCodes', labelFa: 'کدهای موتور سازگار', required: false, type: 'string', aliases: ['موتورهای سازگار', 'کد موتور', 'compatibleEngineCodes', 'engines'], descriptionFa: 'کدهای موتور جدا شده با کاما', example: 'TU5JP4, TU5' },
      { key: 'connectorIds', labelFa: 'شناسه سوکت‌ها', required: false, type: 'string', aliases: ['سوکت ها', 'سوکتها', 'connectorIds', 'connectors'], descriptionFa: 'شناسه یا کدهای سوکت متصل', example: 'conn-206-grey, conn-206-brown' },
      { key: 'notes', labelFa: 'نکات فنی', required: false, type: 'string', aliases: ['نکات', 'توضیحات', 'notes', 'description'], descriptionFa: 'نکات پروگرم و دیاگ', example: 'امکان تعریف ریموت والئو' },
      { key: 'source', labelFa: 'منبع', required: false, type: 'string', aliases: ['منبع', 'source'], descriptionFa: 'مرجع رسمی', example: 'مستندات بوش آلمان' },
      { key: 'verificationStatus', labelFa: 'وضعیت تأیید', required: false, type: 'status', aliases: ['وضعیت', 'verificationStatus', 'status'], descriptionFa: 'published | verified | draft', example: 'published' }
    ]
  },
  connectors: {
    titleFa: 'سوکت‌ها و کانکتورها',
    columns: [
      { key: 'connectorId', labelFa: 'شناسه یکتای سوکت', required: false, type: 'string', aliases: ['شناسه', 'کد سوکت', 'connectorId', 'id'], descriptionFa: 'شناسه سیستمی سوکت', example: 'conn-tu5-grey-32' },
      { key: 'ecuId', labelFa: 'شناسه ECU یا خودرو مرتبط', required: false, type: 'string', aliases: ['شناسه ecu', 'شناسه خودرو', 'ecuId', 'vehicleId'], descriptionFa: 'شناسه قطعه بالادستی مرتبط', example: 'bosch-me744' },
      { key: 'connectorName', labelFa: 'نام کامل سوکت', required: true, type: 'string', aliases: ['نام سوکت', 'عنوان', 'connectorName', 'name'], descriptionFa: 'نام توصیفی سوکت', example: 'سوکت ۳۲ پایه خاکستری' },
      { key: 'connectorType', labelFa: 'دسته‌بندی سوکت', required: false, type: 'string', aliases: ['نوع سوکت', 'دسته', 'connectorType', 'category'], descriptionFa: 'ecu | sensor | actuator | fusebox', example: 'ecu' },
      { key: 'pinCount', labelFa: 'تعداد کل پایه‌ها', required: true, type: 'number', aliases: ['تعداد پایه', 'تعداد پین', 'pinCount', 'pins'], descriptionFa: 'ظرفیت عددی پین‌ها', example: '32' },
      { key: 'viewOrientation', labelFa: 'زاویه دید / رنگ پوسته', required: false, type: 'string', aliases: ['زاویه دید', 'رنگ پوسته', 'viewOrientation', 'socketColor'], descriptionFa: 'رنگ پوسته و جهت ضامن', example: 'خاکستری، ضامن بالا' },
      { key: 'notes', labelFa: 'توضیحات و کاربرد', required: false, type: 'string', aliases: ['توضیحات', 'notes'], descriptionFa: 'یادداشت‌های کاربردی سوکت', example: 'سوکت میانی دسته سیم موتور' },
      { key: 'source', labelFa: 'منبع اطلاعات', required: false, type: 'string', aliases: ['منبع', 'source'], descriptionFa: 'نقشه مرجع کارخانه', example: 'نقشه سیم‌کشی پژو' },
      { key: 'verificationStatus', labelFa: 'وضعیت انتشار', required: false, type: 'status', aliases: ['وضعیت', 'verificationStatus', 'status'], descriptionFa: 'published | verified | draft', example: 'published' }
    ]
  },
  pins: {
    titleFa: 'پین‌اوت‌ها و پایه‌ها',
    columns: [
      { key: 'connectorId', labelFa: 'شناسه سوکت مربوطه', required: true, type: 'string', aliases: ['شناسه سوکت', 'سوکت', 'connectorId'], descriptionFa: 'شناسه سوکتی که این پایه در آن قرار دارد', example: 'conn-tu5-grey-32' },
      { key: 'pinNumber', labelFa: 'شماره یا کد پایه', required: true, type: 'string', aliases: ['شماره پایه', 'پایه', 'شماره پین', 'pinNumber', 'pin'], descriptionFa: 'مثلاً A1, B2, 1, 15', example: 'A1' },
      { key: 'wireColor', labelFa: 'رنگ سیم', required: false, type: 'string', aliases: ['رنگ سیم', 'رنگ', 'wireColor', 'color'], descriptionFa: 'رنگ عایق سیم (مثلاً سفید با خط مشکی)', example: 'سفید با خط قرمز' },
      { key: 'pinFunction', labelFa: 'عملکرد الکتریکی پایه', required: true, type: 'string', aliases: ['عملکرد', 'وظیفه', 'شرح پایه', 'pinFunction', 'function'], descriptionFa: 'شرح عملکرد پایه (انژکتور ۱، رله دوبل و...) ', example: 'پالس منفی انژکتور سیلندر ۱' },
      { key: 'signalType', labelFa: 'نوع سیگنال', required: false, type: 'string', aliases: ['سیگنال', 'نوع سیگنال', 'signalType', 'type'], descriptionFa: '12V_BAT, 12V_IGN, 5V_REF, GROUND, PWM_PULSE, ANALOG_IN', example: 'PWM_PULSE' },
      { key: 'voltage', labelFa: 'محدوده ولتاژ کاری', required: false, type: 'string', aliases: ['ولتاژ', 'رنج ولتاژ', 'voltage', 'voltageRange'], descriptionFa: 'مثلاً 12.0V - 14.4V یا 5V', example: '12.0V - 14.4V' },
      { key: 'sensorOrActuator', labelFa: 'سنسور یا عملگر متصل', required: false, type: 'string', aliases: ['سنسور', 'عملگر', 'sensorOrActuator', 'target'], descriptionFa: 'نام قطعه مقصد این سیم', example: 'سوزن انژکتور ۱' },
      { key: 'notes', labelFa: 'راهنمای تست دیاگ', required: false, type: 'string', aliases: ['راهنمای تست', 'نکات', 'notes', 'testGuide'], descriptionFa: 'روش سنجش با مولتی‌متر یا اسیلوسکوپ', example: 'تست پالس با لامپ دیودی' },
      { key: 'source', labelFa: 'منبع مستند', required: false, type: 'string', aliases: ['منبع', 'source'], descriptionFa: 'مرجع نقشه', example: 'نقشه رسمی ایران خودرو' },
      { key: 'verificationStatus', labelFa: 'وضعیت تأیید', required: false, type: 'status', aliases: ['وضعیت', 'verificationStatus', 'status'], descriptionFa: 'published | verified | draft', example: 'published' }
    ]
  },
  fuseboxes: {
    titleFa: 'جعبه‌فیوزها',
    columns: [
      { key: 'vehicleId', labelFa: 'شناسه خودرو مرتبط', required: true, type: 'string', aliases: ['شناسه خودرو', 'خودرو', 'vehicleId'], descriptionFa: 'شناسه خودروی مربوط به این جعبه‌فیوز', example: 'peugeot-206' },
      { key: 'fuseBoxName', labelFa: 'نام جعبه‌فیوز', required: true, type: 'string', aliases: ['نام جعبه فیوز', 'جعبه فیوز', 'fuseBoxName', 'name'], descriptionFa: 'عنوان و مدل جعبه‌فیوز (مانند BM34 یا BSI)', example: 'جعبه‌فیوز محفظه موتور (BM34)' },
      { key: 'location', labelFa: 'محل نصب', required: true, type: 'string', aliases: ['محل نصب', 'موقعیت', 'location'], descriptionFa: 'cabin (اتاق) | engine (موتور) | battery (باتری)', example: 'engine' },
      { key: 'modelYear', labelFa: 'سال‌های ساخت تحت پوشش', required: false, type: 'string', aliases: ['سال ساخت', 'مدل سال', 'modelYear', 'modelYears'], descriptionFa: 'محدوده سال تولید', example: '۱۳۸۵ تا ۱۳۹۱' },
      { key: 'engineCode', labelFa: 'کد موتور مرتبط', required: false, type: 'string', aliases: ['موتور', 'کد موتور', 'engineCode', 'engine'], descriptionFa: 'کد پیشرانه سازگار', example: 'TU5' },
      { key: 'notes', labelFa: 'توضیحات و راهنما', required: false, type: 'string', aliases: ['توضیحات', 'نکات', 'notes'], descriptionFa: 'نکات فنی باز و بست', example: 'دارای رله‌های داخلی لحیم‌شده' },
      { key: 'source', labelFa: 'منبع اطلاعات', required: false, type: 'string', aliases: ['منبع', 'source'], descriptionFa: 'دفترچه رسمی', example: 'دفترچه راهنمای مالک پژو' },
      { key: 'verificationStatus', labelFa: 'وضعیت تأیید', required: false, type: 'status', aliases: ['وضعیت', 'verificationStatus', 'status'], descriptionFa: 'published | verified | draft', example: 'published' }
    ]
  },
  fuses: {
    titleFa: 'فیوزها',
    columns: [
      { key: 'fuseBoxId', labelFa: 'شناسه جعبه‌فیوز مربوطه', required: true, type: 'string', aliases: ['شناسه جعبه فیوز', 'جعبه فیوز', 'fuseBoxId'], descriptionFa: 'شناسه جعبه‌فیوز میزبان', example: 'fb-206-engine' },
      { key: 'fuseNumber', labelFa: 'شماره یا کد فیوز', required: true, type: 'string', aliases: ['شماره فیوز', 'کد فیوز', 'فیوز', 'fuseNumber', 'code', 'fuseId'], descriptionFa: 'کد فنی فیوز (مانند F10, MF2, F15)', example: 'F10' },
      { key: 'amperage', labelFa: 'آمپراژ نامی', required: true, type: 'number', aliases: ['آمپراژ', 'آمپر', 'amperage', 'amps', 'ratingAmps'], descriptionFa: 'جریان مجاز (5, 10, 15, 20, 30...)', example: '15' },
      { key: 'fuseType', labelFa: 'نوع استاندارد فیوز', required: false, type: 'string', aliases: ['نوع فیوز', 'fuseType', 'type'], descriptionFa: 'standard | mini | maxi | micro2 | midi', example: 'standard' },
      { key: 'function', labelFa: 'عملکرد و تجهیز مصرف‌کننده', required: true, type: 'string', aliases: ['عملکرد', 'وظیفه', 'شرح', 'function', 'functionName'], descriptionFa: 'سیستم‌های برقی متصل', example: 'پمپ بنزین و گرمکن سنسور اکسیژن' },
      { key: 'protectedCircuit', labelFa: 'مدار محافظت‌شده و خط تغذیه', required: false, type: 'string', aliases: ['مدار محافظت شده', 'مدار', 'protectedCircuit', 'circuit'], descriptionFa: 'شرح خط مدار (+15 سوئیچ یا +30 دائم)', example: '+15 سوئیچ باز، تغذیه رله پمپ' },
      { key: 'notes', labelFa: 'نکات عیب‌یابی فیوز', required: false, type: 'string', aliases: ['نکات', 'notes', 'testTips'], descriptionFa: 'علائم در صورت سوختن این فیوز', example: 'در صورت سوختن خودرو روشن نمی‌شود' },
      { key: 'source', labelFa: 'منبع', required: false, type: 'string', aliases: ['منبع', 'source'], descriptionFa: 'مرجع رسمی', example: 'نقشه فنی برق خودرو' },
      { key: 'verificationStatus', labelFa: 'وضعیت تأیید', required: false, type: 'status', aliases: ['وضعیت', 'verificationStatus', 'status'], descriptionFa: 'published | verified | draft', example: 'published' }
    ]
  },
  relays: {
    titleFa: 'رله‌ها',
    columns: [
      { key: 'fuseBoxId', labelFa: 'شناسه جعبه‌فیوز مربوطه', required: true, type: 'string', aliases: ['شناسه جعبه فیوز', 'جعبه فیوز', 'fuseBoxId'], descriptionFa: 'شناسه جعبه‌فیوز میزبان', example: 'fb-206-engine' },
      { key: 'relayNumber', labelFa: 'شماره یا کد رله', required: true, type: 'string', aliases: ['شماره رله', 'کد رله', 'relayNumber', 'code'], descriptionFa: 'کد فنی رله (مانند R1 یا رله دوبل)', example: 'R1' },
      { key: 'relayName', labelFa: 'نام و عنوان رله', required: true, type: 'string', aliases: ['نام رله', 'عنوان', 'relayName', 'name'], descriptionFa: 'نام سیستم تحت کنترل رله', example: 'رله دوبل انژکتور و پمپ بنزین' },
      { key: 'contactCurrentRating', labelFa: 'جریان نامی کنتاکت قدرت (آمپر)', required: false, type: 'number', aliases: ['جریان کنتاکت', 'آمپراژ رله', 'contactCurrentRating', 'contactAmps', 'amps'], descriptionFa: 'جریان تحمل پلاتین (مثلاً 30 یا 40 آمپر)', example: '30' },
      { key: 'coilVoltage', labelFa: 'ولتاژ تحریک سیم‌پیچ (بوبین)', required: false, type: 'string', aliases: ['ولتاژ بوبین', 'ولتاژ سیم پیچ', 'coilVoltage'], descriptionFa: 'ولتاژ تحریک (مانند 12V DC)', example: '12V DC' },
      { key: 'function', labelFa: 'عملکرد رله در مدار', required: true, type: 'string', aliases: ['عملکرد', 'وظیفه', 'function', 'functionName'], descriptionFa: 'شرح عملکرد در سیستم برق', example: 'برق‌رسانی به ECU، کوئیل و پمپ سوخت' },
      { key: 'relatedCircuit', labelFa: 'پایه‌های بوبین و کنتاکت قدرت', required: false, type: 'string', aliases: ['مدار مرتبط', 'پایه ها', 'relatedCircuit', 'coilPins', 'contactPins'], descriptionFa: 'شماره پایه‌های بوبین (85 و 86) و کنتاکت (30 و 87)', example: 'بوبین: ۸۵ و ۸۶ | کنتاکت: ۳۰ و ۸۷' },
      { key: 'notes', labelFa: 'نکات تست و عیب‌یابی', required: false, type: 'string', aliases: ['نکات', 'تست', 'notes', 'diagnostics'], descriptionFa: 'مقاومت اهمی بوبین و تست ولتاژی', example: 'اهم بوبین حدود ۷۵ تا ۸۵ اهم' },
      { key: 'source', labelFa: 'منبع', required: false, type: 'string', aliases: ['منبع', 'source'], descriptionFa: 'دفترچه رسمی', example: 'نقشه سیم‌کشی کارخانه' },
      { key: 'verificationStatus', labelFa: 'وضعیت تأیید', required: false, type: 'status', aliases: ['وضعیت', 'verificationStatus', 'status'], descriptionFa: 'published | verified | draft', example: 'published' }
    ]
  },
  images: {
    titleFa: 'تصاویر و نقشه‌ها',
    columns: [
      { key: 'recordId', labelFa: 'شناسه تصویر', required: false, type: 'string', aliases: ['شناسه', 'کد تصویر', 'recordId', 'id'], descriptionFa: 'شناسه یکتای تصویر', example: 'img-fb-206-real' },
      { key: 'vehicleId', labelFa: 'شناسه خودرو مربوطه', required: false, type: 'string', aliases: ['شناسه خودرو', 'خودرو', 'vehicleId'], descriptionFa: 'شناسه خودروی مربوطه', example: 'peugeot-206' },
      { key: 'relatedItemType', labelFa: 'نوع آیتم مرتبط', required: true, type: 'string', aliases: ['نوع آیتم', 'دسته', 'relatedItemType', 'entityType'], descriptionFa: 'vehicle | connector | fusebox | diagram', example: 'fusebox' },
      { key: 'relatedItemId', labelFa: 'شناسه آیتم مرتبط', required: true, type: 'string', aliases: ['شناسه آیتم', 'شناسه والد', 'relatedItemId', 'entityId'], descriptionFa: 'شناسه سوکت، خودرو یا جعبه‌فیوز', example: 'fb-206-engine' },
      { key: 'imageType', labelFa: 'دسته‌بندی نوع تصویر', required: true, type: 'string', aliases: ['نوع تصویر', 'دسته تصویر', 'imageType'], descriptionFa: 'fusebox_real | fusebox_cover | socket_front | wiring_diagram', example: 'fusebox_real' },
      { key: 'title', labelFa: 'عنوان تصویر', required: true, type: 'string', aliases: ['عنوان', 'نام تصویر', 'title', 'name'], descriptionFa: 'عنوان واضح و فنی', example: 'تصویر واقعی جعبه‌فیوز کالسکه روی باتری' },
      { key: 'description', labelFa: 'توضیحات تکمیلی', required: false, type: 'string', aliases: ['توضیحات', 'شرح', 'description'], descriptionFa: 'توضیحات کاربردی تکنسین', example: 'نمای روبروی جعبه‌فیوز پس از برداشتن درپوش' },
      { key: 'source', labelFa: 'منبع یا آدرس عکس', required: false, type: 'string', aliases: ['منبع', 'آدرس تصویر', 'url', 'source', 'fileUrl'], descriptionFa: 'آدرس فایل یا مرجع عکاسی', example: 'عکاسی در تعمیرگاه مرکزی' },
      { key: 'verificationStatus', labelFa: 'وضعیت انتشار', required: false, type: 'status', aliases: ['وضعیت', 'verificationStatus', 'status'], descriptionFa: 'published | verified | draft', example: 'published' }
    ]
  }
};

/**
 * Normalizes Persian/Arabic numerals to standard digits (e.g. ۱۵ -> 15)
 */
export function normalizeNumerals(str: string): string {
  if (!str) return '';
  return str
    .replace(/[۰-۹]/g, d => String.fromCharCode(d.charCodeAt(0) - 1728))
    .replace(/[٠-٩]/g, d => String.fromCharCode(d.charCodeAt(0) - 1584));
}

/**
 * Fuzzy header matcher: Given a raw header string from Excel/CSV,
 * matches it to the best column definition key.
 */
export function matchHeaderToColumn(headerStr: string, schema: { columns: ColumnDefinition[] }): string | null {
  if (!headerStr) return null;
  const cleanHeader = normalizeSearchText(headerStr).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '');

  for (const col of schema.columns) {
    // Check direct key match
    if (col.key.toLowerCase() === cleanHeader) return col.key;
    // Check labelFa match
    const cleanLabel = normalizeSearchText(col.labelFa).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '');
    if (cleanLabel === cleanHeader || cleanHeader.includes(cleanLabel) || cleanLabel.includes(cleanHeader)) {
      return col.key;
    }
    // Check aliases
    for (const alias of col.aliases) {
      const cleanAlias = normalizeSearchText(alias).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '');
      if (cleanAlias === cleanHeader) {
        return col.key;
      }
    }
  }
  return null;
}

/**
 * Reads workbook buffer/file and returns list of sheet names
 */
export async function readWorkbookFile(file: File): Promise<{ workbook: XLSX.WorkBook; sheetNames: string[] }> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  return { workbook, sheetNames: workbook.SheetNames };
}

/**
 * Parses raw sheet rows into header array and data rows
 */
export function extractSheetData(workbook: XLSX.WorkBook, sheetName: string): {
  headers: string[];
  rawRows: (string | number | boolean | null)[][];
} {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return { headers: [], rawRows: [] };

  const jsonData = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(worksheet, {
    header: 1,
    defval: ''
  });

  if (!jsonData || jsonData.length === 0) return { headers: [], rawRows: [] };

  // First non-empty row as header
  let headerIndex = 0;
  while (headerIndex < jsonData.length && (!jsonData[headerIndex] || jsonData[headerIndex].every(cell => !cell))) {
    headerIndex++;
  }

  if (headerIndex >= jsonData.length) return { headers: [], rawRows: [] };

  const headers = (jsonData[headerIndex] || []).map(h => (h !== null && h !== undefined ? String(h).trim() : ''));
  const rawRows = jsonData.slice(headerIndex + 1).filter(r => r && r.some(c => c !== null && c !== undefined && String(c).trim() !== ''));

  return { headers, rawRows };
}

/**
 * Core validation engine: Validates rows against schema, checks required fields,
 * checks dependent foreign keys, and detects duplicates.
 */
export function validateBulkData(
  entityType: BulkEntityType,
  headers: string[],
  columnMapping: Record<string, string>, // headerIndex -> columnKey
  rawRows: (string | number | boolean | null)[][]
): ValidationSummary {
  const schema = BULK_SCHEMAS[entityType];
  const errors: ValidationErrorItem[] = [];
  const duplicates: ProbableDuplicateItem[] = [];
  const missingDependencies: MissingDependencyItem[] = [];
  const parsedValidRows: Record<string, unknown>[] = [];
  let missingRequiredCount = 0;

  // Pre-fetch existing database records for duplicate and dependency checks
  const existingVehicles = storage.getVehicles();
  const existingEcus = storage.getECUs();
  const existingConnectors = storage.getConnectors();
  const existingFuseBoxes = storage.getFuseBoxes();

  const vehicleIdSet = new Set(existingVehicles.map(v => v.id.toLowerCase()));
  const ecuIdSet = new Set(existingEcus.map(e => e.id.toLowerCase()));
  const connectorIdSet = new Set(existingConnectors.map(c => c.id.toLowerCase()));
  const fuseBoxIdSet = new Set(existingFuseBoxes.map(f => f.id.toLowerCase()));

  rawRows.forEach((row, rIdx) => {
    const rowNum = rIdx + 2; // +1 for 0-index, +1 for header
    const rowObj: Record<string, unknown> = {};
    let rowHasError = false;

    // Map cells according to columnMapping
    Object.entries(columnMapping).forEach(([colIdxStr, colKey]) => {
      const colIdx = parseInt(colIdxStr, 10);
      const rawVal = row[colIdx];
      const valStr = rawVal !== null && rawVal !== undefined ? normalizeNumerals(String(rawVal)).trim() : '';
      rowObj[colKey] = valStr;
    });

    // 1. Check Required Fields
    schema.columns.forEach(col => {
      const val = rowObj[col.key];
      const strVal = val !== null && val !== undefined ? String(val).trim() : '';

      if (col.required && (!strVal || strVal === '')) {
        errors.push({
          rowIndex: rowNum,
          columnKey: col.key,
          columnLabel: col.labelFa,
          value: '',
          messageFa: `فیلد الزامی «${col.labelFa}» خالی است.`
        });
        rowHasError = true;
        missingRequiredCount++;
      } else if (strVal !== '') {
        // Type validation
        if (col.type === 'number') {
          const num = Number(strVal);
          if (isNaN(num)) {
            errors.push({
              rowIndex: rowNum,
              columnKey: col.key,
              columnLabel: col.labelFa,
              value: strVal,
              messageFa: `مقدار «${strVal}» در ستون «${col.labelFa}» باید یک عدد معتبر باشد.`
            });
            rowHasError = true;
          } else {
            rowObj[col.key] = num;
          }
        }
      }
    });

    // 2. Entity-specific Validations & Dependency Checks
    if (entityType === 'vehicles') {
      const vName = String(rowObj['vehicleName'] || '').trim();
      const vMan = String(rowObj['manufacturer'] || '').trim();
      const vModel = String(rowObj['model'] || '').trim();
      const engCode = String(rowObj['engineCode'] || '').trim();

      // Check duplicates
      const match = existingVehicles.find(v => {
        const nameMatch = normalizeSearchText(v.name) === normalizeSearchText(vName);
        const engineMatch = engCode ? (v.engines && v.engines.some(e => normalizeSearchText(e.code) === normalizeSearchText(engCode))) : false;
        return nameMatch && (vModel ? normalizeSearchText(v.generation).includes(normalizeSearchText(vModel)) : true);
      });

      if (match) {
        duplicates.push({
          rowIndex: rowNum,
          existingId: match.id,
          existingTitle: match.name,
          matchReasonFa: `خودرو با عنوان «${match.name}» در بانک اطلاعاتی موجود است.`,
          targetData: rowObj
        });
      }
    } else if (entityType === 'ecus') {
      const eName = String(rowObj['ecuName'] || '').trim();
      const eBrand = String(rowObj['manufacturer'] || '').trim();

      const match = existingEcus.find(e =>
        normalizeSearchText(e.brand) === normalizeSearchText(eBrand) &&
        normalizeSearchText(e.model) === normalizeSearchText(eName)
      );

      if (match) {
        duplicates.push({
          rowIndex: rowNum,
          existingId: match.id,
          existingTitle: `${match.brand} ${match.model}`,
          matchReasonFa: `کنترل‌یونیت «${match.brand} ${match.model}» قبلاً ثبت شده است.`,
          targetData: rowObj
        });
      }
    } else if (entityType === 'connectors') {
      const cId = String(rowObj['connectorId'] || '').trim();
      const cName = String(rowObj['connectorName'] || '').trim();
      const ecuOrVehId = String(rowObj['ecuId'] || '').trim();

      if (ecuOrVehId && !ecuIdSet.has(ecuOrVehId.toLowerCase()) && !vehicleIdSet.has(ecuOrVehId.toLowerCase())) {
        missingDependencies.push({
          rowIndex: rowNum,
          dependentField: 'ecuId',
          dependentValue: ecuOrVehId,
          missingEntityFa: 'خودرو یا ECU',
          messageFa: `شناسه ارجاع داده شده «${ecuOrVehId}» در پایگاه داده خودروها یا ECUها یافت نشد.`
        });
      }

      if (cId) {
        const match = existingConnectors.find(c => c.id.toLowerCase() === cId.toLowerCase());
        if (match) {
          duplicates.push({
            rowIndex: rowNum,
            existingId: match.id,
            existingTitle: match.name,
            matchReasonFa: `سوکت با شناسه «${match.id}» از قبل در سیستم موجود است.`,
            targetData: rowObj
          });
        }
      }
    } else if (entityType === 'pins') {
      const cId = String(rowObj['connectorId'] || '').trim();
      const pinNum = String(rowObj['pinNumber'] || '').trim();

      if (cId && !connectorIdSet.has(cId.toLowerCase())) {
        missingDependencies.push({
          rowIndex: rowNum,
          dependentField: 'connectorId',
          dependentValue: cId,
          missingEntityFa: 'سوکت',
          messageFa: `سوکت با شناسه «${cId}» برای ثبت پایه در سیستم وجود ندارد.`
        });
        rowHasError = true;
      } else if (cId) {
        const conn = existingConnectors.find(c => c.id.toLowerCase() === cId.toLowerCase());
        if (conn && conn.pins.some(p => p.pinNumber.toLowerCase() === pinNum.toLowerCase())) {
          duplicates.push({
            rowIndex: rowNum,
            existingId: `${cId}-${pinNum}`,
            existingTitle: `پایه ${pinNum} در ${conn.name}`,
            matchReasonFa: `پایه شماره «${pinNum}» از قبل در سوکت «${conn.name}» ثبت شده است.`,
            targetData: rowObj
          });
        }
      }
    } else if (entityType === 'fuseboxes') {
      const vId = String(rowObj['vehicleId'] || '').trim();
      const fbName = String(rowObj['fuseBoxName'] || '').trim();

      if (vId && !vehicleIdSet.has(vId.toLowerCase())) {
        missingDependencies.push({
          rowIndex: rowNum,
          dependentField: 'vehicleId',
          dependentValue: vId,
          missingEntityFa: 'خودرو',
          messageFa: `خودرو با شناسه «${vId}» برای اتصال جعبه‌فیوز یافت نشد.`
        });
        rowHasError = true;
      }

      const match = existingFuseBoxes.find(fb =>
        fb.vehicleId.toLowerCase() === vId.toLowerCase() &&
        normalizeSearchText(fb.name) === normalizeSearchText(fbName)
      );

      if (match) {
        duplicates.push({
          rowIndex: rowNum,
          existingId: match.id,
          existingTitle: match.name,
          matchReasonFa: `جعبه‌فیوز «${match.name}» برای این خودرو قبلاً ثبت شده است.`,
          targetData: rowObj
        });
      }
    } else if (entityType === 'fuses') {
      const fbId = String(rowObj['fuseBoxId'] || '').trim();
      const fNum = String(rowObj['fuseNumber'] || '').trim();
      const amps = Number(rowObj['amperage']);

      if (fbId && !fuseBoxIdSet.has(fbId.toLowerCase())) {
        missingDependencies.push({
          rowIndex: rowNum,
          dependentField: 'fuseBoxId',
          dependentValue: fbId,
          missingEntityFa: 'جعبه‌فیوز',
          messageFa: `جعبه‌فیوز با شناسه «${fbId}» برای ثبت فیوز یافت نشد.`
        });
        rowHasError = true;
      }

      if (amps <= 0 || amps > 150) {
        errors.push({
          rowIndex: rowNum,
          columnKey: 'amperage',
          columnLabel: 'آمپراژ',
          value: amps,
          messageFa: `آمپراژ ${amps} نامعتبر است؛ باید مقداری بین ۱ تا ۱۵۰ آمپر باشد.`
        });
        rowHasError = true;
      }

      if (fbId && fuseBoxIdSet.has(fbId.toLowerCase())) {
        const fb = existingFuseBoxes.find(f => f.id.toLowerCase() === fbId.toLowerCase());
        if (fb && fb.fuses.some(f => f.code.toLowerCase() === fNum.toLowerCase())) {
          duplicates.push({
            rowIndex: rowNum,
            existingId: `${fbId}-${fNum}`,
            existingTitle: `فیوز ${fNum} در ${fb.name}`,
            matchReasonFa: `فیوز با شماره «${fNum}» قبلاً در این جعبه‌فیوز تعریف شده است.`,
            targetData: rowObj
          });
        }
      }
    } else if (entityType === 'relays') {
      const fbId = String(rowObj['fuseBoxId'] || '').trim();
      const rNum = String(rowObj['relayNumber'] || '').trim();

      if (fbId && !fuseBoxIdSet.has(fbId.toLowerCase())) {
        missingDependencies.push({
          rowIndex: rowNum,
          dependentField: 'fuseBoxId',
          dependentValue: fbId,
          missingEntityFa: 'جعبه‌فیوز',
          messageFa: `جعبه‌فیوز با شناسه «${fbId}» برای ثبت رله در سیستم وجود ندارد.`
        });
        rowHasError = true;
      }

      if (fbId && fuseBoxIdSet.has(fbId.toLowerCase())) {
        const fb = existingFuseBoxes.find(f => f.id.toLowerCase() === fbId.toLowerCase());
        if (fb && fb.relays.some(r => r.code.toLowerCase() === rNum.toLowerCase())) {
          duplicates.push({
            rowIndex: rowNum,
            existingId: `${fbId}-${rNum}`,
            existingTitle: `رله ${rNum} در ${fb.name}`,
            matchReasonFa: `رله با کد «${rNum}» قبلاً در این جعبه‌فیوز ثبت شده است.`,
            targetData: rowObj
          });
        }
      }
    } else if (entityType === 'images') {
      const rItemType = String(rowObj['relatedItemType'] || '').trim();
      const rItemId = String(rowObj['relatedItemId'] || '').trim();

      let targetExists = false;
      if (rItemType === 'vehicle') targetExists = vehicleIdSet.has(rItemId.toLowerCase());
      else if (rItemType === 'connector') targetExists = connectorIdSet.has(rItemId.toLowerCase());
      else if (rItemType === 'fusebox') targetExists = fuseBoxIdSet.has(rItemId.toLowerCase());
      else targetExists = true;

      if (!targetExists) {
        missingDependencies.push({
          rowIndex: rowNum,
          dependentField: 'relatedItemId',
          dependentValue: rItemId,
          missingEntityFa: rItemType,
          messageFa: `آیتم مرتبط «${rItemId}» از نوع «${rItemType}» در سیستم یافت نشد.`
        });
        rowHasError = true;
      }
    }

    if (!rowHasError) {
      parsedValidRows.push(rowObj);
    }
  });

  return {
    totalRows: rawRows.length,
    validCount: parsedValidRows.length,
    invalidCount: rawRows.length - parsedValidRows.length,
    duplicateCount: duplicates.length,
    missingDependencyCount: missingDependencies.length,
    missingRequiredCount,
    errors,
    duplicates,
    missingDependencies,
    parsedValidRows
  };
}

/**
 * Generates and downloads a pre-formatted template with standard columns and sample row
 */
export function generateBulkTemplate(entityType: BulkEntityType, format: 'xlsx' | 'csv' = 'xlsx'): void {
  const schema = BULK_SCHEMAS[entityType];

  // Headers (English keys for interoperability)
  const headers = schema.columns.map(c => c.key);
  // Sample data row based on examples
  const sampleRow = schema.columns.map(c => c.example);
  // Persian description guide row
  const guideRow = schema.columns.map(c => `${c.labelFa} (${c.required ? 'الزامی' : 'اختیاری'})`);

  const rows = [headers, guideRow, sampleRow];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, schema.titleFa);

  if (format === 'csv') {
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autopin-template-${entityType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    XLSX.writeFile(wb, `autopin-template-${entityType}.xlsx`);
  }
}

/**
 * Generates and downloads an error report in CSV format
 */
export function generateErrorReportCsv(
  entityType: BulkEntityType,
  errors: ValidationErrorItem[],
  duplicates: ProbableDuplicateItem[],
  missingDependencies: MissingDependencyItem[]
): void {
  const rows: (string | number)[][] = [
    ['ردیف', 'نوع گزارش', 'نام فیلد / ستون', 'مقدار ورودی', 'شرح دقیق خطا / تفاوت']
  ];

  errors.forEach(err => {
    rows.push([err.rowIndex, 'خطای داده', err.columnLabel, String(err.value || ''), err.messageFa]);
  });

  duplicates.forEach(dup => {
    rows.push([dup.rowIndex, 'احتمال تکراری', 'شناسه / عنوان', dup.existingTitle, dup.matchReasonFa]);
  });

  missingDependencies.forEach(dep => {
    rows.push([dep.rowIndex, 'ارجاع نامعتبر', dep.dependentField, dep.dependentValue, dep.messageFa]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const csvContent = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `autopin-import-errors-${entityType}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exports database records to CSV or XLSX with custom filters
 */
export function exportDatabaseRecords(
  entityType: BulkEntityType,
  format: 'xlsx' | 'csv' = 'xlsx',
  options?: {
    vehicleId?: string;
    publishedOnly?: boolean;
  }
): { recordCount: number } {
  const schema = BULK_SCHEMAS[entityType];
  let exportRows: Record<string, unknown>[] = [];

  if (entityType === 'vehicles') {
    let list = storage.getVehicles();
    if (options?.publishedOnly) list = list.filter(v => v.status === 'published' || v.status === 'verified');
    exportRows = list.map(v => ({
      manufacturer: v.manufacturerId,
      vehicleName: v.name,
      model: v.generation,
      yearFrom: v.modelYears.split('-')[0]?.trim() || '',
      yearTo: v.modelYears.split('-')[1]?.trim() || '',
      engineCode: v.engines?.map(e => e.code).join(', ') || '',
      fuelSystem: v.electricalSystem,
      ecuIds: v.ecuIds?.join(', ') || '',
      notes: v.description,
      source: v.source || 'AutoPin Pro',
      verificationStatus: v.status || 'published'
    }));
  } else if (entityType === 'ecus') {
    let list = storage.getECUs(options?.vehicleId);
    if (options?.publishedOnly) list = list.filter(e => e.status === 'published' || e.status === 'verified');
    exportRows = list.map(e => ({
      manufacturer: e.brand,
      ecuName: e.model,
      partNumber: e.hardwareVersion || '',
      hardwareVersion: e.hardwareVersion || '',
      softwareVersion: e.softwareVersion || '',
      compatibleEngineCodes: '',
      connectorIds: '',
      notes: e.description || '',
      source: 'AutoPin Pro',
      verificationStatus: e.status || 'published'
    }));
  } else if (entityType === 'connectors') {
    let list = storage.getConnectors(options?.vehicleId);
    if (options?.publishedOnly) list = list.filter(c => c.status === 'published' || c.status === 'verified');
    exportRows = list.map(c => ({
      connectorId: c.id,
      ecuId: c.ecuId || c.vehicleId || '',
      connectorName: c.name,
      connectorType: c.category,
      pinCount: c.pinCount,
      viewOrientation: c.socketColor,
      notes: c.notes || '',
      source: c.source || 'AutoPin Pro',
      verificationStatus: c.status || 'published'
    }));
  } else if (entityType === 'pins') {
    const connectors = storage.getConnectors(options?.vehicleId);
    connectors.forEach(c => {
      c.pins.forEach(p => {
        if (!options?.publishedOnly || p.status === 'published' || p.status === 'verified') {
          exportRows.push({
            connectorId: c.id,
            pinNumber: p.pinNumber,
            wireColor: p.wireColor,
            pinFunction: p.functionName,
            signalType: p.signalType,
            voltage: p.voltageRange,
            sensorOrActuator: '',
            notes: p.testGuide || p.notes || '',
            source: p.source || c.source || 'AutoPin Pro',
            verificationStatus: p.status || 'published'
          });
        }
      });
    });
  } else if (entityType === 'fuseboxes') {
    let list = storage.getFuseBoxes(options?.vehicleId);
    if (options?.publishedOnly) list = list.filter(f => f.status === 'published' || f.status === 'verified');
    exportRows = list.map(fb => ({
      vehicleId: fb.vehicleId,
      fuseBoxName: fb.name,
      location: fb.location,
      modelYear: fb.modelYears || '',
      engineCode: fb.engineCode || '',
      notes: fb.notes || '',
      source: fb.source || 'AutoPin Pro',
      verificationStatus: fb.status || 'published'
    }));
  } else if (entityType === 'fuses') {
    const fbs = storage.getFuseBoxes(options?.vehicleId);
    fbs.forEach(fb => {
      fb.fuses.forEach(f => {
        if (!options?.publishedOnly || f.status === 'published' || f.status === 'verified') {
          exportRows.push({
            fuseBoxId: fb.id,
            fuseNumber: f.code,
            amperage: f.ratingAmps,
            fuseType: f.fuseType || 'standard',
            function: f.functionName,
            protectedCircuit: f.circuitDetails,
            notes: f.testTips || '',
            source: f.source || fb.source || 'AutoPin Pro',
            verificationStatus: f.status || 'published'
          });
        }
      });
    });
  } else if (entityType === 'relays') {
    const fbs = storage.getFuseBoxes(options?.vehicleId);
    fbs.forEach(fb => {
      fb.relays.forEach(r => {
        if (!options?.publishedOnly || r.status === 'published' || r.status === 'verified') {
          exportRows.push({
            fuseBoxId: fb.id,
            relayNumber: r.code,
            relayName: r.name,
            contactCurrentRating: r.contactAmps || 30,
            coilVoltage: r.coilVoltage || '12V DC',
            function: r.functionName,
            relatedCircuit: `${r.coilPins} | ${r.contactPins}`,
            notes: r.diagnostics || '',
            source: r.source || fb.source || 'AutoPin Pro',
            verificationStatus: r.status || 'published'
          });
        }
      });
    });
  } else if (entityType === 'images') {
    let list = storage.getMediaItems();
    if (options?.vehicleId) list = list.filter(m => m.vehicleId === options.vehicleId || m.entityId === options.vehicleId);
    if (options?.publishedOnly) list = list.filter(m => m.status === 'published' || m.status === 'verified');
    exportRows = list.map(m => ({
      recordId: m.id,
      vehicleId: m.vehicleId || '',
      relatedItemType: m.entityType,
      relatedItemId: m.entityId,
      imageType: m.imageType,
      title: m.title,
      description: m.description || '',
      source: m.source || m.fileUrl || '',
      verificationStatus: m.status || 'published'
    }));
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportRows, {
    header: schema.columns.map(c => c.key)
  });
  XLSX.utils.book_append_sheet(wb, ws, schema.titleFa);

  const filename = `autopin-${entityType}-export-${new Date().toISOString().slice(0, 10)}`;

  if (format === 'csv') {
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  return { recordCount: exportRows.length };
}

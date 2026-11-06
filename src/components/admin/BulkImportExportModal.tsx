import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ChevronLeft,
  RefreshCw,
  Layers,
  Database,
  ShieldAlert,
  Loader2,
  Trash2,
  Info,
  Car,
  Cpu,
  Zap,
  Image as ImageIcon
} from 'lucide-react';
import {
  BulkEntityType,
  BULK_SCHEMAS,
  readWorkbookFile,
  extractSheetData,
  matchHeaderToColumn,
  validateBulkData,
  ValidationSummary,
  generateBulkTemplate,
  generateErrorReportCsv,
  exportDatabaseRecords
} from '../../utils/bulkDataEngine';
import { storage } from '../../services/storage';
import { onlineStorage } from '../../services/onlineStorage';
import { useAuth } from '../../context/AuthContext';
import {
  Vehicle,
  ECU,
  Connector,
  ConnectorPin,
  FuseBox,
  Fuse,
  Relay,
  MediaItem,
  PublicationStatus,
  SignalType,
  FuseSupplyType
} from '../../types';

interface BulkImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
  initialEntityType?: BulkEntityType;
}

export const BulkImportExportModal: React.FC<BulkImportExportModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  initialEntityType = 'vehicles'
}) => {
  const { isAdmin, isOnlineDbConnected } = useAuth();
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'templates'>('import');
  const [entityType, setEntityType] = useState<BulkEntityType>(initialEntityType);

  // Import State
  const [importStep, setImportStep] = useState<'file' | 'sheet' | 'mapping' | 'preview' | 'committing' | 'done'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<any | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<(string | number | boolean | null)[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({}); // headerColIdx -> schemaKey
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update'>('skip');

  // Execution Progress State
  const [commitProgress, setCommitProgress] = useState<number>(0);
  const [commitStatusText, setCommitStatusText] = useState<string>('');
  const [commitResult, setCommitResult] = useState<{ added: number; updated: number; failed: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Export State
  const [exportEntityType, setExportEntityType] = useState<BulkEntityType>('vehicles');
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [exportVehicleId, setExportVehicleId] = useState<string>('all');
  const [exportPublishedOnly, setExportPublishedOnly] = useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const vehicles = storage.getVehicles();

  if (!isOpen) return null;

  // Handle File Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setSelectedFile(file);
      const { workbook: wb, sheetNames: names } = await readWorkbookFile(file);
      setWorkbook(wb);
      setSheetNames(names);

      if (names.length === 1) {
        setSelectedSheet(names[0]);
        loadSheetData(wb, names[0]);
      } else {
        setImportStep('sheet');
      }
    } catch (err: unknown) {
      alert(`خطا در باز کردن فایل: ${err instanceof Error ? err.message : 'فرمت نامعتبر'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadSheetData = (wb: any, sheetName: string) => {
    const { headers, rawRows: rows } = extractSheetData(wb, sheetName);
    setRawHeaders(headers);
    setRawRows(rows);

    // Auto map headers to columns
    const schema = BULK_SCHEMAS[entityType];
    const initialMapping: Record<string, string> = {};
    headers.forEach((h, idx) => {
      const matchKey = matchHeaderToColumn(h, schema);
      if (matchKey) {
        initialMapping[String(idx)] = matchKey;
      }
    });

    setColumnMapping(initialMapping);
    setImportStep('mapping');
  };

  const handleSelectSheet = (name: string) => {
    setSelectedSheet(name);
    loadSheetData(workbook, name);
  };

  const handleRunValidation = () => {
    if (!rawRows || rawRows.length === 0) {
      alert('هیچ داده‌ای در این شیت برای بررسی وجود ندارد.');
      return;
    }
    const summary = validateBulkData(entityType, rawHeaders, columnMapping, rawRows);
    setValidationSummary(summary);
    setImportStep('preview');
  };

  // Safe Bulk Commit Handler
  const handleConfirmAndCommit = async () => {
    if (!validationSummary || validationSummary.validCount === 0) {
      alert('هیچ رکورد معتبری برای ثبت وجود ندارد.');
      return;
    }

    if (isProcessing) return; // Prevent double click

    setIsProcessing(true);
    setImportStep('committing');
    setCommitProgress(5);
    setCommitStatusText('در حال آماده‌سازی رکوردهای معتبر...');

    let addedCount = 0;
    let updatedCount = 0;
    let failedCount = 0;

    const rowsToProcess = validationSummary.parsedValidRows;
    const total = rowsToProcess.length;

    try {
      for (let i = 0; i < total; i++) {
        const row = rowsToProcess[i];
        const progressPct = Math.round(((i + 1) / total) * 90);
        setCommitProgress(progressPct);
        setCommitStatusText(`در حال ثبت رکورد ${i + 1} از ${total}...`);

        try {
          if (entityType === 'vehicles') {
            const vName = String(row['vehicleName'] || '').trim();
            const existing = storage.getVehicles().find(v => v.name.toLowerCase() === vName.toLowerCase());

            const vObj: Vehicle = {
              id: existing?.id || `veh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              manufacturerId: String(row['manufacturer'] || 'iran_khodro'),
              name: vName,
              persianName: vName,
              generation: String(row['model'] || ''),
              modelYears: `${row['yearFrom'] || ''} - ${row['yearTo'] || ''}`.trim(),
              electricalSystem: String(row['fuelSystem'] || 'انژکتوری استاندارد'),
              description: String(row['notes'] || ''),
              engines: row['engineCode'] ? [{
                id: `eng-${Date.now()}`,
                vehicleId: existing?.id || '',
                code: String(row['engineCode']),
                name: `موتور ${row['engineCode']}`,
                fuelSystem: String(row['fuelSystem'] || 'انژکتوری'),
                valves: 16,
                displacementCc: 1600
              }] : (existing?.engines || []),
              source: String(row['source'] || 'ورود گروهی فایل اکسل'),
              status: (row['verificationStatus'] as PublicationStatus) || 'published',
              createdAt: existing?.createdAt || Date.now(),
              updatedAt: Date.now()
            };

            storage.saveVehicle(vObj);
            if (isAdmin && isOnlineDbConnected) {
              await onlineStorage.saveVehicle(vObj);
            }
            if (existing) updatedCount++;
            else addedCount++;

          } else if (entityType === 'ecus') {
            const eName = String(row['ecuName'] || '').trim();
            const eBrand = String(row['manufacturer'] || '').trim();
            const existing = storage.getECUs().find(e => e.model.toLowerCase() === eName.toLowerCase());

            const ecuObj: ECU = {
              id: existing?.id || `ecu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              vehicleId: vehicles[0]?.id || 'peugeot-206',
              brand: eBrand || 'Bosch',
              model: eName,
              hardwareVersion: String(row['hardwareVersion'] || row['partNumber'] || ''),
              softwareVersion: String(row['softwareVersion'] || ''),
              connectorCount: 2,
              description: String(row['notes'] || ''),
              status: (row['verificationStatus'] as PublicationStatus) || 'published'
            };

            storage.saveECU(ecuObj);
            if (isAdmin && isOnlineDbConnected) {
              await onlineStorage.saveECU(ecuObj);
            }
            if (existing) updatedCount++;
            else addedCount++;

          } else if (entityType === 'connectors') {
            const cName = String(row['connectorName'] || '').trim();
            const cId = String(row['connectorId'] || '').trim() || `conn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const existing = storage.getConnectorById(cId);

            const connObj: Connector = {
              id: cId,
              vehicleId: String(row['ecuId'] || vehicles[0]?.id || 'peugeot-206'),
              name: cName,
              codeName: cName,
              category: (row['connectorType'] as any) || 'ecu',
              pinCount: Number(row['pinCount']) || 32,
              rows: 4,
              cols: 8,
              shape: 'grid',
              socketColor: String(row['viewOrientation'] || 'خاکستری'),
              socketColorHex: '#71717a',
              source: String(row['source'] || 'ورود گروهی فایل'),
              status: (row['verificationStatus'] as PublicationStatus) || 'published',
              notes: String(row['notes'] || ''),
              pins: existing?.pins || [],
              createdAt: existing?.createdAt || Date.now(),
              updatedAt: Date.now()
            };

            storage.saveConnector(connObj);
            if (isAdmin && isOnlineDbConnected) {
              await onlineStorage.saveConnector(connObj);
            }
            if (existing) updatedCount++;
            else addedCount++;

          } else if (entityType === 'pins') {
            const cId = String(row['connectorId'] || '').trim();
            const conn = storage.getConnectorById(cId);
            if (conn) {
              const pinNum = String(row['pinNumber'] || '').trim();
              const existingPinIndex = conn.pins.findIndex(p => p.pinNumber.toLowerCase() === pinNum.toLowerCase());

              const newPin: ConnectorPin = {
                id: existingPinIndex >= 0 ? conn.pins[existingPinIndex].id : `pin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                connectorId: cId,
                pinNumber: pinNum,
                wireColor: String(row['wireColor'] || 'نامشخص'),
                wireHex: '#ffffff',
                functionName: String(row['pinFunction'] || `پایه ${pinNum}`),
                signalType: (row['signalType'] as SignalType) || '12V_BAT',
                voltageRange: String(row['voltage'] || '12.0V'),
                testGuide: String(row['notes'] || ''),
                status: (row['verificationStatus'] as PublicationStatus) || 'published'
              };

              if (existingPinIndex >= 0) {
                conn.pins[existingPinIndex] = newPin;
                updatedCount++;
              } else {
                conn.pins.push(newPin);
                addedCount++;
              }

              storage.saveConnector(conn);
              if (isAdmin && isOnlineDbConnected) {
                await onlineStorage.saveConnector(conn);
              }
            } else {
              failedCount++;
            }

          } else if (entityType === 'fuseboxes') {
            const fbName = String(row['fuseBoxName'] || '').trim();
            const vId = String(row['vehicleId'] || vehicles[0]?.id);
            const existing = storage.getFuseBoxes(vId).find(f => f.name.toLowerCase() === fbName.toLowerCase());

            const locStr = String(row['location'] || 'cabin').toLowerCase();
            const locKey = locStr.includes('engine') || locStr.includes('موتور') ? 'engine' : 'cabin';

            const fbObj: FuseBox = {
              id: existing?.id || `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              vehicleId: vId,
              name: fbName,
              location: locKey,
              locationFa: locKey === 'engine' ? 'محفظه موتور' : 'داخل کابین (زیر داشبورد)',
              modelYears: String(row['modelYear'] || ''),
              engineCode: String(row['engineCode'] || ''),
              notes: String(row['notes'] || ''),
              source: String(row['source'] || 'ورود گروهی فایل'),
              status: (row['verificationStatus'] as PublicationStatus) || 'published',
              fuses: existing?.fuses || [],
              relays: existing?.relays || []
            };

            storage.saveFuseBox(fbObj);
            if (isAdmin && isOnlineDbConnected) {
              await onlineStorage.saveFuseBox(fbObj);
            }
            if (existing) updatedCount++;
            else addedCount++;

          } else if (entityType === 'fuses') {
            const fbId = String(row['fuseBoxId'] || '').trim();
            const fb = storage.getFuseBoxById(fbId);
            if (fb) {
              const fCode = String(row['fuseNumber'] || '').trim();
              const existingIdx = fb.fuses.findIndex(f => f.code.toLowerCase() === fCode.toLowerCase());

              const fuseItem: Fuse = {
                id: existingIdx >= 0 ? fb.fuses[existingIdx].id : `fuse-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                fuseBoxId: fbId,
                code: fCode,
                ratingAmps: Number(row['amperage']) || 10,
                fuseType: (row['fuseType'] as any) || 'standard',
                functionName: String(row['function'] || `فیوز ${fCode}`),
                circuitDetails: String(row['protectedCircuit'] || row['function'] || ''),
                powerSupplyType: '+15 (سوئیچ باز)',
                testTips: String(row['notes'] || ''),
                status: (row['verificationStatus'] as PublicationStatus) || 'published'
              };

              if (existingIdx >= 0) {
                fb.fuses[existingIdx] = fuseItem;
                updatedCount++;
              } else {
                fb.fuses.push(fuseItem);
                addedCount++;
              }

              storage.saveFuseBox(fb);
              if (isAdmin && isOnlineDbConnected) {
                await onlineStorage.saveFuseBox(fb);
              }
            } else {
              failedCount++;
            }

          } else if (entityType === 'relays') {
            const fbId = String(row['fuseBoxId'] || '').trim();
            const fb = storage.getFuseBoxById(fbId);
            if (fb) {
              const rCode = String(row['relayNumber'] || '').trim();
              const existingIdx = fb.relays.findIndex(r => r.code.toLowerCase() === rCode.toLowerCase());

              const relayItem: Relay = {
                id: existingIdx >= 0 ? fb.relays[existingIdx].id : `relay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                fuseBoxId: fbId,
                code: rCode,
                name: String(row['relayName'] || `رله ${rCode}`),
                rating: `12V ${row['contactCurrentRating'] || 30}A`,
                contactAmps: Number(row['contactCurrentRating']) || 30,
                coilVoltage: String(row['coilVoltage'] || '12V DC'),
                relayType: 'cube_4pin',
                coilPins: '85 و 86',
                contactPins: '30 و 87',
                functionName: String(row['function'] || row['relayName'] || ''),
                circuitDetails: String(row['relatedCircuit'] || ''),
                diagnostics: String(row['notes'] || ''),
                status: (row['verificationStatus'] as PublicationStatus) || 'published'
              };

              if (existingIdx >= 0) {
                fb.relays[existingIdx] = relayItem;
                updatedCount++;
              } else {
                fb.relays.push(relayItem);
                addedCount++;
              }

              storage.saveFuseBox(fb);
              if (isAdmin && isOnlineDbConnected) {
                await onlineStorage.saveFuseBox(fb);
              }
            } else {
              failedCount++;
            }

          } else if (entityType === 'images') {
            const mediaItem: MediaItem = {
              id: String(row['recordId'] || '').trim() || `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              title: String(row['title'] || 'تصویر فنی'),
              description: String(row['description'] || ''),
              fileUrl: String(row['source'] || ''),
              entityType: (row['relatedItemType'] as any) || 'fusebox',
              entityId: String(row['relatedItemId'] || ''),
              vehicleId: String(row['vehicleId'] || ''),
              imageType: String(row['imageType'] || 'fusebox_real'),
              source: String(row['source'] || ''),
              status: (row['verificationStatus'] as PublicationStatus) || 'published',
              createdAt: Date.now()
            };

            storage.saveMediaItem(mediaItem);
            if (isAdmin && isOnlineDbConnected) {
              await onlineStorage.saveMedia(mediaItem);
            }
            addedCount++;
          }
        } catch (rowErr) {
          console.warn('Error saving row:', rowErr);
          failedCount++;
        }
      }

      setCommitProgress(100);
      setCommitStatusText('عملیات ورود اطلاعات با موفقیت تکمیل شد.');
      setCommitResult({ added: addedCount, updated: updatedCount, failed: failedCount });
      setImportStep('done');

      const entityLabel: Record<BulkEntityType, string> = {
        vehicles: 'خودروها',
        ecus: 'ECUها',
        connectors: 'سوکت‌ها',
        pins: 'پایه‌های سوکت',
        fuseboxes: 'جعبه‌فیوزها',
        fuses: 'فیوزها',
        relays: 'رله‌ها',
        images: 'تصاویر و نقشه‌ها'
      };

      // Emit notification for admin
      storage.createNotification({
        type: 'bulk_import_done',
        title: 'تکمیل عملیات ورود گروهی اطلاعات',
        message: `عملیات بارگذاری ${entityLabel[entityType] || entityType} به اتمام رسید: ${addedCount} رکورد افزوده، ${updatedCount} رکورد به‌روزرسانی و ${failedCount} خطا.`,
        target: 'admins',
        priority: 'normal',
        uniqueEventKey: `notif-bulk-${entityType}-${Date.now()}`
      });

      storage.recordAuditLog({
        actionType: 'bulk_import',
        userId: 'admin',
        userEmail: 'admin@autopin.ir',
        userRole: 'admin',
        targetType: 'bulk',
        targetTitle: `ورود گروهی ${entityLabel[entityType] || entityType}`,
        status: failedCount === 0 || addedCount + updatedCount > 0 ? 'success' : 'failure',
        summary: `ورود گروهی ${entityLabel[entityType] || entityType}: ${addedCount} افزوده، ${updatedCount} ویرایش‌شده، ${failedCount} خطا`,
        details: { entityType, addedCount, updatedCount, failedCount }
      });

      onRefreshData?.();
    } catch (err: unknown) {
      storage.createNotification({
        type: 'error_alert',
        title: 'خطا در ورود گروهی اطلاعات',
        message: `عملیات بارگذاری با خطا متوقف شد: ${err instanceof Error ? err.message : 'خطای ناشناخته'}`,
        target: 'admins',
        priority: 'high',
        uniqueEventKey: `notif-bulk-err-${Date.now()}`
      });

      storage.recordAuditLog({
        actionType: 'bulk_import',
        userId: 'admin',
        userEmail: 'admin@autopin.ir',
        userRole: 'admin',
        targetType: 'bulk',
        targetTitle: `خطا در ورود گروهی`,
        status: 'failure',
        summary: `خطا در بارگذاری گروهی: ${err instanceof Error ? err.message : 'ناشناخته'}`
      });

      alert(`خطا در هنگام ثبت اطلاعات: ${err instanceof Error ? err.message : 'خطای ناشناخته'}`);
      setImportStep('preview');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Export Trigger
  const handleTriggerExport = () => {
    try {
      const res = exportDatabaseRecords(exportEntityType, exportFormat, {
        vehicleId: exportVehicleId !== 'all' ? exportVehicleId : undefined,
        publishedOnly: exportPublishedOnly
      });
      setExportSuccessMsg(`تعداد ${res.recordCount} رکورد با فرمت ${exportFormat.toUpperCase()} خروجی گرفته شد.`);
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (err: unknown) {
      alert(`خطا در گرفتن خروجی: ${err instanceof Error ? err.message : 'خطای ناشناخته'}`);
    }
  };

  const resetImportFlow = () => {
    setSelectedFile(null);
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet('');
    setRawHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setValidationSummary(null);
    setImportStep('file');
    setCommitResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                ورود گروهی و خروجی اکسل / CSV اطلاعات فنی
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                بانک اطلاعاتی AutoPin Pro · ورود امن با اعتبارسنجی پیش از ثبت
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center p-2 border-b border-zinc-800 bg-zinc-900/90 text-xs overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-4 py-2 font-bold rounded-xl transition ${
              activeTab === 'import' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>ورود گروهی اطلاعات (Excel / CSV)</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-4 py-2 font-bold rounded-xl transition ${
              activeTab === 'export' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>خروجی گرفتن از بانک اطلاعاتی</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-4 py-2 font-bold rounded-xl transition ${
              activeTab === 'templates' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>الگوهای استاندارد ورود اطلاعات</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-right">
          {/* ========================================================= */}
          {/* TAB 1: BULK IMPORT WIZARD                                 */}
          {/* ========================================================= */}
          {activeTab === 'import' && (
            <div className="flex flex-col gap-5">
              {/* Step indicator breadcrumbs */}
              <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-[11px] overflow-x-auto">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${importStep === 'file' ? 'bg-red-600/20 text-red-400 font-bold' : 'text-zinc-500'}`}>
                  <span>۱. انتخاب فایل</span>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${importStep === 'sheet' ? 'bg-red-600/20 text-red-400 font-bold' : 'text-zinc-500'}`}>
                  <span>۲. انتخاب شیت</span>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${importStep === 'mapping' ? 'bg-red-600/20 text-red-400 font-bold' : 'text-zinc-500'}`}>
                  <span>۳. تطبیق ستون‌ها</span>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${importStep === 'preview' ? 'bg-red-600/20 text-red-400 font-bold' : 'text-zinc-500'}`}>
                  <span>۴. پیش‌نمایش و خطاها</span>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${importStep === 'committing' || importStep === 'done' ? 'bg-emerald-600/20 text-emerald-400 font-bold' : 'text-zinc-500'}`}>
                  <span>۵. ثبت نهایی</span>
                </div>
              </div>

              {/* STEP 1: FILE & ENTITY SELECTION */}
              {importStep === 'file' && (
                <div className="flex flex-col gap-4">
                  {/* Entity Category Dropdown */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      انتخاب دسته‌بندی اطلاعات مورد نظر برای ورود:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(Object.keys(BULK_SCHEMAS) as BulkEntityType[]).map((key) => {
                        const isSel = entityType === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setEntityType(key)}
                            className={`p-3 rounded-xl border text-right transition flex flex-col justify-between ${
                              isSel
                                ? 'bg-red-600/15 border-red-500 text-white shadow-md'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <span className="text-xs font-bold">{BULK_SCHEMAS[key].titleFa}</span>
                            <span className="text-[10px] text-zinc-500 mt-1 font-mono">
                              {BULK_SCHEMAS[key].columns.length} ستون استاندارد
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* File Upload Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-700 hover:border-red-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-zinc-950/40 hover:bg-zinc-950/80 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-zinc-800 group-hover:bg-red-600/20 group-hover:text-red-400 border border-zinc-700 flex items-center justify-center text-zinc-400 transition mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition">
                      انتخاب فایل اکسل یا CSV از حافظه دستگاه
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                      فرمت‌های مورد پشتیبانی: <strong className="text-zinc-200 font-mono">.xlsx, .xls, .csv</strong>
                    </p>
                    <span className="text-[11px] text-zinc-500 mt-2">
                      برای لمس روی گوشی یا کلیک روی کامپیوتر
                    </span>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* Fast template download button right below file picker */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Info className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>هنوز فایل آماده ندارید؟ فایل الگوی خام استاندارد را دانلود کنید:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => generateBulkTemplate(entityType, 'xlsx')}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium flex items-center gap-1 transition"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>اکسل (XLSX)</span>
                      </button>
                      <button
                        onClick={() => generateBulkTemplate(entityType, 'csv')}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium flex items-center gap-1 transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: SHEET SELECTION (If workbook has multiple sheets) */}
              {importStep === 'sheet' && (
                <div className="flex flex-col gap-4">
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300">
                    فایل <strong className="text-white font-mono">{selectedFile?.name}</strong> دارای چند شیت مختلف است. لطفاً شیت حاوی اطلاعات {BULK_SCHEMAS[entityType].titleFa} را انتخاب کنید:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {sheetNames.map((name) => (
                      <button
                        key={name}
                        onClick={() => handleSelectSheet(name)}
                        className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-red-500 text-right transition flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white group-hover:text-red-400 transition">{name}</span>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-white" />
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-start mt-2">
                    <button
                      onClick={() => setImportStep('file')}
                      className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition"
                    >
                      بازگشت و انتخاب فایل دیگر
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: COLUMN MAPPING */}
              {importStep === 'mapping' && (
                <div className="flex flex-col gap-4">
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">تطبیق ستون‌های فایل با فیلدهای برنامه</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        ستون‌های تشخیص داده شده از فایل <strong className="text-white font-mono">{selectedFile?.name}</strong> ({rawRows.length} ردیف داده)
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-red-600/20 text-red-400 font-bold border border-red-500/30">
                      دسته‌بندی: {BULK_SCHEMAS[entityType].titleFa}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                    {rawHeaders.map((header, idx) => {
                      const currentMappedKey = columnMapping[String(idx)] || '';
                      const isMapped = Boolean(currentMappedKey);
                      const mappedColDef = BULK_SCHEMAS[entityType].columns.find(c => c.key === currentMappedKey);

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition ${
                            isMapped ? 'bg-zinc-950/80 border-emerald-900/50' : 'bg-zinc-950/40 border-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-mono">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-white font-mono">{header || `ستون ${idx + 1}`}</span>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-[11px] text-zinc-500 hidden sm:inline">متصل به فیلد:</span>
                            <select
                              value={currentMappedKey}
                              onChange={(e) => {
                                const newKey = e.target.value;
                                setColumnMapping(prev => ({
                                  ...prev,
                                  [String(idx)]: newKey
                                }));
                              }}
                              className="w-full sm:w-64 bg-zinc-900 border border-zinc-700 text-xs rounded-xl px-2.5 py-1.5 text-white focus:border-red-500 focus:outline-none"
                            >
                              <option value="">-- نادیده‌گرفتن این ستون --</option>
                              {BULK_SCHEMAS[entityType].columns.map(col => (
                                <option key={col.key} value={col.key}>
                                  {col.labelFa} {col.required ? '(الزامی)' : ''} ({col.key})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                    <button
                      onClick={() => setImportStep('file')}
                      className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition"
                    >
                      بازگشت
                    </button>

                    <button
                      onClick={handleRunValidation}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md shadow-red-950 transition flex items-center gap-2 active:scale-95"
                    >
                      <span>بررسی و اعتبارسنجی اطلاعات</span>
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: PREVIEW & ERROR REPORT */}
              {importStep === 'preview' && validationSummary && (
                <div className="flex flex-col gap-4">
                  {/* KPI Status Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-center">
                      <span className="text-[11px] text-zinc-400 block">کل ردیف‌ها</span>
                      <span className="text-base font-bold text-white mt-0.5 block font-mono">
                        {validationSummary.totalRows}
                      </span>
                    </div>

                    <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-900/60 text-center">
                      <span className="text-[11px] text-emerald-400 block">رکوردهای معتبر</span>
                      <span className="text-base font-bold text-emerald-300 mt-0.5 block font-mono">
                        {validationSummary.validCount}
                      </span>
                    </div>

                    <div className="bg-red-950/40 p-3 rounded-xl border border-red-900/60 text-center">
                      <span className="text-[11px] text-red-400 block">دارای خطای ساختاری</span>
                      <span className="text-base font-bold text-red-300 mt-0.5 block font-mono">
                        {validationSummary.invalidCount}
                      </span>
                    </div>

                    <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-900/60 text-center">
                      <span className="text-[11px] text-amber-400 block">احتمال تکراری یا ارجاع</span>
                      <span className="text-base font-bold text-amber-300 mt-0.5 block font-mono">
                        {validationSummary.duplicateCount + validationSummary.missingDependencyCount}
                      </span>
                    </div>
                  </div>

                  {/* Conflict handling options if duplicates detected */}
                  {validationSummary.duplicateCount > 0 && (
                    <div className="p-3.5 bg-amber-950/30 border border-amber-900/50 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>تعداد {validationSummary.duplicateCount} رکورد با عناوین مشابه در بانک اطلاعاتی شناسایی شد:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                          <input
                            type="radio"
                            name="duplicateStrategy"
                            checked={duplicateStrategy === 'skip'}
                            onChange={() => setDuplicateStrategy('skip')}
                            className="accent-red-600"
                          />
                          <span>رد موارد تکراری (Skip)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                          <input
                            type="radio"
                            name="duplicateStrategy"
                            checked={duplicateStrategy === 'update'}
                            onChange={() => setDuplicateStrategy('update')}
                            className="accent-red-600"
                          />
                          <span>به‌روزرسانی رکورد موجود</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Errors Breakdown (if any) */}
                  {(validationSummary.errors.length > 0 || validationSummary.missingDependencies.length > 0) && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          <span>فهرست خطاهای داده‌ها قبل از ثبت:</span>
                        </span>
                        <button
                          onClick={() => generateErrorReportCsv(
                            entityType,
                            validationSummary.errors,
                            validationSummary.duplicates,
                            validationSummary.missingDependencies
                          )}
                          className="text-[11px] text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>دانلود گزارش خطاها (CSV)</span>
                        </button>
                      </div>

                      <div className="max-h-48 overflow-y-auto rounded-xl border border-red-950 bg-zinc-950 divide-y divide-zinc-900 text-xs">
                        {validationSummary.errors.map((err, i) => (
                          <div key={i} className="p-2.5 flex items-start justify-between gap-3 text-red-300">
                            <span className="font-mono text-zinc-500 shrink-0">ردیف {err.rowIndex}</span>
                            <span className="flex-1">{err.messageFa}</span>
                            <span className="font-mono text-zinc-500 text-[10px] shrink-0">{err.columnLabel}</span>
                          </div>
                        ))}
                        {validationSummary.missingDependencies.map((dep, i) => (
                          <div key={`dep-${i}`} className="p-2.5 flex items-start justify-between gap-3 text-amber-300">
                            <span className="font-mono text-zinc-500 shrink-0">ردیف {dep.rowIndex}</span>
                            <span className="flex-1">{dep.messageFa}</span>
                            <span className="text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-900/60 shrink-0">
                              وابستگی ناموجود
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Data Preview Table */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-zinc-300">پیش‌نمایش رکوردهای معتبر برای ذخیره‌سازی:</span>
                    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 max-h-56">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-zinc-900 text-zinc-400 sticky top-0 border-b border-zinc-800">
                          <tr>
                            <th className="p-2.5">ردیف</th>
                            {BULK_SCHEMAS[entityType].columns.slice(0, 5).map(col => (
                              <th key={col.key} className="p-2.5 font-bold whitespace-nowrap">{col.labelFa}</th>
                            ))}
                            <th className="p-2.5">وضعیت</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900 text-zinc-200">
                          {validationSummary.parsedValidRows.slice(0, 20).map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-900/50">
                              <td className="p-2.5 font-mono text-zinc-500">{idx + 1}</td>
                              {BULK_SCHEMAS[entityType].columns.slice(0, 5).map(col => (
                                <td key={col.key} className="p-2.5 whitespace-nowrap truncate max-w-[150px]">
                                  {String(row[col.key] || '—')}
                                </td>
                              ))}
                              <td className="p-2.5">
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/60 font-semibold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>معتبر</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {validationSummary.parsedValidRows.length > 20 && (
                      <span className="text-[11px] text-zinc-500 text-center block">
                        نمایش ۲۰ رکورد اول از مجموع {validationSummary.parsedValidRows.length} رکورد معتبر
                      </span>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                    <button
                      onClick={() => setImportStep('mapping')}
                      className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium hover:bg-zinc-700 transition"
                    >
                      تغییر تطبیق ستون‌ها
                    </button>

                    <button
                      onClick={handleConfirmAndCommit}
                      disabled={validationSummary.validCount === 0 || isProcessing}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950 transition flex items-center gap-2 active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تأیید و ذخیره {validationSummary.validCount} رکورد در پایگاه داده</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: COMMITTING PROGRESS */}
              {importStep === 'committing' && (
                <div className="flex flex-col items-center justify-center p-8 gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-red-500">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  <h3 className="text-sm font-bold text-white">در حال ثبت امن رکوردهای معتبر در بانک اطلاعاتی...</h3>
                  <p className="text-xs text-zinc-400 max-w-sm">{commitStatusText}</p>

                  <div className="w-full max-w-md bg-zinc-800 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-red-600 h-full transition-all duration-300"
                      style={{ width: `${commitProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-zinc-400">{commitProgress}%</span>
                </div>
              )}

              {/* STEP 6: DONE CONFIRMATION */}
              {importStep === 'done' && commitResult && (
                <div className="flex flex-col items-center justify-center p-6 gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white">ثبت گروهی اطلاعات با موفقیت انجام شد</h3>
                  <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
                    رکوردهای جدید به بانک اطلاعاتی AutoPin Pro افزوده شدند و تغییرات در پایگاه داده محلی و سرور ابری همگام‌سازی گردید.
                  </p>

                  <div className="grid grid-cols-3 gap-3 w-full max-w-sm my-2">
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                      <span className="text-[11px] text-zinc-500 block">افزوده شده</span>
                      <strong className="text-sm font-bold text-emerald-400 font-mono">{commitResult.added}</strong>
                    </div>
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                      <span className="text-[11px] text-zinc-500 block">به‌روزرسانی</span>
                      <strong className="text-sm font-bold text-amber-400 font-mono">{commitResult.updated}</strong>
                    </div>
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                      <span className="text-[11px] text-zinc-500 block">رد شده / خطا</span>
                      <strong className="text-sm font-bold text-zinc-400 font-mono">{commitResult.failed}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={resetImportFlow}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition"
                    >
                      ورود فایل دیگر
                    </button>
                    <button
                      onClick={onClose}
                      className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition"
                    >
                      بستن پنجره
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: EXPORT DATABASE                                    */}
          {/* ========================================================= */}
          {activeTab === 'export' && (
            <div className="flex flex-col gap-4">
              {exportSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{exportSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">دسته‌بندی اطلاعات جهت دریافت خروجی:</label>
                  <select
                    value={exportEntityType}
                    onChange={(e) => setExportEntityType(e.target.value as BulkEntityType)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    {(Object.keys(BULK_SCHEMAS) as BulkEntityType[]).map(key => (
                      <option key={key} value={key}>{BULK_SCHEMAS[key].titleFa}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">فرمت فایل خروجی:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExportFormat('xlsx')}
                      className={`p-2 rounded-xl border text-center font-bold transition ${
                        exportFormat === 'xlsx' ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Microsoft Excel (.xlsx)
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportFormat('csv')}
                      className={`p-2 rounded-xl border text-center font-bold transition ${
                        exportFormat === 'csv' ? 'bg-sky-950/80 border-sky-600 text-sky-300' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      فرمت متنی CSV (.csv)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">فیلتر بر اساس خودرو:</label>
                  <select
                    value={exportVehicleId}
                    onChange={(e) => setExportVehicleId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="all">همه خودروها (بدون فیلتر)</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <input
                      type="checkbox"
                      checked={exportPublishedOnly}
                      onChange={(e) => setExportPublishedOnly(e.target.checked)}
                      className="accent-red-600"
                    />
                    <span className="text-zinc-300">فقط رکوردهای منتشرشده و تأییدشده (بدون پیش‌نویس)</span>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl mt-2 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">دریافت خروجی ساختاریافته</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    خروجی شامل تمام شناسه‌ها و پیوندهای کلیدی برای پشتیبان‌گیری یا انتقال به سیستم‌های دیگر است.
                  </p>
                </div>

                <button
                  onClick={handleTriggerExport}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md shadow-red-950 transition flex items-center gap-2 active:scale-95 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود فایل خروجی</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: STANDARD TEMPLATES                                 */}
          {/* ========================================================= */}
          {activeTab === 'templates' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-zinc-400 leading-relaxed">
                برای جلوگیری از خطاهای تطبیق، می‌توانید فایل‌های الگوی آماده هر بخش را دانلود کرده و ردیف‌های فنی خود را در آنها ثبت کنید.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.keys(BULK_SCHEMAS) as BulkEntityType[]).map((key) => {
                  const schema = BULK_SCHEMAS[key];
                  return (
                    <div
                      key={key}
                      className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-white">{schema.titleFa}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                          {schema.columns.length} ستون استانداردی
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => generateBulkTemplate(key, 'xlsx')}
                          className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 hover:border-zinc-700 transition"
                          title="دانلود فایل Excel"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generateBulkTemplate(key, 'csv')}
                          className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-sky-400 border border-zinc-800 hover:border-zinc-700 transition"
                          title="دانلود فایل CSV"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

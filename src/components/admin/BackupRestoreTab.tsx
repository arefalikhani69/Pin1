import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Upload,
  Archive,
  Database,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  RefreshCw,
  HardDrive,
  FileText,
  Layers,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Car,
  Cpu,
  Zap,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Lock,
  ChevronDown,
  Info
} from 'lucide-react';
import {
  backupService,
  BackupType,
  BackupIntegrityCheckResult,
  LastBackupInfo,
  LocalSnapshotItem,
  BackupManifest
} from '../../services/backupService';
import { useAuth } from '../../context/AuthContext';

interface BackupRestoreTabProps {
  onRefreshData?: () => void;
}

export const BackupRestoreTab: React.FC<BackupRestoreTabProps> = ({ onRefreshData }) => {
  const { currentUser, isAdmin, isOnlineDbConnected } = useAuth();

  // State: Backup Creation
  const [selectedBackupType, setSelectedBackupType] = useState<BackupType>('full');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState('');
  const [creationSuccessMsg, setCreationSuccessMsg] = useState<string | null>(null);
  const [lastBackupInfo, setLastBackupInfo] = useState<LastBackupInfo | null>(null);

  // State: Restore Flow
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<BackupIntegrityCheckResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');
  const [confirmOverwriteInput, setConfirmOverwriteInput] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [restoreStatusText, setRestoreStatusText] = useState('');
  const [restoreSuccessSummary, setRestoreSuccessSummary] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Local Safety Snapshots
  const [snapshots, setSnapshots] = useState<LocalSnapshotItem[]>([]);
  const [activeSnapshotDetail, setActiveSnapshotDetail] = useState<LocalSnapshotItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = () => {
    setLastBackupInfo(backupService.getLastBackupInfo());
    setSnapshots(backupService.getLocalSnapshots());
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '۰ بایت';
    if (bytes < 1024) return `${bytes} بایت`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} کیلوبایت`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} مگابایت`;
  };

  // Handle Create Backup
  const handleCreateBackup = async () => {
    if (isGenerating) return;

    try {
      setIsGenerating(true);
      setCreationSuccessMsg(null);
      setGenerationProgress(5);
      setGenerationStage('در حال آغاز فرآیند پشتیبان‌گیری...');

      if (selectedBackupType === 'full' || selectedBackupType === 'images_only') {
        const result = await backupService.generateZipBackup(
          selectedBackupType,
          currentUser?.email || undefined,
          (pct, stage) => {
            setGenerationProgress(pct);
            setGenerationStage(stage);
          }
        );

        // Trigger browser download
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setCreationSuccessMsg(
          `نسخه پشتیبان کامل با عنوان «${result.fileName}» (${formatFileSize(result.sizeBytes)}) با موفقیت ایجاد و دانلود شد.`
        );
      } else {
        // Data Only JSON
        setGenerationProgress(50);
        setGenerationStage('در حال تولید فایل استاندارد JSON داده‌ها...');
        const result = backupService.generateJsonBackup('data_only', currentUser?.email || undefined);

        const blob = new Blob([result.jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setGenerationProgress(100);
        setGenerationStage('تکمیل شد.');
        setCreationSuccessMsg(
          `نسخه پشتیبان داده‌های متنی با عنوان «${result.fileName}» (${formatFileSize(result.sizeBytes)}) با موفقیت دانلود شد.`
        );
      }

      loadMetadata();
    } catch (err: unknown) {
      console.error('Backup error:', err);
      alert(`خطا در تهیه نسخه پشتیبان: ${err instanceof Error ? err.message : 'خطای ناشناخته'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Backup File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSelectedFile(file);
      setIsInspecting(true);
      setRestoreError(null);
      setRestoreSuccessSummary(null);
      setConfirmOverwriteInput('');

      const result = await backupService.inspectAndValidateBackupFile(file);
      setInspectionResult(result);
    } catch (err: unknown) {
      setRestoreError(`خطا در بازخوانی فایل: ${err instanceof Error ? err.message : 'فرمت نامعتبر'}`);
    } finally {
      setIsInspecting(false);
    }
  };

  // Execute Restore
  const handleExecuteRestore = async () => {
    if (!inspectionResult || !inspectionResult.isValid) return;

    if (restoreMode === 'overwrite') {
      if (confirmOverwriteInput.trim() !== 'تایید بازیابی') {
        alert('برای جایگزینی کامل، لطفاً عبارت «تایید بازیابی» را دقیقاً در کادر مشخص‌شده تایپ نمایید.');
        return;
      }
    }

    try {
      setIsRestoring(true);
      setRestoreProgress(10);
      setRestoreStatusText('در حال آماده‌سازی و اعتبارسنجی نهایی...');

      const result = await backupService.executeRestore(
        inspectionResult.payload,
        restoreMode,
        isAdmin,
        isOnlineDbConnected,
        (pct, text) => {
          setRestoreProgress(pct);
          setRestoreStatusText(text);
        }
      );

      setRestoreSuccessSummary(result.summary);
      onRefreshData?.();
      loadMetadata();

      // Reset file picker state
      setSelectedFile(null);
      setInspectionResult(null);
      setConfirmOverwriteInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      setRestoreError(`خطا در هنگام بازیابی اطلاعات: ${err instanceof Error ? err.message : 'خطای ناشناخته'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  // Restore directly from a local safety snapshot
  const handleRestoreFromLocalSnapshot = async (snap: LocalSnapshotItem) => {
    if (!confirm(`آیا مطمئن هستید که می‌خواهید اطلاعات را به نسخه اضطراری ثبت‌شده در «${snap.formattedDate}» بازگردانید؟`)) {
      return;
    }

    try {
      setIsRestoring(true);
      setRestoreProgress(20);
      setRestoreStatusText('در حال خواندن اطلاعات نسخه اضطراری محلی...');

      const payload = JSON.parse(snap.jsonPayload);
      const result = await backupService.executeRestore(
        payload,
        'merge',
        isAdmin,
        isOnlineDbConnected,
        (pct, text) => {
          setRestoreProgress(pct);
          setRestoreStatusText(text);
        }
      );

      setRestoreSuccessSummary(`بازیابی از نسخه اضطراری با موفقیت انجام شد: ${result.summary}`);
      onRefreshData?.();
    } catch (err: unknown) {
      alert(`خطا در بازیابی نسخه اضطراری: ${err instanceof Error ? err.message : 'خطای ناشناخته'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 text-right">
      {/* Top Banner / Security Reminder */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              سامانه پشتیبان‌گیری و بازیابی تخصصی AutoPin Pro
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              تهیه خروجی فشرده ZIP شامل کلیه خودروها، ECU، سوکت‌ها، پایه‌ها، جعبه‌فیوزها، نقشه‌ها و تصاویر واقعی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono">
            نسخه ساختار: {backupService.getLastBackupInfo()?.recordCounts ? '2.1.0' : '2.1.0'}
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>حفاظت از کلیدها و گذرواژه‌ها</span>
          </span>
        </div>
      </div>

      {/* SECTION 1: CREATE BACKUP */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-white">۱. تهیه و دانلود نسخه پشتیبان</h3>
          </div>
          <span className="text-[11px] text-zinc-400">
            تولید پکیج اختصاصی سازگار با اندروید و رایانه
          </span>
        </div>

        {/* Backup Type Selector */}
        <div>
          <label className="text-xs font-bold text-zinc-300 block mb-2">
            قالب و محتوای نسخه پشتیبان را انتخاب کنید:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Full Package */}
            <button
              type="button"
              onClick={() => setSelectedBackupType('full')}
              className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between ${
                selectedBackupType === 'full'
                  ? 'bg-red-600/15 border-red-500 text-white shadow-md'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Archive className="w-4 h-4 text-red-400" />
                  <span>پکیج کامل جامع (ZIP)</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                  پیشنهادی
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                شامل کلیه جداول داده‌ها، ساختار سوکت‌ها و پایه‌ها، جعبه‌فیوزها به‌همراه فایل واقعی کلیه تصاویر و نقشه‌ها
              </p>
            </button>

            {/* Data Only */}
            <button
              type="button"
              onClick={() => setSelectedBackupType('data_only')}
              className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between ${
                selectedBackupType === 'data_only'
                  ? 'bg-red-600/15 border-red-500 text-white shadow-md'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>داده‌های فنی سبک (JSON)</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-700">
                  حجم کم
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                تنها اطلاعات متنی و کدهای سیم‌کشی بدون بسته‌بندی فایل‌های تصویری، بسیار سریع جهت انتقال متنی
              </p>
            </button>

            {/* Images Only */}
            <button
              type="button"
              onClick={() => setSelectedBackupType('images_only')}
              className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between ${
                selectedBackupType === 'images_only'
                  ? 'bg-red-600/15 border-red-500 text-white shadow-md'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>آرشیو تصاویر و نقشه‌ها (ZIP)</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                پشتیبان‌گیری تفکیک‌شده از کلیه تصاویر واقعی قطعات، درپوش‌ها و دیاگرام‌های سیم‌کشی
              </p>
            </button>
          </div>
        </div>

        {/* Progress Bar (if generating) */}
        {isGenerating && (
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-semibold">{generationStage}</span>
              <span className="text-red-400 font-mono font-bold">{generationProgress}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success Banner */}
        {creationSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{creationSuccessMsg}</span>
          </div>
        )}

        {/* Action Button & Last Backup Note */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
            {lastBackupInfo ? (
              <span>
                آخرین پشتیبان‌گیری: <strong className="text-white">{lastBackupInfo.formattedDate}</strong> (
                {formatFileSize(lastBackupInfo.fileSizeBytes)})
              </span>
            ) : (
              <span>تاکنون نسخه‌ای ثبت نشده است.</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCreateBackup}
            disabled={isGenerating}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-950 transition flex items-center justify-center gap-2 active:scale-95"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>در حال ایجاد و بسته‌بندی فایل...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>شروع تهیه و دریافت نسخه پشتیبان</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 2: RESTORE DATA */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-white">۲. بازیابی اطلاعات از فایل پشتیبان</h3>
          </div>
          <span className="text-[11px] text-zinc-400">پشتیبانی از فایل‌های ZIP و JSON با اعتبارسنجی پیش از اعمال</span>
        </div>

        {/* File Picker Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-zinc-700 hover:border-emerald-500 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-zinc-950/40 hover:bg-zinc-950/80 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 group-hover:bg-emerald-600/20 group-hover:text-emerald-400 border border-zinc-700 flex items-center justify-center text-zinc-400 transition mb-2.5">
            <Upload className="w-6 h-6" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition">
            {selectedFile ? selectedFile.name : 'انتخاب فایل پشتیبان از حافظه گوشی یا کامپیوتر'}
          </h4>
          <p className="text-[11px] text-zinc-400 mt-1 max-w-sm">
            فرمت‌های مورد پشتیبانی: <strong className="text-zinc-200 font-mono">.zip, .json</strong>
          </p>
          <span className="text-[10px] text-zinc-500 mt-1.5">
            {selectedFile ? `حجم فایل: ${formatFileSize(selectedFile.size)}` : 'برای انتخاب لمس یا کلیک کنید'}
          </span>

          <input
            ref={fileInputRef}
            type="file"
            accept=".zip, .json, application/zip, application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Inspection In Progress */}
        {isInspecting && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center gap-2 text-xs text-zinc-300">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>در حال بررسی ساختار، مانیفست و اعتبارسنجی فایل پشتیبان...</span>
          </div>
        )}

        {/* Inspection Result Preview */}
        {inspectionResult && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-4 text-xs">
            {/* Header Status */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">نتیجه بررسی محتوای فایل پشتیبان</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    تاریخ ایجاد: {new Date(inspectionResult.manifest.createdAt).toLocaleDateString('fa-IR')} · نسخه ساختار:{' '}
                    {inspectionResult.manifest.schemaVersion}
                  </p>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  inspectionResult.isValid
                    ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-400'
                    : 'bg-red-950/80 border border-red-800 text-red-400'
                }`}
              >
                {inspectionResult.isValid ? 'ساختار معتبر و قابل بازیابی' : 'فایل دارای خطای ساختاری'}
              </span>
            </div>

            {/* Counts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">خودروها</span>
                <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                  {inspectionResult.manifest.recordCounts?.vehicles ?? 0}
                </span>
                <span className="text-[9px] text-emerald-400 block mt-0.5">
                  ({inspectionResult.conflicts.newVehicles} جدید · {inspectionResult.conflicts.existingVehicles} مشابه)
                </span>
              </div>

              <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">ECUها</span>
                <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                  {inspectionResult.manifest.recordCounts?.ecus ?? 0}
                </span>
                <span className="text-[9px] text-emerald-400 block mt-0.5">
                  ({inspectionResult.conflicts.newEcus} جدید)
                </span>
              </div>

              <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">سوکت‌ها و پایه‌ها</span>
                <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                  {inspectionResult.manifest.recordCounts?.connectors ?? 0} سوکت
                </span>
                <span className="text-[9px] text-zinc-400 block mt-0.5 font-mono">
                  {inspectionResult.manifest.recordCounts?.pins ?? 0} پین
                </span>
              </div>

              <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">جعبه‌فیوز و رله‌ها</span>
                <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                  {inspectionResult.manifest.recordCounts?.fuseBoxes ?? 0} جعبه‌فیوز
                </span>
                <span className="text-[9px] text-zinc-400 block mt-0.5 font-mono">
                  {inspectionResult.manifest.recordCounts?.fuses ?? 0} فیوز · {inspectionResult.manifest.recordCounts?.relays ?? 0} رله
                </span>
              </div>
            </div>

            {/* Warnings or Errors */}
            {inspectionResult.warnings.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/60 text-amber-300 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>هشدارهای ساختاری:</span>
                </div>
                {inspectionResult.warnings.map((w, idx) => (
                  <span key={idx} className="text-[11px] text-amber-200">
                    · {w}
                  </span>
                ))}
              </div>
            )}

            {inspectionResult.errors.length > 0 && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span>خطاهای مانع از بازیابی:</span>
                </div>
                {inspectionResult.errors.map((e, idx) => (
                  <span key={idx} className="text-[11px] text-red-200">
                    · {e}
                  </span>
                ))}
              </div>
            )}

            {/* Mode Selection */}
            {inspectionResult.isValid && (
              <div className="flex flex-col gap-3 pt-2 border-t border-zinc-800">
                <label className="text-xs font-bold text-zinc-200">روش اعمال اطلاعات پشتیبان را انتخاب فرمایید:</label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition ${
                      restoreMode === 'merge' ? 'bg-zinc-900 border-emerald-600 text-white' : 'bg-zinc-900/40 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="restoreMode"
                      value="merge"
                      checked={restoreMode === 'merge'}
                      onChange={() => setRestoreMode('merge')}
                      className="mt-1 accent-emerald-500"
                    />
                    <div>
                      <strong className="block text-xs text-white">۱. ادغام هوشمند و به‌روزرسانی (Smart Merge)</strong>
                      <span className="text-[11px] text-zinc-400 block mt-0.5 leading-relaxed">
                        رکوردهای جدید اضافه می‌شوند و رکوردهای با شناسه یکسان به‌روزرسانی می‌شوند. داده‌های فعلی شما که در پشتیبان نیستند حذف نخواهند شد.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition ${
                      restoreMode === 'overwrite' ? 'bg-red-950/30 border-red-600 text-white' : 'bg-zinc-900/40 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="restoreMode"
                      value="overwrite"
                      checked={restoreMode === 'overwrite'}
                      onChange={() => setRestoreMode('overwrite')}
                      className="mt-1 accent-red-600"
                    />
                    <div>
                      <strong className="block text-xs text-red-300">۲. جایگزینی کامل اطلاعات (Full Overwrite)</strong>
                      <span className="text-[11px] text-zinc-400 block mt-0.5 leading-relaxed">
                        داده‌های پشتیبان جایگزین اطلاعات فعلی می‌شوند. یک نسخه پشتیبان اضطراری به صورت خودکار پیش از این عملیات تهیه می‌شود.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Overwrite Confirmation Input */}
                {restoreMode === 'overwrite' && (
                  <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/80 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-red-400 font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>هشدار امنیتی جایگزینی کامل:</span>
                    </div>
                    <p className="text-[11px] text-red-200">
                      جهت اطمینان از عدم وقوع اشتباه، لطفاً عبارت <strong className="text-white underline">«تایید بازیابی»</strong> را در کادر زیر وارد کنید:
                    </p>
                    <input
                      type="text"
                      value={confirmOverwriteInput}
                      onChange={(e) => setConfirmOverwriteInput(e.target.value)}
                      placeholder="تایید بازیابی"
                      className="bg-zinc-900 border border-red-800 rounded-xl px-3 py-2 text-white text-xs text-center font-bold tracking-wider"
                    />
                  </div>
                )}

                {/* Progress bar during restore */}
                {isRestoring && (
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 font-semibold">{restoreStatusText}</span>
                      <span className="text-emerald-400 font-mono font-bold">{restoreProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-sky-500 transition-all duration-300"
                        style={{ width: `${restoreProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Restore Trigger Button */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setInspectionResult(null);
                    }}
                    className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs hover:bg-zinc-700 transition"
                  >
                    انصراف و انتخاب فایل دیگر
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteRestore}
                    disabled={isRestoring || (restoreMode === 'overwrite' && confirmOverwriteInput.trim() !== 'تایید بازیابی')}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950 flex items-center gap-2 transition active:scale-95"
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>در حال انجام بازیابی...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تایید و شروع بازیابی اطلاعات</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Restore Error Banner */}
        {restoreError && (
          <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{restoreError}</span>
          </div>
        )}

        {/* Restore Success Banner */}
        {restoreSuccessSummary && (
          <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{restoreSuccessSummary}</span>
          </div>
        )}
      </div>

      {/* SECTION 3: EMERGENCY LOCAL SNAPSHOTS & RECOVERY */}
      {snapshots.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-white">۳. نسخه‌های اضطراری خودکار (Auto Snapshots)</h3>
            </div>
            <span className="text-[11px] text-zinc-400">
              نسخه‌هایی که قبل از عملیات حساس در حافظه مرورگر ثبت شده‌اند
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            در صورت بروز اشتباه یا نیاز به بازگشت، می‌توانید با فشردن دکمه بازگردانی، اطلاعات را فوراً به یکی از نسخه‌های ثبت‌شده پیشین بازیابی نمایید:
          </p>

          <div className="flex flex-col gap-2 pt-1">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{snap.description}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 font-mono border border-zinc-800">
                      {snap.formattedDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1 font-mono">
                    <span>{snap.recordCounts.vehicles} خودرو</span>
                    <span>·</span>
                    <span>{snap.recordCounts.connectors} سوکت</span>
                    <span>·</span>
                    <span>{snap.recordCounts.fuseBoxes} جعبه‌فیوز</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRestoreFromLocalSnapshot(snap)}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-amber-950 text-amber-400 hover:text-amber-300 border border-zinc-700 hover:border-amber-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>بازگردانی به این نسخه</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

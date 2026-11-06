import React, { useState, useMemo } from 'react';
import {
  History,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  Calendar,
  User,
  GitCompare,
  Layers,
  FileText,
  Clock,
  ShieldCheck,
  Cpu,
  Zap,
  Cable
} from 'lucide-react';
import { TechnicalDataVersion, VersionEntityType, FieldDiff } from '../types';
import { storage } from '../services/storage';
import { useAuth } from '../context/AuthContext';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: string;
  entityType: VersionEntityType;
  recordTitle?: string;
  onDataRestored?: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  recordId,
  entityType,
  recordTitle,
  onDataRestored
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  const [isConfirmingRollback, setIsConfirmingRollback] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<TechnicalDataVersion | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [compareMode, setCompareMode] = useState<'with_previous' | 'with_custom'>('with_previous');

  // Load versions from storage for this specific record
  const versions = useMemo(() => {
    if (!isOpen || !recordId) return [];
    return storage.getTechnicalVersions(recordId, entityType);
  }, [isOpen, recordId, entityType, actionMessage]);

  // Set default selection when versions load
  React.useEffect(() => {
    if (versions.length > 0) {
      if (!selectedVersionId || !versions.some(v => v.id === selectedVersionId)) {
        setSelectedVersionId(versions[0].id);
      }
      if (versions.length > 1 && (!compareVersionId || !versions.some(v => v.id === compareVersionId))) {
        setCompareVersionId(versions[1].id);
      }
    } else {
      setSelectedVersionId(null);
      setCompareVersionId(null);
    }
  }, [versions, selectedVersionId, compareVersionId]);

  if (!isOpen) return null;

  const selectedVersion = versions.find(v => v.id === selectedVersionId) || versions[0] || null;
  const customCompareVersion = versions.find(v => v.id === compareVersionId) || null;

  const entityTypeLabels: Record<VersionEntityType, { label: string; icon: React.ReactNode }> = {
    vehicle: { label: 'خودرو و موتور', icon: <Cpu className="w-4 h-4 text-red-400" /> },
    ecu: { label: 'کامپیوتر خودرو (ECU)', icon: <Cpu className="w-4 h-4 text-purple-400" /> },
    connector: { label: 'سوکت و پین‌اوت', icon: <Cable className="w-4 h-4 text-blue-400" /> },
    fusebox: { label: 'جعبه‌فیوز و رله‌ها', icon: <Zap className="w-4 h-4 text-amber-400" /> },
    fuse: { label: 'فیوز الکتریکی', icon: <Zap className="w-4 h-4 text-amber-400" /> },
    relay: { label: 'رله خودرویی', icon: <Zap className="w-4 h-4 text-amber-400" /> },
    diagram: { label: 'نقشه سیم‌کشی', icon: <Layers className="w-4 h-4 text-sky-400" /> },
    media: { label: 'تصویر و مستند فنی', icon: <Layers className="w-4 h-4 text-sky-400" /> }
  };

  const operationBadge = (op: string) => {
    switch (op) {
      case 'create':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-700/50">
            ایجاد اولیه
          </span>
        );
      case 'restore':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950/70 text-purple-400 border border-purple-700/50">
            بازیابی (Rollback)
          </span>
        );
      case 'delete':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950/70 text-red-400 border border-red-700/50">
            حذف شده
          </span>
        );
      case 'update':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/70 text-blue-400 border border-blue-700/50">
            ویرایش اطلاعات
          </span>
        );
    }
  };

  const formatJalaliDate = (timestamp: number) => {
    try {
      const d = new Date(timestamp);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(d);
    } catch {
      return new Date(timestamp).toLocaleString('fa-IR');
    }
  };

  // Diff computation for custom comparison between two chosen versions
  const customDiffs: FieldDiff[] = useMemo(() => {
    if (!selectedVersion || !customCompareVersion || compareMode !== 'with_custom') return [];
    const prev = customCompareVersion.newData || {};
    const curr = selectedVersion.newData || {};
    const allKeys = Array.from(new Set([...Object.keys(prev), ...Object.keys(curr)]));
    const result: FieldDiff[] = [];

    for (const key of allKeys) {
      if (['updatedAt', 'id', 'createdAt'].includes(key)) continue;
      const oldVal = prev[key];
      const newVal = curr[key];
      const oldStr = JSON.stringify(oldVal === undefined ? null : oldVal);
      const newStr = JSON.stringify(newVal === undefined ? null : newVal);
      if (oldStr !== newStr) {
        let oldSummary = String(oldVal ?? '—');
        let newSummary = String(newVal ?? '—');
        if (Array.isArray(oldVal) || Array.isArray(newVal)) {
          const oldLen = Array.isArray(oldVal) ? oldVal.length : 0;
          const newLen = Array.isArray(newVal) ? newVal.length : 0;
          oldSummary = `${oldLen} مورد`;
          newSummary = `${newLen} مورد`;
        }
        result.push({
          field: key,
          fieldLabelFa: key,
          oldValue: oldSummary,
          newValue: newSummary
        });
      }
    }
    return result;
  }, [selectedVersion, customCompareVersion, compareMode]);

  const activeDiffs = compareMode === 'with_custom' ? customDiffs : (selectedVersion?.diffs || []);

  const handleTriggerRollback = (ver: TechnicalDataVersion) => {
    setRollbackTarget(ver);
    setIsConfirmingRollback(true);
    setActionMessage(null);
  };

  const handleExecuteRollback = () => {
    if (!rollbackTarget) return;

    const res = storage.rollbackTechnicalVersion(rollbackTarget.id, {
      uid: currentUser?.uid,
      email: currentUser?.email || 'admin@autopin.ir'
    });

    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      setIsConfirmingRollback(false);
      setRollbackTarget(null);
      onDataRestored?.();
    } else {
      setActionMessage({ type: 'error', text: res.message });
      setIsConfirmingRollback(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto" dir="rtl">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">مدیریت نسخه‌ها و تاریخچه تغییرات فنی</h3>
                <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-full text-xs font-mono">
                  {versions.length} نسخه ثبت‌شده
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                <span className="flex items-center gap-1 text-zinc-300">
                  {entityTypeLabels[entityType]?.icon}
                  {entityTypeLabels[entityType]?.label}
                </span>
                <span>•</span>
                <span className="text-zinc-200 font-medium">{recordTitle || recordId}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Error Banner */}
        {actionMessage && (
          <div
            className={`px-5 py-3 border-b text-xs flex items-center justify-between ${
              actionMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-red-950/60 border-red-800 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="p-1 hover:bg-white/10 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Left / Versions Timeline Column */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-l border-zinc-800 bg-zinc-950/70 p-4 overflow-y-auto max-h-[350px] lg:max-h-none flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-red-400" />
                خط زمانی ویرایش‌ها
              </span>
              <span className="text-[11px] text-zinc-500">مرتب‌سازی از جدید به قدیم</span>
            </div>

            {versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 gap-2 border border-dashed border-zinc-800 rounded-2xl">
                <History className="w-8 h-8 text-zinc-600" />
                <p className="text-xs font-medium text-zinc-400">هنوز تغییری برای این رکورد ثبت نشده است.</p>
                <p className="text-[11px] text-zinc-600 max-w-xs leading-relaxed">
                  با هر بار ویرایش و ذخیره اطلاعات این بخش توسط مدیر سیستم، یک نسخه همراه با تفاوت‌ها (Diff) به صورت خودکار ثبت خواهد شد.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {versions.map((ver, idx) => {
                  const isSelected = selectedVersion?.id === ver.id;
                  const isLatest = idx === 0;

                  return (
                    <div
                      key={ver.id}
                      onClick={() => setSelectedVersionId(ver.id)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer text-right relative ${
                        isSelected
                          ? 'bg-zinc-900 border-red-500/60 shadow-lg shadow-red-950/20 ring-1 ring-red-500/30'
                          : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700">
                            نسخه {ver.versionNumber}
                          </span>
                          {isLatest && (
                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
                              نسخه فعلی
                            </span>
                          )}
                          {operationBadge(ver.operation)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{formatJalaliDate(ver.timestamp)}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                        <User className="w-3 h-3 text-zinc-500" />
                        <span>ویرایشگر: {ver.adminEmail || 'مدیر سیستم'}</span>
                      </div>

                      {ver.comment && (
                        <div className="mt-2 text-[11px] text-purple-300/90 bg-purple-950/30 border border-purple-900/40 px-2.5 py-1 rounded-xl">
                          {ver.comment}
                        </div>
                      )}

                      {ver.changedFields && ver.changedFields.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-zinc-800/80 flex flex-wrap gap-1">
                          {ver.changedFields.slice(0, 4).map((f, i) => (
                            <span key={i} className="text-[10px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                              {f}
                            </span>
                          ))}
                          {ver.changedFields.length > 4 && (
                            <span className="text-[10px] text-zinc-500">
                              +{ver.changedFields.length - 4} فیلد دیگر
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right / Diff Inspector Column */}
          <div className="lg:col-span-7 p-4 sm:p-6 overflow-y-auto flex flex-col gap-5 bg-zinc-950">
            {selectedVersion ? (
              <>
                {/* Header of Inspector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">
                        بررسی جزئیات نسخه {selectedVersion.versionNumber}
                      </span>
                      {operationBadge(selectedVersion.operation)}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      ثبت‌شده در {formatJalaliDate(selectedVersion.timestamp)} توسط{' '}
                      <span className="text-zinc-300 font-medium">{selectedVersion.adminEmail || 'مدیر'}</span>
                    </p>
                  </div>

                  {/* Rollback Trigger Button */}
                  {isAdmin && (
                    <button
                      onClick={() => handleTriggerRollback(selectedVersion)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-950/40 active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>بازیابی این نسخه (Rollback)</span>
                    </button>
                  )}
                </div>

                {/* Compare Mode Selector */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/70">
                  <div className="flex items-center gap-2">
                    <GitCompare className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold text-zinc-300">نحوه مقایسه تفاوت‌ها (Diff):</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCompareMode('with_previous')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        compareMode === 'with_previous'
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      مقایسه با وضعیت قبل از این ویرایش
                    </button>

                    {versions.length > 1 && (
                      <button
                        onClick={() => setCompareMode('with_custom')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          compareMode === 'with_custom'
                            ? 'bg-red-600 text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        مقایسه دو نسخه دلخواه
                      </button>
                    )}
                  </div>
                </div>

                {/* Custom Comparison Dropdowns */}
                {compareMode === 'with_custom' && versions.length > 1 && (
                  <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-zinc-400">مقایسه نسخه شماره</span>
                    <select
                      value={selectedVersionId || ''}
                      onChange={e => setSelectedVersionId(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-red-500"
                    >
                      {versions.map(v => (
                        <option key={v.id} value={v.id}>
                          نسخه {v.versionNumber} ({new Date(v.timestamp).toLocaleDateString('fa-IR')})
                        </option>
                      ))}
                    </select>
                    <span className="text-zinc-400">با نسخه شماره</span>
                    <select
                      value={compareVersionId || ''}
                      onChange={e => setCompareVersionId(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-red-500"
                    >
                      {versions.map(v => (
                        <option key={v.id} value={v.id}>
                          نسخه {v.versionNumber} ({new Date(v.timestamp).toLocaleDateString('fa-IR')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Diffs Side-by-Side Display */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-zinc-400" />
                      تفاوت مقادیر ثبت‌شده
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px]">
                        {activeDiffs.length} فیلد تغییریافته
                      </span>
                    </h4>
                  </div>

                  {activeDiffs.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center text-zinc-400 text-xs">
                      {selectedVersion.operation === 'create'
                        ? 'این نسخه مربوط به ثبت و ایجاد اولیه رکورد در سامانه است.'
                        : 'هیچ تغییری در فیلدهای اصلی یافت نشد.'}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {activeDiffs.map((diff, index) => (
                        <div
                          key={index}
                          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 overflow-hidden"
                        >
                          <div className="text-xs font-bold text-zinc-300 mb-2.5 flex items-center justify-between">
                            <span className="text-red-400">{diff.fieldLabelFa || diff.field}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{diff.field}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {/* Old Value */}
                            <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-3">
                              <span className="text-[11px] font-semibold text-red-400 block mb-1">
                                مقدار قبلی:
                              </span>
                              <div className="text-zinc-300 font-mono text-[11px] break-all leading-relaxed whitespace-pre-wrap">
                                {typeof diff.oldValue === 'object'
                                  ? JSON.stringify(diff.oldValue, null, 2)
                                  : String(diff.oldValue ?? '—')}
                              </div>
                            </div>

                            {/* New Value */}
                            <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3">
                              <span className="text-[11px] font-semibold text-emerald-400 block mb-1">
                                مقدار جدید:
                              </span>
                              <div className="text-zinc-200 font-mono text-[11px] break-all leading-relaxed whitespace-pre-wrap">
                                {typeof diff.newValue === 'object'
                                  ? JSON.stringify(diff.newValue, null, 2)
                                  : String(diff.newValue ?? '—')}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Full Snapshot Data Inspector (Collapsible) */}
                <details className="group bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4">
                  <summary className="text-xs font-bold text-zinc-400 cursor-pointer flex items-center justify-between select-none">
                    <span>مشاهده کل شیء داده در این نسخه (Snapshot JSON)</span>
                    <span className="text-zinc-600 group-open:rotate-180 transition text-xs">▼</span>
                  </summary>
                  <pre className="mt-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[10px] text-zinc-400 font-mono overflow-x-auto max-h-60" dir="ltr">
                    {JSON.stringify(selectedVersion.newData, null, 2)}
                  </pre>
                </details>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 gap-3 my-auto">
                <Layers className="w-10 h-10 text-zinc-700" />
                <p className="text-sm font-medium text-zinc-400">نسخه‌ای برای نمایش انتخاب نشده است.</p>
                <p className="text-xs text-zinc-600 max-w-sm">
                  از ستون سمت راست یک نسخه را انتخاب کنید تا تفاوت‌ها و جزئیات تغییرات نمایش داده شوند.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="text-[11px] text-zinc-500">
            سیستم ثبت تاریخچه فنی AutoPin Pro • ممیزی خودکار تغییرات سوکت‌ها، ECU و جعبه‌فیوز
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium transition"
          >
            بستن
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Rollback */}
      {isConfirmingRollback && rollbackTarget && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl text-right animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500 mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white mb-2">تأییدیه بازگردانی اطلاعات فنی (Rollback)</h3>
            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              آیا از بازگردانی اطلاعات رکورد «<span className="text-white font-semibold">{rollbackTarget.entityTitle}</span>» به نسخه شماره{' '}
              <span className="font-mono text-red-400 font-bold">{rollbackTarget.versionNumber}</span> اطمینان دارید؟
            </p>

            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 text-[11px] text-zinc-400 mb-5 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>نکات امنیتی سیستم مدیریت نسخه‌ها:</span>
              </div>
              <p>• وضعیت فعلی رکورد حفظ شده و به عنوان یک نسخه جدید ثبت می‌گردد.</p>
              <p>• این عملیات بازگشت با برچسب «بازیابی (Rollback)» در تاریخچه ثبت خواهد شد.</p>
              <p>• یکپارچگی ارجاعات به خودرو و متعلقات سنجیده و حفظ می‌گردد.</p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsConfirmingRollback(false);
                  setRollbackTarget(null);
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition"
              >
                انصراف
              </button>
              <button
                onClick={handleExecuteRollback}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-950/40"
              >
                تأیید و بازگردانی نسخه
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

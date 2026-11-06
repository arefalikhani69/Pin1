import React, { useState, useMemo } from 'react';
import {
  History,
  RotateCcw,
  Search,
  Filter,
  Layers,
  Calendar,
  User,
  Cpu,
  Cable,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Trash2,
  Car,
  Image as ImageIcon
} from 'lucide-react';
import { TechnicalDataVersion, VersionEntityType, VersionOperation } from '../../types';
import { storage } from '../../services/storage';
import { VersionHistoryModal } from '../VersionHistoryModal';

interface TechnicalVersionsTabProps {
  onRefreshData?: () => void;
}

export const TechnicalVersionsTab: React.FC<TechnicalVersionsTabProps> = ({ onRefreshData }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [operationFilter, setOperationFilter] = useState<string>('all');
  const [activeModalRecord, setActiveModalRecord] = useState<{
    id: string;
    type: VersionEntityType;
    title: string;
  } | null>(null);

  // Load versions from storage
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const allVersions = useMemo(() => {
    return storage.getTechnicalVersions();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    onRefreshData?.();
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total: allVersions.length,
      ecu: allVersions.filter(v => v.entityType === 'ecu').length,
      connector: allVersions.filter(v => v.entityType === 'connector').length,
      fusebox: allVersions.filter(v => v.entityType === 'fusebox').length,
      restores: allVersions.filter(v => v.operation === 'restore').length
    };
  }, [allVersions]);

  // Filtered versions
  const filteredVersions = useMemo(() => {
    return allVersions.filter(v => {
      const matchesSearch =
        (v.entityTitle && v.entityTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.recordId && v.recordId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.adminEmail && v.adminEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.changedFields && v.changedFields.some(f => f.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesEntity = entityFilter === 'all' || v.entityType === entityFilter;
      const matchesOp = operationFilter === 'all' || v.operation === operationFilter;

      return matchesSearch && matchesEntity && matchesOp;
    });
  }, [allVersions, searchQuery, entityFilter, operationFilter]);

  const entityTypeIcons: Record<VersionEntityType, React.ReactNode> = {
    vehicle: <Car className="w-4 h-4 text-red-400" />,
    ecu: <Cpu className="w-4 h-4 text-purple-400" />,
    connector: <Cable className="w-4 h-4 text-blue-400" />,
    fusebox: <Zap className="w-4 h-4 text-amber-400" />,
    fuse: <Zap className="w-4 h-4 text-amber-400" />,
    relay: <Zap className="w-4 h-4 text-amber-400" />,
    diagram: <ImageIcon className="w-4 h-4 text-sky-400" />,
    media: <ImageIcon className="w-4 h-4 text-sky-400" />
  };

  const entityTypeLabels: Record<VersionEntityType, string> = {
    vehicle: 'خودرو و موتور',
    ecu: 'کامپیوتر خودرو (ECU)',
    connector: 'سوکت و پین‌اوت',
    fusebox: 'جعبه‌فیوز و رله‌ها',
    fuse: 'فیوز الکتریکی',
    relay: 'رله خودرویی',
    diagram: 'نقشه سیم‌کشی',
    media: 'تصویر و مستند فنی'
  };

  const operationBadge = (op: VersionOperation) => {
    switch (op) {
      case 'create':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-700/50">
            ایجاد اولیه
          </span>
        );
      case 'restore':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-950/70 text-purple-400 border border-purple-700/50">
            بازیابی (Rollback)
          </span>
        );
      case 'delete':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-950/70 text-red-400 border border-red-700/50">
            حذف رکورد
          </span>
        );
      case 'update':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/70 text-blue-400 border border-blue-700/50">
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
        minute: '2-digit'
      }).format(d);
    } catch {
      return new Date(timestamp).toLocaleString('fa-IR');
    }
  };

  return (
    <div className="flex flex-col gap-4 text-right">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">مدیریت نسخه‌ها و تاریخچه تغییرات فنی (Audit Log)</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              ثبت خودکار کلیه تغییرات ECUها، سوکت‌ها، پایه‌ها، جعبه‌فیوز و رله‌ها با امکان تفکیک تفاوت‌ها و بازیابی امن (Rollback)
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 block mb-0.5">کل نسخه‌های ثبت‌شده</span>
            <span className="text-xl font-bold font-mono text-white">{stats.total}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
            <History className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 block mb-0.5">تغییرات سوکت و پین‌اوت</span>
            <span className="text-xl font-bold font-mono text-blue-400">{stats.connector}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-950/60 border border-blue-900/40 flex items-center justify-center text-blue-400">
            <Cable className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 block mb-0.5">تغییرات جعبه‌فیوز و رله</span>
            <span className="text-xl font-bold font-mono text-amber-400">{stats.fusebox}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-900/40 flex items-center justify-center text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 block mb-0.5">تغییرات کامپیوتر (ECU)</span>
            <span className="text-xl font-bold font-mono text-purple-400">{stats.ecu}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-900/40 flex items-center justify-center text-purple-400">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-zinc-900 p-3.5 rounded-2xl border border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جست‌وجو در عنوان رکورد، فیلدهای تغییریافته، ایمیل کاربر یا شناسه..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Entity Type Filter */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">همه بخش‌های فنی</option>
            <option value="connector">سوکت و پین‌اوت</option>
            <option value="fusebox">جعبه‌فیوز و رله</option>
            <option value="ecu">کامپیوتر (ECU)</option>
          </select>

          {/* Operation Filter */}
          <select
            value={operationFilter}
            onChange={(e) => setOperationFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">همه نوع عملیات</option>
            <option value="update">ویرایش اطلاعات</option>
            <option value="restore">بازیابی (Rollback)</option>
            <option value="create">ایجاد اولیه</option>
            <option value="delete">حذف رکورد</option>
          </select>
        </div>
      </div>

      {/* Versions List */}
      {filteredVersions.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-500">
            <History className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-white">تاریخچه‌ای برای نمایش یافت نشد</h4>
          <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
            {allVersions.length === 0
              ? 'هنوز تغییری در مشخصات ECU، سوکت‌ها یا جعبه‌فیوزها ذخیره نشده است. با اولین ویرایش و ذخیره توسط مدیر، سابقه نسخه به همراه تفاوت مقادیر ثبت می‌گردد.'
              : 'رکوردی مطابق با فیلترها و کلمه جست‌وجوی شما پیدا نشد.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredVersions.map((ver) => (
            <div
              key={ver.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition shadow-xs"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                  {entityTypeIcons[ver.entityType] || <FileText className="w-4 h-4 text-zinc-400" />}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-xs text-white truncate">{ver.entityTitle}</span>
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                      نسخه {ver.versionNumber}
                    </span>
                    {operationBadge(ver.operation)}
                    <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                      {entityTypeLabels[ver.entityType] || ver.entityType}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      {formatJalaliDate(ver.timestamp)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-zinc-500" />
                      {ver.adminEmail || 'مدیر سیستم'}
                    </span>
                  </div>

                  {ver.comment && (
                    <div className="mt-1.5 text-[11px] text-purple-300/90 bg-purple-950/30 border border-purple-900/40 px-2.5 py-1 rounded-xl inline-block">
                      {ver.comment}
                    </div>
                  )}

                  {ver.changedFields && ver.changedFields.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="text-[10px] text-zinc-500 self-center">فیلدهای تغییریافته:</span>
                      {ver.changedFields.map((f, i) => (
                        <span key={i} className="text-[10px] text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 border-zinc-800/80 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => setActiveModalRecord({
                    id: ver.recordId,
                    type: ver.entityType,
                    title: ver.entityTitle
                  })}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-900/30 hover:bg-purple-900/50 border border-purple-700/50 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>بررسی تاریخچه و تفاوت‌ها (Diff)</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Individual Record Version History Modal */}
      {activeModalRecord && (
        <VersionHistoryModal
          isOpen={Boolean(activeModalRecord)}
          onClose={() => setActiveModalRecord(null)}
          recordId={activeModalRecord.id}
          entityType={activeModalRecord.type}
          recordTitle={activeModalRecord.title}
          onDataRestored={handleRefresh}
        />
      )}
    </div>
  );
};

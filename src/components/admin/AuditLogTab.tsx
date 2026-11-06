import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Shield,
  ShieldAlert,
  Car,
  Cpu,
  Zap,
  RotateCcw,
  Download,
  Eye,
  X,
  Calendar,
  Lock,
  Megaphone,
  Users,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Database,
  ShieldCheck
} from 'lucide-react';
import {
  AuditLogEntry,
  AuditActionType,
  AuditTargetType,
  AuditLogFilterParams
} from '../../types';
import { storage } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';

interface AuditLogTabProps {
  onRefreshData?: () => void;
}

const ACTION_LABELS: Record<AuditActionType, { label: string; color: string; icon: React.ElementType }> = {
  auth_login: { label: 'ورود به سامانه', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60', icon: User },
  auth_logout: { label: 'خروج از حساب', color: 'text-zinc-400 bg-zinc-900 border-zinc-700/60', icon: Lock },
  vehicle_create: { label: 'تعریف خودرو', color: 'text-red-400 bg-red-950/40 border-red-800/60', icon: Car },
  vehicle_update: { label: 'ویرایش خودرو', color: 'text-amber-400 bg-amber-950/40 border-amber-800/60', icon: Car },
  vehicle_delete: { label: 'حذف خودرو', color: 'text-rose-400 bg-rose-950/40 border-rose-800/60', icon: Car },
  ecu_create: { label: 'تعریف ECU', color: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/60', icon: Cpu },
  ecu_update: { label: 'ویرایش ECU', color: 'text-sky-400 bg-sky-950/40 border-sky-800/60', icon: Cpu },
  ecu_delete: { label: 'حذف ECU', color: 'text-rose-400 bg-rose-950/40 border-rose-800/60', icon: Cpu },
  connector_create: { label: 'تعریف سوکت', color: 'text-teal-400 bg-teal-950/40 border-teal-800/60', icon: Cpu },
  connector_update: { label: 'ویرایش سوکت', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60', icon: Cpu },
  connector_delete: { label: 'حذف سوکت', color: 'text-rose-400 bg-rose-950/40 border-rose-800/60', icon: Cpu },
  pin_change: { label: 'تغییر پایه‌ها و پین‌اوت', color: 'text-violet-400 bg-violet-950/40 border-violet-800/60', icon: Zap },
  fusebox_create: { label: 'تعریف جعبه‌فیوز', color: 'text-amber-400 bg-amber-950/40 border-amber-800/60', icon: Zap },
  fusebox_update: { label: 'ویرایش جعبه‌فیوز', color: 'text-yellow-400 bg-yellow-950/40 border-yellow-800/60', icon: Zap },
  fusebox_delete: { label: 'حذف جعبه‌فیوز', color: 'text-rose-400 bg-rose-950/40 border-rose-800/60', icon: Zap },
  fuse_change: { label: 'تغییر فیوزها', color: 'text-amber-400 bg-amber-950/40 border-amber-800/60', icon: Zap },
  relay_change: { label: 'تغییر رله‌ها', color: 'text-orange-400 bg-orange-950/40 border-orange-800/60', icon: Zap },
  media_add: { label: 'بارگذاری تصویر/نقشه', color: 'text-blue-400 bg-blue-950/40 border-blue-800/60', icon: FileText },
  media_replace: { label: 'جایگزینی تصویر', color: 'text-blue-400 bg-blue-950/40 border-blue-800/60', icon: FileText },
  media_delete: { label: 'حذف تصویر/نقشه', color: 'text-rose-400 bg-rose-950/40 border-rose-800/60', icon: FileText },
  technical_approve: { label: 'تأیید اطلاعات فنی', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60', icon: Shield },
  technical_reject: { label: 'رد اطلاعات فنی', color: 'text-amber-400 bg-amber-950/40 border-amber-800/60', icon: ShieldAlert },
  technical_publish: { label: 'انتشار عمومی اطلاعات', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60', icon: CheckCircle2 },
  technical_submit: { label: 'ارسال برای بررسی', color: 'text-sky-400 bg-sky-950/40 border-sky-800/60', icon: Clock },
  version_restore: { label: 'بازیابی نسخه قبلی', color: 'text-purple-400 bg-purple-950/40 border-purple-800/60', icon: RotateCcw },
  bulk_import: { label: 'ورود گروهی اطلاعات', color: 'text-green-400 bg-green-950/40 border-green-800/60', icon: FileSpreadsheet },
  user_role_change: { label: 'تغییر نقش کاربر', color: 'text-fuchsia-400 bg-fuchsia-950/40 border-fuchsia-800/60', icon: Users },
  user_status_change: { label: 'تغییر وضعیت حساب', color: 'text-orange-400 bg-orange-950/40 border-orange-800/60', icon: Users },
  broadcast_create: { label: 'ارسال اعلان عمومی', color: 'text-pink-400 bg-pink-950/40 border-pink-800/60', icon: Megaphone },
  broadcast_toggle: { label: 'تغییر وضعیت اعلان', color: 'text-zinc-400 bg-zinc-900 border-zinc-700/60', icon: Megaphone },
  security_flag_secure: { label: 'فعال‌سازی FLAG_SECURE', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60', icon: ShieldCheck },
  security_screenshot_blocked: { label: 'مسدودسازی اسکرین‌شات', color: 'text-red-400 bg-red-950/40 border-red-800/60', icon: ShieldAlert }
};

const TARGET_TYPE_LABELS: Record<AuditTargetType, string> = {
  auth: 'احراز هویت',
  vehicle: 'خودرو',
  ecu: 'ECU',
  connector: 'سوکت و پین‌اوت',
  pin: 'پایه‌ها',
  fusebox: 'جعبه‌فیوز',
  fuse: 'فیوز',
  relay: 'رله',
  diagram: 'نقشه سیم‌کشی',
  media: 'تصویر و رسانه',
  version: 'نسخه‌بندی',
  bulk: 'ورود گروهی',
  user: 'کاربران',
  broadcast: 'اعلان‌های عمومی',
  security: 'امنیت و ضد اسکرین‌شات'
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدیر سیستم',
  technician: 'تکنسین فنی',
  user: 'کاربر عادی',
  system: 'سیستم خودکار'
};

export const AuditLogTab: React.FC<AuditLogTabProps> = () => {
  const { isOnlineDbConnected } = useAuth();
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState<AuditActionType | 'all'>('all');
  const [targetType, setTargetType] = useState<AuditTargetType | 'all'>('all');
  const [status, setStatus] = useState<'success' | 'failure' | 'all'>('all');
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Filter query parameters
  const filterParams: AuditLogFilterParams = useMemo(() => ({
    search: search.trim() || undefined,
    actionType,
    targetType,
    status,
    timeRange,
    userId: selectedUser !== 'all' ? selectedUser : undefined
  }), [search, actionType, targetType, status, timeRange, selectedUser]);

  // Logs list from storage
  const logs = useMemo(() => {
    return storage.getAuditLogs(filterParams);
  }, [filterParams]);

  // Unique users for dropdown
  const uniqueUsers = useMemo(() => {
    const all = storage.getAuditLogs();
    const emails = Array.from(new Set(all.map(l => l.userEmail).filter(Boolean)));
    return emails;
  }, []);

  // Stats
  const stats = useMemo(() => {
    const all = storage.getAuditLogs();
    const successes = all.filter(l => l.status === 'success').length;
    const failures = all.filter(l => l.status === 'failure').length;
    const actors = Array.from(new Set(all.map(l => l.userEmail).filter(Boolean))).length;
    return { total: all.length, successes, failures, actors };
  }, []);

  // Pagination slices
  const totalPages = Math.ceil(logs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, currentPage]);

  const handleResetFilters = () => {
    setSearch('');
    setActionType('all');
    setTargetType('all');
    setStatus('all');
    setTimeRange('all');
    setSelectedUser('all');
    setCurrentPage(1);
  };

  const formatPersianDate = (timestamp: number) => {
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(new Date(timestamp));
    } catch {
      return new Date(timestamp).toLocaleString();
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autopin-audit-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner & Security Policy Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>گزارش فعالیت‌های مدیریتی (Audit Log)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  فقط-خواندنی / غیرقابل دستکاری
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                ثبت دائمی و رهگیری دقیق وقایع حساس، ورود و خروج، تغییرات اطلاعات فنی و تصمیمات مدیران
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            onClick={handleExportJson}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 border border-zinc-700"
            title="دریافت خروجی گزارش‌های فیلترشده در قالب JSON"
          >
            <Download className="w-3.5 h-3.5 text-zinc-300" />
            <span>خروجی لاگ‌ها (JSON)</span>
          </button>
        </div>
      </div>

      {/* Security Architecture & Integrity Notice */}
      <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/90 text-xs text-zinc-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>معماری امنیتی و عدم دستکاری:</strong> گزارش‌ها به صورت فقط-افزودنی (Append-only) با قانون{' '}
            <code className="text-amber-400 bg-zinc-900 px-1 py-0.5 rounded text-[11px] font-mono">allow update, delete: if false</code> در
            پایگاه داده ابری Firestore نگهداری می‌شوند. رابط کاربری دکمه‌ای برای ویرایش یا حذف گزارش‌ها ندارد.
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium shrink-0">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className={isOnlineDbConnected ? 'text-emerald-400' : 'text-zinc-500'}>
            {isOnlineDbConnected ? 'همگام‌سازی ابری متصل' : 'ذخیره‌سازی ایزوله محلی'}
          </span>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col">
          <span className="text-[11px] font-semibold text-zinc-400">کل رویدادهای ثبت‌شده</span>
          <span className="text-xl font-black text-white font-mono mt-1">{stats.total}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col">
          <span className="text-[11px] font-semibold text-emerald-400">عملیات موفق</span>
          <span className="text-xl font-black text-emerald-400 font-mono mt-1">{stats.successes}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col">
          <span className="text-[11px] font-semibold text-rose-400">خطاها یا رد صلاحیت</span>
          <span className="text-xl font-black text-rose-400 font-mono mt-1">{stats.failures}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col">
          <span className="text-[11px] font-semibold text-indigo-400">کاربران فعال ثبت‌شده</span>
          <span className="text-xl font-black text-indigo-300 font-mono mt-1">{stats.actors}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col gap-3">
        {/* Row 1: Search and Main Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="جستجو در شرح، عنوان رکورد، ایمیل..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition"
            />
          </div>

          <div>
            <select
              value={actionType}
              onChange={(e) => { setActionType(e.target.value as any); setCurrentPage(1); }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-red-500 transition"
            >
              <option value="all">همه انواع عملیات</option>
              <optgroup label="احراز هویت و نشست">
                <option value="auth_login">ورود موفق به سامانه</option>
                <option value="auth_logout">خروج از حساب کاربری</option>
              </optgroup>
              <optgroup label="تأیید و انتشار فنی">
                <option value="technical_approve">تأیید اطلاعات فنی</option>
                <option value="technical_reject">رد اطلاعات فنی</option>
                <option value="technical_publish">انتشار عمومی اطلاعات</option>
                <option value="technical_submit">ارسال اطلاعات برای بررسی</option>
                <option value="version_restore">بازیابی نسخه قبلی اطلاعات</option>
              </optgroup>
              <optgroup label="تغییرات رکوردهای خودرو و ECU">
                <option value="vehicle_create">ایجاد خودرو</option>
                <option value="vehicle_update">ویرایش خودرو</option>
                <option value="vehicle_delete">حذف خودرو</option>
                <option value="ecu_create">ایجاد ECU</option>
                <option value="ecu_update">ویرایش ECU</option>
                <option value="ecu_delete">حذف ECU</option>
              </optgroup>
              <optgroup label="سوکت، پین‌ها و جعبه‌فیوز">
                <option value="connector_create">تعریف سوکت</option>
                <option value="connector_update">ویرایش سوکت</option>
                <option value="connector_delete">حذف سوکت</option>
                <option value="pin_change">تغییر پایه و سیم‌بندی</option>
                <option value="fusebox_create">تعریف جعبه‌فیوز</option>
                <option value="fusebox_update">ویرایش جعبه‌فیوز</option>
                <option value="fusebox_delete">حذف جعبه‌فیوز</option>
              </optgroup>
              <optgroup label="کاربران و اعلان‌ها">
                <option value="user_role_change">تغییر نقش کاربری</option>
                <option value="user_status_change">تغییر وضعیت حساب کاربر</option>
                <option value="broadcast_create">ارسال اعلان عمومی</option>
                <option value="broadcast_toggle">تغییر وضعیت اعلان</option>
                <option value="bulk_import">ورود گروهی اطلاعات</option>
              </optgroup>
            </select>
          </div>

          <div>
            <select
              value={targetType}
              onChange={(e) => { setTargetType(e.target.value as any); setCurrentPage(1); }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-red-500 transition"
            >
              <option value="all">همه رکوردهای هدف</option>
              {Object.entries(TARGET_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Secondary Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as any); setCurrentPage(1); }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-red-500 transition"
            >
              <option value="all">وضعیت: همه</option>
              <option value="success">فقط موفق</option>
              <option value="failure">فقط ناموفق / خطا</option>
            </select>
          </div>

          <div>
            <select
              value={timeRange}
              onChange={(e) => { setTimeRange(e.target.value as any); setCurrentPage(1); }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-red-500 transition"
            >
              <option value="all">بازه زمانی: همه</option>
              <option value="today">امروز (۲۴ ساعت گذشته)</option>
              <option value="7days">۷ روز گذشته</option>
              <option value="30days">۳۰ روز گذشته</option>
            </select>
          </div>

          <div>
            <select
              value={selectedUser}
              onChange={(e) => { setSelectedUser(e.target.value); setCurrentPage(1); }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-red-500 transition"
            >
              <option value="all">کاربر: همه کاربران</option>
              {uniqueUsers.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={handleResetFilters}
              className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-zinc-800 transition flex items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <span>پاکسازی فیلترها</span>
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-zinc-900 border border-zinc-800 rounded-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-white">هیچ رویدادی مطابق با فیلترهای انتخابی یافت نشد</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            می‌توانید فیلترهای جستجو یا بازه زمانی را تغییر داده یا با دکمه پاکسازی تمام وقایع را مشاهده نمایید.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition active:scale-95"
          >
            نمایش تمام وقایع
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="text-xs text-zinc-400 flex items-center justify-between px-1">
            <span>نمایش <strong>{paginatedLogs.length}</strong> از <strong>{logs.length}</strong> رویداد</span>
            <span>صفحه {currentPage} از {totalPages}</span>
          </div>

          <div className="space-y-2.5">
            {paginatedLogs.map((log) => {
              const meta = ACTION_LABELS[log.actionType] || {
                label: log.actionType,
                color: 'text-zinc-300 bg-zinc-800 border-zinc-700',
                icon: FileText
              };
              const Icon = meta.icon;
              const isSuccess = log.status === 'success';

              return (
                <div
                  key={log.id}
                  className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSuccess
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                          : 'bg-rose-950/40 border-rose-800/60 text-rose-400'
                      }`}
                    >
                      {isSuccess ? <Icon className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${meta.color}`}>
                          {meta.label}
                        </span>

                        <span className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                          {log.summary}
                        </span>

                        {!isSuccess && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800">
                            ناموفق
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 mt-1">
                        <span className="flex items-center gap-1 font-mono text-zinc-300">
                          <User className="w-3 h-3 text-zinc-500" />
                          <span>{log.userEmail}</span>
                        </span>

                        <span aria-hidden="true" className="text-zinc-600">·</span>

                        <span className="text-zinc-400">
                          نقش: <strong className="text-zinc-200">{ROLE_LABELS[log.userRole] || log.userRole}</strong>
                        </span>

                        {log.targetTitle && (
                          <>
                            <span aria-hidden="true" className="text-zinc-600">·</span>
                            <span className="truncate max-w-[200px]">
                              هدف: <strong className="text-zinc-200">{log.targetTitle}</strong>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                    <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono" dir="ltr">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{formatPersianDate(log.timestamp)}</span>
                    </div>

                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1 active:scale-95"
                      title="مشاهده جزئیات کامل و مقادیر رویداد"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-400" />
                      <span>جزئیات</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-3">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40 disabled:hover:text-zinc-300 transition"
                title="صفحه قبلی"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono text-zinc-400 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40 disabled:hover:text-zinc-300 transition"
                title="صفحه بعدی"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Audit Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/60">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    selectedLog.status === 'success'
                      ? 'bg-emerald-950/50 border-emerald-800/70 text-emerald-400'
                      : 'bg-rose-950/50 border-rose-800/70 text-rose-400'
                  }`}
                >
                  {selectedLog.status === 'success' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    جزئیات رویداد مدیریتی
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5" dir="ltr">
                    شناسه: {selectedLog.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Event Summary Card */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[11px] font-bold text-zinc-400 block mb-1">شرح عملیات:</span>
                <p className="text-sm font-bold text-white leading-relaxed">
                  {selectedLog.summary}
                </p>
              </div>

              {/* Event Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <span className="text-[11px] text-zinc-500 block">نوع عملیات:</span>
                  <span className="font-bold text-zinc-200 mt-0.5 inline-block">
                    {ACTION_LABELS[selectedLog.actionType]?.label || selectedLog.actionType}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono mr-1">({selectedLog.actionType})</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <span className="text-[11px] text-zinc-500 block">نتیجه عملیات:</span>
                  <span
                    className={`font-bold mt-0.5 inline-block ${
                      selectedLog.status === 'success' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {selectedLog.status === 'success' ? 'موفقیت‌آمیز (Success)' : 'ناموفق / خطا (Failure)'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <span className="text-[11px] text-zinc-500 block">کاربر انجام‌دهنده:</span>
                  <span className="font-bold text-zinc-200 font-mono mt-0.5 inline-block">
                    {selectedLog.userEmail}
                  </span>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    نقش: <strong>{ROLE_LABELS[selectedLog.userRole] || selectedLog.userRole}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <span className="text-[11px] text-zinc-500 block">زمان ثبت رویداد:</span>
                  <span className="font-bold text-zinc-200 font-mono mt-0.5 inline-block" dir="ltr">
                    {formatPersianDate(selectedLog.timestamp)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <span className="text-[11px] text-zinc-500 block">نوع رکورد هدف:</span>
                  <span className="font-bold text-zinc-200 mt-0.5 inline-block">
                    {TARGET_TYPE_LABELS[selectedLog.targetType] || selectedLog.targetType}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <span className="text-[11px] text-zinc-500 block">عنوان رکورد هدف:</span>
                  <span className="font-bold text-zinc-200 mt-0.5 inline-block">
                    {selectedLog.targetTitle || 'ندارد'}
                  </span>
                  {selectedLog.targetId && (
                    <span className="text-[10px] text-zinc-500 font-mono block mt-0.5 truncate">
                      شناسه: {selectedLog.targetId}
                    </span>
                  )}
                </div>
              </div>

              {/* Diffs / Differences if present */}
              {selectedLog.diffSummary && selectedLog.diffSummary.length > 0 && (
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <span className="text-[11px] font-bold text-amber-400 block">
                    خلاصه تغییرات مقادیر قبلی و جدید:
                  </span>
                  <div className="space-y-1.5">
                    {selectedLog.diffSummary.map((d, idx) => (
                      <div key={idx} className="p-2 rounded bg-zinc-900 border border-zinc-800 text-xs">
                        <span className="font-bold text-zinc-200">{d.fieldLabelFa || d.field}: </span>
                        <span className="text-rose-400 line-through mr-1 font-mono">
                          {typeof d.oldValue === 'object' ? JSON.stringify(d.oldValue) : String(d.oldValue ?? 'خالی')}
                        </span>
                        <span className="text-zinc-500 mx-1.5">←</span>
                        <span className="text-emerald-400 font-bold font-mono">
                          {typeof d.newValue === 'object' ? JSON.stringify(d.newValue) : String(d.newValue ?? 'خالی')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Details (JSON) */}
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <span className="text-[11px] font-bold text-zinc-400 block">
                    فراداده و اطلاعات تکمیلی:
                  </span>
                  <pre
                    className="p-3 rounded bg-zinc-900 text-zinc-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-40"
                    dir="ltr"
                  >
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {/* Privacy Notice */}
              <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60 text-[11px] text-zinc-500 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>
                  حفظ حریم خصوصی و امنیت: کلمات عبور، کلیدهای دسترسی و اطلاعات حساس در این گزارش ثبت نمی‌شوند.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

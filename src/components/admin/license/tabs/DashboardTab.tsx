/**
 * AutoPin Pro - License Admin: Dashboard Tab (Tab 1)
 * Displays comprehensive operational statistics, real-time counters, status distributions,
 * cryptographic infrastructure status, and recent security events.
 */

import React from 'react';
import {
  Key,
  ShieldCheck,
  AlertTriangle,
  Ban,
  Clock,
  Smartphone,
  Repeat,
  Activity,
  Layers,
  Lock,
  Cpu,
  Calendar,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';
import { LicenseDashboardStats } from '../../../../services/licenseAdminService';
import { LicenseAuditLogRecord, LicenseRecord } from '../../../../types/license';

interface DashboardTabProps {
  stats: LicenseDashboardStats;
  recentLogs: LicenseAuditLogRecord[];
  recentLicenses: LicenseRecord[];
  onNavigateTab: (tabId: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  stats,
  recentLogs,
  recentLicenses,
  onNavigateTab
}) => {
  const activeRate = stats.totalLicenses > 0
    ? Math.round((stats.activeLicenses / stats.totalLicenses) * 100)
    : 0;

  const expiredRate = stats.totalLicenses > 0
    ? Math.round((stats.expiredLicenses / stats.totalLicenses) * 100)
    : 0;

  const blockedRate = stats.totalLicenses > 0
    ? Math.round((stats.blockedLicenses / stats.totalLicenses) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner Notice for Phase 1 */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900 border border-red-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white text-sm block">فاز ۱: اتصال زنده خواندنی به دیتابیس ابری</span>
            <span className="text-zinc-400">
              داده‌های این داشبورد به‌صورت Real-Time مستقیماً از Firestore لود می‌شوند. فرم‌ها و دکمه‌های عملیاتی برای تضمین پایداری در فاز ۲ فعال خواهند شد.
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[11px] font-mono shrink-0">
          ● اتصال زنده (Active Sync)
        </span>
      </div>

      {/* Primary KPI Grid (7 Stats) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Licenses */}
        <div
          onClick={() => onNavigateTab('licenses')}
          className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-400">کل لایسنس‌ها</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-zinc-300 group-hover:text-red-400 transition">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">{stats.totalLicenses}</span>
            <span className="text-[10px] text-zinc-500 font-mono">1-Year Term</span>
          </div>
        </div>

        {/* Active Licenses */}
        <div
          onClick={() => onNavigateTab('licenses')}
          className="p-4 rounded-xl bg-zinc-900/90 border border-emerald-900/40 hover:border-emerald-700/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-emerald-400">لایسنس‌های فعال</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400 font-mono">{stats.activeLicenses}</span>
            <span className="text-[10px] text-emerald-500 font-mono">{activeRate}% کل</span>
          </div>
        </div>

        {/* Expired */}
        <div
          onClick={() => onNavigateTab('renewals')}
          className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800/80 hover:border-amber-700/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-400">منقضی‌شده</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-zinc-400 group-hover:text-amber-400 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-zinc-300 font-mono">{stats.expiredLicenses}</span>
            <span className="text-[10px] text-zinc-500 font-mono">{expiredRate}% کل</span>
          </div>
        </div>

        {/* Blocked / Revoked */}
        <div
          onClick={() => onNavigateTab('revocations')}
          className="p-4 rounded-xl bg-zinc-900/90 border border-red-950/60 hover:border-red-700/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-red-400">مسدود / لغو شده</span>
            <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-red-400 font-mono">{stats.blockedLicenses}</span>
            <span className="text-[10px] text-red-500 font-mono">{blockedRate}% کل</span>
          </div>
        </div>

        {/* Pending Requests */}
        <div
          onClick={() => onNavigateTab('requests')}
          className="p-4 rounded-xl bg-zinc-900/90 border border-amber-900/40 hover:border-amber-700/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-amber-400">درخواست‌های در انتظار</span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400 font-mono">{stats.pendingRequests}</span>
            <span className="text-[10px] text-amber-500 font-mono">نیاز به بررسی</span>
          </div>
        </div>

        {/* Connected Devices */}
        <div
          onClick={() => onNavigateTab('devices')}
          className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-400">دستگاه‌های متصل</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-zinc-300 group-hover:text-cyan-400 transition">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">{stats.activeDevices}</span>
            <span className="text-[10px] text-zinc-500 font-mono">Hardware TEE</span>
          </div>
        </div>

        {/* Transfers */}
        <div
          onClick={() => onNavigateTab('transfers')}
          className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-400">انتقال‌های سخت‌افزار</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-zinc-300 group-hover:text-purple-400 transition">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">{stats.totalTransfers}</span>
            <span className="text-[10px] text-zinc-500 font-mono">ثبت در لاگ</span>
          </div>
        </div>

        {/* Expiring Soon (< 30 days) */}
        <div
          onClick={() => onNavigateTab('renewals')}
          className="p-4 rounded-xl bg-zinc-900/90 border border-orange-900/40 hover:border-orange-700/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-orange-400">نزدیک به انقضا (۳۰ روز)</span>
            <div className="w-8 h-8 rounded-lg bg-orange-950/60 border border-orange-800/60 flex items-center justify-center text-orange-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-orange-400 font-mono">{stats.expiringIn30Days}</span>
            <span className="text-[10px] text-orange-500 font-mono">اولویت تمدید</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Security Infrastructure Status & License Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution Progress Bars */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-500" />
                <span>توزیع وضعیت لایسنس‌ها</span>
              </h4>
              <span className="text-[11px] font-mono text-zinc-500">{stats.totalLicenses} رکورد</span>
            </div>

            <div className="space-y-4">
              {/* Active Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-emerald-400">فعال و معتبر</span>
                  <span className="font-mono text-zinc-300">{stats.activeLicenses} ({activeRate}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${activeRate}%` }}
                  />
                </div>
              </div>

              {/* Expired Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-zinc-400">منقضی شده</span>
                  <span className="font-mono text-zinc-300">{stats.expiredLicenses} ({expiredRate}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-zinc-500 rounded-full transition-all duration-500"
                    style={{ width: `${expiredRate}%` }}
                  />
                </div>
              </div>

              {/* Blocked Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-red-400">مسدود / لغو شده</span>
                  <span className="font-mono text-zinc-300">{stats.blockedLicenses} ({blockedRate}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all duration-500"
                    style={{ width: `${blockedRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>مدت اعتبار پایه لایسنس‌ها:</span>
            <span className="font-bold font-mono text-zinc-200">۳۶۵ روز (۱ سال کامل)</span>
          </div>
        </div>

        {/* Cryptographic Enclave Status */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>مشخصات معماری امنیتی و رمزنگاری (ComposeShield Core)</span>
            </h4>
            <span className="px-2.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
              Protocol Specifications
            </span>
          </div>

          {/* Environmental Reality Check */}
          {typeof window !== 'undefined' && !(window as any).AndroidSecurityBridge && (
            <div className="mb-4 p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/40 text-[11px] text-amber-300/90 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span>
                محیط اجرایی جاری: <strong>مرورگر وب (غیر نیتیو)</strong> — وضعیت‌های سخت‌افزاری TEE، StrongBox و FLAG_SECURE صرفاً بر اساس مشخصات پروتکل نمایش داده می‌شوند و وضعیت تأییدشده منوط به اجرای مستقیم APK روی دستگاه اندرویدی است.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* 1. Server Signature (Real server algorithm) */}
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/70 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                  <span>امضای نامتقارن ECDSA P-256</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">تأییدشده سرور</span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  کلید خصوصی در Secret Manager، اعتبارسنجی کلاینت با کلید عمومی SPKI
                </div>
              </div>
            </div>

            {/* 2. Hardware Keystore / TEE */}
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/70 flex items-start gap-3">
              {typeof window !== 'undefined' && Boolean((window as any).AndroidSecurityBridge) ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-amber-500/60 bg-amber-950/60 text-amber-400 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">!</span>
              )}
              <div>
                <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                  <span>Android Keystore TEE / StrongBox</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                    typeof window !== 'undefined' && Boolean((window as any).AndroidSecurityBridge)
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-zinc-800 text-amber-300/90 border border-zinc-700'
                  }`}>
                    {typeof window !== 'undefined' && Boolean((window as any).AndroidSecurityBridge) ? 'سخت‌افزاری فعال' : 'مشخصات معماری'}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  {typeof window !== 'undefined' && Boolean((window as any).AndroidSecurityBridge)
                    ? 'جفت‌کلید تولیدشده در تراشه امن سخت‌افزاری دستگاه'
                    : 'در کلاینت وب تأییدنشده؛ نیازمند استعلام از ماژول سخت‌افزاری اندروید'}
                </div>
              </div>
            </div>

            {/* 3. Anti-Clock Tampering */}
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/70 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                  <span>ضد دستکاری زمان (Anti-Clock)</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">الگوریتم کلاینت</span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  چک‌پوینت مونوپلی صعودی یکنواخت و مهلت اجاره آفلاین حداکثر ۷ روزه
                </div>
              </div>
            </div>

            {/* 4. Multi-dimensional Rate Limiting */}
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/70 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                  <span>نرخ‌بندی ۴ بعدی سرور (4D Rate Limit)</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">فعال در سرور</span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  حفاظت لایه‌ای مبتنی بر IP، سخت‌افزار Keystore، حساب کاربری و کلید هدف
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-500">حفاظت سخت‌افزاری صفحه و ضد اسکرین‌شات:</span>
            {typeof window !== 'undefined' && Boolean((window as any).AndroidSecurityBridge) ? (
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 font-mono text-[11px]">
                FLAG_SECURE Active (Hardware Enforced)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono text-[11px]">
                FLAG_SECURE: معماری نیتیو (غیرفعال در مرورگر وب)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Audit Events & Recent Licenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Audit Logs */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>آخرین رخدادهای امنیتی (Audit Logs)</span>
            </h4>
            <button
              onClick={() => onNavigateTab('audit_logs')}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition"
            >
              <span>مشاهده همه</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              هنوز رویداد امنیتی ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                        log.action === 'block' || log.action === 'revoke'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : log.action === 'activate'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : log.action === 'transfer'
                          ? 'bg-purple-950 text-purple-400 border border-purple-800'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-zinc-300 truncate max-w-[200px]" title={log.details}>
                      {log.details || log.targetId}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('fa-IR') : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Issued / Active Licenses */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>آخرین لایسنس‌های ثبت‌شده</span>
            </h4>
            <button
              onClick={() => onNavigateTab('licenses')}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition"
            >
              <span>مدیریت لایسنس‌ها</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentLicenses.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              هنوز لایسنسی در پایگاه داده ایجاد نشده است.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentLicenses.slice(0, 5).map((lic) => (
                <div
                  key={lic.id}
                  className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="font-mono text-[11px] text-zinc-300 font-bold">
                      {lic.activationKey ? `${lic.activationKey.slice(0, 9)}****` : lic.id.slice(0, 12)}
                    </span>
                    <span className="text-zinc-500 text-[11px] truncate max-w-[150px]">
                      {lic.userEmail || lic.userId || 'بدون ایمیل'}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      lic.isBlocked
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : lic.expiresAt < Date.now()
                        ? 'bg-zinc-800 text-zinc-400'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {lic.isBlocked ? 'مسدود' : lic.expiresAt < Date.now() ? 'منقضی' : 'فعال'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

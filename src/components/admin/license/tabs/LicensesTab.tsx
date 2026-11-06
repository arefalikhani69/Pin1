/**
 * AutoPin Pro - License Admin: Licenses Management Tab (Tab 2)
 *
 * Provides real-time view of all issued licenses with:
 * - Search by License ID, User UID, User Email, Device ID, or Key Hint
 * - Filter by status (All, Active, Expired, Blocked, Suspended)
 * - Detailed inspection modal
 * - Phase 2 action placeholders (Renew, Revoke/Block, Transfer, Issue New)
 *   strictly disabled with clear status badges.
 */

import React, { useState, useMemo } from 'react';
import {
  Key,
  Search,
  Filter,
  Eye,
  RotateCw,
  Ban,
  ArrowRightLeft,
  Plus,
  ShieldCheck,
  AlertTriangle,
  X,
  Copy,
  Check,
  Calendar,
  Smartphone,
  User,
  Clock,
  Lock
} from 'lucide-react';
import { LicenseRecord } from '../../../../types/license';

interface LicensesTabProps {
  licenses: LicenseRecord[];
  isLoading: boolean;
}

export const LicensesTab: React.FC<LicensesTabProps> = ({ licenses, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'blocked'>('all');
  const [selectedLicense, setSelectedLicense] = useState<LicenseRecord | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  const filteredLicenses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const now = Date.now();

    return licenses.filter((lic) => {
      // Filter by status
      if (statusFilter === 'active') {
        if (lic.isBlocked || lic.expiresAt < now || lic.status !== 'active') return false;
      } else if (statusFilter === 'expired') {
        if (lic.expiresAt >= now || lic.isBlocked) return false;
      } else if (statusFilter === 'blocked') {
        if (!lic.isBlocked && lic.status !== 'revoked' && lic.status !== 'suspended') return false;
      }

      // Filter by search query
      if (!q) return true;
      return (
        lic.id.toLowerCase().includes(q) ||
        (lic.userId && lic.userId.toLowerCase().includes(q)) ||
        (lic.userEmail && lic.userEmail.toLowerCase().includes(q)) ||
        (lic.boundDeviceId && lic.boundDeviceId.toLowerCase().includes(q)) ||
        (lic.activationKey && lic.activationKey.toLowerCase().includes(q))
      );
    });
  }, [licenses, searchQuery, statusFilter]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const formatShamsiDate = (ms?: number) => {
    if (!ms) return 'نامشخص';
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(ms));
    } catch {
      return new Date(ms).toLocaleDateString('fa-IR');
    }
  };

  return (
    <div className="space-y-5">
      {/* Search and Filter Controls */}
      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو بر اساس License ID، شناسه کاربر (UID)، ایمیل، شناسه سخت‌افزار یا کد فعال‌سازی..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-red-500/60 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              statusFilter === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            همه ({licenses.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              statusFilter === 'active'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/50'
            }`}
          >
            فعال
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              statusFilter === 'expired'
                ? 'bg-zinc-800 text-zinc-300 border border-zinc-600'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            منقضی
          </button>
          <button
            onClick={() => setStatusFilter('blocked')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              statusFilter === 'blocked'
                ? 'bg-red-950 text-red-400 border border-red-800'
                : 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50'
            }`}
          >
            مسدود / لغو شده
          </button>

          {/* Issue New License Button (Phase 2 Stub) */}
          <button
            onClick={() => setShowIssueModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 text-xs font-bold transition mr-2 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>صدور لایسنس جدید</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-zinc-500 text-xs font-mono">
            در حال بارگذاری لیست زنده لایسنس‌ها از دیتابیس...
          </div>
        ) : filteredLicenses.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs">
            {searchQuery
              ? 'هیچ لایسنسی با عبارت جستجو شده مطابقت ندارد.'
              : 'هیچ رکوردی در این بخش وجود ندارد.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800/80 font-medium">
                <tr>
                  <th className="px-4 py-3">شناسه لایسنس (ID)</th>
                  <th className="px-4 py-3">کد فعال‌سازی (Key Hint)</th>
                  <th className="px-4 py-3">کاربر / ایمیل</th>
                  <th className="px-4 py-3">سخت‌افزار متصل (Device)</th>
                  <th className="px-4 py-3">مدت</th>
                  <th className="px-4 py-3">تاریخ انقضا</th>
                  <th className="px-4 py-3">وضعیت</th>
                  <th className="px-4 py-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {filteredLicenses.map((lic) => {
                  const isExpired = lic.expiresAt < Date.now();
                  const isBlocked = lic.isBlocked || lic.status === 'revoked';

                  return (
                    <tr
                      key={lic.id}
                      className="hover:bg-zinc-800/40 transition group"
                    >
                      {/* ID */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-300 font-bold whitespace-nowrap">
                        {lic.id}
                      </td>

                      {/* Key Hint */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                          {lic.activationKey ? `${lic.activationKey.slice(0, 10)}****` : 'AUTO-****-****'}
                        </span>
                      </td>

                      {/* User */}
                      <td className="px-4 py-3.5 text-zinc-300 max-w-[160px] truncate">
                        {lic.userEmail || (lic.userId ? `UID: ${lic.userId.slice(0, 8)}...` : 'بدون کاربر')}
                      </td>

                      {/* Device */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400 max-w-[140px] truncate">
                        {lic.boundDeviceId ? (
                          <span title={lic.boundDeviceId}>
                            {lic.boundDeviceId.slice(0, 12)}...
                          </span>
                        ) : (
                          <span className="text-zinc-600">متصل‌نشده</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400">
                        {lic.duration === '1y' ? '۱ ساله (۳۶۵ روز)' : lic.duration}
                      </td>

                      {/* Expiration */}
                      <td className="px-4 py-3.5 text-[11px] font-mono text-zinc-400 whitespace-nowrap">
                        {lic.expiresAt ? new Date(lic.expiresAt).toLocaleDateString('fa-IR') : '—'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-950/80 text-red-400 border border-red-800">
                            <Ban className="w-3 h-3" />
                            <span>مسدود / لغو</span>
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                            <Clock className="w-3 h-3" />
                            <span>منقضی</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                            <ShieldCheck className="w-3 h-3" />
                            <span>فعال</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => setSelectedLicense(lic)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                            title="مشاهده جزئیات کامل لایسنس"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Phase 2 Action Buttons with Tooltip/Disabled */}
                          <button
                            disabled
                            className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-600 opacity-60 cursor-not-allowed"
                            title="تمدید لایسنس (فاز ۲)"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            disabled
                            className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-600 opacity-60 cursor-not-allowed"
                            title="انتقال به سخت‌افزار دیگر (فاز ۲)"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          <button
                            disabled
                            className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-600 opacity-60 cursor-not-allowed"
                            title="مسدودسازی / لغو (فاز ۲)"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* License Details Modal */}
      {selectedLicense && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 text-right">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">جزئیات کامل لایسنس رمزنگاری</h3>
                  <span className="font-mono text-[11px] text-zinc-500">{selectedLicense.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLicense(null)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <span className="text-zinc-500 block text-[11px]">شناسه اختصاصی سند:</span>
                <span className="font-mono text-zinc-200 font-bold break-all">{selectedLicense.id}</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <span className="text-zinc-500 block text-[11px]">کد فعال‌سازی (Key Hint):</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-emerald-400 font-bold">{selectedLicense.activationKey}</span>
                  <button
                    onClick={() => copyToClipboard(selectedLicense.activationKey)}
                    className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"
                    title="کپی در حافظه"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <span className="text-zinc-500 block text-[11px]">مالک لایسنس (کاربر Firebase Auth):</span>
                <span className="text-zinc-200 break-all">{selectedLicense.userEmail || selectedLicense.userId || 'آزاد (متصل‌نشده)'}</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <span className="text-zinc-500 block text-[11px]">سخت‌افزار قفل‌شده (Hardware Keystore ID):</span>
                <span className="font-mono text-zinc-200 break-all">{selectedLicense.boundDeviceId || 'هنوز فعال‌سازی سخت‌افزاری انجام نشده است'}</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <span className="text-zinc-500 block text-[11px]">تاریخ شروع اعتبار:</span>
                <span className="text-zinc-300 font-mono">{formatShamsiDate(selectedLicense.startsAt)}</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <span className="text-zinc-500 block text-[11px]">تاریخ انقضا (پایان ۱ سال):</span>
                <span className="text-zinc-300 font-mono">{formatShamsiDate(selectedLicense.expiresAt)}</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <span className="text-zinc-500 block text-[11px]">آخرین بررسی آنلاین لایسنس:</span>
                <span className="text-zinc-300 font-mono">{formatShamsiDate(selectedLicense.lastOnlineCheckAt)}</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <span className="text-zinc-500 block text-[11px]">حداکثر مهلت آفلاین (Grace Period):</span>
                <span className="text-zinc-300 font-mono">{selectedLicense.maxOfflineDays || 7} روز (با توکن امضاشده سرور)</span>
              </div>
            </div>

            {selectedLicense.isBlocked && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300">
                <span className="font-bold block mb-1">دلیل مسدودسازی:</span>
                <span>{selectedLicense.blockReason || 'توسط مدیر سیستم مسدود شده است.'}</span>
              </div>
            )}

            {/* Action Bar for Phase 2 Notice */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                عملیات ویرایشی (تمدید، ابطال، انتقال سخت‌افزار):
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 text-[11px]">
                غیرفعال در فاز ۱ (فقط خواندنی)
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setSelectedLicense(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Modal (Phase 2 Form Structure) */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-white text-sm">فرم صدور لایسنس جدید (پیش‌نمایش ساختار)</h3>
              </div>
              <button
                onClick={() => setShowIssueModal(false)}
                className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300">
              <span className="font-bold block mb-1">هشدار امنیتی فاز ۱:</span>
              <span>
                طبق الزامات پروژه، صدور لایسنس در دیتابیس زنده در فاز ۱ غیرفعال است تا از ایجاد رکوردهای ساختگی و ناخواسته جلوگیری شود. اجرای تابع Cloud Function <code className="font-mono bg-zinc-900 px-1 py-0.5 rounded text-amber-200">issueLicense</code> در فاز ۲ متصل خواهد شد.
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">ایمیل یا شناسه کاربری مقصد (اختیاری):</label>
                <input
                  type="text"
                  disabled
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">مدت اعتبار:</label>
                <select
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                >
                  <option>۱ ساله (۳۶۵ روز استاندارد)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">الگوریتم تولید کلید امنیتی:</label>
                <input
                  type="text"
                  disabled
                  value="CSPRNG 128-bit Cryptographic Hex Encoded + ECDSA Server Signature"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setShowIssueModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
              >
                انصراف و بستن
              </button>
              <button
                disabled
                className="px-4 py-2 rounded-xl bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-bold cursor-not-allowed opacity-60"
              >
                صدور لایسنس (فعال‌سازی در فاز ۲)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

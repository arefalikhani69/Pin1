/**
 * AutoPin Pro - License Admin: License Renewal Tab (Tab 6)
 *
 * Real-time view of licenses nearing expiration (< 30 days) and expired licenses:
 * - Expiration countdown / urgency levels
 * - 1-Year renewal calculation engine preview
 * - Phase 2 renewal form preview (disabled in Phase 1)
 */

import React, { useState } from 'react';
import {
  RotateCw,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Key,
  Smartphone,
  X
} from 'lucide-react';
import { LicenseRecord } from '../../../../types/license';

interface RenewalsTabProps {
  licenses: LicenseRecord[];
  isLoading: boolean;
}

export const RenewalsTab: React.FC<RenewalsTabProps> = ({ licenses, isLoading }) => {
  const [selectedLicenseForRenewal, setSelectedLicenseForRenewal] = useState<LicenseRecord | null>(null);

  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  // Filter licenses nearing expiration (< 30 days) or already expired, but not blocked
  const expiringOrExpiredLicenses = licenses.filter((lic) => {
    if (lic.isBlocked) return false;
    return lic.expiresAt < now + thirtyDaysMs;
  });

  // Calculate new expiration date (365 days after current expiration or now if already expired)
  const calculateNewExpiration = (currentExpiresAt: number) => {
    const base = currentExpiresAt > now ? currentExpiresAt : now;
    return base + 365 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-orange-400" />
            <span>مرکز مدیریت تمدید دوره لایسنس‌ها (۱ ساله)</span>
          </h4>
          <p className="text-xs text-zinc-400 mt-1">
            فهرست لایسنس‌هایی که اعتبار آن‌ها به پایان رسیده یا کمتر از ۳۰ روز دیگر منقضی می‌شود.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl bg-orange-950/80 text-orange-300 border border-orange-800 text-xs font-mono">
            {expiringOrExpiredLicenses.length} لایسنس نیازمند اقدام
          </span>
        </div>
      </div>

      {/* Renewals Table */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-zinc-500 text-xs font-mono">
            در حال ارزیابی تاریخ‌های انقضا...
          </div>
        ) : expiringOrExpiredLicenses.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs">
            در حال حاضر هیچ لایسنسی در آستانه انقضا یا منقضی وجود ندارد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800/80 font-medium">
                <tr>
                  <th className="px-4 py-3">شناسه لایسنس</th>
                  <th className="px-4 py-3">کاربر / ایمیل</th>
                  <th className="px-4 py-3">دستگاه متصل</th>
                  <th className="px-4 py-3">تاریخ انقضا</th>
                  <th className="px-4 py-3">وضعیت باقیمانده</th>
                  <th className="px-4 py-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {expiringOrExpiredLicenses.map((lic) => {
                  const isExpired = lic.expiresAt < now;
                  const daysLeft = Math.ceil((lic.expiresAt - now) / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={lic.id} className="hover:bg-zinc-800/40 transition">
                      <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-300 font-bold">
                        {lic.id}
                      </td>

                      <td className="px-4 py-3.5 text-zinc-300">
                        {lic.userEmail || lic.userId || '—'}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400">
                        {lic.boundDeviceId ? `${lic.boundDeviceId.slice(0, 12)}...` : 'متصل‌نشده'}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400">
                        {new Date(lic.expiresAt).toLocaleDateString('fa-IR')}
                      </td>

                      <td className="px-4 py-3.5">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-950/80 text-red-400 border border-red-800">
                            <Clock className="w-3 h-3" />
                            <span>منقضی شده</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-orange-950/80 text-orange-400 border border-orange-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{daysLeft} روز باقیمانده</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedLicenseForRenewal(lic)}
                          className="px-3 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/40 text-[11px] font-medium transition"
                        >
                          فرم تمدید ۱ ساله
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Renewal Modal Preview */}
      {selectedLicenseForRenewal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <RotateCw className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-white text-sm">پیش‌نمایش تمدید ۱ ساله لایسنس</h3>
              </div>
              <button
                onClick={() => setSelectedLicenseForRenewal(null)}
                className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300">
              تابع تمدید <code className="font-mono bg-zinc-900 px-1 py-0.5 rounded text-amber-200">renewLicense</code> در فاز ۲ متصل خواهد شد. در فاز ۱ هیچ تغییری روی رکورد واقعی اعمال نمی‌گردد.
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block text-[11px] mb-1">شناسه لایسنس هدف:</span>
                <span className="font-mono text-zinc-200 font-bold">{selectedLicenseForRenewal.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 block text-[11px] mb-1">انقضای فعلی:</span>
                  <span className="font-mono text-zinc-300">
                    {new Date(selectedLicenseForRenewal.expiresAt).toLocaleDateString('fa-IR')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-emerald-900/60">
                  <span className="text-emerald-500 block text-[11px] mb-1">انقضای جدید پس از تمدید:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {new Date(calculateNewExpiration(selectedLicenseForRenewal.expiresAt)).toLocaleDateString('fa-IR')}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block text-[11px] mb-1">دوره جدید اضافه شونده:</span>
                <span className="text-zinc-200 font-medium">+ ۳۶۵ روز (۱ سال تقویمی استاندارد)</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setSelectedLicenseForRenewal(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
              >
                انصراف
              </button>
              <button
                disabled
                className="px-4 py-2 rounded-xl bg-orange-600/30 text-orange-300 border border-orange-500/30 text-xs font-bold cursor-not-allowed opacity-60"
              >
                ثبت تمدید (فاز ۲)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

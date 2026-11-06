/**
 * AutoPin Pro - License Admin: Revocation & Blocking Tab (Tab 7)
 *
 * Displays:
 * - Real-time list of all blocked, revoked, or suspended licenses
 * - Block reasons & hardware device fingerprints
 * - Block execution form preview (strictly disabled in Phase 1)
 */

import React, { useState } from 'react';
import {
  Ban,
  ShieldAlert,
  AlertTriangle,
  Key,
  Smartphone,
  Calendar,
  X,
  Lock
} from 'lucide-react';
import { LicenseRecord } from '../../../../types/license';

interface RevocationsTabProps {
  licenses: LicenseRecord[];
  isLoading: boolean;
}

export const RevocationsTab: React.FC<RevocationsTabProps> = ({ licenses, isLoading }) => {
  const [showBlockForm, setShowBlockForm] = useState(false);

  const blockedLicenses = licenses.filter(
    (lic) => lic.isBlocked || lic.status === 'revoked' || lic.status === 'suspended'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Ban className="w-4 h-4 text-red-500" />
            <span>مدیریت لایسنس‌های مسدود و ابطال‌شده</span>
          </h4>
          <p className="text-xs text-zinc-400 mt-1">
            لایسنس‌های مسدود شده به طور آنی در تمام استعلام‌های آفلاین و آنلاین کلاینت غیرمعتبر شناخته می‌شوند.
          </p>
        </div>

        <button
          onClick={() => setShowBlockForm(!showBlockForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 text-xs font-bold transition shrink-0"
        >
          <Ban className="w-3.5 h-3.5" />
          <span>{showBlockForm ? 'بستن فرم مسدودسازی' : 'فرم مسدودسازی لایسنس (پیش‌نمایش)'}</span>
        </button>
      </div>

      {/* Block Form Preview */}
      {showBlockForm && (
        <div className="p-5 rounded-2xl bg-zinc-900 border border-red-900/60 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>فرم ابطال و مسدودسازی لایسنس (فاز ۲)</span>
            </h4>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono">
              Ready for Phase 2 revokeLicense
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300">
            عملیات مسدودسازی در فاز ۲ از طریق فراخوانی امن <code className="font-mono bg-zinc-900 px-1 py-0.5 rounded text-amber-200">revokeLicense</code> انجام خواهد شد. در فاز ۱ اجرای آن غیرفعال است.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1">شناسه لایسنس هدف (License ID):</label>
              <input
                type="text"
                disabled
                placeholder="lic_1730000000_abc"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">اقدام امنیتی موردنظر:</label>
              <select
                disabled
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 cursor-not-allowed"
              >
                <option>ابطال دائم (Revoked - Permanent)</option>
                <option>تعلیق موقت (Suspended - Temporary)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-zinc-400 mb-1">دلیل مستند مسدودسازی (ثبت در لاگ‌های امنیتی):</label>
              <input
                type="text"
                disabled
                placeholder="تلاش برای کلونینگ سخت‌افزار یا نقض شرایط استفاده..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              onClick={() => setShowBlockForm(false)}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
            >
              انصراف
            </button>
            <button
              disabled
              className="px-4 py-2 rounded-xl bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-bold cursor-not-allowed opacity-60"
            >
              اجرای مسدودسازی (فاز ۲)
            </button>
          </div>
        </div>
      )}

      {/* Blocked Licenses Table */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 overflow-hidden">
        <div className="p-4 bg-zinc-950/60 border-b border-zinc-800/80 flex items-center justify-between">
          <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
            <Ban className="w-3.5 h-3.5 text-red-400" />
            <span>فهرست لایسنس‌های مسدود شده فعال</span>
          </h4>
          <span className="text-[11px] font-mono text-zinc-500">{blockedLicenses.length} لایسنس مسدود</span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-zinc-500 text-xs font-mono">
            در حال بارگذاری لایسنس‌های مسدود...
          </div>
        ) : blockedLicenses.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs">
            خوشبختانه هیچ لایسنسی در وضعیت مسدود یا لغو شده قرار ندارد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800/80 font-medium">
                <tr>
                  <th className="px-4 py-3">شناسه لایسنس</th>
                  <th className="px-4 py-3">کاربر</th>
                  <th className="px-4 py-3">سخت‌افزار قفل‌شده</th>
                  <th className="px-4 py-3">دلیل مسدودسازی</th>
                  <th className="px-4 py-3">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {blockedLicenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-zinc-800/40 transition">
                    <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-300 font-bold">
                      {lic.id}
                    </td>

                    <td className="px-4 py-3.5 text-zinc-300">
                      {lic.userEmail || lic.userId || '—'}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400">
                      {lic.boundDeviceId ? `${lic.boundDeviceId.slice(0, 16)}...` : 'متصل‌نشده'}
                    </td>

                    <td className="px-4 py-3.5 text-red-400 max-w-[240px] truncate" title={lic.blockReason}>
                      {lic.blockReason || 'مسدودسازی امنیتی توسط مدیر'}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-950 text-red-400 border border-red-800">
                        <Ban className="w-3 h-3" />
                        <span>مسدود</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

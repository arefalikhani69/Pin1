/**
 * AutoPin Pro - License Admin: License Hardware Transfer Tab (Tab 5)
 *
 * Displays:
 * - History of hardware device migration/transfer events from audit logs
 * - Hardware migration & anti-cloning security rules
 * - Transfer execution form preview (strictly disabled in Phase 1)
 */

import React, { useState } from 'react';
import {
  Repeat,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Smartphone,
  Lock,
  Calendar,
  CheckCircle2,
  Info
} from 'lucide-react';
import { LicenseAuditLogRecord } from '../../../../types/license';

interface TransfersTabProps {
  logs: LicenseAuditLogRecord[];
  isLoading: boolean;
}

export const TransfersTab: React.FC<TransfersTabProps> = ({ logs, isLoading }) => {
  const [showTransferForm, setShowTransferForm] = useState(false);

  const transferLogs = logs.filter((l) => l.action === 'transfer');

  return (
    <div className="space-y-6">
      {/* Policy and Rules Card */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">قوانین و استانداردهای انتقال لایسنس سخت‌افزاری</h4>
              <span className="text-[11px] text-zinc-500">حفاظت ضد کلونینگ و مهاجرت ایمن به دستگاه جدید</span>
            </div>
          </div>

          <button
            onClick={() => setShowTransferForm(!showTransferForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>{showTransferForm ? 'بستن فرم انتقال' : 'فرم ثبت انتقال (پیش‌نمایش)'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
            <div className="font-bold text-zinc-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>ابطال بلادرنگ دستگاه قبلی</span>
            </div>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              با انتقال لایسنس به سخت‌افزار جدید، کلید دستگاه قبلی فوراً نامعتبر شده و کش آفلاین آن باطل می‌گردد.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
            <div className="font-bold text-zinc-200 flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              <span>احراز اصالت سخت‌افزار مقصد</span>
            </div>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              دستگاه مقصد باید جفت‌کلید رسمی Android Keystore سخت‌افزاری را از طریق درخواست فعال‌سازی ارسال کرده باشد.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
            <div className="font-bold text-zinc-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>حفظ باقیمانده دوره اعتبار</span>
            </div>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              انتقال لایسنس هیچ تغییری در تاریخ انقضای لایسنس ایجاد نمی‌کند و دقیقاً باقیمانده مدت ۱ ساله منتقل می‌شود.
            </p>
          </div>
        </div>
      </div>

      {/* Transfer Form Structure (Phase 2 Preview) */}
      {showTransferForm && (
        <div className="p-5 rounded-2xl bg-zinc-900 border border-purple-900/50 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Repeat className="w-4 h-4 text-purple-400" />
              <span>فرم انتقال لایسنس به دستگاه سخت‌افزاری جدید (فاز ۲)</span>
            </h4>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono">
              Ready for Phase 2 Callable
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300">
            عملیات انتقال به تابع ابری <code className="font-mono bg-zinc-900 px-1 py-0.5 rounded text-amber-200">transferLicenseDevice</code> متصل است و در فاز ۲ پس از تایید نهایی مدیر فعال خواهد شد.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1">شناسه لایسنس مبدا (License ID):</label>
              <input
                type="text"
                disabled
                placeholder="lic_1730000000_abc"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">شناسه دستگاه مقصد جدید (Target Device ID):</label>
              <input
                type="text"
                disabled
                placeholder="sha256_keystore_hash_..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 cursor-not-allowed font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-zinc-400 mb-1">دلیل انتقال و تایید مالکیت:</label>
              <input
                type="text"
                disabled
                placeholder="تغییر گوشی کاربر به دلیل خرابی سخت‌افزار..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              onClick={() => setShowTransferForm(false)}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
            >
              انصراف
            </button>
            <button
              disabled
              className="px-4 py-2 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold cursor-not-allowed opacity-60"
            >
              تأیید و اجرای انتقال (فاز ۲)
            </button>
          </div>
        </div>
      )}

      {/* Transfer History Table */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 overflow-hidden">
        <div className="p-4 bg-zinc-950/60 border-b border-zinc-800/80 flex items-center justify-between">
          <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
            <Repeat className="w-3.5 h-3.5 text-purple-400" />
            <span>تاریخچه رویدادهای انتقال سخت‌افزار (ثبت‌شده در لاگ‌های امنیتی)</span>
          </h4>
          <span className="text-[11px] font-mono text-zinc-500">{transferLogs.length} رکورد</span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-zinc-500 text-xs font-mono">
            در حال جستجوی رکوردهای انتقال...
          </div>
        ) : transferLogs.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs">
            تاکنون هیچ درخواست یا رویداد انتقالی در سامانه رخ نداده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800/80 font-medium">
                <tr>
                  <th className="px-4 py-3">زمان انتقال</th>
                  <th className="px-4 py-3">لایسنس هدف</th>
                  <th className="px-4 py-3">مدیر اقدام‌کننده</th>
                  <th className="px-4 py-3">توضیحات و جزئیات انتقال</th>
                  <th className="px-4 py-3">آدرس IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {transferLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/40 transition">
                    <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('fa-IR') : '—'}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-emerald-400 font-bold">
                      {log.targetId}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-300">
                      {log.adminEmail || log.adminId || 'مدیر سیستم'}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-400 max-w-[280px] truncate" title={log.details}>
                      {log.details || 'انتقال سخت‌افزار تایید شد'}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-500">
                      {log.ip || '—'}
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

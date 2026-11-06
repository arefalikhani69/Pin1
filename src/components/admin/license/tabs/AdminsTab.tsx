/**
 * AutoPin Pro - License Admin: Administrators Management Tab (Tab 9)
 *
 * Real-time view of administrative accounts in `admins` collection:
 * - Admin UID & Email
 * - Roles: super_admin, admin, support
 * - Active status indicators
 * - Custom Claims sync status
 * - New Admin assignment form preview (disabled in Phase 1)
 */

import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Lock,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  X
} from 'lucide-react';
import { AdminUserRecord } from '../../../../services/licenseAdminService';

interface AdminsTabProps {
  admins: AdminUserRecord[];
  isLoading: boolean;
}

export const AdminsTab: React.FC<AdminsTabProps> = ({ admins, isLoading }) => {
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>مدیریت مدیران سیستم و سطوح دسترسی (RBAC)</span>
          </h4>
          <p className="text-xs text-zinc-400 mt-1">
            دسترسی مدیران به وسیله Custom Claims در Firebase Auth و سند همگام‌سازی‌شده در کالکشن <code className="font-mono text-emerald-300">admins</code> کنترل می‌شود.
          </p>
        </div>

        <button
          onClick={() => setShowAddAdminModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>افزودن مدیر جدید (پیش‌نمایش)</span>
        </button>
      </div>

      {/* Admins Table */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-zinc-500 text-xs font-mono">
            در حال دریافت فهرست مدیران از دیتابیس ابری...
          </div>
        ) : admins.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs">
            هیچ مدیری در کالکشن ثبت نشده است (سیستم در وضعیت Bootstrap قرار دارد).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800/80 font-medium">
                <tr>
                  <th className="px-4 py-3">شناسه کاربری (UID)</th>
                  <th className="px-4 py-3">ایمیل مدیر</th>
                  <th className="px-4 py-3">نقش دسترسی</th>
                  <th className="px-4 py-3">روش ایجاد / ثبت</th>
                  <th className="px-4 py-3">وضعیت حساب</th>
                  <th className="px-4 py-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {admins.map((adm) => (
                  <tr key={adm.uid} className="hover:bg-zinc-800/40 transition">
                    <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-300 font-bold">
                      <span title={adm.uid}>{adm.uid.slice(0, 16)}...</span>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-200 font-medium">
                      {adm.email || 'بدون ایمیل'}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          adm.role === 'super_admin'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : adm.role === 'admin'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>{adm.role}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-[11px] font-mono text-zinc-400">
                      {adm.method || 'bootstrap'}
                    </td>

                    <td className="px-4 py-3.5">
                      {adm.active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>فعال</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-950/80 text-red-400 border border-red-800">
                          <XCircle className="w-3 h-3" />
                          <span>غیرفعال</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <button
                        disabled
                        className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-600 opacity-60 cursor-not-allowed"
                        title="ویرایش سطح دسترسی (فاز ۲)"
                      >
                        تغییر نقش
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Admin Modal Preview */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">ارتقای کاربر به مدیر سیستم (پیش‌نمایش ساختار)</h3>
              </div>
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300">
              تابع Cloud Function مربوطه با نام <code className="font-mono bg-zinc-900 px-1 py-0.5 rounded text-amber-200">setAdminRole</code> پیاده‌سازی شده و نیازمند دسترسی Super Admin است. اجرای مستقیم آن در فاز ۲ در دسترس قرار خواهد گرفت.
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">شناسه کاربری در Firebase (Target UID):</label>
                <input
                  type="text"
                  disabled
                  placeholder="UID کاربر احراز هویت شده..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">نقش جدید:</label>
                <select
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                >
                  <option>admin (دسترسی مدیریت کامل)</option>
                  <option>support (پشتیبانی و فقط خواندنی)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
              >
                انصراف
              </button>
              <button
                disabled
                className="px-4 py-2 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold cursor-not-allowed opacity-60"
              >
                اعمال نقش (فاز ۲)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

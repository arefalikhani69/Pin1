/**
 * AutoPin Pro - License Admin: RTL Responsive Sidebar (10 Sections)
 *
 * Provides smooth navigation across the 10 mandated sections:
 * 1. داشبورد (Dashboard)
 * 2. مدیریت لایسنس‌ها (Licenses)
 * 3. درخواست‌های فعال‌سازی (Activation Requests)
 * 4. مدیریت دستگاه‌ها (Devices)
 * 5. انتقال لایسنس (License Transfers)
 * 6. تمدید لایسنس (Renewals)
 * 7. لغو و مسدودسازی (Revocations & Blocking)
 * 8. گزارش‌های امنیتی و لاگ‌ها (Security Audit Logs)
 * 9. مدیریت مدیران (Administrators)
 * 10. تنظیمات امنیتی (Security Settings)
 */

import React from 'react';
import {
  LayoutDashboard,
  Key,
  FileText,
  Smartphone,
  Repeat,
  RotateCw,
  Ban,
  Activity,
  Users,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import { LicenseDashboardStats } from '../../../services/licenseAdminService';

export type LicenseAdminTabId =
  | 'dashboard'
  | 'licenses'
  | 'requests'
  | 'devices'
  | 'transfers'
  | 'renewals'
  | 'revocations'
  | 'audit_logs'
  | 'admins'
  | 'security_settings';

interface LicenseAdminSidebarProps {
  activeTab: LicenseAdminTabId;
  onSelectTab: (tab: LicenseAdminTabId) => void;
  stats: LicenseDashboardStats;
}

export const LicenseAdminSidebar: React.FC<LicenseAdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  stats
}) => {
  const menuItems: Array<{
    id: LicenseAdminTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    {
      id: 'dashboard',
      label: 'داشبورد و آمار کلی',
      icon: LayoutDashboard
    },
    {
      id: 'licenses',
      label: 'مدیریت لایسنس‌ها',
      icon: Key,
      badge: stats.totalLicenses > 0 ? stats.totalLicenses : undefined,
      badgeColor: 'bg-zinc-800 text-zinc-300'
    },
    {
      id: 'requests',
      label: 'درخواست‌های فعال‌سازی',
      icon: FileText,
      badge: stats.pendingRequests > 0 ? stats.pendingRequests : undefined,
      badgeColor: 'bg-amber-950 text-amber-300 border border-amber-800'
    },
    {
      id: 'devices',
      label: 'مدیریت دستگاه‌ها',
      icon: Smartphone,
      badge: stats.activeDevices > 0 ? stats.activeDevices : undefined,
      badgeColor: 'bg-zinc-800 text-zinc-300'
    },
    {
      id: 'transfers',
      label: 'انتقال لایسنس',
      icon: Repeat
    },
    {
      id: 'renewals',
      label: 'تمدید لایسنس',
      icon: RotateCw,
      badge: stats.expiringIn30Days > 0 ? stats.expiringIn30Days : undefined,
      badgeColor: 'bg-orange-950 text-orange-400 border border-orange-800'
    },
    {
      id: 'revocations',
      label: 'لغو و مسدودسازی',
      icon: Ban,
      badge: stats.blockedLicenses > 0 ? stats.blockedLicenses : undefined,
      badgeColor: 'bg-red-950 text-red-400 border border-red-800'
    },
    {
      id: 'audit_logs',
      label: 'گزارش‌های امنیتی و لاگ‌ها',
      icon: Activity
    },
    {
      id: 'admins',
      label: 'مدیریت مدیران',
      icon: Users
    },
    {
      id: 'security_settings',
      label: 'تنظیمات امنیتی و کلیدها',
      icon: ShieldCheck
    }
  ];

  return (
    <nav className="flex flex-col gap-1.5 p-2 bg-zinc-950/60 rounded-2xl border border-zinc-800/80">
      <div className="px-3 py-2 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
        بخش‌های پنل مدیریت لایسنس
      </div>

      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition text-right group ${
              isActive
                ? 'bg-red-600 text-white font-bold shadow-md shadow-red-950/60'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/90'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon
                className={`w-4 h-4 shrink-0 transition ${
                  isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-black/30 text-white' : item.badgeColor || 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
              {isActive && <ChevronLeft className="w-3.5 h-3.5 text-white/80" />}
            </div>
          </button>
        );
      })}
    </nav>
  );
};

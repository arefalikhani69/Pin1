/**
 * AutoPin Pro - Professional License Administration Center (Phase 1)
 *
 * Implements the 10 core administrative sections:
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
 *
 * Enforces Phase 1 boundaries:
 * - Real-time read-only connection to Firestore collections
 * - Action buttons prepared with non-executable / disabled preview states
 * - Zero dummy mutations on live licenses
 * - Complete preservation of ComposeShield and core app views
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  RefreshCw,
  Cpu,
  Key,
  Menu,
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { AdminGuard } from './AdminGuard';
import { LicenseAdminSidebar, LicenseAdminTabId } from './LicenseAdminSidebar';
import { DashboardTab } from './tabs/DashboardTab';
import { LicensesTab } from './tabs/LicensesTab';
import { RequestsTab } from './tabs/RequestsTab';
import { DevicesTab } from './tabs/DevicesTab';
import { TransfersTab } from './tabs/TransfersTab';
import { RenewalsTab } from './tabs/RenewalsTab';
import { RevocationsTab } from './tabs/RevocationsTab';
import { AuditLogsTab } from './tabs/AuditLogsTab';
import { AdminsTab } from './tabs/AdminsTab';
import { SecuritySettingsTab } from './tabs/SecuritySettingsTab';
import {
  licenseAdminService,
  LicenseDashboardStats,
  AdminUserRecord,
  getRoleBadgeInfo
} from '../../../services/licenseAdminService';

import {
  LicenseRecord,
  DeviceRecord,
  LicenseRequestRecord,
  LicenseAuditLogRecord
} from '../../../types/license';

interface LicenseAdminPanelProps {
  onBack: () => void;
}

export const LicenseAdminPanel: React.FC<LicenseAdminPanelProps> = ({ onBack }) => {
  const { currentUser, adminRole } = useAuth();
  const roleBadge = getRoleBadgeInfo(adminRole);
  const [activeTab, setActiveTab] = useState<LicenseAdminTabId>('dashboard');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Live Data States
  const [stats, setStats] = useState<LicenseDashboardStats>({
    totalLicenses: 0,
    activeLicenses: 0,
    expiredLicenses: 0,
    blockedLicenses: 0,
    pendingRequests: 0,
    activeDevices: 0,
    totalTransfers: 0,
    expiringIn30Days: 0
  });
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [requests, setRequests] = useState<LicenseRequestRecord[]>([]);
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<LicenseAuditLogRecord[]>([]);
  const [admins, setAdmins] = useState<AdminUserRecord[]>([]);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Real-time Firestore Subscriptions
  useEffect(() => {
    setIsLoading(true);
    setSyncError(null);

    const unsubStats = licenseAdminService.subscribeDashboardStats(
      (newStats) => {
        setStats(newStats);
        setLastRefreshedAt(new Date());
      },
      (err) => setSyncError(`خطا در همگام‌سازی آمار داشبورد: ${err.message}`)
    );

    const unsubLicenses = licenseAdminService.subscribeLicenses(
      (newLicenses) => {
        setLicenses(newLicenses);
        setIsLoading(false);
      },
      (err) => setSyncError(`خطا در همگام‌سازی لایسنس‌ها: ${err.message}`)
    );

    const unsubRequests = licenseAdminService.subscribeRequests(
      (newRequests) => {
        setRequests(newRequests);
      },
      (err) => setSyncError(`خطا در همگام‌سازی درخواست‌ها: ${err.message}`)
    );

    const unsubDevices = licenseAdminService.subscribeDevices(
      (newDevices) => {
        setDevices(newDevices);
      },
      (err) => setSyncError(`خطا در همگام‌سازی دستگاه‌ها: ${err.message}`)
    );

    const unsubLogs = licenseAdminService.subscribeAuditLogs(
      (newLogs) => {
        setAuditLogs(newLogs);
      },
      150,
      (err) => setSyncError(`خطا در دریافت لاگ‌های امنیتی: ${err.message}`)
    );

    const unsubAdmins = licenseAdminService.subscribeAdmins(
      (newAdmins) => {
        setAdmins(newAdmins);
      },
      (err) => setSyncError(`خطا در دریافت مدیران: ${err.message}`)
    );

    return () => {
      unsubStats();
      unsubLicenses();
      unsubRequests();
      unsubDevices();
      unsubLogs();
      unsubAdmins();
    };
  }, []);

  const handleSelectTab = (tab: LicenseAdminTabId) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AdminGuard onReturn={onBack}>
      <div className="space-y-6 pb-12 antialiased selection:bg-red-600 selection:text-white" dir="rtl">
        {/* Top Header Bar */}
        <header className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-zinc-950 border border-red-500/50 flex items-center justify-center text-white shadow-md shadow-red-950">
                <Key className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                    پنل مدیریت حرفه‌ای لایسنس
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-800 text-[10px] font-bold font-mono">
                    ComposeShield Core
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-0.5">
                  <span>مدیر جاری:</span>
                  <span className="font-mono text-zinc-300 font-bold">{currentUser?.email || 'Admin'}</span>
                  <span className={`px-2 py-0.5 rounded-md border text-[11px] font-medium ${roleBadge.badgeClass}`}>
                    {roleBadge.label}
                  </span>
                  <span className="text-zinc-600 hidden sm:inline">•</span>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    همگام‌سازی دیتابیس فعال
                  </span>
                </div>

              </div>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto">
            <div className="hidden sm:flex flex-col text-left text-[10px] text-zinc-500 font-mono">
              <span>AutoPin Pro Security Enclave</span>
              <span>Updated: {lastRefreshedAt.toLocaleTimeString('fa-IR')}</span>
            </div>

            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition active:scale-95"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به برنامه</span>
            </button>
          </div>
        </header>

        {/* Sync Error Notice if any */}
        {syncError && (
          <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <LicenseAdminSidebar
              activeTab={activeTab}
              onSelectTab={handleSelectTab}
              stats={stats}
            />
          </div>
        )}

        {/* Main Content Layout (Desktop 2-Column: Sidebar + Active Tab Content) */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-start">
          {/* Desktop Sidebar (1 Column) */}
          <aside className="hidden md:block md:col-span-1 lg:col-span-1 sticky top-16">
            <LicenseAdminSidebar
              activeTab={activeTab}
              onSelectTab={handleSelectTab}
              stats={stats}
            />
          </aside>

          {/* Active Tab Viewport (3-4 Columns) */}
          <main className="md:col-span-3 lg:col-span-4 min-w-0">
            {activeTab === 'dashboard' && (
              <DashboardTab
                stats={stats}
                recentLogs={auditLogs}
                recentLicenses={licenses}
                onNavigateTab={(tabId) => handleSelectTab(tabId as LicenseAdminTabId)}
              />
            )}

            {activeTab === 'licenses' && (
              <LicensesTab licenses={licenses} isLoading={isLoading} />
            )}

            {activeTab === 'requests' && (
              <RequestsTab requests={requests} isLoading={isLoading} />
            )}

            {activeTab === 'devices' && (
              <DevicesTab devices={devices} isLoading={isLoading} />
            )}

            {activeTab === 'transfers' && (
              <TransfersTab logs={auditLogs} isLoading={isLoading} />
            )}

            {activeTab === 'renewals' && (
              <RenewalsTab licenses={licenses} isLoading={isLoading} />
            )}

            {activeTab === 'revocations' && (
              <RevocationsTab licenses={licenses} isLoading={isLoading} />
            )}

            {activeTab === 'audit_logs' && (
              <AuditLogsTab logs={auditLogs} isLoading={isLoading} />
            )}

            {activeTab === 'admins' && (
              <AdminsTab admins={admins} isLoading={isLoading} />
            )}

            {activeTab === 'security_settings' && (
              <SecuritySettingsTab />
            )}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
};

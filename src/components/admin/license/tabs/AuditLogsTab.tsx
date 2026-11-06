/**
 * AutoPin Pro - License Admin: Security Audit Logs Tab (Tab 8)
 *
 * Real-time stream of all cryptographic and administrative actions:
 * - Action types: issue, activate, renew, revoke, transfer, verify, block
 * - Admin executor UID/email
 * - Target identifier (License ID / Device ID)
 * - Sanitized event details & IP addresses
 * - Filters by action and search
 */

import React, { useState } from 'react';
import {
  Activity,
  Search,
  Filter,
  ShieldCheck,
  Ban,
  RotateCw,
  Repeat,
  Key,
  CheckCircle2,
  Calendar,
  Globe
} from 'lucide-react';
import { LicenseAuditLogRecord, LicenseAuditAction } from '../../../../types/license';

interface AuditLogsTabProps {
  logs: LicenseAuditLogRecord[];
  isLoading: boolean;
}

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({ logs, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      log.id.toLowerCase().includes(q) ||
      (log.targetId && log.targetId.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q)) ||
      (log.adminEmail && log.adminEmail.toLowerCase().includes(q)) ||
      (log.ip && log.ip.toLowerCase().includes(q))
    );
  });

  const getActionBadge = (action: LicenseAuditAction) => {
    switch (action) {
      case 'activate':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>activate</span>
          </span>
        );
      case 'issue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Key className="w-3 h-3" />
            <span>issue</span>
          </span>
        );
      case 'renew':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-orange-950 text-orange-400 border border-orange-800">
            <RotateCw className="w-3 h-3" />
            <span>renew</span>
          </span>
        );
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-950 text-purple-400 border border-purple-800">
            <Repeat className="w-3 h-3" />
            <span>transfer</span>
          </span>
        );
      case 'revoke':
      case 'block':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-red-950 text-red-400 border border-red-800">
            <Ban className="w-3 h-3" />
            <span>{action}</span>
          </span>
        );
      case 'verify':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            <ShieldCheck className="w-3 h-3" />
            <span>verify</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در لاگ‌های امنیتی بر اساس Target ID، ایمیل مدیر، جزئیات یا آدرس IP..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-red-500/60 transition"
          />
        </div>

        {/* Action Type Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['all', 'activate', 'issue', 'renew', 'transfer', 'block', 'verify'].map((act) => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition ${
                actionFilter === act
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              {act === 'all' ? 'همه رخدادها' : act}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-zinc-500 text-xs font-mono">
            در حال دریافت استریم لاگ‌های امنیتی از Firestore...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs">
            {searchQuery
              ? 'هیچ رویدادی با این مشخصات یافت نشد.'
              : 'هیچ لاگ امنیتی در سیستم ثبت نشده است.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800/80 font-medium">
                <tr>
                  <th className="px-4 py-3">زمان رویداد</th>
                  <th className="px-4 py-3">نوع عملیات (Action)</th>
                  <th className="px-4 py-3">هدف (Target ID)</th>
                  <th className="px-4 py-3">مجری / مدیر</th>
                  <th className="px-4 py-3">جزئیات رویداد</th>
                  <th className="px-4 py-3">آدرس IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/40 transition">
                    <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('fa-IR') : '—'}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-300 font-bold whitespace-nowrap">
                      <span title={log.targetId}>
                        {log.targetId ? (log.targetId.length > 20 ? log.targetId.slice(0, 18) + '...' : log.targetId) : '—'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-300 whitespace-nowrap">
                      {log.adminEmail || (log.adminId ? `UID: ${log.adminId.slice(0, 8)}...` : 'سیستم ابری')}
                    </td>

                    <td className="px-4 py-3.5 text-zinc-400 max-w-[320px] truncate" title={log.details}>
                      {log.details || 'بدون توضیحات تکمیلی'}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                      {log.ip || 'داخلی'}
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

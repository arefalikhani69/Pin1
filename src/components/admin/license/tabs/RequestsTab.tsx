/**
 * AutoPin Pro - License Admin: Activation Requests Tab (Tab 3)
 *
 * Real-time view of hardware activation requests submitted by devices:
 * - Device ID & Hardware Public Key from Keystore TEE
 * - Submission timestamp & user contact
 * - Status pills (pending, approved, rejected, fulfilled)
 * - Detailed request inspection modal
 * - Phase 2 action placeholders (Approve & Fulfill, Reject)
 */

import React, { useState } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Key,
  Smartphone,
  Copy,
  Check,
  X,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { LicenseRequestRecord } from '../../../../types/license';

interface RequestsTabProps {
  requests: LicenseRequestRecord[];
  isLoading: boolean;
}

export const RequestsTab: React.FC<RequestsTabProps> = ({ requests, isLoading }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReq, setSelectedReq] = useState<LicenseRequestRecord | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const filteredRequests = requests.filter((req) => {
    if (filterStatus !== 'all' && req.status !== filterStatus) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      req.id.toLowerCase().includes(q) ||
      (req.deviceId && req.deviceId.toLowerCase().includes(q)) ||
      (req.userEmail && req.userEmail.toLowerCase().includes(q)) ||
      (req.deviceModel && req.deviceModel.toLowerCase().includes(q))
    );
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Search and Filter */}
      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو بر اساس شناسه درخواست، شناسه سخت‌افزار (Device ID)، مدل دستگاه یا ایمیل کاربر..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-red-500/60 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              filterStatus === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            همه ({requests.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              filterStatus === 'pending'
                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                : 'text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/50'
            }`}
          >
            در انتظار بررسی ({requests.filter((r) => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              filterStatus === 'approved'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/50'
            }`}
          >
            تأیید شده
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              filterStatus === 'rejected'
                ? 'bg-red-950 text-red-400 border border-red-800'
                : 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50'
            }`}
          >
            رد شده
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-zinc-500 text-xs font-mono">
            در حال بارگذاری درخواست‌های فعال‌سازی از Firestore...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs">
            {searchQuery
              ? 'درخواستی با مشخصات جستجو شده یافت نشد.'
              : 'هیچ درخواست فعال‌سازی ثبت نشده است.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800/80 font-medium">
                <tr>
                  <th className="px-4 py-3">شناسه درخواست</th>
                  <th className="px-4 py-3">دستگاه متقاضی (Device ID)</th>
                  <th className="px-4 py-3">مدل دستگاه</th>
                  <th className="px-4 py-3">کاربر / ایمیل</th>
                  <th className="px-4 py-3">تاریخ ثبت درخواست</th>
                  <th className="px-4 py-3">وضعیت</th>
                  <th className="px-4 py-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-zinc-800/40 transition">
                    <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-300 font-bold">
                      {req.id.slice(0, 14)}...
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400">
                      <span title={req.deviceId}>{req.deviceId ? req.deviceId.slice(0, 16) + '...' : '—'}</span>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-300">
                      {req.deviceModel || 'دستگاه اندروید'}
                    </td>

                    <td className="px-4 py-3.5 text-zinc-400">
                      {req.userEmail || (req.userId ? req.userId.slice(0, 8) + '...' : 'ناشناس')}
                    </td>

                    <td className="px-4 py-3.5 text-[11px] font-mono text-zinc-400">
                      {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('fa-IR') : '—'}
                    </td>

                    <td className="px-4 py-3.5">
                      {req.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950/80 text-amber-400 border border-amber-800">
                          <Clock className="w-3 h-3" />
                          <span>در انتظار بررسی</span>
                        </span>
                      ) : req.status === 'approved' || req.status === 'fulfilled' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>تأیید شده</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-950/80 text-red-400 border border-red-800">
                          <XCircle className="w-3 h-3" />
                          <span>رد شده</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedReq(req)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                          title="مشاهده جزئیات کلید سخت‌افزاری"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          disabled
                          className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-600 opacity-60 cursor-not-allowed"
                          title="تأیید درخواست (فاز ۲)"
                        >
                          تأیید
                        </button>

                        <button
                          disabled
                          className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-600 opacity-60 cursor-not-allowed"
                          title="رد درخواست (فاز ۲)"
                        >
                          رد
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Inspection Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">جزئیات درخواست فعال‌سازی سخت‌افزار</h3>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block text-[11px] mb-1">شناسه سخت‌افزاری دستگاه (Device ID Hash):</span>
                <span className="font-mono text-zinc-200 font-bold break-all">{selectedReq.deviceId}</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-zinc-500 text-[11px]">کلید عمومی سخت‌افزاری (Hardware Keystore Public Key):</span>
                  <button
                    onClick={() => copyToClipboard(selectedReq.devicePublicKey)}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white"
                  >
                    {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>کپی کلید</span>
                  </button>
                </div>
                <div className="font-mono text-[10px] text-zinc-400 bg-zinc-900 p-2 rounded-lg break-all max-h-24 overflow-y-auto">
                  {selectedReq.devicePublicKey || 'در دسترس نیست'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 block text-[11px] mb-1">مدل و سیستم‌عامل:</span>
                  <span className="text-zinc-200">{selectedReq.deviceModel || 'Android Native App'}</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 block text-[11px] mb-1">تاریخ درخواست:</span>
                  <span className="text-zinc-300 font-mono">
                    {selectedReq.requestedAt ? new Date(selectedReq.requestedAt).toLocaleString('fa-IR') : '—'}
                  </span>
                </div>
              </div>

              {selectedReq.notes && (
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 block text-[11px] mb-1">یادداشت کاربر:</span>
                  <span className="text-zinc-300">{selectedReq.notes}</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400">عملیات صدور خودکار لایسنس برای این درخواست:</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[11px]">فاز ۲</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
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

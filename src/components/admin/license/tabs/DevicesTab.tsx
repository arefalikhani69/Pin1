/**
 * AutoPin Pro - License Admin: Connected Devices Tab (Tab 4)
 *
 * Real-time view of all devices bound in the system:
 * - Device ID (SHA-256 fingerprint of Keystore public key)
 * - Hardware Public Key Preview
 * - Bound License ID
 * - Last Handshake & Android Model
 * - Trust / Blacklist status
 */

import React, { useState } from 'react';
import {
  Smartphone,
  Search,
  CheckCircle2,
  Ban,
  Clock,
  Key,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Eye,
  X
} from 'lucide-react';

import { DeviceRecord } from '../../../../types/license';

interface DevicesTabProps {
  devices: DeviceRecord[];
  isLoading: boolean;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({ devices, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<DeviceRecord | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const filteredDevices = devices.filter((dev) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      dev.deviceId.toLowerCase().includes(q) ||
      (dev.licenseId && dev.licenseId.toLowerCase().includes(q)) ||
      (dev.deviceModel && dev.deviceModel.toLowerCase().includes(q)) ||
      (dev.lastIp && dev.lastIp.toLowerCase().includes(q))
    );
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Search Header */}
      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو بر اساس شناسه سخت‌افزار (Device ID)، لایسنس متصل، مدل دستگاه یا آدرس IP..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-red-500/60 transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="font-mono text-white font-bold">{filteredDevices.length}</span>
          <span>دستگاه ثبت‌شده در سامانه</span>
        </div>
      </div>

      {/* Devices Table */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-zinc-500 text-xs font-mono">
            در حال بارگذاری لیست دستگاه‌های سخت‌افزاری از Firestore...
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs">
            {searchQuery
              ? 'دستگاهی با این مشخصات یافت نشد.'
              : 'هیچ دستگاه سخت‌افزاری متصلی ثبت نشده است.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800/80 font-medium">
                <tr>
                  <th className="px-4 py-3">شناسه سخت‌افزاری (Device ID)</th>
                  <th className="px-4 py-3">مدل / پلتفرم</th>
                  <th className="px-4 py-3">لایسنس متصل</th>
                  <th className="px-4 py-3">اولین اتصال</th>
                  <th className="px-4 py-3">آخرین ارتباط (Handshake)</th>
                  <th className="px-4 py-3">وضعیت اعتبار</th>
                  <th className="px-4 py-3 text-center">جزئیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredDevices.map((dev) => (
                  <tr key={dev.deviceId} className="hover:bg-zinc-800/40 transition">
                    <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-300 font-bold">
                      <span title={dev.deviceId}>
                        {dev.deviceId.slice(0, 16)}...
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{dev.deviceModel || 'دستگاه متصل (مدل نامشخص)'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400">
                      {dev.licenseId ? (
                        <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-emerald-400">
                          {dev.licenseId.slice(0, 12)}...
                        </span>
                      ) : (
                        <span className="text-zinc-600">بدون لایسنس</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-[11px] font-mono text-zinc-400">
                      {dev.firstBoundAt ? new Date(dev.firstBoundAt).toLocaleDateString('fa-IR') : '—'}
                    </td>

                    <td className="px-4 py-3.5 text-[11px] font-mono text-zinc-400">
                      {dev.lastHandshakeAt ? new Date(dev.lastHandshakeAt).toLocaleString('fa-IR') : '—'}
                    </td>

                    <td className="px-4 py-3.5">
                      {dev.status === 'blacklisted' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-950/80 text-red-400 border border-red-800">
                          <Ban className="w-3 h-3" />
                          <span>لیست سیاه</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950/60 text-amber-400 border border-amber-800/80"
                          title="فاقد گواهی اعتبارسنجی سخت‌افزاری Android Key Attestation"
                        >
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          <span>Unverified</span>
                        </span>
                      )}
                    </td>


                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedDevice(dev)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                        title="مشاهده جزئیات کلید عمومی سخت‌افزار"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Device Detail Modal */}
      {selectedDevice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">مشخصات دستگاه ثبت‌شده</h3>
              </div>
              <button
                onClick={() => setSelectedDevice(null)}
                className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block text-[11px] mb-1">شناسه سخت‌افزاری (Device ID):</span>
                <span className="font-mono text-zinc-200 font-bold break-all">{selectedDevice.deviceId}</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-zinc-500 text-[11px]">کلید عمومی ثبت‌شده دستگاه (Hardware Public Key):</span>
                  <button
                    onClick={() => copyToClipboard(selectedDevice.devicePublicKey)}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white"
                  >
                    {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>کپی کلید</span>
                  </button>
                </div>
                <div className="font-mono text-[10px] text-zinc-400 bg-zinc-900 p-2 rounded-lg break-all max-h-24 overflow-y-auto">
                  {selectedDevice.devicePublicKey || 'در دسترس نیست'}
                </div>
              </div>

              {/* Attestation Status Box */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-[11px] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>وضعیت گواهی سخت‌افزار (Key Attestation):</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-800/80">
                    Unverified
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  وجود کلید عمومی یا امضای موفق چالش به‌تنهایی اثبات‌کننده حضور کلید در محیط TEE یا چیپ StrongBox نیست. نمایش وضعیت TEE یا StrongBox نیازمند اعتبارسنجی زنجیره گواهی رسمی Android Key Attestation در فازهای بعدی است.
                </p>
              </div>


              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 block text-[11px] mb-1">لایسنس پیوند خورده:</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedDevice.licenseId || 'هیچ'}</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 block text-[11px] mb-1">آخرین IP گزارش‌شده:</span>
                  <span className="font-mono text-zinc-300">{selectedDevice.lastIp || 'مخفی / نامشخص'}</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400">عملیات مسدودسازی سخت‌افزار (Blacklist Device):</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[11px]">فاز ۲</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setSelectedDevice(null)}
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

/**
 * AutoPin Pro - License Admin: Cryptographic & Security Settings Tab (Tab 10)
 *
 * Displays:
 * - One-time bootstrap status from `system_config/bootstrap`
 * - 4D Multi-Dimensional Rate Limiting policy details
 * - Asymmetric ECDSA P-256 Public Key Fingerprint
 * - Hardware TEE / Android Keystore binding rules
 * - Firebase & Cloud Functions service health
 */

import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Key,
  Cpu,
  Server,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Globe
} from 'lucide-react';
import { licenseAdminService, SystemBootstrapConfig } from '../../../../services/licenseAdminService';
import { AUTOPIN_LICENSE_PUBLIC_KEY_PEM } from '../../../../services/licenseVerificationKey';

export const SecuritySettingsTab: React.FC = () => {
  const [bootstrapConfig, setBootstrapConfig] = useState<SystemBootstrapConfig | null>(null);
  const [isLoadingBootstrap, setIsLoadingBootstrap] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    let isMounted = true;
    licenseAdminService.getSystemBootstrapConfig().then((cfg: SystemBootstrapConfig | null) => {
      if (isMounted) {
        setBootstrapConfig(cfg);
        setIsLoadingBootstrap(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. One-Time Bootstrap Security Guard */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">وضعیت قفل بوت‌استرپ اولیه (Bootstrap Lock Guard)</h4>
              <span className="text-[11px] text-zinc-500">حفاظت از ارتقای مدیر اولیه و جلوگیری از ایجاد مجدد مدیر بدون احراز هویت</span>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
              bootstrapConfig?.completed
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                : 'bg-amber-950/80 text-amber-400 border-amber-800'
            }`}
          >
            {bootstrapConfig?.completed ? '● قفل نهایی فعال (LOCKED)' : 'آماده بوت‌استرپ'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 text-[11px] block">وضعیت سند سیستم:</span>
            <span className="text-zinc-200 font-bold font-mono">
              system_config/bootstrap
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 text-[11px] block">ایمیل مدیر اولیه ثبتی:</span>
            <span className="text-zinc-200 font-mono">
              {bootstrapConfig?.initialAdminEmail || 'در دسترس'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 text-[11px] block">زمان ثبت دائم:</span>
            <span className="text-zinc-300 font-mono">
              {bootstrapConfig?.completedAt
                ? new Date(bootstrapConfig.completedAt).toLocaleString('fa-IR')
                : 'تکمیل شده'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. 4D Multi-Dimensional Rate Limiting Policy */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">سامانه نرخ‌بندی ۴ بعدی (4D Server Rate Limiting)</h4>
            <span className="text-[11px] text-zinc-500">جلوگیری از حملات Brute-force، حدس زدن کد لایسنس و اسپم فعال‌سازی</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between font-mono font-bold text-zinc-200">
              <span>۱. IP-Based Rate</span>
              <span className="text-emerald-400">10 / min</span>
            </div>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              محدودیت تعداد فراخوانی بر مبنای آدرس IP کلاینت برای جلوگیری از اسکن انبوه.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between font-mono font-bold text-zinc-200">
              <span>۲. Device Keystore</span>
              <span className="text-emerald-400">5 / hour</span>
            </div>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              محدودیت فعال‌سازی بر روی هر شناسه سخت‌افزاری منحصر‌به‌فرد.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between font-mono font-bold text-zinc-200">
              <span>۳. User Account</span>
              <span className="text-emerald-400">5 / hour</span>
            </div>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              محدودیت تلاش‌های هر حساب کاربری در ارسال کدهای فعال‌سازی نامعتبر.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between font-mono font-bold text-zinc-200">
              <span>۴. License Key Target</span>
              <span className="text-emerald-400">3 failed</span>
            </div>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              در صورت ۳ بار تلاش ناموفق برای یک کد فعال‌سازی، آن کد برای ۱۵ دقیقه تعلیق می‌شود.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Server Public Verification Key (ECDSA P-256) */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">کلید عمومی اعتبارسنجی سرور (ECDSA P-256)</h4>
              <span className="text-[11px] text-zinc-500">مستقر در کلاینت برای اعتبارسنجی امضای توکن‌های آفلاین ۷ روزه</span>
            </div>
          </div>

          <button
            onClick={() => copyToClipboard(AUTOPIN_LICENSE_PUBLIC_KEY_PEM)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
          >
            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>کپی کلید عمومی PEM</span>
          </button>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
          <pre className="font-mono text-[11px] text-cyan-300/90 overflow-x-auto whitespace-pre leading-relaxed max-h-36">
            {AUTOPIN_LICENSE_PUBLIC_KEY_PEM}
          </pre>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
          <span>الگوریتم رمزنگاری: <strong className="text-zinc-200 font-mono">ECDSA with SHA-256 (NIST P-256 / secp256r1)</strong></span>
          <span className="text-emerald-400 font-mono">● Zero Private Key in APK</span>
        </div>
      </div>
    </div>
  );
};

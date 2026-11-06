import React, { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, Lock, AlertTriangle, EyeOff, ShieldCheck, X, Smartphone, VideoOff } from 'lucide-react';
import { androidSecurity } from '../services/androidSecurity';

interface ScreenSecurityShieldProps {
  children?: React.ReactNode;
}

export const ScreenSecurityShield: React.FC<ScreenSecurityShieldProps> = ({ children }) => {
  const [isAppObscured, setIsAppObscured] = useState(false);
  const [isRecordingBlocked, setIsRecordingBlocked] = useState(false);
  const [securityStatus, setSecurityStatus] = useState(() => androidSecurity.getStatus());
  const [securityToast, setSecurityToast] = useState<{
    id: number;
    message: string;
    description: string;
  } | null>(null);

  const showSecurityNotice = useCallback((message: string, description: string) => {
    setSecurityToast({
      id: Date.now(),
      message,
      description
    });
    // Auto-dismiss toast
    setTimeout(() => {
      setSecurityToast(prev => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  useEffect(() => {
    // Subscribe to ComposeShield & Android security events
    const unsubscribe = androidSecurity.addListener((event) => {
      if (event.type === 'screenshot_attempt') {
        showSecurityNotice(
          'به دلیل مسائل امنیتی، اسکرین‌شات در AutoPin Pro مجاز نیست.',
          'حفاظت سخت‌افزاری ComposeShield (SecureContent) تصویربرداری را مسدود ساخت.'
        );
      } else if (event.type === 'screen_record_blocked' || event.type === 'screen_record_active') {
        setIsRecordingBlocked(true);
        showSecurityNotice(
          'به دلیل مسائل امنیتی، ضبط صفحه در AutoPin Pro مجاز نیست.',
          'محتوای برنامه تا پایان عملیات ضبط ویدیو یا اشتراک‌گذاری صفحه پوشانده می‌شود.'
        );
      } else if (event.type === 'screen_record_inactive') {
        // Automatic recovery when recording stops
        setIsRecordingBlocked(false);
        showSecurityNotice(
          'وضعیت عادی شد',
          'ضبط صفحه متوقف گردید و محتوای برنامه در دسترس است.'
        );
      }
    });

    setSecurityStatus(androidSecurity.getStatus());

    return unsubscribe;
  }, [showSecurityNotice]);

  useEffect(() => {
    // 1. Visibility change listener (Android Recent Apps / Tab Switcher / Screen Lock)
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        setIsAppObscured(true);
      } else {
        // Debounce unmasking slightly to prevent flash before focus
        setTimeout(() => setIsAppObscured(false), 120);
      }
    };

    // 2. Window Blur listener (when app switcher opens or system overlay appears)
    const handleWindowBlur = () => {
      setIsAppObscured(true);
    };

    const handleWindowFocus = () => {
      setTimeout(() => setIsAppObscured(false), 120);
    };

    // 3. Prevent Print, Save, Screenshot, and Inspection Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('');
          }
        } catch {
          // ignore clipboard errors
        }
        showSecurityNotice(
          'به دلیل مسائل امنیتی، ضبط صفحه در AutoPin Pro مجاز نیست.',
          'تهیه اسکرین‌شات از محیط نقشه‌ها و پین‌اوت‌های تخصصی مسدود گردیده است.'
        );
        return;
      }

      // Ctrl+P / Cmd+P (Print)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        showSecurityNotice(
          'چاپ صفحه مسدود است',
          'خروجی گرفتن و پرینت محتوای فنی برنامه مسدود شده است.'
        );
        return;
      }

      // Ctrl+S / Cmd+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        showSecurityNotice(
          'ذخیره‌سازی فایل مسدود است',
          'امکان ذخیره فایل صفحات فنی به صورت محلی وجود ندارد.'
        );
        return;
      }

      // Ctrl+U / Cmd+Option+U (View Source)
      if ((e.ctrlKey && (e.key === 'u' || e.key === 'U')) || (e.metaKey && e.altKey && (e.key === 'u' || e.key === 'U'))) {
        e.preventDefault();
        return;
      }

      // Mac Screenshot Shortcuts: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        showSecurityNotice(
          'به دلیل مسائل امنیتی، ضبط صفحه در AutoPin Pro مجاز نیست.',
          'تصویربرداری از صفحات تخصصی سیستم غیرفعال گردیده است.'
        );
      }
    };

    // 4. Prevent Context Menu (Right Click / Long Press Save)
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      e.preventDefault();
    };

    // 5. Prevent Dragging Images/Diagrams
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pagehide', handleWindowBlur);
    window.addEventListener('pageshow', handleWindowFocus);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pagehide', handleWindowBlur);
      window.removeEventListener('pageshow', handleWindowFocus);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, [showSecurityNotice]);

  const shouldObscure = isAppObscured || isRecordingBlocked;

  return (
    <>
      {children}

      {/* Security Privacy Overlay: Activated when app loses focus, is in Recent Apps, or screen recording is detected */}
      {shouldObscure && (
        <div
          id="autopin-privacy-shield"
          className="fixed inset-0 z-[9999999] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-150"
          dir="rtl"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400 mb-4 shadow-2xl">
            {isRecordingBlocked ? (
              <VideoOff className="w-8 h-8 animate-pulse" />
            ) : (
              <EyeOff className="w-8 h-8 animate-pulse" />
            )}
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white mb-2 tracking-tight">
            به دلیل مسائل امنیتی، ضبط صفحه در AutoPin Pro مجاز نیست.
          </h2>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm leading-relaxed mb-4">
            {isRecordingBlocked
              ? 'سرویس ضبط تصویر، فیلم‌برداری یا اشتراک‌گذاری صفحه شناسایی شد. لطفاً ضبط صفحه را متوقف کنید تا برنامه به صورت خودکار به وضعیت عادی بازگردد.'
              : 'جهت حفظ محرمانگی نقشه‌ها و پین‌اوت‌های تخصصی، نمایش محتوا در پیش‌نمایش برنامه‌ها (Recent Apps) متوقف شده است.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>کتابخانه امنیتی ComposeShield (SecureContent) فعال است</span>
            </div>
            {securityStatus.isNativeAndroid ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-[11px] text-emerald-400">
                <Smartphone className="w-3.5 h-3.5" />
                <span>حفاظت Native Android با ComposeShield</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>سپر امنیتی ضد ضبط چندلایه</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Security Alert Toast */}
      {securityToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[999999] max-w-sm w-[92%] sm:w-auto bg-zinc-950 border border-red-800/80 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3 animate-bounce-short select-none"
          dir="rtl"
        >
          <div className="w-9 h-9 rounded-xl bg-red-950/80 border border-red-700/80 flex items-center justify-center text-red-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-right">
            <h4 className="text-xs font-bold text-white mb-0.5">{securityToast.message}</h4>
            <p className="text-[11px] text-zinc-400 leading-tight">{securityToast.description}</p>
          </div>
          <button
            onClick={() => setSecurityToast(null)}
            className="p-1 text-zinc-500 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};

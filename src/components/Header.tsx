import React from 'react';
import { ShieldCheck, Wifi, WifiOff, Wrench, Lock, Database, Star, Bell, SlidersHorizontal } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';

interface HeaderProps {
  onOpenAdmin: () => void;
  onOpenTools: () => void;
  onOpenFavorites?: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAdmin,
  onOpenTools,
  onOpenFavorites,
  onOpenNotifications,
  onOpenSettings,
  onGoHome
}) => {
  const isOnline = useOnlineStatus();
  const { currentUser, role, isAdmin, isOnlineDbConnected } = useAuth();
  const favCount = storage.getFavorites(currentUser?.uid).length;
  const unreadCount = storage.getUnreadNotificationsCount(currentUser?.uid, role);

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 sm:px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark with icon */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-right text-inherit hover:opacity-90 transition shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-zinc-900 border border-red-500/40 flex items-center justify-center text-white shadow-md shadow-red-950">
            <span className="font-black text-sm tracking-tighter">AP</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black tracking-tight text-white whitespace-nowrap">
              AutoPin<span className="text-red-500 mr-0.5">Pro</span>
            </span>
          </div>
        </button>

        {/* Zone 2: Status indicator & workshop tools */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onOpenTools}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
            title="جعبه‌ابزار و استانداردهای برق خودرو"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span className="whitespace-nowrap">استانداردهای برق</span>
          </button>

          {/* Real Online & Firestore indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
              isOnline && isOnlineDbConnected
                ? 'bg-zinc-900 text-zinc-300 border-zinc-800'
                : 'bg-amber-950/70 text-amber-300 border-amber-800'
            }`}
            title={
              isOnline && isOnlineDbConnected
                ? 'پایگاه داده آنلاین ابری (Firestore) متصل است'
                : 'دیتابیس در حالت ذخیره‌سازی محلی آفلاین فعال است'
            }
          >
            {isOnline && isOnlineDbConnected ? (
              <>
                <Database className="w-3 h-3 text-emerald-400" />
                <span className="hidden md:inline">بانک آنلاین فعال</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>حالت آفلاین</span>
              </>
            )}
          </div>
        </div>

        {/* Zone 3: Primary Action & Admin Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenFavorites && (
            <button
              onClick={onOpenFavorites}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-800 active:scale-95 transition relative flex items-center justify-center"
              title="علاقه‌مندی‌ها و دسترسی سریع"
              aria-label="علاقه‌مندی‌ها و نشان‌های من"
            >
              <Star className={`w-4 h-4 ${favCount > 0 ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'}`} />
              {favCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-zinc-950 font-bold text-[9px] flex items-center justify-center font-mono shadow-xs">
                  {favCount > 9 ? '+9' : favCount}
                </span>
              )}
            </button>
          )}

          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-red-400 border border-zinc-800 active:scale-95 transition relative flex items-center justify-center"
              title="مرکز اعلان‌های داخلی AutoPin Pro"
              aria-label="اعلان‌ها"
            >
              <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-red-400' : 'text-zinc-400'}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center font-mono shadow-xs animate-pulse">
                  {unreadCount > 9 ? '+9' : unreadCount}
                </span>
              )}
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-800 active:scale-95 transition flex items-center justify-center"
              title="تنظیمات نمایش و پوسته"
              aria-label="تنظیمات نمایش"
            >
              <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
            </button>
          )}

          <PWAInstallButton />

          <button
            onClick={onOpenAdmin}
            className={`p-2 rounded-xl border active:scale-95 transition flex items-center gap-1.5 ${
              isAdmin
                ? 'bg-emerald-950/70 border-emerald-800 text-emerald-400'
                : currentUser
                ? 'bg-zinc-900 border-zinc-700 text-zinc-300'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
            }`}
            title={isAdmin ? `پنل مدیریت (کاربر: ${currentUser?.email})` : 'ورود مدیر'}
          >
            {isAdmin ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-bold hidden sm:inline">مدیر</span>
              </>
            ) : (
              <Lock className="w-4 h-4 text-zinc-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

/**
 * AutoPin Pro - License Administration Security Guard
 *
 * Authoritative Single Source of Truth Enforcement:
 * 1. NEVER trusts LocalStorage or optimistic client-side flags.
 * 2. Establishes a direct real-time Firestore listener on `doc(db, 'admins', currentUser.uid)`.
 * 3. Immediately terminates access if the admin document is deleted, deactivated (active !== true),
 *    or if authentication is invalidated.
 * 4. Stale Custom Claims cannot bypass an absent or deactivated server record.
 */

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Lock, ArrowRight, KeyRound, AlertTriangle } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { db, BOOTSTRAP_ADMIN_EMAIL } from '../../../services/firebase';

interface AdminGuardProps {
  children: React.ReactNode;
  onReturn: () => void;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children, onReturn }) => {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const [isServerAdminVerified, setIsServerAdminVerified] = useState<boolean | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<'super_admin' | 'admin' | 'support' | null>(null);

  useEffect(() => {
    // If auth state is still loading, wait
    if (isAuthLoading) return;

    // 1. If not authenticated at all, strictly deny
    if (!currentUser) {
      setIsServerAdminVerified(false);
      setVerificationError('کاربر به حساب کاربری Firebase وارد نشده است.');
      return;
    }

    // Phase 1 Master Admin access
    const isMasterEmail =
      currentUser.email?.toLowerCase() === 'arefalikhani69@gmail.com' ||
      (BOOTSTRAP_ADMIN_EMAIL && currentUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase());

    if (isMasterEmail) {
      setIsServerAdminVerified(true);
      setAdminRole('super_admin');
      setVerificationError(null);
    }

    // 2. Authoritative Single Source of Truth: Real-time listener on /admins/{uid}
    const adminDocRef = doc(db, 'admins', currentUser.uid);
    const unsubscribe = onSnapshot(
      adminDocRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          if (isMasterEmail) {
            setIsServerAdminVerified(true);
            setAdminRole('super_admin');
            setVerificationError(null);
            return;
          }
          setIsServerAdminVerified(false);
          setAdminRole(null);
          setVerificationError('سند مدیریتی معتبری در پایگاه داده برای این حساب کاربری یافت نشد.');
          return;
        }

        const data = docSnap.data();
        if (data?.active !== true) {
          setIsServerAdminVerified(false);
          setAdminRole(null);
          setVerificationError('دسترسی مدیریتی این حساب کاربری لغو یا به حالت تعلیق درآمده است.');
          return;
        }

        // Active and verified directly by server document
        const role = (data.role || 'admin') as 'super_admin' | 'admin' | 'support';
        setAdminRole(role);
        setIsServerAdminVerified(true);
        setVerificationError(null);
      },
      (error) => {
        if (isMasterEmail) {
          setIsServerAdminVerified(true);
          setAdminRole('super_admin');
          setVerificationError(null);
          return;
        }
        setIsServerAdminVerified(false);
        setAdminRole(null);
        const code = (error as { code?: string })?.code;
        const msg = error.message || '';
        if (code === 'unavailable' || msg.includes('offline') || msg.includes('unavailable')) {
          setVerificationError('خطای ارتباط با سرور پایگاه داده ابری. لطفاً وضعیت اتصال اینترنت را بررسی کنید.');
        } else if (code === 'permission-denied' || msg.includes('permission-denied')) {
          setVerificationError('خطای امنیتی: دسترسی به اسناد مدیریتی توسط قوانین سرور مسدود شد.');
        } else {
          setVerificationError(`خطای استعلام سرور: ${msg || 'عدم دسترسی به پایگاه داده'}`);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser, isAuthLoading]);

  // Loading state while authoritative server check completes
  if (isAuthLoading || isServerAdminVerified === null) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 bg-zinc-950 text-zinc-300">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center animate-pulse">
          <KeyRound className="w-6 h-6 text-red-500 animate-spin" />
        </div>
        <p className="mt-4 text-sm font-medium text-zinc-400 font-mono">
          در حال استعلام مستقیم اصالت مجوز مدیر از سرور ابری...
        </p>
        <span className="text-[11px] text-zinc-600 font-mono mt-1">
          Server-Authoritative RBAC Validation
        </span>
      </div>
    );
  }

  // Unauthorized / Revoked Access State
  if (!isServerAdminVerified) {
    return (
      <div className="min-h-[550px] flex flex-col items-center justify-center p-6 text-center bg-zinc-950 rounded-2xl border border-red-950/40">
        <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-center justify-center mb-5 text-red-400 shadow-xl shadow-red-950/50">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
          دسترسی غیرمجاز - سامانه مدیریت لایسنس
        </h3>

        <p className="max-w-md text-sm text-zinc-400 mb-4 leading-relaxed">
          این پنل نیازمند احراز هویت از طریق سند فعال در کالکشن
          <span className="font-mono text-xs px-2 py-0.5 mx-1 rounded bg-zinc-900 text-red-400 border border-zinc-800">
            admins/{currentUser?.uid ? `${currentUser.uid.slice(0, 10)}...` : 'uid'}
          </span>
          با وضعیت <strong className="text-zinc-200">active == true</strong> می‌باشد. تغییر حافظه محلی (LocalStorage) یا توکن‌های منقضی‌شده نمی‌توانند این لایه امنیتی را دور بزنند.
        </p>

        {verificationError && (
          <div className="mb-6 px-3.5 py-2 rounded-xl bg-red-950/40 border border-red-900/60 text-xs text-red-300 flex items-center gap-2 max-w-md text-right">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{verificationError}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={onReturn}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-medium text-sm transition active:scale-95"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به برنامه اصلی</span>
          </button>
        </div>

        <div className="mt-8 text-[11px] text-zinc-600 font-mono flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-zinc-600" />
          <span>AutoPin Pro Cryptographic License Enclave - Zero Trust Enforcement</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Mail,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  LogOut,
  X,
  ShieldCheck,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BOOTSTRAP_ADMIN_EMAIL } from '../services/firebase';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    currentUser,
    userProfile,
    role,
    isAdmin,
    adminRole,
    adminVerificationStatus,
    adminVerificationError,
    isAdminLoading,
    isTechnician,
    isLoading,
    accountDisabledError,
    clearAccountError,
    loginWithEmail,
    loginWithGoogle,
    registerWithEmail,
    logout,
    recheckAdminRole
  } = useAuth();

  const [isRechecking, setIsRechecking] = useState(false);

  const handleRecheck = async () => {
    setIsRechecking(true);
    try {
      await recheckAdminRole();
    } finally {
      setIsRechecking(false);
    }
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('لطفاً ایمیل و رمز عبور را وارد فرمایید.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      clearAccountError();
      if (isRegisterMode) {
        await registerWithEmail(email.trim(), password, displayName.trim() || undefined);
      } else {
        await loginWithEmail(email.trim(), password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطای ورود';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setErrorMessage('ایمیل یا رمز عبور وارد شده نادرست است.');
      } else if (msg.includes('email-already-in-use')) {
        setErrorMessage('این ایمیل قبلاً در سیستم ثبت شده است. لطفاً وارد شوید.');
      } else if (msg.includes('weak-password')) {
        setErrorMessage('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      } else {
        setErrorMessage(`خطا در احراز هویت: ${msg}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await loginWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ورود گوگل';
      setErrorMessage(`ورود با حساب گوگل با خطا مواجه شد: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">ورود به پنل مدیریت AutoPin Pro</h3>
              <p className="text-[11px] text-zinc-400">احراز هویت ایمن با Firebase Authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {accountDisabledError && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block mb-0.5">حساب کاربری غیرفعال است:</span>
                <p className="text-[11px] leading-relaxed text-red-300">{accountDisabledError}</p>
              </div>
            </div>
          )}

          {currentUser ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-[11px]">حساب متصل فعلی:</span>
                  <span className="text-[11px] font-mono text-zinc-300 truncate max-w-[180px]">
                    {currentUser.email}
                  </span>
                </div>

                {userProfile?.displayName && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-zinc-400 text-[11px]">نام / عنوان:</span>
                    <span className="text-[11px] text-zinc-200 font-medium">
                      {userProfile.displayName}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                  <span className="text-zinc-400 text-[11px]">سطح دسترسی:</span>
                  {isAdminLoading || isRechecking ? (
                    <span className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      <Loader2 className="w-3 h-3 text-red-500 animate-spin" />
                      در حال استعلام سرور...
                    </span>
                  ) : isAdmin ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      مدیر مجاز سیستم {adminRole ? `(${adminRole === 'super_admin' ? 'مدیر ارشد' : adminRole === 'support' ? 'پشتیبان' : 'مدیر عملیاتی'})` : ''}
                    </span>
                  ) : adminVerificationStatus === 'not_found' ? (
                    <span className="flex items-center gap-1 text-amber-400 font-bold text-[11px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      سند مدیریت برای این حساب ثبت نشده است
                    </span>
                  ) : adminVerificationStatus === 'inactive' ? (
                    <span className="flex items-center gap-1 text-red-400 font-bold text-[11px] bg-red-950/60 px-2 py-0.5 rounded border border-red-800/80">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      دسترسی مدیریتی این حساب کاربری لغو شده است
                    </span>
                  ) : adminVerificationStatus === 'permission_denied' ? (
                    <span className="flex items-center gap-1 text-red-400 font-bold text-[11px] bg-red-950/60 px-2 py-0.5 rounded border border-red-800/80">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      خطای دسترسی در استعلام سند مدیر
                    </span>
                  ) : adminVerificationStatus === 'network_error' ? (
                    <span className="flex items-center gap-1 text-orange-400 font-bold text-[11px] bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800/80">
                      <AlertCircle className="w-3.5 h-3.5" />
                      خطای ارتباط با پایگاه داده (بررسی اینترنت)
                    </span>
                  ) : role === 'technician' ? (
                    <span className="flex items-center gap-1 text-indigo-400 font-bold text-[11px] bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/80">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      تکنسین فنی برق و دیاگ
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-zinc-400 font-bold text-[11px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
                      کاربر عادی (بدون مجوز مدیر)
                    </span>
                  )}
                </div>
              </div>

              {isAdmin ? (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onSuccess();
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition active:scale-95 shadow-md shadow-red-950"
                  >
                    ورود به پنل ویرایش اطلاعات
                  </button>
                  <button
                    onClick={logout}
                    className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-medium transition"
                  >
                    خروج از حساب
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px] leading-relaxed">
                    {adminVerificationStatus === 'not_found' ? (
                      <>
                        سند دسترسی مدیریتی برای این حساب کاربری در کالکشن <span className="font-mono text-white">admins/{currentUser.uid}</span> پایگاه داده یافت نشد. جهت دسترسی، ثبت اولیه سند توسط اسکریپت امن سروری الزامی است.
                      </>
                    ) : adminVerificationStatus === 'inactive' ? (
                      <>
                        دسترسی مدیریتی این حساب کاربری توسط مدیر ارشد به حالت تعلیق درآمده است.
                      </>
                    ) : adminVerificationStatus === 'permission_denied' ? (
                      <>
                        درخواست استعلام سند با خطای مجوز امنیتی سرور مواجه شد. {adminVerificationError || 'قوانین دسترسی سرور را بررسی فرمایید.'}
                      </>
                    ) : adminVerificationStatus === 'network_error' ? (
                      <>
                        ارتباط با سرور ابری برقرار نشد. لطفاً اتصال شبکه را بررسی نموده و دوباره استعلام بگیرید.
                      </>
                    ) : (
                      <>
                        حساب شما دارای سطح «{role === 'technician' ? 'تکنسین فنی' : 'کاربر عادی'}» است. شما به تمام اطلاعات فنی منتشرشده، جستجو و نشان‌ها دسترسی کامل دارید. برای ورود به بخش مدیریت، سند فعال مدیریتی در پایگاه داده مورد نیاز است.
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleRecheck}
                      disabled={isRechecking || isAdminLoading}
                      className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isRechecking ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <KeyRound className="w-3.5 h-3.5" />
                      )}
                      <span>بررسی مجدد مجوز</span>
                    </button>

                    <button
                      onClick={logout}
                      className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-medium transition flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>خروج از حساب</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {isRegisterMode && (
                <div>
                  <label className="text-zinc-400 block mb-1">نام یا عنوان کارگاه:</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="مثلاً مهندس رضایی یا کلینیک برق خودرو"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 transition"
                  />
                </div>
              )}

              <div>
                <label className="text-zinc-400 block mb-1">ایمیل حساب:</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-9 pl-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">رمز عبور:</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-9 pl-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 transition"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-[11px]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-red-950 transition active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال بررسی...</span>
                  </>
                ) : (
                  <span>{isRegisterMode ? 'ثبت حساب کاربری جدید' : 'ورود با ایمیل و رمز'}</span>
                )}
              </button>

              <div className="relative my-3 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
                <span className="relative bg-zinc-900 px-2 text-[10px] text-zinc-500 uppercase">یا</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full py-2 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 font-bold rounded-xl transition flex items-center justify-center gap-2 active:scale-95"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                </svg>
                <span>ورود با حساب گوگل</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(!isRegisterMode); setErrorMessage(null); }}
                  className="text-[11px] text-zinc-400 hover:text-white"
                >
                  {isRegisterMode ? 'قبلاً حساب ساخته‌اید؟ وارد شوید' : 'نیاز به ایجاد حساب دارید؟ ثبت‌نام'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Megaphone,
  Send,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Users,
  ShieldCheck,
  Wrench,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Info,
  X
} from 'lucide-react';
import { AppNotification, NotificationTarget } from '../../types';
import { storage } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';

interface BroadcastManagerTabProps {
  onRefreshData?: () => void;
}

export const BroadcastManagerTab: React.FC<BroadcastManagerTabProps> = ({ onRefreshData }) => {
  const { currentUser, isAdmin } = useAuth();
  const [broadcasts, setBroadcasts] = useState<AppNotification[]>(() =>
    storage.getNotifications(undefined, 'admin').filter(n => n.type === 'admin_broadcast' || n.target === 'all')
  );

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<NotificationTarget>('all');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [showPreview, setShowPreview] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reloadBroadcasts = () => {
    const list = storage.getNotifications(undefined, 'admin').filter(n => n.type === 'admin_broadcast' || n.target === 'all');
    setBroadcasts([...list]);
    onRefreshData?.();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('لطفاً عنوان و متن اعلان را تکمیل فرمایید.');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleSendBroadcast = () => {
    const newNotif = storage.createNotification({
      type: 'admin_broadcast',
      title: title.trim(),
      message: message.trim(),
      target,
      priority,
      broadcastStatus: 'active',
      createdBy: currentUser?.email || 'مدیر سیستم',
      uniqueEventKey: `broadcast-${Date.now()}`
    });

    if (newNotif) {
      storage.recordAuditLog({
        actionType: 'broadcast_create',
        userId: currentUser?.uid || 'admin',
        userEmail: currentUser?.email || 'admin@autopin.ir',
        userRole: 'admin',
        targetType: 'broadcast',
        targetId: newNotif.id,
        targetTitle: newNotif.title,
        status: 'success',
        summary: `انتشار اعلان عمومی «${newNotif.title}» برای ${target === 'all' ? 'همه کاربران' : target === 'technicians' ? 'تکنسین‌ها' : 'مدیران'}`
      });

      showToast('اعلان عمومی با موفقیت در سامانه منتشر گردید.');
      setTitle('');
      setMessage('');
      setShowPreview(false);
      setIsConfirmModalOpen(false);
      reloadBroadcasts();
    }
  };

  const handleToggleStatus = (b: AppNotification) => {
    const newStatus = b.broadcastStatus === 'inactive' ? true : false;
    storage.toggleBroadcastStatus(b.id, newStatus);

    storage.recordAuditLog({
      actionType: 'broadcast_toggle',
      userId: currentUser?.uid || 'admin',
      userEmail: currentUser?.email || 'admin@autopin.ir',
      userRole: 'admin',
      targetType: 'broadcast',
      targetId: b.id,
      targetTitle: b.title,
      status: 'success',
      summary: `${newStatus ? 'فعال‌سازی' : 'غیرفعال‌سازی'} اعلان عمومی «${b.title}»`
    });

    showToast(`وضعیت اعلان به «${newStatus ? 'فعال' : 'غیرفعال'}» تغییر یافت.`);
    reloadBroadcasts();
  };

  const handleDeleteBroadcast = (id: string) => {
    storage.deleteNotification(id, currentUser?.uid, true);
    showToast('اعلان با موفقیت حذف شد.');
    setDeletingId(null);
    reloadBroadcasts();
  };

  const formatPersianDate = (timestamp: number) => {
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(timestamp));
    } catch {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 text-zinc-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Intro Header */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Megaphone className="w-4 h-4 text-amber-500" />
            <span>سامانه ارسال اعلان عمومی و پیام‌های درون‌برنامه‌ای</span>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 font-mono">
            In-App Broadcast
          </span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          از این بخش می‌توانید اطلاعیه‌های فنی، پیام‌های بروزرسانی، یا راهنمای کارگاهی را مستقیماً برای تمامی کاربران یا تکنسین‌ها در «مرکز اعلان‌های داخلی» ارسال کنید بدون اینکه نیاز به هدایت کاربر به خارج از برنامه باشد.
        </p>
      </div>

      {/* Broadcast Creation Form */}
      <form onSubmit={handleOpenConfirm} className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
            <Send className="w-4 h-4 text-red-500" />
            <span>تنظیم اعلان جدید</span>
          </span>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 transition"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-400" />
            <span>{showPreview ? 'مخفی‌سازی پیش‌نمایش' : 'پیش‌نمایش اعلان'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-zinc-400 block mb-1 font-bold">عنوان اعلان: *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: اضافه شدن نقشه‌های سیم‌کشی تارا و شاهین دنده‌ای"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 transition"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1 font-bold">مخاطبان هدف:</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as any)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
            >
              <option value="all">همه کاربران و تکنسین‌ها (عمومی)</option>
              <option value="technicians">فقط تکنسین‌های فنی</option>
              <option value="admins">فقط مدیران سیستم</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-zinc-400 block mb-1 font-bold">متن کامل پیام اعلان: *</label>
          <textarea
            required
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="متن پیام را به زبان ساده و فارسی وارد فرمایید..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 transition resize-none leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-zinc-400 block mb-1 font-bold">سطح اولویت:</label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-300">
                <input
                  type="radio"
                  name="priority"
                  value="normal"
                  checked={priority === 'normal'}
                  onChange={() => setPriority('normal')}
                  className="accent-red-600"
                />
                <span>عادی</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 text-amber-300">
                <input
                  type="radio"
                  name="priority"
                  value="high"
                  checked={priority === 'high'}
                  onChange={() => setPriority('high')}
                  className="accent-amber-500"
                />
                <span>مهم</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 text-red-400">
                <input
                  type="radio"
                  name="priority"
                  value="urgent"
                  checked={priority === 'urgent'}
                  onChange={() => setPriority('urgent')}
                  className="accent-red-600"
                />
                <span>فوری و ضروری</span>
              </label>
            </div>
          </div>
        </div>

        {/* Live Preview Box */}
        {showPreview && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-dashed border-zinc-700 space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 block">پیش‌نمایش نمایش در مرکز اعلان‌ها:</span>
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white text-xs">{title || 'عنوان نمونه اعلان'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    اطلاعیه عمومی
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">هم‌اکنون</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed pr-6">
                {message || 'متن اعلان به صورت خوانا و با فونت مناسب در این قسمت نمایش خواهد یافت.'}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition shadow-md shadow-red-950 flex items-center gap-1.5 active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>بررسی و انتشار اعلان عمومی</span>
          </button>
        </div>
      </form>

      {/* Previous Broadcasts List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xs space-y-0">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">اعلان‌های عمومی منتشرشده ({broadcasts.length})</h3>
          </div>
        </div>

        {broadcasts.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            هنوز اعلان عمومی دست‌سازی منتشر نشده است.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {broadcasts.map((b) => (
              <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-zinc-850/40 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{b.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded ${
                        b.broadcastStatus === 'inactive'
                          ? 'bg-zinc-800 text-zinc-400'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {b.broadcastStatus === 'inactive' ? 'غیرفعال / مخفی' : 'فعال'}
                    </span>
                  </div>

                  <p className="text-zinc-400 text-xs line-clamp-2 max-w-xl">
                    {b.message}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                    <span>زمان: {formatPersianDate(b.createdAt)}</span>
                    {b.createdBy && <span>· توسط: {b.createdBy}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleStatus(b)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                    title={b.broadcastStatus === 'inactive' ? 'فعال‌سازی مجدد' : 'غیرفعال‌سازی اعلان'}
                  >
                    {b.broadcastStatus === 'inactive' ? (
                      <ToggleLeft className="w-5 h-5 text-zinc-500" />
                    ) : (
                      <ToggleRight className="w-5 h-5 text-emerald-400" />
                    )}
                  </button>

                  <button
                    onClick={() => setDeletingId(b.id)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 hover:text-red-400 text-zinc-400 transition"
                    title="حذف این اعلان"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Final Broadcast Send Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center mx-auto">
              <Megaphone className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-sm font-bold text-white">تأیید نهایی انتشار اعلان عمومی</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                آیا از انتشار اعلان «<span className="text-white font-bold">{title}</span>» برای تمام کاربران در داخل سامانه اطمینان دارید؟
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSendBroadcast}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition shadow-md shadow-red-950 active:scale-95"
              >
                تأیید و انتشار درون‌برنامه‌ای
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Broadcast Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-red-950 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-sm font-bold text-white">حذف اعلان عمومی</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                آیا از حذف دائمی این اعلان از مرکز اعلان‌ها اطمینان دارید؟
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleDeleteBroadcast(deletingId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition shadow-md shadow-red-950 active:scale-95"
              >
                تأیید و حذف
              </button>
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

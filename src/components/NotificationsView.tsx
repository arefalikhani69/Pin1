import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Trash2,
  Filter,
  ArrowRight,
  ShieldCheck,
  Zap,
  Car,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  Sparkles,
  Megaphone,
  Layers,
  Inbox,
  ExternalLink,
  X,
  Info
} from 'lucide-react';
import { AppNotification, NotificationType, Vehicle, Connector, FuseBox, WiringDiagram } from '../types';
import { storage } from '../services/storage';
import { useAuth } from '../context/AuthContext';

interface NotificationsViewProps {
  onBack: () => void;
  onNavigateToVehicle?: (vehicleId: string) => void;
  onNavigateToApprovals?: () => void;
  onNavigateToQC?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  onBack,
  onNavigateToVehicle,
  onNavigateToApprovals,
  onNavigateToQC
}) => {
  const { currentUser, role, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    storage.getNotifications(currentUser?.uid, role)
  );
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [filterType, setFilterType] = useState<'all' | 'broadcast' | 'data' | 'system'>('all');
  const [deletingNotification, setDeletingNotification] = useState<AppNotification | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const reloadNotifications = () => {
    const list = storage.getNotifications(currentUser?.uid, role);
    setNotifications([...list]);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Read/Unread filter
      if (filterStatus === 'unread' && n.isRead) return false;
      if (filterStatus === 'read' && !n.isRead) return false;

      // Type filter
      if (filterType === 'broadcast' && n.type !== 'admin_broadcast' && n.target !== 'all') return false;
      if (filterType === 'data' && n.type !== 'data_published' && n.type !== 'data_updated') return false;
      if (filterType === 'system' && (n.type === 'data_published' || n.type === 'admin_broadcast')) return false;

      return true;
    });
  }, [notifications, filterStatus, filterType]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Mark single as read
  const handleMarkAsRead = (n: AppNotification) => {
    storage.markNotificationAsRead(n.id, currentUser?.uid);
    reloadNotifications();
  };

  // Mark all as read
  const handleMarkAllAsRead = () => {
    storage.markAllNotificationsAsRead(currentUser?.uid, role);
    reloadNotifications();
    showToast('تمامی اعلان‌ها به‌عنوان خوانده‌شده علامت‌گذاری شدند.');
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (!deletingNotification) return;

    const res = storage.deleteNotification(deletingNotification.id, currentUser?.uid, isAdmin);
    if (res.success) {
      showToast(res.message);
      reloadNotifications();
    } else {
      showToast(res.message);
    }
    setDeletingNotification(null);
  };

  // Helper for notification icon
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'admin_broadcast':
        return <Megaphone className="w-4 h-4 text-amber-400" />;
      case 'data_published':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'data_updated':
        return <Layers className="w-4 h-4 text-sky-400" />;
      case 'approval_pending':
        return <ShieldCheck className="w-4 h-4 text-amber-500" />;
      case 'approval_submitted':
        return <CheckCircle2 className="w-4 h-4 text-indigo-400" />;
      case 'bulk_import_done':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'error_alert':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'system':
      default:
        return <Bell className="w-4 h-4 text-red-500" />;
    }
  };

  // Format Persian Date & Time
  const formatDateTime = (timestamp: number) => {
    try {
      const date = new Intl.DateTimeFormat('fa-IR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(timestamp));
      return date;
    } catch {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 text-zinc-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBack}
              className="p-2 -mr-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95 transition"
              title="بازگشت"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  مرکز اعلان‌های داخلی
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-red-600 text-white font-bold font-mono">
                    {unreadCount} خوانده‌نشده
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                اطلاع‌رسانی‌های انتشار، پیام‌های مدیر سامانه و رویدادهای تخصصی
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shrink-0"
              title="علامت‌گذاری تمام اعلان‌ها به عنوان خوانده‌شده"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">خواندن همه</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-zinc-800 text-xs">
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterStatus === 'all' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              همه ({notifications.length})
            </button>
            <button
              onClick={() => setFilterStatus('unread')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
                filterStatus === 'unread' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>خوانده‌نشده</span>
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setFilterStatus('read')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterStatus === 'read' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              خوانده‌شده
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-red-500"
            >
              <option value="all">تمام موضوعات</option>
              <option value="broadcast">اطلاعیه‌های عمومی مدیر</option>
              <option value="data">انتشار داده‌های فنی جدید</option>
              <option value="system">رویدادهای سیستمی</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">اعلانی در این بخش وجود ندارد</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              {filterStatus === 'unread'
                ? 'تمام اعلان‌های شما خوانده شده‌اند و هیچ اعلان جدیدی در انتظار شما نیست.'
                : 'هم‌اکنون پیام یا اعلان جدیدی ثبت نشده است.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isUnread = !notif.isRead;
            const isBroadcast = notif.target === 'all';
            const isAdminOnly = notif.target === 'admins';

            return (
              <div
                key={notif.id}
                onClick={() => {
                  if (isUnread) handleMarkAsRead(notif);
                }}
                className={`p-4 rounded-2xl border transition relative overflow-hidden flex flex-col gap-2.5 cursor-pointer ${
                  isUnread
                    ? 'bg-zinc-900/90 border-red-900/50 hover:border-red-600/80 shadow-md ring-1 ring-red-950'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Visual Unread Accent Indicator */}
                {isUnread && (
                  <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-red-600 rounded-r-2xl" />
                )}

                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                        notif.priority === 'urgent'
                          ? 'bg-red-950 border-red-700 text-red-400'
                          : notif.type === 'admin_broadcast'
                          ? 'bg-amber-950/80 border-amber-800 text-amber-400'
                          : 'bg-zinc-800 border-zinc-700'
                      }`}
                    >
                      {getNotificationIcon(notif.type)}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold ${isUnread ? 'text-white' : 'text-zinc-200'}`}>
                          {notif.title}
                        </span>

                        {isBroadcast && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-800 text-amber-300 font-medium">
                            اطلاعیه عمومی
                          </span>
                        )}

                        {isAdminOnly && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950/80 border border-red-800 text-red-300 font-bold">
                            مخصوص ادمین
                          </span>
                        )}

                        {notif.priority === 'urgent' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-600 text-white font-black animate-pulse">
                            مهم و فوری
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          {formatDateTime(notif.createdAt)}
                        </span>
                        {notif.createdBy && (
                          <>
                            <span>·</span>
                            <span>از طرف: {notif.createdBy}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isUnread && (
                      <button
                        onClick={() => handleMarkAsRead(notif)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition"
                        title="علامت‌گذاری به عنوان خوانده‌شده"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => setDeletingNotification(notif)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition"
                      title="حذف این اعلان"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Message Body */}
                <p className="text-xs text-zinc-300 leading-relaxed pr-10.5 pl-2 font-normal">
                  {notif.message}
                </p>

                {/* Optional Entity Quick Link Action */}
                {notif.linkEntity && (
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs pr-10.5">
                    <span className="text-[11px] text-zinc-400">پیوند مرتبط:</span>
                    {notif.linkEntity.entityType === 'approvals' && onNavigateToApprovals && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToApprovals();
                        }}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/60 transition active:scale-95"
                      >
                        <span>مشاهده صف تأیید اطلاعات</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    {notif.linkEntity.entityType === 'qc' && onNavigateToQC && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToQC();
                        }}
                        className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-800/60 transition active:scale-95"
                      >
                        <span>مشاهده گزارش کنترل کیفیت</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    {notif.linkEntity.entityType === 'vehicle' && notif.linkEntity.entityId && onNavigateToVehicle && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToVehicle(notif.linkEntity!.entityId!);
                        }}
                        className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/60 transition active:scale-95"
                      >
                        <span>مشاهده خودرو در بانک اطلاعاتی</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-sm font-bold text-white">حذف اعلان</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                آیا مایل به حذف اعلان «<span className="text-white font-bold">{deletingNotification.title}</span>» هستید؟
              </p>
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span>حذف اعلان هیچ تأثیری بر اطلاعات فنی خودروها، سوکت‌ها یا فیوزها ندارد.</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition shadow-md shadow-red-950 active:scale-95"
              >
                تأیید و حذف
              </button>
              <button
                onClick={() => setDeletingNotification(null)}
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

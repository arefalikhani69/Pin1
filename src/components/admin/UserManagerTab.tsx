import React, { useState, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Wrench,
  UserCheck,
  UserX,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Edit2,
  Trash2,
  RefreshCw,
  Clock,
  Mail,
  User as UserIcon,
  Shield,
  Info,
  ChevronDown,
  X
} from 'lucide-react';
import { AppUserProfile, AppUserRole } from '../../types';
import { storage } from '../../services/storage';
import { onlineStorage } from '../../services/onlineStorage';
import { useAuth } from '../../context/AuthContext';
import { BOOTSTRAP_ADMIN_EMAIL } from '../../services/firebase';

interface UserManagerTabProps {
  onRefreshData?: () => void;
}

export const UserManagerTab: React.FC<UserManagerTabProps> = ({ onRefreshData }) => {
  const { currentUser, isOnlineDbConnected, refreshProfile } = useAuth();
  const [users, setUsers] = useState<AppUserProfile[]>(() => storage.getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppUserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Edit role modal state
  const [editingUser, setEditingUser] = useState<AppUserProfile | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<AppUserRole>('user');
  const [editNotes, setEditNotes] = useState('');

  // Delete modal state
  const [deletingUser, setDeletingUser] = useState<AppUserProfile | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const reloadUsers = async () => {
    let list = storage.getUsers();
    if (isOnlineDbConnected) {
      try {
        const cloudUsers = await onlineStorage.getUsers();
        if (cloudUsers.length > 0) {
          cloudUsers.forEach(u => storage.saveUser(u));
          list = storage.getUsers();
        }
      } catch (err) {
        console.warn('Sync users notice:', err);
      }
    }
    setUsers([...list]);
    onRefreshData?.();
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Role filter
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      // Status filter
      if (statusFilter === 'active' && !user.isActive) return false;
      if (statusFilter === 'inactive' && user.isActive) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const emailMatch = user.email?.toLowerCase().includes(q);
        const nameMatch = user.displayName?.toLowerCase().includes(q);
        const notesMatch = user.notes?.toLowerCase().includes(q);
        if (!emailMatch && !nameMatch && !notesMatch) return false;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.role === 'admin').length;
    const technicians = users.filter(u => u.role === 'technician').length;
    const standardUsers = users.filter(u => u.role === 'user' || !u.role).length;
    const inactive = users.filter(u => !u.isActive).length;
    return { total, admins, technicians, standardUsers, inactive };
  }, [users]);

  // Handle role save
  const handleSaveRole = async () => {
    if (!editingUser) return;

    if (editingUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() && selectedNewRole !== 'admin') {
      showToast('امکان تغییر نقش مدیر اصلی و صاحب پروژه (Bootstrap Admin) وجود ندارد.', 'error');
      setEditingUser(null);
      return;
    }

    const res = storage.updateUserRole(editingUser.id, selectedNewRole, currentUser?.email || undefined);
    if (!res.success) {
      showToast(res.message, 'error');
      return;
    }

    // Update notes if changed
    const updated = storage.getUserById(editingUser.id);
    if (updated) {
      updated.notes = editNotes.trim() || undefined;
      storage.saveUser(updated);

      if (isOnlineDbConnected) {
        try {
          await onlineStorage.updateUserRole(editingUser.id, selectedNewRole);
          await onlineStorage.saveUser(updated);
        } catch (err) {
          console.warn('Online role update fallback:', err);
        }
      }
    }

    showToast(res.message, 'success');
    setEditingUser(null);
    reloadUsers();
    refreshProfile();
  };

  // Toggle active/inactive
  const handleToggleStatus = async (user: AppUserProfile) => {
    if (user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
      showToast('امکان تعلیق یا غیرفعال‌سازی حساب مدیر اصلی سامانه وجود ندارد.', 'error');
      return;
    }

    const res = storage.toggleUserStatus(user.id, currentUser?.email || undefined);
    if (!res.success) {
      showToast(res.message, 'error');
      return;
    }

    if (isOnlineDbConnected) {
      try {
        await onlineStorage.toggleUserStatus(user.id, res.newStatus);
      } catch (err) {
        console.warn('Online status toggle fallback:', err);
      }
    }

    showToast(res.message, res.newStatus ? 'success' : 'error');
    reloadUsers();
    refreshProfile();
  };

  // Delete user confirmed
  const handleDeleteUserConfirmed = async () => {
    if (!deletingUser) return;

    if (deletingUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
      showToast('حساب مدیر اصلی پروژه به هیچ عنوان قابل حذف نیست.', 'error');
      setDeletingUser(null);
      return;
    }

    const res = storage.deleteUser(deletingUser.id);
    if (!res.success) {
      showToast(res.message, 'error');
      return;
    }

    showToast(res.message, 'success');
    setDeletingUser(null);
    reloadUsers();
  };

  const getRoleBadge = (r: AppUserRole, isMaster: boolean) => {
    if (isMaster) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-950/80 text-red-300 border border-red-700/80 shadow-xs">
          <Shield className="w-3 h-3 text-red-400" />
          <span>مدیر کل (Bootstrap Admin)</span>
        </span>
      );
    }
    switch (r) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>مدیر سیستم</span>
          </span>
        );
      case 'technician':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-950/70 text-indigo-300 border border-indigo-800">
            <Wrench className="w-3 h-3 text-indigo-400" />
            <span>تکنسین فنی برق</span>
          </span>
        );
      case 'user':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            <UserIcon className="w-3 h-3 text-zinc-400" />
            <span>کاربر عادی</span>
          </span>
        );
    }
  };

  const formatPersianDate = (timestamp?: number) => {
    if (!timestamp) return 'ثبت نشده';
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(new Date(timestamp));
    } catch {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              : 'bg-red-950/80 border-red-800 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-zinc-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Security & Access Boundary Architecture Banner */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Shield className="w-4 h-4 text-red-500" />
            <span>سیستم کنترل سطح دسترسی و نقش‌های کاربری (RBAC)</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-400 font-mono">
            AutoPin Pro Security Core
          </span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          دسترسی‌های سامانه به تفکیک سه نقش <strong>مدیر ارشد (Admin)</strong>،{' '}
          <strong>تکنسین فنی (Technician)</strong> و <strong>کاربر عادی (User)</strong> مدیریت می‌شوند.
          در حالت آنلاین با پایگاه داده Firestore، قوانین امنیتی سمت سرور (<span className="font-mono text-zinc-300">firestore.rules</span>) به صورت غیرقابل نفوذ از تغییر اطلاعات توسط افراد غیرمجاز جلوگیری می‌کنند.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-200 block">مدیر کل (Admin)</strong>
              <span className="text-zinc-500 text-[10px]">دسترسی کامل به ویرایش، حذف، تأیید و انتشار، کنترل کیفیت و مدیریت کاربران</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-start gap-2">
            <Wrench className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-200 block">تکنسین برق (Technician)</strong>
              <span className="text-zinc-500 text-[10px]">امکان ثبت و ارسال اطلاعات فنی به صف بررسی (پیش‌نویس / در انتظار تأیید)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-start gap-2">
            <UserCheck className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-200 block">کاربر عادی (User)</strong>
              <span className="text-zinc-500 text-[10px]">مشاهده اطلاعات فنی منتشرشده، جستجو، مقایسه فنی و مدیریت نشان‌های شخصی</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
          <span className="text-xs text-zinc-400 block mb-0.5">کل کاربران</span>
          <span className="text-base font-bold text-white font-mono">{stats.total}</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900 border border-emerald-950 text-center">
          <span className="text-xs text-emerald-400 block mb-0.5">مدیران</span>
          <span className="text-base font-bold text-emerald-300 font-mono">{stats.admins}</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900 border border-indigo-950 text-center">
          <span className="text-xs text-indigo-400 block mb-0.5">تکنسین‌ها</span>
          <span className="text-base font-bold text-indigo-300 font-mono">{stats.technicians}</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
          <span className="text-xs text-zinc-400 block mb-0.5">کاربران عادی</span>
          <span className="text-base font-bold text-zinc-200 font-mono">{stats.standardUsers}</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900 border border-red-950 text-center col-span-2 sm:col-span-1">
          <span className="text-xs text-red-400 block mb-0.5">معلق / غیرفعال</span>
          <span className="text-base font-bold text-red-300 font-mono">{stats.inactive}</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی کاربر با ایمیل، نام یا توضیحات..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-9 pl-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-300 focus:outline-none focus:border-red-500"
          >
            <option value="all">همه نقش‌ها</option>
            <option value="admin">مدیران (Admin)</option>
            <option value="technician">تکنسین‌ها (Technician)</option>
            <option value="user">کاربران عادی (User)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-300 focus:outline-none focus:border-red-500"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="active">حساب‌های فعال</option>
            <option value="inactive">حساب‌های غیرفعال</option>
          </select>

          <button
            onClick={reloadUsers}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition active:scale-95 shrink-0"
            title="بروزرسانی لیست کاربران"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 space-y-2">
            <UserX className="w-8 h-8 mx-auto text-zinc-600" />
            <p className="text-xs">هیچ کاربری با فیلترهای مشخص‌شده یافت نشد.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {filteredUsers.map((user) => {
              const isMaster = user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
              const isCurrent = user.id === currentUser?.uid || user.email?.toLowerCase() === currentUser?.email?.toLowerCase();

              return (
                <div
                  key={user.id}
                  className={`p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    !user.isActive ? 'bg-zinc-950/40 opacity-75' : 'hover:bg-zinc-850/50'
                  }`}
                >
                  {/* User Profile Card Header */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                        isMaster
                          ? 'bg-red-950/80 border-red-800 text-red-400'
                          : user.role === 'admin'
                          ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                          : user.role === 'technician'
                          ? 'bg-indigo-950/80 border-indigo-800 text-indigo-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                      }`}
                    >
                      {user.displayName ? user.displayName.slice(0, 1).toUpperCase() : user.email?.slice(0, 1).toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {user.displayName || 'بدون نام ثبت‌شده'}
                        </span>

                        {getRoleBadge(user.role, isMaster)}

                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                            حساب شما
                          </span>
                        )}

                        {!user.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            تعلیق‌شده
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1 font-mono text-zinc-300">
                          <Mail className="w-3 h-3 text-zinc-500" />
                          {user.email || 'بدون ایمیل'}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          عضویت: {formatPersianDate(user.createdAt)}
                        </span>
                        {user.lastLoginAt && (
                          <>
                            <span>·</span>
                            <span>آخرین فعالیت: {formatPersianDate(user.lastLoginAt)}</span>
                          </>
                        )}
                      </div>

                      {user.notes && (
                        <p className="text-[11px] text-zinc-400 bg-zinc-950/60 px-2.5 py-1 rounded-lg border border-zinc-800/80 inline-block mt-1">
                          {user.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {/* Role Change Button */}
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setSelectedNewRole(user.role);
                        setEditNotes(user.notes || '');
                      }}
                      disabled={isMaster}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 text-xs font-medium transition flex items-center gap-1"
                      title={isMaster ? 'نقش مدیر کل قابل تغییر نیست' : 'تغییر سطح دسترسی کاربر'}
                    >
                      <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                      <span>تغییر نقش</span>
                    </button>

                    {/* Status Toggle Button */}
                    <button
                      onClick={() => handleToggleStatus(user)}
                      disabled={isMaster}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                        user.isActive
                          ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-300'
                          : 'bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300'
                      }`}
                      title={
                        isMaster
                          ? 'مدیر کل قابل غیرفعال‌سازی نیست'
                          : user.isActive
                          ? 'تعلیق حساب کاربری'
                          : 'فعال‌سازی مجدد حساب'
                      }
                    >
                      {user.isActive ? (
                        <>
                          <UserX className="w-3.5 h-3.5 text-amber-400" />
                          <span>تعلیق</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>فعال‌سازی</span>
                        </>
                      )}
                    </button>

                    {/* Delete User Button */}
                    <button
                      onClick={() => setDeletingUser(user)}
                      disabled={isMaster || isCurrent}
                      className="p-1.5 rounded-xl bg-zinc-800 hover:bg-red-950/80 hover:text-red-400 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title={
                        isMaster
                          ? 'حساب مدیر اصلی قابل حذف نیست'
                          : isCurrent
                          ? 'نمی‌توانید حساب جاری خود را حذف کنید'
                          : 'حذف حساب کاربر'
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-bold text-white">
                  تغییر سطح دسترسی کاربر
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-zinc-400 text-[11px] block">کاربر انتخاب شده:</span>
                <span className="font-bold text-white text-xs block">
                  {editingUser.displayName || editingUser.email}
                </span>
                <span className="font-mono text-zinc-400 text-[11px] block">
                  {editingUser.email}
                </span>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1.5 font-bold">انتخاب نقش جدید:</label>
                <div className="space-y-2">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      selectedNewRole === 'user'
                        ? 'bg-zinc-800/90 border-zinc-600 ring-1 ring-zinc-500'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="user"
                      checked={selectedNewRole === 'user'}
                      onChange={() => setSelectedNewRole('user')}
                      className="mt-0.5 accent-red-600"
                    />
                    <div>
                      <strong className="text-white block font-bold">کاربر عادی (User)</strong>
                      <span className="text-zinc-400 text-[11px] leading-relaxed">
                        مشاهده خودروها، پین‌آوت‌ها، فیوزها و نقشه‌ها، جستجو و علاقه‌مندی‌ها. بدون اجازه ویرایش یا دسترسی به پنل مدیریت.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      selectedNewRole === 'technician'
                        ? 'bg-indigo-950/40 border-indigo-700 ring-1 ring-indigo-500'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="technician"
                      checked={selectedNewRole === 'technician'}
                      onChange={() => setSelectedNewRole('technician')}
                      className="mt-0.5 accent-indigo-500"
                    />
                    <div>
                      <strong className="text-indigo-300 block font-bold">تکنسین فنی (Technician)</strong>
                      <span className="text-zinc-400 text-[11px] leading-relaxed">
                        امکان ثبت و ارسال پیشنهادات فنی به عنوان پیش‌نویس برای بررسی توسط مدیر ارشد.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      selectedNewRole === 'admin'
                        ? 'bg-emerald-950/40 border-emerald-700 ring-1 ring-emerald-500'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={selectedNewRole === 'admin'}
                      onChange={() => setSelectedNewRole('admin')}
                      className="mt-0.5 accent-emerald-500"
                    />
                    <div>
                      <strong className="text-emerald-300 block font-bold">مدیر سیستم (Admin)</strong>
                      <span className="text-zinc-400 text-[11px] leading-relaxed">
                        دسترسی نامحدود به پنل مدیریت، ویرایش و حذف رکوردها، انتشار نهایی و کنترل نقش‌های سایر کاربران.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">یادداشت مدیر (اختیاری):</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="مثلاً کارشناس برق ایسیکو - شعبه مرکزی"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveRole}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition shadow-md shadow-red-950 active:scale-95"
                >
                  ذخیره و اعمال نقش
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirm Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-xl bg-red-950 border border-red-800 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white">حذف حساب کاربری</h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                آیا از حذف حساب کاربری «<span className="text-white font-bold">{deletingUser.displayName || deletingUser.email}</span>» اطمینان دارید؟ این عمل دسترسی کاربر را لغو خواهد کرد.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleDeleteUserConfirmed}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition shadow-md shadow-red-950 active:scale-95"
              >
                تأیید و حذف حساب
              </button>
              <button
                onClick={() => setDeletingUser(null)}
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

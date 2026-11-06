import React, { useState } from 'react';
import {
  Car,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  X,
  Save,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { Vehicle, PublicationStatus, Engine } from '../../types';
import { storage } from '../../services/storage';
import { onlineStorage } from '../../services/onlineStorage';
import { useAuth } from '../../context/AuthContext';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface VehicleManagerTabProps {
  onRefreshData?: () => void;
  onOpenBulkImport?: (type: 'vehicles') => void;
}

export const VehicleManagerTab: React.FC<VehicleManagerTabProps> = ({
  onRefreshData,
  onOpenBulkImport
}) => {
  const { isAdmin, isOnlineDbConnected } = useAuth();
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>(() => storage.getVehicles());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingVehicle, setEditingVehicle] = useState<Partial<Vehicle> | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Engine editor helper
  const [engineCodeInput, setEngineCodeInput] = useState('');
  const [engineFuelInput, setEngineFuelInput] = useState('');

  const reloadData = () => {
    setVehiclesList(storage.getVehicles());
    onRefreshData?.();
  };

  // Filtered vehicles
  const filteredVehicles = vehiclesList.filter(veh => {
    const matchesSearch =
      veh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      veh.generation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      veh.modelYears.includes(searchQuery) ||
      (veh.engines && veh.engines.some(e => e.code.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesStatus = statusFilter === 'all' || (veh.status || 'published') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStartCreate = () => {
    setEditingVehicle({
      id: `veh-${Date.now()}`,
      manufacturerId: 'iran_khodro',
      name: '',
      persianName: '',
      generation: '',
      modelYears: '۱۳۹۰ - ۱۴۰۲',
      electricalSystem: 'انژکتوری چندنقطه‌ای',
      description: '',
      source: 'دفترچه رسمی کارخانه',
      status: 'published',
      engines: []
    });
    setEngineCodeInput('TU5');
    setEngineFuelInput('بنزینی انژکتوری');
  };

  const handleStartEdit = (veh: Vehicle) => {
    setEditingVehicle({ ...veh });
  };

  const handleSaveVehicle = async () => {
    if (!editingVehicle?.name?.trim()) {
      alert('لطفاً نام خودرو را وارد کنید.');
      return;
    }

    const fullVehicle: Vehicle = {
      id: editingVehicle.id || `veh-${Date.now()}`,
      manufacturerId: editingVehicle.manufacturerId || 'iran_khodro',
      name: editingVehicle.name.trim(),
      persianName: editingVehicle.persianName?.trim() || editingVehicle.name.trim(),
      generation: editingVehicle.generation?.trim() || '',
      modelYears: editingVehicle.modelYears?.trim() || '',
      electricalSystem: editingVehicle.electricalSystem?.trim() || 'استاندارد',
      description: editingVehicle.description?.trim() || '',
      source: editingVehicle.source?.trim() || 'AutoPin Pro',
      status: (editingVehicle.status as PublicationStatus) || 'published',
      engines: editingVehicle.engines || [],
      createdAt: editingVehicle.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    // Save locally
    storage.saveVehicle(fullVehicle);

    // Save to Firestore if online
    if (isAdmin && isOnlineDbConnected) {
      try {
        await onlineStorage.saveVehicle(fullVehicle);
      } catch (err) {
        console.warn('Error saving vehicle to firestore:', err);
      }
    }

    setEditingVehicle(null);
    reloadData();
    setSuccessBanner(`خودروی «${fullVehicle.name}» با موفقیت ذخیره شد.`);
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  const handleDeleteConfirmed = async () => {
    if (!deletingVehicle) return;
    storage.deleteVehicle(deletingVehicle.id);
    if (isAdmin && isOnlineDbConnected) {
      try {
        await onlineStorage.deleteVehicle(deletingVehicle.id);
      } catch (err) {
        console.warn('Error deleting vehicle from firestore:', err);
      }
    }
    setDeletingVehicle(null);
    reloadData();
    setSuccessBanner('خودرو با موفقیت حذف شد.');
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  const handleAddEngine = () => {
    if (!engineCodeInput.trim()) return;
    const newEngine: Engine = {
      id: `eng-${Date.now()}`,
      vehicleId: editingVehicle?.id || '',
      code: engineCodeInput.trim(),
      name: `موتور ${engineCodeInput.trim()}`,
      fuelSystem: engineFuelInput.trim() || 'انژکتوری',
      valves: 16,
      displacementCc: 1600
    };
    setEditingVehicle(prev => prev ? {
      ...prev,
      engines: [...(prev.engines || []), newEngine]
    } : null);
    setEngineCodeInput('');
  };

  const handleRemoveEngine = (code: string) => {
    setEditingVehicle(prev => prev ? {
      ...prev,
      engines: (prev.engines || []).filter(e => e.code !== code)
    } : null);
  };

  return (
    <div className="flex flex-col gap-4 text-right">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">مدیریت بانک اطلاعات خودروها</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              ثبت مشخصات فنی، موتورها، سال‌های تولید و وضعیت تأیید ({vehiclesList.length} خودرو ثبت‌شده)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenBulkImport && (
            <button
              onClick={() => onOpenBulkImport('vehicles')}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>ورود گروهی Excel</span>
            </button>
          )}

          <button
            onClick={handleStartCreate}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-red-950 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن خودرو جدید</span>
          </button>
        </div>
      </div>

      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو بر اساس نام خودرو، نسل، سال ساخت یا کد موتور..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-zinc-400 hidden sm:inline" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3 py-2 text-white focus:outline-none"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="published">منتشرشده (عمومی)</option>
            <option value="verified">تأییدشده آزمایشگاهی</option>
            <option value="pending">در انتظار بررسی</option>
            <option value="draft">پیش‌نویس</option>
            <option value="archived">بایگانی‌شده</option>
          </select>
        </div>
      </div>

      {/* Vehicles Table / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredVehicles.length === 0 ? (
          <div className="col-span-full py-8 text-center text-zinc-500 text-xs bg-zinc-950 rounded-2xl border border-zinc-800">
            خودرویی مطابق با فیلتر یا جستجوی شما یافت نشد.
          </div>
        ) : (
          filteredVehicles.map(veh => {
            const statusKey = veh.status || 'published';
            const statusColors: Record<string, string> = {
              published: 'text-emerald-400 border-emerald-800 bg-emerald-950/40',
              verified: 'text-sky-400 border-sky-800 bg-sky-950/40',
              pending: 'text-amber-400 border-amber-800 bg-amber-950/40',
              draft: 'text-zinc-400 border-zinc-800 bg-zinc-900',
              archived: 'text-red-400 border-red-800 bg-red-950/40'
            };

            const statusLabels: Record<string, string> = {
              published: 'منتشرشده',
              verified: 'تأییدشده',
              pending: 'در انتظار',
              draft: 'پیش‌نویس',
              archived: 'بایگانی'
            };

            return (
              <div
                key={veh.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex flex-col justify-between gap-3 transition shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-zinc-500">{veh.modelYears || 'سال نامشخص'}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${statusColors[statusKey] || statusColors.published}`}>
                      {statusLabels[statusKey] || 'منتشرشده'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-1">{veh.name}</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {veh.generation} · {veh.electricalSystem}
                  </p>

                  {/* Engines list pills */}
                  {veh.engines && veh.engines.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] text-zinc-500">موتورها:</span>
                      {veh.engines.map(e => (
                        <span key={e.id} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-300 font-mono border border-zinc-800">
                          {e.code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {veh.updatedAt ? new Date(veh.updatedAt).toLocaleDateString('fa-IR') : '—'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingVehicle(veh)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      title="مشاهده مشخصات"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleStartEdit(veh)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      title="ویرایش"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingVehicle(veh)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-red-400"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* EDIT / CREATE VEHICLE MODAL */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 text-right flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">
                {editingVehicle.id && vehiclesList.some(v => v.id === editingVehicle.id)
                  ? `ویرایش خودرو: ${editingVehicle.name}`
                  : 'افزودن خودروی جدید به بانک اطلاعاتی'}
              </h3>
              <button
                onClick={() => setEditingVehicle(null)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingVehicle.rejectionReason && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-red-300">علت رد این خودرو توسط مدیر فنی:</strong>
                  <p className="mt-1 leading-relaxed">{editingVehicle.rejectionReason}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">نام کامل خودرو: *</label>
                <input
                  type="text"
                  value={editingVehicle.name || ''}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, name: e.target.value })}
                  placeholder="مثلاً: پژو ۲۰۶ تیپ ۵"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">نسل و تیپ:</label>
                <input
                  type="text"
                  value={editingVehicle.generation || ''}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, generation: e.target.value })}
                  placeholder="مثلاً: هاچ‌بک فرانسوی"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">سال‌های تولید:</label>
                <input
                  type="text"
                  value={editingVehicle.modelYears || ''}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, modelYears: e.target.value })}
                  placeholder="۱۳۸۵ - ۱۳۹۱"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">وضعیت انتشار و تأیید:</label>
                <select
                  value={editingVehicle.status || 'published'}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, status: e.target.value as PublicationStatus })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="published">منتشرشده (قابل مشاهده برای همه کاربران)</option>
                  <option value="verified">تأییدشده رسمی</option>
                  <option value="pending">در انتظار بررسی تکنسین</option>
                  <option value="draft">پیش‌نویس (فقط برای مدیر)</option>
                  <option value="rejected">ردشده (دارای نقص جهت اصلاح)</option>
                  <option value="archived">بایگانی‌شده</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">سیستم سوخت‌رسانی و برق:</label>
                <input
                  type="text"
                  value={editingVehicle.electricalSystem || ''}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, electricalSystem: e.target.value })}
                  placeholder="انژکتوری چندنقطه‌ای Bosch ME7.4.4"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">منبع اطلاعات فنی:</label>
                <input
                  type="text"
                  value={editingVehicle.source || ''}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, source: e.target.value })}
                  placeholder="دفترچه راهنمای رسمی کارخانه"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="col-span-full">
                <label className="text-zinc-400 block mb-1">توضیحات و مشخصات کاربردی خودرو:</label>
                <textarea
                  value={editingVehicle.description || ''}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, description: e.target.value })}
                  rows={2}
                  placeholder="نکات کلیدی سیم‌کشی و عیب‌یابی..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* Sub-form for Engines */}
              <div className="col-span-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-2">
                <span className="text-xs font-bold text-white">پیشرانه‌ها و کدهای موتور ثبت‌شده:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={engineCodeInput}
                    onChange={(e) => setEngineCodeInput(e.target.value)}
                    placeholder="کد موتور (TU5, XU7, EF7)"
                    className="w-32 bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-white"
                  />
                  <input
                    type="text"
                    value={engineFuelInput}
                    onChange={(e) => setEngineFuelInput(e.target.value)}
                    placeholder="نوع سوخت / پاشش"
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddEngine}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold"
                  >
                    + افزودن موتور
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-1">
                  {editingVehicle.engines?.map(e => (
                    <span key={e.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200">
                      <strong>{e.code}</strong>
                      <span className="text-zinc-400 text-[10px]">({e.fuelSystem})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEngine(e.code)}
                        className="text-red-400 hover:text-red-300 font-bold mr-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingVehicle(null)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveVehicle}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md shadow-red-950 flex items-center gap-1.5 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره خودرو در بانک اطلاعاتی</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 text-right flex flex-col gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">{viewingVehicle.name}</h3>
              <button onClick={() => setViewingVehicle(null)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">شناسه سیستمی:</span>
                <span className="text-white font-mono">{viewingVehicle.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">نسل و تیپ:</span>
                <span className="text-white">{viewingVehicle.generation || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">سال‌های تولید:</span>
                <span className="text-white font-mono">{viewingVehicle.modelYears || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">سیستم برق و انژکتور:</span>
                <span className="text-white">{viewingVehicle.electricalSystem || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">منبع اطلاعات:</span>
                <span className="text-white">{viewingVehicle.source || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">وضعیت انتشار:</span>
                <span className="text-emerald-400 font-bold">{viewingVehicle.status || 'published'}</span>
              </div>
              {viewingVehicle.description && (
                <div className="pt-2">
                  <span className="text-zinc-400 block mb-1">توضیحات:</span>
                  <p className="text-zinc-200 leading-relaxed bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                    {viewingVehicle.description}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                onClick={() => setViewingVehicle(null)}
                className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-xs font-bold"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAFE DELETE CONFIRMATION MODAL */}
      {deletingVehicle && (
        <DeleteConfirmModal
          isOpen={Boolean(deletingVehicle)}
          onClose={() => setDeletingVehicle(null)}
          onConfirm={handleDeleteConfirmed}
          entityType="vehicle"
          entityId={deletingVehicle.id}
          entityTitle={deletingVehicle.name}
        />
      )}
    </div>
  );
};

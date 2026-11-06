import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
  Car,
  FileSpreadsheet,
  History,
  Grid
} from 'lucide-react';
import { ECU, PublicationStatus } from '../../types';
import { storage } from '../../services/storage';
import { onlineStorage } from '../../services/onlineStorage';
import { useAuth } from '../../context/AuthContext';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { VersionHistoryModal } from '../VersionHistoryModal';
import { EcuSocketManagerModal } from './EcuSocketManagerModal';

interface EcuManagerTabProps {
  onRefreshData?: () => void;
  onOpenBulkImport?: (type: 'ecus') => void;
}

export const EcuManagerTab: React.FC<EcuManagerTabProps> = ({
  onRefreshData,
  onOpenBulkImport
}) => {
  const { isAdmin, isOnlineDbConnected, currentUser } = useAuth();
  const [ecusList, setEcusList] = useState<ECU[]>(() => storage.getECUs());
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingEcu, setEditingEcu] = useState<Partial<ECU> | null>(null);
  const [viewingEcu, setViewingEcu] = useState<ECU | null>(null);
  const [deletingEcu, setDeletingEcu] = useState<ECU | null>(null);
  const [historyEcu, setHistoryEcu] = useState<ECU | null>(null);
  const [socketManagerEcu, setSocketManagerEcu] = useState<ECU | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const vehicles = storage.getVehicles();

  const reloadData = () => {
    setEcusList(storage.getECUs());
    onRefreshData?.();
  };

  const filteredEcus = ecusList.filter(ecu => {
    const matchesSearch =
      ecu.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ecu.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ecu.hardwareVersion && ecu.hardwareVersion.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesVehicle = vehicleFilter === 'all' || ecu.vehicleId === vehicleFilter;
    const matchesStatus = statusFilter === 'all' || (ecu.status || 'published') === statusFilter;

    return matchesSearch && matchesVehicle && matchesStatus;
  });

  const handleStartCreate = () => {
    setEditingEcu({
      id: `ecu-${Date.now()}`,
      vehicleId: vehicles[0]?.id || 'peugeot-206',
      brand: 'Bosch',
      model: '',
      hardwareVersion: '',
      softwareVersion: '',
      connectorCount: 3,
      description: '',
      status: 'published'
    });
  };

  const handleStartEdit = (ecu: ECU) => {
    setEditingEcu({ ...ecu });
  };

  const handleSaveEcu = async () => {
    if (!editingEcu?.model?.trim()) {
      alert('لطفاً مدل ECU (مانند ME 7.4.4 یا Sagem S2000) را وارد کنید.');
      return;
    }

    const fullEcu: ECU = {
      id: editingEcu.id || `ecu-${Date.now()}`,
      vehicleId: editingEcu.vehicleId || vehicles[0]?.id || 'peugeot-206',
      brand: editingEcu.brand?.trim() || 'Bosch',
      model: editingEcu.model.trim(),
      hardwareVersion: editingEcu.hardwareVersion?.trim() || undefined,
      softwareVersion: editingEcu.softwareVersion?.trim() || undefined,
      connectorCount: Number(editingEcu.connectorCount) || 2,
      description: editingEcu.description?.trim() || undefined,
      status: (editingEcu.status as PublicationStatus) || 'published'
    };

    storage.saveECU(fullEcu, {
      uid: currentUser?.uid,
      email: currentUser?.email || 'admin@autopin.ir'
    });
    if (isAdmin && isOnlineDbConnected) {
      try {
        await onlineStorage.saveECU(fullEcu);
      } catch (err) {
        console.warn('Error saving ECU to firestore:', err);
      }
    }

    setEditingEcu(null);
    reloadData();
    setSuccessBanner(`کامپیوتر «${fullEcu.brand} ${fullEcu.model}» با موفقیت ذخیره شد.`);
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  const handleDeleteConfirmed = async () => {
    if (!deletingEcu) return;
    storage.deleteECU(deletingEcu.id, {
      uid: currentUser?.uid,
      email: currentUser?.email || 'admin@autopin.ir'
    });
    if (isAdmin && isOnlineDbConnected) {
      try {
        await onlineStorage.deleteECU(deletingEcu.id);
      } catch (err) {
        console.warn('Error deleting ECU from firestore:', err);
      }
    }
    setDeletingEcu(null);
    reloadData();
    setSuccessBanner('ECU با موفقیت حذف شد.');
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  return (
    <div className="flex flex-col gap-4 text-right">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">مدیریت بانک اطلاعات ECUها و کنترل‌یونیت‌ها</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              مدیریت مدل‌ها، پارت‌نامبرها، نسخه‌های سخت‌افزار و سوکت‌های متصل ({ecusList.length} ماژول ثبت‌شده)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenBulkImport && (
            <button
              onClick={() => onOpenBulkImport('ecus')}
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
            <span>ثبت ECU جدید</span>
          </button>
        </div>
      </div>

      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در برند، مدل ECU، نسخه سخت‌افزار..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div>
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3 py-2 text-white focus:outline-none"
          >
            <option value="all">همه خودروها</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3 py-2 text-white focus:outline-none"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="published">منتشرشده (عمومی)</option>
            <option value="verified">تأییدشده آزمایشگاهی</option>
            <option value="pending">در انتظار بررسی</option>
            <option value="draft">پیش‌نویس</option>
          </select>
        </div>
      </div>

      {/* ECUs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredEcus.length === 0 ? (
          <div className="col-span-full py-8 text-center text-zinc-500 text-xs bg-zinc-950 rounded-2xl border border-zinc-800">
            کنترل‌یونیتی مطابق با فیلتر یافت نشد.
          </div>
        ) : (
          filteredEcus.map(ecu => {
            const veh = vehicles.find(v => v.id === ecu.vehicleId);
            const connectedSockets = storage.getConnectors().filter(c => c.ecuId === ecu.id || c.vehicleId === ecu.vehicleId);

            return (
              <div
                key={ecu.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex flex-col justify-between gap-3 transition shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-950 font-bold text-red-400 border border-zinc-800">
                      {ecu.brand}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 font-semibold">
                      {ecu.status || 'published'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-1.5">{ecu.brand} {ecu.model}</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    خودرو: {veh?.name || 'عمومی'} · {ecu.connectorCount} سوکت مجزا
                  </p>

                  {ecu.hardwareVersion && (
                    <div className="text-[10px] text-zinc-500 font-mono mt-1">
                      سخت‌افزار: {ecu.hardwareVersion}
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-500 mt-2">
                    {connectedSockets.length} سوکت مستندشده در سیستم
                  </div>

                  <button
                    onClick={() => setSocketManagerEcu(ecu)}
                    className="w-full mt-2.5 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition border border-zinc-700/80 active:scale-95 shadow-xs"
                  >
                    <Grid className="w-3.5 h-3.5 text-emerald-400" />
                    <span>مدیریت سوکت‌ها و پین‌اوت ({connectedSockets.length})</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
                  <span className="text-[10px] text-zinc-500 font-mono">{ecu.id}</span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setHistoryEcu(ecu)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-purple-400 hover:text-purple-300"
                      title="تاریخچه نسخه‌ها و تغییرات"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewingEcu(ecu)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      title="مشاهده"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleStartEdit(ecu)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      title="ویرایش"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingEcu(ecu)}
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

      {/* EDIT / CREATE MODAL */}
      {editingEcu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 text-right flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">
                {editingEcu.id && ecusList.some(e => e.id === editingEcu.id)
                  ? `ویرایش ECU: ${editingEcu.brand} ${editingEcu.model}`
                  : 'ثبت ماژول یا کنترل‌یونیت (ECU) جدید'}
              </h3>
              <button onClick={() => setEditingEcu(null)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingEcu.rejectionReason && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-red-300">علت رد این ECU توسط مدیر فنی:</strong>
                  <p className="mt-1 leading-relaxed">{editingEcu.rejectionReason}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">خودرو مرتبط:</label>
                <select
                  value={editingEcu.vehicleId || ''}
                  onChange={(e) => setEditingEcu({ ...editingEcu, vehicleId: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">سازنده / برند ECU: *</label>
                <input
                  type="text"
                  value={editingEcu.brand || ''}
                  onChange={(e) => setEditingEcu({ ...editingEcu, brand: e.target.value })}
                  placeholder="Bosch, Siemens, Valeo, Delphi..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">مدل فنی ECU: *</label>
                <input
                  type="text"
                  value={editingEcu.model || ''}
                  onChange={(e) => setEditingEcu({ ...editingEcu, model: e.target.value })}
                  placeholder="ME 7.4.4 یا S2000 یا VDO"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">تعداد سوکت‌های متصل:</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={editingEcu.connectorCount || 2}
                  onChange={(e) => setEditingEcu({ ...editingEcu, connectorCount: parseInt(e.target.value, 10) || 1 })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">نسخه یا پارت‌نامبر سخت‌افزار:</label>
                <input
                  type="text"
                  value={editingEcu.hardwareVersion || ''}
                  onChange={(e) => setEditingEcu({ ...editingEcu, hardwareVersion: e.target.value })}
                  placeholder="HW: 0261206839"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">وضعیت انتشار:</label>
                <select
                  value={editingEcu.status || 'published'}
                  onChange={(e) => setEditingEcu({ ...editingEcu, status: e.target.value as PublicationStatus })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="published">منتشرشده (عمومی)</option>
                  <option value="verified">تأییدشده رسمی</option>
                  <option value="pending">در انتظار بررسی</option>
                  <option value="draft">پیش‌نویس</option>
                  <option value="rejected">ردشده (دارای نقص فنی)</option>
                </select>
              </div>

              <div className="col-span-full">
                <label className="text-zinc-400 block mb-1">توضیحات و نکات پروگرم / دیاگ:</label>
                <textarea
                  value={editingEcu.description || ''}
                  onChange={(e) => setEditingEcu({ ...editingEcu, description: e.target.value })}
                  rows={2}
                  placeholder="نکات رید و رایت، کد سوئیچ، کالیبراسیون و فلش..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingEcu(null)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveEcu}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md shadow-red-950 flex items-center gap-1.5 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره ECU در بانک اطلاعاتی</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewingEcu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 text-right flex flex-col gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">{viewingEcu.brand} {viewingEcu.model}</h3>
              <button onClick={() => setViewingEcu(null)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">شناسه:</span>
                <span className="text-white font-mono">{viewingEcu.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">تعداد سوکت:</span>
                <span className="text-white">{viewingEcu.connectorCount} سوکت</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">سخت‌افزار:</span>
                <span className="text-white font-mono">{viewingEcu.hardwareVersion || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">وضعیت:</span>
                <span className="text-emerald-400 font-bold">{viewingEcu.status || 'published'}</span>
              </div>
              {viewingEcu.description && (
                <div className="pt-2">
                  <span className="text-zinc-400 block mb-1">یادداشت فنی:</span>
                  <p className="text-zinc-200 leading-relaxed bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                    {viewingEcu.description}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                onClick={() => setViewingEcu(null)}
                className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-xs font-bold"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAFE DELETE CONFIRMATION MODAL */}
      {deletingEcu && (
        <DeleteConfirmModal
          isOpen={Boolean(deletingEcu)}
          onClose={() => setDeletingEcu(null)}
          onConfirm={handleDeleteConfirmed}
          entityType="ecu"
          entityId={deletingEcu.id}
          entityTitle={`${deletingEcu.brand} ${deletingEcu.model}`}
        />
      )}

      {/* VERSION HISTORY MODAL */}
      {historyEcu && (
        <VersionHistoryModal
          isOpen={Boolean(historyEcu)}
          onClose={() => setHistoryEcu(null)}
          recordId={historyEcu.id}
          entityType="ecu"
          recordTitle={`${historyEcu.brand} ${historyEcu.model}`}
          onDataRestored={reloadData}
        />
      )}

      {/* ECU SOCKETS & PINOUTS MANAGER MODAL */}
      {socketManagerEcu && (
        <EcuSocketManagerModal
          isOpen={Boolean(socketManagerEcu)}
          ecu={socketManagerEcu}
          onClose={() => setSocketManagerEcu(null)}
          onDataChanged={reloadData}
        />
      )}
    </div>
  );
};

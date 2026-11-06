import React, { useState } from 'react';
import {
  Image as ImageIcon,
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
  FileText,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { MediaItem, WiringDiagram, PublicationStatus, TechnicalImageType } from '../../types';
import { storage } from '../../services/storage';
import { onlineStorage } from '../../services/onlineStorage';
import { useAuth } from '../../context/AuthContext';
import { ImageViewerModal } from '../ImageViewerModal';
import { MediaUploadModal } from '../MediaUploadModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface MediaManagerTabProps {
  onRefreshData?: () => void;
  onOpenBulkImport?: (type: 'images') => void;
}

export const MediaManagerTab: React.FC<MediaManagerTabProps> = ({
  onRefreshData,
  onOpenBulkImport
}) => {
  const { isAdmin, isOnlineDbConnected } = useAuth();
  const [mediaList, setMediaList] = useState<MediaItem[]>(() => storage.getMediaItems());
  const [diagramsList, setDiagramsList] = useState<WiringDiagram[]>(() => storage.getWiringDiagrams());
  const [subTab, setSubTab] = useState<'media' | 'diagrams'>('media');
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageTitle, setPreviewImageTitle] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [editingDiagram, setEditingDiagram] = useState<WiringDiagram | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; title: string; type: 'media' | 'diagram' } | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const vehicles = storage.getVehicles();

  const reloadData = () => {
    setMediaList(storage.getMediaItems());
    setDiagramsList(storage.getWiringDiagrams());
    onRefreshData?.();
  };

  // Filtered Media
  const filteredMedia = mediaList.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.source && item.source.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesVehicle = vehicleFilter === 'all' || item.vehicleId === vehicleFilter;
    const matchesType = typeFilter === 'all' || item.imageType === typeFilter;
    const matchesStatus = statusFilter === 'all' || (item.status || 'published') === statusFilter;

    return matchesSearch && matchesVehicle && matchesType && matchesStatus;
  });

  // Filtered Diagrams
  const filteredDiagrams = diagramsList.filter(diag => {
    const matchesSearch =
      diag.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      diag.categoryFa.includes(searchQuery) ||
      diag.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesVehicle = vehicleFilter === 'all' || diag.vehicleId === vehicleFilter;
    const matchesStatus = statusFilter === 'all' || (diag.status || 'published') === statusFilter;

    return matchesSearch && matchesVehicle && matchesStatus;
  });

  const handleSaveMedia = async () => {
    if (!editingMedia?.title?.trim()) {
      alert('لطفاً عنوان تصویر را وارد کنید.');
      return;
    }

    storage.saveMediaItem(editingMedia);
    if (isAdmin && isOnlineDbConnected) {
      try {
        await onlineStorage.saveMedia(editingMedia);
      } catch (err) {
        console.warn('Error saving media to firestore:', err);
      }
    }

    setEditingMedia(null);
    reloadData();
    setSuccessBanner('مشخصات تصویر با موفقیت به‌روزرسانی شد.');
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  const handleSaveDiagram = async () => {
    if (!editingDiagram?.title?.trim()) {
      alert('لطفاً عنوان نقشه سیم‌کشی را وارد کنید.');
      return;
    }

    storage.saveWiringDiagram(editingDiagram);
    if (isAdmin && isOnlineDbConnected) {
      try {
        await onlineStorage.saveWiringDiagram(editingDiagram);
      } catch (err) {
        console.warn('Error saving diagram to firestore:', err);
      }
    }

    setEditingDiagram(null);
    reloadData();
    setSuccessBanner('نقشه سیم‌کشی با موفقیت ذخیره شد.');
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  const handleDeleteConfirmed = async () => {
    if (!deletingItem) return;

    if (deletingItem.type === 'media') {
      storage.deleteMediaItem(deletingItem.id);
      if (isAdmin && isOnlineDbConnected) {
        try {
          await onlineStorage.deleteMedia(deletingItem.id);
        } catch (err) {
          console.warn(err);
        }
      }
    } else {
      storage.deleteWiringDiagram(deletingItem.id);
      if (isAdmin && isOnlineDbConnected) {
        try {
          await onlineStorage.deleteWiringDiagram(deletingItem.id);
        } catch (err) {
          console.warn(err);
        }
      }
    }

    setDeletingItem(null);
    reloadData();
    setSuccessBanner('آیتم با موفقیت از سیستم حذف شد.');
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  return (
    <div className="flex flex-col gap-4 text-right">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">مدیریت تصاویر فنی و نقشه‌های سیم‌کشی</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              تفکیک در دسته‌های اختصاصی (عکس واقعی، درپوش، پیناوت، نقشه سیم‌کشی) بدون تکرار
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenBulkImport && (
            <button
              onClick={() => onOpenBulkImport('images')}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>ورود گروهی Excel</span>
            </button>
          )}

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-red-950 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>بارگذاری تصویر جدید</span>
          </button>
        </div>
      </div>

      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Sub tabs: Media vs Diagrams */}
      <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs overflow-x-auto gap-1">
        <button
          onClick={() => setSubTab('media')}
          className={`flex items-center gap-2 px-3 py-1.5 font-bold rounded-lg transition ${
            subTab === 'media' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-red-500" />
          <span>تصاویر و مستندات فنی ({mediaList.length})</span>
        </button>

        <button
          onClick={() => setSubTab('diagrams')}
          className={`flex items-center gap-2 px-3 py-1.5 font-bold rounded-lg transition ${
            subTab === 'diagrams' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FileText className="w-4 h-4 text-sky-400" />
          <span>نقشه‌های سیم‌کشی کامل مدار ({diagramsList.length})</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان، منبع، توضیحات..."
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

        {subTab === 'media' && (
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3 py-2 text-white focus:outline-none"
            >
              <option value="all">همه دسته‌بندی‌های تصویر</option>
              <option value="real_part">تصویر واقعی قطعه</option>
              <option value="fusebox_real">تصویر واقعی جعبه‌فیوز</option>
              <option value="fusebox_cover">تصویر درپوش جعبه‌فیوز</option>
              <option value="fusebox_diagram">تصویر شماتیک جعبه‌فیوز</option>
              <option value="socket_front">نمای روبروی سوکت</option>
              <option value="socket_back">نمای پشت سوکت</option>
              <option value="socket_schematic">شماتیک سوکت</option>
              <option value="pinout_diagram">تصویر پیناوت</option>
            </select>
          </div>
        )}

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3 py-2 text-white focus:outline-none"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="published">منتشرشده (عمومی)</option>
            <option value="verified">تأییدشده</option>
            <option value="draft">پیش‌نویس</option>
          </select>
        </div>
      </div>

      {/* Media Grid */}
      {subTab === 'media' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredMedia.length === 0 ? (
            <div className="col-span-full py-8 text-center text-zinc-500 text-xs bg-zinc-950 rounded-2xl border border-zinc-800">
              تصویری مطابق با فیلترها یافت نشد.
            </div>
          ) : (
            filteredMedia.map(item => {
              const veh = vehicles.find(v => v.id === item.vehicleId);
              return (
                <div
                  key={item.id}
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden flex flex-col justify-between transition shadow-xs group"
                >
                  <div
                    onClick={() => {
                      setPreviewImageUrl(item.fileUrl);
                      setPreviewImageTitle(item.title);
                    }}
                    className="relative aspect-video bg-zinc-950 cursor-pointer overflow-hidden flex items-center justify-center border-b border-zinc-800/80"
                  >
                    {item.fileUrl ? (
                      <img
                        src={item.fileUrl}
                        alt={item.title}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-zinc-700" />
                    )}
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/75 text-[10px] text-zinc-300 font-mono">
                      {item.imageType}
                    </span>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                        {veh?.name || 'عمومی'} · {item.source || 'AutoPin Pro'}
                      </p>
                      {item.description && (
                        <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-900/60">
                        {item.status || 'published'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setPreviewImageUrl(item.fileUrl);
                            setPreviewImageTitle(item.title);
                          }}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          title="بزرگنمایی"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingMedia({ ...item })}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          title="ویرایش"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingItem({ id: item.id, title: item.title, type: 'media' })}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-red-400"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Diagrams Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredDiagrams.length === 0 ? (
            <div className="col-span-full py-8 text-center text-zinc-500 text-xs bg-zinc-950 rounded-2xl border border-zinc-800">
              نقشه سیم‌کشی مطابق با فیلتر یافت نشد.
            </div>
          ) : (
            filteredDiagrams.map(diag => {
              const veh = vehicles.find(v => v.id === diag.vehicleId);
              return (
                <div
                  key={diag.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950/60 text-sky-400 border border-sky-900/60 font-semibold">
                        {diag.categoryFa}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1.5">{diag.title}</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        خودرو: {veh?.name || 'عمومی'} · مرجع: {diag.source}
                      </p>
                      <p className="text-xs text-zinc-300 mt-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                        {diag.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
                    <span className="text-[10px] text-zinc-500 font-mono">{diag.id}</span>

                    <div className="flex items-center gap-1">
                      {diag.diagramImageUrl && (
                        <button
                          onClick={() => {
                            setPreviewImageUrl(diag.diagramImageUrl);
                            setPreviewImageTitle(diag.title);
                          }}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          title="مشاهده نقشه"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingDiagram({ ...diag })}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        title="ویرایش"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingItem({ id: diag.id, title: diag.title, type: 'diagram' })}
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
      )}

      {/* EDIT MEDIA MODAL */}
      {editingMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 text-right flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">ویرایش مشخصات تصویر فنی</h3>
              <button onClick={() => setEditingMedia(null)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">عنوان تصویر: *</label>
              <input
                type="text"
                value={editingMedia.title}
                onChange={(e) => setEditingMedia({ ...editingMedia, title: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">دسته‌بندی نوع تصویر:</label>
              <select
                value={editingMedia.imageType}
                onChange={(e) => setEditingMedia({ ...editingMedia, imageType: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
              >
                <option value="fusebox_real">تصویر واقعی جعبه‌فیوز</option>
                <option value="fusebox_cover">تصویر درپوش جعبه‌فیوز</option>
                <option value="fusebox_diagram">تصویر شماتیک فیوزها</option>
                <option value="socket_front">نمای روبروی سوکت</option>
                <option value="socket_back">نمای پشت سوکت</option>
                <option value="socket_schematic">شماتیک سوکت</option>
                <option value="pinout_diagram">تصویر پیناوت</option>
                <option value="real_part">تصویر واقعی قطعه</option>
              </select>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">منبع یا مرجع:</label>
              <input
                type="text"
                value={editingMedia.source || ''}
                onChange={(e) => setEditingMedia({ ...editingMedia, source: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">توضیحات فنی تکمیلی:</label>
              <textarea
                value={editingMedia.description || ''}
                onChange={(e) => setEditingMedia({ ...editingMedia, description: e.target.value })}
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setEditingMedia(null)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveMedia}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره تغییرات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DIAGRAM MODAL */}
      {editingDiagram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 text-right flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">ویرایش نقشه سیم‌کشی</h3>
              <button onClick={() => setEditingDiagram(null)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">عنوان مدار سیم‌کشی: *</label>
              <input
                type="text"
                value={editingDiagram.title}
                onChange={(e) => setEditingDiagram({ ...editingDiagram, title: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">توضیحات و عیب‌یابی مدار:</label>
              <textarea
                value={editingDiagram.description}
                onChange={(e) => setEditingDiagram({ ...editingDiagram, description: e.target.value })}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setEditingDiagram(null)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveDiagram}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره نقشه سیم‌کشی</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW MEDIA UPLOAD MODAL */}
      <MediaUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        entityType="fusebox"
        entityId={vehicles[0]?.id || 'universal'}
        entityName="تصویر و مستند فنی جدید"
        onMediaUploaded={(media) => {
          storage.saveMediaItem(media);
          if (isAdmin && isOnlineDbConnected) {
            onlineStorage.saveMedia(media);
          }
          setIsUploadModalOpen(false);
          reloadData();
          setSuccessBanner('تصویر جدید با موفقیت بارگذاری و در بانک اطلاعاتی ثبت شد.');
          setTimeout(() => setSuccessBanner(null), 3500);
        }}
      />

      {/* FULL ZOOM IMAGE VIEWER MODAL */}
      {previewImageUrl && (
        <ImageViewerModal
          isOpen={Boolean(previewImageUrl)}
          onClose={() => setPreviewImageUrl(null)}
          imageUrl={previewImageUrl}
          title={previewImageTitle}
        />
      )}

      {/* SAFE DELETE CONFIRMATION MODAL */}
      {deletingItem && (
        <DeleteConfirmModal
          isOpen={Boolean(deletingItem)}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleDeleteConfirmed}
          entityType={deletingItem.type === 'media' ? 'media' : 'diagram'}
          entityId={deletingItem.id}
          entityTitle={deletingItem.title}
        />
      )}
    </div>
  );
};

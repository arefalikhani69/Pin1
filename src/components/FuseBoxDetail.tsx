import React, { useState } from 'react';
import {
  ArrowRight,
  Search,
  Bookmark,
  BookmarkCheck,
  Maximize2,
  Zap,
  Info,
  ShieldAlert,
  Cpu,
  Layers,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Check,
  X,
  Sparkles,
  ExternalLink,
  Crosshair
} from 'lucide-react';
import { FuseBox, Fuse, Relay, MediaItem } from '../types';
import { storage } from '../services/storage';
import { onlineStorage } from '../services/onlineStorage';
import { useAuth } from '../context/AuthContext';
import { ImageViewerModal, GalleryImageItem } from './ImageViewerModal';
import { InteractiveFuseHotspots } from './InteractiveFuseHotspots';
import { MediaUploadModal } from './MediaUploadModal';
import { getFuseColor, getRelayColor } from '../utils/fuseColors';
import { buildDeduplicatedCategoryGallery, deduplicateMediaList } from '../utils/imageDeduplication';
import { FavoriteButton } from './FavoriteButton';

interface FuseBoxDetailProps {
  fuseBox: FuseBox;
  vehicleName?: string;
  initialFuseId?: string;
  initialRelayId?: string;
  initialTab?: 'interactive' | 'fuses' | 'relays' | 'gallery';
  onBack: () => void;
  onRefreshData?: () => void;
}

export const FuseBoxDetail: React.FC<FuseBoxDetailProps> = ({
  fuseBox,
  vehicleName,
  initialFuseId,
  initialRelayId,
  initialTab,
  onBack,
  onRefreshData
}) => {
  const { isAdmin, isOnlineDbConnected } = useAuth();
  const [fusesList, setFusesList] = useState<Fuse[]>(fuseBox.fuses);
  const [relaysList, setRelaysList] = useState<Relay[]>(fuseBox.relays);
  const [selectedFuse, setSelectedFuse] = useState<Fuse | null>(() => {
    if (initialFuseId) {
      const match = fuseBox.fuses.find(f => f.id === initialFuseId || f.code === initialFuseId);
      if (match) return match;
    }
    return fuseBox.fuses.length > 0 ? fuseBox.fuses[0] : null;
  });
  const [selectedRelay, setSelectedRelay] = useState<Relay | null>(() => {
    if (initialRelayId) {
      const match = fuseBox.relays.find(r => r.id === initialRelayId || r.code === initialRelayId);
      if (match) return match;
    }
    return null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'interactive' | 'fuses' | 'relays' | 'gallery'>(() => {
    if (initialTab) return initialTab;
    if (initialRelayId) return 'relays';
    if (initialFuseId) return 'fuses';
    return 'interactive';
  });

  React.useEffect(() => {
    if (initialFuseId) {
      const match = fuseBox.fuses.find(f => f.id === initialFuseId || f.code === initialFuseId);
      if (match) {
        setSelectedFuse(match);
        setActiveTab('fuses');
      }
    }
    if (initialRelayId) {
      const match = fuseBox.relays.find(r => r.id === initialRelayId || r.code === initialRelayId);
      if (match) {
        setSelectedRelay(match);
        setActiveTab('relays');
      }
    }
  }, [initialFuseId, initialRelayId, fuseBox.fuses, fuseBox.relays]);
  const [isCalibratingMode, setIsCalibratingMode] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [uploadTargetField, setUploadTargetField] = useState<'realImageUrl' | 'coverDiagramUrl' | 'diagramImageUrl'>('realImageUrl');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<GalleryImageItem[] | null>(null);
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState<number>(0);
  const [isFav, setIsFav] = useState(storage.isFavorite('fusebox', fuseBox.id));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state if fuseBox prop changes
  React.useEffect(() => {
    setFusesList(fuseBox.fuses);
    setRelaysList(fuseBox.relays);
  }, [fuseBox]);

  // Load associated media items
  React.useEffect(() => {
    let isMounted = true;
    const loadMedia = async () => {
      try {
        const cloudMedia = await onlineStorage.getMedia(fuseBox.id);
        if (isMounted) setMediaItems(deduplicateMediaList(cloudMedia));
      } catch {
        if (isMounted) setMediaItems(deduplicateMediaList(storage.getMediaItems(fuseBox.id)));
      }
    };
    loadMedia();
    return () => { isMounted = false; };
  }, [fuseBox.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleToggleFavorite = () => {
    const newState = storage.toggleFavorite({
      type: 'fusebox',
      itemId: fuseBox.id,
      title: fuseBox.name,
      subtitle: `${vehicleName || 'خودرو'} · ${fuseBox.locationFa}`
    });
    setIsFav(newState);
  };

  // Update fuse hotspot position in state
  const handleUpdateFusePosition = (fuseId: string, xPercent: number, yPercent: number) => {
    setFusesList(prev => prev.map(f => {
      if (f.id === fuseId) {
        return { ...f, xPercent, yPercent };
      }
      return f;
    }));
  };

  // Update relay hotspot position in state
  const handleUpdateRelayPosition = (relayId: string, xPercent: number, yPercent: number) => {
    setRelaysList(prev => prev.map(r => {
      if (r.id === relayId) {
        return { ...r, xPercent, yPercent };
      }
      return r;
    }));
  };

  // Clear position of a single item
  const handleClearPosition = (type: 'fuse' | 'relay', id: string) => {
    if (type === 'fuse') {
      setFusesList(prev => prev.map(f => f.id === id ? { ...f, xPercent: undefined, yPercent: undefined } : f));
    } else {
      setRelaysList(prev => prev.map(r => r.id === id ? { ...r, xPercent: undefined, yPercent: undefined } : r));
    }
    showToast('موقعیت نقطه لمسی پاک شد.');
  };

  // Revert all positions to initial
  const handleRevertPositions = () => {
    setFusesList(fuseBox.fuses);
    setRelaysList(fuseBox.relays);
    showToast('تغییرات موقعیت‌ها لغو شد.');
  };

  // Save positions permanently to localStorage and Firestore
  const handleSavePositions = async () => {
    const updatedFb: FuseBox = {
      ...fuseBox,
      fuses: fusesList,
      relays: relaysList
    };

    storage.saveFuseBox(updatedFb);
    if (isAdmin && isOnlineDbConnected) {
      try {
        await onlineStorage.saveFuseBox(updatedFb);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'خطای ارتباط با سرور ابری';
        showToast(`خطا در ذخیره ابری: ${msg}`);
        throw err;
      }
    }
    showToast('کلیه موقعیت‌های فیوزها و رله‌ها با موفقیت ذخیره شدند.');
    onRefreshData?.();
  };



  // Filtered Fuses
  const filteredFuses = fusesList.filter(f => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      f.code.toLowerCase().includes(q) ||
      f.functionName.toLowerCase().includes(q) ||
      f.circuitDetails.toLowerCase().includes(q) ||
      f.ratingAmps.toString() === q
    );
  });

  // Filtered Relays
  const filteredRelays = relaysList.filter(r => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.code.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.functionName.toLowerCase().includes(q) ||
      (r.coilPins && r.coilPins.toLowerCase().includes(q)) ||
      (r.contactPins && r.contactPins.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 p-3 bg-zinc-900/95 border border-emerald-500/60 shadow-2xl rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300 backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1 font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="p-2 -mr-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95 transition"
              title="بازگشت"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {fuseBox.name}
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-red-950/80 border border-red-800 text-red-300">
                  {fuseBox.locationFa}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-1">
                {vehicleName && <span className="text-zinc-200 font-medium">{vehicleName}</span>}
                {fuseBox.engineCode && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-400 font-mono">موتور {fuseBox.engineCode}</span>
                  </>
                )}
                {fuseBox.source && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-zinc-500">منبع: {fuseBox.source}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('interactive');
                    setIsCalibratingMode(prev => !prev);
                  }}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
                    isCalibratingMode
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-md shadow-amber-950'
                      : 'bg-zinc-800 border-zinc-700 text-amber-300 hover:text-white'
                  }`}
                  title="تعیین موقعیت روی تصویر"
                >
                  <Crosshair className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {isCalibratingMode ? 'در حال تعیین موقعیت' : 'تعیین موقعیت روی تصویر'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUploadTargetField('realImageUrl');
                    setIsMediaModalOpen(true);
                  }}
                  className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold"
                  title="بارگذاری تصویر برد یا درپوش"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">بارگذاری تصویر</span>
                </button>
              </div>
            )}



            <FavoriteButton
              type="fusebox"
              itemId={fuseBox.id}
              title={fuseBox.name}
              subtitle={`${vehicleName || 'خودرو'} · ${fuseBox.locationFa}`}
              imageUrl={fuseBox.realImageUrl || fuseBox.coverDiagramUrl || fuseBox.diagramImageUrl}
              vehicleId={fuseBox.vehicleId}
              vehicleName={vehicleName}
              size="md"
            />
          </div>
        </div>

        {fuseBox.notes && (
          <p className="mt-3 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/80 pt-2.5">
            {fuseBox.notes}
          </p>
        )}
      </div>

      {/* View Switcher Tabs & Search Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('interactive')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'interactive'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>نقشه و تصویر تعاملی</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fuses')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'fuses'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-red-400" />
            <span>فهرست فیوزها ({fuseBox.fuses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('relays')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'relays'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>رله‌ها ({fuseBox.relays.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'gallery'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>تصاویر و نقشه‌ها</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی فیوز یا رله (F10، پمپ، فن، 15A)..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition"
          />
        </div>
      </div>

      {/* Interactive Pure Black Hotspot Map */}
      {activeTab === 'interactive' && (
        <InteractiveFuseHotspots
          fuseBox={{
            ...fuseBox,
            fuses: fusesList,
            relays: relaysList
          }}
          selectedFuse={selectedFuse}
          selectedRelay={selectedRelay}
          onSelectFuse={(f) => {
            setSelectedFuse(f);
            setSelectedRelay(null);
          }}
          onSelectRelay={(r) => {
            setSelectedRelay(r);
            setSelectedFuse(null);
          }}
          isAdmin={isAdmin}
          isCalibratingMode={isCalibratingMode}
          onToggleCalibrateMode={(m) => setIsCalibratingMode(m)}
          onUpdateFusePosition={handleUpdateFusePosition}
          onUpdateRelayPosition={handleUpdateRelayPosition}
          onClearPosition={handleClearPosition}
          onSavePositions={handleSavePositions}
          onRevertPositions={handleRevertPositions}
          onNavigateToFusesTab={() => setActiveTab('fuses')}
        />
      )}

      {/* Quick Matrix Grid for Fuses (When in fuses or interactive tab) */}
      {(activeTab === 'interactive' || activeTab === 'fuses') && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs">
            <span className="font-bold text-zinc-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-red-500" />
              <span>ماتریس دسترسی سریع فیوزها</span>
            </span>
            <span className="text-[11px] text-zinc-500">کد استاندارد رنگ فیوز خودرویی</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mt-3">
            {fusesList.map(fuse => {
              const colorInfo = getFuseColor(fuse.ratingAmps);
              const isSelected = selectedFuse?.id === fuse.id;

              return (
                <button
                  key={fuse.id}
                  type="button"
                  onClick={() => {
                    setSelectedFuse(fuse);
                    setSelectedRelay(null);
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition active:scale-95 ${
                    isSelected
                      ? 'ring-2 ring-red-400 bg-zinc-800 border-white shadow-lg'
                      : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-850'
                  }`}
                >
                  <span className="text-[11px] font-bold text-zinc-300 font-mono">{fuse.code}</span>
                  <div
                    className={`mt-1 px-2 py-0.5 rounded text-[10px] font-black tabular-nums border ${colorInfo.bg} ${colorInfo.text} ${colorInfo.border}`}
                  >
                    {fuse.ratingAmps}A
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Inspection Card for Selected Fuse */}
      {selectedFuse && !selectedRelay && (
        <div className="bg-zinc-900 border-2 border-red-900/60 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              {/* Amperage Color Hex Badge */}
              <div
                className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shadow-lg border shrink-0 ${
                  getFuseColor(selectedFuse.ratingAmps).bg
                } ${getFuseColor(selectedFuse.ratingAmps).text} ${getFuseColor(selectedFuse.ratingAmps).border}`}
              >
                <span className="text-[10px] opacity-90 font-mono">{selectedFuse.code}</span>
                <span className="text-base tabular-nums leading-none">{selectedFuse.ratingAmps}A</span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {selectedFuse.functionName}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                  <span className="text-amber-300 bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded text-[11px]">
                    نوع تغذیه: {selectedFuse.powerSupplyType}
                  </span>
                  <span className="text-zinc-400 text-[11px]">
                    رنگ بدنه استاندارد: {getFuseColor(selectedFuse.ratingAmps).label}
                  </span>
                  {isAdmin && isCalibratingMode && selectedFuse.xPercent !== undefined && (
                    <span className="text-amber-400 text-[10px] font-mono">
                      [موقعیت روی نقشه کالیبره شده]
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedFuse(null)}
              className="text-zinc-500 hover:text-zinc-300 self-end sm:self-center p-1"
              title="بستن پنجره جزئیات"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-zinc-300 font-semibold mb-1">
                <Layers className="w-3.5 h-3.5 text-red-400" />
                <span>مدار و مصرف‌کننده‌های تحت پوشش:</span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-[11px] sm:text-xs">
                {selectedFuse.circuitDetails || 'اطلاعات مدار ثبت نشده است.'}
              </p>
            </div>

            {selectedFuse.testTips ? (
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>راهنمای تست و عیب‌یابی در تعمیرگاه:</span>
                </div>
                <p className="text-zinc-300 leading-relaxed text-[11px] sm:text-xs">
                  {selectedFuse.testTips}
                </p>
              </div>
            ) : (
              <div className="bg-zinc-950/50 border border-zinc-850 rounded-xl p-3 flex items-center text-zinc-500 text-[11px]">
                تست سلامت فیوز با تست‌بوق یا اهم‌متر دو سر شاخک‌های فیوز بدون نیاز به بیرون کشیدن انجام شود.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Inspection Card for Selected Relay */}
      {selectedRelay && (() => {
        const rColor = getRelayColor(selectedRelay.contactAmps, selectedRelay.rating);
        return (
          <div className="bg-zinc-900 border-2 border-indigo-900/60 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-500" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 shadow-lg border ${rColor.bg} ${rColor.text} ${rColor.border}`}>
                  <Cpu className="w-4 h-4 mb-0.5 opacity-90" />
                  <span className="text-xs font-mono">{selectedRelay.code}</span>
                  <span className="text-[10px] font-black leading-none mt-0.5">
                    {selectedRelay.contactAmps ? `${selectedRelay.contactAmps}A` : (rColor.amps ? `${rColor.amps}A` : '')}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {selectedRelay.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${rColor.bg} ${rColor.text} ${rColor.border}`}>
                      جریان نامی کنتاکت: {selectedRelay.contactAmps ? `${selectedRelay.contactAmps} آمپر` : selectedRelay.rating}
                    </span>
                    {selectedRelay.coilVoltage && (
                      <span className="text-zinc-300 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-[11px] font-mono">
                        ولتاژ بوبین: {selectedRelay.coilVoltage}
                      </span>
                    )}
                    <span className="text-zinc-400 text-[11px]">
                      طیف جریان: {rColor.rangeFa}
                    </span>
                    {isAdmin && isCalibratingMode && selectedRelay.xPercent !== undefined && (
                      <span className="text-amber-400 text-[10px] font-mono">
                        [موقعیت روی نقشه کالیبره شده]
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <FavoriteButton
                  type="relay"
                  itemId={selectedRelay.id}
                  title={`رله ${selectedRelay.code} (${selectedRelay.name})`}
                  subtitle={`${fuseBox.name} · ${selectedRelay.functionName}`}
                  vehicleId={fuseBox.vehicleId}
                  vehicleName={vehicleName}
                  size="sm"
                />
                <button
                  type="button"
                  onClick={() => setSelectedRelay(null)}
                  className="text-zinc-500 hover:text-zinc-300 p-1"
                  title="بستن پنجره جزئیات"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3">
              <div className="text-zinc-400 mb-1">پایه‌های بوبین تحریک (Coil):</div>
              <p className="text-zinc-200 font-mono font-bold">{selectedRelay.coilPins || '۸۵ و ۸۶'}</p>
              <div className="text-zinc-400 mt-2 mb-1">پایه‌های کنتاکت قدرت (Switch):</div>
              <p className="text-zinc-200 font-mono font-bold">{selectedRelay.contactPins || '۳۰ و ۸۷'}</p>
            </div>

            {selectedRelay.diagnostics ? (
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3">
                <div className="text-amber-400 font-semibold mb-1">روش تست و عیب‌یابی رله:</div>
                <p className="text-zinc-300 leading-relaxed text-[11px] sm:text-xs">
                  {selectedRelay.diagnostics}
                </p>
              </div>
            ) : (
              <div className="bg-zinc-950/50 border border-zinc-850 rounded-xl p-3 flex items-center text-zinc-500 text-[11px]">
                با اعمال ولتاژ ۱۲ ولت به بوبین (پایه‌های ۸۵ و ۸۶) باید صدای کلیک شنیده شده و مقاومت بین پایه‌های ۳۰ و ۸۷ صفر اهم شود.
              </div>
            )}
          </div>
        </div>
        );
      })()}

      {/* List for Fuses Tab */}
      {activeTab === 'fuses' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-3 sm:p-4 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200">
              لیست کامل فیوزها ({filteredFuses.length} مورد)
            </span>
            <span className="text-[11px] text-zinc-500">جهت مشاهده مدار و مشخصات ضربه بزنید</span>
          </div>

          <div className="divide-y divide-zinc-800/60 max-h-[500px] overflow-y-auto">
            {filteredFuses.map(fuse => {
              const colorInfo = getFuseColor(fuse.ratingAmps);
              const isSelected = selectedFuse?.id === fuse.id;

              return (
                <div
                  key={fuse.id}
                  onClick={() => {
                    setSelectedFuse(fuse);
                    setSelectedRelay(null);
                  }}
                  className={`p-3 sm:px-4 flex items-center justify-between gap-3 cursor-pointer transition ${
                    isSelected ? 'bg-red-950/40 border-r-4 border-red-500' : 'hover:bg-zinc-850'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs tabular-nums shrink-0 border ${colorInfo.bg} ${colorInfo.text} ${colorInfo.border}`}
                    >
                      {fuse.ratingAmps}A
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-200 font-mono">{fuse.code}</span>
                        <span className="text-[11px] text-zinc-400 truncate">{fuse.functionName}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">{fuse.circuitDetails}</p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 text-left">
                    <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                      {fuse.powerSupplyType}
                    </span>
                    <FavoriteButton
                      type="fuse"
                      itemId={fuse.id}
                      title={`فیوز ${fuse.code} (${fuse.ratingAmps}A)`}
                      subtitle={`${fuseBox.name} · ${fuse.functionName}`}
                      vehicleId={fuseBox.vehicleId}
                      vehicleName={vehicleName}
                      size="sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List for Relays Tab */}
      {activeTab === 'relays' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-3 sm:p-4 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200">
              لیست رله‌های جعبه‌فیوز ({filteredRelays.length} مورد)
            </span>
            <span className="text-[11px] text-zinc-500">جهت بررسی پایه‌ها و تست ضربه بزنید</span>
          </div>

          <div className="divide-y divide-zinc-800/60 max-h-[500px] overflow-y-auto">
            {filteredRelays.map(rel => {
              const isSelected = selectedRelay?.id === rel.id;
              return (
                <div
                  key={rel.id}
                  onClick={() => {
                    setSelectedRelay(rel);
                    setSelectedFuse(null);
                  }}
                  className={`p-3 sm:px-4 flex items-center justify-between gap-3 cursor-pointer transition ${
                    isSelected ? 'bg-indigo-950/40 border-r-4 border-indigo-500' : 'hover:bg-zinc-850'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {(() => {
                      const rColor = getRelayColor(rel.contactAmps, rel.rating);
                      return (
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 border ${rColor.bg} ${rColor.text} ${rColor.border}`}>
                          {rel.code}
                        </span>
                      );
                    })()}
                    <div>
                      <p className="text-xs font-bold text-zinc-200">{rel.name}</p>
                      <p className="text-[11px] text-zinc-400">{rel.functionName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const rColor = getRelayColor(rel.contactAmps, rel.rating);
                      return (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border tabular-nums ${rColor.bg} ${rColor.text} ${rColor.border}`}>
                          {rel.contactAmps ? `${rel.contactAmps}A` : rel.rating}
                        </span>
                      );
                    })()}
                    <FavoriteButton
                      type="relay"
                      itemId={rel.id}
                      title={`رله ${rel.code} (${rel.name})`}
                      subtitle={`${fuseBox.name} · ${rel.functionName}`}
                      vehicleId={fuseBox.vehicleId}
                      vehicleName={vehicleName}
                      size="sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 4: CATEGORIZED TECHNICAL IMAGE GALLERY --- */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>آلبوم نقشه‌ها و تصاویر مستند جعبه‌فیوز</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                تفکیک تصاویر به دسته‌های واقعی، درپوش، شماتیک، پیناوت و سیم‌کشی با بالاترین وضوح برای کار در تعمیرگاه
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setUploadTargetField('coverDiagramUrl');
                  setIsMediaModalOpen(true);
                }}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-950 transition active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>+ بارگذاری تصویر جدید</span>
              </button>
            )}
          </div>

          {/* Helper to render image category section */}
          {[
            {
              id: 'real',
              title: 'تصاویر واقعی (Real Photos)',
              desc: 'عکس‌های واقعی با کیفیت از بورد الکترونیکی و قطعات فیزیکی',
              filter: (m: MediaItem) => m.imageType === 'fusebox_real' || m.imageType === 'real_part',
              fallbackUrl: fuseBox.realImageUrl
            },
            {
              id: 'cover',
              title: 'تصاویر درپوش جعبه‌فیوز (Fuse Box Cover)',
              desc: 'نقشه راهنما و جدول چاپ‌شده روی درپوش پلاستیکی جعبه‌فیوز',
              filter: (m: MediaItem) => m.imageType === 'fusebox_cover',
              fallbackUrl: fuseBox.coverDiagramUrl
            },
            {
              id: 'schematic',
              title: 'تصاویر شماتیک و دیاگرام فیوزها (Schematics)',
              desc: 'نقشه گرافیکی و موقعیت پایه‌های فیوزها',
              filter: (m: MediaItem) => m.imageType === 'fusebox_diagram' || m.imageType === 'socket_schematic' || m.imageType === 'schematic',
              fallbackUrl: fuseBox.diagramImageUrl
            },
            {
              id: 'wiring',
              title: 'نقشه‌های سیم‌کشی (Wiring Diagrams)',
              desc: 'مسیر سیم‌ها، دسته‌سیم‌ها و ارتباط با ECU و رله‌ها',
              filter: (m: MediaItem) => m.imageType === 'wiring_diagram',
              fallbackUrl: undefined
            },
            {
              id: 'socket',
              title: 'تصاویر سوکت و کانکتورها (Socket Images)',
              desc: 'تصاویر نمای روبه‌رو، پشت و کانکتورهای متصل به جعبه‌فیوز',
              filter: (m: MediaItem) => m.imageType === 'socket_front' || m.imageType === 'socket_back' || m.imageType === 'pinout_diagram',
              fallbackUrl: undefined
            },
            {
              id: 'supplementary',
              title: 'سایر تصاویر و چیدمان رله‌ها (Other Technical Images)',
              desc: 'تصاویر تکمیلی، راهنمای جداسازی خارها و موقعیت رله‌ها',
              filter: (m: MediaItem) => m.imageType === 'relays_layout' || m.imageType === 'supplementary' || m.imageType === 'other',
              fallbackUrl: undefined
            }
          ].map(category => {
            const matchedMedia = mediaItems.filter(category.filter);
            const categoryGalleryItems = buildDeduplicatedCategoryGallery(
              category.title,
              matchedMedia,
              category.fallbackUrl,
              'تصویر پایه',
              fuseBox.name,
              fuseBox.source
            );
            const hasItems = categoryGalleryItems.length > 0;

            return (
              <div key={category.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                      <span>{category.title}</span>
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{category.desc}</p>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    {categoryGalleryItems.length} تصویر
                  </span>
                </div>

                {!hasItems ? (
                  <div className="py-6 text-center text-zinc-500 text-xs bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800/80 flex flex-col items-center justify-center gap-1.5">
                    <ImageIcon className="w-6 h-6 opacity-40 text-zinc-600" />
                    <span>هنوز تصویری در دسته‌بندی «{category.title}» ثبت نشده است.</span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadTargetField(
                            category.id === 'cover' ? 'coverDiagramUrl' : category.id === 'schematic' ? 'diagramImageUrl' : 'realImageUrl'
                          );
                          setIsMediaModalOpen(true);
                        }}
                        className="mt-1 text-red-400 hover:text-red-300 text-[11px] font-semibold"
                      >
                        + افزودن تصویر به این بخش
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryGalleryItems.map((item, itemIdx) => (
                      <div key={item.id || `${item.url}-${itemIdx}`} className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden flex flex-col group">
                        <div
                          className="relative h-44 bg-black flex items-center justify-center cursor-pointer overflow-hidden"
                          onClick={() => {
                            setSelectedGalleryImages(categoryGalleryItems);
                            setSelectedGalleryIndex(itemIdx);
                          }}
                        >
                          <img
                            src={item.url}
                            alt={item.title}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                          />
                          <button
                            type="button"
                            className="absolute bottom-2 left-2 p-1.5 rounded-lg bg-black/70 text-white opacity-0 group-hover:opacity-100 transition"
                            title="بزرگ‌نمایی با کیفیت کامل"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-2.5 flex flex-col gap-1 border-t border-zinc-800 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-200 truncate">{item.title}</span>
                            {item.source && (
                              <span className="text-[10px] text-amber-400 font-mono truncate max-w-[100px]">
                                {item.source}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Media Upload Modal for Admin */}
      <MediaUploadModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        entityType="fusebox"
        entityId={fuseBox.id}
        entityName={fuseBox.name}
        vehicleId={fuseBox.vehicleId}
        onMediaUploaded={(media) => {
          setMediaItems(prev => deduplicateMediaList([media, ...prev]));

          // Update corresponding image field on fusebox purely for database metadata
          const updated: FuseBox = { ...fuseBox };
          if (media.imageType === 'fusebox_cover') {
            updated.coverDiagramUrl = media.fileUrl;
          } else if (media.imageType === 'fusebox_diagram' || media.imageType === 'socket_schematic' || media.imageType === 'schematic') {
            updated.diagramImageUrl = media.fileUrl;
          } else if (media.imageType === 'fusebox_real' || media.imageType === 'real_part') {
            updated.realImageUrl = media.fileUrl;
          }

          storage.saveFuseBox(updated);
          if (isAdmin && isOnlineDbConnected) {
            onlineStorage.saveFuseBox(updated).catch(console.warn);
          }
          onRefreshData?.();
          showToast('تصویر با موفقیت در آلبوم تصاویر و نقشه‌ها ثبت شد.');
        }}
      />

      {/* Full Screen Image Viewer Modal for Gallery Selection */}
      {selectedGalleryImages && (
        <ImageViewerModal
          isOpen={Boolean(selectedGalleryImages)}
          onClose={() => setSelectedGalleryImages(null)}
          images={selectedGalleryImages}
          initialIndex={selectedGalleryIndex}
        />
      )}
    </div>
  );
};

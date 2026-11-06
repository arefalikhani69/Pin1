import React, { useState } from 'react';
import {
  ArrowRight,
  Search,
  Bookmark,
  BookmarkCheck,
  Zap,
  Info,
  Maximize2,
  List,
  Grid,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Activity,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Connector, ConnectorPin, SignalType, MediaItem } from '../types';
import { storage } from '../services/storage';
import { onlineStorage } from '../services/onlineStorage';
import { useAuth } from '../context/AuthContext';
import { useDisplaySettings } from '../context/DisplaySettingsContext';
import { InteractiveSocket } from './InteractiveSocket';
import { ImageViewerModal } from './ImageViewerModal';
import { MediaUploadModal } from './MediaUploadModal';
import { buildDeduplicatedCategoryGallery, deduplicateMediaList } from '../utils/imageDeduplication';
import { FavoriteButton } from './FavoriteButton';

interface ConnectorDetailProps {
  connector: Connector;
  vehicleName?: string;
  ecuName?: string;
  initialPinId?: string;
  onBack: () => void;
  onRefreshData?: () => void;
  onSelectVehicle?: (vehicleId: string) => void;
}

export const ConnectorDetail: React.FC<ConnectorDetailProps> = ({
  connector,
  vehicleName,
  ecuName,
  initialPinId,
  onBack,
  onRefreshData
}) => {
  const { isAdmin, isOnlineDbConnected } = useAuth();
  const { settings } = useDisplaySettings();
  const [selectedPin, setSelectedPin] = useState<ConnectorPin | null>(() => {
    if (initialPinId) {
      const match = connector.pins.find(p => p.id === initialPinId || p.pinNumber === initialPinId);
      if (match) return match;
    }
    return connector.pins.length > 0 ? connector.pins[0] : null;
  });

  React.useEffect(() => {
    if (initialPinId) {
      const match = connector.pins.find(p => p.id === initialPinId || p.pinNumber === initialPinId);
      if (match) setSelectedPin(match);
    }
  }, [initialPinId, connector.pins]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSignalFilter, setSelectedSignalFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'interactive' | 'table' | 'image'>(() => {
    if (settings.connectorViewMode === 'compact') return 'table';
    return 'interactive';
  });
  const [selectedImageAngle, setSelectedImageAngle] = useState<'real' | 'front' | 'back' | 'diagram'>('real');
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedViewerMedia, setSelectedViewerMedia] = useState<{ url: string; title: string; subtitle?: string } | null>(null);
  const [isFav, setIsFav] = useState(storage.isFavorite('connector', connector.id));

  // Load associated media for connector
  React.useEffect(() => {
    let isMounted = true;
    const loadMedia = async () => {
      try {
        const cloudMedia = await onlineStorage.getMedia(connector.id);
        if (isMounted) setMediaItems(deduplicateMediaList(cloudMedia));
      } catch {
        if (isMounted) setMediaItems(deduplicateMediaList(storage.getMediaItems(connector.id)));
      }
    };
    loadMedia();
    return () => { isMounted = false; };
  }, [connector.id]);

  const handleToggleFavorite = () => {
    const newState = storage.toggleFavorite({
      type: 'connector',
      itemId: connector.id,
      title: connector.name,
      subtitle: `${vehicleName || 'خودرو'} · ${connector.pinCount} پایه`
    });
    setIsFav(newState);
  };

  // Signal translation helper
  const getSignalBadge = (sig: SignalType) => {
    switch (sig) {
      case '12V_BAT':
        return <span className="text-red-400 bg-red-950/60 border border-red-800/80 px-2 py-0.5 rounded text-[11px] font-medium">+12V دائم باتری (خط ۳۰)</span>;
      case '12V_IGN':
        return <span className="text-orange-400 bg-orange-950/60 border border-orange-800/80 px-2 py-0.5 rounded text-[11px] font-medium">+12V سوئیچ (خط ۱۵)</span>;
      case '5V_REF':
        return <span className="text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded text-[11px] font-medium">+5V رفرنس سنسور</span>;
      case 'GROUND':
        return <span className="text-zinc-300 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-[11px] font-medium">اتصال بدنه / منفی (خط ۳۱)</span>;
      case 'PWM_PULSE':
        return <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded text-[11px] font-medium">سیگنال و پالس (PWM)</span>;
      case 'ANALOG_IN':
        return <span className="text-sky-400 bg-sky-950/60 border border-sky-800/80 px-2 py-0.5 rounded text-[11px] font-medium">ورودی سیگنال آنالوگ</span>;
      case 'CAN_BUS':
        return <span className="text-purple-400 bg-purple-950/60 border border-purple-800/80 px-2 py-0.5 rounded text-[11px] font-medium">شبکه CAN (کن‌باس)</span>;
      case 'K_LINE':
        return <span className="text-fuchsia-400 bg-fuchsia-950/60 border border-fuchsia-800/80 px-2 py-0.5 rounded text-[11px] font-medium">خط عیب‌یابی دیاگ (K-Line)</span>;
      default:
        return <span className="text-zinc-400 bg-zinc-800/60 border border-zinc-700 px-2 py-0.5 rounded text-[11px]">آزاد / بدون اتصال</span>;
    }
  };

  // Filter pins
  const filteredPins = connector.pins.filter(pin => {
    const matchesSearch =
      pin.pinNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pin.pinName && pin.pinName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (pin.dutyCategory && pin.dutyCategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (pin.pulseType && pin.pulseType.toLowerCase().includes(searchQuery.toLowerCase())) ||
      pin.wireColor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pin.functionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pin.notes && pin.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSignal =
      selectedSignalFilter === 'all' ||
      (selectedSignalFilter === '12v' && (pin.signalType === '12V_BAT' || pin.signalType === '12V_IGN')) ||
      (selectedSignalFilter === 'ground' && pin.signalType === 'GROUND') ||
      (selectedSignalFilter === '5v' && pin.signalType === '5V_REF') ||
      (selectedSignalFilter === 'pulse' && (pin.signalType === 'PWM_PULSE' || pin.signalType === 'ANALOG_IN'));

    return matchesSearch && matchesSignal;
  });

  // Determine which image to show
  const getCurrentImageUrl = () => {
    if (selectedImageAngle === 'front' && connector.frontImageUrl) return connector.frontImageUrl;
    if (selectedImageAngle === 'back' && connector.backImageUrl) return connector.backImageUrl;
    if (selectedImageAngle === 'diagram' && connector.pinoutDiagramUrl) return connector.pinoutDiagramUrl;
    return connector.realImageUrl || connector.pinoutDiagramUrl || connector.frontImageUrl || '';
  };

  const hasAnyImages = Boolean(
    connector.realImageUrl ||
    connector.frontImageUrl ||
    connector.backImageUrl ||
    connector.pinoutDiagramUrl
  );

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Top Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-2 -mr-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95 transition"
              title="بازگشت"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {connector.name}
              </h1>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                {vehicleName && <span>{vehicleName}</span>}
                {ecuName && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-zinc-300 font-medium">{ecuName}</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{connector.pinCount} پایه</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setIsMediaModalOpen(true)}
                className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
                title="بارگذاری تصویر روبه‌رو، پشت یا نقشه سوکت"
              >
                <Upload className="w-4 h-4 text-red-400" />
                <span className="hidden sm:inline">افزودن تصویر</span>
              </button>
            )}

            <FavoriteButton
              type="connector"
              itemId={connector.id}
              title={connector.name}
              subtitle={`${vehicleName || 'خودرو'} · ${connector.pinCount} پایه`}
              imageUrl={connector.realImageUrl || connector.pinoutDiagramUrl}
              vehicleId={connector.vehicleId}
              vehicleName={vehicleName}
              size="md"
            />
          </div>
        </div>

        {/* Status & Verification Badges */}
        <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {connector.status === 'published' || connector.status === 'verified' ? (
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded text-[11px]">
                <CheckCircle2 className="w-3 h-3" />
                اطلاعات تأییدشده آزمایشگاهی
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded text-[11px]">
                <AlertTriangle className="w-3 h-3" />
                اطلاعات در انتظار تایید / پیش‌نویس
              </span>
            )}
            <span className="text-zinc-400 text-[11px]">منبع: {connector.source || 'کاتالوگ کارخانه سازنده'}</span>
          </div>

          {hasAnyImages && (
            <button
              onClick={() => setIsViewerOpen(true)}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>مشاهده در ابعاد بزرگ</span>
            </button>
          )}
        </div>
      </div>

      {/* View Switcher Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Mode Tabs */}
        <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          <button
            onClick={() => setActiveTab('interactive')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'interactive'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>شماتیک تعاملی</span>
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'table'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>جدول پایه‌ها</span>
          </button>
          {hasAnyImages && (
            <button
              onClick={() => setActiveTab('image')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'image'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>تصاویر فیزیکی</span>
            </button>
          )}
        </div>

        {/* Quick Pin Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی پایه (شماره، رنگ، وظیفه)..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition"
          />
        </div>
      </div>

      {/* Signal Type Filter Tags */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] text-zinc-500 shrink-0 ml-1">فیلتر:</span>
        <button
          onClick={() => setSelectedSignalFilter('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
            selectedSignalFilter === 'all'
              ? 'bg-zinc-800 text-white border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          همه پایه‌ها ({connector.pins.length})
        </button>
        <button
          onClick={() => setSelectedSignalFilter('12v')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
            selectedSignalFilter === '12v'
              ? 'bg-red-950/80 text-red-300 border border-red-800'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          برق ۱۲ ولت
        </button>
        <button
          onClick={() => setSelectedSignalFilter('ground')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
            selectedSignalFilter === 'ground'
              ? 'bg-zinc-800 text-zinc-200 border border-zinc-600'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          اتصال بدنه
        </button>
        <button
          onClick={() => setSelectedSignalFilter('5v')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
            selectedSignalFilter === '5v'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          ۵ ولت سنسور
        </button>
        <button
          onClick={() => setSelectedSignalFilter('pulse')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
            selectedSignalFilter === 'pulse'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          سیگنال و پالس
        </button>
      </div>

      {/* Main Content Area based on Tab */}
      {activeTab === 'interactive' && (
        <InteractiveSocket
          connector={connector}
          selectedPinId={selectedPin?.id || null}
          onSelectPin={(pin) => setSelectedPin(pin)}
        />
      )}

      {activeTab === 'image' && (
        <div className="space-y-6">
          {/* Header Card with Upload Button */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>تصاویر، نقشه‌ها و دیاگرام‌های فنی سوکت</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                تفکیک تصاویر به دسته‌های واقعی، نمای روبه‌رو/پشت، شماتیک، پیناوت و سیم‌کشی با وضوح بالا
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsMediaModalOpen(true)}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-950 transition active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>+ بارگذاری تصویر جدید</span>
              </button>
            )}
          </div>

          {/* Categorized Image Sections */}
          {[
            {
              id: 'real',
              title: 'تصاویر واقعی سوکت و قطعه (Real Photos)',
              desc: 'عکس‌های واقعی با کیفیت از سوکت، نمای روبه‌رو، پشت و خارهای قفل‌کننده',
              filter: (m: MediaItem) => m.imageType === 'real_part' || m.imageType === 'socket_front' || m.imageType === 'socket_back',
              fallbackUrls: [
                { url: connector.realImageUrl, label: 'نمای کلی سوکت' },
                { url: connector.frontImageUrl, label: 'نمای روبه‌رو (محل ورود پین)' },
                { url: connector.backImageUrl, label: 'نمای پشت (محل ورود سیم)' }
              ].filter(item => Boolean(item.url))
            },
            {
              id: 'schematic',
              title: 'تصاویر شماتیک سوکت (Schematics)',
              desc: 'ساختار فنی، شکل هندسی و جهت قرارگیری پایه‌ها',
              filter: (m: MediaItem) => m.imageType === 'socket_schematic',
              fallbackUrls: []
            },
            {
              id: 'pinout',
              title: 'تصاویر و نقشه‌های پیناوت (Pinout Diagrams)',
              desc: 'دیاگرام کامل پین‌بندی، شماره پایه‌ها و جدول ولتاژها',
              filter: (m: MediaItem) => m.imageType === 'pinout_diagram',
              fallbackUrls: connector.pinoutDiagramUrl ? [{ url: connector.pinoutDiagramUrl, label: 'نقشه پیناوت پایه' }] : []
            },
            {
              id: 'wiring',
              title: 'نقشه‌های سیم‌کشی مرتبط (Wiring Diagrams)',
              desc: 'دیاگرام اتصالات سوکت به ECU، رله‌ها و سنسورها',
              filter: (m: MediaItem) => m.imageType === 'wiring_diagram',
              fallbackUrls: []
            },
            {
              id: 'supplementary',
              title: 'سایر تصاویر و راهنمای نصب (Supplementary)',
              desc: 'تصاویر تکمیلی، روش جداسازی خارها و تست عیب‌یابی',
              filter: (m: MediaItem) => m.imageType === 'supplementary' || m.imageType === 'other',
              fallbackUrls: []
            }
          ].map(category => {
            const matchedMedia = mediaItems.filter(category.filter);
            const categoryGalleryItems = buildDeduplicatedCategoryGallery(
              category.title,
              matchedMedia,
              category.fallbackUrls,
              'تصویر پایه',
              connector.name,
              vehicleName
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
                  <span className="text-[10px] text-zinc-500 font-mono">
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
                        onClick={() => setIsMediaModalOpen(true)}
                        className="mt-1 text-red-400 hover:text-red-300 text-[11px] font-semibold"
                      >
                        + افزودن تصویر به این بخش
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryGalleryItems.map((item, idx) => (
                      <div key={item.id || `${item.url}-${idx}`} className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden flex flex-col group">
                        <div
                          className="relative h-44 bg-black flex items-center justify-center cursor-pointer overflow-hidden"
                          onClick={() => setSelectedViewerMedia({ url: item.url, title: item.title, subtitle: item.subtitle || connector.name })}
                        >
                          <img
                            src={item.url}
                            alt={item.title}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                          />
                          <button
                            type="button"
                            className="absolute bottom-2 left-2 p-1.5 rounded-lg bg-black/70 text-white opacity-0 group-hover:opacity-100 transition"
                            title="بزرگ‌نمایی در ابعاد اصلی"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-2.5 flex flex-col gap-1 border-t border-zinc-800 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-200 truncate">{item.title}</span>
                            {item.source && <span className="text-[10px] text-amber-400 font-mono truncate max-w-[100px]">{item.source}</span>}
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{item.description}</p>
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

      {/* Selected Pin Detailed Workshop Card */}
      {selectedPin && (
        <div className="bg-zinc-900 border-2 border-red-900/60 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              {/* Pin Number Badge */}
              <div className="w-12 h-12 rounded-xl bg-red-600 flex flex-col items-center justify-center text-white font-black shadow-lg shadow-red-950 shrink-0">
                <span className="text-[10px] text-red-200 uppercase font-medium">پایه</span>
                <span className="text-base tabular-nums leading-none">{selectedPin.pinNumber}</span>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {selectedPin.functionName}
                  </h3>
                  {selectedPin.pinName && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-amber-300 font-bold">
                      {selectedPin.pinName}
                    </span>
                  )}
                  {selectedPin.dutyCategory && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                      {selectedPin.dutyCategory}
                    </span>
                  )}
                  {selectedPin.pulseType && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-800 text-purple-300">
                      {selectedPin.pulseType}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {getSignalBadge(selectedPin.signalType)}
                  <span className="text-xs text-zinc-400 tabular-nums">ولتاژ: {selectedPin.voltageRange}</span>
                </div>
              </div>
            </div>

            {/* Wire Color Swatch Display */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl shrink-0">
              <div className="relative w-7 h-7 rounded-full border-2 border-zinc-700 overflow-hidden shadow-inner shrink-0">
                <div className="absolute inset-0" style={{ backgroundColor: selectedPin.wireHex }} />
                {selectedPin.wireStripeHex && (
                  <div
                    className="absolute top-0 bottom-0 left-2 w-2.5"
                    style={{ backgroundColor: selectedPin.wireStripeHex }}
                  />
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 block">رنگ سیم خودرو</span>
                <span className="text-xs font-bold text-zinc-200">{selectedPin.wireColor}</span>
              </div>
            </div>
          </div>

          {/* Test & Troubleshooting Guide */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-1 text-xs">
            {selectedPin.testGuide && (
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>روش تست در محیط تعمیرگاه:</span>
                </div>
                <p className="text-zinc-300 leading-relaxed text-[11px] sm:text-xs">
                  {selectedPin.testGuide}
                </p>
              </div>
            )}

            {selectedPin.notes && (
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-zinc-300 font-semibold mb-1">
                  <Info className="w-3.5 h-3.5 text-red-400" />
                  <span>نکات فنی و مسیر مدار:</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px] sm:text-xs">
                  {selectedPin.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabular Pin List (Search Results or Table Mode) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-200">
            فهرست پایه‌ها ({filteredPins.length} پایه مطابق فیلتر)
          </span>
          <span className="text-[11px] text-zinc-500">برای جزئیات روی هر ردیف کلیک کنید</span>
        </div>

        <div className="divide-y divide-zinc-800/60 max-h-96 overflow-y-auto">
          {filteredPins.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              موردی با مشخصات جستجوشده یافت نشد.
            </div>
          ) : (
            filteredPins.map((pin) => {
              const isSelected = selectedPin?.id === pin.id;
              return (
                <div
                  key={pin.id}
                  onClick={() => setSelectedPin(pin)}
                  className={`px-3 sm:px-4 tabular-row-py flex items-center justify-between gap-3 cursor-pointer transition ${
                    isSelected ? 'bg-red-950/40 border-r-4 border-red-500' : 'hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center tabular-cell-text font-black text-white tabular-nums shrink-0">
                      {pin.pinNumber}
                    </span>

                    {/* Wire Mini Swatch */}
                    <div className="relative w-4 h-4 rounded-full border border-zinc-700 overflow-hidden shrink-0">
                      <div className="absolute inset-0" style={{ backgroundColor: pin.wireHex }} />
                      {pin.wireStripeHex && (
                        <div
                          className="absolute top-0 bottom-0 left-1 w-1.5"
                          style={{ backgroundColor: pin.wireStripeHex }}
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <p className="tabular-cell-text font-medium text-zinc-200 truncate">{pin.functionName}</p>
                        {pin.pinName && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-amber-300 shrink-0">
                            {pin.pinName}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">رنگ: {pin.wireColor}{pin.dutyCategory ? ` • ${pin.dutyCategory}` : ''}</p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400 tabular-nums hidden sm:inline">{pin.voltageRange}</span>
                    {getSignalBadge(pin.signalType)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Media Upload Modal */}
      <MediaUploadModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        entityType="connector"
        entityId={connector.id}
        entityName={connector.name}
        vehicleId={connector.vehicleId}
        onMediaUploaded={(media) => {
          setMediaItems(prev => deduplicateMediaList([media, ...prev]));
          let updated: Connector = { ...connector };
          if (media.imageType === 'socket_front') {
            updated.frontImageUrl = media.fileUrl;
            setSelectedImageAngle('front');
          } else if (media.imageType === 'socket_back') {
            updated.backImageUrl = media.fileUrl;
            setSelectedImageAngle('back');
          } else if (media.imageType === 'pinout_diagram' || media.imageType === 'socket_schematic') {
            updated.pinoutDiagramUrl = media.fileUrl;
            setSelectedImageAngle('diagram');
          } else {
            updated.realImageUrl = media.fileUrl;
            setSelectedImageAngle('real');
          }
          storage.saveConnector(updated);
          if (isAdmin && isOnlineDbConnected) {
            onlineStorage.saveConnector(updated).catch(console.warn);
          }
          onRefreshData?.();
        }}
      />

      {/* Image Viewer Modal for Active View */}
      {isViewerOpen && hasAnyImages && (
        <ImageViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          imageUrl={getCurrentImageUrl()}
          title={connector.name}
          subtitle={`${vehicleName || ''} · نمای سوکت`}
        />
      )}

      {/* Image Viewer Modal for Gallery Selection */}
      {selectedViewerMedia && (
        <ImageViewerModal
          isOpen={Boolean(selectedViewerMedia)}
          onClose={() => setSelectedViewerMedia(null)}
          imageUrl={selectedViewerMedia.url}
          title={selectedViewerMedia.title}
          subtitle={selectedViewerMedia.subtitle || connector.name}
        />
      )}
    </div>
  );
};

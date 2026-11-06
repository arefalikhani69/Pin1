import React, { useState, useEffect, useMemo, useTransition } from 'react';
import {
  Search,
  Car,
  Cpu,
  Zap,
  Layers,
  FileText,
  X,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Radio,
  SlidersHorizontal,
  RotateCcw,
  Maximize2,
  ChevronLeft,
  Sparkles,
  Wifi,
  WifiOff,
  Activity,
  Image as ImageIcon
} from 'lucide-react';
import {
  Vehicle,
  Connector,
  FuseBox,
  WiringDiagram,
  MediaItem,
  Manufacturer,
  ECU
} from '../types';
import { storage } from '../services/storage';
import { onlineStorage } from '../services/onlineStorage';
import { useAuth } from '../context/AuthContext';
import { useDisplaySettings } from '../context/DisplaySettingsContext';
import {
  executeGlobalSearch,
  SearchFilters,
  SearchResultSet,
  PinSearchResult,
  FuseSearchResult,
  RelaySearchResult,
  VehicleSearchResult,
  DiagramSearchResult,
  MediaSearchResult
} from '../utils/searchEngine';
import { getFuseColor, getRelayColor } from '../utils/fuseColors';
import { ImageViewerModal } from './ImageViewerModal';

interface GlobalSearchViewProps {
  onSelectVehicle: (vehicle: Vehicle) => void;
  onSelectConnectorPin: (connector: Connector, pinId?: string) => void;
  onSelectFuse: (fuseBox: FuseBox, fuseId?: string) => void;
  onSelectRelay: (fuseBox: FuseBox, relayId?: string) => void;
  onSelectDiagram: (diagram: WiringDiagram) => void;
  onClose?: () => void;
  initialQuery?: string;
  initialCategory?: SearchFilters['category'];
}

export const GlobalSearchView: React.FC<GlobalSearchViewProps> = ({
  onSelectVehicle,
  onSelectConnectorPin,
  onSelectFuse,
  onSelectRelay,
  onSelectDiagram,
  onClose,
  initialQuery = '',
  initialCategory = 'all'
}) => {
  const { isAdmin, isOnlineDbConnected } = useAuth();
  const { settings, updateSettings } = useDisplaySettings();

  const resolvedInitialCat = (initialCategory === 'all' && settings.searchSaveLastCategory && settings.searchLastCategory)
    ? settings.searchLastCategory as SearchFilters['category']
    : initialCategory;

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<SearchFilters['category']>(resolvedInitialCat);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<SearchFilters['location']>('all');
  const [selectedEcuBrand, setSelectedEcuBrand] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<SearchFilters['status']>('all');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const handleSelectCategory = (catId: SearchFilters['category']) => {
    setSelectedCategory(catId);
    if (settings.searchSaveLastCategory) {
      updateSettings({ searchLastCategory: catId as any });
    }
  };

  // Active Media Viewer modal for image results
  const [selectedMediaForView, setSelectedMediaForView] = useState<MediaItem | null>(null);

  // Base Data loaded from local storage / cache
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => storage.getVehicles(!isAdmin));
  const [connectors, setConnectors] = useState<Connector[]>(() => storage.getConnectors(undefined, undefined, !isAdmin));
  const [fuseBoxes, setFuseBoxes] = useState<FuseBox[]>(() => storage.getFuseBoxes(undefined, !isAdmin));
  const [diagrams, setDiagrams] = useState<WiringDiagram[]>(() => storage.getWiringDiagrams(undefined, !isAdmin));
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => storage.getMediaItems(undefined, !isAdmin));
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>(() => storage.getManufacturers());
  const [ecus, setEcus] = useState<ECU[]>(() => storage.getECUs(undefined, !isAdmin));

  // Debounce search input for silky-smooth typing
  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        setDebouncedQuery(query);
      });
    }, 120);
    return () => clearTimeout(handler);
  }, [query]);

  // Sync latest records if online
  useEffect(() => {
    let isMounted = true;
    const fetchLatest = async () => {
      try {
        const [cloudVehicles, cloudConnectors, cloudFuseBoxes, cloudDiagrams, cloudMedia] = await Promise.all([
          onlineStorage.getVehicles(isAdmin).catch(() => storage.getVehicles()),
          onlineStorage.getConnectors(undefined, isAdmin).catch(() => storage.getConnectors()),
          onlineStorage.getFuseBoxes(undefined, isAdmin).catch(() => storage.getFuseBoxes()),
          onlineStorage.getWiringDiagrams().catch(() => storage.getWiringDiagrams()),
          onlineStorage.getMedia().catch(() => storage.getMediaItems())
        ]);

        if (isMounted) {
          if (cloudVehicles.length > 0) setVehicles(cloudVehicles);
          if (cloudConnectors.length > 0) setConnectors(cloudConnectors);
          if (cloudFuseBoxes.length > 0) setFuseBoxes(cloudFuseBoxes);
          if (cloudDiagrams.length > 0) setDiagrams(cloudDiagrams);
          if (cloudMedia.length > 0) setMediaItems(cloudMedia);
        }
      } catch (err) {
        console.warn('Search view online sync error:', err);
      }
    };
    fetchLatest();
    return () => { isMounted = false; };
  }, [isAdmin, isOnlineDbConnected]);

  // Execute Search
  const searchResults: SearchResultSet = useMemo(() => {
    const filters: SearchFilters = {
      category: selectedCategory,
      manufacturerId: selectedManufacturer || undefined,
      vehicleId: selectedVehicleId || undefined,
      location: selectedLocation || undefined,
      ecuBrand: selectedEcuBrand || undefined,
      status: selectedStatus || undefined
    };

    return executeGlobalSearch(debouncedQuery, filters, {
      vehicles,
      connectors,
      fuseBoxes,
      diagrams,
      mediaItems,
      manufacturers,
      ecus,
      isAdmin
    });
  }, [
    debouncedQuery,
    selectedCategory,
    selectedManufacturer,
    selectedVehicleId,
    selectedLocation,
    selectedEcuBrand,
    selectedStatus,
    vehicles,
    connectors,
    fuseBoxes,
    diagrams,
    mediaItems,
    manufacturers,
    ecus,
    isAdmin
  ]);

  const hasActiveFilters = Boolean(
    selectedManufacturer ||
    selectedVehicleId ||
    selectedLocation !== 'all' ||
    selectedEcuBrand ||
    selectedStatus !== 'all' ||
    selectedCategory !== 'all'
  );

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedManufacturer('');
    setSelectedVehicleId('');
    setSelectedLocation('all');
    setSelectedEcuBrand('');
    setSelectedStatus('all');
  };

  // Distinct ECU Brands available in data
  const availableEcuBrands = useMemo(() => {
    const set = new Set<string>();
    ecus.forEach(e => { if (e.brand) set.add(e.brand.trim()); });
    ['زیمنس', 'بوش', 'ساژم', 'والئو', 'SSAT', 'کروز', 'دلفی'].forEach(b => set.add(b));
    return Array.from(set);
  }, [ecus]);

  // Vehicles available for selected manufacturer
  const filteredVehiclesList = useMemo(() => {
    if (!selectedManufacturer) return vehicles;
    return vehicles.filter(v => v.manufacturerId === selectedManufacturer);
  }, [vehicles, selectedManufacturer]);

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Search Header Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 -mr-1 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 active:scale-95 transition"
              title="بازگشت"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی پیناوت، شماره پایه، رنگ سیم، انژکتور، رله دوبل، شماره فیوز، TU5، F10..."
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pr-10 pl-9 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition shadow-inner font-sans"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                title="پاک کردن"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
              hasActiveFilters || showFiltersPanel
                ? 'bg-red-600/20 border-red-500/50 text-red-400 shadow-sm'
                : 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-zinc-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">فیلترها</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-zinc-400 scrollbar-none">
          <span className="text-zinc-500 shrink-0 font-medium">پیشنهادات:</span>
          {[
            'TU5',
            'XU7',
            'رله دوبل',
            'پمپ بنزین',
            'انژکتور',
            'سنسور اکسیژن',
            'سنسور دور موتور',
            'سنسور مپ',
            'F10',
            '15 آمپر',
            'سیم آبی',
            'سیم قرمز',
            'زیمنس'
          ].map(tag => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 whitespace-nowrap transition active:scale-95"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Collapsible Advanced Filters Panel */}
        {showFiltersPanel && (
          <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs animate-fadeIn">
            {/* Manufacturer Filter */}
            <div>
              <label className="block text-[11px] text-zinc-400 font-medium mb-1">شرکت سازنده:</label>
              <select
                value={selectedManufacturer}
                onChange={(e) => {
                  setSelectedManufacturer(e.target.value);
                  setSelectedVehicleId('');
                }}
                className="w-full bg-zinc-950 border border-zinc-750 rounded-xl px-2.5 py-1.5 text-zinc-200 text-xs focus:border-red-500 outline-none"
              >
                <option value="">همه سازنده‌ها</option>
                {manufacturers.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.country})</option>
                ))}
              </select>
            </div>

            {/* Vehicle Filter */}
            <div>
              <label className="block text-[11px] text-zinc-400 font-medium mb-1">خودرو:</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-750 rounded-xl px-2.5 py-1.5 text-zinc-200 text-xs focus:border-red-500 outline-none"
              >
                <option value="">همه خودروها</option>
                {filteredVehiclesList.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.modelYears})</option>
                ))}
              </select>
            </div>

            {/* ECU Brand Filter */}
            <div>
              <label className="block text-[11px] text-zinc-400 font-medium mb-1">برند / نوع ECU:</label>
              <select
                value={selectedEcuBrand}
                onChange={(e) => setSelectedEcuBrand(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-750 rounded-xl px-2.5 py-1.5 text-zinc-200 text-xs focus:border-red-500 outline-none"
              >
                <option value="">همه ECU‌ها</option>
                {availableEcuBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Fuse Box Location Filter */}
            <div>
              <label className="block text-[11px] text-zinc-400 font-medium mb-1">محل نصب جعبه‌فیوز:</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value as SearchFilters['location'])}
                className="w-full bg-zinc-950 border border-zinc-750 rounded-xl px-2.5 py-1.5 text-zinc-200 text-xs focus:border-red-500 outline-none"
              >
                <option value="all">همه موقعیت‌ها</option>
                <option value="cabin">داخل اتاق / کابین</option>
                <option value="engine">محفظه موتور</option>
                <option value="battery">روی سر باتری</option>
                <option value="trunk">صندوق عقب</option>
              </select>
            </div>

            {/* Status Filter (Admin only or verified toggle) */}
            {isAdmin && (
              <div>
                <label className="block text-[11px] text-zinc-400 font-medium mb-1">وضعیت تأیید:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as SearchFilters['status'])}
                  className="w-full bg-zinc-950 border border-zinc-750 rounded-xl px-2.5 py-1.5 text-zinc-200 text-xs focus:border-red-500 outline-none"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="published_only">فقط منتشرشده / تأییدشده</option>
                  <option value="draft_only">فقط پیش‌نویس / در انتظار</option>
                </select>
              </div>
            )}

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                disabled={!hasActiveFilters}
                className="w-full py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-700 text-zinc-300 flex items-center justify-center gap-1.5 transition text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>پاک کردن تمام فیلترها</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs with Dynamic Counters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
        {[
          { id: 'all', label: 'همه بخش‌ها', count: searchResults.totalCount },
          { id: 'vehicles', label: 'خودروها', count: searchResults.vehicles.length },
          { id: 'pins', label: 'سوکت و پیناوت', count: searchResults.pins.length },
          { id: 'sensors', label: 'سنسورها و عملگرها', count: searchResults.sensors.length },
          { id: 'fuses', label: 'فیوزها', count: searchResults.fuses.length },
          { id: 'relays', label: 'رله‌ها', count: searchResults.relays.length },
          { id: 'diagrams', label: 'نقشه‌ها', count: searchResults.diagrams.length },
          { id: 'media', label: 'تصاویر فنی', count: searchResults.media.length }
        ].filter(cat => {
          if (cat.id === 'all') return true;
          if (cat.id === 'pins' || cat.id === 'sensors') return settings.searchEnabledCategories.includes('ecu');
          return settings.searchEnabledCategories.includes(cat.id as any);
        }).map(cat => (
          <button
            key={cat.id}
            onClick={() => handleSelectCategory(cat.id as SearchFilters['category'])}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition ${
              selectedCategory === cat.id
                ? 'bg-red-600 text-white shadow-md shadow-red-950/60'
                : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                selectedCategory === cat.id
                  ? 'bg-black/30 text-white'
                  : 'bg-zinc-950 text-zinc-500 border border-zinc-800'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Status & Info Bar */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          {isPending ? (
            <span className="flex items-center gap-1 text-amber-400">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>در حال جستجوی بلادرنگ...</span>
            </span>
          ) : debouncedQuery ? (
            <span>
              نتایج جستجو برای «<strong className="text-zinc-200">{debouncedQuery}</strong>»
            </span>
          ) : hasActiveFilters ? (
            <span>فیلترهای فعال اعمال شده</span>
          ) : (
            <span>بانک اطلاعات فنی AutoPin Pro</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isOnlineDbConnected ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400" title="متصل به ابر و پایگاه داده">
              <Wifi className="w-3 h-3" />
              <span className="hidden sm:inline">همگام با سرور</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-amber-400" title="دسترسی آفلاین">
              <WifiOff className="w-3 h-3" />
              <span className="hidden sm:inline">آفلاین (حافظه محلی)</span>
            </span>
          )}
          <span className="tabular-nums font-mono text-[11px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
            {searchResults.totalCount} مورد یافت شد
          </span>
        </div>
      </div>

      {/* No Results Empty State */}
      {searchResults.totalCount === 0 && (debouncedQuery || hasActiveFilters) && (
        <div className="p-8 sm:p-12 text-center text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-600">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-200">موردی با این مشخصات یافت نشد</h4>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-md">
              لطفاً عبارت جستجو را تغییر دهید یا فیلترهای اعمال‌شده را پاک کنید. می‌توانید از نام خودرو، کد موتور (مثل XU7 یا TU5)، شماره پایه، شماره فیوز (F10) یا نام سنسور استفاده کنید.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="mt-1 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>پاک کردن فیلترها</span>
            </button>
          )}
        </div>
      )}

      {/* Idle Prompt State */}
      {searchResults.totalCount === 0 && !debouncedQuery && !hasActiveFilters && (
        <div className="p-10 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2">
          <Search className="w-10 h-10 text-zinc-600 mb-1 opacity-70" />
          <h4 className="text-sm font-bold text-zinc-300">موتور جستجوی جامع و تخصصی برق خودرو</h4>
          <p className="text-[11px] text-zinc-500 max-w-md leading-relaxed">
            کد موتور، نام قطعه، رنگ سیم، شماره پایه سوکت ECU، شماره فیوز، آمپراژ و یا نام سنسور را در کادر بالا تایپ کنید.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. VEHICLES GROUP */}
      {/* ------------------------------------------------------------- */}
      {searchResults.vehicles.length > 0 && (selectedCategory === 'all' || selectedCategory === 'vehicles') && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-zinc-200">
            <span className="flex items-center gap-1.5">
              <Car className="w-4 h-4 text-red-500" />
              <span>خودروها ({searchResults.vehicles.length})</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {searchResults.vehicles.map(({ vehicle, manufacturerName, matchedField }) => (
              <div
                key={vehicle.id}
                onClick={() => onSelectVehicle(vehicle)}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition shadow-sm group active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition truncate">
                      {vehicle.name}
                    </h4>
                    {manufacturerName && (
                      <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                        {manufacturerName}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                    {vehicle.persianName} · {vehicle.modelYears}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {vehicle.engines.map(eng => (
                      <span key={eng.id} className="text-[10px] text-zinc-300 bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 rounded font-mono">
                        {eng.code}
                      </span>
                    ))}
                    <span className="text-[10px] text-red-400/90 font-medium mr-auto">
                      {matchedField}
                    </span>
                  </div>
                </div>

                <ChevronLeft className="w-5 h-5 text-zinc-500 group-hover:text-red-400 transition shrink-0 mr-2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. SENSORS & ACTUATORS GROUP */}
      {/* ------------------------------------------------------------- */}
      {searchResults.sensors.length > 0 && (selectedCategory === 'all' || selectedCategory === 'sensors') && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-zinc-200">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>سنسورها و عملگرها ({searchResults.sensors.length})</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {searchResults.sensors.map(({ pin, connector, vehicle, ecu, matchedField }) => (
              <div
                key={`sensor-${connector.id}-${pin.id}`}
                onClick={() => onSelectConnectorPin(connector, pin.id)}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-600/40 rounded-2xl p-3.5 sm:p-4 cursor-pointer transition shadow-sm group active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Pin Number Badge */}
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex flex-col items-center justify-center font-bold shrink-0">
                      <span className="text-[9px] uppercase">پایه</span>
                      <span className="text-sm font-mono leading-none">{pin.pinNumber}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition">
                          {pin.functionName}
                        </h4>
                        <span className="text-[10px] text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded font-medium">
                          سنسور / عملگر
                        </span>
                        {pin.voltageRange && (
                          <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 font-mono">
                            {pin.voltageRange}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 mt-1">
                        <span>{connector.name}</span>
                        {vehicle && <span>· {vehicle.name}</span>}
                        {ecu && <span>· ECU: {ecu.brand}</span>}
                      </div>

                      {/* Wire color swatch */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                          <span
                            className="w-3 h-3 rounded-full border border-zinc-700 shadow-xs inline-block shrink-0"
                            style={{ backgroundColor: pin.wireHex || '#888' }}
                          />
                          <span>رنگ سیم: {pin.wireColor}</span>
                        </div>
                        {pin.testGuide && (
                          <span className="text-[10px] text-zinc-500 truncate max-w-xs hidden sm:inline">
                            تست: {pin.testGuide}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className="text-[10px] text-amber-400/90 font-mono">
                      {matchedField}
                    </span>
                    <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. CONNECTORS & PINOUT GROUP */}
      {/* ------------------------------------------------------------- */}
      {searchResults.pins.length > 0 && (selectedCategory === 'all' || selectedCategory === 'pins') && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-zinc-200">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-red-500" />
              <span>پایه‌ها و پیناوت سوکت‌ها ({searchResults.pins.length})</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {searchResults.pins.map(({ pin, connector, vehicle, ecu, matchedField }) => (
              <div
                key={`pin-${connector.id}-${pin.id}`}
                onClick={() => onSelectConnectorPin(connector, pin.id)}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-3.5 sm:p-4 cursor-pointer transition shadow-sm group active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Pin Number Badge */}
                    <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 flex flex-col items-center justify-center font-bold shrink-0">
                      <span className="text-[9px] uppercase">پایه</span>
                      <span className="text-sm font-mono leading-none">{pin.pinNumber}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition">
                          {pin.functionName}
                        </h4>
                        <span className="text-[10px] text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          {pin.signalType}
                        </span>
                        {pin.voltageRange && (
                          <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                            {pin.voltageRange}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 mt-1">
                        <span className="text-zinc-300">{connector.name}</span>
                        {vehicle && <span>· {vehicle.name}</span>}
                        {ecu && <span>· {ecu.brand}</span>}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="w-3 h-3 rounded-full border border-zinc-700 shadow-xs inline-block shrink-0"
                          style={{ backgroundColor: pin.wireHex || '#888' }}
                        />
                        <span className="text-[11px] text-zinc-300">سیم: {pin.wireColor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className="text-[10px] text-amber-400/90 font-mono">
                      {matchedField}
                    </span>
                    <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. FUSES GROUP */}
      {/* ------------------------------------------------------------- */}
      {searchResults.fuses.length > 0 && (selectedCategory === 'all' || selectedCategory === 'fuses') && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-zinc-200">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>فیوزها و مدارها ({searchResults.fuses.length})</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {searchResults.fuses.map(({ fuse, fuseBox, vehicle, matchedField }) => {
              const fuseColor = getFuseColor(fuse.ratingAmps);

              return (
                <div
                  key={`fuse-${fuseBox.id}-${fuse.id}`}
                  onClick={() => onSelectFuse(fuseBox, fuse.id)}
                  className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-3.5 sm:p-4 cursor-pointer transition shadow-sm group active:scale-[0.99] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Rating Badge */}
                        <div
                          className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold shadow-xs shrink-0 border ${fuseColor.bg} ${fuseColor.text} ${fuseColor.border}`}
                        >
                          <span className="text-[9px] uppercase opacity-90">فیوز</span>
                          <span className="text-sm font-mono leading-none">{fuse.ratingAmps}A</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-black text-amber-400">{fuse.code}</span>
                            <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition truncate max-w-[180px]">
                              {fuse.functionName}
                            </h4>
                          </div>
                          <span className="text-[10px] text-zinc-400">{fuseBox.name}</span>
                        </div>
                      </div>

                      <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 font-medium">
                        {fuseBox.locationFa}
                      </span>
                    </div>

                    {fuse.circuitDetails && (
                      <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                        مدار: {fuse.circuitDetails}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">
                      {vehicle?.name || 'خودروی استاندارد'} · {fuse.powerSupplyType}
                    </span>
                    <span className="text-amber-400 font-mono">{matchedField}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. RELAYS GROUP */}
      {/* ------------------------------------------------------------- */}
      {searchResults.relays.length > 0 && (selectedCategory === 'all' || selectedCategory === 'relays') && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-zinc-200">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>رله‌ها ({searchResults.relays.length})</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {searchResults.relays.map(({ relay, fuseBox, vehicle, matchedField }) => {
              const relayColor = getRelayColor(relay.rating || relay.name);

              return (
                <div
                  key={`relay-${fuseBox.id}-${relay.id}`}
                  onClick={() => onSelectRelay(fuseBox, relay.id)}
                  className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-3.5 sm:p-4 cursor-pointer transition shadow-sm group active:scale-[0.99] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Relay Icon Badge */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border ${relayColor.bg} ${relayColor.text} ${relayColor.border}`}
                        >
                          {relay.code || 'رله'}
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-sky-400 transition truncate max-w-[180px]">
                            {relay.name || relay.functionName}
                          </h4>
                          <span className="text-[10px] text-zinc-400">{fuseBox.name}</span>
                        </div>
                      </div>

                      <span className="text-[10px] text-sky-400 font-mono bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/80">
                        {relay.rating}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-300 mt-2 line-clamp-2">
                      عملکرد: {relay.functionName}
                    </p>

                    {relay.contactPins && (
                      <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                        پایه‌ها: تحریک ({relay.coilPins}) · قدرت ({relay.contactPins})
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">{vehicle?.name || 'خودرو'}</span>
                    <span className="text-amber-400 font-mono">{matchedField}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. WIRING DIAGRAMS GROUP */}
      {/* ------------------------------------------------------------- */}
      {searchResults.diagrams.length > 0 && (selectedCategory === 'all' || selectedCategory === 'diagrams') && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-zinc-200">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>نقشه‌های سیم‌کشی ({searchResults.diagrams.length})</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {searchResults.diagrams.map(({ diagram, vehicle, matchedField }) => (
              <div
                key={diagram.id}
                onClick={() => onSelectDiagram(diagram)}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 cursor-pointer transition shadow-sm group active:scale-[0.99] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition truncate">
                      {diagram.title}
                    </h4>
                    <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80 shrink-0">
                      {diagram.categoryFa}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {diagram.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500">{vehicle?.name || 'نقشه استاندارد'}</span>
                  <span className="text-amber-400 font-mono">{matchedField}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. TECHNICAL MEDIA & IMAGES GROUP */}
      {/* ------------------------------------------------------------- */}
      {searchResults.media.length > 0 && (selectedCategory === 'all' || selectedCategory === 'media') && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-zinc-200">
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-rose-500" />
              <span>تصاویر و مستندات فنی ({searchResults.media.length})</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchResults.media.map(({ media, parentTitle, matchedField }) => (
              <div
                key={media.id}
                onClick={() => setSelectedMediaForView(media)}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden cursor-pointer transition shadow-sm group flex flex-col"
              >
                <div className="h-36 bg-black relative flex items-center justify-center overflow-hidden">
                  <img
                    src={media.fileUrl}
                    alt={media.title}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Maximize2 className="w-5 h-5 text-white drop-shadow" />
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between gap-1 text-xs">
                  <div>
                    <h5 className="font-bold text-zinc-200 group-hover:text-red-400 transition truncate">
                      {media.title}
                    </h5>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{parentTitle}</p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-amber-400 font-mono truncate">{media.source || 'نقشه استاندارد'}</span>
                    <span className="text-zinc-500">{matchedField}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Viewer Modal for clicked media search result */}
      {selectedMediaForView && (
        <ImageViewerModal
          isOpen={Boolean(selectedMediaForView)}
          onClose={() => setSelectedMediaForView(null)}
          imageUrl={selectedMediaForView.fileUrl}
          title={selectedMediaForView.title}
          subtitle={selectedMediaForView.description || selectedMediaForView.source}
        />
      )}
    </div>
  );
};

import React from 'react';
import {
  Search,
  Car,
  Cpu,
  Zap,
  Layers,
  FileText,
  Bookmark,
  Clock,
  Sparkles,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Wrench,
  Wifi,
  WifiOff,
  ArrowLeftRight,
  Star,
  SlidersHorizontal
} from 'lucide-react';
import { Vehicle, Connector, FuseBox, WiringDiagram, FavoriteItem, ECU, Fuse, Relay } from '../types';
import { storage } from '../services/storage';
import { useAuth } from '../context/AuthContext';

interface HomeScreenProps {
  onSearchClick: (query?: string) => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onSelectConnector: (connector: Connector) => void;
  onSelectFuseBox: (fuseBox: FuseBox) => void;
  onSelectFuse?: (fuseBox: FuseBox, fuseId: string) => void;
  onSelectRelay?: (fuseBox: FuseBox, relayId: string) => void;
  onSelectDiagram: (diagram: WiringDiagram) => void;
  onNavigateToVehicles: () => void;
  onNavigateToConnectors: () => void;
  onNavigateToFuseBoxes: () => void;
  onNavigateToDiagrams: () => void;
  onNavigateToCompare?: () => void;
  onNavigateToFavorites?: () => void;
  onNavigateToSettings?: () => void;
  onOpenQuickTools: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSearchClick,
  onSelectVehicle,
  onSelectConnector,
  onSelectFuseBox,
  onSelectFuse,
  onSelectRelay,
  onSelectDiagram,
  onNavigateToVehicles,
  onNavigateToConnectors,
  onNavigateToFuseBoxes,
  onNavigateToDiagrams,
  onNavigateToCompare,
  onNavigateToFavorites,
  onNavigateToSettings,
  onOpenQuickTools
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [homeQuery, setHomeQuery] = React.useState('');
  const vehicles = storage.getVehicles(!isAdmin);
  const connectors = storage.getConnectors(undefined, undefined, !isAdmin);
  const fuseBoxes = storage.getFuseBoxes(undefined, !isAdmin);
  const favorites = storage.getFavorites(currentUser?.uid);
  const recentVehicleIds = storage.getRecentVehicles(currentUser?.uid);

  // Resolve recent vehicles with strict deduplication
  const recentVehicles = React.useMemo(() => {
    const seenIds = new Set<string>();
    const list: Vehicle[] = [];
    for (const r of recentVehicleIds) {
      if (r && r.vehicleId && !seenIds.has(r.vehicleId)) {
        seenIds.add(r.vehicleId);
        const found = vehicles.find(v => v.id === r.vehicleId);
        if (found) {
          list.push(found);
        }
      }
    }
    return list;
  }, [recentVehicleIds, vehicles]);

  // Latest added connectors (top 3)
  const latestConnectors = [...connectors].slice(0, 3);

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* Quick Search Bar Hero Trigger with Live Input */}
      <div
        className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 transition shadow-lg group"
      >
        <div
          onClick={() => onSearchClick(homeQuery)}
          className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:scale-105 transition shrink-0 cursor-pointer"
        >
          <Search className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span
              onClick={() => onSearchClick(homeQuery)}
              className="text-xs font-bold text-zinc-200 block cursor-pointer"
            >
              جستجوی هوشمند در پیناوت و برق خودرو
            </span>
            <span className="text-[10px] text-red-400 font-medium hidden sm:inline">
              Enter برای مشاهده نتایج ↵
            </span>
          </div>
          <input
            type="text"
            value={homeQuery}
            onChange={(e) => setHomeQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSearchClick(homeQuery);
              }
            }}
            placeholder="شماره پایه، رنگ سیم، انژکتور، رله دوبل، شماره فیوز، TU5، F10..."
            className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none mt-1"
          />
        </div>
        <button
          type="button"
          onClick={() => onSearchClick(homeQuery)}
          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shrink-0 transition active:scale-95 shadow-md shadow-red-950"
        >
          جستجو
        </button>
      </div>

      {/* 4 Primary Workshop Action Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={onNavigateToConnectors}
          className="flex flex-col items-start p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition active:scale-[0.98] text-right group"
        >
          <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500 mb-3 group-hover:scale-105 transition">
            <Cpu className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white">سوکت و پین‌اوت ECU</span>
          <span className="text-[11px] text-zinc-400 mt-0.5">نقشه پایه‌ها، سیگنال و پالس</span>
        </button>

        <button
          onClick={() => {
            const universalCar = vehicles.find(v => v.id === 'universal-sensors');
            if (universalCar) onSelectVehicle(universalCar);
            else onNavigateToConnectors();
          }}
          className="flex flex-col items-start p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition active:scale-[0.98] text-right group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition">
            <Layers className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white">پیناوت سنسورها</span>
          <span className="text-[11px] text-zinc-400 mt-0.5">اکسیژن، مپ، دور موتور</span>
        </button>

        <button
          onClick={onNavigateToFuseBoxes}
          className="flex flex-col items-start p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition active:scale-[0.98] text-right group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-600/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-105 transition">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white">جعبه‌فیوز و رله‌ها</span>
          <span className="text-[11px] text-zinc-400 mt-0.5">داخل اتاق و محفظه موتور</span>
        </button>

        <button
          onClick={onNavigateToDiagrams}
          className="flex flex-col items-start p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition active:scale-[0.98] text-right group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-600/15 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-3 group-hover:scale-105 transition">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white">نقشه‌های سیم‌کشی</span>
          <span className="text-[11px] text-zinc-400 mt-0.5">مدار استارت، فن و پالس</span>
        </button>
      </div>

      {/* Technical Comparison Banner */}
      {onNavigateToCompare && (
        <div
          onClick={onNavigateToCompare}
          className="bg-gradient-to-l from-red-950/40 via-zinc-900 to-zinc-900 border border-red-900/40 hover:border-red-600/50 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition shadow-md group active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 group-hover:scale-105 transition">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition">
                  مقایسه تخصصی خودروها و سیستم برق
                </h4>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 font-bold border border-red-500/30">
                  تطبیق پین‌به‌پین
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                مقایسه دو خودرو، دو ECU، دو سوکت یا دو جعبه‌فیوز و بررسی تفاوت‌های فنی برای عیب‌یابی
              </p>
            </div>
          </div>
          <button
            type="button"
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shrink-0 transition active:scale-95 shadow-md shadow-red-950 hidden sm:flex items-center gap-1.5"
          >
            <span>شروع مقایسه</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Tools & Workshop Standards Strip */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">جعبه‌ابزار و استانداردهای سریع تعمیرگاه</h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">کد رنگ فیوزها، پایه‌های رله دوبل و اهم سنسورها</p>
          </div>
        </div>
        <button
          onClick={onOpenQuickTools}
          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition shrink-0 active:scale-95"
        >
          مشاهده استانداردها
        </button>
      </div>

      {/* Select Vehicle Category Carousel */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-red-500" />
            <h2 className="text-xs font-bold text-zinc-200">انتخاب سریع خودروها</h2>
          </div>
          <button
            onClick={onNavigateToVehicles}
            className="text-[11px] font-semibold text-red-400 hover:text-red-300 flex items-center gap-0.5"
          >
            <span>مشاهده همه خودروها</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {vehicles.slice(0, 6).map((veh, idx) => (
            <div
              key={`home-veh-${veh.id}-${idx}`}
              onClick={() => onSelectVehicle(veh)}
              className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition active:scale-[0.98] group"
            >
              <div>
                <span className="text-[10px] font-mono text-zinc-500">{veh.modelYears}</span>
                <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition mt-1 truncate">
                  {veh.name}
                </h3>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="truncate max-w-[120px]">{veh.electricalSystem}</span>
                <ChevronLeft className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-400 transition" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Vehicles (if any) */}
      {recentVehicles.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-bold text-zinc-300">خودروهای اخیر مراجعه‌شده</h3>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {recentVehicles.map((veh, idx) => (
              <button
                key={`recent-veh-${veh.id}-${idx}`}
                onClick={() => onSelectVehicle(veh)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-medium text-zinc-200 whitespace-nowrap active:scale-95 transition"
              >
                <Car className="w-3.5 h-3.5 text-red-400" />
                <span>{veh.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Access & Favorites Section */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h2 className="text-xs font-bold text-zinc-200">دسترسی سریع و علاقه‌مندی‌ها</h2>
          </div>
          {onNavigateToFavorites && (
            <button
              onClick={onNavigateToFavorites}
              className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
            >
              <span>{favorites.length > 0 ? `مشاهده همه (${favorites.length})` : 'صفحه علاقه‌مندی‌ها'}</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {favorites.slice(0, 4).map((fav, idx) => {
              const getIcon = () => {
                if (fav.type === 'vehicle') return <Car className="w-4 h-4 text-red-400" />;
                if (fav.type === 'connector' || fav.type === 'ecu') return <Cpu className="w-4 h-4 text-emerald-400" />;
                if (fav.type === 'fusebox' || fav.type === 'fuse' || fav.type === 'relay') return <Zap className="w-4 h-4 text-amber-400" />;
                return <FileText className="w-4 h-4 text-sky-400" />;
              };

              return (
                <div
                  key={`home-fav-${fav.id || `${fav.type}-${fav.itemId}`}-${idx}`}
                  onClick={() => {
                    if (fav.type === 'connector') {
                      const conn = storage.getConnectorById(fav.itemId);
                      if (conn) onSelectConnector(conn);
                    } else if (fav.type === 'fusebox') {
                      const fb = storage.getFuseBoxById(fav.itemId);
                      if (fb) onSelectFuseBox(fb);
                    } else if (fav.type === 'vehicle') {
                      const veh = storage.getVehicleById(fav.itemId);
                      if (veh) onSelectVehicle(veh);
                    } else if (fav.type === 'ecu') {
                      const ecu = storage.getECUById(fav.itemId);
                      const veh = ecu?.vehicleId ? storage.getVehicleById(ecu.vehicleId) : undefined;
                      if (veh) onSelectVehicle(veh);
                      else onNavigateToConnectors();
                    } else if (fav.type === 'fuse' || fav.type === 'relay') {
                      const fbs = storage.getFuseBoxes();
                      for (const fb of fbs) {
                        if (fav.type === 'fuse') {
                          const f = fb.fuses?.find(fuse => fuse.id === fav.itemId);
                          if (f) {
                            if (onSelectFuse) onSelectFuse(fb, f.id);
                            else onSelectFuseBox(fb);
                            break;
                          }
                        } else {
                          const r = fb.relays?.find(relay => relay.id === fav.itemId);
                          if (r) {
                            if (onSelectRelay) onSelectRelay(fb, r.id);
                            else onSelectFuseBox(fb);
                            break;
                          }
                        }
                      }
                    } else if (fav.type === 'diagram') {
                      const diag = storage.getWiringDiagrams().find(d => d.id === fav.itemId);
                      if (diag) onSelectDiagram(diag);
                    }
                  }}
                  className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl p-3 flex items-center justify-between cursor-pointer transition active:scale-[0.98] group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-center shrink-0">
                      {getIcon()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition truncate">
                        {fav.title}
                      </h4>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">{fav.subtitle}</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 shrink-0" />
                </div>
              );
            })}
          </div>
        ) : (
          <div
            onClick={onNavigateToFavorites}
            className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between gap-3 text-xs text-zinc-400 cursor-pointer transition group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center text-amber-400 shrink-0">
                <Star className="w-4 h-4" />
              </div>
              <p className="text-[11px] leading-relaxed">
                هنوز موردی نشان نشده است. با لمس ستاره روی هر خودرو یا سوکت، برای دسترسی سریع آن را ذخیره کنید.
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-white shrink-0" />
          </div>
        )}
      </div>

      {/* Latest Added Pinouts */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold text-zinc-200">آخرین اطلاعات فنی اضافه شده</h2>
        </div>

        <div className="flex flex-col gap-2">
          {latestConnectors.map((conn, idx) => {
            const veh = vehicles.find(v => v.id === conn.vehicleId);
            return (
              <div
                key={`home-conn-${conn.id}-${idx}`}
                onClick={() => onSelectConnector(conn)}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 text-white font-bold"
                    style={{
                      backgroundColor: '#18181b',
                      borderColor: conn.socketColorHex || '#3f3f46'
                    }}
                  >
                    <span className="text-xs tabular-nums text-zinc-300">{conn.pinCount}P</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition truncate">
                      {conn.name}
                    </h3>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {veh?.name || 'عمومی'} · {conn.codeName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-zinc-500 hidden sm:inline">{conn.pins.length} پین مستند</span>
                  <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Settings & Workshop Customization Banner */}
      {onNavigateToSettings && (
        <div
          onClick={onNavigateToSettings}
          className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-900/90 hover:to-red-950/20 border border-zinc-800 hover:border-red-900/50 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition active:scale-[0.99] group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:scale-105 transition shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition">
                شخصی‌سازی و تنظیمات نمایش تعمیرگاه
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                تغییر حالت تم (تاریک/روشن)، اندازه نوشته‌ها، تراکم جداول پین‌آوت و چیدمان کارت‌ها
              </p>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-red-400 shrink-0 transition" />
        </div>
      )}
    </div>
  );
};

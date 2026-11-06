import React, { useState, useMemo } from 'react';
import { Search, Zap, ChevronLeft, ArrowRight, Filter, Car, Cpu, AlertCircle, RotateCcw } from 'lucide-react';
import { FuseBox, Vehicle } from '../types';
import { storage } from '../services/storage';
import { useAuth } from '../context/AuthContext';

interface FuseBoxesListViewProps {
  onSelectFuseBox: (fuseBox: FuseBox) => void;
  onBack?: () => void;
}

export const FuseBoxesListView: React.FC<FuseBoxesListViewProps> = ({
  onSelectFuseBox,
  onBack
}) => {
  const { isAdmin } = useAuth();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [selectedEngine, setSelectedEngine] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<'all' | 'cabin' | 'engine' | 'battery' | 'trunk' | 'other'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fuseBoxes = storage.getFuseBoxes(undefined, !isAdmin);
  const vehicles = storage.getVehicles(!isAdmin);

  // Distinct engines list from vehicles & fuseboxes
  const availableEngines = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach(v => {
      v.engines.forEach(eng => {
        if (eng.code) set.add(eng.code);
      });
    });
    fuseBoxes.forEach(fb => {
      if (fb.engineCode) set.add(fb.engineCode);
    });
    return Array.from(set);
  }, [vehicles, fuseBoxes]);

  // Distinct model years / generations for the selected vehicle if any
  const selectedVehicleObj = useMemo(() => {
    return vehicles.find(v => v.id === selectedVehicleId);
  }, [vehicles, selectedVehicleId]);

  // Filtered fuseboxes
  const filteredFuseBoxes = useMemo(() => {
    return fuseBoxes.filter(fb => {
      // Vehicle filter
      if (selectedVehicleId !== 'all' && fb.vehicleId !== selectedVehicleId) {
        return false;
      }

      // Location filter
      if (locationFilter !== 'all') {
        if (locationFilter === 'other') {
          if (fb.location !== 'other' && fb.location !== 'battery') return false;
        } else if (fb.location !== locationFilter) {
          return false;
        }
      }

      // Engine filter
      if (selectedEngine !== 'all') {
        const veh = vehicles.find(v => v.id === fb.vehicleId);
        const hasEngineInVeh = veh?.engines.some(e => e.code.toLowerCase().includes(selectedEngine.toLowerCase()));
        const matchesFbEngine = fb.engineCode && fb.engineCode.toLowerCase().includes(selectedEngine.toLowerCase());
        if (!hasEngineInVeh && !matchesFbEngine) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = fb.name.toLowerCase().includes(q) || fb.locationFa.toLowerCase().includes(q);
        const matchesFuses = fb.fuses.some(
          f => f.code.toLowerCase().includes(q) ||
               f.functionName.toLowerCase().includes(q) ||
               f.circuitDetails.toLowerCase().includes(q) ||
               f.ratingAmps.toString() === q
        );
        const matchesRelays = fb.relays.some(
          r => r.code.toLowerCase().includes(q) ||
               r.name.toLowerCase().includes(q) ||
               r.functionName.toLowerCase().includes(q)
        );
        return matchesName || matchesFuses || matchesRelays;
      }

      return true;
    });
  }, [fuseBoxes, vehicles, selectedVehicleId, locationFilter, selectedEngine, searchQuery]);

  const handleResetFilters = () => {
    setSelectedVehicleId('all');
    setSelectedEngine('all');
    setLocationFilter('all');
    setSearchQuery('');
  };

  const getLocationBadge = (loc: FuseBox['location']) => {
    switch (loc) {
      case 'cabin':
        return { label: 'داخل اتاق / داشبورد', bg: 'bg-amber-950/70 border-amber-800 text-amber-300' };
      case 'engine':
        return { label: 'محفظه موتور', bg: 'bg-red-950/70 border-red-800 text-red-300' };
      case 'battery':
        return { label: 'روی باتری (کالسکه)', bg: 'bg-rose-950/70 border-rose-800 text-rose-300' };
      case 'trunk':
        return { label: 'صندوق عقب', bg: 'bg-blue-950/70 border-blue-800 text-blue-300' };
      default:
        return { label: 'سایر محل‌ها', bg: 'bg-zinc-800 border-zinc-700 text-zinc-300' };
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Top Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2 -mr-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95 transition"
                title="بازگشت"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                بانک اطلاعات جعبه‌فیوز و رله‌های خودرو
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                راهنمای جامع فیوزها، آمپراژ، رله‌های قدرت، نقشه درپوش و عیب‌یابی برق خودرو
              </p>
            </div>
          </div>
          <span className="text-xs text-amber-400 font-mono bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
            {filteredFuseBoxes.length} جعبه‌فیوز
          </span>
        </div>

        {/* Global Search Bar */}
        <div className="relative mt-4">
          <Search className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی شماره فیوز، مدار پمپ بنزین، F15، رله دوبل، چراغ، فن، آمپر..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-10 pl-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
            >
              پاک‌کردن
            </button>
          )}
        </div>

        {/* Vehicle & Engine Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-800/80">
          <div>
            <label className="text-[11px] text-zinc-400 block mb-1 font-semibold flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-red-500" />
              <span>انتخاب خودرو:</span>
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            >
              <option value="all">همه خودروها (نمایش کامل)</option>
              {vehicles.map(veh => (
                <option key={veh.id} value={veh.id}>
                  {veh.name} ({veh.generation} - {veh.modelYears})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1 font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-500" />
              <span>نوع و کد موتور:</span>
            </label>
            <select
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            >
              <option value="all">همه پیشرانه‌ها / موتورها</option>
              {availableEngines.map(eng => (
                <option key={eng} value={eng}>
                  موتور {eng}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Location Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
        <button
          type="button"
          onClick={() => setLocationFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
            locationFilter === 'all'
              ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
          }`}
        >
          همه بخش‌ها ({fuseBoxes.length})
        </button>

        <button
          type="button"
          onClick={() => setLocationFilter('cabin')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
            locationFilter === 'cabin'
              ? 'bg-amber-950 text-amber-200 border-amber-700 shadow-xs'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
          }`}
        >
          داخل کابین (داشبورد)
        </button>

        <button
          type="button"
          onClick={() => setLocationFilter('engine')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
            locationFilter === 'engine'
              ? 'bg-red-950 text-red-200 border-red-700 shadow-xs'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
          }`}
        >
          محفظه موتور
        </button>

        <button
          type="button"
          onClick={() => setLocationFilter('trunk')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
            locationFilter === 'trunk'
              ? 'bg-blue-950 text-blue-200 border-blue-700 shadow-xs'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
          }`}
        >
          صندوق عقب
        </button>

        <button
          type="button"
          onClick={() => setLocationFilter('other')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
            locationFilter === 'other'
              ? 'bg-rose-950 text-rose-200 border-rose-700 shadow-xs'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
          }`}
        >
          روی باتری و سایر محل‌ها
        </button>
      </div>

      {/* List or Empty State */}
      {filteredFuseBoxes.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="max-w-md">
            <h3 className="text-sm font-bold text-white mb-1">
              اطلاعات جعبه‌فیوز برای این فیلتر یا خودرو موجود نیست
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              برای خودروی {selectedVehicleObj?.name || 'انتخاب‌شده'} یا فیلترهای مشخص‌شده، نقشه جعبه‌فیوز ثبت نشده است یا با کلمه جستجوشده تطابق ندارد.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازنشانی فیلترها و مشاهده همه</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredFuseBoxes.map(fb => {
            const veh = vehicles.find(v => v.id === fb.vehicleId);
            const badge = getLocationBadge(fb.location);

            return (
              <div
                key={fb.id}
                onClick={() => onSelectFuseBox(fb)}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition active:scale-[0.99] group shadow-sm"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 group-hover:scale-105 transition">
                    <Zap className="w-6 h-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition truncate">
                        {fb.name}
                      </h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 truncate mt-1">
                      {veh ? `${veh.name} · ${veh.generation}` : 'خودرو استاندارد'} {fb.engineCode ? `(${fb.engineCode})` : ''} · {fb.locationFa}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1 font-mono">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span>{fb.fuses.length} فیوز ثبت‌شده</span>
                      </span>
                      {fb.relays.length > 0 && (
                        <span className="flex items-center gap-1 font-mono">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span>{fb.relays.length} رله قدرت</span>
                        </span>
                      )}
                      {(fb.realImageUrl || fb.coverDiagramUrl) && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                          دارای نقشه تصویری
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 border-zinc-800/80 pt-2 sm:pt-0">
                  <span className="text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition">
                    مشاهده نقشه و عیب‌یابی
                  </span>
                  <ChevronLeft className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 transition" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

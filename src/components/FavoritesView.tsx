import React, { useState, useMemo } from 'react';
import {
  Star,
  Search,
  Filter,
  Car,
  Cpu,
  Zap,
  FileText,
  Trash2,
  ChevronLeft,
  ArrowRight,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  ArrowUpDown,
  X
} from 'lucide-react';
import {
  FavoriteItem,
  FavoriteType,
  Vehicle,
  Connector,
  FuseBox,
  WiringDiagram,
  ECU,
  Fuse,
  Relay
} from '../types';
import { storage } from '../services/storage';
import { useAuth } from '../context/AuthContext';

interface FavoritesViewProps {
  onBack: () => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onSelectConnector: (connector: Connector) => void;
  onSelectFuseBox: (fuseBox: FuseBox) => void;
  onSelectFuse?: (fuseBox: FuseBox, fuseId: string) => void;
  onSelectRelay?: (fuseBox: FuseBox, relayId: string) => void;
  onSelectDiagram: (diagram: WiringDiagram) => void;
  onNavigateToVehicles: () => void;
  onNavigateToConnectors: () => void;
  onNavigateToFuseBoxes: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  onBack,
  onSelectVehicle,
  onSelectConnector,
  onSelectFuseBox,
  onSelectFuse,
  onSelectRelay,
  onSelectDiagram,
  onNavigateToVehicles,
  onNavigateToConnectors,
  onNavigateToFuseBoxes
}) => {
  const { currentUser } = useAuth();
  const [favoritesList, setFavoritesList] = useState<FavoriteItem[]>(() =>
    storage.getFavorites(currentUser?.uid)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | FavoriteType>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'title_asc'>('date_desc');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshList = () => {
    setFavoritesList(storage.getFavorites(currentUser?.uid));
  };

  const handleRemoveFavorite = (fav: FavoriteItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    storage.removeFavoriteById(fav.id);
    refreshList();
    setToastMessage(`«${fav.title}» از علاقه‌مندی‌ها حذف شد.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClearAllOrphaned = () => {
    const validIds = new Set<string>();
    favoritesList.forEach(fav => {
      const live = resolveLiveRecord(fav);
      if (!live.isOrphaned) {
        validIds.add(fav.id);
      }
    });

    favoritesList.forEach(fav => {
      if (!validIds.has(fav.id)) {
        storage.removeFavoriteById(fav.id);
      }
    });
    refreshList();
    setToastMessage('کلیه رکوردهای حذف‌شده از علاقه‌مندی‌ها پاک‌سازی شدند.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  /**
   * Dynamically resolves the latest live record from storage using its stable ID.
   * If the record was removed from the database, flags it safely as orphaned.
   */
  const resolveLiveRecord = (fav: FavoriteItem) => {
    if (fav.type === 'vehicle') {
      const veh = storage.getVehicleById(fav.itemId);
      if (veh) {
        return {
          isOrphaned: false,
          record: veh,
          title: veh.name,
          subtitle: `${veh.modelYears} · ${veh.electricalSystem}`,
          imageUrl: veh.imageUrl,
          vehicleName: veh.name
        };
      }
    } else if (fav.type === 'connector') {
      const conn = storage.getConnectorById(fav.itemId);
      if (conn) {
        const parentVeh = conn.vehicleId ? storage.getVehicleById(conn.vehicleId) : undefined;
        return {
          isOrphaned: false,
          record: conn,
          title: conn.name,
          subtitle: `${parentVeh?.name || 'عمومی'} · ${conn.pins.length} پایه`,
          imageUrl: conn.realImageUrl || conn.pinoutDiagramUrl,
          vehicleName: parentVeh?.name
        };
      }
    } else if (fav.type === 'fusebox') {
      const fb = storage.getFuseBoxById(fav.itemId);
      if (fb) {
        const parentVeh = fb.vehicleId ? storage.getVehicleById(fb.vehicleId) : undefined;
        return {
          isOrphaned: false,
          record: fb,
          title: fb.name,
          subtitle: `${parentVeh?.name || 'عمومی'} · ${fb.locationFa}`,
          imageUrl: fb.realImageUrl || fb.coverDiagramUrl || fb.diagramImageUrl,
          vehicleName: parentVeh?.name
        };
      }
    } else if (fav.type === 'ecu') {
      const ecu = storage.getECUById(fav.itemId);
      if (ecu) {
        const parentVeh = ecu.vehicleId ? storage.getVehicleById(ecu.vehicleId) : undefined;
        return {
          isOrphaned: false,
          record: ecu,
          title: `${ecu.brand} ${ecu.model}`,
          subtitle: parentVeh?.name || 'ECU خودرو',
          imageUrl: ecu.imageUrl,
          vehicleName: parentVeh?.name
        };
      }
    } else if (fav.type === 'diagram') {
      const diagrams = storage.getWiringDiagrams();
      const diag = diagrams.find(d => d.id === fav.itemId);
      if (diag) {
        const parentVeh = diag.vehicleId ? storage.getVehicleById(diag.vehicleId) : undefined;
        return {
          isOrphaned: false,
          record: diag,
          title: diag.title,
          subtitle: `${parentVeh?.name || 'خودرو'} · ${diag.categoryFa}`,
          imageUrl: diag.diagramImageUrl,
          vehicleName: parentVeh?.name
        };
      }
    } else if (fav.type === 'fuse' || fav.type === 'relay') {
      // Find within fuseboxes
      const fbs = storage.getFuseBoxes();
      for (const fb of fbs) {
        if (fav.type === 'fuse') {
          const f = fb.fuses?.find(fuse => fuse.id === fav.itemId);
          if (f) {
            const parentVeh = fb.vehicleId ? storage.getVehicleById(fb.vehicleId) : undefined;
            return {
              isOrphaned: false,
              record: { fuseBox: fb, item: f },
              title: `فیوز ${f.code} (${f.ratingAmps}A)`,
              subtitle: `${fb.name} · ${f.functionName}`,
              imageUrl: fb.realImageUrl || fb.coverDiagramUrl,
              vehicleName: parentVeh?.name
            };
          }
        } else {
          const r = fb.relays?.find(relay => relay.id === fav.itemId);
          if (r) {
            const parentVeh = fb.vehicleId ? storage.getVehicleById(fb.vehicleId) : undefined;
            return {
              isOrphaned: false,
              record: { fuseBox: fb, item: r },
              title: `رله ${r.code} (${r.name})`,
              subtitle: `${fb.name} · ${r.functionName}`,
              imageUrl: fb.realImageUrl || fb.coverDiagramUrl,
              vehicleName: parentVeh?.name
            };
          }
        }
      }
    }

    // Not found in active database -> Orphaned
    return {
      isOrphaned: true,
      record: null,
      title: fav.title,
      subtitle: fav.subtitle,
      imageUrl: fav.imageUrl,
      vehicleName: fav.vehicleName
    };
  };

  const handleOpenDetail = (fav: FavoriteItem) => {
    const live = resolveLiveRecord(fav);
    if (live.isOrphaned || !live.record) {
      alert('این رکورد از بانک اطلاعاتی حذف شده است و قابل بازگشایی نمی‌باشد.');
      return;
    }

    if (fav.type === 'vehicle') {
      onSelectVehicle(live.record as Vehicle);
    } else if (fav.type === 'connector') {
      onSelectConnector(live.record as Connector);
    } else if (fav.type === 'fusebox') {
      onSelectFuseBox(live.record as FuseBox);
    } else if (fav.type === 'ecu') {
      const ecu = live.record as ECU;
      const veh = ecu.vehicleId ? storage.getVehicleById(ecu.vehicleId) : undefined;
      if (veh) onSelectVehicle(veh);
      else onNavigateToConnectors();
    } else if (fav.type === 'fuse') {
      const { fuseBox, item } = live.record as { fuseBox: FuseBox; item: Fuse };
      if (onSelectFuse) onSelectFuse(fuseBox, item.id);
      else onSelectFuseBox(fuseBox);
    } else if (fav.type === 'relay') {
      const { fuseBox, item } = live.record as { fuseBox: FuseBox; item: Relay };
      if (onSelectRelay) onSelectRelay(fuseBox, item.id);
      else onSelectFuseBox(fuseBox);
    } else if (fav.type === 'diagram') {
      onSelectDiagram(live.record as WiringDiagram);
    }
  };

  const typeConfig: Record<
    FavoriteType,
    { labelFa: string; icon: React.ElementType; color: string; bgColor: string }
  > = {
    vehicle: { labelFa: 'خودرو', icon: Car, color: 'text-red-400', bgColor: 'bg-red-950/60 border-red-800' },
    connector: { labelFa: 'سوکت', icon: Cpu, color: 'text-emerald-400', bgColor: 'bg-emerald-950/60 border-emerald-800' },
    fusebox: { labelFa: 'جعبه‌فیوز', icon: Zap, color: 'text-amber-400', bgColor: 'bg-amber-950/60 border-amber-800' },
    ecu: { labelFa: 'ECU', icon: Cpu, color: 'text-indigo-400', bgColor: 'bg-indigo-950/60 border-indigo-800' },
    fuse: { labelFa: 'فیوز', icon: Zap, color: 'text-yellow-400', bgColor: 'bg-yellow-950/60 border-yellow-800' },
    relay: { labelFa: 'رله', icon: Zap, color: 'text-rose-400', bgColor: 'bg-rose-950/60 border-rose-800' },
    diagram: { labelFa: 'نقشه', icon: FileText, color: 'text-sky-400', bgColor: 'bg-sky-950/60 border-sky-800' }
  };

  // Filtered & Sorted list
  const filteredList = useMemo(() => {
    let list = [...favoritesList];

    // Category Filter
    if (categoryFilter !== 'all') {
      list = list.filter(f => f.type === categoryFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(f => {
        const live = resolveLiveRecord(f);
        return (
          live.title.toLowerCase().includes(q) ||
          live.subtitle.toLowerCase().includes(q) ||
          (live.vehicleName && live.vehicleName.toLowerCase().includes(q))
        );
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return (b.addedAt || 0) - (a.addedAt || 0);
      }
      if (sortBy === 'date_asc') {
        return (a.addedAt || 0) - (b.addedAt || 0);
      }
      if (sortBy === 'title_asc') {
        const liveA = resolveLiveRecord(a);
        const liveB = resolveLiveRecord(b);
        return liveA.title.localeCompare(liveB.title, 'fa');
      }
      return 0;
    });

    return list;
  }, [favoritesList, categoryFilter, searchQuery, sortBy]);

  const hasOrphanedRecords = useMemo(() => {
    return favoritesList.some(f => resolveLiveRecord(f).isOrphaned);
  }, [favoritesList]);

  return (
    <div className="flex flex-col gap-4 pb-20 text-right">
      {/* Top Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -mr-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95 transition"
            title="بازگشت"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span>علاقه‌مندی‌ها و نشان‌های من</span>
            </h1>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              دسترسی سریع به خودروها، پین‌اوت‌های پرکاربرد، فیوزها و نقشه‌های ذخیره‌شده
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-xl">
          {favoritesList.length} مورد
        </span>
      </div>

      {/* Toast Banner */}
      {toastMessage && (
        <div className="p-3 bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Orphaned Clean-up Alert if any */}
      {hasOrphanedRecords && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-900/60 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>برخی از موارد نشان‌شده به رکوردهایی اشاره دارند که از بانک اطلاعاتی حذف شده‌اند.</span>
          </div>
          <button
            onClick={handleClearAllOrphaned}
            className="px-3 py-1.5 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-100 text-[11px] font-bold transition flex items-center gap-1 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>پاک‌سازی موارد حذف‌شده</span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جست‌وجو در عنوان، مدل خودرو، سوکت یا شماره فیوز..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-4 h-4 text-zinc-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-800 text-xs text-white rounded-xl px-2.5 py-2 focus:outline-none"
            >
              <option value="date_desc">جدیدترین نشان‌ها</option>
              <option value="date_asc">قدیمی‌ترین نشان‌ها</option>
              <option value="title_asc">مرتب‌سازی بر اساس نام (الفبا)</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-1 pb-0.5">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              categoryFilter === 'all'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            همه موارد ({favoritesList.length})
          </button>

          {(['vehicle', 'connector', 'fusebox', 'ecu', 'fuse', 'relay', 'diagram'] as FavoriteType[]).map(catKey => {
            const count = favoritesList.filter(f => f.type === catKey).length;
            if (count === 0) return null;
            const config = typeConfig[catKey];
            const isSel = categoryFilter === catKey;

            return (
              <button
                key={catKey}
                onClick={() => setCategoryFilter(catKey)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 border ${
                  isSel
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border-zinc-800'
                }`}
              >
                <span>{config.labelFa}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isSel ? 'bg-zinc-950 text-amber-400' : 'bg-zinc-900 text-zinc-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content List */}
      {favoritesList.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-amber-400 mb-4 shadow-xl">
            <Star className="w-8 h-8" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-white">هنوز موردی به علاقه‌مندی‌ها اضافه نشده است</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm leading-relaxed">
            با لمس آیکون ستاره در صفحه هر خودرو، سوکت، جعبه‌فیوز یا نقشه، می‌توانید آن را به این بخش اضافه کنید تا دسترسی فوری داشته باشید.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={onNavigateToVehicles}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition active:scale-95"
            >
              <Car className="w-3.5 h-3.5 text-red-500" />
              <span>مشاهده خودروها</span>
            </button>
            <button
              onClick={onNavigateToConnectors}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition active:scale-95"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>پین‌اوت سوکت‌ها</span>
            </button>
            <button
              onClick={onNavigateToFuseBoxes}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>جعبه‌فیوزها</span>
            </button>
          </div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
          <Search className="w-8 h-8 text-zinc-500 mb-2" />
          <h3 className="text-xs font-bold text-white">موردی با این عبارت در علاقه‌مندی‌ها یافت نشد</h3>
          <p className="text-[11px] text-zinc-400 mt-1">لطفاً عبارت جست‌وجو یا فیلتر دسته‌بندی را تغییر دهید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredList.map((fav) => {
            const live = resolveLiveRecord(fav);
            const config = typeConfig[fav.type] || {
              labelFa: 'مورد',
              icon: Star,
              color: 'text-amber-400',
              bgColor: 'bg-zinc-800'
            };
            const Icon = config.icon;

            return (
              <div
                key={fav.id}
                onClick={() => handleOpenDetail(fav)}
                className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col justify-between group cursor-pointer active:scale-[0.99] ${
                  live.isOrphaned
                    ? 'bg-zinc-900/60 border-amber-900/50'
                    : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div>
                  {/* Card Top: Type badge & remove button */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border flex items-center gap-1 ${config.bgColor} ${config.color}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{config.labelFa}</span>
                      </span>

                      {live.vehicleName && (
                        <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 truncate max-w-[130px]">
                          {live.vehicleName}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleRemoveFavorite(fav, e)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition active:scale-90"
                      title="حذف از علاقه‌مندی‌ها"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card Center: Title & Subtitle with thumbnail */}
                  <div className="flex items-start gap-3">
                    {live.imageUrl ? (
                      <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={live.imageUrl}
                          alt={live.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 shrink-0 flex items-center justify-center text-zinc-500 group-hover:text-amber-400 transition">
                        <Icon className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition truncate">
                        {live.title}
                      </h3>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {live.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Open details or Orphan warning */}
                <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                  {live.isOrphaned ? (
                    <span className="text-amber-400 text-[10px] flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3 h-3" />
                      <span>این رکورد از دیتابیس پاک شده است</span>
                    </span>
                  ) : (
                    <span className="text-zinc-500 group-hover:text-zinc-300 transition flex items-center gap-1">
                      <span>مشاهده جزئیات کامل</span>
                    </span>
                  )}

                  <div className="flex items-center gap-1 text-zinc-500 group-hover:text-amber-400 transition">
                    <span className="text-[10px]">بازگشایی</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

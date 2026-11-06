import React, { useState } from 'react';
import { Search, ChevronLeft, Car, Filter, ArrowRight } from 'lucide-react';
import { Vehicle, Manufacturer } from '../types';
import { storage } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { useDisplaySettings } from '../context/DisplaySettingsContext';

interface VehicleDirectoryProps {
  onSelectVehicle: (vehicle: Vehicle) => void;
  onBack?: () => void;
}

export const VehicleDirectory: React.FC<VehicleDirectoryProps> = ({
  onSelectVehicle,
  onBack
}) => {
  const { isAdmin } = useAuth();
  const { settings } = useDisplaySettings();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const manufacturers = storage.getManufacturers();
  const vehicles = storage.getVehicles(!isAdmin);

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.persianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.generation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.engines.some(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.code.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;
    const man = manufacturers.find(m => m.id === v.manufacturerId);
    if (!man) return false;

    if (selectedCategory === 'iranian') return man.category === 'iranian';
    if (selectedCategory === 'european') return man.category === 'european';
    if (selectedCategory === 'chinese') return man.category === 'chinese';
    if (selectedCategory === 'korean') return man.category === 'korean';

    return true;
  });

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Top Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 -mr-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95 transition"
                title="بازگشت"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                دایرکتوری خودروها و مدل‌ها
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                انتخاب خودرو جهت دسترسی به پیناوت ECU، سنسورها و جعبه‌فیوز
              </p>
            </div>
          </div>

          <span className="text-xs text-zinc-400 font-mono bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
            {filteredVehicles.length} مدل
          </span>
        </div>

        {/* Search Input */}
        <div className="relative mt-4">
          <Search className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی مدل خودرو یا کد موتور (مثلاً ۲۰۶، TU5، پراید، EF7)..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-10 pl-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition"
          />
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === 'all'
              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          همه خودروها
        </button>
        <button
          onClick={() => setSelectedCategory('iranian')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === 'iranian'
              ? 'bg-red-950/80 text-red-300 border border-red-800'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          ایران خودرو و سایپا
        </button>
        <button
          onClick={() => setSelectedCategory('european')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === 'european'
              ? 'bg-zinc-800 text-zinc-200 border border-zinc-600'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          اروپایی (پژو و رنو)
        </button>
        <button
          onClick={() => setSelectedCategory('chinese')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === 'chinese'
              ? 'bg-zinc-800 text-zinc-200 border border-zinc-600'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          خودروهای چینی
        </button>
        <button
          onClick={() => setSelectedCategory('korean')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === 'korean'
              ? 'bg-zinc-800 text-zinc-200 border border-zinc-600'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          کره‌ای و ژاپنی
        </button>
      </div>

      {/* Vehicles Grid */}
      <div className={
        settings.vehicleCardLayout === 'list'
          ? "flex flex-col gap-2.5"
          : settings.vehicleCardLayout === 'compact'
          ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2"
          : "grid grid-cols-1 sm:grid-cols-2 gap-3"
      }>
        {filteredVehicles.map((veh, idx) => {
          const man = manufacturers.find(m => m.id === veh.manufacturerId);
          const connCount = storage.getConnectors(veh.id).length;
          const fbCount = storage.getFuseBoxes(veh.id).length;

          return (
            <div
              key={`veh-dir-${veh.id}-${idx}`}
              onClick={() => onSelectVehicle(veh)}
              className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition active:scale-[0.99] group shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-red-400 bg-red-950/50 border border-red-900/60 px-2 py-0.5 rounded">
                      {man?.name || 'خودرو'}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">{veh.modelYears}</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition" />
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-red-400 transition mt-2">
                  {veh.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                  {veh.description}
                </p>
              </div>

              {/* Bottom Specs Info */}
              <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="truncate max-w-[180px]">{veh.electricalSystem}</span>
                <div className="flex items-center gap-2 shrink-0 font-medium">
                  <span className="text-zinc-300">{connCount} سوکت</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-zinc-300">{fbCount} جعبه‌فیوز</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

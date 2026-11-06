import React, { useState, useMemo } from 'react';
import { Search, Cpu, ChevronLeft, ArrowRight, Filter, Zap, CheckCircle2 } from 'lucide-react';
import { Connector, Vehicle, ECU } from '../types';
import { storage } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { useDisplaySettings } from '../context/DisplaySettingsContext';

interface ConnectorsListViewProps {
  onSelectConnector: (connector: Connector) => void;
  onBack?: () => void;
}

export const ConnectorsListView: React.FC<ConnectorsListViewProps> = ({
  onSelectConnector,
  onBack
}) => {
  const { isAdmin } = useAuth();
  const { settings } = useDisplaySettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEcuFilter, setSelectedEcuFilter] = useState<string>('all');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('all');

  const allConnectors = storage.getConnectors(undefined, undefined, !isAdmin);
  const vehicles = storage.getVehicles(!isAdmin);
  const ecus = storage.getECUs(undefined, !isAdmin);

  // Dedicated strictly to ECU sockets and pins (exclude sensors, fuseboxes, relays)
  const ecuSockets = useMemo(() => {
    return allConnectors.filter(c => {
      // Must be an ECU socket: either category is 'ecu' or has an ecuId assigned
      return c.category === 'ecu' || Boolean(c.ecuId);
    });
  }, [allConnectors]);

  // Filter based on search query, ECU filter, and Vehicle filter
  const filteredSockets = useMemo(() => {
    return ecuSockets.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.codeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.pins.some(
          p =>
            p.functionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.pinNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.wireColor.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesVehicle = selectedVehicleFilter === 'all' || c.vehicleId === selectedVehicleFilter;
      const matchesEcu = selectedEcuFilter === 'all' || c.ecuId === selectedEcuFilter;

      return matchesSearch && matchesVehicle && matchesEcu;
    });
  }, [ecuSockets, searchQuery, selectedVehicleFilter, selectedEcuFilter]);

  // Map ECU and Vehicle for quick badges
  const getEcuInfo = (conn: Connector): ECU | undefined => {
    if (conn.ecuId) {
      return ecus.find(e => e.id === conn.ecuId);
    }
    // Fallback: match by vehicle's first ECU
    return ecus.find(e => e.vehicleId === conn.vehicleId);
  };

  return (
    <div className="flex flex-col gap-4 pb-20 text-right" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
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
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
                  <Cpu className="w-4 h-4" />
                </div>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  سوکت و پین‌اوت ECU
                </h1>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                بانک تخصصی سوکت‌ها، ماتریس سطر و ستون، نقشه‌ها و خطوط سیگنال و پالس کامپیوتر خودرو
              </p>
            </div>
          </div>
          <span className="text-xs text-zinc-300 font-mono bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 shrink-0">
            {filteredSockets.length} سوکت ECU
          </span>
        </div>

        {/* Search Input */}
        <div className="relative mt-4">
          <Search className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی شماره پایه، سیگنال و پالس، رنگ سیم یا نام سوکت (مثلاً 32V NR)..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-10 pl-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition shadow-inner"
          />
        </div>

        {/* Filters Bar: Filter by ECU and Vehicle */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Filter className="w-3.5 h-3.5 text-red-500" />
            <span className="font-semibold">فیلتر خودرو:</span>
          </div>
          <select
            value={selectedVehicleFilter}
            onChange={(e) => {
              setSelectedVehicleFilter(e.target.value);
              setSelectedEcuFilter('all');
            }}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-red-500"
          >
            <option value="all">همه خودروها</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>

          {ecus.length > 0 && (
            <>
              <span className="text-zinc-600 text-xs">|</span>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">مدل ECU:</span>
              </div>
              <select
                value={selectedEcuFilter}
                onChange={(e) => setSelectedEcuFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-red-500"
              >
                <option value="all">همه مدل‌های ECU</option>
                {ecus.map(ecu => {
                  const veh = vehicles.find(v => v.id === ecu.vehicleId);
                  return (
                    <option key={ecu.id} value={ecu.id}>
                      {ecu.brand} {ecu.model} {veh ? `(${veh.name})` : ''}
                    </option>
                  );
                })}
              </select>
            </>
          )}

          {(selectedVehicleFilter !== 'all' || selectedEcuFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedVehicleFilter('all');
                setSelectedEcuFilter('all');
                setSearchQuery('');
              }}
              className="text-[11px] text-red-400 hover:underline mr-auto"
            >
              پاک‌سازی فیلترها
            </button>
          )}
        </div>
      </div>

      {/* Sockets List Grid */}
      {filteredSockets.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400">
          <Cpu className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">هیچ سوکت ECU با این مشخصات یافت نشد</h3>
          <p className="text-xs text-zinc-500">
            فیلترها یا عبارت جستجو را تغییر دهید یا از پنل مدیریت اقدام به ثبت سوکت جدید کنید.
          </p>
        </div>
      ) : (
        <div className={settings.connectorViewMode === 'cards' || settings.connectorViewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-3" : "flex flex-col gap-2.5"}>
          {filteredSockets.map(conn => {
            const veh = vehicles.find(v => v.id === conn.vehicleId);
            const ecu = getEcuInfo(conn);
            const pulsePinsCount = conn.pins.filter(p => p.signalType === 'PWM_PULSE').length;
            const rows = conn.rows || 4;
            const cols = conn.cols || 8;

            return (
              <div
                key={conn.id}
                onClick={() => onSelectConnector(conn)}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition active:scale-[0.99] group shadow-sm"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  {/* Socket Visual Avatar */}
                  <div
                    className="w-13 h-13 rounded-xl flex flex-col items-center justify-center border shrink-0 font-bold transition shadow-inner"
                    style={{
                      backgroundColor: '#18181b',
                      borderColor: conn.socketColorHex || '#3f3f46'
                    }}
                  >
                    <span className="text-xs font-mono tabular-nums text-white font-bold">{conn.pins.length}P</span>
                    <span className="text-[9px] text-zinc-400 font-mono mt-0.5">{rows}×{cols}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition truncate">
                        {conn.name}
                      </h3>
                      {ecu && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/70 border border-red-800/80 text-red-300">
                          {ecu.brand} {ecu.model}
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                        {conn.socketColor || 'خاکستری'}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 truncate mt-1">
                      خودرو: {veh?.name || 'عمومی'} {conn.codeName ? `· ${conn.codeName}` : ''}
                    </p>

                    <div className="flex flex-wrap items-center gap-2.5 mt-2 text-[11px] text-zinc-400">
                      <span className="inline-flex items-center gap-1 font-mono text-zinc-300">
                        ماتریس: {rows} ردیف × {cols} ستون
                      </span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-emerald-400 font-medium">
                        {pulsePinsCount} پایه سیگنال و پالس
                      </span>
                      {conn.pins.length < conn.pinCount && (
                        <>
                          <span className="text-zinc-600">·</span>
                          <span className="text-amber-400 text-[10px]">
                            {conn.pinCount - conn.pins.length} خانه آزاد
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                  <span className="text-xs font-semibold text-red-400 group-hover:translate-x-0.5 transition">
                    مشاهده نقشه و پین‌اوت
                  </span>
                  <ChevronLeft className="w-5 h-5 text-zinc-500 group-hover:text-red-400 transition" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

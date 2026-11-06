import React, { useState } from 'react';
import {
  ArrowRight,
  Cpu,
  Zap,
  FileText,
  ChevronLeft,
  Sliders,
  Share2
} from 'lucide-react';
import { Vehicle, Connector, FuseBox, WiringDiagram } from '../types';
import { storage } from '../services/storage';
import { FavoriteButton } from './FavoriteButton';
import { useAuth } from '../context/AuthContext';

interface VehicleDetailProps {
  vehicle: Vehicle;
  onBack: () => void;
  onSelectConnector: (connector: Connector) => void;
  onSelectFuseBox: (fuseBox: FuseBox) => void;
  onSelectDiagram: (diagram: WiringDiagram) => void;
}

export const VehicleDetail: React.FC<VehicleDetailProps> = ({
  vehicle,
  onBack,
  onSelectConnector,
  onSelectFuseBox,
  onSelectDiagram
}) => {
  const { currentUser } = useAuth();
  const [activeSection, setActiveSection] = useState<'connectors' | 'fuseboxes' | 'diagrams'>('connectors');

  const connectors = storage.getConnectors(vehicle.id);
  const fuseBoxes = storage.getFuseBoxes(vehicle.id);
  const diagrams = storage.getWiringDiagrams(vehicle.id);
  const ecus = storage.getECUs(vehicle.id);

  // Register in recents
  React.useEffect(() => {
    storage.addRecentVehicle(vehicle.id, currentUser?.uid);
  }, [vehicle.id, currentUser?.uid]);

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Vehicle Hero Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
        {/* Subtle accent border */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-2 -mr-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95 transition"
              title="بازگشت به خودروها"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-xl font-black text-white tracking-tight">
                {vehicle.name}
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                {vehicle.persianName} · {vehicle.modelYears}
              </p>
            </div>
          </div>

          <FavoriteButton
            type="vehicle"
            itemId={vehicle.id}
            title={vehicle.name}
            subtitle={`${vehicle.modelYears} · ${vehicle.electricalSystem}`}
            imageUrl={vehicle.imageUrl}
            size="md"
          />
        </div>

        {/* Specs tags */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
            سیستم برق: <span className="text-red-400 font-semibold">{vehicle.electricalSystem}</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
            نسل: <span className="text-zinc-200">{vehicle.generation}</span>
          </span>
        </div>

        <p className="mt-3 text-xs text-zinc-400 leading-relaxed">
          {vehicle.description}
        </p>

        {/* Engines List */}
        {vehicle.engines && vehicle.engines.length > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-800/80">
            <span className="text-[11px] font-bold text-zinc-400 block mb-2">موتورهای این مدل:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {vehicle.engines.map(eng => (
                <div key={eng.id} className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs">
                  <div className="flex items-center justify-between font-bold text-zinc-200">
                    <span>{eng.name}</span>
                    <span className="text-red-400 font-mono">{eng.code}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">{eng.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ECUs in this model */}
        {ecus.length > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-800/80">
            <span className="text-[11px] font-bold text-zinc-400 block mb-2">کامپیوترهای موتور (ECU):</span>
            <div className="flex flex-wrap gap-2">
              {ecus.map(ecu => (
                <div key={ecu.id} className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs flex items-center gap-2">
                  <div>
                    <span className="text-zinc-400">{ecu.brand} </span>
                    <span className="font-bold text-white">{ecu.model}</span>
                  </div>
                  <FavoriteButton
                    type="ecu"
                    itemId={ecu.id}
                    title={`${ecu.brand} ${ecu.model}`}
                    subtitle={vehicle.name}
                    vehicleId={vehicle.id}
                    vehicleName={vehicle.name}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Segment Tabs */}
      <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
        <button
          onClick={() => setActiveSection('connectors')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition ${
            activeSection === 'connectors'
              ? 'bg-zinc-800 text-white shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Cpu className="w-4 h-4 text-red-500" />
          <span>سوکت‌ها و پیناوت ({connectors.length})</span>
        </button>
        <button
          onClick={() => setActiveSection('fuseboxes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition ${
            activeSection === 'fuseboxes'
              ? 'bg-zinc-800 text-white shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>جعبه‌فیوزها ({fuseBoxes.length})</span>
        </button>
        <button
          onClick={() => setActiveSection('diagrams')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition ${
            activeSection === 'diagrams'
              ? 'bg-zinc-800 text-white shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FileText className="w-4 h-4 text-sky-500" />
          <span>نقشه‌های سیم‌کشی ({diagrams.length})</span>
        </button>
      </div>

      {/* Connectors List */}
      {activeSection === 'connectors' && (
        <div className="flex flex-col gap-2.5">
          {connectors.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs">
              سوکت اختصاصی برای این مدل هنوز ثبت نشده است. از پنل مدیریت می‌توانید سوکت جدید اضافه کنید.
            </div>
          ) : (
            connectors.map(conn => (
              <div
                key={conn.id}
                onClick={() => onSelectConnector(conn)}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 text-white font-bold"
                    style={{
                      backgroundColor: '#18181b',
                      borderColor: conn.socketColorHex || '#3f3f46'
                    }}
                  >
                    <span className="text-xs tabular-nums text-zinc-300">{conn.pinCount}P</span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition truncate">
                      {conn.name}
                    </h3>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      رنگ: {conn.socketColor} · {conn.codeName}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
                      <span>تأییدشده</span>
                      <span aria-hidden="true">·</span>
                      <span>{conn.pins.length} پین مستند</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-red-400 group-hover:translate-x-1 transition hidden sm:inline">
                    مشاهده پیناوت
                  </span>
                  <ChevronLeft className="w-5 h-5 text-zinc-500 group-hover:text-red-400 transition" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Fuseboxes List */}
      {activeSection === 'fuseboxes' && (
        <div className="flex flex-col gap-2.5">
          {fuseBoxes.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs">
              جعبه‌فیوزی برای این خودرو ثبت نشده است.
            </div>
          ) : (
            fuseBoxes.map(fb => (
              <div
                key={fb.id}
                onClick={() => onSelectFuseBox(fb)}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                    <Zap className="w-6 h-6" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition truncate">
                      {fb.name}
                    </h3>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      محل نصب: {fb.locationFa}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
                      <span>{fb.fuses.length} فیوز</span>
                      {fb.relays.length > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{fb.relays.length} رله</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition hidden sm:inline">
                    مشاهده نقشه
                  </span>
                  <ChevronLeft className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 transition" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Diagrams List */}
      {activeSection === 'diagrams' && (
        <div className="flex flex-col gap-2.5">
          {diagrams.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs">
              نقشه سیم‌کشی ثبت نشده است.
            </div>
          ) : (
            diagrams.map(diag => (
              <div
                key={diag.id}
                onClick={() => onSelectDiagram(diag)}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shrink-0 text-sky-400">
                    <FileText className="w-6 h-6" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition truncate">
                      {diag.title}
                    </h3>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      دسته: {diag.categoryFa}
                    </p>
                    <span className="text-[11px] text-zinc-500 block mt-1">منبع: {diag.source}</span>
                  </div>
                </div>

                <ChevronLeft className="w-5 h-5 text-zinc-500 group-hover:text-sky-400 transition shrink-0" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

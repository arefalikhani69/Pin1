import React, { useState } from 'react';
import { FileText, Maximize2, Search, ArrowRight, Layers, CheckCircle2 } from 'lucide-react';
import { WiringDiagram, Vehicle } from '../types';
import { storage } from '../services/storage';
import { ImageViewerModal } from './ImageViewerModal';
import { FavoriteButton } from './FavoriteButton';

interface WiringDiagramsViewProps {
  onBack?: () => void;
  onSelectVehicle?: (vehicle: Vehicle) => void;
}

export const WiringDiagramsView: React.FC<WiringDiagramsViewProps> = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDiagram, setActiveDiagram] = useState<WiringDiagram | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const diagrams = storage.getWiringDiagrams();
  const vehicles = storage.getVehicles();

  const filteredDiagrams = diagrams.filter(d => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.source.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = selectedCategory === 'all' || d.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleOpenDiagram = (diagram: WiringDiagram) => {
    setActiveDiagram(diagram);
    setIsViewerOpen(true);
  };

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
                نقشه‌های سیم‌کشی و شماتیک الکتریکال
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                مسیرهای سیم‌کشی سوخت‌رسانی، استارت، شارژ دینام و سیستم‌های شبکه‌ای
              </p>
            </div>
          </div>
          <span className="text-xs text-zinc-400 font-mono bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
            {filteredDiagrams.length} نقشه
          </span>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی مدار (مثلاً استارت، انژکتور، فن، دینام)..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-10 pl-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === 'all'
              ? 'bg-zinc-800 text-white border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          همه نقشه‌ها
        </button>
        <button
          onClick={() => setSelectedCategory('injection_ignition')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === 'injection_ignition'
              ? 'bg-red-950/80 text-red-300 border border-red-800'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          پاشش سوخت و جرقه
        </button>
        <button
          onClick={() => setSelectedCategory('starter_charging')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === 'starter_charging'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          استارت و شارژ دینام
        </button>
        <button
          onClick={() => setSelectedCategory('cooling_fan')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === 'cooling_fan'
              ? 'bg-sky-950/80 text-sky-300 border border-sky-800'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          سیستم فن و خنک‌کننده
        </button>
      </div>

      {/* Diagram Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredDiagrams.map(diag => {
          const veh = vehicles.find(v => v.id === diag.vehicleId);
          return (
            <div
              key={diag.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-sky-400 bg-sky-950/60 border border-sky-800/80 px-2 py-0.5 rounded">
                      {diag.categoryFa}
                    </span>
                    {veh && <span className="text-xs text-zinc-400">{veh.name}</span>}
                  </div>
                  <FavoriteButton
                    type="diagram"
                    itemId={diag.id}
                    title={diag.title}
                    subtitle={`${veh?.name || 'خودرو'} · ${diag.categoryFa}`}
                    imageUrl={diag.diagramImageUrl}
                    vehicleId={diag.vehicleId}
                    vehicleName={veh?.name}
                    size="sm"
                  />
                </div>

                <h3 className="text-sm font-bold text-white mt-2 leading-snug">
                  {diag.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  {diag.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">منبع: {diag.source}</span>
                <button
                  onClick={() => handleOpenDiagram(diag)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition active:scale-95"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>مشاهده نقشه</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zoom Modal */}
      {activeDiagram && (
        <ImageViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          imageUrl={activeDiagram.diagramImageUrl}
          title={activeDiagram.title}
          subtitle={activeDiagram.categoryFa}
        />
      )}
    </div>
  );
};

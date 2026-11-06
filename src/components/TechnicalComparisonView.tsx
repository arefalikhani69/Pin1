import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Car,
  Cpu,
  Zap,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Filter,
  Printer,
  ChevronLeft,
  X,
  Search,
  Maximize2,
  ExternalLink,
  Layers,
  Info,
  Sparkles,
  FileText
} from 'lucide-react';
import {
  Vehicle,
  Connector,
  FuseBox,
  ECU,
  WiringDiagram
} from '../types';
import { storage } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { normalizeSearchText } from '../utils/searchEngine';
import {
  compareVehicles,
  compareEcus,
  compareFuseBoxes,
  compareConnectors,
  ComparisonOutcome,
  ComparisonFilterType
} from '../utils/comparisonEngine';
import { getFuseColor, getRelayColor } from '../utils/fuseColors';
import { ImageViewerModal } from './ImageViewerModal';

export type ComparisonMode = 'vehicles' | 'ecus' | 'connectors' | 'fuseboxes';

interface TechnicalComparisonViewProps {
  onSelectVehicle?: (vehicle: Vehicle) => void;
  onSelectConnector?: (connector: Connector) => void;
  onSelectFuseBox?: (fuseBox: FuseBox) => void;
  onClose?: () => void;
}

export const TechnicalComparisonView: React.FC<TechnicalComparisonViewProps> = ({
  onSelectVehicle,
  onSelectConnector,
  onSelectFuseBox,
  onClose
}) => {
  const { isAdmin } = useAuth();
  const [mode, setMode] = useState<ComparisonMode>('vehicles');

  // Datasets from storage (filtered for public non-admins)
  const vehicles = useMemo(() => storage.getVehicles(!isAdmin), [isAdmin]);
  const connectors = useMemo(() => storage.getConnectors(undefined, undefined, !isAdmin), [isAdmin]);
  const fuseBoxes = useMemo(() => storage.getFuseBoxes(undefined, !isAdmin), [isAdmin]);
  const ecus = useMemo(() => storage.getECUs(undefined, !isAdmin), [isAdmin]);
  const diagrams = useMemo(() => storage.getWiringDiagrams(undefined, !isAdmin), [isAdmin]);

  // Selected Entities
  const [selectedVehicle1, setSelectedVehicle1] = useState<Vehicle | null>(
    vehicles.length > 0 ? vehicles[0] : null
  );
  const [selectedVehicle2, setSelectedVehicle2] = useState<Vehicle | null>(
    vehicles.length > 1 ? vehicles[1] : vehicles[0] || null
  );

  const [selectedEcu1, setSelectedEcu1] = useState<ECU | null>(
    ecus.length > 0 ? ecus[0] : null
  );
  const [selectedEcu2, setSelectedEcu2] = useState<ECU | null>(
    ecus.length > 1 ? ecus[1] : ecus[0] || null
  );

  const [selectedConn1, setSelectedConn1] = useState<Connector | null>(
    connectors.length > 0 ? connectors[0] : null
  );
  const [selectedConn2, setSelectedConn2] = useState<Connector | null>(
    connectors.length > 1 ? connectors[1] : connectors[0] || null
  );

  const [selectedFuseBox1, setSelectedFuseBox1] = useState<FuseBox | null>(
    fuseBoxes.length > 0 ? fuseBoxes[0] : null
  );
  const [selectedFuseBox2, setSelectedFuseBox2] = useState<FuseBox | null>(
    fuseBoxes.length > 1 ? fuseBoxes[1] : fuseBoxes[0] || null
  );

  // Filter state for differences
  const [filterType, setFilterType] = useState<ComparisonFilterType>('all');

  // Search/Picker Modal State
  const [pickerModal, setPickerModal] = useState<{
    isOpen: boolean;
    side: 'first' | 'second';
  }>({ isOpen: false, side: 'first' });
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');

  // Image Viewer Modal for clicked schematic or technical photo
  const [activeViewerImage, setActiveViewerImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Print/Export Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Swap Sides
  const handleSwap = () => {
    if (mode === 'vehicles') {
      const temp = selectedVehicle1;
      setSelectedVehicle1(selectedVehicle2);
      setSelectedVehicle2(temp);
    } else if (mode === 'ecus') {
      const temp = selectedEcu1;
      setSelectedEcu1(selectedEcu2);
      setSelectedEcu2(temp);
    } else if (mode === 'connectors') {
      const temp = selectedConn1;
      setSelectedConn1(selectedConn2);
      setSelectedConn2(temp);
    } else if (mode === 'fuseboxes') {
      const temp = selectedFuseBox1;
      setSelectedFuseBox1(selectedFuseBox2);
      setSelectedFuseBox2(temp);
    }
  };

  // Run comparisons
  const vehicleComparison = useMemo(() => {
    if (!selectedVehicle1 || !selectedVehicle2) return null;
    return compareVehicles(selectedVehicle1, selectedVehicle2, connectors, fuseBoxes, diagrams, ecus);
  }, [selectedVehicle1, selectedVehicle2, connectors, fuseBoxes, diagrams, ecus]);

  const ecuComparison = useMemo(() => {
    if (!selectedEcu1 || !selectedEcu2) return null;
    return compareEcus(selectedEcu1, selectedEcu2, connectors, vehicles);
  }, [selectedEcu1, selectedEcu2, connectors, vehicles]);

  const connComparison = useMemo(() => {
    if (!selectedConn1 || !selectedConn2) return null;
    return compareConnectors(selectedConn1, selectedConn2, vehicles);
  }, [selectedConn1, selectedConn2, vehicles]);

  const fuseBoxComparison = useMemo(() => {
    if (!selectedFuseBox1 || !selectedFuseBox2) return null;
    return compareFuseBoxes(selectedFuseBox1, selectedFuseBox2, vehicles);
  }, [selectedFuseBox1, selectedFuseBox2, vehicles]);

  // Helper badge for outcome
  const getOutcomeBadge = (outcome: ComparisonOutcome) => {
    switch (outcome) {
      case 'identical':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3" />
            <span>یکسان</span>
          </span>
        );
      case 'different':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3" />
            <span>متفاوت</span>
          </span>
        );
      case 'only_first':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 bg-sky-950/80 border border-sky-800 px-2 py-0.5 rounded">
            <span>فقط در مورد اول</span>
          </span>
        );
      case 'only_second':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 bg-purple-950/80 border border-purple-800 px-2 py-0.5 rounded">
            <span>فقط در مورد دوم</span>
          </span>
        );
      case 'needs_review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded">
            <HelpCircle className="w-3 h-3" />
            <span>نیازمند بررسی فنی</span>
          </span>
        );
      default:
        return (
          <span className="text-[11px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded">
            اطلاعات ناکافی
          </span>
        );
    }
  };

  // Filtered rows for ECU comparison
  const filteredEcuPinRows = useMemo(() => {
    if (!ecuComparison) return [];
    return ecuComparison.pinRows.filter(row => {
      if (filterType === 'all') return true;
      if (filterType === 'identical_only') return row.outcome === 'identical';
      if (filterType === 'differences_only') return row.outcome === 'different' || row.outcome === 'needs_review';
      if (filterType === 'only_first') return row.outcome === 'only_first';
      if (filterType === 'only_second') return row.outcome === 'only_second';
      if (filterType === 'needs_review_only') return row.outcome === 'needs_review';
      return true;
    });
  }, [ecuComparison, filterType]);

  // Filtered rows for Fuse comparison
  const filteredFuseRows = useMemo(() => {
    if (!fuseBoxComparison) return [];
    return fuseBoxComparison.fuseRows.filter(row => {
      if (filterType === 'all') return true;
      if (filterType === 'identical_only') return row.outcome === 'identical';
      if (filterType === 'differences_only') return row.outcome === 'different';
      if (filterType === 'only_first') return row.outcome === 'only_first';
      if (filterType === 'only_second') return row.outcome === 'only_second';
      return true;
    });
  }, [fuseBoxComparison, filterType]);

  // Filtered rows for Connector pin comparison
  const filteredConnPinRows = useMemo(() => {
    if (!connComparison) return [];
    return connComparison.rows.filter(row => {
      if (filterType === 'all') return true;
      if (filterType === 'identical_only') return row.outcome === 'identical';
      if (filterType === 'differences_only') return row.outcome === 'different' || row.outcome === 'needs_review';
      if (filterType === 'only_first') return row.outcome === 'only_first';
      if (filterType === 'only_second') return row.outcome === 'only_second';
      if (filterType === 'needs_review_only') return row.outcome === 'needs_review';
      return true;
    });
  }, [connComparison, filterType]);

  // Picker items based on active mode
  const pickerCandidates = useMemo(() => {
    const q = normalizeSearchText(pickerSearchQuery);
    if (mode === 'vehicles') {
      return vehicles.filter(v => !q || normalizeSearchText(v.name).includes(q) || normalizeSearchText(v.persianName).includes(q) || (v.engines || []).some(e => normalizeSearchText(e.code).includes(q)));
    }
    if (mode === 'ecus') {
      return ecus.filter(e => !q || normalizeSearchText(e.brand).includes(q) || normalizeSearchText(e.model).includes(q));
    }
    if (mode === 'connectors') {
      return connectors.filter(c => !q || normalizeSearchText(c.name).includes(q) || normalizeSearchText(c.codeName).includes(q));
    }
    if (mode === 'fuseboxes') {
      return fuseBoxes.filter(f => !q || normalizeSearchText(f.name).includes(q) || normalizeSearchText(f.locationFa).includes(q));
    }
    return [];
  }, [mode, pickerSearchQuery, vehicles, ecus, connectors, fuseBoxes]);

  const handleSelectCandidate = (item: any) => {
    const isFirst = pickerModal.side === 'first';
    if (mode === 'vehicles') {
      if (isFirst) setSelectedVehicle1(item);
      else setSelectedVehicle2(item);
    } else if (mode === 'ecus') {
      if (isFirst) setSelectedEcu1(item);
      else setSelectedEcu2(item);
    } else if (mode === 'connectors') {
      if (isFirst) setSelectedConn1(item);
      else setSelectedConn2(item);
    } else if (mode === 'fuseboxes') {
      if (isFirst) setSelectedFuseBox1(item);
      else setSelectedFuseBox2(item);
    }
    setPickerModal({ isOpen: false, side: 'first' });
    setPickerSearchQuery('');
  };

  return (
    <div className="flex flex-col gap-5 pb-28">
      {/* Top Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>مقایسه تخصصی خودرو و سیستم برق</span>
              <span className="text-[10px] bg-red-950/80 text-red-400 border border-red-800/80 px-2 py-0.5 rounded font-mono">
                Workshop Compare
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              تحلیل و تطبیق هوشمند تفاوت‌های فنی دو خودرو، دو ECU، دو سوکت یا دو جعبه‌فیوز
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            title="تهیه نسخه قابل چاپ و گزارش مقایسه"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>گزارش / چاپ</span>
          </button>
        </div>
      </div>

      {/* Comparison Mode Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { id: 'vehicles', label: 'مقایسه دو خودرو', icon: Car, count: vehicles.length },
          { id: 'ecus', label: 'مقایسه دو ECU', icon: Cpu, count: ecus.length },
          { id: 'connectors', label: 'مقایسه دو سوکت', icon: Sparkles, count: connectors.length },
          { id: 'fuseboxes', label: 'مقایسه جعبه‌فیوزها', icon: Zap, count: fuseBoxes.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = mode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setMode(tab.id as ComparisonMode);
                setFilterType('all');
              }}
              className={`p-3 rounded-2xl border text-right transition flex items-center justify-between active:scale-98 ${
                isActive
                  ? 'bg-zinc-900 border-red-500/80 text-white shadow-md shadow-red-950/30'
                  : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-tight">{tab.label}</span>
                  <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{tab.count} مورد ثبت‌شده</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Dual Selection Stage Cards */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 text-xs text-zinc-400">
          <span className="font-semibold text-zinc-300">انتخاب و بررسی طرفین مقایسه:</span>
          <button
            type="button"
            onClick={handleSwap}
            className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 transition active:scale-95"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>جابه‌جایی طرفین ⇄</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Side 1 Card */}
          <div className="bg-zinc-950 border border-red-900/50 rounded-xl p-3.5 flex flex-col justify-between gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 bg-red-600" />
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">طرف اول (مورد A)</span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {mode === 'vehicles' && (selectedVehicle1?.name || 'انتخاب نشده')}
                  {mode === 'ecus' && (`${selectedEcu1?.brand || ''} ${selectedEcu1?.model || 'انتخاب نشده'}`)}
                  {mode === 'connectors' && (selectedConn1?.name || 'انتخاب نشده')}
                  {mode === 'fuseboxes' && (selectedFuseBox1?.name || 'انتخاب نشده')}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {mode === 'vehicles' && selectedVehicle1 && `${selectedVehicle1.persianName} · ${selectedVehicle1.modelYears}`}
                  {mode === 'ecus' && selectedEcu1 && `${storage.getVehicleById(selectedEcu1.vehicleId)?.name || 'خودرو'} · ${selectedEcu1.connectorCount} سوکت`}
                  {mode === 'connectors' && selectedConn1 && `${selectedConn1.codeName} · ${selectedConn1.pinCount} پایه`}
                  {mode === 'fuseboxes' && selectedFuseBox1 && `${selectedFuseBox1.locationFa} · ${selectedFuseBox1.fuses?.length || 0} فیوز`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPickerModal({ isOpen: true, side: 'first' })}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold shrink-0 transition"
              >
                تغییر
              </button>
            </div>

            {/* Quick jump to page */}
            {mode === 'vehicles' && selectedVehicle1 && onSelectVehicle && (
              <button
                onClick={() => onSelectVehicle(selectedVehicle1)}
                className="text-[11px] text-zinc-400 hover:text-red-400 flex items-center gap-1 pt-2 border-t border-zinc-800/80 transition"
              >
                <span>مشاهده صفحه کامل این خودرو</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
            {mode === 'connectors' && selectedConn1 && onSelectConnector && (
              <button
                onClick={() => onSelectConnector(selectedConn1)}
                className="text-[11px] text-zinc-400 hover:text-red-400 flex items-center gap-1 pt-2 border-t border-zinc-800/80 transition"
              >
                <span>مشاهده پیناوت کامل این سوکت</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
            {mode === 'fuseboxes' && selectedFuseBox1 && onSelectFuseBox && (
              <button
                onClick={() => onSelectFuseBox(selectedFuseBox1)}
                className="text-[11px] text-zinc-400 hover:text-red-400 flex items-center gap-1 pt-2 border-t border-zinc-800/80 transition"
              >
                <span>مشاهده صفحه کامل این جعبه‌فیوز</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Side 2 Card */}
          <div className="bg-zinc-950 border border-amber-900/50 rounded-xl p-3.5 flex flex-col justify-between gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500" />
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">طرف دوم (مورد B)</span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {mode === 'vehicles' && (selectedVehicle2?.name || 'انتخاب نشده')}
                  {mode === 'ecus' && (`${selectedEcu2?.brand || ''} ${selectedEcu2?.model || 'انتخاب نشده'}`)}
                  {mode === 'connectors' && (selectedConn2?.name || 'انتخاب نشده')}
                  {mode === 'fuseboxes' && (selectedFuseBox2?.name || 'انتخاب نشده')}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {mode === 'vehicles' && selectedVehicle2 && `${selectedVehicle2.persianName} · ${selectedVehicle2.modelYears}`}
                  {mode === 'ecus' && selectedEcu2 && `${storage.getVehicleById(selectedEcu2.vehicleId)?.name || 'خودرو'} · ${selectedEcu2.connectorCount} سوکت`}
                  {mode === 'connectors' && selectedConn2 && `${selectedConn2.codeName} · ${selectedConn2.pinCount} پایه`}
                  {mode === 'fuseboxes' && selectedFuseBox2 && `${selectedFuseBox2.locationFa} · ${selectedFuseBox2.fuses?.length || 0} فیوز`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPickerModal({ isOpen: true, side: 'second' })}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold shrink-0 transition"
              >
                تغییر
              </button>
            </div>

            {/* Quick jump to page */}
            {mode === 'vehicles' && selectedVehicle2 && onSelectVehicle && (
              <button
                onClick={() => onSelectVehicle(selectedVehicle2)}
                className="text-[11px] text-zinc-400 hover:text-amber-400 flex items-center gap-1 pt-2 border-t border-zinc-800/80 transition"
              >
                <span>مشاهده صفحه کامل این خودرو</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
            {mode === 'connectors' && selectedConn2 && onSelectConnector && (
              <button
                onClick={() => onSelectConnector(selectedConn2)}
                className="text-[11px] text-zinc-400 hover:text-amber-400 flex items-center gap-1 pt-2 border-t border-zinc-800/80 transition"
              >
                <span>مشاهده پیناوت کامل این سوکت</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
            {mode === 'fuseboxes' && selectedFuseBox2 && onSelectFuseBox && (
              <button
                onClick={() => onSelectFuseBox(selectedFuseBox2)}
                className="text-[11px] text-zinc-400 hover:text-amber-400 flex items-center gap-1 pt-2 border-t border-zinc-800/80 transition"
              >
                <span>مشاهده صفحه کامل این جعبه‌فیوز</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Difference Filter Bar (For table modes) */}
      {(mode === 'ecus' || mode === 'connectors' || mode === 'fuseboxes') && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-zinc-500 font-bold shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span>فیلتر نتایج:</span>
          </span>
          {[
            { id: 'all', label: 'همه موارد' },
            { id: 'identical_only', label: 'فقط موارد مشترک' },
            { id: 'differences_only', label: 'فقط تفاوت‌ها' },
            { id: 'only_first', label: 'فقط در مورد اول' },
            { id: 'only_second', label: 'فقط در مورد دوم' },
            { id: 'needs_review_only', label: 'نیازمند بررسی فنی' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as ComparisonFilterType)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 ${
                filterType === f.id
                  ? 'bg-red-600 text-white shadow-md shadow-red-950'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. VEHICLE COMPARISON CONTENT */}
      {/* ------------------------------------------------------------- */}
      {mode === 'vehicles' && vehicleComparison && (
        <div className="space-y-4">
          {/* Summary Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col">
              <span className="text-[11px] text-zinc-400">مشخصات یکسان / مشترک</span>
              <span className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                {vehicleComparison.commonFeaturesCount} مورد
              </span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col">
              <span className="text-[11px] text-zinc-400">مشخصات متفاوت</span>
              <span className="text-lg font-black text-amber-400 font-mono mt-0.5">
                {vehicleComparison.differingFeaturesCount} مورد
              </span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col">
              <span className="text-[11px] text-zinc-400">موتورهای مشترک</span>
              <span className="text-lg font-black text-sky-400 font-mono mt-0.5">
                {vehicleComparison.commonEngines.length > 0
                  ? vehicleComparison.commonEngines.join('، ')
                  : 'فاقد موتور مشترک'}
              </span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col">
              <span className="text-[11px] text-zinc-400">مجموع پایه‌های ثبت‌شده</span>
              <span className="text-lg font-black text-zinc-200 font-mono mt-0.5">
                {vehicleComparison.firstTotalPins} vs {vehicleComparison.secondTotalPins}
              </span>
            </div>
          </div>

          {/* Side-by-Side Detailed Specs Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-3.5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs">
              <h4 className="font-bold text-zinc-200 flex items-center gap-2">
                <Car className="w-4 h-4 text-red-500" />
                <span>جدول مقایسه پارامترهای فنی دو خودرو</span>
              </h4>
              <span className="text-[10px] text-zinc-500 font-mono">
                {vehicleComparison.rows.length} شاخص فنی
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 font-bold">
                    <th className="py-2.5 px-4 w-1/4">شاخص فنی</th>
                    <th className="py-2.5 px-4 w-1/3 text-red-400 font-bold">
                      {vehicleComparison.firstVehicle.name}
                    </th>
                    <th className="py-2.5 px-4 w-1/3 text-amber-400 font-bold">
                      {vehicleComparison.secondVehicle.name}
                    </th>
                    <th className="py-2.5 px-3 text-center w-24">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {vehicleComparison.rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-zinc-850/50 transition ${
                        !row.isIdentical ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-zinc-300">
                        {row.label}
                      </td>
                      <td className="py-3 px-4 text-zinc-200 leading-relaxed">
                        {row.firstValue}
                      </td>
                      <td className="py-3 px-4 text-zinc-200 leading-relaxed">
                        {row.secondValue}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {row.isIdentical ? (
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                            مشترک
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded font-bold">
                            متفاوت
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. ECU COMPARISON CONTENT */}
      {/* ------------------------------------------------------------- */}
      {mode === 'ecus' && ecuComparison && (
        <div className="space-y-4">
          {/* Summary counters */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-zinc-400 block">پایه‌های کاملاً یکسان</span>
              <span className="text-base font-black text-emerald-400 font-mono">{ecuComparison.identicalCount}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-zinc-400 block">تفاوت در مدار / عملکرد</span>
              <span className="text-base font-black text-amber-400 font-mono">{ecuComparison.differentCount}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-zinc-400 block">فقط در ECU اول</span>
              <span className="text-base font-black text-sky-400 font-mono">{ecuComparison.onlyFirstCount}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-zinc-400 block">فقط در ECU دوم</span>
              <span className="text-base font-black text-purple-400 font-mono">{ecuComparison.onlySecondCount}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-zinc-400 block">نیازمند بررسی فنی</span>
              <span className="text-base font-black text-rose-400 font-mono">{ecuComparison.needsReviewCount}</span>
            </div>
          </div>

          {/* Important Engineering Notice */}
          <div className="bg-zinc-900/60 border border-amber-900/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>قاعده طلایی کارگاهی:</strong> شماره پایه یکسان در دو کامپیوتر مختلف لزوماً به معنای عملکرد یکسان نیست. هرگز پایه‌ها را صرفاً بر اساس شباهت شماره به یکدیگر متصل نکنید. به برچسب‌های تحلیل فنی توجه کنید.
            </div>
          </div>

          {/* Detailed Pinout Comparison Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-3.5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs">
              <h4 className="font-bold text-zinc-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-red-500" />
                <span>جدول تطبیق پین‌به‌پین پایه‌های ECU</span>
              </h4>
              <span className="text-[10px] text-zinc-400 font-mono">
                {filteredEcuPinRows.length} پایه تطبیق‌یافته
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 font-bold">
                    <th className="py-2.5 px-3 w-16 text-center">پایه ۱</th>
                    <th className="py-2.5 px-3 w-1/4 text-red-400">عملکرد در {ecuComparison.firstEcu.model}</th>
                    <th className="py-2.5 px-3 w-16 text-center">پایه ۲</th>
                    <th className="py-2.5 px-3 w-1/4 text-amber-400">عملکرد در {ecuComparison.secondEcu.model}</th>
                    <th className="py-2.5 px-3 w-28 text-center">نتیجه مقایسه</th>
                    <th className="py-2.5 px-4">تحلیل و یادداشت فنی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {filteredEcuPinRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500">
                        موردی مطابق با فیلتر انتخابی یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredEcuPinRows.map(row => (
                      <tr
                        key={row.id}
                        className={`hover:bg-zinc-850/50 transition ${
                          row.outcome === 'needs_review'
                            ? 'bg-rose-950/15'
                            : row.outcome === 'different'
                            ? 'bg-amber-950/10'
                            : ''
                        }`}
                      >
                        {/* Side 1 Pin */}
                        <td className="py-3 px-3 text-center">
                          {row.firstPinNumber ? (
                            <span className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/40 inline-flex items-center justify-center font-mono font-bold">
                              {row.firstPinNumber}
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {row.firstFunctionName ? (
                            <div>
                              <span className="font-bold text-zinc-200 block">{row.firstFunctionName}</span>
                              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-400">
                                {row.firstWireHex && (
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-zinc-700 inline-block"
                                    style={{ backgroundColor: row.firstWireHex }}
                                  />
                                )}
                                <span>{row.firstWireColor}</span>
                                {row.firstSignalType && (
                                  <span className="text-zinc-500 font-mono">({row.firstSignalType})</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-zinc-500 text-[11px]">در این ECU وجود ندارد</span>
                          )}
                        </td>

                        {/* Side 2 Pin */}
                        <td className="py-3 px-3 text-center">
                          {row.secondPinNumber ? (
                            <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center justify-center font-mono font-bold">
                              {row.secondPinNumber}
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {row.secondFunctionName ? (
                            <div>
                              <span className="font-bold text-zinc-200 block">{row.secondFunctionName}</span>
                              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-400">
                                {row.secondWireHex && (
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-zinc-700 inline-block"
                                    style={{ backgroundColor: row.secondWireHex }}
                                  />
                                )}
                                <span>{row.secondWireColor}</span>
                                {row.secondSignalType && (
                                  <span className="text-zinc-500 font-mono">({row.secondSignalType})</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-zinc-500 text-[11px]">در این ECU وجود ندارد</span>
                          )}
                        </td>

                        {/* Outcome Badge */}
                        <td className="py-3 px-3 text-center">
                          {getOutcomeBadge(row.outcome)}
                        </td>

                        {/* Note */}
                        <td className="py-3 px-4 text-[11px] text-zinc-400 leading-relaxed">
                          {row.technicalNote}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. CONNECTOR COMPARISON CONTENT */}
      {/* ------------------------------------------------------------- */}
      {mode === 'connectors' && connComparison && (
        <div className="space-y-4">
          {/* Side-by-Side Images (if available) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Side 1 Image */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex flex-col gap-2">
              <span className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                <span>نمای سوکت اول: {connComparison.firstConnector.name}</span>
                <span className="text-[10px] text-zinc-400 font-mono">{connComparison.firstConnector.pinCount} پایه</span>
              </span>
              <div
                onClick={() => {
                  if (connComparison.firstConnector.realImageUrl) {
                    setActiveViewerImage({
                      url: connComparison.firstConnector.realImageUrl,
                      title: connComparison.firstConnector.name,
                      subtitle: connComparison.firstConnector.codeName
                    });
                  }
                }}
                className="h-40 bg-black rounded-xl border border-zinc-850 flex items-center justify-center cursor-pointer overflow-hidden group relative"
              >
                {connComparison.firstConnector.realImageUrl ? (
                  <>
                    <img
                      src={connComparison.firstConnector.realImageUrl}
                      alt={connComparison.firstConnector.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Maximize2 className="w-5 h-5 text-white" />
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-zinc-600">تصویر ثبت نشده است</span>
                )}
              </div>
            </div>

            {/* Side 2 Image */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex flex-col gap-2">
              <span className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                <span>نمای سوکت دوم: {connComparison.secondConnector.name}</span>
                <span className="text-[10px] text-zinc-400 font-mono">{connComparison.secondConnector.pinCount} پایه</span>
              </span>
              <div
                onClick={() => {
                  if (connComparison.secondConnector.realImageUrl) {
                    setActiveViewerImage({
                      url: connComparison.secondConnector.realImageUrl,
                      title: connComparison.secondConnector.name,
                      subtitle: connComparison.secondConnector.codeName
                    });
                  }
                }}
                className="h-40 bg-black rounded-xl border border-zinc-850 flex items-center justify-center cursor-pointer overflow-hidden group relative"
              >
                {connComparison.secondConnector.realImageUrl ? (
                  <>
                    <img
                      src={connComparison.secondConnector.realImageUrl}
                      alt={connComparison.secondConnector.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Maximize2 className="w-5 h-5 text-white" />
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-zinc-600">تصویر ثبت نشده است</span>
                )}
              </div>
            </div>
          </div>

          {/* Connectors Pins Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-3.5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs">
              <h4 className="font-bold text-zinc-200">جدول مقایسه پایه‌ها و عملکرد سیم‌ها</h4>
              <span className="text-[10px] text-zinc-400 font-mono">
                {filteredConnPinRows.length} پایه
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 font-bold">
                    <th className="py-2.5 px-3 w-16 text-center">پایه ۱</th>
                    <th className="py-2.5 px-3 w-1/4 text-red-400">عملکرد و سیم در سوکت اول</th>
                    <th className="py-2.5 px-3 w-16 text-center">پایه ۲</th>
                    <th className="py-2.5 px-3 w-1/4 text-amber-400">عملکرد و سیم در سوکت دوم</th>
                    <th className="py-2.5 px-3 w-28 text-center">نتیجه</th>
                    <th className="py-2.5 px-4">توضیحات فنی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {filteredConnPinRows.map(row => (
                    <tr
                      key={row.id}
                      className={`hover:bg-zinc-850/50 transition ${
                        row.outcome === 'different' ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        {row.firstPinNumber ? (
                          <span className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/40 inline-flex items-center justify-center font-mono font-bold">
                            {row.firstPinNumber}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-3">
                        {row.firstFunctionName ? (
                          <div>
                            <span className="font-bold text-zinc-200 block">{row.firstFunctionName}</span>
                            <span className="text-[10px] text-zinc-400">{row.firstWireColor}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-500">موجود نیست</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {row.secondPinNumber ? (
                          <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center justify-center font-mono font-bold">
                            {row.secondPinNumber}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-3">
                        {row.secondFunctionName ? (
                          <div>
                            <span className="font-bold text-zinc-200 block">{row.secondFunctionName}</span>
                            <span className="text-[10px] text-zinc-400">{row.secondWireColor}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-500">موجود نیست</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getOutcomeBadge(row.outcome)}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-zinc-400">
                        {row.technicalNote}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. FUSEBOX COMPARISON CONTENT */}
      {/* ------------------------------------------------------------- */}
      {mode === 'fuseboxes' && fuseBoxComparison && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <span className="text-[11px] text-zinc-400 block">فیوزهای کاملاً یکسان</span>
              <span className="text-base font-black text-emerald-400 font-mono mt-0.5">
                {fuseBoxComparison.identicalFusesCount} فیوز
              </span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <span className="text-[11px] text-zinc-400 block">تفاوت در مدار یا آمپراژ</span>
              <span className="text-base font-black text-amber-400 font-mono mt-0.5">
                {fuseBoxComparison.differentFusesCount} فیوز
              </span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <span className="text-[11px] text-zinc-400 block">تفاوت آمپراژ فیوزها</span>
              <span className="text-base font-black text-rose-400 font-mono mt-0.5">
                {fuseBoxComparison.differingAmpsCount} فیوز
              </span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <span className="text-[11px] text-zinc-400 block">رله‌های مشترک</span>
              <span className="text-base font-black text-sky-400 font-mono mt-0.5">
                {fuseBoxComparison.identicalRelaysCount} رله
              </span>
            </div>
          </div>

          {/* Fuses Comparison Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-3.5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs">
              <h4 className="font-bold text-zinc-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>جدول مقایسه فیوزها و مدارهای تحت حفاظت</span>
              </h4>
              <span className="text-[10px] text-zinc-400 font-mono">
                {filteredFuseRows.length} فیوز تطبیق‌یافته
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 font-bold">
                    <th className="py-2.5 px-3 w-28 text-center">فیوز جعبه اول</th>
                    <th className="py-2.5 px-3 w-1/4 text-red-400">عملکرد در {fuseBoxComparison.firstFuseBox.name}</th>
                    <th className="py-2.5 px-3 w-28 text-center">فیوز جعبه دوم</th>
                    <th className="py-2.5 px-3 w-1/4 text-amber-400">عملکرد در {fuseBoxComparison.secondFuseBox.name}</th>
                    <th className="py-2.5 px-3 w-28 text-center">نتیجه</th>
                    <th className="py-2.5 px-4">نکات و تحلیل فنی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {filteredFuseRows.map(row => {
                    const f1Color = row.firstRatingAmps ? getFuseColor(row.firstRatingAmps) : null;
                    const f2Color = row.secondRatingAmps ? getFuseColor(row.secondRatingAmps) : null;

                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-zinc-850/50 transition ${
                          row.outcome === 'different' ? 'bg-amber-950/10' : ''
                        }`}
                      >
                        {/* Side 1 Fuse Badge */}
                        <td className="py-3 px-3 text-center">
                          {row.firstCode && f1Color ? (
                            <div className="inline-flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                              <span className="font-mono font-bold text-white">{row.firstCode}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${f1Color.bg} ${f1Color.text} ${f1Color.border}`}
                              >
                                {row.firstRatingAmps}A
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {row.firstFunctionName ? (
                            <div>
                              <span className="font-bold text-zinc-200 block">{row.firstFunctionName}</span>
                              {row.firstCircuitDetails && (
                                <span className="text-[10px] text-zinc-400 mt-0.5 block line-clamp-1">{row.firstCircuitDetails}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-500">در این جعبه‌فیوز وجود ندارد</span>
                          )}
                        </td>

                        {/* Side 2 Fuse Badge */}
                        <td className="py-3 px-3 text-center">
                          {row.secondCode && f2Color ? (
                            <div className="inline-flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                              <span className="font-mono font-bold text-white">{row.secondCode}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${f2Color.bg} ${f2Color.text} ${f2Color.border}`}
                              >
                                {row.secondRatingAmps}A
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {row.secondFunctionName ? (
                            <div>
                              <span className="font-bold text-zinc-200 block">{row.secondFunctionName}</span>
                              {row.secondCircuitDetails && (
                                <span className="text-[10px] text-zinc-400 mt-0.5 block line-clamp-1">{row.secondCircuitDetails}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-500">در این جعبه‌فیوز وجود ندارد</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {getOutcomeBadge(row.outcome)}
                        </td>

                        <td className="py-3 px-4 text-[11px] text-zinc-400">
                          {row.technicalNote}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Relays Comparison Table */}
          {fuseBoxComparison.relayRows.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg mt-4">
              <div className="p-3.5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs">
                <h4 className="font-bold text-zinc-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>جدول مقایسه رله‌های نصب‌شده</span>
                </h4>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {fuseBoxComparison.relayRows.length} رله
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 font-bold">
                      <th className="py-2.5 px-3 w-1/4 text-red-400">رله در جعبه‌فیوز اول</th>
                      <th className="py-2.5 px-3 w-1/4 text-amber-400">رله در جعبه‌فیوز دوم</th>
                      <th className="py-2.5 px-3 w-28 text-center">وضعیت</th>
                      <th className="py-2.5 px-4">مشخصات و تحلیل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70">
                    {fuseBoxComparison.relayRows.map(row => (
                      <tr key={row.id} className="hover:bg-zinc-850/50 transition">
                        <td className="py-3 px-3">
                          {row.firstFunctionName ? (
                            <div>
                              <span className="font-bold text-zinc-200 block">{row.firstName || row.firstCode}</span>
                              <span className="text-[10px] text-zinc-400">{row.firstFunctionName} ({row.firstRating})</span>
                            </div>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-3">
                          {row.secondFunctionName ? (
                            <div>
                              <span className="font-bold text-zinc-200 block">{row.secondName || row.secondCode}</span>
                              <span className="text-[10px] text-zinc-400">{row.secondFunctionName} ({row.secondRating})</span>
                            </div>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {getOutcomeBadge(row.outcome)}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-zinc-400">
                          {row.technicalNote}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Search / Selection Modal */}
      {/* ------------------------------------------------------------- */}
      {pickerModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-red-500" />
                <span>
                  انتخاب {mode === 'vehicles' ? 'خودرو' : mode === 'ecus' ? 'ECU' : mode === 'connectors' ? 'سوکت' : 'جعبه‌فیوز'} برای طرف {pickerModal.side === 'first' ? 'اول (A)' : 'دوم (B)'}
                </span>
              </h3>
              <button
                onClick={() => setPickerModal({ isOpen: false, side: 'first' })}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-zinc-800 bg-zinc-900">
              <input
                type="text"
                autoFocus
                value={pickerSearchQuery}
                onChange={(e) => setPickerSearchQuery(e.target.value)}
                placeholder="جستجو با نام، مدل، کد فنی..."
                className="w-full bg-zinc-950 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="p-3 overflow-y-auto space-y-2 flex-1">
              {pickerCandidates.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  موردی یافت نشد.
                </div>
              ) : (
                pickerCandidates.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectCandidate(item)}
                    className="p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-red-400 transition">
                        {item.name || `${item.brand || ''} ${item.model || ''}`}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {item.persianName || item.codeName || item.locationFa || item.description || ''}
                      </p>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-red-400 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Printable Report Modal */}
      {/* ------------------------------------------------------------- */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Actions Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">پیش‌نمایش گزارش مقایسه فنی خودرو</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-950 transition active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>چاپ / ذخیره PDF</span>
                </button>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-zinc-100 bg-zinc-950 print:bg-white print:text-black font-sans text-xs">
              {/* Document Header */}
              <div className="border-b pb-4 border-zinc-800 print:border-zinc-300 flex items-center justify-between">
                <div>
                  <h1 className="text-base sm:text-lg font-black text-white print:text-black">
                    AutoPin Pro · گزارش مقایسه فنی و تطبیق سیستم الکتریکی
                  </h1>
                  <p className="text-[11px] text-zinc-400 print:text-zinc-600 mt-1">
                    سامانه تخصصی پیناوت، سیم‌کشی و نقشه‌های فنی برق خودرو
                  </p>
                </div>
                <div className="text-left font-mono text-[10px] text-zinc-400 print:text-zinc-600">
                  <span>تاریخ تنظیم: {new Date().toLocaleDateString('fa-IR')}</span>
                  <br />
                  <span>نوع مقایسه: {mode === 'vehicles' ? 'خودروها' : mode === 'ecus' ? 'کامپیوتر موتور (ECU)' : mode === 'connectors' ? 'سوکت‌ها' : 'جعبه‌فیوز'}</span>
                </div>
              </div>

              {/* Subject metadata */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-900 print:bg-zinc-100 border border-zinc-800 print:border-zinc-300">
                <div>
                  <span className="font-bold text-red-400 print:text-red-700 block">طرف اول (مورد A):</span>
                  <span className="font-bold text-sm block mt-0.5 print:text-black">
                    {mode === 'vehicles' && selectedVehicle1?.name}
                    {mode === 'ecus' && `${selectedEcu1?.brand} ${selectedEcu1?.model}`}
                    {mode === 'connectors' && selectedConn1?.name}
                    {mode === 'fuseboxes' && selectedFuseBox1?.name}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-amber-400 print:text-amber-700 block">طرف دوم (مورد B):</span>
                  <span className="font-bold text-sm block mt-0.5 print:text-black">
                    {mode === 'vehicles' && selectedVehicle2?.name}
                    {mode === 'ecus' && `${selectedEcu2?.brand} ${selectedEcu2?.model}`}
                    {mode === 'connectors' && selectedConn2?.name}
                    {mode === 'fuseboxes' && selectedFuseBox2?.name}
                  </span>
                </div>
              </div>

              {/* Printable Table */}
              <div className="border border-zinc-800 print:border-zinc-300 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-zinc-900 print:bg-zinc-200 border-b border-zinc-800 print:border-zinc-300 font-bold">
                    <tr>
                      <th className="p-2.5">عنوان پارامتر</th>
                      <th className="p-2.5">مشخصات در مورد اول (A)</th>
                      <th className="p-2.5">مشخصات در مورد دوم (B)</th>
                      <th className="p-2.5 text-center">وضعیت تطابق</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 print:divide-zinc-200">
                    {mode === 'vehicles' && vehicleComparison?.rows.map((r, i) => (
                      <tr key={i}>
                        <td className="p-2 font-bold">{r.label}</td>
                        <td className="p-2">{r.firstValue}</td>
                        <td className="p-2">{r.secondValue}</td>
                        <td className="p-2 text-center">{r.isIdentical ? 'مشترک' : 'متفاوت'}</td>
                      </tr>
                    ))}
                    {mode === 'ecus' && ecuComparison?.pinRows.slice(0, 30).map((r, i) => (
                      <tr key={i}>
                        <td className="p-2 font-mono">پایه {r.firstPinNumber || '—'} / {r.secondPinNumber || '—'}</td>
                        <td className="p-2">{r.firstFunctionName || 'ناموجود'} ({r.firstWireColor || ''})</td>
                        <td className="p-2">{r.secondFunctionName || 'ناموجود'} ({r.secondWireColor || ''})</td>
                        <td className="p-2 text-center font-bold">{r.outcome === 'identical' ? 'یکسان' : r.outcome === 'different' ? 'متفاوت' : 'بررسی'}</td>
                      </tr>
                    ))}
                    {mode === 'fuseboxes' && fuseBoxComparison?.fuseRows.slice(0, 30).map((r, i) => (
                      <tr key={i}>
                        <td className="p-2 font-mono">{r.firstCode || r.secondCode}</td>
                        <td className="p-2">{r.firstFunctionName ? `${r.firstFunctionName} (${r.firstRatingAmps}A)` : 'ناموجود'}</td>
                        <td className="p-2">{r.secondFunctionName ? `${r.secondFunctionName} (${r.secondRatingAmps}A)` : 'ناموجود'}</td>
                        <td className="p-2 text-center font-bold">{r.outcome === 'identical' ? 'یکسان' : 'متفاوت'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Engineering Disclaimer */}
              <div className="p-3 rounded-lg border border-zinc-800 print:border-zinc-300 text-[10px] text-zinc-400 print:text-zinc-600 leading-relaxed">
                <strong>یادداشت کارگاهی:</strong> این اطلاعات بر اساس نقشه‌های رسمی کارخانه سازنده و پایگاه داده تخصصی AutoPin Pro استخراج شده است. قبل از هرگونه سیم‌کشی، با ولت‌متر وضعیت پایه‌ها را کنترل کنید.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer for schematics/photos */}
      {activeViewerImage && (
        <ImageViewerModal
          isOpen={Boolean(activeViewerImage)}
          onClose={() => setActiveViewerImage(null)}
          imageUrl={activeViewerImage.url}
          title={activeViewerImage.title}
          subtitle={activeViewerImage.subtitle}
        />
      )}
    </div>
  );
};

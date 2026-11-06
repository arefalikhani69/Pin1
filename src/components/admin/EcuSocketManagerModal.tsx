import React, { useState, useMemo } from 'react';
import {
  X,
  Cpu,
  Plus,
  Edit2,
  Trash2,
  Grid,
  Save,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Info,
  Car,
  Layers,
  ArrowRight,
  ShieldAlert,
  Search,
  Filter,
  Eye,
  Activity,
  Zap,
  HelpCircle
} from 'lucide-react';
import { ECU, Connector, ConnectorPin, SignalType, PublicationStatus } from '../../types';
import { storage } from '../../services/storage';
import { onlineStorage } from '../../services/onlineStorage';
import { useAuth } from '../../context/AuthContext';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { MediaUploadModal } from '../MediaUploadModal';

interface EcuSocketManagerModalProps {
  isOpen: boolean;
  ecu: ECU;
  onClose: () => void;
  onDataChanged?: () => void;
}

export const DUTY_CATEGORIES = [
  'انژکتور و سوخت‌رسانی',
  'جرقه، کوئیل و احتراق',
  'سنسورهای موتور (مپ، اکسیژن، دما...)',
  'سنسورهای موقعیت (دور موتور، میل‌سوپاپ، سرعت)',
  'تغذیه، رله اصلی و رله دوبل (+12V)',
  'اتصال بدنه و ارت ECU (منفی)',
  'ولتاژ رفرنس سنسورها (+5V)',
  'عملگرها (دریچه گاز، فن، کنیستر، استپر)',
  'شبکه و ارتباط (CAN-Bus, K-Line, LIN)',
  'سایر و آزاد'
];

export const PULSE_TYPES = [
  'بدون پالس (ولتاژ پیوسته DC)',
  'پالس منفی انژکتور (تحریک با زمین - فرکانس متغیر)',
  'پالس منفی کوئیل (شارژ و دشارژ سیم‌پیچ اولیه)',
  'پالس مثبت ۱۲ ولت کوئیل ترانزیستوری',
  'پالس مربعی ۵ ولت سنسور اثر هال (Hall Effect)',
  'پالس متناوب سینوسی سنسور سلفی (VR Sensor)',
  'سیگنال مدولاسیون پهنای پالس (PWM)',
  'پالس فرکانسی سنسور سرعت خودرو (VSS)',
  'دیتاپکت دیجیتال شبکه CAN / K-Line'
];

export const EcuSocketManagerModal: React.FC<EcuSocketManagerModalProps> = ({
  isOpen,
  ecu,
  onClose,
  onDataChanged
}) => {
  const { isAdmin, isOnlineDbConnected, currentUser } = useAuth();
  const vehicles = storage.getVehicles();
  const parentVehicle = vehicles.find(v => v.id === ecu.vehicleId);

  // All connectors for this ECU
  const [connectors, setConnectors] = useState<Connector[]>(() => {
    return storage.getConnectors(undefined, undefined, false).filter(c => {
      return c.ecuId === ecu.id || (c.vehicleId === ecu.vehicleId && c.category === 'ecu');
    });
  });

  // Active sub-view: 'list' | 'edit-socket' | 'manage-pins'
  const [subView, setSubView] = useState<'list' | 'edit-socket' | 'manage-pins'>('list');
  const [currentSocket, setCurrentSocket] = useState<Partial<Connector> | null>(null);
  const [pinsList, setPinsList] = useState<ConnectorPin[]>([]);

  // Selected Pin for detailed inspection
  const [selectedInspectPin, setSelectedInspectPin] = useState<ConnectorPin | null>(null);

  // Pin filter and search in Pinout view
  const [pinSearchQuery, setPinSearchQuery] = useState('');
  const [pinDutyFilter, setPinDutyFilter] = useState('all');

  // Pin editing state
  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [pinNumber, setPinNumber] = useState('');
  const [pinName, setPinName] = useState('');
  const [pinRow, setPinRow] = useState<number>(1);
  const [pinCol, setPinCol] = useState<number>(1);
  const [pinDutyCategory, setPinDutyCategory] = useState(DUTY_CATEGORIES[0]);
  const [pinFunctionName, setPinFunctionName] = useState('');
  const [pinSignalType, setPinSignalType] = useState<SignalType>('PWM_PULSE');
  const [pinPulseType, setPinPulseType] = useState(PULSE_TYPES[1]);
  const [pinWireColor, setPinWireColor] = useState('سفید');
  const [pinWireHex, setPinWireHex] = useState('#ffffff');
  const [pinWireStripeHex, setPinWireStripeHex] = useState('');
  const [pinVoltageRange, setPinVoltageRange] = useState('');
  const [pinTestGuide, setPinTestGuide] = useState('');
  const [pinNotes, setPinNotes] = useState('');

  // Alerts & Confirmations
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'warn'; text: string } | null>(null);
  const [deletingSocket, setDeletingSocket] = useState<Connector | null>(null);
  const [deletingPin, setDeletingPin] = useState<ConnectorPin | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Resize warning state
  const [resizeWarning, setResizeWarning] = useState<string | null>(null);

  const refreshConnectors = () => {
    const list = storage.getConnectors(undefined, undefined, false).filter(c => {
      return c.ecuId === ecu.id || (c.vehicleId === ecu.vehicleId && c.category === 'ecu');
    });
    setConnectors(list);
    onDataChanged?.();
  };

  const showBanner = (text: string, type: 'success' | 'warn' = 'success') => {
    setBannerMessage({ type, text });
    setTimeout(() => {
      setBannerMessage(null);
    }, 4500);
  };

  // -------------------------------------------------------------
  // Socket Create / Edit Logic
  // -------------------------------------------------------------
  const handleStartCreateSocket = () => {
    const defaultRows = 4;
    const defaultCols = 8;
    setCurrentSocket({
      id: `conn-${Date.now()}`,
      ecuId: ecu.id,
      vehicleId: ecu.vehicleId,
      category: 'ecu',
      name: '',
      codeName: '',
      shape: 'grid',
      rows: defaultRows,
      cols: defaultCols,
      pinCount: defaultRows * defaultCols,
      socketColor: 'خاکستری',
      socketColorHex: '#71717a',
      notes: '',
      status: 'published',
      pins: []
    });
    setPinsList([]);
    setSelectedInspectPin(null);
    setResizeWarning(null);
    setSubView('edit-socket');
  };

  const handleStartEditSocket = (socket: Connector) => {
    setCurrentSocket({ ...socket });
    setPinsList(socket.pins ? [...socket.pins] : []);
    setSelectedInspectPin(null);
    setResizeWarning(null);
    setSubView('edit-socket');
  };

  const handleOpenPinManager = (socket: Connector) => {
    setCurrentSocket({ ...socket });
    const pins = socket.pins ? [...socket.pins] : [];
    setPinsList(pins);
    setSelectedInspectPin(pins[0] || null);
    handleResetPinForm();
    setPinSearchQuery('');
    setPinDutyFilter('all');
    setSubView('manage-pins');
  };

  const handleRowsChange = (valStr: string) => {
    if (!currentSocket) return;
    const newRows = parseInt(valStr, 10) || 1;
    const safeRows = Math.max(1, Math.min(16, newRows));
    const currentCols = currentSocket.cols || 8;

    // Check if any existing pins exceed new row bound
    const outOfBounds = pinsList.filter(p => (p.row && p.row > safeRows));
    if (outOfBounds.length > 0) {
      setResizeWarning(
        `هشدار تغییر ساختار: تعداد ${outOfBounds.length} پایه از قبل ثبت‌شده (مانند پایه‌های ${outOfBounds.map(p => p.pinNumber).slice(0, 5).join('، ')}) دارای شماره ردیف بیشتر از ${safeRows} هستند. این اطلاعات به هیچ‌وجه حذف نخواهند شد و در سیستم محفوظ می‌مانند.`
      );
    } else {
      setResizeWarning(null);
    }

    setCurrentSocket({
      ...currentSocket,
      rows: safeRows,
      pinCount: safeRows * currentCols
    });
  };

  const handleColsChange = (valStr: string) => {
    if (!currentSocket) return;
    const newCols = parseInt(valStr, 10) || 1;
    const safeCols = Math.max(1, Math.min(32, newCols));
    const currentRows = currentSocket.rows || 4;

    // Check if any existing pins exceed new col bound
    const outOfBounds = pinsList.filter(p => (p.col && p.col > safeCols));
    if (outOfBounds.length > 0) {
      setResizeWarning(
        `هشدار تغییر ساختار: تعداد ${outOfBounds.length} پایه (مانند پایه‌های ${outOfBounds.map(p => p.pinNumber).slice(0, 5).join('، ')}) دارای شماره ستون بیشتر از ${safeCols} هستند. اطلاعات این پایه‌ها بدون حذف در سیستم حفظ خواهد شد.`
      );
    } else {
      setResizeWarning(null);
    }

    setCurrentSocket({
      ...currentSocket,
      cols: safeCols,
      pinCount: currentRows * safeCols
    });
  };

  const handleSaveSocket = async () => {
    if (!currentSocket?.name?.trim()) {
      alert('لطفاً عنوان سوکت (مانند سوکت ۳۲ پایه مشکی موتور) را وارد کنید.');
      return;
    }

    const rows = Number(currentSocket.rows) || 4;
    const cols = Number(currentSocket.cols) || 8;

    const fullConnector: Connector = {
      id: currentSocket.id || `conn-${Date.now()}`,
      ecuId: ecu.id,
      vehicleId: ecu.vehicleId,
      category: 'ecu',
      name: currentSocket.name.trim(),
      codeName: currentSocket.codeName?.trim() || `${rows * cols}P`,
      shape: 'grid',
      rows,
      cols,
      pinCount: rows * cols,
      socketColor: currentSocket.socketColor?.trim() || 'مشکی',
      socketColorHex: currentSocket.socketColorHex || '#18181b',
      realImageUrl: currentSocket.realImageUrl || undefined,
      notes: currentSocket.notes?.trim() || undefined,
      status: (currentSocket.status as PublicationStatus) || 'published',
      source: 'AutoPin Pro ECU Workshop',
      pins: pinsList,
      createdAt: currentSocket.createdAt || Date.now()
    };

    storage.saveConnector(fullConnector, {
      uid: currentUser?.uid,
      email: currentUser?.email || 'admin@autopin.ir'
    });

    if (isAdmin && isOnlineDbConnected) {
      try {
        await onlineStorage.saveConnector(fullConnector);
      } catch (err) {
        console.warn('Online sync error for connector:', err);
      }
    }

    refreshConnectors();
    showBanner(`سوکت «${fullConnector.name}» با موفقیت ذخیره شد.`);
    setSubView('list');
    setCurrentSocket(null);
  };

  const handleDeleteSocketConfirmed = async () => {
    if (!deletingSocket) return;
    storage.deleteConnector(deletingSocket.id, {
      uid: currentUser?.uid,
      email: currentUser?.email || 'admin@autopin.ir'
    });

    if (isAdmin && isOnlineDbConnected) {
      try {
        await onlineStorage.deleteConnector(deletingSocket.id);
      } catch (err) {
        console.warn('Online delete error for connector:', err);
      }
    }

    setDeletingSocket(null);
    refreshConnectors();
    showBanner('سوکت و تمام پایه‌های وابسته به آن با موفقیت حذف گردیدند.');
  };

  // -------------------------------------------------------------
  // Pin Management Logic
  // -------------------------------------------------------------
  const handleResetPinForm = () => {
    setEditingPinId(null);
    setPinNumber('');
    setPinName('');
    setPinRow(1);
    setPinCol(1);
    setPinDutyCategory(DUTY_CATEGORIES[0]);
    setPinFunctionName('');
    setPinSignalType('PWM_PULSE');
    setPinPulseType(PULSE_TYPES[1]);
    setPinWireColor('سفید');
    setPinWireHex('#ffffff');
    setPinWireStripeHex('');
    setPinVoltageRange('');
    setPinTestGuide('');
    setPinNotes('');
  };

  const handleStartEditPin = (pin: ConnectorPin) => {
    setEditingPinId(pin.id);
    setPinNumber(pin.pinNumber);
    setPinName(pin.pinName || '');
    setPinRow(pin.row ?? 1);
    setPinCol(pin.col ?? 1);
    setPinDutyCategory(pin.dutyCategory || DUTY_CATEGORIES[0]);
    setPinFunctionName(pin.functionName);
    setPinSignalType(pin.signalType);
    setPinPulseType(pin.pulseType || (pin.signalType === 'PWM_PULSE' ? PULSE_TYPES[1] : PULSE_TYPES[0]));
    setPinWireColor(pin.wireColor);
    setPinWireHex(pin.wireHex || '#ffffff');
    setPinWireStripeHex(pin.wireStripeHex || '');
    setPinVoltageRange(pin.voltageRange || '');
    setPinTestGuide(pin.testGuide || '');
    setPinNotes(pin.notes || '');
    setSelectedInspectPin(pin);
  };

  const handleSavePin = async () => {
    if (!pinNumber.trim()) {
      alert('شماره یا شناسه خانه پایه الزامی است.');
      return;
    }
    if (!pinFunctionName.trim()) {
      alert('شرح عملکرد یا وظیفه پایه الزامی است.');
      return;
    }

    const newPin: ConnectorPin = {
      id: editingPinId || `pin-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      connectorId: currentSocket?.id || `conn-${ecu.id}`,
      pinNumber: pinNumber.trim(),
      pinName: pinName.trim() || undefined,
      row: pinRow,
      col: pinCol,
      dutyCategory: pinDutyCategory,
      functionName: pinFunctionName.trim(),
      signalType: pinSignalType,
      pulseType: pinPulseType,
      wireColor: pinWireColor.trim() || 'نامشخص',
      wireHex: pinWireHex,
      wireStripeHex: pinWireStripeHex.trim() || undefined,
      voltageRange: pinVoltageRange.trim() || '12V',
      testGuide: pinTestGuide.trim() || undefined,
      notes: pinNotes.trim() || undefined
    };

    let updatedPins: ConnectorPin[];
    if (editingPinId) {
      updatedPins = pinsList.map(p => (p.id === editingPinId ? newPin : p));
    } else {
      // Check duplicate pin number
      const existing = pinsList.find(p => p.pinNumber.toLowerCase() === newPin.pinNumber.toLowerCase());
      if (existing) {
        if (!confirm(`پایه‌ای با شماره «${newPin.pinNumber}» از قبل وجود دارد. آیا می‌خواهید اطلاعات آن بازنویسی شود؟`)) {
          return;
        }
        updatedPins = pinsList.map(p => (p.id === existing.id ? { ...newPin, id: existing.id } : p));
      } else {
        updatedPins = [...pinsList, newPin];
      }
    }

    setPinsList(updatedPins);
    setSelectedInspectPin(newPin);

    // Auto-persist immediately to connector storage
    if (currentSocket && currentSocket.id) {
      const fullConn: Connector = {
        id: currentSocket.id,
        ecuId: ecu.id,
        vehicleId: ecu.vehicleId,
        category: 'ecu',
        name: currentSocket.name || 'سوکت ECU',
        codeName: currentSocket.codeName || '',
        shape: 'grid',
        rows: currentSocket.rows || 4,
        cols: currentSocket.cols || 8,
        pinCount: (currentSocket.rows || 4) * (currentSocket.cols || 8),
        socketColor: currentSocket.socketColor || 'خاکستری',
        socketColorHex: currentSocket.socketColorHex || '#71717a',
        realImageUrl: currentSocket.realImageUrl,
        notes: currentSocket.notes,
        status: (currentSocket.status as PublicationStatus) || 'published',
        source: 'AutoPin Pro ECU Workshop',
        pins: updatedPins,
        createdAt: currentSocket.createdAt || Date.now()
      };

      storage.saveConnector(fullConn, {
        uid: currentUser?.uid,
        email: currentUser?.email || 'admin@autopin.ir'
      });

      if (isAdmin && isOnlineDbConnected) {
        try {
          await onlineStorage.saveConnector(fullConn);
        } catch (err) {
          console.warn('Online sync error for connector pin save:', err);
        }
      }
    }

    handleResetPinForm();
    refreshConnectors();
    showBanner(`پایه «${newPin.pinNumber}» با موفقیت در سوکت ثبت گردید.`);
  };

  const handleDeletePinConfirmed = async () => {
    if (!deletingPin) return;
    const updatedPins = pinsList.filter(p => p.id !== deletingPin.id);
    setPinsList(updatedPins);

    if (currentSocket && currentSocket.id) {
      const fullConn: Connector = {
        id: currentSocket.id,
        ecuId: ecu.id,
        vehicleId: ecu.vehicleId,
        category: 'ecu',
        name: currentSocket.name || 'سوکت ECU',
        codeName: currentSocket.codeName || '',
        shape: 'grid',
        rows: currentSocket.rows || 4,
        cols: currentSocket.cols || 8,
        pinCount: (currentSocket.rows || 4) * (currentSocket.cols || 8),
        socketColor: currentSocket.socketColor || 'خاکستری',
        socketColorHex: currentSocket.socketColorHex || '#71717a',
        realImageUrl: currentSocket.realImageUrl,
        notes: currentSocket.notes,
        status: (currentSocket.status as PublicationStatus) || 'published',
        source: 'AutoPin Pro ECU Workshop',
        pins: updatedPins,
        createdAt: currentSocket.createdAt || Date.now()
      };

      storage.saveConnector(fullConn, {
        uid: currentUser?.uid,
        email: currentUser?.email || 'admin@autopin.ir'
      });
    }

    if (selectedInspectPin?.id === deletingPin.id) {
      setSelectedInspectPin(updatedPins[0] || null);
    }

    setDeletingPin(null);
    if (editingPinId === deletingPin.id) {
      handleResetPinForm();
    }
    refreshConnectors();
    showBanner(`پایه «${deletingPin.pinNumber}» با موفقیت از سوکت حذف گردید.`);
  };

  // Filtered pins for search and duty category
  const filteredPins = useMemo(() => {
    return pinsList.filter(p => {
      const matchesSearch =
        p.pinNumber.toLowerCase().includes(pinSearchQuery.toLowerCase()) ||
        (p.pinName && p.pinName.toLowerCase().includes(pinSearchQuery.toLowerCase())) ||
        p.functionName.toLowerCase().includes(pinSearchQuery.toLowerCase()) ||
        p.wireColor.toLowerCase().includes(pinSearchQuery.toLowerCase()) ||
        (p.pulseType && p.pulseType.toLowerCase().includes(pinSearchQuery.toLowerCase()));

      const matchesDuty = pinDutyFilter === 'all' || p.dutyCategory === pinDutyFilter;
      return matchesSearch && matchesDuty;
    });
  }, [pinsList, pinSearchQuery, pinDutyFilter]);

  // Helper to get signal color and badge
  const getSignalBadge = (sig: SignalType) => {
    switch (sig) {
      case '12V_BAT':
        return <span className="text-red-400 bg-red-950/70 border border-red-800 px-2 py-0.5 rounded text-[10px] font-bold">+12V دائم باتری</span>;
      case '12V_IGN':
        return <span className="text-orange-400 bg-orange-950/70 border border-orange-800 px-2 py-0.5 rounded text-[10px] font-bold">+12V سوئیچ</span>;
      case '5V_REF':
        return <span className="text-amber-300 bg-amber-950/70 border border-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">+5V رفرنس سنسور</span>;
      case 'GROUND':
        return <span className="text-zinc-300 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-[10px] font-bold">اتصال بدنه / منفی</span>;
      case 'PWM_PULSE':
        return <span className="text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">سیگنال و پالس (PWM)</span>;
      case 'ANALOG_IN':
        return <span className="text-sky-400 bg-sky-950/70 border border-sky-800 px-2 py-0.5 rounded text-[10px] font-bold">ورودی آنالوگ سنسور</span>;
      case 'CAN_BUS':
        return <span className="text-purple-400 bg-purple-950/70 border border-purple-800 px-2 py-0.5 rounded text-[10px] font-bold">شبکه CAN (کن‌باس)</span>;
      case 'K_LINE':
        return <span className="text-fuchsia-400 bg-fuchsia-950/70 border border-fuchsia-800 px-2 py-0.5 rounded text-[10px] font-bold">خط دیاگ K-Line</span>;
      default:
        return <span className="text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px]">آزاد (NC)</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl p-4 sm:p-6 text-right overflow-hidden flex flex-col max-h-[94vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  مدیریت سوکت‌ها و پین‌اوت ECU: {ecu.brand} {ecu.model}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                  {parentVehicle?.name || 'عمومی'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                تعریف سوکت‌های مستقل، ماتریس سطر و ستونی، پایه‌ها، تفکیک رنگ سیم و مشخصات سیگنال و پالس
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Banner */}
        {bannerMessage && (
          <div
            className={`my-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shrink-0 ${
              bannerMessage.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                : 'bg-amber-950/80 border border-amber-800 text-amber-300'
            }`}
          >
            {bannerMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-2 space-y-4">
          {/* ========================================================= */}
          {/* VIEW 1: SOCKETS LIST FOR THIS ECU                         */}
          {/* ========================================================= */}
          {subView === 'list' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-200">
                    سوکت‌های تعریف‌شده برای این کامپیوتر ({connectors.length} سوکت)
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    هر کامپیوتر ECU می‌تواند چندین سوکت مستقل با ابعاد و پایه‌های مجزا داشته باشد.
                  </p>
                </div>
                <button
                  onClick={handleStartCreateSocket}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl active:scale-95 transition shadow-sm shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن سوکت جدید برای این ECU</span>
                </button>
              </div>

              {connectors.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400">
                  <Grid className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                  <h4 className="text-xs sm:text-sm font-bold text-white mb-1">
                    هنوز هیچ سوکتی برای این ECU تعریف نشده است
                  </h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
                    با کلیک روی دکمه بالا، نخستین سوکت این کامپیوتر (با مشخص کردن سطرها و ستون‌ها) را ایجاد کنید.
                  </p>
                  <button
                    onClick={handleStartCreateSocket}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ایجاد سوکت اول</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {connectors.map(socket => {
                    const rows = socket.rows || 4;
                    const cols = socket.cols || 8;
                    const pulseCount = socket.pins.filter(p => p.signalType === 'PWM_PULSE').length;

                    return (
                      <div
                        key={socket.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-zinc-700 transition"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-13 h-13 rounded-xl flex flex-col items-center justify-center border shrink-0 font-bold shadow-inner"
                            style={{
                              backgroundColor: '#18181b',
                              borderColor: socket.socketColorHex || '#71717a'
                            }}
                          >
                            <span className="text-xs font-mono text-white font-bold">{socket.pins.length}P</span>
                            <span className="text-[9px] text-zinc-400 font-mono">{rows}×{cols}</span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                                {socket.name}
                              </h5>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                                {socket.socketColor || 'خاکستری'}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 truncate mt-0.5">
                              {socket.codeName}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-zinc-500">
                              <span className="font-mono text-zinc-300">ماتریس: {rows}×{cols} ({rows * cols} ظرفیت)</span>
                              <span>·</span>
                              <span className="text-emerald-400 font-medium">{pulseCount} پایه سیگنال و پالس</span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                          <button
                            onClick={() => handleOpenPinManager(socket)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-xs font-bold text-white rounded-xl transition border border-zinc-700/70"
                          >
                            <Grid className="w-3.5 h-3.5 text-emerald-400" />
                            <span>جدول پین‌اوت و چیدمان پایه‌ها ({socket.pins.length})</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEditSocket(socket)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                              title="ویرایش مشخصات و ابعاد سوکت"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingSocket(socket)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-red-400 transition"
                              title="حذف سوکت"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 2: CREATE / EDIT SOCKET DETAILS & MATRIX SIZES       */}
          {/* ========================================================= */}
          {subView === 'edit-socket' && currentSocket && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSubView('list');
                      setCurrentSocket(null);
                      setResizeWarning(null);
                    }}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    {currentSocket.id && connectors.some(c => c.id === currentSocket.id)
                      ? 'ویرایش مشخصات و ابعاد سوکت ECU'
                      : 'ثبت سوکت جدید برای این ECU'}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSubView('list');
                      setCurrentSocket(null);
                      setResizeWarning(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleSaveSocket}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>ذخیره مشخصات سوکت</span>
                  </button>
                </div>
              </div>

              {/* Resize Out of Bounds Warning Banner */}
              {resizeWarning && (
                <div className="p-3.5 rounded-xl bg-amber-950/70 border border-amber-700 text-amber-200 text-xs flex items-start gap-2.5 shadow-md">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1">هشدار تغییر ابعاد ماتریس:</span>
                    <p className="leading-relaxed">{resizeWarning}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">نام سوکت (الزامی):</label>
                  <input
                    type="text"
                    value={currentSocket.name || ''}
                    onChange={(e) => setCurrentSocket({ ...currentSocket, name: e.target.value })}
                    placeholder="مثلاً: سوکت ۳۲ پایه مشکی (موتور)"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">عنوان / کد فنی سوکت:</label>
                  <input
                    type="text"
                    value={currentSocket.codeName || ''}
                    onChange={(e) => setCurrentSocket({ ...currentSocket, codeName: e.target.value })}
                    placeholder="مثلاً: 32V NR - خطوط سنسورها و انژکتورها"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Rows and Cols Matrix Config */}
                <div className="sm:col-span-2 bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-zinc-300 font-bold block">
                      پیکربندی ماتریس سطر و ستون (جدول پین‌اوت):
                    </label>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-lg">
                      ظرفیت کل: {((currentSocket.rows || 4) * (currentSocket.cols || 8))} پایه
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2">
                      <span className="text-zinc-400 font-semibold">تعداد ردیف (Rows):</span>
                      <input
                        type="number"
                        min={1}
                        max={16}
                        value={currentSocket.rows ?? 4}
                        onChange={(e) => handleRowsChange(e.target.value)}
                        className="w-14 bg-zinc-950 text-white font-bold text-center border border-zinc-800 rounded-lg py-1 text-xs focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <span className="text-zinc-500 font-bold text-base">×</span>

                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2">
                      <span className="text-zinc-400 font-semibold">تعداد ستون (Columns):</span>
                      <input
                        type="number"
                        min={1}
                        max={32}
                        value={currentSocket.cols ?? 8}
                        onChange={(e) => handleColsChange(e.target.value)}
                        className="w-14 bg-zinc-950 text-white font-bold text-center border border-zinc-800 rounded-lg py-1 text-xs focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <span className="text-[11px] text-zinc-500 mr-2">
                      (چیدمان ماتریس پایه‌ها به صورت خودکار با این سطر و ستون ساخته خواهد شد)
                    </span>
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">رنگ پوسته سوکت:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={currentSocket.socketColor || ''}
                      onChange={(e) => setCurrentSocket({ ...currentSocket, socketColor: e.target.value })}
                      placeholder="مشکی، خاکستری، قهوه‌ای..."
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    />
                    <input
                      type="color"
                      value={currentSocket.socketColorHex || '#71717a'}
                      onChange={(e) => setCurrentSocket({ ...currentSocket, socketColorHex: e.target.value })}
                      className="w-10 h-9 bg-zinc-950 border border-zinc-800 rounded-xl p-1 cursor-pointer shrink-0"
                    />
                  </div>
                </div>

                {/* Publication Status */}
                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">وضعیت انتشار:</label>
                  <select
                    value={currentSocket.status || 'published'}
                    onChange={(e) => setCurrentSocket({ ...currentSocket, status: e.target.value as PublicationStatus })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="published">منتشرشده (قابل مشاهده برای همه کاربران)</option>
                    <option value="verified">تأییدشده آزمایشگاهی</option>
                    <option value="draft">پیش‌نویس (فقط برای مدیر)</option>
                    <option value="pending">در انتظار بررسی</option>
                  </select>
                </div>

                {/* Image & Description */}
                <div className="sm:col-span-2">
                  <label className="text-zinc-400 block mb-1 font-semibold">توضیحات و یادداشت فنی سوکت:</label>
                  <textarea
                    value={currentSocket.notes || ''}
                    onChange={(e) => setCurrentSocket({ ...currentSocket, notes: e.target.value })}
                    rows={2}
                    placeholder="نکات مربوط به نحوه بازکردن ضامن سوکت، پایه‌های تغذیه اصلی یا مسیرهای دسته‌سیم..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block">تصویر نمای سوکت:</label>
                    <p className="text-[11px] text-zinc-500">
                      {currentSocket.realImageUrl
                        ? 'تصویر به این سوکت ضمیمه شده است.'
                        : 'می‌توانید تصویر شماتیک یا عکاسی واقعی سوکت را اضافه کنید.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMediaModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-xl transition"
                  >
                    <ImageIcon className="w-4 h-4 text-red-400" />
                    <span>{currentSocket.realImageUrl ? 'تغییر تصویر' : 'انتخاب تصویر'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 3: MANAGE PINS & INTERACTIVE MATRIX GRID             */}
          {/* ========================================================= */}
          {subView === 'manage-pins' && currentSocket && (
            <div className="space-y-4">
              {/* Sub-header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSubView('list');
                      handleResetPinForm();
                    }}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
                    title="بازگشت به فهرست سوکت‌ها"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <span>جدول پین‌اوت و چیدمان: {currentSocket.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono">
                        {currentSocket.codeName}
                      </span>
                    </h4>
                    <span className="text-[11px] text-zinc-400">
                      ماتریس {currentSocket.rows} سطر × {currentSocket.cols} ستون ({pinsList.length} پایه ثبت‌شده از {((currentSocket.rows || 4) * (currentSocket.cols || 8))} خانه)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetPinForm}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-sm transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ثبت پایه جدید</span>
                  </button>
                </div>
              </div>

              {/* DYNAMIC INTERACTIVE MATRIX GRID */}
              <div className="bg-zinc-900 p-3 sm:p-4 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-red-500" />
                    <span className="font-bold text-white">
                      ماتریس بصری خانه‌های سوکت ({currentSocket.rows} ردیف × {currentSocket.cols} ستون)
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    لمس هر خانه: مشاهده کامل مشخصات، تفکیک رنگ سیم یا ویرایش
                  </span>
                </div>

                {/* Matrix Layout with horizontal scroll on mobile */}
                <div className="overflow-x-auto pb-2 border border-zinc-850 rounded-2xl bg-zinc-950 p-3">
                  {/* Column Header Indices */}
                  <div
                    className="grid gap-1.5 min-w-max mb-1 text-center font-mono text-[10px] text-zinc-500"
                    style={{
                      gridTemplateColumns: `36px repeat(${currentSocket.cols || 8}, minmax(44px, 1fr))`
                    }}
                  >
                    <span className="text-zinc-650">ردیف</span>
                    {Array.from({ length: currentSocket.cols || 8 }).map((_, cIdx) => (
                      <span key={`col-hdr-${cIdx + 1}`}>ست {cIdx + 1}</span>
                    ))}
                  </div>

                  {/* Rows with Row Header Label */}
                  {Array.from({ length: currentSocket.rows || 4 }).map((_, rIdx) => {
                    const rowNumber = rIdx + 1;
                    const rowLetter = String.fromCharCode(65 + rIdx);

                    return (
                      <div
                        key={`row-wrap-${rowNumber}`}
                        className="grid gap-1.5 min-w-max mb-1.5 items-center"
                        style={{
                          gridTemplateColumns: `36px repeat(${currentSocket.cols || 8}, minmax(44px, 1fr))`
                        }}
                      >
                        {/* Row letter/number header */}
                        <div className="w-8 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-400">
                          {rowLetter}
                        </div>

                        {/* Cell buttons in this row */}
                        {Array.from({ length: currentSocket.cols || 8 }).map((_, cIdx) => {
                          const colNumber = cIdx + 1;
                          const existingPin = pinsList.find(p => p.row === rowNumber && p.col === colNumber);
                          const isSelected = selectedInspectPin?.id === existingPin?.id;

                          const isPulse = existingPin?.signalType === 'PWM_PULSE';
                          const isBat = existingPin?.signalType === '12V_BAT' || existingPin?.signalType === '12V_IGN';
                          const isGnd = existingPin?.signalType === 'GROUND';
                          const is5V = existingPin?.signalType === '5V_REF';
                          const isAnalog = existingPin?.signalType === 'ANALOG_IN';

                          return (
                            <button
                              key={`cell-${rowNumber}-${colNumber}`}
                              type="button"
                              onClick={() => {
                                if (existingPin) {
                                  setSelectedInspectPin(existingPin);
                                } else {
                                  handleResetPinForm();
                                  setPinRow(rowNumber);
                                  setPinCol(colNumber);
                                  setPinNumber(`${rowLetter}${colNumber}`);
                                }
                              }}
                              className={`relative h-12 w-11 sm:w-12 rounded-xl border flex flex-col items-center justify-between p-1 transition active:scale-95 ${
                                existingPin
                                  ? isSelected
                                    ? 'bg-zinc-800 border-red-500 ring-2 ring-red-500/80 shadow-md z-10'
                                    : 'bg-zinc-900 border-zinc-750 hover:border-zinc-500'
                                  : 'bg-zinc-950/60 border-zinc-850 hover:bg-zinc-900/80 text-zinc-650 hover:text-zinc-400 border-dashed'
                              }`}
                              title={
                                existingPin
                                  ? `پایه ${existingPin.pinNumber} (ردیف ${rowNumber}، ستون ${colNumber}): ${existingPin.functionName}`
                                  : `ردیف ${rowNumber} (${rowLetter})، ستون ${colNumber} (خالی)`
                              }
                            >
                              {existingPin ? (
                                <>
                                  {/* Pin Number */}
                                  <span className="text-[11px] font-mono font-bold text-white leading-none">
                                    {existingPin.pinNumber}
                                  </span>

                                  {/* Pin name tag if present */}
                                  {existingPin.pinName ? (
                                    <span className="text-[8px] font-mono text-zinc-400 truncate max-w-full leading-none">
                                      {existingPin.pinName}
                                    </span>
                                  ) : (
                                    <span className="text-[8px] font-mono text-zinc-500 leading-none">
                                      {rowLetter}{colNumber}
                                    </span>
                                  )}

                                  {/* Physical Wire Color Indicator (Realistic 2-Color Wire) */}
                                  <div
                                    className="relative w-7 h-1.5 rounded-full overflow-hidden border border-zinc-700 shrink-0"
                                    title={`رنگ فیزیکی سیم: ${existingPin.wireColor}`}
                                  >
                                    <div
                                      className="absolute inset-0"
                                      style={{ backgroundColor: existingPin.wireHex || '#ffffff' }}
                                    />
                                    {existingPin.wireStripeHex && (
                                      <div
                                        className="absolute top-0 bottom-0 left-1 w-1.5"
                                        style={{ backgroundColor: existingPin.wireStripeHex }}
                                      />
                                    )}
                                  </div>

                                  {/* Signal Dot (Distinct from Wire Color) */}
                                  {isPulse && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-zinc-950" title="سیگنال و پالس" />
                                  )}
                                  {isBat && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 ring-1 ring-zinc-950" title="+12V تغذیه" />
                                  )}
                                  {isGnd && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-zinc-400 ring-1 ring-zinc-950" title="اتصال بدنه" />
                                  )}
                                  {is5V && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-zinc-950" title="+5V رفرنس" />
                                  )}
                                  {isAnalog && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sky-400 ring-1 ring-zinc-950" title="ورودی آنالوگ" />
                                  )}
                                </>
                              ) : (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-650 group-hover:text-zinc-400">
                                  <span className="text-[9px] font-mono">{rowLetter}{colNumber}</span>
                                  <Plus className="w-2.5 h-2.5 mt-0.5 opacity-60" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Legend: Explicit distinction between Electrical Signal vs Physical Wire Color */}
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-300">
                    <Info className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>راهنمای تفکیک نشانگرهای الکتریکی از رنگ واقعی سیم:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-1 ring-zinc-900 shrink-0" />
                      <span>نشانگر پالس / PWM (خروجی)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-1 ring-zinc-900 shrink-0" />
                      <span>نشانگر +12V دائم یا سوئیچ</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-1 ring-zinc-900 shrink-0" />
                      <span>نشانگر +5V رفرنس سنسور</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 ring-1 ring-zinc-900 shrink-0" />
                      <span>نشانگر اتصال بدنه / منفی</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-850 text-zinc-400">
                    <span className="w-6 h-2 rounded-full border border-zinc-700 bg-white relative overflow-hidden shrink-0">
                      <span className="absolute top-0 bottom-0 left-1 w-1.5 bg-red-500" />
                    </span>
                    <span className="text-[10px]">
                      مستطیل افقی داخل خانه = <strong>رنگ واقعی روکش فیزیکی سیم در خودرو</strong> (مجزا از نوع سیگنال)
                    </span>
                  </div>
                </div>
              </div>

              {/* SELECTED PIN TECHNICAL INSPECTOR CARD */}
              {selectedInspectPin && (
                <div className="bg-gradient-to-l from-zinc-900 via-zinc-900 to-zinc-950 border border-red-900/40 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-white font-mono font-black text-sm">
                        {selectedInspectPin.pinNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            {selectedInspectPin.functionName}
                          </h4>
                          {selectedInspectPin.pinName && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                              کد: {selectedInspectPin.pinName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          موقعیت در ماتریس: ردیف {selectedInspectPin.row} ({String.fromCharCode(64 + (selectedInspectPin.row || 1))}) · ستون {selectedInspectPin.col}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartEditPin(selectedInspectPin)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 rounded-xl transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>ویرایش اطلاعات پایه</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingPin(selectedInspectPin)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-red-950 text-xs font-bold text-red-400 rounded-xl transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف پایه</span>
                      </button>
                    </div>
                  </div>

                  {/* Inspector details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {/* Signal & Pulse */}
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                      <span className="text-[11px] text-zinc-500 block font-semibold">نوع سیگنال الکتریکی:</span>
                      {getSignalBadge(selectedInspectPin.signalType)}
                      {selectedInspectPin.pulseType && (
                        <div className="mt-1.5 pt-1.5 border-t border-zinc-850">
                          <span className="text-[10px] text-zinc-500 block">مشخصات پالس:</span>
                          <span className="text-xs text-emerald-400 font-semibold">{selectedInspectPin.pulseType}</span>
                        </div>
                      )}
                    </div>

                    {/* Duty & Category */}
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                      <span className="text-[11px] text-zinc-500 block font-semibold">دسته‌بندی عملکرد (Duty):</span>
                      <span className="text-xs font-bold text-white block">
                        {selectedInspectPin.dutyCategory || 'انژکتور و سوخت‌رسانی'}
                      </span>
                      <div className="mt-1.5 pt-1.5 border-t border-zinc-850">
                        <span className="text-[10px] text-zinc-500 block">ولتاژ کاری:</span>
                        <span className="text-xs font-mono text-zinc-300">{selectedInspectPin.voltageRange || '12V'}</span>
                      </div>
                    </div>

                    {/* Physical Wire Color Inspection */}
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                      <span className="text-[11px] text-zinc-500 block font-semibold">رنگ فیزیکی سیم دسته‌سیم:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="relative w-8 h-4 rounded-full border border-zinc-700 overflow-hidden shrink-0">
                          <div className="absolute inset-0" style={{ backgroundColor: selectedInspectPin.wireHex }} />
                          {selectedInspectPin.wireStripeHex && (
                            <div
                              className="absolute top-0 bottom-0 left-2 w-2"
                              style={{ backgroundColor: selectedInspectPin.wireStripeHex }}
                            />
                          )}
                        </div>
                        <span className="text-xs font-bold text-zinc-200">
                          {selectedInspectPin.wireColor}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 block mt-1 font-mono">
                        کد رنگ اصلی: {selectedInspectPin.wireHex} {selectedInspectPin.wireStripeHex ? `· خط دوم: ${selectedInspectPin.wireStripeHex}` : ''}
                      </span>
                    </div>

                    {/* Diagnostics Guide */}
                    {selectedInspectPin.testGuide && (
                      <div className="sm:col-span-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-2 text-xs">
                        <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-zinc-300 block mb-0.5">راهنمای تست و عیب‌یابی با اسیلوسکوپ / مولتی‌متر:</span>
                          <p className="text-zinc-400 leading-relaxed">{selectedInspectPin.testGuide}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PIN REGISTRATION / EDIT FORM */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <h5 className="font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-red-500" />
                    <span>{editingPinId ? 'ویرایش اطلاعات پایه' : 'ثبت پایه جدید در ماتریس سوکت'}</span>
                  </h5>
                  {editingPinId && (
                    <button
                      type="button"
                      onClick={handleResetPinForm}
                      className="text-amber-400 hover:underline"
                    >
                      انصراف از ویرایش
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-zinc-400 block mb-1 font-semibold">شماره یا شناسه خانه پایه (الزامی):</label>
                    <input
                      type="text"
                      value={pinNumber}
                      onChange={(e) => setPinNumber(e.target.value)}
                      placeholder="مثلاً: A1 یا 15"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1 font-semibold">نام یا کد فنی پایه (اختیاری):</label>
                    <input
                      type="text"
                      value={pinName}
                      onChange={(e) => setPinName(e.target.value)}
                      placeholder="مثلاً: INJ_1 یا MAP_SIG"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1 font-semibold">دسته‌بندی عملکرد (Duty):</label>
                    <select
                      value={pinDutyCategory}
                      onChange={(e) => setPinDutyCategory(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    >
                      {DUTY_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1 font-semibold">موقعیت سطر در ماتریس:</label>
                    <select
                      value={pinRow}
                      onChange={(e) => setPinRow(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    >
                      {Array.from({ length: currentSocket.rows || 4 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>ردیف {i + 1} ({String.fromCharCode(65 + i)})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1 font-semibold">موقعیت ستون در ماتریس:</label>
                    <select
                      value={pinCol}
                      onChange={(e) => setPinCol(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    >
                      {Array.from({ length: currentSocket.cols || 8 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>ستون {i + 1}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1 font-semibold">نوع سیگنال الکتریکی:</label>
                    <select
                      value={pinSignalType}
                      onChange={(e) => setPinSignalType(e.target.value as SignalType)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="PWM_PULSE">سیگنال و پالس (PWM)</option>
                      <option value="ANALOG_IN">ورودی سیگنال آنالوگ سنسور</option>
                      <option value="12V_BAT">+12V دائم باتری (خط ۳۰)</option>
                      <option value="12V_IGN">+12V سوئیچ (خط ۱۵)</option>
                      <option value="GROUND">اتصال بدنه / منفی (خط ۳۱)</option>
                      <option value="5V_REF">+5V رفرنس سنسور</option>
                      <option value="CAN_BUS">شبکه کن‌باس (CAN-H/L)</option>
                      <option value="K_LINE">خط دیاگ (K-Line)</option>
                      <option value="DISCONNECTED">آزاد / بدون اتصال</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-zinc-400 block mb-1 font-semibold">عملکرد / وظیفه فنی پایه (الزامی):</label>
                    <input
                      type="text"
                      value={pinFunctionName}
                      onChange={(e) => setPinFunctionName(e.target.value)}
                      placeholder="مثلاً: فرمان پاشش انژکتور سیلندر ۱ (سیگنال منفی پالسی)"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1 font-semibold">نوع پالس و شکل تحریک:</label>
                    <select
                      value={pinPulseType}
                      onChange={(e) => setPinPulseType(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    >
                      {PULSE_TYPES.map(pulse => (
                        <option key={pulse} value={pulse}>{pulse}</option>
                      ))}
                    </select>
                  </div>

                  {/* Wire color and dual-color stripe */}
                  <div>
                    <label className="text-zinc-400 block mb-1 font-semibold">نام رنگ سیم دسته‌سیم:</label>
                    <input
                      type="text"
                      value={pinWireColor}
                      onChange={(e) => setPinWireColor(e.target.value)}
                      placeholder="مثلاً سفید با خط مشکی"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1 font-semibold">کد رنگ اصلی و خط دوم:</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5">
                        <span className="text-[11px] text-zinc-400">اصلی:</span>
                        <input
                          type="color"
                          value={pinWireHex}
                          onChange={(e) => setPinWireHex(e.target.value)}
                          className="w-7 h-7 bg-transparent border-0 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex-1 flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5">
                        <span className="text-[11px] text-zinc-400">خط دوم:</span>
                        <input
                          type="color"
                          value={pinWireStripeHex || '#000000'}
                          onChange={(e) => setPinWireStripeHex(e.target.value)}
                          className="w-7 h-7 bg-transparent border-0 rounded cursor-pointer"
                        />
                        {pinWireStripeHex && (
                          <button
                            type="button"
                            onClick={() => setPinWireStripeHex('')}
                            className="text-[10px] text-zinc-500 hover:text-red-400"
                            title="حذف خط دوم"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1 font-semibold">محدوده ولتاژ کاری:</label>
                    <input
                      type="text"
                      value={pinVoltageRange}
                      onChange={(e) => setPinVoltageRange(e.target.value)}
                      placeholder="مثلاً: 0V - 5V یا 12V-14.4V"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-zinc-400 block mb-1 font-semibold">راهنمای تست، عیب‌یابی و اسیلوسکوپ:</label>
                    <input
                      type="text"
                      value={pinTestGuide}
                      onChange={(e) => setPinTestGuide(e.target.value)}
                      placeholder="تست پالس با اسیلوسکوپ در دور آرام: زمان پاشش ۲.۵ میلی‌ثانیه، پیک ولتاژ القایی ۵۵ ولت"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={handleResetPinForm}
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl transition"
                  >
                    پاک‌کردن فرم
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePin}
                    className="flex items-center gap-1.5 px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition shadow-sm active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingPinId ? 'به‌روزرسانی اطلاعات پایه' : 'ثبت پایه در سوکت'}</span>
                  </button>
                </div>
              </div>

              {/* REGISTERED PINS TABLE & SEARCH/FILTER */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
                  <h5 className="font-bold text-white">
                    فهرست پایه‌های ثبت‌شده ({filteredPins.length} از {pinsList.length} پایه)
                  </h5>

                  {/* Search and Category Filter */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={pinSearchQuery}
                        onChange={(e) => setPinSearchQuery(e.target.value)}
                        placeholder="جستجوی شماره، نام یا رنگ..."
                        className="bg-zinc-950 border border-zinc-800 rounded-lg pr-8 pl-2 py-1 text-xs text-white focus:outline-none focus:border-red-500 w-44"
                      />
                    </div>

                    <select
                      value={pinDutyFilter}
                      onChange={(e) => setPinDutyFilter(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none"
                    >
                      <option value="all">همه عملکردها</option>
                      {DUTY_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredPins.length === 0 ? (
                  <p className="text-center text-zinc-500 py-6">
                    {pinsList.length === 0
                      ? 'هنوز هیچ پایه‌ای برای این سوکت ثبت نشده است.'
                      : 'هیچ پایه‌ای با این فیلتر یا عبارت جستجو یافت نشد.'}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400">
                          <th className="pb-2 font-semibold">پایه</th>
                          <th className="pb-2 font-semibold">موقعیت ماتریس</th>
                          <th className="pb-2 font-semibold">عملکرد و نام فنی</th>
                          <th className="pb-2 font-semibold">نوع سیگنال</th>
                          <th className="pb-2 font-semibold">نوع پالس</th>
                          <th className="pb-2 font-semibold">رنگ سیم</th>
                          <th className="pb-2 font-semibold">ولتاژ</th>
                          <th className="pb-2 font-semibold text-left">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {filteredPins.map(pin => {
                          const isSelected = selectedInspectPin?.id === pin.id;

                          return (
                            <tr
                              key={pin.id}
                              onClick={() => setSelectedInspectPin(pin)}
                              className={`cursor-pointer transition ${
                                isSelected ? 'bg-red-950/30' : 'hover:bg-zinc-850/60'
                              }`}
                            >
                              <td className="py-2.5 font-bold font-mono text-white">
                                {pin.pinNumber}
                              </td>
                              <td className="py-2.5 text-zinc-400 font-mono">
                                {pin.row && pin.col ? `سطر ${pin.row}، ستون ${pin.col}` : 'نامشخص'}
                              </td>
                              <td className="py-2.5">
                                <span className="font-semibold text-zinc-200 block">{pin.functionName}</span>
                                {pin.pinName && (
                                  <span className="text-[10px] text-zinc-400 font-mono">{pin.pinName}</span>
                                )}
                              </td>
                              <td className="py-2.5">
                                {getSignalBadge(pin.signalType)}
                              </td>
                              <td className="py-2.5 text-zinc-400 text-[11px]">
                                {pin.pulseType || '-'}
                              </td>
                              <td className="py-2.5">
                                <div className="inline-flex items-center gap-1.5 text-zinc-300">
                                  <div className="relative w-5 h-3 rounded-full border border-zinc-700 overflow-hidden shrink-0">
                                    <div className="absolute inset-0" style={{ backgroundColor: pin.wireHex || '#ffffff' }} />
                                    {pin.wireStripeHex && (
                                      <div
                                        className="absolute top-0 bottom-0 left-1 w-1"
                                        style={{ backgroundColor: pin.wireStripeHex }}
                                      />
                                    )}
                                  </div>
                                  <span>{pin.wireColor}</span>
                                </div>
                              </td>
                              <td className="py-2.5 font-mono text-zinc-400">{pin.voltageRange || '-'}</td>
                              <td className="py-2.5 text-left">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedInspectPin(pin);
                                    }}
                                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                                    title="مشاهده جزئیات کامل"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartEditPin(pin);
                                    }}
                                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                                    title="ویرایش پایه"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingPin(pin);
                                    }}
                                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-red-400 transition"
                                    title="حذف پایه"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Delete Socket Confirmation Modal */}
        {deletingSocket && (
          <DeleteConfirmModal
            isOpen={true}
            onClose={() => setDeletingSocket(null)}
            onConfirm={handleDeleteSocketConfirmed}
            entityType="connector"
            entityId={deletingSocket.id}
            entityTitle={deletingSocket.name}
          />
        )}

        {/* Delete Pin Confirmation Modal */}
        {deletingPin && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-right shadow-2xl">
              <div className="flex items-center gap-3 text-red-400 mb-3">
                <Trash2 className="w-6 h-6 shrink-0" />
                <h4 className="text-sm font-bold text-white">تأیید حذف پایه از سوکت</h4>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                آیا از حذف پایه <span className="font-bold text-white font-mono">{deletingPin.pinNumber}</span> ({deletingPin.functionName}) از سوکت مطمئن هستید؟
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingPin(null)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleDeletePinConfirmed}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-xs font-bold text-white rounded-xl"
                >
                  حذف قطعی پایه
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Media Upload Modal for Socket Diagram / Image */}
        {isMediaModalOpen && currentSocket && (
          <MediaUploadModal
            isOpen={true}
            onClose={() => setIsMediaModalOpen(false)}
            entityType="connector"
            entityId={currentSocket.id || 'temp'}
            entityName={currentSocket.name || 'سوکت ECU'}
            onMediaUploaded={(media) => {
              setCurrentSocket({
                ...currentSocket,
                realImageUrl: media.fileUrl
              });
              setIsMediaModalOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit2,
  Save,
  Download,
  Upload,
  RotateCcw,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Car,
  Cpu,
  Zap,
  ArrowRight,
  X,
  CloudUpload,
  Globe,
  Loader2,
  ShieldCheck,
  LogOut,
  Crosshair,
  FileSpreadsheet,
  Archive,
  ShieldAlert,
  History,
  Users,
  Megaphone,
  ClipboardList,
  Key
} from 'lucide-react';
import {
  Vehicle,
  Connector,
  FuseBox,
  ConnectorPin,
  Fuse,
  Relay,
  FuseSupplyType,
  SignalType,
  PublicationStatus,
  MediaItem,
  VersionEntityType,
  TechnicalDataVersion
} from '../types';
import { storage } from '../services/storage';
import { onlineStorage } from '../services/onlineStorage';
import { useAuth } from '../context/AuthContext';
import { MediaUploadModal } from './MediaUploadModal';
import { VersionHistoryModal } from './VersionHistoryModal';
import { AdminLoginModal } from './AdminLoginModal';
import { InteractiveSocket } from './InteractiveSocket';
import { InteractiveFuseHotspots } from './InteractiveFuseHotspots';
import { getFuseColor, getRelayColor } from '../utils/fuseColors';
import { BulkImportExportModal } from './admin/BulkImportExportModal';
import { DeleteConfirmModal } from './admin/DeleteConfirmModal';
import { VehicleManagerTab } from './admin/VehicleManagerTab';
import { EcuManagerTab } from './admin/EcuManagerTab';
import { MediaManagerTab } from './admin/MediaManagerTab';
import { BackupRestoreTab } from './admin/BackupRestoreTab';
import { QualityControlTab } from './admin/QualityControlTab';
import { TechnicalVersionsTab } from './admin/TechnicalVersionsTab';
import { ApprovalWorkflowTab } from './admin/ApprovalWorkflowTab';
import { UserManagerTab } from './admin/UserManagerTab';
import { BroadcastManagerTab } from './admin/BroadcastManagerTab';
import { AuditLogTab } from './admin/AuditLogTab';
import { LicenseAdminPanel } from './admin/license/LicenseAdminPanel';
import { BulkEntityType } from '../utils/bulkDataEngine';

interface AdminPanelProps {
  onBack: () => void;
  onRefreshData?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack, onRefreshData }) => {
  const { currentUser, isAdmin, logout, isOnlineDbConnected } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'vehicles' | 'ecus' | 'connectors' | 'fuseboxes' | 'licenses' | 'media' | 'approvals' | 'quality_control' | 'cloud_sync' | 'backup' | 'versions' | 'users' | 'broadcasts' | 'audit_logs'>('vehicles');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkInitialType, setBulkInitialType] = useState<BulkEntityType>('vehicles');
  const [deletingConnector, setDeletingConnector] = useState<Connector | null>(null);
  const [deletingFuseBoxItem, setDeletingFuseBoxItem] = useState<FuseBox | null>(null);
  const [versionModalState, setVersionModalState] = useState<{
    isOpen: boolean;
    recordId: string;
    entityType: VersionEntityType;
    title: string;
  } | null>(null);

  // Cloud Seed status
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState<string | null>(null);

  // Connector Form State
  const [editingConnector, setEditingConnector] = useState<Partial<Connector> | null>(null);
  const [pinsList, setPinsList] = useState<ConnectorPin[]>([]);
  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [selectedPreviewPinId, setSelectedPreviewPinId] = useState<string | null>(null);
  const [pinFormError, setPinFormError] = useState<string | null>(null);
  const [pinFormSuccess, setPinFormSuccess] = useState<string | null>(null);
  const [saveSuccessBanner, setSaveSuccessBanner] = useState<string | null>(null);

  // Pin entry state
  const [newPinNumber, setNewPinNumber] = useState('1');
  const [newPinColor, setNewPinColor] = useState('سفید با خط مشکی');
  const [newPinHex, setNewPinHex] = useState('#ffffff');
  const [newPinStripeHex, setNewPinStripeHex] = useState('#000000');
  const [newPinFunction, setNewPinFunction] = useState('');
  const [newPinSignal, setNewPinSignal] = useState<SignalType>('12V_BAT');
  const [newPinVoltage, setNewPinVoltage] = useState('12.0V - 14.4V');
  const [newPinTest, setNewPinTest] = useState('');
  const [newPinStatus, setNewPinStatus] = useState<PublicationStatus>('published');

  // Media Upload Modal
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');

  // FuseBox Manager Form State
  const [editingFuseBox, setEditingFuseBox] = useState<Partial<FuseBox> | null>(null);
  const [fuseBoxFuses, setFuseBoxFuses] = useState<Fuse[]>([]);
  const [fuseBoxRelays, setFuseBoxRelays] = useState<Relay[]>([]);
  const [fuseBoxSubTab, setFuseBoxSubTab] = useState<'info' | 'images' | 'fuses' | 'relays' | 'hotspots'>('info');
  const [fuseBoxActiveImageKey, setFuseBoxActiveImageKey] = useState<'real' | 'cover' | 'diagram'>('real');
  const [fuseBoxFormError, setFuseBoxFormError] = useState<string | null>(null);
  const [fuseBoxSuccessMsg, setFuseBoxSuccessMsg] = useState<string | null>(null);
  const [deletingFuseBoxId, setDeletingFuseBoxId] = useState<string | null>(null);
  const originalFusesRef = useRef<Fuse[]>([]);
  const originalRelaysRef = useRef<Relay[]>([]);
  const [hotspotSelectedFuse, setHotspotSelectedFuse] = useState<Fuse | null>(null);
  const [hotspotSelectedRelay, setHotspotSelectedRelay] = useState<Relay | null>(null);

  // Fuse Item Sub-form State
  const [editingFuseId, setEditingFuseId] = useState<string | null>(null);
  const [newFuseCode, setNewFuseCode] = useState('F1');
  const [newFuseAmps, setNewFuseAmps] = useState<number>(10);
  const [newFuseType, setNewFuseType] = useState<Fuse['fuseType']>('standard');
  const [newFuseFunction, setNewFuseFunction] = useState('');
  const [newFuseCircuit, setNewFuseCircuit] = useState('');
  const [newFuseSupply, setNewFuseSupply] = useState<FuseSupplyType>('+15 (سوئیچ باز)');
  const [newFuseTest, setNewFuseTest] = useState('');
  const [newFuseStatus, setNewFuseStatus] = useState<PublicationStatus>('published');
  const [fuseItemError, setFuseItemError] = useState<string | null>(null);

  // Relay Item Sub-form State
  const [editingRelayId, setEditingRelayId] = useState<string | null>(null);
  const [newRelayCode, setNewRelayCode] = useState('R1');
  const [newRelayName, setNewRelayName] = useState('');
  const [newRelayRating, setNewRelayRating] = useState('12V 30A');
  const [newRelayContactAmps, setNewRelayContactAmps] = useState<number>(30);
  const [newRelayCoilVoltage, setNewRelayCoilVoltage] = useState('12V DC');
  const [newRelayType, setNewRelayType] = useState<Relay['relayType']>('cube_4pin');
  const [newRelayCoil, setNewRelayCoil] = useState('85 و 86');
  const [newRelayContact, setNewRelayContact] = useState('30 و 87');
  const [newRelayFunction, setNewRelayFunction] = useState('');
  const [newRelayCircuit, setNewRelayCircuit] = useState('');
  const [newRelayDiag, setNewRelayDiag] = useState('');
  const [newRelaySource, setNewRelaySource] = useState('نقشه‌های رسمی کارخانه');
  const [newRelayStatus, setNewRelayStatus] = useState<PublicationStatus>('published');
  const [relayItemError, setRelayItemError] = useState<string | null>(null);

  // Media Modal for FuseBox
  const [isFuseBoxMediaModalOpen, setIsFuseBoxMediaModalOpen] = useState(false);
  const [fuseBoxUploadTarget, setFuseBoxUploadTarget] = useState<'realImageUrl' | 'coverDiagramUrl' | 'diagramImageUrl'>('realImageUrl');

  const vehicles = storage.getVehicles();
  const ecus = storage.getECUs();
  const connectors = storage.getConnectors();
  const fuseBoxes = storage.getFuseBoxes();
  const mediaItems = storage.getMediaItems();
  const wiringDiagrams = storage.getWiringDiagrams();
  const pendingApprovalsCount = storage.getPendingReviewItems().length;

  const [gridResizeWarning, setGridResizeWarning] = useState<string | null>(null);

  // Handlers for rows & columns with strict positive integer bounds and safe resize check
  const handleRowsChange = (valStr: string) => {
    if (valStr === '') {
      setEditingConnector(prev => prev ? { ...prev, rows: 0 } : null);
      return;
    }
    const val = parseInt(valStr, 10);
    if (!isNaN(val)) {
      const safeRows = Math.min(Math.max(1, val), 16);
      const outOfBounds = pinsList.filter(p => p.row && p.row > safeRows);
      if (outOfBounds.length > 0) {
        setGridResizeWarning(`هشدار: تعداد ${outOfBounds.length} پایه دارای شماره ردیف بیشتر از ${safeRows} هستند. این اطلاعات به هیچ‌وجه حذف نخواهند شد و در سیستم محفوظ می‌مانند.`);
      } else {
        setGridResizeWarning(null);
      }
      setEditingConnector(prev => {
        if (!prev) return null;
        const currentCols = prev.cols && prev.cols > 0 ? prev.cols : 8;
        return {
          ...prev,
          rows: safeRows,
          pinCount: safeRows * currentCols
        };
      });
    }
  };

  const handleColsChange = (valStr: string) => {
    if (valStr === '') {
      setEditingConnector(prev => prev ? { ...prev, cols: 0 } : null);
      return;
    }
    const val = parseInt(valStr, 10);
    if (!isNaN(val)) {
      const safeCols = Math.min(Math.max(1, val), 32);
      const outOfBounds = pinsList.filter(p => p.col && p.col > safeCols);
      if (outOfBounds.length > 0) {
        setGridResizeWarning(`هشدار: تعداد ${outOfBounds.length} پایه دارای شماره ستون بیشتر از ${safeCols} هستند. این اطلاعات به هیچ‌وجه حذف نخواهند شد و در سیستم محفوظ می‌مانند.`);
      } else {
        setGridResizeWarning(null);
      }
      setEditingConnector(prev => {
        if (!prev) return null;
        const currentRows = prev.rows && prev.rows > 0 ? prev.rows : 4;
        return {
          ...prev,
          cols: safeCols,
          pinCount: currentRows * safeCols
        };
      });
    }
  };

  // Add or update pin with duplicate checking, unique ID, and auto-increment
  const handleAddOrUpdatePin = () => {
    const pinNum = newPinNumber.trim();
    if (!pinNum) {
      setPinFormError('لطفاً شماره یا کد پایه (مانند A1 یا 15) را مشخص کنید.');
      return;
    }

    // Duplicate check
    const existingIndex = pinsList.findIndex(
      p => p.pinNumber.trim().toLowerCase() === pinNum.toLowerCase() && p.id !== editingPinId
    );

    if (existingIndex >= 0) {
      setPinFormError(`پایه با شماره «${pinNum}» از قبل ثبت شده است (${pinsList[existingIndex].functionName}). لطفاً شماره دیگری انتخاب یا همان پایه را ویرایش نمایید.`);
      return;
    }

    const functionName = newPinFunction.trim() || `پایه شماره ${pinNum}`;
    const voltageRange = newPinVoltage.trim() || '12.0V';

    if (editingPinId) {
      // Update existing pin
      setPinsList(prev => prev.map(p => {
        if (p.id === editingPinId) {
          return {
            ...p,
            pinNumber: pinNum,
            wireColor: newPinColor.trim() || 'نامشخص',
            wireHex: newPinHex,
            wireStripeHex: newPinStripeHex !== 'none' ? newPinStripeHex : undefined,
            functionName,
            signalType: newPinSignal,
            voltageRange,
            testGuide: newPinTest.trim() || undefined,
            status: newPinStatus
          };
        }
        return p;
      }));
      setPinFormSuccess(`مشخصات پایه «${pinNum}» با موفقیت به‌روزرسانی شد.`);
      setEditingPinId(null);
    } else {
      // Add new pin
      const newPin: ConnectorPin = {
        id: `pin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        connectorId: editingConnector?.id || 'draft',
        pinNumber: pinNum,
        wireColor: newPinColor.trim() || 'سفید با خط مشکی',
        wireHex: newPinHex,
        wireStripeHex: newPinStripeHex !== 'none' ? newPinStripeHex : undefined,
        functionName,
        signalType: newPinSignal,
        voltageRange,
        testGuide: newPinTest.trim() || undefined,
        status: newPinStatus
      };
      setPinsList(prev => [...prev, newPin]);
      setPinFormSuccess(`پایه «${pinNum}» به فهرست پایه‌های سوکت افزوده شد.`);
    }

    // Auto-advance / suggest next pin number
    const parsedNum = parseInt(pinNum, 10);
    if (!isNaN(parsedNum)) {
      setNewPinNumber(String(parsedNum + 1));
    } else if (pinNum.length >= 2) {
      const prefix = pinNum.slice(0, -1);
      const lastChar = pinNum.slice(-1);
      const lastNum = parseInt(lastChar, 10);
      if (!isNaN(lastNum)) {
        setNewPinNumber(`${prefix}${lastNum + 1}`);
      } else {
        setNewPinNumber('');
      }
    } else {
      setNewPinNumber('');
    }

    setNewPinFunction('');
    setNewPinTest('');
    setPinFormError(null);
    setTimeout(() => setPinFormSuccess(null), 3000);
  };

  const handleStartEditPin = (pin: ConnectorPin) => {
    setEditingPinId(pin.id);
    setSelectedPreviewPinId(pin.id);
    setNewPinNumber(pin.pinNumber);
    setNewPinColor(pin.wireColor);
    setNewPinHex(pin.wireHex);
    setNewPinStripeHex(pin.wireStripeHex || 'none');
    setNewPinFunction(pin.functionName);
    setNewPinSignal(pin.signalType);
    setNewPinVoltage(pin.voltageRange || '12.0V');
    setNewPinTest(pin.testGuide || '');
    setNewPinStatus(pin.status || 'published');
    setPinFormError(null);
    setPinFormSuccess(null);
  };

  const handleCancelEditPin = () => {
    setEditingPinId(null);
    setSelectedPreviewPinId(null);
    setNewPinNumber('');
    setNewPinFunction('');
    setNewPinTest('');
    setPinFormError(null);
  };

  const handleRemovePin = (id: string) => {
    setPinsList(prev => prev.filter(p => p.id !== id));
    if (editingPinId === id) {
      handleCancelEditPin();
    }
    if (selectedPreviewPinId === id) {
      setSelectedPreviewPinId(null);
    }
  };

  // Save Connector (both locally and to Firestore if online)
  const handleSaveConnector = async () => {
    if (!editingConnector?.name?.trim()) {
      setPinFormError('لطفاً نام کامل سوکت را وارد نمایید.');
      return;
    }

    const rows = editingConnector.rows && editingConnector.rows > 0 ? editingConnector.rows : 4;
    const cols = editingConnector.cols && editingConnector.cols > 0 ? editingConnector.cols : 8;
    const capacity = rows * cols;

    const connectorToSave: Connector = {
      id: editingConnector.id || `conn-${Date.now()}`,
      vehicleId: editingConnector.vehicleId || vehicles[0]?.id || 'peugeot-206',
      name: editingConnector.name.trim(),
      codeName: editingConnector.codeName?.trim() || editingConnector.name.trim(),
      category: editingConnector.category || 'ecu',
      pinCount: capacity,
      rows: rows,
      cols: cols,
      shape: editingConnector.shape || 'grid',
      socketColor: editingConnector.socketColor || 'خاکستری',
      socketColorHex: editingConnector.socketColorHex || '#71717a',
      realImageUrl: uploadedImageUrl || editingConnector.realImageUrl,
      frontImageUrl: editingConnector.frontImageUrl,
      backImageUrl: editingConnector.backImageUrl,
      pinoutDiagramUrl: editingConnector.pinoutDiagramUrl,
      source: editingConnector.source || 'تکنسین برق خودرو / تعمیرگاه',
      status: (editingConnector.status as PublicationStatus) || 'published',
      notes: editingConnector.notes || '',
      pins: pinsList,
      updatedBy: currentUser?.email || 'Admin',
      updatedAt: Date.now(),
      createdAt: editingConnector.createdAt || Date.now()
    };

    // Save locally with revision tracking
    storage.saveConnector(connectorToSave, {
      uid: currentUser?.uid,
      email: currentUser?.email || 'admin@autopin.ir'
    });

    // Save to Firestore if admin & online
    if (isAdmin && isOnlineDbConnected) {
      try {
        await onlineStorage.saveConnector(connectorToSave);
      } catch (err) {
        console.warn('Could not save to Firestore, saved to local cache:', err);
      }
    }

    setEditingConnector(null);
    setPinsList([]);
    setEditingPinId(null);
    setSelectedPreviewPinId(null);
    setUploadedImageUrl('');
    onRefreshData?.();
    setSaveSuccessBanner(`سوکت «${connectorToSave.name}» با موفقیت در بانک اطلاعاتی ذخیره شد.`);
    setTimeout(() => setSaveSuccessBanner(null), 4000);
  };

  // --- FUSEBOX CRUD HANDLERS ---
  const handleCreateNewFuseBox = () => {
    const defaultVeh = vehicles[0]?.id || 'peugeot-206';
    setEditingFuseBox({
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      vehicleId: defaultVeh,
      name: '',
      location: 'cabin',
      locationFa: 'داخل کابین (زیر داشبورد)',
      notes: '',
      source: 'دفترچه راهنمای فنی و نقشه کارخانه',
      status: 'published',
      realImageUrl: '',
      coverDiagramUrl: '',
      diagramImageUrl: '',
      manufacturer: 'ایران خودرو',
      modelYears: '۱۳۸۵ - ۱۴۰۲',
      trim: 'استاندارد',
      engineCode: 'TU5'
    });
    setFuseBoxFuses([]);
    setFuseBoxRelays([]);
    setFuseBoxSubTab('info');
    setFuseBoxFormError(null);
    setFuseBoxSuccessMsg(null);
    setEditingFuseId(null);
    setEditingRelayId(null);
  };

  const handleStartEditFuseBox = (fb: FuseBox) => {
    setEditingFuseBox({ ...fb });
    setFuseBoxFuses([...(fb.fuses || [])]);
    setFuseBoxRelays([...(fb.relays || [])]);
    originalFusesRef.current = JSON.parse(JSON.stringify(fb.fuses || []));
    originalRelaysRef.current = JSON.parse(JSON.stringify(fb.relays || []));
    setFuseBoxSubTab('info');
    setFuseBoxFormError(null);
    setFuseBoxSuccessMsg(null);
    setEditingFuseId(null);
    setEditingRelayId(null);
    setHotspotSelectedFuse((fb.fuses && fb.fuses.length > 0) ? fb.fuses[0] : null);
    setHotspotSelectedRelay(null);
  };

  const handleRevertHotspots = () => {
    setFuseBoxFuses(JSON.parse(JSON.stringify(originalFusesRef.current)));
    setFuseBoxRelays(JSON.parse(JSON.stringify(originalRelaysRef.current)));
    setFuseBoxSuccessMsg('تغییرات موقعیت‌ها به حالت اولیه لغو شد.');
    setTimeout(() => setFuseBoxSuccessMsg(null), 3500);
  };

  const handleCancelEditFuseBox = () => {
    setEditingFuseBox(null);
    setFuseBoxFuses([]);
    setFuseBoxRelays([]);
    setEditingFuseId(null);
    setEditingRelayId(null);
    setFuseBoxFormError(null);
  };

  const handleAddOrUpdateFuseItem = () => {
    const code = newFuseCode.trim();
    if (!code) {
      setFuseItemError('لطفاً کد یا شماره فیوز (مانند F15 یا MF2) را وارد کنید.');
      return;
    }

    const func = newFuseFunction.trim() || `فیوز شماره ${code}`;
    const circuit = newFuseCircuit.trim() || func;

    if (editingFuseId) {
      setFuseBoxFuses(prev => prev.map(f => {
        if (f.id === editingFuseId) {
          return {
            ...f,
            code,
            ratingAmps: Number(newFuseAmps) || 10,
            fuseType: newFuseType,
            functionName: func,
            circuitDetails: circuit,
            powerSupplyType: newFuseSupply,
            testTips: newFuseTest.trim() || undefined,
            status: newFuseStatus
          };
        }
        return f;
      }));
      setEditingFuseId(null);
      setFuseItemError(null);
    } else {
      const newFuse: Fuse = {
        id: `fuse-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fuseBoxId: editingFuseBox?.id || 'draft-fb',
        code,
        ratingAmps: Number(newFuseAmps) || 10,
        fuseType: newFuseType,
        functionName: func,
        circuitDetails: circuit,
        powerSupplyType: newFuseSupply,
        testTips: newFuseTest.trim() || undefined,
        status: newFuseStatus
      };
      setFuseBoxFuses(prev => [...prev, newFuse]);
      setFuseItemError(null);
    }

    // Auto advance code: F1 -> F2
    const numMatch = code.match(/\d+/);
    if (numMatch) {
      const num = parseInt(numMatch[0], 10);
      const prefix = code.slice(0, numMatch.index);
      setNewFuseCode(`${prefix}${num + 1}`);
    } else {
      setNewFuseCode('');
    }

    setNewFuseFunction('');
    setNewFuseCircuit('');
    setNewFuseTest('');
  };

  const handleStartEditFuseItem = (f: Fuse) => {
    setEditingFuseId(f.id);
    setNewFuseCode(f.code);
    setNewFuseAmps(f.ratingAmps);
    setNewFuseType(f.fuseType || 'standard');
    setNewFuseFunction(f.functionName);
    setNewFuseCircuit(f.circuitDetails);
    setNewFuseSupply(f.powerSupplyType);
    setNewFuseTest(f.testTips || '');
    setNewFuseStatus(f.status || 'published');
    setFuseItemError(null);
  };

  const handleRemoveFuseItem = (id: string) => {
    setFuseBoxFuses(prev => prev.filter(f => f.id !== id));
    if (editingFuseId === id) {
      setEditingFuseId(null);
      setNewFuseFunction('');
      setNewFuseCircuit('');
      setNewFuseTest('');
    }
  };

  const handleAddOrUpdateRelayItem = () => {
    const code = newRelayCode.trim();
    if (!code) {
      setRelayItemError('لطفاً کد یا عنوان رله (مانند R1 یا رله دوبل) را وارد کنید.');
      return;
    }

    const name = newRelayName.trim() || `رله ${code}`;
    const func = newRelayFunction.trim() || name;
    const contactAmps = Number(newRelayContactAmps) || 30;

    if (editingRelayId) {
      setFuseBoxRelays(prev => prev.map(r => {
        if (r.id === editingRelayId) {
          return {
            ...r,
            code,
            name,
            rating: `${newRelayCoilVoltage} ${contactAmps}A`,
            contactAmps,
            coilVoltage: newRelayCoilVoltage,
            relayType: newRelayType,
            coilPins: newRelayCoil.trim() || '85 و 86',
            contactPins: newRelayContact.trim() || '30 و 87',
            functionName: func,
            circuitDetails: newRelayCircuit.trim() || func,
            diagnostics: newRelayDiag.trim() || undefined,
            source: newRelaySource.trim() || undefined,
            status: newRelayStatus
          };
        }
        return r;
      }));
      setEditingRelayId(null);
      setRelayItemError(null);
    } else {
      const newRelay: Relay = {
        id: `relay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fuseBoxId: editingFuseBox?.id || 'draft-fb',
        code,
        name,
        rating: `${newRelayCoilVoltage} ${contactAmps}A`,
        contactAmps,
        coilVoltage: newRelayCoilVoltage,
        relayType: newRelayType,
        coilPins: newRelayCoil.trim() || '85 و 86',
        contactPins: newRelayContact.trim() || '30 و 87',
        functionName: func,
        circuitDetails: newRelayCircuit.trim() || func,
        diagnostics: newRelayDiag.trim() || undefined,
        source: newRelaySource.trim() || undefined,
        status: newRelayStatus
      };
      setFuseBoxRelays(prev => [...prev, newRelay]);
      setRelayItemError(null);
    }

    const numMatch = code.match(/\d+/);
    if (numMatch) {
      const num = parseInt(numMatch[0], 10);
      const prefix = code.slice(0, numMatch.index);
      setNewRelayCode(`${prefix}${num + 1}`);
    } else {
      setNewRelayCode('');
    }
    setNewRelayName('');
    setNewRelayFunction('');
    setNewRelayCircuit('');
    setNewRelayDiag('');
  };

  const handleStartEditRelayItem = (r: Relay) => {
    setEditingRelayId(r.id);
    setNewRelayCode(r.code);
    setNewRelayName(r.name);
    setNewRelayRating(r.rating);
    setNewRelayContactAmps(r.contactAmps || 30);
    setNewRelayCoilVoltage(r.coilVoltage || '12V DC');
    setNewRelayType(r.relayType || 'cube_4pin');
    setNewRelayCoil(r.coilPins);
    setNewRelayContact(r.contactPins);
    setNewRelayFunction(r.functionName);
    setNewRelayCircuit(r.circuitDetails || '');
    setNewRelayDiag(r.diagnostics || '');
    setNewRelaySource(r.source || 'نقشه‌های رسمی کارخانه');
    setNewRelayStatus(r.status || 'published');
    setRelayItemError(null);
  };

  const handleRemoveRelayItem = (id: string) => {
    setFuseBoxRelays(prev => prev.filter(r => r.id !== id));
    if (editingRelayId === id) {
      setEditingRelayId(null);
      setNewRelayName('');
      setNewRelayFunction('');
      setNewRelayDiag('');
    }
  };

  const handleUpdateFuseBoxHotspot = (fuseId: string, xPercent: number, yPercent: number) => {
    setFuseBoxFuses(prev => prev.map(f => f.id === fuseId ? { ...f, xPercent, yPercent } : f));
  };

  const handleUpdateRelayHotspot = (relayId: string, xPercent: number, yPercent: number) => {
    setFuseBoxRelays(prev => prev.map(r => r.id === relayId ? { ...r, xPercent, yPercent } : r));
  };

  const handleClearHotspotPosition = (type: 'fuse' | 'relay', id: string) => {
    if (type === 'fuse') {
      setFuseBoxFuses(prev => prev.map(f => f.id === id ? { ...f, xPercent: undefined, yPercent: undefined } : f));
    } else {
      setFuseBoxRelays(prev => prev.map(r => r.id === id ? { ...r, xPercent: undefined, yPercent: undefined } : r));
    }
  };

  const handleSaveFuseBox = async () => {
    if (!editingFuseBox) return;

    if (!editingFuseBox.name || !editingFuseBox.name.trim()) {
      setFuseBoxFormError('لطفاً عنوان و نام جعبه‌فیوز (مانند: جعبه‌فیوز کالسکه روی باتری) را وارد کنید.');
      return;
    }

    if (!editingFuseBox.vehicleId) {
      setFuseBoxFormError('لطفاً خودروی مربوطه را انتخاب کنید.');
      return;
    }

    const fullFb: FuseBox = {
      id: editingFuseBox.id || `fb-${Date.now()}`,
      vehicleId: editingFuseBox.vehicleId,
      name: editingFuseBox.name.trim(),
      location: editingFuseBox.location || 'cabin',
      locationFa: editingFuseBox.locationFa?.trim() || 'داخل کابین',
      notes: editingFuseBox.notes?.trim() || undefined,
      source: editingFuseBox.source?.trim() || 'دفترچه راهنمای فنی',
      status: editingFuseBox.status || 'published',
      realImageUrl: editingFuseBox.realImageUrl?.trim() || undefined,
      coverDiagramUrl: editingFuseBox.coverDiagramUrl?.trim() || undefined,
      diagramImageUrl: editingFuseBox.diagramImageUrl?.trim() || undefined,
      manufacturer: editingFuseBox.manufacturer?.trim() || undefined,
      modelYears: editingFuseBox.modelYears?.trim() || undefined,
      trim: editingFuseBox.trim?.trim() || undefined,
      engineCode: editingFuseBox.engineCode?.trim() || undefined,
      fuses: fuseBoxFuses,
      relays: fuseBoxRelays
    };

    // Save locally with revision tracking
    storage.saveFuseBox(fullFb, {
      uid: currentUser?.uid,
      email: currentUser?.email || 'admin@autopin.ir'
    });

    // Save to Firestore if connected
    if (isAdmin && isOnlineDbConnected) {
      try {
        await onlineStorage.saveFuseBox(fullFb);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'خطای ارتباط با سرور ابری';
        setFuseBoxFormError(`ذخیره در حافظه محلی انجام شد اما ارسال به سرور ابری ناموفق بود: ${msg}`);
        // Do not close form so user can retry
        return;
      }
    }

    originalFusesRef.current = JSON.parse(JSON.stringify(fuseBoxFuses));
    originalRelaysRef.current = JSON.parse(JSON.stringify(fuseBoxRelays));
    setFuseBoxFormError(null);
    setEditingFuseBox(null);
    setFuseBoxFuses([]);
    setFuseBoxRelays([]);
    onRefreshData?.();
    setFuseBoxSuccessMsg(`جعبه‌فیوز «${fullFb.name}» با ${fullFb.fuses.length} فیوز و ${fullFb.relays.length} رله با موفقیت ذخیره شد.`);
    setTimeout(() => setFuseBoxSuccessMsg(null), 4000);
  };

  const handleDeleteFuseBoxConfirmed = async (id: string) => {
    storage.deleteFuseBox(id);
    if (isAdmin && isOnlineDbConnected) {
      try {
        await onlineStorage.deleteFuseBox(id);
      } catch (e) {
        console.warn(e);
      }
    }
    setDeletingFuseBoxId(null);
    onRefreshData?.();
  };

  // Cloud Seeding Trigger
  const handleSeedCloudDatabase = async () => {
    if (!confirm('آیا مایلید تمام خودروها، سوکت‌ها، پایه‌ها و جعبه‌فیوزهای پیش‌فرض را در Firestore ذخیره کنید؟')) {
      return;
    }

    try {
      setIsSeeding(true);
      setSeedSuccessMsg(null);
      const res = await onlineStorage.seedInitialDataToFirestore();
      setSeedSuccessMsg(`تعداد ${res.count} رکورد با موفقیت در پایگاه داده ابری Firestore ثبت شدند.`);
      onRefreshData?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطای همگام‌سازی ابری';
      setIsSeeding(false);
    }
  };

  // If user is not an authenticated Admin, show the access lock
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 mb-4 shadow-xl">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white">ورود به پنل مدیریت AutoPin Pro</h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm leading-relaxed">
          این بخش منحصراً برای مدیران مجاز سیستم با احراز هویت امن Firebase در دسترس است. کاربران عادی تنها به اطلاعات منتشرشده دسترسی دارند.
        </p>

        <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition active:scale-95 shadow-md shadow-red-950 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>ورود مدیر با ایمیل / حساب گوگل</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="text-xs text-zinc-400 hover:text-zinc-200 py-2"
          >
            انصراف و بازگشت به برنامه
          </button>
        </div>

        <AdminLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => setIsLoginModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Top Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-2 -mr-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95 transition"
              title="بازگشت"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Unlock className="w-4 h-4 text-emerald-400" />
                <span>پنل مدیریت و توسعه بانک اطلاعاتی آنلاین</span>
              </h1>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                <span>کاربر مدیر: <strong className="text-white font-mono">{currentUser?.email}</strong></span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400">Firebase Firestore فعال</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setBulkInitialType('vehicles');
                setIsBulkModalOpen(true);
              }}
              className="text-xs text-white font-bold px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 flex items-center gap-1.5 transition shadow-sm shadow-red-950 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ورود و خروج گروهی (Excel / CSV)</span>
            </button>

            <button
              onClick={logout}
              className="text-xs text-zinc-400 hover:text-white px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center gap-1.5 transition"
              title="خروج از حساب مدیر"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs overflow-x-auto gap-1">
        {/* TAB 0: LICENSE MANAGEMENT SUITE (10 SECTIONS) */}
        <button
          onClick={() => { setActiveTab('licenses'); setEditingConnector(null); }}
          className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'licenses'
              ? 'bg-gradient-to-r from-red-600 to-zinc-900 text-white shadow-md shadow-red-950/60'
              : 'text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/40'
          }`}
        >
          <Key className="w-3.5 h-3.5 text-red-400" />
          <span>مدیریت لایسنس‌ها (ComposeShield)</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-950 text-red-300 border border-red-800">۱۰ بخش</span>
        </button>

        <button
          onClick={() => { setActiveTab('vehicles'); setEditingConnector(null); }}
          className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'vehicles' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Car className="w-3.5 h-3.5 text-red-500" />
          <span>خودروها ({vehicles.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('ecus'); setEditingConnector(null); }}
          className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'ecus' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>ECUها ({ecus.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('connectors'); setEditingConnector(null); }}
          className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'connectors' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>سوکت و پین‌اوت ECU ({connectors.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('fuseboxes'); setEditingConnector(null); }}
          className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'fuseboxes' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>جعبه‌فیوز و رله‌ها ({fuseBoxes.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('media'); setEditingConnector(null); }}
          className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'media' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
          <span>تصاویر و نقشه‌ها ({mediaItems.length + wiringDiagrams.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('approvals'); setEditingConnector(null); }}
          className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'approvals' ? 'bg-amber-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
          <span>تأیید و انتشار اطلاعات</span>
          {pendingApprovalsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-2xs bg-amber-400 text-black font-black animate-pulse">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('quality_control'); setEditingConnector(null); }}
          className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'quality_control' ? 'bg-red-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span>کنترل کیفیت اطلاعات</span>
        </button>

        <button
          onClick={() => { setActiveTab('cloud_sync'); setEditingConnector(null); }}
          className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition ${
            activeTab === 'cloud_sync' ? 'bg-red-950/80 text-red-300 border border-red-800' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          همگام‌سازی ابری Firestore
        </button>

        <button
          onClick={() => { setActiveTab('backup'); setEditingConnector(null); }}
          className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'backup' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Archive className="w-3.5 h-3.5 text-amber-400" />
          <span>پشتیبان‌گیری و بازیابی</span>
        </button>

        <button
          onClick={() => { setActiveTab('versions'); setEditingConnector(null); }}
          className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'versions' ? 'bg-purple-900/60 text-purple-200 border border-purple-700/60 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <History className="w-3.5 h-3.5 text-purple-400" />
          <span>مدیریت نسخه‌ها و تاریخچه</span>
        </button>

        <button
          onClick={() => { setActiveTab('users'); setEditingConnector(null); }}
          className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'users' ? 'bg-red-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-zinc-300" />
          <span>کاربران و دسترسی‌ها</span>
        </button>

        <button
          onClick={() => { setActiveTab('broadcasts'); setEditingConnector(null); }}
          className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'broadcasts' ? 'bg-red-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 text-amber-300" />
          <span>ارسال اعلان عمومی</span>
        </button>

        <button
          onClick={() => { setActiveTab('audit_logs'); setEditingConnector(null); }}
          className={`px-3 py-2 font-bold rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'audit_logs' ? 'bg-red-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 text-red-300" />
          <span>گزارش فعالیت‌ها (Audit Log)</span>
        </button>
      </div>

      {/* TAB 1: CONNECTORS */}
      {activeTab === 'connectors' && (
        <div className="flex flex-col gap-4">
          {saveSuccessBanner && (
            <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{saveSuccessBanner}</span>
            </div>
          )}

          {!editingConnector ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200">فهرست سوکت‌های تعریف‌شده</span>
                <button
                  onClick={() => {
                    setEditingConnector({
                      id: `conn-${Date.now()}`,
                      vehicleId: vehicles[0]?.id || 'peugeot-206',
                      name: '',
                      codeName: '',
                      category: 'ecu',
                      pinCount: 32,
                      rows: 4,
                      cols: 8,
                      socketColor: 'خاکستری',
                      socketColorHex: '#71717a',
                      status: 'published'
                    });
                    setPinsList([]);
                    setEditingPinId(null);
                    setSelectedPreviewPinId(null);
                    setUploadedImageUrl('');
                    setPinFormError(null);
                    setPinFormSuccess(null);
                    setNewPinNumber('1');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl active:scale-95 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن سوکت جدید</span>
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {connectors.map(conn => {
                  const veh = vehicles.find(v => v.id === conn.vehicleId);
                  return (
                    <div
                      key={conn.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: conn.socketColorHex }} />
                          <h4 className="text-xs font-bold text-white truncate">{conn.name}</h4>
                          <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                            {conn.pins.length} پایه
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${
                            conn.status === 'published' ? 'text-emerald-400 border-emerald-800 bg-emerald-950/40' : 'text-amber-400 border-amber-800 bg-amber-950/40'
                          }`}>
                            {conn.status === 'published' ? 'منتشرشده' : 'پیش‌نویس'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1 truncate">
                          {veh?.name || 'عمومی'} · {conn.codeName}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setVersionModalState({
                            isOpen: true,
                            recordId: conn.id,
                            entityType: 'connector',
                            title: conn.name
                          })}
                          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-purple-400 hover:text-purple-300"
                          title="تاریخچه نسخه‌ها و تغییرات فنی"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingConnector(conn);
                            setPinsList(conn.pins || []);
                            setEditingPinId(null);
                            setSelectedPreviewPinId(null);
                            setUploadedImageUrl(conn.realImageUrl || '');
                            setPinFormError(null);
                            setPinFormSuccess(null);
                            setNewPinNumber(String((conn.pins?.length || 0) + 1));
                          }}
                          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          title="ویرایش"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingConnector(conn)}
                          className="p-2 rounded-lg bg-zinc-800 hover:bg-red-950 text-red-400"
                          title="حذف سوکت"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* CONNECTOR FORM */
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-bold text-white">
                  {editingConnector.id ? 'ویرایش سوکت و ثبت پایه‌ها' : 'تعریف سوکت جدید'}
                </h3>
                <button
                  onClick={() => setEditingConnector(null)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Rejection Banner if rejected */}
              {editingConnector.rejectionReason && (
                <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-red-300">علت رد این سوکت توسط مدیر فنی:</strong>
                    <p className="mt-1 leading-relaxed">{editingConnector.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">خودرو مربوطه:</label>
                  <select
                    value={editingConnector.vehicleId || ''}
                    onChange={(e) => setEditingConnector({ ...editingConnector, vehicleId: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">کامپیوتر موتور (ECU) مربوطه:</label>
                  <select
                    value={editingConnector.ecuId || ''}
                    onChange={(e) => setEditingConnector({ ...editingConnector, ecuId: e.target.value || undefined })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="">-- بدون انتساب مستقیم به ECU --</option>
                    {ecus
                      .filter(e => !editingConnector.vehicleId || e.vehicleId === editingConnector.vehicleId)
                      .map(e => (
                        <option key={e.id} value={e.id}>{e.brand} {e.model} ({e.id})</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">نام کامل سوکت:</label>
                  <input
                    type="text"
                    value={editingConnector.name || ''}
                    onChange={(e) => setEditingConnector({ ...editingConnector, name: e.target.value })}
                    placeholder="مثلاً: سوکت ۴۸ پایه قهوه‌ای (MR48)"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">کد یا نام فنی سوکت:</label>
                  <input
                    type="text"
                    value={editingConnector.codeName || ''}
                    onChange={(e) => setEditingConnector({ ...editingConnector, codeName: e.target.value })}
                    placeholder="مثلاً: 48V MR"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">وضعیت انتشار (Role & State):</label>
                  <select
                    value={editingConnector.status || 'published'}
                    onChange={(e) => setEditingConnector({ ...editingConnector, status: e.target.value as PublicationStatus })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="published">منتشرشده (قابل مشاهده برای همه کاربران)</option>
                    <option value="verified">تأییدشده آزمایشگاهی</option>
                    <option value="pending">در انتظار بررسی تکنسین ارشد</option>
                    <option value="draft">پیش‌نویس (فقط برای مدیر)</option>
                    <option value="rejected">ردشده (دارای نقص جهت بازبینی)</option>
                    <option value="archived">بایگانی‌شده</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">رنگ پوسته سوکت:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingConnector.socketColor || ''}
                      onChange={(e) => setEditingConnector({ ...editingConnector, socketColor: e.target.value })}
                      placeholder="خاکستری، مشکی، قهوه‌ای..."
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                    />
                    <input
                      type="color"
                      value={editingConnector.socketColorHex || '#71717a'}
                      onChange={(e) => setEditingConnector({ ...editingConnector, socketColorHex: e.target.value })}
                      className="w-10 h-9 bg-zinc-950 border border-zinc-800 rounded-xl p-1 cursor-pointer shrink-0"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">تعداد ردیف و ستون در شماتیک سوکت:</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5">
                      <span className="text-zinc-400 text-xs font-semibold">ردیف:</span>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={editingConnector.rows === 0 ? '' : (editingConnector.rows ?? 4)}
                        onChange={(e) => handleRowsChange(e.target.value)}
                        className="w-12 bg-transparent text-white font-bold text-center focus:outline-none text-xs"
                        placeholder="ردیف"
                      />
                    </div>
                    <span className="text-zinc-500 font-bold">×</span>
                    <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5">
                      <span className="text-zinc-400 text-xs font-semibold">ستون:</span>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={editingConnector.cols === 0 ? '' : (editingConnector.cols ?? 8)}
                        onChange={(e) => handleColsChange(e.target.value)}
                        className="w-12 bg-transparent text-white font-bold text-center focus:outline-none text-xs"
                        placeholder="ستون"
                      />
                    </div>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/80 px-2.5 py-1.5 rounded-xl font-bold">
                      ظرفیت: {((editingConnector.rows || 4) * (editingConnector.cols || 8))} پایه
                    </span>
                  </div>
                </div>

                {gridResizeWarning && (
                  <div className="sm:col-span-2 p-3 rounded-xl bg-amber-950/70 border border-amber-800 text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{gridResizeWarning}</span>
                  </div>
                )}
              </div>

              {/* LIVE INTERACTIVE SOCKET PREVIEW */}
              <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/70 p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-white">
                      پیش‌نمایش زنده چیدمان سوکت ({((editingConnector.rows || 4) * (editingConnector.cols || 8))} موقعیت · {editingConnector.rows || 4} ردیف × {editingConnector.cols || 8} ستون)
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    لمس هر خانه برای انتخاب، ویرایش یا تکمیل سریع پایه
                  </span>
                </div>

                <InteractiveSocket
                  connector={{
                    id: editingConnector.id || 'draft-preview',
                    vehicleId: editingConnector.vehicleId || vehicles[0]?.id || 'peugeot-206',
                    name: editingConnector.name?.trim() || 'پیش‌نمایش سوکت',
                    codeName: editingConnector.codeName?.trim() || '',
                    category: editingConnector.category || 'ecu',
                    pinCount: (editingConnector.rows || 4) * (editingConnector.cols || 8),
                    rows: editingConnector.rows || 4,
                    cols: editingConnector.cols || 8,
                    shape: editingConnector.shape || 'grid',
                    socketColor: editingConnector.socketColor || 'خاکستری',
                    socketColorHex: editingConnector.socketColorHex || '#71717a',
                    source: 'پیش‌نمایش',
                    status: (editingConnector.status as PublicationStatus) || 'published',
                    pins: pinsList,
                    createdAt: Date.now()
                  }}
                  selectedPinId={selectedPreviewPinId}
                  onSelectPin={(pin) => {
                    handleStartEditPin(pin);
                  }}
                  onSelectEmptySlot={(slotAlpha) => {
                    handleCancelEditPin();
                    setNewPinNumber(slotAlpha);
                  }}
                />
              </div>

              {/* Image Upload for Socket using Media Modal */}
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block">تصویر سوکت و نقشه پیناوت:</label>
                  <p className="text-[11px] text-zinc-500">
                    {uploadedImageUrl || editingConnector.realImageUrl
                      ? 'تصویر متصل شد (مشاهده یا جایگزینی با فایل جدید)'
                      : 'بارگذاری نمای روبه‌رو، پشت و نقشه سوکت در فضای ابری'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMediaModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-xl transition"
                >
                  <ImageIcon className="w-4 h-4 text-red-400" />
                  <span>{uploadedImageUrl || editingConnector.realImageUrl ? 'تغییر تصویر سوکت' : 'بارگذاری تصویر'}</span>
                </button>
              </div>

              {/* Pins Section */}
              <div className="border-t border-zinc-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-zinc-200">
                    پایه‌های سوکت ({pinsList.length} پایه از {((editingConnector.rows || 4) * (editingConnector.cols || 8))} موقعیت تکمیل شده)
                  </h4>
                  {editingPinId && (
                    <button
                      type="button"
                      onClick={handleCancelEditPin}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      <span>انصراف از حالت ویرایش</span>
                    </button>
                  )}
                </div>

                {/* Inline alerts for pin form */}
                {pinFormError && (
                  <div className="mb-2 p-2.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{pinFormError}</span>
                  </div>
                )}
                {pinFormSuccess && (
                  <div className="mb-2 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{pinFormSuccess}</span>
                  </div>
                )}

                {/* Pin Input Bar */}
                <div className={`border rounded-xl p-3 flex flex-col gap-2 transition ${
                  editingPinId ? 'bg-amber-950/20 border-amber-800/80 ring-1 ring-amber-500/30' : 'bg-zinc-950 border-zinc-800'
                }`}>
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-800/80">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      {editingPinId ? (
                        <>
                          <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>در حال ویرایش مشخصات پایه «{newPinNumber}»</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-red-500" />
                          <span>ثبت پایه جدید برای سوکت</span>
                        </>
                      )}
                    </span>
                    <span className="text-[11px] text-zinc-500">شماره پایه، رنگ سیم، سیگنال و عملکرد</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-0.5">شماره یا کد پایه: *</label>
                      <input
                        type="text"
                        value={newPinNumber}
                        onChange={(e) => {
                          setNewPinNumber(e.target.value);
                          setPinFormError(null);
                        }}
                        placeholder="مثلاً A1 یا 15"
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-0.5">نوع سیگنال الکتریکی:</label>
                      <select
                        value={newPinSignal}
                        onChange={(e) => setNewPinSignal(e.target.value as SignalType)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white"
                      >
                        <option value="12V_BAT">+12V دائم باتری (خط ۳۰)</option>
                        <option value="12V_IGN">+12V سوئیچ (خط ۱۵)</option>
                        <option value="5V_REF">+5V رفرنس سنسور</option>
                        <option value="GROUND">اتصال بدنه / منفی (خط ۳۱)</option>
                        <option value="PWM_PULSE">سیگنال و پالس (PWM)</option>
                        <option value="ANALOG_IN">ورودی سیگنال آنالوگ سنسور</option>
                        <option value="CAN_BUS">شبکه کن‌باس (CAN-H/L)</option>
                        <option value="K_LINE">خط دیاگ (K-Line)</option>
                        <option value="DISCONNECTED">آزاد / بدون اتصال (NC)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-0.5">نام رنگ سیم:</label>
                      <input
                        type="text"
                        value={newPinColor}
                        onChange={(e) => setNewPinColor(e.target.value)}
                        placeholder="مثلاً سفید با خط مشکی"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-0.5">رنگ اصلی و خط سیم:</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={newPinHex}
                          onChange={(e) => setNewPinHex(e.target.value)}
                          className="w-8 h-8 rounded bg-zinc-900 border border-zinc-700 p-0.5 cursor-pointer shrink-0"
                          title="رنگ اصلی سیم"
                        />
                        <select
                          value={newPinStripeHex}
                          onChange={(e) => setNewPinStripeHex(e.target.value)}
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-1 py-1.5 text-white text-[11px]"
                        >
                          <option value="none">بدون خط</option>
                          <option value="#000000">خط مشکی</option>
                          <option value="#ffffff">خط سفید</option>
                          <option value="#ef4444">خط قرمز</option>
                          <option value="#eab308">خط زرد</option>
                          <option value="#22c55e">خط سبز</option>
                          <option value="#3b82f6">خط آبی</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-0.5">شرح عملکرد پایه در مدار:</label>
                      <input
                        type="text"
                        value={newPinFunction}
                        onChange={(e) => setNewPinFunction(e.target.value)}
                        placeholder="مثلاً: فرمان پاشش انژکتور سیلندر ۱ یا تغذیه رله دوبل"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-0.5">روش تست در تعمیرگاه و ولتاژ استاندارد:</label>
                      <input
                        type="text"
                        value={newPinTest}
                        onChange={(e) => setNewPinTest(e.target.value)}
                        placeholder="مثلاً: با مولتی‌متر ۱۲ ولت یا با اسیلوسکوپ موج پالس تست شود..."
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {editingPinId && (
                      <button
                        type="button"
                        onClick={handleCancelEditPin}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>انصراف</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddOrUpdatePin}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition ${
                        editingPinId
                          ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950'
                          : 'bg-red-600 hover:bg-red-500 text-white shadow-red-950'
                      }`}
                    >
                      {editingPinId ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>ذخیره تغییرات پایه</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>+ افزودن این پایه</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Pins List Preview with Edit & Delete */}
                <div className="mt-3 max-h-56 overflow-y-auto divide-y divide-zinc-800/80 bg-zinc-950/40 rounded-xl border border-zinc-800 px-2">
                  {pinsList.length === 0 ? (
                    <div className="py-4 text-center text-zinc-500 text-xs">
                      هنوز پایه‌ای برای این سوکت ثبت نشده است. از فرم بالا یا با لمس خانه‌های سوکت، پایه‌ها را اضافه کنید.
                    </div>
                  ) : (
                    pinsList.map((p) => {
                      const isBeingEdited = editingPinId === p.id;
                      return (
                        <div
                          key={p.id}
                          className={`py-2 px-1 flex items-center justify-between text-xs transition rounded-lg my-0.5 ${
                            isBeingEdited ? 'bg-amber-950/30 border border-amber-800/60' : 'hover:bg-zinc-900/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Pin Badge */}
                            <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-center min-w-[34px]">
                              {p.pinNumber}
                            </span>

                            {/* Color Tag */}
                            <div className="relative w-4 h-4 rounded-full overflow-hidden border border-zinc-700 shrink-0 shadow-xs">
                              <div
                                className="absolute inset-0"
                                style={{ backgroundColor: p.wireHex || '#52525b' }}
                              />
                              {p.wireStripeHex && (
                                <div
                                  className="absolute top-0 bottom-0 left-1 w-1.5"
                                  style={{ backgroundColor: p.wireStripeHex }}
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-zinc-200 truncate">{p.functionName}</span>
                                <span className="text-[10px] text-zinc-500 shrink-0">({p.wireColor})</span>
                              </div>
                              {p.testGuide && (
                                <p className="text-[11px] text-zinc-400 truncate">{p.testGuide}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 mr-2">
                            <button
                              type="button"
                              onClick={() => handleStartEditPin(p)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                              title="ویرایش این پایه"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePin(p.id)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-red-400 hover:text-red-300 transition"
                              title="حذف این پایه"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Save & Cancel */}
              <div className="flex items-center justify-end gap-2 border-t border-zinc-800 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingConnector(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSaveConnector}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md shadow-red-950 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره سوکت در بانک اطلاعاتی</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: VEHICLES */}
      {activeTab === 'vehicles' && (
        <VehicleManagerTab
          onRefreshData={onRefreshData}
          onOpenBulkImport={(type) => {
            setBulkInitialType(type);
            setIsBulkModalOpen(true);
          }}
        />
      )}

      {/* TAB 2: ECUS */}
      {activeTab === 'ecus' && (
        <EcuManagerTab
          onRefreshData={onRefreshData}
          onOpenBulkImport={(type) => {
            setBulkInitialType(type);
            setIsBulkModalOpen(true);
          }}
        />
      )}

      {/* TAB 5: MEDIA & DIAGRAMS */}
      {activeTab === 'media' && (
        <MediaManagerTab
          onRefreshData={onRefreshData}
          onOpenBulkImport={(type) => {
            setBulkInitialType(type);
            setIsBulkModalOpen(true);
          }}
        />
      )}

      {/* TAB 3: FUSEBOXES */}
      {activeTab === 'fuseboxes' && (
        <div className="flex flex-col gap-4">
          {fuseBoxSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{fuseBoxSuccessMsg}</span>
            </div>
          )}

          {!editingFuseBox ? (
            /* --- LIST VIEW --- */
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>بانک اطلاعات جعبه‌فیوزها ({fuseBoxes.length} مورد)</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    مدیریت مشخصات، نقشه‌های تعاملی، آمپراژ، فیوزها و رله‌های قدرت خودروها
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateNewFuseBox}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت جعبه‌فیوز جدید</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fuseBoxes.map(fb => {
                  const veh = vehicles.find(v => v.id === fb.vehicleId);
                  const locationLabels: Record<string, string> = {
                    cabin: 'داخل کابین',
                    engine: 'محفظه موتور',
                    battery: 'روی باتری',
                    trunk: 'صندوق عقب',
                    other: 'سایر محل‌ها'
                  };

                  return (
                    <div
                      key={fb.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-zinc-700 transition"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-white leading-snug">{fb.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 shrink-0">
                            {locationLabels[fb.location] || fb.locationFa}
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-400 mt-1">
                          {veh?.name || 'خودرو'} {fb.engineCode ? `· موتور ${fb.engineCode}` : ''} · {fb.locationFa}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-400">
                          <span className="font-mono text-amber-400">{fb.fuses?.length || 0} فیوز</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-indigo-400">{fb.relays?.length || 0} رله</span>
                          {(fb.realImageUrl || fb.coverDiagramUrl) && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-400">دارای تصویر نقشه</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-800/80 pt-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            handleStartEditFuseBox(fb);
                            setFuseBoxSubTab('hotspots');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                          title="تعیین موقعیت فیوزها و رله‌ها روی تصویر"
                        >
                          <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                          <span>تعیین موقعیت روی تصویر</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVersionModalState({
                            isOpen: true,
                            recordId: fb.id,
                            entityType: 'fusebox',
                            title: fb.name
                          })}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-purple-400 hover:text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition"
                          title="تاریخچه نسخه‌ها و تغییرات فنی"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>تاریخچه نسخه‌ها</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditFuseBox(fb)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span>ویرایش مشخصات</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingFuseBoxId(fb.id)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-red-400 hover:text-red-300 transition"
                          title="حذف جعبه‌فیوز"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* --- EDIT / CREATE FORM --- */
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 text-xs">
              {/* Form Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEditFuseBox}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {editingFuseBox.id && fuseBoxes.some(f => f.id === editingFuseBox.id)
                        ? `ویرایش جعبه‌فیوز: ${editingFuseBox.name || 'بدون عنوان'}`
                        : 'ثبت جعبه‌فیوز جدید'}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      مشخصات خودرو، نقشه‌های تصویری، تعریف فیوزها و کالیبراسیون نقاط لمسی
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEditFuseBox}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFuseBox}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md shadow-red-950 flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>ذخیره جعبه‌فیوز</span>
                  </button>
                </div>
              </div>

              {/* Rejection Banner if rejected */}
              {editingFuseBox.rejectionReason && (
                <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-red-300">علت رد این جعبه‌فیوز توسط مدیر فنی:</strong>
                    <p className="mt-1 leading-relaxed">{editingFuseBox.rejectionReason}</p>
                  </div>
                </div>
              )}

              {fuseBoxFormError && (
                <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{fuseBoxFormError}</span>
                </div>
              )}

              {/* Sub-Tabs */}
              <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setFuseBoxSubTab('info')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    fuseBoxSubTab === 'info'
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  اطلاعات کلی و مشخصات
                </button>
                <button
                  type="button"
                  onClick={() => setFuseBoxSubTab('images')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    fuseBoxSubTab === 'images'
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  تصاویر و نقشه‌ها
                </button>
                <button
                  type="button"
                  onClick={() => setFuseBoxSubTab('fuses')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    fuseBoxSubTab === 'fuses'
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  مدیریت فیوزها ({fuseBoxFuses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFuseBoxSubTab('relays')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    fuseBoxSubTab === 'relays'
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  مدیریت رله‌ها ({fuseBoxRelays.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFuseBoxSubTab('hotspots')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    fuseBoxSubTab === 'hotspots'
                      ? 'bg-amber-600 text-white shadow-xs font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5 text-amber-300" />
                  <span>تعیین موقعیت روی تصویر</span>
                </button>
              </div>

              {/* --- SUBTAB 1: INFO --- */}
              {fuseBoxSubTab === 'info' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">خودروی مربوطه: *</label>
                    <select
                      value={editingFuseBox.vehicleId || ''}
                      onChange={(e) => setEditingFuseBox({ ...editingFuseBox, vehicleId: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                    >
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.generation})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">عنوان و نام جعبه‌فیوز: *</label>
                    <input
                      type="text"
                      value={editingFuseBox.name || ''}
                      onChange={(e) => {
                        setEditingFuseBox({ ...editingFuseBox, name: e.target.value });
                        setFuseBoxFormError(null);
                      }}
                      placeholder="مثال: جعبه‌فیوز کالسکه روی باتری یا BM34"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">محل نصب جعبه‌فیوز: *</label>
                    <select
                      value={editingFuseBox.location || 'cabin'}
                      onChange={(e) => {
                        const loc = e.target.value as FuseBox['location'];
                        const locNames: Record<string, string> = {
                          cabin: 'داخل کابین (زیر داشبورد)',
                          engine: 'محفظه موتور',
                          battery: 'روی باتری (کالسکه)',
                          trunk: 'صندوق عقب',
                          other: 'سایر محل‌ها'
                        };
                        setEditingFuseBox({
                          ...editingFuseBox,
                          location: loc,
                          locationFa: locNames[loc] || 'داخل کابین'
                        });
                      }}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="cabin">داخل کابین / داشبورد</option>
                      <option value="engine">محفظه موتور</option>
                      <option value="battery">روی باتری (کالسکه)</option>
                      <option value="trunk">صندوق عقب</option>
                      <option value="other">سایر محل‌ها</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">توضیح محل نصب به فارسی:</label>
                    <input
                      type="text"
                      value={editingFuseBox.locationFa || ''}
                      onChange={(e) => setEditingFuseBox({ ...editingFuseBox, locationFa: e.target.value })}
                      placeholder="مثال: زیر قاب فرمان سمت چپ راننده"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">شرکت سازنده خودرو:</label>
                    <input
                      type="text"
                      value={editingFuseBox.manufacturer || ''}
                      onChange={(e) => setEditingFuseBox({ ...editingFuseBox, manufacturer: e.target.value })}
                      placeholder="مثال: ایران خودرو یا سایپا"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">مدل و سال‌های ساخت:</label>
                    <input
                      type="text"
                      value={editingFuseBox.modelYears || ''}
                      onChange={(e) => setEditingFuseBox({ ...editingFuseBox, modelYears: e.target.value })}
                      placeholder="مثال: ۱۳۸۲ تا ۱۴۰۱"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">تیپ خودرو:</label>
                    <input
                      type="text"
                      value={editingFuseBox.trim || ''}
                      onChange={(e) => setEditingFuseBox({ ...editingFuseBox, trim: e.target.value })}
                      placeholder="مثال: تیپ ۵، تیپ ۲، SX، دنده‌ای"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">کد موتور مربوطه:</label>
                    <input
                      type="text"
                      value={editingFuseBox.engineCode || ''}
                      onChange={(e) => setEditingFuseBox({ ...editingFuseBox, engineCode: e.target.value })}
                      placeholder="مثال: TU5JP4 یا XU7P یا M13"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">منبع اطلاعات و نقشه:</label>
                    <input
                      type="text"
                      value={editingFuseBox.source || ''}
                      onChange={(e) => setEditingFuseBox({ ...editingFuseBox, source: e.target.value })}
                      placeholder="مثال: نقشه فنی ساپکو و دفترچه پژو فرانسه"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">وضعیت انتشار و تایید:</label>
                    <select
                      value={editingFuseBox.status || 'published'}
                      onChange={(e) => setEditingFuseBox({ ...editingFuseBox, status: e.target.value as PublicationStatus })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="published">منتشر شده (عمومی)</option>
                      <option value="verified">تایید شده توسط مهندس ناظر</option>
                      <option value="pending">در انتظار بررسی تکنسین</option>
                      <option value="draft">پیش‌نویس (فقط مدیر)</option>
                      <option value="rejected">ردشده (دارای نقص جهت بازبینی)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="text-[11px] text-zinc-400 block mb-1">توضیحات و نکات فنی:</label>
                    <textarea
                      rows={2}
                      value={editingFuseBox.notes || ''}
                      onChange={(e) => setEditingFuseBox({ ...editingFuseBox, notes: e.target.value })}
                      placeholder="توضیحات در مورد مدارات، رله‌های داخلی، ماکسی‌فیوزها یا نحوه بازکردن قاب جعبه‌فیوز..."
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              )}

              {/* --- SUBTAB 2: IMAGES --- */}
              {fuseBoxSubTab === 'images' && (
                <div className="flex flex-col gap-4">
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-white">تصویر کلی و واقعی برد جعبه‌فیوز (Real Image)</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">تصویر رنگی مستقیم از برد و فیوزهای فیزیکی</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFuseBoxUploadTarget('realImageUrl');
                        setIsFuseBoxMediaModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg flex items-center gap-1.5 font-semibold"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>بارگذاری تصویر برد</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editingFuseBox.realImageUrl || ''}
                    onChange={(e) => setEditingFuseBox({ ...editingFuseBox, realImageUrl: e.target.value })}
                    placeholder="آدرس اینترنتی یا بارگذاری‌شده تصویر برد (https://...)"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                  />

                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-white">تصویر نقشه و دیاگرام درپوش (Cover Diagram)</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">نمای گرافیکی چاپ‌شده روی درپوش پلاستیکی جعبه‌فیوز</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFuseBoxUploadTarget('coverDiagramUrl');
                        setIsFuseBoxMediaModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg flex items-center gap-1.5 font-semibold"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>بارگذاری نقشه درپوش</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editingFuseBox.coverDiagramUrl || ''}
                    onChange={(e) => setEditingFuseBox({ ...editingFuseBox, coverDiagramUrl: e.target.value })}
                    placeholder="آدرس اینترنتی یا بارگذاری‌شده تصویر درپوش (https://...)"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                  />

                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-white">تصویر شماتیک یا رله‌ها (Layout / Schematic)</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">نقشه فنی اتصالات و موقعیت پایه‌های رله‌ها</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFuseBoxUploadTarget('diagramImageUrl');
                        setIsFuseBoxMediaModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg flex items-center gap-1.5 font-semibold"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>بارگذاری شماتیک</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editingFuseBox.diagramImageUrl || ''}
                    onChange={(e) => setEditingFuseBox({ ...editingFuseBox, diagramImageUrl: e.target.value })}
                    placeholder="آدرس تصویر شماتیک (https://...)"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                  />
                </div>
              )}

              {/* --- SUBTAB 3: FUSES --- */}
              {fuseBoxSubTab === 'fuses' && (
                <div className="flex flex-col gap-3">
                  {fuseItemError && (
                    <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{fuseItemError}</span>
                    </div>
                  )}

                  {/* Fuse Input Card */}
                  <div className={`p-3 rounded-xl border flex flex-col gap-2.5 ${
                    editingFuseId ? 'bg-amber-950/20 border-amber-800/80 ring-1 ring-amber-500/30' : 'bg-zinc-950 border-zinc-800'
                  }`}>
                    <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        {editingFuseId ? (
                          <>
                            <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>در حال ویرایش مشخصات فیوز «{newFuseCode}»</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 text-red-500" />
                            <span>افزودن فیوز جدید به این جعبه‌فیوز</span>
                          </>
                        )}
                      </span>
                      <span className="text-[11px] text-zinc-500">کد، آمپراژ استاندارد، عملکرد و نوع تغذیه</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">کد فیوز: *</label>
                        <input
                          type="text"
                          value={newFuseCode}
                          onChange={(e) => {
                            setNewFuseCode(e.target.value);
                            setFuseItemError(null);
                          }}
                          placeholder="مثلاً F15 یا MF2"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">آمپراژ استاندارد: *</label>
                        <select
                          value={newFuseAmps}
                          onChange={(e) => setNewFuseAmps(Number(e.target.value))}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                        >
                          <option value={2}>2 آمپر (خاکستری)</option>
                          <option value={3}>3 آمپر (بنفش)</option>
                          <option value={5}>5 آمپر (بژ / کرم روشن)</option>
                          <option value={7.5}>7.5 آمپر (قهوه‌ای)</option>
                          <option value={10}>10 آمپر (قرمز)</option>
                          <option value={15}>15 آمپر (آبی کاربنی استاندارد)</option>
                          <option value={20}>20 آمپر (زرد قناری)</option>
                          <option value={25}>25 آمپر (سفید / شفاف)</option>
                          <option value={30}>30 آمپر (سبز)</option>
                          <option value={40}>40 آمپر (نارنجی / کهربایی)</option>
                          <option value={50}>50 آمپر (قرمز ماکسی)</option>
                          <option value={60}>60 آمپر (آبی ماکسی)</option>
                          <option value={70}>70 آمپر (برنزی ماکسی)</option>
                          <option value={80}>80 آمپر (بی‌رنگ ماکسی)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">نوع فیوز خودرویی:</label>
                        <select
                          value={newFuseType || 'standard'}
                          onChange={(e) => setNewFuseType(e.target.value as Fuse['fuseType'])}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                        >
                          <option value="standard">تیغه‌ای معمولی (ATO / ATC)</option>
                          <option value="mini">مینی تیغه‌ای (Mini / Low-Profile)</option>
                          <option value="maxi">ماکسی تیغه‌ای (Maxi فیوز قدرت)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">نوع تغذیه الکتریکی:</label>
                        <select
                          value={newFuseSupply}
                          onChange={(e) => setNewFuseSupply(e.target.value as FuseSupplyType)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                        >
                          <option value="+30 (دائم باتری)">+30 (دائم باتری)</option>
                          <option value="+15 (سوئیچ باز)">+15 (سوئیچ باز)</option>
                          <option value="ACC (تجهیزات)">ACC (تجهیزات و رادیو)</option>
                          <option value="+58 (چراغ‌ها)">+58 (چراغ‌های کوچک)</option>
                          <option value="+50 (استارت)">+50 (خط تحریک استارت)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">رنگ استاندارد فیوز:</label>
                        {(() => {
                          const fc = getFuseColor(newFuseAmps, newFuseType);
                          return (
                            <div
                              className={`h-[34px] px-2.5 rounded-lg border ${fc.bg} ${fc.text} ${fc.border} flex items-center justify-between text-xs font-bold`}
                            >
                              <span>{newFuseAmps}A</span>
                              <span className="text-[10px] font-normal">{fc.colorNameFa}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-1">
                        <label className="text-[11px] text-zinc-400 block mb-0.5">نام قطعه / عملکرد اصلی: *</label>
                        <input
                          type="text"
                          value={newFuseFunction}
                          onChange={(e) => setNewFuseFunction(e.target.value)}
                          placeholder="مثلاً: پمپ بنزین و انژکتورها"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="text-[11px] text-zinc-400 block mb-0.5">مدار و قطعات تحت پوشش:</label>
                        <input
                          type="text"
                          value={newFuseCircuit}
                          onChange={(e) => setNewFuseCircuit(e.target.value)}
                          placeholder="مثلاً: تغذیه بوبین رله پمپ بنزین، گرمکن سنسور اکسیژن"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="text-[11px] text-zinc-400 block mb-0.5">نکات تست و عیب‌یابی در تعمیرگاه:</label>
                        <input
                          type="text"
                          value={newFuseTest}
                          onChange={(e) => setNewFuseTest(e.target.value)}
                          placeholder="مثلاً: در صورت سوختن این فیوز ماشین روشن نمی‌شود"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800">
                      {editingFuseId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFuseId(null);
                            setNewFuseFunction('');
                            setNewFuseCircuit('');
                            setNewFuseTest('');
                          }}
                          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                        >
                          انصراف از ویرایش
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleAddOrUpdateFuseItem}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                      >
                        {editingFuseId ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        <span>{editingFuseId ? 'ذخیره تغییرات فیوز' : '+ افزودن این فیوز'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Fuses List */}
                  <div className="max-h-64 overflow-y-auto divide-y divide-zinc-800/80 bg-zinc-950/40 rounded-xl border border-zinc-800 px-2">
                    {fuseBoxFuses.length === 0 ? (
                      <div className="py-4 text-center text-zinc-500 text-xs">
                        هنوز فیوزی برای این جعبه‌فیوز ثبت نشده است. از فرم بالا برای افزودن فیوز استفاده کنید.
                      </div>
                    ) : (
                      fuseBoxFuses.map(f => {
                        const fc = getFuseColor(f.ratingAmps, f.fuseType);
                        return (
                          <div key={f.id} className="py-2 px-1 flex items-center justify-between text-xs hover:bg-zinc-900/60 rounded-lg my-0.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 min-w-[36px] text-center">
                                {f.code}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black border ${fc.bg} ${fc.text} ${fc.border} tabular-nums`}
                              >
                                {f.ratingAmps}A
                              </span>
                              <span className="text-[10px] text-zinc-400 hidden md:inline">
                                {fc.colorNameFa}
                              </span>
                              <div className="min-w-0">
                                <span className="font-semibold text-zinc-200 truncate block">{f.functionName}</span>
                                <span className="text-[10px] text-zinc-500 truncate block">{f.circuitDetails}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 mr-2">
                              {f.xPercent !== undefined ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-[10px] text-emerald-300 flex items-center gap-1 font-medium">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>موقعیت ثبت‌شده</span>
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700 text-[10px] text-zinc-500">
                                  بدون موقعیت
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleStartEditFuseItem(f)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                                title="ویرایش فیوز"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveFuseItem(f.id)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-red-400"
                                title="حذف فیوز"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* --- SUBTAB 4: RELAYS --- */}
              {fuseBoxSubTab === 'relays' && (
                <div className="flex flex-col gap-3">
                  {relayItemError && (
                    <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{relayItemError}</span>
                    </div>
                  )}

                  {/* Relay Input Card */}
                  <div className={`p-3 rounded-xl border flex flex-col gap-2.5 ${
                    editingRelayId ? 'bg-indigo-950/20 border-indigo-800/80 ring-1 ring-indigo-500/30' : 'bg-zinc-950 border-zinc-800'
                  }`}>
                    <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        {editingRelayId ? (
                          <>
                            <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>در حال ویرایش مشخصات رله «{newRelayCode}»</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 text-indigo-500" />
                            <span>افزودن رله قدرت جدید</span>
                          </>
                        )}
                      </span>
                      <span className="text-[11px] text-zinc-500">کد، جریان نامی کنتاکت، ولتاژ بوبین و پایه‌ها</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">کد رله: *</label>
                        <input
                          type="text"
                          value={newRelayCode}
                          onChange={(e) => {
                            setNewRelayCode(e.target.value);
                            setRelayItemError(null);
                          }}
                          placeholder="مثلاً R1 یا رله دوبل"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">عنوان و نام رله: *</label>
                        <input
                          type="text"
                          value={newRelayName}
                          onChange={(e) => setNewRelayName(e.target.value)}
                          placeholder="مثلاً: رله پمپ بنزین یا رله بوق"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">جریان نامی کنتاکت: *</label>
                        <select
                          value={newRelayContactAmps}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setNewRelayContactAmps(val);
                            setNewRelayRating(`${newRelayCoilVoltage || '12V'} ${val}A`);
                          }}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white font-bold text-xs"
                        >
                          <option value={10}>10 آمپر (کنترل سیگنال / کم‌توان)</option>
                          <option value={15}>15 آمپر (تجهیزات و اکسسوری)</option>
                          <option value={20}>20 آمپر (مه‌شکن / چراغ‌ها)</option>
                          <option value={30}>30 آمپر (استاندارد بوق / پمپ بنزین)</option>
                          <option value={40}>40 آمپر (قدرت فن خنک‌کننده / استارت)</option>
                          <option value={50}>50 آمپر (فن دور تند / گرمکن شیشه)</option>
                          <option value={70}>70 آمپر (رله قدرت صنعتی و استارت)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">نوع بدنه رله:</label>
                        <select
                          value={newRelayType || 'cube_4pin'}
                          onChange={(e) => setNewRelayType(e.target.value as Relay['relayType'])}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                        >
                          <option value="cube_4pin">مکعبی ۴ پایه (NO)</option>
                          <option value="cube_5pin">مکعبی ۵ پایه چنج‌اور (Changeover)</option>
                          <option value="micro">میکرو رله (Micro ISO)</option>
                          <option value="mini">مینی رله (Mini ISO)</option>
                          <option value="double">رله دوبل (انژکتوری پژو/پراید)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">رنگ کالیبراسیون رله:</label>
                        {(() => {
                          const rc = getRelayColor(newRelayContactAmps, `${newRelayContactAmps}A`);
                          return (
                            <div
                              className={`h-[34px] px-2.5 rounded-lg border ${rc.bg} ${rc.text} ${rc.border} flex items-center justify-between text-xs font-bold`}
                            >
                              <span>{newRelayContactAmps}A</span>
                              <span className="text-[10px] font-normal">{rc.rangeFa}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">ولتاژ بوبین تحریک:</label>
                        <input
                          type="text"
                          value={newRelayCoilVoltage}
                          onChange={(e) => {
                            setNewRelayCoilVoltage(e.target.value);
                            setNewRelayRating(`${e.target.value} ${newRelayContactAmps}A`);
                          }}
                          placeholder="12V DC"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">پایه‌های بوبین (Coil):</label>
                        <input
                          type="text"
                          value={newRelayCoil}
                          onChange={(e) => setNewRelayCoil(e.target.value)}
                          placeholder="85 و 86"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">پایه‌های کنتاکت قدرت (Contact):</label>
                        <input
                          type="text"
                          value={newRelayContact}
                          onChange={(e) => setNewRelayContact(e.target.value)}
                          placeholder="30 و 87 (و 87a)"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">عملکرد در مدار خودرو:</label>
                        <input
                          type="text"
                          value={newRelayFunction}
                          onChange={(e) => setNewRelayFunction(e.target.value)}
                          placeholder="مثلاً برق‌رسانی به پمپ سوخت"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">مدار و سیم‌کشی مرتبط:</label>
                        <input
                          type="text"
                          value={newRelayCircuit}
                          onChange={(e) => setNewRelayCircuit(e.target.value)}
                          placeholder="مثلاً: خروجی به فیوز F15 و انژکتورها"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">روش تست سلامت رله:</label>
                        <input
                          type="text"
                          value={newRelayDiag}
                          onChange={(e) => setNewRelayDiag(e.target.value)}
                          placeholder="تست صدای کلیک با ۱۲ ولت و سنجش مقاومت کنتاکت"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800">
                      {editingRelayId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRelayId(null);
                            setNewRelayName('');
                            setNewRelayFunction('');
                            setNewRelayCircuit('');
                            setNewRelayDiag('');
                          }}
                          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                        >
                          انصراف از ویرایش
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleAddOrUpdateRelayItem}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                      >
                        {editingRelayId ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        <span>{editingRelayId ? 'ذخیره تغییرات رله' : '+ افزودن این رله'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Relays List */}
                  <div className="max-h-64 overflow-y-auto divide-y divide-zinc-800/80 bg-zinc-950/40 rounded-xl border border-zinc-800 px-2">
                    {fuseBoxRelays.length === 0 ? (
                      <div className="py-4 text-center text-zinc-500 text-xs">
                        هنوز رله‌ای ثبت نشده است. از فرم بالا رله‌های قدرت را اضافه نمایید.
                      </div>
                    ) : (
                      fuseBoxRelays.map(r => {
                        const rc = getRelayColor(r.contactAmps, r.rating);
                        return (
                          <div key={r.id} className="py-2 px-1 flex items-center justify-between text-xs hover:bg-zinc-900/60 rounded-lg my-0.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 min-w-[36px] text-center">
                                {r.code}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black border ${rc.bg} ${rc.text} ${rc.border} tabular-nums`}
                              >
                                {rc.amps ? `${rc.amps}A` : r.rating || 'رله قدرت'}
                              </span>
                              <span className="text-[10px] text-zinc-400 hidden md:inline">
                                {rc.rangeFa}
                              </span>
                              <div className="min-w-0">
                                <span className="font-semibold text-zinc-200 truncate block">{r.name}</span>
                                <span className="text-[10px] text-zinc-500 truncate block">تحریک: {r.coilPins || 'نامشخص'} | سوئیچ: {r.contactPins || 'نامشخص'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 mr-2">
                              {r.xPercent !== undefined ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-[10px] text-emerald-300 flex items-center gap-1 font-medium">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>موقعیت ثبت‌شده</span>
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700 text-[10px] text-zinc-500">
                                  بدون موقعیت
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleStartEditRelayItem(r)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                                title="ویرایش رله"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveRelayItem(r.id)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-red-400"
                                title="حذف رله"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* --- SUBTAB 5: HOTSPOTS CALIBRATION --- */}
              {fuseBoxSubTab === 'hotspots' && (
                <div className="flex flex-col gap-3">
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <span className="text-zinc-200 font-bold flex items-center gap-2">
                      <Crosshair className="w-4 h-4 text-amber-400" />
                      <span>تعیین و کالیبراسیون موقعیت فیوزها و رله‌ها روی صفحه مشکی تعاملی</span>
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      موقعیت‌ها کاملاً روی صفحه مشکی ذخیره می‌شوند و مستقل از تصاویر آپلودشده هستند
                    </span>
                  </div>

                  <InteractiveFuseHotspots
                    fuseBox={{
                      id: editingFuseBox.id || 'temp',
                      vehicleId: editingFuseBox.vehicleId || '',
                      name: editingFuseBox.name || 'پیش‌نمایش جعبه‌فیوز',
                      location: editingFuseBox.location || 'cabin',
                      locationFa: editingFuseBox.locationFa || '',
                      realImageUrl: editingFuseBox.realImageUrl,
                      coverDiagramUrl: editingFuseBox.coverDiagramUrl,
                      diagramImageUrl: editingFuseBox.diagramImageUrl,
                      source: editingFuseBox.source || '',
                      fuses: fuseBoxFuses,
                      relays: fuseBoxRelays
                    }}
                    selectedFuse={hotspotSelectedFuse}
                    selectedRelay={hotspotSelectedRelay}
                    onSelectFuse={(f) => {
                      setHotspotSelectedFuse(f);
                      setHotspotSelectedRelay(null);
                    }}
                    onSelectRelay={(r) => {
                      setHotspotSelectedRelay(r);
                      setHotspotSelectedFuse(null);
                    }}
                    isAdmin={true}
                    isCalibratingMode={true}
                    onToggleCalibrateMode={() => {}}
                    onUpdateFusePosition={handleUpdateFuseBoxHotspot}
                    onUpdateRelayPosition={handleUpdateRelayHotspot}
                    onClearPosition={handleClearHotspotPosition}
                    onSavePositions={handleSaveFuseBox}
                    onRevertPositions={handleRevertHotspots}
                    onNavigateToFusesTab={() => setFuseBoxSubTab('fuses')}
                  />
                </div>
              )}

              {/* Save / Cancel Bottom Bar */}
              <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                <span className="text-[11px] text-zinc-400">
                  تعداد فیوزها: {fuseBoxFuses.length} · تعداد رله‌ها: {fuseBoxRelays.length}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEditFuseBox}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFuseBox}
                    className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md shadow-red-950 flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>ذخیره جعبه‌فیوز در بانک اطلاعاتی</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CLOUD SYNC */}
      {activeTab === 'cloud_sync' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">همگام‌سازی ابری و بارگذاری اولیه داده‌ها در Firestore</h3>
              <p className="text-[11px] text-zinc-400">انتقال تمام اطلاعات خودروها، سوکت‌های پژو ۲۰۶، پراید و سنسورها به پایگاه داده ابری</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <p className="text-zinc-300 leading-relaxed">
              با فشردن دکمه زیر، کلیه اطلاعات فنی و استاندارد تاییدشده (شامل پیناوت‌های بوش ME7.4.4، زیمنس VDO پراید، رله دوبل، سنسور اکسیژن و نقشه‌های جعبه‌فیوز) در پایگاه داده ابری Cloud Firestore ذخیره می‌شوند تا به صورت همزمان برای تمام تعمیرکاران و دستگاه‌های متصل در دسترس قرار گیرند.
            </p>

            <button
              onClick={handleSeedCloudDatabase}
              disabled={isSeeding}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-red-950"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال انتقال داده‌ها به سرور ابری...</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span>بارگذاری و مقداردهی اولیه داده‌ها در Cloud Firestore</span>
                </>
              )}
            </button>
          </div>

          {seedSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{seedSuccessMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* TAB: APPROVAL WORKFLOW */}
      {activeTab === 'approvals' && (
        <ApprovalWorkflowTab
          onRefreshData={onRefreshData}
          onNavigateToTab={(tab) => {
            setActiveTab(tab);
            setEditingConnector(null);
          }}
        />
      )}

      {/* TAB: QUALITY CONTROL */}
      {activeTab === 'quality_control' && (
        <QualityControlTab
          onNavigateToTab={(tab) => {
            setActiveTab(tab);
            setEditingConnector(null);
          }}
          onRefreshData={onRefreshData}
        />
      )}

      {/* TAB 5: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <BackupRestoreTab onRefreshData={onRefreshData} />
      )}

      {/* TAB 6: TECHNICAL DATA VERSIONS & AUDIT LOG */}
      {activeTab === 'versions' && (
        <TechnicalVersionsTab onRefreshData={onRefreshData} />
      )}

      {/* TAB 7: USER MANAGEMENT & ACCESS CONTROL */}
      {activeTab === 'users' && (
        <UserManagerTab onRefreshData={onRefreshData} />
      )}

      {/* TAB 8: IN-APP BROADCAST NOTIFICATIONS */}
      {activeTab === 'broadcasts' && (
        <BroadcastManagerTab onRefreshData={onRefreshData} />
      )}

      {/* TAB 9: AUDIT LOG (گزارش فعالیت‌های مدیریتی) */}
      {activeTab === 'audit_logs' && (
        <AuditLogTab onRefreshData={onRefreshData} />
      )}

      {/* TAB 10: PROFESSIONAL LICENSE ADMINISTRATION CENTER (10 SECTIONS) */}
      {activeTab === 'licenses' && (
        <LicenseAdminPanel onBack={() => setActiveTab('vehicles')} />
      )}

      {/* Media Upload Modal for Connectors */}
      {editingConnector && (
        <MediaUploadModal
          isOpen={isMediaModalOpen}
          onClose={() => setIsMediaModalOpen(false)}
          entityType="connector"
          entityId={editingConnector.id || 'temp'}
          entityName={editingConnector.name || 'سوکت جدید'}
          onMediaUploaded={(media) => {
            setUploadedImageUrl(media.fileUrl);
            setEditingConnector({
              ...editingConnector,
              realImageUrl: media.fileUrl
            });
          }}
        />
      )}

      {/* Media Upload Modal for FuseBoxes */}
      {editingFuseBox && (
        <MediaUploadModal
          isOpen={isFuseBoxMediaModalOpen}
          onClose={() => setIsFuseBoxMediaModalOpen(false)}
          entityType="fusebox"
          entityId={editingFuseBox.id || 'temp-fb'}
          entityName={editingFuseBox.name || 'جعبه‌فیوز'}
          onMediaUploaded={(media) => {
            setEditingFuseBox({
              ...editingFuseBox,
              [fuseBoxUploadTarget]: media.fileUrl
            });
            setIsFuseBoxMediaModalOpen(false);
          }}
        />
      )}

      {/* Safe Delete Confirmation for FuseBox */}
      {deletingFuseBoxId && (
        <DeleteConfirmModal
          isOpen={Boolean(deletingFuseBoxId)}
          onClose={() => setDeletingFuseBoxId(null)}
          onConfirm={() => handleDeleteFuseBoxConfirmed(deletingFuseBoxId)}
          entityType="fusebox"
          entityId={deletingFuseBoxId}
          entityTitle={fuseBoxes.find(f => f.id === deletingFuseBoxId)?.name || 'جعبه‌فیوز'}
        />
      )}

      {/* Safe Delete Confirmation for Connector */}
      {deletingConnector && (
        <DeleteConfirmModal
          isOpen={Boolean(deletingConnector)}
          onClose={() => setDeletingConnector(null)}
          onConfirm={async () => {
            storage.deleteConnector(deletingConnector.id);
            if (isAdmin && isOnlineDbConnected) {
              try {
                await onlineStorage.deleteConnector(deletingConnector.id);
              } catch (e) {
                console.warn(e);
              }
            }
            setDeletingConnector(null);
            onRefreshData?.();
          }}
          entityType="connector"
          entityId={deletingConnector.id}
          entityTitle={deletingConnector.name}
        />
      )}

      {/* Bulk Import / Export Modal */}
      <BulkImportExportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onRefreshData={onRefreshData}
        initialEntityType={bulkInitialType}
      />

      {/* Version History & Diff Modal */}
      {versionModalState && (
        <VersionHistoryModal
          isOpen={versionModalState.isOpen}
          onClose={() => setVersionModalState(null)}
          recordId={versionModalState.recordId}
          entityType={versionModalState.entityType}
          recordTitle={versionModalState.title}
          onDataRestored={() => {
            onRefreshData?.();
          }}
        />
      )}
    </div>
  );
};

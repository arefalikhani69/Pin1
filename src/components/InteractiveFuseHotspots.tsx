import React, { useRef, useState, useEffect } from 'react';
import { FuseBox, Fuse, Relay } from '../types';
import {
  Plus,
  Check,
  Info,
  Cpu,
  Zap,
  Trash2,
  Crosshair,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  Sliders,
  Layers,
  HelpCircle
} from 'lucide-react';
import { getFuseColor, getRelayColor } from '../utils/fuseColors';

interface InteractiveFuseHotspotsProps {
  fuseBox: FuseBox;
  imageUrl?: string; // Retained for compatibility, intentionally not rendered as canvas background
  selectedFuse: Fuse | null;
  selectedRelay?: Relay | null;
  onSelectFuse: (fuse: Fuse) => void;
  onSelectRelay?: (relay: Relay) => void;
  isAdmin?: boolean;
  isCalibratingMode?: boolean;
  onToggleCalibrateMode?: (active: boolean) => void;
  onUpdateFusePosition?: (fuseId: string, xPercent: number, yPercent: number) => void;
  onUpdateRelayPosition?: (relayId: string, xPercent: number, yPercent: number) => void;
  onClearPosition?: (type: 'fuse' | 'relay', id: string) => void;
  onSavePositions?: () => Promise<void> | void;
  onRevertPositions?: () => void;
  onNavigateToFusesTab?: () => void;
}

export const InteractiveFuseHotspots: React.FC<InteractiveFuseHotspotsProps> = ({
  fuseBox,
  selectedFuse,
  selectedRelay,
  onSelectFuse,
  onSelectRelay,
  isAdmin = false,
  isCalibratingMode = false,
  onToggleCalibrateMode,
  onUpdateFusePosition,
  onUpdateRelayPosition,
  onClearPosition,
  onSavePositions,
  onRevertPositions,
  onNavigateToFusesTab
}) => {
  const boardRef = useRef<HTMLDivElement>(null);

  // Calibration target selection state
  const [targetType, setTargetType] = useState<'fuse' | 'relay'>('fuse');
  const [targetItemId, setTargetItemId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ text: string; type: 'info' | 'success' | 'warning' } | null>(null);
  const [filterUnplacedOnly, setFilterUnplacedOnly] = useState(false);

  // Synchronize target selection if selectedFuse or selectedRelay changes from outside
  useEffect(() => {
    if (selectedFuse) {
      setTargetType('fuse');
      setTargetItemId(selectedFuse.id);
    } else if (selectedRelay) {
      setTargetType('relay');
      setTargetItemId(selectedRelay.id);
    }
  }, [selectedFuse, selectedRelay]);

  // Set default target item when entering calibration mode
  useEffect(() => {
    if (isCalibratingMode && !targetItemId) {
      if (targetType === 'fuse' && fuseBox.fuses.length > 0) {
        setTargetItemId(fuseBox.fuses[0].id);
      } else if (targetType === 'relay' && fuseBox.relays.length > 0) {
        setTargetItemId(fuseBox.relays[0].id);
      }
    }
  }, [isCalibratingMode, targetType, fuseBox.fuses, fuseBox.relays, targetItemId]);

  // Active item objects
  const activeSelectedFuse = fuseBox.fuses.find(f => f.id === targetItemId);
  const activeSelectedRelay = fuseBox.relays.find(r => r.id === targetItemId);
  const activeItem = targetType === 'fuse' ? activeSelectedFuse : activeSelectedRelay;

  // Handle Touch/Pointer down on the black interactive board
  const handleBoardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;

    if (!isCalibratingMode) {
      return;
    }

    // Prevent default scrolling gesture on touch devices during calibration
    e.preventDefault();

    if (!targetItemId) {
      setStatusNotice({
        text: 'لطفاً ابتدا از فهرست زیر، یک فیوز یا رله را انتخاب نموده و سپس روی صفحه ضربه بزنید.',
        type: 'warning'
      });
      return;
    }

    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rawXPercent = (x / rect.width) * 100;
    const rawYPercent = (y / rect.height) * 100;

    // Constrain safely within 2% to 98%
    const xPercent = Number(Math.max(2, Math.min(98, rawXPercent)).toFixed(1));
    const yPercent = Number(Math.max(2, Math.min(98, rawYPercent)).toFixed(1));

    if (targetType === 'fuse') {
      onUpdateFusePosition?.(targetItemId, xPercent, yPercent);
      const fuse = fuseBox.fuses.find(f => f.id === targetItemId);
      setStatusNotice({
        text: `موقعیت فیوز «${fuse?.code || ''}» روی صفحه ثبت شد. برای جابه‌جایی، نقطه دیگری را لمس کنید.`,
        type: 'success'
      });
    } else {
      onUpdateRelayPosition?.(targetItemId, xPercent, yPercent);
      const relay = fuseBox.relays.find(r => r.id === targetItemId);
      setStatusNotice({
        text: `موقعیت رله «${relay?.code || ''}» روی صفحه ثبت شد. برای جابه‌جایی، نقطه دیگری را لمس کنید.`,
        type: 'success'
      });
    }
  };

  const handleSave = async () => {
    if (!onSavePositions) return;
    setIsSaving(true);
    try {
      await onSavePositions();
      setStatusNotice({
        text: 'کلیه موقعیت‌های فیوزها و رله‌ها با موفقیت ذخیره شدند.',
        type: 'success'
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ذخیره‌سازی موقعیت‌ها';
      setStatusNotice({
        text: `خطا در ذخیره‌سازی: ${msg}`,
        type: 'warning'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Group items by placement status
  const placedFuses = fuseBox.fuses.filter(f => f.xPercent !== undefined && f.yPercent !== undefined);
  const unplacedFuses = fuseBox.fuses.filter(f => f.xPercent === undefined || f.yPercent === undefined);
  const placedRelays = fuseBox.relays.filter(r => r.xPercent !== undefined && r.yPercent !== undefined);
  const unplacedRelays = fuseBox.relays.filter(r => r.xPercent === undefined || r.yPercent === undefined);

  const totalItemsCount = fuseBox.fuses.length + fuseBox.relays.length;
  const totalPlacedCount = placedFuses.length + placedRelays.length;
  const totalUnplacedCount = unplacedFuses.length + unplacedRelays.length;

  return (
    <div className="flex flex-col gap-3 text-right" dir="rtl">
      {/* --- TOP ADMIN CALIBRATION BAR --- */}
      {isAdmin && (
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col gap-3 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleCalibrateMode?.(!isCalibratingMode)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                  isCalibratingMode
                    ? 'bg-amber-500 text-zinc-950 shadow-amber-500/30'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                }`}
              >
                <Crosshair className={`w-4 h-4 ${isCalibratingMode ? 'animate-spin' : ''}`} />
                <span>{isCalibratingMode ? 'در حال تعیین موقعیت روی صفحه مشکی' : 'تعیین موقعیت روی صفحه مشکی'}</span>
              </button>

              <span className="text-[11px] text-zinc-300 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 font-mono">
                {totalPlacedCount} از {totalItemsCount} دارای موقعیت
              </span>
            </div>

            {isCalibratingMode && (
              <div className="flex items-center gap-1.5">
                {onRevertPositions && (
                  <button
                    type="button"
                    onClick={onRevertPositions}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1 transition"
                    title="لغو تغییرات ذخیره‌نشده"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">لغو تغییرات</span>
                  </button>
                )}

                {onSavePositions && (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'در حال ذخیره...' : 'ذخیره موقعیت‌ها'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onToggleCalibrateMode?.(false)}
                  className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                  title="خروج از حالت ویرایش"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Sub-toolbar when Calibration Mode is Active */}
          {isCalibratingMode && (
            <div className="pt-2.5 border-t border-zinc-800 flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Type Switcher */}
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType('fuse');
                      const first = fuseBox.fuses[0];
                      if (first) {
                        setTargetItemId(first.id);
                        onSelectFuse(first);
                      }
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      targetType === 'fuse' ? 'bg-red-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>فیوزها ({fuseBox.fuses.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType('relay');
                      const first = fuseBox.relays[0];
                      if (first) {
                        setTargetItemId(first.id);
                        onSelectRelay?.(first);
                      }
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      targetType === 'relay' ? 'bg-indigo-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>رله‌ها ({fuseBox.relays.length})</span>
                  </button>
                </div>

                {/* Clear Active Item Position Button */}
                {activeItem && (activeItem.xPercent !== undefined) && onClearPosition && (
                  <button
                    type="button"
                    onClick={() => {
                      if (targetType === 'fuse' && activeSelectedFuse) {
                        onClearPosition('fuse', activeSelectedFuse.id);
                        setStatusNotice({
                          text: `موقعیت فیوز «${activeSelectedFuse.code}» پاک شد و به لیست بدون موقعیت انتقال یافت.`,
                          type: 'info'
                        });
                      } else if (activeSelectedRelay) {
                        onClearPosition('relay', activeSelectedRelay.id);
                        setStatusNotice({
                          text: `موقعیت رله «${activeSelectedRelay.code}» پاک شد و به لیست بدون موقعیت انتقال یافت.`,
                          type: 'info'
                        });
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-red-950/80 text-zinc-300 hover:text-red-300 border border-zinc-700 hover:border-red-800 text-[11px] font-medium flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                    <span>حذف موقعیت این قطعه</span>
                  </button>
                )}
              </div>

              {/* Active Item Banner */}
              {activeItem && (
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-amber-500/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-zinc-300">قطعه در حال تعیین موقعیت:</span>
                    <span className="font-bold text-white font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                      {activeItem.code}
                    </span>
                    <span className="text-zinc-400 truncate max-w-[200px]">
                      {targetType === 'fuse'
                        ? activeSelectedFuse?.functionName || ''
                        : activeSelectedRelay?.name || ''}
                    </span>
                  </div>

                  <span className="text-[11px] text-amber-300 font-medium">
                    {activeItem.xPercent !== undefined ? 'محل جدید را لمس کنید' : 'روی صفحه مشکی لمس کنید تا ثبت شود'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Status Notice Toast */}
      {statusNotice && (
        <div
          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-md ${
            statusNotice.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
              : statusNotice.type === 'warning'
                ? 'bg-amber-950/80 border-amber-700 text-amber-200'
                : 'bg-zinc-900 border-zinc-700 text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : statusNotice.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <span>{statusNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="p-1 rounded hover:bg-black/30 text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* --- MAIN PURE BLACK INTERACTIVE BOARD --- */}
      <div className="relative flex flex-col rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-black">
        {/* Board Top Header Strip */}
        <div className="px-4 py-2.5 bg-zinc-950 border-b border-zinc-800/90 flex items-center justify-between text-xs select-none">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <span className="font-bold text-zinc-200">{fuseBox.name}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">{fuseBox.locationFa}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              INTERACTIVE BOARD
            </span>
          </div>
        </div>

        {/* The Black Interactive Canvas (Stable aspect ratio 16:10 for rock-solid coordinate invariance) */}
        <div
          ref={boardRef}
          onPointerDown={handleBoardPointerDown}
          className={`relative w-full aspect-[16/10] min-h-[380px] sm:min-h-[480px] max-h-[640px] bg-black select-none ${
            isCalibratingMode ? 'cursor-crosshair ring-2 ring-amber-500/80 ring-inset' : 'cursor-default'
          }`}
          style={{
            touchAction: 'none' // Crucial for Android: prevents touch scrolling gestures from interfering with calibration
          }}
        >
          {/* Subtle Technical Ground Pattern & Border Alignment */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#52525b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          {/* Module Border Guidelines (Subtle dark aesthetic) */}
          <div className="absolute inset-3 rounded-xl border border-dashed border-zinc-900 pointer-events-none" />

          {/* Calibration Alignment Grid in Edit Mode */}
          {isCalibratingMode && (
            <svg
              className="w-full h-full absolute inset-0 pointer-events-none opacity-20"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern id="calibGridBlack" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f59e0b" strokeWidth="0.25" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#calibGridBlack)" />
            </svg>
          )}

          {/* PLACED FUSES HOTSPOTS */}
          {placedFuses.map(fuse => {
            const isTargetActive = isCalibratingMode && targetType === 'fuse' && targetItemId === fuse.id;
            const isSelected = selectedFuse?.id === fuse.id;
            const fuseColor = getFuseColor(fuse.ratingAmps, fuse.fuseType);

            return (
              <div
                key={fuse.id}
                style={{
                  position: 'absolute',
                  left: `${fuse.xPercent}%`,
                  top: `${fuse.yPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                className={`transition-all ${
                  isTargetActive
                    ? 'z-40 scale-125'
                    : isSelected
                      ? 'z-30 scale-115'
                      : 'z-20 hover:scale-110'
                }`}
              >
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (isCalibratingMode) {
                      setTargetType('fuse');
                      setTargetItemId(fuse.id);
                      onSelectFuse(fuse);
                      setStatusNotice({
                        text: `فیوز «${fuse.code}» انتخاب شد. برای تغییر موقعیت، محل جدید را لمس فرمایید.`,
                        type: 'info'
                      });
                    } else {
                      onSelectFuse(fuse);
                    }
                  }}
                  className={`flex flex-col items-center justify-center rounded-xl shadow-2xl font-black text-[11px] sm:text-xs tabular-nums border ${fuseColor.bg} ${fuseColor.text} ${fuseColor.border} ${
                    isTargetActive
                      ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-black animate-pulse'
                      : isSelected
                        ? 'ring-4 ring-white shadow-white/20'
                        : 'opacity-95 hover:opacity-100'
                  } px-2.5 py-1 min-w-[38px] cursor-pointer active:scale-95 transition`}
                  title={`${fuse.code}: ${fuse.functionName} (${fuse.ratingAmps}A - ${fuseColor.colorNameFa})`}
                >
                  <span className="font-mono tracking-tight leading-none">{fuse.code}</span>
                  <span className="text-[9px] opacity-90 leading-tight font-mono">{fuse.ratingAmps}A</span>
                </button>

                {/* Pulsing Target on Active Item in Edit Mode */}
                {isCalibratingMode && isTargetActive && (
                  <div className="absolute -inset-2.5 border-2 border-amber-400 rounded-full animate-ping pointer-events-none" />
                )}
              </div>
            );
          })}

          {/* PLACED RELAYS HOTSPOTS */}
          {placedRelays.map(relay => {
            const isTargetActive = isCalibratingMode && targetType === 'relay' && targetItemId === relay.id;
            const isSelected = selectedRelay?.id === relay.id;
            const relayColor = getRelayColor(relay.contactAmps, relay.rating);

            return (
              <div
                key={relay.id}
                style={{
                  position: 'absolute',
                  left: `${relay.xPercent}%`,
                  top: `${relay.yPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                className={`transition-all ${
                  isTargetActive
                    ? 'z-40 scale-125'
                    : isSelected
                      ? 'z-30 scale-115'
                      : 'z-20 hover:scale-110'
                }`}
              >
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (isCalibratingMode) {
                      setTargetType('relay');
                      setTargetItemId(relay.id);
                      onSelectRelay?.(relay);
                      setStatusNotice({
                        text: `رله «${relay.code}» انتخاب شد. برای تغییر موقعیت، محل جدید را لمس فرمایید.`,
                        type: 'info'
                      });
                    } else {
                      onSelectRelay?.(relay);
                    }
                  }}
                  className={`flex flex-col items-center justify-center rounded-xl shadow-2xl font-bold text-[10px] sm:text-[11px] border ${relayColor.bg} ${relayColor.text} ${relayColor.border} ${
                    isTargetActive
                      ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-black animate-pulse'
                      : isSelected
                        ? 'ring-4 ring-white shadow-white/20'
                        : 'hover:brightness-110'
                  } px-3 py-1.5 min-w-[44px] cursor-pointer active:scale-95 transition`}
                  title={`${relay.code}: ${relay.name} (${relay.rating})`}
                >
                  <Cpu className="w-3.5 h-3.5 mb-0.5 opacity-90" />
                  <span className="font-mono leading-none">{relay.code}</span>
                  <span className="text-[9px] opacity-80 leading-tight font-mono">
                    {relay.contactAmps ? `${relay.contactAmps}A` : ''}
                  </span>
                </button>

                {isCalibratingMode && isTargetActive && (
                  <div className="absolute -inset-2.5 border-2 border-amber-400 rounded-full animate-ping pointer-events-none" />
                )}
              </div>
            );
          })}

          {/* Empty State when no items are placed on the board */}
          {totalPlacedCount === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-zinc-500 pointer-events-none">
              <Zap className="w-10 h-10 mb-2 opacity-30 text-amber-400" />
              <p className="text-sm font-bold text-zinc-400">هنوز موقعیتی برای فیوزها یا رله‌ها روی صفحه مشکی ثبت نشده است</p>
              <p className="text-xs text-zinc-600 mt-1 max-w-sm">
                {isAdmin
                  ? 'از دکمه «تعیین موقعیت روی صفحه مشکی» بالا استفاده نموده و فیوزها یا رله‌ها را در محل مناسب قرار دهید.'
                  : 'موقعیت‌های گرافیکی این جعبه‌فیوز به زودی توسط تکنسین فنی ثبت و منتشر خواهند شد.'}
              </p>
            </div>
          )}
        </div>

        {/* Board Bottom Indicator */}
        <div className="px-4 py-2 bg-zinc-950/90 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-[11px] text-zinc-500 gap-2">
          <span>
            {isCalibratingMode
              ? 'روی هر نقطه از صفحه مشکی لمس کنید تا نشانگر قطعه انتخاب‌شده دقیقاً در آنجا قرار گیرد.'
              : 'برای بررسی عملکرد و راهنمای مدار، روی هر فیوز یا رله ضربه بزنید.'}
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
              <span className="text-zinc-400">فیوز خودرویی</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block" />
              <span className="text-zinc-400">رله قدرت</span>
            </span>
          </div>
        </div>
      </div>

      {/* --- UNPLACED ITEMS TRAY (CRITICAL REQUIREMENT: NEVER PLACE UNREGISTERED ITEMS RANDOMLY) --- */}
      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-800">
          <span className="font-bold text-zinc-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {totalUnplacedCount === 0
                ? 'وضعیت جانمایی: کلیه قطعات روی صفحه مشکی مشخص شده‌اند'
                : `قطعات بدون موقعیت روی نقشه (${totalUnplacedCount} مورد)`}
            </span>
          </span>

          {totalUnplacedCount > 0 && (
            <span className="text-[11px] text-zinc-500">
              {isAdmin ? 'برای قرار دادن روی صفحه، قطعه را لمس کنید' : 'هنوز روی نقشه علامت‌گذاری نشده‌اند'}
            </span>
          )}
        </div>

        {totalUnplacedCount === 0 ? (
          <div className="py-2 text-center text-[11px] text-emerald-400 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تمامی {totalItemsCount} فیوز و رله ثبت‌شده دارای موقعیت مشخص بر روی صفحه تعاملی هستند.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {/* Unplaced Fuses */}
            {unplacedFuses.map(fuse => {
              const fuseColor = getFuseColor(fuse.ratingAmps, fuse.fuseType);
              const isSelected = selectedFuse?.id === fuse.id;
              const isTargetActive = isCalibratingMode && targetType === 'fuse' && targetItemId === fuse.id;

              return (
                <button
                  key={fuse.id}
                  type="button"
                  onClick={() => {
                    setTargetType('fuse');
                    setTargetItemId(fuse.id);
                    onSelectFuse(fuse);
                    if (isCalibratingMode) {
                      setStatusNotice({
                        text: `فیوز «${fuse.code}» انتخاب شد. اکنون نقطه موردنظر را روی صفحه مشکی لمس کنید.`,
                        type: 'info'
                      });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 border shrink-0 ${
                    isTargetActive
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md font-bold'
                      : isSelected
                        ? 'bg-zinc-800 text-white border-white'
                        : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-black border ${fuseColor.bg} ${fuseColor.text} ${fuseColor.border}`}
                  >
                    {fuse.ratingAmps}A
                  </span>
                  <span>{fuse.code}</span>
                  <span className="text-[10px] text-zinc-500 truncate max-w-[90px]">{fuse.functionName}</span>
                </button>
              );
            })}

            {/* Unplaced Relays */}
            {unplacedRelays.map(relay => {
              const relayColor = getRelayColor(relay.contactAmps, relay.rating);
              const isSelected = selectedRelay?.id === relay.id;
              const isTargetActive = isCalibratingMode && targetType === 'relay' && targetItemId === relay.id;

              return (
                <button
                  key={relay.id}
                  type="button"
                  onClick={() => {
                    setTargetType('relay');
                    setTargetItemId(relay.id);
                    onSelectRelay?.(relay);
                    if (isCalibratingMode) {
                      setStatusNotice({
                        text: `رله «${relay.code}» انتخاب شد. اکنون نقطه موردنظر را روی صفحه مشکی لمس کنید.`,
                        type: 'info'
                      });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 border shrink-0 ${
                    isTargetActive
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md font-bold'
                      : isSelected
                        ? 'bg-zinc-800 text-white border-white'
                        : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${relayColor.bg} ${relayColor.text} ${relayColor.border}`}
                  >
                    {relay.contactAmps ? `${relay.contactAmps}A` : 'رله'}
                  </span>
                  <span>{relay.code}</span>
                  <span className="text-[10px] text-zinc-500 truncate max-w-[90px]">{relay.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { Connector, ConnectorPin } from '../types';
import { AlertTriangle, Plus } from 'lucide-react';

export interface SlotData {
  slotIndex: number;
  row: number; // 1-indexed
  col: number; // 1-indexed
  labelAlpha: string; // e.g. "A1"
  labelNumeric: string; // e.g. "1"
  pin?: ConnectorPin;
}

export function buildSocketSlots(
  rows: number,
  cols: number,
  pins: ConnectorPin[]
): { slots: SlotData[]; unplacedPins: ConnectorPin[] } {
  const safeRows = Math.max(1, Math.min(rows || 4, 12));
  const safeCols = Math.max(1, Math.min(cols || 8, 30));
  const totalSlots = safeRows * safeCols;

  const slots: SlotData[] = [];
  for (let i = 0; i < totalSlots; i++) {
    const r = Math.floor(i / safeCols) + 1;
    const c = (i % safeCols) + 1;
    const letter = String.fromCharCode(64 + r); // A, B, C, D...
    slots.push({
      slotIndex: i,
      row: r,
      col: c,
      labelAlpha: `${letter}${c}`,
      labelNumeric: String(i + 1),
    });
  }

  const assignedPinIds = new Set<string>();

  // Pass 1: exact row & col match
  for (const slot of slots) {
    const pin = pins.find(p => !assignedPinIds.has(p.id) && p.row === slot.row && p.col === slot.col);
    if (pin) {
      slot.pin = pin;
      assignedPinIds.add(pin.id);
    }
  }

  // Pass 2: labelAlpha match (e.g. "A1", "B2")
  for (const slot of slots) {
    if (slot.pin) continue;
    const pin = pins.find(p => !assignedPinIds.has(p.id) && p.pinNumber.trim().toUpperCase() === slot.labelAlpha);
    if (pin) {
      slot.pin = pin;
      assignedPinIds.add(pin.id);
    }
  }

  // Pass 3: labelNumeric match (e.g. "1", "15")
  for (const slot of slots) {
    if (slot.pin) continue;
    const pin = pins.find(p => !assignedPinIds.has(p.id) && p.pinNumber.trim() === slot.labelNumeric);
    if (pin) {
      slot.pin = pin;
      assignedPinIds.add(pin.id);
    }
  }

  // Pass 4: remaining unassigned slots fill with remaining unplaced pins in order
  for (const slot of slots) {
    if (slot.pin) continue;
    const pin = pins.find(p => !assignedPinIds.has(p.id));
    if (pin) {
      slot.pin = pin;
      assignedPinIds.add(pin.id);
    }
  }

  // Any pins that exceed capacity (pins beyond safeRows * safeCols)
  const unplacedPins = pins.filter(p => !assignedPinIds.has(p.id));

  return { slots, unplacedPins };
}

interface InteractiveSocketProps {
  connector: Connector;
  selectedPinId: string | null;
  onSelectPin: (pin: ConnectorPin) => void;
  onSelectEmptySlot?: (slotAlpha: string, slotNumeric: string, row: number, col: number) => void;
}

export const InteractiveSocket: React.FC<InteractiveSocketProps> = ({
  connector,
  selectedPinId,
  onSelectPin,
  onSelectEmptySlot
}) => {
  const rawRows = connector.rows || 4;
  const rawCols = connector.cols || 8;
  const rows = Math.max(1, Math.min(rawRows, 12));
  const cols = Math.max(1, Math.min(rawCols, 30));
  const pins = connector.pins || [];
  const socketColor = connector.socketColor || 'خاکستری';
  const totalSlots = rows * cols;

  const { slots, unplacedPins } = buildSocketSlots(rows, cols, pins);

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5">
      {/* Socket Header & Keyway Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full border border-zinc-600 inline-block shrink-0 shadow-xs"
            style={{ backgroundColor: connector.socketColorHex || '#71717a' }}
          />
          <span className="font-semibold text-zinc-200">
            نمای شماتیک سوکت ({totalSlots} موقعیت پایه · {rows} ردیف × {cols} ستون)
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
            {pins.length} پایه تعریف‌شده
          </span>
        </div>
        <span className="text-zinc-400 text-[11px]">دید از سمت روبه‌رو (محل ورود سیم‌ها)</span>
      </div>

      {/* Visual Connector Body Frame */}
      <div className="mt-4 flex flex-col items-center">
        {/* Release latch / keyway notch tab */}
        <div className="w-20 h-3 bg-zinc-800 border-t border-x border-zinc-700 rounded-t-md flex items-center justify-center">
          <div className="w-8 h-1 bg-red-500 rounded-full" />
        </div>

        {/* Main Connector Shell */}
        <div
          className="w-full max-w-full bg-zinc-950 border-2 border-zinc-700 rounded-xl p-3 sm:p-4 shadow-inner relative overflow-x-auto"
          style={{
            boxShadow: `inset 0 0 24px rgba(0,0,0,0.85), 0 0 2px ${connector.socketColorHex || '#71717a'}55`
          }}
        >
          {/* Pins Matrix Container with touch-friendly minWidth for mobile */}
          <div
            className="grid gap-1.5 sm:gap-2 mx-auto justify-center"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(36px, 1fr))`,
              minWidth: `${cols * 40}px`
            }}
          >
            {slots.map((slot) => {
              const pin = slot.pin;
              if (pin) {
                const isSelected = selectedPinId === pin.id;
                const isPower = pin.signalType === '12V_BAT' || pin.signalType === '12V_IGN';
                const isGround = pin.signalType === 'GROUND';
                const is5V = pin.signalType === '5V_REF';
                const isPulse = pin.signalType === 'PWM_PULSE';

                return (
                  <button
                    key={pin.id}
                    type="button"
                    onClick={() => onSelectPin(pin)}
                    className={`relative flex flex-col items-center justify-center aspect-square rounded-lg transition-all active:scale-95 border ${
                      isSelected
                        ? 'bg-red-600 text-white border-white ring-2 ring-red-400/50 shadow-lg shadow-red-900/40 z-10 scale-105'
                        : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                    }`}
                    title={`${pin.pinNumber}: ${pin.functionName} (${pin.wireColor})`}
                  >
                    {/* Pin Number Label */}
                    <span className={`text-[11px] sm:text-xs font-bold tabular-nums ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                      {pin.pinNumber || slot.labelAlpha}
                    </span>

                    {/* Wire color micro badge indicator */}
                    <div className="relative w-4 h-1.5 mt-1 rounded-xs overflow-hidden border border-zinc-700">
                      <div
                        className="absolute inset-0"
                        style={{ backgroundColor: pin.wireHex || '#52525b' }}
                      />
                      {pin.wireStripeHex && (
                        <div
                          className="absolute top-0 bottom-0 left-1 w-1.5"
                          style={{ backgroundColor: pin.wireStripeHex }}
                        />
                      )}
                    </div>

                    {/* Signal indicator dot */}
                    {isPower && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 ring-1 ring-zinc-950" title="۱۲ ولت" />
                    )}
                    {isGround && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-zinc-400 ring-1 ring-zinc-950" title="اتصال بدنه" />
                    )}
                    {is5V && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-zinc-950" title="۵ ولت رفرنس" />
                    )}
                    {isPulse && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-zinc-950" title="سیگنال و پالس" />
                    )}
                  </button>
                );
              }

              // Empty slot (unassigned position in the rows x cols socket body)
              return (
                <button
                  key={`empty-${slot.slotIndex}`}
                  type="button"
                  onClick={() => onSelectEmptySlot?.(slot.labelAlpha, slot.labelNumeric, slot.row, slot.col)}
                  className="relative flex flex-col items-center justify-center aspect-square rounded-lg border border-dashed border-zinc-800/80 bg-zinc-950/60 hover:bg-zinc-900/90 hover:border-zinc-700 text-zinc-600 hover:text-zinc-400 transition group cursor-pointer"
                  title={`پایه خالی موقعیت ${slot.labelAlpha} (${slot.labelNumeric}) - کلیک برای افزودن`}
                >
                  <span className="text-[10px] font-mono tabular-nums opacity-60 group-hover:opacity-100">
                    {slot.labelAlpha}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 mt-1 group-hover:bg-red-500/60 transition" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Unplaced Pins Warning (if pins exceed rows * cols) */}
        {unplacedPins.length > 0 && (
          <div className="mt-3 w-full p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/70 text-amber-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                توجه: {unplacedPins.length} پایه خارج از کادر {rows}×{cols} قرار دارند ({unplacedPins.map(p => p.pinNumber).join('، ')}).
              </span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>برق ۱۲V</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>۵V رفرنس</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-400" />
            <span>اتصال بدنه</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>پالس/سیگنال</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 border border-dashed border-zinc-600 rounded-xs" />
            <span>خانه خالی سوکت</span>
          </div>
        </div>
      </div>
    </div>
  );
};

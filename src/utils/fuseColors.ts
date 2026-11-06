/**
 * AutoPin Pro - Automotive Electrical Color Standards
 * Centralized color resolution engine for automotive blade fuses (SAE J2077 / DIN 72581)
 * and automotive switching relays based on rated contact current.
 */

export interface FuseColorInfo {
  amps: number;
  bg: string;
  text: string;
  border: string;
  hex: string;
  colorNameFa: string;
  label: string;
  isStandard: boolean;
}

export interface RelayColorInfo {
  amps: number | null;
  bg: string;
  text: string;
  border: string;
  hex: string;
  rangeFa: string;
  label: string;
}

/**
 * Normalizes input string or number to a clean float number.
 * Handles Persian digits, trailing 'A', whitespace, commas, etc.
 */
export function parseAmperage(input: number | string | undefined | null): number | null {
  if (input === undefined || input === null) return null;
  if (typeof input === 'number') {
    return isNaN(input) ? null : input;
  }

  // Convert Persian/Arabic digits to English digits
  let cleaned = String(input)
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/,/g, '.')
    .replace(/[^0-9.]/g, '')
    .trim();

  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Standard SAE J2077 / DIN 72581 Automotive Blade Fuse Color Resolution.
 * Guaranteed to return correct color for standard 2A, 3A, 5A, 7.5A, 10A, 15A, 20A, 25A, 30A, 40A, Maxi fuses.
 * Never defaults to red for unknown or non-10A fuses!
 */
export function getFuseColor(
  rating: number | string | undefined | null,
  fuseType: string = 'standard'
): FuseColorInfo {
  const amps = parseAmperage(rating);

  if (amps === null || amps <= 0) {
    return {
      amps: 0,
      bg: 'bg-zinc-700',
      text: 'text-zinc-200',
      border: 'border-zinc-500',
      hex: '#3f3f46',
      colorNameFa: 'نامشخص / خنثی',
      label: 'فیوز نامشخص',
      isStandard: false
    };
  }

  // Maxi fuse standard overrides (large high-current box fuses)
  if (fuseType === 'maxi') {
    switch (amps) {
      case 20:
        return { amps, bg: 'bg-yellow-400', text: 'text-zinc-950 font-black', border: 'border-yellow-300', hex: '#facc15', colorNameFa: 'زرد ماکسی', label: 'ماکسی‌فیوز ۲۰ آمپر (زرد)', isStandard: true };
      case 30:
        return { amps, bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-400', hex: '#059669', colorNameFa: 'سبز ماکسی', label: 'ماکسی‌فیوز ۳۰ آمپر (سبز)', isStandard: true };
      case 40:
        return { amps, bg: 'bg-orange-500', text: 'text-zinc-950 font-black', border: 'border-orange-300', hex: '#f97316', colorNameFa: 'نارنجی ماکسی', label: 'ماکسی‌فیوز ۴۰ آمپر (نارنجی)', isStandard: true };
      case 50:
        return { amps, bg: 'bg-red-700', text: 'text-white', border: 'border-red-500', hex: '#b91c1c', colorNameFa: 'قرمز ماکسی', label: 'ماکسی‌فیوز ۵۰ آمپر (قرمز)', isStandard: true };
      case 60:
        return { amps, bg: 'bg-blue-700', text: 'text-white', border: 'border-blue-500', hex: '#1d4ed8', colorNameFa: 'آبی ماکسی', label: 'ماکسی‌فیوز ۶۰ آمپر (آبی)', isStandard: true };
      case 70:
        return { amps, bg: 'bg-amber-800', text: 'text-amber-100', border: 'border-amber-600', hex: '#92400e', colorNameFa: 'قهوه‌ای ماکسی', label: 'ماکسی‌فیوز ۷۰ آمپر (قهوه‌ای)', isStandard: true };
      case 80:
        return { amps, bg: 'bg-slate-200', text: 'text-zinc-900 font-black', border: 'border-slate-400', hex: '#e2e8f0', colorNameFa: 'سفید / شفاف ماکسی', label: 'ماکسی‌فیوز ۸۰ آمپر (شفاف)', isStandard: true };
      case 100:
        return { amps, bg: 'bg-purple-700', text: 'text-white', border: 'border-purple-500', hex: '#7e22ce', colorNameFa: 'بنفش ماکسی', label: 'ماکسی‌فیوز ۱۰۰ آمپر (بنفش)', isStandard: true };
    }
  }

  // Standard Blade (ATO / ATC) and Mini (ATM) Standard Colors
  switch (amps) {
    case 1:
      return {
        amps,
        bg: 'bg-zinc-950',
        text: 'text-white',
        border: 'border-zinc-700',
        hex: '#09090b',
        colorNameFa: 'مشکی',
        label: 'مشکی (1A)',
        isStandard: true
      };
    case 2:
      return {
        amps,
        bg: 'bg-zinc-500',
        text: 'text-white',
        border: 'border-zinc-400',
        hex: '#71717a',
        colorNameFa: 'خاکستری روشن',
        label: 'خاکستری (2A)',
        isStandard: true
      };
    case 3:
      return {
        amps,
        bg: 'bg-purple-600',
        text: 'text-white',
        border: 'border-purple-400',
        hex: '#9333ea',
        colorNameFa: 'بنفش',
        label: 'بنفش (3A)',
        isStandard: true
      };
    case 4:
      return {
        amps,
        bg: 'bg-pink-600',
        text: 'text-white',
        border: 'border-pink-400',
        hex: '#db2777',
        colorNameFa: 'صورتی',
        label: 'صورتی (4A)',
        isStandard: true
      };
    case 5:
      return {
        amps,
        bg: 'bg-amber-700',
        text: 'text-amber-100',
        border: 'border-amber-500',
        hex: '#b45309',
        colorNameFa: 'بژ / قهوه‌ای روشن',
        label: 'بژ (5A)',
        isStandard: true
      };
    case 7.5:
      return {
        amps,
        bg: 'bg-amber-950',
        text: 'text-amber-200',
        border: 'border-amber-700',
        hex: '#451a03',
        colorNameFa: 'قهوه‌ای تیره',
        label: 'قهوه‌ای (7.5A)',
        isStandard: true
      };
    case 10:
      return {
        amps,
        bg: 'bg-red-600',
        text: 'text-white',
        border: 'border-red-400',
        hex: '#dc2626',
        colorNameFa: 'قرمز استاندارد',
        label: 'قرمز (10A)',
        isStandard: true
      };
    case 15:
      return {
        amps,
        bg: 'bg-blue-600',
        text: 'text-white',
        border: 'border-blue-400',
        hex: '#2563eb',
        colorNameFa: 'آبی استاندارد',
        label: 'آبی (15A)',
        isStandard: true
      };
    case 20:
      return {
        amps,
        bg: 'bg-yellow-400',
        text: 'text-zinc-950 font-black',
        border: 'border-yellow-300',
        hex: '#facc15',
        colorNameFa: 'زرد فسفری',
        label: 'زرد (20A)',
        isStandard: true
      };
    case 25:
      return {
        amps,
        bg: 'bg-zinc-100',
        text: 'text-zinc-950 font-black',
        border: 'border-zinc-300',
        hex: '#f4f4f5',
        colorNameFa: 'سفید / شفاف',
        label: 'سفید / بی‌رنگ (25A)',
        isStandard: true
      };
    case 30:
      return {
        amps,
        bg: 'bg-emerald-600',
        text: 'text-white',
        border: 'border-emerald-400',
        hex: '#059669',
        colorNameFa: 'سبز روشن',
        label: 'سبز (30A)',
        isStandard: true
      };
    case 35:
      return {
        amps,
        bg: 'bg-teal-600',
        text: 'text-white',
        border: 'border-teal-400',
        hex: '#0d9488',
        colorNameFa: 'سبز آبی / کله‌غازی',
        label: 'سبز آبی (35A)',
        isStandard: true
      };
    case 40:
      return {
        amps,
        bg: 'bg-orange-500',
        text: 'text-zinc-950 font-black',
        border: 'border-orange-300',
        hex: '#f97316',
        colorNameFa: 'نارنجی',
        label: 'نارنجی (40A)',
        isStandard: true
      };
    case 50:
      return {
        amps,
        bg: 'bg-red-800',
        text: 'text-white',
        border: 'border-red-500',
        hex: '#991b1b',
        colorNameFa: 'قرمز پررنگ ماکسی',
        label: 'قرمز (50A)',
        isStandard: true
      };
    case 60:
      return {
        amps,
        bg: 'bg-blue-800',
        text: 'text-white',
        border: 'border-blue-500',
        hex: '#1e40af',
        colorNameFa: 'آبی پررنگ ماکسی',
        label: 'آبی (60A)',
        isStandard: true
      };
    case 70:
      return {
        amps,
        bg: 'bg-amber-900',
        text: 'text-amber-100',
        border: 'border-amber-700',
        hex: '#78350f',
        colorNameFa: 'قهوه‌ای سوخته ماکسی',
        label: 'قهوه‌ای (70A)',
        isStandard: true
      };
    case 80:
      return {
        amps,
        bg: 'bg-slate-300',
        text: 'text-zinc-900 font-black',
        border: 'border-slate-400',
        hex: '#cbd5e1',
        colorNameFa: 'شفاف / طبیعی ماکسی',
        label: 'شفاف (80A)',
        isStandard: true
      };
    default:
      // Neutral distinct styling for non-standard amperage ratings (never red!)
      return {
        amps,
        bg: 'bg-zinc-800',
        text: 'text-zinc-200',
        border: 'border-zinc-600',
        hex: '#27272a',
        colorNameFa: 'غیراستاندارد / ویژه',
        label: `فیوز ${amps}A`,
        isStandard: false
      };
  }
}

/**
 * Extracts rated contact current from a relay object or rating string.
 * Example strings: "12V 30A", "30/40A", "40A 12VDC", "20 A", etc.
 */
export function extractRelayContactAmps(ratingStr?: string, explicitAmps?: number): number | null {
  if (explicitAmps !== undefined && explicitAmps !== null && !isNaN(explicitAmps) && explicitAmps > 0) {
    return explicitAmps;
  }
  if (!ratingStr) return null;

  // Search for patterns like "30/40A", "30A", "40 A"
  const match = ratingStr.match(/(\d+(?:\.\d+)?)\s*(?:\/\s*\d+)?\s*[Aa]/);
  if (match && match[1]) {
    const val = parseFloat(match[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  // Fallback to general number parsing
  return parseAmperage(ratingStr);
}

/**
 * Distinct Relay Visual Color Coding based on Contact Current Rating (Amperes).
 * Visually distinguishable from fuse standard colors so technicians never mistake
 * a relay for a fuse.
 */
export function getRelayColor(
  contactAmpsInput?: number | string | null,
  ratingFallback?: string
): RelayColorInfo {
  let amps: number | null = null;

  if (typeof contactAmpsInput === 'number' && !isNaN(contactAmpsInput) && contactAmpsInput > 0) {
    amps = contactAmpsInput;
  } else if (typeof contactAmpsInput === 'string' && contactAmpsInput.trim()) {
    amps = extractRelayContactAmps(contactAmpsInput);
  } else if (ratingFallback) {
    amps = extractRelayContactAmps(ratingFallback);
  }

  if (amps === null || amps <= 0) {
    return {
      amps: null,
      bg: 'bg-zinc-800',
      text: 'text-zinc-300',
      border: 'border-zinc-700',
      hex: '#27272a',
      rangeFa: 'ظرفیت نامشخص',
      label: 'رله قدرت'
    };
  }

  if (amps < 10) {
    // Under 10A: Cool Slate/Silver
    return {
      amps,
      bg: 'bg-slate-700',
      text: 'text-slate-100',
      border: 'border-slate-500',
      hex: '#334155',
      rangeFa: 'جریان کمتر از ۱۰ آمپر',
      label: `رله سبک (${amps}A)`
    };
  }

  if (amps >= 10 && amps < 20) {
    // 10 to <20A: Sky / Cyan
    return {
      amps,
      bg: 'bg-sky-600',
      text: 'text-white',
      border: 'border-sky-400',
      hex: '#0284c7',
      rangeFa: '۱۰ تا کمتر از ۲۰ آمپر',
      label: `رله (${amps}A)`
    };
  }

  if (amps >= 20 && amps < 30) {
    // 20 to <30A: Teal / Emerald
    return {
      amps,
      bg: 'bg-teal-700',
      text: 'text-teal-100',
      border: 'border-teal-500',
      hex: '#0f766e',
      rangeFa: '۲۰ تا کمتر از ۳۰ آمپر',
      label: `رله (${amps}A)`
    };
  }

  if (amps >= 30 && amps < 40) {
    // 30 to <40A: Metallic Indigo / Deep Violet
    return {
      amps,
      bg: 'bg-indigo-600',
      text: 'text-white',
      border: 'border-indigo-400',
      hex: '#4f46e5',
      rangeFa: '۳۰ تا کمتر از ۴۰ آمپر',
      label: `رله قدرت (${amps}A)`
    };
  }

  // 40A and above: High-Power Carmine / Dark Orange
  return {
    amps,
    bg: 'bg-rose-800',
    text: 'text-rose-100',
    border: 'border-rose-500',
    hex: '#9f1239',
    rangeFa: '۴۰ آمپر و بالاتر (فوق قدرت)',
    label: `رله فوق قدرت (${amps}A)`
  };
}

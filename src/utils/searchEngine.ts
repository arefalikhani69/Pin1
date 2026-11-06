/**
 * AutoPin Pro - High Performance Automotive Search Engine & Text Normalizer
 * Provides normalized, multi-field, multi-lingual (Persian, Arabic, English)
 * search across Vehicles, ECUs, Connectors, Pinouts, Sensors, Fuses, Relays,
 * Diagrams, and Technical Images.
 */

import {
  Vehicle,
  Connector,
  ConnectorPin,
  FuseBox,
  Fuse,
  Relay,
  WiringDiagram,
  MediaItem,
  Manufacturer,
  ECU,
  PublicationStatus
} from '../types';

/**
 * Normalizes Persian, Arabic, and English strings for resilient matching:
 * - Unifies Yeh/Kaf/Heh/Hamza (ي/ك/ة/ۀ/ئ -> ی/ک/ه/ی)
 * - Strips Arabic diacritics (َ ُ ِ ً ٌ ٍ ّ ْ)
 * - Converts Persian (۰-۹) and Arabic (٠-٩) digits to standard ASCII (0-9)
 * - Removes non-breaking spaces (ZWNJ), hyphens, and collapses spaces
 * - Lowercases English text
 */
export function normalizeSearchText(input: string | undefined | null): string {
  if (!input) return '';

  return (
    input
      .toString()
      // Persian/Arabic character unification
      .replace(/[\u064A\u0649\u06CC]/g, 'ی') // Arabic Yeh, Alef Maksura -> Persian Yeh
      .replace(/[\u0643\u06A9]/g, 'ک')       // Arabic Kaf -> Persian Kaf
      .replace(/[\u0629\u06C0]/g, 'ه')       // Teh Marbuta, Heh with Yeh -> Heh
      .replace(/[\u0622\u0623\u0625]/g, 'ا') // Alef with Madda/Hamza -> Alef
      .replace(/[\u0626]/g, 'ی')             // Yeh with Hamza
      .replace(/[\u0624]/g, 'و')             // Waw with Hamza
      // Remove Arabic diacritics / Harakat
      .replace(/[\u064B-\u065F\u0670]/g, '')
      // Convert Persian digits (۰-۹) to standard ASCII
      .replace(/[\u06F0-\u06F9]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x06f0 + 48))
      // Convert Arabic-Indic digits (٠-٩) to standard ASCII
      .replace(/[\u0660-\u0669]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48))
      // Normalize amperage expressions: "15 آمپر", "15 a", "15amp" -> "15a"
      .replace(/(\d+)\s*(آمپر|امپر|amp|amper)\b/gi, '$1a')
      // Unify Zero-Width Non-Joiner (نیم‌فاصله) and underscores with space
      .replace(/[\u200C\u200B_\\/-]/g, ' ')
      // Lowercase
      .toLowerCase()
      // Collapse multiple whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Parses possible amperage queries like "15A", "15 a", "15 آمپر", "۱۵ آمپر", "15amp"
 * into a numeric value (e.g., 15) or null.
 */
export function parseAmperageQuery(query: string): number | null {
  const norm = normalizeSearchText(query);
  // Match "15 a", "15a", "15 amper", "15 amper", "15 amp"
  const ampMatch = norm.match(/^(\d{1,3})\s*(a|آمپر|امپر|amp|amper)?$/);
  if (ampMatch && ampMatch[1]) {
    const val = parseInt(ampMatch[1], 10);
    if (!isNaN(val) && val > 0 && val <= 500) {
      return val;
    }
  }
  return null;
}

/**
 * Checks if a technical term relates to an automotive Sensor or Actuator
 */
export const SENSOR_ACTUATOR_KEYWORDS = [
  'سنسور',
  'عملگر',
  'انژکتور',
  'کوئیل',
  'کویل',
  'پمپ بنزین',
  'پمپ',
  'دریچه گاز',
  'استپر',
  'استپ موتور',
  'مپ',
  'map',
  'اکسیژن',
  'oxygen',
  'دور موتور',
  'کرنک',
  'crank',
  'میل سوپاپ',
  'cam',
  'کیلومتر',
  'سرعت',
  'دمای آب',
  'فشار هوا',
  'کناک',
  'ضربه',
  'شیر برقی',
  'کنیستر',
  'فن',
  'رادیاتور',
  'رله دوبل',
  'گرمکن',
  'پدال گاز',
  'فشار ریل سوخت'
];

export function isSensorOrActuatorTerm(text: string): boolean {
  const norm = normalizeSearchText(text);
  return SENSOR_ACTUATOR_KEYWORDS.some(kw => norm.includes(normalizeSearchText(kw)));
}

// -------------------------------------------------------------
// Search Result Models
// -------------------------------------------------------------

export interface BaseSearchResult {
  id: string;
  relevance: number;
  matchedField: string;
}

export interface VehicleSearchResult extends BaseSearchResult {
  type: 'vehicle';
  vehicle: Vehicle;
  manufacturerName?: string;
}

export interface PinSearchResult extends BaseSearchResult {
  type: 'pin';
  pin: ConnectorPin;
  connector: Connector;
  vehicle?: Vehicle;
  ecu?: ECU;
  isSensorOrActuator: boolean;
}

export interface FuseSearchResult extends BaseSearchResult {
  type: 'fuse';
  fuse: Fuse;
  fuseBox: FuseBox;
  vehicle?: Vehicle;
}

export interface RelaySearchResult extends BaseSearchResult {
  type: 'relay';
  relay: Relay;
  fuseBox: FuseBox;
  vehicle?: Vehicle;
}

export interface DiagramSearchResult extends BaseSearchResult {
  type: 'diagram';
  diagram: WiringDiagram;
  vehicle?: Vehicle;
}

export interface MediaSearchResult extends BaseSearchResult {
  type: 'media';
  media: MediaItem;
  parentTitle: string;
  vehicle?: Vehicle;
}

export type SearchResultItem =
  | VehicleSearchResult
  | PinSearchResult
  | FuseSearchResult
  | RelaySearchResult
  | DiagramSearchResult
  | MediaSearchResult;

export interface SearchFilters {
  manufacturerId?: string;
  vehicleId?: string;
  category?: 'all' | 'vehicles' | 'pins' | 'sensors' | 'fuses' | 'relays' | 'diagrams' | 'media';
  location?: 'all' | 'cabin' | 'engine' | 'battery' | 'trunk';
  ecuBrand?: string;
  status?: 'all' | 'published_only' | 'draft_only';
}

export interface SearchResultSet {
  query: string;
  totalCount: number;
  vehicles: VehicleSearchResult[];
  pins: PinSearchResult[];
  sensors: PinSearchResult[];
  fuses: FuseSearchResult[];
  relays: RelaySearchResult[];
  diagrams: DiagramSearchResult[];
  media: MediaSearchResult[];
}

export interface SearchDataSource {
  vehicles: Vehicle[];
  connectors: Connector[];
  fuseBoxes: FuseBox[];
  diagrams: WiringDiagram[];
  mediaItems: MediaItem[];
  manufacturers?: Manufacturer[];
  ecus?: ECU[];
  isAdmin?: boolean;
}

/**
 * Checks if a record meets the publication status filter
 */
function isAllowedByStatus(
  status: PublicationStatus | undefined,
  isAdmin: boolean,
  filterStatus?: SearchFilters['status']
): boolean {
  const effectiveStatus = status || 'published';

  if (!isAdmin && effectiveStatus !== 'published' && effectiveStatus !== 'verified') {
    return false;
  }

  if (filterStatus === 'published_only') {
    return effectiveStatus === 'published' || effectiveStatus === 'verified';
  }
  if (filterStatus === 'draft_only') {
    return effectiveStatus === 'draft' || effectiveStatus === 'pending';
  }

  return true;
}

/**
 * Calculates a match score between a normalized query and a normalized target text.
 * Higher score = closer match.
 */
function calculateMatchScore(query: string, target: string, exactWeight = 100): number {
  if (!target || !query) return 0;
  if (target === query) return exactWeight * 2;
  if (target.startsWith(query)) return exactWeight + 20;

  // Word boundary match
  const words = target.split(' ');
  for (const word of words) {
    if (word === query) return exactWeight + 10;
    if (word.startsWith(query)) return exactWeight;
  }

  if (target.includes(query)) return Math.max(10, exactWeight - 40);

  // Check multi-word query tokens
  const queryTokens = query.split(' ').filter(Boolean);
  if (queryTokens.length > 1) {
    const allMatch = queryTokens.every(tok => target.includes(tok));
    if (allMatch) return exactWeight - 15;
    const significant = queryTokens.filter(tok => tok.length >= 3);
    if (significant.length > 0 && significant.some(tok => target.includes(tok))) {
      return 15;
    }
  }

  return 0;
}

/**
 * Main Search Engine Runner:
 * Performs deep, resilient inspection over all active automotive entities.
 */
export function executeGlobalSearch(
  rawQuery: string,
  filters: SearchFilters = {},
  data: SearchDataSource
): SearchResultSet {
  const normQuery = normalizeSearchText(rawQuery);
  const ampValue = parseAmperageQuery(rawQuery);
  const isAdmin = Boolean(data.isAdmin);

  const result: SearchResultSet = {
    query: rawQuery,
    totalCount: 0,
    vehicles: [],
    pins: [],
    sensors: [],
    fuses: [],
    relays: [],
    diagrams: [],
    media: []
  };

  // Pre-index manufacturers and vehicles for quick lookup
  const vehicleMap = new Map<string, Vehicle>();
  data.vehicles.forEach(v => vehicleMap.set(v.id, v));

  const manufacturerMap = new Map<string, Manufacturer>();
  (data.manufacturers || []).forEach(m => manufacturerMap.set(m.id, m));

  const ecuMap = new Map<string, ECU>();
  (data.ecus || []).forEach(e => ecuMap.set(e.id, e));

  // Determine which categories to search
  const catFilter = filters.category || 'all';

  // -------------------------------------------------------------
  // 1. VEHICLES
  // -------------------------------------------------------------
  if (catFilter === 'all' || catFilter === 'vehicles') {
    for (const v of data.vehicles) {
      if (!isAllowedByStatus(v.status, isAdmin, filters.status)) continue;
      if (filters.manufacturerId && v.manufacturerId !== filters.manufacturerId) continue;
      if (filters.vehicleId && v.id !== filters.vehicleId) continue;

      let score = 0;
      let matchedField = '';

      if (!normQuery) {
        // Empty query matches all if filters are applied
        if (filters.manufacturerId || filters.vehicleId) {
          score = 10;
          matchedField = 'فیلتر سازنده یا خودرو';
        }
      } else {
        const nameScore = calculateMatchScore(normQuery, normalizeSearchText(v.name), 100);
        const faNameScore = calculateMatchScore(normQuery, normalizeSearchText(v.persianName), 90);
        const genScore = calculateMatchScore(normQuery, normalizeSearchText(v.generation), 70);
        const elecScore = calculateMatchScore(normQuery, normalizeSearchText(v.electricalSystem), 70);
        const descScore = calculateMatchScore(normQuery, normalizeSearchText(v.description), 40);

        // Engines match (e.g. "TU5", "XU7")
        let engScore = 0;
        let matchedEngCode = '';
        for (const eng of v.engines || []) {
          const eCodeScore = calculateMatchScore(normQuery, normalizeSearchText(eng.code), 95);
          const eNameScore = calculateMatchScore(normQuery, normalizeSearchText(eng.name), 85);
          if (eCodeScore > engScore || eNameScore > engScore) {
            engScore = Math.max(eCodeScore, eNameScore);
            matchedEngCode = eng.code;
          }
        }

        if (nameScore > score) { score = nameScore; matchedField = 'نام خودرو'; }
        if (faNameScore > score) { score = faNameScore; matchedField = 'نام فارسی خودرو'; }
        if (engScore > score) { score = engScore; matchedField = `موتور ${matchedEngCode}`; }
        if (genScore > score) { score = genScore; matchedField = 'نسل / تیپ'; }
        if (elecScore > score) { score = elecScore; matchedField = 'سیستم برقی و شبکه'; }
        if (descScore > score) { score = descScore; matchedField = 'توضیحات خودرو'; }
      }

      if (score > 0) {
        result.vehicles.push({
          type: 'vehicle',
          id: v.id,
          vehicle: v,
          manufacturerName: manufacturerMap.get(v.manufacturerId)?.name,
          relevance: score,
          matchedField
        });
      }
    }
    result.vehicles.sort((a, b) => b.relevance - a.relevance);
  }

  // -------------------------------------------------------------
  // 2. CONNECTORS & PINS (Including Sensors & Actuators)
  // -------------------------------------------------------------
  if (catFilter === 'all' || catFilter === 'pins' || catFilter === 'sensors') {
    for (const conn of data.connectors) {
      if (!isAllowedByStatus(conn.status, isAdmin, filters.status)) continue;
      if (filters.vehicleId && conn.vehicleId !== filters.vehicleId) continue;

      const parentVeh = conn.vehicleId ? vehicleMap.get(conn.vehicleId) : undefined;
      if (filters.manufacturerId && parentVeh && parentVeh.manufacturerId !== filters.manufacturerId) continue;

      const parentEcu = conn.ecuId ? ecuMap.get(conn.ecuId) : undefined;
      if (filters.ecuBrand && parentEcu && !normalizeSearchText(parentEcu.brand).includes(normalizeSearchText(filters.ecuBrand))) {
        continue;
      }

      const connNameNorm = normalizeSearchText(conn.name);
      const connCodeNorm = normalizeSearchText(conn.codeName);
      const connNotesNorm = normalizeSearchText(conn.notes || '');

      for (const pin of conn.pins || []) {
        if (!isAllowedByStatus(pin.status, isAdmin, filters.status)) continue;

        let score = 0;
        let matchedField = '';

        if (!normQuery) {
          if (filters.vehicleId || filters.ecuBrand) {
            score = 10;
            matchedField = 'فیلتر قطعه';
          }
        } else {
          // Exact pin number match (e.g. "A1", "32", "1")
          const pinNorm = normalizeSearchText(pin.pinNumber);
          if (pinNorm === normQuery || `پایه ${pinNorm}` === normQuery) {
            score = 120;
            matchedField = `شماره پایه ${pin.pinNumber}`;
          }

          // Function name match (e.g. "پمپ بنزین", "سنسور دور موتور", "سوزن انژکتور")
          const funcNorm = normalizeSearchText(pin.functionName);
          const funcScore = calculateMatchScore(normQuery, funcNorm, 100);
          if (funcScore > score) {
            score = funcScore;
            matchedField = `عملکرد: ${pin.functionName}`;
          }

          // Wire color match (e.g. "سفید", "قرمز", "سفید با خط قرمز")
          const colorNorm = normalizeSearchText(pin.wireColor);
          const colorScore = calculateMatchScore(normQuery, colorNorm, 90);
          if (colorScore > score) {
            score = colorScore;
            matchedField = `رنگ سیم: ${pin.wireColor}`;
          }

          // Test guide / notes match
          const testNorm = normalizeSearchText(pin.testGuide || '');
          const notesNorm = normalizeSearchText(pin.notes || '');
          const testScore = calculateMatchScore(normQuery, testNorm, 60);
          const noteScore = calculateMatchScore(normQuery, notesNorm, 50);
          if (testScore > score) { score = testScore; matchedField = 'راهنمای تست و عیب‌یابی'; }
          if (noteScore > score) { score = noteScore; matchedField = 'یادداشت فنی پایه'; }

          // Connector name/code match
          const connScore = calculateMatchScore(normQuery, connNameNorm, 70);
          const codeScore = calculateMatchScore(normQuery, connCodeNorm, 75);
          if (connScore > score) { score = connScore; matchedField = `سوکت: ${conn.name}`; }
          if (codeScore > score) { score = codeScore; matchedField = `کد سوکت: ${conn.codeName}`; }
        }

        if (score > 0) {
          const isSensorActuator = isSensorOrActuatorTerm(pin.functionName) || isSensorOrActuatorTerm(conn.name);
          const pinResult: PinSearchResult = {
            type: 'pin',
            id: `${conn.id}-pin-${pin.id}`,
            pin,
            connector: conn,
            vehicle: parentVeh,
            ecu: parentEcu,
            isSensorOrActuator: isSensorActuator,
            relevance: score,
            matchedField
          };

          // Route to sensors/actuators group or standard pinout group
          if (isSensorActuator && (catFilter === 'all' || catFilter === 'sensors')) {
            result.sensors.push(pinResult);
          }
          if (catFilter === 'all' || catFilter === 'pins') {
            result.pins.push(pinResult);
          }
        }
      }
    }

    result.pins.sort((a, b) => b.relevance - a.relevance);
    result.sensors.sort((a, b) => b.relevance - a.relevance);
  }

  // -------------------------------------------------------------
  // 3. FUSEBOXES & FUSES
  // -------------------------------------------------------------
  if (catFilter === 'all' || catFilter === 'fuses') {
    for (const fb of data.fuseBoxes) {
      if (!isAllowedByStatus(fb.status, isAdmin, filters.status)) continue;
      if (filters.vehicleId && fb.vehicleId !== filters.vehicleId) continue;
      if (filters.location && filters.location !== 'all' && fb.location !== filters.location) continue;

      const parentVeh = fb.vehicleId ? vehicleMap.get(fb.vehicleId) : undefined;
      if (filters.manufacturerId && parentVeh && parentVeh.manufacturerId !== filters.manufacturerId) continue;

      const fbNameNorm = normalizeSearchText(fb.name);
      const fbLocNorm = normalizeSearchText(fb.locationFa);

      for (const fuse of fb.fuses || []) {
        if (!isAllowedByStatus(fuse.status, isAdmin, filters.status)) continue;

        let score = 0;
        let matchedField = '';

        if (!normQuery) {
          if (filters.vehicleId || filters.location) {
            score = 10;
            matchedField = 'فیلتر موقعیت جعبه‌فیوز';
          }
        } else {
          // Fuse code match (e.g. "F10", "F-10", "F 10", "10")
          const fuseCodeNorm = normalizeSearchText(fuse.code);
          if (fuseCodeNorm === normQuery || `فیوز ${fuseCodeNorm}` === normQuery) {
            score = 130;
            matchedField = `کد فیوز ${fuse.code}`;
          } else {
            const codeScore = calculateMatchScore(normQuery, fuseCodeNorm, 110);
            if (codeScore > score) { score = codeScore; matchedField = `شماره فیوز: ${fuse.code}`; }
          }

          // Amperage match: e.g. "15A", "15 آمپر", or matching numeric ampValue
          if (ampValue !== null && fuse.ratingAmps === ampValue) {
            const ampScore = 115;
            if (ampScore > score) {
              score = ampScore;
              matchedField = `جریان نامی: ${fuse.ratingAmps} آمپر`;
            }
          }

          // Function name match (e.g. "پمپ بنزین", "چراغ‌های نور پایین")
          const funcNorm = normalizeSearchText(fuse.functionName);
          const funcScore = calculateMatchScore(normQuery, funcNorm, 100);
          if (funcScore > score) {
            score = funcScore;
            matchedField = `عملکرد فیوز: ${fuse.functionName}`;
          }

          // Circuit details match
          const circuitNorm = normalizeSearchText(fuse.circuitDetails || '');
          const circuitScore = calculateMatchScore(normQuery, circuitNorm, 80);
          if (circuitScore > score) {
            score = circuitScore;
            matchedField = `مدار: ${fuse.circuitDetails}`;
          }

          // Power supply type match (e.g. "+30", "+15", "سوئیچ", "باتری")
          const supplyNorm = normalizeSearchText(fuse.powerSupplyType || '');
          const supplyScore = calculateMatchScore(normQuery, supplyNorm, 70);
          if (supplyScore > score) {
            score = supplyScore;
            matchedField = `تغذیه: ${fuse.powerSupplyType}`;
          }

          // FuseBox name match
          const fbScore = calculateMatchScore(normQuery, fbNameNorm, 60);
          const fbLocScore = calculateMatchScore(normQuery, fbLocNorm, 50);
          if (fbScore > score) { score = fbScore; matchedField = `جعبه‌فیوز: ${fb.name}`; }
          if (fbLocScore > score) { score = fbLocScore; matchedField = `محل: ${fb.locationFa}`; }
        }

        if (score > 0) {
          result.fuses.push({
            type: 'fuse',
            id: `${fb.id}-fuse-${fuse.id}`,
            fuse,
            fuseBox: fb,
            vehicle: parentVeh,
            relevance: score,
            matchedField
          });
        }
      }
    }

    result.fuses.sort((a, b) => b.relevance - a.relevance);
  }

  // -------------------------------------------------------------
  // 4. RELAYS
  // -------------------------------------------------------------
  if (catFilter === 'all' || catFilter === 'relays') {
    for (const fb of data.fuseBoxes) {
      if (!isAllowedByStatus(fb.status, isAdmin, filters.status)) continue;
      if (filters.vehicleId && fb.vehicleId !== filters.vehicleId) continue;
      if (filters.location && filters.location !== 'all' && fb.location !== filters.location) continue;

      const parentVeh = fb.vehicleId ? vehicleMap.get(fb.vehicleId) : undefined;
      if (filters.manufacturerId && parentVeh && parentVeh.manufacturerId !== filters.manufacturerId) continue;

      const fbNameNorm = normalizeSearchText(fb.name);

      for (const relay of fb.relays || []) {
        if (!isAllowedByStatus(relay.status, isAdmin, filters.status)) continue;

        let score = 0;
        let matchedField = '';

        if (!normQuery) {
          if (filters.vehicleId || filters.location) {
            score = 10;
            matchedField = 'فیلتر موقعیت رله';
          }
        } else {
          // Relay code match (e.g. "R1", "رله دوبل")
          const codeNorm = normalizeSearchText(relay.code);
          const nameNorm = normalizeSearchText(relay.name);
          const funcNorm = normalizeSearchText(relay.functionName);

          if (codeNorm === normQuery || nameNorm === normQuery) {
            score = 120;
            matchedField = `شناسه رله: ${relay.name || relay.code}`;
          } else {
            const codeScore = calculateMatchScore(normQuery, codeNorm, 100);
            const nameScore = calculateMatchScore(normQuery, nameNorm, 100);
            const funcScore = calculateMatchScore(normQuery, funcNorm, 95);

            if (codeScore > score) { score = codeScore; matchedField = `کد رله: ${relay.code}`; }
            if (nameScore > score) { score = nameScore; matchedField = `نام رله: ${relay.name}`; }
            if (funcScore > score) { score = funcScore; matchedField = `عملکرد رله: ${relay.functionName}`; }
          }

          // Rating / Diagnostics
          const ratingNorm = normalizeSearchText(relay.rating || '');
          const diagNorm = normalizeSearchText(relay.diagnostics || '');
          const circuitNorm = normalizeSearchText(relay.circuitDetails || '');

          const ratingScore = calculateMatchScore(normQuery, ratingNorm, 70);
          const diagScore = calculateMatchScore(normQuery, diagNorm, 60);
          const circuitScore = calculateMatchScore(normQuery, circuitNorm, 65);

          if (ratingScore > score) { score = ratingScore; matchedField = `مشخصات: ${relay.rating}`; }
          if (circuitScore > score) { score = circuitScore; matchedField = `مدار مرتبط: ${relay.circuitDetails}`; }
          if (diagScore > score) { score = diagScore; matchedField = 'عیب‌یابی رله'; }

          // FuseBox name match
          const fbScore = calculateMatchScore(normQuery, fbNameNorm, 50);
          if (fbScore > score) { score = fbScore; matchedField = `جعبه‌فیوز: ${fb.name}`; }
        }

        if (score > 0) {
          result.relays.push({
            type: 'relay',
            id: `${fb.id}-relay-${relay.id}`,
            relay,
            fuseBox: fb,
            vehicle: parentVeh,
            relevance: score,
            matchedField
          });
        }
      }
    }

    result.relays.sort((a, b) => b.relevance - a.relevance);
  }

  // -------------------------------------------------------------
  // 5. WIRING DIAGRAMS
  // -------------------------------------------------------------
  if (catFilter === 'all' || catFilter === 'diagrams') {
    for (const diag of data.diagrams) {
      if (!isAllowedByStatus(diag.status, isAdmin, filters.status)) continue;
      if (filters.vehicleId && diag.vehicleId !== filters.vehicleId) continue;

      const parentVeh = diag.vehicleId ? vehicleMap.get(diag.vehicleId) : undefined;
      if (filters.manufacturerId && parentVeh && parentVeh.manufacturerId !== filters.manufacturerId) continue;

      let score = 0;
      let matchedField = '';

      if (!normQuery) {
        if (filters.vehicleId) {
          score = 10;
          matchedField = 'فیلتر خودروی نقشه';
        }
      } else {
        const titleNorm = normalizeSearchText(diag.title);
        const catNorm = normalizeSearchText(diag.categoryFa);
        const descNorm = normalizeSearchText(diag.description);

        const titleScore = calculateMatchScore(normQuery, titleNorm, 100);
        const catScore = calculateMatchScore(normQuery, catNorm, 80);
        const descScore = calculateMatchScore(normQuery, descNorm, 60);

        if (titleScore > score) { score = titleScore; matchedField = `عنوان نقشه: ${diag.title}`; }
        if (catScore > score) { score = catScore; matchedField = `دسته‌بندی: ${diag.categoryFa}`; }
        if (descScore > score) { score = descScore; matchedField = 'توضیحات نقشه سیم‌کشی'; }
      }

      if (score > 0) {
        result.diagrams.push({
          type: 'diagram',
          id: diag.id,
          diagram: diag,
          vehicle: parentVeh,
          relevance: score,
          matchedField
        });
      }
    }

    result.diagrams.sort((a, b) => b.relevance - a.relevance);
  }

  // -------------------------------------------------------------
  // 6. TECHNICAL MEDIA ITEMS
  // -------------------------------------------------------------
  if (catFilter === 'all' || catFilter === 'media') {
    for (const media of data.mediaItems) {
      if (!isAllowedByStatus(media.status, isAdmin, filters.status)) continue;
      if (filters.vehicleId && media.vehicleId && media.vehicleId !== filters.vehicleId) continue;

      const parentVeh = media.vehicleId ? vehicleMap.get(media.vehicleId) : undefined;
      if (filters.manufacturerId && parentVeh && parentVeh.manufacturerId !== filters.manufacturerId) continue;

      let score = 0;
      let matchedField = '';

      // Determine parent entity title
      let parentTitle = parentVeh?.name || 'مستند فنی';
      if (media.entityType === 'fusebox') {
        const fb = data.fuseBoxes.find(f => f.id === media.entityId);
        if (fb) parentTitle = `${fb.name} (${parentVeh?.name || ''})`;
      } else if (media.entityType === 'connector') {
        const conn = data.connectors.find(c => c.id === media.entityId);
        if (conn) parentTitle = `${conn.name} (${parentVeh?.name || ''})`;
      }

      if (!normQuery) {
        if (filters.vehicleId) {
          score = 10;
          matchedField = 'فیلتر تصویر خودرو';
        }
      } else {
        const titleNorm = normalizeSearchText(media.title);
        const descNorm = normalizeSearchText(media.description || '');
        const srcNorm = normalizeSearchText(media.source || '');
        const parentNorm = normalizeSearchText(parentTitle);

        const titleScore = calculateMatchScore(normQuery, titleNorm, 100);
        const descScore = calculateMatchScore(normQuery, descNorm, 70);
        const parentScore = calculateMatchScore(normQuery, parentNorm, 60);
        const srcScore = calculateMatchScore(normQuery, srcNorm, 50);

        if (titleScore > score) { score = titleScore; matchedField = `عنوان تصویر: ${media.title}`; }
        if (descScore > score) { score = descScore; matchedField = 'توضیحات تصویر فنی'; }
        if (parentScore > score) { score = parentScore; matchedField = `قطعه مرتبط: ${parentTitle}`; }
        if (srcScore > score) { score = srcScore; matchedField = `منبع: ${media.source}`; }
      }

      if (score > 0) {
        result.media.push({
          type: 'media',
          id: media.id,
          media,
          parentTitle,
          vehicle: parentVeh,
          relevance: score,
          matchedField
        });
      }
    }

    result.media.sort((a, b) => b.relevance - a.relevance);
  }

  // Calculate distinct total count
  result.totalCount =
    result.vehicles.length +
    result.pins.length +
    result.fuses.length +
    result.relays.length +
    result.diagrams.length +
    result.media.length;

  return result;
}

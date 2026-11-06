/**
 * AutoPin Pro - Automotive Electrical & Vehicle Comparison Engine
 * Accurately analyzes and contrasts vehicles, ECUs, connectors, pinouts,
 * fuse boxes, and relays based solely on verified database records.
 * Follows strict workshop engineering principles: equal pin/fuse number does NOT
 * imply equal function without technical validation.
 */

import {
  Vehicle,
  Connector,
  ConnectorPin,
  FuseBox,
  Fuse,
  Relay,
  ECU,
  WiringDiagram
} from '../types';
import { normalizeSearchText } from './searchEngine';

export type ComparisonOutcome =
  | 'identical'           // یکسان - عملکرد و مشخصات کاملاً برابر
  | 'different'           // متفاوت - عملکرد یا مشخصات فرق دارد
  | 'only_first'          // فقط در مورد اول موجود است
  | 'only_second'         // فقط در مورد دوم موجود است
  | 'needs_review'        // نیازمند بررسی فنی (عدم تطابق قطعی یا تفاوت پایه‌ها)
  | 'insufficient_data';  // اطلاعات ناکافی برای مقایسه

export type ComparisonFilterType =
  | 'all'
  | 'identical_only'
  | 'differences_only'
  | 'only_first'
  | 'only_second'
  | 'needs_review_only';

// -------------------------------------------------------------
// 1. VEHICLE COMPARISON
// -------------------------------------------------------------

export interface VehicleComparisonRow {
  label: string;
  firstValue: string;
  secondValue: string;
  isIdentical: boolean;
  notes?: string;
}

export interface VehicleComparisonResult {
  firstVehicle: Vehicle;
  secondVehicle: Vehicle;
  rows: VehicleComparisonRow[];
  firstEngines: string[];
  secondEngines: string[];
  commonEngines: string[];
  firstEcuCount: number;
  secondEcuCount: number;
  firstConnectorCount: number;
  secondConnectorCount: number;
  firstTotalPins: number;
  secondTotalPins: number;
  firstFuseBoxCount: number;
  secondFuseBoxCount: number;
  firstDiagramCount: number;
  secondDiagramCount: number;
  commonFeaturesCount: number;
  differingFeaturesCount: number;
}

export function compareVehicles(
  v1: Vehicle,
  v2: Vehicle,
  allConnectors: Connector[],
  allFuseBoxes: FuseBox[],
  allDiagrams: WiringDiagram[],
  allEcus: ECU[]
): VehicleComparisonResult {
  const v1Connectors = allConnectors.filter(c => c.vehicleId === v1.id);
  const v2Connectors = allConnectors.filter(c => c.vehicleId === v2.id);

  const v1FuseBoxes = allFuseBoxes.filter(f => f.vehicleId === v1.id);
  const v2FuseBoxes = allFuseBoxes.filter(f => f.vehicleId === v2.id);

  const v1Diagrams = allDiagrams.filter(d => d.vehicleId === v1.id);
  const v2Diagrams = allDiagrams.filter(d => d.vehicleId === v2.id);

  const v1Ecus = allEcus.filter(e => e.vehicleId === v1.id);
  const v2Ecus = allEcus.filter(e => e.vehicleId === v2.id);

  const v1Pins = v1Connectors.reduce((acc, c) => acc + (c.pins?.length || c.pinCount || 0), 0);
  const v2Pins = v2Connectors.reduce((acc, c) => acc + (c.pins?.length || c.pinCount || 0), 0);

  const rows: VehicleComparisonRow[] = [
    {
      label: 'نام و مدل خودرو',
      firstValue: v1.name,
      secondValue: v2.name,
      isIdentical: v1.name.trim() === v2.name.trim()
    },
    {
      label: 'نام فارسی و نسل',
      firstValue: `${v1.persianName || 'اطلاعات ثبت نشده'} (${v1.generation || 'اطلاعات ثبت نشده'})`,
      secondValue: `${v2.persianName || 'اطلاعات ثبت نشده'} (${v2.generation || 'اطلاعات ثبت نشده'})`,
      isIdentical: v1.persianName === v2.persianName && v1.generation === v2.generation
    },
    {
      label: 'سال‌های تولید',
      firstValue: v1.modelYears || 'اطلاعات ثبت نشده',
      secondValue: v2.modelYears || 'اطلاعات ثبت نشده',
      isIdentical: v1.modelYears === v2.modelYears
    },
    {
      label: 'سیستم برقی و شبکه ارتباطی',
      firstValue: v1.electricalSystem || 'اطلاعات ثبت نشده',
      secondValue: v2.electricalSystem || 'اطلاعات ثبت نشده',
      isIdentical: normalizeSearchText(v1.electricalSystem) === normalizeSearchText(v2.electricalSystem)
    },
    {
      label: 'تعداد موتورهای ثبت‌شده',
      firstValue: `${v1.engines?.length || 0} موتور`,
      secondValue: `${v2.engines?.length || 0} موتور`,
      isIdentical: v1.engines?.length === v2.engines?.length
    },
    {
      label: 'کدهای موتور پشتیبانی‌شده',
      firstValue: v1.engines?.map(e => `${e.code} (${e.name})`).join(' ، ') || 'اطلاعات ثبت نشده',
      secondValue: v2.engines?.map(e => `${e.code} (${e.name})`).join(' ، ') || 'اطلاعات ثبت نشده',
      isIdentical:
        v1.engines?.map(e => e.code).sort().join(',') ===
        v2.engines?.map(e => e.code).sort().join(',')
    },
    {
      label: 'تعداد ECUهای تخصصی',
      firstValue: `${v1Ecus.length} واحد`,
      secondValue: `${v2Ecus.length} واحد`,
      isIdentical: v1Ecus.length === v2Ecus.length
    },
    {
      label: 'مدل‌های ECU ثبت‌شده',
      firstValue: v1Ecus.map(e => `${e.brand} ${e.model}`).join(' ، ') || 'اطلاعات ثبت نشده',
      secondValue: v2Ecus.map(e => `${e.brand} ${e.model}`).join(' ، ') || 'اطلاعات ثبت نشده',
      isIdentical:
        v1Ecus.map(e => e.model).sort().join(',') ===
        v2Ecus.map(e => e.model).sort().join(',')
    },
    {
      label: 'سوکت‌ها و پایه‌های پیناوت',
      firstValue: `${v1Connectors.length} سوکت (${v1Pins} پایه)`,
      secondValue: `${v2Connectors.length} سوکت (${v2Pins} پایه)`,
      isIdentical: v1Connectors.length === v2Connectors.length && v1Pins === v2Pins
    },
    {
      label: 'جعبه‌فیوزها و یونیت‌های رله',
      firstValue: `${v1FuseBoxes.length} یونیت (${v1FuseBoxes.map(f => f.locationFa).join('، ')})`,
      secondValue: `${v2FuseBoxes.length} یونیت (${v2FuseBoxes.map(f => f.locationFa).join('، ')})`,
      isIdentical: v1FuseBoxes.length === v2FuseBoxes.length
    },
    {
      label: 'نقشه‌های سیم‌کشی مستند',
      firstValue: `${v1Diagrams.length} نقشه فنی`,
      secondValue: `${v2Diagrams.length} نقشه فنی`,
      isIdentical: v1Diagrams.length === v2Diagrams.length
    }
  ];

  const v1EngCodes = (v1.engines || []).map(e => e.code);
  const v2EngCodes = (v2.engines || []).map(e => e.code);
  const commonEngines = v1EngCodes.filter(c => v2EngCodes.includes(c));

  const commonFeaturesCount = rows.filter(r => r.isIdentical).length;
  const differingFeaturesCount = rows.filter(r => !r.isIdentical).length;

  return {
    firstVehicle: v1,
    secondVehicle: v2,
    rows,
    firstEngines: v1EngCodes,
    secondEngines: v2EngCodes,
    commonEngines,
    firstEcuCount: v1Ecus.length,
    secondEcuCount: v2Ecus.length,
    firstConnectorCount: v1Connectors.length,
    secondConnectorCount: v2Connectors.length,
    firstTotalPins: v1Pins,
    secondTotalPins: v2Pins,
    firstFuseBoxCount: v1FuseBoxes.length,
    secondFuseBoxCount: v2FuseBoxes.length,
    firstDiagramCount: v1Diagrams.length,
    secondDiagramCount: v2Diagrams.length,
    commonFeaturesCount,
    differingFeaturesCount
  };
}

// -------------------------------------------------------------
// 2. ECU & PINOUT COMPARISON
// -------------------------------------------------------------

export interface EcuPinComparisonRow {
  id: string;
  // Side 1
  firstPinNumber?: string;
  firstFunctionName?: string;
  firstWireColor?: string;
  firstWireHex?: string;
  firstSignalType?: string;
  firstVoltage?: string;
  // Side 2
  secondPinNumber?: string;
  secondFunctionName?: string;
  secondWireColor?: string;
  secondWireHex?: string;
  secondSignalType?: string;
  secondVoltage?: string;
  // Verdict
  outcome: ComparisonOutcome;
  technicalNote: string;
}

export interface EcuComparisonResult {
  firstEcu: ECU;
  secondEcu: ECU;
  firstVehicle?: Vehicle;
  secondVehicle?: Vehicle;
  firstConnectors: Connector[];
  secondConnectors: Connector[];
  pinRows: EcuPinComparisonRow[];
  totalComparedPins: number;
  identicalCount: number;
  differentCount: number;
  onlyFirstCount: number;
  onlySecondCount: number;
  needsReviewCount: number;
}

/**
 * Compares two ECUs and their respective connector pinouts.
 * Matches pins based on functional semantic equivalence rather than blind pin numbers.
 */
export function compareEcus(
  ecu1: ECU,
  ecu2: ECU,
  allConnectors: Connector[],
  allVehicles: Vehicle[]
): EcuComparisonResult {
  const v1 = allVehicles.find(v => v.id === ecu1.vehicleId);
  const v2 = allVehicles.find(v => v.id === ecu2.vehicleId);

  const v1Connectors = allConnectors.filter(c => c.ecuId === ecu1.id || (c.vehicleId === ecu1.vehicleId && c.category === 'ecu'));
  const v2Connectors = allConnectors.filter(c => c.ecuId === ecu2.id || (c.vehicleId === ecu2.vehicleId && c.category === 'ecu'));

  const allV1Pins: { pin: ConnectorPin; connector: Connector }[] = [];
  v1Connectors.forEach(conn => {
    (conn.pins || []).forEach(pin => allV1Pins.push({ pin, connector: conn }));
  });

  const allV2Pins: { pin: ConnectorPin; connector: Connector }[] = [];
  v2Connectors.forEach(conn => {
    (conn.pins || []).forEach(pin => allV2Pins.push({ pin, connector: conn }));
  });

  const pinRows: EcuPinComparisonRow[] = [];
  const matchedV2PinIds = new Set<string>();

  // 1. Process all V1 pins and attempt genuine technical matching against V2 pins
  for (const item1 of allV1Pins) {
    const p1 = item1.pin;
    const normP1Func = normalizeSearchText(p1.functionName);

    // Look for technical equivalence in V2
    let matchedItem2: { pin: ConnectorPin; connector: Connector } | null = null;
    let matchQuality: 'exact_func' | 'same_pin_number' | 'fuzzy_func' | null = null;

    // Check exact or high-confidence function match
    for (const item2 of allV2Pins) {
      if (matchedV2PinIds.has(item2.pin.id)) continue;
      const normP2Func = normalizeSearchText(item2.pin.functionName);

      if (normP1Func === normP2Func) {
        matchedItem2 = item2;
        matchQuality = 'exact_func';
        break;
      }
    }

    // If not found, check if same pin number has identical signal type
    if (!matchedItem2) {
      for (const item2 of allV2Pins) {
        if (matchedV2PinIds.has(item2.pin.id)) continue;
        if (normalizeSearchText(item2.pin.pinNumber) === normalizeSearchText(p1.pinNumber)) {
          matchedItem2 = item2;
          matchQuality = 'same_pin_number';
          break;
        }
      }
    }

    if (matchedItem2) {
      const p2 = matchedItem2.pin;
      matchedV2PinIds.add(p2.id);

      const normP2Func = normalizeSearchText(p2.functionName);
      const isFuncIdentical = normP1Func === normP2Func;
      const isWireIdentical = normalizeSearchText(p1.wireColor) === normalizeSearchText(p2.wireColor);
      const isPinNumIdentical = normalizeSearchText(p1.pinNumber) === normalizeSearchText(p2.pinNumber);

      let outcome: ComparisonOutcome = 'different';
      let technicalNote = '';

      if (isFuncIdentical && isPinNumIdentical) {
        outcome = 'identical';
        technicalNote = 'عملکرد پایه و شماره پایه در هر دو کامپیوتر کاملاً یکسان است.';
      } else if (isFuncIdentical && !isPinNumIdentical) {
        outcome = 'needs_review';
        technicalNote = `عملکرد یکسان است اما در ECU اول روی پایه ${p1.pinNumber} و در ECU دوم روی پایه ${p2.pinNumber} قرار دارد.`;
      } else if (!isFuncIdentical && isPinNumIdentical) {
        outcome = 'different';
        technicalNote = `هشدار فنی: شماره پایه هر دو ${p1.pinNumber} است اما عملکردهای متفاوتی دارند! (پایه یکسان، مدار متفاوت)`;
      } else {
        outcome = 'needs_review';
        technicalNote = 'نیازمند بررسی نقشه دسته‌سیم کارخانه‌ای و سنجش ولتاژ.';
      }

      pinRows.push({
        id: `comp-p1-${p1.id}-p2-${p2.id}`,
        firstPinNumber: p1.pinNumber,
        firstFunctionName: p1.functionName,
        firstWireColor: p1.wireColor,
        firstWireHex: p1.wireHex,
        firstSignalType: p1.signalType,
        firstVoltage: p1.voltageRange,
        secondPinNumber: p2.pinNumber,
        secondFunctionName: p2.functionName,
        secondWireColor: p2.wireColor,
        secondWireHex: p2.wireHex,
        secondSignalType: p2.signalType,
        secondVoltage: p2.voltageRange,
        outcome,
        technicalNote
      });
    } else {
      // Present in ECU 1 only
      pinRows.push({
        id: `comp-p1-${p1.id}-only`,
        firstPinNumber: p1.pinNumber,
        firstFunctionName: p1.functionName,
        firstWireColor: p1.wireColor,
        firstWireHex: p1.wireHex,
        firstSignalType: p1.signalType,
        firstVoltage: p1.voltageRange,
        outcome: 'only_first',
        technicalNote: `این پایه اختصاصی ${ecu1.brand} ${ecu1.model} است و در مشخصات ${ecu2.model} ثبت نشده است.`
      });
    }
  }

  // 2. Add remaining V2 pins not matched
  for (const item2 of allV2Pins) {
    if (matchedV2PinIds.has(item2.pin.id)) continue;
    const p2 = item2.pin;

    pinRows.push({
      id: `comp-p2-${p2.id}-only`,
      secondPinNumber: p2.pinNumber,
      secondFunctionName: p2.functionName,
      secondWireColor: p2.wireColor,
      secondWireHex: p2.wireHex,
      secondSignalType: p2.signalType,
      secondVoltage: p2.voltageRange,
      outcome: 'only_second',
      technicalNote: `این پایه اختصاصی ${ecu2.brand} ${ecu2.model} است و در مشخصات ${ecu1.model} وجود ندارد.`
    });
  }

  const identicalCount = pinRows.filter(r => r.outcome === 'identical').length;
  const differentCount = pinRows.filter(r => r.outcome === 'different').length;
  const onlyFirstCount = pinRows.filter(r => r.outcome === 'only_first').length;
  const onlySecondCount = pinRows.filter(r => r.outcome === 'only_second').length;
  const needsReviewCount = pinRows.filter(r => r.outcome === 'needs_review').length;

  return {
    firstEcu: ecu1,
    secondEcu: ecu2,
    firstVehicle: v1,
    secondVehicle: v2,
    firstConnectors: v1Connectors,
    secondConnectors: v2Connectors,
    pinRows,
    totalComparedPins: pinRows.length,
    identicalCount,
    differentCount,
    onlyFirstCount,
    onlySecondCount,
    needsReviewCount
  };
}

// -------------------------------------------------------------
// 3. FUSEBOX & RELAY COMPARISON
// -------------------------------------------------------------

export interface FuseComparisonRow {
  id: string;
  firstCode?: string;
  firstRatingAmps?: number;
  firstFunctionName?: string;
  firstCircuitDetails?: string;
  firstPowerSupply?: string;
  secondCode?: string;
  secondRatingAmps?: number;
  secondFunctionName?: string;
  secondCircuitDetails?: string;
  secondPowerSupply?: string;
  outcome: ComparisonOutcome;
  technicalNote: string;
}

export interface RelayComparisonRow {
  id: string;
  firstCode?: string;
  firstName?: string;
  firstRating?: string;
  firstFunctionName?: string;
  firstPins?: string;
  secondCode?: string;
  secondName?: string;
  secondRating?: string;
  secondFunctionName?: string;
  secondPins?: string;
  outcome: ComparisonOutcome;
  technicalNote: string;
}

export interface FuseBoxComparisonResult {
  firstFuseBox: FuseBox;
  secondFuseBox: FuseBox;
  firstVehicle?: Vehicle;
  secondVehicle?: Vehicle;
  fuseRows: FuseComparisonRow[];
  relayRows: RelayComparisonRow[];
  identicalFusesCount: number;
  differentFusesCount: number;
  onlyFirstFusesCount: number;
  onlySecondFusesCount: number;
  differingAmpsCount: number;
  identicalRelaysCount: number;
  differentRelaysCount: number;
}

export function compareFuseBoxes(
  fb1: FuseBox,
  fb2: FuseBox,
  allVehicles: Vehicle[]
): FuseBoxComparisonResult {
  const v1 = allVehicles.find(v => v.id === fb1.vehicleId);
  const v2 = allVehicles.find(v => v.id === fb2.vehicleId);

  const fuseRows: FuseComparisonRow[] = [];
  const matchedFb2FuseIds = new Set<string>();

  // Compare fuses
  for (const f1 of fb1.fuses || []) {
    const normCode1 = normalizeSearchText(f1.code);
    const normFunc1 = normalizeSearchText(f1.functionName);

    // Look for matching fuse in fb2 by code
    const f2Match = (fb2.fuses || []).find(
      f => !matchedFb2FuseIds.has(f.id) && normalizeSearchText(f.code) === normCode1
    );

    if (f2Match) {
      matchedFb2FuseIds.add(f2Match.id);
      const normFunc2 = normalizeSearchText(f2Match.functionName);
      const isFuncIdentical = normFunc1 === normFunc2;
      const isAmpIdentical = f1.ratingAmps === f2Match.ratingAmps;

      let outcome: ComparisonOutcome = 'different';
      let technicalNote = '';

      if (isFuncIdentical && isAmpIdentical) {
        outcome = 'identical';
        technicalNote = `عملکرد و آمپراژ (${f1.ratingAmps}A) در هر دو جعبه‌فیوز کاملاً یکسان است.`;
      } else if (isFuncIdentical && !isAmpIdentical) {
        outcome = 'different';
        technicalNote = `عملکرد یکسان ولی آمپراژ متفاوت: در اولی ${f1.ratingAmps}A و در دومی ${f2Match.ratingAmps}A ثبت شده است.`;
      } else if (!isFuncIdentical && isAmpIdentical) {
        outcome = 'different';
        technicalNote = `کد فیوز یکسان (${f1.code}) اما مدارهای متفاوتی را تغذیه می‌کنند.`;
      } else {
        outcome = 'different';
        technicalNote = `کد فیوز یکسان (${f1.code})، ولی هم مدار و هم آمپراژ (${f1.ratingAmps}A در برابر ${f2Match.ratingAmps}A) متفاوت است.`;
      }

      fuseRows.push({
        id: `fuse-${f1.id}-${f2Match.id}`,
        firstCode: f1.code,
        firstRatingAmps: f1.ratingAmps,
        firstFunctionName: f1.functionName,
        firstCircuitDetails: f1.circuitDetails,
        firstPowerSupply: f1.powerSupplyType,
        secondCode: f2Match.code,
        secondRatingAmps: f2Match.ratingAmps,
        secondFunctionName: f2Match.functionName,
        secondCircuitDetails: f2Match.circuitDetails,
        secondPowerSupply: f2Match.powerSupplyType,
        outcome,
        technicalNote
      });
    } else {
      // Fuse only in fb1
      fuseRows.push({
        id: `fuse-${f1.id}-only`,
        firstCode: f1.code,
        firstRatingAmps: f1.ratingAmps,
        firstFunctionName: f1.functionName,
        firstCircuitDetails: f1.circuitDetails,
        firstPowerSupply: f1.powerSupplyType,
        outcome: 'only_first',
        technicalNote: `این فیوز فقط در ${fb1.name} وجود دارد.`
      });
    }
  }

  // Remaining fuses in fb2
  for (const f2 of fb2.fuses || []) {
    if (matchedFb2FuseIds.has(f2.id)) continue;
    fuseRows.push({
      id: `fuse-${f2.id}-only2`,
      secondCode: f2.code,
      secondRatingAmps: f2.ratingAmps,
      secondFunctionName: f2.functionName,
      secondCircuitDetails: f2.circuitDetails,
      secondPowerSupply: f2.powerSupplyType,
      outcome: 'only_second',
      technicalNote: `این فیوز فقط در ${fb2.name} وجود دارد.`
    });
  }

  // Relays Comparison
  const relayRows: RelayComparisonRow[] = [];
  const matchedFb2RelayIds = new Set<string>();

  for (const r1 of fb1.relays || []) {
    const normName1 = normalizeSearchText(r1.name || r1.code);
    const r2Match = (fb2.relays || []).find(
      r => !matchedFb2RelayIds.has(r.id) && (
        normalizeSearchText(r.name || r.code) === normName1 ||
        normalizeSearchText(r.functionName) === normalizeSearchText(r1.functionName)
      )
    );

    if (r2Match) {
      matchedFb2RelayIds.add(r2Match.id);
      const isRatingSame = normalizeSearchText(r1.rating) === normalizeSearchText(r2Match.rating);
      const isFuncSame = normalizeSearchText(r1.functionName) === normalizeSearchText(r2Match.functionName);

      let outcome: ComparisonOutcome = 'different';
      let technicalNote = '';

      if (isRatingSame && isFuncSame) {
        outcome = 'identical';
        technicalNote = `رله با عملکرد و مشخصات یکسان (${r1.rating || 'استاندارد'}).`;
      } else {
        outcome = 'different';
        technicalNote = `مشخصات جریان یا عملکرد رله در دو جعبه‌فیوز تفاوت دارد.`;
      }

      relayRows.push({
        id: `relay-${r1.id}-${r2Match.id}`,
        firstCode: r1.code,
        firstName: r1.name,
        firstRating: r1.rating,
        firstFunctionName: r1.functionName,
        firstPins: `تحریک: ${r1.coilPins} · کنتاکت: ${r1.contactPins}`,
        secondCode: r2Match.code,
        secondName: r2Match.name,
        secondRating: r2Match.rating,
        secondFunctionName: r2Match.functionName,
        secondPins: `تحریک: ${r2Match.coilPins} · کنتاکت: ${r2Match.contactPins}`,
        outcome,
        technicalNote
      });
    } else {
      relayRows.push({
        id: `relay-${r1.id}-only`,
        firstCode: r1.code,
        firstName: r1.name,
        firstRating: r1.rating,
        firstFunctionName: r1.functionName,
        firstPins: `تحریک: ${r1.coilPins} · کنتاکت: ${r1.contactPins}`,
        outcome: 'only_first',
        technicalNote: `این رله فقط در ${fb1.name} نصب شده است.`
      });
    }
  }

  for (const r2 of fb2.relays || []) {
    if (matchedFb2RelayIds.has(r2.id)) continue;
    relayRows.push({
      id: `relay-${r2.id}-only2`,
      secondCode: r2.code,
      secondName: r2.name,
      secondRating: r2.rating,
      secondFunctionName: r2.functionName,
      secondPins: `تحریک: ${r2.coilPins} · کنتاکت: ${r2.contactPins}`,
      outcome: 'only_second',
      technicalNote: `این رله فقط در ${fb2.name} نصب شده است.`
    });
  }

  const identicalFusesCount = fuseRows.filter(r => r.outcome === 'identical').length;
  const differentFusesCount = fuseRows.filter(r => r.outcome === 'different').length;
  const onlyFirstFusesCount = fuseRows.filter(r => r.outcome === 'only_first').length;
  const onlySecondFusesCount = fuseRows.filter(r => r.outcome === 'only_second').length;
  const differingAmpsCount = fuseRows.filter(r => r.firstRatingAmps && r.secondRatingAmps && r.firstRatingAmps !== r.secondRatingAmps).length;

  const identicalRelaysCount = relayRows.filter(r => r.outcome === 'identical').length;
  const differentRelaysCount = relayRows.filter(r => r.outcome === 'different').length;

  return {
    firstFuseBox: fb1,
    secondFuseBox: fb2,
    firstVehicle: v1,
    secondVehicle: v2,
    fuseRows,
    relayRows,
    identicalFusesCount,
    differentFusesCount,
    onlyFirstFusesCount,
    onlySecondFusesCount,
    differingAmpsCount,
    identicalRelaysCount,
    differentRelaysCount
  };
}

// -------------------------------------------------------------
// 4. CONNECTOR COMPARISON
// -------------------------------------------------------------

export interface ConnectorPinComparisonRow {
  id: string;
  firstPinNumber?: string;
  firstFunctionName?: string;
  firstWireColor?: string;
  firstWireHex?: string;
  firstSignalType?: string;
  secondPinNumber?: string;
  secondFunctionName?: string;
  secondWireColor?: string;
  secondWireHex?: string;
  secondSignalType?: string;
  outcome: ComparisonOutcome;
  technicalNote: string;
}

export interface ConnectorComparisonResult {
  firstConnector: Connector;
  secondConnector: Connector;
  firstVehicle?: Vehicle;
  secondVehicle?: Vehicle;
  rows: ConnectorPinComparisonRow[];
  identicalCount: number;
  differentCount: number;
  onlyFirstCount: number;
  onlySecondCount: number;
  needsReviewCount: number;
}

export function compareConnectors(
  conn1: Connector,
  conn2: Connector,
  allVehicles: Vehicle[]
): ConnectorComparisonResult {
  const v1 = allVehicles.find(v => v.id === conn1.vehicleId);
  const v2 = allVehicles.find(v => v.id === conn2.vehicleId);

  const rows: ConnectorPinComparisonRow[] = [];
  const matchedP2Ids = new Set<string>();

  for (const p1 of conn1.pins || []) {
    const normP1Func = normalizeSearchText(p1.functionName);
    const normP1Num = normalizeSearchText(p1.pinNumber);

    // Try finding match in conn2
    const p2Match = (conn2.pins || []).find(
      p => !matchedP2Ids.has(p.id) && (
        normalizeSearchText(p.functionName) === normP1Func ||
        normalizeSearchText(p.pinNumber) === normP1Num
      )
    );

    if (p2Match) {
      matchedP2Ids.add(p2Match.id);
      const isFuncSame = normP1Func === normalizeSearchText(p2Match.functionName);
      const isNumSame = normP1Num === normalizeSearchText(p2Match.pinNumber);
      const isSignalSame = p1.signalType === p2Match.signalType;

      let outcome: ComparisonOutcome = 'different';
      let technicalNote = '';

      if (isFuncSame && isNumSame && isSignalSame) {
        outcome = 'identical';
        technicalNote = 'شماره پایه، عملکرد و نوع سیگنال در هر دو سوکت کاملاً برابر است.';
      } else if (isFuncSame && !isNumSame) {
        outcome = 'needs_review';
        technicalNote = `عملکرد یکسان ولی در سوکت اول پایه ${p1.pinNumber} و در سوکت دوم پایه ${p2Match.pinNumber} است.`;
      } else if (!isFuncSame && isNumSame) {
        outcome = 'different';
        technicalNote = `پایه شماره ${p1.pinNumber} در دو سوکت وظایف کاملاً متفاوتی دارند!`;
      } else {
        outcome = 'different';
        technicalNote = 'پایه‌ها عملکرد متفاوتی را ارائه می‌دهند.';
      }

      rows.push({
        id: `cp-${p1.id}-${p2Match.id}`,
        firstPinNumber: p1.pinNumber,
        firstFunctionName: p1.functionName,
        firstWireColor: p1.wireColor,
        firstWireHex: p1.wireHex,
        firstSignalType: p1.signalType,
        secondPinNumber: p2Match.pinNumber,
        secondFunctionName: p2Match.functionName,
        secondWireColor: p2Match.wireColor,
        secondWireHex: p2Match.wireHex,
        secondSignalType: p2Match.signalType,
        outcome,
        technicalNote
      });
    } else {
      rows.push({
        id: `cp-${p1.id}-only`,
        firstPinNumber: p1.pinNumber,
        firstFunctionName: p1.functionName,
        firstWireColor: p1.wireColor,
        firstWireHex: p1.wireHex,
        firstSignalType: p1.signalType,
        outcome: 'only_first',
        technicalNote: `فقط در ${conn1.name} موجود است.`
      });
    }
  }

  for (const p2 of conn2.pins || []) {
    if (matchedP2Ids.has(p2.id)) continue;
    rows.push({
      id: `cp-${p2.id}-only2`,
      secondPinNumber: p2.pinNumber,
      secondFunctionName: p2.functionName,
      secondWireColor: p2.wireColor,
      secondWireHex: p2.wireHex,
      secondSignalType: p2.signalType,
      outcome: 'only_second',
      technicalNote: `فقط در ${conn2.name} موجود است.`
    });
  }

  const identicalCount = rows.filter(r => r.outcome === 'identical').length;
  const differentCount = rows.filter(r => r.outcome === 'different').length;
  const onlyFirstCount = rows.filter(r => r.outcome === 'only_first').length;
  const onlySecondCount = rows.filter(r => r.outcome === 'only_second').length;
  const needsReviewCount = rows.filter(r => r.outcome === 'needs_review').length;

  return {
    firstConnector: conn1,
    secondConnector: conn2,
    firstVehicle: v1,
    secondVehicle: v2,
    rows,
    identicalCount,
    differentCount,
    onlyFirstCount,
    onlySecondCount,
    needsReviewCount
  };
}

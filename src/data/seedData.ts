import {
  Manufacturer,
  Vehicle,
  ECU,
  Connector,
  FuseBox,
  WiringDiagram
} from '../types';

export const SEED_MANUFACTURERS: Manufacturer[] = [
  {
    id: 'ikco',
    name: 'ایران خودرو',
    englishName: 'Iran Khodro',
    country: 'ایران',
    logoText: 'IKCO',
    category: 'iranian'
  },
  {
    id: 'saipa',
    name: 'سایپا',
    englishName: 'Saipa',
    country: 'ایران',
    logoText: 'SAIPA',
    category: 'iranian'
  },
  {
    id: 'parskhodro',
    name: 'پارس خودرو',
    englishName: 'Pars Khodro',
    country: 'ایران',
    logoText: 'PARS',
    category: 'iranian'
  },
  {
    id: 'renault',
    name: 'رنو فرانسه',
    englishName: 'Renault',
    country: 'فرانسه',
    logoText: 'RENAULT',
    category: 'european'
  },
  {
    id: 'peugeot',
    name: 'پژو فرانسه',
    englishName: 'Peugeot',
    country: 'فرانسه',
    logoText: 'PEUGEOT',
    category: 'european'
  },
  {
    id: 'hyundai',
    name: 'هیوندای و کیا',
    englishName: 'Hyundai / Kia',
    country: 'کره جنوبی',
    logoText: 'HYUNDAI',
    category: 'korean'
  },
  {
    id: 'chinese',
    name: 'خودروهای چینی (مدیران / کرمان)',
    englishName: 'Chinese Brands',
    country: 'چین',
    logoText: 'CHERY/JAC',
    category: 'chinese'
  }
];

export const SEED_VEHICLES: Vehicle[] = [
  {
    id: 'peugeot-206',
    manufacturerId: 'ikco',
    name: 'پژو ۲۰۶ (تیپ ۲ و ۵)',
    persianName: 'پژو ۲۰۶ فرانسه و ایرانی',
    generation: 'فرانسه (مولتی‌پلکس BSI) و ایرانیزه',
    modelYears: '۱۳۸۰ - ۱۴۰۱ (2001-2022)',
    electricalSystem: 'مولتی‌پلکس VAN / CAN و شبکه BSI - BM34',
    description: 'یکی از پرطرفدارترین خودروهای مجهز به سیستم برق شبکه‌ای BSI در بازار ایران با ECU‌های متنوع بوش، والئو و زیمنس.',
    createdAt: Date.now(),
    engines: [
      {
        id: 'eng-tu5',
        vehicleId: 'peugeot-206',
        code: 'TU5 JP4',
        name: 'موتور ۱.۶ لیتری ۱۶ سوپاپ (TU5)',
        fuelSystem: 'انژکتوری چندنقطه‌ای ترتیبی (MPI)',
        valves: 16,
        displacementCc: 1587,
        notes: 'مجهز به دو میل سوپاپ، دریچه گاز برقی یا سیمی، توان ۱۰۵ اسب بخار'
      },
      {
        id: 'eng-tu3',
        vehicleId: 'peugeot-206',
        code: 'TU3 JP',
        name: 'موتور ۱.۴ لیتری ۸ سوپاپ (TU3)',
        fuelSystem: 'انژکتوری با ECU ساژم S2000 یا والئو J34P',
        valves: 8,
        displacementCc: 1360,
        notes: 'موتور استاندارد تیپ ۲ با دریچه گاز سیمی و مصرف اقتصادی'
      }
    ]
  },
  {
    id: 'pride-tiba',
    manufacturerId: 'saipa',
    name: 'پراید و تیبا / ساینا / کوییک',
    persianName: 'پراید، تیبا و خانواده X200',
    generation: 'سری X100 و X200',
    modelYears: '۱۳۸۲ - ۱۴۰۲ (2003-2023)',
    electricalSystem: 'سیستم سنتی رله دوبل و شبکه کن BCM در مدل‌های جدید',
    description: 'پرتیراژترین پلتفرم خودرویی با سیستم مدیریت موتور زیمنس، بوش و کروز، عیب‌یابی سریع و پیناوت‌های استاندارد.',
    createdAt: Date.now(),
    engines: [
      {
        id: 'eng-m13',
        vehicleId: 'pride-tiba',
        code: 'M13',
        name: 'موتور ۱.۳ لیتری انژکتوری پراید',
        fuelSystem: 'تزریق سوخت ترتیبی با ECU زیمنس یا ساژم',
        valves: 8,
        displacementCc: 1323,
        notes: 'سیستم جرقه‌زنی ضایع‌شونده (Wasted Spark) و رله دوبل'
      },
      {
        id: 'eng-m15',
        vehicleId: 'pride-tiba',
        code: 'M15',
        name: 'موتور ۱.۵ لیتری ۸ سوپاپ تیبا و ساینا',
        fuelSystem: 'انژکتوری با کنترل الکترونیکی سنسور میل سوپاپ',
        valves: 8,
        displacementCc: 1503,
        notes: '۸۷ اسب بخار با دریچه گاز مکانیکی یا برقی در مدل‌های یورو ۵'
      }
    ]
  },
  {
    id: 'pars-samand',
    manufacturerId: 'ikco',
    name: 'پژو پارس و سمند / ۴۰۵',
    persianName: 'پژو پارس و سمند (XU7 / EF7)',
    generation: 'پلتفرم پژو ۴۰۵ و سمند',
    modelYears: '۱۳۷۹ - ۱۴۰۲',
    electricalSystem: 'سیستم برق سنتی، مالتی‌پلکس CEC یا اکوماکس کروز',
    description: 'شامل انواع ECU‌های ساژم S2000، زیمنس VDO، بوش ME7.4.9 (موتور EF7 بنزینی و پایه‌گازسوز) و SSAT.',
    createdAt: Date.now(),
    engines: [
      {
        id: 'eng-xu7',
        vehicleId: 'pars-samand',
        code: 'XU7 L3 / L4',
        name: 'موتور ۱.۸ لیتری ۸ سوپاپ (XU7)',
        fuelSystem: 'انژکتوری با رله دوبل و دلکو الکترونیکی یا کوئیل دوبل',
        valves: 8,
        displacementCc: 1761,
        notes: 'موتور پرکاربرد ۱۰۰ اسب بخاری با نسبت تراکم ۹.۳'
      },
      {
        id: 'eng-ef7',
        vehicleId: 'pars-samand',
        code: 'EF7 CVVT',
        name: 'موتور ملی ۱.۷ لیتری ۱۶ سوپاپ (EF7)',
        fuelSystem: 'انژکتوری با زمان‌بندی متغیر سوپاپ‌ها (CVVT)',
        valves: 16,
        displacementCc: 1648,
        notes: 'ECU بوش ME7.4.9 یا کروز با سنسور کوبش و دریچه گاز برقی'
      }
    ]
  },
  {
    id: 'renault-tondar',
    manufacturerId: 'renault',
    name: 'رنو تندر ۹۰ و ساندرو (L90)',
    persianName: 'رنو تندر ۹۰، پارس تندر و ساندرو',
    generation: 'نسل اول داچیا لاگان',
    modelYears: '۱۳۸۶ - ۱۳۹۸',
    electricalSystem: 'سیستم الکترونیکی یونیت UCH با شبکه CAN',
    description: 'مجهز به کامپیوتر موتور والئو / زیمنس EMS 3132 با دو سوکت و سیستم ایموبلایزر پیشرفته در جعبه کنترل UCH.',
    createdAt: Date.now(),
    engines: [
      {
        id: 'eng-k4m',
        vehicleId: 'renault-tondar',
        code: 'K4M 690',
        name: 'موتور ۱.۶ لیتری ۱۶ سوپاپ رنو',
        fuelSystem: 'انژکتوری با کوئیل‌های مدادی جداگانه برای هر سیلندر',
        valves: 16,
        displacementCc: 1598,
        notes: 'توان ۱۰۵ اسب بخار، سیستم کوئیل‌های سری ۲ به ۲'
      }
    ]
  },
  {
    id: 'universal-sensors',
    manufacturerId: 'ikco',
    name: 'بانک جامع سنسورها و عملگرهای استاندارد',
    persianName: 'سنسورهای اکسیژن، مپ، دور موتور، رله دوبل و استپر',
    generation: 'عمومی و کاربردی تمام خودروها',
    modelYears: 'کلیه سال‌ها',
    electricalSystem: 'استاندارد بوش، زیمنس، دلفی و والئو',
    description: 'راهنمای سریع عیب‌یابی و پیناوت سنسورها و رله دوبل مشترک بین تمام خودروهای داخلی و وارداتی برای تست سریع در تعمیرگاه.',
    createdAt: Date.now(),
    engines: []
  }
];

export const SEED_ECUS: ECU[] = [
  {
    id: 'ecu-bosch-me744',
    vehicleId: 'peugeot-206',
    engineId: 'eng-tu5',
    brand: 'بوش (Bosch)',
    model: 'ME 7.4.4',
    hardwareVersion: '0 261 206 943',
    softwareVersion: 'Flash 29F400 / 29F200',
    connectorCount: 3,
    description: 'ای‌سی‌یوی فرانسوی بسیار محبوب در پژو ۲۰۶ تیپ ۵ قدیم با ۳ سوکت ۳۲ پایه مشکی، ۳۲ پایه خاکستری و ۴۸ پایه قهوه‌ای.'
  },
  {
    id: 'ecu-valeo-j34p',
    vehicleId: 'peugeot-206',
    engineId: 'eng-tu3',
    brand: 'والئو (Valeo)',
    model: 'J34P (Johnson Controls)',
    hardwareVersion: 'Pluriel 2158',
    softwareVersion: 'SW 9664',
    connectorCount: 3,
    description: 'کامپیوتر موتور ۲۰۶ تیپ ۲ و ۲۰۶ با موتور TU3 و دریچه گاز سیمی، دارای میکرو ST10.'
  },
  {
    id: 'ecu-siemens-vdo',
    vehicleId: 'pride-tiba',
    engineId: 'eng-m13',
    brand: 'زیمنس (Siemens VDO / Continental)',
    model: 'SIM2K / SIMOS / ایموبلایزردار',
    hardwareVersion: '5WY51',
    softwareVersion: 'C10 / CI4 / CA0',
    connectorCount: 1,
    description: 'ECU تک‌سوکت پراید، تیبا و پژو با سوکت مشکی و ضامن کشویی، بسیار با دوام و تعمیرپذیر.'
  },
  {
    id: 'ecu-sagem-s2000',
    vehicleId: 'pars-samand',
    engineId: 'eng-xu7',
    brand: 'ساژم (SAGEM)',
    model: 'S2000-10 / S2000-PL4',
    hardwareVersion: 'PSA SAGEM',
    softwareVersion: 'LC / 3E / 3F',
    connectorCount: 3,
    description: 'ای‌سی‌یوی پرکاربرد در پژو ۴۰۵، پارس و سمند با موتور XU7، دارای ۳ سوکت رنگی و ارتباط مستقیم با رله دوبل.'
  },
  {
    id: 'ecu-ems3132',
    vehicleId: 'renault-tondar',
    engineId: 'eng-k4m',
    brand: 'رنو / زیمنس کنتیننتال',
    model: 'Sirius 32 / EMS 3132',
    hardwareVersion: 'S110140025',
    softwareVersion: 'Flash 29F200BB',
    connectorCount: 2,
    description: 'کامپیوتر موتور رنو تندر ۹۰ و ساندرو، شامل دو سوکت مجزای قهوه‌ای و مشکی با پین‌های اختصاصی کوئیل‌های مدادی.'
  }
];

export const SEED_CONNECTORS: Connector[] = [
  // Peugeot 206 Bosch ME 7.4.4 - Grey Connector 32 Pin
  {
    id: 'conn-206-me744-grey',
    vehicleId: 'peugeot-206',
    ecuId: 'ecu-bosch-me744',
    name: 'سوکت ۳۲ پایه خاکستری (CH32 / 32V GR)',
    codeName: '32V GR - سنسورها و تغذیه',
    category: 'ecu',
    pinCount: 32,
    rows: 4,
    cols: 8,
    shape: 'grid',
    socketColor: 'خاکستری',
    socketColorHex: '#71717a',
    source: 'نقشه فنی پژو فرانسه و مدارک سایپا یدک و ایران‌خودرو',
    status: 'published',
    notes: 'حاوی خطوط تغذیه اصلی رله دوبل، سنسور فشار منیفولد (MAP)، سنسور موقعیت پدال و دمای آب',
    createdAt: Date.now(),
    pins: [
      {
        id: 'p-206-me-gr-a1',
        connectorId: 'conn-206-me744-grey',
        pinNumber: 'A1',
        wireColor: 'سفید با خط مشکی',
        wireHex: '#ffffff',
        wireStripeHex: '#18181b',
        functionName: 'تغذیه ۱۲ ولت دائم سوئیچ از رله دوبل (پایه ۱)',
        signalType: '12V_BAT',
        voltageRange: '12.0V - 14.4V',
        testGuide: 'سوئیچ بسته یا باز ولتاژ ۱۲ ولت کامل باید خوانده شود.',
        notes: 'مسیر فیوز اصلی موتور'
      },
      {
        id: 'p-206-me-gr-a2',
        connectorId: 'conn-206-me744-grey',
        pinNumber: 'A2',
        wireColor: 'زرد',
        wireHex: '#eab308',
        functionName: 'برق ۱۲ ولت پس از سوئیچ (IGNITION 15)',
        signalType: '12V_IGN',
        voltageRange: '12.0V - 14.4V',
        testGuide: 'با باز کردن سوئیچ باید ولتاژ باتری روی این پایه بیاید.',
        notes: 'از جعبه‌فیوز BSM سوکت خاکستری'
      },
      {
        id: 'p-206-me-gr-a3',
        connectorId: 'conn-206-me744-grey',
        pinNumber: 'A3',
        wireColor: 'سبز روشن',
        wireHex: '#4ade80',
        functionName: 'سیگنال سنسور فشار منیفولد هوا (MAP Sensor Signal)',
        signalType: 'ANALOG_IN',
        voltageRange: '0.8V - 4.5V',
        testGuide: 'در دور آرام حدود ۱.۱ تا ۱.۳ ولت؛ با گاز ناگهانی ولتاژ تا ۴.۲ ولت بالا می‌رود.',
        notes: 'پایه ۳ سنسور مپ مگنتی مارلی / بوش'
      },
      {
        id: 'p-206-me-gr-a4',
        connectorId: 'conn-206-me744-grey',
        pinNumber: 'A4',
        wireColor: 'نارنجی',
        wireHex: '#f97316',
        functionName: 'ولتاژ مرجع ۵ ولت سنسور مپ و پدال گاز',
        signalType: '5V_REF',
        voltageRange: '4.95V - 5.05V',
        testGuide: 'سوئیچ باز ولتاژ رفرنس ۵ ولت دقیق؛ در صورت نوسان ECU آسیب دیده است.',
        notes: 'خروجی رگولاتور داخلی ECU'
      },
      {
        id: 'p-206-me-gr-b1',
        connectorId: 'conn-206-me744-grey',
        pinNumber: 'B1',
        wireColor: 'مشکی با خط زرد',
        wireHex: '#18181b',
        wireStripeHex: '#eab308',
        functionName: 'اتصال بدنه اصلی تغذیه ECU (Power Ground)',
        signalType: 'GROUND',
        voltageRange: '0.0V (حداکثر 0.05V)',
        testGuide: 'تست افت ولتاژ نسبت به قطب منفی باتری نباید بیش از ۰.۰۵ ولت باشد.',
        notes: 'پیچ اتصال بدنه روی سرسیلندر و گیربکس'
      },
      {
        id: 'p-206-me-gr-b2',
        connectorId: 'conn-206-me744-grey',
        pinNumber: 'B2',
        wireColor: 'خاکستری',
        wireHex: '#9ca3af',
        functionName: 'سیگنال دمای هوای ورودی منیفولد (IAT Sensor)',
        signalType: 'ANALOG_IN',
        voltageRange: '0.5V - 3.8V',
        testGuide: 'سنسور NTC؛ با گرم شدن هوا مقاومت و ولتاژ کاهش می‌یابد.',
        notes: 'ترکیبی در سوکت سنسور مپ پایه ۲'
      },
      {
        id: 'p-206-me-gr-b3',
        connectorId: 'conn-206-me744-grey',
        pinNumber: 'B3',
        wireColor: 'سبز با خط زرد',
        wireHex: '#22c55e',
        wireStripeHex: '#facc15',
        functionName: 'منفی مشترک سنسورهای مپ، دمای آب و سنسور اکسیژن',
        signalType: 'GROUND',
        voltageRange: '0.0V',
        testGuide: 'اتصال مستقیم به شیلد و منفی سنسورها، نباید به بدنه موتور اتصال مستقیم داشته باشد.',
        notes: 'Sensor Signal Ground'
      },
      {
        id: 'p-206-me-gr-b4',
        connectorId: 'conn-206-me744-grey',
        pinNumber: 'B4',
        wireColor: 'آبی روشن',
        wireHex: '#38bdf8',
        functionName: 'سیگنال سنسور دمای آب خنک‌کننده موتور (ECT/CTS)',
        signalType: 'ANALOG_IN',
        voltageRange: '0.5V - 3.5V',
        testGuide: 'در دمای ۲۰ درجه حدود ۳ ولت؛ در دمای کاری ۹۰ درجه حدود ۰.۶ ولت.',
        notes: 'مربوط به سنسور سبز رنگ ۲ پایه سرسیلندر'
      },
      {
        id: 'p-206-me-gr-c1',
        connectorId: 'conn-206-me744-grey',
        pinNumber: 'C1',
        wireColor: 'قرمز با خط سفید',
        wireHex: '#ef4444',
        wireStripeHex: '#ffffff',
        functionName: 'فرمان منفی بوبین رله اصلی دوبل (Main Relay Control)',
        signalType: 'PWM_PULSE',
        voltageRange: '0V (فعال) / 12V (غیرفعال)',
        testGuide: 'با باز شدن سوئیچ، ECU این پایه را به منفی وصل می‌کند تا رله دوبل بچسبد.',
        notes: 'پایه ۷ رله دوبل'
      },
      {
        id: 'p-206-me-gr-c2',
        connectorId: 'conn-206-me744-grey',
        pinNumber: 'C2',
        wireColor: 'قهوه‌ای',
        wireHex: '#78350f',
        functionName: 'فرمان منفی بوبین رله پمپ بنزین (Fuel Pump Relay)',
        signalType: 'PWM_PULSE',
        voltageRange: '0V (فعال) / 12V (قطع)',
        testGuide: 'هنگام سوئیچ باز به مدت ۳ ثانیه منفی می‌شود و در صورت چرخش موتور دائم منفی می‌ماند.',
        notes: 'پایه ۱۰ رله دوبل'
      },
      {
        id: 'p-206-me-gr-c3',
        connectorId: 'conn-206-me744-grey',
        pinNumber: 'C3',
        wireColor: 'سفید',
        wireHex: '#ffffff',
        functionName: 'سیگنال سنسور اکسیژن بالا (Upstream O2 Sensor Signal)',
        signalType: 'ANALOG_IN',
        voltageRange: '0.1V - 0.9V نوسانی',
        testGuide: 'پس از گرم شدن موتور باید بین ۱۰۰ تا ۹۰۰ میلی‌ولت با فرکانس حداقل ۱ هرتز نوسان کند.',
        notes: 'سیم مشکی سنسور اکسیژن ۴ سیمه'
      },
      {
        id: 'p-206-me-gr-c4',
        connectorId: 'conn-206-me744-grey',
        pinNumber: 'C4',
        wireColor: 'زرد با خط سبز',
        wireHex: '#eab308',
        wireStripeHex: '#16a34a',
        functionName: 'منفی گرمکن سنسور اکسیژن (O2 Heater PWM Ground)',
        signalType: 'PWM_PULSE',
        voltageRange: 'Duty Cycle متغیر',
        testGuide: 'تست کنترل پالس عرض با اسیلوسکوپ جهت جلوگیری از شوک حرارتی به زیرکونیوم سنسور.',
        notes: 'پایه‌های گرمکن سنسور اکسیژن'
      },
      {
        id: 'p-206-me-gr-d1',
        connectorId: 'conn-206-me744-grey',
        pinNumber: 'D1',
        wireColor: 'بنفش',
        wireHex: '#a855f7',
        functionName: 'خط ارتباطی عیب‌یابی شبکه دیاگ (K-Line)',
        signalType: 'K_LINE',
        voltageRange: '12V با پالس‌های دیجیتال',
        testGuide: 'اتصال به پایه شماره ۷ کانکتور ۱۶ پین OBD2 داخل جعبه‌فیوز اتاق.',
        notes: 'پروتکل ارتباطی ISO 9141'
      },
      {
        id: 'p-206-me-gr-d2',
        connectorId: 'conn-206-me744-grey',
        pinNumber: 'D2',
        wireColor: 'قرمز',
        wireHex: '#ef4444',
        functionName: 'سیگنال پدال گاز پتانسیومتر اول (TPS 1 Track)',
        signalType: 'ANALOG_IN',
        voltageRange: '0.5V - 4.5V',
        testGuide: 'پدال رها: حدود ۰.۸ ولت، پدال تا انتها: ۴.۲ ولت بدون افت و پرش ناگهانی.',
        notes: 'پدال گاز ۶ پایه بوش'
      },
      {
        id: 'p-206-me-gr-d3',
        connectorId: 'conn-206-me744-grey',
        pinNumber: 'D3',
        wireColor: 'آبی تیره',
        wireHex: '#1d4ed8',
        functionName: 'سیگنال پدال گاز پتانسیومتر دوم (TPS 2 Track)',
        signalType: 'ANALOG_IN',
        voltageRange: '0.25V - 2.25V',
        testGuide: 'دقیقاً نصف مقدار مسیر اول پتانسیومتر است؛ برای ایمنی و تطبیق زاویه پدال.',
        notes: 'مسیر ایمنی دوگانه در دریچه برقی'
      },
      {
        id: 'p-206-me-gr-d4',
        connectorId: 'conn-206-me744-grey',
        pinNumber: 'D4',
        wireColor: 'سفید با خط خاکستری',
        wireHex: '#ffffff',
        wireStripeHex: '#6b7280',
        functionName: 'پایه آزاد یا سنسور ناک ۲ (بدون اتصال در این مدل)',
        signalType: 'DISCONNECTED',
        voltageRange: '0V',
        testGuide: 'پایه رزرو.',
        notes: 'NC'
      }
    ]
  },

  // Peugeot 206 Bosch ME 7.4.4 - Black Connector 32 Pin (Ignition & Injection)
  {
    id: 'conn-206-me744-black',
    vehicleId: 'peugeot-206',
    ecuId: 'ecu-bosch-me744',
    name: 'سوکت ۳۲ پایه مشکی (CH32 / 32V NR)',
    codeName: '32V NR - انژکتورها، کوئیل و دور موتور',
    category: 'ecu',
    pinCount: 32,
    rows: 4,
    cols: 8,
    shape: 'grid',
    socketColor: 'مشکی',
    socketColorHex: '#18181b',
    source: 'نقشه فنی برق پژو ۲۰۶ فرانسه - کتاب تعمیرات ایران‌خودرو',
    status: 'published',
    notes: 'خطوط فرمان ترانزیستورهای قدرت پاشش انژکتور ۱ تا ۴، جرقه کوئیل دوبل و سنسور موقعیت میل‌لنگ',
    createdAt: Date.now(),
    pins: [
      {
        id: 'p-206-me-bl-a1',
        connectorId: 'conn-206-me744-black',
        pinNumber: 'A1',
        wireColor: 'سفید با خط قرمز',
        wireHex: '#ffffff',
        wireStripeHex: '#ef4444',
        functionName: 'فرمان پاشش انژکتور سیلندر ۱ (سیگنال منفی پالسی)',
        signalType: 'PWM_PULSE',
        voltageRange: '۱۲ ولت استندبای / پالس منفی با اسپایک تا ۶۰V',
        testGuide: 'با لامپ تست LED یا اسیلوسکوپ؛ پهنای پالس در دور آرام حدود ۲.۵ تا ۳.۵ میلی‌ثانیه.',
        notes: 'سیلندر ۱ سمت گیربکس فرانسوی'
      },
      {
        id: 'p-206-me-bl-a2',
        connectorId: 'conn-206-me744-black',
        pinNumber: 'A2',
        wireColor: 'سفید با خط سبز',
        wireHex: '#ffffff',
        wireStripeHex: '#22c55e',
        functionName: 'فرمان پاشش انژکتور سیلندر ۲ (سیگنال منفی پالسی)',
        signalType: 'PWM_PULSE',
        voltageRange: '۱۲ ولت استندبای / پالس منفی اسپایک‌دار',
        testGuide: 'تست پهنای پالس انژکتور ۲؛ با عیب‌یاب پارامتر پاشش خوانده شود.',
        notes: 'پایه منفی انژکتور ۲'
      },
      {
        id: 'p-206-me-bl-a3',
        connectorId: 'conn-206-me744-black',
        pinNumber: 'A3',
        wireColor: 'سفید با خط آبی',
        wireHex: '#ffffff',
        wireStripeHex: '#3b82f6',
        functionName: 'فرمان پاشش انژکتور سیلندر ۳ (سیگنال منفی پالسی)',
        signalType: 'PWM_PULSE',
        voltageRange: '۱۲ ولت استندبای / پالس منفی اسپایک‌دار',
        testGuide: 'چک کردن مقاومت بوبین انژکتور حدود ۱۴.۵ اهم باشد.',
        notes: 'پایه منفی انژکتور ۳'
      },
      {
        id: 'p-206-me-bl-a4',
        connectorId: 'conn-206-me744-black',
        pinNumber: 'A4',
        wireColor: 'سفید با خط زرد',
        wireHex: '#ffffff',
        wireStripeHex: '#eab308',
        functionName: 'فرمان پاشش انژکتور سیلندر ۴ (سیگنال منفی پالسی)',
        signalType: 'PWM_PULSE',
        voltageRange: '۱۲ ولت استندبای / پالس منفی اسپایک‌دار',
        testGuide: 'تست پاشش سیلندر ۴ سمت تسمه تایم.',
        notes: 'پایه منفی انژکتور ۴'
      },
      {
        id: 'p-206-me-bl-b1',
        connectorId: 'conn-206-me744-black',
        pinNumber: 'B1',
        wireColor: 'قرمز با خط مشکی',
        wireHex: '#ef4444',
        wireStripeHex: '#18181b',
        functionName: 'فرمان جرقه‌زنی کوئیل سیلندر ۱ و ۴ (ترانزیستور قدرت جرقه)',
        signalType: 'PWM_PULSE',
        voltageRange: 'پالس ۵ ولت به ماژول کوئیل یا منفی شارژ اولیه',
        testGuide: 'تست Dwell Time؛ در صورت عدم جرقه در سیلندر ۱ و ۴ این پایه بررسی شود.',
        notes: 'کوئیل یکپارچه ساژم / والئو'
      },
      {
        id: 'p-206-me-bl-b2',
        connectorId: 'conn-206-me744-black',
        pinNumber: 'B2',
        wireColor: 'قرمز با خط سفید',
        wireHex: '#ef4444',
        wireStripeHex: '#ffffff',
        functionName: 'فرمان جرقه‌زنی کوئیل سیلندر ۲ و ۳ (ترانزیستور قدرت جرقه)',
        signalType: 'PWM_PULSE',
        voltageRange: 'پالس فرمان شارژ کوئیل ۲ و ۳',
        testGuide: 'تست عملکرد سیلندر ۲ و ۳ با شمع و وایر/کوئیل.',
        notes: 'کوئیل دوبل'
      },
      {
        id: 'p-206-me-bl-c1',
        connectorId: 'conn-206-me744-black',
        pinNumber: 'C1',
        wireColor: 'مشکی شیلددار',
        wireHex: '#27272a',
        functionName: 'سیگنال مثبت سنسور دور موتور (CKP + Inductive Sensor)',
        signalType: 'ANALOG_IN',
        voltageRange: 'AC ولتاژ ۱V تا ۵۰V متناوب',
        testGuide: 'تست با مولتی‌متر در حالت AC ولتاژ بیش از ۲ ولت در هنگام استارت؛ شکل موج سینوسی ۶۰ منهای ۲ دندانه فلایویل.',
        notes: 'مقاومت سنسور بین ۳۰۰ تا ۴۵۰ اهم'
      },
      {
        id: 'p-206-me-bl-c2',
        connectorId: 'conn-206-me744-black',
        pinNumber: 'C2',
        wireColor: 'سفید شیلددار',
        wireHex: '#ffffff',
        functionName: 'سیگنال منفی سنسور دور موتور (CKP - Inductive Sensor)',
        signalType: 'GROUND',
        voltageRange: 'مرجع صفر سنسور سلفی',
        testGuide: 'شیلد ضد نویز استارت بررسی شود.',
        notes: 'سنسور دور موتور بالای پوسته گیربکس'
      },
      {
        id: 'p-206-me-bl-d1',
        connectorId: 'conn-206-me744-black',
        pinNumber: 'D1',
        wireColor: 'زرد روشن',
        wireHex: '#fef08a',
        functionName: 'سیگنال سنسور موقعیت میل سوپاپ (CMP Hall Sensor)',
        signalType: 'PWM_PULSE',
        voltageRange: '0V / 5V مربعی دیجیتال',
        testGuide: 'سنسور اثر هال تشخیص فاز سوپاپ‌ها جهت پاشش ترتیبی سیلندرها.',
        notes: 'پشت سرسیلندر سمت باتری'
      },
      {
        id: 'p-206-me-bl-d2',
        connectorId: 'conn-206-me744-black',
        pinNumber: 'D2',
        wireColor: 'سبز با خط سفید',
        wireHex: '#22c55e',
        wireStripeHex: '#ffffff',
        functionName: 'فرمان شیر برقی کنیستر بنزین (Purge Canister Valve)',
        signalType: 'PWM_PULSE',
        voltageRange: 'پالس منفی متغیر بر اساس دمای آب و لود موتور',
        testGuide: 'شیر برقی جذب بخارات بنزین باک واقع در زیر گلگیر راست.',
        notes: 'Evap Canister Solenoid'
      }
    ]
  },

  // Pride & Tiba Siemens VDO Single Connector (90 Pin / Multi-Pin standard)
  {
    id: 'conn-pride-siemens',
    vehicleId: 'pride-tiba',
    ecuId: 'ecu-siemens-vdo',
    name: 'سوکت استاندارد زیمنس VDO پراید و تیبا',
    codeName: 'Siemens 90-Pin Main Harness',
    category: 'ecu',
    pinCount: 40,
    rows: 4,
    cols: 10,
    shape: 'grid',
    socketColor: 'مشکی با قفل اهرمی نارنجی',
    socketColorHex: '#18181b',
    source: 'نقشه الکتریکال شرکت سایپا و کاتالوگ کنتیننتال زیمنس',
    status: 'published',
    notes: 'پین‌های حیاتی روشن‌شدن خودرو: برق دائم سوئیچ، پمپ بنزین، رله دوبل، سنسور دور موتور و انژکتورها',
    createdAt: Date.now(),
    pins: [
      {
        id: 'p-pride-siem-1',
        connectorId: 'conn-pride-siemens',
        pinNumber: '1',
        wireColor: 'سفید با خط قرمز',
        wireHex: '#ffffff',
        wireStripeHex: '#ef4444',
        functionName: 'برق ۱۲ ولت دائم باتری (+30)',
        signalType: '12V_BAT',
        voltageRange: '12V - 14.4V',
        testGuide: 'تغذیه حافظه موقت و عیبیابی، نباید در زمان بسته بودن سوئیچ قطع باشد.',
        notes: 'مسیر فیوز ۱۰ آمپر اصلی داخل اتاق'
      },
      {
        id: 'p-pride-siem-2',
        connectorId: 'conn-pride-siemens',
        pinNumber: '2',
        wireColor: 'قرمز با خط زرد',
        wireHex: '#ef4444',
        wireStripeHex: '#facc15',
        functionName: 'برق ۱۲ ولت سوئیچ باز (خط ۱۵)',
        signalType: '12V_IGN',
        voltageRange: '12V',
        testGuide: 'روشن شدن چراغ چک روی صفحه آمپر مشروط به رسیدن این برق است.',
        notes: 'سیم اصلی بیدارباش ECU'
      },
      {
        id: 'p-pride-siem-3',
        connectorId: 'conn-pride-siemens',
        pinNumber: '3',
        wireColor: 'مشکی یکدست',
        wireHex: '#000000',
        functionName: 'منفی اصلی اتصال بدنه ECU',
        signalType: 'GROUND',
        voltageRange: '0.0V',
        testGuide: 'اتصال محکم کابل بدنه روی سرسیلندر نزدیک کویل.',
        notes: 'Power Ground'
      },
      {
        id: 'p-pride-siem-15',
        connectorId: 'conn-pride-siemens',
        pinNumber: '15',
        wireColor: 'سبز با خط سفید',
        wireHex: '#16a34a',
        wireStripeHex: '#ffffff',
        functionName: 'فرمان منفی بوبین رله اصلی (Main Relay Drive)',
        signalType: 'PWM_PULSE',
        voltageRange: '0V سوئیچ باز',
        testGuide: 'با باز کردن سوئیچ صدای تیک رله دوبل شنیده شود.',
        notes: 'پایه ۷ رله دوبل پرایدی'
      },
      {
        id: 'p-pride-siem-16',
        connectorId: 'conn-pride-siemens',
        pinNumber: '16',
        wireColor: 'سبز با خط زرد',
        wireHex: '#16a34a',
        wireStripeHex: '#facc15',
        functionName: 'فرمان منفی رله پمپ بنزین (Fuel Pump Drive)',
        signalType: 'PWM_PULSE',
        voltageRange: '0V هنگام استارت و کارکرد موتور',
        testGuide: 'در صورت عدم کارکرد پمپ بنزین، ولتاژ این پایه نسبت به مثبت تست شود.',
        notes: 'پایه ۱۰ رله دوبل'
      },
      {
        id: 'p-pride-siem-28',
        connectorId: 'conn-pride-siemens',
        pinNumber: '28',
        wireColor: 'آبی شیلددار',
        wireHex: '#2563eb',
        functionName: 'سیگنال سنسور دور موتور (CKP Sensor +)',
        signalType: 'ANALOG_IN',
        voltageRange: 'AC ولتاژ ۲.۵ ولت در حال استارت',
        testGuide: 'مقاومت بین پایه‌های سنسور دور موتور پراید حدود ۸۵۰ الی ۹۵۰ اهم است.',
        notes: 'سنسور اثر القایی پشت پولی میل‌لنگ'
      },
      {
        id: 'p-pride-siem-31',
        connectorId: 'conn-pride-siemens',
        pinNumber: '31',
        wireColor: 'سفید با خط آبی',
        wireHex: '#ffffff',
        wireStripeHex: '#3b82f6',
        functionName: 'فرمان کوئیل دوبل سیلندرهای ۱ و ۴',
        signalType: 'PWM_PULSE',
        voltageRange: 'منفی شارژ با اسپایک ۳۵۰ ولت اولیه',
        testGuide: 'تست جرقه سر شمع سیلندر ۱ و ۴.',
        notes: 'ترانزیستور داخلی زیمنس'
      },
      {
        id: 'p-pride-siem-32',
        connectorId: 'conn-pride-siemens',
        pinNumber: '32',
        wireColor: 'سفید با خط سبز',
        wireHex: '#ffffff',
        wireStripeHex: '#22c55e',
        functionName: 'فرمان کوئیل دوبل سیلندرهای ۲ و ۳',
        signalType: 'PWM_PULSE',
        voltageRange: 'منفی شارژ با اسپایک اولیه',
        testGuide: 'تست جرقه سیلندر ۲ و ۳.',
        notes: 'ترانزیستور داخلی جرقه ۲ و ۳'
      },
      {
        id: 'p-pride-siem-35',
        connectorId: 'conn-pride-siemens',
        pinNumber: '35',
        wireColor: 'قهوه‌ای روشن',
        wireHex: '#a16207',
        functionName: 'سیگنال سنسور مپ منیفولد هوا (MAP Sensor Signal)',
        signalType: 'ANALOG_IN',
        voltageRange: '1.0V تا 4.5V متغیر بر اساس وکیوم موتور',
        testGuide: 'با کشیدن شیلنگ وکیوم منیفولد ولتاژ تا ۴.۵ ولت تغییر می‌کند.',
        notes: 'سنسور ۴ سیمه یکپارچه مپ و دما'
      },
      {
        id: 'p-pride-siem-36',
        connectorId: 'conn-pride-siemens',
        pinNumber: '36',
        wireColor: 'قرمز یکدست',
        wireHex: '#dc2626',
        functionName: 'ولتاژ تغذیه ۵ ولت رفرنس سنسور مپ و دریچه گاز',
        signalType: '5V_REF',
        voltageRange: '5.0V ± 0.1V',
        testGuide: 'در صورت اتصالی سیم‌کشی سنسور به بدنه، این ۵ ولت می‌افتد و خودرو خاموش می‌شود.',
        notes: '5V Reference Line'
      },
      {
        id: 'p-pride-siem-39',
        connectorId: 'conn-pride-siemens',
        pinNumber: '39',
        wireColor: 'زرد با خط آبی',
        wireHex: '#eab308',
        wireStripeHex: '#2563eb',
        functionName: 'سیگنال سنسور اکسیژن (O2 Sensor Signal)',
        signalType: 'ANALOG_IN',
        voltageRange: '0.1V تا 0.9V',
        testGuide: 'بررسی سلامت با دیاگ در بازه ولتاژی لامبدا ۱.',
        notes: 'سنسور اکسیژن ان‌تی‌کی یا بوش'
      },
      {
        id: 'p-pride-siem-40',
        connectorId: 'conn-pride-siemens',
        pinNumber: '40',
        wireColor: 'طوسی با خط مشکی',
        wireHex: '#6b7280',
        wireStripeHex: '#000000',
        functionName: 'فرمان استپر موتور پین A (Stepper Motor Coil 1A)',
        signalType: 'PWM_PULSE',
        voltageRange: '۱۲ ولت پالس پله‌ای استپ موتور',
        testGuide: 'کنترل دور آرام موتور در زمان کولرگیری و گرم شدن.',
        notes: 'مقاومت هر بوبین استپر حدود ۵۰ اهم'
      }
    ]
  },

  // Universal Sensors Library: 15-Pin Double Relay (رله دوبل)
  {
    id: 'conn-double-relay',
    vehicleId: 'universal-sensors',
    name: 'سوکت ۱۵ پایه رله دوبل استاندارد (Double Relay)',
    codeName: 'Bitron / Cartier 15-Pin Relay Socket',
    category: 'relay',
    pinCount: 15,
    rows: 3,
    cols: 5,
    shape: 'grid',
    socketColor: 'قهوه‌ای تیره یا مشکی',
    socketColorHex: '#451a03',
    source: 'استاندارد برق خودروهای پژو ۴۰۵، سمند، پراید، ۲۰۶ و پارس',
    status: 'published',
    notes: 'شاه‌کلید سیستم برق خودرو: رله اول وظیفه تغذیه ECU و سنسورها؛ رله دوم وظیفه پمپ بنزین و انژکتورها و گرمکن اکسیژن',
    createdAt: Date.now(),
    pins: [
      {
        id: 'p-dr-1',
        connectorId: 'conn-double-relay',
        pinNumber: '1',
        wireColor: 'قرمز ضخیم',
        wireHex: '#dc2626',
        functionName: 'خروجی برق ۱۲ ولت رله دوم (به پمپ بنزین، انژکتورها و کوئیل)',
        signalType: '12V_BAT',
        voltageRange: '12V - 14.4V',
        testGuide: 'هنگام استارت و کارکرد باید ولتاژ باتری کامل داشته باشد. افت ولتاژ باعث ریپ زدن خودرو می‌شود.',
        notes: 'پایه خروجی اصلی موتور'
      },
      {
        id: 'p-dr-2',
        connectorId: 'conn-double-relay',
        pinNumber: '2',
        wireColor: 'قرمز با خط سفید',
        wireHex: '#ef4444',
        wireStripeHex: '#ffffff',
        functionName: 'برق ۱۲ ولت دائم ورودی از باتری (خط ۳۰ به کنتاکت رله اول)',
        signalType: '12V_BAT',
        voltageRange: '12V دائم',
        testGuide: 'مستقیماً از فیوز کالسکه باتری می‌آید. باید دائم برق داشته باشد.',
        notes: 'ورودی تغذیه رله اول'
      },
      {
        id: 'p-dr-3',
        connectorId: 'conn-double-relay',
        pinNumber: '3',
        wireColor: 'قرمز',
        wireHex: '#ef4444',
        functionName: 'برق ۱۲ ولت ورودی به کنتاکت رله دوم',
        signalType: '12V_BAT',
        voltageRange: '12V دائم',
        testGuide: 'برق تغذیه مستقیم مدار انژکتور و پمپ بنزین.',
        notes: 'ورودی تغذیه رله دوم'
      },
      {
        id: 'p-dr-7',
        connectorId: 'conn-double-relay',
        pinNumber: '7',
        wireColor: 'سبز با خط سفید',
        wireHex: '#16a34a',
        wireStripeHex: '#ffffff',
        functionName: 'فرمان منفی بوبین رله اول (از ECU)',
        signalType: 'PWM_PULSE',
        voltageRange: '0V فعال / 12V خاموش',
        testGuide: 'با باز کردن سوئیچ، ECU این پایه را منفی می‌کند تا رله اول فعال شود.',
        notes: 'تحریک رله اصلی'
      },
      {
        id: 'p-dr-9',
        connectorId: 'conn-double-relay',
        pinNumber: '9',
        wireColor: 'زرد',
        wireHex: '#eab308',
        functionName: 'خروجی برق ۱۲ ولت رله اول (تغذیه ECU و سنسورهای موتور)',
        signalType: '12V_BAT',
        voltageRange: '12V سوئیچ باز',
        testGuide: 'تغذیه اصلی ای‌سی‌یو؛ اگر برق این پایه قطع شود چراغ چک روشن نمی‌شود و خودرو استارت بی‌حاصل می‌زند.',
        notes: 'خروجی رله اصلی'
      },
      {
        id: 'p-dr-10',
        connectorId: 'conn-double-relay',
        pinNumber: '10',
        wireColor: 'سبز با خط زرد',
        wireHex: '#16a34a',
        wireStripeHex: '#facc15',
        functionName: 'فرمان منفی بوبین رله دوم (از ECU)',
        signalType: 'PWM_PULSE',
        voltageRange: '0V هنگام استارت',
        testGuide: 'تحریک رله پمپ بنزین توسط ECU برای ایمنی در صورت تصادف.',
        notes: 'تحریک رله سوخت'
      },
      {
        id: 'p-dr-11',
        connectorId: 'conn-double-relay',
        pinNumber: '11',
        wireColor: 'قرمز با خط مشکی',
        wireHex: '#ef4444',
        wireStripeHex: '#000000',
        functionName: 'برق ۱۲ ولت ورودی بوبین رله‌ها از سوئیچ اینرسی (Inertia Switch)',
        signalType: '12V_IGN',
        voltageRange: '12V',
        testGuide: 'اگر کلید قطع‌کن اینرسی پرتاب کرده باشد این برق قطع است و رله دوبل کار نمی‌کند.',
        notes: 'مسیر کلید ضربه/اینرسی'
      },
      {
        id: 'p-dr-14',
        connectorId: 'conn-double-relay',
        pinNumber: '14',
        wireColor: 'زرد با خط سبز',
        wireHex: '#eab308',
        wireStripeHex: '#16a34a',
        functionName: 'برق ۱۲ ولت سوئیچ ورودی (+15)',
        signalType: '12V_IGN',
        voltageRange: '12V هنگام باز بودن سوئیچ',
        testGuide: 'برق ورودی تحریک سوئیچ.',
        notes: 'Ignition Line'
      }
    ]
  },

  // Oxygen Sensor Standard 4-Pin Connector
  {
    id: 'conn-o2-sensor',
    vehicleId: 'universal-sensors',
    name: 'سوکت ۴ سیم سنسور اکسیژن بوش / ان‌تی‌کی (O2 Sensor)',
    codeName: 'Universal 4-Wire Oxygen Sensor Pinout',
    category: 'sensor',
    pinCount: 4,
    rows: 1,
    cols: 4,
    shape: 'single_row',
    socketColor: 'مشکی یا خاکستری',
    socketColorHex: '#27272a',
    source: 'استاندارد جهانی سنسورهای زیرکونیومی بوش و NTK',
    status: 'published',
    notes: 'پیناوت استاندارد سنسور اکسیژن ۴ سیمه مشترک در کلیه خودروهای انژکتوری یورو ۲، یورو ۳ و یورو ۴',
    createdAt: Date.now(),
    pins: [
      {
        id: 'p-o2-1',
        connectorId: 'conn-o2-sensor',
        pinNumber: '1 (سفید)',
        wireColor: 'سفید',
        wireHex: '#ffffff',
        functionName: 'مثبت گرمکن سنسور اکسیژن (+12V Heater Supply)',
        signalType: '12V_BAT',
        voltageRange: '12V از رله دوبل یا فیوز BSM',
        testGuide: 'مقاومت بین دو سیم سفید گرمکن در دمای ۲۰ درجه بین ۴ الی ۱۵ اهم است.',
        notes: 'تغذیه گرمکن سرامیکی'
      },
      {
        id: 'p-o2-2',
        connectorId: 'conn-o2-sensor',
        pinNumber: '2 (سفید)',
        wireColor: 'سفید',
        wireHex: '#ffffff',
        functionName: 'فرمان منفی گرمکن سنسور از ECU (Heater Ground PWM)',
        signalType: 'PWM_PULSE',
        voltageRange: 'Duty Cycle منفی',
        testGuide: 'ECU برای کنترل دمای المنتی سنسور این پایه را با مدولاسیون پالس پالس منفی می‌دهد.',
        notes: 'کنترل دمای کارکرد سنسور (بیش از ۳۵۰ درجه)'
      },
      {
        id: 'p-o2-3',
        connectorId: 'conn-o2-sensor',
        pinNumber: '3 (خاکستری)',
        wireColor: 'خاکستری',
        wireHex: '#9ca3af',
        functionName: 'منفی سیگنال سنسور (Sensor Signal Ground)',
        signalType: 'GROUND',
        voltageRange: '0V دقیق',
        testGuide: 'اتصال به منفی سنسوری ای‌سی‌یو بدون نویز بدنه موتور.',
        notes: 'سیم خاکستری سنسور'
      },
      {
        id: 'p-o2-4',
        connectorId: 'conn-o2-sensor',
        pinNumber: '4 (مشکی)',
        wireColor: 'مشکی',
        wireHex: '#18181b',
        functionName: 'سیگنال خروجی سنسور اکسیژن (Lambda Output 0.1V - 0.9V)',
        signalType: 'ANALOG_IN',
        voltageRange: '0.1V (مخلوط رقیق) تا 0.9V (مخلوط غنی)',
        testGuide: 'در صورت قفل بودن ولتاژ روی ۰.۴۵ ولت (ولتاژ بایاس)، سنسور معیوب یا سیم‌کشی قطع است.',
        notes: 'سیم مشکی سنسور اکسیژن'
      }
    ]
  }
];

export const SEED_FUSEBOXES: FuseBox[] = [
  // Peugeot 206 Engine Compartment Fusebox (BM34 / BSM)
  {
    id: 'fb-206-bm34',
    vehicleId: 'peugeot-206',
    name: 'جعبه‌فیوز و یونیت الکترونیکی محفظه موتور (BM34 / BSM)',
    location: 'engine',
    locationFa: 'محفظه موتور - سمت راست بالای باتری',
    realImageUrl: '',
    notes: 'شامل رله‌های داخلی پمپ بنزین، بوق، مه‌شکن و برف‌پاک‌کن به همراه فیوزهای استاندارد و ماکسی فیوزها',
    source: 'دفترچه راهنما و نقشه برق پژو ۲۰۶ فرانسه',
    fuses: [
      {
        id: 'f-206-bm-1',
        fuseBoxId: 'fb-206-bm34',
        code: 'F1',
        ratingAmps: 10,
        functionName: 'چراغ دنده‌عقب، شیر برقی کنیستر و سنسور اکسیژن',
        circuitDetails: 'مدار تغذیه کلید دنده‌عقب روی گیربکس و شیر کنیستر باک',
        powerSupplyType: '+15 (سوئیچ باز)',
        xPercent: 18,
        yPercent: 24,
        testTips: 'در صورت سوختن این فیوز، چراغ دنده عقب روشن نمی‌شود و خطای گرمکن سنسور اکسیژن ثبت می‌شود.'
      },
      {
        id: 'f-206-bm-2',
        fuseBoxId: 'fb-206-bm34',
        code: 'F2',
        ratingAmps: 15,
        functionName: 'پمپ بنزین و انژکتورها (سوئیچ باز)',
        circuitDetails: 'تغذیه رله پمپ بنزین و مدار سوخت‌رسانی فشار بالا',
        powerSupplyType: '+15 (سوئیچ باز)',
        xPercent: 25,
        yPercent: 24,
        testTips: 'اگر این فیوز بسوزد، پمپ بنزین کار نمی‌کند و ماشین روشن نمی‌شود.'
      },
      {
        id: 'f-206-bm-3',
        fuseBoxId: 'fb-206-bm34',
        code: 'F3',
        ratingAmps: 10,
        functionName: 'یونیت ترمز ضدقفل (ABS / ESP)',
        circuitDetails: 'مدار فرمان و سوپاپ‌های هیدرولیکی بلوک ترمز ABS',
        powerSupplyType: '+15 (سوئیچ باز)',
        xPercent: 32,
        yPercent: 24,
        testTips: 'با سوختن این فیوز چراغ خطای ABS روی صفحه کیلومتر روشن می‌ماند.'
      },
      {
        id: 'f-206-bm-4',
        fuseBoxId: 'fb-206-bm34',
        code: 'F4',
        ratingAmps: 10,
        functionName: 'تغذیه کامپیوتر موتور (ECU) و یونیت گیربکس اتوماتیک (AL4)',
        circuitDetails: 'خط بیدارباش و تغذیه دائم حافظه ECU موتور',
        powerSupplyType: '+30 (دائم باتری)',
        xPercent: 39,
        yPercent: 24,
        testTips: 'یکی از حیاتی‌ترین فیوزها؛ سوختن آن مساوی با خاموشی کامل خودرو است.'
      },
      {
        id: 'f-206-bm-8',
        fuseBoxId: 'fb-206-bm34',
        code: 'F8',
        ratingAmps: 20,
        functionName: 'رله استارت خودرو (Starter Solenoid)',
        circuitDetails: 'مدار تحریک اتوماتیک استارت از مغزی سوئیچ',
        powerSupplyType: '+50 (استارت)',
        xPercent: 55,
        yPercent: 35,
        testTips: 'اگر خودرو استارت نمی‌زند اما برق پشت آمپر است، فیوز F8 و رله استارت تست شود.'
      },
      {
        id: 'f-206-bm-9',
        fuseBoxId: 'fb-206-bm34',
        code: 'F9',
        ratingAmps: 15,
        functionName: 'چراغ‌های نور پایین سمت چپ (Low Beam Left)',
        circuitDetails: 'لامپ H7 کاسه چراغ جلو چپ',
        powerSupplyType: '+15 (سوئیچ باز)',
        xPercent: 62,
        yPercent: 35,
        testTips: 'چراغ‌های نور پایین مدار فیوز مجزای چپ و راست دارند.'
      },
      {
        id: 'f-206-bm-10',
        fuseBoxId: 'fb-206-bm34',
        code: 'F10',
        ratingAmps: 15,
        functionName: 'چراغ‌های نور پایین سمت راست (Low Beam Right)',
        circuitDetails: 'لامپ H7 کاسه چراغ جلو راست',
        powerSupplyType: '+15 (سوئیچ باز)',
        xPercent: 69,
        yPercent: 35,
        testTips: 'تست سوختگی لامپ یا فیوز ۱۰ با اهم‌متر.'
      },
      {
        id: 'f-206-bm-15',
        fuseBoxId: 'fb-206-bm34',
        code: 'F15',
        ratingAmps: 30,
        functionName: 'کوئیل دوبل جرقه و انژکتورها (مدار قدرت)',
        circuitDetails: 'برق ۱۲ ولت اصلی سیم‌پیچ‌های اولیه کوئیل جرقه',
        powerSupplyType: '+15 (سوئیچ باز)',
        xPercent: 45,
        yPercent: 55,
        testTips: 'آمپر بالا؛ در صورت اتصال کوتاه سیم کوئیل سریعاً می‌سوزد.'
      },
      {
        id: 'f-206-bm-mf1',
        fuseBoxId: 'fb-206-bm34',
        code: 'MF1 (Maxi)',
        ratingAmps: 50,
        functionName: 'فن خنک‌کننده رادیاتور دور تند (Cooling Fan High Speed)',
        circuitDetails: 'موتور الکتریکی فن جلوی رادیاتور',
        powerSupplyType: '+30 (دائم باتری)',
        xPercent: 82,
        yPercent: 75,
        testTips: 'ماکسی‌فیوز ۵۰ آمپر بزرگ زیر جعبه‌فیوز اصلی.'
      }
    ],
    relays: [
      {
        id: 'rel-206-bm-1',
        fuseBoxId: 'fb-206-bm34',
        code: 'R1',
        name: 'رله پمپ بنزین (Fuel Pump Relay)',
        rating: '12V 30A',
        coilPins: 'فرمان مستقیم از میکروچیپ BM34',
        contactPins: 'خروجی به فیوز F2 و سوکت پمپ بنزین زیر صندلی عقب',
        functionName: 'تامین فشار سوخت ریل انژکتور (۳.۵ بار)',
        diagnostics: 'تست صدای ۳ ثانیه‌ای اول سوئیچ باز.'
      },
      {
        id: 'rel-206-bm-2',
        fuseBoxId: 'fb-206-bm34',
        code: 'R2',
        name: 'رله بوق (Horn Relay)',
        rating: '12V 20A',
        coilPins: 'فرمان منفی از کلید بوق روی دسته راهنما (COM2000)',
        contactPins: 'خروجی به شیپور بوق جلو',
        functionName: 'به صدا درآوردن بوق بدون افت ولتاژ در دسته راهنما',
        diagnostics: 'تست عملکرد با تک‌بوق روی فرمان.'
      }
    ]
  },

  // Peugeot 206 Cabin Fusebox (BSI)
  {
    id: 'fb-206-bsi',
    vehicleId: 'peugeot-206',
    name: 'جعبه‌فیوز و یونیت مرکزی داخل اتاق (BSI)',
    location: 'cabin',
    locationFa: 'زیر داشبورد - سمت چپ راننده کنار پدال کلاچ',
    notes: 'مغز هوشمند الکترونیکی خودرو (BSI) کنترل‌کننده قفل مرکزی، شیشه‌بالابرها، رادیو و چراغ‌های سقف',
    source: 'نقشه استاندارد پژو فرانسه و کتاب الکتریک BSI ایران‌خودرو',
    fuses: [
      {
        id: 'f-206-bsi-1',
        fuseBoxId: 'fb-206-bsi',
        code: 'F1',
        ratingAmps: 15,
        functionName: 'سوکت عیب‌یابی دیاگ (OBD2) و حسگر باران',
        circuitDetails: 'پایه ۱۶ کانکتور دیاگ (برق دائم ۱۲ ولت دیاگ)',
        powerSupplyType: '+30 (دائم باتری)',
        xPercent: 20,
        yPercent: 30,
        testTips: 'اگر دستگاه دیاگ به خودرو وصل نمی‌شود و روشن نمی‌شود، فیوز F1 سوخته است.'
      },
      {
        id: 'f-206-bsi-4',
        fuseBoxId: 'fb-206-bsi',
        code: 'F4',
        ratingAmps: 20,
        functionName: 'صفحه کیلومتر و صفحه نمایش چندمنظوره (MFD ساعت و تقویم)',
        circuitDetails: 'تغذیه نمایشگر وسط داشبورد و آمپرهای سرعت و دور موتور',
        powerSupplyType: '+15 (سوئیچ باز)',
        xPercent: 35,
        yPercent: 30,
        testTips: 'سوختن این فیوز باعث خاموشی صفحه کیلومتر و ساعت وسط می‌شود.'
      },
      {
        id: 'f-206-bsi-6',
        fuseBoxId: 'fb-206-bsi',
        code: 'F6',
        ratingAmps: 10,
        functionName: 'سیستم ضدسرقت ایموبلایزر و سوئیچ ترمز',
        circuitDetails: 'حلقه آنتن ترانسپوندر دور مغزی سوئیچ و چراغ ترمز عقب',
        powerSupplyType: '+15 (سوئیچ باز)',
        xPercent: 50,
        yPercent: 30,
        testTips: 'اگر چراغ ترمزهای عقب روشن نشود یا کد سوئیچ خوانده نشود این فیوز چک شود.'
      },
      {
        id: 'f-206-bsi-15',
        fuseBoxId: 'fb-206-bsi',
        code: 'F15',
        ratingAmps: 30,
        functionName: 'موتورهای قفل مرکزی ۴ درب و درب صندوق عقب',
        circuitDetails: 'رله‌های داخلی چپ‌گرد و راست‌گرد قفل مرکزی BSI',
        powerSupplyType: '+30 (دائم باتری)',
        xPercent: 65,
        yPercent: 50,
        testTips: 'اگر با ریموت یا کلید هیچ دربی قفل نمی‌شود فیوز F15 را تست کنید.'
      }
    ],
    relays: []
  },

  // Pride & Tiba Cabin & Engine Fusebox
  {
    id: 'fb-pride-cabin',
    vehicleId: 'pride-tiba',
    name: 'جعبه‌فیوز اصلی داخل اتاق پراید و تیبا',
    location: 'cabin',
    locationFa: 'پایین داشبورد سمت چپ راننده (زیر قاب فرمان)',
    notes: 'فیوزهای تیغه‌ای کوچک مینیاتوری استاندارد خودرویی',
    source: 'دفترچه راهنمای فنی محصولات سایپا',
    fuses: [
      {
        id: 'f-pride-1',
        fuseBoxId: 'fb-pride-cabin',
        code: 'F1 (10A)',
        ratingAmps: 10,
        functionName: 'چراغ‌های پشت آمپر، ساعت و فندک خودرو',
        circuitDetails: 'تغذیه روشنایی پنل و فندک مصرفی',
        powerSupplyType: 'ACC (تجهیزات)',
        xPercent: 20,
        yPercent: 20,
        testTips: 'بیشترین خرابی در اثر اتصال شارژر فندکی غیر استاندارد رخ می‌دهد.'
      },
      {
        id: 'f-pride-2',
        fuseBoxId: 'fb-pride-cabin',
        code: 'F2 (15A)',
        ratingAmps: 15,
        functionName: 'موتور برف‌پاک‌کن و پمپ شیشه‌شور جلو و عقب',
        circuitDetails: 'مدار دور کند و تند تیغه‌های برف‌پاک‌کن',
        powerSupplyType: '+15 (سوئیچ باز)',
        xPercent: 35,
        yPercent: 20,
        testTips: 'در فصل زمستان به دلیل یخ‌زدن تیغه‌ها این فیوز ممکن است بسوزد.'
      },
      {
        id: 'f-pride-3',
        fuseBoxId: 'fb-pride-cabin',
        code: 'F3 (10A)',
        ratingAmps: 10,
        functionName: 'چراغ‌های راهنما و فلاشر (Hazard / Turn Signal)',
        circuitDetails: 'اتوماتیک راهنمای الکترونیکی',
        powerSupplyType: '+15 (سوئیچ باز)',
        xPercent: 50,
        yPercent: 20,
        testTips: 'تست اتوماتیک راهنما در صورت تندتند زدن چراغ‌ها.'
      },
      {
        id: 'f-pride-4',
        fuseBoxId: 'fb-pride-cabin',
        code: 'F4 (30A)',
        ratingAmps: 30,
        functionName: 'موتور بالابر شیشه‌های جلو و سوئیچ‌های مربوطه',
        circuitDetails: 'مدار قدرت بالابر ۲ درب جلو',
        powerSupplyType: '+15 (سوئیچ باز)',
        xPercent: 65,
        yPercent: 20,
        testTips: 'در صورت سفت شدن ریل شیشه آمپر کشیده و می‌سوزد.'
      }
    ],
    relays: []
  }
];

export const SEED_WIRING_DIAGRAMS: WiringDiagram[] = [
  {
    id: 'wd-206-injection',
    vehicleId: 'peugeot-206',
    title: 'نقشه کامل مدار پاشش انژکتور، کوئیل و سنسورهای موتور TU5 با ECU Bosch ME7.4.4',
    category: 'injection_ignition',
    categoryFa: 'سیستم سوخت‌رسانی و جرقه‌زنی',
    diagramImageUrl: '',
    description: 'نمای کامل ارتباط پایه‌های سوکت خاکستری و مشکی با سنسور مپ، سنسور اکسیژن، پدال گاز برقی، رله دوبل و ۴ سوزن انژکتور.',
    source: 'پژو فرانسه - دیاگرام رسمی PSA',
    createdAt: Date.now()
  },
  {
    id: 'wd-pride-starter',
    vehicleId: 'pride-tiba',
    title: 'نقشه مدار استارت، شارژ دینام و رله دوبل پراید و تیبا (ECU Siemens VDO)',
    category: 'starter_charging',
    categoryFa: 'استارت و شارژ باتری',
    diagramImageUrl: '',
    description: 'مسیر سیم‌کشی سوئیچ استارت، اتوماتیک استارت، فیوز ۸۰ آمپر دینام و خروجی‌های ۱ و ۹ رله دوبل.',
    source: 'مرکز تحقیقات و نوآوری صنایع خودرو سایپا',
    createdAt: Date.now()
  },
  {
    id: 'wd-206-fan',
    vehicleId: 'peugeot-206',
    title: 'نقشه مدار یونیت فن خنک‌کننده دور کند و تند و مقاومت فن ۲۰۶ (BSI / BM34)',
    category: 'cooling_fan',
    categoryFa: 'سیستم فن و خنک‌کننده',
    diagramImageUrl: '',
    description: 'مقاومت فن فنری داخل بادگیر رادیاتور، رله‌های دور کند و دور تند و فرمان پایه منفی از ECU.',
    source: 'کتاب تعمیرات الکتریکال پژو ۲۰۶',
    createdAt: Date.now()
  }
];

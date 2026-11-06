import React, { useState } from 'react';
import { X, Wrench, Zap, Cpu, Activity, HelpCircle } from 'lucide-react';

interface QuickToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickToolsModal: React.FC<QuickToolsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'fuses' | 'relays' | 'sensors' | 'qc_guide'>('fuses');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">جعبه‌ابزار و استانداردهای برق خودرو</h3>
              <p className="text-[11px] text-zinc-400">مرجع سریع کدهای رنگ، رله‌ها و مقاومت سنسورها در تعمیرگاه</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-1 bg-zinc-900 border-b border-zinc-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('fuses')}
            className={`flex-1 py-2 font-bold rounded-lg whitespace-nowrap transition ${
              activeTab === 'fuses' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            رنگ و آمپر فیوزها
          </button>
          <button
            onClick={() => setActiveTab('relays')}
            className={`flex-1 py-2 font-bold rounded-lg whitespace-nowrap transition ${
              activeTab === 'relays' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            استاندارد رله‌ها
          </button>
          <button
            onClick={() => setActiveTab('sensors')}
            className={`flex-1 py-2 font-bold rounded-lg whitespace-nowrap transition ${
              activeTab === 'sensors' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            اهم سنسورها
          </button>
          <button
            onClick={() => setActiveTab('qc_guide')}
            className={`flex-1 py-2 font-bold rounded-lg whitespace-nowrap transition ${
              activeTab === 'qc_guide' ? 'bg-red-950/80 text-red-300 border border-red-800' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            راهنمای کنترل کیفیت
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto text-xs space-y-4">
          {/* TAB: FUSES */}
          {activeTab === 'fuses' && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                کدگذاری استاندارد بین‌المللی رنگ فیوزهای تیغه‌ای خودرو (SAE J638):
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="w-5 h-5 rounded-md bg-amber-700 text-amber-100 flex items-center justify-center font-bold text-[10px]">5</span>
                  <div>
                    <span className="font-bold text-white">5A</span>
                    <span className="text-zinc-400 text-[10px] block">قهوه‌ای روشن / برنزه</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="w-5 h-5 rounded-md bg-amber-900 text-amber-200 flex items-center justify-center font-bold text-[10px]">7.5</span>
                  <div>
                    <span className="font-bold text-white">7.5A</span>
                    <span className="text-zinc-400 text-[10px] block">قهوه‌ای سوخته</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="w-5 h-5 rounded-md bg-red-600 text-white flex items-center justify-center font-bold text-[10px]">10</span>
                  <div>
                    <span className="font-bold text-white">10A</span>
                    <span className="text-zinc-400 text-[10px] block">قرمز</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">15</span>
                  <div>
                    <span className="font-bold text-white">15A</span>
                    <span className="text-zinc-400 text-[10px] block">آبی</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="w-5 h-5 rounded-md bg-yellow-500 text-zinc-950 flex items-center justify-center font-bold text-[10px]">20</span>
                  <div>
                    <span className="font-bold text-white">20A</span>
                    <span className="text-zinc-400 text-[10px] block">زرد</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="w-5 h-5 rounded-md bg-zinc-200 text-zinc-900 flex items-center justify-center font-bold text-[10px]">25</span>
                  <div>
                    <span className="font-bold text-white">25A</span>
                    <span className="text-zinc-400 text-[10px] block">سفید / بی‌رنگ</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">30</span>
                  <div>
                    <span className="font-bold text-white">30A</span>
                    <span className="text-zinc-400 text-[10px] block">سبز</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="w-5 h-5 rounded-md bg-orange-500 text-zinc-950 flex items-center justify-center font-bold text-[10px]">40</span>
                  <div>
                    <span className="font-bold text-white">40A</span>
                    <span className="text-zinc-400 text-[10px] block">نارنجی</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: RELAYS */}
          {activeTab === 'relays' && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                استاندارد شماره‌گذاری پایه‌های رله طبق استاندارد صنعتی DIN 72552:
              </p>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center justify-between font-bold text-red-400">
                    <span>پایه 30 (ورودی برق اصلی)</span>
                    <span className="text-[10px] text-zinc-500 font-mono">BATTERY +</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-1">ورودی مستقیم برق باتری با ولتاژ ۱۲ ولت دائم.</p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center justify-between font-bold text-emerald-400">
                    <span>پایه 87 (خروجی در حالت فعال)</span>
                    <span className="text-[10px] text-zinc-500 font-mono">NORMALLY OPEN</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-1">با چسبیدن رله، برق پایه ۳۰ به این پایه وصل شده و مصرف‌کننده (پمپ بنزین، بوق، فن) روشن می‌شود.</p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center justify-between font-bold text-amber-400">
                    <span>پایه‌های 85 و 86 (بوبین تحریک رله)</span>
                    <span className="text-[10px] text-zinc-500 font-mono">COIL TERMINALS</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-1">
                    پایه ۸۶ به مثبت سوئیچ و پایه ۸۵ به فرمان منفی از سوی ECU یا کلید متصل می‌شود. مقاومت بوبین معمولاً بین ۷۰ تا ۱۰۰ اهم است.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SENSORS */}
          {activeTab === 'sensors' && (
            <div className="space-y-2">
              <p className="text-zinc-400 text-[11px]">پارامترهای استاندارد سنسورها در دمای ۲۰ درجه سانتی‌گراد:</p>

              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="font-bold text-white flex justify-between">
                  <span>سنسور دور موتور القایی (CKP)</span>
                  <span className="text-amber-400 font-mono">350 - 450 Ω / 850 - 950 Ω</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">پژو ۴۰۵ و ۲۰۶ حدود ۳۰۰ تا ۴۵۰ اهم؛ پراید و رنو حدود ۸۵۰ تا ۹۵۰ اهم.</p>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="font-bold text-white flex justify-between">
                  <span>سنسور دمای آب (CTS / NTC)</span>
                  <span className="text-amber-400 font-mono">2.2 kΩ تا 2.8 kΩ</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">در دمای ۸۰ درجه کاری، مقاومت به ۲۵۰ تا ۳۰۰ اهم کاهش می‌یابد.</p>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="font-bold text-white flex justify-between">
                  <span>سوزن انژکتور بنزین</span>
                  <span className="text-amber-400 font-mono">12.5 Ω تا 16.5 Ω</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">مقاومت بوبین هر ۴ سوزن باید یکسان و متقارن باشد.</p>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="font-bold text-white flex justify-between">
                  <span>گرمکن سنسور اکسیژن</span>
                  <span className="text-amber-400 font-mono">4 Ω تا 14 Ω</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">بین دو سیم همرنگ (معمولاً سفید).</p>
              </div>
            </div>
          )}

          {/* TAB: QC GUIDE */}
          {activeTab === 'qc_guide' && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                استانداردهای ممیزی و کنترل کیفیت داده‌های فنی در AutoPin Pro:
              </p>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-red-400">
                  <span>۱. جلوگیری از پایه‌های تکراری (Duplicate Pins):</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  وجود دو پایه با شماره یکسان (مثلاً دو پایه با نام 1 یا A1) در یک سوکت به عنوان خطای بحرانی طبقه‌بندی می‌شود؛ زیرا سیم‌بندی اشتباه می‌تواند باعث سوختن ECU یا اتصال کوتاه گردد.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <span>۲. آمپراژ استاندارد فیوزها و تفاوت آن با رله‌ها:</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  فیوزها طبق استاندارد SAE J2077 باید مقادیر استاندارد (مانند 10A، 15A، 20A، 30A) داشته باشند. جریان نامی کنتاکت رله‌ها (معمولاً 30A تا 40A) نباید با آمپراژ فیوز اشتباه گرفته شود.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-sky-400">
                  <span>۳. تطابق ظرفیت اسمی سوکت با پایه‌های ثبت‌شده:</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  ظرفیت سوکت حاصل ضرب تعداد ردیف‌ها در ستون‌ها است. ثبت پایه‌های بیشتر از ظرفیت فیزیکی یک خطای ساختاری است.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

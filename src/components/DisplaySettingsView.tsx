import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Smartphone,
  Type,
  Maximize2,
  Table,
  Cpu,
  Search,
  RotateCcw,
  Check,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Eye,
  Activity,
  Layers,
  HelpCircle,
  Zap,
  Car
} from 'lucide-react';
import { useDisplaySettings } from '../context/DisplaySettingsContext';
import { useAuth } from '../context/AuthContext';
import {
  AppThemeMode,
  AppFontSize,
  AppDisplayDensity,
  AppCardSpacing,
  TableFontSize,
  TableRowHeight,
  ConnectorViewMode,
  PinDetailLevel,
  VehicleCardLayout,
  SearchSortOrder,
  SearchCategoryKey
} from '../types/settings';

interface DisplaySettingsViewProps {
  onBack: () => void;
}

export const DisplaySettingsView: React.FC<DisplaySettingsViewProps> = ({ onBack }) => {
  const { settings, resolvedTheme, updateSettings, resetToDefaults } = useDisplaySettings();
  const { currentUser, role } = useAuth();

  const [activeTab, setActiveTab] = useState<'appearance' | 'technical' | 'search'>('appearance');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const handleConfirmReset = () => {
    resetToDefaults();
    setIsResetModalOpen(false);
    setResetSuccessMessage('تنظیمات ظاهری و نمایش با موفقیت به حالت اولیه بازگردانی شد.');
    setTimeout(() => {
      setResetSuccessMessage(null);
    }, 4000);
  };

  const toggleCategory = (cat: SearchCategoryKey) => {
    const current = settings.searchEnabledCategories;
    let next: SearchCategoryKey[];
    if (current.includes(cat)) {
      if (current.length === 1) return; // keep at least one
      next = current.filter((c) => c !== cat);
    } else {
      next = [...current, cat];
    }
    updateSettings({ searchEnabledCategories: next });
  };

  return (
    <div className="flex flex-col gap-5 pb-24 text-right animate-in fade-in duration-200" dir="rtl">
      {/* 1. Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -mr-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95 transition"
              title="بازگشت"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-950">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  تنظیمات نمایش و تجربه کاربری
                </h1>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                شخصی‌سازی پوسته، اندازه نوشته‌ها، تراکم جداول پین‌آوت و بهینه‌سازی برای استفاده در تعمیرگاه
              </p>
            </div>
          </div>

          {/* User Isolation Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-400">
              {currentUser ? (
                <>پروفایل: <strong className="text-zinc-200 font-mono text-[11px]">{currentUser.email}</strong></>
              ) : (
                <>پروفایل: <strong className="text-zinc-200">کاربر مهمان (آفلاین)</strong></>
              )}
            </span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
              activeTab === 'appearance'
                ? 'bg-red-600 text-white shadow-md shadow-red-950'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>ظاهر و پوسته</span>
          </button>

          <button
            onClick={() => setActiveTab('technical')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
              activeTab === 'technical'
                ? 'bg-red-600 text-white shadow-md shadow-red-950'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>نمایش اطلاعات فنی و پین‌آوت</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
              activeTab === 'search'
                ? 'bg-red-600 text-white shadow-md shadow-red-950'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>تنظیمات جست‌وجو</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {resetSuccessMessage && (
        <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 shadow-md">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{resetSuccessMessage}</span>
        </div>
      )}

      {/* 2. Live Interactive Workshop Preview Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">پیش‌نمایش زنده در محیط تعمیرگاه</span>
          </div>
          <span className="text-[11px] text-zinc-400">
            تم: {resolvedTheme === 'dark' ? 'تاریک' : 'روشن'} • فونت: {
              settings.fontSize === 'sm' ? 'کوچک' : settings.fontSize === 'md' ? 'متوسط' : settings.fontSize === 'lg' ? 'بزرگ' : 'خیلی بزرگ'
            }
          </span>
        </div>

        {/* Live Preview Box */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-red-600 flex flex-col items-center justify-center text-white font-black shrink-0">
                <span className="text-[9px] uppercase">پایه</span>
                <span className="text-xs leading-none">A1</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-xs sm:text-sm">فرمان انژکتور سیلندر ۱</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 font-bold">
                    INJ_1
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300">
                    انژکتور و سوخت
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 block mt-0.5">ولتاژ: 12V-14.4V • پالس زمین منفی</span>
              </div>
            </div>

            {/* Wire cross section swatch */}
            <div className="flex items-center gap-2 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg shrink-0">
              <div className="relative w-5 h-5 rounded-full border border-zinc-700 overflow-hidden shadow-xs">
                <div className="absolute inset-0 bg-white" />
                <div className="absolute top-0 bottom-0 left-1.5 w-1.5 bg-red-600" />
              </div>
              <div className="text-right">
                <span className="text-[9px] text-zinc-500 block leading-tight">سیم خودرو</span>
                <span className="text-[10px] font-bold text-zinc-200">سفید/قرمز</span>
              </div>
            </div>
          </div>

          {/* Sample Table Row based on table settings */}
          <div className="border-t border-zinc-800/80 pt-2.5">
            <div className="text-[10px] text-zinc-500 mb-1.5 flex items-center justify-between">
              <span>نمونه ردیف جدول پین‌ها با تنظیمات فعلی:</span>
              <span className="font-mono">ارتفاع: {settings.tableRowHeight}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-800/60">
              <div className="flex items-center justify-between px-3 tabular-row-py transition">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center font-bold tabular-cell-text text-white">
                    A2
                  </span>
                  <span className="tabular-cell-text text-zinc-200 font-medium">سنسور موقعیت میل‌سوپاپ (CMP)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  سیگنال ۵V پالس
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TAB CONTENT */}

      {/* --- TAB 1: APPEARANCE --- */}
      {activeTab === 'appearance' && (
        <div className="flex flex-col gap-4">
          {/* Theme Mode */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm">
            <h2 className="text-xs sm:text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Sun className="w-4 h-4 text-red-500" />
              <span>پوسته و حالت تم (Theme Mode)</span>
            </h2>
            <p className="text-xs text-zinc-400 mb-4">
              انتخاب حالت روز، شب یا پیروی از تنظیمات گوشی اندرویدی
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Dark */}
              <button
                type="button"
                onClick={() => updateSettings({ themeMode: 'dark' })}
                className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between h-24 ${
                  settings.themeMode === 'dark'
                    ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200">
                    <Moon className="w-4 h-4" />
                  </div>
                  {settings.themeMode === 'dark' && (
                    <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">حالت تاریک (Dark Mode)</span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">کنتراست بالا و مناسب نور کم تعمیرگاه</span>
                </div>
              </button>

              {/* Light */}
              <button
                type="button"
                onClick={() => updateSettings({ themeMode: 'light' })}
                className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between h-24 ${
                  settings.themeMode === 'light'
                    ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-amber-400">
                    <Sun className="w-4 h-4" />
                  </div>
                  {settings.themeMode === 'light' && (
                    <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">حالت روشن (Light Mode)</span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">مناسب زیر نور مستقیم آفتاب و روز</span>
                </div>
              </button>

              {/* System */}
              <button
                type="button"
                onClick={() => updateSettings({ themeMode: 'system' })}
                className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between h-24 ${
                  settings.themeMode === 'system'
                    ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-cyan-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  {settings.themeMode === 'system' && (
                    <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">پیروی از گوشی (خودکار)</span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">هماهنگ با تم سیستم‌عامل اندروید</span>
                </div>
              </button>
            </div>
          </div>

          {/* Font Size Scaling */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm">
            <h2 className="text-xs sm:text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Type className="w-4 h-4 text-amber-500" />
              <span>اندازه نوشته‌ها (Font Size)</span>
            </h2>
            <p className="text-xs text-zinc-400 mb-4">
              تنظیم درشتی متن‌ها برای خوانایی آسان هنگام کار با خودرو
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'sm' as AppFontSize, title: 'کوچک', scale: '85%', desc: 'متراکم' },
                { id: 'md' as AppFontSize, title: 'متوسط', scale: '100%', desc: 'استاندارد' },
                { id: 'lg' as AppFontSize, title: 'بزرگ', scale: '115%', desc: 'خوانا' },
                { id: 'xl' as AppFontSize, title: 'خیلی بزرگ', scale: '130%', desc: 'دید از دور' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateSettings({ fontSize: item.id })}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                    settings.fontSize === item.id
                      ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-xs font-bold text-white">{item.title}</span>
                  <span className="text-[10px] font-mono text-zinc-400">{item.scale} ({item.desc})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Density & Card Spacing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Density */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <h2 className="text-xs sm:text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-emerald-400" />
                <span>تراکم نمایش اطلاعات</span>
              </h2>
              <p className="text-[11px] text-zinc-400 mb-3">
                میزان فشردگی المان‌ها و اطلاعات در هر صفحه
              </p>

              <div className="flex flex-col gap-2">
                {[
                  { id: 'compact' as AppDisplayDensity, title: 'فشرده (Compact)', desc: 'مشاهده بیشترین تعداد آیتم بدون اسکرول زیاد' },
                  { id: 'normal' as AppDisplayDensity, title: 'استاندارد (Standard)', desc: 'تعادل مطلوب خوانایی و تراکم' },
                  { id: 'comfortable' as AppDisplayDensity, title: 'راحت و جادار (Comfortable)', desc: 'دکمه‌های درشت‌تر و لمس آسان با دستکش' }
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => updateSettings({ density: d.id })}
                    className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between ${
                      settings.density === d.id
                        ? 'bg-red-950/40 border-red-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold block">{d.title}</span>
                      <span className="text-[10px] text-zinc-500 block">{d.desc}</span>
                    </div>
                    {settings.density === d.id && <Check className="w-4 h-4 text-red-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Spacing */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <h2 className="text-xs sm:text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>اندازه کارت‌ها و فاصله بخش‌ها</span>
              </h2>
              <p className="text-[11px] text-zinc-400 mb-3">
                تنظیم فاصله حاشیه‌ای و گپ بین کارت‌های بخش‌های مختلف
              </p>

              <div className="flex flex-col gap-2">
                {[
                  { id: 'compact' as AppCardSpacing, title: 'فاصله کم', desc: 'کارت‌های چسبیده‌تر و اسکرول سریع' },
                  { id: 'normal' as AppCardSpacing, title: 'فاصله استاندارد', desc: 'طراحی شیک و متعادل' },
                  { id: 'relaxed' as AppCardSpacing, title: 'فاصله زیاد', desc: 'تفکیک واضح بخش‌ها و بصری خلوت' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => updateSettings({ cardSpacing: s.id })}
                    className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between ${
                      settings.cardSpacing === s.id
                        ? 'bg-red-950/40 border-red-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold block">{s.title}</span>
                      <span className="text-[10px] text-zinc-500 block">{s.desc}</span>
                    </div>
                    {settings.cardSpacing === s.id && <Check className="w-4 h-4 text-red-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: TECHNICAL & PINOUT DISPLAY --- */}
      {activeTab === 'technical' && (
        <div className="flex flex-col gap-4">
          {/* Table font size & Row Height */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Table Font Size */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <h2 className="text-xs sm:text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Type className="w-4 h-4 text-amber-400" />
                <span>اندازه نوشته‌های جدول‌ها</span>
              </h2>
              <p className="text-[11px] text-zinc-400 mb-3">
                اندازه متن پین‌ها، مشخصات فیوزها و توضیحات فنی
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'sm' as TableFontSize, title: 'ریز', desc: '12px' },
                  { id: 'md' as TableFontSize, title: 'متوسط', desc: '14px' },
                  { id: 'lg' as TableFontSize, title: 'درشت', desc: '16px' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => updateSettings({ tableFontSize: t.id })}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                      settings.tableFontSize === t.id
                        ? 'bg-red-950/40 border-red-500 text-white ring-1 ring-red-500'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs font-bold">{t.title}</span>
                    <span className="text-[10px] text-zinc-500">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table Row Height */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <h2 className="text-xs sm:text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Table className="w-4 h-4 text-red-500" />
                <span>ارتفاع ردیف‌های جدول</span>
              </h2>
              <p className="text-[11px] text-zinc-400 mb-3">
                فاصله سطرها برای لمس دقیق پایه‌ها بر روی صفحه گوشی
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'compact' as TableRowHeight, title: 'کم', desc: 'دیدن پایه‌های زیاد' },
                  { id: 'normal' as TableRowHeight, title: 'متوسط', desc: 'استاندارد' },
                  { id: 'relaxed' as TableRowHeight, title: 'زیاد', desc: 'لمس راحت انگشت' }
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => updateSettings({ tableRowHeight: r.id })}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                      settings.tableRowHeight === r.id
                        ? 'bg-red-950/40 border-red-500 text-white ring-1 ring-red-500'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs font-bold">{r.title}</span>
                    <span className="text-[10px] text-zinc-500">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Socket View Mode & Pin Details Level */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm">
            <h2 className="text-xs sm:text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>نحوه نمایش مشخصات سوکت‌های ECU</span>
            </h2>
            <p className="text-xs text-zinc-400 mb-4">
              انتخاب ساختار بصری اصلی هنگام باز کردن سوکت کامپیوتر خودرو
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'grid' as ConnectorViewMode, title: 'ماتریس شبکه‌ای سطر و ستون', desc: 'نمایش دقیق فیزیکی پایه‌ها با شماره سطر و ستون همانند سوکت واقعی' },
                { id: 'cards' as ConnectorViewMode, title: 'فهرست کارتی و تصویری', desc: 'نمایش هر پایه در قالب یک کارت مستقل با مشخصات سیم و ولتاژ' },
                { id: 'compact' as ConnectorViewMode, title: 'جدول فشرده پایه‌ها', desc: 'نمایش جدولی منظم و فوق‌العاده سریع برای عیب‌یابی برق‌کاران' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => updateSettings({ connectorViewMode: m.id })}
                  className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between h-28 ${
                    settings.connectorViewMode === m.id
                      ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{m.title}</span>
                    {settings.connectorViewMode === m.id && (
                      <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-1 leading-relaxed">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pin Detail Level & Vehicle Card Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pin Detail Level */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <h2 className="text-xs sm:text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>سطح جزئیات اطلاعات پایه‌ها</span>
              </h2>
              <p className="text-[11px] text-zinc-400 mb-3">
                اطلاعات نمایش داده شده هنگام انتخاب هر پایه (هیچ داده‌ای حذف نمی‌شود)
              </p>

              <div className="flex flex-col gap-2">
                {[
                  {
                    id: 'full' as PinDetailLevel,
                    title: 'حالت کامل کارگاهی',
                    desc: 'نمایش همزمان راهنمای تست، موج اسیلوسکوپ، نوع پالس و رنگ سیم'
                  },
                  {
                    id: 'summary' as PinDetailLevel,
                    title: 'حالت خلاصه فنی',
                    desc: 'تمرکز بر شماره پایه، نام فنی، رنگ سیم و وظیفه اصلی مدار'
                  },
                  {
                    id: 'diagram' as PinDetailLevel,
                    title: 'حالت دیاگرامی و نقشه‌ای',
                    desc: 'نمایش گرافیکی با تأکید بر ارتباط سیم‌کشی با سایر اجزای خودرو'
                  }
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => updateSettings({ pinDetailLevel: lvl.id })}
                    className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between ${
                      settings.pinDetailLevel === lvl.id
                        ? 'bg-red-950/40 border-red-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold block">{lvl.title}</span>
                      <span className="text-[10px] text-zinc-500 block">{lvl.desc}</span>
                    </div>
                    {settings.pinDetailLevel === lvl.id && <Check className="w-4 h-4 text-red-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Card Layout */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <h2 className="text-xs sm:text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Car className="w-4 h-4 text-amber-400" />
                <span>چیدمان کارت‌های خودرو و ECU</span>
              </h2>
              <p className="text-[11px] text-zinc-400 mb-3">
                نحوه نمایش لیست خودروها در شاخه اصلی برنامه
              </p>

              <div className="flex flex-col gap-2">
                {[
                  { id: 'grid' as VehicleCardLayout, title: 'شبکه‌ای (Grid)', desc: 'کارت‌های دو ستونه با تصویر بزرگ خودرو' },
                  { id: 'list' as VehicleCardLayout, title: 'لیستی افقی (List)', desc: 'ردیف‌های مشخصات با جزئیات کامل موتور' },
                  { id: 'compact' as VehicleCardLayout, title: 'فشرده و جمع‌وجور', desc: 'حداکثر سرعت و تعداد بالا برای گوشی موبایل' }
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => updateSettings({ vehicleCardLayout: l.id })}
                    className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between ${
                      settings.vehicleCardLayout === l.id
                        ? 'bg-red-950/40 border-red-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold block">{l.title}</span>
                      <span className="text-[10px] text-zinc-500 block">{l.desc}</span>
                    </div>
                    {settings.vehicleCardLayout === l.id && <Check className="w-4 h-4 text-red-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: SEARCH PREFERENCES --- */}
      {activeTab === 'search' && (
        <div className="flex flex-col gap-4">
          {/* Remember Last Category */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-red-500" />
                  <span>حفظ آخرین دسته‌بندی جست‌وجو</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  هنگام بازکردن بخش جستجو، به طور خودکار آخرین دسته‌ای که جستجو کرده بودید (مثل پین‌آوت یا فیوز) انتخاب بماند
                </p>
              </div>

              <button
                type="button"
                onClick={() => updateSettings({ searchSaveLastCategory: !settings.searchSaveLastCategory })}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                  settings.searchSaveLastCategory ? 'bg-red-600' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    settings.searchSaveLastCategory ? 'right-7' : 'right-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Enabled Categories */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm">
            <h2 className="text-xs sm:text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>دسته‌بندی‌های مورد جست‌وجو در سامانه</span>
            </h2>
            <p className="text-xs text-zinc-400 mb-4">
              انتخاب بخش‌هایی که در جستجوی سراسری پیمایش می‌شوند (برای شخصی‌سازی نیاز کاری خودتان)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {[
                { id: 'ecu' as SearchCategoryKey, label: 'پین‌آوت و سوکت‌های ECU', icon: Cpu },
                { id: 'fuses' as SearchCategoryKey, label: 'فیوزهای خودرو', icon: Zap },
                { id: 'relays' as SearchCategoryKey, label: 'رله‌ها و جعبه‌فیوز', icon: Activity },
                { id: 'vehicles' as SearchCategoryKey, label: 'خودروها و موتورها', icon: Car },
                { id: 'diagrams' as SearchCategoryKey, label: 'نقشه‌های سیم‌کشی', icon: LayoutGrid },
                { id: 'media' as SearchCategoryKey, label: 'تصاویر و پین‌آوت‌های مدیا', icon: Eye }
              ].map((cat) => {
                const Icon = cat.icon;
                const isChecked = settings.searchEnabledCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-3 rounded-xl border text-right transition flex items-center justify-between ${
                      isChecked
                        ? 'bg-zinc-950 border-red-500/80 text-white'
                        : 'bg-zinc-950/50 border-zinc-800/80 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isChecked ? 'text-red-400' : 'text-zinc-600'}`} />
                      <span className="text-xs font-medium">{cat.label}</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isChecked ? 'bg-red-600 border-red-500 text-white' : 'border-zinc-700 bg-zinc-900'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Count & Sort Order */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Max Results */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <h2 className="text-xs sm:text-sm font-bold text-white mb-1 flex items-center gap-2">
                <List className="w-4 h-4 text-cyan-400" />
                <span>نمایش تعداد نتایج در هر بخش</span>
              </h2>
              <p className="text-[11px] text-zinc-400 mb-3">
                سقف نمایش نتایج در دسته‌های جستجو قبل از زدن دکمه نمایش همه
              </p>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 5, label: '۵ مورد' },
                  { value: 10, label: '۱۰ مورد' },
                  { value: 25, label: '۲۵ مورد' },
                  { value: 0, label: 'همه' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateSettings({ searchMaxResults: opt.value })}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      settings.searchMaxResults === opt.value
                        ? 'bg-red-950/40 border-red-500 text-white font-bold ring-1 ring-red-500'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Order */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <h2 className="text-xs sm:text-sm font-bold text-white mb-1 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                <span>تنظیم مرتب‌سازی نتایج</span>
              </h2>
              <p className="text-[11px] text-zinc-400 mb-3">
                ترتیب پیش‌فرض چیدمان نتایج جستجوی کلمات
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'relevance' as SearchSortOrder, label: 'بیشترین ارتباط' },
                  { id: 'alpha' as SearchSortOrder, label: 'الفبایی (A-Z)' },
                  { id: 'newest' as SearchSortOrder, label: 'جدیدترین' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => updateSettings({ searchSortOrder: s.id })}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      settings.searchSortOrder === s.id
                        ? 'bg-red-950/40 border-red-500 text-white font-bold ring-1 ring-red-500'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. RESET TO DEFAULTS ACTION */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm mt-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-zinc-400" />
              <span>بازگشت به تنظیمات پیش‌فرض</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              بازنشانی کامل تنظیمات پوسته، فونت و جستجو به حالت استاندارد کارخانه
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-2 transition active:scale-95 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازگردانی تنظیمات</span>
          </button>
        </div>
      </div>

      {/* 5. RESET CONFIRMATION MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-5 shadow-2xl relative text-right">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white">
              بازنشانی تنظیمات نمایش به حالت اولیه؟
            </h3>

            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              این عملیات صرفاً تنظیمات ظاهری، اندازه قلم، پوسته و تنظیمات جستجو را به حالت اولیه بازمی‌گرداند.
            </p>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 mt-3 text-[11px] text-emerald-400 flex items-start gap-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                هیچ‌یک از اطلاعات خودروها، سوکت‌های ECU، پایه‌ها، جعبه‌فیوزها، نقشه‌ها یا اطلاعات مدیریتی حذف نخواهند شد.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-950 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تأیید و بازنشانی</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

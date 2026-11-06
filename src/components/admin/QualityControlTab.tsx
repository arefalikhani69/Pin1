import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Car,
  Cpu,
  Zap,
  Image as ImageIcon,
  Check,
  Sparkles,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import {
  runQualityControlAudit,
  QualityReportSummary,
  QualityIssue,
  IssueSeverity,
  IssueCategory,
  toggleDismissIssue,
  getDismissedIssueIds
} from '../../utils/qualityControlEngine';
import { storage } from '../../services/storage';

interface QualityControlTabProps {
  onNavigateToTab?: (tab: 'vehicles' | 'ecus' | 'connectors' | 'fuseboxes' | 'media') => void;
  onRefreshData?: () => void;
}

export const QualityControlTab: React.FC<QualityControlTabProps> = ({
  onNavigateToTab,
  onRefreshData
}) => {
  const [report, setReport] = useState<QualityReportSummary | null>(null);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | IssueSeverity>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | IssueCategory>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [showDismissed, setShowDismissed] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const vehicles = storage.getVehicles();

  const executeAudit = () => {
    setIsRunningAudit(true);
    setTimeout(() => {
      const summary = runQualityControlAudit();
      setReport(summary);
      setIsRunningAudit(false);
    }, 250);
  };

  useEffect(() => {
    executeAudit();
  }, []);

  const handleToggleDismiss = (issueId: string) => {
    const isNowDismissed = toggleDismissIssue(issueId);
    setActionFeedback(isNowDismissed ? 'مورد به‌عنوان بررسی‌شده علامت‌گذاری شد.' : 'مورد مجدداً در فهرست فعال قرار گرفت.');
    setTimeout(() => setActionFeedback(null), 3000);
    // Refresh audit state
    const summary = runQualityControlAudit();
    setReport(summary);
  };

  const handleNavigateToEntity = (issue: QualityIssue) => {
    if (issue.targetTab && onNavigateToTab) {
      onNavigateToTab(issue.targetTab);
    }
  };

  // Filtered issues list
  const filteredIssues = useMemo(() => {
    if (!report) return [];

    return report.issues.filter(issue => {
      // Dismissed filter
      if (!showDismissed && issue.isDismissed) return false;
      if (showDismissed && !issue.isDismissed) return false;

      // Severity filter
      if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;

      // Vehicle filter
      if (selectedVehicleId !== 'all') {
        if (issue.vehicleId !== selectedVehicleId) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = issue.title.toLowerCase().includes(q);
        const matchDesc = issue.description.toLowerCase().includes(q);
        const matchEntity = issue.entityName.toLowerCase().includes(q);
        const matchVeh = issue.vehicleName?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchEntity && !matchVeh) return false;
      }

      return true;
    });
  }, [report, severityFilter, categoryFilter, selectedVehicleId, searchQuery, showDismissed]);

  if (!report) {
    return (
      <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 text-red-500 animate-spin mb-3" />
        <span className="text-xs text-zinc-300 font-bold">در حال پویش و بررسی کیفیت اطلاعات فنی...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-right">
      {/* Top Health Header & Score Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
            report.criticalCount > 0
              ? 'bg-red-600/20 border-red-500/40 text-red-500'
              : report.warningCount > 0
              ? 'bg-amber-600/20 border-amber-500/40 text-amber-400'
              : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
          }`}>
            {report.criticalCount > 0 ? (
              <ShieldAlert className="w-6 h-6" />
            ) : report.warningCount > 0 ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white">
                سیستم کنترل کیفیت و اعتبارسنجی اطلاعات فنی
              </h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono border ${
                report.healthScorePercent >= 90
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : report.healthScorePercent >= 70
                  ? 'bg-amber-950 text-amber-400 border-amber-800'
                  : 'bg-red-950 text-red-400 border-red-800'
              }`}>
                شاخص سلامت: {report.healthScorePercent}٪
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              پویش هوشمند برای کشف پایه‌های تکراری، اطلاعات ناقص، تناقض آمپراژ و پیوندهای شکسته بدون تغییر داده‌ها
            </p>
          </div>
        </div>

        <button
          onClick={executeAudit}
          disabled={isRunningAudit}
          className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-2 border border-zinc-700 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 text-red-500 ${isRunningAudit ? 'animate-spin' : ''}`} />
          <span>اجرای مجدد بررسی کیفیت</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Healthy Records */}
        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-semibold">کل رکوردهای سالم</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-lg font-bold text-emerald-400 font-mono mt-1">
            {report.healthyCount.toLocaleString('fa-IR')}
          </span>
          <span className="text-[10px] text-zinc-500 mt-0.5">
            از مجموع {report.totalRecordsChecked.total.toLocaleString('fa-IR')} رکورد
          </span>
        </div>

        {/* Critical Issues */}
        <div
          onClick={() => setSeverityFilter(severityFilter === 'critical' ? 'all' : 'critical')}
          className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            severityFilter === 'critical'
              ? 'bg-red-950/80 border-red-500 shadow-md'
              : 'bg-zinc-950 border-zinc-800 hover:border-red-900/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-red-400 font-semibold">خطاهای بحرانی</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-lg font-bold text-red-400 font-mono mt-1">
            {report.criticalCount.toLocaleString('fa-IR')}
          </span>
          <span className="text-[10px] text-red-300/70 mt-0.5">پایه‌ها و کدهای تکراری یا مفقود</span>
        </div>

        {/* Warnings */}
        <div
          onClick={() => setSeverityFilter(severityFilter === 'warning' ? 'all' : 'warning')}
          className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            severityFilter === 'warning'
              ? 'bg-amber-950/80 border-amber-500 shadow-md'
              : 'bg-zinc-950 border-zinc-800 hover:border-amber-900/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-amber-400 font-semibold">هشدارهای فنی</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-lg font-bold text-amber-400 font-mono mt-1">
            {report.warningCount.toLocaleString('fa-IR')}
          </span>
          <span className="text-[10px] text-amber-300/70 mt-0.5">ناسازگاری ظرفیت یا ارجاع</span>
        </div>

        {/* Info Notices */}
        <div
          onClick={() => setSeverityFilter(severityFilter === 'info' ? 'all' : 'info')}
          className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            severityFilter === 'info'
              ? 'bg-sky-950/80 border-sky-500 shadow-md'
              : 'bg-zinc-950 border-zinc-800 hover:border-sky-900/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-sky-400 font-semibold">نکات تکمیلی</span>
            <Info className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-lg font-bold text-sky-400 font-mono mt-1">
            {report.infoCount.toLocaleString('fa-IR')}
          </span>
          <span className="text-[10px] text-sky-300/70 mt-0.5">فیلدهای اختیاری قابل تکمیل</span>
        </div>
      </div>

      {/* Breakdown Strip by Issue Type */}
      <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
          <span>دسته‌بندی نواقص:</span>
          <span className="text-white font-mono font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            {report.duplicateCount} تکراری مشکوک
          </span>
          <span className="text-white font-mono font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            {report.inconsistencyCount} ناسازگاری
          </span>
          <span className="text-white font-mono font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            {report.missingDataCount} اطلاعات ناقص
          </span>
          {report.orphanMediaCount > 0 && (
            <span className="text-white font-mono font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              {report.orphanMediaCount} تصویر بدون اتصال
            </span>
          )}
        </div>

        <div className="text-[11px] text-zinc-500">
          تعداد رکوردهای بررسی‌شده: {report.totalRecordsChecked.vehicles} خودرو · {report.totalRecordsChecked.connectors} سوکت ({report.totalRecordsChecked.pins} پایه) · {report.totalRecordsChecked.fuseBoxes} جعبه‌فیوز
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جست‌وجو در عنوان خطا، نام قطعه، نام خودرو یا شماره پایه..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Vehicle Dropdown Filter */}
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="all">همه خودروها ({vehicles.length})</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>

          {/* Category Dropdown Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="all">تمام بخش‌ها</option>
            <option value="pin">پایه‌ها و سیم‌کشی سوکت</option>
            <option value="connector">سوکت‌ها</option>
            <option value="fuse">فیوزها</option>
            <option value="relay">رله‌ها</option>
            <option value="fusebox">جعبه‌فیوزها</option>
            <option value="ecu">واحد کنترل ECU</option>
            <option value="vehicle">مشخصات خودرو</option>
            <option value="media">تصاویر و نقشه‌ها</option>
          </select>

          {/* Toggle Dismissed Checkbox */}
          <button
            onClick={() => setShowDismissed(!showDismissed)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
              showDismissed
                ? 'bg-zinc-800 text-white border-zinc-600'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            {showDismissed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showDismissed ? 'نمایش موارد بررسی‌شده' : 'نمایش بررسی‌شده‌ها'}</span>
          </button>
        </div>

        {/* Severity Quick Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-1">
          <span className="text-[11px] text-zinc-400 ml-1">سطح اهمیت:</span>
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${
              severityFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            همه ({report.totalIssues})
          </button>
          <button
            onClick={() => setSeverityFilter('critical')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
              severityFilter === 'critical' ? 'bg-red-600 text-white' : 'text-red-400 hover:text-red-300'
            }`}
          >
            <span>بحرانی ({report.criticalCount})</span>
          </button>
          <button
            onClick={() => setSeverityFilter('warning')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
              severityFilter === 'warning' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <span>هشدار ({report.warningCount})</span>
          </button>
          <button
            onClick={() => setSeverityFilter('info')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
              severityFilter === 'info' ? 'bg-sky-600 text-white' : 'text-sky-400 hover:text-sky-300'
            }`}
          >
            <span>اطلاعاتی ({report.infoCount})</span>
          </button>
        </div>
      </div>

      {/* Action Toast Feedback */}
      {actionFeedback && (
        <div className="p-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Issues List Container */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <span>نمایش {filteredIssues.length} مورد منطبق با فیلترها</span>
          {showDismissed && (
            <span className="text-amber-400 text-[11px]">
              در حال مشاهده موارد نادیده‌گرفته‌شده / بررسی‌شده توسط تکنسین
            </span>
          )}
        </div>

        {filteredIssues.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2" />
            <h3 className="text-sm font-bold text-white">هیچ مشکلی در این دسته‌بندی یافت نشد!</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              کلیه رکوردهای انتخابی با استانداردهای کیفی، عدم تکرار پایه‌ها و سازگاری داده‌های AutoPin Pro مطابقت دارند.
            </p>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const isCritical = issue.severity === 'critical';
            const isWarning = issue.severity === 'warning';

            return (
              <div
                key={issue.id}
                className={`p-4 rounded-2xl border transition flex flex-col gap-2.5 ${
                  issue.isDismissed
                    ? 'bg-zinc-950/40 border-zinc-800 opacity-60'
                    : isCritical
                    ? 'bg-zinc-900 border-red-900/60 shadow-xs'
                    : isWarning
                    ? 'bg-zinc-900 border-amber-900/50 shadow-xs'
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                {/* Header Line */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border ${
                        isCritical
                          ? 'bg-red-950 text-red-400 border-red-800'
                          : isWarning
                          ? 'bg-amber-950 text-amber-400 border-amber-800'
                          : 'bg-sky-950 text-sky-400 border-sky-800'
                      }`}
                    >
                      {isCritical ? 'بحرانی' : isWarning ? 'هشدار' : 'اطلاعاتی'}
                    </span>

                    <span className="text-xs font-bold text-white">{issue.title}</span>

                    {issue.vehicleName && (
                      <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                        خودرو: {issue.vehicleName}
                      </span>
                    )}

                    <span className="text-[10px] text-zinc-500 font-mono">
                      بخش: {issue.category === 'pin' ? 'پایه‌ها' : issue.category === 'connector' ? 'سوکت' : issue.category === 'fuse' ? 'فیوز' : issue.category === 'relay' ? 'رله' : issue.category === 'fusebox' ? 'جعبه‌فیوز' : issue.category === 'ecu' ? 'ECU' : issue.category === 'media' ? 'تصویر' : 'خودرو'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleDismiss(issue.id)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 shrink-0 px-2 py-1 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 transition"
                    title={issue.isDismissed ? 'برگرداندن به فهرست فعال' : 'علامت‌گذاری به‌عنوان بررسی‌شده'}
                  >
                    {issue.isDismissed ? 'فعال‌سازی مجدد' : 'بررسی شد'}
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {issue.description}
                </p>

                {/* Recommendation Box */}
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2 text-zinc-400">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-zinc-300">پیشنهاد اصلاح:</strong> {issue.recommendation}
                    </span>
                  </div>

                  {issue.targetTab && onNavigateToTab && (
                    <button
                      onClick={() => handleNavigateToEntity(issue)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] shrink-0 transition flex items-center gap-1 shadow-sm active:scale-95"
                    >
                      <span>مشاهده و ویرایش رکورد</span>
                      <ArrowRight className="w-3 h-3 rotate-180" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

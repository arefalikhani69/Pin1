import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Eye,
  FileText,
  Car,
  Cpu,
  Zap,
  Image as ImageIcon,
  Check,
  Clock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Layers,
  ChevronDown,
  Info
} from 'lucide-react';
import {
  ApprovalItemSummary,
  ApprovalEntityType,
  PublicationStatus,
  TechnicalDataVersion,
  FieldDiff
} from '../../types';
import { storage } from '../../services/storage';
import { runQualityControlAudit, QualityIssue } from '../../utils/qualityControlEngine';
import { useAuth } from '../../context/AuthContext';

interface ApprovalWorkflowTabProps {
  onRefreshData?: () => void;
  onNavigateToTab?: (tab: 'vehicles' | 'ecus' | 'connectors' | 'fuseboxes' | 'media') => void;
}

export const ApprovalWorkflowTab: React.FC<ApprovalWorkflowTabProps> = ({
  onRefreshData,
  onNavigateToTab
}) => {
  const { currentUser } = useAuth();
  const [statusFilter, setStatusFilter] = useState<PublicationStatus | 'all'>('pending');
  const [typeFilter, setTypeFilter] = useState<ApprovalEntityType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Inspection Modal State
  const [inspectingItem, setInspectingItem] = useState<ApprovalItemSummary | null>(null);

  // Rejection Modal State
  const [rejectingItem, setRejectingItem] = useState<ApprovalItemSummary | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // Approve Confirmation Modal State
  const [approvingItem, setApprovingItem] = useState<ApprovalItemSummary | null>(null);

  // Fetch all approval items
  const allItems = useMemo(() => {
    return storage.getAllApprovalItems();
  }, [actionFeedback]);

  // QC report for flagging
  const qcReport = useMemo(() => {
    try {
      return runQualityControlAudit();
    } catch {
      return null;
    }
  }, [actionFeedback]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'all' && item.entityType !== typeFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchSub = item.subtitle?.toLowerCase().includes(q);
        const matchVeh = item.vehicleName?.toLowerCase().includes(q);
        const matchReason = item.rejectionReason?.toLowerCase().includes(q);
        if (!matchTitle && !matchSub && !matchVeh && !matchReason) {
          return false;
        }
      }
      return true;
    });
  }, [allItems, statusFilter, typeFilter, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      pending: allItems.filter(i => i.status === 'pending').length,
      rejected: allItems.filter(i => i.status === 'rejected').length,
      draft: allItems.filter(i => i.status === 'draft').length,
      published: allItems.filter(i => i.status === 'published' || i.status === 'verified').length,
      total: allItems.length
    };
  }, [allItems]);

  // Find QC issues related to a specific entity
  const getItemQCIssues = (itemId: string): QualityIssue[] => {
    if (!qcReport) return [];
    return qcReport.issues.filter(issue => issue.entityId === itemId || issue.vehicleId === itemId);
  };

  // Find version history for inspecting diffs
  const getItemVersions = (itemId: string): TechnicalDataVersion[] => {
    return storage.getTechnicalVersions(itemId);
  };

  // Handle Approve
  const handleConfirmApprove = () => {
    if (!approvingItem) return;

    const res = storage.approveAndPublishRecord(approvingItem.entityType, approvingItem.id, {
      uid: currentUser?.uid,
      email: currentUser?.email || 'مدیر سیستم'
    });

    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message });
      setApprovingItem(null);
      if (inspectingItem?.id === approvingItem.id) {
        setInspectingItem(null);
      }
      onRefreshData?.();
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Handle Reject
  const handleConfirmReject = () => {
    if (!rejectingItem) return;

    if (!rejectionReasonText.trim()) {
      setRejectionError('ثبت دلیل رد اطلاعات الزامی است تا نویسنده بداند چه مواردی نیاز به اصلاح دارند.');
      return;
    }

    const res = storage.rejectRecord(
      rejectingItem.entityType,
      rejectingItem.id,
      rejectionReasonText.trim(),
      {
        uid: currentUser?.uid,
        email: currentUser?.email || 'مدیر سیستم'
      }
    );

    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message });
      setRejectingItem(null);
      setRejectionReasonText('');
      setRejectionError(null);
      if (inspectingItem?.id === rejectingItem.id) {
        setInspectingItem(null);
      }
      onRefreshData?.();
    } else {
      setRejectionError(res.message);
    }
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Handle Return to Draft
  const handleReturnToDraft = (item: ApprovalItemSummary) => {
    const res = storage.returnRecordToDraft(item.entityType, item.id, {
      uid: currentUser?.uid,
      email: currentUser?.email || 'مدیر سیستم'
    });

    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message });
      if (inspectingItem?.id === item.id) {
        setInspectingItem(null);
      }
      onRefreshData?.();
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const getEntityIcon = (type: ApprovalEntityType) => {
    switch (type) {
      case 'vehicle':
        return <Car className="w-4 h-4 text-red-500" />;
      case 'ecu':
        return <Cpu className="w-4 h-4 text-indigo-400" />;
      case 'connector':
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'fusebox':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'diagram':
      case 'media':
        return <ImageIcon className="w-4 h-4 text-sky-400" />;
      default:
        return <Layers className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getStatusBadge = (status: PublicationStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
            <Clock className="w-3 h-3 animate-pulse" />
            در انتظار بررسی
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 border border-red-500/30 text-red-300">
            <XCircle className="w-3 h-3" />
            ردشده
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-300">
            <FileText className="w-3 h-3" />
            پیش‌نویس
          </span>
        );
      case 'published':
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            منتشرشده عمومی
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 shadow-lg animate-fade-in ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
              : 'bg-red-950/80 border-red-700 text-red-200'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-2xl border text-right transition flex flex-col justify-between ${
            statusFilter === 'pending'
              ? 'bg-amber-950/40 border-amber-500/50 shadow-md shadow-amber-950/30'
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">در انتظار تأیید</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            {counts.pending}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-2xl border text-right transition flex flex-col justify-between ${
            statusFilter === 'rejected'
              ? 'bg-red-950/40 border-red-500/50 shadow-md shadow-red-950/30'
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">ردشده جهت اصلاح</span>
            <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-red-300 font-mono">
            {counts.rejected}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('draft')}
          className={`p-4 rounded-2xl border text-right transition flex flex-col justify-between ${
            statusFilter === 'draft'
              ? 'bg-zinc-800 border-zinc-500 shadow-md'
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">پیش‌نویس‌ها</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-200 font-mono">
            {counts.draft}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('published')}
          className={`p-4 rounded-2xl border text-right transition flex flex-col justify-between ${
            statusFilter === 'published'
              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-950/30'
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">منتشرشده عمومی</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            {counts.published}
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="جست‌وجوی عنوان رکورد، نام خودرو یا دلیل رد..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Entity Type Filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition ${
              typeFilter === 'all' ? 'bg-red-600 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            همه بخش‌ها
          </button>
          <button
            onClick={() => setTypeFilter('vehicle')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition flex items-center gap-1 ${
              typeFilter === 'vehicle' ? 'bg-red-600 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            خودرو
          </button>
          <button
            onClick={() => setTypeFilter('ecu')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition flex items-center gap-1 ${
              typeFilter === 'ecu' ? 'bg-red-600 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            ECU
          </button>
          <button
            onClick={() => setTypeFilter('connector')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition flex items-center gap-1 ${
              typeFilter === 'connector' ? 'bg-red-600 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            سوکت
          </button>
          <button
            onClick={() => setTypeFilter('fusebox')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition flex items-center gap-1 ${
              typeFilter === 'fusebox' ? 'bg-red-600 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            جعبه‌فیوز
          </button>
          <button
            onClick={() => setTypeFilter('diagram')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition flex items-center gap-1 ${
              typeFilter === 'diagram' ? 'bg-red-600 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            نقشه و تصاویر
          </button>
        </div>
      </div>

      {/* Policy Notice */}
      <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs text-zinc-400 leading-relaxed flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-zinc-200">سیاست انتشار اطلاعات فنی AutoPin Pro:</strong>
          <span className="block mt-0.5">
            کاربران عادی برنامه فقط رکوردهای تأییدشده با وضعیت «منتشرشده» را مشاهده می‌کنند. پیش‌نویس‌ها و رکوردهای در حال بازبینی برای حفظ سلامت فنی و جلوگیری از بروز خطای سیم‌کشی توسط تعمیرکاران از دید عموم مخفی هستند.
          </span>
        </div>
      </div>

      {/* Items List */}
      <div className="flex flex-col gap-3">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-zinc-600 mb-3" />
            <h3 className="text-sm font-bold text-white">رکوردی با شرایط انتخابی یافت نشد</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              هیچ داده‌ای مطابق با فیلتر وضعیت «{statusFilter}» و نوع بخش انتخابی در سیستم موجود نیست.
            </p>
          </div>
        ) : (
          filteredItems.map(item => {
            const qcIssues = getItemQCIssues(item.id);
            const criticalQc = qcIssues.filter(i => i.severity === 'critical');
            const warningQc = qcIssues.filter(i => i.severity === 'warning');

            return (
              <div
                key={`${item.entityType}-${item.id}`}
                className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Right: Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      getEntityIcon(item.entityType)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {item.entityTypeFa}
                      </span>
                      {getStatusBadge(item.status)}
                      {item.vehicleName && (
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <Car className="w-3 h-3 text-red-400" />
                          {item.vehicleName}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white truncate">
                      {item.title}
                    </h4>

                    <p className="text-xs text-zinc-400 mt-0.5 truncate">
                      {item.subtitle}
                    </p>

                    {/* Rejection Reason if any */}
                    {item.rejectionReason && (
                      <div className="mt-2 p-2.5 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-red-300">دلیل رد اطلاعات:</strong>{' '}
                          <span>{item.rejectionReason}</span>
                        </div>
                      </div>
                    )}

                    {/* QC Badge indicator */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {criticalQc.length > 0 ? (
                        <span className="text-2xs font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          {criticalQc.length} خطای بحرانی در کنترل کیفیت
                        </span>
                      ) : warningQc.length > 0 ? (
                        <span className="text-2xs font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          {warningQc.length} هشدار کنترل کیفیت
                        </span>
                      ) : (
                        <span className="text-2xs font-medium px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          کنترل کیفیت: تأیید خودکار
                        </span>
                      )}

                      {item.submittedBy && (
                        <span className="text-2xs text-zinc-500">
                          ثبت توسط: {item.submittedBy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Left: Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <button
                    onClick={() => setInspectingItem(item)}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-1.5 transition"
                    title="بررسی دقیق و مشاهده تغییرات"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                    <span>بررسی و مقایسه</span>
                  </button>

                  {item.status !== 'published' && (
                    <button
                      onClick={() => setApprovingItem(item)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 transition shadow-sm active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تأیید و انتشار</span>
                    </button>
                  )}

                  {item.status !== 'rejected' && (
                    <button
                      onClick={() => {
                        setRejectingItem(item);
                        setRejectionReasonText(item.rejectionReason || '');
                        setRejectionError(null);
                      }}
                      className="px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800 text-xs font-bold text-red-200 flex items-center gap-1.5 transition"
                    >
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                      <span>رد اطلاعات</span>
                    </button>
                  )}

                  {item.status === 'rejected' && (
                    <button
                      onClick={() => handleReturnToDraft(item)}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 flex items-center gap-1.5 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>بازگشت به پیش‌نویس</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- INSPECTION & DIFF MODAL --- */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-scale-in">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-zinc-800 text-white">
                  {getEntityIcon(inspectingItem.entityType)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>بررسی تخصصی: {inspectingItem.title}</span>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                    <span>{inspectingItem.entityTypeFa}</span>
                    <span aria-hidden="true">·</span>
                    <span>{getStatusBadge(inspectingItem.status)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setInspectingItem(null)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-5 text-right">
              {/* Image Preview if available */}
              {inspectingItem.imageUrl && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col items-center p-3">
                  <span className="text-xs text-zinc-400 font-bold mb-2">تصویر و مستند فنی پیوست‌شده:</span>
                  <img
                    src={inspectingItem.imageUrl}
                    alt={inspectingItem.title}
                    className="max-h-64 object-contain rounded-lg"
                  />
                </div>
              )}

              {/* Automated QC Advisory Indicator */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-red-500" />
                    <span>بررسی خودکار موتور کنترل کیفیت (QC Advisory):</span>
                  </span>
                </div>

                {getItemQCIssues(inspectingItem.id).length === 0 ? (
                  <div className="text-xs text-emerald-400 flex items-center gap-2 mt-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>هیچ عدم تطابق، فیلد خالی بحرانی یا خطای نقض استانداردی در این رکورد شناسایی نشد.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mt-1">
                    {getItemQCIssues(inspectingItem.id).map(iss => (
                      <div
                        key={iss.id}
                        className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                          iss.severity === 'critical'
                            ? 'bg-red-950/40 border-red-800 text-red-200'
                            : 'bg-amber-950/40 border-amber-800 text-amber-200'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div>
                          <strong>{iss.title}:</strong> {iss.description}
                          {iss.recommendation && (
                            <div className="text-2xs text-zinc-400 mt-1">
                              پیشنهاد: {iss.recommendation}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-2xs text-zinc-500 mt-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                  <span>
                    توجه: بررسی خودکار کنترل کیفیت صرفاً راهنمای کمکی است و تصمیم نهایی برای تأیید یا رد با کارشناس انسانی سیستم است.
                  </span>
                </div>
              </div>

              {/* Version History & Changes Diff */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>تغییرات ثبت‌شده و تاریخچه نسخه‌ها ({getItemVersions(inspectingItem.id).length} نسخه):</span>
                </h4>

                {getItemVersions(inspectingItem.id).length === 0 ? (
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 text-center">
                    این رکورد برای اولین بار ایجاد شده است یا نسخه قبلی ثبت‌شده ندارد.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto">
                    {getItemVersions(inspectingItem.id).slice(0, 3).map(ver => (
                      <div
                        key={ver.id}
                        className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-2 text-xs"
                      >
                        <div className="flex items-center justify-between text-zinc-400">
                          <span className="font-bold text-white">
                            نسخه شماره {ver.versionNumber} ({ver.operation === 'create' ? 'ایجاد اولیه' : 'ویرایش'})
                          </span>
                          <span className="font-mono text-2xs">
                            {new Date(ver.timestamp).toLocaleDateString('fa-IR')} {new Date(ver.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {ver.diffs && ver.diffs.length > 0 ? (
                          <div className="flex flex-col gap-1.5 mt-1">
                            {ver.diffs.map((d, dIdx) => (
                              <div
                                key={dIdx}
                                className="p-2 rounded bg-zinc-900 border border-zinc-800 text-xs grid grid-cols-1 sm:grid-cols-3 gap-1"
                              >
                                <span className="font-bold text-zinc-300">{d.fieldLabelFa || d.field}:</span>
                                <div className="text-red-400/90 line-through truncate text-2xs font-mono">
                                  {typeof d.oldValue === 'object' ? JSON.stringify(d.oldValue) : String(d.oldValue ?? 'خالی')}
                                </div>
                                <div className="text-emerald-400 font-mono text-2xs truncate">
                                  {typeof d.newValue === 'object' ? JSON.stringify(d.newValue) : String(d.newValue ?? 'خالی')}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-2xs text-zinc-500">
                            فیلدهای تغییریافته: {ver.changedFields.join('، ') || 'بدون تغییر خاص'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Technical Raw Data Overview */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-white">مشخصات فنی ثبت‌شده:</h4>
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 max-h-48 overflow-y-auto text-2xs font-mono text-zinc-300">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(inspectingItem.rawData, null, 2)}</pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-2">
              <button
                onClick={() => setInspectingItem(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition"
              >
                بستن
              </button>

              <div className="flex items-center gap-2">
                {inspectingItem.status !== 'rejected' && (
                  <button
                    onClick={() => {
                      setRejectingItem(inspectingItem);
                      setRejectionReasonText(inspectingItem.rejectionReason || '');
                    }}
                    className="px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800 text-xs font-bold text-red-200 flex items-center gap-1.5 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>رد اطلاعات</span>
                  </button>
                )}

                {inspectingItem.status !== 'published' && (
                  <button
                    onClick={() => setApprovingItem(inspectingItem)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 transition shadow-md active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تأیید و انتشار عمومی</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- APPROVE CONFIRMATION MODAL --- */}
      {approvingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-5 text-right shadow-2xl flex flex-col gap-4 animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-white">تأیید و انتشار عمومی اطلاعات فنی</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                آیا از انتشار عمومی اطلاعات رکورد «<strong className="text-white">{approvingItem.title}</strong>» اطمینان دارید؟ با انتشار این رکورد، اطلاعات بلافاصله برای تمامی کاربران در بخش جست‌وجو و نقشه‌ها قابل مشاهده خواهد شد.
              </p>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setApprovingItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-bold transition"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmApprove}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-bold transition shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>بله، تأیید و انتشار شود</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- REJECTION MODAL (MANDATORY REASON) --- */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-5 text-right shadow-2xl flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  ثبت دلیل رد اطلاعات: {rejectingItem.title}
                </h3>
              </div>
              <button
                onClick={() => setRejectingItem(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              لطفاً علت رد اطلاعات و موارد فنی دارای نقص یا عدم تطابق را به طور واضح برای تدوین‌کننده بنویسید. این پیام در پنل نویسنده نمایش داده می‌شود تا بتواند موارد را تصحیح نماید:
            </p>

            <textarea
              rows={4}
              value={rejectionReasonText}
              onChange={e => {
                setRejectionReasonText(e.target.value);
                setRejectionError(null);
              }}
              placeholder="مثال: نقشه با سوکت ۳۲ پایه مطابقت ندارد / پایه‌های ۱۲ و ۱۴ اشتباه جابه‌جا شده‌اند..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 leading-relaxed"
            />

            {rejectionError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{rejectionError}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setRejectingItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-bold transition"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs text-white font-bold transition shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>ثبت قطعی رد اطلاعات</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { storage } from '../../services/storage';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  entityType: 'vehicle' | 'ecu' | 'connector' | 'fusebox' | 'diagram' | 'media';
  entityId: string;
  entityTitle: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  entityType,
  entityId,
  entityTitle
}) => {
  const [explicitAcknowledge, setExplicitAcknowledge] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  // Check dependencies
  const depCheck = (entityType === 'vehicle' || entityType === 'ecu' || entityType === 'connector' || entityType === 'fusebox')
    ? storage.checkRecordDependencies(entityType, entityId)
    : { hasDependencies: false, summary: '', items: { typeFa: entityType, count: 0, details: [] } };

  const handleExecuteDelete = async () => {
    if (depCheck.hasDependencies && !explicitAcknowledge) {
      alert('لطفاً پیش از حذف، کادر تأیید مسئولیت حذف رکوردهای وابسته را علامت بزنید.');
      return;
    }
    try {
      setIsDeleting(true);
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      alert(`خطا در حذف رکورد: ${err instanceof Error ? err.message : 'خطای سرور'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 text-right overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5 text-red-500">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">تأیید حذف رکورد از بانک اطلاعاتی</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-3 text-xs">
          <p className="text-zinc-300 leading-relaxed">
            آیا از حذف <strong className="text-white font-bold">«{entityTitle}»</strong> اطمینان دارید؟
          </p>

          {/* Dependency Warning */}
          {depCheck.hasDependencies ? (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>هشدار وابستگی‌های اطلاعاتی!</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                {depCheck.summary}
              </p>
              <ul className="list-disc list-inside text-[11px] text-zinc-300 space-y-1 pr-1 font-medium">
                {depCheck.items.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
              <div className="pt-2 border-t border-red-900/60">
                <label className="flex items-start gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={explicitAcknowledge}
                    onChange={(e) => setExplicitAcknowledge(e.target.checked)}
                    className="accent-red-600 mt-0.5 rounded shrink-0"
                  />
                  <span className="text-[11px] text-red-200 leading-relaxed font-semibold">
                    به‌عنوان مدیر سیستم، مسئولیت حذف این رکورد و مدیریت اطلاعات وابسته را می‌پذیرم.
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-zinc-400">
              این رکورد هیچ وابستگی مستقیمی ندارد و بدون تأثیر روی سایر بخش‌ها حذف خواهد شد.
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl transition"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleExecuteDelete}
            disabled={isDeleting || (depCheck.hasDependencies && !explicitAcknowledge)}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md shadow-red-950 transition flex items-center gap-1.5 active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'در حال حذف...' : 'حذف قطعی رکورد'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

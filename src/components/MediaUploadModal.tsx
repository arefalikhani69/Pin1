import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  RotateCcw,
  Car,
  Layers,
  FileText
} from 'lucide-react';
import { MediaItem, TechnicalImageType, Vehicle, Connector, FuseBox } from '../types';
import { uploadToFirebaseStorage } from '../services/firebase';
import { onlineStorage } from '../services/onlineStorage';
import { storage } from '../services/storage';
import { processAndCompressImage } from '../services/imageService';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'vehicle' | 'connector' | 'fusebox' | 'pin' | 'diagram';
  entityId: string;
  entityName: string;
  vehicleId?: string;
  defaultImageType?: TechnicalImageType | string;
  onMediaUploaded?: (media: MediaItem) => void;
}

export const TECHNICAL_IMAGE_TYPES: { id: TechnicalImageType; labelFa: string; category: string }[] = [
  { id: 'real_part', labelFa: '۱. تصویر واقعی قطعه یا سوکت', category: 'قطعه و سوکت' },
  { id: 'socket_front', labelFa: '۲. تصویر نمای روبه‌رو سوکت (محل ورود پین)', category: 'قطعه و سوکت' },
  { id: 'socket_back', labelFa: '۳. تصویر پشت سوکت (محل ورود سیم و قفل)', category: 'قطعه و سوکت' },
  { id: 'socket_schematic', labelFa: '۴. تصویر شماتیک ساختار سوکت', category: 'قطعه و سوکت' },
  { id: 'pinout_diagram', labelFa: '۵. تصویر پیناوت و جدول پایه‌ها', category: 'پیناوت' },
  { id: 'fusebox_real', labelFa: '۶. تصویر کلی و واقعی جعبه‌فیوز', category: 'جعبه‌فیوز' },
  { id: 'fusebox_cover', labelFa: '۷. تصویر نقشه روی درپوش جعبه‌فیوز (Cover)', category: 'جعبه‌فیوز' },
  { id: 'fusebox_diagram', labelFa: '۸. تصویر نقشه چینش فیوزها', category: 'جعبه‌فیوز' },
  { id: 'relays_layout', labelFa: '۹. تصویر چیدمان و پایه‌های رله‌ها', category: 'رله‌ها' },
  { id: 'wiring_diagram', labelFa: '۱۰. نقشه سیم‌کشی الکتریکی خودرو (Wiring)', category: 'سیم‌کشی' },
  { id: 'supplementary', labelFa: '۱۱. تصویر تکمیلی و راهنمای نصب/تست', category: 'تکمیلی' }
];

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
  vehicleId: initialVehicleId,
  defaultImageType,
  onMediaUploaded
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; sizeKb: number } | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageType, setImageType] = useState<TechnicalImageType>(
    (defaultImageType as TechnicalImageType) ||
      (entityType === 'fusebox' ? 'fusebox_cover' : 'pinout_diagram')
  );
  const [source, setSource] = useState('نقشه‌های رسمی و استانداردهای کارخانه‌ای');
  const [status, setStatus] = useState<MediaItem['status']>('published');

  // Related targets
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleId || '');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [fuseBoxes, setFuseBoxes] = useState<FuseBox[]>([]);
  const [selectedTargetEntityId, setSelectedTargetEntityId] = useState<string>(entityId);

  // Upload status states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [storageFallbackNotice, setStorageFallbackNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const vList = storage.getVehicles();
      const cList = storage.getConnectors();
      const fList = storage.getFuseBoxes();
      setVehicles(vList);
      setConnectors(cList);
      setFuseBoxes(fList);

      if (initialVehicleId) {
        setSelectedVehicleId(initialVehicleId);
      } else if (vList.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(vList[0].id);
      }
      setSelectedTargetEntityId(entityId);
    }
  }, [isOpen, initialVehicleId, entityId]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setUploadError('تنها فرمت‌های تصویری JPEG، PNG و WebP مجاز هستند.');
      return;
    }

    // Validate size (max 20MB before compression)
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('حجم فایل انتخابی بیش از ۲۰ مگابایت است.');
      return;
    }

    setUploadError(null);
    setStorageFallbackNotice(null);
    setSelectedFile(file);

    // Default title if empty
    if (!title) {
      const matchingType = TECHNICAL_IMAGE_TYPES.find(t => t.id === imageType);
      setTitle(`${entityName} - ${matchingType ? matchingType.labelFa.slice(3) : 'تصویر فنی'}`);
    }

    // Preview and compute dimensions
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const img = new Image();
    img.onload = () => {
      setImageMeta({
        width: img.naturalWidth,
        height: img.naturalHeight,
        sizeKb: Math.round(file.size / 1024)
      });
    };
    img.src = objectUrl;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('لطفاً ابتدا تصویری از گالری یا دوربین انتخاب فرمایید.');
      return;
    }
    if (!title.trim()) {
      setUploadError('لطفاً عنوان تصویر را وارد فرمایید.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(15);
      setUploadError(null);
      setStorageFallbackNotice(null);

      // High quality preservation with strict optimization under Firestore document limit (~350KB max)
      setUploadProgress(35);
      const compressed = await processAndCompressImage(selectedFile, 1800, 0.88);
      const finalDataUrl = compressed.dataUrl;

      // Prepare clean destination storage path
      const cleanFileName = selectedFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const targetId = selectedTargetEntityId || entityId;
      const storagePath = `media/${entityType}/${targetId}/${Date.now()}_${cleanFileName}`;

      let downloadUrl = '';
      setUploadProgress(55);

      try {
        // Convert to blob and attempt Cloud Storage upload
        const res = await fetch(finalDataUrl);
        const blob = await res.blob();
        downloadUrl = await uploadToFirebaseStorage(blob, storagePath, 12000);
        setUploadProgress(85);
      } catch (storageErr) {
        console.warn('Firebase Cloud Storage unavailable, falling back to local/Firestore storage:', storageErr);
        // Fallback: use optimized base64 dataUrl (safely ~150-250KB, fits in Firestore and local storage)
        downloadUrl = finalDataUrl;
        setStorageFallbackNotice('تصویر به دلیل عدم فعال‌سازی Cloud Storage در پایگاه داده داخلی و حافظه پایدار با کیفیت بهینه ذخیره شد.');
        setUploadProgress(85);
      }

      const mediaRecord: MediaItem = {
        id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        description: description.trim() || '',
        fileUrl: downloadUrl,
        storagePath: storagePath || '',
        mimeType: selectedFile.type || 'image/jpeg',
        fileSize: selectedFile.size || 0,
        entityType,
        entityId: targetId,
        vehicleId: selectedVehicleId || undefined,
        imageType,
        source: source.trim() || 'نقشه‌های استاندارد خودرویی',
        status: status || 'published',
        createdAt: Date.now()
      };

      // Dual Persistence: localStorage + Firestore
      await onlineStorage.saveMedia(mediaRecord);
      setUploadProgress(100);
      setUploadSuccess(true);
      onMediaUploaded?.(mediaRecord);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      console.error('Upload error:', err);
      const msg = err instanceof Error ? err.message : 'خطای نامشخص در بارگذاری';
      setUploadError(`بارگذاری با شکست مواجه شد: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">بارگذاری تصویر و نقشه فنی</h3>
              <p className="text-[11px] text-zinc-400">مرتبط با: {entityName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* File Picker & Camera Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <label className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 cursor-pointer text-zinc-200 font-bold transition active:scale-95">
              <ImageIcon className="w-4 h-4 text-red-500" />
              <span>انتخاب از گالری گوشی</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <label className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 cursor-pointer text-zinc-200 font-bold transition active:scale-95">
              <Camera className="w-4 h-4 text-amber-400" />
              <span>عکاسی مستقیم با دوربین</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Live Preview Box */}
          {previewUrl && (
            <div className="relative w-full h-44 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center">
              <img
                src={previewUrl}
                alt="پیش‌نمایش تصویر"
                className="max-h-full max-w-full object-contain"
              />
              <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/80 text-[10px] text-zinc-300 font-mono flex items-center gap-2">
                {imageMeta && (
                  <span>
                    {imageMeta.width}×{imageMeta.height} px · {imageMeta.sizeKb} KB
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setImageMeta(null);
                }}
                className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/80 text-red-400 hover:text-white"
                title="حذف پیش‌نمایش"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Category / Image Type Selector (All 11 Types) */}
          <div>
            <label className="text-zinc-300 font-semibold block mb-1">
              نوع و دسته‌بندی تصویر فنی: *
            </label>
            <select
              value={imageType}
              onChange={(e) => {
                const val = e.target.value as TechnicalImageType;
                setImageType(val);
                if (!title || title.includes('تصویر جدید') || title.includes('تصویر فنی')) {
                  const matching = TECHNICAL_IMAGE_TYPES.find(t => t.id === val);
                  if (matching) {
                    setTitle(`${entityName} - ${matching.labelFa.slice(3)}`);
                  }
                }
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white font-medium"
            >
              {TECHNICAL_IMAGE_TYPES.map(t => (
                <option key={t.id} value={t.id}>
                  {t.labelFa}
                </option>
              ))}
            </select>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">عنوان تصویر: *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: نمای روبه‌رو سوکت ۳۲ پایه مشکی بوش با شماره‌گذاری پین‌ها"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">توضیحات تکمیلی و نکات تعمیرگاهی (اختیاری):</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توضیحاتی در مورد محل خار، کد فنی سوکت، رنگ‌بندی سیم‌ها یا نحوه جداسازی در تعمیرگاه..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white resize-none text-xs"
              />
            </div>
          </div>

          {/* Target Relationship Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="text-zinc-400 block mb-1">خودروی مرتبط:</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs"
              >
                <option value="">(بدون انتخاب خودروی خاص)</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.generation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">منبع فنی اطلاعات:</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="ایران‌خودرو، سایپا، پژو سرویس‌باکس..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs"
              />
            </div>
          </div>

          {/* Publication Status */}
          <div className="flex items-center gap-4 text-xs pt-1">
            <span className="text-zinc-400">وضعیت انتشار:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-emerald-400 font-semibold">
              <input
                type="radio"
                name="status"
                value="published"
                checked={status === 'published'}
                onChange={() => setStatus('published')}
              />
              <span>منتشر شده</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-amber-400 font-semibold">
              <input
                type="radio"
                name="status"
                value="pending"
                checked={status === 'pending'}
                onChange={() => setStatus('pending')}
              />
              <span>در انتظار تایید</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-400">
              <input
                type="radio"
                name="status"
                value="draft"
                checked={status === 'draft'}
                onChange={() => setStatus('draft')}
              />
              <span>پیش‌نویس</span>
            </label>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                <span>پیشرفت پردازش و بارگذاری...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Feedback Alerts */}
          {storageFallbackNotice && (
            <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{storageFallbackNotice}</span>
            </div>
          )}

          {uploadError && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="self-end px-3 py-1 rounded-lg bg-red-800 hover:bg-red-700 text-white text-[11px] font-bold flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تلاش مجدد</span>
              </button>
            </div>
          )}

          {uploadSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>تصویر و نقشه فنی با موفقیت در پایگاه داده ثبت شد.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-red-950 flex items-center gap-1.5 transition active:scale-95"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال بارگذاری و ذخیره...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>بارگذاری و ثبت تصویر</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

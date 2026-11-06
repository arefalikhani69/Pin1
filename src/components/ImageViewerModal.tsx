import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Shield,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileText,
  Tag
} from 'lucide-react';

export interface GalleryImageItem {
  url: string;
  title: string;
  description?: string;
  source?: string;
  typeName?: string;
  subtitle?: string;
}

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Can accept either a list of images or a single image
  images?: GalleryImageItem[];
  initialIndex?: number;
  // Backwards compatibility props
  imageUrl?: string;
  title?: string;
  subtitle?: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  imageUrl,
  title,
  subtitle
}) => {
  // Normalize image list
  const imageList: GalleryImageItem[] = React.useMemo(() => {
    if (images && images.length > 0) {
      return images;
    }
    if (imageUrl) {
      return [
        {
          url: imageUrl,
          title: title || 'تصویر فنی',
          subtitle: subtitle
        }
      ];
    }
    return [];
  }, [images, imageUrl, title, subtitle]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showInfo, setShowInfo] = useState(true);

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, imageList.length - 1)));
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex, imageList.length]);

  const currentImage = imageList[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < imageList.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [currentIndex, imageList.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        // In RTL, right arrow moves backwards or forwards depending on convention
        handlePrev();
      } else if (e.key === 'ArrowLeft') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        setScale(prev => Math.min(prev + 0.4, 4));
      } else if (e.key === '-') {
        setScale(prev => Math.max(prev - 0.4, 0.6));
      } else if (e.key === '0') {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen || !currentImage) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.4, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.4, 0.6));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch drag support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md select-none text-right" dir="rtl">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-zinc-900/95 border-b border-zinc-800 z-10 shrink-0">
        <div className="min-w-0 flex items-center gap-2">
          {currentImage.typeName && (
            <span className="px-2 py-0.5 rounded bg-red-950 border border-red-800/80 text-[10px] text-red-300 font-bold hidden sm:inline-block">
              {currentImage.typeName}
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-2">
              <span>{currentImage.title}</span>
              {imageList.length > 1 && (
                <span className="text-[11px] text-zinc-400 font-normal">
                  ({currentIndex + 1} از {imageList.length})
                </span>
              )}
            </h3>
            {currentImage.subtitle && (
              <p className="text-[11px] text-zinc-400 truncate">{currentImage.subtitle}</p>
            )}
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowInfo(prev => !prev)}
            className={`p-2 rounded-lg text-xs transition ${
              showInfo ? 'bg-zinc-800 text-amber-400' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
            title="مشاهده/مخفی‌سازی توضیحات"
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 active:scale-95 transition"
            title="کوچک‌نمایی"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 active:scale-95 transition"
            title="بزرگ‌نمایی"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 active:scale-95 transition"
            title="تنظیم مجدد اندازه"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/80 text-[11px] text-zinc-300 font-medium select-none">
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>حفاظت از فایل و کپی‌رایت</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-red-600 hover:bg-red-500 text-white active:scale-95 transition mr-2"
            title="بستن پنجره"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Pan / Zoom Viewport */}
      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing bg-black"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentImage.url ? (
          <img
            src={currentImage.url}
            alt={currentImage.title}
            className="max-w-none transition-transform duration-75 ease-out select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              maxHeight: '85vh',
              objectFit: 'contain'
            }}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500">
            <p className="text-sm font-medium">تصویر ثبت نشده است</p>
          </div>
        )}

        {/* Gallery Navigation Buttons (Next / Prev) */}
        {imageList.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              disabled={currentIndex === 0}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 disabled:opacity-20 text-white backdrop-blur-md border border-zinc-700 shadow-xl transition active:scale-95"
              title="تصویر قبلی"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              disabled={currentIndex === imageList.length - 1}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 disabled:opacity-20 text-white backdrop-blur-md border border-zinc-700 shadow-xl transition active:scale-95"
              title="تصویر بعدی"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Floating Description & Source Banner */}
        {showInfo && (currentImage.description || currentImage.source) && (
          <div className="absolute bottom-10 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs text-zinc-200 backdrop-blur-md shadow-2xl flex flex-col gap-1 pointer-events-auto">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentImage.title}</span>
              </span>
              {currentImage.source && (
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-amber-300 font-mono">
                  منبع: {currentImage.source}
                </span>
              )}
            </div>
            {currentImage.description && (
              <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                {currentImage.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="py-2 px-4 flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-950/90 border-t border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <span>بزرگ‌نمایی: {Math.round(scale * 100)}%</span>
          <span className="text-zinc-600">|</span>
          <span className="hidden sm:inline">برای جابه‌جایی روی تصویر بکشید (Pan & Drag)</span>
        </div>

        {imageList.length > 1 && (
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
            <span>تصویر</span>
            <span className="text-white font-bold">{currentIndex + 1}</span>
            <span>از</span>
            <span>{imageList.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { FavoriteType, FavoriteItem } from '../types';
import { storage } from '../services/storage';
import { useAuth } from '../context/AuthContext';

interface FavoriteButtonProps {
  type: FavoriteType;
  itemId: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  vehicleId?: string;
  vehicleName?: string;
  extraInfo?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  onToggle?: (isFavorited: boolean) => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  type,
  itemId,
  title,
  subtitle,
  imageUrl,
  vehicleId,
  vehicleName,
  extraInfo,
  size = 'md',
  showLabel = false,
  className = '',
  onToggle
}) => {
  const { currentUser } = useAuth();
  const [isFavorited, setIsFavorited] = useState(() =>
    storage.isFavorite(type, itemId, currentUser?.uid)
  );

  useEffect(() => {
    setIsFavorited(storage.isFavorite(type, itemId, currentUser?.uid));
  }, [type, itemId, currentUser?.uid]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const newState = storage.toggleFavorite({
      userId: currentUser?.uid,
      type,
      itemId,
      title,
      subtitle,
      imageUrl,
      vehicleId,
      vehicleName,
      extraInfo
    });

    setIsFavorited(newState);
    onToggle?.(newState);
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const buttonPadding = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5'
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`rounded-xl transition-all duration-200 flex items-center gap-1.5 active:scale-90 shrink-0 ${
        buttonPadding[size]
      } ${
        isFavorited
          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-950/50'
          : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 border border-zinc-800'
      } ${className}`}
      title={isFavorited ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
      aria-label={isFavorited ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
    >
      <Star
        className={`${iconSizes[size]} transition-transform ${
          isFavorited ? 'fill-amber-400 text-amber-400 scale-105' : 'text-current'
        }`}
      />
      {showLabel && (
        <span className="text-xs font-semibold whitespace-nowrap">
          {isFavorited ? 'نشان‌شده' : 'افزودن به نشان‌ها'}
        </span>
      )}
    </button>
  );
};

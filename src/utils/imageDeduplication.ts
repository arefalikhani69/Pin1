/**
 * AutoPin Pro - Image Deduplication & Canonical Normalization Utility
 * Ensures that every technical photo, diagram, cover layout, or schematic
 * appears exactly ONCE in its strictly defined category, across local storage,
 * Firestore cloud database, and React UI components.
 */

import { MediaItem } from '../types';

/**
 * Normalizes an image URL or dataUrl into a canonical string.
 * Strips volatile query strings (such as Firebase auth tokens, cache busters, and alt=media parameters).
 * For Base64 Data URLs, produces a deterministic signature based on data prefix, length, and content slice.
 */
export function normalizeImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Data URLs (base64)
  if (trimmed.startsWith('data:image/')) {
    const commaIndex = trimmed.indexOf(',');
    if (commaIndex > 0) {
      const mime = trimmed.substring(5, commaIndex);
      const data = trimmed.substring(commaIndex + 1);
      // Sample header, middle, and tail of base64 data to form a fast, robust signature
      const sample = data.substring(0, 80) + data.substring(Math.max(0, data.length - 80));
      return `data:${mime}:${data.length}:${sample}`;
    }
    return trimmed;
  }

  try {
    // Standard HTTP/HTTPS URLs
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const parsed = new URL(trimmed);
      // Ignore query parameters that are volatile (like token, t, cache-bust)
      // Keep only pathname and origin
      return `${parsed.origin}${parsed.pathname}`.toLowerCase();
    }
  } catch {
    // If not a valid URL, fallback to string stripping
  }

  // Remove query parameters manually if parsing failed
  const withoutQuery = trimmed.split('?')[0].split('#')[0];
  return withoutQuery.replace(/\/+$/, '').toLowerCase();
}

/**
 * Derives a canonical key for a media item.
 * Prioritizes normalized storagePath, normalized fileUrl, or unique ID.
 */
export function getMediaCanonicalKey(item: {
  id?: string;
  fileUrl?: string;
  storagePath?: string;
}): string {
  if (item.storagePath && item.storagePath.trim()) {
    const cleanPath = item.storagePath.trim().replace(/^\/+/, '').toLowerCase();
    if (cleanPath.length > 3) return `path:${cleanPath}`;
  }

  if (item.fileUrl && item.fileUrl.trim()) {
    const norm = normalizeImageUrl(item.fileUrl);
    if (norm) return `url:${norm}`;
  }

  return item.id ? `id:${item.id}` : `temp:${Math.random()}`;
}

/**
 * Deduplicates a list of MediaItem records.
 * If two records point to the same physical file or image content,
 * merges them into a single record, preserving the richest metadata and most recent timestamp.
 */
export function deduplicateMediaList(items: MediaItem[]): MediaItem[] {
  if (!items || items.length === 0) return [];

  const map = new Map<string, MediaItem>();

  for (const item of items) {
    if (!item.fileUrl || !item.fileUrl.trim()) continue;

    const key = getMediaCanonicalKey(item);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, { ...item });
    } else {
      // Merge records: preserve the one with higher completeness or newer createdAt
      const preferred = (item.createdAt || 0) >= (existing.createdAt || 0) ? item : existing;
      const merged: MediaItem = {
        ...preferred,
        title: preferred.title || existing.title || 'تصویر فنی',
        description: preferred.description || existing.description || '',
        source: preferred.source || existing.source || '',
        imageType: preferred.imageType || existing.imageType || 'supplementary',
        status: preferred.status || existing.status || 'published'
      };
      map.set(key, merged);
    }
  }

  return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export interface GalleryItemView {
  id: string;
  url: string;
  title: string;
  description?: string;
  source?: string;
  typeName: string;
  subtitle?: string;
  isBaseFallback?: boolean;
}

export interface FallbackImageDescriptor {
  url?: string;
  label?: string;
}

/**
 * Builds a strictly deduplicated, mutually-exclusive gallery list for a specific category.
 * If fallbackUrl points to an image that already exists in uploaded media,
 * only the uploaded media item is retained and NO duplicate card is ever displayed.
 * Supports a single string fallback or an array of fallback descriptors (e.g. for multi-angle sockets).
 */
export function buildDeduplicatedCategoryGallery(
  categoryTitle: string,
  matchedMedia: MediaItem[],
  fallbackUrlOrList?: string | FallbackImageDescriptor[],
  fallbackLabel: string = 'تصویر پایه',
  parentEntityTitle?: string,
  parentEntitySource?: string
): GalleryItemView[] {
  const result: GalleryItemView[] = [];
  const seenKeys = new Set<string>();

  // 1. First, register all uploaded matched media items (they have the richest user-entered metadata)
  const cleanMatched = deduplicateMediaList(matchedMedia);
  for (const m of cleanMatched) {
    if (!m.fileUrl || !m.fileUrl.trim()) continue;
    const key = getMediaCanonicalKey(m);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      result.push({
        id: m.id,
        url: m.fileUrl,
        title: m.title || categoryTitle,
        description: m.description,
        source: m.source || parentEntitySource,
        typeName: categoryTitle,
        subtitle: parentEntityTitle,
        isBaseFallback: false
      });
    }
  }

  // 2. Prepare normalized list of fallback candidates
  const fallbacks: FallbackImageDescriptor[] = [];
  if (typeof fallbackUrlOrList === 'string' && fallbackUrlOrList.trim()) {
    fallbacks.push({ url: fallbackUrlOrList.trim(), label: fallbackLabel });
  } else if (Array.isArray(fallbackUrlOrList)) {
    fallbackUrlOrList.forEach((fb, idx) => {
      if (fb && fb.url && fb.url.trim()) {
        fallbacks.push({
          url: fb.url.trim(),
          label: fb.label || `${fallbackLabel} ${idx + 1}`
        });
      }
    });
  }

  // 3. Only if the fallbackUrl is NOT already represented by any uploaded media item or earlier fallback, include it
  for (const fb of fallbacks) {
    if (!fb.url) continue;
    const fallbackKey = `url:${normalizeImageUrl(fb.url)}`;
    if (!seenKeys.has(fallbackKey)) {
      seenKeys.add(fallbackKey);
      result.push({
        id: `fallback-${categoryTitle}-${normalizeImageUrl(fb.url).slice(-16)}`,
        url: fb.url,
        title: fb.label ? `${fb.label}` : `${categoryTitle} (${fallbackLabel})`,
        description: 'تصویر استاندارد ثبت‌شده در مشخصات پایه قطعه خودرو',
        source: parentEntitySource || 'نقشه‌های استاندارد کارخانه',
        typeName: categoryTitle,
        subtitle: parentEntityTitle,
        isBaseFallback: true
      });
    }
  }

  return result;
}

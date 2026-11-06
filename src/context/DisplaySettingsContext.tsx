import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { UserDisplaySettings, DEFAULT_DISPLAY_SETTINGS } from '../types/settings';
import { storage } from '../services/storage';
import { useAuth } from './AuthContext';

interface DisplaySettingsContextType {
  settings: UserDisplaySettings;
  resolvedTheme: 'dark' | 'light';
  updateSettings: (partial: Partial<UserDisplaySettings>) => void;
  resetToDefaults: () => void;
}

const DisplaySettingsContext = createContext<DisplaySettingsContextType | undefined>(undefined);

export const DisplaySettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;

  const [settings, setSettings] = useState<UserDisplaySettings>(() => {
    return storage.getDisplaySettings(userId);
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Listen to system color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    try {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } catch {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, []);

  // Sync settings when currentUser changes (per-user isolation)
  useEffect(() => {
    const loaded = storage.getDisplaySettings(userId);
    setSettings(loaded);
  }, [userId]);

  // Compute resolved theme
  const resolvedTheme: 'dark' | 'light' = useMemo(() => {
    if (settings.themeMode === 'system') {
      return systemIsDark ? 'dark' : 'light';
    }
    return settings.themeMode;
  }, [settings.themeMode, systemIsDark]);

  // Apply classes and CSS variables directly to document.documentElement
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // 1. Theme Class
    root.classList.remove('theme-dark', 'theme-light');
    root.classList.add(`theme-${resolvedTheme}`);

    // 2. Font Scale
    root.classList.remove('font-scale-sm', 'font-scale-md', 'font-scale-lg', 'font-scale-xl');
    root.classList.add(`font-scale-${settings.fontSize}`);

    // 3. Density
    root.classList.remove('density-compact', 'density-normal', 'density-comfortable');
    root.classList.add(`density-${settings.density}`);

    // 4. Table Font Size
    root.classList.remove('table-font-sm', 'table-font-md', 'table-font-lg');
    root.classList.add(`table-font-${settings.tableFontSize}`);

    // 5. Table Row Height
    root.classList.remove('table-row-compact', 'table-row-normal', 'table-row-relaxed');
    root.classList.add(`table-row-${settings.tableRowHeight}`);

    // Safe color-scheme
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme, settings]);

  const updateSettings = useCallback(
    (partial: Partial<UserDisplaySettings>) => {
      setSettings((prev) => {
        const next: UserDisplaySettings = { ...prev, ...partial };
        storage.saveDisplaySettings(next, userId);
        return next;
      });
    },
    [userId]
  );

  const resetToDefaults = useCallback(() => {
    const fresh = storage.resetDisplaySettings(userId);
    setSettings(fresh);
  }, [userId]);

  const value = useMemo(
    () => ({
      settings,
      resolvedTheme,
      updateSettings,
      resetToDefaults
    }),
    [settings, resolvedTheme, updateSettings, resetToDefaults]
  );

  return (
    <DisplaySettingsContext.Provider value={value}>
      {children}
    </DisplaySettingsContext.Provider>
  );
};

export const useDisplaySettings = (): DisplaySettingsContextType => {
  const context = useContext(DisplaySettingsContext);
  if (!context) {
    throw new Error('useDisplaySettings must be used within a DisplaySettingsProvider');
  }
  return context;
};

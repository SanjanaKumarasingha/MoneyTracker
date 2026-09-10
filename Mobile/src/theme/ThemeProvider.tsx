import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { getStoredPreference, setStoredPreference } from '@/lib/secureStorage';
import { ColorPalette, darkColors, lightColors } from './colors';
import { shadows, Shadows } from './shadows';

export type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedScheme = 'light' | 'dark';

type ThemeContextValue = {
  colors: ColorPalette;
  shadows: Shadows;
  scheme: ResolvedScheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_MODE_KEY = 'theme_mode';

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};

type ThemeProviderProps = {
  children: ReactNode;
};

// System-scheme-driven theme with a persisted Light/Dark/System override
// (see Settings > Appearance). `mode: 'system'` (the default) tracks the
// OS setting live via useColorScheme(); picking Light or Dark pins the
// resolved scheme regardless of what the OS is set to, and that choice is
// remembered on-device the same way the wallet card order is (see
// GlassWalletCarousel.tsx / src/lib/secureStorage.ts's getStoredPreference).
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    getStoredPreference(THEME_MODE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
      setHydrated(true);
    });
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    setStoredPreference(THEME_MODE_KEY, next).catch(() => {});
  };

  // Until the persisted override is read, default to the live system
  // scheme (never a hardcoded 'light') so there's no light->dark flash for
  // a device set to dark mode.
  const scheme: ResolvedScheme = !hydrated || mode === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : mode;

  const value = useMemo<ThemeContextValue>(() => {
    const palette = scheme === 'dark' ? darkColors : lightColors;
    return {
      colors: palette,
      shadows,
      scheme,
      mode,
      setMode,
    };
  }, [scheme, mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

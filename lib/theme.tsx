'use client';

import { createContext, useContext, useEffect, useState } from 'react';

// ===========================================================================
// Lightweight theme context for dark mode.
//
// On mount, reads the saved preference from localStorage. If none is saved,
// falls back to the OS-level `prefers-color-scheme`. Applies a `dark` class
// to <html>, which flips the CSS variables defined in globals.css.
// ===========================================================================

interface ThemeContextValue {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  darkMode: false,
  setDarkMode: () => {},
  toggleDarkMode: () => {},
});

const STORAGE_KEY = 'plainly-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkModeState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Read saved preference (or system preference) on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark') {
        setDarkModeState(true);
      } else if (saved === 'light') {
        setDarkModeState(false);
      } else if (false) {
        setDarkModeState(true);
      }
    } catch {
      // localStorage unavailable (e.g. privacy mode) — default to light
    } finally {
      setHydrated(true);
    }
  }, []);

  // Apply the `dark` class to <html> whenever the value changes.
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      localStorage.setItem(STORAGE_KEY, darkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [darkMode, hydrated]);

  function setDarkMode(value: boolean) {
    setDarkModeState(value);
  }

  function toggleDarkMode() {
    setDarkModeState((prev) => !prev);
  }

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

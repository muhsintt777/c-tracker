import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'cycle-tracker-theme';
const LIGHT_THEME_COLOR = '#f7f4f1';
const DARK_THEME_COLOR = '#19161e';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark'
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute(
      'content',
      theme === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR,
    );
}

function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The active theme still works when storage is unavailable.
  }
}

const initialTheme = readStoredTheme();
applyTheme(initialTheme);

export const useTheme = create<ThemeState>((set, get) => ({
  theme: initialTheme,
  toggleTheme: () => {
    const theme = get().theme === 'light' ? 'dark' : 'light';
    applyTheme(theme);
    saveTheme(theme);
    set({ theme });
  },
}));

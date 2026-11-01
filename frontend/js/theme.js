import { store } from './store.js';
import { api } from './api.js';

export class ThemeManager {
  static STORAGE_KEY = 'planify_theme';

  static init() {
    // 1. Get saved theme or system preference
    const savedTheme = localStorage.getItem(this.STORAGE_KEY) || 'light';
    this.apply(savedTheme, false);

    // 2. Watch for system preference changes if 'system' is selected
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem(this.STORAGE_KEY) === 'system') {
          this.applySystemTheme();
        }
      });
    }

    // 3. Listen to store changes
    store.on('theme', (newTheme) => {
      this.apply(newTheme, false);
    });
  }

  static apply(theme, syncWithDb = true) {
    localStorage.setItem(this.STORAGE_KEY, theme);
    if (theme === 'system') {
      this.applySystemTheme();
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }

    // If logged in and requested, sync preference to user's DB profile
    if (syncWithDb && api.getToken()) {
      api.put('/users/me', { theme_preference: theme }).catch(err => {
        console.warn('Could not persist theme to DB:', err);
      });
    }
  }

  static applySystemTheme() {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }

  static toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    store.set('theme', next);
    this.apply(next, true);
    return next;
  }
}

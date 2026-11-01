import { store } from './store.js';
import { api } from './api.js';

export class ThemeManager {
  static STORAGE_KEY = 'planify_theme';

  static getSavedTheme() {
    return localStorage.getItem('planify_theme') || localStorage.getItem('theme') || 'light';
  }

  static init() {
    // 1. Get saved theme or fallback
    const savedTheme = this.getSavedTheme();
    this.apply(savedTheme, false);

    // 2. Watch for system preference changes if 'system' is selected
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.getSavedTheme() === 'system') {
          this.applySystemTheme();
        }
      });
    }

    // 3. Listen to store changes
    store.on('theme', (newTheme) => {
      if (newTheme && newTheme !== document.documentElement.getAttribute('data-theme')) {
        this.apply(newTheme, false);
      }
    });
  }

  static apply(theme, syncWithDb = true) {
    if (!theme) theme = 'light';

    // Store in both keys for 100% backward & cross-module compatibility
    try {
      localStorage.setItem('planify_theme', theme);
      localStorage.setItem('theme', theme);
    } catch (_) {}

    if (theme === 'system') {
      this.applySystemTheme();
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }

    if (store && store.state) {
      store.state.theme = theme;
    }

    // Update tooltip on toggle button
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      const isDark = (document.documentElement.getAttribute('data-theme') === 'dark');
      themeBtn.title = isDark ? 'Chuyển sang giao diện Sáng (Light)' : 'Chuyển sang giao diện Tối (Dark)';
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
    const current = document.documentElement.getAttribute('data-theme') || this.getSavedTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    this.apply(next, true);
    store.set('theme', next);
    return next;
  }
}

import { store } from './store.js';

export class ThemeManager {
  static init() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.apply(savedTheme);

    // Watch for system preference changes if 'system' is selected
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('theme') === 'system') {
          this.applySystemTheme();
        }
      });
    }

    store.on('theme', (newTheme) => {
      this.apply(newTheme);
    });
  }

  static apply(theme) {
    localStorage.setItem('theme', theme);
    if (theme === 'system') {
      this.applySystemTheme();
    } else {
      document.documentElement.setAttribute('data-theme', theme);
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
    this.apply(next);
    return next;
  }
}


import { store } from '../store.js';
import { ThemeManager } from '../theme.js';
import { AuthManager } from '../auth.js';

export class Sidebar {
  static init() {
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        ThemeManager.toggle();
      });
    }

    // AI toggle in nav
    const aiNav = document.querySelector('[data-page="ai"]');
    if (aiNav) {
      aiNav.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = store.get('isAiPanelOpen');
        store.set('isAiPanelOpen', !isOpen);
      });
    }

    // Logout handling if needed
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        AuthManager.logout();
      });
    }
  }
}

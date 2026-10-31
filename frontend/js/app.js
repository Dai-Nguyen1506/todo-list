/**
 * Planify SPA Main Application Entry
 */

import { ThemeManager } from './theme.js';
import { Toast } from './components/toast.js';
import { AuthManager } from './auth.js';
import { Sidebar } from './components/sidebar.js';
import { router } from './router.js';
import { store } from './store.js';

import { loginPage } from './pages/login.js';
import { registerPage } from './pages/register.js';
import { calendarPage } from './pages/calendar.js';
import { todoPage } from './pages/todo.js';
import { settingsPage } from './pages/settings.js';
import { ChatPanel } from './ai/chat-panel.js';

class App {
  static async init() {
    console.log('🚀 Planify App Initializing...');

    // 1. Initialize Theme
    ThemeManager.init();

    // 2. Initialize Toast system
    Toast.init();

    // 3. Register Routes
    router.register('login', loginPage);
    router.register('register', registerPage);
    router.register('calendar', calendarPage);
    router.register('todo', todoPage);
    router.register('settings', settingsPage);

    // 4. Initialize UI Sidebar
    Sidebar.init();

    // 5. Update user badge in header
    store.on('user', (user) => {
      const nameEl = document.getElementById('user-display-name');
      const avatarEl = document.getElementById('user-avatar-initial');
      if (user) {
        if (nameEl) nameEl.textContent = user.nickname || user.email;
        if (avatarEl) avatarEl.textContent = (user.nickname || user.email || 'U')[0].toUpperCase();
      } else {
        if (nameEl) nameEl.textContent = 'Người dùng';
        if (avatarEl) avatarEl.textContent = 'U';
      }
    });

    const profileBadge = document.getElementById('user-profile-badge');
    if (profileBadge) {
      profileBadge.addEventListener('click', () => {
        window.location.hash = '#settings';
      });
    }

    // 6. Try to restore active user session
    if (AuthManager.isAuthenticated()) {
      await AuthManager.fetchCurrentUser();
    }

    // 7. Initialize AI Chat Panel
    ChatPanel.init();

    const aiPanel = document.getElementById('ai-chat-panel');
    const closeAiBtn = document.getElementById('btn-close-ai');
    if (closeAiBtn) {
      closeAiBtn.addEventListener('click', () => {
        store.set('isAiPanelOpen', false);
      });
    }

    store.on('isAiPanelOpen', (isOpen) => {
      if (aiPanel) {
        aiPanel.classList.toggle('hidden', !isOpen);
      }
    });

    // 8. Start SPA Router
    router.start();

    console.log('✅ Planify App Ready!');
  }
}

// Boot application when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});

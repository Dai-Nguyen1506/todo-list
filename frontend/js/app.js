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

    // 5. Try to restore active user session
    if (AuthManager.isAuthenticated()) {
      await AuthManager.fetchCurrentUser();
    }

    // 6. Listen for AI Panel toggle
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

    // 7. Start SPA Router
    router.start();

    console.log('✅ Planify App Ready!');
  }
}

// Boot application when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});

import { createElement } from '../utils/dom.js';
import { store } from '../store.js';
import { ThemeManager } from '../theme.js';
import { AuthManager } from '../auth.js';
import { Toast } from '../components/toast.js';

export const settingsPage = {
  container: null,

  async render(container) {
    this.container = container;
    container.innerHTML = '';

    const page = createElement('div', { className: 'settings-page' });
    const currentTheme = localStorage.getItem('theme') || 'light';
    const user = store.get('user') || {};

    // Appearance Section
    const themeSection = createElement('div', { className: 'settings-section' }, [
      createElement('h2', { className: 'settings-section-title', textContent: '🎨 Giao diện & Chủ đề' }),
      createElement('div', { className: 'theme-options-grid' }, [
        createElement('div', {
          className: `theme-card ${currentTheme === 'light' ? 'active' : ''}`,
          onclick: () => {
            ThemeManager.apply('light');
            store.set('theme', 'light');
            settingsPage.render(container);
          }
        }, [
          createElement('span', { style: { fontSize: '24px' }, textContent: '☀️' }),
          createElement('span', { style: { fontWeight: '600' }, textContent: 'Chủ đề Sáng (Light)' }),
          createElement('span', { style: { fontSize: '12px', color: 'var(--color-text-secondary)' }, textContent: 'Giao diện sáng sủa, độ tương phản cao' })
        ]),
        createElement('div', {
          className: `theme-card ${currentTheme === 'dark' ? 'active' : ''}`,
          onclick: () => {
            ThemeManager.apply('dark');
            store.set('theme', 'dark');
            settingsPage.render(container);
          }
        }, [
          createElement('span', { style: { fontSize: '24px' }, textContent: '🌙' }),
          createElement('span', { style: { fontWeight: '600' }, textContent: 'Chủ đề Tối (Dark)' }),
          createElement('span', { style: { fontSize: '12px', color: 'var(--color-text-secondary)' }, textContent: 'Dịu mắt khi làm việc ban đêm' })
        ]),
        createElement('div', {
          className: `theme-card ${currentTheme === 'system' ? 'active' : ''}`,
          onclick: () => {
            ThemeManager.apply('system');
            store.set('theme', 'system');
            settingsPage.render(container);
          }
        }, [
          createElement('span', { style: { fontSize: '24px' }, textContent: '💻' }),
          createElement('span', { style: { fontWeight: '600' }, textContent: 'Tự động theo hệ thống' }),
          createElement('span', { style: { fontSize: '12px', color: 'var(--color-text-secondary)' }, textContent: 'Đồng bộ theo chế độ của hệ điều hành' })
        ])
      ])
    ]);

    // Account Section
    const accountSection = createElement('div', { className: 'settings-section' }, [
      createElement('h2', { className: 'settings-section-title', textContent: '👤 Thông tin tài khoản' }),
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Email' }),
        createElement('input', {
          type: 'text',
          className: 'input',
          value: user.email || 'Chưa cập nhật',
          disabled: true
        })
      ]),
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Tên hiển thị' }),
        createElement('input', {
          type: 'text',
          className: 'input',
          value: user.nickname || 'Người dùng',
          disabled: true
        })
      ]),
      createElement('div', { style: { marginTop: '16px' } }, [
        createElement('button', {
          className: 'btn btn-danger',
          textContent: 'Đăng xuất tài khoản',
          onclick: () => {
            AuthManager.logout();
            Toast.info('Đã đăng xuất.');
          }
        })
      ])
    ]);

    page.appendChild(themeSection);
    page.appendChild(accountSection);
    container.appendChild(page);
  },

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }
};

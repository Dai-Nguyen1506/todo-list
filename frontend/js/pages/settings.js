import { createElement } from '../utils/dom.js';
import { store } from '../store.js';
import { ThemeManager } from '../theme.js';
import { AuthManager } from '../auth.js';
import { Toast } from '../components/toast.js';
import { api } from '../api.js';

export const settingsPage = {
  container: null,

  async render(container) {
    this.container = container;
    container.innerHTML = '';

    const page = createElement('div', { className: 'settings-page' });
    const currentTheme = ThemeManager.getSavedTheme();
    const user = store.get('user') || {};

    // 1. Appearance Section
    const themeSection = createElement('div', { className: 'settings-section' }, [
      createElement('h2', { className: 'settings-section-title', textContent: '🎨 Giao diện & Chủ đề' }),
      createElement('div', { className: 'theme-options-grid' }, [
        createElement('div', {
          className: `theme-card ${currentTheme === 'light' ? 'active' : ''}`,
          onclick: () => {
            ThemeManager.apply('light', true);
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
            ThemeManager.apply('dark', true);
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
            ThemeManager.apply('system', true);
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

    // 2. Profile Section
    const nicknameInput = createElement('input', {
      type: 'text',
      className: 'input',
      value: user.nickname || ''
    });

    const timezoneSelect = createElement('select', { className: 'select' }, [
      createElement('option', { value: 'Asia/Ho_Chi_Minh', textContent: 'Hà Nội, TP.HCM (GMT+7)', selected: user.timezone === 'Asia/Ho_Chi_Minh' }),
      createElement('option', { value: 'Asia/Tokyo', textContent: 'Tokyo (GMT+9)', selected: user.timezone === 'Asia/Tokyo' }),
      createElement('option', { value: 'UTC', textContent: 'Giờ phối hợp quốc tế (UTC)', selected: user.timezone === 'UTC' })
    ]);

    const saveProfileBtn = createElement('button', {
      className: 'btn btn-primary',
      textContent: 'Lưu thay đổi',
      onclick: async () => {
        try {
          saveProfileBtn.disabled = true;
          const updated = await api.put('/users/me', {
            nickname: nicknameInput.value.trim(),
            timezone: timezoneSelect.value
          });
          const updatedUser = updated?.data || updated;
          store.set('user', updatedUser);
          Toast.success('Cập nhật thông tin thành công!');
        } catch (err) {
          Toast.error(err.message || 'Lỗi cập nhật.');
        } finally {
          saveProfileBtn.disabled = false;
        }
      }
    });

    const accountSection = createElement('div', { className: 'settings-section' }, [
      createElement('h2', { className: 'settings-section-title', textContent: '👤 Thông tin cá nhân' }),
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Email' }),
        createElement('input', {
          type: 'text',
          className: 'input',
          value: user.email || '',
          disabled: true
        })
      ]),
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Tên hiển thị' }),
        nicknameInput
      ]),
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Múi giờ' }),
        timezoneSelect
      ]),
      createElement('div', { style: { marginTop: '8px' } }, [saveProfileBtn])
    ]);

    // 3. Security Section (Password Change)
    const currentPassInput = createElement('input', { type: 'password', className: 'input', placeholder: '••••••••' });
    const newPassInput = createElement('input', { type: 'password', className: 'input', placeholder: '••••••••' });
    const changePassBtn = createElement('button', {
      className: 'btn btn-secondary',
      textContent: 'Đổi mật khẩu',
      onclick: async () => {
        if (!currentPassInput.value || !newPassInput.value) {
          Toast.error('Vui lòng điền đủ mật khẩu cũ và mới.');
          return;
        }
        if (newPassInput.value.length < 6) {
          Toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.');
          return;
        }
        try {
          changePassBtn.disabled = true;
          await api.put('/users/me/password', {
            current_password: currentPassInput.value,
            new_password: newPassInput.value
          });
          Toast.success('Đổi mật khẩu thành công!');
          currentPassInput.value = '';
          newPassInput.value = '';
        } catch (err) {
          Toast.error(err.message || 'Mật khẩu cũ không chính xác.');
        } finally {
          changePassBtn.disabled = false;
        }
      }
    });

    const securitySection = createElement('div', { className: 'settings-section' }, [
      createElement('h2', { className: 'settings-section-title', textContent: '🔒 Bảo mật & Mật khẩu' }),
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Mật khẩu hiện tại' }),
        currentPassInput
      ]),
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Mật khẩu mới' }),
        newPassInput
      ]),
      createElement('div', { style: { marginTop: '8px' } }, [changePassBtn])
    ]);

    // 4. Logout Section
    const logoutSection = createElement('div', { className: 'settings-section' }, [
      createElement('h2', { className: 'settings-section-title', textContent: '🚪 Phiên làm việc' }),
      createElement('div', {}, [
        createElement('button', {
          className: 'btn btn-danger',
          textContent: 'Đăng xuất khỏi thiết bị này',
          onclick: () => {
            AuthManager.logout();
            Toast.info('Đã đăng xuất.');
          }
        })
      ])
    ]);

    page.appendChild(themeSection);
    page.appendChild(accountSection);
    page.appendChild(securitySection);
    page.appendChild(logoutSection);
    container.appendChild(page);
  },

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }
};

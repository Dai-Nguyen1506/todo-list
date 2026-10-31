import { createElement } from '../utils/dom.js';
import { AuthManager } from '../auth.js';
import { Toast } from '../components/toast.js';
import { isValidEmail } from '../utils/validator.js';

export const loginPage = {
  render(container) {
    container.innerHTML = '';

    const page = createElement('div', { className: 'auth-page' });
    const card = createElement('div', { className: 'auth-card' });

    // Logo & Header
    const logo = createElement('div', { className: 'auth-logo' }, [
      createElement('span', { className: 'auth-logo-icon', textContent: '📋' }),
      createElement('h1', { className: 'auth-logo-title', textContent: 'Planify' }),
      createElement('p', { className: 'auth-subtitle', textContent: 'Đăng nhập để quản lý thời gian và công việc' })
    ]);

    // Form
    const form = createElement('form', {
      className: 'auth-form',
      onsubmit: async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!isValidEmail(email)) {
          Toast.error('Vui lòng nhập địa chỉ email hợp lệ.');
          return;
        }
        if (!password) {
          Toast.error('Vui lòng nhập mật khẩu.');
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang đăng nhập...';

        try {
          await AuthManager.login(email, password);
          Toast.success('Đăng nhập thành công!');
          window.location.hash = '#calendar';
        } catch (err) {
          Toast.error(err.message || 'Đăng nhập thất bại.');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Đăng nhập';
        }
      }
    });

    const emailGroup = createElement('div', { className: 'form-group' });
    const emailLabel = createElement('label', { className: 'form-label', textContent: 'Email' });
    const emailInput = createElement('input', {
      type: 'email',
      className: 'input',
      placeholder: 'tenban@example.com',
      required: true,
      autocomplete: 'email'
    });
    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);

    const passGroup = createElement('div', { className: 'form-group' });
    const passLabel = createElement('label', { className: 'form-label', textContent: 'Mật khẩu' });
    const passwordInput = createElement('input', {
      type: 'password',
      className: 'input',
      placeholder: '••••••••',
      required: true,
      autocomplete: 'current-password'
    });
    passGroup.appendChild(passLabel);
    passGroup.appendChild(passwordInput);

    const submitBtn = createElement('button', {
      type: 'submit',
      className: 'btn btn-primary',
      textContent: 'Đăng nhập'
    });

    form.appendChild(emailGroup);
    form.appendChild(passGroup);
    form.appendChild(submitBtn);

    // Footer
    const footer = createElement('div', { className: 'auth-footer' }, [
      createElement('span', { textContent: 'Chưa có tài khoản? ' }),
      createElement('a', {
        className: 'auth-link',
        textContent: 'Đăng ký ngay',
        href: '#register'
      })
    ]);

    card.appendChild(logo);
    card.appendChild(form);
    card.appendChild(footer);
    page.appendChild(card);
    container.appendChild(page);
  },

  destroy() {}
};

import { createElement } from '../utils/dom.js';
import { AuthManager } from '../auth.js';
import { Toast } from '../components/toast.js';
import { isValidEmail, isValidPassword } from '../utils/validator.js';

export const registerPage = {
  render(container) {
    container.innerHTML = '';

    const page = createElement('div', { className: 'auth-page' });
    const card = createElement('div', { className: 'auth-card' });

    // Logo & Header
    const logo = createElement('div', { className: 'auth-logo' }, [
      createElement('span', { className: 'auth-logo-icon', textContent: '📋' }),
      createElement('h1', { className: 'auth-logo-title', textContent: 'Tạo tài khoản' }),
      createElement('p', { className: 'auth-subtitle', textContent: 'Bắt đầu lên kế hoạch và quản lý thời gian hiệu quả' })
    ]);

    // Form
    const form = createElement('form', {
      className: 'auth-form',
      onsubmit: async (e) => {
        e.preventDefault();
        const nickname = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!nickname) {
          Toast.error('Vui lòng nhập tên hiển thị.');
          return;
        }
        if (!isValidEmail(email)) {
          Toast.error('Email không hợp lệ.');
          return;
        }
        if (!isValidPassword(password, 6)) {
          Toast.error('Mật khẩu phải có ít nhất 6 ký tự.');
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang khởi tạo tài khoản...';

        try {
          await AuthManager.register(email, nickname, password);
          Toast.success('Đăng ký thành công! Đang chuyển hướng...');
          window.location.hash = '#calendar';
        } catch (err) {
          Toast.error(err.message || 'Đăng ký thất bại.');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Đăng ký';
        }
      }
    });

    // Nickname
    const nameGroup = createElement('div', { className: 'form-group' });
    const nameLabel = createElement('label', { className: 'form-label', textContent: 'Tên hiển thị' });
    const nameInput = createElement('input', {
      type: 'text',
      className: 'input',
      placeholder: 'Nguyễn Văn A',
      required: true
    });
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);

    // Email
    const emailGroup = createElement('div', { className: 'form-group' });
    const emailLabel = createElement('label', { className: 'form-label', textContent: 'Email' });
    const emailInput = createElement('input', {
      type: 'email',
      className: 'input',
      placeholder: 'tenban@example.com',
      required: true
    });
    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);

    // Password
    const passGroup = createElement('div', { className: 'form-group' });
    const passLabel = createElement('label', { className: 'form-label', textContent: 'Mật khẩu (tối thiểu 6 ký tự)' });
    const passwordInput = createElement('input', {
      type: 'password',
      className: 'input',
      placeholder: '••••••••',
      required: true
    });
    passGroup.appendChild(passLabel);
    passGroup.appendChild(passwordInput);

    const submitBtn = createElement('button', {
      type: 'submit',
      className: 'btn btn-primary',
      textContent: 'Đăng ký tài khoản'
    });

    form.appendChild(nameGroup);
    form.appendChild(emailGroup);
    form.appendChild(passGroup);
    form.appendChild(submitBtn);

    // Footer
    const footer = createElement('div', { className: 'auth-footer' }, [
      createElement('span', { textContent: 'Đã có tài khoản? ' }),
      createElement('a', {
        className: 'auth-link',
        textContent: 'Đăng nhập',
        href: '#login'
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


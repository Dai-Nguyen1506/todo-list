import { api } from './api.js';
import { store } from './store.js';
import { ThemeManager } from './theme.js';

export class AuthManager {
  static isAuthenticated() {
    return !!api.getToken();
  }

  static async login(email, password) {
    // OAuth2PasswordRequestForm requires application/x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('username', email.trim());
    formData.append('password', password);

    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.detail || 'Email hoặc mật khẩu không chính xác.');
    }

    if (data?.access_token) {
      api.setToken(data.access_token);
      await this.fetchCurrentUser();
    }
    return data;
  }

  static async register(email, nickname, password) {
    await api.post('/users/register', {
      email: email.trim(),
      nickname: nickname.trim(),
      password: password
    });
    // Automatically log in after registration
    return await this.login(email, password);
  }

  static async fetchCurrentUser() {
    if (!this.isAuthenticated()) return null;
    try {
      const response = await api.get('/users/me');
      const user = response?.data || response;
      store.set('user', user);
      
      const localTheme = localStorage.getItem('planify_theme') || localStorage.getItem('theme');
      if (localTheme) {
        ThemeManager.apply(localTheme, false);
        store.set('theme', localTheme);
        if (user?.theme_preference !== localTheme) {
          api.put('/users/me', { theme_preference: localTheme }).catch(() => {});
        }
      } else if (user?.theme_preference) {
        ThemeManager.apply(user.theme_preference, false);
        store.set('theme', user.theme_preference);
      }
      return user;
    } catch (err) {
      console.warn('Failed to fetch current user:', err);
      return null;
    }
  }

  static logout() {
    api.setToken(null);
    store.set('user', null);
    window.location.hash = '#login';
  }
}

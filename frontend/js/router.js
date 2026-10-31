import { AuthManager } from './auth.js';
import { store } from './store.js';

export class Router {
  constructor() {
    this.routes = {};
    this.currentController = null;
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  register(path, controller) {
    this.routes[path] = controller;
  }

  navigate(path) {
    window.location.hash = path.startsWith('#') ? path : `#${path}`;
  }

  async handleRoute() {
    const rawHash = window.location.hash.slice(1) || 'calendar';
    const [path, ...params] = rawHash.split('/');

    // Auth protection: public routes
    const publicRoutes = ['login', 'register'];
    const isPublic = publicRoutes.includes(path);
    const isAuthenticated = AuthManager.isAuthenticated();

    if (!isAuthenticated && !isPublic) {
      window.location.hash = '#login';
      return;
    }

    if (isAuthenticated && isPublic) {
      window.location.hash = '#calendar';
      return;
    }

    // Toggle auth vs app layout containers
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');

    if (isPublic) {
      if (authContainer) authContainer.classList.remove('hidden');
      if (appContainer) appContainer.classList.add('hidden');
    } else {
      if (authContainer) authContainer.classList.add('hidden');
      if (appContainer) appContainer.classList.remove('hidden');
    }

    // Teardown previous controller
    if (this.currentController && typeof this.currentController.destroy === 'function') {
      try {
        this.currentController.destroy();
      } catch (err) {
        console.error('Error destroying controller:', err);
      }
    }

    // Lookup controller
    const controller = this.routes[path] || this.routes['calendar'];
    if (controller) {
      this.currentController = controller;
      store.set('currentRoute', path);

      // Update sidebar nav active state
      document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.page === path);
      });

      const container = isPublic
        ? document.getElementById('auth-page')
        : document.getElementById('page-container');

      if (container && typeof controller.render === 'function') {
        await controller.render(container, params);
      }
    }
  }

  start() {
    this.handleRoute();
  }
}

export const router = new Router();


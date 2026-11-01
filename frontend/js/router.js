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
    const rawHash = window.location.hash.slice(1).trim();
    const isAuthenticated = AuthManager.isAuthenticated();

    // Default route determination:
    // If not authenticated, default to landing page
    // If authenticated, default to calendar
    let targetPath = rawHash || (isAuthenticated ? 'calendar' : 'landing');
    if (targetPath === 'home') targetPath = 'landing';

    const [path, ...params] = targetPath.split('/');

    // Handle special #ai pseudo-route by opening AI panel on calendar
    if (path === 'ai') {
      store.set('isAiPanelOpen', true);
      window.location.hash = '#calendar';
      return;
    }

    // Public routes (accessible without login)
    const publicRoutes = ['landing', 'login', 'register'];
    const isPublic = publicRoutes.includes(path);

    // 1. Unauthenticated user trying to access protected route
    if (!isAuthenticated && !isPublic) {
      sessionStorage.setItem('planify_redirect_after_login', path);
      window.location.hash = '#login';
      return;
    }

    // 2. Authenticated user visiting login/register -> redirect to saved or calendar
    if (isAuthenticated && (path === 'login' || path === 'register')) {
      const redirectPath = sessionStorage.getItem('planify_redirect_after_login') || 'calendar';
      sessionStorage.removeItem('planify_redirect_after_login');
      window.location.hash = `#${redirectPath}`;
      return;
    }

    // 3. Toggle containers visibility
    const landingContainer = document.getElementById('landing-container');
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');

    if (path === 'landing') {
      if (landingContainer) landingContainer.classList.remove('hidden');
      if (authContainer) authContainer.classList.add('hidden');
      if (appContainer) appContainer.classList.add('hidden');
    } else if (path === 'login' || path === 'register') {
      if (landingContainer) landingContainer.classList.add('hidden');
      if (authContainer) authContainer.classList.remove('hidden');
      if (appContainer) appContainer.classList.add('hidden');
    } else {
      if (landingContainer) landingContainer.classList.add('hidden');
      if (authContainer) authContainer.classList.add('hidden');
      if (appContainer) appContainer.classList.remove('hidden');
    }

    // 4. Teardown previous controller
    if (this.currentController && typeof this.currentController.destroy === 'function') {
      try {
        this.currentController.destroy();
      } catch (err) {
        console.error('Error destroying controller:', err);
      }
    }

    // 5. Lookup controller
    const controller = this.routes[path] || (isAuthenticated ? this.routes['calendar'] : this.routes['landing']);
    if (controller) {
      this.currentController = controller;
      store.set('currentRoute', path);

      // Update sidebar nav active state
      document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.page === path);
      });

      let container = document.getElementById('page-container');
      if (path === 'landing') {
        container = document.getElementById('landing-page');
      } else if (path === 'login' || path === 'register') {
        container = document.getElementById('auth-page');
      }

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

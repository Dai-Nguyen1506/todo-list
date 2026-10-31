import { createElement } from '../utils/dom.js';

export class ContextMenu {
  static activeMenu = null;

  static show({ x, y, items = [] }) {
    this.close();

    const menu = createElement('div', {
      className: 'dropdown-menu',
      style: {
        top: `${Math.min(y, window.innerHeight - 200)}px`,
        left: `${Math.min(x, window.innerWidth - 220)}px`,
        position: 'fixed'
      }
    });

    items.forEach(item => {
      if (item.divider) {
        menu.appendChild(createElement('div', { className: 'dropdown-divider' }));
        return;
      }

      const itemEl = createElement('div', {
        className: `dropdown-item ${item.danger ? 'danger' : ''}`,
        onclick: (e) => {
          e.stopPropagation();
          ContextMenu.close();
          if (typeof item.onClick === 'function') item.onClick();
        }
      }, [
        item.icon ? createElement('span', { className: 'dropdown-icon', textContent: item.icon }) : null,
        createElement('span', { textContent: item.label })
      ]);

      menu.appendChild(itemEl);
    });

    document.body.appendChild(menu);
    this.activeMenu = menu;

    const handleOutside = (e) => {
      if (!menu.contains(e.target)) {
        ContextMenu.close();
        document.removeEventListener('click', handleOutside);
        document.removeEventListener('contextmenu', handleOutside);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', handleOutside);
      document.addEventListener('contextmenu', handleOutside);
    }, 0);
  }

  static close() {
    if (this.activeMenu && this.activeMenu.parentNode) {
      this.activeMenu.parentNode.removeChild(this.activeMenu);
      this.activeMenu = null;
    }
  }
}

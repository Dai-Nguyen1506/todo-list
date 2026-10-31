import { createElement } from '../utils/dom.js';
import { store } from '../store.js';
import { formatVietnameseDate } from '../utils/date.js';

export const calendarPage = {
  container: null,

  async render(container) {
    this.container = container;
    container.innerHTML = '';

    const page = createElement('div', { className: 'calendar-page' });

    // Sidebar with mini calendar placeholder
    const sidebar = createElement('aside', { className: 'calendar-sidebar' }, [
      createElement('div', { className: 'mini-calendar-container', id: 'mini-calendar' }),
      createElement('div', { className: 'calendar-list-section', id: 'calendar-list' }, [
        createElement('h4', { style: { fontSize: '13px', fontWeight: '600', marginBottom: '8px' }, textContent: 'Lịch của tôi' }),
        createElement('div', { className: 'calendar-item-row' }, [
          createElement('span', { textContent: '☑ ' }),
          createElement('span', { textContent: 'Lịch mặc định' })
        ])
      ])
    ]);

    // Main calendar area
    const main = createElement('div', { className: 'calendar-main' });

    // Toolbar
    const toolbar = createElement('div', { className: 'calendar-toolbar' }, [
      createElement('div', { className: 'calendar-nav-group' }, [
        createElement('button', { className: 'btn btn-secondary', id: 'btn-cal-today', textContent: 'Hôm nay' }),
        createElement('button', { className: 'btn-icon', id: 'btn-cal-prev', innerHTML: '&#9664;' }),
        createElement('button', { className: 'btn-icon', id: 'btn-cal-next', innerHTML: '&#9654;' }),
        createElement('h2', { className: 'calendar-title', id: 'calendar-display-title', textContent: formatVietnameseDate(new Date()) })
      ]),
      createElement('div', { className: 'view-toggle-group' }, [
        createElement('button', { className: 'view-toggle-btn', 'data-view': 'day', textContent: 'Ngày' }),
        createElement('button', { className: 'view-toggle-btn active', 'data-view': 'week', textContent: 'Tuần' }),
        createElement('button', { className: 'view-toggle-btn', 'data-view': 'month', textContent: 'Tháng' })
      ])
    ]);

    // View Container
    const viewContainer = createElement('div', { className: 'calendar-view-container', id: 'calendar-view-body' }, [
      createElement('div', {
        style: { padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' },
        textContent: '📅 Đang kết nối mô-đun Lịch...'
      })
    ]);

    main.appendChild(toolbar);
    main.appendChild(viewContainer);
    page.appendChild(sidebar);
    page.appendChild(main);
    container.appendChild(page);
  },

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }
};


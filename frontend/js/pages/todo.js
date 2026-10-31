import { createElement } from '../utils/dom.js';
import { formatVietnameseDate } from '../utils/date.js';

export const todoPage = {
  container: null,

  async render(container) {
    this.container = container;
    container.innerHTML = '';

    const page = createElement('div', { className: 'todo-page' });

    // Sidebar: Smart lists & user lists
    const sidebar = createElement('aside', { className: 'todo-sidebar' }, [
      createElement('div', { className: 'todo-list-item active', 'data-list': 'my_day' }, [
        createElement('span', { textContent: '☀️' }),
        createElement('span', { textContent: 'My Day' }),
        createElement('span', { className: 'todo-list-badge', textContent: '0' })
      ]),
      createElement('div', { className: 'todo-list-item', 'data-list': 'important' }, [
        createElement('span', { textContent: '⭐' }),
        createElement('span', { textContent: 'Important' }),
        createElement('span', { className: 'todo-list-badge', textContent: '0' })
      ]),
      createElement('div', { className: 'todo-list-item', 'data-list': 'planned' }, [
        createElement('span', { textContent: '📅' }),
        createElement('span', { textContent: 'Planned' }),
        createElement('span', { className: 'todo-list-badge', textContent: '0' })
      ]),
      createElement('div', { className: 'todo-list-item', 'data-list': 'all' }, [
        createElement('span', { textContent: '📋' }),
        createElement('span', { textContent: 'All Tasks' }),
        createElement('span', { className: 'todo-list-badge', textContent: '0' })
      ]),
      createElement('div', { className: 'todo-divider' }),
      createElement('div', { className: 'todo-list-item', 'data-list': 'default' }, [
        createElement('span', { textContent: '📝' }),
        createElement('span', { textContent: 'Tasks' }),
        createElement('span', { className: 'todo-list-badge', textContent: '0' })
      ])
    ]);

    // Main tasks view
    const main = createElement('div', { className: 'todo-main' });

    // Header
    const header = createElement('div', { className: 'todo-header' }, [
      createElement('div', { className: 'todo-title-row' }, [
        createElement('span', { style: { fontSize: '28px' }, textContent: '☀️' }),
        createElement('div', {}, [
          createElement('h1', { className: 'todo-title', textContent: 'My Day' }),
          createElement('span', { className: 'todo-date-subtitle', textContent: formatVietnameseDate(new Date()) })
        ])
      ]),
      createElement('button', { className: 'btn btn-secondary', id: 'btn-suggestions', textContent: '💡 Gợi ý' })
    ]);

    // Add task bar
    const inputBar = createElement('div', { className: 'todo-input-bar' }, [
      createElement('span', { textContent: '➕' }),
      createElement('input', {
        type: 'text',
        className: 'todo-input',
        id: 'new-task-input',
        placeholder: 'Thêm một công việc cần làm...'
      })
    ]);

    // Task items list
    const itemsList = createElement('div', { className: 'todo-items-list', id: 'task-items-container' }, [
      createElement('div', {
        style: { padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' },
        textContent: '✅ Chưa có công việc nào trong danh sách này.'
      })
    ]);

    main.appendChild(header);
    main.appendChild(inputBar);
    main.appendChild(itemsList);

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


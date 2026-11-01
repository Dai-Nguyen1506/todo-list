import { createElement } from '../utils/dom.js';
import { api } from '../api.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { store } from '../store.js';

export class SmartListsSidebar {
  constructor({ container, activeListId = 'my_day', tasks = [], onSelectList = null, onListsChanged = null }) {
    this.container = container;
    this.activeListId = activeListId;
    this.tasks = tasks;
    this.onSelectList = onSelectList;
    this.onListsChanged = onListsChanged;
    this.taskLists = [];
  }

  update({ activeListId, tasks }) {
    if (activeListId !== undefined) this.activeListId = activeListId;
    if (tasks !== undefined) this.tasks = tasks;
    this.render();
  }

  async fetchLists() {
    try {
      this.taskLists = await api.get('/task-lists');
      store.set('taskLists', this.taskLists);
    } catch (err) {
      console.error('Failed to load task lists', err);
    }
  }

  async render() {
    if (this.taskLists.length === 0) {
      await this.fetchLists();
    }

    this.container.innerHTML = '';

    const sidebar = createElement('div', { className: 'flex flex-col h-full' });

    // Calculate badge counts
    const myDayCount = this.tasks.filter(t => !t.is_completed && t.is_in_my_day).length;
    const importantCount = this.tasks.filter(t => !t.is_completed && t.is_important).length;
    const plannedCount = this.tasks.filter(t => !t.is_completed && !!t.due_date).length;
    const allCount = this.tasks.filter(t => !t.is_completed).length;

    // 1. Smart lists section
    const smartLists = [
      { id: 'my_day', icon: '☀️', name: 'My Day', count: myDayCount },
      { id: 'important', icon: '⭐', name: 'Important', count: importantCount },
      { id: 'planned', icon: '📅', name: 'Planned', count: plannedCount },
      { id: 'all', icon: '📋', name: 'All Tasks', count: allCount }
    ];

    const smartSection = createElement('div', { className: 'flex flex-col gap-xs' });
    smartLists.forEach(item => {
      const isActive = this.activeListId === item.id;
      const el = createElement('div', {
        className: `todo-list-item ${isActive ? 'active' : ''}`,
        onclick: () => {
          this.activeListId = item.id;
          this.render();
          if (this.onSelectList) this.onSelectList(item.id, item.name, item.icon);
        }
      }, [
        createElement('span', { textContent: item.icon }),
        createElement('span', { className: 'flex-1 truncate', textContent: item.name }),
        item.count > 0 ? createElement('span', { className: 'todo-list-badge', textContent: item.count }) : null
      ]);
      smartSection.appendChild(el);
    });

    // Divider
    const divider = createElement('div', { className: 'todo-divider' });

    // 2. Custom lists section
    const customSection = createElement('div', {
      className: 'flex flex-col gap-xs flex-1 overflow-y-auto'
    });

    this.taskLists.forEach(l => {
      const isActive = String(this.activeListId) === String(l.id);
      const count = this.tasks.filter(t => !t.is_completed && t.list_id === l.id).length;

      const el = createElement('div', {
        className: `todo-list-item ${isActive ? 'active' : ''}`,
        onclick: (e) => {
          if (e.target.closest('.list-action-btn')) return;
          this.activeListId = l.id;
          this.render();
          if (this.onSelectList) this.onSelectList(l.id, l.name, l.icon || '📝', l);
        }
      }, [
        createElement('span', { textContent: l.icon || '📝' }),
        createElement('span', { className: 'flex-1 truncate', textContent: l.name }),
        count > 0 ? createElement('span', { className: 'todo-list-badge', textContent: count }) : null,
        !l.is_default ? createElement('button', {
          className: 'list-action-btn btn-icon',
          style: { width: '20px', height: '20px', fontSize: '11px', opacity: 0.6 },
          title: 'Tùy chọn danh sách',
          textContent: '⋮',
          onclick: (e) => {
            e.stopPropagation();
            this.showListOptionsModal(l);
          }
        }) : null
      ]);

      customSection.appendChild(el);
    });

    // 3. Add list button
    const addListBtn = createElement('button', {
      className: 'btn btn-secondary',
      style: { marginTop: 'auto', width: '100%', justifyContent: 'flex-start' },
      textContent: '➕ Danh sách mới',
      onclick: () => this.showCreateListModal()
    });

    sidebar.appendChild(smartSection);
    sidebar.appendChild(divider);
    sidebar.appendChild(customSection);
    sidebar.appendChild(addListBtn);

    this.container.appendChild(sidebar);
  }

  showCreateListModal() {
    let selectedIcon = '📝';
    let selectedColor = '#4285F4';

    const icons = ['📝', '🛒', '💼', '🏠', '📚', '🎯', '💡', '🎨', '✈️', '🏋️'];
    const colors = ['#4285F4', '#0B8043', '#D93025', '#F4B400', '#8E24AA', '#0097A7', '#E67C73', '#795548'];

    const content = createElement('div', { className: 'flex flex-col gap-md' }, [
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Tên danh sách' }),
        createElement('input', {
          type: 'text',
          id: 'new-list-name-input',
          className: 'input',
          placeholder: 'Ví dụ: Mua sắm, Dự án Web...'
        })
      ]),
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Biểu tượng (Icon)' }),
        createElement('div', { className: 'flex gap-sm flex-wrap' }, icons.map(ic => {
          const btn = createElement('button', {
            className: `btn btn-secondary ${ic === selectedIcon ? 'active' : ''}`,
            style: { fontSize: '18px', padding: '6px 12px' },
            textContent: ic,
            onclick: () => {
              selectedIcon = ic;
              content.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
            }
          });
          btn.classList.add('icon-btn');
          return btn;
        }))
      ]),
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Màu sắc' }),
        createElement('div', { className: 'flex gap-sm flex-wrap' }, colors.map(c => {
          const dot = createElement('div', {
            className: 'color-option',
            style: {
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: c,
              cursor: 'pointer',
              border: c === selectedColor ? '3px solid var(--color-text-primary)' : '2px solid transparent'
            },
            onclick: () => {
              selectedColor = c;
              content.querySelectorAll('.color-option').forEach(d => d.style.borderColor = 'transparent');
              dot.style.borderColor = 'var(--color-text-primary)';
            }
          });
          return dot;
        }))
      ])
    ]);

    Modal.open({
      title: 'Tạo danh sách mới',
      content,
      confirmText: 'Tạo danh sách',
      onConfirm: async () => {
        const nameInput = content.querySelector('#new-list-name-input');
        const name = nameInput.value.trim();
        if (!name) {
          Toast.error('Vui lòng nhập tên danh sách');
          return false;
        }

        try {
          const newList = await api.post('/task-lists', {
            name,
            icon: selectedIcon,
            color: selectedColor
          });
          this.taskLists.push(newList);
          store.set('taskLists', this.taskLists);
          this.activeListId = newList.id;
          this.render();
          if (this.onSelectList) this.onSelectList(newList.id, newList.name, newList.icon, newList);
          if (this.onListsChanged) this.onListsChanged();
          Toast.success(`Đã tạo danh sách "${name}"`);
          return true;
        } catch (err) {
          Toast.error(err.message || 'Lỗi khi tạo danh sách');
          return false;
        }
      }
    });
  }

  showListOptionsModal(list) {
    const content = createElement('div', { className: 'flex flex-col gap-md' }, [
      createElement('button', {
        className: 'btn btn-secondary',
        style: { justifyContent: 'flex-start' },
        textContent: '✏️ Đổi tên & icon',
        onclick: () => {
          Modal.close();
          this.showEditListModal(list);
        }
      }),
      createElement('button', {
        className: 'btn btn-danger',
        style: { justifyContent: 'flex-start' },
        textContent: '🗑️ Xóa danh sách này',
        onclick: async () => {
          if (confirm(`Bạn có chắc muốn xóa danh sách "${list.name}"? Các công việc bên trong sẽ bị xóa.`)) {
            try {
              await api.delete(`/task-lists/${list.id}`);
              this.taskLists = this.taskLists.filter(l => l.id !== list.id);
              store.set('taskLists', this.taskLists);
              this.activeListId = 'my_day';
              this.render();
              if (this.onSelectList) this.onSelectList('my_day', 'My Day', '☀️');
              if (this.onListsChanged) this.onListsChanged();
              Modal.close();
              Toast.success('Đã xóa danh sách');
            } catch (err) {
              Toast.error(err.message || 'Lỗi khi xóa danh sách');
            }
          }
        }
      })
    ]);

    Modal.open({
      title: `Tùy chọn: ${list.name}`,
      content,
      confirmText: 'Đóng'
    });
  }

  showEditListModal(list) {
    let selectedIcon = list.icon || '📝';
    let selectedColor = list.color || '#4285F4';

    const icons = ['📝', '🛒', '💼', '🏠', '📚', '🎯', '💡', '🎨', '✈️', '🏋️'];
    const colors = ['#4285F4', '#0B8043', '#D93025', '#F4B400', '#8E24AA', '#0097A7', '#E67C73', '#795548'];

    const content = createElement('div', { className: 'flex flex-col gap-md' }, [
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Tên danh sách' }),
        createElement('input', {
          type: 'text',
          id: 'edit-list-name-input',
          className: 'input',
          value: list.name
        })
      ]),
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Biểu tượng (Icon)' }),
        createElement('div', { className: 'flex gap-sm flex-wrap' }, icons.map(ic => {
          const btn = createElement('button', {
            className: `btn btn-secondary ${ic === selectedIcon ? 'active' : ''}`,
            style: { fontSize: '18px', padding: '6px 12px' },
            textContent: ic,
            onclick: () => {
              selectedIcon = ic;
              content.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
            }
          });
          btn.classList.add('icon-btn');
          return btn;
        }))
      ]),
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Màu sắc' }),
        createElement('div', { className: 'flex gap-sm flex-wrap' }, colors.map(c => {
          const dot = createElement('div', {
            className: 'color-option',
            style: {
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: c,
              cursor: 'pointer',
              border: c === selectedColor ? '3px solid var(--color-text-primary)' : '2px solid transparent'
            },
            onclick: () => {
              selectedColor = c;
              content.querySelectorAll('.color-option').forEach(d => d.style.borderColor = 'transparent');
              dot.style.borderColor = 'var(--color-text-primary)';
            }
          });
          return dot;
        }))
      ])
    ]);

    Modal.open({
      title: 'Chỉnh sửa danh sách',
      content,
      confirmText: 'Lưu thay đổi',
      onConfirm: async () => {
        const nameInput = content.querySelector('#edit-list-name-input');
        const name = nameInput.value.trim();
        if (!name) {
          Toast.error('Vui lòng nhập tên danh sách');
          return false;
        }

        try {
          const updated = await api.put(`/task-lists/${list.id}`, {
            name,
            icon: selectedIcon,
            color: selectedColor
          });
          const idx = this.taskLists.findIndex(l => l.id === list.id);
          if (idx !== -1) this.taskLists[idx] = updated;
          store.set('taskLists', this.taskLists);
          this.render();
          if (this.onSelectList && this.activeListId === list.id) {
            this.onSelectList(updated.id, updated.name, updated.icon, updated);
          }
          if (this.onListsChanged) this.onListsChanged();
          Toast.success('Đã cập nhật danh sách');
          return true;
        } catch (err) {
          Toast.error(err.message || 'Lỗi khi cập nhật danh sách');
          return false;
        }
      }
    });
  }
}


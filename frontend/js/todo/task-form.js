import { createElement } from '../utils/dom.js';
import { api } from '../api.js';
import { Toast } from '../components/toast.js';
import { formatDate } from '../utils/date.js';

export class TaskForm {
  constructor({ container, listId = null, isMyDay = false, onCreated = null }) {
    this.container = container;
    this.listId = listId;
    this.isMyDay = isMyDay;
    this.onCreated = onCreated;

    this.dueDate = null;
    this.isImportant = false;
    this.recurrenceRule = null;
    this.reminderAt = null;

    this.render();
  }

  setListContext(listId, isMyDay = false) {
    this.listId = listId;
    this.isMyDay = isMyDay;
  }

  render() {
    this.container.innerHTML = '';

    const form = createElement('div', { className: 'todo-input-bar-container' });

    // Main input line
    const inputRow = createElement('div', { className: 'todo-input-bar' });
    const addIcon = createElement('span', { style: { color: 'var(--color-accent)', fontWeight: 'bold' }, textContent: '➕' });

    const input = createElement('input', {
      type: 'text',
      className: 'todo-input',
      placeholder: 'Thêm một công việc cần làm... (Nhấn Enter để lưu)',
      onkeydown: (e) => {
        if (e.key === 'Enter') {
          this.submit(input);
        }
      }
    });

    const submitBtn = createElement('button', {
      className: 'btn btn-primary btn-sm',
      textContent: 'Thêm',
      onclick: () => this.submit(input)
    });

    inputRow.appendChild(addIcon);
    inputRow.appendChild(input);
    inputRow.appendChild(submitBtn);

    // Quick action toolbar
    const toolbar = createElement('div', {
      className: 'flex items-center gap-sm flex-wrap',
      style: { padding: '4px 8px 8px 8px', fontSize: '12px' }
    });

    // 1. Due date quick button
    const dueBtn = createElement('button', {
      className: `btn btn-secondary btn-sm ${this.dueDate ? 'active' : ''}`,
      title: 'Đặt ngày hạn',
      textContent: this.dueDate ? `📅 ${this.dueDate}` : '📅 Hạn chót',
      onclick: () => {
        const todayStr = formatDate(new Date(), 'YYYY-MM-DD');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = formatDate(tomorrow, 'YYYY-MM-DD');

        if (!this.dueDate) {
          this.dueDate = todayStr;
        } else if (this.dueDate === todayStr) {
          this.dueDate = tomorrowStr;
        } else {
          this.dueDate = null;
        }
        this.render();
      }
    });

    // 2. Recurrence button
    const recurBtn = createElement('button', {
      className: `btn btn-secondary btn-sm ${this.recurrenceRule ? 'active' : ''}`,
      title: 'Lặp lại',
      textContent: this.recurrenceRule ? `🔄 ${this.recurrenceRule === 'FREQ=DAILY' ? 'Hàng ngày' : 'Hàng tuần'}` : '🔄 Lặp lại',
      onclick: () => {
        if (!this.recurrenceRule) {
          this.recurrenceRule = 'FREQ=DAILY';
        } else if (this.recurrenceRule === 'FREQ=DAILY') {
          this.recurrenceRule = 'FREQ=WEEKLY';
        } else {
          this.recurrenceRule = null;
        }
        this.render();
      }
    });

    // 3. Star / Important toggle
    const starBtn = createElement('button', {
      className: `btn btn-secondary btn-sm ${this.isImportant ? 'active' : ''}`,
      title: 'Đánh dấu quan trọng',
      innerHTML: this.isImportant ? '&#9733; Quan trọng' : '&#9734; Quan trọng',
      onclick: () => {
        this.isImportant = !this.isImportant;
        this.render();
      }
    });

    toolbar.appendChild(dueBtn);
    toolbar.appendChild(recurBtn);
    toolbar.appendChild(starBtn);

    form.appendChild(inputRow);
    form.appendChild(toolbar);

    this.container.appendChild(form);
    this.input = input;
  }

  async submit(inputEl) {
    const title = inputEl.value.trim();
    if (!title) return;

    try {
      const payload = {
        title,
        list_id: this.listId || undefined,
        due_date: this.dueDate || undefined,
        is_important: this.isImportant,
        is_in_my_day: this.isMyDay,
        recurrence_rule: this.recurrenceRule || undefined
      };

      const newTask = await api.post('/tasks', payload);
      inputEl.value = '';
      this.dueDate = null;
      this.isImportant = false;
      this.recurrenceRule = null;
      this.render();

      document.dispatchEvent(new CustomEvent('task-changed', {
        detail: { action: 'create', task: newTask }
      }));

      Toast.success('Đã thêm công việc');
      if (this.onCreated) this.onCreated(newTask);
    } catch (err) {
      Toast.error(err.message || 'Lỗi khi thêm công việc');
    }
  }
}

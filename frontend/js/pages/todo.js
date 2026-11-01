import { createElement } from '../utils/dom.js';
import { api } from '../api.js';
import { Toast } from '../components/toast.js';
import { formatVietnameseDate } from '../utils/date.js';
import { SmartListsSidebar } from '../todo/smart-lists.js';
import { TaskListView } from '../todo/task-list-view.js';
import { TaskForm } from '../todo/task-form.js';
import { TaskDetail } from '../todo/task-detail.js';
import { MyDaySuggestions } from '../todo/suggestions.js';
import { Dropdown } from '../components/dropdown.js';

export const todoPage = {
  container: null,
  tasks: [],
  activeListId: 'my_day',
  activeListName: 'My Day',
  activeListIcon: '☀️',
  activeTask: null,
  sortBy: 'default',
  hideCompleted: false,

  sidebarComponent: null,
  taskListComponent: null,
  taskFormComponent: null,
  taskDetailComponent: null,

  async render(container) {
    this.container = container;
    container.innerHTML = '';

    const page = createElement('div', { className: 'todo-page' });

    // 1. Sidebar Container
    const sidebarEl = createElement('aside', { className: 'todo-sidebar' });

    // 2. Main Content Container
    const mainEl = createElement('div', { className: 'todo-main flex-1 flex flex-col overflow-hidden' });

    // Header
    const headerEl = createElement('div', {
      className: 'todo-header',
      id: 'todo-page-header',
      dataset: { listTheme: String(this.activeListId) }
    });
    const titleRow = createElement('div', { className: 'todo-title-row' }, [
      createElement('span', { id: 'todo-header-icon', style: { fontSize: '28px' }, textContent: this.activeListIcon }),
      createElement('div', {}, [
        createElement('h1', { className: 'todo-title', id: 'todo-header-title', textContent: this.activeListName }),
        createElement('span', { className: 'todo-date-subtitle', id: 'todo-header-subtitle', textContent: formatVietnameseDate(new Date()) })
      ])
    ]);

    const headerActions = createElement('div', { className: 'flex items-center gap-sm' });

    // Suggestions button (visible in My Day)
    const suggestionsBtn = createElement('button', {
      className: 'btn btn-secondary btn-sm',
      id: 'btn-suggestions',
      textContent: '💡 Gợi ý',
      style: { display: this.activeListId === 'my_day' ? 'inline-flex' : 'none' },
      onclick: () => this.showSuggestions()
    });

    // Sort Dropdown button
    const sortBtn = createElement('button', {
      className: 'btn btn-secondary btn-sm',
      id: 'btn-sort-tasks',
      textContent: '⇅ Sắp xếp',
      onclick: (e) => this.showSortDropdown(e)
    });

    headerActions.appendChild(suggestionsBtn);
    headerActions.appendChild(sortBtn);

    headerEl.appendChild(titleRow);
    headerEl.appendChild(headerActions);

    // Task Form Input Bar Container
    const formContainer = createElement('div');

    // Task Items List Container
    const listContainer = createElement('div', { className: 'flex-1 overflow-hidden flex flex-col' });

    mainEl.appendChild(headerEl);
    mainEl.appendChild(formContainer);
    mainEl.appendChild(listContainer);

    // 3. Task Detail Panel Container
    const detailEl = createElement('div', { className: 'task-detail-container', style: { display: 'none' } });

    page.appendChild(sidebarEl);
    page.appendChild(mainEl);
    page.appendChild(detailEl);
    container.appendChild(page);

    // Initialize sub-components
    this.sidebarComponent = new SmartListsSidebar({
      container: sidebarEl,
      activeListId: this.activeListId,
      tasks: this.tasks,
      onSelectList: (id, name, icon) => this.switchList(id, name, icon),
      onListsChanged: () => this.fetchTasks()
    });

    this.taskListComponent = new TaskListView({
      container: listContainer,
      tasks: this.tasks,
      activeListId: this.activeListId,
      sortBy: this.sortBy,
      hideCompleted: this.hideCompleted,
      onSelectTask: (task) => this.selectTask(task),
      onToggleComplete: (task, isCompleted) => this.toggleComplete(task, isCompleted),
      onToggleImportant: (task, isImportant) => this.toggleImportant(task, isImportant),
      onReorderTasks: (srcId, targetId) => this.reorderTasks(srcId, targetId)
    });

    this.taskFormComponent = new TaskForm({
      container: formContainer,
      listId: typeof this.activeListId === 'number' ? this.activeListId : null,
      isMyDay: this.activeListId === 'my_day',
      onCreated: () => this.fetchTasks()
    });

    this.taskDetailComponent = new TaskDetail(detailEl, {
      onUpdate: () => this.fetchTasks(),
      onClose: () => this.closeDetail()
    });

    // Event listeners
    this.setupShortcuts();
    this.dataChangedListener = () => this.fetchTasks();
    window.addEventListener('planify:data-changed', this.dataChangedListener);
    document.addEventListener('task-changed', this.dataChangedListener);

    // Initial data fetch
    await this.fetchTasks();
  },

  async fetchTasks() {
    try {
      this.tasks = await api.get('/tasks');
      this.updateComponents();
      if (this.activeTask) {
        const updatedActive = this.tasks.find(t => t.id === this.activeTask.id);
        if (updatedActive) {
          this.activeTask = updatedActive;
          this.taskDetailComponent.show(updatedActive);
        } else {
          this.closeDetail();
        }
      }
    } catch (err) {
      console.error('Failed to load tasks', err);
    }
  },

  updateComponents() {
    this.sidebarComponent.update({
      activeListId: this.activeListId,
      tasks: this.tasks
    });

    this.taskListComponent.setProps({
      tasks: this.tasks,
      activeListId: this.activeListId,
      sortBy: this.sortBy,
      hideCompleted: this.hideCompleted
    });

    this.taskFormComponent.setListContext(
      typeof this.activeListId === 'number' ? this.activeListId : null,
      this.activeListId === 'my_day'
    );
  },

  switchList(id, name, icon) {
    this.activeListId = id;
    this.activeListName = name;
    this.activeListIcon = icon;

    const iconEl = document.getElementById('todo-header-icon');
    const titleEl = document.getElementById('todo-header-title');
    const subEl = document.getElementById('todo-header-subtitle');
    const sugBtn = document.getElementById('btn-suggestions');
    const headerEl = document.getElementById('todo-page-header');

    if (headerEl) {
      headerEl.dataset.listTheme = String(id);
    }

    if (iconEl) iconEl.textContent = icon;
    if (titleEl) titleEl.textContent = name;
    if (subEl) {
      subEl.textContent = id === 'my_day' ? formatVietnameseDate(new Date()) : '';
    }
    if (sugBtn) {
      sugBtn.style.display = id === 'my_day' ? 'inline-flex' : 'none';
    }

    this.updateComponents();
  },

  selectTask(task) {
    this.activeTask = task;
    const detailContainer = this.container.querySelector('.task-detail-container');
    if (detailContainer) {
      detailContainer.style.display = 'block';
    }
    this.taskDetailComponent.show(task);
  },

  closeDetail() {
    this.activeTask = null;
    const detailContainer = this.container?.querySelector('.task-detail-container');
    if (detailContainer) {
      detailContainer.style.display = 'none';
    }
    this.taskDetailComponent.hide();
  },

  async toggleComplete(task, isCompleted) {
    try {
      const updated = await api.patch(`/tasks/${task.id}/complete`, { is_completed: isCompleted });
      task.is_completed = isCompleted;
      window.dispatchEvent(new CustomEvent('planify:data-changed', {
        detail: { source: 'todo', action: 'complete', type: 'task', id: task.id, is_completed: isCompleted }
      }));
      document.dispatchEvent(new CustomEvent('task-changed', {
        detail: { action: 'update', task: updated }
      }));
      await this.fetchTasks();
    } catch (err) {
      Toast.error('Không thể cập nhật trạng thái');
    }
  },

  async toggleImportant(task, isImportant) {
    try {
      const updated = await api.patch(`/tasks/${task.id}/important`, { is_important: isImportant });
      task.is_important = isImportant;
      window.dispatchEvent(new CustomEvent('planify:data-changed', {
        detail: { source: 'todo', action: 'important', type: 'task', id: task.id, is_important: isImportant }
      }));
      document.dispatchEvent(new CustomEvent('task-changed', {
        detail: { action: 'update', task: updated }
      }));
      this.updateComponents();
    } catch (err) {
      Toast.error('Không thể cập nhật quan trọng');
    }
  },

  async reorderTasks(sourceId, targetId) {
    const srcIdx = this.tasks.findIndex(t => t.id === sourceId);
    const trgIdx = this.tasks.findIndex(t => t.id === targetId);
    if (srcIdx !== -1 && trgIdx !== -1) {
      const [moved] = this.tasks.splice(srcIdx, 1);
      this.tasks.splice(trgIdx, 0, moved);

      // Reassign sequential positions to preserve this custom manual ordering
      this.tasks.forEach((t, idx) => {
        t.position = idx;
      });
      this.sortBy = 'default';
      this.updateComponents();

      try {
        const items = this.tasks.map((t, idx) => ({ id: t.id, position: idx }));
        await api.put('/tasks/reorder', { items });
        window.dispatchEvent(new CustomEvent('planify:data-changed', {
          detail: { source: 'todo', action: 'reorder', type: 'task' }
        }));
      } catch (err) {
        console.error('Failed to persist task reorder', err);
        Toast.error('Không thể lưu thứ tự công việc');
      }
    }
  },

  showSuggestions() {
    const suggestions = new MyDaySuggestions({
      tasks: this.tasks,
      onAdd: () => this.fetchTasks()
    });
    suggestions.show();
  },

  showSortDropdown(e) {
    const items = [
      { label: 'Mặc định (Thủ công)', onClick: () => { this.sortBy = 'default'; this.updateComponents(); } },
      { label: '⭐ Quan trọng trước', onClick: () => { this.sortBy = 'important'; this.updateComponents(); } },
      { label: '📅 Ngày hạn chót', onClick: () => { this.sortBy = 'due_date'; this.updateComponents(); } },
      { label: '🔤 Tên (A-Z)', onClick: () => { this.sortBy = 'title'; this.updateComponents(); } },
      { label: '🕒 Ngày tạo', onClick: () => { this.sortBy = 'created_at'; this.updateComponents(); } }
    ];

    Dropdown.show({
      triggerEl: e.currentTarget,
      anchorEl: e.currentTarget,
      items
    });
  },

  setupShortcuts() {
    this.keyHandler = (e) => {
      // Ignore if typing inside input, textarea, or contentEditable
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) {
        return;
      }

      if (e.key === 'Escape') {
        if (this.activeTask) {
          this.closeDetail();
        }
      } else if (e.key === ' ' && this.activeTask) {
        e.preventDefault();
        this.toggleComplete(this.activeTask, !this.activeTask.is_completed);
      } else if ((e.key === 's' || e.key === 'S') && this.activeTask) {
        e.preventDefault();
        this.toggleImportant(this.activeTask, !this.activeTask.is_important);
      } else if (e.key === 'Delete' && this.activeTask) {
        e.preventDefault();
        const t = this.activeTask;
        if (confirm(`Bạn có chắc muốn xóa "${t.title}"?`)) {
          api.delete(`/tasks/${t.id}`).then(() => {
            Toast.success('Đã xóa công việc');
            this.closeDetail();
            this.fetchTasks();
          });
        }
      }
    };

    document.addEventListener('keydown', this.keyHandler);
  },

  destroy() {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
    }
    if (this.dataChangedListener) {
      window.removeEventListener('planify:data-changed', this.dataChangedListener);
      document.removeEventListener('task-changed', this.dataChangedListener);
      this.dataChangedListener = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }
};

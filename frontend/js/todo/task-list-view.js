import { createElement } from '../utils/dom.js';
import { TaskItem } from './task-item.js';
import { isToday, formatDate } from '../utils/date.js';
import { store } from '../store.js';

export class TaskListView {
  constructor({
    container,
    tasks = [],
    activeListId = 'my_day',
    sortBy = 'default',
    hideCompleted = false,
    onSelectTask = null,
    onToggleComplete = null,
    onToggleImportant = null,
    onReorderTasks = null
  }) {
    this.container = container;
    this.tasks = tasks;
    this.activeListId = activeListId;
    this.sortBy = sortBy;
    this.hideCompleted = hideCompleted;
    this.onSelectTask = onSelectTask;
    this.onToggleComplete = onToggleComplete;
    this.onToggleImportant = onToggleImportant;
    this.onReorderTasks = onReorderTasks;

    this.isCompletedCollapsed = true;
  }

  setProps({ tasks, activeListId, sortBy, hideCompleted }) {
    if (tasks !== undefined) this.tasks = tasks;
    if (activeListId !== undefined) this.activeListId = activeListId;
    if (sortBy !== undefined) this.sortBy = sortBy;
    if (hideCompleted !== undefined) this.hideCompleted = hideCompleted;
    this.render();
  }

  filterTasks() {
    let filtered = [...this.tasks];

    if (this.activeListId === 'my_day') {
      filtered = filtered.filter(t => t.is_in_my_day);
    } else if (this.activeListId === 'important') {
      filtered = filtered.filter(t => t.is_important);
    } else if (this.activeListId === 'planned') {
      filtered = filtered.filter(t => !!t.due_date);
    } else if (this.activeListId === 'all') {
      // all tasks
    } else {
      // numeric custom list ID
      const targetListId = parseInt(this.activeListId, 10);
      filtered = filtered.filter(t => t.list_id === targetListId);
    }

    return filtered;
  }

  sortTasks(list) {
    const sorted = [...list];
    switch (this.sortBy) {
      case 'important':
        sorted.sort((a, b) => (b.is_important ? 1 : 0) - (a.is_important ? 1 : 0));
        break;
      case 'due_date':
        sorted.sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return a.due_date.localeCompare(b.due_date);
        });
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'created_at':
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      default:
        // By position or default ID order
        sorted.sort((a, b) => (a.position || 0) - (b.position || 0));
        break;
    }
    return sorted;
  }

  render() {
    this.container.innerHTML = '';

    const allFiltered = this.filterTasks();
    const activeTasks = this.sortTasks(allFiltered.filter(t => !t.is_completed));
    const completedTasks = this.sortTasks(allFiltered.filter(t => t.is_completed));

    const listMap = (store.get('taskLists') || []).reduce((acc, l) => {
      acc[l.id] = l.name;
      return acc;
    }, {});

    const wrapper = createElement('div', {
      className: 'flex-1 overflow-y-auto flex flex-col gap-md',
      style: { paddingRight: '4px' }
    });

    // 1. Render Active Tasks
    if (this.activeListId === 'planned') {
      this.renderPlannedGroups(wrapper, activeTasks, listMap);
    } else {
      if (activeTasks.length === 0 && completedTasks.length === 0) {
        wrapper.appendChild(createElement('div', {
          style: { padding: '48px 16px', textAlign: 'center', color: 'var(--color-text-secondary)' },
          textContent: '✅ Chưa có công việc nào trong danh sách này.'
        }));
      } else {
        const activeContainer = createElement('div', { className: 'flex flex-col gap-xs' });
        activeTasks.forEach(task => {
          const item = TaskItem.create({
            task,
            listName: this.activeListId === 'all' ? listMap[task.list_id] : null,
            onToggleComplete: this.onToggleComplete,
            onToggleImportant: this.onToggleImportant,
            onSelect: this.onSelectTask,
            onReorder: this.onReorderTasks
          });
          activeContainer.appendChild(item);
        });
        wrapper.appendChild(activeContainer);
      }
    }

    // 2. Render Completed Section (if any & not hidden)
    if (!this.hideCompleted && completedTasks.length > 0) {
      const completedSection = createElement('div', {
        className: 'flex flex-col gap-xs',
        style: { marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border-light)' }
      });

      const headerBtn = createElement('button', {
        className: 'flex items-center gap-xs font-semibold',
        style: {
          background: 'none',
          border: 'none',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          padding: '4px 0',
          fontSize: '13px'
        },
        onclick: () => {
          this.isCompletedCollapsed = !this.isCompletedCollapsed;
          this.render();
        }
      }, [
        createElement('span', { textContent: this.isCompletedCollapsed ? '▶' : '▼' }),
        createElement('span', { textContent: `Đã hoàn thành (${completedTasks.length})` })
      ]);

      completedSection.appendChild(headerBtn);

      if (!this.isCompletedCollapsed) {
        const completedList = createElement('div', { className: 'flex flex-col gap-xs' });
        completedTasks.forEach(task => {
          const item = TaskItem.create({
            task,
            listName: this.activeListId === 'all' ? listMap[task.list_id] : null,
            onToggleComplete: this.onToggleComplete,
            onToggleImportant: this.onToggleImportant,
            onSelect: this.onSelectTask
          });
          completedList.appendChild(item);
        });
        completedSection.appendChild(completedList);
      }

      wrapper.appendChild(completedSection);
    }

    this.container.appendChild(wrapper);
  }

  renderPlannedGroups(wrapper, activeTasks, listMap) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - (endOfWeek.getDay() || 7)));

    const groups = {
      overdue: { title: 'Quá hạn', icon: '⚠️', color: 'var(--color-danger)', items: [] },
      today: { title: 'Hôm nay', icon: '📌', color: 'var(--color-accent)', items: [] },
      tomorrow: { title: 'Ngày mai', icon: '📆', color: 'inherit', items: [] },
      thisWeek: { title: 'Tuần này', icon: '📅', color: 'inherit', items: [] },
      later: { title: 'Sau đó', icon: '🗓️', color: 'inherit', items: [] }
    };

    activeTasks.forEach(t => {
      const d = new Date(t.due_date);
      d.setHours(0, 0, 0, 0);
      if (d < today) {
        groups.overdue.items.push(t);
      } else if (d.getTime() === today.getTime()) {
        groups.today.items.push(t);
      } else if (d.getTime() === tomorrow.getTime()) {
        groups.tomorrow.items.push(t);
      } else if (d <= endOfWeek) {
        groups.thisWeek.items.push(t);
      } else {
        groups.later.items.push(t);
      }
    });

    let renderedAny = false;
    Object.values(groups).forEach(g => {
      if (g.items.length === 0) return;
      renderedAny = true;

      const groupEl = createElement('div', { className: 'flex flex-col gap-xs' });
      const groupHeader = createElement('div', {
        className: 'flex items-center gap-xs font-semibold',
        style: { fontSize: '13px', color: g.color, padding: '4px 0' },
        textContent: `${g.icon} ${g.title} (${g.items.length})`
      });

      const listContainer = createElement('div', { className: 'flex flex-col gap-xs' });
      g.items.forEach(task => {
        const item = TaskItem.create({
          task,
          listName: listMap[task.list_id],
          onToggleComplete: this.onToggleComplete,
          onToggleImportant: this.onToggleImportant,
          onSelect: this.onSelectTask,
          onReorder: this.onReorderTasks
        });
        listContainer.appendChild(item);
      });

      groupEl.appendChild(groupHeader);
      groupEl.appendChild(listContainer);
      wrapper.appendChild(groupEl);
    });

    if (!renderedAny) {
      wrapper.appendChild(createElement('div', {
        style: { padding: '48px 16px', textAlign: 'center', color: 'var(--color-text-secondary)' },
        textContent: '📅 Bạn chưa có công việc nào có hạn chót.'
      }));
    }
  }
}


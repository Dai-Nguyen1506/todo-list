import { createElement } from '../utils/dom.js';
import { isToday } from '../utils/date.js';
import { soundManager } from '../utils/sound.js';

export class TaskItem {
  static create({
    task,
    listName = null,
    onToggleComplete = null,
    onToggleImportant = null,
    onSelect = null,
    onReorder = null
  }) {
    const isCompleted = task.is_completed;
    const isStarred = task.is_important;

    // Steps count
    const totalSteps = task.steps?.length || 0;
    const completedSteps = task.steps?.filter(s => s.is_completed).length || 0;

    const item = createElement('div', {
      className: `task-item ${isCompleted ? 'completed' : ''}`,
      draggable: 'true',
      dataset: { taskId: task.id },
      onclick: (e) => {
        if (e.target.closest('.task-checkbox') || e.target.closest('.task-star-btn')) return;
        if (onSelect) onSelect(task);
      },
      ondragstart: (e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        item.classList.add('opacity-50');
      },
      ondragend: () => {
        item.classList.remove('opacity-50');
      },
      ondragover: (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        item.classList.add('task-drag-over');
      },
      ondragleave: () => {
        item.classList.remove('task-drag-over');
      },
      ondrop: (e) => {
        e.preventDefault();
        item.classList.remove('task-drag-over');
        const sourceTaskId = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (sourceTaskId && sourceTaskId !== task.id && onReorder) {
          onReorder(sourceTaskId, task.id);
        }
      }
    });

    // Checkbox (circular)
    const checkbox = createElement('div', {
      className: 'task-checkbox',
      title: isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành',
      onclick: (e) => {
        e.stopPropagation();
        if (onToggleComplete) {
          if (!isCompleted) {
            soundManager.playTaskComplete();
          }
          item.classList.add('task-completing');
          setTimeout(() => {
            onToggleComplete(task, !isCompleted);
          }, 250);
        }
      }
    }, [
      isCompleted ? createElement('span', {
        style: { color: '#ffffff', fontSize: '12px', fontWeight: 'bold' },
        textContent: '✓'
      }) : null
    ]);

    // Content area
    const content = createElement('div', { className: 'flex-1 flex flex-col gap-xs overflow-hidden' });
    const titleEl = createElement('span', { className: 'task-title truncate', textContent: task.title });
    content.appendChild(titleEl);

    // Meta row (Due date, steps, my day indicator, list badge, recurrence)
    const metaRow = createElement('div', {
      className: 'flex items-center gap-sm flex-wrap',
      style: { fontSize: '11px', color: 'var(--color-text-secondary)' }
    });

    if (task.is_in_my_day) {
      metaRow.appendChild(createElement('span', { textContent: '☀️ My Day' }));
    }

    if (listName) {
      metaRow.appendChild(createElement('span', {
        style: {
          backgroundColor: 'var(--color-bg-tertiary)',
          padding: '1px 6px',
          borderRadius: '4px'
        },
        textContent: `📁 ${listName}`
      }));
    }

    if (totalSteps > 0) {
      metaRow.appendChild(createElement('span', { textContent: `📋 ${completedSteps}/${totalSteps}` }));
    }

    if (task.recurrence_rule) {
      metaRow.appendChild(createElement('span', { title: 'Lặp lại', textContent: '🔄' }));
    }

    if (task.due_date) {
      const isTod = isToday(task.due_date);
      const isOverdue = new Date(task.due_date) < new Date() && !isTod && !isCompleted;
      let dateLabel = `📅 ${isTod ? 'Hôm nay' : task.due_date}`;
      if (task.start_time && !task.is_all_day) {
        dateLabel += ` ⏰ ${String(task.start_time).substring(0, 5)}`;
      }
      metaRow.appendChild(createElement('span', {
        style: { color: isOverdue ? 'var(--color-danger)' : (isTod ? 'var(--color-accent)' : 'inherit') },
        textContent: dateLabel
      }));
    } else if (task.start_time && !task.is_all_day) {
      metaRow.appendChild(createElement('span', {
        style: { color: 'var(--color-accent)' },
        textContent: `⏰ ${String(task.start_time).substring(0, 5)}`
      }));
    }

    if (metaRow.children.length > 0) {
      content.appendChild(metaRow);
    }

    // Star button
    const starBtn = createElement('button', {
      className: `task-star-btn ${isStarred ? 'starred' : ''}`,
      title: isStarred ? 'Bỏ đánh dấu quan trọng' : 'Đánh dấu quan trọng',
      innerHTML: isStarred ? '&#9733;' : '&#9734;',
      onclick: (e) => {
        e.stopPropagation();
        if (onToggleImportant) onToggleImportant(task, !isStarred);
      }
    });

    item.appendChild(checkbox);
    item.appendChild(content);
    item.appendChild(starBtn);

    return item;
  }
}

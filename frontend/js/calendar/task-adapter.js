import { toLocalISOString } from '../utils/date.js';
import { api } from '../api.js';
import { store } from '../store.js';
import { Toast } from '../components/toast.js';

/**
 * Adapts Tasks (including time-blocked tasks) into Calendar items
 */

export function adaptTaskForCalendar(task) {
  if (!task || !task.due_date) return null;

  const dateStr = typeof task.due_date === 'string' ? task.due_date.split('T')[0] : '';
  if (!dateStr) return null;

  const isAllDay = task.is_all_day !== false || !task.start_time;

  if (isAllDay) {
    return {
      id: task.id,
      title: task.title,
      start_at: `${dateStr}T00:00:00`,
      end_at: `${dateStr}T23:59:59`,
      is_all_day: true,
      is_task: true,
      is_completed: !!task.is_completed,
      color: task.color || '#0B8043',
      raw_task: task
    };
  }

  // Timed task (Time-Blocking)
  const timeStr = String(task.start_time).substring(0, 5);
  const startAt = new Date(`${dateStr}T${timeStr}:00`);

  let endAt;
  if (task.end_time) {
    const endStr = String(task.end_time).substring(0, 5);
    endAt = new Date(`${dateStr}T${endStr}:00`);
    if (isNaN(endAt.getTime()) || endAt <= startAt) {
      const dur = task.duration_minutes || 60;
      endAt = new Date(startAt.getTime() + dur * 60000);
    }
  } else {
    const dur = task.duration_minutes || 60;
    endAt = new Date(startAt.getTime() + dur * 60000);
  }

  return {
    id: task.id,
    title: task.title,
    start_at: toLocalISOString(startAt),
    end_at: toLocalISOString(endAt),
    is_all_day: false,
    is_task: true,
    is_completed: !!task.is_completed,
    color: task.color || '#0B8043',
    raw_task: task
  };
}

export function adaptTasksForCalendar(tasks = []) {
  return (tasks || []).map(adaptTaskForCalendar).filter(Boolean);
}

/**
 * Toggles task completion from Calendar views, updating local store
 * and dispatching planify:data-changed for real-time reactive sync.
 */
export async function toggleCalendarTaskComplete(taskId, currentStatus) {
  try {
    const nextStatus = !currentStatus;
    const updated = await api.patch(`/tasks/${taskId}/complete`, { is_completed: nextStatus });

    // Update local task store if available
    const tasks = store.get('tasks') || [];
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], is_completed: nextStatus };
      store.set('tasks', [...tasks]);
    }

    // Dispatch reactive sync event
    window.dispatchEvent(new CustomEvent('planify:data-changed', {
      detail: { source: 'calendar', action: 'toggle-task', type: 'task', id: taskId, is_completed: nextStatus }
    }));
    document.dispatchEvent(new CustomEvent('task-changed', {
      detail: { action: 'update', taskId, is_completed: nextStatus }
    }));

    Toast.success(nextStatus ? 'Đã hoàn thành công việc!' : 'Đã mở lại công việc.');
    return updated;
  } catch (err) {
    Toast.error('Lỗi khi cập nhật trạng thái công việc');
    throw err;
  }
}



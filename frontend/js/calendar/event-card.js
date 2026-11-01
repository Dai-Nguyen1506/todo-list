import { createElement } from '../utils/dom.js';
import { formatDate } from '../utils/date.js';
import { EventForm } from './event-form.js';
import { api } from '../api.js';
import { Toast } from '../components/toast.js';
import { toggleCalendarTaskComplete } from './task-adapter.js';

export class EventCard {
  static create({ event, onUpdate = null }) {
    const isTask = !!event.is_task;
    const start = new Date(event.start_at);
    const end = new Date(event.end_at);
    const timeStr = event.is_all_day ? 'Cả ngày' : `${formatDate(start, 'HH:mm')} - ${formatDate(end, 'HH:mm')}`;

    const card = createElement('div', {
      className: `event-card ${event.is_all_day ? 'all-day' : ''} ${event.is_completed ? 'completed opacity-60' : ''}`,
      style: {
        backgroundColor: event.color || (isTask ? '#0B8043' : 'var(--color-event-default)')
      },
      onclick: (e) => {
        e.stopPropagation();
        if (card.dataset.justResized === 'true' || card.dataset.justDragged === 'true') {
          return;
        }
        if (isTask) {
          window.location.hash = '#todo';
        } else {
          EventForm.showFullModal({ event, onCreated: onUpdate });
        }
      }
    });

    if (isTask) {
      if (!event.is_all_day) {
        card.appendChild(createElement('span', { className: 'event-card-time', textContent: timeStr }));
      }
      const checkBtn = createElement('span', {
        className: 'event-task-check-icon mr-xs cursor-pointer',
        style: { fontWeight: 'bold' },
        textContent: event.is_completed ? '☑' : '☐',
        title: 'Hoàn thành công việc',
        onclick: async (e) => {
          e.stopPropagation();
          try {
            await toggleCalendarTaskComplete(event.id, event.is_completed);
            if (onUpdate) onUpdate();
          } catch (err) {
            // Handled in toggleCalendarTaskComplete
          }
        }
      });
      card.appendChild(checkBtn);
    } else {
      card.appendChild(createElement('span', { className: 'event-card-time', textContent: timeStr }));
    }

    card.appendChild(createElement('span', {
      className: 'event-card-title truncate',
      style: { textDecoration: event.is_completed ? 'line-through' : 'none' },
      textContent: event.title
    }));

    return card;
  }
}

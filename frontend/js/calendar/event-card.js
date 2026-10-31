import { createElement } from '../utils/dom.js';
import { formatDate } from '../utils/date.js';
import { EventForm } from './event-form.js';
import { store } from '../store.js';

export class EventCard {
  static create({ event, onUpdate = null }) {
    const isTask = !!event.is_task;
    const start = new Date(event.start_at);
    const end = new Date(event.end_at);
    const timeStr = event.is_all_day ? 'Cả ngày' : `${formatDate(start, 'HH:mm')} - ${formatDate(end, 'HH:mm')}`;

    const card = createElement('div', {
      className: `event-card ${event.is_all_day ? 'all-day' : ''}`,
      style: {
        backgroundColor: event.color || (isTask ? '#0B8043' : 'var(--color-event-default)')
      },
      onclick: (e) => {
        e.stopPropagation();
        if (isTask) {
          // Switch to todo or open task
          window.location.hash = '#todo';
        } else {
          EventForm.showFullModal({ event, onCreated: onUpdate });
        }
      }
    }, [
      createElement('span', { className: 'event-card-time', textContent: isTask ? '☑' : timeStr }),
      createElement('span', { className: 'event-card-title', textContent: event.title })
    ]);

    return card;
  }
}

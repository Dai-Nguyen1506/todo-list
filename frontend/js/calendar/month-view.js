import { createElement } from '../utils/dom.js';
import { getMonthMatrix, getMonthName, isToday, isSameDay } from '../utils/date.js';
import { EventCard } from './event-card.js';
import { EventForm } from './event-form.js';
import { store } from '../store.js';

export class MonthView {
  constructor(container, { date = new Date(), events = [], tasks = [], defaultCalendarId = null, onRefresh = null } = {}) {
    this.container = container;
    this.date = new Date(date);
    this.events = events;
    this.tasks = tasks;
    this.defaultCalendarId = defaultCalendarId;
    this.onRefresh = onRefresh;
  }

  render() {
    this.container.innerHTML = '';

    const year = this.date.getFullYear();
    const month = this.date.getMonth();
    const matrix = getMonthMatrix(year, month);

    const monthWrapper = createElement('div', {
      style: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }
    });

    // 1. Weekday Header
    const weekdaysHeader = createElement('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-secondary)',
        textAlign: 'center',
        padding: '8px 0',
        fontWeight: '600',
        fontSize: '12px',
        color: 'var(--color-text-secondary)'
      }
    }, [
      createElement('span', { textContent: 'Thứ Hai' }),
      createElement('span', { textContent: 'Thứ Ba' }),
      createElement('span', { textContent: 'Thứ Tư' }),
      createElement('span', { textContent: 'Thứ Năm' }),
      createElement('span', { textContent: 'Thứ Sáu' }),
      createElement('span', { textContent: 'Thứ Bảy' }),
      createElement('span', { textContent: 'Chủ Nhật' })
    ]);

    // 2. Month Grid
    const monthGrid = createElement('div', {
      style: {
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gridTemplateRows: `repeat(${matrix.length}, 1fr)`,
        overflow: 'hidden'
      }
    });

    matrix.forEach(week => {
      week.forEach(cell => {
        const isTod = isToday(cell.date);
        const dayCell = createElement('div', {
          style: {
            borderRight: '1px solid var(--color-border-light)',
            borderBottom: '1px solid var(--color-border-light)',
            padding: '4px',
            backgroundColor: cell.isCurrentMonth ? 'var(--color-bg-primary)' : 'var(--color-bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            cursor: 'pointer'
          },
          onclick: (e) => {
            if (e.target.closest('.event-card')) return;
            // Create quick event on that date
            const startAt = new Date(cell.date);
            startAt.setHours(9, 0, 0, 0);
            const endAt = new Date(startAt.getTime() + 3600000);
            EventForm.showQuickCreate({
              startAt,
              endAt,
              defaultCalendarId: this.defaultCalendarId,
              onCreated: this.onRefresh
            });
          }
        });

        // Day Number Header
        const dayNumber = createElement('div', {
          style: {
            fontSize: '12px',
            fontWeight: isTod ? '700' : '500',
            color: isTod ? 'var(--color-accent)' : (cell.isCurrentMonth ? 'var(--color-text-primary)' : 'var(--color-text-muted)'),
            width: '24px',
            height: '24px',
            lineHeight: '24px',
            textAlign: 'center',
            borderRadius: 'var(--radius-full)',
            backgroundColor: isTod ? 'var(--color-accent-light)' : 'transparent',
            marginBottom: '2px'
          },
          textContent: cell.date.getDate()
        });
        dayCell.appendChild(dayNumber);

        // Day Items (Tasks + Events)
        const cellItems = createElement('div', {
          style: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }
        });

        // Tasks due
        const dueTasks = this.tasks.filter(t => t.due_date && isSameDay(t.due_date, cell.date));
        dueTasks.forEach(t => {
          cellItems.appendChild(EventCard.create({
            event: { id: t.id, title: `☑ ${t.title}`, is_all_day: true, is_task: true, color: '#0B8043' },
            onUpdate: this.onRefresh
          }));
        });

        // Events
        const dayEvents = this.events.filter(e => isSameDay(e.start_at, cell.date));
        dayEvents.slice(0, 3).forEach(e => {
          cellItems.appendChild(EventCard.create({ event: e, onUpdate: this.onRefresh }));
        });

        if (dayEvents.length > 3) {
          const moreBadge = createElement('div', {
            style: { fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '600', paddingLeft: '4px' },
            textContent: `+${dayEvents.length - 3} sự kiện nữa`
          });
          cellItems.appendChild(moreBadge);
        }

        dayCell.appendChild(cellItems);
        monthGrid.appendChild(dayCell);
      });
    });

    monthWrapper.appendChild(weekdaysHeader);
    monthWrapper.appendChild(monthGrid);
    this.container.appendChild(monthWrapper);
  }

  destroy() {}
}

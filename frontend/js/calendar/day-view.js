import { createElement } from '../utils/dom.js';
import { TimeIndicator } from './time-indicator.js';
import { EventForm } from './event-form.js';
import { EventCard } from './event-card.js';
import { isSameDay } from '../utils/date.js';

export class DayView {
  constructor(container, { date = new Date(), events = [], tasks = [], defaultCalendarId = null, onRefresh = null } = {}) {
    this.container = container;
    this.date = new Date(date);
    this.events = events;
    this.tasks = tasks;
    this.defaultCalendarId = defaultCalendarId;
    this.onRefresh = onRefresh;
    this.timeIndicator = null;
    this.hourHeight = 60;
  }

  render() {
    this.container.innerHTML = '';

    const dayViewWrapper = createElement('div', {
      style: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }
    });

    // 1. All-Day Section
    const allDaySection = createElement('div', {
      style: {
        display: 'flex',
        borderBottom: '1px solid var(--color-border)',
        padding: '8px var(--space-md)',
        minHeight: '44px',
        backgroundColor: 'var(--color-bg-secondary)'
      }
    });

    const allDayLabel = createElement('div', {
      style: { width: '60px', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '600' },
      textContent: 'Cả ngày'
    });

    const allDayContent = createElement('div', {
      style: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }
    });

    // Render tasks with due date today in all day zone
    const dueTasksToday = this.tasks.filter(t => t.due_date && isSameDay(t.due_date, this.date));
    dueTasksToday.forEach(t => {
      const taskCard = EventCard.create({
        event: {
          id: t.id,
          title: `[Việc] ${t.title}`,
          is_all_day: true,
          is_task: true,
          color: '#0B8043'
        },
        onUpdate: this.onRefresh
      });
      allDayContent.appendChild(taskCard);
    });

    // Render all-day events
    const allDayEvents = this.events.filter(e => e.is_all_day && isSameDay(e.start_at, this.date));
    allDayEvents.forEach(e => {
      allDayContent.appendChild(EventCard.create({ event: e, onUpdate: this.onRefresh }));
    });

    allDaySection.appendChild(allDayLabel);
    allDaySection.appendChild(allDayContent);

    // 2. Hourly Grid Scrollable Area
    const gridScroll = createElement('div', {
      style: { flex: 1, overflowY: 'auto', position: 'relative', display: 'flex' }
    });

    // Left Time Gutter (00:00 - 23:00)
    const timeGutter = createElement('div', {
      style: { width: '64px', borderRight: '1px solid var(--color-border)', flexShrink: 0 }
    });
    for (let h = 0; h < 24; h++) {
      const hourSlot = createElement('div', {
        style: {
          height: `${this.hourHeight}px`,
          paddingRight: '8px',
          textAlign: 'right',
          fontSize: '11px',
          color: 'var(--color-text-tertiary)',
          transform: 'translateY(-6px)'
        },
        textContent: `${String(h).padStart(2, '0')}:00`
      });
      timeGutter.appendChild(hourSlot);
    }

    // Right Event Grid
    const eventGrid = createElement('div', {
      style: { flex: 1, position: 'relative', height: `${24 * this.hourHeight}px` }
    });

    // Grid horizontal lines & click-to-create
    for (let h = 0; h < 24; h++) {
      const line = createElement('div', {
        style: {
          position: 'absolute',
          top: `${h * this.hourHeight}px`,
          left: 0,
          right: 0,
          height: `${this.hourHeight}px`,
          borderBottom: '1px solid var(--color-grid-line-half)',
          cursor: 'pointer'
        },
        onclick: (e) => {
          if (e.target !== line) return;
          const rect = line.getBoundingClientRect();
          const clickY = e.clientY - rect.top;
          const mins = clickY > 30 ? 30 : 0;
          const startAt = new Date(this.date);
          startAt.setHours(h, mins, 0, 0);
          const endAt = new Date(startAt.getTime() + 3600000);
          EventForm.showQuickCreate({
            startAt,
            endAt,
            defaultCalendarId: this.defaultCalendarId,
            onCreated: this.onRefresh
          });
        }
      });
      eventGrid.appendChild(line);
    }

    // Mount Time Indicator
    this.timeIndicator = new TimeIndicator(eventGrid, this.hourHeight);
    this.timeIndicator.mount();

    // Render timed events
    const timedEvents = this.events.filter(e => !e.is_all_day && isSameDay(e.start_at, this.date));
    timedEvents.forEach(e => {
      const s = new Date(e.start_at);
      const end = new Date(e.end_at);
      const topMinutes = s.getHours() * 60 + s.getMinutes();
      const durationMins = Math.max(30, (end.getTime() - s.getTime()) / 60000);

      const topPx = (topMinutes / 60) * this.hourHeight;
      const heightPx = (durationMins / 60) * this.hourHeight - 2;

      const card = EventCard.create({ event: e, onUpdate: this.onRefresh });
      card.style.top = `${topPx}px`;
      card.style.height = `${heightPx}px`;
      card.style.left = '4px';
      card.style.right = '8px';
      eventGrid.appendChild(card);
    });

    gridScroll.appendChild(timeGutter);
    gridScroll.appendChild(eventGrid);

    dayViewWrapper.appendChild(allDaySection);
    dayViewWrapper.appendChild(gridScroll);
    this.container.appendChild(dayViewWrapper);

    // Scroll to current hour or 8:00
    const scrollHour = Math.max(0, new Date().getHours() - 1);
    gridScroll.scrollTop = scrollHour * this.hourHeight;
  }

  destroy() {
    if (this.timeIndicator) {
      this.timeIndicator.destroy();
      this.timeIndicator = null;
    }
  }
}


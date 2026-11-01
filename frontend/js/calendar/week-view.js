import { createElement } from '../utils/dom.js';
import { TimeIndicator } from './time-indicator.js';
import { EventForm } from './event-form.js';
import { EventCard } from './event-card.js';
import { getStartOfWeek, addDays, getWeekdayName, isToday, isSameDay } from '../utils/date.js';

export class WeekView {
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

    const startOfWeek = getStartOfWeek(this.date, true);
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      weekDays.push(addDays(startOfWeek, i));
    }

    const weekWrapper = createElement('div', {
      style: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }
    });

    // 1. Column Headers (Weekday names + Day numbers)
    const headerRow = createElement('div', {
      style: {
        display: 'flex',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-secondary)',
        paddingLeft: '64px'
      }
    });

    weekDays.forEach((d, idx) => {
      const isTod = isToday(d);
      const colHeader = createElement('div', {
        style: {
          flex: 1,
          padding: '8px 4px',
          textAlign: 'center',
          borderRight: idx < 6 ? '1px solid var(--color-border-light)' : 'none'
        }
      }, [
        createElement('div', {
          style: { fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '600' },
          textContent: getWeekdayName(d.getDay(), true)
        }),
        createElement('div', {
          style: {
            fontSize: '18px',
            fontWeight: isTod ? '700' : '500',
            color: isTod ? 'var(--color-accent)' : 'var(--color-text-primary)',
            width: '32px',
            height: '32px',
            lineHeight: '32px',
            margin: '2px auto 0',
            borderRadius: 'var(--radius-full)',
            backgroundColor: isTod ? 'var(--color-accent-light)' : 'transparent'
          },
          textContent: d.getDate()
        })
      ]);
      headerRow.appendChild(colHeader);
    });

    // 2. All-Day Section across 7 days
    const allDaySection = createElement('div', {
      style: {
        display: 'flex',
        borderBottom: '1px solid var(--color-border)',
        minHeight: '44px',
        backgroundColor: 'var(--color-bg-secondary)'
      }
    });

    const allDayLabel = createElement('div', {
      style: {
        width: '64px',
        fontSize: '11px',
        color: 'var(--color-text-secondary)',
        fontWeight: '600',
        padding: '8px 4px',
        textAlign: 'right',
        flexShrink: 0
      },
      textContent: 'Cả ngày'
    });

    const allDayGrid = createElement('div', {
      style: { flex: 1, display: 'flex' }
    });

    weekDays.forEach((d, idx) => {
      const col = createElement('div', {
        style: {
          flex: 1,
          padding: '4px',
          borderRight: idx < 6 ? '1px solid var(--color-border-light)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }
      });

      // Tasks due on this day
      const dueTasks = this.tasks.filter(t => t.due_date && isSameDay(t.due_date, d));
      dueTasks.forEach(t => {
        col.appendChild(EventCard.create({
          event: { id: t.id, title: `☑ ${t.title}`, is_all_day: true, is_task: true, color: '#0B8043' },
          onUpdate: this.onRefresh
        }));
      });

      // All day events on this day
      const allDayEvs = this.events.filter(e => e.is_all_day && isSameDay(e.start_at, d));
      allDayEvs.forEach(e => {
        col.appendChild(EventCard.create({ event: e, onUpdate: this.onRefresh }));
      });

      allDayGrid.appendChild(col);
    });

    allDaySection.appendChild(allDayLabel);
    allDaySection.appendChild(allDayGrid);

    // 3. Scrollable Timed Grid
    const gridScroll = createElement('div', {
      style: { flex: 1, overflowY: 'auto', display: 'flex', position: 'relative' }
    });

    // Gutter
    const timeGutter = createElement('div', {
      style: { width: '64px', borderRight: '1px solid var(--color-border)', flexShrink: 0 }
    });
    for (let h = 0; h < 24; h++) {
      timeGutter.appendChild(createElement('div', {
        style: {
          height: `${this.hourHeight}px`,
          paddingRight: '8px',
          textAlign: 'right',
          fontSize: '11px',
          color: 'var(--color-text-tertiary)',
          transform: 'translateY(-6px)'
        },
        textContent: `${String(h).padStart(2, '0')}:00`
      }));
    }

    // 7 Columns
    const columnsContainer = createElement('div', {
      style: { flex: 1, display: 'flex', height: `${24 * this.hourHeight}px`, position: 'relative' }
    });

    weekDays.forEach((d, idx) => {
      const isTod = isToday(d);
      const dayCol = createElement('div', {
        style: {
          flex: 1,
          position: 'relative',
          borderRight: idx < 6 ? '1px solid var(--color-border-light)' : 'none',
          height: `${24 * this.hourHeight}px`
        }
      });

      // Hour horizontal slots
      for (let h = 0; h < 24; h++) {
        const slot = createElement('div', {
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
            if (e.target !== slot) return;
            const startAt = new Date(d);
            startAt.setHours(h, 0, 0, 0);
            const endAt = new Date(startAt.getTime() + 3600000);
            EventForm.showQuickCreate({
              startAt,
              endAt,
              defaultCalendarId: this.defaultCalendarId,
              onCreated: this.onRefresh
            });
          }
        });
        dayCol.appendChild(slot);
      }

      // Add TimeIndicator to Today's column
      if (isTod) {
        this.timeIndicator = new TimeIndicator(dayCol, this.hourHeight);
        this.timeIndicator.mount();
      }

      // Render events on this day
      const dayEvents = this.events.filter(e => !e.is_all_day && isSameDay(e.start_at, d));
      dayEvents.forEach(e => {
        const s = new Date(e.start_at);
        const end = new Date(e.end_at);
        const topMinutes = s.getHours() * 60 + s.getMinutes();
        const durationMins = Math.max(30, (end.getTime() - s.getTime()) / 60000);

        const topPx = (topMinutes / 60) * this.hourHeight;
        const heightPx = (durationMins / 60) * this.hourHeight - 2;

        const card = EventCard.create({ event: e, onUpdate: this.onRefresh });
        card.style.top = `${topPx}px`;
        card.style.height = `${heightPx}px`;
        card.style.left = '2px';
        card.style.right = '4px';
        dayCol.appendChild(card);
      });

      columnsContainer.appendChild(dayCol);
    });

    gridScroll.appendChild(timeGutter);
    gridScroll.appendChild(columnsContainer);

    weekWrapper.appendChild(headerRow);
    weekWrapper.appendChild(allDaySection);
    weekWrapper.appendChild(gridScroll);
    this.container.appendChild(weekWrapper);

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


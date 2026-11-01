import { createElement } from '../utils/dom.js';
import { formatDate, isToday, isSameDay, getWeekdayName } from '../utils/date.js';
import { EventForm } from './event-form.js';
import { store } from '../store.js';

export class AgendaView {
  constructor(container, { date = new Date(), events = [], tasks = [], defaultCalendarId = null, onRefresh = null } = {}) {
    this.container = container;
    this.date = new Date(date);
    this.events = events;
    this.tasks = tasks;
    this.defaultCalendarId = defaultCalendarId;
    this.onRefresh = onRefresh;
    this.rangeDays = 30; // Display upcoming 30 days
  }

  render() {
    this.container.innerHTML = '';

    const wrapper = createElement('div', {
      style: {
        height: '100%',
        overflowY: 'auto',
        padding: 'var(--space-md) var(--space-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)'
      }
    });

    const startDay = new Date(this.date);
    startDay.setHours(0, 0, 0, 0);

    const endDay = new Date(startDay);
    endDay.setDate(endDay.getDate() + this.rangeDays);

    // Combine all events and tasks that fall within range
    const allItems = [];

    this.events.forEach(e => {
      const s = new Date(e.start_at);
      if (s >= startDay && s <= endDay) {
        allItems.push({
          ...e,
          _type: 'event',
          _dateObj: s
        });
      }
    });

    this.tasks.forEach(t => {
      const s = new Date(t.start_at);
      if (s >= startDay && s <= endDay) {
        allItems.push({
          ...t,
          _type: 'task',
          _dateObj: s
        });
      }
    });

    // Group items by day YYYY-MM-DD
    const dayMap = new Map();
    for (let i = 0; i < this.rangeDays; i++) {
      const d = new Date(startDay);
      d.setDate(d.getDate() + i);
      const key = formatDate(d, 'YYYY-MM-DD');
      dayMap.set(key, { date: d, items: [] });
    }

    allItems.forEach(item => {
      const key = formatDate(item._dateObj, 'YYYY-MM-DD');
      if (dayMap.has(key)) {
        dayMap.get(key).items.push(item);
      }
    });

    // Sort items within each day (all-day first, then by time)
    dayMap.forEach(group => {
      group.items.sort((a, b) => {
        if (a.is_all_day && !b.is_all_day) return -1;
        if (!a.is_all_day && b.is_all_day) return 1;
        return a._dateObj - b._dateObj;
      });
    });

    // Render list of days that have items (or today even if empty)
    let totalItemsRendered = 0;

    dayMap.forEach((group, key) => {
      const isTod = isToday(group.date);
      if (group.items.length === 0 && !isTod) {
        return; // Skip empty days except today
      }

      totalItemsRendered += group.items.length;

      const dayBlock = createElement('div', {
        className: 'agenda-day-block',
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-xs)',
          borderBottom: '1px solid var(--color-border-light)',
          paddingBottom: 'var(--space-md)'
        }
      });

      // Day Header
      const weekdayStr = getWeekdayName(group.date.getDay());
      const dateFormatted = formatDate(group.date, 'DD/MM/YYYY');

      const dayHeader = createElement('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          fontSize: '14px',
          fontWeight: isTod ? '700' : '600',
          color: isTod ? 'var(--color-accent)' : 'var(--color-text-primary)'
        }
      }, [
        createElement('span', { textContent: `📅 ${weekdayStr}, ${dateFormatted}` }),
        isTod ? createElement('span', {
          style: {
            fontSize: '11px',
            backgroundColor: 'var(--color-accent)',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            fontWeight: '600'
          },
          textContent: 'Hôm nay'
        }) : null
      ]);

      dayBlock.appendChild(dayHeader);

      // Items Container
      if (group.items.length === 0) {
        dayBlock.appendChild(createElement('div', {
          style: {
            padding: '8px 12px',
            fontSize: '13px',
            color: 'var(--color-text-tertiary)',
            fontStyle: 'italic'
          },
          textContent: 'Không có sự kiện hoặc công việc nào.'
        }));
      } else {
        const itemsList = createElement('div', {
          style: { display: 'flex', flexDirection: 'column', gap: '6px' }
        });

        group.items.forEach(item => {
          const isEvent = item._type === 'event';
          const startTimeStr = item.is_all_day ? 'Cả ngày' : formatDate(item._dateObj, 'HH:mm');
          const endTimeStr = (item.is_all_day || !item.end_at) ? '' : ` - ${formatDate(new Date(item.end_at), 'HH:mm')}`;
          const timeLabel = `${startTimeStr}${endTimeStr}`;

          const itemCard = createElement('div', {
            className: 'agenda-item-card',
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
              padding: '10px 14px',
              backgroundColor: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
              borderLeft: `4px solid ${item.color || (isEvent ? 'var(--color-accent)' : '#0B8043')}`,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            },
            onclick: () => {
              if (isEvent) {
                EventForm.showFullModal({
                  event: item,
                  defaultCalendarId: this.defaultCalendarId,
                  onCreated: this.onRefresh
                });
              } else {
                window.location.hash = 'todo';
              }
            }
          }, [
            // Time Badge
            createElement('div', {
              style: {
                minWidth: '100px',
                fontSize: '12px',
                fontWeight: '600',
                color: item.is_all_day ? 'var(--color-accent)' : 'var(--color-text-secondary)'
              },
              textContent: timeLabel
            }),
            // Title & Details
            createElement('div', {
              style: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }
            }, [
              createElement('div', {
                style: {
                  fontWeight: '600',
                  fontSize: '13px',
                  color: 'var(--color-text-primary)',
                  textDecoration: item.is_completed ? 'line-through' : 'none'
                },
                textContent: `${isEvent ? '🗓️' : '✅'} ${item.title}`
              }),
              item.location ? createElement('div', {
                style: { fontSize: '11px', color: 'var(--color-text-tertiary)' },
                textContent: `📍 ${item.location}`
              }) : null,
              item.recurrence_rule ? createElement('div', {
                style: { fontSize: '11px', color: 'var(--color-accent)' },
                textContent: '🔄 Lặp lại'
              }) : null
            ]),
            // Type Pill
            createElement('span', {
              style: {
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-secondary)',
                fontWeight: '500'
              },
              textContent: isEvent ? 'Sự kiện' : 'Công việc'
            })
          ]);

          itemsList.appendChild(itemCard);
        });

        dayBlock.appendChild(itemsList);
      }

      wrapper.appendChild(dayBlock);
    });

    if (totalItemsRendered === 0) {
      wrapper.appendChild(createElement('div', {
        style: {
          padding: '48px 16px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)'
        },
        textContent: '🎉 Không có sự kiện hoặc công việc nào trong 30 ngày tới.'
      }));
    }

    this.container.appendChild(wrapper);
  }

  destroy() {}
}


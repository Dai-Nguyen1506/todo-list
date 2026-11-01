import { createElement } from '../utils/dom.js';
import { TimeIndicator } from './time-indicator.js';
import { EventForm } from './event-form.js';
import { EventCard } from './event-card.js';
import { isSameDay, formatDate, toLocalISOString } from '../utils/date.js';
import { layoutTimedItems } from './week-view.js';
import { api } from '../api.js';
import { Toast } from '../components/toast.js';

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
      className: 'day-view-wrapper',
      style: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }
    });

    // 1. All-Day Section
    const allDaySection = createElement('div', {
      className: 'day-allday-section',
      style: {
        display: 'flex',
        borderBottom: '1px solid var(--color-border)',
        padding: '8px var(--space-md)',
        minHeight: '44px',
        backgroundColor: 'var(--color-bg-secondary)'
      }
    });

    const allDayLabel = createElement('div', {
      className: 'day-allday-label',
      style: { width: '60px', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '600' },
      textContent: 'Cả ngày'
    });

    const allDayContent = createElement('div', {
      className: 'day-allday-content',
      style: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }
    });

    // Render all-day tasks
    const allDayTasks = this.tasks.filter(t => t.is_all_day && isSameDay(t.start_at, this.date));
    allDayTasks.forEach(t => {
      allDayContent.appendChild(EventCard.create({ event: t, onUpdate: this.onRefresh }));
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
      className: 'day-grid-scroll',
      style: { flex: 1, overflowY: 'auto', position: 'relative', display: 'flex' }
    });

    // Left Time Gutter (00:00 - 23:00)
    const timeGutter = createElement('div', {
      className: 'day-time-gutter',
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
      className: 'day-event-grid',
      style: { flex: 1, position: 'relative', height: `${24 * this.hourHeight}px` }
    });

    // Grid horizontal lines & click-to-create
    for (let h = 0; h < 24; h++) {
      const line = createElement('div', {
        className: 'day-hour-line',
        dataset: { hour: h },
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

    // Render timed events and timed tasks with Collision Column Packing (BUG-15)
    const timedEvents = this.events.filter(e => !e.is_all_day && isSameDay(e.start_at, this.date));
    const timedTasks = this.tasks.filter(t => !t.is_all_day && isSameDay(t.start_at, this.date));
    const allTimed = [...timedEvents, ...timedTasks];

    const packedElements = layoutTimedItems(allTimed, this.hourHeight);

    packedElements.forEach(el => {
      const card = EventCard.create({ event: el.item, onUpdate: this.onRefresh });

      card.style.position = 'absolute';
      card.style.top = `${el.topPx}px`;
      card.style.height = `${el.heightPx}px`;
      card.style.left = `calc(${el.leftPercent}% + 2px)`;
      card.style.width = `calc(${el.widthPercent}% - 4px)`;
      card.style.right = 'auto';

      // 1. Enable Native HTML5 Drag and Drop Move
      this.attachCardDraggable(card, el);

      // 2. Attach Bottom-Edge Resize Handle
      this.attachCardResizeHandle(card, el);

      eventGrid.appendChild(card);
    });

    // Enable Drag and Drop Drop-Target on Event Grid
    this.attachGridDrop(eventGrid);

    gridScroll.appendChild(timeGutter);
    gridScroll.appendChild(eventGrid);

    dayViewWrapper.appendChild(allDaySection);
    dayViewWrapper.appendChild(gridScroll);
    this.container.appendChild(dayViewWrapper);

    // Auto-scroll to 7:00 AM working hours (BUG-15)
    const targetHour = 7;
    gridScroll.scrollTop = targetHour * this.hourHeight;
  }

  /**
   * Attach Drag & Drop functionality to an event card
   */
  attachCardDraggable(card, el) {
    card.setAttribute('draggable', 'true');

    card.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      const dragPayload = {
        id: el.item.id,
        is_task: !!el.item.is_task,
        durationMinutes: el.durMin,
        title: el.item.title,
        start_at: el.item.start_at,
        end_at: el.item.end_at,
        color: el.item.color
      };
      e.dataTransfer.setData('text/plain', JSON.stringify(dragPayload));
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('event-dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('event-dragging');
      card.dataset.justDragged = 'true';
      setTimeout(() => { card.dataset.justDragged = 'false'; }, 200);
      document.querySelectorAll('.day-col-dragover').forEach(c => c.classList.remove('day-col-dragover'));
    });
  }

  /**
   * Attach bottom-edge resize handle to adjust duration in 15-min increments
   */
  attachCardResizeHandle(card, el) {
    const resizeHandle = createElement('div', {
      className: 'event-resize-handle',
      title: 'Kéo để thay đổi thời lượng (bước nhảy 15 phút)'
    });
    card.appendChild(resizeHandle);

    resizeHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();

      const startY = e.clientY;
      const initialHeight = parseFloat(card.style.height) || (el.durMin / 60) * this.hourHeight;
      const initialDuration = el.durMin;
      const startAt = new Date(el.item.start_at);
      let curSnappedHeight = initialHeight;

      card.classList.add('event-resizing');

      const onMouseMove = (moveEvent) => {
        moveEvent.preventDefault();
        const deltaY = moveEvent.clientY - startY;
        const rawHeight = Math.max(15, initialHeight + deltaY);
        const pxPer15 = this.hourHeight / 4;
        curSnappedHeight = Math.max(pxPer15, Math.round(rawHeight / pxPer15) * pxPer15);
        card.style.height = `${curSnappedHeight - 2}px`;

        const curDurationMins = Math.round((curSnappedHeight / this.hourHeight) * 60);
        const tempEnd = new Date(startAt.getTime() + curDurationMins * 60000);
        const timeSpanEl = card.querySelector('.event-card-time');
        if (timeSpanEl) {
          timeSpanEl.textContent = `${formatDate(startAt, 'HH:mm')} - ${formatDate(tempEnd, 'HH:mm')}`;
        }
      };

      const onMouseUp = async () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        card.classList.remove('event-resizing');

        card.dataset.justResized = 'true';
        setTimeout(() => { card.dataset.justResized = 'false'; }, 200);

        const finalDurationMins = Math.max(15, Math.round((curSnappedHeight / this.hourHeight) * 60));

        if (finalDurationMins === initialDuration) {
          return;
        }

        const newEnd = new Date(startAt.getTime() + finalDurationMins * 60000);

        try {
          if (el.item.is_task) {
            await api.put(`/tasks/${el.item.id}`, {
              end_time: `${String(newEnd.getHours()).padStart(2, '0')}:${String(newEnd.getMinutes()).padStart(2, '0')}:00`,
              duration_minutes: finalDurationMins
            });
            Toast.success(`Đã cập nhật thời lượng: ${finalDurationMins} phút`);
            window.dispatchEvent(new CustomEvent('planify:data-changed', {
              detail: { source: 'calendar-day', action: 'resize', type: 'task', id: el.item.id }
            }));
            document.dispatchEvent(new CustomEvent('task-changed', {
              detail: { action: 'update', taskId: el.item.id }
            }));
          } else {
            await api.put(`/events/${el.item.id}`, {
              start_at: toLocalISOString(startAt),
              end_at: toLocalISOString(newEnd)
            });
            Toast.success(`Đã cập nhật thời lượng: ${finalDurationMins} phút`);
            window.dispatchEvent(new CustomEvent('planify:data-changed', {
              detail: { source: 'calendar-day', action: 'resize', type: 'event', id: el.item.id }
            }));
          }
          if (this.onRefresh) this.onRefresh();
        } catch (err) {
          Toast.error(err.message || 'Lỗi khi cập nhật thời lượng.');
          if (this.onRefresh) this.onRefresh();
        }
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  /**
   * Handle dropping an event onto the day event grid
   */
  attachGridDrop(eventGrid) {
    eventGrid.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      eventGrid.classList.add('day-col-dragover');
    });

    eventGrid.addEventListener('dragleave', (e) => {
      if (!eventGrid.contains(e.relatedTarget)) {
        eventGrid.classList.remove('day-col-dragover');
      }
    });

    eventGrid.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      eventGrid.classList.remove('day-col-dragover');

      let data;
      try {
        data = JSON.parse(e.dataTransfer.getData('text/plain'));
      } catch (err) {
        return;
      }
      if (!data || !data.id) return;

      const rect = eventGrid.getBoundingClientRect();
      const offsetY = Math.max(0, e.clientY - rect.top);
      const totalMinutes = (offsetY / this.hourHeight) * 60;
      const snappedMinutes = Math.min(23 * 60 + 45, Math.max(0, Math.round(totalMinutes / 15) * 15));
      const newHour = Math.floor(snappedMinutes / 60);
      const newMin = snappedMinutes % 60;

      const newStart = new Date(this.date);
      newStart.setHours(newHour, newMin, 0, 0);
      const duration = data.durationMinutes || 60;
      const newEnd = new Date(newStart.getTime() + duration * 60000);

      try {
        if (data.is_task) {
          await api.put(`/tasks/${data.id}`, {
            due_date: formatDate(newStart, 'YYYY-MM-DD'),
            start_time: `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}:00`,
            end_time: `${String(newEnd.getHours()).padStart(2, '0')}:${String(newEnd.getMinutes()).padStart(2, '0')}:00`,
            is_all_day: false,
            duration_minutes: duration
          });
          Toast.success(`Đã dời công việc sang ${formatDate(newStart, 'HH:mm')}`);
          window.dispatchEvent(new CustomEvent('planify:data-changed', {
            detail: { source: 'calendar-day', action: 'move', type: 'task', id: data.id }
          }));
          document.dispatchEvent(new CustomEvent('task-changed', {
            detail: { action: 'update', taskId: data.id }
          }));
        } else {
          await api.put(`/events/${data.id}`, {
            start_at: toLocalISOString(newStart),
            end_at: toLocalISOString(newEnd)
          });
          Toast.success(`Đã dời sự kiện sang ${formatDate(newStart, 'HH:mm')}`);
          window.dispatchEvent(new CustomEvent('planify:data-changed', {
            detail: { source: 'calendar-day', action: 'move', type: 'event', id: data.id }
          }));
        }
        if (this.onRefresh) this.onRefresh();
      } catch (err) {
        Toast.error(err.message || 'Lỗi khi cập nhật thời gian.');
      }
    });
  }

  destroy() {
    if (this.timeIndicator) {
      this.timeIndicator.destroy();
      this.timeIndicator = null;
    }
  }
}

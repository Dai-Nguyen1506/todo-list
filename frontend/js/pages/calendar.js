import { createElement } from '../utils/dom.js';
import { store } from '../store.js';
import { api } from '../api.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { GuideCard } from '../components/guide-card.js';
import { formatVietnameseDate, getMonthName, addDays, getStartOfWeek } from '../utils/date.js';
import { MiniCalendar } from '../calendar/mini-calendar.js';
import { DayView } from '../calendar/day-view.js';
import { WeekView } from '../calendar/week-view.js';
import { MonthView } from '../calendar/month-view.js';
import { EventForm } from '../calendar/event-form.js';
import { RRuleParser } from '../calendar/rrule.js';
import { adaptTasksForCalendar } from '../calendar/task-adapter.js';

export const calendarPage = {
  container: null,
  activeView: null,
  miniCalendar: null,
  guideCard: null,
  handleKeyDown: null,

  async render(container) {
    this.container = container;
    container.innerHTML = '';

    const page = createElement('div', { className: 'calendar-page' });

    // 1. Sidebar
    const sidebar = createElement('aside', { className: 'calendar-sidebar' });
    const miniCalContainer = createElement('div', { id: 'mini-calendar' });
    const calListSection = createElement('div', { className: 'calendar-list-section' });

    sidebar.appendChild(miniCalContainer);
    sidebar.appendChild(calListSection);

    // 2. Main
    const main = createElement('div', { className: 'calendar-main' });
    const toolbar = createElement('div', { className: 'calendar-toolbar' });
    
    // Guide Card above calendar grid
    this.guideCard = new GuideCard();
    const guideElement = this.guideCard.render();

    const viewContainer = createElement('div', { className: 'calendar-view-container', id: 'calendar-view-body' });

    main.appendChild(toolbar);
    main.appendChild(guideElement);
    main.appendChild(viewContainer);

    page.appendChild(sidebar);
    page.appendChild(main);
    container.appendChild(page);

    // Initialize mini calendar
    this.miniCalendar = new MiniCalendar(miniCalContainer, {
      onDateSelect: (d) => {
        store.set('selectedDate', d);
        this.updateView();
      }
    });
    this.miniCalendar.render();

    // Fetch initial data
    await this.fetchCalendars(calListSection);
    await this.updateView();

    // Setup Keyboard shortcuts (D, W, M, T, N)
    this.handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const key = e.key.toUpperCase();
      if (key === 'D') this.setViewMode('day');
      else if (key === 'W') this.setViewMode('week');
      else if (key === 'M') this.setViewMode('month');
      else if (key === 'T') {
        store.set('selectedDate', new Date());
        this.updateView();
      } else if (key === 'N') {
        const d = store.get('selectedDate') || new Date();
        EventForm.showFullModal({ startAt: d, onCreated: () => this.updateView() });
      }
    };
    document.addEventListener('keydown', this.handleKeyDown);

    // Cross-module sync with Tasks
    this.handleTaskChanged = () => this.updateView();
    document.addEventListener('task-changed', this.handleTaskChanged);
  },

  async fetchCalendars(container) {
    try {
      const cals = await api.get('/calendars');
      store.set('calendars', cals || []);
      this.renderCalendarList(container, cals || []);
    } catch (err) {
      console.warn('Failed to fetch calendars:', err);
    }
  },

  renderCalendarList(container, calendars) {
    container.innerHTML = '';
    const headerRow = createElement('div', {
      className: 'flex items-center justify-between',
      style: { marginBottom: '8px' }
    }, [
      createElement('h4', { style: { fontSize: '13px', fontWeight: '600' }, textContent: 'Lịch của tôi' }),
      createElement('button', {
        className: 'btn-icon',
        style: { width: '24px', height: '24px', fontSize: '14px' },
        textContent: '+',
        title: 'Tạo lịch mới',
        onclick: () => this.showCreateCalendarModal(container)
      })
    ]);
    container.appendChild(headerRow);

    calendars.forEach(c => {
      const row = createElement('div', {
        className: 'flex items-center gap-sm',
        style: { padding: '4px 0', fontSize: '13px', cursor: 'pointer' }
      }, [
        createElement('input', {
          type: 'checkbox',
          checked: c.is_visible,
          onchange: async (e) => {
            c.is_visible = e.target.checked;
            await api.put(`/calendars/${c.id}`, { is_visible: c.is_visible });
            this.updateView();
          }
        }),
        createElement('span', {
          style: {
            width: '10px',
            height: '10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: c.color,
            display: 'inline-block'
          }
        }),
        createElement('span', { className: 'truncate flex-1', textContent: c.name })
      ]);
      container.appendChild(row);
    });
  },

  showCreateCalendarModal(listContainer) {
    let modalRef = null;
    const nameInput = createElement('input', { type: 'text', className: 'input', placeholder: 'Tên lịch mới...' });
    const colorInput = createElement('input', { type: 'color', value: '#4285F4', style: { width: '48px', height: '36px', padding: '0', border: 'none' } });

    const content = createElement('div', { className: 'flex flex-col gap-md' }, [
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Tên lịch' }),
        nameInput
      ]),
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Màu đại diện' }),
        colorInput
      ])
    ]);

    const footer = createElement('div', { className: 'flex justify-between w-full' }, [
      createElement('span'),
      createElement('div', { className: 'flex gap-sm' }, [
        createElement('button', { className: 'btn btn-secondary', textContent: 'Hủy', onclick: () => modalRef.close() }),
        createElement('button', {
          className: 'btn btn-primary',
          textContent: 'Tạo lịch',
          onclick: async () => {
            const name = nameInput.value.trim();
            if (!name) {
              Toast.error('Vui lòng nhập tên lịch.');
              return;
            }
            try {
              await api.post('/calendars', { name, color: colorInput.value });
              Toast.success('Đã tạo lịch mới!');
              modalRef.close();
              await this.fetchCalendars(listContainer);
              this.updateView();
            } catch (err) {
              Toast.error(err.message || 'Lỗi tạo lịch.');
            }
          }
        })
      ])
    ]);

    modalRef = new Modal({ title: 'Thêm lịch mới', content, footer, width: '400px' });
    modalRef.open();
  },

  async updateView() {
    const curDate = store.get('selectedDate') || new Date();
    const curMode = store.get('calendarView') || 'week';
    const viewContainer = document.getElementById('calendar-view-body');
    const toolbar = document.querySelector('.calendar-toolbar');
    if (!viewContainer || !toolbar) return;

    // Calculate fetch window based on view
    let startDt, endDt;
    if (curMode === 'day') {
      startDt = new Date(curDate);
      startDt.setHours(0, 0, 0, 0);
      endDt = new Date(curDate);
      endDt.setHours(23, 59, 59, 999);
    } else if (curMode === 'week') {
      startDt = getStartOfWeek(curDate, true);
      endDt = addDays(startDt, 7);
    } else {
      startDt = new Date(curDate.getFullYear(), curDate.getMonth(), 1);
      endDt = new Date(curDate.getFullYear(), curDate.getMonth() + 1, 0, 23, 59, 59);
    }

    // Update Toolbar HTML
    let displayTitle = '';
    if (curMode === 'day') {
      displayTitle = formatVietnameseDate(curDate, true);
    } else if (curMode === 'week') {
      const s = getStartOfWeek(curDate, true);
      const e = addDays(s, 6);
      displayTitle = `${s.getDate()} thg ${s.getMonth() + 1} - ${e.getDate()} thg ${e.getMonth() + 1}, ${s.getFullYear()}`;
    } else {
      displayTitle = `${getMonthName(curDate.getMonth())}, ${curDate.getFullYear()}`;
    }

    toolbar.innerHTML = `
      <div class="calendar-nav-group">
        <button class="btn btn-secondary" id="btn-cal-today">Hôm nay</button>
        <button class="btn-icon" id="btn-cal-prev">&#9664;</button>
        <button class="btn-icon" id="btn-cal-next">&#9654;</button>
        <h2 class="calendar-title">${displayTitle}</h2>
      </div>
      <div class="view-toggle-group">
        <button class="btn btn-secondary btn-sm" id="btn-toggle-guide" title="Hiện / Ẩn hướng dẫn thao tác">💡 Hướng dẫn</button>
        <button class="view-toggle-btn ${curMode === 'day' ? 'active' : ''}" data-view="day">Ngày</button>
        <button class="view-toggle-btn ${curMode === 'week' ? 'active' : ''}" data-view="week">Tuần</button>
        <button class="view-toggle-btn ${curMode === 'month' ? 'active' : ''}" data-view="month">Tháng</button>
      </div>
    `;

    // Bind toolbar buttons
    document.getElementById('btn-toggle-guide')?.addEventListener('click', () => {
      if (this.guideCard) {
        this.guideCard.toggle();
      }
    });

    document.getElementById('btn-cal-today')?.addEventListener('click', () => {
      store.set('selectedDate', new Date());
      this.updateView();
      if (this.miniCalendar) this.miniCalendar.render();
    });

    document.getElementById('btn-cal-prev')?.addEventListener('click', () => this.navigateDate(-1));
    document.getElementById('btn-cal-next')?.addEventListener('click', () => this.navigateDate(1));

    toolbar.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setViewMode(btn.dataset.view);
      });
    });

    // Fetch events & tasks in window
    try {
      const [events, tasks] = await Promise.all([
        api.get('/events', { start: startDt.toISOString(), end: endDt.toISOString() }),
        api.get('/tasks', { is_completed: false })
      ]);

      if (this.activeView && typeof this.activeView.destroy === 'function') {
        this.activeView.destroy();
      }

      const expandedEvents = RRuleParser.expandAll(events || [], startDt, endDt);
      const adaptedTasks = adaptTasksForCalendar(tasks || []);

      const defaultCal = (store.get('calendars') || []).find(c => c.is_default);
      const viewOptions = {
        date: curDate,
        events: expandedEvents,
        tasks: adaptedTasks,
        defaultCalendarId: defaultCal?.id,
        onRefresh: () => this.updateView()
      };

      if (curMode === 'day') {
        this.activeView = new DayView(viewContainer, viewOptions);
      } else if (curMode === 'month') {
        this.activeView = new MonthView(viewContainer, viewOptions);
      } else {
        this.activeView = new WeekView(viewContainer, viewOptions);
      }

      this.activeView.render();
    } catch (err) {
      console.warn('Failed to load events:', err);
    }
  },

  navigateDate(direction) {
    const curDate = store.get('selectedDate') || new Date();
    const curMode = store.get('calendarView') || 'week';
    let nextDate;

    if (curMode === 'day') {
      nextDate = addDays(curDate, direction);
    } else if (curMode === 'week') {
      nextDate = addDays(curDate, direction * 7);
    } else {
      nextDate = new Date(curDate.getFullYear(), curDate.getMonth() + direction, 1);
    }

    store.set('selectedDate', nextDate);
    this.updateView();
    if (this.miniCalendar) this.miniCalendar.render();
  },

  setViewMode(mode) {
    store.set('calendarView', mode);
    this.updateView();
  },

  destroy() {
    if (this.handleKeyDown) {
      document.removeEventListener('keydown', this.handleKeyDown);
      this.handleKeyDown = null;
    }
    if (this.handleTaskChanged) {
      document.removeEventListener('task-changed', this.handleTaskChanged);
      this.handleTaskChanged = null;
    }
    if (this.activeView && typeof this.activeView.destroy === 'function') {
      this.activeView.destroy();
      this.activeView = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }
};

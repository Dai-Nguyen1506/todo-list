/**
 * Central State Store & EventBus
 */

class Store {
  constructor() {
    this.state = {
      user: null,
      calendars: [],
      events: [],
      taskLists: [],
      tasks: [],
      currentRoute: 'calendar',
      calendarView: 'week', // 'day' | 'week' | 'month'
      selectedDate: new Date(),
      selectedTask: null,
      theme: localStorage.getItem('theme') || 'light',
      isAiPanelOpen: false
    };
    this.listeners = {};
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    this.emit(key, value, oldValue);
  }

  update(partialState) {
    Object.entries(partialState).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try {
          cb(...args);
        } catch (err) {
          console.error(`Error in event listener for [${event}]:`, err);
        }
      });
    }
  }
}

export const store = new Store();

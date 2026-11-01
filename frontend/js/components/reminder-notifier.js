/**
 * Background Reminder & Notification Service
 * Polls upcoming events and tasks every 30 seconds to alert users.
 */
import { api } from '../api.js';
import { store } from '../store.js';
import { Toast } from './toast.js';
import { formatDate } from '../utils/date.js';

export class ReminderNotifier {
  static intervalId = null;
  static notifiedSet = new Set();
  static isRunning = false;

  static start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Load notified cache from session
    try {
      const cached = sessionStorage.getItem('planify_notified_reminders');
      if (cached) {
        JSON.parse(cached).forEach(id => this.notifiedSet.add(id));
      }
    } catch (_) {}

    // Request notification permission if supported
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    // Run first check after 3 seconds, then every 30s
    setTimeout(() => this.check(), 3000);
    this.intervalId = setInterval(() => this.check(), 30000);
  }

  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  static playChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (_) {}
  }

  static notify(title, body) {
    this.playChime();
    Toast.warning(`${title}: ${body}`, 8000);

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico'
        });
      } catch (_) {}
    }
  }

  static markNotified(key) {
    this.notifiedSet.add(key);
    try {
      sessionStorage.setItem('planify_notified_reminders', JSON.stringify(Array.from(this.notifiedSet)));
    } catch (_) {}
  }

  static async check() {
    const user = store.get('user');
    if (!user) return;

    const now = new Date();
    const nowMs = now.getTime();
    const fifteenMinsAgo = nowMs - 15 * 60 * 1000;

    try {
      // 1. Check Tasks with reminder_at or due_time
      const tasks = await api.get('/tasks', { is_completed: false });
      if (Array.isArray(tasks)) {
        for (const t of tasks) {
          if (t.is_completed) continue;

          // Check reminder_at
          if (t.reminder_at) {
            const remTime = new Date(t.reminder_at).getTime();
            const key = `task-rem-${t.id}-${remTime}`;
            if (!this.notifiedSet.has(key) && remTime <= nowMs && remTime >= fifteenMinsAgo) {
              this.markNotified(key);
              this.notify('🔔 Nhắc nhở công việc', t.title);
            }
          }

          // Check timed task start_time today
          if (t.due_date && t.start_time && !t.is_all_day) {
            const dateStr = typeof t.due_date === 'string' ? t.due_date.split('T')[0] : '';
            const timeStr = String(t.start_time).substring(0, 5);
            const startAt = new Date(`${dateStr}T${timeStr}:00`).getTime();
            const key = `task-start-${t.id}-${dateStr}`;

            // Alert 5 minutes before or at start time
            if (!this.notifiedSet.has(key) && nowMs >= startAt - 5 * 60 * 1000 && nowMs <= startAt + 10 * 60 * 1000) {
              this.markNotified(key);
              this.notify('⏰ Sắp đến giờ làm việc', `"${t.title}" lúc ${timeStr}`);
            }
          }
        }
      }

      // 2. Check Events
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const events = await api.get('/events', {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
      });

      if (Array.isArray(events)) {
        for (const ev of events) {
          if (ev.is_cancelled) continue;
          const evStart = new Date(ev.start_at).getTime();

          // Standard check: 10 mins before event
          const remMinutes = (ev.reminders && ev.reminders.length > 0)
            ? ev.reminders[0].minutes_before
            : 10;

          const alertTime = evStart - remMinutes * 60 * 1000;
          const key = `event-${ev.id}-${evStart}`;

          if (!this.notifiedSet.has(key) && nowMs >= alertTime && nowMs <= evStart + 5 * 60 * 1000) {
            this.markNotified(key);
            const timeStr = formatDate(ev.start_at, 'HH:mm');
            this.notify('📅 Sự kiện sắp diễn ra', `"${ev.title}" lúc ${timeStr}`);
          }
        }
      }
    } catch (err) {
      // Background silent fallback
    }
  }
}


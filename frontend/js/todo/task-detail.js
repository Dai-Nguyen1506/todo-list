import { createElement } from '../utils/dom.js';
import { api } from '../api.js';
import { Toast } from '../components/toast.js';
import { store } from '../store.js';
import { formatDate } from '../utils/date.js';

export class TaskDetail {
  constructor(container, { onUpdate = null, onClose = null } = {}) {
    this.container = container;
    this.onUpdate = onUpdate;
    this.onClose = onClose;
    this.task = null;
  }

  show(task) {
    this.task = task;
    this.render();
  }

  hide() {
    this.task = null;
    this.container.innerHTML = '';
  }

  render() {
    if (!this.task) {
      this.hide();
      return;
    }

    const t = this.task;
    const taskLists = store.get('taskLists') || [];
    this.container.innerHTML = '';

    const panel = createElement('div', {
      className: 'task-detail-panel',
      style: { height: '100%', overflowY: 'auto', padding: 'var(--space-lg)' }
    });

    // 1. Header (Close button & Created timestamp)
    const header = createElement('div', {
      className: 'flex items-center justify-between',
      style: { marginBottom: '16px' }
    }, [
      createElement('span', {
        style: { fontSize: '11px', color: 'var(--color-text-tertiary)' },
        textContent: `Tạo lúc: ${formatDate(t.created_at, 'HH:mm DD/MM/YYYY')}`
      }),
      createElement('button', {
        className: 'btn-icon',
        innerHTML: '&times;',
        title: 'Đóng chi tiết',
        onclick: () => {
          this.hide();
          if (this.onClose) this.onClose();
        }
      })
    ]);

    // 2. Title Row (Checkbox + Title edit)
    const titleRow = createElement('div', {
      className: 'flex items-center gap-sm',
      style: { marginBottom: '16px' }
    });

    const checkbox = createElement('div', {
      className: 'task-checkbox',
      onclick: async () => {
        const nextState = !t.is_completed;
        await api.patch(`/tasks/${t.id}/complete`, { is_completed: nextState });
        t.is_completed = nextState;
        this.render();
        if (this.onUpdate) this.onUpdate();
      }
    }, [
      t.is_completed ? createElement('span', { style: { color: '#fff', fontSize: '12px' }, textContent: '✓' }) : null
    ]);

    const titleInput = createElement('input', {
      type: 'text',
      className: 'input flex-1',
      value: t.title,
      style: { fontWeight: '600', textDecoration: t.is_completed ? 'line-through' : 'none' },
      onchange: async () => {
        const val = titleInput.value.trim();
        if (val) {
          await api.put(`/tasks/${t.id}`, { title: val });
          t.title = val;
          if (this.onUpdate) this.onUpdate();
        }
      }
    });

    const starBtn = createElement('button', {
      className: `task-star-btn ${t.is_important ? 'starred' : ''}`,
      innerHTML: t.is_important ? '&#9733;' : '&#9734;',
      onclick: async () => {
        const nextState = !t.is_important;
        await api.patch(`/tasks/${t.id}/important`, { is_important: nextState });
        t.is_important = nextState;
        this.render();
        if (this.onUpdate) this.onUpdate();
      }
    });

    titleRow.appendChild(checkbox);
    titleRow.appendChild(titleInput);
    titleRow.appendChild(starBtn);

    // 3. Steps (Subtasks) List
    const stepsSection = createElement('div', {
      className: 'flex flex-col gap-xs',
      style: { marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border-light)' }
    });

    const stepsTitle = createElement('div', {
      style: { fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '4px' },
      textContent: `Các bước (${t.steps?.filter(s => s.is_completed).length || 0}/${t.steps?.length || 0})`
    });
    stepsSection.appendChild(stepsTitle);

    (t.steps || []).forEach(step => {
      const stepRow = createElement('div', {
        className: 'flex items-center gap-sm',
        style: { padding: '4px 0' }
      });

      const stepCheck = createElement('input', {
        type: 'checkbox',
        checked: step.is_completed,
        onchange: async (e) => {
          step.is_completed = e.target.checked;
          await api.patch(`/tasks/${t.id}/steps/${step.id}/complete`, { is_completed: step.is_completed });
          this.render();
          if (this.onUpdate) this.onUpdate();
        }
      });

      const stepText = createElement('input', {
        type: 'text',
        className: 'input flex-1',
        value: step.title,
        style: {
          padding: '4px 8px',
          fontSize: '12px',
          textDecoration: step.is_completed ? 'line-through' : 'none'
        },
        onchange: async () => {
          const val = stepText.value.trim();
          if (val) {
            await api.put(`/tasks/${t.id}/steps/${step.id}`, { title: val });
            step.title = val;
          }
        }
      });

      const stepDelBtn = createElement('button', {
        className: 'btn-icon',
        style: { width: '24px', height: '24px', fontSize: '12px' },
        innerHTML: '&times;',
        onclick: async () => {
          await api.delete(`/tasks/${t.id}/steps/${step.id}`);
          t.steps = t.steps.filter(s => s.id !== step.id);
          this.render();
          if (this.onUpdate) this.onUpdate();
        }
      });

      stepRow.appendChild(stepCheck);
      stepRow.appendChild(stepText);
      stepRow.appendChild(stepDelBtn);
      stepsSection.appendChild(stepRow);
    });

    // Add new step input
    const addStepInput = createElement('input', {
      type: 'text',
      className: 'input',
      placeholder: '+ Thêm bước tiếp theo...',
      style: { fontSize: '12px', marginTop: '4px' },
      onkeydown: async (e) => {
        if (e.key === 'Enter') {
          const val = addStepInput.value.trim();
          if (val) {
            const newStep = await api.post(`/tasks/${t.id}/steps`, { title: val });
            if (!t.steps) t.steps = [];
            t.steps.push(newStep);
            addStepInput.value = '';
            this.render();
            if (this.onUpdate) this.onUpdate();
          }
        }
      }
    });
    stepsSection.appendChild(addStepInput);

    // 4. Quick Actions Group
    const actionsGroup = createElement('div', {
      className: 'flex flex-col gap-sm',
      style: { marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border-light)' }
    });

    // Toggle My Day
    const myDayBtn = createElement('button', {
      className: 'btn btn-secondary',
      style: { justifyContent: 'flex-start' },
      textContent: t.is_in_my_day ? '☀️ Đã thêm vào My Day' : '☀️ Thêm vào My Day',
      onclick: async () => {
        const nextState = !t.is_in_my_day;
        await api.patch(`/tasks/${t.id}/my-day`, { is_in_my_day: nextState });
        t.is_in_my_day = nextState;
        this.render();
        if (this.onUpdate) this.onUpdate();
      }
    });

    // Due Date input
    const dueRow = createElement('div', { className: 'form-group' }, [
      createElement('label', { className: 'form-label', textContent: '📅 Hạn chót' }),
      createElement('input', {
        type: 'date',
        className: 'input',
        value: t.due_date || '',
        onchange: async (e) => {
          const val = e.target.value || null;
          await api.put(`/tasks/${t.id}`, { due_date: val });
          t.due_date = val;
          if (this.onUpdate) this.onUpdate();
        }
      })
    ]);

    // Recurrence select
    const recurRow = createElement('div', { className: 'form-group' }, [
      createElement('label', { className: 'form-label', textContent: '🔄 Lặp lại' }),
      createElement('select', {
        className: 'select',
        onchange: async (e) => {
          const val = e.target.value || null;
          await api.put(`/tasks/${t.id}`, { recurrence_rule: val });
          t.recurrence_rule = val;
          if (this.onUpdate) this.onUpdate();
        }
      }, [
        createElement('option', { value: '', textContent: 'Không lặp lại', selected: !t.recurrence_rule }),
        createElement('option', { value: 'FREQ=DAILY', textContent: 'Hàng ngày', selected: t.recurrence_rule === 'FREQ=DAILY' }),
        createElement('option', { value: 'FREQ=WEEKLY', textContent: 'Hàng tuần', selected: t.recurrence_rule === 'FREQ=WEEKLY' }),
        createElement('option', { value: 'FREQ=MONTHLY', textContent: 'Hàng tháng', selected: t.recurrence_rule === 'FREQ=MONTHLY' })
      ])
    ]);

    // List Move selector
    const listRow = createElement('div', { className: 'form-group' }, [
      createElement('label', { className: 'form-label', textContent: '📁 Thuộc danh sách' }),
      createElement('select', {
        className: 'select',
        onchange: async (e) => {
          const val = parseInt(e.target.value, 10);
          await api.put(`/tasks/${t.id}`, { list_id: val });
          t.list_id = val;
          if (this.onUpdate) this.onUpdate();
        }
      }, taskLists.map(l => createElement('option', {
        value: l.id,
        textContent: l.name,
        selected: t.list_id === l.id
      })))
    ]);

    actionsGroup.appendChild(myDayBtn);
    actionsGroup.appendChild(dueRow);

    // Time-blocking section (Calendar synchronization)
    const isAllDay = t.is_all_day !== false;
    const startTimeVal = t.start_time ? String(t.start_time).substring(0, 5) : '';
    const endTimeVal = t.end_time ? String(t.end_time).substring(0, 5) : '';

    const timeBlockSection = createElement('div', {
      className: 'form-group',
      style: {
        padding: '10px 12px',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border-light)'
      }
    });

    const timeBlockHeader = createElement('div', {
      className: 'flex items-center justify-between',
      style: { marginBottom: isAllDay ? '0' : '8px' }
    }, [
      createElement('label', {
        className: 'form-label',
        style: { marginBottom: 0, fontWeight: '600' },
        textContent: '⏰ Khung giờ (Time-Blocking)'
      }),
      createElement('label', {
        className: 'flex items-center gap-xs cursor-pointer',
        style: { fontSize: '12px' }
      }, [
        createElement('input', {
          type: 'checkbox',
          checked: isAllDay,
          onchange: async (e) => {
            const nextAllDay = e.target.checked;
            const updates = { is_all_day: nextAllDay };
            if (!nextAllDay && !t.start_time) {
              updates.start_time = '09:00';
              updates.duration_minutes = 60;
              if (!t.due_date) updates.due_date = formatDate(new Date(), 'YYYY-MM-DD');
            }
            await api.put(`/tasks/${t.id}`, updates);
            Object.assign(t, updates);
            this.render();
            document.dispatchEvent(new CustomEvent('task-changed', { detail: { action: 'update', task: t } }));
            if (this.onUpdate) this.onUpdate();
          }
        }),
        createElement('span', { textContent: 'Cả ngày' })
      ])
    ]);
    timeBlockSection.appendChild(timeBlockHeader);

    if (!isAllDay) {
      const timeInputsRow = createElement('div', {
        className: 'flex items-center gap-sm',
        style: { marginTop: '8px' }
      }, [
        createElement('div', { className: 'flex-1' }, [
          createElement('label', { style: { fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '2px' }, textContent: 'Bắt đầu' }),
          createElement('input', {
            type: 'time',
            className: 'input',
            value: startTimeVal || '09:00',
            onchange: async (e) => {
              const val = e.target.value;
              await api.put(`/tasks/${t.id}`, { start_time: val });
              t.start_time = val;
              document.dispatchEvent(new CustomEvent('task-changed', { detail: { action: 'update', task: t } }));
              if (this.onUpdate) this.onUpdate();
            }
          })
        ]),
        createElement('div', { className: 'flex-1' }, [
          createElement('label', { style: { fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '2px' }, textContent: 'Kết thúc' }),
          createElement('input', {
            type: 'time',
            className: 'input',
            value: endTimeVal || '',
            onchange: async (e) => {
              const val = e.target.value || null;
              await api.put(`/tasks/${t.id}`, { end_time: val });
              t.end_time = val;
              document.dispatchEvent(new CustomEvent('task-changed', { detail: { action: 'update', task: t } }));
              if (this.onUpdate) this.onUpdate();
            }
          })
        ])
      ]);

      const durationRow = createElement('div', {
        className: 'flex items-center justify-between',
        style: { marginTop: '8px', fontSize: '12px' }
      }, [
        createElement('span', { style: { color: 'var(--color-text-secondary)' }, textContent: 'Thời lượng:' }),
        createElement('select', {
          className: 'select',
          style: { width: '130px', padding: '4px 8px' },
          onchange: async (e) => {
            const mins = parseInt(e.target.value, 10);
            await api.put(`/tasks/${t.id}`, { duration_minutes: mins });
            t.duration_minutes = mins;
            document.dispatchEvent(new CustomEvent('task-changed', { detail: { action: 'update', task: t } }));
            if (this.onUpdate) this.onUpdate();
          }
        }, [
          createElement('option', { value: '15', textContent: '15 phút', selected: t.duration_minutes === 15 }),
          createElement('option', { value: '30', textContent: '30 phút', selected: t.duration_minutes === 30 }),
          createElement('option', { value: '45', textContent: '45 phút', selected: t.duration_minutes === 45 }),
          createElement('option', { value: '60', textContent: '60 phút (1h)', selected: !t.duration_minutes || t.duration_minutes === 60 }),
          createElement('option', { value: '90', textContent: '90 phút (1.5h)', selected: t.duration_minutes === 90 }),
          createElement('option', { value: '120', textContent: '120 phút (2h)', selected: t.duration_minutes === 120 })
        ])
      ]);

      const colorRow = createElement('div', {
        className: 'flex items-center justify-between',
        style: { marginTop: '8px', fontSize: '12px' }
      }, [
        createElement('span', { style: { color: 'var(--color-text-secondary)' }, textContent: 'Màu thẻ:' }),
        createElement('div', { className: 'flex items-center gap-xs' }, [
          '#0B8043', '#4F46E5', '#0284C7', '#D97706', '#DC2626', '#9333EA'
        ].map(c => {
          const isSelected = (t.color || '#0B8043').toLowerCase() === c.toLowerCase();
          return createElement('button', {
            style: {
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: c,
              border: isSelected ? '2px solid var(--color-text-primary)' : '2px solid transparent',
              cursor: 'pointer'
            },
            title: c,
            onclick: async () => {
              await api.put(`/tasks/${t.id}`, { color: c });
              t.color = c;
              this.render();
              document.dispatchEvent(new CustomEvent('task-changed', { detail: { action: 'update', task: t } }));
              if (this.onUpdate) this.onUpdate();
            }
          });
        }))
      ]);

      timeBlockSection.appendChild(timeInputsRow);
      timeBlockSection.appendChild(durationRow);
      timeBlockSection.appendChild(colorRow);
    }

    actionsGroup.appendChild(timeBlockSection);
    actionsGroup.appendChild(recurRow);
    actionsGroup.appendChild(listRow);

    // 5. Notes textarea
    const notesSection = createElement('div', {
      className: 'form-group',
      style: { marginBottom: '20px' }
    }, [
      createElement('label', { className: 'form-label', textContent: '📝 Ghi chú' }),
      createElement('textarea', {
        className: 'textarea',
        rows: 4,
        placeholder: 'Thêm ghi chú chi tiết...',
        value: t.note || '',
        onchange: async (e) => {
          const val = e.target.value.trim() || null;
          await api.put(`/tasks/${t.id}`, { note: val });
          t.note = val;
        }
      })
    ]);

    // 6. Delete Button
    const deleteBtn = createElement('button', {
      className: 'btn btn-danger',
      style: { width: '100%', marginTop: 'auto' },
      textContent: '🗑️ Xóa công việc này',
      onclick: async () => {
        if (confirm(`Bạn có chắc chắn muốn xóa "${t.title}"?`)) {
          await api.delete(`/tasks/${t.id}`);
          Toast.success('Đã xóa công việc.');
          this.hide();
          if (this.onUpdate) this.onUpdate();
        }
      }
    });

    panel.appendChild(header);
    panel.appendChild(titleRow);
    panel.appendChild(stepsSection);
    panel.appendChild(actionsGroup);
    panel.appendChild(notesSection);
    panel.appendChild(deleteBtn);

    this.container.appendChild(panel);
  }
}


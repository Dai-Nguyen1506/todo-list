import { createElement } from '../utils/dom.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { api } from '../api.js';
import { store } from '../store.js';
import { formatDate, toLocalISOString } from '../utils/date.js';

export class EventForm {
  /**
   * Quick creation popup (Unified for Event and Task)
   */
  static showQuickCreate({ startAt, endAt, defaultCalendarId, onCreated }) {
    let modalRef = null;
    let activeType = 'event'; // 'event' | 'task'

    const sDate = formatDate(startAt, 'YYYY-MM-DD');
    const sTime = formatDate(startAt, 'HH:mm');
    const eTime = formatDate(endAt, 'HH:mm');

    // Tab buttons
    const tabEventBtn = createElement('button', {
      type: 'button',
      className: 'quick-tab-btn active',
      textContent: '📅 Sự kiện'
    });
    const tabTaskBtn = createElement('button', {
      type: 'button',
      className: 'quick-tab-btn',
      textContent: '✅ Việc cần làm'
    });

    const tabsWrapper = createElement('div', {
      className: 'quick-modal-tabs'
    }, [tabEventBtn, tabTaskBtn]);

    const titleInput = createElement('input', {
      type: 'text',
      className: 'input',
      id: 'quick-create-title',
      placeholder: 'Thêm tiêu đề sự kiện...',
      autofocus: true
    });

    const infoLabel = createElement('div', {
      className: 'quick-modal-info',
      textContent: `📅 ${sDate}  🕐 ${sTime} - ${eTime}`
    });

    tabEventBtn.onclick = () => {
      activeType = 'event';
      tabEventBtn.classList.add('active');
      tabTaskBtn.classList.remove('active');
      titleInput.placeholder = 'Thêm tiêu đề sự kiện...';
      titleInput.focus();
    };

    tabTaskBtn.onclick = () => {
      activeType = 'task';
      tabTaskBtn.classList.add('active');
      tabEventBtn.classList.remove('active');
      titleInput.placeholder = 'Thêm tiêu đề việc cần làm...';
      titleInput.focus();
    };

    const content = createElement('div', { className: 'flex flex-col gap-md' }, [
      tabsWrapper,
      titleInput,
      infoLabel
    ]);

    const footer = createElement('div', { className: 'flex justify-between w-full' }, [
      createElement('button', {
        className: 'btn btn-secondary',
        textContent: 'Thêm chi tiết...',
        onclick: () => {
          modalRef.close();
          const title = titleInput.value.trim();
          this.showFullModal({
            startAt,
            endAt,
            title,
            defaultCalendarId,
            initialType: activeType,
            onCreated
          });
        }
      }),
      createElement('div', { className: 'flex gap-sm' }, [
        createElement('button', {
          className: 'btn btn-secondary',
          textContent: 'Hủy',
          onclick: () => modalRef.close()
        }),
        createElement('button', {
          className: 'btn btn-primary',
          textContent: 'Lưu',
          onclick: async () => {
            const title = titleInput.value.trim();
            if (!title) {
              Toast.error(`Vui lòng nhập tiêu đề ${activeType === 'event' ? 'sự kiện' : 'công việc'}.`);
              return;
            }

            try {
              if (activeType === 'event') {
                const res = await api.post('/events', {
                  title,
                  calendar_id: defaultCalendarId,
                  start_at: toLocalISOString(startAt),
                  end_at: toLocalISOString(endAt)
                });
                Toast.success('Đã tạo sự kiện!');
                window.dispatchEvent(new CustomEvent('planify:data-changed', {
                  detail: { source: 'event-form-quick', action: 'create', type: 'event', id: res?.id }
                }));
                modalRef.close();
                if (onCreated) onCreated(res);
              } else {
                const durMinutes = Math.max(15, Math.round((endAt.getTime() - startAt.getTime()) / 60000));
                const res = await api.post('/tasks', {
                  title,
                  due_date: formatDate(startAt, 'YYYY-MM-DD'),
                  start_time: `${sTime}:00`,
                  end_time: `${eTime}:00`,
                  duration_minutes: durMinutes,
                  is_all_day: false
                });
                Toast.success('Đã tạo việc cần làm!');
                window.dispatchEvent(new CustomEvent('planify:data-changed', {
                  detail: { source: 'event-form-quick', action: 'create', type: 'task', id: res?.id }
                }));
                document.dispatchEvent(new CustomEvent('task-changed', {
                  detail: { action: 'create', taskId: res?.id }
                }));
                modalRef.close();
                if (onCreated) onCreated(res);
              }
            } catch (err) {
              Toast.error(err.message || 'Lỗi khi tạo.');
            }
          }
        })
      ])
    ]);

    modalRef = new Modal({
      title: 'Tạo nhanh',
      content,
      footer,
      width: '420px'
    });
    modalRef.open();

    setTimeout(() => {
      titleInput.focus();
    }, 50);
  }

  /**
   * Unified Creation Modal / Edit Modal (Event vs Task)
   */
  static async showFullModal({
    event = null,
    startAt = null,
    endAt = null,
    title = '',
    defaultCalendarId = null,
    initialType = 'event',
    onCreated = null
  } = {}) {
    let modalRef = null;
    const isEdit = !!event;
    let activeType = initialType; // 'event' | 'task'

    const initialStart = event ? new Date(event.start_at) : (startAt || new Date());
    const initialEnd = event ? new Date(event.end_at) : (endAt || new Date(initialStart.getTime() + 3600000));
    const calendars = store.get('calendars') || [];

    // --- Task Lists for Task form ---
    let taskLists = store.get('taskLists') || [];
    if (taskLists.length === 0) {
      try {
        taskLists = await api.get('/task-lists');
        store.set('taskLists', taskLists || []);
      } catch (e) {
        taskLists = [];
      }
    }

    // Modal dialog outer container
    const dialogContainer = createElement('div', { className: 'unified-modal-container flex flex-col gap-md' });

    // Tab Switcher (Only visible when creating new)
    let tabsHeader = null;
    let eventTabBtn = null;
    let taskTabBtn = null;

    if (!isEdit) {
      eventTabBtn = createElement('button', {
        type: 'button',
        className: `creation-tab-btn ${activeType === 'event' ? 'active' : ''}`,
        textContent: '📅 Sự kiện'
      });
      taskTabBtn = createElement('button', {
        type: 'button',
        className: `creation-tab-btn ${activeType === 'task' ? 'active' : ''}`,
        textContent: '✅ Việc cần làm'
      });

      tabsHeader = createElement('div', { className: 'creation-modal-tabs' }, [
        eventTabBtn,
        taskTabBtn
      ]);
      dialogContainer.appendChild(tabsHeader);
    }

    // ==========================================
    // 1. EVENT FORM SECTION
    // ==========================================
    const eventFormSection = createElement('div', {
      className: 'event-form-section flex flex-col gap-md',
      style: { display: activeType === 'event' ? 'flex' : 'none' }
    });

    const eventTitleInput = createElement('input', {
      type: 'text',
      className: 'input',
      placeholder: 'Thêm tiêu đề sự kiện...',
      value: event ? event.title : title
    });

    const eventStartDateInput = createElement('input', {
      type: 'date',
      className: 'input',
      value: formatDate(initialStart, 'YYYY-MM-DD')
    });
    const eventStartTimeInput = createElement('input', {
      type: 'time',
      className: 'input',
      value: formatDate(initialStart, 'HH:mm')
    });
    const eventEndDateInput = createElement('input', {
      type: 'date',
      className: 'input',
      value: formatDate(initialEnd, 'YYYY-MM-DD')
    });
    const eventEndTimeInput = createElement('input', {
      type: 'time',
      className: 'input',
      value: formatDate(initialEnd, 'HH:mm')
    });

    const eventAllDayCheckbox = createElement('input', {
      type: 'checkbox',
      checked: event ? event.is_all_day : false
    });

    const updateEventTimeInputs = () => {
      const isAll = eventAllDayCheckbox.checked;
      eventStartTimeInput.style.display = isAll ? 'none' : 'block';
      eventEndTimeInput.style.display = isAll ? 'none' : 'block';
    };
    eventAllDayCheckbox.addEventListener('change', updateEventTimeInputs);
    setTimeout(updateEventTimeInputs, 0);

    const calSelect = createElement('select', { className: 'select' });
    calendars.forEach(c => {
      const opt = createElement('option', {
        value: c.id,
        textContent: c.name,
        selected: (event && event.calendar_id === c.id) || (!event && defaultCalendarId === c.id)
      });
      calSelect.appendChild(opt);
    });

    const locationInput = createElement('input', {
      type: 'text',
      className: 'input',
      placeholder: 'Địa điểm (tùy chọn)',
      value: event?.location || ''
    });

    const descTextarea = createElement('textarea', {
      className: 'textarea',
      rows: 3,
      placeholder: 'Mô tả chi tiết...',
      textContent: event?.description || ''
    });

    const recurSelect = createElement('select', { className: 'select' }, [
      createElement('option', { value: '', textContent: 'Không lặp lại' }),
      createElement('option', { value: 'FREQ=DAILY', textContent: 'Hàng ngày' }),
      createElement('option', { value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', textContent: 'Các ngày trong tuần (T2 - T6)' }),
      createElement('option', { value: 'FREQ=WEEKLY', textContent: 'Hàng tuần' }),
      createElement('option', { value: 'FREQ=MONTHLY', textContent: 'Hàng tháng' })
    ]);
    if (event?.recurrence_rule) {
      recurSelect.value = event.recurrence_rule;
    }

    eventFormSection.appendChild(createElement('div', { className: 'form-group' }, [
      createElement('label', { className: 'form-label', textContent: 'Tiêu đề' }),
      eventTitleInput
    ]));
    eventFormSection.appendChild(createElement('div', { className: 'flex gap-sm items-center' }, [
      eventAllDayCheckbox,
      createElement('label', { textContent: 'Cả ngày' })
    ]));
    eventFormSection.appendChild(createElement('div', { className: 'flex gap-sm' }, [
      createElement('div', { className: 'form-group flex-1' }, [
        createElement('label', { className: 'form-label', textContent: 'Bắt đầu' }),
        eventStartDateInput,
        eventStartTimeInput
      ]),
      createElement('div', { className: 'form-group flex-1' }, [
        createElement('label', { className: 'form-label', textContent: 'Kết thúc' }),
        eventEndDateInput,
        eventEndTimeInput
      ])
    ]));
    eventFormSection.appendChild(createElement('div', { className: 'form-group' }, [
      createElement('label', { className: 'form-label', textContent: 'Lặp lại' }),
      recurSelect
    ]));
    eventFormSection.appendChild(createElement('div', { className: 'form-group' }, [
      createElement('label', { className: 'form-label', textContent: 'Chọn lịch' }),
      calSelect
    ]));
    eventFormSection.appendChild(createElement('div', { className: 'form-group' }, [
      createElement('label', { className: 'form-label', textContent: 'Địa điểm' }),
      locationInput
    ]));
    eventFormSection.appendChild(createElement('div', { className: 'form-group' }, [
      createElement('label', { className: 'form-label', textContent: 'Mô tả' }),
      descTextarea
    ]));

    dialogContainer.appendChild(eventFormSection);

    // ==========================================
    // 2. TASK FORM SECTION (Unified Modal)
    // ==========================================
    const taskFormSection = createElement('div', {
      className: 'task-form-section flex flex-col gap-md',
      style: { display: activeType === 'task' ? 'flex' : 'none' }
    });

    const taskTitleInput = createElement('input', {
      type: 'text',
      className: 'input',
      placeholder: 'Thêm việc cần làm...',
      value: (!isEdit ? title : '')
    });

    const taskListSelect = createElement('select', { className: 'select' });
    (taskLists || []).forEach(tl => {
      const opt = createElement('option', {
        value: tl.id,
        textContent: tl.name,
        selected: tl.is_default
      });
      taskListSelect.appendChild(opt);
    });

    const taskDueDateInput = createElement('input', {
      type: 'date',
      className: 'input',
      value: formatDate(initialStart, 'YYYY-MM-DD')
    });

    const isTimedCheckbox = createElement('input', {
      type: 'checkbox',
      checked: true
    });

    const taskStartTimeInput = createElement('input', {
      type: 'time',
      className: 'input',
      value: formatDate(initialStart, 'HH:mm')
    });
    const taskEndTimeInput = createElement('input', {
      type: 'time',
      className: 'input',
      value: formatDate(initialEnd, 'HH:mm')
    });

    const timedSectionWrapper = createElement('div', {
      className: 'flex flex-col gap-xs'
    }, [
      createElement('div', { className: 'flex gap-sm items-center' }, [
        isTimedCheckbox,
        createElement('label', { textContent: 'Đặt khung giờ trên lịch (Time-Blocking)' })
      ]),
      createElement('div', {
        className: 'flex gap-sm',
        id: 'task-time-fields',
        style: { marginTop: '4px' }
      }, [
        createElement('div', { className: 'form-group flex-1' }, [
          createElement('label', { className: 'form-label', textContent: 'Bắt đầu' }),
          taskStartTimeInput
        ]),
        createElement('div', { className: 'form-group flex-1' }, [
          createElement('label', { className: 'form-label', textContent: 'Kết thúc' }),
          taskEndTimeInput
        ])
      ])
    ]);

    isTimedCheckbox.addEventListener('change', () => {
      const timeFields = document.getElementById('task-time-fields');
      if (timeFields) {
        timeFields.style.display = isTimedCheckbox.checked ? 'flex' : 'none';
      }
    });

    // Quick duration pill buttons for task
    const durationPillsWrapper = createElement('div', {
      className: 'flex gap-xs items-center',
      style: { marginTop: '4px' }
    }, [
      createElement('span', { style: { fontSize: '12px', color: 'var(--color-text-tertiary)' }, textContent: 'Thời lượng:' }),
      ...[15, 30, 45, 60, 90, 120].map(mins => {
        return createElement('button', {
          type: 'button',
          className: 'btn btn-secondary btn-sm',
          style: { padding: '2px 8px', fontSize: '11px' },
          textContent: mins >= 60 ? `${mins / 60}h` : `${mins}p`,
          onclick: () => {
            const sVal = taskStartTimeInput.value || '09:00';
            const [sh, sm] = sVal.split(':').map(Number);
            const totalM = sh * 60 + sm + mins;
            const eh = Math.floor(totalM / 60) % 24;
            const em = totalM % 60;
            taskEndTimeInput.value = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
          }
        });
      })
    ]);
    timedSectionWrapper.appendChild(durationPillsWrapper);

    const isImportantCheckbox = createElement('input', { type: 'checkbox' });
    const isMyDayCheckbox = createElement('input', { type: 'checkbox' });

    const taskNoteTextarea = createElement('textarea', {
      className: 'textarea',
      rows: 2,
      placeholder: 'Ghi chú công việc...'
    });

    taskFormSection.appendChild(createElement('div', { className: 'form-group' }, [
      createElement('label', { className: 'form-label', textContent: 'Tiêu đề công việc' }),
      taskTitleInput
    ]));
    taskFormSection.appendChild(createElement('div', { className: 'form-group' }, [
      createElement('label', { className: 'form-label', textContent: 'Danh sách' }),
      taskListSelect
    ]));
    taskFormSection.appendChild(createElement('div', { className: 'form-group' }, [
      createElement('label', { className: 'form-label', textContent: 'Hạn chót' }),
      taskDueDateInput
    ]));
    taskFormSection.appendChild(timedSectionWrapper);
    taskFormSection.appendChild(createElement('div', { className: 'flex gap-md items-center' }, [
      createElement('div', { className: 'flex gap-xs items-center' }, [
        isImportantCheckbox,
        createElement('label', { textContent: '⭐ Đánh dấu quan trọng' })
      ]),
      createElement('div', { className: 'flex gap-xs items-center' }, [
        isMyDayCheckbox,
        createElement('label', { textContent: '☀️ Thêm vào Ngày của tôi' })
      ])
    ]));
    taskFormSection.appendChild(createElement('div', { className: 'form-group' }, [
      createElement('label', { className: 'form-label', textContent: 'Ghi chú' }),
      taskNoteTextarea
    ]));

    dialogContainer.appendChild(taskFormSection);

    // Tab switching event listeners
    if (eventTabBtn && taskTabBtn) {
      eventTabBtn.onclick = () => {
        activeType = 'event';
        eventTabBtn.classList.add('active');
        taskTabBtn.classList.remove('active');
        eventFormSection.style.display = 'flex';
        taskFormSection.style.display = 'none';
        submitBtn.textContent = 'Lưu sự kiện';
        eventTitleInput.focus();
      };
      taskTabBtn.onclick = () => {
        activeType = 'task';
        taskTabBtn.classList.add('active');
        eventTabBtn.classList.remove('active');
        taskFormSection.style.display = 'flex';
        eventFormSection.style.display = 'none';
        submitBtn.textContent = 'Lưu công việc';
        taskTitleInput.focus();
      };
    }

    // ==========================================
    // 3. MODAL FOOTER & SAVE HANDLER
    // ==========================================
    const submitBtn = createElement('button', {
      className: 'btn btn-primary',
      textContent: isEdit ? 'Cập nhật' : (activeType === 'event' ? 'Lưu sự kiện' : 'Lưu công việc')
    });

    submitBtn.onclick = async () => {
      if (activeType === 'event') {
        // --- Save Event ---
        const titleVal = eventTitleInput.value.trim();
        if (!titleVal) {
          Toast.error('Vui lòng nhập tiêu đề sự kiện.');
          return;
        }

        const isAllDay = eventAllDayCheckbox.checked;
        let startAtIso, endAtIso;

        if (isAllDay) {
          startAtIso = toLocalISOString(new Date(`${eventStartDateInput.value}T00:00:00`));
          endAtIso = toLocalISOString(new Date(`${eventEndDateInput.value}T23:59:59`));
        } else {
          const sTime = eventStartTimeInput.value || '09:00';
          const eTime = eventEndTimeInput.value || '10:00';
          startAtIso = toLocalISOString(new Date(`${eventStartDateInput.value}T${sTime}:00`));
          endAtIso = toLocalISOString(new Date(`${eventEndDateInput.value}T${eTime}:00`));
        }

        const payload = {
          calendar_id: parseInt(calSelect.value, 10),
          title: titleVal,
          location: locationInput.value.trim() || null,
          description: descTextarea.value.trim() || null,
          start_at: startAtIso,
          end_at: endAtIso,
          is_all_day: isAllDay,
          recurrence_rule: recurSelect.value || null
        };

        const isRecurring = !!(isEdit && event && (event.recurrence_rule || event.parent_event_id || event.is_occurrence));

        if (isRecurring) {
          EventForm.showRecurrenceScopeModal({
            action: 'update',
            onConfirm: async (scope) => {
              try {
                const targetId = event.parent_event_id || event.id;
                const occDateStr = toLocalISOString(initialStart);
                const updatePayload = {
                  ...payload,
                  scope,
                  original_start: occDateStr
                };
                await api.put(`/events/${targetId}`, updatePayload);
                Toast.success('Đã cập nhật sự kiện.');
                window.dispatchEvent(new CustomEvent('planify:data-changed', {
                  detail: { source: 'event-form', action: 'update', type: 'event', id: targetId }
                }));
                modalRef.close();
                if (onCreated) onCreated();
              } catch (err) {
                Toast.error(err.message || 'Lỗi xử lý sự kiện.');
              }
            }
          });
        } else {
          try {
            if (isEdit) {
              await api.put(`/events/${event.id}`, payload);
              Toast.success('Đã cập nhật sự kiện.');
              window.dispatchEvent(new CustomEvent('planify:data-changed', {
                detail: { source: 'event-form', action: 'update', type: 'event', id: event.id }
              }));
            } else {
              const createdEv = await api.post('/events', payload);
              Toast.success('Đã tạo sự kiện mới.');
              window.dispatchEvent(new CustomEvent('planify:data-changed', {
                detail: { source: 'event-form', action: 'create', type: 'event', id: createdEv?.id }
              }));
            }
            modalRef.close();
            if (onCreated) onCreated();
          } catch (err) {
            Toast.error(err.message || 'Lỗi xử lý sự kiện.');
          }
        }
      } else {
        // --- Save Task ---
        const taskTitle = taskTitleInput.value.trim();
        if (!taskTitle) {
          Toast.error('Vui lòng nhập tiêu đề việc cần làm.');
          return;
        }

        const isTimed = isTimedCheckbox.checked;
        const listIdVal = parseInt(taskListSelect.value, 10);
        const sTime = taskStartTimeInput.value || '09:00';
        const eTime = taskEndTimeInput.value || '10:00';

        let durMinutes = 60;
        if (isTimed) {
          const [sh, sm] = sTime.split(':').map(Number);
          const [eh, em] = eTime.split(':').map(Number);
          const diff = (eh * 60 + em) - (sh * 60 + sm);
          durMinutes = Math.max(15, diff > 0 ? diff : 60);
        }

        const taskPayload = {
          title: taskTitle,
          list_id: isNaN(listIdVal) ? null : listIdVal,
          due_date: taskDueDateInput.value || formatDate(initialStart, 'YYYY-MM-DD'),
          start_time: isTimed ? `${sTime}:00` : null,
          end_time: isTimed ? `${eTime}:00` : null,
          duration_minutes: durMinutes,
          is_all_day: !isTimed,
          is_important: isImportantCheckbox.checked,
          is_in_my_day: isMyDayCheckbox.checked,
          note: taskNoteTextarea.value.trim() || null
        };

        try {
          const res = await api.post('/tasks', taskPayload);
          Toast.success('Đã tạo việc cần làm!');
          window.dispatchEvent(new CustomEvent('planify:data-changed', {
            detail: { source: 'event-form', action: 'create', type: 'task', id: res?.id }
          }));
          document.dispatchEvent(new CustomEvent('task-changed', {
            detail: { action: 'create', taskId: res?.id }
          }));
          modalRef.close();
          if (onCreated) onCreated(res);
        } catch (err) {
          Toast.error(err.message || 'Lỗi khi tạo việc cần làm.');
        }
      }
    };

    const footer = createElement('div', { className: 'flex justify-between w-full' }, [
      isEdit ? createElement('button', {
        className: 'btn btn-danger',
        textContent: 'Xóa sự kiện',
        onclick: () => {
          const isRecurring = !!(event && (event.recurrence_rule || event.parent_event_id || event.is_occurrence));
          if (isRecurring) {
            EventForm.showRecurrenceScopeModal({
              action: 'delete',
              onConfirm: async (scope) => {
                try {
                  const targetId = event.parent_event_id || event.id;
                  const occDateStr = toLocalISOString(initialStart);
                  let endpoint = `/events/${targetId}?scope=${scope}`;
                  if (scope === 'this' || scope === 'following') {
                    endpoint += `&occurrence_date=${encodeURIComponent(occDateStr)}`;
                  }
                  await api.delete(endpoint);
                  Toast.success('Đã xóa sự kiện.');
                  window.dispatchEvent(new CustomEvent('planify:data-changed', {
                    detail: { source: 'event-form', action: 'delete', type: 'event', id: targetId }
                  }));
                  modalRef.close();
                  if (onCreated) onCreated();
                } catch (err) {
                  Toast.error(err.message || 'Lỗi khi xóa sự kiện.');
                }
              }
            });
          } else {
            if (confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
              api.delete(`/events/${event.id}`)
                .then(() => {
                  Toast.success('Đã xóa sự kiện.');
                  window.dispatchEvent(new CustomEvent('planify:data-changed', {
                    detail: { source: 'event-form', action: 'delete', type: 'event', id: event.id }
                  }));
                  modalRef.close();
                  if (onCreated) onCreated();
                })
                .catch(err => {
                  Toast.error(err.message || 'Lỗi khi xóa.');
                });
            }
          }
        }
      }) : createElement('span'),
      createElement('div', { className: 'flex gap-sm' }, [
        createElement('button', {
          className: 'btn btn-secondary',
          textContent: 'Hủy',
          onclick: () => modalRef.close()
        }),
        submitBtn
      ])
    ]);

    modalRef = new Modal({
      title: isEdit ? 'Chỉnh sửa sự kiện' : 'Tạo mới',
      content: dialogContainer,
      footer,
      width: '560px'
    });
    modalRef.open();
  }

  /**
   * Recurrence scope selection dialog (this, following, all)
   */
  static showRecurrenceScopeModal({ action = 'update', onConfirm }) {
    const isDelete = action === 'delete';
    const title = isDelete ? 'Xóa sự kiện định kỳ' : 'Chỉnh sửa sự kiện định kỳ';

    const options = [
      {
        value: 'this',
        title: 'Chỉ sự kiện này',
        desc: isDelete
          ? 'Chỉ xóa sự kiện vào ngày này, các sự kiện khác trong chuỗi giữ nguyên.'
          : 'Chỉ áp dụng cho lần lặp này. Các sự kiện khác trong chuỗi giữ nguyên.'
      },
      {
        value: 'following',
        title: 'Sự kiện này và các sự kiện tiếp theo',
        desc: isDelete
          ? 'Xóa sự kiện này và tất cả các lần lặp tiếp theo trong chuỗi.'
          : 'Áp dụng cho sự kiện này và tất cả các lần lặp tiếp theo.'
      },
      {
        value: 'all',
        title: 'Tất cả sự kiện trong chuỗi',
        desc: isDelete
          ? 'Xóa toàn bộ chuỗi sự kiện lặp lại này.'
          : 'Áp dụng cho mọi sự kiện trong chuỗi.'
      }
    ];

    let selectedScope = 'this';

    const container = createElement('div', { className: 'recurrence-scope-dialog' });
    const promptText = createElement('p', {
      className: 'recurrence-scope-prompt',
      textContent: isDelete
        ? 'Bạn muốn xóa sự kiện nào trong chuỗi lặp lại này?'
        : 'Bạn muốn lưu thay đổi cho những sự kiện nào trong chuỗi lặp lại?'
    });
    container.appendChild(promptText);

    const optionsList = createElement('div', { className: 'recurrence-scope-options' });

    options.forEach((opt, idx) => {
      const radioInput = createElement('input', {
        type: 'radio',
        name: 'recurrence_scope',
        value: opt.value,
        id: `scope-opt-${opt.value}`,
        checked: idx === 0
      });

      radioInput.addEventListener('change', () => {
        if (radioInput.checked) selectedScope = opt.value;
      });

      const label = createElement('label', {
        className: 'recurrence-scope-option',
        htmlFor: `scope-opt-${opt.value}`
      }, [
        radioInput,
        createElement('div', { className: 'scope-text' }, [
          createElement('div', { className: 'scope-title', textContent: opt.title }),
          createElement('div', { className: 'scope-desc', textContent: opt.desc })
        ])
      ]);

      optionsList.appendChild(label);
    });

    container.appendChild(optionsList);

    let scopeModalRef = null;

    const footer = createElement('div', { className: 'flex justify-end gap-sm w-full' }, [
      createElement('button', {
        className: 'btn btn-secondary',
        textContent: 'Hủy',
        onclick: () => scopeModalRef.close()
      }),
      createElement('button', {
        className: `btn ${isDelete ? 'btn-danger' : 'btn-primary'}`,
        textContent: isDelete ? 'Xác nhận xóa' : 'Lưu thay đổi',
        onclick: async () => {
          scopeModalRef.close();
          if (onConfirm) await onConfirm(selectedScope);
        }
      })
    ]);

    scopeModalRef = new Modal({
      title,
      content: container,
      footer,
      width: '460px'
    });
    scopeModalRef.open();
  }
}

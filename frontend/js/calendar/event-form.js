import { createElement } from '../utils/dom.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { api } from '../api.js';
import { store } from '../store.js';
import { formatDate } from '../utils/date.js';

export class EventForm {
  /**
   * Quick event creation popup
   */
  static showQuickCreate({ startAt, endAt, defaultCalendarId, onCreated }) {
    let modalRef = null;
    const sDate = formatDate(startAt, 'YYYY-MM-DD');
    const sTime = formatDate(startAt, 'HH:mm');
    const eTime = formatDate(endAt, 'HH:mm');

    const content = createElement('div', { className: 'flex flex-col gap-md' }, [
      createElement('input', {
        type: 'text',
        className: 'input',
        id: 'quick-event-title',
        placeholder: 'Thêm tiêu đề sự kiện...',
        autofocus: true
      }),
      createElement('div', {
        style: { fontSize: '13px', color: 'var(--color-text-secondary)' },
        textContent: `📅 ${sDate}  🕐 ${sTime} - ${eTime}`
      })
    ]);

    const footer = createElement('div', { className: 'flex justify-between w-full' }, [
      createElement('button', {
        className: 'btn btn-secondary',
        textContent: 'Thêm chi tiết...',
        onclick: () => {
          modalRef.close();
          const title = document.getElementById('quick-event-title')?.value || '';
          this.showFullModal({ startAt, endAt, title, defaultCalendarId, onCreated });
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
            const title = document.getElementById('quick-event-title')?.value.trim();
            if (!title) {
              Toast.error('Vui lòng nhập tiêu đề sự kiện.');
              return;
            }
            try {
              const res = await api.post('/events', {
                title,
                calendar_id: defaultCalendarId,
                start_at: startAt.toISOString(),
                end_at: endAt.toISOString()
              });
              Toast.success('Đã tạo sự kiện!');
              modalRef.close();
              if (onCreated) onCreated(res);
            } catch (err) {
              Toast.error(err.message || 'Lỗi tạo sự kiện.');
            }
          }
        })
      ])
    ]);

    modalRef = new Modal({
      title: 'Tạo nhanh sự kiện',
      content,
      footer,
      width: '420px'
    });
    modalRef.open();

    setTimeout(() => {
      document.getElementById('quick-event-title')?.focus();
    }, 50);
  }

  /**
   * Full modal detail form for creating or editing an event
   */
  static showFullModal({ event = null, startAt = null, endAt = null, title = '', defaultCalendarId = null, onCreated = null } = {}) {
    let modalRef = null;
    const isEdit = !!event;

    const initialStart = event ? new Date(event.start_at) : (startAt || new Date());
    const initialEnd = event ? new Date(event.end_at) : (endAt || new Date(initialStart.getTime() + 3600000));
    const calendars = store.get('calendars') || [];

    // Title input
    const titleInput = createElement('input', {
      type: 'text',
      className: 'input',
      placeholder: 'Thêm tiêu đề...',
      value: event ? event.title : title
    });

    // Date & Time inputs
    const startDateInput = createElement('input', {
      type: 'date',
      className: 'input',
      value: formatDate(initialStart, 'YYYY-MM-DD')
    });
    const startTimeInput = createElement('input', {
      type: 'time',
      className: 'input',
      value: formatDate(initialStart, 'HH:mm')
    });
    const endDateInput = createElement('input', {
      type: 'date',
      className: 'input',
      value: formatDate(initialEnd, 'YYYY-MM-DD')
    });
    const endTimeInput = createElement('input', {
      type: 'time',
      className: 'input',
      value: formatDate(initialEnd, 'HH:mm')
    });

    // All day checkbox with reactive time input visibility
    const allDayCheckbox = createElement('input', {
      type: 'checkbox',
      checked: event ? event.is_all_day : false
    });

    const updateTimeInputsVisibility = () => {
      const isAllDay = allDayCheckbox.checked;
      startTimeInput.style.display = isAllDay ? 'none' : 'block';
      endTimeInput.style.display = isAllDay ? 'none' : 'block';
    };
    allDayCheckbox.addEventListener('change', updateTimeInputsVisibility);
    setTimeout(updateTimeInputsVisibility, 0);

    // Calendar select
    const calSelect = createElement('select', { className: 'select' });
    calendars.forEach(c => {
      const opt = createElement('option', {
        value: c.id,
        textContent: c.name,
        selected: (event && event.calendar_id === c.id) || (!event && defaultCalendarId === c.id)
      });
      calSelect.appendChild(opt);
    });

    // Location & Description
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

    // Recurrence select
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

    const content = createElement('div', { className: 'flex flex-col gap-md' }, [
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Tiêu đề' }),
        titleInput
      ]),
      createElement('div', { className: 'flex gap-sm items-center' }, [
        allDayCheckbox,
        createElement('label', { textContent: 'Cả ngày' })
      ]),
      createElement('div', { className: 'flex gap-sm' }, [
        createElement('div', { className: 'form-group flex-1' }, [
          createElement('label', { className: 'form-label', textContent: 'Bắt đầu' }),
          startDateInput,
          startTimeInput
        ]),
        createElement('div', { className: 'form-group flex-1' }, [
          createElement('label', { className: 'form-label', textContent: 'Kết thúc' }),
          endDateInput,
          endTimeInput
        ])
      ]),
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Lặp lại' }),
        recurSelect
      ]),
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Chọn lịch' }),
        calSelect
      ]),
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Địa điểm' }),
        locationInput
      ]),
      createElement('div', { className: 'form-group' }, [
        createElement('label', { className: 'form-label', textContent: 'Mô tả' }),
        descTextarea
      ])
    ]);

    const footer = createElement('div', { className: 'flex justify-between w-full' }, [
      isEdit ? createElement('button', {
        className: 'btn btn-danger',
        textContent: 'Xóa sự kiện',
        onclick: async () => {
          let deleteMsg = 'Bạn có chắc chắn muốn xóa sự kiện này?';
          if (event.recurrence_rule) {
            deleteMsg = '⚠️ Đây là chuỗi sự kiện lặp lại.\nBạn có chắc chắn muốn xóa toàn bộ chuỗi sự kiện này không?';
          }
          if (confirm(deleteMsg)) {
            try {
              await api.delete(`/events/${event.id}`);
              Toast.success('Đã xóa sự kiện.');
              modalRef.close();
              if (onCreated) onCreated();
            } catch (err) {
              Toast.error(err.message || 'Lỗi khi xóa.');
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
        createElement('button', {
          className: 'btn btn-primary',
          textContent: isEdit ? 'Cập nhật' : 'Lưu',
          onclick: async () => {
            const titleVal = titleInput.value.trim();
            if (!titleVal) {
              Toast.error('Vui lòng nhập tiêu đề sự kiện.');
              return;
            }

            const isAllDay = allDayCheckbox.checked;
            let startAtIso, endAtIso;

            if (isAllDay) {
              startAtIso = new Date(`${startDateInput.value}T00:00:00`).toISOString();
              endAtIso = new Date(`${endDateInput.value}T23:59:59`).toISOString();
            } else {
              const sTime = startTimeInput.value || '09:00';
              const eTime = endTimeInput.value || '10:00';
              startAtIso = new Date(`${startDateInput.value}T${sTime}:00`).toISOString();
              endAtIso = new Date(`${endDateInput.value}T${eTime}:00`).toISOString();
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

            try {
              if (isEdit) {
                await api.put(`/events/${event.id}`, payload);
                Toast.success('Đã cập nhật sự kiện.');
              } else {
                await api.post('/events', payload);
                Toast.success('Đã tạo sự kiện mới.');
              }
              modalRef.close();
              if (onCreated) onCreated();
            } catch (err) {
              Toast.error(err.message || 'Lỗi xử lý sự kiện.');
            }
          }
        })
      ])
    ]);

    modalRef = new Modal({
      title: isEdit ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện chi tiết',
      content,
      footer,
      width: '560px'
    });
    modalRef.open();
  }
}


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_event",
            "description": "Tạo sự kiện mới trên lịch của người dùng. Sử dụng khi người dùng muốn đặt lịch, thêm cuộc họp, hẹn hò hoặc sự kiện.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Tiêu đề của sự kiện"},
                    "start_at": {"type": "string", "description": "Thời gian bắt đầu theo định dạng ISO 8601 (VD: 2026-11-02T09:00:00)"},
                    "end_at": {"type": "string", "description": "Thời gian kết thúc theo định dạng ISO 8601 (VD: 2026-11-02T10:00:00)"},
                    "description": {"type": "string", "description": "Mô tả chi tiết về sự kiện"},
                    "location": {"type": "string", "description": "Địa điểm diễn ra sự kiện"},
                    "is_all_day": {"type": "boolean", "description": "Sự kiện diễn ra cả ngày (mặc định: false)"},
                    "recurrence_rule": {"type": "string", "description": "Quy tắc lặp lại RFC 5545 RRULE (VD: FREQ=WEEKLY;BYDAY=MO)"},
                    "calendar_id": {"type": "integer", "description": "ID lịch muốn lưu (nếu không truyền sẽ dùng lịch mặc định)"}
                },
                "required": ["title", "start_at"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_event",
            "description": "Cập nhật thông tin của một sự kiện đã có trên lịch.",
            "parameters": {
                "type": "object",
                "properties": {
                    "event_id": {"type": "integer", "description": "ID sự kiện cần cập nhật"},
                    "title": {"type": "string"},
                    "start_at": {"type": "string"},
                    "end_at": {"type": "string"},
                    "description": {"type": "string"},
                    "location": {"type": "string"},
                    "is_all_day": {"type": "boolean"},
                    "recurrence_rule": {"type": "string"}
                },
                "required": ["event_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_event",
            "description": "Xóa một sự kiện trên lịch.",
            "parameters": {
                "type": "object",
                "properties": {
                    "event_id": {"type": "integer", "description": "ID sự kiện cần xóa"}
                },
                "required": ["event_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_events",
            "description": "Lấy danh sách các sự kiện trong một khoảng thời gian.",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "description": "Ngày bắt đầu (YYYY-MM-DD hoặc ISO8601)"},
                    "end_date": {"type": "string", "description": "Ngày kết thúc (YYYY-MM-DD hoặc ISO8601)"},
                    "calendar_id": {"type": "integer", "description": "Lọc theo ID lịch"}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": "Tạo một công việc (task) mới vào danh sách việc cần làm.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Tiêu đề công việc"},
                    "note": {"type": "string", "description": "Ghi chú chi tiết"},
                    "list_id": {"type": "integer", "description": "ID danh sách chứa task (nếu bỏ trống sẽ vào Tasks mặc định)"},
                    "due_date": {"type": "string", "description": "Hạn chót ngày làm (YYYY-MM-DD)"},
                    "due_time": {"type": "string", "description": "Hạn chót giờ làm (HH:MM)"},
                    "start_time": {"type": "string", "description": "Giờ bắt đầu thực hiện (HH:MM, VD: '09:00', '14:30')"},
                    "end_time": {"type": "string", "description": "Giờ kết thúc dự kiến (HH:MM, VD: '10:00', '16:00')"},
                    "duration_minutes": {"type": "integer", "description": "Thời lượng công việc tính bằng phút (VD: 30, 60, 90)"},
                    "is_all_day": {"type": "boolean", "description": "True nếu là việc cả ngày không gắn giờ, False nếu gắn vào khung giờ cụ thể"},
                    "color": {"type": "string", "description": "Mã màu hex (VD: '#4285F4', '#0B8043')"},
                    "recurrence_rule": {"type": "string", "description": "Quy tắc lặp lại RFC 5545 RRULE (VD: 'FREQ=DAILY', 'FREQ=WEEKLY', 'FREQ=WEEKLY;BYDAY=MO,WE,FR', 'FREQ=MONTHLY')"},
                    "is_important": {"type": "boolean", "description": "Đánh dấu là quan trọng (sao)"},
                    "is_in_my_day": {"type": "boolean", "description": "Thêm trực tiếp vào My Day hôm nay"},
                    "steps": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Danh sách các bước con (subtasks)"
                    }
                },
                "required": ["title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_task",
            "description": "Cập nhật một công việc trong danh sách việc cần làm.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "integer", "description": "ID công việc cần sửa"},
                    "title": {"type": "string"},
                    "note": {"type": "string"},
                    "due_date": {"type": "string"},
                    "due_time": {"type": "string"},
                    "start_time": {"type": "string"},
                    "end_time": {"type": "string"},
                    "duration_minutes": {"type": "integer"},
                    "is_all_day": {"type": "boolean"},
                    "color": {"type": "string"},
                    "recurrence_rule": {"type": "string"},
                    "is_important": {"type": "boolean"},
                    "is_in_my_day": {"type": "boolean"},
                    "list_id": {"type": "integer"}
                },
                "required": ["task_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "complete_task",
            "description": "Đánh dấu hoàn thành hoặc bỏ hoàn thành một công việc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "integer", "description": "ID công việc"},
                    "is_completed": {"type": "boolean", "description": "True = đã hoàn thành, False = chưa hoàn thành"}
                },
                "required": ["task_id", "is_completed"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_task",
            "description": "Xóa một công việc khỏi danh sách.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "integer", "description": "ID công việc cần xóa"}
                },
                "required": ["task_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_tasks",
            "description": "Tra cứu danh sách công việc theo bộ lọc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "view": {
                        "type": "string",
                        "enum": ["my_day", "important", "planned", "all"],
                        "description": "Xem theo danh sách thông minh"
                    },
                    "list_id": {"type": "integer", "description": "Lọc theo ID danh sách cụ thể"},
                    "is_completed": {"type": "boolean", "description": "Lọc theo trạng thái hoàn thành"}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_schedule_summary",
            "description": "Lấy tóm tắt tổng quan lịch trình sự kiện và công việc của một ngày nhất định (mặc định là hôm nay).",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {"type": "string", "description": "Ngày cần tóm tắt (YYYY-MM-DD), bỏ trống là hôm nay"}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_task_lists",
            "description": "Lấy danh sách các danh mục việc cần làm hiện có của người dùng.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_calendars",
            "description": "Lấy danh sách các lịch hiện có của người dùng.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    }
]


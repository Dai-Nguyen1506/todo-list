import { createElement } from '../utils/dom.js';
import { ThemeManager } from '../theme.js';
import { AuthManager } from '../auth.js';

export const landingPage = {
  container: null,

  async render(container) {
    this.container = container;
    container.innerHTML = '';

    const page = createElement('div', { className: 'landing-container' });

    // 1. NAVBAR
    const navbar = createElement('header', { className: 'landing-navbar' }, [
      createElement('a', { href: '#', className: 'landing-logo' }, [
        createElement('span', { style: { fontSize: '26px' }, textContent: '📋' }),
        createElement('span', { className: 'landing-logo-gradient', textContent: 'Planify' })
      ]),
      createElement('nav', { className: 'landing-nav-links' }, [
        createElement('a', { href: '#features', className: 'landing-nav-link', textContent: 'Tính năng' }),
        createElement('a', { href: '#calendar-feature', className: 'landing-nav-link', textContent: 'Lịch biểu' }),
        createElement('a', { href: '#todo-feature', className: 'landing-nav-link', textContent: 'Việc cần làm' }),
        createElement('a', { href: '#ai-feature', className: 'landing-nav-link', textContent: 'Trợ lý AI' })
      ]),
      createElement('div', { className: 'landing-nav-actions' }, [
        createElement('button', {
          className: 'btn-icon',
          title: 'Chuyển đổi giao diện Sáng / Tối',
          textContent: '🌓',
          onclick: () => ThemeManager.toggle()
        }),
        AuthManager.isAuthenticated()
          ? createElement('a', { href: '#calendar', className: 'btn btn-primary', textContent: 'Vào ứng dụng →' })
          : createElement('div', { className: 'flex items-center gap-sm' }, [
              createElement('a', { href: '#login', className: 'btn btn-secondary', textContent: 'Đăng nhập' }),
              createElement('a', { href: '#register', className: 'btn btn-primary', textContent: 'Bắt đầu miễn phí' })
            ])
      ])
    ]);

    // 2. HERO SECTION
    const hero = createElement('section', { className: 'landing-hero' }, [
      createElement('div', { className: 'landing-badge' }, [
        createElement('span', { textContent: '✨' }),
        createElement('span', { textContent: 'Kỷ nguyên Quản lý Thời gian Đột phá cùng AI' })
      ]),
      createElement('h1', { className: 'landing-title' }, [
        createElement('span', { textContent: 'Làm chủ Lịch trình & ' }),
        createElement('span', { className: 'landing-title-highlight', textContent: 'Việc cần làm' }),
        createElement('span', { textContent: ' cùng Trợ lý AI' })
      ]),
      createElement('p', { className: 'landing-subtitle', textContent: 'Kết hợp sức mạnh giữa Google Calendar và Microsoft To Do. Lập kế hoạch lặp lại linh hoạt, đặt khung giờ Time-Blocking cho từng việc làm và điều khiển toàn bộ bằng AI Agent thông minh.' }),
      createElement('div', { className: 'landing-cta-group' }, [
        createElement('a', { href: '#register', className: 'btn-hero-primary', textContent: 'Trải nghiệm Ngay Miễn phí 🚀' }),
        createElement('a', { href: '#login', className: 'btn-hero-secondary', textContent: 'Đăng nhập Tài khoản' })
      ]),

      // Live UI Preview Card
      createElement('div', { className: 'landing-preview' }, [
        createElement('div', { className: 'landing-preview-header' }, [
          createElement('span', { className: 'preview-dot', style: { backgroundColor: '#EF4444' } }),
          createElement('span', { className: 'preview-dot', style: { backgroundColor: '#F59E0B' } }),
          createElement('span', { className: 'preview-dot', style: { backgroundColor: '#10B981' } }),
          createElement('span', {
            style: { marginLeft: '12px', fontSize: '12px', color: 'var(--color-text-tertiary)' },
            textContent: 'Planify — Lịch biểu, To Do & AI Assistant'
          })
        ]),
        createElement('div', { className: 'preview-body' }, [
          // Sidebar mock
          createElement('div', { className: 'preview-sidebar' }, [
            createElement('div', { className: 'font-semibold text-sm mb-xs', textContent: 'Lịch của tôi' }),
            createElement('div', { className: 'p-xs rounded bg-hover text-xs flex items-center gap-xs' }, [
              createElement('span', { style: { color: '#4F46E5' }, textContent: '●' }),
              createElement('span', { textContent: 'Công việc & Dự án' })
            ]),
            createElement('div', { className: 'p-xs rounded text-xs flex items-center gap-xs' }, [
              createElement('span', { style: { color: '#0B8043' }, textContent: '●' }),
              createElement('span', { textContent: 'Cá nhân & Gia đình' })
            ]),
            createElement('div', { className: 'font-semibold text-sm mt-md mb-xs', textContent: 'Danh sách việc' }),
            createElement('div', { className: 'text-xs flex items-center gap-xs p-xs' }, [
              createElement('span', { textContent: '☀️' }),
              createElement('span', { textContent: 'Ngày của tôi (My Day)' })
            ]),
            createElement('div', { className: 'text-xs flex items-center gap-xs p-xs' }, [
              createElement('span', { textContent: '⭐' }),
              createElement('span', { textContent: 'Quan trọng' })
            ]),
            createElement('div', { className: 'text-xs flex items-center gap-xs p-xs' }, [
              createElement('span', { textContent: '📅' }),
              createElement('span', { textContent: 'Đã lập kế hoạch' })
            ])
          ]),

          // Main Calendar / Task View mock
          createElement('div', { className: 'preview-main' }, [
            createElement('div', { className: 'flex items-center justify-between pb-xs border-b' }, [
              createElement('span', { className: 'font-bold text-md', textContent: 'Hôm nay: Thứ Hai, 02 Tháng 11' }),
              createElement('span', { className: 'badge text-xs', style: { backgroundColor: '#EEF2FF', color: '#4F46E5' }, textContent: 'Tuần 45' })
            ]),
            createElement('div', { className: 'flex flex-col gap-sm' }, [
              createElement('div', {
                className: 'p-sm rounded text-xs text-white font-medium',
                style: { backgroundColor: '#4F46E5', borderRadius: '6px' },
                textContent: '📅 09:00 - 10:30: Họp chiến lược định kỳ (Lặp hàng tuần)'
              }),
              createElement('div', {
                className: 'p-sm rounded text-xs font-medium flex items-center gap-xs',
                style: { backgroundColor: 'var(--color-bg-secondary)', border: '1px solid #10B981', color: '#10B981', borderRadius: '6px' },
                textContent: '✅ 11:00 - 12:00: [Time-Block] Hoàn thành báo cáo doanh thu Q4'
              }),
              createElement('div', {
                className: 'p-sm rounded text-xs text-white font-medium',
                style: { backgroundColor: '#F59E0B', borderRadius: '6px' },
                textContent: '📅 14:00 - 15:30: Review Code & Triển khai tính năng mới'
              })
            ])
          ]),

          // AI Panel mock
          createElement('div', { className: 'preview-ai' }, [
            createElement('div', { className: 'font-semibold text-sm flex items-center gap-xs', textContent: '🤖 Planify AI' }),
            createElement('div', { className: 'p-sm rounded text-xs bg-card border flex flex-col gap-xs' }, [
              createElement('span', { className: 'text-tertiary', textContent: 'Người dùng:' }),
              createElement('span', { textContent: 'Hãy lên lịch tập thể dục 45p vào 17h30 lặp lại mỗi ngày giúp tôi.' })
            ]),
            createElement('div', { className: 'p-sm rounded text-xs bg-hover flex flex-col gap-xs' }, [
              createElement('span', { className: 'text-tertiary', textContent: 'AI Agent:' }),
              createElement('span', { textContent: '✅ Đã tạo sự kiện "Tập thể dục" (17:30 - 18:15) lặp lại hàng ngày (FREQ=DAILY) vào lịch của bạn!' })
            ])
          ])
        ])
      ])
    ]);

    // 3. FEATURES SECTION
    const features = createElement('section', { className: 'landing-features', id: 'features' }, [
      createElement('div', { className: 'features-header' }, [
        createElement('h2', { className: 'features-title', textContent: '3 Trụ Cột Đột Phá Của Planify' }),
        createElement('p', { className: 'text-secondary', textContent: 'Giải quyết triệt để sự phân mảnh giữa lịch hẹn và danh sách việc cần làm.' })
      ]),
      createElement('div', { className: 'features-grid' }, [
        // Feature 1
        createElement('div', { className: 'feature-card', id: 'calendar-feature' }, [
          createElement('div', { className: 'feature-icon-wrapper', style: { backgroundColor: '#EEF2FF', color: '#4F46E5' }, textContent: '📅' }),
          createElement('h3', { className: 'feature-title', textContent: 'Lịch biểu Trực quan Đa chế độ' }),
          createElement('p', { className: 'feature-desc', textContent: 'Quan sát toàn diện qua Day View (trục 24h & vạch đỏ thời gian thực), Week View 7 ngày và Month View trực quan. Kéo thả đổi giờ, kéo cạnh dưới tăng thời lượng và thiết lập chuỗi lặp chuẩn RFC 5545.' })
        ]),
        // Feature 2
        createElement('div', { className: 'feature-card', id: 'todo-feature' }, [
          createElement('div', { className: 'feature-icon-wrapper', style: { backgroundColor: '#ECFDF5', color: '#10B981' }, textContent: '✅' }),
          createElement('h3', { className: 'feature-title', textContent: 'Việc Cần Làm Gắn Khung Giờ' }),
          createElement('p', { className: 'feature-desc', textContent: 'Quản lý thông minh qua Smart Lists (My Day, Important, Planned, All Tasks) và danh sách tự tạo. Điểm vượt trội: cho phép đặt giờ bắt đầu - kết thúc để hiển thị trực tiếp thành khối công việc (Time-Blocking) trên lịch!' })
        ]),
        // Feature 3
        createElement('div', { className: 'feature-card', id: 'ai-feature' }, [
          createElement('div', { className: 'feature-icon-wrapper', style: { backgroundColor: '#F5F3FF', color: '#7C3AED' }, textContent: '🤖' }),
          createElement('h3', { className: 'feature-title', textContent: 'Trợ lý AI Tự Động Gọi 12 Tools' }),
          createElement('p', { className: 'feature-desc', textContent: 'Trợ lý tiếng Việt sử dụng mô hình tối tân, có khả năng gọi 12 tools tạo/sửa/xóa sự kiện, việc cần làm, lập kế hoạch lặp lại và tư vấn tối ưu thời gian với hệ thống bảo vệ guardrails nghiêm ngặt.' })
        ])
      ])
    ]);

    // 4. FOOTER
    const footer = createElement('footer', { className: 'landing-footer' }, [
      createElement('div', {}, [
        createElement('span', { className: 'font-semibold', textContent: 'Planify' }),
        createElement('span', { textContent: ' — Nền tảng Quản lý Thời gian & Công việc Đột phá © 2026' })
      ]),
      createElement('div', { className: 'flex items-center gap-md' }, [
        createElement('a', { href: '#login', className: 'landing-nav-link text-xs', textContent: 'Đăng nhập' }),
        createElement('a', { href: '#register', className: 'landing-nav-link text-xs', textContent: 'Đăng ký' })
      ])
    ]);

    page.appendChild(navbar);
    page.appendChild(hero);
    page.appendChild(features);
    page.appendChild(footer);

    container.appendChild(page);
  },

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }
};


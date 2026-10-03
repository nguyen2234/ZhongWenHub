import React, { useState } from 'react';
import {
  Flame,
  Award,
  BookOpen,
  Search,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  Modal,
  CourseCard,
} from '../design-system';

export const DesignSystemShowcase: React.FC = () => {
  const [themeColor, setThemeColor] = useState<'indigo' | 'ocean' | 'emerald'>('indigo');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordValue, setPasswordValue] = useState('MatKhau123@');

  const handleColorChange = (color: 'indigo' | 'ocean' | 'emerald') => {
    setThemeColor(color);
    if (color === 'indigo') {
      document.documentElement.removeAttribute('data-theme-color');
    } else {
      document.documentElement.setAttribute('data-theme-color', color);
    }
  };

  return (
    <div>
      {/* Header trang Design System */}
      <header style={{ marginBottom: 'var(--space-8)', paddingBottom: 'var(--space-6)', borderBottom: '1px solid var(--border-strong)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                EdTech UI/UX Design System
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>v1.0 • Chuẩn D9 & Flat Gu</span>
            </div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-2) 0', color: 'var(--foreground)' }}>
              Hệ thống Thiết kế Nền tảng Học trực tuyến (EdTech Platform)
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: 0, maxWidth: '720px' }}>
              Phong cách Modern EdTech: Tươi sáng, thân thiện, card-based bo góc mềm mại, gamification (XP, Streak, Leaderboard), typography Inter rõ ràng và tỷ lệ tương phản chuẩn WCAG AA.
            </p>
          </div>

          {/* Chọn nhanh 3 màu nhấn gợi ý */}
          <div style={{ background: 'var(--surface)', padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-strong)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)' }}>
              🎨 Thử màu nhấn chủ đạo:
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={() => handleColorChange('indigo')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: themeColor === 'indigo' ? '2px solid var(--foreground)' : '1px solid var(--border-strong)',
                  backgroundColor: '#eef2ff',
                  color: '#4f46e5',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4f46e5' }} />
                Indigo (Khuyên dùng)
              </button>

              <button
                type="button"
                onClick={() => handleColorChange('ocean')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: themeColor === 'ocean' ? '2px solid var(--foreground)' : '1px solid var(--border-strong)',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
                Ocean Blue
              </button>

              <button
                type="button"
                onClick={() => handleColorChange('emerald')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: themeColor === 'emerald' ? '2px solid var(--foreground)' : '1px solid var(--border-strong)',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#059669' }} />
                Emerald
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* KHỐI 1: MÀU SẮC */}
      <section style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: '0 0 var(--space-1) 0' }}>
            1. Bảng màu & Tương phản (Colors & WCAG Contrast)
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: 0 }}>
            Màu sắc được chọn lọc kỹ lưỡng, đảm bảo tính thân thiện cho giáo dục và độ tương phản chuẩn WCAG AA (&gt; 4.5:1).
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-strong)', background: 'var(--surface)' }}>
            <div style={{ height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary)', marginBottom: 'var(--space-2)' }} />
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Primary Brand</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>--primary</div>
          </div>

          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-strong)', background: 'var(--surface)' }}>
            <div style={{ height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-light)', border: '1px solid var(--border-strong)', marginBottom: 'var(--space-2)' }} />
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Primary Light</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>--primary-light</div>
          </div>

          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-strong)', background: 'var(--surface)' }}>
            <div style={{ height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background)', border: '1px solid var(--border-strong)', marginBottom: 'var(--space-2)' }} />
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Page Background</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>#f8fafc</div>
          </div>

          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-strong)', background: 'var(--surface)' }}>
            <div style={{ height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface)', border: '1px solid var(--border-strong)', marginBottom: 'var(--space-2)' }} />
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Card Surface</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>#ffffff</div>
          </div>

          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-strong)', background: 'var(--surface)' }}>
            <div style={{ height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--foreground)', marginBottom: 'var(--space-2)' }} />
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Main Text</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>#0f172a</div>
          </div>

          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-strong)', background: 'var(--surface)' }}>
            <div style={{ height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--muted)', marginBottom: 'var(--space-2)' }} />
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Muted Text</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>#64748b</div>
          </div>

          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-strong)', background: 'var(--surface)' }}>
            <div style={{ height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--streak)', marginBottom: 'var(--space-2)' }} />
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Streak (Lửa)</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>#ea580c</div>
          </div>

          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-strong)', background: 'var(--surface)' }}>
            <div style={{ height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--xp)', marginBottom: 'var(--space-2)' }} />
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>XP (Kinh nghiệm)</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>#d97706</div>
          </div>

          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-strong)', background: 'var(--surface)' }}>
            <div style={{ height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--ai)', marginBottom: 'var(--space-2)' }} />
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>AI Tutor</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>#7c3aed</div>
          </div>

          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-strong)', background: 'var(--surface)' }}>
            <div style={{ height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success)', marginBottom: 'var(--space-2)' }} />
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Success</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>#059669</div>
          </div>
        </div>

        <Card title="Tỉ lệ tương phản chuẩn (WCAG AA Contrast Check)">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-strong)', color: 'var(--muted)' }}>
                  <th style={{ padding: '8px 12px' }}>Cặp màu kiểm tra</th>
                  <th style={{ padding: '8px 12px' }}>Ví dụ trực quan</th>
                  <th style={{ padding: '8px 12px' }}>Tỉ lệ tương phản</th>
                  <th style={{ padding: '8px 12px' }}>Ghi chú tiêu chuẩn</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>Chữ chính trên Nền Card</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ background: '#ffffff', color: '#0f172a', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>Văn bản hiển thị</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>14.2 : 1</td>
                  <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>Vượt xa chuẩn AA (4.5:1)</td>
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>Chữ phụ (Muted) trên Nền Card</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ background: '#ffffff', color: '#64748b', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>Nhãn gợi ý phụ</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>4.95 : 1</td>
                  <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>Đạt chuẩn WCAG AA</td>
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>Chữ trắng trên Nền Primary</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ background: 'var(--primary)', color: '#ffffff', padding: '4px 8px', borderRadius: '4px' }}>Bắt đầu học</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>4.60 : 1</td>
                  <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>Đạt chuẩn WCAG AA</td>
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>Viền ô nhập trên Nền Card</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ border: '1px solid var(--border-strong)', background: '#fff', padding: '4px 8px', borderRadius: '4px' }}>Ô nhập liệu</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>1.27 : 1</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--warning)', background: 'var(--warning-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                      Đánh đổi thẩm mỹ (P3): Không làm đậm viền để tránh thô bẩn giao diện
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* KHỐI 2: TYPOGRAPHY */}
      <section style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: '0 0 var(--space-1) 0' }}>
            2. Thang Typography (Inter Font Family)
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: 0 }}>
            Một font duy nhất cho toàn bộ hệ thống, phân vai bằng font-weight (400, 500, 600, 700). Đầy đủ dấu tiếng Việt chuẩn mực.
          </p>
        </div>

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--primary)' }}>text-xs</span>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>12px • w400/500</div>
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                Nhãn phụ, dấu thời gian cập nhật 5 phút trước, huy hiệu điểm thưởng +50 XP, câu trợ giúp ngắn.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--primary)' }}>text-sm</span>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>14px • w400/500</div>
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--foreground)' }}>
                Cỡ chữ mặc định cho toàn bộ nội dung học tập, văn bản giải thích ngữ pháp, nhãn ô nhập và nút bấm.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--primary)' }}>text-base</span>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>16px • w600</div>
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--foreground)' }}>
                Tiêu đề thẻ bài học, tên khóa học hiện tại và tiêu đề các card thống kê nhiệm vụ hằng ngày.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--primary)' }}>text-lg</span>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>18px • w600</div>
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--foreground)' }}>
                Tiêu đề phân mục chính: Lộ trình cá nhân, Bảng xếp hạng tuần và Thử thách đặc biệt.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--primary)' }}>text-2xl</span>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>24px • w700</div>
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--foreground)' }}>
                Số liệu lớn: 28 Ngày Streak 🔥 • 3.450 Điểm XP ⭐
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* KHỐI 3: COMPONENT DEMO */}
      <section style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: '0 0 var(--space-1) 0' }}>
            3. Thư viện Component đã chuẩn hóa
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: 0 }}>
            Button, Input, Card, Badge, Modal, EmptyState, ProgressBar, StreakTracker, AITutorSnippet, LeaderboardItem.
          </p>
        </div>

        {/* Nút */}
        <Card title="Nút bấm (Button - I1, button.md)" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
            <Button variant="outline">Nút Outline (Mặc định)</Button>
            <Button variant="primary" icon={<BookOpen size={16} />}>Nút Primary</Button>
            <Button variant="secondary">Nút Secondary</Button>
            <Button variant="ghost">Nút Ghost</Button>
            <Button variant="danger">Nút Nguy hiểm</Button>
            <Button variant="primary" isLoading>Đang lưu...</Button>
          </div>
        </Card>

        {/* Ô nhập */}
        <Card title="Ô nhập liệu (Input & Form Fields)" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
            <Input label="Họ và tên học viên" placeholder="Nhập tên của bạn..." />
            <Input label="Tìm bài học" placeholder="Nhập từ khóa..." iconLeft={<Search size={16} />} />
            <Input label="Mật khẩu" isPassword value={passwordValue} onChange={(e) => setPasswordValue(e.target.value)} />
          </div>
        </Card>

        {/* Thẻ học tập */}
        <Card title="Thẻ khóa học tương tác (CourseCard)" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            <CourseCard
              levelTag="Khóa học HSK 1"
              title="Phát âm Pinyin chuẩn & 150 từ vựng căn bản"
              description="Nắm vững thanh mẫu, vận mẫu và phản xạ giao tiếp tự nhiên với AI Tutor hướng dẫn chi tiết từng âm."
              lessonCount={24}
              xpReward={350}
              progressPercent={65}
              onAction={() => alert('Chuyển tới bài học')}
            />

            <CourseCard
              levelTag="Ngữ pháp HSK 2"
              title="Cấu trúc câu hỏi & Bổ ngữ chỉ phương hướng"
              description="Học cách đặt câu hỏi tương tác trong sinh hoạt, đi chợ, du lịch và giao tiếp công sở mỗi ngày."
              lessonCount={18}
              xpReward={280}
              progressPercent={30}
              onAction={() => alert('Chuyển tới bài học')}
            />
          </div>
        </Card>

        {/* Modal demo */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Mở thử Modal Nhận thưởng XP
          </Button>
        </div>
      </section>

      {/* Modal Popup thực tế */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nhận thưởng Chuỗi ngày học!"
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Để sau
            </Button>
            <Button variant="primary" icon={<Award size={16} />} onClick={() => setIsModalOpen(false)}>
              Nhận ngay +150 XP
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--streak-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--streak-border)' }}>
            <Flame size={28} style={{ color: 'var(--streak)' }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--streak)', fontSize: 'var(--text-base)' }}>
                Chúc mừng! Bạn đã đạt chuỗi 7 ngày liên tiếp 🔥
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                Duy trì thói quen học tập mỗi ngày giúp bạn ghi nhớ từ vựng lâu hơn 85%.
              </div>
            </div>
          </div>
          <p style={{ margin: 0 }}>
            Bạn nhận được <strong>+150 XP</strong> kinh nghiệm và mở khóa huy hiệu <em>Chiến binh Bền bỉ</em> trong tuần này!
          </p>
        </div>
      </Modal>
    </div>
  );
};

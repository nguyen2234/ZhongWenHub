import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Check,
  Languages,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  Modal,
  EmptyState,
  ProgressBar,
  StreakTracker,
  HSKLevel,
  LessonStatus,
  VocabularyCard,
  Flashcard,
  LearningCard,
  XPIndicator,
} from '../design-system';

export const ChineseDesignSystemShowcase: React.FC = () => {
  const [themeColor, setThemeColor] = useState<'indigo' | 'ocean' | 'teal'>('indigo');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordValue, setPasswordValue] = useState('MatKhau123@');
  const [isBookmarked, setIsBookmarked] = useState(true);

  const handleColorChange = (color: 'indigo' | 'ocean' | 'teal') => {
    setThemeColor(color);
    if (color === 'indigo') {
      document.documentElement.removeAttribute('data-theme-color');
    } else {
      document.documentElement.setAttribute('data-theme-color', color);
    }
  };

  return (
    <div>
      {/* Banner Giới thiệu Design System */}
      <section style={{ marginBottom: 'var(--space-8)', paddingBottom: 'var(--space-6)', borderBottom: '1px solid var(--border-strong)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, padding: '2px 10px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                Chinese EdTech Design System
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Dành riêng cho người Việt • HSK 1 → HSK 6</span>
            </div>

            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-2) 0', color: 'var(--foreground)' }}>
              Hệ thống Thiết kế Nền tảng Tự học Tiếng Trung (Visual Identity)
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: 0, maxWidth: '750px', lineHeight: 1.5 }}>
              Được phát triển với bản sắc riêng: phong cách Modern EdTech sạch sẽ, trẻ trung, thân thiện nhưng chững chạc, tối ưu hóa hiển thị song ngữ Tiếng Việt, Chữ Hán (Hanzi) và Pinyin chuẩn dấu thanh điệu.
            </p>
          </div>

          {/* Chuyển đổi màu sắc */}
          <div style={{ background: 'var(--surface)', padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-strong)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)' }}>
              🎨 Thử nghiệm bảng màu nhấn:
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
                  color: '#4338ca',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4338ca' }} />
                Indigo Seal (Khuyên dùng)
              </button>

              <button
                type="button"
                onClick={() => handleColorChange('ocean')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: themeColor === 'ocean' ? '2px solid var(--foreground)' : '1px solid var(--border-strong)',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#1d4ed8' }} />
                Ocean Tech
              </button>

              <button
                type="button"
                onClick={() => handleColorChange('teal')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: themeColor === 'teal' ? '2px solid var(--foreground)' : '1px solid var(--border-strong)',
                  backgroundColor: '#f0fdfa',
                  color: '#0f766e',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0f766e' }} />
                Oriental Teal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* KHỐI 1: BẢNG MÀU, HSK LEVEL & ĐO LƯỜNG TƯƠNG PHẢN */}
      <section style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: '0 0 var(--space-1) 0' }}>
            1. Màu sắc, Phân cấp HSK & Tương phản WCAG AA
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: 0 }}>
            Hệ màu chuyên biệt phân định 6 cấp độ HSK (HSK 1 đến HSK 6) cùng các tokens Gamification và điểm nhấn Chu Sa (Seal).
          </p>
        </div>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
            <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface)', border: '1px solid var(--border-strong)' }}>
              <div style={{ height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--hsk1)', marginBottom: 'var(--space-2)' }} />
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--hsk1)' }}>HSK 1 (Nhập môn)</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Sky Blue • 150 từ</div>
            </div>

            <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface)', border: '1px solid var(--border-strong)' }}>
              <div style={{ height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--hsk2)', marginBottom: 'var(--space-2)' }} />
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--hsk2)' }}>HSK 2 (Sơ cấp)</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Teal Green • 300 từ</div>
            </div>

            <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface)', border: '1px solid var(--border-strong)' }}>
              <div style={{ height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--hsk3)', marginBottom: 'var(--space-2)' }} />
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--hsk3)' }}>HSK 3 (Trung cấp 1)</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Emerald • 600 từ</div>
            </div>

            <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface)', border: '1px solid var(--border-strong)' }}>
              <div style={{ height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--hsk4)', marginBottom: 'var(--space-2)' }} />
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--hsk4)' }}>HSK 4 (Trung cấp 2)</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Amber • 1.200 từ</div>
            </div>

            <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface)', border: '1px solid var(--border-strong)' }}>
              <div style={{ height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--hsk5)', marginBottom: 'var(--space-2)' }} />
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--hsk5)' }}>HSK 5 (Cao cấp 1)</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Orange • 2.500 từ</div>
            </div>

            <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface)', border: '1px solid var(--border-strong)' }}>
              <div style={{ height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--hsk6)', marginBottom: 'var(--space-2)' }} />
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--hsk6)' }}>HSK 6 (Cao cấp 2)</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Crimson • 5.000+ từ</div>
            </div>
          </div>
        </div>

        {/* Gamification tokens */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface)', border: '1px solid var(--border-strong)' }}>
            <div style={{ height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary)', marginBottom: 'var(--space-2)' }} />
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>Primary Brand</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>#4338ca</div>
          </div>

          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface)', border: '1px solid var(--border-strong)' }}>
            <div style={{ height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--seal)', marginBottom: 'var(--space-2)' }} />
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>Chu Sa (Seal Red)</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>#be123c</div>
          </div>

          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface)', border: '1px solid var(--border-strong)' }}>
            <div style={{ height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--streak)', marginBottom: 'var(--space-2)' }} />
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>Streak (Chuỗi)</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>#ea580c</div>
          </div>

          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface)', border: '1px solid var(--border-strong)' }}>
            <div style={{ height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--xp)', marginBottom: 'var(--space-2)' }} />
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>XP (Kinh nghiệm)</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>#d97706</div>
          </div>

          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface)', border: '1px solid var(--border-strong)' }}>
            <div style={{ height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--ai)', marginBottom: 'var(--space-2)' }} />
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>AI Tutor</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>#7c3aed</div>
          </div>
        </div>

        <Card title="Đo lường độ tương phản theo chuẩn WCAG AA">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-strong)', color: 'var(--muted)' }}>
                  <th style={{ padding: '8px 12px' }}>Mục kiểm tra</th>
                  <th style={{ padding: '8px 12px' }}>Mẫu trực quan</th>
                  <th style={{ padding: '8px 12px' }}>Tỉ lệ tương phản</th>
                  <th style={{ padding: '8px 12px' }}>Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>Chữ Hán trên nền Card trắng</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-hanzi)', fontSize: '18px', fontWeight: 600 }}>你好 (Nǐ hǎo)</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700 }}>14.2 : 1</td>
                  <td style={{ padding: '8px 12px', color: 'var(--success)' }}>Vượt chuẩn AA (4.5:1)</td>
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>Chữ Pinyin (`--primary`) trên Card</td>
                  <td style={{ padding: '8px 12px', color: 'var(--primary)', fontWeight: 600 }}>hǎo (Thanh 3)</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700 }}>7.8 : 1</td>
                  <td style={{ padding: '8px 12px', color: 'var(--success)' }}>Đạt chuẩn AA</td>
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>Chữ phụ / Nghĩa dịch (`--muted`)</td>
                  <td style={{ padding: '8px 12px', color: 'var(--muted)' }}>Xin chào; bạn có khỏe không</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700 }}>4.95 : 1</td>
                  <td style={{ padding: '8px 12px', color: 'var(--success)' }}>Đạt chuẩn AA</td>
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>Chữ trắng trên Nút Primary</td>
                  <td style={{ padding: '8px 12px' }}><span style={{ backgroundColor: 'var(--primary)', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>Bắt đầu học</span></td>
                  <td style={{ padding: '8px 12px', fontWeight: 700 }}>7.8 : 1</td>
                  <td style={{ padding: '8px 12px', color: 'var(--success)' }}>Đạt chuẩn AA</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* KHỐI 2: TYPOGRAPHY ĐA NGÔN NGỮ */}
      <section style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: '0 0 var(--space-1) 0' }}>
            2. Typography Đa ngôn ngữ (Tiếng Việt, Chữ Hán & Pinyin)
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: 0 }}>
            Inter cho Tiếng Việt và Noto Sans SC cho Chữ Hán, bảo đảm nét bút không bị nhòe và Pinyin có đầy đủ 4 dấu thanh điệu.
          </p>
        </div>

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: 'var(--space-2)' }}>
                Hiển thị Chữ Hán theo cấp độ:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-6)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--hanzi-display-lg)', lineHeight: 1.1 }}>学</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '4px' }}>Flashcard (64px)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--hanzi-display-md)', lineHeight: 1.1 }}>学习</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '4px' }}>Thẻ từ vựng (40px)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--hanzi-display-sm)', lineHeight: 1.1 }}>我想学汉语</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '4px' }}>Câu văn bản (28px)</span>
                </div>
              </div>
            </div>

            <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: 'var(--space-2)' }}>
                Phiên âm Pinyin đầy đủ thanh điệu:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                <span style={{ padding: '4px 10px', backgroundColor: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}>
                  Thanh 1: <strong>mā, bā, fā</strong>
                </span>
                <span style={{ padding: '4px 10px', backgroundColor: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}>
                  Thanh 2: <strong>má, téng, lái</strong>
                </span>
                <span style={{ padding: '4px 10px', backgroundColor: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}>
                  Thanh 3: <strong>mǎ, nǐ, hǎo</strong>
                </span>
                <span style={{ padding: '4px 10px', backgroundColor: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}>
                  Thanh 4: <strong>mà, yào, zài</strong>
                </span>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* KHỐI 3: COMPONENT SHOWCASE ĐẦY ĐỦ */}
      <section style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: '0 0 var(--space-1) 0' }}>
            3. Bộ Component Chuẩn hóa
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: 0 }}>
            Tất cả components chuyên dụng cho tự học tiếng Trung.
          </p>
        </div>

        {/* Buttons & Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <Card title="Nút bấm (Buttons)">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <Button variant="outline">Nút Outline</Button>
              <Button variant="primary" icon={<BookOpen size={16} />}>Học ngay</Button>
              <Button variant="secondary">Nút Phụ</Button>
              <Button variant="ghost">Bỏ qua</Button>
              <Button variant="danger">Xoá</Button>
            </div>
          </Card>

          <Card title="Ô nhập liệu (Inputs & Search)">
            <Input
              label="Tra cứu từ vựng (Hán tự hoặc Pinyin)"
              placeholder="Ví dụ: nihao, 学习, xuexi..."
              iconLeft={<Search size={16} />}
            />
            <div style={{ marginTop: 'var(--space-3)' }}>
              <Input
                label="Mật khẩu"
                isPassword
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
              />
            </div>
          </Card>
        </div>

        {/* VocabularyCard & Flashcard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: 'var(--space-2)' }}>
              Thẻ từ vựng tiếng Trung (VocabularyCard):
            </div>
            <VocabularyCard
              hanzi="苹果"
              pinyin="píngguǒ"
              meaning="Quả táo"
              partOfSpeech="Danh từ"
              hskLevel={1}
              exampleHanzi="这个苹果很好吃。"
              examplePinyin="Zhège píngguǒ hěn hǎochī."
              exampleMeaning="Quả táo này rất ngon."
              isBookmarked={isBookmarked}
              onBookmark={() => setIsBookmarked((b) => !b)}
              onPlayAudio={() => alert('Phát âm: píngguǒ')}
            />
          </div>

          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: 'var(--space-2)' }}>
              Thẻ lật Spaced Repetition (Flashcard):
            </div>
            <Flashcard
              hanzi="喝"
              pinyin="hē"
              meaning="Uống"
              partOfSpeech="Động từ"
              hskLevel={1}
              exampleSentence="你想喝什么？"
              exampleMeaning="Bạn muốn uống gì?"
              onPlayAudio={() => alert('Phát âm: hē')}
              onRate={(rating) => alert(`Đã đánh giá mức nhớ: ${rating}`)}
            />
          </div>
        </div>

        {/* Learning Card */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: 'var(--space-2)' }}>
            Thẻ bài học lộ trình (LearningCard):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            <LearningCard
              title="Bài 01: Nhập môn Pinyin & Chào hỏi"
              subtitle="Nắm vững thanh mẫu b, p, m, f và 4 thanh điệu"
              hskLevel={1}
              status="completed"
              skillLabel="Phát âm"
              durationMinutes={15}
              xpReward={30}
              progressPercent={100}
              onAction={() => alert('Ôn tập bài 01')}
            />

            <LearningCard
              title="Bài 02: Mua sắm & Số đếm hàng ngày"
              subtitle="Cấu trúc hỏi giá tiền 这个多少钱 và số đếm 1-100"
              hskLevel={1}
              status="in_progress"
              skillLabel="Hội thoại"
              durationMinutes={20}
              xpReward={50}
              progressPercent={65}
              onAction={() => alert('Tiếp tục bài 02')}
            />
          </div>
        </div>

        {/* HSK Level Badges & Lesson Statuses */}
        <Card title="Huy hiệu Cấp độ HSK & Trạng thái bài học" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <HSKLevel level={1} showFullLabel />
              <HSKLevel level={2} showFullLabel />
              <HSKLevel level={3} showFullLabel />
              <HSKLevel level={4} showFullLabel />
              <HSKLevel level={5} showFullLabel />
              <HSKLevel level={6} showFullLabel />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <LessonStatus status="completed" />
              <LessonStatus status="in_progress" />
              <LessonStatus status="review" />
              <LessonStatus status="locked" />
            </div>
          </div>
        </Card>

        {/* Gamification Components */}
        <Card title="XP, Streak & Tiến độ" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
              <XPIndicator amount={2180} variant="pill" />
              <XPIndicator amount={50} variant="badge" />
              <div style={{ flex: 1, minWidth: '260px' }}>
                <XPIndicator amount={2180} variant="card" label="Tổng điểm tích lũy tuần" bonusText="Hạng Vàng" />
              </div>
            </div>

            <StreakTracker streakCount={8} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
              <ProgressBar value={65} label="Tiến độ HSK 1" variant="primary" />
              <ProgressBar value={80} label="Chuỗi ngày học" variant="streak" />
              <ProgressBar value={45} label="Tích lũy XP ngày" variant="xp" />
              <ProgressBar value={100} label="Hoàn thành" variant="success" />
            </div>
          </div>
        </Card>

        {/* Empty State & Modal demo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          <Card title="Trạng thái rỗng (EmptyState)">
            <EmptyState
              icon={<Languages size={24} />}
              title="Chưa có từ vựng nào được lưu"
              description="Khi bạn bấm lưu từ vựng bất kỳ, từ đó sẽ hiển thị tại đây để bạn ôn luyện."
              action={<Button variant="primary">Khám phá kho từ</Button>}
            />
          </Card>

          <Card title="Cửa sổ Modal (Modal)">
            <p style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
              Modal chuẩn lớp nổi với backdrop mờ và bóng shadow-modal.
            </p>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Mở Modal Nhận Thưởng XP
            </Button>
          </Card>
        </div>
      </section>

      {/* Modal Demo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Chúc mừng! Bạn đã hoàn thành Bài 02 🎉"
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Xem lại
            </Button>
            <Button variant="primary" icon={<Check size={16} />} onClick={() => setIsModalOpen(false)}>
              Nhận ngay +50 XP
            </Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          Tiến độ của bạn đã được ghi nhận vào chuỗi ngày học <strong>Streak 8 ngày</strong> và tích lũy thêm <strong>+50 XP</strong>.
        </p>
      </Modal>
    </div>
  );
};

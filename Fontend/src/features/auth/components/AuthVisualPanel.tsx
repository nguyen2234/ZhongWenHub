import React from 'react';
import { BookOpen, Sparkles, Brain, Users } from 'lucide-react';

export const AuthVisualPanel: React.FC = () => {
  return (
    <aside
      className="auth-visual-panel"
      style={{
        position: 'relative',
        width: '45%',
        minHeight: '100vh',
        backgroundColor: '#f1f5f9',
        borderRight: '1px solid var(--border-strong)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(28px, 4vw, 48px)',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Subtle Hanzi Watermarks */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          fontFamily: 'var(--font-hanzi)',
          fontSize: '180px',
          fontWeight: 900,
          color: 'rgba(67, 56, 202, 0.035)',
          lineHeight: 1,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        学
      </div>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '-30px',
          fontFamily: 'var(--font-hanzi)',
          fontSize: '160px',
          fontWeight: 900,
          color: 'rgba(190, 18, 60, 0.025)',
          lineHeight: 1,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        华
      </div>

      {/* Subtle Tian Zi Ge (田字格) Character Grid Watermark */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '38%',
          right: '5%',
          width: '130px',
          height: '130px',
          border: '1px dashed rgba(67, 56, 202, 0.12)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          pointerEvents: 'none',
          transform: 'rotate(-4deg)',
        }}
      >
        <div style={{ borderRight: '1px dashed rgba(67, 56, 202, 0.08)', borderBottom: '1px dashed rgba(67, 56, 202, 0.08)' }} />
        <div style={{ borderBottom: '1px dashed rgba(67, 56, 202, 0.08)' }} />
        <div style={{ borderRight: '1px dashed rgba(67, 56, 202, 0.08)' }} />
        <div />
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-hanzi)',
            fontSize: '76px',
            color: 'rgba(67, 56, 202, 0.07)',
            fontWeight: 700,
          }}
        >
          语
        </span>
      </div>

      {/* TOP: Brand Identity Header */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2-5)' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-hanzi)',
              fontWeight: 700,
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(67, 56, 202, 0.28)',
            }}
          >
            华
          </div>
          <div>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--foreground)',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              ZhongWen<span style={{ color: 'var(--primary)' }}>Hub</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.02em' }}>
              Nền tảng tự học tiếng Trung HSK
            </div>
          </div>
        </div>
      </div>

      {/* CENTER: Motivational Headline & Value Proposition */}
      <div style={{ position: 'relative', zIndex: 2, margin: 'var(--space-8) 0' }}>
        {/* Cultural Seal Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1-5)',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--seal-bg)',
            border: '1px solid var(--seal-border)',
            color: 'var(--seal)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            marginBottom: 'var(--space-3)',
          }}
        >
          <span style={{ fontFamily: 'var(--font-hanzi)', fontWeight: 800 }}>印</span>
          <span>Chuẩn khung HSK 3.0 Quốc tế</span>
        </div>

        {/* Large Chinese Motivational Headline */}
        <div
          style={{
            fontFamily: 'var(--font-hanzi)',
            fontSize: 'clamp(2rem, 3.2vw, 2.75rem)',
            fontWeight: 800,
            color: 'var(--foreground)',
            lineHeight: 1.25,
            letterSpacing: '0.04em',
            marginBottom: 'var(--space-2)',
          }}
        >
          学中文，连接世界。
        </div>

        {/* Vietnamese Supporting Text */}
        <div
          style={{
            fontSize: 'clamp(1rem, 1.3vw, 1.15rem)',
            fontWeight: 500,
            color: 'var(--primary)',
            lineHeight: 1.5,
            marginBottom: 'var(--space-6)',
          }}
        >
          Học tiếng Trung, mở rộng thế giới.
        </div>

        {/* Feature Indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Feature 1: HSK Learning */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
              padding: '12px 16px',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-strong)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--hsk1-bg)',
                color: 'var(--hsk1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)' }}>
                HSK Learning
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>
                Lộ trình HSK 1 → HSK 6 tinh gọn, bài bản từ sơ cấp đến thành thạo
              </div>
            </div>
          </div>

          {/* Feature 2: AI Tutor */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
              padding: '12px 16px',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-strong)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--ai-bg)',
                color: 'var(--ai)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)' }}>
                AI Tutor 24/7
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>
                Trợ giảng thông minh sửa phát âm Pinyin & hội thoại ngữ cảnh thực tế
              </div>
            </div>
          </div>

          {/* Feature 3: Smart Review */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
              padding: '12px 16px',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-strong)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--streak-bg)',
                color: 'var(--streak)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Brain size={18} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)' }}>
                Smart Review (SRS)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>
                Thuật toán lặp lại ngắt quãng khoa học giúp nhớ từ vựng vĩnh viễn
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM: Learner Community & Footer */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '8px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(4px)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            fontSize: '12px',
            color: 'var(--muted)',
            marginBottom: 'var(--space-3)',
          }}
        >
          <Users size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span>Hơn <strong>25,000+ học viên</strong> đang cùng chinh phục HSK mỗi ngày</span>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--neutral)' }}>
          © 2026 ZhongWenHub. Nền tảng EdTech học tiếng Trung thế hệ mới.
        </div>
      </div>
    </aside>
  );
};

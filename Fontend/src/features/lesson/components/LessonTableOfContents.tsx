import React, { useState } from 'react';
import {
  BookOpen,
  Languages,
  BookText,
  MessageSquare,
  Dumbbell,
  CheckCircle2,
  ListOrdered,
  X,
} from 'lucide-react';
import './LessonTableOfContents.css';

export interface TocSectionItem {
  id: string;
  label: string;
  badge?: string;
  icon?: React.ElementType;
}

export interface LessonTableOfContentsProps {
  activeSectionId: string;
  readingProgress?: number; // 0 to 100
  sections?: TocSectionItem[];
  vocabCount?: number;
  grammarCount?: number;
  dialogueCount?: number;
  onSelectSection: (sectionId: string) => void;
}

export const TOC_SECTIONS: TocSectionItem[] = [
  { id: 'overview', label: 'Tổng quan', icon: BookOpen },
  { id: 'vocabulary', label: 'Từ vựng', icon: Languages },
  { id: 'grammar', label: 'Ngữ pháp', icon: BookText },
  { id: 'dialogue', label: 'Hội thoại', icon: MessageSquare },
  { id: 'practice', label: 'Luyện tập củng cố', icon: Dumbbell },
  { id: 'complete', label: 'Kết quả', icon: CheckCircle2 },
];

export const LessonTableOfContents: React.FC<LessonTableOfContentsProps> = ({
  activeSectionId,
  readingProgress = 0,
  sections,
  vocabCount,
  grammarCount,
  dialogueCount,
  onSelectSection,
}) => {
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // Default section definitions aligned with FE-6 specification
  const defaultSections: TocSectionItem[] = [
    { id: 'overview', label: 'Tổng quan', icon: BookOpen },
    {
      id: 'vocabulary',
      label: 'Từ vựng',
      badge: vocabCount ? `${vocabCount} từ` : undefined,
      icon: Languages,
    },
    {
      id: 'grammar',
      label: 'Ngữ pháp',
      badge: grammarCount ? `${grammarCount} điểm` : undefined,
      icon: BookText,
    },
    {
      id: 'dialogue',
      label: 'Hội thoại',
      badge: dialogueCount ? `${dialogueCount} đoạn` : undefined,
      icon: MessageSquare,
    },
    {
      id: 'practice',
      label: 'Luyện tập củng cố',
      icon: Dumbbell,
    },
    {
      id: 'complete',
      label: 'Kết quả',
      icon: CheckCircle2,
    },
  ];

  const items = sections || defaultSections;

  const handleItemClick = (id: string) => {
    onSelectSection(id);
    setIsMobileModalOpen(false);
  };

  const activeItem = items.find((i) => i.id === activeSectionId) || items[0];

  return (
    <>
      {/* =====================================================================
          1. DESKTOP STICKY CARD (>= 1280px)
          ===================================================================== */}
      <aside className="lesson-toc-desktop-card" aria-label="Mục lục bài học HSK">
        <div className="lesson-toc-header">
          <span className="lesson-toc-title">Trong bài học</span>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>HSK Textbook</span>
        </div>

        {/* Reading progress indicator */}
        <div className="lesson-toc-progress-box">
          <div className="lesson-toc-progress-info">
            <span>Tiến độ đọc bài</span>
            <span>{Math.round(readingProgress)}%</span>
          </div>
          <div className="lesson-toc-progress-bar-bg" role="progressbar" aria-valuenow={Math.round(readingProgress)} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="lesson-toc-progress-bar-fill"
              style={{ width: `${Math.min(100, Math.max(0, readingProgress))}%` }}
            />
          </div>
        </div>

        {/* Section links */}
        <nav className="lesson-toc-nav-list" aria-label="Danh sách các phần trong bài">
          {items.map((item) => {
            const isActive = activeSectionId === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={`lesson-toc-item-btn ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'true' : undefined}
              >
                {isActive && <div className="lesson-toc-active-stripe" />}

                <div className="lesson-toc-item-left">
                  {Icon && (
                    <Icon
                      size={15}
                      style={{
                        color: isActive ? 'var(--primary, #E60012)' : '#64748b',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                </div>

                {item.badge && <span className="lesson-toc-item-badge">{item.badge}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* =====================================================================
          2. TABLET HORIZONTAL STICKY BAR (768px - 1279px)
          ===================================================================== */}
      <div className="lesson-toc-tablet-bar" aria-label="Mục lục bài học dạng thanh ngang">
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', paddingRight: '4px', textTransform: 'uppercase' }}>
          Mục:
        </span>
        {items.map((item) => {
          const isActive = activeSectionId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item.id)}
              className={`lesson-toc-tablet-item ${isActive ? 'active' : ''}`}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    fontSize: '10px',
                    opacity: isActive ? 0.9 : 0.75,
                  }}
                >
                  ({item.badge})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          3. MOBILE TRIGGER BAR (< 1024px)
          ===================================================================== */}
      <div className="lesson-toc-mobile-trigger" aria-label="Mục lục bài học trên di động">
        <button
          type="button"
          onClick={() => setIsMobileModalOpen(true)}
          className="lesson-toc-mobile-btn"
          aria-label="Mục lục bài học"
          id="btn-mobile-toc-trigger"
        >
          <ListOrdered size={16} color="var(--primary, #E60012)" />
          <span>Mục lục bài học</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Đang xem:</span>
          <span className="lesson-toc-mobile-active-label">{activeItem.label}</span>
        </div>
      </div>

      {/* Mobile Bottom Sheet Drawer Modal */}
      {isMobileModalOpen && (
        <div
          className="lesson-toc-mobile-modal"
          onClick={() => setIsMobileModalOpen(false)}
          role="presentation"
        >
          <div
            className="lesson-toc-mobile-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Mục lục bài học"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ListOrdered size={20} color="var(--primary, #E60012)" />
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  Mục lục bài học
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileModalOpen(false)}
                aria-label="Đóng mục lục"
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Reading progress in bottom sheet */}
            <div className="lesson-toc-progress-box">
              <div className="lesson-toc-progress-info">
                <span>Tiến độ đọc bài</span>
                <span>{Math.round(readingProgress)}%</span>
              </div>
              <div className="lesson-toc-progress-bar-bg" role="progressbar" aria-valuenow={Math.round(readingProgress)} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className="lesson-toc-progress-bar-fill"
                  style={{ width: `${Math.min(100, Math.max(0, readingProgress))}%` }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((item) => {
                const isActive = activeSectionId === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    className={`lesson-toc-item-btn ${isActive ? 'active' : ''}`}
                    style={{ padding: '12px 14px', fontSize: '14.5px', minHeight: '48px' }}
                  >
                    {isActive && <div className="lesson-toc-active-stripe" />}

                    <div className="lesson-toc-item-left">
                      {Icon && (
                        <Icon
                          size={18}
                          style={{
                            color: isActive ? 'var(--primary, #E60012)' : '#64748b',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <span>{item.label}</span>
                    </div>

                    {item.badge && <span className="lesson-toc-item-badge">{item.badge}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

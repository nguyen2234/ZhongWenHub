import React from 'react';
import {
  FileText,
  BookOpen,
  BookMarked,
  MessagesSquare,
  Headphones,
  Dumbbell,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import type { EditorSectionKey, LessonValidationSummary } from '../../types';

interface SectionNavigationProps {
  activeSection: EditorSectionKey;
  onSelectSection: (section: EditorSectionKey) => void;
  validationSummary: LessonValidationSummary;
  itemCounts: {
    vocabularyCount: number;
    grammarCount: number;
    dialogueLineCount: number;
    listeningCount: number;
    practiceCount: number;
    quizCount: number;
  };
}

interface SectionMeta {
  key: EditorSectionKey;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

const SECTIONS: SectionMeta[] = [
  { key: 'intro', label: '1. Giới thiệu', shortLabel: 'Intro', icon: <FileText size={16} /> },
  { key: 'vocabulary', label: '2. Từ vựng', shortLabel: 'Từ vựng', icon: <BookOpen size={16} /> },
  { key: 'grammar', label: '3. Ngữ pháp', shortLabel: 'Ngữ pháp', icon: <BookMarked size={16} /> },
  { key: 'dialogue', label: '4. Hội thoại', shortLabel: 'Hội thoại', icon: <MessagesSquare size={16} /> },
  { key: 'listening', label: '5. Luyện nghe', shortLabel: 'Nghe', icon: <Headphones size={16} /> },
  { key: 'practice', label: '6. Luyện tập', shortLabel: 'Luyện tập', icon: <Dumbbell size={16} /> },
  { key: 'quiz', label: '7. Kiểm tra', shortLabel: 'Kiểm tra', icon: <Award size={16} /> },
];

export const SectionNavigation: React.FC<SectionNavigationProps> = ({
  activeSection,
  onSelectSection,
  validationSummary,
  itemCounts,
}) => {
  const getItemCountBadge = (key: EditorSectionKey) => {
    switch (key) {
      case 'vocabulary':
        return `${itemCounts.vocabularyCount} từ`;
      case 'grammar':
        return `${itemCounts.grammarCount} điểm`;
      case 'dialogue':
        return `${itemCounts.dialogueLineCount} câu`;
      case 'listening':
        return `${itemCounts.listeningCount} bài`;
      case 'practice':
        return `${itemCounts.practiceCount} bài`;
      case 'quiz':
        return `${itemCounts.quizCount} câu`;
      default:
        return null;
    }
  };

  const renderStatusBadge = (key: EditorSectionKey) => {
    const res = validationSummary.sections[key];
    const status = res?.status || 'INCOMPLETE';

    if (status === 'COMPLETE') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: 'var(--text-2xs)',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: '#dcfce7',
            color: '#15803d',
          }}
          title="Đã đạt chuẩn biên tập nội dung"
        >
          <CheckCircle2 size={11} /> Hoàn tất
        </span>
      );
    }

    if (status === 'WARNING') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: 'var(--text-2xs)',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
          }}
          title={res?.issues.join('\n')}
        >
          <AlertTriangle size={11} /> Cảnh báo
        </span>
      );
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          fontSize: 'var(--text-2xs)',
          fontWeight: 600,
          padding: '2px 7px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: '#f1f5f9',
          color: '#64748b',
        }}
        title="Nội dung chưa đủ số lượng quy chuẩn"
      >
        <Clock size={11} /> Chưa đủ
      </span>
    );
  };

  return (
    <div>
      {/* Desktop & Large Tablet Vertical / Card Navigation */}
      <div
        className="section-nav-desktop"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        {SECTIONS.map((sec) => {
          const isActive = activeSection === sec.key;
          const countBadge = getItemCountBadge(sec.key);

          return (
            <button
              key={sec.key}
              type="button"
              onClick={() => onSelectSection(sec.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: isActive ? 'var(--primary-light)' : 'var(--surface)',
                border: `1.5px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    color: isActive ? 'var(--primary)' : 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {sec.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: isActive ? 700 : 600,
                      color: isActive ? 'var(--primary)' : 'var(--foreground)',
                    }}
                  >
                    {sec.label}
                  </div>
                  {countBadge && (
                    <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--muted)', marginTop: '1px' }}>
                      {countBadge}
                    </div>
                  )}
                </div>
              </div>

              <div>{renderStatusBadge(sec.key)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

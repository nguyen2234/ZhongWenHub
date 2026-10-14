import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Edit3, Eye, Clock, BookOpen, Layers, CheckSquare } from 'lucide-react';
import { ContentStatusBadge } from './ContentStatusBadge';
import type { Lesson, Unit } from '../types';

export interface CurriculumUnitCardProps {
  unit: Unit;
  lessons: Lesson[];
  onEditUnit: (unit: Unit) => void;
  onAddLesson: (unit: Unit) => void;
  onSelectLesson: (lesson: Lesson) => void;
}

export const CurriculumUnitCard: React.FC<CurriculumUnitCardProps> = ({
  unit,
  lessons,
  onEditUnit,
  onAddLesson,
  onSelectLesson,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`lcm-unit-card ${isExpanded ? 'is-expanded' : ''}`}>
      <div className="lcm-unit-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="lcm-unit-title-wrap">
          <div className="lcm-unit-number-badge">U{unit.unitNumber}</div>
          <div className="lcm-unit-names">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span className="lcm-unit-zh">{unit.titleZh}</span>
              <ContentStatusBadge status={unit.status} />
            </div>
            <span className="lcm-unit-vi">{unit.titleVi}</span>
            {unit.description && (
              <span style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                {unit.description}
              </span>
            )}
          </div>
        </div>

        <div className="lcm-unit-meta" onClick={(e) => e.stopPropagation()}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
            <strong>{unit.publishedLessonCount ?? lessons.filter((l) => l.status === 'PUBLISHED').length}</strong> / {lessons.length} bài đã xuất bản
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <button
              type="button"
              className="ds-btn ds-btn-outline ds-btn-sm"
              onClick={() => onEditUnit(unit)}
              title="Chỉnh sửa Unit"
            >
              <Edit3 size={13} /> Sửa Unit
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-primary ds-btn-sm"
              onClick={() => onAddLesson(unit)}
              title="Thêm bài học vào Unit này"
            >
              <Plus size={13} /> Thêm bài
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-ghost ds-btn-sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="lcm-unit-lessons-body">
          {lessons.length === 0 ? (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic', margin: 'var(--space-3) 0' }}>
              Chưa có bài học nào trong Unit này. Nhấn &quot;Thêm bài&quot; để tạo bài giảng đầu tiên.
            </p>
          ) : (
            lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="lcm-lesson-item"
              >
                <div className="lcm-lesson-left">
                  <span className="lcm-lesson-num">#{lesson.lessonNumber}</span>
                  <div className="lcm-lesson-titles">
                    <span className="lcm-lesson-zh">{lesson.titleZh}</span>
                    <span className="lcm-lesson-vi">{lesson.titleVi}</span>
                  </div>
                </div>

                <div className="lcm-lesson-metrics">
                  <span className="lcm-metric-tag" title="Thời lượng dự kiến">
                    <Clock size={12} /> {lesson.durationMinutes}p
                  </span>
                  <span className="lcm-metric-tag" title="Số từ vựng liên kết">
                    <BookOpen size={12} /> {lesson.linkedVocabularyCount} từ
                  </span>
                  <span className="lcm-metric-tag" title="Số điểm ngữ pháp liên kết">
                    <Layers size={12} /> {lesson.linkedGrammarCount} ngữ pháp
                  </span>
                  <span className="lcm-metric-tag" title="Số câu bài tập">
                    <CheckSquare size={12} /> {lesson.exerciseCount} bài tập
                  </span>

                  <ContentStatusBadge status={lesson.status} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'var(--space-2)' }}>
                    <button
                      type="button"
                      className="ds-btn ds-btn-ghost ds-btn-sm"
                      onClick={() => onSelectLesson(lesson)}
                      title="Xem và sửa thông tin bài học"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      type="button"
                      className="ds-btn ds-btn-outline ds-btn-sm"
                      onClick={() => onSelectLesson(lesson)}
                    >
                      <Edit3 size={13} /> Sửa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

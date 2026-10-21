import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Edit3, Save, ExternalLink, BookOpen, Layers, CheckSquare } from 'lucide-react';
import { ContentStatusBadge } from './ContentStatusBadge';
import type { ContentStatus, Lesson, UpdateLessonDTO } from '../types';

export interface LessonDetailDrawerProps {
  isOpen: boolean;
  lesson: Lesson | null;
  onClose: () => void;
  onSave: (id: string, dto: UpdateLessonDTO) => void;
}

export const LessonDetailDrawer: React.FC<LessonDetailDrawerProps> = ({
  isOpen,
  lesson,
  onClose,
  onSave,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [titleZh, setTitleZh] = useState('');
  const [titleVi, setTitleVi] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [xpReward, setXpReward] = useState(50);
  const [orderIndex, setOrderIndex] = useState(1);
  const [status, setStatus] = useState<ContentStatus>('PUBLISHED');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (lesson) {
      setTitleZh(lesson.titleZh);
      setTitleVi(lesson.titleVi);
      setDurationMinutes(lesson.durationMinutes);
      setXpReward(lesson.xpReward);
      setOrderIndex(lesson.orderIndex);
      setStatus(lesson.status);
      setSummary(lesson.summary);
      setIsEditing(false);
    }
  }, [lesson]);

  if (!isOpen || !lesson) return null;

  const handleSave = () => {
    onSave(lesson.id, {
      titleZh,
      titleVi,
      durationMinutes,
      xpReward,
      orderIndex,
      status,
      summary,
    });
    setIsEditing(false);
  };

  return (
    <div className="lcm-drawer-overlay" onClick={onClose}>
      <div className="lcm-drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="lcm-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h3 className="lcm-drawer-title">
              Bài {lesson.lessonNumber}: <span style={{ fontFamily: 'var(--font-hanzi)' }}>{lesson.titleZh}</span>
            </h3>
            <ContentStatusBadge status={status} />
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-ghost ds-btn-sm"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="lcm-drawer-body">
          {/* Thông tin siêu dữ liệu bài học */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>
              1. Thông tin chung bài học
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="lcm-form-group">
                <label className="lcm-form-label">Tiêu đề tiếng Trung (Hán tự) *</label>
                {isEditing ? (
                  <input
                    className="lcm-form-input"
                    value={titleZh}
                    onChange={(e) => setTitleZh(e.target.value)}
                  />
                ) : (
                  <span style={{ fontFamily: 'var(--font-hanzi)', fontSize: '1.2rem', fontWeight: 700 }}>
                    {titleZh}
                  </span>
                )}
              </div>

              <div className="lcm-form-group">
                <label className="lcm-form-label">Tiêu đề tiếng Việt *</label>
                {isEditing ? (
                  <input
                    className="lcm-form-input"
                    value={titleVi}
                    onChange={(e) => setTitleVi(e.target.value)}
                  />
                ) : (
                  <span style={{ fontWeight: 600 }}>{titleVi}</span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="lcm-form-group">
                <label className="lcm-form-label">Thời lượng (phút)</label>
                {isEditing ? (
                  <input
                    type="number"
                    className="lcm-form-input"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  />
                ) : (
                  <span>{durationMinutes} phút</span>
                )}
              </div>

              <div className="lcm-form-group">
                <label className="lcm-form-label">Điểm thưởng XP</label>
                {isEditing ? (
                  <input
                    type="number"
                    className="lcm-form-input"
                    value={xpReward}
                    onChange={(e) => setXpReward(Number(e.target.value))}
                  />
                ) : (
                  <span>+{xpReward} XP</span>
                )}
              </div>

              <div className="lcm-form-group">
                <label className="lcm-form-label">Thứ tự bài</label>
                {isEditing ? (
                  <input
                    type="number"
                    className="lcm-form-input"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value))}
                  />
                ) : (
                  <span>#{orderIndex}</span>
                )}
              </div>
            </div>

            <div className="lcm-form-group">
              <label className="lcm-form-label">Tóm tắt mục tiêu bài học</label>
              {isEditing ? (
                <textarea
                  className="lcm-form-input"
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              ) : (
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--muted)', lineHeight: 1.5 }}>
                  {summary || 'Chưa có tóm tắt.'}
                </p>
              )}
            </div>

            <div className="lcm-form-group">
              <label className="lcm-form-label">Trạng thái xuất bản</label>
              {isEditing ? (
                <select
                  className="lcm-form-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ContentStatus)}
                >
                  <option value="DRAFT">Bản nháp</option>
                  <option value="PENDING_REVIEW">Chờ duyệt</option>
                  <option value="PUBLISHED">Đã xuất bản</option>
                  <option value="ARCHIVED">Lưu trữ</option>
                </select>
              ) : (
                <ContentStatusBadge status={status} />
              )}
            </div>
          </div>

          {/* Liên kết nội dung học tập chuẩn (Tách biệt khỏi Lesson Entity) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>
              2. Nội dung cấu phần bài giảng (7 Bước học tập)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--primary)', marginBottom: '4px' }}>
                  <BookOpen size={16} />
                  <strong style={{ fontSize: 'var(--text-sm)' }}>Từ vựng liên kết</strong>
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                  <strong>{lesson.linkedVocabularyCount}</strong> từ vựng chuẩn HSK
                </span>
              </div>

              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--primary)', marginBottom: '4px' }}>
                  <Layers size={16} />
                  <strong style={{ fontSize: 'var(--text-sm)' }}>Điểm ngữ pháp</strong>
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                  <strong>{lesson.linkedGrammarCount}</strong> cấu trúc ngữ pháp
                </span>
              </div>

              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--primary)', marginBottom: '4px' }}>
                  <CheckSquare size={16} />
                  <strong style={{ fontSize: 'var(--text-sm)' }}>Bài tập luyện tập</strong>
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                  <strong>{lesson.exerciseCount}</strong> câu bài tập tương tác
                </span>
              </div>

              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--muted)', marginBottom: '4px' }}>
                  <strong style={{ fontSize: 'var(--text-sm)' }}>Hội thoại & Luyện nghe</strong>
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                  Đã cấu hình Audio & Phân vai
                </span>
              </div>
            </div>

            {/* Trình soạn bài nâng cao */}
            <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-4)', backgroundColor: '#f8fafc', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: '0 0 var(--space-2) 0' }}>
                Trình biên soạn toàn diện 7 bước (Intro · Vocab · Grammar · Dialogue · Listening · Exercise · Quiz)
              </p>
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                onClick={() => {
                  if (lesson) {
                    onClose();
                    const basePath = location.pathname.includes('/content-manager') ? '/management/content-manager' : '/management/admin';
                    navigate(`${basePath}/curriculum/lessons/${lesson.id}/edit`);
                  }
                }}
              >
                <ExternalLink size={14} /> Mở trình soạn bài
              </button>
            </div>
          </div>
        </div>

        <div className="lcm-drawer-footer">
          {isEditing ? (
            <>
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                onClick={() => setIsEditing(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                onClick={handleSave}
              >
                <Save size={14} /> Lưu thay đổi
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                onClick={onClose}
              >
                Đóng
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={14} /> Sửa siêu dữ liệu
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

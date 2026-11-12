import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Edit3, Save, ExternalLink, BookOpen, Layers, CheckSquare, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import { ContentStatusBadge } from './ContentStatusBadge';
import type { ContentStatus, Lesson, UpdateLessonDTO } from '../types';

export interface LessonDetailDrawerProps {
  isOpen: boolean;
  lesson: Lesson | null;
  onClose: () => void;
  onSave: (id: string, dto: UpdateLessonDTO) => Promise<Lesson | void> | Lesson | void;
  onDelete?: (id: string) => Promise<void> | void;
  existingLessonsInCourse?: Lesson[];
  hskLevel?: number;
  standardLessonLimit?: number | null;
  currentCourseLessonCount?: number;
}

export const LessonDetailDrawer: React.FC<LessonDetailDrawerProps> = ({
  isOpen,
  lesson,
  onClose,
  onSave,
  onDelete,
  existingLessonsInCourse = [],
  hskLevel,
  standardLessonLimit = null,
  currentCourseLessonCount = 0,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isNewLesson = Boolean(lesson?.id?.startsWith('les-new-'));

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [lessonNumber, setLessonNumber] = useState(1);
  const [titleZh, setTitleZh] = useState('');
  const [titleVi, setTitleVi] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [xpReward, setXpReward] = useState(50);
  const [orderIndex, setOrderIndex] = useState(1);
  const [status, setStatus] = useState<ContentStatus>('DRAFT');
  const [summary, setSummary] = useState('');
  const [allowExceedStandardLimit, setAllowExceedStandardLimit] = useState(false);

  useEffect(() => {
    if (lesson) {
      const creating = lesson.id.startsWith('les-new-');
      setLessonNumber(lesson.lessonNumber || 1);
      setTitleZh(lesson.titleZh || '');
      setTitleVi(lesson.titleVi || '');
      setPinyin(lesson.pinyin || '');
      setDurationMinutes(lesson.durationMinutes || 15);
      setXpReward(lesson.xpReward ?? 50);
      setOrderIndex(lesson.orderIndex || lesson.lessonNumber || 1);
      setStatus(creating ? 'DRAFT' : lesson.status);
      setSummary(lesson.summary || '');
      setIsEditing(creating);
      setSaveError(null);
      setConfirmDelete(false);
      setAllowExceedStandardLimit(false);
      if (creating) {
        setSaveSuccess(null);
      }
    }
  }, [lesson]);

  if (!isOpen || !lesson) return null;

  const isAtStandardCap =
    isNewLesson && standardLessonLimit != null && currentCourseLessonCount >= standardLessonLimit;

  const duplicateLesson = existingLessonsInCourse.find(
    (other) => other.id !== lesson.id && other.lessonNumber === Number(lessonNumber)
  );

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(null);

    if (!titleZh.trim()) {
      setSaveError('Vui lòng nhập tiêu đề tiếng Trung (Hán tự).');
      return;
    }
    if (!titleVi.trim()) {
      setSaveError('Vui lòng nhập tiêu đề tiếng Việt.');
      return;
    }
    if (!Number.isFinite(lessonNumber) || lessonNumber < 1) {
      setSaveError('Số bài học phải là số nguyên lớn hơn hoặc bằng 1.');
      return;
    }
    if (duplicateLesson) {
      setSaveError(`Bài số #${lessonNumber} đã tồn tại ("${duplicateLesson.titleVi}"). Không được tạo bài trùng số.`);
      return;
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
      setSaveError('Thời lượng bài học phải ít nhất 1 phút.');
      return;
    }
    if (!Number.isFinite(xpReward) || xpReward < 0) {
      setSaveError('Điểm thưởng XP không được âm.');
      return;
    }
    if (isAtStandardCap && !allowExceedStandardLimit) {
      setSaveError(
        `HSK ${hskLevel ?? 1} đã đủ định mức ${standardLessonLimit}/${standardLessonLimit} bài theo chuẩn HSK 2.0. Vui lòng đánh dấu xác nhận mở rộng quản trị trước khi tạo thêm bài.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(lesson.id, {
        lessonNumber: Math.floor(lessonNumber),
        titleZh: titleZh.trim(),
        titleVi: titleVi.trim(),
        pinyin: pinyin.trim(),
        durationMinutes: Math.floor(durationMinutes),
        xpReward: Math.floor(xpReward),
        orderIndex: Math.floor(orderIndex || lessonNumber),
        status: isNewLesson ? 'DRAFT' : status,
        summary: summary.trim(),
        allowExceedStandardLimit,
      });
      setIsEditing(false);
      setSaveSuccess(
        isNewLesson
          ? 'Đã tạo bài học mới (DRAFT) và lưu vào SQL Server thành công.'
          : 'Đã lưu cập nhật bài học vào SQL Server thành công.'
      );
    } catch (err: any) {
      setSaveError(err?.message || 'Không thể lưu bài học vào máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || isNewLesson) return;
    setSaveError(null);
    setIsSubmitting(true);
    try {
      await onDelete(lesson.id);
      onClose();
    } catch (err: any) {
      setSaveError(err?.message || 'Không thể xóa bài học.');
      setConfirmDelete(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="lcm-drawer-overlay" onClick={onClose}>
      <div className="lcm-drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="lcm-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h3 className="lcm-drawer-title">
              {isNewLesson ? (
                'Thêm bài học mới'
              ) : (
                <>
                  Bài {lesson.lessonNumber}: <span style={{ fontFamily: 'var(--font-hanzi)' }}>{lesson.titleZh}</span>
                </>
              )}
            </h3>
            <ContentStatusBadge status={isNewLesson ? 'DRAFT' : status} />
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-ghost ds-btn-sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        <div className="lcm-drawer-body">
          {saveError && (
            <div
              role="alert"
              style={{
                marginBottom: 'var(--space-3)',
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger, #ef4444)',
                fontSize: 'var(--text-xs)',
              }}
            >
              {saveError}
            </div>
          )}

          {saveSuccess && !saveError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-3)',
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                border: '1px solid rgba(22, 163, 74, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--success, #16a34a)',
                fontSize: 'var(--text-xs)',
              }}
            >
              <CheckCircle2 size={14} />
              <span>{saveSuccess}</span>
            </div>
          )}

          {isAtStandardCap && isEditing && (
            <div
              style={{
                marginBottom: 'var(--space-3)',
                padding: 'var(--space-3)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)',
                color: '#92400e',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                <AlertTriangle size={14} />
                <span>Cảnh báo định mức HSK 2.0 (HSK {hskLevel}: {currentCourseLessonCount}/{standardLessonLimit} bài)</span>
              </div>
              <p style={{ margin: '0 0 8px 0', lineHeight: 1.45 }}>
                Chương trình HSK {hskLevel} đã đủ {standardLessonLimit} bài theo chuẩn HSK 2.0. Không tự ý thêm bài mở rộng nếu chưa có nhu cầu biên soạn bổ sung hoặc kiểm thử quản trị.
              </p>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={allowExceedStandardLimit}
                  onChange={(e) => setAllowExceedStandardLimit(e.target.checked)}
                  disabled={isSubmitting}
                />
                <span>Xác nhận thêm bài bổ sung (mặc định DRAFT, không tự xuất bản)</span>
              </label>
            </div>
          )}

          {/* Thông tin siêu dữ liệu bài học */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>
              1. Thông tin chung bài học
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="lcm-form-group">
                <label className="lcm-form-label">Số bài học *</label>
                {isEditing ? (
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className="lcm-form-input"
                    value={lessonNumber}
                    onChange={(e) => setLessonNumber(Number(e.target.value))}
                    disabled={isSubmitting}
                  />
                ) : (
                  <span style={{ fontWeight: 600 }}>Bài #{lessonNumber}</span>
                )}
              </div>

              <div className="lcm-form-group">
                <label className="lcm-form-label">Phiên âm Pinyin</label>
                {isEditing ? (
                  <input
                    className="lcm-form-input"
                    placeholder="Ví dụ: Wǒ xiǎng hē chá"
                    value={pinyin}
                    onChange={(e) => setPinyin(e.target.value)}
                    disabled={isSubmitting}
                  />
                ) : (
                  <span style={{ color: 'var(--muted)' }}>{pinyin || '—'}</span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="lcm-form-group">
                <label className="lcm-form-label">Tiêu đề tiếng Trung (Hán tự) *</label>
                {isEditing ? (
                  <input
                    className="lcm-form-input"
                    placeholder="Ví dụ: 我想喝茶"
                    value={titleZh}
                    onChange={(e) => setTitleZh(e.target.value)}
                    disabled={isSubmitting}
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
                    placeholder="Ví dụ: Tôi muốn uống trà"
                    value={titleVi}
                    onChange={(e) => setTitleVi(e.target.value)}
                    disabled={isSubmitting}
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
                    min={1}
                    max={300}
                    className="lcm-form-input"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    disabled={isSubmitting}
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
                    min={0}
                    max={1000}
                    className="lcm-form-input"
                    value={xpReward}
                    onChange={(e) => setXpReward(Number(e.target.value))}
                    disabled={isSubmitting}
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
                    min={1}
                    className="lcm-form-input"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value))}
                    disabled={isSubmitting}
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
                  placeholder="Mô tả mục tiêu giao tiếp và kiến thức trọng tâm..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  disabled={isSubmitting}
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
                isNewLesson ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <ContentStatusBadge status="DRAFT" />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                      Mặc định DRAFT — bài mới bắt buộc phải qua kiểm duyệt trước khi xuất bản.
                    </span>
                  </div>
                ) : (
                  <select
                    className="lcm-form-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ContentStatus)}
                    disabled={isSubmitting}
                  >
                    <option value="DRAFT">Bản nháp (DRAFT)</option>
                    <option value="PENDING_REVIEW">Chờ duyệt (PENDING_REVIEW)</option>
                    {lesson.status === 'PUBLISHED' && (
                      <option value="PUBLISHED">Đã xuất bản (PUBLISHED)</option>
                    )}
                    <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
                  </select>
                )
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--primary)', marginBottom: '4px' }}>
                  <strong style={{ fontSize: 'var(--text-sm)' }}>Hội thoại & Luyện nghe</strong>
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                  {isNewLesson ? 'Chưa cấu hình (mở trình soạn sau khi lưu)' : 'Chỉnh sửa trong Trình soạn bài'}
                </span>
              </div>
            </div>

            {/* Trình soạn bài nâng cao */}
            <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-4)', backgroundColor: '#f8fafc', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: '0 0 var(--space-2) 0' }}>
                {isNewLesson
                  ? 'Lưu bài học mới để nhận ID thật từ SQL Server trước khi mở trình biên tập 7 bước.'
                  : 'Trình biên soạn toàn diện 7 bước (Intro · Vocab · Grammar · Dialogue · Listening · Exercise · Quiz)'}
              </p>
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                disabled={isNewLesson || isSubmitting}
                onClick={() => {
                  if (lesson && !isNewLesson) {
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
          {!isNewLesson && onDelete && status !== 'PUBLISHED' && (
            <div style={{ marginRight: 'auto' }}>
              {confirmDelete ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="ds-btn ds-btn-sm"
                    style={{ backgroundColor: 'var(--danger, #ef4444)', color: '#fff', borderColor: 'var(--danger, #ef4444)' }}
                    onClick={handleDelete}
                    disabled={isSubmitting}
                  >
                    <Trash2 size={14} /> Xác nhận xóa bài
                  </button>
                  <button
                    type="button"
                    className="ds-btn ds-btn-ghost ds-btn-sm"
                    onClick={() => setConfirmDelete(false)}
                    disabled={isSubmitting}
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="ds-btn ds-btn-outline ds-btn-sm"
                  style={{ color: 'var(--danger, #ef4444)', borderColor: 'rgba(239, 68, 68, 0.35)' }}
                  onClick={() => setConfirmDelete(true)}
                  disabled={isSubmitting}
                >
                  <Trash2 size={14} /> Xóa bài
                </button>
              )}
            </div>
          )}

          {isEditing ? (
            <>
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                onClick={() => (isNewLesson ? onClose() : setIsEditing(false))}
                disabled={isSubmitting}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                onClick={handleSave}
                disabled={isSubmitting}
              >
                <Save size={14} /> {isSubmitting ? 'Đang lưu...' : isNewLesson ? 'Tạo bài học (DRAFT)' : 'Lưu thay đổi'}
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

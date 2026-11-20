import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, CheckCircle, ChevronDown, ChevronRight, RefreshCw, Save, AlertCircle } from 'lucide-react';
import { teacherPortalService } from '../../services';
import { curriculumService } from '../../../admin/content/services/curriculum.service';
import type { Course } from '../../../admin/content/types';
import type { ClassCurriculumDTO } from '../../types/class.types';

export interface ClassCurriculumTabProps {
  classId: string;
  className: string;
}

export const ClassCurriculumTab: React.FC<ClassCurriculumTabProps> = ({ classId, className }) => {
  const [curriculum, setCurriculum] = useState<ClassCurriculumDTO | null>(null);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teacherPortalService.getClassCurriculum(classId);
      setCurriculum(data);
      if (data.courseId) {
        setSelectedCourseId(data.courseId);
      }
      const courses = curriculumService.getCourses();
      setAvailableCourses(courses);

      // Expand all units initially
      const initialExpanded: Record<string, boolean> = {};
      data.units.forEach((u) => {
        initialExpanded[u.id] = true;
      });
      setExpandedUnits(initialExpanded);
    } catch (err: any) {
      console.error('[ClassCurriculumTab] Failed to load curriculum:', err);
      setError(err?.message || 'Không thể tải thông tin giáo trình lớp học.');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveCurriculum = async () => {
    if (!selectedCourseId) return;
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      await teacherPortalService.setClassCurriculum(classId, selectedCourseId);
      const refreshed = await teacherPortalService.getClassCurriculum(classId);
      setCurriculum(refreshed);
      setSuccessMsg('Đã cập nhật giáo trình cho lớp học thành công.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('[ClassCurriculumTab] Failed to update curriculum:', err);
      setError(err?.message || 'Có lỗi xảy ra khi gán giáo trình.');
    } finally {
      setSaving(false);
    }
  };

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitId]: !prev[unitId],
    }));
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--muted)' }}>
        Đang tải cấu trúc giáo trình lớp học...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header & Course Selection Card */}
      <div className="tp-card">
        <div className="tp-card-header" style={{ alignItems: 'flex-start' }}>
          <div>
            <h3 className="tp-card-title">
              <BookOpen size={18} style={{ color: 'var(--primary)' }} />
              Giáo Trình Đào Tạo — {className}
            </h3>
            <div className="tp-card-subtitle">
              Cấu hình bộ giáo trình chuẩn và theo dõi các chương bài học áp dụng cho lớp
            </div>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="ds-btn ds-btn-ghost ds-btn-sm"
            title="Làm mới giáo trình"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger, #ef4444)',
              fontSize: 'var(--text-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              fontSize: 'var(--text-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 'var(--space-3)',
            paddingTop: 'var(--space-2)',
          }}
        >
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--muted)',
                marginBottom: '4px',
              }}
            >
              CHỌN BỘ GIÁO TRÌNH ÁP DỤNG
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="ds-input"
              style={{ width: '100%' }}
            >
              <option value="">-- Chọn khóa học / giáo trình --</option>
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: '18px' }}>
            <button
              type="button"
              onClick={handleSaveCurriculum}
              disabled={saving || !selectedCourseId}
              className="ds-btn ds-btn-primary ds-btn-sm"
              style={{ gap: '6px' }}
            >
              <Save size={14} />
              {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </div>
      </div>

      {/* Units & Lessons View */}
      {curriculum && curriculum.units.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {curriculum.units.map((unit) => {
            const isExpanded = expandedUnits[unit.id] ?? true;
            return (
              <div
                key={unit.id}
                className="tp-card"
                style={{ padding: 0, overflow: 'hidden' }}
              >
                <div
                  onClick={() => toggleUnit(unit.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-4)',
                    cursor: 'pointer',
                    backgroundColor: 'var(--surface)',
                    borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--foreground)' }}>
                      Chương {unit.unitNumber}: {unit.title}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--neutral-bg)',
                        color: 'var(--muted)',
                      }}
                    >
                      {unit.lessons.length} bài học
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: 'var(--space-2) var(--space-4)' }}>
                    {unit.lessons.length === 0 ? (
                      <div style={{ padding: 'var(--space-3)', color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
                        Chưa có bài học nào trong chương này.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {unit.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: 'var(--space-3) 0',
                              borderBottom: '1px solid var(--border)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: 'var(--primary)',
                                  width: '45px',
                                  flexShrink: 0,
                                }}
                              >
                                Bài {lesson.lessonNumber}
                              </span>
                              <div>
                                <span style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--foreground)' }}>
                                  {lesson.title}
                                </span>
                                {lesson.pinyinTitle && (
                                  <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '8px' }}>
                                    ({lesson.pinyinTitle})
                                  </span>
                                )}
                                {lesson.vietnameseTitle && (
                                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                                    {lesson.vietnameseTitle}
                                  </div>
                                )}
                              </div>
                            </div>

                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: lesson.isPublished ? 'rgba(16, 185, 129, 0.1)' : 'var(--neutral-bg)',
                                color: lesson.isPublished ? '#059669' : 'var(--muted)',
                              }}
                            >
                              {lesson.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="tp-card"
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 'var(--text-sm)',
          }}
        >
          Lớp học chưa được gán giáo trình đào tạo. Vui lòng chọn một bộ giáo trình ở trên và nhấn "Lưu Thay Đổi".
        </div>
      )}
    </div>
  );
};

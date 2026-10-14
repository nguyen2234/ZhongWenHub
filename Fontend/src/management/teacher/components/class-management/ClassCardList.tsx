import React from 'react';
import { Eye, Edit2, Archive, Video, MapPin, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../../shared/components';
import type { ClassLifecycleStatus, ClassSummaryDTO } from '../../types/class.types';

export interface ClassCardListProps {
  classes: ClassSummaryDTO[];
  onEdit: (cls: ClassSummaryDTO) => void;
  onArchive: (cls: ClassSummaryDTO) => void;
}

export const ClassCardList: React.FC<ClassCardListProps> = ({
  classes,
  onEdit,
  onArchive,
}) => {
  const getStatusVariant = (status: ClassLifecycleStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'UPCOMING':
        return 'info';
      case 'DRAFT':
        return 'warning';
      case 'COMPLETED':
        return 'neutral';
      case 'ARCHIVED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const getStatusLabel = (status: ClassLifecycleStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'Đang dạy';
      case 'UPCOMING':
        return 'Sắp mở';
      case 'DRAFT':
        return 'Bản nháp';
      case 'COMPLETED':
        return 'Đã kết thúc';
      case 'ARCHIVED':
        return 'Đã lưu trữ';
      default:
        return status;
    }
  };

  if (classes.length === 0) {
    return (
      <div
        style={{
          padding: 'var(--space-8) var(--space-4)',
          textAlign: 'center',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--muted)',
          fontSize: 'var(--text-sm)',
        }}
      >
        Không tìm thấy lớp học nào phù hợp.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      {classes.map((cls) => {
        const fillPercent = Math.min(
          100,
          Math.round((cls.derivedEnrollmentCount / cls.capacity) * 100)
        );

        return (
          <div
            key={cls.id}
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'border-color 0.15s ease',
            }}
          >
            {/* Top row: Code + HSK pill + Status */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-2)',
                  gap: 'var(--space-2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      border: `1px solid ${cls.hskLevelColor}`,
                      color: cls.hskLevelColor,
                      backgroundColor: 'var(--background)',
                    }}
                  >
                    {cls.hskLevelName}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--muted)',
                    }}
                  >
                    {cls.code}
                  </span>
                </div>

                <StatusBadge
                  label={getStatusLabel(cls.status)}
                  variant={getStatusVariant(cls.status)}
                  size="sm"
                />
              </div>

              {/* Class Name */}
              <div
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 700,
                  color: 'var(--foreground)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <Link
                  to={`/management/teacher/classes/${cls.id}`}
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  {cls.name}
                </Link>
              </div>

              {/* Course info if available */}
              {cls.courseName && (
                <div
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--muted)',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  {cls.courseName}
                </div>
              )}

              {/* Metadata list */}
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} />
                  <span>{cls.schedulesSummary}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {cls.locationType === 'ONLINE' ? (
                    <>
                      <Video size={13} style={{ color: '#0284c7' }} />
                      <span>Trực tuyến (Zoom/Meet)</span>
                    </>
                  ) : (
                    <>
                      <MapPin size={13} style={{ color: '#ea580c' }} />
                      <span>{cls.roomLocation || 'Phòng học trực tiếp'}</span>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={13} />
                  <span>
                    Sĩ số: <strong>{cls.derivedEnrollmentCount}</strong>/{cls.capacity} học viên
                  </span>
                </div>
              </div>

              {/* Enrollment Progress */}
              <div
                style={{
                  height: '4px',
                  width: '100%',
                  backgroundColor: 'var(--background)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${fillPercent}%`,
                    backgroundColor: 'var(--primary)',
                  }}
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border)',
                paddingTop: 'var(--space-3)',
              }}
            >
              <Link
                to={`/management/teacher/classes/${cls.id}`}
                className="ds-btn ds-btn-sm ds-btn-outline"
                style={{ fontSize: '11px', height: '32px' }}
              >
                <Eye size={13} /> Xem chi tiết
              </Link>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => onEdit(cls)}
                  className="ds-btn ds-btn-ghost ds-btn-sm"
                  style={{ height: '32px', padding: '0 8px' }}
                  title="Chỉnh sửa"
                >
                  <Edit2 size={14} />
                </button>
                {cls.status !== 'ARCHIVED' && (
                  <button
                    type="button"
                    onClick={() => onArchive(cls)}
                    className="ds-btn ds-btn-ghost ds-btn-sm"
                    style={{ height: '32px', padding: '0 8px', color: 'var(--danger)' }}
                    title="Lưu trữ lớp"
                  >
                    <Archive size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

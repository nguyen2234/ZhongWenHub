import React from 'react';
import { ChevronRight, Edit2, Archive, Video, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../../shared/components';
import type { ClassDetailDTO, ClassLifecycleStatus } from '../../types/class.types';

export interface ClassDetailHeaderProps {
  detail: ClassDetailDTO;
  onEdit: () => void;
  onArchive: () => void;
}

export const ClassDetailHeader: React.FC<ClassDetailHeaderProps> = ({
  detail,
  onEdit,
  onArchive,
}) => {
  const { classInfo, hskLevel } = detail;

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
        return 'Đang giảng dạy';
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

  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: 'var(--text-xs)',
          color: 'var(--muted)',
          marginBottom: 'var(--space-2)',
        }}
      >
        <Link
          to="/management/teacher/dashboard"
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          Teacher Portal
        </Link>
        <ChevronRight size={13} />
        <Link
          to="/management/teacher/classes"
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          Lớp của tôi
        </Link>
        <ChevronRight size={13} />
        <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{classInfo.code}</span>
      </nav>

      {/* Main Title Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: '4px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                color: 'var(--primary)',
                backgroundColor: 'var(--primary-light)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              {classInfo.code}
            </span>

            {hskLevel && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${hskLevel.colorToken}`,
                  color: hskLevel.colorToken,
                  backgroundColor: 'var(--background)',
                }}
              >
                {hskLevel.name} ({hskLevel.levelCode})
              </span>
            )}

            <StatusBadge
              label={getStatusLabel(classInfo.status)}
              variant={getStatusVariant(classInfo.status)}
              size="sm"
            />
          </div>

          <h1
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 700,
              color: 'var(--foreground)',
              margin: '0 0 6px 0',
            }}
          >
            {classInfo.name}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              fontSize: 'var(--text-xs)',
              color: 'var(--muted)',
              flexWrap: 'wrap',
            }}
          >
            <span>
              Khai giảng: <strong>{classInfo.startDate}</strong>
            </span>
            {classInfo.endDate && (
              <span>
                Bế giảng: <strong>{classInfo.endDate}</strong>
              </span>
            )}
            <span>
              Sĩ số: <strong>{detail.derivedEnrollmentCount}</strong>/{classInfo.capacity} học viên
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {classInfo.locationType === 'ONLINE' ? (
                <>
                  <Video size={13} style={{ color: '#0284c7' }} /> Trực tuyến Zoom/Meet
                </>
              ) : (
                <>
                  <MapPin size={13} style={{ color: '#ea580c' }} />{' '}
                  {classInfo.roomLocation || 'Phòng học trực tiếp'}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button
            type="button"
            onClick={onEdit}
            className="ds-btn ds-btn-outline ds-btn-sm"
            style={{ height: '36px', gap: '6px' }}
          >
            <Edit2 size={14} /> Chỉnh sửa
          </button>

          {classInfo.status !== 'ARCHIVED' && (
            <button
              type="button"
              onClick={onArchive}
              className="ds-btn ds-btn-ghost ds-btn-sm"
              style={{ height: '36px', gap: '6px', color: 'var(--danger)' }}
            >
              <Archive size={14} /> Lưu trữ lớp
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

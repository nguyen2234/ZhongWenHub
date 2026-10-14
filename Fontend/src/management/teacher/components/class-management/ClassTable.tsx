import React from 'react';
import { Eye, Edit2, Archive, Video, MapPin, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../../shared/components';
import type { ClassLifecycleStatus, ClassSummaryDTO } from '../../types/class.types';

export interface ClassTableProps {
  classes: ClassSummaryDTO[];
  onEdit: (cls: ClassSummaryDTO) => void;
  onArchive: (cls: ClassSummaryDTO) => void;
}

export const ClassTable: React.FC<ClassTableProps> = ({
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
          padding: 'var(--space-12) var(--space-4)',
          textAlign: 'center',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--muted)',
        }}
      >
        <Layers size={32} style={{ color: 'var(--muted)', marginBottom: '8px', opacity: 0.5 }} />
        <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--foreground)' }}>
          Không tìm thấy lớp học nào
        </div>
        <div style={{ fontSize: 'var(--text-xs)', marginTop: '4px' }}>
          Hãy thử điều chỉnh bộ lọc tìm kiếm hoặc tạo một lớp học mới.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: 'var(--text-xs)',
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
            }}
          >
            <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--muted)' }}>
              MÃ LỚP
            </th>
            <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--muted)' }}>
              TÊN LỚP HỌC
            </th>
            <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--muted)' }}>
              CẤP ĐỘ
            </th>
            <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--muted)' }}>
              SĨ SỐ (ACTIVE)
            </th>
            <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--muted)' }}>
              LỊCH DẠY TRONG TUẦN
            </th>
            <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--muted)' }}>
              HÌNH THỨC
            </th>
            <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--muted)' }}>
              TRẠNG THÁI
            </th>
            <th
              style={{
                padding: '12px 14px',
                fontWeight: 600,
                color: 'var(--muted)',
                textAlign: 'right',
              }}
            >
              THAO TÁC
            </th>
          </tr>
        </thead>
        <tbody>
          {classes.map((cls) => (
            <tr
              key={cls.id}
              style={{
                borderBottom: '1px solid var(--border)',
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* Mã lớp */}
              <td style={{ padding: '12px 14px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--primary)',
                  }}
                >
                  {cls.code}
                </span>
              </td>

              {/* Tên lớp & giáo trình */}
              <td style={{ padding: '12px 14px' }}>
                <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                  <Link
                    to={`/management/teacher/classes/${cls.id}`}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {cls.name}
                  </Link>
                </div>
                {cls.courseName && (
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    {cls.courseName}
                  </div>
                )}
              </td>

              {/* Cấp độ HSK */}
              <td style={{ padding: '12px 14px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    border: `1px solid ${cls.hskLevelColor}`,
                    color: cls.hskLevelColor,
                    backgroundColor: 'var(--background)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cls.hskLevelName}
                </span>
              </td>

              {/* Sĩ số thực tế derived */}
              <td style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 700 }}>
                    {cls.derivedEnrollmentCount}/{cls.capacity}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--muted)' }}>học viên</span>
                </div>
                <div
                  style={{
                    height: '4px',
                    width: '64px',
                    backgroundColor: 'var(--background)',
                    borderRadius: 'var(--radius-full)',
                    marginTop: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, (cls.derivedEnrollmentCount / cls.capacity) * 100)}%`,
                      backgroundColor: 'var(--primary)',
                    }}
                  />
                </div>
              </td>

              {/* Lịch dạy trong tuần */}
              <td style={{ padding: '12px 14px', color: 'var(--foreground)' }}>
                {cls.schedulesSummary}
              </td>

              {/* Hình thức đào tạo */}
              <td style={{ padding: '12px 14px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--muted)',
                  }}
                >
                  {cls.locationType === 'ONLINE' ? (
                    <>
                      <Video size={13} style={{ color: '#0284c7' }} /> Online
                    </>
                  ) : (
                    <>
                      <MapPin size={13} style={{ color: '#ea580c' }} />{' '}
                      {cls.locationType === 'HYBRID' ? 'Hybrid' : 'Offline'}
                    </>
                  )}
                </span>
              </td>

              {/* Trạng thái vòng đời */}
              <td style={{ padding: '12px 14px' }}>
                <StatusBadge
                  label={getStatusLabel(cls.status)}
                  variant={getStatusVariant(cls.status)}
                  size="sm"
                />
              </td>

              {/* Nút hành động */}
              <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    justifyContent: 'flex-end',
                  }}
                >
                  <Link
                    to={`/management/teacher/classes/${cls.id}`}
                    className="ds-btn ds-btn-ghost ds-btn-sm"
                    style={{ padding: '4px 6px', height: '28px' }}
                    title="Xem chi tiết lớp"
                  >
                    <Eye size={14} />
                  </Link>

                  <button
                    type="button"
                    onClick={() => onEdit(cls)}
                    className="ds-btn ds-btn-ghost ds-btn-sm"
                    style={{ padding: '4px 6px', height: '28px' }}
                    title="Chỉnh sửa thông tin"
                  >
                    <Edit2 size={14} />
                  </button>

                  {cls.status !== 'ARCHIVED' && (
                    <button
                      type="button"
                      onClick={() => onArchive(cls)}
                      className="ds-btn ds-btn-ghost ds-btn-sm"
                      style={{ padding: '4px 6px', height: '28px', color: 'var(--danger)' }}
                      title="Lưu trữ lớp học"
                    >
                      <Archive size={14} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

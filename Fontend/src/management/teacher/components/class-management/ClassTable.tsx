import React, { useMemo } from 'react';
import { Eye, Edit2, Archive, Video, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusBadge, ManagementDataTable } from '../../../shared/components';
import type { TableColumn, RowAction } from '../../../shared/types';
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
  const navigate = useNavigate();

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

  const columns: TableColumn<ClassSummaryDTO>[] = useMemo(
    () => [
      {
        key: 'code',
        header: 'Mã lớp',
        width: '100px',
        render: (cls) => (
          <span
            style={{
              fontFamily: 'monospace',
              fontWeight: 700,
              color: 'var(--primary)',
            }}
          >
            {cls.code}
          </span>
        ),
      },
      {
        key: 'name',
        header: 'Tên lớp học',
        render: (cls) => (
          <div>
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
                Giáo trình: {cls.courseName}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'hskLevel',
        header: 'Cấp độ',
        width: '90px',
        render: (cls) => (
          <span
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: `${cls.hskLevelColor}15`,
              color: cls.hskLevelColor,
              border: `1px solid ${cls.hskLevelColor}30`,
            }}
          >
            {cls.hskLevelName}
          </span>
        ),
      },
      {
        key: 'studentCount',
        header: 'Sĩ số',
        align: 'center',
        width: '110px',
        render: (cls) => (
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {cls.derivedEnrollmentCount} / {cls.capacity}
          </span>
        ),
      },
      {
        key: 'scheduleSummary',
        header: 'Lịch dạy trong tuần',
        render: (cls) => (
          <span style={{ fontSize: '12px', color: 'var(--foreground)' }}>
            {cls.schedulesSummary}
          </span>
        ),
      },
      {
        key: 'deliveryMode',
        header: 'Hình thức',
        width: '110px',
        render: (cls) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            {cls.locationType === 'ONLINE' ? (
              <>
                <Video size={13} style={{ color: 'var(--primary)' }} />
                <span>Trực tuyến</span>
              </>
            ) : cls.locationType === 'OFFLINE' ? (
              <>
                <MapPin size={13} style={{ color: '#ca8a04' }} />
                <span>Tại trung tâm</span>
              </>
            ) : (
              <span>Kết hợp</span>
            )}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Trạng thái',
        width: '120px',
        render: (cls) => (
          <StatusBadge
            label={getStatusLabel(cls.status)}
            variant={getStatusVariant(cls.status)}
            size="sm"
          />
        ),
      },
    ],
    []
  );

  const rowActions: RowAction<ClassSummaryDTO>[] = useMemo(
    () => [
      {
        key: 'view',
        label: 'Vào lớp học',
        icon: <Eye size={15} />,
        onClick: (cls) => navigate(`/management/teacher/classes/${cls.id}`),
      },
      {
        key: 'edit',
        label: 'Chỉnh sửa thông tin',
        icon: <Edit2 size={15} />,
        onClick: (cls) => onEdit(cls),
      },
      {
        key: 'archive',
        label: 'Lưu trữ lớp',
        icon: <Archive size={15} />,
        variant: 'danger',
        requireConfirm: true,
        confirmTitle: 'Xác nhận lưu trữ lớp học',
        confirmMessage: (cls) =>
          `Bạn có chắc chắn muốn lưu trữ lớp học "${cls.name}" (${cls.code})? Lớp học sẽ chuyển sang trạng thái ARCHIVED.`,
        onClick: (cls) => onArchive(cls),
        hidden: (cls) => cls.status === 'ARCHIVED',
      },
    ],
    [navigate, onEdit, onArchive]
  );

  return (
    <ManagementDataTable<ClassSummaryDTO>
      columns={columns}
      data={classes}
      keyExtractor={(cls) => cls.id}
      onRowClick={(cls) => navigate(`/management/teacher/classes/${cls.id}`)}
      rowActions={rowActions}
      emptyText="Không tìm thấy lớp học nào phù hợp với bộ lọc."
      enableMobileCards
      mobileTitleExtractor={(cls) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--primary-subtle, rgba(2, 132, 199, 0.08))',
              color: 'var(--primary)',
            }}
          >
            {cls.code}
          </span>
          <span style={{ fontWeight: 600 }}>{cls.name}</span>
        </div>
      )}
      mobileSubtitleExtractor={(cls) => (
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
          {cls.courseName ? `Giáo trình: ${cls.courseName} • ` : ''}{cls.schedulesSummary}
        </span>
      )}
      mobileBadgeExtractor={(cls) => (
        <StatusBadge
          label={getStatusLabel(cls.status)}
          variant={getStatusVariant(cls.status)}
          size="sm"
        />
      )}
      mobileFields={[
        {
          label: 'Sĩ số',
          render: (cls) => (
            <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {cls.derivedEnrollmentCount} / {cls.capacity} học viên
            </span>
          ),
        },
        {
          label: 'Hình thức',
          render: (cls) => (
            <span>{cls.locationType === 'ONLINE' ? 'Trực tuyến' : 'Tại trung tâm'}</span>
          ),
        },
      ]}
    />
  );
};

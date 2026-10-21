import React, { useMemo } from 'react';
import { Eye, Edit2, CalendarCheck, Lock, Unlock } from 'lucide-react';
import { StatusBadge, ManagementDataTable } from '../../../shared/components';
import type { TableColumn, RowAction } from '../../../shared/types';
import type {
  TeacherListItem,
  TeacherSort,
  TeacherSortField,
  TeacherTeachingStatus,
} from '../types/teacher.types';
import { SPECIALIZATION_META } from '../types/teacher.types';

export interface TeacherTableProps {
  teachers: TeacherListItem[];
  selectedIds: string[];
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectTeacher: (id: string, checked: boolean) => void;
  selectedTeacherId: string | null;
  onSelectTeacher: (teacher: TeacherListItem) => void;
  onEditTeacher: (teacher: TeacherListItem) => void;
  onChangeTeachingStatus: (teacher: TeacherListItem) => void;
  onToggleLockAccount: (teacher: TeacherListItem) => void;
  sort: TeacherSort;
  onSortChange: (field: TeacherSortField) => void;
}

export const TeacherTable: React.FC<TeacherTableProps> = ({
  teachers,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectTeacher,
  selectedTeacherId: _selectedTeacherId,
  onSelectTeacher,
  onEditTeacher,
  onChangeTeachingStatus,
  onToggleLockAccount,
  sort,
  onSortChange,
}) => {
  const getTeachingStatusBadge = (status: TeacherTeachingStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <StatusBadge variant="success" label="Đang giảng dạy" />;
      case 'ON_LEAVE':
        return <StatusBadge variant="warning" label="Tạm nghỉ" />;
      case 'INACTIVE':
        return <StatusBadge variant="neutral" label="Ngừng giảng dạy" />;
    }
  };

  const columns: TableColumn<TeacherListItem>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Giáo viên',
        sortable: true,
        sortField: 'name',
        render: (teacher) => {
          const initials = teacher.name
            .split(' ')
            .map((w) => w[0])
            .slice(-2)
            .join('')
            .toUpperCase();

          return (
            <div className="teacher-cell-profile">
              <div className="teacher-avatar-badge" aria-hidden="true">
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="teacher-name-title">{teacher.name}</div>
                <div className="teacher-email-subtitle">{teacher.email}</div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'specializations',
        header: 'Cấp độ & Chuyên môn',
        render: (teacher) => {
          const specLabels = teacher.specializations.map(
            (s) => SPECIALIZATION_META[s]?.shortLabel || s
          );
          const primarySpecs = specLabels.slice(0, 2).join(' • ');
          const remainingCount = specLabels.length - 2;

          return (
            <div className="teacher-levels-cell">
              <div className="teacher-level-pill-row">
                {teacher.teachingLevels.slice(0, 3).map((lvl) => (
                  <span key={lvl} className="hsk-level-mini-tag">
                    {lvl}
                  </span>
                ))}
                {teacher.teachingLevels.length > 3 && (
                  <span className="hsk-level-mini-tag">
                    +{teacher.teachingLevels.length - 3}
                  </span>
                )}
              </div>
              <div className="teacher-spec-summary-text" title={specLabels.join(', ')}>
                {primarySpecs}
                {remainingCount > 0 && ` +${remainingCount}`}
              </div>
            </div>
          );
        },
      },
      {
        key: 'teachingStatus',
        header: 'Trạng thái dạy',
        render: (teacher) => (
          <div className="teaching-status-group">
            {getTeachingStatusBadge(teacher.teachingStatus)}
            {teacher.accountStatus === 'LOCKED' && (
              <span className="account-status-subtag locked" title="Tài khoản bị khóa đăng nhập">
                TK: Khóa
              </span>
            )}
            {teacher.accountStatus === 'PENDING' && (
              <span className="account-status-subtag pending" title="Tài khoản chờ duyệt">
                TK: Chờ duyệt
              </span>
            )}
            {teacher.accountStatus === 'INACTIVE' && (
              <span className="account-status-subtag inactive" title="Tài khoản ngừng hoạt động">
                TK: Ngừng HĐ
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'classCount',
        header: 'Lớp',
        sortable: true,
        sortField: 'classCount',
        align: 'center',
        width: '80px',
        render: (teacher) => (
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {teacher.classCount}
          </span>
        ),
      },
      {
        key: 'studentCount',
        header: 'Học viên',
        sortable: true,
        sortField: 'studentCount',
        align: 'center',
        width: '100px',
        render: (teacher) => (
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {teacher.studentCount}
          </span>
        ),
      },
      {
        key: 'lastActive',
        header: 'Hoạt động',
        sortable: true,
        sortField: 'lastActive',
        width: '130px',
        render: (teacher) => (
          <span style={{ fontSize: '11px', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
            {teacher.lastActiveAt}
          </span>
        ),
      },
    ],
    []
  );

  const rowActions: RowAction<TeacherListItem>[] = useMemo(
    () => [
      {
        key: 'view',
        label: 'Xem chi tiết',
        icon: <Eye size={15} />,
        onClick: (teacher: TeacherListItem) => onSelectTeacher(teacher),
      },
      {
        key: 'edit',
        label: 'Chỉnh sửa hồ sơ',
        icon: <Edit2 size={15} />,
        onClick: (teacher: TeacherListItem) => onEditTeacher(teacher),
      },
      {
        key: 'status',
        label: 'Đổi trạng thái giảng dạy',
        icon: <CalendarCheck size={15} />,
        onClick: (teacher: TeacherListItem) => onChangeTeachingStatus(teacher),
      },
      {
        key: 'toggle_lock',
        label: (t: TeacherListItem) =>
          t.accountStatus === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản',
        icon: (t: TeacherListItem) =>
          t.accountStatus === 'LOCKED' ? (
            <Unlock size={15} style={{ color: '#16a34a' }} />
          ) : (
            <Lock size={15} style={{ color: '#dc2626' }} />
          ),
        variant: 'danger',
        onClick: (teacher: TeacherListItem) => onToggleLockAccount(teacher),
      },
    ],
    [onSelectTeacher, onEditTeacher, onChangeTeachingStatus, onToggleLockAccount]
  );

  return (
    <div className="teacher-table-desktop">
      <ManagementDataTable
        columns={columns}
        data={teachers}
        keyExtractor={(teacher) => teacher.id}
        selectable
        selectedIds={selectedIds}
        onSelectRow={(id, checked) => onToggleSelectTeacher(String(id), checked)}
        onSelectAll={onToggleSelectAll}
        onRowClick={onSelectTeacher}
        sortConfig={{ field: sort.field, direction: sort.direction }}
        onSortChange={(field) => onSortChange(field as TeacherSortField)}
        rowActions={rowActions}
        emptyText="Không tìm thấy giáo viên nào phù hợp với bộ lọc."
        enableMobileCards={false} // TeacherPage handles mobile cards through TeacherCardList
      />
    </div>
  );
};

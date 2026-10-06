import React, { useState, useEffect, useRef } from 'react';
import {
  MoreHorizontal,
  Eye,
  Edit2,
  CalendarCheck,
  Lock,
  Unlock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { StatusBadge } from '../../../shared/components';
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
  selectedTeacherId,
  onSelectTeacher,
  onEditTeacher,
  onChangeTeachingStatus,
  onToggleLockAccount,
  sort,
  onSortChange,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const allSelected = teachers.length > 0 && selectedIds.length === teachers.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < teachers.length;

  const renderSortIndicator = (field: TeacherSortField) => {
    if (sort.field !== field) {
      return <ArrowUpDown size={12} className="sort-icon-inactive" />;
    }
    return sort.direction === 'asc' ? (
      <ArrowUp size={12} className="sort-icon-active" />
    ) : (
      <ArrowDown size={12} className="sort-icon-active" />
    );
  };

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

  return (
    <div className="teacher-table-desktop">
      <table className="data-table" role="table" aria-label="Bảng danh sách giáo viên">
        <thead>
          <tr>
            <th style={{ width: '40px', textAlign: 'center' }}>
              <input
                type="checkbox"
                aria-label="Chọn tất cả giáo viên"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={(e) => onToggleSelectAll(e.target.checked)}
              />
            </th>
            <th
              style={{ cursor: 'pointer' }}
              onClick={() => onSortChange('name')}
              aria-sort={sort.field === 'name' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                GIÁO VIÊN {renderSortIndicator('name')}
              </div>
            </th>
            <th style={{ minWidth: '180px' }}>CẤP ĐỘ & CHUYÊN MÔN</th>
            <th style={{ minWidth: '150px' }}>TRẠNG THÁI DẠY</th>
            <th
              style={{ width: '80px', textAlign: 'center', cursor: 'pointer' }}
              onClick={() => onSortChange('classCount')}
              aria-sort={sort.field === 'classCount' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                LỚP {renderSortIndicator('classCount')}
              </div>
            </th>
            <th
              style={{ width: '100px', textAlign: 'center', cursor: 'pointer' }}
              onClick={() => onSortChange('studentCount')}
              aria-sort={sort.field === 'studentCount' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                HỌC VIÊN {renderSortIndicator('studentCount')}
              </div>
            </th>
            <th
              style={{ minWidth: '130px', cursor: 'pointer' }}
              onClick={() => onSortChange('lastActive')}
              aria-sort={sort.field === 'lastActive' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                HOẠT ĐỘNG {renderSortIndicator('lastActive')}
              </div>
            </th>
            <th style={{ width: '56px', textAlign: 'center' }}>
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => {
            const isSelected = selectedIds.includes(teacher.id);
            const isDrawerTarget = selectedTeacherId === teacher.id;
            const initials = teacher.name
              .split(' ')
              .map((w) => w[0])
              .slice(-2)
              .join('')
              .toUpperCase();

            // Format specializations compactly: "Ngữ pháp • Luyện thi HSK" or "+N"
            const specLabels = teacher.specializations.map(
              (s) => SPECIALIZATION_META[s]?.shortLabel || s
            );
            const primarySpecs = specLabels.slice(0, 2).join(' • ');
            const remainingCount = specLabels.length - 2;

            return (
              <tr
                key={teacher.id}
                className={`teacher-table-row ${isDrawerTarget ? 'active-row' : ''}`}
                onClick={() => onSelectTeacher(teacher)}
              >
                {/* Checkbox */}
                <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`Chọn giáo viên ${teacher.name}`}
                    checked={isSelected}
                    onChange={(e) => onToggleSelectTeacher(teacher.id, e.target.checked)}
                  />
                </td>

                {/* Profile (Avatar, Name, Email) */}
                <td>
                  <div className="teacher-cell-profile">
                    <div className="teacher-avatar-badge" aria-hidden="true">
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="teacher-name-title">{teacher.name}</div>
                      <div className="teacher-email-subtitle">{teacher.email}</div>
                    </div>
                  </div>
                </td>

                {/* Levels & Specializations */}
                <td>
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
                </td>

                {/* Teaching Status + Account Status subtag */}
                <td>
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
                </td>

                {/* Class count */}
                <td style={{ textAlign: 'center', fontWeight: 600 }}>
                  {teacher.classCount}
                </td>

                {/* Student count */}
                <td style={{ textAlign: 'center', fontWeight: 600 }}>
                  {teacher.studentCount}
                </td>

                {/* Last active */}
                <td style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {teacher.lastActiveAt}
                </td>

                {/* Actions ⋯ */}
                <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <div className="teacher-action-wrapper" ref={openMenuId === teacher.id ? menuRef : null}>
                    <button
                      type="button"
                      className="btn-teacher-row-action"
                      aria-label={`Thao tác cho ${teacher.name}`}
                      aria-expanded={openMenuId === teacher.id}
                      onClick={() =>
                        setOpenMenuId((prev) => (prev === teacher.id ? null : teacher.id))
                      }
                    >
                      <MoreHorizontal size={15} />
                    </button>

                    {openMenuId === teacher.id && (
                      <div className="teacher-dropdown-popover" role="menu">
                        <button
                          type="button"
                          className="teacher-dropdown-item"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null);
                            onSelectTeacher(teacher);
                          }}
                        >
                          <Eye size={13} />
                          Xem chi tiết
                        </button>

                        <button
                          type="button"
                          className="teacher-dropdown-item"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null);
                            onEditTeacher(teacher);
                          }}
                        >
                          <Edit2 size={13} />
                          Chỉnh sửa
                        </button>

                        <button
                          type="button"
                          className="teacher-dropdown-item"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null);
                            onChangeTeachingStatus(teacher);
                          }}
                        >
                          <CalendarCheck size={13} />
                          Đổi trạng thái dạy
                        </button>

                        <div className="teacher-dropdown-separator" />

                        {teacher.accountStatus === 'LOCKED' ? (
                          <button
                            type="button"
                            className="teacher-dropdown-item"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenuId(null);
                              onToggleLockAccount(teacher);
                            }}
                          >
                            <Unlock size={13} />
                            Mở khóa tài khoản
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="teacher-dropdown-item danger"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenuId(null);
                              onToggleLockAccount(teacher);
                            }}
                          >
                            <Lock size={13} />
                            Khóa tài khoản
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

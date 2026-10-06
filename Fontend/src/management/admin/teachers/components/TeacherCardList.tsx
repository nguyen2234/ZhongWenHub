import React, { useState } from 'react';
import { MoreHorizontal, Eye, Edit2, CalendarCheck, Lock, Unlock } from 'lucide-react';
import { StatusBadge } from '../../../shared/components';
import type { TeacherListItem, TeacherTeachingStatus } from '../types/teacher.types';
import { SPECIALIZATION_META } from '../types/teacher.types';

export interface TeacherCardListProps {
  teachers: TeacherListItem[];
  onSelectTeacher: (teacher: TeacherListItem) => void;
  onEditTeacher: (teacher: TeacherListItem) => void;
  onChangeTeachingStatus: (teacher: TeacherListItem) => void;
  onToggleLockAccount: (teacher: TeacherListItem) => void;
}

export const TeacherCardList: React.FC<TeacherCardListProps> = ({
  teachers,
  onSelectTeacher,
  onEditTeacher,
  onChangeTeachingStatus,
  onToggleLockAccount,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const getTeachingStatusBadge = (status: TeacherTeachingStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <StatusBadge variant="success" label="Đang dạy" />;
      case 'ON_LEAVE':
        return <StatusBadge variant="warning" label="Tạm nghỉ" />;
      case 'INACTIVE':
        return <StatusBadge variant="neutral" label="Ngừng dạy" />;
    }
  };

  return (
    <div className="teacher-cards-mobile" role="feed" aria-label="Danh sách giáo viên dạng thẻ">
      {teachers.map((teacher) => {
        const initials = teacher.name
          .split(' ')
          .map((w) => w[0])
          .slice(-2)
          .join('')
          .toUpperCase();

        const specLabels = teacher.specializations.map(
          (s) => SPECIALIZATION_META[s]?.shortLabel || s
        );

        return (
          <div
            key={teacher.id}
            className="teacher-mobile-card"
            onClick={() => onSelectTeacher(teacher)}
            role="article"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectTeacher(teacher);
              }
            }}
          >
            {/* Header: Avatar, Info, Status, Action */}
            <div className="teacher-mobile-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div className="teacher-avatar-badge" aria-hidden="true">
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="teacher-name-title">{teacher.name}</div>
                  <div className="teacher-email-subtitle">{teacher.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                {getTeachingStatusBadge(teacher.teachingStatus)}

                <div className="teacher-action-wrapper">
                  <button
                    type="button"
                    className="btn-teacher-row-action"
                    aria-label={`Thao tác cho ${teacher.name}`}
                    onClick={() =>
                      setActiveMenuId((prev) => (prev === teacher.id ? null : teacher.id))
                    }
                  >
                    <MoreHorizontal size={15} />
                  </button>

                  {activeMenuId === teacher.id && (
                    <div className="teacher-dropdown-popover" role="menu">
                      <button
                        type="button"
                        className="teacher-dropdown-item"
                        role="menuitem"
                        onClick={() => {
                          setActiveMenuId(null);
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
                          setActiveMenuId(null);
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
                          setActiveMenuId(null);
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
                            setActiveMenuId(null);
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
                            setActiveMenuId(null);
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
              </div>
            </div>

            {/* Teaching Levels & Specializations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="teacher-level-pill-row">
                {teacher.teachingLevels.map((lvl) => (
                  <span key={lvl} className="hsk-level-mini-tag">
                    {lvl}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                {specLabels.join(' • ')}
              </div>
            </div>

            {/* Meta Grid */}
            <div className="teacher-mobile-meta-grid">
              <div>
                <span style={{ color: 'var(--muted)' }}>Lớp phụ trách: </span>
                <strong style={{ color: 'var(--foreground)' }}>{teacher.classCount}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--muted)' }}>Học viên: </span>
                <strong style={{ color: 'var(--foreground)' }}>{teacher.studentCount}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--muted)' }}>Hoạt động: </span>
                <span style={{ color: 'var(--foreground)' }}>{teacher.lastActiveAt}</span>
              </div>
              <div>
                <span style={{ color: 'var(--muted)' }}>Tài khoản: </span>
                <strong
                  style={{
                    color:
                      teacher.accountStatus === 'LOCKED'
                        ? 'var(--danger)'
                        : teacher.accountStatus === 'ACTIVE'
                        ? '#16a34a'
                        : '#d97706',
                  }}
                >
                  {teacher.accountStatus === 'ACTIVE'
                    ? 'Hoạt động'
                    : teacher.accountStatus === 'LOCKED'
                    ? 'Bị khóa'
                    : teacher.accountStatus === 'PENDING'
                    ? 'Chờ duyệt'
                    : 'Ngừng HĐ'}
                </strong>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  X,
  Edit2,
  CalendarCheck,
  Lock,
  Unlock,
  BookOpen,
  Award,
  Clock,
  Save,
  RotateCcw,
} from 'lucide-react';
import { StatusBadge } from '../../../shared/components';
import type {
  TeacherDetail,
  TeacherSpecialization,
  TeacherTeachingStatus,
  TeachingLevel,
  UpdateTeacherDTO,
} from '../types/teacher.types';
import { SPECIALIZATION_META } from '../types/teacher.types';

export interface TeacherDetailDrawerProps {
  isOpen: boolean;
  teacher: TeacherDetail | null;
  onClose: () => void;
  onSaveEdit: (id: string, dto: UpdateTeacherDTO) => void;
  onChangeTeachingStatus: (teacher: TeacherDetail) => void;
  onToggleLockAccount: (teacher: TeacherDetail) => void;
}

const ALL_LEVELS: TeachingLevel[] = [
  'HSK 1',
  'HSK 2',
  'HSK 3',
  'HSK 4',
  'HSK 5',
  'HSK 6',
  'HSK 7–9',
];

const ALL_SPECIALIZATIONS: TeacherSpecialization[] = [
  'GRAMMAR',
  'VOCABULARY',
  'PRONUNCIATION',
  'CONVERSATION',
  'LISTENING',
  'WRITING',
  'HSKK',
  'HSK_EXAM',
];

export const TeacherDetailDrawer: React.FC<TeacherDetailDrawerProps> = ({
  isOpen,
  teacher,
  onClose,
  onSaveEdit,
  onChangeTeachingStatus,
  onToggleLockAccount,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [prevTeacherId, setPrevTeacherId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateTeacherDTO>({
    name: '',
    email: '',
    phone: '',
    teachingLevels: [],
    specializations: [],
    qualifications: '',
    experienceYears: 0,
    teachingStatus: 'ACTIVE',
    bio: '',
  });

  if (teacher && teacher.id !== prevTeacherId) {
    setPrevTeacherId(teacher.id);
    setIsEditing(false);
  }

  const handleStartEdit = () => {
    if (!teacher) return;
    setEditForm({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '',
      teachingLevels: [...teacher.teachingLevels],
      specializations: [...teacher.specializations],
      qualifications: teacher.profile.qualifications,
      experienceYears: teacher.profile.experienceYears,
      teachingStatus: teacher.teachingStatus,
      accountStatus: teacher.accountStatus,
      bio: teacher.profile.bio || '',
    });
    setIsEditing(true);
  };

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditing) {
          setIsEditing(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isEditing, onClose]);

  if (!isOpen || !teacher) return null;

  const initials = teacher.name
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const handleToggleLevel = (lvl: TeachingLevel) => {
    setEditForm((prev) => {
      const exists = prev.teachingLevels.includes(lvl);
      const updated = exists
        ? prev.teachingLevels.filter((l) => l !== lvl)
        : [...prev.teachingLevels, lvl];
      return { ...prev, teachingLevels: updated };
    });
  };

  const handleToggleSpec = (spec: TeacherSpecialization) => {
    setEditForm((prev) => {
      const exists = prev.specializations.includes(spec);
      const updated = exists
        ? prev.specializations.filter((s) => s !== spec)
        : [...prev.specializations, spec];
      return { ...prev, specializations: updated };
    });
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim()) return;
    onSaveEdit(teacher.id, editForm);
    setIsEditing(false);
  };

  const getTeachingBadge = (status: TeacherTeachingStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <StatusBadge variant="success" label="Đang giảng dạy" />;
      case 'ON_LEAVE':
        return <StatusBadge variant="warning" label="Tạm nghỉ" />;
      case 'INACTIVE':
        return <StatusBadge variant="neutral" label="Ngừng giảng dạy" />;
    }
  };

  const getAccountBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <StatusBadge variant="info" label="TK Hoạt động" />;
      case 'LOCKED':
        return <StatusBadge variant="danger" label="TK Bị khóa" />;
      case 'PENDING':
        return <StatusBadge variant="warning" label="TK Chờ duyệt" />;
      default:
        return <StatusBadge variant="neutral" label="TK Ngừng HĐ" />;
    }
  };

  return (
    <div
      className="teacher-drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-drawer-title"
    >
      <div
        className="teacher-detail-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="teacher-drawer-header">
          <div className="teacher-drawer-header-left">
            <div className="teacher-drawer-avatar" aria-hidden="true">
              {initials}
            </div>
            <div className="teacher-drawer-title-area">
              <div id="teacher-drawer-title" className="teacher-drawer-name">
                {teacher.name}
              </div>
              <div className="teacher-drawer-email">{teacher.email}</div>
              <div className="teacher-drawer-badges">
                {getTeachingBadge(teacher.teachingStatus)}
                {getAccountBadge(teacher.accountStatus)}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="teacher-drawer-close-btn"
            onClick={onClose}
            aria-label="Đóng bảng chi tiết"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body with Independent Scroll */}
        <div className="teacher-drawer-body">
          {isEditing ? (
            /* ================= EDIT MODE ================= */
            <form id="teacher-edit-form" onSubmit={handleSaveSubmit} className="teacher-drawer-edit-form">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>
                  Chỉnh sửa hồ sơ giáo viên
                </span>
                <span className="drawer-readonly-badge">Chế độ chỉnh sửa</span>
              </div>

              {/* Name & Email */}
              <div className="drawer-edit-field">
                <label className="drawer-edit-label">Họ và tên *</label>
                <input
                  type="text"
                  className="drawer-edit-input"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div className="drawer-edit-field">
                  <label className="drawer-edit-label">Email *</label>
                  <input
                    type="email"
                    className="drawer-edit-input"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>

                <div className="drawer-edit-field">
                  <label className="drawer-edit-label">Số điện thoại</label>
                  <input
                    type="tel"
                    className="drawer-edit-input"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Teaching Status */}
              <div className="drawer-edit-field">
                <label className="drawer-edit-label">Trạng thái giảng dạy</label>
                <select
                  className="drawer-edit-select"
                  value={editForm.teachingStatus}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      teachingStatus: e.target.value as TeacherTeachingStatus,
                    })
                  }
                >
                  <option value="ACTIVE">Đang giảng dạy</option>
                  <option value="ON_LEAVE">Tạm nghỉ</option>
                  <option value="INACTIVE">Ngừng giảng dạy</option>
                </select>
              </div>

              {/* Teaching Levels (Multi-select) */}
              <div className="drawer-edit-field">
                <label className="drawer-edit-label">Cấp độ HSK đảm nhiệm</label>
                <div className="pill-selector-grid">
                  {ALL_LEVELS.map((lvl) => {
                    const isSelected = editForm.teachingLevels.includes(lvl);
                    return (
                      <button
                        type="button"
                        key={lvl}
                        className={`pill-select-button ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleToggleLevel(lvl)}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specializations (Multi-select) */}
              <div className="drawer-edit-field">
                <label className="drawer-edit-label">Lĩnh vực chuyên môn</label>
                <div className="pill-selector-grid">
                  {ALL_SPECIALIZATIONS.map((spec) => {
                    const isSelected = editForm.specializations.includes(spec);
                    return (
                      <button
                        type="button"
                        key={spec}
                        className={`pill-select-button ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleToggleSpec(spec)}
                      >
                        {SPECIALIZATION_META[spec]?.label || spec}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Qualifications & Experience */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div className="drawer-edit-field">
                  <label className="drawer-edit-label">Bằng cấp & Học vị</label>
                  <input
                    type="text"
                    className="drawer-edit-input"
                    value={editForm.qualifications}
                    onChange={(e) => setEditForm({ ...editForm, qualifications: e.target.value })}
                  />
                </div>

                <div className="drawer-edit-field">
                  <label className="drawer-edit-label">Kinh nghiệm (năm)</label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    className="drawer-edit-input"
                    value={editForm.experienceYears}
                    onChange={(e) =>
                      setEditForm({ ...editForm, experienceYears: Number(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="drawer-edit-field">
                <label className="drawer-edit-label">Giới thiệu ngắn</label>
                <textarea
                  className="drawer-edit-textarea"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                />
              </div>

              {/* Note about telemetry protection */}
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--muted)',
                  backgroundColor: '#f8fafc',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                Các số liệu đo lường giảng dạy (số lớp, học viên, bài tập) và lịch sử hoạt động là dữ
                liệu hệ thống tự động, quản trị viên không thể can thiệp trực tiếp tại đây.
              </div>
            </form>
          ) : (
            /* ================= VIEW MODE ================= */
            <>
              {/* SECTION 1: ACCOUNT */}
              <div>
                <div className="drawer-section-heading">
                  <span>1. Thông tin tài khoản</span>
                </div>
                <div className="drawer-account-grid">
                  <div className="drawer-account-cell">
                    <span className="drawer-cell-label">Email đăng nhập</span>
                    <span className="drawer-cell-value">{teacher.email}</span>
                  </div>

                  <div className="drawer-account-cell">
                    <span className="drawer-cell-label">Số điện thoại</span>
                    <span className="drawer-cell-value">{teacher.phone || 'Chưa cập nhật'}</span>
                  </div>

                  <div className="drawer-account-cell">
                    <span className="drawer-cell-label">Ngày tham gia hệ thống</span>
                    <span className="drawer-cell-value">{teacher.joinedAt}</span>
                  </div>

                  <div className="drawer-account-cell">
                    <span className="drawer-cell-label">Hoạt động gần nhất</span>
                    <span className="drawer-cell-value">{teacher.lastActiveAt}</span>
                  </div>

                  <div className="drawer-account-cell" style={{ gridColumn: 'span 2' }}>
                    <span className="drawer-cell-label">Trạng thái tài khoản</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      {getAccountBadge(teacher.accountStatus)}
                      {teacher.lockReason && (
                        <span style={{ fontSize: '11px', color: 'var(--danger)' }}>
                          Lý do: {teacher.lockReason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PROFESSIONAL PROFILE */}
              <div>
                <div className="drawer-section-heading">
                  <span>2. Hồ sơ chuyên môn</span>
                </div>
                <div className="drawer-profile-box">
                  {/* Teaching Levels */}
                  <div className="drawer-profile-row">
                    <span className="drawer-field-title">Cấp độ HSK giảng dạy:</span>
                    <div className="drawer-chips-wrap">
                      {teacher.teachingLevels.map((lvl) => (
                        <span key={lvl} className="hsk-chip">
                          {lvl}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Specializations */}
                  <div className="drawer-profile-row">
                    <span className="drawer-field-title">Lĩnh vực chuyên môn phụ trách:</span>
                    <div className="drawer-chips-wrap">
                      {teacher.specializations.map((spec) => (
                        <span key={spec} className="spec-chip">
                          {SPECIALIZATION_META[spec]?.label || spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Qualifications & Experience */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    <div className="drawer-account-cell">
                      <span className="drawer-cell-label">Kinh nghiệm giảng dạy</span>
                      <span className="drawer-cell-value">
                        <Clock size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
                        {teacher.profile.experienceYears} năm kinh nghiệm
                      </span>
                    </div>

                    <div className="drawer-account-cell">
                      <span className="drawer-cell-label">Bằng cấp & Học vị</span>
                      <span className="drawer-cell-value" title={teacher.profile.qualifications}>
                        <Award size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
                        {teacher.profile.qualifications}
                      </span>
                    </div>
                  </div>

                  {/* Short Bio */}
                  {teacher.profile.bio && (
                    <div className="drawer-profile-row">
                      <span className="drawer-field-title">Giới thiệu tóm tắt:</span>
                      <blockquote className="drawer-bio-quote">{teacher.profile.bio}</blockquote>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: TEACHING OVERVIEW (READ-ONLY) */}
              <div>
                <div className="drawer-section-heading">
                  <span>3. Tổng quan giảng dạy</span>
                  <span className="drawer-readonly-badge">Chỉ đọc</span>
                </div>

                <div className="teaching-overview-box">
                  {/* Compact Metrics */}
                  <div className="teaching-metrics-grid">
                    <div className="teaching-metric-tile">
                      <div className="metric-tile-val">{teacher.teachingSummary.classCount}</div>
                      <div className="metric-tile-lbl">Lớp phụ trách</div>
                    </div>

                    <div className="teaching-metric-tile">
                      <div className="metric-tile-val">{teacher.teachingSummary.studentCount}</div>
                      <div className="metric-tile-lbl">Học viên</div>
                    </div>

                    <div className="teaching-metric-tile">
                      <div className="metric-tile-val">{teacher.teachingSummary.lessonCount}</div>
                      <div className="metric-tile-lbl">Bài học</div>
                    </div>

                    <div className="teaching-metric-tile">
                      <div className="metric-tile-val">{teacher.teachingSummary.assignmentCount}</div>
                      <div className="metric-tile-lbl">Bài tập</div>
                    </div>
                  </div>

                  {/* Assigned Classes Preview (2-3 items) */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
                      Danh sách lớp đang đảm nhiệm ({teacher.teachingSummary.assignedClasses.length}):
                    </div>
                    {teacher.teachingSummary.assignedClasses.length === 0 ? (
                      <div style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic', padding: '8px 0' }}>
                        Hiện tại chưa có lớp phân công hoạt động.
                      </div>
                    ) : (
                      <div className="assigned-classes-list">
                        {teacher.teachingSummary.assignedClasses.map((cls) => (
                          <div key={cls.id} className="assigned-class-item">
                            <div>
                              <div className="class-item-name">
                                <BookOpen size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: -1 }} />
                                {cls.name}
                              </div>
                              <div className="class-item-sub">{cls.schedule}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span className="hsk-level-mini-tag">{cls.level}</span>
                              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 2 }}>
                                {cls.studentCount} học viên
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 4: RECENT ACTIVITY */}
              <div>
                <div className="drawer-section-heading">
                  <span>4. Hoạt động gần nhất</span>
                  <span className="drawer-readonly-badge">Lịch sử</span>
                </div>

                <div className="recent-activity-timeline">
                  {teacher.recentActivities.map((act) => (
                    <div key={act.id} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-action">{act.actionText}</div>
                      <div className="timeline-target">{act.targetName}</div>
                      <div className="timeline-time">{act.timeAgo}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="teacher-drawer-footer">
          {isEditing ? (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                <RotateCcw size={13} style={{ display: 'inline', marginRight: 4 }} />
                Hủy chỉnh sửa
              </button>

              <button
                type="submit"
                form="teacher-edit-form"
                className="btn btn-primary"
              >
                <Save size={13} style={{ display: 'inline', marginRight: 4 }} />
                Lưu thay đổi
              </button>
            </>
          ) : (
            <>
              <div className="drawer-footer-left">
                {teacher.accountStatus === 'LOCKED' ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onToggleLockAccount(teacher)}
                    style={{ color: '#16a34a' }}
                  >
                    <Unlock size={14} style={{ display: 'inline', marginRight: 4 }} />
                    Mở khóa TK
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onToggleLockAccount(teacher)}
                    style={{ color: 'var(--danger)' }}
                  >
                    <Lock size={14} style={{ display: 'inline', marginRight: 4 }} />
                    Khóa tài khoản
                  </button>
                )}
              </div>

              <div className="drawer-footer-right">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onChangeTeachingStatus(teacher)}
                >
                  <CalendarCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Đổi trạng thái
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStartEdit}
                >
                  <Edit2 size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Chỉnh sửa
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Search, Users, Mail, UserPlus, Trash2 } from 'lucide-react';
import { Pagination, StatusBadge, ManagementDataTable, ConfirmDialog } from '../../../shared/components';
import type { TableColumn } from '../../../shared/types';
import type { ClassMemberStatus, ClassMemberViewDTO } from '../../types/class.types';
import { teacherPortalService } from '../../services';

export interface ClassStudentsTabProps {
  classId?: string;
  members: ClassMemberViewDTO[];
  onMemberAdded?: () => void;
  onMemberRemoved?: () => void;
}

export const ClassStudentsTab: React.FC<ClassStudentsTabProps> = ({
  classId,
  members,
  onMemberAdded,
  onMemberRemoved,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ClassMemberStatus>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Add dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [studentNotes, setStudentNotes] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Remove dialog state
  const [removingMember, setRemovingMember] = useState<ClassMemberViewDTO | null>(null);

  // Filtered members
  const filtered = useMemo(() => {
    let result = [...members];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (m) =>
          m.studentName.toLowerCase().includes(q) ||
          m.studentEmail.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'ALL') {
      result = result.filter((m) => m.status === statusFilter);
    }
    return result;
  }, [members, search, statusFilter]);

  // Paginated
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const handleAddStudent = async () => {
    if (!classId || !studentIdentifier.trim()) return;
    setAddLoading(true);
    setAddError(null);
    try {
      await teacherPortalService.addStudentToClass(classId, studentIdentifier.trim(), studentNotes.trim() || undefined);
      setIsAddDialogOpen(false);
      setStudentIdentifier('');
      setStudentNotes('');
      onMemberAdded?.();
    } catch (err: any) {
      setAddError(err.message || 'Không thể ghi danh học viên.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!classId || !removingMember) return;
    try {
      await teacherPortalService.removeStudentFromClass(classId, removingMember.studentId);
      setRemovingMember(null);
      onMemberRemoved?.();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa học viên.');
    }
  };

  const getMemberStatusVariant = (st: ClassMemberStatus) => {
    switch (st) {
      case 'ACTIVE':
        return 'success';
      case 'PAUSED':
        return 'warning';
      case 'DROPPED':
        return 'danger';
      case 'COMPLETED':
        return 'info';
      default:
        return 'neutral';
    }
  };

  const getMemberStatusLabel = (st: ClassMemberStatus) => {
    switch (st) {
      case 'ACTIVE':
        return 'Đang học';
      case 'PAUSED':
        return 'Bảo lưu';
      case 'DROPPED':
        return 'Đã thôi học';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      default:
        return st;
    }
  };

  const columns: TableColumn<ClassMemberViewDTO>[] = useMemo(
    () => [
      {
        key: 'student',
        header: 'Học viên',
        render: (item) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {item.studentAvatarUrl ? (
              <img
                src={item.studentAvatarUrl}
                alt={item.studentName}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-full)',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {item.studentName.charAt(0)}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                {item.studentName}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  color: 'var(--muted)',
                }}
              >
                {item.studentId}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'email',
        header: 'Email',
        hideOnMobile: true,
        render: (item) => (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--muted)' }}>
            <Mail size={12} /> {item.studentEmail}
          </span>
        ),
      },
      {
        key: 'enrolledAt',
        header: 'Ngày ghi danh',
        hideOnMobile: true,
        render: (item) => (
          <span style={{ color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
            {new Date(item.enrolledAt).toLocaleDateString('vi-VN')}
          </span>
        ),
      },
      {
        key: 'attendance',
        header: 'Chuyên cần',
        align: 'center',
        render: (item) => (
          <span
            style={{
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color:
                item.attendanceRate >= 90
                  ? 'var(--success)'
                  : item.attendanceRate >= 75
                  ? 'var(--warning)'
                  : 'var(--danger)',
            }}
          >
            {item.attendanceRate}%
          </span>
        ),
      },
      {
        key: 'assignments',
        header: 'Bài tập đã nộp',
        align: 'center',
        hideOnMobile: true,
        render: (item) => (
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {item.completedAssignmentsCount} bài
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Trạng thái',
        render: (item) => (
          <div>
            <StatusBadge
              label={getMemberStatusLabel(item.status)}
              variant={getMemberStatusVariant(item.status)}
              size="sm"
            />
            {item.notes && (
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--muted)',
                  marginTop: '2px',
                  fontStyle: 'italic',
                }}
              >
                {item.notes}
              </div>
            )}
          </div>
        ),
      },
      ...(classId
        ? [
            {
              key: 'actions',
              header: 'Thao tác',
              align: 'center' as const,
              render: (item: ClassMemberViewDTO) => (
                <button
                  type="button"
                  onClick={() => setRemovingMember(item)}
                  className="ds-btn ds-btn-ghost ds-btn-sm"
                  style={{ color: 'var(--danger)', padding: '4px 8px' }}
                  title="Xóa học viên khỏi lớp"
                >
                  <Trash2 size={14} /> Xóa
                </button>
              ),
            },
          ]
        : []),
    ],
    [classId]
  );

  return (
    <div className="tp-card">
      <div className="tp-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 className="tp-card-title">
            <Users size={18} style={{ color: 'var(--primary)' }} />
            Danh Sách Học Viên Trong Lớp ({filtered.length})
          </h3>
          <div className="tp-card-subtitle">
            Học viên ghi danh độc lập với tiến độ tự học LessonProgress cá nhân
          </div>
        </div>
        {classId && (
          <button
            type="button"
            onClick={() => {
              setStudentIdentifier('');
              setStudentNotes('');
              setAddError(null);
              setIsAddDialogOpen(true);
            }}
            className="ds-btn ds-btn-primary ds-btn-sm"
            style={{ gap: '6px' }}
          >
            <UserPlus size={15} /> Thêm Học Viên
          </button>
        )}
      </div>

      {/* Toolbar lọc */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted)',
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo tên hoặc email học viên..."
            className="tp-input"
            style={{ paddingLeft: '34px', height: '36px', fontSize: 'var(--text-xs)' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as 'ALL' | ClassMemberStatus);
            setCurrentPage(1);
          }}
          className="tp-select"
          style={{ height: '36px' }}
          aria-label="Lọc trạng thái học viên"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang học (Active)</option>
          <option value="PAUSED">Bảo lưu (Paused)</option>
          <option value="DROPPED">Thôi học (Dropped)</option>
          <option value="COMPLETED">Hoàn thành (Completed)</option>
        </select>
      </div>

      {/* Bảng học viên */}
      <ManagementDataTable<ClassMemberViewDTO>
        columns={columns}
        data={paginated}
        keyExtractor={(item) => item.id}
        emptyText="Không tìm thấy học viên nào phù hợp với bộ lọc."
        isFiltered={search.trim() !== '' || statusFilter !== 'ALL'}
        onClearFilters={() => {
          setSearch('');
          setStatusFilter('ALL');
          setCurrentPage(1);
        }}
        enableMobileCards={true}
        mobileTitleExtractor={(item) => item.studentName}
        mobileSubtitleExtractor={(item) => item.studentId}
        mobileBadgeExtractor={(item) => (
          <StatusBadge
            label={getMemberStatusLabel(item.status)}
            variant={getMemberStatusVariant(item.status)}
            size="sm"
          />
        )}
        mobileFields={[
          {
            label: 'Email',
            render: (item) => item.studentEmail,
          },
          {
            label: 'Chuyên cần',
            render: (item) => (
              <span
                style={{
                  fontWeight: 700,
                  color:
                    item.attendanceRate >= 90
                      ? 'var(--success)'
                      : item.attendanceRate >= 75
                      ? 'var(--warning)'
                      : 'var(--danger)',
                }}
              >
                {item.attendanceRate}%
              </span>
            ),
          },
          {
            label: 'Bài tập',
            render: (item) => `${item.completedAssignmentsCount} bài nộp`,
          },
          {
            label: 'Ghi danh',
            render: (item) => new Date(item.enrolledAt).toLocaleDateString('vi-VN'),
          },
        ]}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: 'var(--space-3)' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            itemLabel="học viên"
            onPageChange={(p: number) => setCurrentPage(p)}
          />
        </div>
      )}

      {/* Add Student Dialog */}
      {isAddDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '450px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>Ghi Danh Học Viên</h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--muted)' }}>
              Nhập email hoặc tên tài khoản của học viên để thêm vào lớp học.
            </p>
            {addError && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--danger)',
                  fontSize: '13px',
                  marginBottom: '12px',
                }}
              >
                {addError}
              </div>
            )}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Email / Tên người dùng học viên *
              </label>
              <input
                type="text"
                value={studentIdentifier}
                onChange={(e) => setStudentIdentifier(e.target.value)}
                placeholder="vd: student@zhongwenhub.edu.vn"
                className="tp-input"
                style={{ width: '100%', height: '38px' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Ghi chú (Tùy chọn)
              </label>
              <input
                type="text"
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                placeholder="vd: Miễn giảm học phí, chuyển lớp..."
                className="tp-input"
                style={{ width: '100%', height: '38px' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsAddDialogOpen(false)}
                className="ds-btn ds-btn-outline ds-btn-sm"
                disabled={addLoading}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleAddStudent}
                className="ds-btn ds-btn-primary ds-btn-sm"
                disabled={addLoading || !studentIdentifier.trim()}
              >
                {addLoading ? 'Đang thêm...' : 'Xác nhận ghi danh'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Remove Student Dialog */}
      <ConfirmDialog
        isOpen={Boolean(removingMember)}
        title="Xác nhận xóa học viên"
        message={`Bạn có chắc chắn muốn xóa học viên "${removingMember?.studentName}" khỏi lớp học này?`}
        confirmLabel="Xóa học viên"
        cancelLabel="Hủy bỏ"
        isDestructive={true}
        onConfirm={handleRemoveStudent}
        onCancel={() => setRemovingMember(null)}
      />
    </div>
  );
};

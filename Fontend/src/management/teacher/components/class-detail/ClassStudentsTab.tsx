import React, { useState, useMemo } from 'react';
import { Search, Users, Mail } from 'lucide-react';
import { Pagination, StatusBadge } from '../../../shared/components';
import type { ClassMemberStatus, ClassMemberViewDTO } from '../../types/class.types';

export interface ClassStudentsTabProps {
  members: ClassMemberViewDTO[];
}

export const ClassStudentsTab: React.FC<ClassStudentsTabProps> = ({ members }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ClassMemberStatus>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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

  return (
    <div className="tp-card">
      <div className="tp-card-header">
        <div>
          <h3 className="tp-card-title">
            <Users size={18} style={{ color: 'var(--primary)' }} />
            Danh Sách Học Viên Trong Lớp ({filtered.length})
          </h3>
          <div className="tp-card-subtitle">
            Học viên ghi danh độc lập với tiến độ tự học LessonProgress cá nhân
          </div>
        </div>
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
      {paginated.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 'var(--text-sm)',
          }}
        >
          Không tìm thấy học viên nào phù hợp với bộ lọc.
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            overflowX: 'auto',
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
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--muted)' }}>
                  HỌC VIÊN
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--muted)' }}>
                  EMAIL
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--muted)' }}>
                  NGÀY GHI DANH
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--muted)' }}>
                  CHUYÊN CẦN
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--muted)' }}>
                  BÀI TẬP ĐÃ NỘP
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--muted)' }}>
                  TRẠNG THÁI
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((item) => (
                <tr
                  key={item.id}
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
                  <td style={{ padding: '10px 14px' }}>
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
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--muted)',
                          }}
                        >
                          {item.studentId}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '10px 14px', color: 'var(--muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={12} /> {item.studentEmail}
                    </span>
                  </td>

                  <td style={{ padding: '10px 14px', color: 'var(--foreground)' }}>
                    {new Date(item.enrolledAt).toLocaleDateString('vi-VN')}
                  </td>

                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                    </div>
                  </td>

                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontWeight: 600 }}>{item.completedAssignmentsCount} bài</span>
                  </td>

                  <td style={{ padding: '10px 14px' }}>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
    </div>
  );
};

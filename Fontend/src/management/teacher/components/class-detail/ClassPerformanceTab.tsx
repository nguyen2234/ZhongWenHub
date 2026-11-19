import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { teacherPortalService } from '../../services';
import type { ClassPerformanceDTO } from '../../types';

export interface ClassPerformanceTabProps {
  classId: string;
}

export const ClassPerformanceTab: React.FC<ClassPerformanceTabProps> = ({ classId }) => {
  const [data, setData] = useState<ClassPerformanceDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadPerformance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await teacherPortalService.getClassPerformance(classId);
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải báo cáo hiệu suất lớp học.');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadPerformance();
  }, [loadPerformance]);

  if (loading) {
    return (
      <div className="tp-card" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--muted)' }}>
        Đang tải báo cáo hiệu suất lớp học...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="tp-card" style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--error)' }}>
        <AlertCircle size={28} style={{ margin: '0 auto var(--space-2)' }} />
        <p>{error || 'Chưa có dữ liệu hiệu suất.'}</p>
        <button
          type="button"
          className="ds-btn ds-btn-sm ds-btn-outline"
          style={{ marginTop: 'var(--space-3)' }}
          onClick={loadPerformance}
        >
          Thử lại
        </button>
      </div>
    );
  }

  const {
    totalStudents,
    averageAttendanceRate,
    totalAssignmentsAssigned,
    averageAssignmentScore,
    submissionRate,
    gradeDistribution,
    studentSummaries,
  } = data;

  const totalGraded =
    gradeDistribution.excellentCount +
    gradeDistribution.goodCount +
    gradeDistribution.averageCount +
    gradeDistribution.poorCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* KPI Stats Strip */}
      <div className="tp-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="tp-card tp-stat-card">
          <div className="tp-stat-label">Sĩ số lớp</div>
          <div className="tp-stat-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} style={{ color: 'var(--primary)' }} />
            {totalStudents} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--muted)' }}>học viên</span>
          </div>
        </div>

        <div className="tp-card tp-stat-card">
          <div className="tp-stat-label">Chuyên cần trung bình</div>
          <div
            className="tp-stat-value"
            style={{
              color: averageAttendanceRate >= 80 ? '#059669' : averageAttendanceRate >= 60 ? '#d97706' : '#dc2626',
            }}
          >
            {averageAttendanceRate}%
          </div>
        </div>

        <div className="tp-card tp-stat-card">
          <div className="tp-stat-label">Bài tập đã giao</div>
          <div className="tp-stat-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={24} style={{ color: '#0284c7' }} />
            {totalAssignmentsAssigned}
          </div>
        </div>

        <div className="tp-card tp-stat-card">
          <div className="tp-stat-label">Điểm trung bình</div>
          <div
            className="tp-stat-value"
            style={{
              color: averageAssignmentScore >= 80 ? '#059669' : averageAssignmentScore >= 60 ? '#d97706' : '#dc2626',
            }}
          >
            {averageAssignmentScore} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--muted)' }}>/ 100</span>
          </div>
        </div>

        <div className="tp-card tp-stat-card">
          <div className="tp-stat-label">Tỷ lệ nộp bài</div>
          <div className="tp-stat-value" style={{ color: '#7c3aed' }}>
            {submissionRate}%
          </div>
        </div>
      </div>

      {/* Grade Distribution Breakdown Card */}
      <div className="tp-card">
        <div className="tp-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="tp-card-title">
              <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
              Phổ Điểm Kiểm Tra & Đánh Giá
            </h3>
            <div className="tp-card-subtitle">
              Phân bố điểm trung bình của học viên trên thang điểm 100
            </div>
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-sm ds-btn-outline"
            onClick={loadPerformance}
            title="Làm mới"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {totalGraded === 0 ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>
            Chưa có bài tập nào được nộp hoặc chấm điểm để tính phổ điểm.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {/* Excellent */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#059669' }}>Xuất sắc (≥ 85đ)</span>
                <span>
                  {gradeDistribution.excellentCount} học viên ({Math.round((gradeDistribution.excellentCount / totalGraded) * 100)}%)
                </span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(gradeDistribution.excellentCount / totalGraded) * 100}%`,
                    backgroundColor: '#059669',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>

            {/* Good */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#0284c7' }}>Giỏi (70 – 84đ)</span>
                <span>
                  {gradeDistribution.goodCount} học viên ({Math.round((gradeDistribution.goodCount / totalGraded) * 100)}%)
                </span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(gradeDistribution.goodCount / totalGraded) * 100}%`,
                    backgroundColor: '#0284c7',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>

            {/* Average */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#d97706' }}>Đạt (50 – 69đ)</span>
                <span>
                  {gradeDistribution.averageCount} học viên ({Math.round((gradeDistribution.averageCount / totalGraded) * 100)}%)
                </span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(gradeDistribution.averageCount / totalGraded) * 100}%`,
                    backgroundColor: '#d97706',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>

            {/* Poor */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#dc2626' }}>Cần cải thiện (&lt; 50đ)</span>
                <span>
                  {gradeDistribution.poorCount} học viên ({Math.round((gradeDistribution.poorCount / totalGraded) * 100)}%)
                </span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(gradeDistribution.poorCount / totalGraded) * 100}%`,
                    backgroundColor: '#dc2626',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Student Performance Ranking Table */}
      <div className="tp-card">
        <div className="tp-card-header">
          <h3 className="tp-card-title">
            <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
            Bảng Xếp Hạng & Tiến Độ Học Viên ({studentSummaries.length})
          </h3>
          <div className="tp-card-subtitle">
            Theo dõi chi tiết chuyên cần, số lượng bài làm và điểm số từng học viên
          </div>
        </div>

        {studentSummaries.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>
            Lớp học chưa có học viên nào được ghi danh.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tp-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center' }}>Hạng</th>
                  <th>Học viên</th>
                  <th style={{ textAlign: 'center' }}>Chuyên cần</th>
                  <th style={{ textAlign: 'center' }}>Bài tập đã làm</th>
                  <th style={{ textAlign: 'center' }}>Điểm trung bình</th>
                  <th style={{ textAlign: 'center' }}>Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {studentSummaries.map((st, index) => {
                  const rankBadge =
                    index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
                  return (
                    <tr key={st.studentId}>
                      <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                        {rankBadge}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary-light)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '13px',
                            }}
                          >
                            {st.studentName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{st.studentName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{st.studentEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: st.attendanceRate >= 80 ? '#059669' : st.attendanceRate >= 60 ? '#d97706' : '#dc2626',
                          }}
                        >
                          {st.attendanceRate}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {st.assignmentsCompleted} / {st.totalAssignments}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <strong
                          style={{
                            fontSize: 'var(--text-base)',
                            color: st.averageScore >= 80 ? '#059669' : st.averageScore >= 60 ? '#d97706' : '#dc2626',
                          }}
                        >
                          {st.averageScore}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {st.averageScore >= 85 ? (
                          <span className="tp-status-badge active" style={{ fontSize: '11px' }}>Xuất sắc</span>
                        ) : st.averageScore >= 70 ? (
                          <span className="tp-status-badge upcoming" style={{ fontSize: '11px' }}>Giỏi</span>
                        ) : st.averageScore >= 50 ? (
                          <span className="tp-status-badge completed" style={{ fontSize: '11px' }}>Đạt</span>
                        ) : (
                          <span className="tp-status-badge archived" style={{ fontSize: '11px' }}>Cần cải thiện</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

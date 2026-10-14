import React from 'react';
import { Layers, ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ClassSummaryDTO } from '../../types/class.types';

export interface ActiveClassesSnapshotProps {
  classes: ClassSummaryDTO[];
}

export const ActiveClassesSnapshot: React.FC<ActiveClassesSnapshotProps> = ({ classes }) => {
  return (
    <div className="tp-card">
      <div className="tp-card-header">
        <div>
          <h2 className="tp-card-title">
            <Layers size={18} style={{ color: 'var(--primary)' }} />
            Lớp Học Đang Giảng Dạy
          </h2>
          <div className="tp-card-subtitle">
            Danh sách các lớp đang hoạt động trong kỳ này
          </div>
        </div>
        <Link
          to="/management/teacher/classes"
          className="ds-btn ds-btn-ghost ds-btn-sm"
          style={{ fontSize: 'var(--text-xs)' }}
        >
          Xem tất cả <ArrowRight size={14} />
        </Link>
      </div>

      {classes.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-6)',
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 'var(--text-sm)',
          }}
        >
          Hiện tại chưa có lớp học nào đang hoạt động.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {classes.map((cls) => {
            const fillPercentage = Math.min(
              100,
              Math.round((cls.derivedEnrollmentCount / cls.capacity) * 100)
            );

            return (
              <div
                key={cls.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--surface)',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '1px 8px',
                        borderRadius: 'var(--radius-full)',
                        border: `1px solid ${cls.hskLevelColor}`,
                        color: cls.hskLevelColor,
                        backgroundColor: 'var(--background)',
                      }}
                    >
                      {cls.hskLevelName}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--muted)',
                      }}
                    >
                      {cls.code}
                    </span>
                  </div>

                  <Link
                    to={`/management/teacher/classes/${cls.id}`}
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      color: 'var(--primary)',
                      textDecoration: 'none',
                    }}
                  >
                    Vào lớp →
                  </Link>
                </div>

                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 700,
                    color: 'var(--foreground)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  {cls.name}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--muted)',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {cls.schedulesSummary}
                  </span>
                  <span>
                    Sĩ số: <strong>{cls.derivedEnrollmentCount}</strong>/{cls.capacity} học viên
                  </span>
                </div>

                {/* Progress bar sĩ số */}
                <div
                  style={{
                    height: '5px',
                    width: '100%',
                    backgroundColor: 'var(--background)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${fillPercentage}%`,
                      backgroundColor:
                        fillPercentage >= 90 ? 'var(--warning)' : 'var(--primary)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

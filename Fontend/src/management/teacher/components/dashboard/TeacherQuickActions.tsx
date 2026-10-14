import React from 'react';
import { Layers, BookOpen, HelpCircle, PlusCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TeacherQuickAction } from '../../types/dashboard.types';

export interface TeacherQuickActionsProps {
  actions: TeacherQuickAction[];
  onCreateClassClick?: () => void;
}

export const TeacherQuickActions: React.FC<TeacherQuickActionsProps> = ({
  actions,
  onCreateClassClick,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'classes':
        return <Layers size={18} style={{ color: 'var(--primary)' }} />;
      case 'curriculum':
        return <BookOpen size={18} style={{ color: '#059669' }} />;
      case 'questions':
        return <HelpCircle size={18} style={{ color: '#d97706' }} />;
      default:
        return <PlusCircle size={18} style={{ color: 'var(--primary)' }} />;
    }
  };

  return (
    <div className="tp-card" style={{ marginBottom: 'var(--space-6)' }}>
      <div className="tp-card-header">
        <div>
          <h2 className="tp-card-title">Phím Tắt Vận Hành</h2>
          <div className="tp-card-subtitle">Thao tác nhanh cho giảng viên</div>
        </div>
      </div>

      <div className="tp-quick-actions-grid">
        {onCreateClassClick && (
          <button
            type="button"
            onClick={onCreateClassClick}
            className="tp-quick-action-btn"
            style={{
              borderStyle: 'dashed',
              backgroundColor: 'var(--primary-light)',
              borderColor: 'var(--primary)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: 'var(--space-2)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PlusCircle size={18} style={{ color: 'var(--primary)' }} />
              </div>
              <ArrowUpRight size={14} style={{ color: 'var(--primary)' }} />
            </div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--primary)' }}>
              Tạo Lớp Học Mới
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
              Mở lớp & xếp thời khóa biểu
            </div>
          </button>
        )}

        {actions.map((act) => (
          <Link key={act.id} to={act.path} className="tp-quick-action-btn">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: 'var(--space-2)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {getIcon(act.iconName)}
              </div>
              {act.badge && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--warning-bg)',
                    color: 'var(--warning)',
                  }}
                >
                  {act.badge}
                </span>
              )}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>
              {act.label}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
              {act.description}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

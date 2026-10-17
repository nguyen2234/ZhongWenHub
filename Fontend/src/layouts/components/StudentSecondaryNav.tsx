import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ElementType } from 'react';

export interface SecondaryNavItem {
  id: string;
  path: string;
  label: string;
  icon?: ElementType;
  badge?: string;
}

export interface StudentSecondaryNavProps {
  items: SecondaryNavItem[];
  title?: string;
  className?: string;
}

export const StudentSecondaryNav: React.FC<StudentSecondaryNavProps> = ({
  items,
  title,
  className = '',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <nav
      aria-label={title || 'Điều hướng phân mục'}
      className={`student-secondary-nav ${className}`.trim()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 8px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflowX: 'auto',
        maxWidth: '100%',
        boxSizing: 'border-box',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        flexWrap: 'nowrap',
      }}
    >
      {title && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            padding: '0 8px',
            whiteSpace: 'nowrap',
          }}
        >
          {title}:
        </span>
      )}

      {items.map((item) => {
        const isActive =
          pathname === item.path ||
          (item.path !== '/' && pathname.startsWith(item.path) && item.path.length > 2);
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(item.path)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: isActive ? '1px solid #c7d2fe' : '1px solid transparent',
              backgroundColor: isActive ? '#eef2ff' : 'transparent',
              color: isActive ? '#4338ca' : '#475569',
              fontSize: '12px',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            {Icon && <Icon size={14} style={{ color: isActive ? '#4338ca' : '#64748b' }} />}
            <span>{item.label}</span>
            {item.badge && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  backgroundColor: isActive ? '#4338ca' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#64748b',
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default StudentSecondaryNav;

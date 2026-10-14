import React from 'react';

export type HomeworkFilterStatus = 'ALL' | 'TODO' | 'IN_PROGRESS' | 'SUBMITTED' | 'OVERDUE';

interface HomeworkFilterTabsProps {
  currentTab: HomeworkFilterStatus;
  onChangeTab: (tab: HomeworkFilterStatus) => void;
  counts: Record<HomeworkFilterStatus, number>;
}

export const HomeworkFilterTabs: React.FC<HomeworkFilterTabsProps> = ({
  currentTab,
  onChangeTab,
  counts,
}) => {
  const tabs: Array<{ id: HomeworkFilterStatus; label: string }> = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'TODO', label: 'Cần làm' },
    { id: 'IN_PROGRESS', label: 'Đang làm dở' },
    { id: 'SUBMITTED', label: 'Đã nộp' },
    { id: 'OVERDUE', label: 'Quá hạn' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        overflowX: 'auto',
        paddingBottom: '4px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const count = counts[tab.id] || 0;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: isActive ? 'var(--primary)' : 'var(--muted)',
              fontSize: 'var(--text-sm)',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              marginBottom: '-1px',
            }}
          >
            <span>{tab.label}</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isActive ? 'var(--primary-light)' : 'var(--neutral-bg)',
                color: isActive ? 'var(--primary)' : 'var(--muted)',
                fontWeight: 600,
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

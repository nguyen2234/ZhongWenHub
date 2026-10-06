import React from 'react';
import { EmptyState as DSEmptyState } from '../../../design-system';

export interface ManagementEmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<ManagementEmptyStateProps> = ({
  title = 'Không có dữ liệu',
  description = 'Hiện tại chưa có bản ghi nào để hiển thị.',
  action,
  icon = <span style={{ fontSize: '28px' }}>📁</span>,
}) => {
  return (
    <div style={{ padding: 'var(--space-8) var(--space-4)', textAlign: 'center' }}>
      <DSEmptyState
        icon={icon}
        title={title}
        description={description}
        action={action}
      />
    </div>
  );
};

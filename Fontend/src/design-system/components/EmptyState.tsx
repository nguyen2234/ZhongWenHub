import React from 'react';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="ds-empty-state">
      <div className="ds-empty-icon-wrap">{icon}</div>
      <h3 className="ds-empty-title">{title}</h3>
      <p className="ds-empty-desc">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

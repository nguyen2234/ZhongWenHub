import React from 'react';
import '../styles/management-table.css';

export type StatusVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'active'
  | 'published'
  | 'resolved'
  | 'pending'
  | 'in_progress'
  | 'draft'
  | 'inactive'
  | 'rejected'
  | 'error'
  | 'archived';

export interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant | string;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  showDot = true,
  className = '',
}) => {
  // Normalize variant according to Evondev M7 Standard
  const normalizeVariant = (v: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
    const lower = v.toLowerCase();
    switch (lower) {
      case 'success':
      case 'active':
      case 'published':
      case 'resolved':
      case 'completed':
      case 'passed':
        return 'success';
      case 'warning':
      case 'pending':
      case 'pending_review':
      case 'in_progress':
      case 'upcoming':
      case 'medium':
        return 'warning';
      case 'danger':
      case 'error':
      case 'rejected':
      case 'failed':
      case 'critical':
      case 'high':
        return 'danger';
      case 'info':
      case 'low':
        return 'info';
      case 'draft':
      case 'inactive':
      case 'archived':
      case 'neutral':
      default:
        return 'neutral';
    }
  };

  const norm = normalizeVariant(variant);

  return (
    <span
      className={`mgmt-badge badge-${norm} ${size === 'sm' ? 'text-xs py-0.5' : ''} ${className}`}
      style={{
        padding: size === 'sm' ? '1px 6px' : '2px 8px',
        fontSize: size === 'sm' ? '10.5px' : '11.5px',
      }}
    >
      {showDot && <span className="mgmt-badge-dot" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
};

import React from 'react';
import type { ModerationStatus } from '../types/content-manager.types';

export interface ModerationBadgeProps {
  status: ModerationStatus;
}

export const ModerationBadge: React.FC<ModerationBadgeProps> = ({ status }) => {
  switch (status) {
    case 'PENDING_REVIEW':
      return (
        <span className="cm-badge cm-badge-pending">
          <span className="cm-badge-dot" />
          Chờ duyệt
        </span>
      );
    case 'PUBLISHED':
      return (
        <span className="cm-badge cm-badge-published">
          <span className="cm-badge-dot" />
          Đã xuất bản
        </span>
      );
    case 'ARCHIVED':
      return (
        <span className="cm-badge cm-badge-archived">
          <span className="cm-badge-dot" />
          Lưu trữ
        </span>
      );
    case 'DRAFT':
    default:
      return (
        <span className="cm-badge cm-badge-draft">
          <span className="cm-badge-dot" />
          Bản nháp
        </span>
      );
  }
};

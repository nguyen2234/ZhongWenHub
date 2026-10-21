import React from 'react';
import type { ContentIssueStatus } from '../types/content-manager.types';

export interface IssueStatusBadgeProps {
  status: ContentIssueStatus;
}

export const IssueStatusBadge: React.FC<IssueStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'NEW':
      return (
        <span className="cm-badge cm-badge-new">
          <span className="cm-badge-dot" />
          Mới tiếp nhận
        </span>
      );
    case 'TRIAGED':
      return (
        <span className="cm-badge cm-badge-triaged">
          <span className="cm-badge-dot" />
          Đã phân loại
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="cm-badge cm-badge-in-progress">
          <span className="cm-badge-dot" />
          Đang xử lý
        </span>
      );
    case 'RESOLVED':
      return (
        <span className="cm-badge cm-badge-resolved">
          <span className="cm-badge-dot" />
          Đã khắc phục
        </span>
      );
    case 'CLOSED':
      return (
        <span className="cm-badge cm-badge-closed">
          <span className="cm-badge-dot" />
          Đã đóng
        </span>
      );
    case 'REOPENED':
      return (
        <span className="cm-badge cm-badge-reopened">
          <span className="cm-badge-dot" />
          Mở lại
        </span>
      );
    default:
      return (
        <span className="cm-badge cm-badge-draft">
          <span className="cm-badge-dot" />
          {status}
        </span>
      );
  }
};

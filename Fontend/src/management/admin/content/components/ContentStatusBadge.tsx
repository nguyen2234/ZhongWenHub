import React from 'react';
import { Badge } from '../../../../design-system';
import { CONTENT_STATUS_CONFIG, type ContentStatus } from '../types';

export interface ContentStatusBadgeProps {
  status: ContentStatus;
}

export const ContentStatusBadge: React.FC<ContentStatusBadgeProps> = ({ status }) => {
  const config = CONTENT_STATUS_CONFIG[status] || CONTENT_STATUS_CONFIG.DRAFT;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

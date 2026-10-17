import React from 'react';
import { StickerIllustration } from './StickerIllustration';
import type { StickerName } from '../../assets/stickers';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  stickerName?: StickerName;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  stickerName,
  title,
  description,
  action,
}) => {
  return (
    <div className="ds-empty-state">
      <div className="ds-empty-icon-wrap" style={{ display: 'flex', justifyContent: 'center', marginBottom: stickerName ? '12px' : undefined }}>
        {stickerName ? (
          <StickerIllustration name={stickerName} size="lg" alt={title} />
        ) : (
          icon
        )}
      </div>
      <h3 className="ds-empty-title">{title}</h3>
      <p className="ds-empty-desc">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

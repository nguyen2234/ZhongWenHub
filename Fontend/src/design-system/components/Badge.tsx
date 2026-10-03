import React from 'react';

export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'streak'
  | 'xp'
  | 'ai';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  icon,
  children,
  className = '',
  ...props
}) => {
  let variantClass = `ds-badge-${variant}`;
  if (variant === 'streak') variantClass = 'ds-pill-streak';
  if (variant === 'xp') variantClass = 'ds-pill-xp';
  if (variant === 'ai') variantClass = 'ds-pill-ai';

  return (
    <span className={`ds-badge ${variantClass} ${className}`.trim()} {...props}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

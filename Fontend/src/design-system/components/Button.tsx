import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'outline' | 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  isLoading?: boolean;
  isIconOnly?: boolean;
  isFormButton?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'outline',
  icon,
  isLoading = false,
  isIconOnly = false,
  isFormButton = false,
  children,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const variantClass = `ds-btn-${variant}`;
  const formClass = isFormButton ? 'ds-btn-form' : '';
  const iconOnlyClass = isIconOnly ? 'ds-btn-icon' : '';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading || disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      className={`ds-btn ${variantClass} ${formClass} ${iconOnlyClass} ${className}`.trim()}
      aria-disabled={isLoading || disabled ? 'true' : undefined}
      aria-busy={isLoading ? 'true' : undefined}
      disabled={disabled && !isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={16} aria-hidden />
      ) : (
        icon ? <span className="ds-btn-icon-wrap" style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span> : null
      )}
      {!isIconOnly && children}
    </button>
  );
};

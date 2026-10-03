import React, { useId } from 'react';

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  iconLeft?: React.ReactNode;
  actionRight?: React.ReactNode;
  isRequired?: boolean;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  error,
  helperText,
  iconLeft,
  actionRight,
  isRequired,
  id: propId,
  className = '',
  disabled,
  ...props
}) => {
  const generatedId = useId();
  const inputId = propId || generatedId;
  const errorId = inputId + '-error';
  const helperId = inputId + '-helper';

  const hasIconLeft = Boolean(iconLeft);
  const hasActionRight = Boolean(actionRight);

  const inputClasses = [
    'ds-input',
    hasIconLeft ? 'has-icon-left' : '',
    hasActionRight ? 'has-action-right' : '',
    error ? 'is-error' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="ds-field" style={{ width: '100%' }}>
      <label htmlFor={inputId} className="ds-label" style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
        {label}
        {isRequired && <span style={{ color: 'var(--danger)', marginLeft: '2px' }}>*</span>}
      </label>

      <div className="ds-input-wrapper">
        {hasIconLeft && (
          <span className="ds-input-icon-left" style={{ color: 'var(--muted)' }} aria-hidden="true">
            {iconLeft}
          </span>
        )}

        <input
          id={inputId}
          className={inputClasses}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          {...props}
        />

        {hasActionRight && (
          <div className="ds-input-action-right" style={{ display: 'flex', alignItems: 'center' }}>
            {actionRight}
          </div>
        )}
      </div>

      {error ? (
        <p id={errorId} className="ds-error-text" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="ds-helper-text" style={{ marginTop: '2px' }}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  iconLeft?: React.ReactNode;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  iconLeft,
  isPassword = false,
  id: propId,
  className = '',
  disabled,
  type = 'text',
  ...props
}) => {
  const generatedId = useId();
  const id = propId || generatedId;
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const hasIconLeft = Boolean(iconLeft);
  const hasActionRight = isPassword;

  const inputClasses = [
    'ds-input',
    hasIconLeft ? 'has-icon-left' : '',
    hasActionRight ? 'has-action-right' : '',
    error ? 'is-error' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="ds-field">
      {label && (
        <label htmlFor={id} className="ds-label">
          {label}
        </label>
      )}

      <div className="ds-input-wrapper">
        {hasIconLeft && <span className="ds-input-icon-left">{iconLeft}</span>}

        <input
          id={id}
          type={inputType}
          className={inputClasses}
          disabled={disabled}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            className="ds-btn ds-btn-ghost ds-btn-icon ds-input-action-right"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            tabIndex={-1}
            disabled={disabled}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error ? (
        <p className="ds-error-text">{error}</p>
      ) : helperText ? (
        <p className="ds-helper-text">{helperText}</p>
      ) : (
        <div style={{ minHeight: '16px' }} />
      )}
    </div>
  );
};

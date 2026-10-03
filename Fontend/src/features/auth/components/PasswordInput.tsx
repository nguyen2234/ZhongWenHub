import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { AuthInput, type AuthInputProps } from './AuthInput';

export interface PasswordInputProps extends Omit<AuthInputProps, 'type' | 'actionRight'> {
  showLockIcon?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  showLockIcon = true,
  iconLeft,
  disabled,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    if (!disabled) {
      setShowPassword((prev) => !prev);
    }
  };

  const actionToggle = (
    <button
      type="button"
      onClick={toggleVisibility}
      disabled={disabled}
      className="ds-btn ds-btn-ghost ds-btn-icon"
      style={{
        width: '32px',
        minWidth: '32px',
        height: '32px',
        padding: 0,
        color: 'var(--muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
    >
      {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
    </button>
  );

  return (
    <AuthInput
      type={showPassword ? 'text' : 'password'}
      iconLeft={iconLeft || (showLockIcon ? <Lock size={16} /> : undefined)}
      actionRight={actionToggle}
      disabled={disabled}
      {...props}
    />
  );
};

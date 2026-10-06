import React from 'react';
import { Outlet } from 'react-router-dom';

export interface AuthLayoutShellProps {
  children?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutShellProps> = ({ children }) => {
  return (
    <div className="auth-app-shell" style={{ minHeight: '100vh', width: '100%' }}>
      {children || <Outlet />}
    </div>
  );
};

export default AuthLayout;

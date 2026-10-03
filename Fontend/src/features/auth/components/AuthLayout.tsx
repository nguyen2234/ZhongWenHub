import React from 'react';
import { AuthVisualPanel } from './AuthVisualPanel';

export interface AuthLayoutProps {
  children: React.ReactNode;
  activeRoute?: 'login' | 'register' | 'forgot-password';
  onNavigate?: (route: 'login' | 'register' | 'forgot-password' | 'dashboard') => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  onNavigate,
}) => {
  return (
    <div
      className="auth-split-layout"
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        backgroundColor: 'var(--background)',
      }}
    >
      {/* LEFT SIDE: Visual Identity Panel (Visible on Desktop / Tablet >= 900px) */}
      <AuthVisualPanel />

      {/* RIGHT SIDE: Authentication Form Workspace */}
      <main
        className="auth-content-panel"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'clamp(20px, 4vw, 48px) clamp(16px, 3vw, 32px)',
          minHeight: '100vh',
          backgroundColor: 'var(--background)',
          overflowY: 'auto',
        }}
      >
        {/* Mobile-only Top Brand Header */}
        <div
          className="auth-mobile-header"
          style={{
            width: '100%',
            maxWidth: '440px',
            marginBottom: 'var(--space-4)',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            onClick={() => onNavigate && onNavigate('dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-hanzi)',
                fontWeight: 700,
                fontSize: '18px',
              }}
            >
              华
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)' }}>
                ZhongWen<span style={{ color: 'var(--primary)' }}>Hub</span>
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--muted)',
              fontWeight: 500,
            }}
          >
            EdTech HSK
          </div>
        </div>

        {/* Auth Content Area */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {children}
        </div>
      </main>

      {/* Responsive Styles specific to Auth Split Layout */}
      <style>{`
        .auth-mobile-header {
          display: none;
        }

        @media (max-width: 899px) {
          .auth-visual-panel {
            display: none !important;
          }
          .auth-split-layout {
            flex-direction: column !important;
          }
          .auth-content-panel {
            width: 100% !important;
            padding: 24px 16px !important;
            justify-content: flex-start !important;
          }
          .auth-mobile-header {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

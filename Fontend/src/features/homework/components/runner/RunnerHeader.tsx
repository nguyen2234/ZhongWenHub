import React from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { RunnerTimer } from './RunnerTimer';
import { AutosaveIndicator } from './AutosaveIndicator';
import type { AutosaveStatus } from '../../hooks/useAssignmentAutosave';

interface RunnerHeaderProps {
  title: string;
  classNameText: string;
  answeredCount: number;
  totalQuestions: number;
  progressPercent: number;
  formattedTime: string;
  isWarning5Min: boolean;
  isWarning1Min: boolean;
  isExpired: boolean;
  autosaveStatus: AutosaveStatus;
  lastSavedAt: string | null;
  onBack: () => void;
  onSubmitClick: () => void;
}

export const RunnerHeader: React.FC<RunnerHeaderProps> = ({
  title,
  classNameText,
  answeredCount,
  totalQuestions,
  progressPercent,
  formattedTime,
  isWarning5Min,
  isWarning1Min,
  isExpired,
  autosaveStatus,
  lastSavedAt,
  onBack,
  onSubmitClick,
}) => {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 var(--space-4)',
      }}
    >
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
        }}
      >
        {/* Left: Back & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--foreground)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            title="Thoát bài làm"
          >
            <ArrowLeft size={18} />
          </button>

          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                color: 'var(--foreground)',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </h1>
            <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>
              {classNameText}
            </div>
          </div>
        </div>

        {/* Center: Progress & Autosave */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            minWidth: '180px',
          }}
          className="hide-mobile"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600 }}>
            <span style={{ color: 'var(--foreground)' }}>
              Đã làm: {answeredCount}/{totalQuestions} câu
            </span>
            <span style={{ color: 'var(--primary)' }}>({progressPercent}%)</span>
          </div>

          <div
            style={{
              width: '100%',
              height: '5px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                backgroundColor: 'var(--primary)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <AutosaveIndicator status={autosaveStatus} lastSavedAt={lastSavedAt} />
        </div>

        {/* Right: Timer & Submit Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
          <RunnerTimer
            formattedTime={formattedTime}
            isWarning5Min={isWarning5Min}
            isWarning1Min={isWarning1Min}
            isExpired={isExpired}
          />

          <button
            type="button"
            onClick={onSubmitClick}
            disabled={isExpired}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: isExpired ? 'var(--neutral-bg)' : 'var(--primary)',
              color: isExpired ? 'var(--muted)' : '#ffffff',
              border: 'none',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              cursor: isExpired ? 'not-allowed' : 'pointer',
              boxShadow: isExpired ? 'none' : '0 2px 8px rgba(67, 56, 202, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Nộp bài</span>
            <Send size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};

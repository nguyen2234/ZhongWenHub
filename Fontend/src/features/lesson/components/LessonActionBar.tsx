import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '../../../design-system';

interface LessonActionBarProps {
  canGoBack: boolean;
  onGoBack: () => void;
  onNext: () => void;
  isCheckMode?: boolean;
  canCheck?: boolean;
  isCompleted?: boolean;
  nextButtonLabel?: string;
}

export const LessonActionBar: React.FC<LessonActionBarProps> = ({
  canGoBack,
  onGoBack,
  onNext,
  isCheckMode = false,
  canCheck = true,
  isCompleted = false,
  nextButtonLabel,
}) => {
  // Support Enter key for proceeding or checking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        if (!isCheckMode || canCheck) {
          e.preventDefault();
          onNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCheckMode, canCheck, onNext]);

  return (
    <nav
      aria-label="Điều hướng bài học"
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 35,
        backgroundColor: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: 'var(--space-3) var(--space-4)',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div
        style={{
          maxWidth: '850px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
        }}
      >
        {/* Back Step Button (Hidden or subtle on mobile) */}
        <div>
          {canGoBack && (
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={onGoBack}
              style={{
                minHeight: '44px',
                padding: '0 var(--space-4)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
              }}
            >
              <span className="lesson-action-back-text">Bước trước</span>
            </Button>
          )}
        </div>

        {/* Primary Action Button (Kiểm tra / Tiếp tục) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="primary"
            disabled={isCheckMode && !canCheck}
            icon={
              isCheckMode ? (
                <Check size={18} strokeWidth={2.5} />
              ) : (
                <ArrowRight size={18} />
              )
            }
            onClick={onNext}
            style={{
              minHeight: '44px',
              minWidth: '150px',
              padding: '0 var(--space-6)',
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(67, 56, 202, 0.25)',
              flex: 'var(--action-btn-flex, 0 1 auto)',
            }}
          >
            {nextButtonLabel ? (
              nextButtonLabel
            ) : isCheckMode ? (
              'KIỂM TRA'
            ) : isCompleted ? (
              'HOÀN THÀNH BÀI'
            ) : (
              'TIẾP TỤC ➜'
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
};

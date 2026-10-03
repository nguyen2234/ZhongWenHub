import React from 'react';
import { Check } from 'lucide-react';
import { type StepMetadata } from '../types';

interface LessonProgressProps {
  steps: StepMetadata[];
  currentStepIndex: number;
  maxUnlockedStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
}

export const LessonProgress: React.FC<LessonProgressProps> = ({
  steps,
  currentStepIndex,
  maxUnlockedStepIndex,
  onSelectStep,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {/* 7-Segmented Progression Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
          gap: '4px',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex || (index <= maxUnlockedStepIndex && index !== currentStepIndex);
          const isCurrent = index === currentStepIndex;
          const isUnlocked = index <= maxUnlockedStepIndex;

          let segmentBg = 'var(--border)';
          if (isCurrent) {
            segmentBg = 'var(--primary)';
          } else if (isCompleted) {
            segmentBg = 'var(--success)';
          }

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isUnlocked}
              onClick={() => isUnlocked && onSelectStep(index)}
              title={`${step.label} (${isCompleted ? 'Đã hoàn thành' : isCurrent ? 'Đang học' : 'Chưa mở khóa'})`}
              style={{
                height: '7px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: segmentBg,
                border: 'none',
                padding: 0,
                cursor: isUnlocked ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                transform: isCurrent ? 'scaleY(1.3)' : 'none',
                opacity: !isUnlocked ? 0.45 : 1,
              }}
            />
          );
        })}
      </div>

      {/* Step Pills on Desktop - Visible on >= 640px */}
      <div
        className="lesson-step-labels"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: 'var(--muted)',
          padding: '0 2px',
        }}
      >
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isUnlocked = index <= maxUnlockedStepIndex;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isUnlocked}
              onClick={() => isUnlocked && onSelectStep(index)}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px 4px',
                cursor: isUnlocked ? 'pointer' : 'default',
                color: isCurrent
                  ? 'var(--primary)'
                  : isCompleted
                  ? 'var(--success)'
                  : 'var(--muted)',
                fontWeight: isCurrent ? 700 : isCompleted ? 600 : 400,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                opacity: !isUnlocked ? 0.5 : 1,
                fontSize: '11px',
                transition: 'all 0.15s ease',
              }}
            >
              {isCompleted ? <Check size={11} strokeWidth={3} /> : null}
              <span>{step.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

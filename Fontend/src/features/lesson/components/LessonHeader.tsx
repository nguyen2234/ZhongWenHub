import React from 'react';
import { ArrowLeft, Flame, Award } from 'lucide-react';
import { LessonProgress } from './LessonProgress';
import { type StepMetadata } from '../types';

interface LessonHeaderProps {
  hskLevel: number;
  unitNumber: number;
  lessonNumber: number;
  hanziTitle: string;
  pinyinTitle: string;
  currentStepIndex: number;
  totalSteps: number;
  streakDays: number;
  xpReward: number;
  steps: StepMetadata[];
  maxUnlockedStepIndex: number;
  onBackToLearningPath: () => void;
  onSelectStep: (stepIndex: number) => void;
}

export const LessonHeader: React.FC<LessonHeaderProps> = ({
  hskLevel,
  unitNumber,
  lessonNumber,
  hanziTitle,
  pinyinTitle,
  currentStepIndex,
  totalSteps,
  streakDays,
  xpReward,
  steps,
  maxUnlockedStepIndex,
  onBackToLearningPath,
  onSelectStep,
}) => {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: 'var(--space-2-5) var(--space-4)',
      }}
    >
      <div
        style={{
          maxWidth: '850px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        {/* Top line: Back button, Title & Quick Indicators */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          {/* Back button + Lesson Identifier */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              type="button"
              onClick={onBackToLearningPath}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Quay lại Lộ trình HSK"
            >
              <ArrowLeft size={14} />
              <span className="lesson-back-label">Lộ trình</span>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--hsk2)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  HSK {hskLevel} · U{unitNumber} · Bài {lessonNumber}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-hanzi)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 700,
                    color: 'var(--foreground)',
                  }}
                >
                  {hanziTitle}
                </span>
                <span
                  className="lesson-header-pinyin"
                  style={{
                    fontSize: '11px',
                    color: 'var(--primary)',
                    fontWeight: 600,
                  }}
                >
                  {pinyinTitle}
                </span>
              </div>
            </div>
          </div>

          {/* Right Metrics: Step count 4/7, Streak & XP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {/* Step fraction */}
            <div
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
              }}
            >
              {currentStepIndex + 1} / {totalSteps}
            </div>

            {/* Streak & XP - Hide on ultra-small mobile screen */}
            <div className="lesson-header-gamification" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--streak-bg)',
                  border: '1px solid var(--streak-border)',
                  color: 'var(--streak)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                }}
                title={`Chuỗi ${streakDays} ngày học liên tiếp`}
              >
                <Flame size={13} />
                <span>{streakDays}</span>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--xp-bg)',
                  border: '1px solid var(--xp-border)',
                  color: 'var(--xp)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                }}
                title={`Phần thưởng +${xpReward} XP`}
              >
                <Award size={13} />
                <span>+{xpReward} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar & Steps */}
        <LessonProgress
          steps={steps}
          currentStepIndex={currentStepIndex}
          maxUnlockedStepIndex={maxUnlockedStepIndex}
          onSelectStep={onSelectStep}
        />
      </div>
    </header>
  );
};

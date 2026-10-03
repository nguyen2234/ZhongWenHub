import React from 'react';
import { Award, Clock, ArrowRight } from 'lucide-react';
import { Card } from './Card';
import { HSKLevel, type HSKLevelType } from './HSKLevel';
import { LessonStatus, type LessonStatusType } from './LessonStatus';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';

export interface LearningCardProps {
  title: string;
  subtitle?: string;
  hskLevel: HSKLevelType;
  status: LessonStatusType;
  skillLabel: string;
  durationMinutes: number;
  xpReward: number;
  progressPercent: number;
  onAction?: () => void;
}

export const LearningCard: React.FC<LearningCardProps> = ({
  title,
  subtitle,
  hskLevel,
  status,
  skillLabel,
  durationMinutes,
  xpReward,
  progressPercent,
  onAction,
}) => {
  const isLocked = status === 'locked';

  return (
    <Card
      style={{
        border: '1px solid var(--border-strong)',
        backgroundColor: 'var(--surface)',
        opacity: isLocked ? 0.75 : 1,
      }}
    >
      {/* Top Header: HSK level, Skill tag, Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <HSKLevel level={hskLevel} />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', backgroundColor: 'var(--neutral-bg)', padding: '2px 8px', borderRadius: '4px' }}>
            {skillLabel}
          </span>
        </div>
        <LessonStatus status={status} />
      </div>

      {/* Title & Subtitle */}
      <h3 style={{ margin: '0 0 var(--space-1) 0', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--foreground)' }}>
        {title}
      </h3>
      {subtitle && (
        <p style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
          {subtitle}
        </p>
      )}

      {/* Progress Bar */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <ProgressBar
          value={progressPercent}
          label={`Tiến độ ${progressPercent}%`}
          variant={progressPercent === 100 ? 'success' : 'primary'}
        />
      </div>

      {/* Footer Info & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={14} /> {durationMinutes} phút
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--xp)', fontWeight: 600 }}>
            <Award size={14} /> +{xpReward} XP
          </span>
        </div>

        <Button
          variant={isLocked ? 'secondary' : 'primary'}
          disabled={isLocked}
          icon={!isLocked ? <ArrowRight size={14} /> : undefined}
          onClick={onAction}
        >
          {isLocked ? 'Đã khóa' : progressPercent > 0 ? 'Học tiếp' : 'Bắt đầu'}
        </Button>
      </div>
    </Card>
  );
};

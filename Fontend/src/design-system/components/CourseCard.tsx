import React from 'react';
import { BookOpen, Award, ArrowRight } from 'lucide-react';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';

export interface CourseCardProps {
  levelTag: string;
  title: string;
  description: string;
  lessonCount: number;
  xpReward: number;
  progressPercent: number;
  onAction?: () => void;
  actionLabel?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  levelTag,
  title,
  description,
  lessonCount,
  xpReward,
  progressPercent,
  onAction,
  actionLabel = 'Tiếp tục học',
}) => {
  return (
    <Card
      style={{
        border: '1px solid var(--border-strong)',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
        <Badge variant="primary">{levelTag}</Badge>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--xp)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Award size={14} /> +{xpReward} XP
        </span>
      </div>

      <h4 style={{ margin: 'var(--space-1) 0 var(--space-1) 0', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--foreground)' }}>
        {title}
      </h4>

      <p style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', color: 'var(--muted)', lineHeight: 1.5 }}>
        {description}
      </p>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <ProgressBar value={progressPercent} label={`Đã học ${progressPercent}%`} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <BookOpen size={14} /> {lessonCount} bài học
        </span>
        <Button variant="primary" icon={<ArrowRight size={14} />} onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
};

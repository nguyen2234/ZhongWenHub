import React from 'react';
import { Flame, Check } from 'lucide-react';

export interface DayStatus {
  label: string;
  isCompleted: boolean;
  isToday?: boolean;
}

export interface StreakTrackerProps {
  streakCount: number;
  days?: DayStatus[];
}

export const StreakTracker: React.FC<StreakTrackerProps> = ({
  streakCount,
  days = [
    { label: 'T2', isCompleted: true },
    { label: 'T3', isCompleted: true },
    { label: 'T4', isCompleted: true },
    { label: 'T5', isCompleted: true },
    { label: 'T6', isCompleted: false, isToday: true },
    { label: 'T7', isCompleted: false },
    { label: 'CN', isCompleted: false },
  ],
}) => {
  return (
    <div className="ds-streak-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--streak)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <Flame size={20} />
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--streak)' }}>
            {streakCount} ngày liên tiếp!
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
            Học mỗi ngày để duy trì chuỗi
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-1-5)' }}>
        {days.map((day, idx) => {
          let circleClass = 'ds-streak-day-circle';
          if (day.isCompleted) circleClass += ' active';
          else if (day.isToday) circleClass += ' today';
          else circleClass += ' pending';

          return (
            <div key={idx} className="ds-streak-day-item">
              <span className="ds-streak-day-label">{day.label}</span>
              <div className={circleClass}>
                {day.isCompleted ? <Check size={14} /> : day.isToday ? '•' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

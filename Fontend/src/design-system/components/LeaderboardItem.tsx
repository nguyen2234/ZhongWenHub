import React from 'react';
import { Flame, Trophy } from 'lucide-react';

export interface LeaderboardItemProps {
  rank: number;
  name: string;
  avatarText: string;
  xp: number;
  streak: number;
  isCurrentUser?: boolean;
}

export const LeaderboardItem: React.FC<LeaderboardItemProps> = ({
  rank,
  name,
  avatarText,
  xp,
  streak,
  isCurrentUser = false,
}) => {
  let rankColor = 'var(--muted)';
  let rankBg = 'transparent';
  if (rank === 1) {
    rankColor = 'var(--rank-gold)';
    rankBg = 'var(--rank-gold-bg)';
  } else if (rank === 2) {
    rankColor = 'var(--rank-silver)';
    rankBg = 'var(--rank-silver-bg)';
  } else if (rank === 3) {
    rankColor = 'var(--rank-bronze)';
    rankBg = 'var(--rank-bronze-bg)';
  }

  return (
    <div
      className="ds-list-row"
      style={{
        backgroundColor: isCurrentUser ? 'var(--primary-light)' : undefined,
        border: isCurrentUser ? '1px solid var(--border-strong)' : '1px solid transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {/* Rank indicator */}
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: rankBg,
            color: rankColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
          }}
        >
          {rank <= 3 ? <Trophy size={14} /> : `#${rank}`}
        </div>

        {/* User Avatar */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--secondary)',
            color: 'var(--foreground)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            border: '1px solid var(--border-strong)',
          }}
        >
          {avatarText}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--foreground)' }}>
            {name} {isCurrentUser && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 500 }}>(Bạn)</span>}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Flame size={12} style={{ color: 'var(--streak)' }} /> {streak} ngày streak
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--xp)' }}>
          {xp.toLocaleString()} XP
        </span>
      </div>
    </div>
  );
};

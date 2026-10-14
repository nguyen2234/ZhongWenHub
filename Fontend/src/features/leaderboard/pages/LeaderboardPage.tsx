import React, { useState } from 'react';
import {
  Trophy,
  Zap,
  Crown,
} from 'lucide-react';

interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  streak: number;
  hskLevel: number;
  isCurrentUser?: boolean;
}

const LEADERBOARD_USERS: LeaderboardUser[] = [
  { rank: 1, name: 'Hoàng Long (黄龙)', avatar: 'HL', xp: 4520, streak: 32, hskLevel: 3 },
  { rank: 2, name: 'Ngọc Mai (玉梅)', avatar: 'NM', xp: 3980, streak: 21, hskLevel: 2 },
  { rank: 3, name: 'Quốc Bảo (国宝)', avatar: 'QB', xp: 3410, streak: 19, hskLevel: 2 },
  { rank: 4, name: 'Minh Anh (Bạn)', avatar: 'MA', xp: 2180, streak: 8, hskLevel: 2, isCurrentUser: true },
  { rank: 5, name: 'Thu Thảo', avatar: 'TT', xp: 1950, streak: 12, hskLevel: 2 },
  { rank: 6, name: 'Đức Huy', avatar: 'DH', xp: 1820, streak: 7, hskLevel: 1 },
  { rank: 7, name: 'Khánh Linh', avatar: 'KL', xp: 1640, streak: 5, hskLevel: 2 },
  { rank: 8, name: 'Thanh Tùng', avatar: 'TT', xp: 1490, streak: 11, hskLevel: 1 },
];

export const LeaderboardPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'weekly' | 'alltime'>('weekly');

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 48px 24px' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
            <Trophy size={14} />
            <span>BẢNG VINH DANH HỌC VIÊN XUẤT SẮC</span>
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 800 }}>
            Bảng Xếp Hạng Tuần Này
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, maxWidth: '640px', lineHeight: 1.5 }}>
            Tích lũy điểm kinh nghiệm XP từ bài học, bài tập về nhà và ôn luyện flashcard để vươn lên top đầu bảng vàng.
          </p>
        </div>

        {/* Timeframe Switch */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px' }}>
          <button
            type="button"
            onClick={() => setTimeframe('weekly')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: timeframe === 'weekly' ? '#ffffff' : 'transparent',
              color: timeframe === 'weekly' ? '#78350f' : '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Tuần này
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('alltime')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: timeframe === 'alltime' ? '#ffffff' : 'transparent',
              color: timeframe === 'alltime' ? '#78350f' : '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Mọi thời đại
          </button>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px', alignItems: 'flex-end' }}>
        {/* 2nd place */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', border: '1.5px solid #cbd5e1', padding: '20px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b' }}>Hạng 2 (Bạc)</div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800 }}>
            {LEADERBOARD_USERS[1].avatar}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{LEADERBOARD_USERS[1].name}</div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#4338ca' }}>{LEADERBOARD_USERS[1].xp} XP</div>
        </div>

        {/* 1st place */}
        <div style={{ backgroundColor: '#fffbeb', borderRadius: '20px', border: '2px solid #f59e0b', padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.15)' }}>
          <Crown size={28} color="#d97706" />
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#b45309' }}>Quán Quân (Vàng)</div>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fef3c7', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, border: '2px solid #f59e0b' }}>
            {LEADERBOARD_USERS[0].avatar}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{LEADERBOARD_USERS[0].name}</div>
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#b45309' }}>{LEADERBOARD_USERS[0].xp} XP</div>
        </div>

        {/* 3rd place */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', border: '1.5px solid #cbd5e1', padding: '20px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#b45309' }}>Hạng 3 (Đồng)</div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ffedd5', color: '#9a3412', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800 }}>
            {LEADERBOARD_USERS[2].avatar}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{LEADERBOARD_USERS[2].name}</div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#4338ca' }}>{LEADERBOARD_USERS[2].xp} XP</div>
        </div>
      </div>

      {/* Ranked List */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
        {LEADERBOARD_USERS.map((user) => (
          <div
            key={user.rank}
            style={{
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f1f5f9',
              backgroundColor: user.isCurrentUser ? '#eef2ff' : '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span
                style={{
                  width: '24px',
                  fontSize: '14px',
                  fontWeight: 900,
                  color: user.rank <= 3 ? '#d97706' : '#64748b',
                  textAlign: 'center',
                }}
              >
                #{user.rank}
              </span>

              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: user.isCurrentUser ? '#4338ca' : '#f1f5f9',
                  color: user.isCurrentUser ? '#ffffff' : '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {user.avatar}
              </div>

              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: user.isCurrentUser ? '#4338ca' : '#0f172a' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  HSK {user.hskLevel} • Chuỗi {user.streak} ngày
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 800, color: '#4338ca' }}>
              <Zap size={15} />
              <span>{user.xp.toLocaleString()} XP</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardPage;

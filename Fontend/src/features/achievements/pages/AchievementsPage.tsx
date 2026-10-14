import React from 'react';
import {
  Award,
  CheckCircle2,
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'Đồng' | 'Bạc' | 'Vàng' | 'Kim cương';
  isUnlocked: boolean;
  unlockedDate?: string;
  progressPercent: number;
  xpReward: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-01',
    title: 'Khởi đầu Vững chắc',
    description: 'Hoàn thành bài học tiếng Trung đầu tiên trên hệ thống.',
    icon: '🌱',
    rarity: 'Đồng',
    isUnlocked: true,
    unlockedDate: '01/10/2026',
    progressPercent: 100,
    xpReward: 50,
  },
  {
    id: 'ach-02',
    title: 'Chiến Thần Chuỗi Ngày',
    description: 'Duy trì chuỗi học tập liên tục trong 7 ngày.',
    icon: '🔥',
    rarity: 'Bạc',
    isUnlocked: true,
    unlockedDate: '08/10/2026',
    progressPercent: 100,
    xpReward: 100,
  },
  {
    id: 'ach-03',
    title: 'Bậc Thầy Flashcard 100',
    description: 'Ôn tập và thuộc lòng 100 thẻ từ vựng với thuật toán SRS.',
    icon: '🧠',
    rarity: 'Bạc',
    isUnlocked: true,
    unlockedDate: '10/10/2026',
    progressPercent: 100,
    xpReward: 150,
  },
  {
    id: 'ach-04',
    title: 'Thần Tốc HSK 2',
    description: 'Đạt từ 180 điểm trở lên trong đề thi thử HSK 2 chuẩn hóa.',
    icon: '🎯',
    rarity: 'Vàng',
    isUnlocked: true,
    unlockedDate: '12/10/2026',
    progressPercent: 100,
    xpReward: 250,
  },
  {
    id: 'ach-05',
    title: 'Nhà Đàm Thoại Bản Xứ',
    description: 'Thực hiện 30 phút luyện nói liên tục với gia sư AI Kippy.',
    icon: '🎙️',
    rarity: 'Vàng',
    isUnlocked: false,
    progressPercent: 65,
    xpReward: 300,
  },
  {
    id: 'ach-06',
    title: 'Học Giả Bất Bại',
    description: 'Đạt chuỗi 30 ngày học liên tiếp không bỏ lỡ một buổi nào.',
    icon: '👑',
    rarity: 'Kim cương',
    isUnlocked: false,
    progressPercent: 26,
    xpReward: 1000,
  },
];

export const AchievementsPage: React.FC = () => {
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.isUnlocked).length;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 24px 48px 24px' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
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
            <Award size={14} />
            <span>KHO HUY HIỆU & DANH HIỆU THÀNH TÍCH</span>
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 800 }}>
            Thành Tựu & Bộ Sưu Tập Huy Hiệu
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, maxWidth: '640px', lineHeight: 1.5 }}>
            Khám phá các cột mốc thử thách, mở khóa danh hiệu danh giá và nhận thêm phần thưởng XP kinh nghiệm.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>{unlockedCount} / {ACHIEVEMENTS.length}</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Đã mở khóa</div>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {ACHIEVEMENTS.map((ach) => (
          <div
            key={ach.id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: ach.isUnlocked ? '1.5px solid #e2e8f0' : '1.5px dashed #cbd5e1',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              opacity: ach.isUnlocked ? 1 : 0.75,
              boxShadow: ach.isUnlocked ? '0 4px 6px -1px rgba(0,0,0,0.02)' : 'none',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span
                  style={{
                    fontSize: '32px',
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    backgroundColor: ach.isUnlocked ? '#f5f3ff' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {ach.icon}
                </span>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor:
                      ach.rarity === 'Kim cương'
                        ? '#e0e7ff'
                        : ach.rarity === 'Vàng'
                        ? '#fef3c7'
                        : ach.rarity === 'Bạc'
                        ? '#f1f5f9'
                        : '#ffedd5',
                    color:
                      ach.rarity === 'Kim cương'
                        ? '#4338ca'
                        : ach.rarity === 'Vàng'
                        ? '#b45309'
                        : ach.rarity === 'Bạc'
                        ? '#475569'
                        : '#c2410c',
                  }}
                >
                  {ach.rarity} • +{ach.xpReward} XP
                </span>
              </div>

              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                {ach.title}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.45 }}>
                {ach.description}
              </p>
            </div>

            {/* Progress or Unlocked info */}
            <div>
              {ach.isUnlocked ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>
                  <CheckCircle2 size={15} />
                  <span>Đã mở khóa ngày {ach.unlockedDate}</span>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                    <span>Tiến độ thử thách</span>
                    <span>{ach.progressPercent}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '9999px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                    <div style={{ width: `${ach.progressPercent}%`, height: '100%', borderRadius: '9999px', backgroundColor: '#7c3aed' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementsPage;

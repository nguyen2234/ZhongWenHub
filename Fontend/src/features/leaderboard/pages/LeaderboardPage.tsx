import React from 'react';
import { Trophy, Award } from 'lucide-react';
import { useAuthContext } from '../../auth/context/AuthContext';

export const LeaderboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthContext();

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
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            <Trophy size={14} />
            <span>BẢNG VINH DANH HỌC VIÊN XUẤT SẮC</span>
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 800 }}>
            Bảng Xếp Hạng Học Viên
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, maxWidth: '640px', lineHeight: 1.5 }}>
            Tích lũy điểm kinh nghiệm XP từ bài học, bài tập và ôn luyện flashcard để vươn lên bảng vàng vinh danh.
          </p>
        </div>
      </div>

      {/* Feature In Development Notice */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          padding: '48px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#fef3c7',
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Award size={32} />
        </div>

        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
            Bảng xếp hạng đang được phát triển
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '540px', margin: '0 auto', lineHeight: 1.6 }}>
            Tính năng Bảng xếp hạng tuần và mọi thời đại đang được hoàn thiện để kết nối trực tiếp với dữ liệu học tập thực tế từ máy chủ. Chúng tôi cam kết không hiển thị thông tin học viên giả lập.
          </p>
        </div>

        {isAuthenticated && user && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px 24px',
              borderRadius: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Tài khoản của bạn</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{user.fullName || user.email}</div>
            </div>
            <div style={{ width: '1px', height: '32px', backgroundColor: '#e2e8f0' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Điểm kinh nghiệm</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary, #E60012)' }}>{user.xpPoints || 0} XP</div>
            </div>
            <div style={{ width: '1px', height: '32px', backgroundColor: '#e2e8f0' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Chuỗi ngày học</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#f59e0b' }}>{user.streakDays || 0} Ngày</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

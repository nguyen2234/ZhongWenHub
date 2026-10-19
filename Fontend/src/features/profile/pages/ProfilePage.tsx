import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit3,
  Check,
  Shield,
  BookOpen,
  PenTool,
  TrendingUp,
  Users,
  Settings,
  ChevronRight,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('Trần Minh Anh');
  const [email] = useState('minhanh.tran@zhongwenhub.edu.vn');
  const [hskGoal, setHskGoal] = useState<number>(3);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(30);
  const [isSaved, setIsSaved] = useState(false);

  const secondaryShortcuts = [
    { label: 'Sổ từ vựng SRS', desc: 'Ôn tập Spaced Repetition thông minh', path: '/vocabulary', icon: BookOpen, color: '#0284c7', bg: '#f0f9ff' },
    { label: 'Luyện tập & Đề thi', desc: 'Ngân hàng bài tập HSK & kỹ năng', path: '/practice', icon: PenTool, color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Tiến độ học tập', desc: 'Thống kê XP, Streak & bài hoàn thành', path: '/progress', icon: TrendingUp, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Lớp học của tôi', desc: 'Lớp học trực tuyến & giảng viên', path: '/classes', icon: Users, color: '#ea580c', bg: '#fff7ed' },
    { label: 'Cài đặt hệ thống', desc: 'Tùy chọn hiển thị Pinyin, âm thanh & thông báo', path: '/settings', icon: Settings, color: '#475569', bg: '#f8fafc' },
  ];

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 48px 24px' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              backgroundColor: '#4338ca',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            MA
          </div>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
              <Shield size={13} />
              <span>HỌC VIÊN CHÍNH THỨC</span>
            </div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 800 }}>
              {name}
            </h1>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>
              Mã học viên: ZWH-2026-8942 • Tham gia: Tháng 09/2026
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Features Access (FE-8 Mobile Access to non-bottom nav features) */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
          Tính năng Học tập & Quản lý
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '12px',
          }}
        >
          {secondaryShortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  minHeight: '48px',
                  touchAction: 'manipulation',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary, #E60012)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: item.bg,
                      color: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Settings Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
          Thông tin Cá nhân & Mục tiêu Học tập
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Họ và tên học viên
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Địa chỉ Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#64748b',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* HSK Goal Target */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Mục tiêu chứng chỉ HSK tiếp theo
            </label>
            <select
              value={hskGoal}
              onChange={(e) => setHskGoal(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
              }}
            >
              <option value={1}>HSK 1 (150 từ - Căn bản)</option>
              <option value={2}>HSK 2 (300 từ - Giao tiếp hàng ngày)</option>
              <option value={3}>HSK 3 (600 từ - Trung cấp 1)</option>
              <option value={4}>HSK 4 (1200 từ - Lưu loát)</option>
            </select>
          </div>

          {/* Daily Goal Minutes */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Mục tiêu học mỗi ngày
            </label>
            <select
              value={dailyGoalMinutes}
              onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
              }}
            >
              <option value={15}>15 phút / ngày (Nhẹ nhàng)</option>
              <option value={30}>30 phút / ngày (Tiêu chuẩn)</option>
              <option value={45}>45 phút / ngày (Chuyên sâu)</option>
              <option value={60}>60 phút / ngày (Cấp tốc)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={handleSave}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 24px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: isSaved ? '#16a34a' : '#4338ca',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isSaved ? <Check size={16} /> : <Edit3 size={16} />}
            <span>{isSaved ? 'Đã lưu thay đổi!' : 'Lưu thông tin'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

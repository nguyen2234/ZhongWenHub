import React, { useState, useEffect } from 'react';
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
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { authService } from '../../auth/services/authService';
import { useLearningState } from '../../learning';
import { learningApiService } from '../../learning/services/learning-api.service';
import type { AuthUser } from '../../auth/types/auth.types';

function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'ZH';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatStudentCode(id?: string): string {
  if (!id) return 'ZWH-2026';
  const clean = id.replace(/-/g, '').toUpperCase();
  return `ZWH-${clean.substring(0, 8)}`;
}

function formatJoinDate(dateStr?: string): string {
  if (!dateStr) return 'Tháng 11/2026';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Tháng 11/2026';
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `Tháng ${month}/${year}`;
  } catch {
    return 'Tháng 11/2026';
  }
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { state: learningState, selectHskLevel } = useLearningState();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [hskGoal, setHskGoal] = useState<number>(3);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(30);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial user profile from real backend
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    authService.getCurrentUser()
      .then((currUser) => {
        if (!isMounted) return;
        if (currUser) {
          setUser(currUser);
          setName(currUser.fullName || '');
          setEmail(currUser.email || '');
        }
      })
      .catch((err) => {
        console.warn('[ProfilePage] Error fetching current user:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync initial learning goals from learning state
  useEffect(() => {
    if (learningState.selectedHskLevel) {
      setHskGoal(learningState.selectedHskLevel);
    }
    if (learningState.dailyGoal?.targetMinutes) {
      setDailyGoalMinutes(learningState.dailyGoal.targetMinutes);
    }
  }, [learningState.selectedHskLevel, learningState.dailyGoal?.targetMinutes]);

  const secondaryShortcuts = [
    { label: 'Sổ từ vựng SRS', desc: 'Ôn tập Spaced Repetition thông minh', path: '/vocabulary', icon: BookOpen, color: '#0284c7', bg: '#f0f9ff' },
    { label: 'Luyện tập & Đề thi', desc: 'Ngân hàng bài tập HSK & kỹ năng', path: '/practice', icon: PenTool, color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Tiến độ học tập', desc: 'Thống kê XP, Streak & bài hoàn thành', path: '/progress', icon: TrendingUp, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Lớp học của tôi', desc: 'Lớp học trực tuyến & giảng viên', path: '/classes', icon: Users, color: '#ea580c', bg: '#fff7ed' },
    { label: 'Cài đặt hệ thống', desc: 'Tùy chọn hiển thị Pinyin, âm thanh & thông báo', path: '/settings', icon: Settings, color: '#475569', bg: '#f8fafc' },
  ];

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Họ và tên không được để trống.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      // 1. Update personal information (DisplayName) in SQL Server via Backend API
      const updatedUser = await authService.updateProfile({
        displayName: trimmedName,
      });
      setUser(updatedUser);

      // 2. Update learning goals in SQL Server via Learning API & Context
      selectHskLevel(hskGoal);
      await learningApiService.updatePreferences({
        selectedHskLevel: hskGoal,
        targetDailyMinutes: dailyGoalMinutes,
      });

      // 3. Mark success
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu thay đổi. Vui lòng thử lại.';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const initials = getInitials(name || user?.fullName);
  const studentCode = formatStudentCode(user?.id);
  const joinDate = formatJoinDate(user?.createdAt);
  const roleLabel = user?.roles?.includes('ADMIN') ? 'QUẢN TRỊ VIÊN' : 'HỌC VIÊN CHÍNH THỨC';

  return (
    <div className="student-content-container profile-page-root" style={{ maxWidth: '960px' }}>
      {/* Banner */}
      <div
        className="profile-banner-card"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '20px',
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
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={name || 'Avatar'}
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                objectFit: 'cover',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            />
          ) : (
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
              {initials}
            </div>
          )}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
              <Shield size={13} />
              <span>{roleLabel}</span>
            </div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 800 }}>
              {isLoading ? 'Đang tải hồ sơ...' : (name || 'Học viên ZhongWenHub')}
            </h1>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>
              Mã học viên: {studentCode} • Tham gia: {joinDate}
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
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
        className="profile-settings-card"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
          Thông tin Cá nhân & Mục tiêu Học tập
        </h3>

        {/* Error message alert */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '20px' }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Họ và tên học viên
            </label>
            <input
              type="text"
              value={name}
              disabled={isLoading || isSaving}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập họ và tên..."
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
              title="Địa chỉ email được bảo vệ và không thể thay đổi trực tiếp."
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
                cursor: 'not-allowed',
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
              disabled={isLoading || isSaving}
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
              <option value={5}>HSK 5 (2500 từ - Nâng cao)</option>
              <option value={6}>HSK 6 (5000+ từ - Chuyên gia)</option>
            </select>
          </div>

          {/* Daily Goal Minutes */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Mục tiêu học mỗi ngày
            </label>
            <select
              value={dailyGoalMinutes}
              disabled={isLoading || isSaving}
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
            disabled={isLoading || isSaving}
            onClick={handleSave}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 24px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: isSaved ? '#16a34a' : (isSaving ? '#6366f1' : '#4338ca'),
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isSaving ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isSaving ? 0.8 : 1,
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : isSaved ? (
              <>
                <Check size={16} />
                <span>Đã lưu thay đổi!</span>
              </>
            ) : (
              <>
                <Edit3 size={16} />
                <span>Lưu thông tin</span>
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`
        .profile-banner-card {
          padding: 28px 32px;
        }
        .profile-settings-card {
          padding: 28px;
        }
        @media (max-width: 640px) {
          .profile-banner-card {
            padding: 20px 16px !important;
          }
          .profile-settings-card {
            padding: 18px 14px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  Sparkles,
  KeyRound,
  BookOpen,
  Clock,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import type { UserDetail } from '../types/user.types';
import { adminUserService } from '../services/user.service';
import { StatusBadge, ConfirmDialog, ToastNotification, type ToastMessage } from '../../../shared/components';
import {
  ResetPasswordModal,
  AdjustWalletModal,
  UpdateSubscriptionModal,
} from '../components';
import '../components/user-management.css';

const getRoleBadgeInfo = (roles?: string[]) => {
  const primaryRole = roles && roles.length > 0 ? roles[0].toUpperCase() : 'STUDENT';
  switch (primaryRole) {
    case 'ADMIN':
      return { label: 'Quản trị viên', variant: 'danger' as const, bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' };
    case 'TEACHER':
      return { label: 'Giáo viên', variant: 'primary' as const, bg: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' };
    case 'CONTENT_MANAGER':
      return { label: 'Quản lý nội dung', variant: 'warning' as const, bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706' };
    case 'SUPPORT':
      return { label: 'Hỗ trợ viên', variant: 'info' as const, bg: 'rgba(13, 148, 136, 0.1)', color: '#0d9488' };
    case 'STUDENT':
    default:
      return { label: 'Học viên', variant: 'neutral' as const, bg: 'rgba(100, 116, 139, 0.1)', color: '#475569' };
  }
};

const getStatusVariant = (status: UserDetail['status']) => {
  switch (status) {
    case 'ACTIVE':
      return { variant: 'success' as const, label: 'Đang hoạt động' };
    case 'PENDING':
      return { variant: 'warning' as const, label: 'Chờ xác thực' };
    case 'LOCKED':
      return { variant: 'danger' as const, label: 'Tài khoản bị khóa' };
    case 'INACTIVE':
    default:
      return { variant: 'neutral' as const, label: 'Ngưng hoạt động' };
  }
};

const isWalletAndPlanEligible = (user: UserDetail) => {
  const primaryRole = (user.roles?.[0] || user.role || 'STUDENT').toUpperCase();
  return primaryRole === 'STUDENT' || primaryRole === 'TEACHER';
};

const isSoleAdmin = (user: UserDetail) => {
  return (
    user.email.toLowerCase() === 'admin@gmail.com' ||
    user.roles?.includes('ADMIN') ||
    user.role === 'ADMIN'
  );
};

export const AdminUserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modals state
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isAdjustWalletOpen, setIsAdjustWalletOpen] = useState(false);
  const [isUpdateSubOpen, setIsUpdateSubOpen] = useState(false);
  const [isConfirmLockOpen, setIsConfirmLockOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const fetchUser = useCallback(async () => {
    if (!id) {
      setLoadError('Mã người dùng không hợp lệ.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await adminUserService.getUserDetailAsync(id);
      setUser(data);
    } catch (err: any) {
      setLoadError(err?.message || 'Không tìm thấy người dùng hoặc lỗi kết nối.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Lock / Unlock Handlers
  const handleToggleLock = async () => {
    if (!user) return;
    if (isSoleAdmin(user)) {
      setToast({
        type: 'error',
        message: 'Không thể vô hiệu hóa tài khoản Quản trị viên duy nhất trong hệ thống.',
      });
      return;
    }

    try {
      let updated: UserDetail;
      if (user.status === 'LOCKED' || user.status === 'INACTIVE') {
        updated = await adminUserService.unlockUser(user.id);
        setToast({
          type: 'success',
          message: `Đã kích hoạt lại tài khoản ${user.name} thành công.`,
        });
      } else {
        updated = await adminUserService.lockUser(
          user.id,
          'Tài khoản bị tạm khóa theo yêu cầu kiểm tra của Quản trị viên.'
        );
        setToast({
          type: 'success',
          message: `Đã vô hiệu hóa tài khoản ${user.name}.`,
        });
      }
      setUser(updated);
      setIsConfirmLockOpen(false);
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err?.message || 'Không thể thay đổi trạng thái tài khoản.',
      });
    }
  };

  // Reset Password Handler
  const handleConfirmResetPassword = async (
    userIdOrPassword: string,
    newPassword?: string,
    confirmPassword?: string
  ) => {
    if (!user) return;
    const targetUserId = newPassword ? userIdOrPassword : user.id;
    const targetPassword = newPassword || userIdOrPassword;
    const targetConfirm = confirmPassword || targetPassword;

    try {
      const res = await adminUserService.resetPasswordAsync(targetUserId, {
        newPassword: targetPassword,
        confirmPassword: targetConfirm,
      });
      setToast({
        type: 'success',
        message: res.message || `Đã đặt lại mật khẩu cho tài khoản ${user.name} thành công!`,
      });
      setIsResetPasswordOpen(false);
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err?.message || 'Không thể đặt lại mật khẩu.',
      });
      throw err;
    }
  };

  // Adjust Wallet Handler
  const handleConfirmAdjustWallet = async (userId: string, amount: number, reason: string) => {
    try {
      const res = await adminUserService.adjustWalletBalanceAsync(userId, { amount, reason });
      setToast({
        type: 'success',
        message: res.message || 'Đã điều chỉnh số dư ví thành công!',
      });
      setIsAdjustWalletOpen(false);
      await fetchUser();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err?.message || 'Không thể điều chỉnh số dư.',
      });
      throw err;
    }
  };

  // Update Subscription Handler
  const handleConfirmUpdateSubscription = async (userId: string, plan: string, durationMonths: number) => {
    try {
      const res = await adminUserService.updateSubscriptionPlanAsync(userId, {
        plan,
        durationMonths,
      });
      setToast({
        type: 'success',
        message: res.message || 'Đã cập nhật gói hội viên thành công!',
      });
      setIsUpdateSubOpen(false);
      await fetchUser();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err?.message || 'Không thể cập nhật gói.',
      });
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="user-management-container" style={{ padding: '40px 0', textAlign: 'center' }}>
        <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Đang tải thông tin hồ sơ người dùng...</p>
      </div>
    );
  }

  if (loadError || !user) {
    return (
      <div className="user-management-container">
        <button
          type="button"
          className="ds-btn ds-btn-outline ds-btn-sm"
          onClick={() => navigate('/management/admin/users')}
          style={{ width: 'fit-content' }}
        >
          <ArrowLeft size={16} style={{ marginRight: '6px' }} />
          Quay lại danh sách
        </button>

        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            textAlign: 'center',
            marginTop: '16px',
          }}
        >
          <AlertCircle size={36} style={{ color: '#dc2626', margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#991b1b', margin: '0 0 6px' }}>
            Không tìm thấy người dùng
          </h3>
          <p style={{ fontSize: '13px', color: '#7f1d1d', margin: '0 0 16px' }}>
            {loadError || 'Mã định danh người dùng không tồn tại hoặc đã bị xóa khỏi hệ thống.'}
          </p>
          <button
            type="button"
            className="ds-btn ds-btn-primary ds-btn-sm"
            onClick={() => navigate('/management/admin/users')}
          >
            Quay lại danh sách người dùng
          </button>
        </div>
      </div>
    );
  }

  const roleInfo = getRoleBadgeInfo(user.roles || (user.role ? [user.role] : undefined));
  const statusInfo = getStatusVariant(user.status);
  const eligible = isWalletAndPlanEligible(user);
  const adminAccount = isSoleAdmin(user);
  const isDeactivated = user.status === 'LOCKED' || user.status === 'INACTIVE';

  return (
    <div className="user-management-container">
      {/* Top Navigation & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={() => navigate('/management/admin/users')}
            title="Quay lại danh sách"
          >
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            Quay lại danh sách
          </button>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
            <span>Quản lý người dùng</span>
            <span style={{ margin: '0 6px' }}>/</span>
            <strong style={{ color: 'var(--foreground)' }}>Chi tiết người dùng</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="ds-btn ds-btn-primary ds-btn-sm"
            onClick={() => navigate(`/management/admin/users/${user.id}/edit`)}
          >
            <Edit3 size={15} style={{ marginRight: '6px' }} />
            Chỉnh sửa thông tin
          </button>

          {!adminAccount && (
            <button
              type="button"
              className={`ds-btn ds-btn-sm ${isDeactivated ? 'ds-btn-outline' : 'ds-btn-danger'}`}
              onClick={() => setIsConfirmLockOpen(true)}
            >
              {isDeactivated ? (
                <>
                  <ShieldCheck size={15} style={{ marginRight: '6px', color: '#16a34a' }} />
                  Kích hoạt lại
                </>
              ) : (
                <>
                  <ShieldAlert size={15} style={{ marginRight: '6px' }} />
                  Vô hiệu hóa
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Hero Header Card */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: roleInfo.bg,
            color: roleInfo.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 800,
            border: `2px solid ${roleInfo.color}`,
            flexShrink: 0,
          }}
        >
          {getInitials(user.name)}
        </div>

        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--foreground)' }}>
              {user.name}
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 10px',
                borderRadius: '12px',
                backgroundColor: roleInfo.bg,
                color: roleInfo.color,
              }}
            >
              {roleInfo.label}
            </span>
            <StatusBadge label={statusInfo.label} variant={statusInfo.variant} size="sm" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={14} />
              {user.email}
            </span>
            {user.phone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={14} />
                {user.phone}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} />
              Tham gia: {user.joinedAt}
            </span>
          </div>
        </div>
      </div>

      {/* Lock Notice if applicable */}
      {isDeactivated && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <ShieldAlert size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ fontSize: '13px', color: 'var(--danger)' }}>
              Tài khoản này đang bị khóa / ngưng hoạt động
            </strong>
            <p style={{ fontSize: '12px', color: 'var(--foreground)', margin: '4px 0 0 0' }}>
              {user.lockReason || 'Tài khoản tạm khóa theo quyết định của Quản trị viên.'}
            </p>
            {user.lockedAt && (
              <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                Thời điểm khóa: {user.lockedAt}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main 2-Column Responsive Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '16px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Account & Profile Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card A: Thông tin cơ bản */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
            }}
          >
            <div className="drawer-section-title" style={{ marginBottom: '12px' }}>
              <span>Thông tin cá nhân & Tài khoản</span>
            </div>
            <div className="drawer-data-grid">
              <div className="drawer-data-cell" style={{ gridColumn: 'span 2' }}>
                <span className="drawer-cell-lbl">Mã định danh người dùng (User ID)</span>
                <span className="drawer-cell-val" style={{ fontSize: '11px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  {user.id}
                </span>
              </div>
              <div className="drawer-data-cell">
                <span className="drawer-cell-lbl">Họ và tên</span>
                <span className="drawer-cell-val" style={{ fontWeight: 700 }}>{user.name}</span>
              </div>
              <div className="drawer-data-cell">
                <span className="drawer-cell-lbl">Vai trò hệ thống</span>
                <span className="drawer-cell-val" style={{ color: roleInfo.color, fontWeight: 700 }}>
                  {roleInfo.label}
                </span>
              </div>
              <div className="drawer-data-cell">
                <span className="drawer-cell-lbl">Trình độ HSK</span>
                <span className="drawer-cell-val" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                  {user.hskLevel}
                </span>
              </div>
              <div className="drawer-data-cell">
                <span className="drawer-cell-lbl">Trạng thái</span>
                <span className="drawer-cell-val">
                  <StatusBadge label={statusInfo.label} variant={statusInfo.variant} size="sm" />
                </span>
              </div>
              <div className="drawer-data-cell">
                <span className="drawer-cell-lbl">Ngày tạo tài khoản</span>
                <span className="drawer-cell-val">{user.joinedAt}</span>
              </div>
              <div className="drawer-data-cell">
                <span className="drawer-cell-lbl">Hoạt động gần nhất</span>
                <span className="drawer-cell-val">{user.lastActiveAt}</span>
              </div>
              {user.phone && (
                <div className="drawer-data-cell" style={{ gridColumn: 'span 2' }}>
                  <span className="drawer-cell-lbl">Số điện thoại liên hệ</span>
                  <span className="drawer-cell-val">{user.phone}</span>
                </div>
              )}
              {user.notes && (
                <div className="drawer-data-cell" style={{ gridColumn: 'span 2' }}>
                  <span className="drawer-cell-lbl">Ghi chú quản trị</span>
                  <span className="drawer-cell-val" style={{ color: 'var(--muted)', fontWeight: 400 }}>
                    {user.notes}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Dữ liệu học tập Telemetry */}
          <div className="drawer-learning-card" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="drawer-section-title" style={{ marginBottom: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={16} style={{ color: 'var(--primary)' }} />
                Dữ liệu học tập & Hoạt động
              </span>
              <span className="drawer-read-only-pill">Telemetry</span>
            </div>

            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                <span>Tiến độ hoàn thành lộ trình HSK</span>
                <strong>{user.learningSummary.progressPercentage}%</strong>
              </div>
              <div className="table-progress-bar" style={{ height: '6px' }}>
                <div
                  className="table-progress-fill"
                  style={{ width: `${user.learningSummary.progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="learning-telemetry-grid">
              <div className="telemetry-box">
                <span className="telemetry-val" style={{ color: 'var(--primary)' }}>
                  {user.learningSummary.totalXp.toLocaleString()}
                </span>
                <span className="telemetry-lbl">Tổng điểm XP</span>
              </div>
              <div className="telemetry-box">
                <span className="telemetry-val" style={{ color: '#d97706' }}>
                  {user.learningSummary.streakDays}
                </span>
                <span className="telemetry-lbl">Chuỗi Streak (ngày)</span>
              </div>
              <div className="telemetry-box">
                <span className="telemetry-val">
                  {user.learningSummary.completedLessons}/{user.learningSummary.totalLessons}
                </span>
                <span className="telemetry-lbl">Bài học hoàn thành</span>
              </div>
              <div className="telemetry-box">
                <span className="telemetry-val" style={{ color: '#16a34a' }}>
                  {user.learningSummary.vocabularyMastered}
                </span>
                <span className="telemetry-lbl">Từ vựng thành thạo</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                color: 'var(--muted)',
                marginTop: '12px',
                paddingTop: '8px',
                borderTop: '1px solid var(--border)',
              }}
            >
              <Clock size={13} />
              <span>Phiên học gần nhất: </span>
              <strong style={{ color: 'var(--foreground)' }}>
                {user.learningSummary.lastStudySession}
              </strong>
            </div>
          </div>
        </div>

        {/* Right Column: Wallet, Subscription & Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card C: Ví & Số dư tài khoản (Chỉ cho STUDENT và TEACHER) */}
          {eligible && (
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 700, fontSize: '14px' }}>
                  <CreditCard size={18} style={{ color: '#16a34a' }} />
                  Ví & Số dư tài khoản
                </span>
                <button
                  type="button"
                  className="ds-btn ds-btn-outline ds-btn-sm"
                  style={{ fontSize: '11px', padding: '3px 10px', borderColor: '#86efac', color: '#15803d', backgroundColor: '#ffffff' }}
                  onClick={() => setIsAdjustWalletOpen(true)}
                >
                  Điều chỉnh số dư
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#15803d' }}>Số dư hiện tại:</span>
                <strong style={{ fontSize: '22px', color: '#166534', fontVariantNumeric: 'tabular-nums' }}>
                  {(user.walletBalance ?? 0).toLocaleString('vi-VN')} ₫
                </strong>
              </div>

              {/* Transactions List */}
              <div style={{ borderTop: '1px solid #dcfce7', paddingTop: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '8px' }}>
                  Lịch sử giao dịch ví ({user.walletTransactions?.length || 0})
                </span>
                {user.walletTransactions && user.walletTransactions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {user.walletTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11px',
                          padding: '6px 10px',
                          backgroundColor: '#ffffff',
                          borderRadius: '6px',
                          border: '1px solid #dcfce7',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {tx.amount >= 0 ? (
                            <ArrowDownLeft size={14} style={{ color: '#16a34a' }} />
                          ) : (
                            <ArrowUpRight size={14} style={{ color: '#dc2626' }} />
                          )}
                          <div>
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{tx.reason || tx.transactionType}</span>
                            <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>{tx.createdAt}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ color: tx.amount >= 0 ? '#16a34a' : '#dc2626' }}>
                            {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')} ₫
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '11px', color: '#15803d', margin: 0 }}>Chưa có giao dịch phát sinh.</p>
                )}
              </div>
            </div>
          )}

          {/* Card D: Gói sử dụng hiện tại (Chỉ cho STUDENT và TEACHER) */}
          {eligible && (
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fed7aa',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9a3412', fontWeight: 700, fontSize: '14px' }}>
                  <Sparkles size={18} style={{ color: '#ea580c' }} />
                  Gói sử dụng hiện tại
                </span>
                <button
                  type="button"
                  className="ds-btn ds-btn-outline ds-btn-sm"
                  style={{ fontSize: '11px', padding: '3px 10px', borderColor: '#fdba74', color: '#c2410c', backgroundColor: '#ffffff' }}
                  onClick={() => setIsUpdateSubOpen(true)}
                >
                  Thay đổi gói
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: '#9a3412' }}>Gói kích hoạt:</span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '12px',
                    padding: '3px 12px',
                    borderRadius: '12px',
                    backgroundColor:
                      user.plan === 'Premium' ? '#f59e0b' : user.plan === 'Basic' ? '#3b82f6' : '#64748b',
                    color: '#ffffff',
                  }}
                >
                  {user.plan || 'Free'}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#78350f', display: 'flex', gap: '16px' }}>
                <span>Bắt đầu: <strong>{user.planStartDate || 'Chưa thiết lập'}</strong></span>
                <span>Hết hạn: <strong>{user.planEndDate || 'Vô thời hạn'}</strong></span>
              </div>
            </div>
          )}

          {/* Card E: Bảo mật & Mật khẩu */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
            }}
          >
            <div className="drawer-section-title" style={{ marginBottom: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={16} style={{ color: '#2563eb' }} />
                Bảo mật tài khoản
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 14px' }}>
              Mật khẩu được lưu trữ dưới dạng salted PBKDF2 hash theo chuẩn ASP.NET Core Identity. Quản trị viên có thể hỗ trợ cấp lại mật khẩu mới cho người dùng khi cần thiết.
            </p>

            {adminAccount ? (
              <div
                style={{
                  fontSize: '11px',
                  color: '#991b1b',
                  backgroundColor: '#fef2f2',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #fecaca',
                }}
              >
                Tài khoản Quản trị viên hệ thống (admin@gmail.com) được bảo vệ và sử dụng luồng quản trị bảo mật riêng.
              </div>
            ) : (
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                onClick={() => setIsResetPasswordOpen(true)}
              >
                <KeyRound size={14} style={{ marginRight: '6px', color: '#2563eb' }} />
                Đặt lại mật khẩu người dùng
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        user={user}
        onClose={() => setIsResetPasswordOpen(false)}
        onConfirm={handleConfirmResetPassword}
      />

      {/* Adjust Wallet Balance Modal */}
      <AdjustWalletModal
        isOpen={isAdjustWalletOpen}
        user={user}
        onClose={() => setIsAdjustWalletOpen(false)}
        onConfirm={handleConfirmAdjustWallet}
      />

      {/* Update Subscription Plan Modal */}
      <UpdateSubscriptionModal
        isOpen={isUpdateSubOpen}
        user={user}
        onClose={() => setIsUpdateSubOpen(false)}
        onConfirm={handleConfirmUpdateSubscription}
      />

      {/* Confirm Deactivate / Activate Dialog */}
      <ConfirmDialog
        isOpen={isConfirmLockOpen}
        title={isDeactivated ? `Kích hoạt lại tài khoản ${user.name}?` : `Vô hiệu hóa tài khoản ${user.name}?`}
        message={
          isDeactivated
            ? 'Người dùng sẽ có thể đăng nhập trở lại và tiếp tục sử dụng hệ thống đào tạo ZhongWenHub.'
            : 'Tài khoản sẽ bị vô hiệu hóa (tạm khóa). Người dùng sẽ không thể đăng nhập cho đến khi được kích hoạt lại.'
        }
        confirmLabel={isDeactivated ? 'Kích hoạt lại tài khoản' : 'Vô hiệu hóa tài khoản'}
        cancelLabel="Hủy bỏ"
        isDestructive={!isDeactivated}
        onConfirm={handleToggleLock}
        onCancel={() => setIsConfirmLockOpen(false)}
      />

      {/* Toast Notification */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default AdminUserDetailPage;

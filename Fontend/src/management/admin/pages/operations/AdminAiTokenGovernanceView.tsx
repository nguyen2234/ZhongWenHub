import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  Power,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  X,
  Save,
  MessageSquare,
  Mail,
  Bot,
} from 'lucide-react';
import {
  aiGovernanceService,
  type AiFeatureGovernance,
  type UpdateAiFeatureGovernancePayload,
} from '../../services/ai-governance.service';

export const AdminAiTokenGovernanceView: React.FC = () => {
  const [governances, setGovernances] = useState<AiFeatureGovernance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<AiFeatureGovernance | null>(null);
  const [editForm, setEditForm] = useState<UpdateAiFeatureGovernancePayload>({
    isEnabled: true,
    dailyTokenQuota: 500000,
    monthlyTokenQuota: 15000000,
    userDailyRequestLimit: 50,
    maxTokensPerRequest: 2048,
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await aiGovernanceService.getOverview();
      setGovernances(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải cấu hình token governance.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleCircuitBreaker = async (item: AiFeatureGovernance) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const updated = await aiGovernanceService.updateGovernance(item.featureGroup, {
        isEnabled: !item.isEnabled,
        dailyTokenQuota: item.dailyTokenQuota,
        monthlyTokenQuota: item.monthlyTokenQuota,
        userDailyRequestLimit: item.userDailyRequestLimit,
        maxTokensPerRequest: item.maxTokensPerRequest,
      });

      setGovernances((prev) =>
        prev.map((g) => (g.featureGroup === updated.featureGroup ? updated : g))
      );
      setSuccessMessage(
        `Đã ${updated.isEnabled ? 'kích hoạt' : 'tạm dừng (Kill Switch)'} chức năng "${item.displayNameVi}".`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái hoạt động.';
      setErrorMessage(msg);
    }
  };

  const handleOpenEdit = (item: AiFeatureGovernance) => {
    setEditingItem(item);
    setEditForm({
      isEnabled: item.isEnabled,
      dailyTokenQuota: item.dailyTokenQuota,
      monthlyTokenQuota: item.monthlyTokenQuota,
      userDailyRequestLimit: item.userDailyRequestLimit,
      maxTokensPerRequest: item.maxTokensPerRequest,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await aiGovernanceService.updateGovernance(editingItem.featureGroup, editForm);
      setGovernances((prev) =>
        prev.map((g) => (g.featureGroup === updated.featureGroup ? updated : g))
      );
      setSuccessMessage(`Đã cập nhật hạn mức cho "${editingItem.displayNameVi}" thành công.`);
      setEditingItem(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu hạn mức cấu hình.';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const getFeatureIcon = (featureGroup: string) => {
    switch (featureGroup) {
      case 'AI_LETTER_WRITING':
        return <Mail size={22} style={{ color: '#2563eb' }} />;
      case 'AI_TUTOR':
        return <Bot size={22} style={{ color: '#7c3aed' }} />;
      case 'AI_CONVERSATION':
        return <MessageSquare size={22} style={{ color: '#059669' }} />;
      default:
        return <Zap size={22} style={{ color: '#d97706' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Refresh */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--foreground)' }}>
            Quản Trị Token & Phân Bổ Hạn Mức Tính Năng (AI Token Governance)
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
            Kiểm soát token quota ngày & tháng, giới hạn request người dùng, và công tắc ngắt khẩn cấp (Circuit Breaker / Kill Switch) lưu trữ trực tiếp vào SQL Server.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--foreground)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={16} className={isLoading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Error / Success Feedback Alerts */}
      {errorMessage && (
        <div
          data-testid="governance-error-alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '13px',
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          data-testid="governance-success-alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#15803d',
            fontSize: '13px',
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && governances.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          Đang tải dữ liệu cấu hình hạn mức từ SQL Server...
        </div>
      ) : (
        /* Feature Group Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
          {governances.map((item) => {
            const dailyPct = item.dailyTokenQuota > 0
              ? Math.min(100, Math.round((item.tokensUsedToday / item.dailyTokenQuota) * 100))
              : 0;

            const monthlyPct = item.monthlyTokenQuota > 0
              ? Math.min(100, Math.round((item.tokensUsedThisMonth / item.monthlyTokenQuota) * 100))
              : 0;

            return (
              <div
                key={item.id}
                data-testid={`governance-card-${item.featureGroup}`}
                style={{
                  padding: '20px',
                  backgroundColor: 'var(--surface)',
                  border: item.isEnabled ? '1px solid var(--border)' : '1px solid #f87171',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  opacity: item.isEnabled ? 1 : 0.85,
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--background)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {getFeatureIcon(item.featureGroup)}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>
                        {item.displayNameVi}
                      </h3>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>
                        {item.featureGroup}
                      </div>
                    </div>
                  </div>

                  {/* Circuit Breaker Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleCircuitBreaker(item)}
                    data-testid={`kill-switch-${item.featureGroup}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: item.isEnabled ? '#dcfce7' : '#fee2e2',
                      color: item.isEnabled ? '#15803d' : '#b91c1c',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title={item.isEnabled ? 'Bấm để ngắt khẩn cấp chức năng này' : 'Bấm để mở lại chức năng này'}
                  >
                    <Power size={14} />
                    {item.isEnabled ? 'HOẠT ĐỘNG' : 'TẠM DỪNG'}
                  </button>
                </div>

                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted)', minHeight: '36px' }}>
                  {item.descriptionVi || 'Chức năng AI trên nền tảng ZhongWenHub.'}
                </p>

                {/* Daily Token Quota Progress */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--muted)' }}>Hạn mức ngày (Daily Quota)</span>
                    <strong style={{ color: dailyPct >= 90 ? '#b91c1c' : 'var(--foreground)' }}>
                      {item.tokensUsedToday.toLocaleString()} / {item.dailyTokenQuota.toLocaleString()} tokens ({dailyPct}%)
                    </strong>
                  </div>
                  <div
                    style={{
                      height: '7px',
                      borderRadius: '4px',
                      backgroundColor: '#e2e8f0',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${dailyPct}%`,
                        backgroundColor: dailyPct >= 90 ? '#ef4444' : dailyPct >= 70 ? '#f59e0b' : '#3b82f6',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Monthly Token Quota Progress */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--muted)' }}>Hạn mức tháng (Monthly Quota)</span>
                    <strong style={{ color: monthlyPct >= 90 ? '#b91c1c' : 'var(--foreground)' }}>
                      {item.tokensUsedThisMonth.toLocaleString()} / {item.monthlyTokenQuota.toLocaleString()} tokens ({monthlyPct}%)
                    </strong>
                  </div>
                  <div
                    style={{
                      height: '7px',
                      borderRadius: '4px',
                      backgroundColor: '#e2e8f0',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${monthlyPct}%`,
                        backgroundColor: monthlyPct >= 90 ? '#ef4444' : monthlyPct >= 70 ? '#f59e0b' : '#8b5cf6',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Limits Snapshot */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    padding: '10px 12px',
                    backgroundColor: 'var(--background)',
                    borderRadius: '10px',
                    fontSize: '11.5px',
                    textAlign: 'center',
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: '11px' }}>Lượt/User/Ngày</div>
                    <strong style={{ color: 'var(--foreground)' }}>{item.userDailyRequestLimit} lượt</strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: '11px' }}>Max Tokens/Lượt</div>
                    <strong style={{ color: 'var(--foreground)' }}>{item.maxTokensPerRequest} tkn</strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: '11px' }}>Yêu Cầu Hôm Nay</div>
                    <strong style={{ color: 'var(--foreground)' }}>{item.requestsToday} req</strong>
                  </div>
                </div>

                {/* Action footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    data-testid={`edit-governance-${item.featureGroup}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'transparent',
                      color: 'var(--foreground)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Edit2 size={13} />
                    Thay đổi hạn mức
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Quota Modal */}
      {editingItem && (
        <div
          data-testid="governance-edit-modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sliders size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--foreground)' }}>
                  Cấu hình Hạn Mức: {editingItem.displayNameVi}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>
                  Hạn mức token mỗi ngày (Daily Token Quota)
                </label>
                <input
                  type="number"
                  min={10000}
                  step={10000}
                  value={editForm.dailyTokenQuota}
                  onChange={(e) => setEditForm({ ...editForm, dailyTokenQuota: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)',
                    fontSize: '13px',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>
                  Hạn mức token mỗi tháng (Monthly Token Quota)
                </label>
                <input
                  type="number"
                  min={100000}
                  step={100000}
                  value={editForm.monthlyTokenQuota}
                  onChange={(e) => setEditForm({ ...editForm, monthlyTokenQuota: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)',
                    fontSize: '13px',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>
                    Lượt dùng tối đa / User / Ngày
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={editForm.userDailyRequestLimit}
                    onChange={(e) => setEditForm({ ...editForm, userDailyRequestLimit: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--background)',
                      color: 'var(--foreground)',
                      fontSize: '13px',
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>
                    Max Tokens / Lượt phản hồi
                  </label>
                  <input
                    type="number"
                    min={256}
                    max={8192}
                    value={editForm.maxTokensPerRequest}
                    onChange={(e) => setEditForm({ ...editForm, maxTokensPerRequest: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--background)',
                      color: 'var(--foreground)',
                      fontSize: '13px',
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="checkbox"
                  id="modal-is-enabled"
                  checked={editForm.isEnabled}
                  onChange={(e) => setEditForm({ ...editForm, isEnabled: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="modal-is-enabled" style={{ fontSize: '13px', color: 'var(--foreground)' }}>
                  Cho phép hoạt động (Bỏ tick để ngắt khẩn cấp tính năng này)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'transparent',
                    color: 'var(--foreground)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'var(--primary, #2563eb)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Save size={16} />
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

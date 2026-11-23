import React, { useState, useEffect } from 'react';
import {
  Bot,
  Shield,
  Activity,
  Sliders,
  Cpu,
  Zap,
  CheckCircle2,
  Database,
} from 'lucide-react';
import { adminOperationsService, type AIServiceModel, type AIOperationsStats } from '../../services/admin-operations.service';
import { AdminAIProviderManagementView } from './AdminAIProviderManagementView';
import { AdminAiTokenGovernanceView } from './AdminAiTokenGovernanceView';

const INCIDENT_LOGS: Array<{ id: string; time: string; service: string; event: string; level: string }> = [];

export const AdminAIManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'providers' | 'governance' | 'telemetry'>('providers');
  const [quotaThreshold, setQuotaThreshold] = useState<number>(85);
  const [services, setServices] = useState<AIServiceModel[]>([]);
  const [aiStats, setAiStats] = useState<AIOperationsStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    adminOperationsService.getAIOperationsStats().then((data) => {
      if (data) {
        setAiStats(data);
        if (data.services && data.services.length > 0) {
          setServices(data.services);
        }
      }
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return { label: 'ONLINE', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' };
      case 'IDLE':
        return { label: 'IDLE (Chờ)', color: '#b45309', bg: '#fffbeb', border: '#fde68a' };
      default:
        return { label: 'CHƯA RÕ', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Sub-tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('providers')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'providers' ? 'var(--primary, #2563eb)' : '#f1f5f9',
            color: activeTab === 'providers' ? '#ffffff' : '#475569',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Nhà Cung Cấp & Failover Router
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('governance')}
          data-testid="tab-ai-governance"
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'governance' ? 'var(--primary, #2563eb)' : '#f1f5f9',
            color: activeTab === 'governance' ? '#ffffff' : '#475569',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Quản Trị Token & Hạn Mức (Governance)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('telemetry')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'telemetry' ? 'var(--primary, #2563eb)' : '#f1f5f9',
            color: activeTab === 'telemetry' ? '#ffffff' : '#475569',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Giám Sát Viễn Thám & Hạn Mức Quota
        </button>
      </div>

      {activeTab === 'providers' && <AdminAIProviderManagementView />}
      {activeTab === 'governance' && <AdminAiTokenGovernanceView />}

      {activeTab === 'telemetry' && (
        <>
          {/* Security & Architecture Warning */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1e40af',
              fontSize: '12.5px',
              lineHeight: 1.5,
            }}
          >
            <Shield size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#2563eb' }} />
            <div>
              <strong>Chính sách Bảo mật & Vận hành AI:</strong> Mã khóa API (API keys) và thông tin xác thực nhà cung cấp AI được bảo vệ nghiêm ngặt ở tầng hạ tầng Backend ASP.NET Core & Secure Secrets. Giám sát thời gian thực hoạt động AI trên toàn hệ thống.
            </div>
          </div>

      {/* Real-time AI Telemetry Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Cpu size={24} style={{ color: 'var(--primary)' }} />
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Tổng yêu cầu AI</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--foreground)' }}>
              {isLoading ? '...' : (aiStats?.totalRequests ?? 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Zap size={24} style={{ color: '#eab308' }} />
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Độ trễ trung bình</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--foreground)' }}>
              {isLoading ? '...' : (aiStats?.totalRequests && aiStats.totalRequests > 0 ? `${aiStats.averageLatencyMs} ms` : '—')}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <CheckCircle2 size={24} style={{ color: '#16a34a' }} />
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Tỷ lệ thành công</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>
              {isLoading ? '...' : (aiStats?.totalRequests && aiStats.totalRequests > 0 && aiStats.successRate !== null && aiStats.successRate !== undefined ? `${aiStats.successRate}%` : '—')}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Database size={24} style={{ color: '#8b5cf6' }} />
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Tokens đã xử lý</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--foreground)' }}>
              {isLoading ? '...' : (aiStats?.totalTokens ?? 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Quota Threshold Control Card */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sliders size={20} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>
              Ngưỡng Cảnh Báo Hạn Mức Toàn Hệ Thống (Token Quota Guard)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Cảnh báo ban quản trị khi tổng lưu lượng token tiêu thụ vượt ngưỡng cấu hình.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--foreground)' }}>
            Ngưỡng hiện tại: <strong style={{ color: 'var(--primary)', fontSize: '15px' }}>{quotaThreshold}%</strong>
          </span>
          <input
            type="range"
            min={50}
            max={95}
            step={5}
            value={quotaThreshold}
            onChange={(e) => setQuotaThreshold(Number(e.target.value))}
            aria-label="Điều chỉnh ngưỡng cảnh báo quota"
            style={{ width: '130px', accentColor: 'var(--primary)' }}
          />
        </div>
      </div>

      {/* AI Services Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {services.map((srv) => {
          const isOverQuota = (srv.usagePercent ?? 0) >= quotaThreshold;
          const badge = getStatusBadge(srv.status);

          return (
            <div
              key={srv.id}
              style={{
                padding: '18px 20px',
                backgroundColor: 'var(--surface)',
                border: `1px solid ${isOverQuota ? 'var(--danger-border)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Bot size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: 'var(--foreground)' }}>
                      {srv.name}
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{srv.provider}</div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    color: badge.color,
                    backgroundColor: badge.bg,
                    border: `1px solid ${badge.border}`,
                  }}
                >
                  {badge.label}
                </span>
              </div>

              {/* Description */}
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
                {srv.description}
              </p>

              {/* Operational Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '6px',
                  padding: '10px 10px',
                  backgroundColor: 'var(--background)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '11.5px',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: '11px' }}>Độ trễ</div>
                  <strong style={{ color: 'var(--foreground)' }}>{srv.latencyMs ? `${srv.latencyMs} ms` : '—'}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: '11px' }}>Thành công</div>
                  <strong style={{ color: '#16a34a' }}>
                    {srv.successRate !== null && srv.successRate !== undefined ? `${srv.successRate}%` : '—'}
                  </strong>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: '11px' }}>Lượt xử lý</div>
                  <strong style={{ color: 'var(--foreground)' }}>
                    {srv.totalEvents !== undefined && srv.totalEvents !== null ? srv.totalEvents.toLocaleString() : '—'}
                  </strong>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: '11px' }}>Tiêu thụ</div>
                  <strong style={{ color: isOverQuota ? '#be123c' : 'var(--foreground)' }}>
                    {srv.usagePercent !== undefined && srv.usagePercent !== null ? `${srv.usagePercent}%` : '0%'}
                  </strong>
                </div>
              </div>

              {/* Quota Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
                  <span>Tỉ lệ sử dụng quota</span>
                  <span>{srv.usagePercent !== undefined && srv.usagePercent !== null ? srv.usagePercent : 0}% / {quotaThreshold}%</span>
                </div>
                <div
                  style={{
                    height: '6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--secondary)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, srv.usagePercent || 0)}%`,
                      backgroundColor: isOverQuota ? 'var(--danger)' : 'var(--primary)',
                      borderRadius: 'var(--radius-full)',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Incident & Activity Log */}
      <div
        style={{
          padding: '18px 20px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <h3
          style={{
            margin: '0 0 14px 0',
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--foreground)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Activity size={16} /> Nhật ký vận hành dịch vụ AI
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {INCIDENT_LOGS.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: 'var(--muted)',
                fontSize: '13px',
                backgroundColor: 'var(--background)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border)',
              }}
            >
              Chưa ghi nhận sự cố gián đoạn dịch vụ AI trong hệ thống.
            </div>
          ) : (
            INCIDENT_LOGS.map((inc) => (
              <div
                key={inc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  fontSize: '12.5px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor:
                        inc.level === 'WARNING'
                          ? '#fffbeb'
                          : inc.level === 'RESOLVED'
                          ? '#f0fdf4'
                          : 'var(--secondary)',
                      color:
                        inc.level === 'WARNING'
                          ? '#b45309'
                          : inc.level === 'RESOLVED'
                          ? '#16a34a'
                          : 'var(--muted)',
                    }}
                  >
                    {inc.level}
                  </span>
                  <strong style={{ color: 'var(--foreground)' }}>{inc.service}:</strong>
                  <span style={{ color: 'var(--foreground)' }}>{inc.event}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{inc.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};
export default AdminAIManagementView;

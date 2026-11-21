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
  Server,
  Network,
  Plus,
  RefreshCw,
  Power,
  X,
  Search,
  Lock,
} from 'lucide-react';
import {
  adminOperationsService,
  type AIServiceModel,
  type AIOperationsStats,
  type AiProviderConfig,
  type CreateAiProviderPayload,
  type ApiEndpointItem,
} from '../../services/admin-operations.service';

const INITIAL_AI_SERVICES: AIServiceModel[] = [
  {
    id: 'ai-tutor',
    name: 'AI Tutor (Trợ lý đối thoại)',
    role: 'Hội thoại tiếng Trung, giải đáp ngữ pháp và sửa lỗi ngữ cảnh',
    provider: 'Google Gemini 2.5 Flash',
    latencyMs: null as any,
    uptime: null as any,
    usagePercent: 0,
    status: 'UNKNOWN',
    description: 'Hỗ trợ hội thoại và phân tích ngữ pháp tiếng Trung HSK 1-6.',
  },
  {
    id: 'ai-live',
    name: 'AI Live (Luyện phát âm & Phản xạ)',
    role: 'Nhận diện giọng nói (ASR) và đánh giá ngữ điệu Pinyin',
    provider: 'Whisper-Large-v3 & FunASR Speech',
    latencyMs: null as any,
    uptime: null as any,
    usagePercent: 0,
    status: 'UNKNOWN',
    description: 'Chấm điểm 4 thanh điệu tiếng Trung, phát hiện phát âm sai phụ âm đầu và vần.',
  },
  {
    id: 'ai-grading',
    name: 'AI Grading (Chấm bài tập & Đoạn văn)',
    role: 'Chấm điểm tự động bài tập viết chữ Hán và dịch câu',
    provider: 'Gemini 2.5 Pro Pedagogical',
    latencyMs: null as any,
    uptime: null as any,
    usagePercent: 0,
    status: 'UNKNOWN',
    description: 'Hỗ trợ giáo viên chấm bài tập về nhà và gợi ý nhận xét.',
  },
  {
    id: 'ai-analytics',
    name: 'AI Analytics (Gợi ý lộ trình thích ứng)',
    role: 'Phân tích điểm yếu kiến thức và lập lịch ôn tập ngắt quãng (SRS)',
    provider: 'ZhongWenHub Adaptive Pedagogical Engine',
    latencyMs: null as any,
    uptime: null as any,
    usagePercent: 0,
    status: 'UNKNOWN',
    description: 'Cá nhân hóa danh sách từ vựng cần ôn luyện hôm nay dựa trên SRS.',
  },
];

const INCIDENT_LOGS: Array<{ id: string; time: string; service: string; event: string; level: string }> = [];

export const AdminAIManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'services' | 'providers' | 'registry'>('services');
  const [quotaThreshold, setQuotaThreshold] = useState<number>(85);
  const [services, setServices] = useState<AIServiceModel[]>(INITIAL_AI_SERVICES);
  const [aiStats, setAiStats] = useState<AIOperationsStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // AI Providers state
  const [providers, setProviders] = useState<AiProviderConfig[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message?: string; latencyMs?: number }>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingProvider, setIsSubmittingProvider] = useState(false);
  const [providerFormError, setProviderFormError] = useState<string | null>(null);
  const [newProvider, setNewProvider] = useState<CreateAiProviderPayload>({
    providerType: 'GEMINI',
    name: '',
    baseUrl: 'https://generativelanguage.googleapis.com',
    apiKey: '',
    defaultModel: 'gemini-2.5-flash',
    priority: 1,
  });

  // API Registry state
  const [registryEndpoints, setRegistryEndpoints] = useState<ApiEndpointItem[]>([]);
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(false);
  const [registryFilter, setRegistryFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    setIsLoading(true);
    adminOperationsService
      .getAIOperationsStats()
      .then((data) => {
        if (data) {
          setAiStats(data);
          if (data.services && data.services.length > 0) {
            setServices(data.services);
          }
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const loadProviders = async () => {
    setIsLoadingProviders(true);
    try {
      const data = await adminOperationsService.getAiProviders();
      setProviders(data);
    } finally {
      setIsLoadingProviders(false);
    }
  };

  const loadRegistry = async () => {
    setIsLoadingRegistry(true);
    try {
      const data = await adminOperationsService.getApiRegistry();
      setRegistryEndpoints(data);
    } finally {
      setIsLoadingRegistry(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'providers' && providers.length === 0) {
      loadProviders();
    } else if (activeTab === 'registry' && registryEndpoints.length === 0) {
      loadRegistry();
    }
  }, [activeTab]);

  const handleToggleProvider = async (p: AiProviderConfig) => {
    try {
      const updated = await adminOperationsService.toggleAiProvider(p.id, !p.isEnabled);
      setProviders((prev) => prev.map((item) => (item.id === p.id ? updated : item)));
    } catch (err: any) {
      alert(err?.message || 'Không thể thay đổi trạng thái provider');
    }
  };

  const handleTestProvider = async (id: string) => {
    setTestingId(id);
    try {
      const res = await adminOperationsService.testAiProviderConnection(id);
      setTestResults((prev) => ({ ...prev, [id]: res }));
      // Reload providers to get updated lastPingAt & lastPingStatus
      loadProviders();
    } finally {
      setTestingId(null);
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvider.name.trim()) {
      setProviderFormError('Vui lòng nhập tên nhà cung cấp.');
      return;
    }
    setProviderFormError(null);
    setIsSubmittingProvider(true);
    try {
      await adminOperationsService.createAiProvider(newProvider);
      setIsAddModalOpen(false);
      setNewProvider({
        providerType: 'GEMINI',
        name: '',
        baseUrl: 'https://generativelanguage.googleapis.com',
        apiKey: '',
        defaultModel: 'gemini-2.5-flash',
        priority: 1,
      });
      loadProviders();
    } catch (err: any) {
      setProviderFormError(err?.message || 'Không thể tạo nhà cung cấp AI.');
    } finally {
      setIsSubmittingProvider(false);
    }
  };

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

  const filteredEndpoints = registryEndpoints.filter((ep) => {
    const matchesText =
      !registryFilter ||
      ep.route.toLowerCase().includes(registryFilter.toLowerCase()) ||
      ep.controller.toLowerCase().includes(registryFilter.toLowerCase()) ||
      ep.action.toLowerCase().includes(registryFilter.toLowerCase());
    const matchesRole = !roleFilter || ep.roles.toLowerCase().includes(roleFilter.toLowerCase());
    return matchesText && matchesRole;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
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
          <strong>Chính sách Bảo mật & Vận hành AI:</strong> Mã khóa API (API keys) và thông tin xác thực nhà cung cấp AI được bảo vệ nghiêm ngặt ở tầng hạ tầng Backend ASP.NET Core & Secure Secrets. Giám sát thời gian thực hoạt động AI trên toàn hệ thống và bảo vệ chống SSRF.
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1.5px solid var(--border)',
          paddingBottom: '2px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('services')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            border: 'none',
            borderBottom: activeTab === 'services' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'services' ? 'var(--primary)' : 'var(--muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Bot size={16} />
          <span>Dịch vụ AI & Giám sát</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('providers')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            border: 'none',
            borderBottom: activeTab === 'providers' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'providers' ? 'var(--primary)' : 'var(--muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Server size={16} />
          <span>Cấu hình AI Providers ({providers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('registry')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            border: 'none',
            borderBottom: activeTab === 'registry' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'registry' ? 'var(--primary)' : 'var(--muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Network size={16} />
          <span>Danh mục API & Phân quyền RBAC</span>
        </button>
      </div>

      {/* TAB 1: SERVICES & TELEMETRY */}
      {activeTab === 'services' && (
        <>
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
                  {isLoading ? '...' : aiStats?.totalRequests && aiStats.totalRequests > 0 ? `${aiStats.averageLatencyMs} ms` : '—'}
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
                  {isLoading ? '...' : aiStats?.totalRequests && aiStats.totalRequests > 0 && aiStats.successRate !== null && aiStats.successRate !== undefined ? `${aiStats.successRate}%` : '—'}
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

      {/* TAB 2: AI PROVIDERS CONFIGURATION */}
      {activeTab === 'providers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--foreground)' }}>
                Cấu hình Nhà Cung Cấp AI (AI Provider Control)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                Quản lý các kết nối AI models, kiểm tra kết nối thời gian thực và kích hoạt/vô hiệu hóa tức thì.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={loadProviders}
                disabled={isLoadingProviders}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--foreground)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={14} className={isLoadingProviders ? 'animate-spin' : ''} />
                <span>Làm mới</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus size={15} />
                <span>Thêm Provider</span>
              </button>
            </div>
          </div>

          {/* Providers Table / Cards */}
          {isLoadingProviders ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              Đang tải danh sách nhà cung cấp AI...
            </div>
          ) : providers.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px dashed var(--border)',
                color: 'var(--muted)',
                fontSize: '13px',
              }}
            >
              Chưa có nhà cung cấp AI nào được cấu hình trong cơ sở dữ liệu. Nhấn "Thêm Provider" để cấu hình kết nối đầu tiên.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {providers.map((p) => {
                const testRes = testResults[p.id];
                const isTesting = testingId === p.id;

                return (
                  <div
                    key={p.id}
                    style={{
                      padding: '16px 18px',
                      backgroundColor: 'var(--surface)',
                      border: p.isEnabled ? '1px solid var(--border)' : '1px dashed #cbd5e1',
                      borderRadius: 'var(--radius-xl)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      opacity: p.isEnabled ? 1 : 0.75,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            backgroundColor: p.isEnabled ? 'var(--primary-light)' : '#f1f5f9',
                            color: p.isEnabled ? 'var(--primary)' : '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Server size={18} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>
                            {p.name}
                          </h4>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                            }}
                          >
                            {p.providerType}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: p.isEnabled ? '#dcfce7' : '#fee2e2',
                            color: p.isEnabled ? '#15803d' : '#b91c1c',
                          }}
                        >
                          {p.isEnabled ? 'BẬT' : 'TẮT'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', color: 'var(--muted)' }}>
                      <div>
                        <strong>Endpoint:</strong> <code>{p.baseUrl || 'Mặc định'}</code>
                      </div>
                      <div>
                        <strong>Default Model:</strong> <code>{p.defaultModel || 'N/A'}</code>
                      </div>
                      <div>
                        <strong>API Key:</strong> <code>{p.maskedApiKey || 'Không yêu cầu / Đã che'}</code>
                      </div>
                      <div>
                        <strong>Ưu tiên:</strong> {p.priority}
                      </div>
                      {p.lastPingAt && (
                        <div>
                          <strong>Ping gần nhất:</strong> {new Date(p.lastPingAt).toLocaleTimeString('vi-VN')} —{' '}
                          <span style={{ color: p.lastPingStatus === 'OK' ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                            {p.lastPingStatus} ({p.lastPingLatencyMs}ms)
                          </span>
                        </div>
                      )}
                    </div>

                    {testRes && (
                      <div
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          backgroundColor: testRes.success ? '#f0fdf4' : '#fef2f2',
                          color: testRes.success ? '#166534' : '#991b1b',
                          border: `1px solid ${testRes.success ? '#bbf7d0' : '#fecaca'}`,
                        }}
                      >
                        {testRes.success
                          ? `✓ Kết nối thành công (${testRes.latencyMs} ms)`
                          : `✗ Thất bại: ${testRes.message}`}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleProvider(p)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'transparent',
                          color: p.isEnabled ? '#dc2626' : '#16a34a',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Power size={13} />
                        <span>{p.isEnabled ? 'Vô hiệu hóa' : 'Kích hoạt'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTestProvider(p.id)}
                        disabled={isTesting}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <RefreshCw size={13} className={isTesting ? 'animate-spin' : ''} />
                        <span>{isTesting ? 'Đang ping...' : 'Test Connection'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Provider Modal */}
          {isAddModalOpen && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                padding: '16px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '500px',
                  padding: '24px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    Thêm Nhà Cung Cấp AI Mới
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '11.5px',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Lock size={14} style={{ color: '#2563eb' }} />
                  <span>Bảo vệ SSRF: Chỉ chấp nhận URL HTTPS công khai (hoặc localhost khi phát triển).</span>
                </div>

                {providerFormError && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      fontSize: '12px',
                      color: '#b91c1c',
                    }}
                  >
                    {providerFormError}
                  </div>
                )}

                <form onSubmit={handleCreateProvider} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      Loại Provider
                    </label>
                    <select
                      value={newProvider.providerType}
                      onChange={(e) => setNewProvider({ ...newProvider, providerType: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                      }}
                    >
                      <option value="GEMINI">Google Gemini API</option>
                      <option value="OPENAI">OpenAI API</option>
                      <option value="AZURE_OPENAI">Azure OpenAI</option>
                      <option value="CLAUDE">Anthropic Claude</option>
                      <option value="CUSTOM_LOCAL">Custom Local Model</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      Tên định danh *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Google Gemini 2.5 Flash Production"
                      value={newProvider.name}
                      onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      Base URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://generativelanguage.googleapis.com"
                      value={newProvider.baseUrl || ''}
                      onChange={(e) => setNewProvider({ ...newProvider, baseUrl: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      API Key (Sẽ được che và lưu an toàn)
                    </label>
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={newProvider.apiKey || ''}
                      onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      Default Model
                    </label>
                    <input
                      type="text"
                      placeholder="gemini-2.5-flash"
                      value={newProvider.defaultModel || ''}
                      onChange={(e) => setNewProvider({ ...newProvider, defaultModel: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingProvider}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'var(--primary)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {isSubmittingProvider ? 'Đang lưu...' : 'Lưu Provider'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: API REGISTRY & RBAC INVENTORY */}
      {activeTab === 'registry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--foreground)' }}>
                Danh mục API Backend & Phân quyền RBAC
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                Toàn bộ endpoint ASP.NET Core được kiểm kê tự động qua reflection kèm vai trò phân quyền tương ứng.
              </p>
            </div>

            <button
              type="button"
              onClick={loadRegistry}
              disabled={isLoadingRegistry}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} className={isLoadingRegistry ? 'animate-spin' : ''} />
              <span>Quét lại Endpoints</span>
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Tìm route, controller hoặc action..."
                value={registryFilter}
                onChange={(e) => setRegistryFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  fontSize: '12px',
                }}
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                fontSize: '12px',
                minWidth: '160px',
              }}
            >
              <option value="">Tất cả phân quyền</option>
              <option value="Admin">Admin</option>
              <option value="Teacher">Teacher</option>
              <option value="Support">Support</option>
              <option value="Student">Student</option>
              <option value="Authenticated">Authenticated</option>
              <option value="Public">Public (AllowAnonymous)</option>
            </select>
          </div>

          {/* Endpoints Table */}
          {isLoadingRegistry ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              Đang quét toàn bộ Controller và Routes trong ứng dụng...
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '10px 14px', fontWeight: 700, width: '90px' }}>Method</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700 }}>Endpoint Route</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700 }}>Controller / Action</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700 }}>Yêu cầu Phân quyền (RBAC)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEndpoints.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>
                          Không tìm thấy endpoint nào phù hợp bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredEndpoints.map((ep, idx) => {
                        const methodColors: Record<string, { bg: string; color: string }> = {
                          GET: { bg: '#eff6ff', color: '#1d4ed8' },
                          POST: { bg: '#f0fdf4', color: '#15803d' },
                          PUT: { bg: '#fffbeb', color: '#b45309' },
                          PATCH: { bg: '#faf5ff', color: '#7e22ce' },
                          DELETE: { bg: '#fef2f2', color: '#b91c1c' },
                        };
                        const mColor = methodColors[ep.method] || { bg: '#f1f5f9', color: '#475569' };

                        return (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: '1px solid var(--border)',
                              backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--background)',
                            }}
                          >
                            <td style={{ padding: '10px 14px' }}>
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: mColor.bg,
                                  color: mColor.color,
                                }}
                              >
                                {ep.method}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>
                              <code>{ep.route}</code>
                            </td>
                            <td style={{ padding: '10px 14px', color: 'var(--muted)' }}>
                              <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{ep.controller}</span>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>.{ep.action}()</span>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: ep.roles.includes('AllowAnonymous')
                                    ? '#f1f5f9'
                                    : ep.roles.includes('Admin')
                                    ? '#fee2e2'
                                    : ep.roles.includes('Teacher')
                                    ? '#fef3c7'
                                    : ep.roles.includes('Support')
                                    ? '#e0e7ff'
                                    : '#ecfdf5',
                                  color: ep.roles.includes('AllowAnonymous')
                                    ? '#64748b'
                                    : ep.roles.includes('Admin')
                                    ? '#b91c1c'
                                    : ep.roles.includes('Teacher')
                                    ? '#b45309'
                                    : ep.roles.includes('Support')
                                    ? '#4338ca'
                                    : '#047857',
                                }}
                              >
                                {ep.roles}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAIManagementView;

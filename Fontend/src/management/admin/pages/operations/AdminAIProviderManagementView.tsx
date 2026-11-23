import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Plus,
  Trash2,
  Edit2,
  Play,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key,
  Shield,
  Zap,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  aiProviderService,
  type AiProviderConfig,
  type CreateAiProviderPayload,
  type UpdateAiProviderPayload,
  type TestConnectionResult,
  type AiUsageSummary,
} from '../../services/ai-provider.service';

export const AdminAIProviderManagementView: React.FC = () => {
  const [providers, setProviders] = useState<AiProviderConfig[]>([]);
  const [usageSummary, setUsageSummary] = useState<AiUsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Drawer / Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProvider, setEditingProvider] = useState<AiProviderConfig | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Testing connection state
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; result: TestConnectionResult } | null>(null);

  // Form fields
  const [formData, setFormData] = useState<{
    name: string;
    providerType: string;
    baseUrl: string;
    apiKey: string;
    defaultModel: string;
    capabilities: string[];
    isEnabled: boolean;
    priority: number;
    timeoutSeconds: number;
    maxRetries: number;
    maxTokens: number;
    temperature: number;
  }>({
    name: '',
    providerType: 'GEMINI',
    baseUrl: '',
    apiKey: '',
    defaultModel: 'gemini-1.5-flash',
    capabilities: ['chat', 'exercise', 'evaluation'],
    isEnabled: true,
    priority: 1,
    timeoutSeconds: 30,
    maxRetries: 2,
    maxTokens: 2048,
    temperature: 0.7,
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [provs, usage] = await Promise.all([
        aiProviderService.getAll(),
        aiProviderService.getUsageSummary(7).catch(() => null),
      ]);
      setProviders(provs);
      setUsageSummary(usage);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách nhà cung cấp AI.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreateModal = () => {
    setEditingProvider(null);
    setFormData({
      name: '',
      providerType: 'GEMINI',
      baseUrl: '',
      apiKey: '',
      defaultModel: 'gemini-1.5-flash',
      capabilities: ['chat', 'exercise', 'evaluation'],
      isEnabled: true,
      priority: providers.length + 1,
      timeoutSeconds: 30,
      maxRetries: 2,
      maxTokens: 2048,
      temperature: 0.7,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prov: AiProviderConfig) => {
    setEditingProvider(prov);
    setFormData({
      name: prov.name,
      providerType: prov.providerType,
      baseUrl: prov.baseUrl || '',
      apiKey: '', // Leave blank unless user wishes to rotate
      defaultModel: prov.defaultModel,
      capabilities: prov.capabilities || [],
      isEnabled: prov.isEnabled,
      priority: prov.priority,
      timeoutSeconds: prov.timeoutSeconds,
      maxRetries: prov.maxRetries,
      maxTokens: prov.maxTokens || 2048,
      temperature: prov.temperature || 0.7,
    });
    setIsModalOpen(true);
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      if (editingProvider) {
        const payload: UpdateAiProviderPayload = {
          name: formData.name,
          providerType: formData.providerType,
          baseUrl: formData.baseUrl || undefined,
          apiKey: formData.apiKey ? formData.apiKey : undefined,
          defaultModel: formData.defaultModel,
          capabilities: formData.capabilities,
          isEnabled: formData.isEnabled,
          priority: formData.priority,
          timeoutSeconds: formData.timeoutSeconds,
          maxRetries: formData.maxRetries,
          maxTokens: formData.maxTokens,
          temperature: formData.temperature,
        };
        await aiProviderService.update(editingProvider.id, payload);
        setSuccessMessage(`Đã cập nhật nhà cung cấp "${formData.name}".`);
      } else {
        if (!formData.apiKey) {
          throw new Error('API Key là bắt buộc khi tạo nhà cung cấp mới.');
        }
        const payload: CreateAiProviderPayload = {
          name: formData.name,
          providerType: formData.providerType,
          baseUrl: formData.baseUrl || undefined,
          apiKey: formData.apiKey,
          defaultModel: formData.defaultModel,
          capabilities: formData.capabilities,
          isEnabled: formData.isEnabled,
          priority: formData.priority,
          timeoutSeconds: formData.timeoutSeconds,
          maxRetries: formData.maxRetries,
          maxTokens: formData.maxTokens,
          temperature: formData.temperature,
        };
        await aiProviderService.create(payload);
        setSuccessMessage(`Đã tạo nhà cung cấp "${formData.name}".`);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi lưu cấu hình nhà cung cấp.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProvider = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp "${name}"? Thao tác này không thể hoàn tác.`)) {
      return;
    }
    try {
      await aiProviderService.delete(id);
      setSuccessMessage(`Đã xóa nhà cung cấp "${name}".`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Không thể xóa nhà cung cấp.');
    }
  };

  const handleToggleEnabled = async (id: string, current: boolean) => {
    try {
      await aiProviderService.toggleEnabled(id, !current);
      setProviders((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isEnabled: !current } : p))
      );
    } catch (err: any) {
      setError(err?.message || 'Không thể thay đổi trạng thái.');
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await aiProviderService.testConnection(id);
      setTestResult({ id, result: res });
      setProviders((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                lastHealthStatus: res.status as any,
                lastHealthMessage: res.message,
                lastCheckedAt: res.testedAt,
              }
            : p
        )
      );
    } catch (err: any) {
      setError(err?.message || 'Kiểm tra kết nối thất bại.');
    } finally {
      setTestingId(null);
    }
  };

  const handleMovePriority = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= providers.length) return;

    const newProviders = [...providers];
    const temp = newProviders[index];
    newProviders[index] = newProviders[targetIndex];
    newProviders[targetIndex] = temp;

    // Recalculate priorities
    const updatedPriorities = newProviders.map((p, i) => ({
      id: p.id,
      priority: i + 1,
    }));

    setProviders(newProviders.map((p, i) => ({ ...p, priority: i + 1 })));

    try {
      await aiProviderService.updatePriorities(updatedPriorities);
      setSuccessMessage('Đã cập nhật thứ tự ưu tiên failover.');
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi cập nhật thứ tự ưu tiên.');
      await loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return { label: 'HEALTHY', color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' };
      case 'DEGRADED':
        return { label: 'DEGRADED', color: '#d97706', bg: '#fef3c7', border: '#fde68a' };
      case 'UNHEALTHY':
        return { label: 'UNHEALTHY', color: '#dc2626', bg: '#fee2e2', border: '#fecaca' };
      default:
        return { label: 'UNCHECKED', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Policy and Failover Strategy Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '16px 20px',
          borderRadius: '12px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1e40af',
          fontSize: '13px',
          lineHeight: 1.5,
        }}
      >
        <Shield size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#2563eb' }} />
        <div>
          <strong>Quản lý Multi-Provider AI & Chiến lược Định tuyến Ưu tiên (Failover Router):</strong>
          <p style={{ margin: '4px 0 0 0', color: '#1e3a8a', fontSize: '12.5px' }}>
            Hệ thống sắp xếp các nhà cung cấp theo thứ tự Ưu tiên (Priority). Khi gọi AI Tutor, Engine tự động chọn nhà cung cấp cao nhất còn hoạt động. Nếu gặp lỗi quá tải (429), hết thời gian chờ hoặc sự cố máy chủ (5xx), Router sẽ tự động chuyển tiếp sang nhà cung cấp dự phòng kế tiếp mà không làm gián đoạn học viên.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#15803d',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#15803d' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Usage Analytics Strip */}
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
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Cpu size={24} style={{ color: '#2563eb' }} />
          <div>
            <div style={{ fontSize: '11.5px', color: '#64748b' }}>Tổng yêu cầu (7 ngày)</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              {usageSummary ? usageSummary.totalRequests.toLocaleString() : '0'}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <CheckCircle2 size={24} style={{ color: '#16a34a' }} />
          <div>
            <div style={{ fontSize: '11.5px', color: '#64748b' }}>Yêu cầu Thành công</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>
              {usageSummary ? usageSummary.successfulRequests.toLocaleString() : '0'}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Clock size={24} style={{ color: '#d97706' }} />
          <div>
            <div style={{ fontSize: '11.5px', color: '#64748b' }}>Thời gian phản hồi TB</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              {usageSummary ? `${usageSummary.averageLatencyMs} ms` : '0 ms'}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Zap size={24} style={{ color: '#9333ea' }} />
          <div>
            <div style={{ fontSize: '11.5px', color: '#64748b' }}>Tổng Tokens Tiêu thụ</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              {usageSummary ? usageSummary.totalTokens.toLocaleString() : '0'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Providers Table Container */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Danh sách Nhà Cung Cấp Đã Cấu Hình ({providers.length})
            </h3>
            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
              Khóa API được mã hóa AES-256 an toàn trong cơ sở dữ liệu và che giấu tự động trên giao diện.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={loadData}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#475569',
              }}
            >
              <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
              Làm mới
            </button>
            <button
              onClick={handleOpenCreateModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#2563eb',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#ffffff',
              }}
            >
              <Plus size={16} />
              Thêm Nhà Cung Cấp
            </button>
          </div>
        </div>

        {/* Table */}
        {isLoading && providers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            Đang tải dữ liệu nhà cung cấp AI...
          </div>
        ) : providers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            Chưa có nhà cung cấp AI nào được đăng ký. Hãy nhấn "Thêm Nhà Cung Cấp" để kích hoạt AI Tutor.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '10px 8px', width: '70px' }}>Ưu tiên</th>
                  <th style={{ padding: '10px 12px' }}>Tên & Loại</th>
                  <th style={{ padding: '10px 12px' }}>Mô hình Mặc định</th>
                  <th style={{ padding: '10px 12px' }}>Khóa API (Masked)</th>
                  <th style={{ padding: '10px 12px' }}>Trạng thái Sức khỏe</th>
                  <th style={{ padding: '10px 12px', width: '100px' }}>Kích hoạt</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', width: '180px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((prov, index) => {
                  const badge = getStatusBadge(prov.lastHealthStatus);
                  const isTestingThis = testingId === prov.id;
                  const thisTestRes = testResult?.id === prov.id ? testResult.result : null;

                  return (
                    <tr
                      key={prov.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        opacity: prov.isEnabled ? 1 : 0.6,
                        backgroundColor: !prov.isEnabled ? '#fbfcfe' : 'transparent',
                      }}
                    >
                      {/* Priority Controls */}
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              backgroundColor: '#f1f5f9',
                              fontWeight: 700,
                              fontSize: '12px',
                              color: '#1e293b',
                            }}
                          >
                            {prov.priority}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <button
                              onClick={() => handleMovePriority(index, 'up')}
                              disabled={index === 0}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: index === 0 ? 'default' : 'pointer',
                                padding: '1px',
                                color: index === 0 ? '#cbd5e1' : '#475569',
                              }}
                              title="Tăng ưu tiên"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              onClick={() => handleMovePriority(index, 'down')}
                              disabled={index === providers.length - 1}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: index === providers.length - 1 ? 'default' : 'pointer',
                                padding: '1px',
                                color: index === providers.length - 1 ? '#cbd5e1' : '#475569',
                              }}
                              title="Giảm ưu tiên"
                            >
                              <ArrowDown size={12} />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Name & Type */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{prov.name}</div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                          <span
                            style={{
                              fontSize: '10.5px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#e0e7ff',
                              color: '#3730a3',
                              fontWeight: 600,
                            }}
                          >
                            {prov.providerType}
                          </span>
                          {prov.baseUrl && (
                            <span style={{ fontSize: '11px', color: '#64748b' }} title={prov.baseUrl}>
                              {prov.baseUrl.replace(/^https?:\/\//, '').slice(0, 25)}...
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {prov.capabilities
                            ?.filter((c) => c.startsWith('feature:'))
                            .map((f) => {
                              const label =
                                f === 'feature:AI_TUTOR'
                                  ? 'Tutor'
                                  : f === 'feature:AI_LETTER_WRITING'
                                  ? 'Viết thư'
                                  : f === 'feature:AI_CONVERSATION'
                                  ? 'Hội thoại'
                                  : f.replace('feature:', '');
                              return (
                                <span
                                  key={f}
                                  style={{
                                    fontSize: '9.5px',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    backgroundColor: '#dbeafe',
                                    color: '#1e40af',
                                    fontWeight: 700,
                                  }}
                                >
                                  {label}
                                </span>
                              );
                            })}
                        </div>
                      </td>

                      {/* Default Model */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1e293b' }}>
                          {prov.defaultModel}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Timeout: {prov.timeoutSeconds}s | Retries: {prov.maxRetries}
                        </div>
                      </td>

                      {/* Masked Key */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'monospace' }}>
                          <Key size={13} style={{ color: '#94a3b8' }} />
                          <span>{prov.maskedApiKey || 'Chưa cấu hình'}</span>
                        </div>
                      </td>

                      {/* Health Status */}
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: badge.color,
                            backgroundColor: badge.bg,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.label}
                        </span>
                        {prov.lastCheckedAt && (
                          <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '3px' }}>
                            {new Date(prov.lastCheckedAt).toLocaleTimeString()}
                          </div>
                        )}
                        {thisTestRes && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: thisTestRes.isSuccess ? '#16a34a' : '#dc2626',
                              marginTop: '3px',
                              maxWidth: '180px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={thisTestRes.message}
                          >
                            {thisTestRes.isSuccess ? `OK (${thisTestRes.latencyMs}ms)` : thisTestRes.message}
                          </div>
                        )}
                      </td>

                      {/* Enabled Toggle */}
                      <td style={{ padding: '12px' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={prov.isEnabled}
                            onChange={() => handleToggleEnabled(prov.id, prov.isEnabled)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                          <span style={{ marginLeft: '6px', fontSize: '12px', color: '#475569' }}>
                            {prov.isEnabled ? 'Bật' : 'Tắt'}
                          </span>
                        </label>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => handleTestConnection(prov.id)}
                            disabled={isTestingThis}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 9px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              cursor: 'pointer',
                              fontSize: '11.5px',
                              color: '#334155',
                              fontWeight: 600,
                            }}
                            title="Kiểm tra kết nối và độ trễ"
                          >
                            <Play size={12} className={isTestingThis ? 'spin' : ''} />
                            {isTestingThis ? 'Đang test...' : 'Test'}
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(prov)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              cursor: 'pointer',
                              color: '#2563eb',
                            }}
                            title="Sửa cấu hình"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteProvider(prov.id, prov.name)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              cursor: 'pointer',
                              color: '#dc2626',
                            }}
                            title="Xóa nhà cung cấp"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer / Modal Form for Create / Edit */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 24px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                {editingProvider ? 'Cập nhật Nhà Cung Cấp AI' : 'Thêm Nhà Cung Cấp AI Mới'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProvider} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Tên Nhà Cung Cấp <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Google Gemini Pro Chính, DeepSeek V3..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Loại Giao thức <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    value={formData.providerType}
                    onChange={(e) => setFormData({ ...formData, providerType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="GEMINI">Google Gemini</option>
                    <option value="OPENAI">OpenAI</option>
                    <option value="OPENAI_COMPATIBLE">OpenAI Tương thích (DeepSeek, Groq, Ollama...)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Mô hình Mặc định <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.defaultModel}
                    onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
                    placeholder="gemini-1.5-flash, gpt-4o-mini..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              {formData.providerType === 'OPENAI_COMPATIBLE' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Base URL (API Endpoint)
                  </label>
                  <input
                    type="url"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    placeholder="https://api.deepseek.com hoặc http://localhost:11434"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  {editingProvider ? 'Khóa API Mới (Để trống nếu giữ nguyên khóa hiện tại)' : 'Khóa API (API Key)'}{' '}
                  {!editingProvider && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
                <input
                  type="password"
                  required={!editingProvider}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder={editingProvider ? `Đang dùng: ${editingProvider.maskedApiKey}` : 'Nhập API key bí mật...'}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Ưu tiên (1=Cao nhất)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Timeout (giây)
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={formData.timeoutSeconds}
                    onChange={(e) => setFormData({ ...formData, timeoutSeconds: parseInt(e.target.value) || 30 })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Số lần thử lại
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={formData.maxRetries}
                    onChange={(e) => setFormData({ ...formData, maxRetries: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Phân luồng Chức năng AI (Feature Routing)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    { tag: 'feature:AI_TUTOR', label: 'Trợ giảng AI (AI Tutor)' },
                    { tag: 'feature:AI_LETTER_WRITING', label: 'Viết thư bằng AI' },
                    { tag: 'feature:AI_CONVERSATION', label: 'Hội thoại AI' },
                  ].map((feat) => {
                    const isChecked = formData.capabilities.includes(feat.tag);
                    return (
                      <label
                        key={feat.tag}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          backgroundColor: isChecked ? '#eff6ff' : '#f8fafc',
                          border: isChecked ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: isChecked ? '#1d4ed8' : '#475569',
                          fontWeight: isChecked ? 600 : 400,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                capabilities: [...formData.capabilities, feat.tag],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                capabilities: formData.capabilities.filter((c) => c !== feat.tag),
                              });
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>{feat.label}</span>
                      </label>
                    );
                  })}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                  Nếu không chọn chức năng nào, nhà cung cấp này sẽ là provider dự phòng chung cho mọi chức năng.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="isEnabledCheckbox"
                  checked={formData.isEnabled}
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <label htmlFor="isEnabledCheckbox" style={{ fontSize: '13px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                  Kích hoạt nhà cung cấp này ngay lập tức
                </label>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
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
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSaving ? 'Đang lưu...' : editingProvider ? 'Lưu Thay Đổi' : 'Tạo Nhà Cung Cấp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAIProviderManagementView;

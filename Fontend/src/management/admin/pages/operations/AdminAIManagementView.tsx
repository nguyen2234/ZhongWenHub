import React, { useState } from 'react';
import {
  Bot,
  Shield,
  Activity,
  Sliders,
} from 'lucide-react';

interface AIServiceModel {
  id: string;
  name: string;
  role: string;
  provider: string;
  latencyMs: number;
  uptime: string;
  usagePercent: number;
  status: 'HEALTHY' | 'DEGRADED' | 'MAINTENANCE';
  description: string;
}

const INITIAL_AI_SERVICES: AIServiceModel[] = [
  {
    id: 'ai-tutor',
    name: 'AI Tutor (Trợ lý đối thoại)',
    role: 'Hội thoại tiếng Trung, giải đáp ngữ pháp và sửa lỗi ngữ cảnh',
    provider: 'DeepSeek-V3 / Qwen-2.5-72B (Self-hosted Mock)',
    latencyMs: 240,
    uptime: '99.9%',
    usagePercent: 78,
    status: 'HEALTHY',
    description: 'Xử lý trung bình 14,200 lượt hỏi đáp mỗi ngày. Tự động kiểm tra ngữ pháp HSK 1-6.',
  },
  {
    id: 'ai-live',
    name: 'AI Live (Luyện phát âm & Phản xạ)',
    role: 'Nhận diện giọng nói (ASR) và đánh giá ngữ điệu Pinyin',
    provider: 'Whisper-Large-v3 / FunASR (Mock Engine)',
    latencyMs: 180,
    uptime: '99.7%',
    usagePercent: 62,
    status: 'HEALTHY',
    description: 'Chấm điểm 4 thanh điệu tiếng Trung, phát hiện phát âm sai phụ âm đầu và vần.',
  },
  {
    id: 'ai-grading',
    name: 'AI Grading (Chấm bài tập & Đoạn văn)',
    role: 'Chấm điểm tự động bài tập viết chữ Hán và dịch câu',
    provider: 'Qwen-Max Pedagogical Fine-tuned (Mock)',
    latencyMs: 310,
    uptime: '99.8%',
    usagePercent: 44,
    status: 'HEALTHY',
    description: 'Hỗ trợ giáo viên chấm nhanh bài tập về nhà, gợi ý nhận xét song ngữ Trung - Việt.',
  },
  {
    id: 'ai-analytics',
    name: 'AI Analytics (Gợi ý lộ trình thích ứng)',
    role: 'Phân tích điểm yếu kiến thức và lập lịch ôn tập ngắt quãng (SRS)',
    provider: 'ZhongWenHub Adaptive Pedagogical Engine',
    latencyMs: 120,
    uptime: '100%',
    usagePercent: 51,
    status: 'HEALTHY',
    description: 'Cá nhân hóa danh sách từ vựng cần ôn luyện hôm nay dựa trên thuật toán SM-2 cải tiến.',
  },
];

const INCIDENT_LOGS = [
  {
    id: 'inc-1',
    time: '2026-10-27 10:14',
    service: 'AI Live (ASR)',
    event: 'Tự động kích hoạt cơ chế retry khi máy chủ phát âm phản hồi chậm > 500ms.',
    level: 'INFO',
  },
  {
    id: 'inc-2',
    time: '2026-10-26 18:30',
    service: 'AI Tutor',
    event: 'Lưu lượng truy cập giờ cao điểm đạt 85% hạn mức quota. Hệ thống phân luồng ổn định.',
    level: 'WARNING',
  },
  {
    id: 'inc-3',
    time: '2026-10-25 03:00',
    service: 'AI Grading',
    event: 'Cập nhật trọng số chấm điểm HSK 3. Hoàn tất kiểm thử nội bộ.',
    level: 'RESOLVED',
  },
];

export const AdminAIManagementView: React.FC = () => {
  const [quotaThreshold, setQuotaThreshold] = useState<number>(85);
  const [services] = useState<AIServiceModel[]>(INITIAL_AI_SERVICES);
  const [serviceToggles, setServiceToggles] = useState<Record<string, boolean>>({
    'ai-tutor': true,
    'ai-live': true,
    'ai-grading': true,
    'ai-analytics': true,
  });

  const handleToggle = (id: string) => {
    setServiceToggles((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
          <strong>Chính sách Bảo mật & Vận hành AI:</strong> Mã khoá API (API keys) và thông tin xác thực nhà cung cấp AI được bảo vệ nghiêm ngặt ở tầng hạ tầng Backend Spring Boot / Gateway. Frontend tuyệt đối không lưu trữ khóa bí mật trong mã nguồn hoặc trình duyệt. Giao diện này hiển thị trạng thái giám sát mô phỏng.
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
          const isEnabled = serviceToggles[srv.id] ?? true;
          const isOverQuota = srv.usagePercent >= quotaThreshold;

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
                opacity: isEnabled ? 1 : 0.65,
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
                      backgroundColor: isEnabled ? 'var(--primary-light)' : 'var(--secondary)',
                      color: isEnabled ? 'var(--primary)' : 'var(--muted)',
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

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => handleToggle(srv.id)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontWeight: 600, color: isEnabled ? 'var(--foreground)' : 'var(--muted)' }}>
                    {isEnabled ? 'Bật' : 'Tắt'}
                  </span>
                </label>
              </div>

              {/* Description */}
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
                {srv.description}
              </p>

              {/* Operational Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  padding: '10px 12px',
                  backgroundColor: 'var(--background)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '11.5px',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ color: 'var(--muted)' }}>Độ trễ</div>
                  <strong style={{ color: 'var(--foreground)' }}>{srv.latencyMs} ms</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)' }}>Khả dụng</div>
                  <strong style={{ color: '#16a34a' }}>{srv.uptime}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)' }}>Tiêu thụ</div>
                  <strong style={{ color: isOverQuota ? '#be123c' : 'var(--foreground)' }}>
                    {srv.usagePercent}%
                  </strong>
                </div>
              </div>

              {/* Quota Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
                  <span>Tỉ lệ sử dụng quota</span>
                  <span>{srv.usagePercent}% / {quotaThreshold}%</span>
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
                      width: `${Math.min(100, srv.usagePercent)}%`,
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
          <Activity size={16} /> Nhật ký vận hành dịch vụ AI (Mô phỏng 72 giờ qua)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {INCIDENT_LOGS.map((inc) => (
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
          ))}
        </div>
      </div>
    </div>
  );
};
export default AdminAIManagementView;

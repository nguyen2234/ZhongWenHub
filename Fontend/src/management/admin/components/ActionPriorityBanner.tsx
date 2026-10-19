import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  LifeBuoy,
  Bot,
  ArrowRight,
  Info,
} from 'lucide-react';

export interface ActionPriorityBannerProps {
  pendingModerationCount?: number;
  urgentTicketsCount?: number;
  aiAlertCount?: number;
}

export const ActionPriorityBanner: React.FC<ActionPriorityBannerProps> = ({
  pendingModerationCount = 14,
  urgentTicketsCount = 3,
  aiAlertCount = 1,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* 1. Clear Demo / Simulated Operational Notice (Rule 8: Không hiển thị mock data như dữ liệu sản xuất) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border-strong)',
          fontSize: '12px',
          color: 'var(--muted)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
            }}
          >
            <Info size={13} />
            Mô phỏng vận hành
          </span>
          <span>
            Các số liệu KPI, tiến độ học liệu và hoạt động người dùng hiển thị ở trạng thái <strong>Demo</strong> phục vụ kiểm thử giao diện FE-10.
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
          Hệ thống sẵn sàng kết nối API Backend
        </span>
      </div>

      {/* 2. Priority Action Cards (Việc cần xử lý ngay) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        {/* Card 1: Pending Moderation */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-xl)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            transition: 'border-color 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(230, 0, 18, 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--foreground)' }}>
                  Duyệt học liệu
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                  }}
                >
                  {pendingModerationCount} chờ duyệt
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                8 bài giảng số & 6 bài tập từ giáo viên
              </div>
            </div>
          </div>

          <Link
            to="/management/admin/moderation"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              flexShrink: 0,
              transition: 'background-color 0.15s ease',
            }}
          >
            <span>Duyệt</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Card 2: Urgent Tickets SLA */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-xl)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(217, 119, 6, 0.12)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <LifeBuoy size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--foreground)' }}>
                  Hỗ trợ khẩn cấp
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: '#d97706',
                    color: '#ffffff',
                  }}
                >
                  {urgentTicketsCount} vé SLA
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                Phản hồi quá hạn trung bình 24 phút
              </div>
            </div>
          </div>

          <Link
            to="/management/admin/support-requests"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(217, 119, 6, 0.1)',
              color: '#b45309',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <span>Xử lý</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Card 3: AI Engine Health */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-xl)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Bot size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--foreground)' }}>
                  Trợ lý AI Tutor
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                  }}
                >
                  Ổn định (99.8%)
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                {aiAlertCount} cảnh báo quota đạt ngưỡng 82%
              </div>
            </div>
          </div>

          <Link
            to="/management/admin/ai-management"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(124, 58, 237, 0.1)',
              color: '#7c3aed',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <span>Giám sát</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ActionPriorityBanner;

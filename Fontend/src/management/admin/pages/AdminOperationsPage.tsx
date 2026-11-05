import React from 'react';
import { PageHeader } from '../../shared/components';
import { AdminAIManagementView } from './operations/AdminAIManagementView';
import { AdminAnalyticsView } from './operations/AdminAnalyticsView';
import { AdminSupportRequestsView } from './operations/AdminSupportRequestsView';
import { AdminSystemSettingsView } from './operations/AdminSystemSettingsView';
import './admin-operations.css';

export type PageKind = 'ai-management' | 'analytics' | 'support-requests' | 'settings';

export interface AdminOperationsPageProps {
  kind: PageKind;
}

export const AdminOperationsPage: React.FC<AdminOperationsPageProps> = ({ kind }) => {
  const titles: Record<PageKind, { title: string; subtitle: string }> = {
    'ai-management': {
      title: 'Giám sát Vận hành Trí tuệ Nhân tạo (AI Operations)',
      subtitle: 'Theo dõi chỉ số hiệu năng, thời gian phản hồi, hạn mức quota và nhật ký vận hành các dịch vụ AI.',
    },
    analytics: {
      title: 'Báo cáo & Phân tích Đào tạo (Platform Analytics)',
      subtitle: 'Tổng hợp chỉ số học tập, phân bố học viên theo cấp độ HSK, tỷ lệ hoàn thành và thời lượng học tích lũy.',
    },
    'support-requests': {
      title: 'Giám sát Xử lý Yêu cầu Hỗ trợ (Support Oversight)',
      subtitle: 'Theo dõi tiến độ giải quyết ticket toàn sàn, phân bổ nhân sự và xử lý khiếu nại vượt cấp (SLA Escalations).',
    },
    settings: {
      title: 'Cấu hình Hệ thống & Vận hành (System Settings)',
      subtitle: 'Thiết lập định danh nền tảng, bộ nhận diện thương hiệu, chính sách phiên đăng nhập và chế độ bảo trì.',
    },
  };

  const { title, subtitle } = titles[kind] || {
    title: 'Vận hành Quản trị',
    subtitle: 'Khu vực quản lý và giám sát hoạt động hệ thống ZhongWenHub.',
  };

  return (
    <div className="ao-page">
      <PageHeader title={title} subtitle={subtitle} />

      {kind === 'ai-management' && <AdminAIManagementView />}
      {kind === 'analytics' && <AdminAnalyticsView />}
      {kind === 'support-requests' && <AdminSupportRequestsView />}
      {kind === 'settings' && <AdminSystemSettingsView />}
    </div>
  );
};

export default AdminOperationsPage;

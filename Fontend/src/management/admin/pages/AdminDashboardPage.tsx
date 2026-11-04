import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '../../shared/components';
import type { DateRangeOption, RecentUser, StatMetricItem } from '../types/dashboard.types';
import { getAdminDashboardData } from '../data/mockDashboardData';
import {
  ActionPriorityBanner,
  DashboardDateRangeSelect,
  DashboardMetricsGrid,
  LearningActivityChart,
  HskDistributionCard,
  RecentUsersCard,
  SupportOverviewCard,
  ContentScaleCard,
  RecentActivityFeed,
} from '../components';
import '../components/dashboard.css';

import { contentModerationService } from '../../content-manager/services/content-moderation.service';
import { supportTicketService } from '../../support/services/support-ticket.service';
import { adminDashboardService, type AdminDashboardStats } from '../services/admin-dashboard.service';

export const AdminDashboardPage: React.FC = () => {
  const [range, setRange] = useState<DateRangeOption>('30d');
  const [realStats, setRealStats] = useState<AdminDashboardStats | null>(null);
  const [realRecentUsers, setRealRecentUsers] = useState<RecentUser[] | null>(null);

  useEffect(() => {
    adminDashboardService.fetchDashboardStats().then((stats) => {
      if (stats) setRealStats(stats);
    });
    adminDashboardService.fetchRecentUsers(5).then((users) => {
      if (users && users.length > 0) setRealRecentUsers(users);
    });
  }, []);

  const dashboardData = useMemo(() => {
    return getAdminDashboardData(range);
  }, [range]);

  // Compute 6 Real SQL Server KPIs when realStats are available
  const displayMetrics: StatMetricItem[] = useMemo(() => {
    if (!realStats) return dashboardData.metrics;

    return [
      {
        id: 'total-students',
        title: 'Tổng số học viên',
        currentTotal: realStats.totalStudents,
        totalLabel: 'Học viên trong hệ thống',
        deltaInRange: {
          value: realStats.newUsers30d,
          percentageText: `+${realStats.newUsers30d}`,
          trend: 'positive',
          timeContext: 'mới đăng ký trong 30 ngày',
        },
        deltaLabel: 'Học viên mới',
        iconType: 'learners',
      },
      {
        id: 'total-teachers',
        title: 'Tổng số giáo viên',
        currentTotal: realStats.totalTeachers,
        totalLabel: 'Giảng viên chuyên môn',
        deltaInRange: {
          value: 0,
          percentageText: `${realStats.totalTeachers} active`,
          trend: 'neutral',
          timeContext: 'đội ngũ giảng viên hiện hành',
        },
        deltaLabel: 'Giáo viên',
        iconType: 'teachers',
      },
      {
        id: 'total-staff',
        title: 'Tổng số nhân viên',
        currentTotal: realStats.totalStaff,
        totalLabel: 'Admin, Content & Support',
        deltaInRange: {
          value: realStats.totalStaff,
          percentageText: `${realStats.totalStaff} tài khoản`,
          trend: 'neutral',
          timeContext: 'nhân sự vận hành hệ thống',
        },
        deltaLabel: 'Nhân viên vận hành',
        iconType: 'staff',
      },
      {
        id: 'total-courses',
        title: 'Tổng số khóa học',
        currentTotal: realStats.totalCourses,
        totalLabel: 'Lộ trình chuẩn HSK 1 - 6',
        deltaInRange: {
          value: 6,
          percentageText: 'HSK 1 - HSK 6',
          trend: 'positive',
          timeContext: 'chương trình đào tạo chính quy',
        },
        deltaLabel: 'Khóa học',
        iconType: 'lessons',
      },
      {
        id: 'total-classes',
        title: 'Tổng số lớp học',
        currentTotal: realStats.totalClasses,
        totalLabel: 'Lớp học đang mở',
        deltaInRange: {
          value: realStats.totalClasses,
          percentageText: `${realStats.totalClasses} lớp`,
          trend: 'neutral',
          timeContext: 'lớp học trực tuyến',
        },
        deltaLabel: 'Lớp học',
        iconType: 'classes',
      },
      {
        id: 'pending-tickets',
        title: 'Hỗ trợ chưa xử lý',
        currentTotal: realStats.pendingSupportTickets,
        totalLabel: 'Ticket cần phản hồi',
        deltaInRange: {
          value: realStats.pendingSupportTickets,
          percentageText: realStats.pendingSupportTickets === 0 ? '0 ticket' : `${realStats.pendingSupportTickets} chờ`,
          trend: realStats.pendingSupportTickets === 0 ? 'positive' : 'negative',
          timeContext: 'yêu cầu từ học viên',
        },
        deltaLabel: 'Hỗ trợ',
        iconType: 'support',
      },
    ];
  }, [realStats, dashboardData.metrics]);

  const recentUsers = useMemo(() => {
    return realRecentUsers || dashboardData.recentUsers;
  }, [realRecentUsers, dashboardData.recentUsers]);

  const pendingModerationCount = useMemo(() => {
    return contentModerationService.getModerationItems({ status: 'PENDING_REVIEW' }).length;
  }, []);

  const urgentTicketsCount = useMemo(() => {
    return realStats?.pendingSupportTickets ?? supportTicketService.getMetrics().urgent;
  }, [realStats]);

  return (
    <div className="admin-dashboard">
      <PageHeader
        title="Dashboard Quản trị"
        subtitle="Trung tâm chỉ huy vận hành đào tạo, kiểm duyệt học liệu và giám sát hệ thống ZhongWenHub."
        actions={
          <DashboardDateRangeSelect
            selectedRange={range}
            onChange={(newRange) => setRange(newRange)}
          />
        }
      />

      {/* Row 1: Priority Queue & Operational Notice (Việc cần xử lý ngay) */}
      <ActionPriorityBanner
        pendingModerationCount={pendingModerationCount}
        urgentTicketsCount={urgentTicketsCount}
        aiAlertCount={0}
      />

      {/* Row 2: 6 Key Real SQL Server KPIs */}
      <DashboardMetricsGrid metrics={displayMetrics} />

      {/* Row 3: Analytics Row (65% Learning Activity + 35% HSK Distribution) */}
      <div className="dashboard-analytics-row">
        <LearningActivityChart
          data={dashboardData.learningActivity}
          rangeLabel={dashboardData.rangeLabel}
        />
        <HskDistributionCard distribution={dashboardData.hskDistribution} />
      </div>

      {/* Row 4: Academic Scale & System Operations Row */}
      <div className="dashboard-operations-row">
        {/* Left Column: Academic Content Scale & Recent Users */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <ContentScaleCard
            contentScale={dashboardData.contentScale}
            rangeLabel={dashboardData.rangeLabel}
          />
          <RecentUsersCard users={recentUsers} />
        </div>

        {/* Right Column: Support SLA Overview & Operations Activity Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <SupportOverviewCard overview={dashboardData.supportOverview} />
          <RecentActivityFeed activities={dashboardData.recentActivities} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

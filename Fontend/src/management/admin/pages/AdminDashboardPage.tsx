import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../shared/components';
import type { DateRangeOption } from '../types/dashboard.types';
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

export const AdminDashboardPage: React.FC = () => {
  const [range, setRange] = useState<DateRangeOption>('30d');

  const dashboardData = useMemo(() => {
    return getAdminDashboardData(range);
  }, [range]);

  const pendingModerationCount = useMemo(() => {
    return contentModerationService.getModerationItems({ status: 'PENDING_REVIEW' }).length;
  }, []);

  const urgentTicketsCount = useMemo(() => {
    return supportTicketService.getMetrics().urgent;
  }, []);

  return (
    <div className="admin-dashboard">
      <PageHeader
        title="Dashboard Quản trị V2"
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
        aiAlertCount={1}
      />

      {/* Row 2: 4 Key Executive Metrics (KPIs) */}
      <DashboardMetricsGrid metrics={dashboardData.metrics} />

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
          <RecentUsersCard users={dashboardData.recentUsers} />
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

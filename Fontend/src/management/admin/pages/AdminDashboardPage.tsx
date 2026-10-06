import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../shared/components';
import type { DateRangeOption } from '../types/dashboard.types';
import { getAdminDashboardData } from '../data/mockDashboardData';
import {
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

export const AdminDashboardPage: React.FC = () => {
  const [range, setRange] = useState<DateRangeOption>('30d');

  const dashboardData = useMemo(() => {
    return getAdminDashboardData(range);
  }, [range]);

  return (
    <div className="admin-dashboard">
      <PageHeader
        title="Dashboard Quản trị"
        subtitle="Tổng quan vận hành đào tạo, chỉ số học viên và hoạt động hệ thống ZhongWenHub."
        actions={
          <DashboardDateRangeSelect
            selectedRange={range}
            onChange={(newRange) => setRange(newRange)}
          />
        }
      />

      {/* Row 1: 4 Key Executive Metrics */}
      <DashboardMetricsGrid metrics={dashboardData.metrics} />

      {/* Row 2: Analytics Row (65% Learning Activity + 35% HSK Distribution) */}
      <div className="dashboard-analytics-row">
        <LearningActivityChart
          data={dashboardData.learningActivity}
          rangeLabel={dashboardData.rangeLabel}
        />
        <HskDistributionCard distribution={dashboardData.hskDistribution} />
      </div>

      {/* Row 3: Operations & Scale Row */}
      <div className="dashboard-operations-row">
        {/* Left Column: Recent Users & Academic Content Scale */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <RecentUsersCard users={dashboardData.recentUsers} />
          <ContentScaleCard
            contentScale={dashboardData.contentScale}
            rangeLabel={dashboardData.rangeLabel}
          />
        </div>

        {/* Right Column: Support SLA Overview & Recent Activity Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <SupportOverviewCard overview={dashboardData.supportOverview} />
          <RecentActivityFeed activities={dashboardData.recentActivities} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

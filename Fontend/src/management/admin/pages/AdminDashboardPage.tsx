import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '../../shared/components';
import type { DateRangeOption, RecentUser, StatMetricItem } from '../types/dashboard.types';
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
import { adminDashboardService, type AdminDashboardStats } from '../services/admin-dashboard.service';

export const AdminDashboardPage: React.FC = () => {
  const [range, setRange] = useState<DateRangeOption>('30d');
  const [realStats, setRealStats] = useState<AdminDashboardStats | null>(null);
  const [realRecentUsers, setRealRecentUsers] = useState<RecentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      adminDashboardService.fetchDashboardStats(),
      adminDashboardService.fetchRecentUsers(5),
    ]).then(([stats, users]) => {
      if (stats) setRealStats(stats);
      if (users) setRealRecentUsers(users);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  // Compute 6 Real SQL Server KPIs
  const displayMetrics: StatMetricItem[] = useMemo(() => {
    return [
      {
        id: 'total-students',
        title: 'Tổng số học viên',
        currentTotal: realStats ? realStats.totalStudents : (isLoading ? '...' : 0),
        totalLabel: 'Học viên trong hệ thống',
        deltaInRange: {
          value: realStats?.newUsers30d ?? 0,
          percentageText: realStats ? `+${realStats.newUsers30d}` : '+0',
          trend: 'positive',
          timeContext: 'mới đăng ký trong 30 ngày',
        },
        deltaLabel: 'Học viên mới',
        iconType: 'learners',
      },
      {
        id: 'total-teachers',
        title: 'Tổng số giáo viên',
        currentTotal: realStats ? realStats.totalTeachers : (isLoading ? '...' : 0),
        totalLabel: 'Giảng viên chuyên môn',
        deltaInRange: {
          value: 0,
          percentageText: realStats ? `${realStats.totalTeachers} active` : '0 active',
          trend: 'neutral',
          timeContext: 'đội ngũ giảng viên hiện hành',
        },
        deltaLabel: 'Giáo viên',
        iconType: 'teachers',
      },
      {
        id: 'total-staff',
        title: 'Tổng số nhân viên',
        currentTotal: realStats ? realStats.totalStaff : (isLoading ? '...' : 0),
        totalLabel: 'Admin, Content & Support',
        deltaInRange: {
          value: realStats?.totalStaff ?? 0,
          percentageText: realStats ? `${realStats.totalStaff} tài khoản` : '0 tài khoản',
          trend: 'neutral',
          timeContext: 'nhân sự vận hành hệ thống',
        },
        deltaLabel: 'Nhân viên vận hành',
        iconType: 'staff',
      },
      {
        id: 'total-courses',
        title: 'Tổng số khóa học',
        currentTotal: realStats?.totalCourses ?? 'Chưa triển khai',
        totalLabel: 'Lộ trình chuẩn HSK 1 - 6',
        deltaInRange: {
          value: 0,
          percentageText: realStats?.totalCourses != null ? `${realStats.totalCourses} khóa` : 'Chưa triển khai',
          trend: realStats?.totalCourses != null ? 'positive' : 'neutral',
          timeContext: realStats?.totalCourses != null ? 'chương trình chính quy' : 'Chưa có bảng dữ liệu',
        },
        deltaLabel: 'Khóa học',
        iconType: 'lessons',
      },
      {
        id: 'total-classes',
        title: 'Tổng số lớp học',
        currentTotal: realStats?.totalClasses ?? 'Chưa triển khai',
        totalLabel: 'Lớp học đang mở',
        deltaInRange: {
          value: 0,
          percentageText: 'Chưa triển khai',
          trend: 'neutral',
          timeContext: 'Dành cho Giai đoạn 3 (Teacher)',
        },
        deltaLabel: 'Lớp học',
        iconType: 'classes',
      },
      {
        id: 'pending-tickets',
        title: 'Hỗ trợ chưa xử lý',
        currentTotal: realStats?.pendingSupportTickets ?? 'Chưa triển khai',
        totalLabel: 'Ticket cần phản hồi',
        deltaInRange: {
          value: 0,
          percentageText: 'Chưa triển khai',
          trend: 'neutral',
          timeContext: 'Dành cho Giai đoạn 4 (Support)',
        },
        deltaLabel: 'Hỗ trợ',
        iconType: 'support',
      },
    ];
  }, [realStats, isLoading]);

  const pendingModerationCount = useMemo(() => {
    return contentModerationService.getModerationItems({ status: 'PENDING_REVIEW' }).length;
  }, []);

  const urgentTicketsCount = realStats?.pendingSupportTickets ?? 0;

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

      {/* Row 3: Analytics Row (Learning Activity + Role / HSK Distribution) */}
      <div className="dashboard-analytics-row">
        <LearningActivityChart
          data={[]}
          rangeLabel={range}
        />
        <HskDistributionCard distribution={[
          {
            levelId: 'students',
            label: 'Học viên',
            learnerCount: realStats?.totalStudents ?? 0,
            percentage: 100,
            colorVar: '#3b82f6',
            stageNote: 'Học tập',
          },
          {
            levelId: 'teachers',
            label: 'Giáo viên',
            learnerCount: realStats?.totalTeachers ?? 0,
            percentage: 0,
            colorVar: '#10b981',
            stageNote: 'Giảng dạy',
          },
          {
            levelId: 'staff',
            label: 'Nhân sự vận hành',
            learnerCount: realStats?.totalStaff ?? 0,
            percentage: 0,
            colorVar: '#f59e0b',
            stageNote: 'Quản trị',
          },
        ]} />
      </div>

      {/* Row 4: Operations Row */}
      <div className="dashboard-operations-row">
        {/* Left Column: Recent Users */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <ContentScaleCard
            contentScale={{
              vocabulary: { key: 'vocab', label: 'Từ vựng', totalCount: 0, addedInRange: 0, unit: 'từ' },
              grammar: { key: 'grammar', label: 'Ngữ pháp', totalCount: 0, addedInRange: 0, unit: 'điểm' },
              characters: { key: 'chars', label: 'Chữ Hán', totalCount: 0, addedInRange: 0, unit: 'chữ' },
              lessons: { key: 'lessons', label: 'Bài học', totalCount: 0, addedInRange: 0, unit: 'bài' },
              exercises: { key: 'exercises', label: 'Bài tập', totalCount: 0, addedInRange: 0, unit: 'câu' },
            }}
            rangeLabel={range}
          />
          <RecentUsersCard users={realRecentUsers} />
        </div>

        {/* Right Column: Support SLA Overview & Operations Activity Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <SupportOverviewCard overview={{
            openCount: 0,
            pendingCount: 0,
            urgentCount: 0,
            avgResponseTime: '—',
            resolvedRate: 100,
            urgentTickets: [],
          }} />
          <RecentActivityFeed activities={[]} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

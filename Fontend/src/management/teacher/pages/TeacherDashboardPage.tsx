import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { curriculumService } from '../../admin/content/services/curriculum.service';
import { hskRepositoryService } from '../../admin/content/services/hsk-repository.service';
import type { Course, HskLevel } from '../../admin/content/types';
import { PageHeader } from '../../shared/components';
import {
  ActiveClassesSnapshot,
  ClassFormDrawer,
  PendingSubmissionsQueue,
  RecentActivityList,
  TeacherQuickActions,
  TeacherStatGrid,
  UpcomingSessionsCard,
} from '../components';
import { teacherPortalService } from '../services';
import type { CreateTeachingClassDTO, UpdateTeachingClassDTO } from '../types';
import type { TeacherDashboardDTO } from '../types/dashboard.types';

export const TeacherDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [dashboardData, setDashboardData] = useState<TeacherDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [hskLevels, setHskLevels] = useState<HskLevel[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Load dashboard data from service abstraction
  const loadDashboardData = useCallback(() => {
    try {
      setLoading(true);
      const data = teacherPortalService.getDashboard();
      const levels = hskRepositoryService.getLevels();
      const courseList = curriculumService.getCourses();

      setDashboardData(data);
      setHskLevels(levels);
      setCourses(courseList);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Create Class
  const handleCreateClass = async (dto: CreateTeachingClassDTO | UpdateTeachingClassDTO) => {
    teacherPortalService.createClass(dto as CreateTeachingClassDTO);
    loadDashboardData();
  };

  if (loading || !dashboardData) {
    return (
      <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--muted)' }}>
        Đang tải dữ liệu Teacher Dashboard...
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Dashboard Giảng Dạy"
        subtitle={`Xin chào, ${dashboardData.teacherName} (${dashboardData.teacherId}) • Quản lý lớp học và lịch trình giảng dạy.`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              type="button"
              onClick={loadDashboardData}
              className="ds-btn ds-btn-outline ds-btn-sm"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={14} /> Làm mới
            </button>
            <button
              type="button"
              onClick={() => setIsCreateDrawerOpen(true)}
              className="ds-btn ds-btn-primary ds-btn-sm"
              style={{ gap: '6px' }}
            >
              <Plus size={16} /> Tạo Lớp Mới
            </button>
          </div>
        }
      />

      {/* 4 Thẻ KPI Metrics */}
      <TeacherStatGrid
        metrics={dashboardData.metrics}
        onActiveClassesClick={() => navigate('/management/teacher/classes')}
        onPendingSubmissionsClick={() => navigate('/management/teacher/classes')}
      />

      {/* Cấu trúc chia 7:5 theo Option A (Command Deck & Split Workspace) */}
      <div className="teacher-dashboard-split">
        {/* CỘT TRÁI (7 PHẦN): LỊCH DẠY & LỚP ĐANG HOẠT ĐỘNG */}
        <div>
          {/* Buổi dạy sắp diễn ra */}
          <UpcomingSessionsCard
            sessions={dashboardData.upcomingSessions}
            onViewAllClasses={() => navigate('/management/teacher/classes')}
          />

          {/* Lớp học đang hoạt động */}
          <ActiveClassesSnapshot classes={dashboardData.activeClasses} />
        </div>

        {/* CỘT PHẢI (5 PHẦN): HÀNG ĐỢI BÀI TẬP, PHÍM TẮT & NHẬT KÝ */}
        <div>
          {/* Hàng đợi bài nộp cần chấm (Demo-Only) */}
          <PendingSubmissionsQueue submissions={dashboardData.pendingSubmissions} />

          {/* Phím tắt thao tác nhanh */}
          <TeacherQuickActions
            actions={dashboardData.quickActions}
            onCreateClassClick={() => setIsCreateDrawerOpen(true)}
          />

          {/* Nhật ký hoạt động gần đây */}
          <RecentActivityList activities={dashboardData.recentActivities} />
        </div>
      </div>

      {/* Drawer Tạo Lớp Học Mới */}
      <ClassFormDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        onSubmit={handleCreateClass}
        hskLevels={hskLevels}
        courses={courses}
      />
    </div>
  );
};

export default TeacherDashboardPage;

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Info,
  Users,
  Calendar,
  CheckSquare,
  BarChart3,
  ArrowLeft,
} from 'lucide-react';
import { curriculumService } from '../../admin/content/services/curriculum.service';
import { hskRepositoryService } from '../../admin/content/services/hsk-repository.service';
import type { Course, HskLevel } from '../../admin/content/types';
import { ConfirmDialog } from '../../shared/components';
import {
  ClassAssignmentsPlaceholderTab,
  ClassDetailHeader,
  ClassFormDrawer,
  ClassOverviewTab,
  ClassPerformancePlaceholderTab,
  ClassScheduleTab,
  ClassStudentsTab,
} from '../components';
import { teacherPortalService } from '../services';
import type {
  ClassDetailDTO,
  ClassMemberViewDTO,
  CreateTeachingClassDTO,
  UpdateTeachingClassDTO,
} from '../types';

type ActiveTab = 'overview' | 'students' | 'schedule' | 'assignments' | 'performance';

export const TeacherClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Data State
  const [detail, setDetail] = useState<ClassDetailDTO | null>(null);
  const [members, setMembers] = useState<ClassMemberViewDTO[]>([]);
  const [hskLevels, setHskLevels] = useState<HskLevel[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog & Drawer
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

  const loadClassDetail = useCallback(() => {
    if (!classId) return;
    setLoading(true);
    try {
      const data = teacherPortalService.getClassById(classId);
      if (data) {
        setDetail(data);
        const memberList = teacherPortalService.getClassMembers(classId);
        setMembers(memberList);
      } else {
        setDetail(null);
      }
      setHskLevels(hskRepositoryService.getLevels());
      setCourses(curriculumService.getCourses());
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadClassDetail();
  }, [loadClassDetail]);

  const handleUpdateClass = async (dto: CreateTeachingClassDTO | UpdateTeachingClassDTO) => {
    if (!classId) return;
    teacherPortalService.updateClass(classId, dto as UpdateTeachingClassDTO);
    loadClassDetail();
  };

  const handleConfirmArchive = () => {
    if (!classId) return;
    teacherPortalService.archiveClass(classId);
    setIsArchiveDialogOpen(false);
    navigate('/management/teacher/classes');
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--muted)' }}>
        Đang tải thông tin lớp học...
      </div>
    );
  }

  if (!detail) {
    return (
      <div
        style={{
          padding: 'var(--space-12)',
          textAlign: 'center',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: '8px' }}>
          Không tìm thấy lớp học
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', marginBottom: 'var(--space-4)' }}>
          Lớp học này không tồn tại hoặc bạn không có quyền phụ trách giảng dạy.
        </p>
        <button
          type="button"
          onClick={() => navigate('/management/teacher/classes')}
          className="ds-btn ds-btn-primary ds-btn-sm"
          style={{ gap: '6px' }}
        >
          <ArrowLeft size={14} /> Quay lại danh sách lớp
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Class Detail Header */}
      <ClassDetailHeader
        detail={detail}
        onEdit={() => setIsEditDrawerOpen(true)}
        onArchive={() => setIsArchiveDialogOpen(true)}
      />

      {/* 5 Tabs Navigation */}
      <div className="tp-tabs-nav" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          className={`tp-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <Info size={16} /> Tổng Quan
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'students'}
          onClick={() => setActiveTab('students')}
          className={`tp-tab-item ${activeTab === 'students' ? 'active' : ''}`}
        >
          <Users size={16} /> Học Viên ({detail.derivedEnrollmentCount})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'schedule'}
          onClick={() => setActiveTab('schedule')}
          className={`tp-tab-item ${activeTab === 'schedule' ? 'active' : ''}`}
        >
          <Calendar size={16} /> Lịch Dạy ({detail.schedules.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'assignments'}
          onClick={() => setActiveTab('assignments')}
          className={`tp-tab-item ${activeTab === 'assignments' ? 'active' : ''}`}
        >
          <CheckSquare size={16} /> Bài Tập (Phase 2)
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'performance'}
          onClick={() => setActiveTab('performance')}
          className={`tp-tab-item ${activeTab === 'performance' ? 'active' : ''}`}
        >
          <BarChart3 size={16} /> Hiệu Suất (Phase 2)
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && <ClassOverviewTab detail={detail} />}
      {activeTab === 'students' && <ClassStudentsTab members={members} />}
      {activeTab === 'schedule' && <ClassScheduleTab schedules={detail.schedules} />}
      {activeTab === 'assignments' && <ClassAssignmentsPlaceholderTab />}
      {activeTab === 'performance' && <ClassPerformancePlaceholderTab />}

      {/* Edit Drawer */}
      <ClassFormDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        onSubmit={handleUpdateClass}
        editingClass={detail.classInfo}
        hskLevels={hskLevels}
        courses={courses}
      />

      {/* Confirm Archive Dialog */}
      <ConfirmDialog
        isOpen={isArchiveDialogOpen}
        title="Xác nhận lưu trữ lớp học"
        message={`Bạn có chắc chắn muốn chuyển lớp "${detail.classInfo.name}" (${detail.classInfo.code}) vào trạng thái Lưu trữ (Archived)? Lớp học sẽ được đóng và ẩn khỏi danh sách lớp đang dạy.`}
        confirmLabel="Lưu trữ lớp"
        cancelLabel="Hủy bỏ"
        isDestructive={true}
        onConfirm={handleConfirmArchive}
        onCancel={() => setIsArchiveDialogOpen(false)}
      />
    </div>
  );
};

export default TeacherClassDetailPage;

import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, AlertCircle, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { studentHomeworkService } from '../services/student-homework.service';
import { studentAttemptService } from '../services/student-attempt.service';
import { getCurrentStudentIdentity } from '../../auth/services/student-identity.adapter';
import type { StudentHomeworkSummaryDTO, StudentAssignmentAttempt } from '../types/student-homework.types';
import { HomeworkFilterTabs, type HomeworkFilterStatus } from '../components/list/HomeworkFilterTabs';
import { HomeworkCard } from '../components/list/HomeworkCard';

export const StudentHomeworkListPage: React.FC = () => {
  const currentStudent = getCurrentStudentIdentity();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<StudentHomeworkSummaryDTO[]>([]);
  const [attempts, setAttempts] = useState<StudentAssignmentAttempt[]>([]);

  // Filter state
  const [currentTab, setCurrentTab] = useState<HomeworkFilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHsk, setSelectedHsk] = useState<string>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'dueSoon' | 'dueLate'>('dueSoon');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [homeworkList, studentAttempts] = await Promise.all([
        studentHomeworkService.getMyAssignments(currentStudent.id),
        studentAttemptService.getAttemptsForStudent(currentStudent.id),
      ]);
      setAssignments(homeworkList);
      setAttempts(studentAttempts);
    } catch (err: any) {
      console.error('[StudentHomeworkListPage] Failed to load homework data:', err);
      setError(err?.message || 'Không thể tải danh sách bài tập. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map of active attempts and submitted attempts by assignmentId
  const { activeAttemptMap, submittedMap } = useMemo(() => {
    const activeMap: Record<string, string> = {};
    const subMap: Record<string, boolean> = {};

    attempts.forEach((att) => {
      if (att.status === 'IN_PROGRESS') {
        activeMap[att.assignmentId] = att.id;
      }
      if (att.status === 'SUBMITTED' || att.status === 'GRADED') {
        subMap[att.assignmentId] = true;
      }
    });

    return { activeAttemptMap: activeMap, submittedMap: subMap };
  }, [attempts]);

  // Compute status tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<HomeworkFilterStatus, number> = {
      ALL: assignments.length,
      TODO: 0,
      IN_PROGRESS: 0,
      SUBMITTED: 0,
      OVERDUE: 0,
    };

    assignments.forEach((hw) => {
      const hasActive = Boolean(activeAttemptMap[hw.assignmentId]);
      const isSub = Boolean(submittedMap[hw.assignmentId]);

      if (hasActive) {
        counts.IN_PROGRESS += 1;
      } else if (isSub) {
        counts.SUBMITTED += 1;
      } else if (hw.isOverdue) {
        counts.OVERDUE += 1;
      } else {
        counts.TODO += 1;
      }
    });

    return counts;
  }, [assignments, activeAttemptMap, submittedMap]);

  // Unique classes for filter
  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    assignments.forEach((hw) => {
      if (hw.classId && hw.className) {
        map.set(hw.classId, hw.className);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [assignments]);

  // Filter & sort assignments
  const filteredAssignments = useMemo(() => {
    return assignments
      .filter((hw) => {
        const hasActive = Boolean(activeAttemptMap[hw.assignmentId]);
        const isSub = Boolean(submittedMap[hw.assignmentId]);

        // Status tab filter
        if (currentTab === 'TODO' && (hasActive || isSub || hw.isOverdue)) return false;
        if (currentTab === 'IN_PROGRESS' && !hasActive) return false;
        if (currentTab === 'SUBMITTED' && !isSub) return false;
        if (currentTab === 'OVERDUE' && (!hw.isOverdue || isSub)) return false;

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = hw.title.toLowerCase().includes(q);
          const matchDesc = hw.description.toLowerCase().includes(q);
          const matchClass = hw.className.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchClass) return false;
        }

        // HSK filter
        if (selectedHsk !== 'ALL') {
          if (!hw.hskLevelName.toLowerCase().includes(selectedHsk.toLowerCase())) return false;
        }

        // Class filter
        if (selectedClassId !== 'ALL') {
          if (hw.classId !== selectedClassId) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return sortBy === 'dueSoon' ? dateA - dateB : dateB - dateA;
      });
  }, [assignments, activeAttemptMap, submittedMap, currentTab, searchQuery, selectedHsk, selectedClassId, sortBy]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h1
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 800,
                color: 'var(--foreground)',
                margin: 0,
                letterSpacing: '-0.5px',
              }}
            >
              Bài tập về nhà
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
              Danh sách bài tập và bài kiểm tra được giao bởi giáo viên bộ môn
            </p>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              fontSize: 'var(--text-xs)',
              color: 'var(--foreground)',
            }}
          >
            <span style={{ color: 'var(--muted)' }}>Học viên:</span>
            <strong style={{ color: 'var(--primary)' }}>{currentStudent.fullName}</strong>
            <span style={{ color: 'var(--muted)' }}>({currentStudent.activeClassIds.length} lớp học)</span>
          </div>
        </div>

        {/* Quick summary metric pills */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-2)',
          }}
        >
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>TỔNG SỐ BÀI TẬP</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--foreground)' }}>
                {assignments.length}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>CẦN HOÀN THÀNH</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: '#d97706' }}>
                {tabCounts.TODO + tabCounts.IN_PROGRESS}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>ĐÃ NỘP BÀI</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: '#059669' }}>
                {tabCounts.SUBMITTED}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <HomeworkFilterTabs
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        counts={tabCounts}
      />

      {/* Search and Secondary Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search Input */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 280px',
            maxWidth: '420px',
          }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted)',
            }}
          />
          <input
            type="text"
            placeholder="Tìm theo tên bài tập, lớp học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--foreground)',
              fontSize: 'var(--text-sm)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filters: HSK, Class, Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {/* HSK Level Select */}
          <select
            value={selectedHsk}
            onChange={(e) => setSelectedHsk(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--foreground)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ALL">Tất cả trình độ HSK</option>
            <option value="HSK 1">HSK 1</option>
            <option value="HSK 2">HSK 2</option>
            <option value="HSK 3">HSK 3</option>
            <option value="HSK 4">HSK 4</option>
            <option value="HSK 5">HSK 5</option>
            <option value="HSK 6">HSK 6</option>
          </select>

          {/* Class Select */}
          {classOptions.length > 0 && (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '180px',
              }}
            >
              <option value="ALL">Tất cả lớp học</option>
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Sort Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--foreground)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="dueSoon">Hạn nộp gần nhất</option>
            <option value="dueLate">Hạn nộp xa nhất</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div
          style={{
            padding: 'var(--space-12)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-3)',
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border)',
          }}
        >
          <RefreshCw size={24} className="spin-animation" style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', fontWeight: 500 }}>
            Đang tải danh sách bài tập...
          </span>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div
          style={{
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
          }}
        >
          <AlertCircle size={24} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--danger)' }}>
              Lỗi tải bài tập
            </h4>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{error}</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="ds-btn ds-btn-outline"
            style={{ height: '36px', fontSize: 'var(--text-xs)' }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredAssignments.length === 0 && (
        <div
          style={{
            padding: 'var(--space-12) var(--space-6)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--surface)',
            border: '1px dashed var(--border)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--neutral-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted)',
            }}
          >
            <BookOpen size={24} />
          </div>
          <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)' }}>
            Không tìm thấy bài tập nào
          </h3>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--muted)', maxWidth: '400px' }}>
            {searchQuery || selectedHsk !== 'ALL' || selectedClassId !== 'ALL' || currentTab !== 'ALL'
              ? 'Không có bài tập nào phù hợp với bộ lọc hiện tại. Bạn hãy thử bỏ bớt điều kiện lọc hoặc từ khoá tìm kiếm.'
              : 'Hiện tại giáo viên chưa giao bài tập nào mới cho lớp học của bạn.'}
          </p>
          {(searchQuery || selectedHsk !== 'ALL' || selectedClassId !== 'ALL' || currentTab !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedHsk('ALL');
                setSelectedClassId('ALL');
                setCurrentTab('ALL');
              }}
              className="ds-btn ds-btn-outline"
              style={{ height: '36px', fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)' }}
            >
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Homework Grid */}
      {!loading && !error && filteredAssignments.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {filteredAssignments.map((hw) => (
            <HomeworkCard
              key={hw.assignmentId}
              homework={hw}
              activeAttemptId={activeAttemptMap[hw.assignmentId]}
              isSubmitted={submittedMap[hw.assignmentId]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

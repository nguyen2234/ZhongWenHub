import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, BookOpen, AlertCircle, RefreshCw, ShieldCheck, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { PageHeader } from '../../../shared/components';
import {
  CurriculumUnitCard,
  LessonDetailDrawer,
  LevelFilterBar,
  UnitModal,
} from '../components';
import {
  curriculumService,
  type CoursePublicationReadiness,
} from '../services/curriculum.service';
import { hskRepositoryService } from '../services/hsk-repository.service';
import type {
  Lesson,
  Unit,
  UpdateLessonDTO,
  UpdateUnitDTO,
} from '../types';
import '../components/learning-content.css';

const HSK_20_STANDARD_LIMITS: Record<number, number> = {
  1: 15,
  2: 15,
  3: 20,
  4: 20,
};

export const AdminCurriculumPage: React.FC = () => {
  const navigate = useNavigate();
  const [dataVersion, setDataVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setActionError(null);
    try {
      await curriculumService.syncFromApi();
      setDataVersion((v) => v + 1);
      const updatedCourses = curriculumService.getCourses();
      if (updatedCourses.length > 0) {
        setSelectedCourseId((prev) =>
          updatedCourses.some((c) => c.id === prev) ? prev : updatedCourses[0].id
        );
      }
    } catch (err: any) {
      console.error('[AdminCurriculumPage] Sync error:', err);
      setErrorMessage(err?.message || 'Không thể đồng bộ dữ liệu giáo trình từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 1. Courses loaded live from Backend SQL Server
  const courses = useMemo(() => {
    void dataVersion;
    return curriculumService.getCourses();
  }, [dataVersion]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');

  // 2. HSK Levels metadata (for tabs)
  const levels = useMemo(() => {
    void dataVersion;
    return hskRepositoryService.getLevels();
  }, [dataVersion]);

  const allCourseLevels = useMemo(() => {
    void dataVersion;
    return courses.map((c, idx) => {
      const hskNum = c.hskLevel || idx + 1;
      return {
        id: c.id,
        courseId: c.id,
        hskLevelId: `level-hsk-${hskNum}`,
        name: c.name || `HSK ${hskNum}`,
        orderIndex: hskNum,
      };
    });
  }, [courses, dataVersion]);

  const [selectedLevelId, setSelectedLevelId] = useState<string>(levels[0]?.id || 'level-hsk-1');

  const handleSelectLevel = useCallback(
    (levelId: string) => {
      setSelectedLevelId(levelId);
      const matched = allCourseLevels.find((cl) => cl.hskLevelId === levelId);
      if (matched) {
        setSelectedCourseId(matched.courseId);
      }
    },
    [allCourseLevels]
  );

  const handleSelectCourse = useCallback(
    (courseId: string) => {
      setSelectedCourseId(courseId);
      const matched = allCourseLevels.find((cl) => cl.courseId === courseId);
      if (matched) {
        setSelectedLevelId(matched.hskLevelId);
      }
    },
    [allCourseLevels]
  );

  // Active course & level strictly synchronized
  const activeCourse = useMemo(() => {
    return (
      courses.find((c) => c.id === selectedCourseId) ||
      courses.find((c) => `level-hsk-${c.hskLevel || 0}` === selectedLevelId) ||
      courses[0]
    );
  }, [courses, selectedCourseId, selectedLevelId]);

  const activeCourseLevel = useMemo(() => {
    return (
      allCourseLevels.find((cl) => cl.courseId === activeCourse?.id) ||
      allCourseLevels.find((cl) => cl.hskLevelId === selectedLevelId) ||
      allCourseLevels[0]
    );
  }, [allCourseLevels, activeCourse, selectedLevelId]);

  const selectedHskNum =
    activeCourse?.hskLevel ||
    (Number(selectedLevelId ? selectedLevelId.replace('level-hsk-', '') : '1') || 1);

  // 3. Units for active course
  const units = useMemo(() => {
    void dataVersion;
    if (!activeCourseLevel) return [];
    return curriculumService.getUnits(activeCourseLevel.id);
  }, [activeCourseLevel, dataVersion]);

  // 4. All lessons from Backend SQL Server
  const allLessons = useMemo(() => {
    void dataVersion;
    return curriculumService.getLessons();
  }, [dataVersion]);

  // Lessons belonging to active course (via courseId or unitId)
  const activeCourseUnitIds = useMemo(() => new Set(units.map((u) => u.id)), [units]);
  const courseLessons = useMemo(() => {
    if (!activeCourse) return [];
    return allLessons.filter(
      (l) => l.courseId === activeCourse.id || activeCourseUnitIds.has(l.unitId)
    );
  }, [allLessons, activeCourse, activeCourseUnitIds]);

  // Phase B: Live curriculum counts directly from SQL Server data
  const liveStats = useMemo(() => {
    const publishedCount = courseLessons.filter((l) => l.status === 'PUBLISHED').length;
    const draftCount = courseLessons.filter((l) => l.status === 'DRAFT').length;
    const pendingReviewCount = courseLessons.filter((l) => l.status === 'PENDING_REVIEW').length;
    const archivedCount = courseLessons.filter((l) => l.status === 'ARCHIVED').length;
    const standardLimit = HSK_20_STANDARD_LIMITS[selectedHskNum] ?? null;

    const hsk1To4Courses = courses.filter((c) => (c.hskLevel ?? 0) >= 1 && (c.hskLevel ?? 0) <= 4);
    const hsk1To4Summary = [1, 2, 3, 4].map((lvl) => {
      const course = hsk1To4Courses.find((c) => c.hskLevel === lvl);
      const lvlLessons = course ? allLessons.filter((l) => l.courseId === course.id) : [];
      const total = lvlLessons.length || course?.lessonCount || 0;
      const published = lvlLessons.filter((l) => l.status === 'PUBLISHED').length;
      return {
        hskLevel: lvl,
        standardTarget: HSK_20_STANDARD_LIMITS[lvl],
        total,
        published,
      };
    });
    const hsk1To4Total = hsk1To4Summary.reduce((sum, x) => sum + x.total, 0);
    const hsk1To4Published = hsk1To4Summary.reduce((sum, x) => sum + x.published, 0);

    return {
      unitCount: units.length,
      totalLessons: courseLessons.length,
      publishedCount,
      draftCount,
      pendingReviewCount,
      archivedCount,
      standardLimit,
      hsk1To4Summary,
      hsk1To4Total,
      hsk1To4Published,
    };
  }, [courseLessons, units.length, selectedHskNum, courses, allLessons]);

  // 5. Drawer & Modal states
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLessonDrawerOpen, setIsLessonDrawerOpen] = useState(false);
  const [currentUnitForLesson, setCurrentUnitForLesson] = useState<Unit | null>(null);

  const [selectedUnitForEdit, setSelectedUnitForEdit] = useState<Unit | null>(null);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  // Readiness & batch publish panel state
  const [showReadinessPanel, setShowReadinessPanel] = useState(false);
  const [readinessData, setReadinessData] = useState<CoursePublicationReadiness | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readinessError, setReadinessError] = useState<string | null>(null);
  const [readinessMessage, setReadinessMessage] = useState<string | null>(null);

  const loadReadiness = useCallback(async (preserveMessage = false) => {
    setReadinessLoading(true);
    setReadinessError(null);
    if (!preserveMessage) {
      setReadinessMessage(null);
    }
    try {
      const data = await curriculumService.getCoursePublicationReadiness(selectedHskNum);
      setReadinessData(data);
    } catch {
      setReadinessData(null);
      setReadinessError('Không thể tải dữ liệu kiểm duyệt. Vui lòng kiểm tra kết nối Backend.');
    } finally {
      setReadinessLoading(false);
    }
  }, [selectedHskNum]);

  useEffect(() => {
    setReadinessData(null);
    setReadinessError(null);
    if (showReadinessPanel) {
      loadReadiness();
    }
  }, [showReadinessPanel, selectedHskNum, loadReadiness]);

  // Unit handlers
  const handleOpenAddUnit = useCallback(() => {
    setSelectedUnitForEdit(null);
    setIsUnitModalOpen(true);
  }, []);

  const handleOpenEditUnit = useCallback((unit: Unit) => {
    setSelectedUnitForEdit(unit);
    setIsUnitModalOpen(true);
  }, []);

  const handleSaveUnit = useCallback(async (dto: UpdateUnitDTO) => {
    if (selectedUnitForEdit) {
      await curriculumService.updateUnit(selectedUnitForEdit.id, dto);
    } else if (activeCourseLevel) {
      await curriculumService.createUnit(activeCourseLevel.id, dto);
    }
    await loadData();
  }, [selectedUnitForEdit, activeCourseLevel, loadData]);

  const handleDeleteUnit = useCallback(async (unit: Unit) => {
    setActionError(null);
    try {
      await curriculumService.deleteUnit(unit.id);
      await loadData();
      if (showReadinessPanel) {
        await loadReadiness(true);
      }
    } catch (err: any) {
      setActionError(err?.message || 'Không thể xóa Unit.');
    }
  }, [loadData, showReadinessPanel, loadReadiness]);

  // Lesson handlers
  const handleSelectLesson = useCallback((lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsLessonDrawerOpen(true);
  }, []);

  const handleOpenAddLesson = useCallback((unit: Unit) => {
    setCurrentUnitForLesson(unit);
    const nextLessonNum = courseLessons.reduce((max, l) => Math.max(max, l.lessonNumber || 0), 0) + 1;
    const newLessonDraft: Lesson = {
      id: `les-new-${Date.now()}`,
      courseId: activeCourse?.id,
      unitId: unit.id,
      lessonNumber: nextLessonNum,
      titleZh: '',
      titleVi: '',
      pinyin: '',
      durationMinutes: 15,
      xpReward: 50,
      orderIndex: nextLessonNum,
      status: 'DRAFT',
      summary: '',
      linkedVocabularyCount: 0,
      linkedGrammarCount: 0,
      exerciseCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedLesson(newLessonDraft);
    setIsLessonDrawerOpen(true);
  }, [courseLessons, activeCourse?.id]);

  const handleSaveLesson = useCallback(async (id: string, dto: UpdateLessonDTO): Promise<Lesson> => {
    let saved: Lesson;
    if (id.startsWith('les-new-') && currentUnitForLesson) {
      saved = await curriculumService.createLesson(currentUnitForLesson.id, dto);
    } else {
      saved = await curriculumService.updateLesson(id, dto);
    }
    await loadData();
    const freshLesson = curriculumService.getLessonById(saved.id) || saved;
    setSelectedLesson(freshLesson);
    if (showReadinessPanel) {
      await loadReadiness(true);
    }
    return freshLesson;
  }, [currentUnitForLesson, loadData, showReadinessPanel, loadReadiness]);

  const handleDeleteLesson = useCallback(async (lessonOrId: Lesson | string) => {
    const id = typeof lessonOrId === 'string' ? lessonOrId : lessonOrId.id;
    setActionError(null);
    await curriculumService.deleteLesson(id);
    await loadData();
    if (selectedLesson?.id === id) {
      setSelectedLesson(null);
      setIsLessonDrawerOpen(false);
    }
    if (showReadinessPanel) {
      await loadReadiness(true);
    }
  }, [loadData, selectedLesson?.id, showReadinessPanel, loadReadiness]);

  const location = useLocation();
  const isContentManager = location.pathname.includes('/content-manager');
  const grammarBasePath = isContentManager ? '/management/content-manager/grammar' : '/management/admin/grammar';
  const exerciseBasePath = isContentManager ? '/management/content-manager/question-bank' : '/management/admin/exercises';

  const handleEditLesson = useCallback(
    (lesson: Lesson) => {
      const basePath = isContentManager ? '/management/content-manager' : '/management/admin';
      navigate(`${basePath}/curriculum/lessons/${lesson.id}/edit`);
    },
    [isContentManager, navigate]
  );

  const handleBatchSubmitReady = async () => {
    if (!readinessData || readinessError) return;
    const readyDraftIds = readinessData.lessons
      .filter((l) => l.isReadyForPublish && l.currentStatus === 'DRAFT')
      .map((l) => l.lessonId);
    if (readyDraftIds.length === 0) {
      setReadinessMessage('Không có bài học DRAFT nào đạt đủ 5 điều kiện xuất bản để gửi kiểm duyệt.');
      return;
    }
    const res = await curriculumService.batchReviewLessons(readyDraftIds, 'PENDING_REVIEW', 'Gửi kiểm duyệt hàng loạt từ màn hình Giáo trình');
    setReadinessMessage(`Đã gửi duyệt ${res.processedCount} bài (bỏ qua ${res.skippedCount}).`);
    await loadReadiness(true);
    await loadData();
  };

  const handleBatchPublishPending = async () => {
    if (!readinessData || readinessError) return;
    const pendingReadyIds = readinessData.lessons
      .filter((l) => l.isReadyForPublish && l.currentStatus === 'PENDING_REVIEW')
      .map((l) => l.lessonId);
    if (pendingReadyIds.length === 0) {
      setReadinessMessage('Chưa có bài học PENDING_REVIEW nào đạt đủ 5 điều kiện sẵn sàng xuất bản.');
      return;
    }
    const res = await curriculumService.batchReviewLessons(pendingReadyIds, 'PUBLISHED', 'Phê duyệt xuất bản hàng loạt sau kiểm tra release gate');
    const note = res.skippedReasons.length > 0 ? ` — Lý do bỏ qua: ${res.skippedReasons[0]}` : '';
    setReadinessMessage(`Đã xuất bản ${res.processedCount} bài, bỏ qua ${res.skippedCount} bài${note}`);
    await loadReadiness(true);
    await loadData();
  };

  return (
    <div className="lcm-page">
      <PageHeader
        title="Giáo trình"
        subtitle="Chọn HSK, chọn Unit và chọn bài giảng để xem nhanh, thêm bài mới (DRAFT) hoặc mở trình biên tập bài học."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="ds-btn ds-btn-secondary ds-btn-sm"
              onClick={() => navigate(`${grammarBasePath}?hsk=${selectedHskNum}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Ngữ pháp khóa học</span>
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-secondary ds-btn-sm"
              onClick={() => navigate(`${exerciseBasePath}?hsk=${selectedHskNum}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Kho bài tập</span>
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-outline ds-btn-sm"
              onClick={() => setShowReadinessPanel((prev) => !prev)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ShieldCheck size={14} /> Kiểm duyệt xuất bản HSK {selectedHskNum}
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-primary ds-btn-sm"
              onClick={handleOpenAddUnit}
              disabled={isLoading || Boolean(errorMessage) || !activeCourseLevel}
            >
              <Plus size={14} /> Thêm Unit mới
            </button>
          </div>
        }
      />

      {/* Error Banner with Retry button */}
      {(errorMessage || actionError) && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--danger, #ef4444)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <AlertCircle size={18} />
            <span>{errorMessage || actionError}</span>
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={loadData}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <RefreshCw size={14} /> Thử lại
          </button>
        </div>
      )}

      {/* Loading state indicator */}
      {isLoading && (
        <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--muted)' }}>
          Đang tải dữ liệu giáo trình từ máy chủ...
        </div>
      )}

      {!isLoading && !errorMessage && (
        <>
          {/* Course Selector Card */}
          <div className="lcm-course-header-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ padding: '8px', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-lg)', color: 'var(--primary)' }}>
                <BookOpen size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 2px 0' }}>
                  {activeCourse?.name || 'Chưa có khóa học'}
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: 0 }}>
                  {activeCourse?.description}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)' }}>Khóa học:</span>
              <select
                className="lcm-select-filter"
                value={activeCourse?.id || selectedCourseId}
                onChange={(e) => handleSelectCourse(e.target.value)}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Course Level / HSK Selector */}
          <LevelFilterBar
            levels={levels}
            selectedLevelId={selectedLevelId}
            onSelectLevel={handleSelectLevel}
            showAllOption={false}
          />

          {/* Phase B: Live SQL Curriculum Metrics Bar */}
          <div
            data-testid="curriculum-live-stats"
            className="ds-card"
            style={{
              padding: 'var(--space-3) var(--space-4)',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
              <span>
                Unit: <strong data-testid="stat-unit-count">{liveStats.unitCount}</strong>
              </span>
              <span>
                Tổng bài thực tế (SQL): <strong data-testid="stat-total-lessons">{liveStats.totalLessons}</strong>
                {liveStats.standardLimit !== null && (
                  <span style={{ color: 'var(--muted)' }}> (chuẩn HSK 2.0: {liveStats.standardLimit} bài)</span>
                )}
              </span>
              <span>
                PUBLISHED: <strong data-testid="stat-published-count" style={{ color: 'var(--success, #16a34a)' }}>{liveStats.publishedCount}</strong>
              </span>
              <span>
                DRAFT: <strong data-testid="stat-draft-count">{liveStats.draftCount}</strong>
              </span>
              <span>
                PENDING_REVIEW: <strong data-testid="stat-pending-count">{liveStats.pendingReviewCount}</strong>
              </span>
              <span>
                BLOCKED:{' '}
                <strong
                  data-testid="stat-blocked-count"
                  style={{ color: readinessError ? 'var(--danger, #ef4444)' : 'inherit' }}
                >
                  {readinessLoading
                    ? 'Đang tải...'
                    : readinessError
                    ? 'Lỗi tải'
                    : readinessData
                    ? readinessData.blockedCount
                    : 'Chưa kiểm tra'}
                </strong>
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', fontSize: '11px', color: 'var(--muted)' }}>
              <span>
                <strong>Cơ cấu HSK 2.0 (HSK 1–4 thực tế: {liveStats.hsk1To4Total}/70 bài · đã xuất bản: {liveStats.hsk1To4Published}):</strong>
              </span>
              {liveStats.hsk1To4Summary.map((item) => (
                <span key={item.hskLevel}>
                  HSK {item.hskLevel}: <strong>{item.total}</strong>/{item.standardTarget} bài ({item.published} đã xuất bản)
                </span>
              ))}
            </div>
          </div>

          {showReadinessPanel && (
            <div className="ds-card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                    Kiểm tra sẵn sàng xuất bản — HSK {selectedHskNum}{' '}
                    {readinessData
                      ? `(${readinessData.totalLessons} bài)`
                      : readinessLoading
                      ? '(Đang tải...)'
                      : ''}
                  </h4>
                  {readinessData && !readinessError && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                      Đã xuất bản: <strong>{readinessData.publishedCount}</strong> · Sẵn sàng duyệt:{' '}
                      <strong>{readinessData.readyToPublishCount}</strong> · Chờ duyệt:{' '}
                      <strong>{readinessData.pendingReviewCount}</strong> · Bị chặn:{' '}
                      <strong style={{ color: readinessData.blockedCount > 0 ? 'var(--danger, #ef4444)' : 'inherit' }}>
                        {readinessData.blockedCount}
                      </strong>
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button type="button" className="ds-btn ds-btn-outline ds-btn-sm" onClick={() => loadReadiness(false)} disabled={readinessLoading}>
                    <RefreshCw size={13} /> Kiểm tra lại
                  </button>
                  <button
                    type="button"
                    className="ds-btn ds-btn-outline ds-btn-sm"
                    onClick={handleBatchSubmitReady}
                    disabled={readinessLoading || Boolean(readinessError) || !readinessData}
                  >
                    <Send size={13} /> Gửi duyệt bài đủ điều kiện
                  </button>
                  <button
                    type="button"
                    className="ds-btn ds-btn-primary ds-btn-sm"
                    onClick={handleBatchPublishPending}
                    disabled={readinessLoading || Boolean(readinessError) || !readinessData}
                  >
                    <CheckCircle2 size={13} /> Xuất bản bài đã duyệt
                  </button>
                </div>
              </div>

              {readinessError && (
                <div
                  role="alert"
                  data-testid="readiness-error-banner"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    fontSize: 'var(--text-xs)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--danger, #ef4444)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <AlertCircle size={15} />
                  <span>{readinessError}</span>
                </div>
              )}

              {readinessMessage && !readinessError && (
                <div style={{ fontSize: 'var(--text-xs)', padding: '8px 12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background)', marginBottom: 'var(--space-2)' }}>
                  {readinessMessage}
                </div>
              )}

              {readinessData && !readinessError && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-2)' }}>
                  {readinessData.lessons.map((item) => (
                    <div
                      key={item.lessonId}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--background)',
                        fontSize: 'var(--text-xs)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '4px' }}>
                        <span>Bài {item.lessonNumber}: {item.titleZh}</span>
                        <span style={{ color: item.readinessState === 'BLOCKED' ? 'var(--danger, #ef4444)' : 'var(--success, #16a34a)' }}>
                          {item.readinessState}
                        </span>
                      </div>
                      <div style={{ color: 'var(--muted)' }}>
                        Từ: {item.vocabCount} · Ngữ pháp: {item.grammarCount} · BT: {item.exerciseCount}
                      </div>
                      {item.blockerReasons.length > 0 && (
                        <div style={{ color: 'var(--danger, #ef4444)', marginTop: '4px', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                          <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{item.blockerReasons.join(' ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Unit Statistics Summary */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
            <span>
              Đang hiển thị <strong>{units.length}</strong> Unit · <strong>{courseLessons.length}</strong> bài giảng thuộc cấp độ <strong>{levels.find((l) => l.id === selectedLevelId)?.name}</strong>
            </span>
          </div>

          {/* Units Accordion List */}
          <div className="lcm-units-stack">
            {units.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
                <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', margin: '0 0 var(--space-3) 0' }}>
                  Chưa có Unit nào cho cấp độ này.
                </p>
                <button
                  type="button"
                  className="ds-btn ds-btn-primary ds-btn-sm"
                  onClick={handleOpenAddUnit}
                >
                  <Plus size={14} /> Khởi tạo Unit đầu tiên
                </button>
              </div>
            ) : (
              units.map((unit) => {
                const unitLessons = allLessons.filter((l) => l.unitId === unit.id);
                return (
                  <CurriculumUnitCard
                    key={unit.id}
                    unit={unit}
                    lessons={unitLessons}
                    onEditUnit={handleOpenEditUnit}
                    onDeleteUnit={handleDeleteUnit}
                    onAddLesson={handleOpenAddLesson}
                    onSelectLesson={handleSelectLesson}
                    onEditLesson={handleEditLesson}
                    onDeleteLesson={handleDeleteLesson}
                  />
                );
              })
            )}
          </div>
        </>
      )}

      {/* Lesson Detail Drawer */}
      <LessonDetailDrawer
        isOpen={isLessonDrawerOpen}
        lesson={selectedLesson}
        onClose={() => setIsLessonDrawerOpen(false)}
        onSave={handleSaveLesson}
        onDelete={handleDeleteLesson}
        existingLessonsInCourse={courseLessons}
        hskLevel={selectedHskNum}
        standardLessonLimit={liveStats.standardLimit}
        currentCourseLessonCount={courseLessons.length}
      />

      {/* Unit Modal */}
      <UnitModal
        isOpen={isUnitModalOpen}
        unit={selectedUnitForEdit}
        onClose={() => setIsUnitModalOpen(false)}
        onSave={handleSaveUnit}
      />
    </div>
  );
};

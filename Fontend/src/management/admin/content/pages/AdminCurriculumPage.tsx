import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../../shared/components';
import {
  CurriculumUnitCard,
  LessonDetailDrawer,
  LevelFilterBar,
  UnitModal,
} from '../components';
import { curriculumService } from '../services/curriculum.service';
import { hskRepositoryService } from '../services/hsk-repository.service';
import type {
  Lesson,
  Unit,
  UpdateLessonDTO,
  UpdateUnitDTO,
} from '../types';
import '../components/learning-content.css';

export const AdminCurriculumPage: React.FC = () => {
  const navigate = useNavigate();
  const [dataVersion, setDataVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await curriculumService.syncFromApi();
      setDataVersion((v) => v + 1);
      const updatedCourses = curriculumService.getCourses();
      if (updatedCourses.length > 0) {
        setSelectedCourseId((prev) => prev || updatedCourses[0].id);
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

  // 1. Courses
  const courses = useMemo(() => {
    void dataVersion;
    return curriculumService.getCourses();
  }, [dataVersion]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');

  // 2. Data-driven HSK Levels for Course Levels
  const levels = useMemo(() => {
    void dataVersion;
    return hskRepositoryService.getLevels();
  }, [dataVersion]);

  const courseLevels = useMemo(() => {
    void dataVersion;
    if (!selectedCourseId) return [];
    return curriculumService.getCourseLevels(selectedCourseId);
  }, [selectedCourseId, dataVersion]);

  const [selectedLevelId, setSelectedLevelId] = useState<string>(levels[0]?.id || 'level-hsk-1');

  // Active course level ID
  const activeCourseLevel = useMemo(() => {
    return courseLevels.find((cl) => cl.hskLevelId === selectedLevelId) || courseLevels[0];
  }, [courseLevels, selectedLevelId]);

  // 3. Units for active course level
  const units = useMemo(() => {
    void dataVersion;
    if (!activeCourseLevel) return [];
    return curriculumService.getUnits(activeCourseLevel.id);
  }, [activeCourseLevel, dataVersion]);

  // 4. All lessons map by unitId
  const allLessons = useMemo(() => {
    void dataVersion;
    return curriculumService.getLessons();
  }, [dataVersion]);

  // 5. Drawer & Modal states
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLessonDrawerOpen, setIsLessonDrawerOpen] = useState(false);
  const [currentUnitForLesson, setCurrentUnitForLesson] = useState<Unit | null>(null);

  const [selectedUnitForEdit, setSelectedUnitForEdit] = useState<Unit | null>(null);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

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
    setDataVersion((v) => v + 1);
  }, [selectedUnitForEdit, activeCourseLevel]);

  // Lesson handlers
  const handleSelectLesson = useCallback((lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsLessonDrawerOpen(true);
  }, []);

  const handleOpenAddLesson = useCallback((unit: Unit) => {
    setCurrentUnitForLesson(unit);
    const newLessonDraft: Lesson = {
      id: `les-new-${Date.now()}`,
      unitId: unit.id,
      lessonNumber: (unit.lessonCount ?? 0) + 1,
      titleZh: '',
      titleVi: '',
      durationMinutes: 15,
      xpReward: 50,
      orderIndex: (unit.lessonCount ?? 0) + 1,
      status: 'PUBLISHED',
      summary: '',
      linkedVocabularyCount: 0,
      linkedGrammarCount: 0,
      exerciseCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedLesson(newLessonDraft);
    setIsLessonDrawerOpen(true);
  }, []);

  const handleSaveLesson = useCallback(async (id: string, dto: UpdateLessonDTO) => {
    if (id.startsWith('les-new-') && currentUnitForLesson) {
      await curriculumService.createLesson(currentUnitForLesson.id, dto);
    } else {
      await curriculumService.updateLesson(id, dto);
    }
    setDataVersion((v) => v + 1);
  }, [currentUnitForLesson]);

  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
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

  return (
    <div className="lcm-page">
      <PageHeader
        title="Giáo trình"
        subtitle="Chọn HSK, chọn Unit và chọn bài giảng để xem nhanh hoặc mở trình biên tập bài học."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="ds-btn ds-btn-secondary ds-btn-sm"
              onClick={() => {
                const hskNum = selectedLevelId ? selectedLevelId.replace('level-hsk-', '') : '1';
                navigate(`${grammarBasePath}?hsk=${hskNum}`);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Ngữ pháp khóa học</span>
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-secondary ds-btn-sm"
              onClick={() => {
                const hskNum = selectedLevelId ? selectedLevelId.replace('level-hsk-', '') : '1';
                navigate(`${exerciseBasePath}?hsk=${hskNum}`);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Kho bài tập</span>
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-primary ds-btn-sm"
              onClick={handleOpenAddUnit}
            >
              <Plus size={14} /> Thêm Unit mới
            </button>
          </div>
        }
      />

      {/* Error Banner with Retry button */}
      {errorMessage && (
        <div
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
            <span>{errorMessage}</span>
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

      {!isLoading && (
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
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
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
            onSelectLevel={setSelectedLevelId}
            showAllOption={false}
          />

          {/* Unit Statistics Summary */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
            <span>
              Đang hiển thị <strong>{units.length}</strong> Unit thuộc cấp độ <strong>{levels.find((l) => l.id === selectedLevelId)?.name}</strong>
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
                    onAddLesson={handleOpenAddLesson}
                    onSelectLesson={handleSelectLesson}
                    onEditLesson={handleEditLesson}
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

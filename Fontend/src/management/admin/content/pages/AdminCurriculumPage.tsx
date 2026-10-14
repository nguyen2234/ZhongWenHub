import React, { useState, useMemo, useCallback } from 'react';
import { Plus, BookOpen } from 'lucide-react';
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
  const [dataVersion, setDataVersion] = useState(0);

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

  const handleSaveUnit = useCallback((dto: UpdateUnitDTO) => {
    if (selectedUnitForEdit) {
      curriculumService.updateUnit(selectedUnitForEdit.id, dto);
    } else if (activeCourseLevel) {
      curriculumService.createUnit(activeCourseLevel.id, dto);
    }
    setDataVersion((v) => v + 1);
    setIsUnitModalOpen(false);
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

  const handleSaveLesson = useCallback((id: string, dto: UpdateLessonDTO) => {
    if (id.startsWith('les-new-') && currentUnitForLesson) {
      curriculumService.createLesson(currentUnitForLesson.id, dto);
    } else {
      curriculumService.updateLesson(id, dto);
    }
    setDataVersion((v) => v + 1);
    setIsLessonDrawerOpen(false);
  }, [currentUnitForLesson]);

  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  return (
    <div className="lcm-page">
      <PageHeader
        title="Giáo trình & Bài học"
        subtitle="Cấu trúc phân cấp khóa học, đơn vị bài học (Units) và bài giảng chi tiết (Lessons)."
        actions={
          <button
            type="button"
            className="ds-btn ds-btn-primary ds-btn-sm"
            onClick={handleOpenAddUnit}
          >
            <Plus size={14} /> Thêm Unit mới
          </button>
        }
      />

      {/* Course Selector Card */}
      <div className="lcm-course-header-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ padding: '8px', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-lg)', color: 'var(--primary)' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 2px 0' }}>
              {activeCourse?.name}
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
              />
            );
          })
        )}
      </div>

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

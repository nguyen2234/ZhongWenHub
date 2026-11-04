import {
  MOCK_COURSES,
  MOCK_COURSE_LEVELS,
  MOCK_LESSONS,
  MOCK_UNITS,
} from '../data/mockCurriculumData';
import { MOCK_LESSON_8_DRAFT } from '../data/mockLessonEditorData';
import type {
  Course,
  CourseLevel,
  Lesson,
  LessonEditorDraft,
  Unit,
  UpdateLessonDTO,
  UpdateUnitDTO,
} from '../types';
import { httpClient } from '../../../../core/api/client/http-client';

let courses = [...MOCK_COURSES];
let courseLevels = [...MOCK_COURSE_LEVELS];
let units = [...MOCK_UNITS];
let lessons = [...MOCK_LESSONS];

class CurriculumService {
  /**
   * Syncs curriculum courses and lessons with the live Backend SQL Server API
   */
  async syncFromApi(): Promise<void> {
    try {
      const apiCourses = await httpClient.get<any[]>('/content/courses');
      if (Array.isArray(apiCourses) && apiCourses.length > 0) {
        courses = apiCourses.map((c: any) => ({
          id: c.id,
          code: c.code,
          name: c.title,
          description: c.description || '',
          status: c.status,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt || c.createdAt,
        }));

        courseLevels = courses.map((c: any, idx: number) => ({
          id: `cl-${c.id}`,
          courseId: c.id,
          hskLevelId: `level-hsk-${c.hskLevel || idx + 1}`,
          name: c.name || `HSK ${c.hskLevel || idx + 1}`,
          orderIndex: c.orderIndex || idx + 1,
        }));
      }

      const apiLessons = await httpClient.get<{ items: any[] }>('/content/lessons', {
        params: { pageSize: 100 },
      });
      if (apiLessons && Array.isArray(apiLessons.items) && apiLessons.items.length > 0) {
        const primaryCourseLevelId = courseLevels[0]?.id || 'cl-1';

        // Ensure Unit 1 exists for live lessons
        if (!units.some((u) => u.id === 'unit-1')) {
          units.push({
            id: 'unit-1',
            courseLevelId: primaryCourseLevelId,
            unitNumber: 1,
            titleZh: '问候与认识',
            titleVi: 'Chào hỏi & Làm quen',
            description: 'Các mẫu câu chào hỏi căn bản, giới thiệu bản thân và xưng hô lịch sự.',
            orderIndex: 1,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        lessons = apiLessons.items.map((l: any) => ({
          id: l.id,
          unitId: 'unit-1',
          lessonNumber: l.lessonNumber,
          titleZh: l.titleZh,
          titleVi: l.titleVi,
          durationMinutes: l.durationMinutes,
          xpReward: l.xpReward,
          orderIndex: l.orderIndex,
          status: l.status,
          summary: l.summary || '',
          linkedVocabularyCount: l.vocabularyCount ?? 0,
          linkedGrammarCount: l.grammarCount ?? 0,
          exerciseCount: l.exerciseCount ?? 0,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt || l.createdAt,
        }));
      }
    } catch (err) {
      console.warn('[CurriculumService] Failed to sync from live backend API, using cached state:', err);
    }
  }

  getCourses(): Course[] {
    return courses.map((c) => ({ ...c }));
  }

  getCourseById(id: string): Course | undefined {
    const found = courses.find((c) => c.id === id);
    return found ? { ...found } : undefined;
  }

  getCourseLevels(courseId: string): CourseLevel[] {
    return courseLevels
      .filter((cl) => cl.courseId === courseId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((cl) => ({ ...cl }));
  }

  getUnits(courseLevelId?: string): Unit[] {
    let list = courseLevelId ? units.filter((u) => u.courseLevelId === courseLevelId) : units;
    list = list.sort((a, b) => a.orderIndex - b.orderIndex);

    // Compute aggregated lesson counts
    return list.map((u) => {
      const unitLessons = lessons.filter((l) => l.unitId === u.id);
      return {
        ...u,
        lessonCount: unitLessons.length,
        publishedLessonCount: unitLessons.filter((l) => l.status === 'PUBLISHED').length,
      };
    });
  }

  getUnitById(id: string): Unit | undefined {
    const found = units.find((u) => u.id === id);
    if (!found) return undefined;
    const unitLessons = lessons.filter((l) => l.unitId === found.id);
    return {
      ...found,
      lessonCount: unitLessons.length,
      publishedLessonCount: unitLessons.filter((l) => l.status === 'PUBLISHED').length,
    };
  }

  updateUnit(id: string, dto: UpdateUnitDTO): Unit {
    const index = units.findIndex((u) => u.id === id);
    if (index === -1) throw new Error(`Không tìm thấy Unit: ${id}`);

    const updated: Unit = {
      ...units[index],
      titleZh: dto.titleZh.trim(),
      titleVi: dto.titleVi.trim(),
      description: dto.description.trim(),
      orderIndex: dto.orderIndex,
      status: dto.status,
      updatedAt: new Date().toISOString(),
    };

    units[index] = updated;
    return this.getUnitById(id)!;
  }

  createUnit(courseLevelId: string, dto: UpdateUnitDTO): Unit {
    const newUnit: Unit = {
      id: `unit-${Date.now()}`,
      courseLevelId,
      unitNumber: units.filter((u) => u.courseLevelId === courseLevelId).length + 1,
      titleZh: dto.titleZh.trim(),
      titleVi: dto.titleVi.trim(),
      description: dto.description.trim(),
      orderIndex: dto.orderIndex,
      status: dto.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    units = [...units, newUnit];
    return this.getUnitById(newUnit.id)!;
  }

  getLessons(unitId?: string): Lesson[] {
    const list = unitId ? lessons.filter((l) => l.unitId === unitId) : lessons;
    return list.sort((a, b) => a.orderIndex - b.orderIndex).map((l) => ({ ...l }));
  }

  getLessonById(id: string): Lesson | undefined {
    const found = lessons.find((l) => l.id === id);
    return found ? { ...found } : undefined;
  }

  updateLesson(id: string, dto: UpdateLessonDTO): Lesson {
    const index = lessons.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Không tìm thấy bài học: ${id}`);

    const updated: Lesson = {
      ...lessons[index],
      titleZh: dto.titleZh.trim(),
      titleVi: dto.titleVi.trim(),
      durationMinutes: dto.durationMinutes,
      xpReward: dto.xpReward,
      orderIndex: dto.orderIndex,
      status: dto.status,
      summary: dto.summary.trim(),
      updatedAt: new Date().toISOString(),
    };

    lessons[index] = updated;

    // Async persist to Backend API
    httpClient
      .put(`/content/lessons/${id}`, {
        lessonNumber: updated.lessonNumber,
        titleZh: updated.titleZh,
        titleVi: updated.titleVi,
        durationMinutes: updated.durationMinutes,
        xpReward: updated.xpReward,
        orderIndex: updated.orderIndex,
        status: updated.status,
        summary: updated.summary,
      })
      .catch((err) => {
        console.warn('[CurriculumService] Live update failed:', err);
      });

    return { ...updated };
  }

  createLesson(unitId: string, dto: UpdateLessonDTO): Lesson {
    const unitLessons = lessons.filter((l) => l.unitId === unitId);
    const newLesson: Lesson = {
      id: `les-${Date.now()}`,
      unitId,
      lessonNumber: unitLessons.length + 1,
      titleZh: dto.titleZh.trim(),
      titleVi: dto.titleVi.trim(),
      durationMinutes: dto.durationMinutes,
      xpReward: dto.xpReward,
      orderIndex: dto.orderIndex,
      status: dto.status,
      summary: dto.summary.trim(),
      linkedVocabularyCount: 0,
      linkedGrammarCount: 0,
      exerciseCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    lessons = [...lessons, newLesson];

    // Async persist to Backend API if course exists
    const primaryCourseId = courses[0]?.id;
    if (primaryCourseId) {
      httpClient
        .post<any>('/content/lessons', {
          courseId: primaryCourseId,
          lessonNumber: newLesson.lessonNumber,
          titleZh: newLesson.titleZh,
          titleVi: newLesson.titleVi,
          durationMinutes: newLesson.durationMinutes,
          xpReward: newLesson.xpReward,
          orderIndex: newLesson.orderIndex,
          status: newLesson.status,
          summary: newLesson.summary,
        })
        .then((res) => {
          if (res?.id) {
            newLesson.id = res.id;
          }
        })
        .catch((err) => {
          console.warn('[CurriculumService] Live create failed:', err);
        });
    }

    return { ...newLesson };
  }

  // --- Lesson Editor Aggregate Storage & Operations ---
  getLessonEditorData(lessonId: string): LessonEditorDraft {
    if (lessonDrafts[lessonId]) {
      return JSON.parse(JSON.stringify(lessonDrafts[lessonId]));
    }

    const lesson = this.getLessonById(lessonId);
    if (!lesson) {
      // Fallback for demo if id not found
      return JSON.parse(JSON.stringify(MOCK_LESSON_8_DRAFT));
    }

    // Generate baseline draft for any lesson
    const newDraft: LessonEditorDraft = {
      lessonId: lesson.id,
      unitId: lesson.unitId,
      lessonNumber: lesson.lessonNumber,
      status: lesson.status,
      intro: {
        titleZh: lesson.titleZh,
        titleVi: lesson.titleVi,
        pinyinTitle: '',
        summary: lesson.summary,
        durationMinutes: lesson.durationMinutes,
        xpReward: lesson.xpReward,
        objectives: [
          'Nắm vững các mẫu câu giao tiếp chính trong bài',
          'Áp dụng từ vựng vào ngữ cảnh thực tế hàng ngày',
        ],
        contextDialogueSnippet: {
          hanzi: '',
          pinyin: '',
          meaningVi: '',
        },
      },
      vocabularies: [],
      grammars: [],
      dialogue: {
        id: `diag-${lesson.id}`,
        lessonId: lesson.id,
        title: `Hội thoại bài ${lesson.lessonNumber}`,
        situationZh: '',
        situationVi: '',
        lines: [],
      },
      listenings: [],
      exercises: [],
      updatedAt: new Date().toISOString(),
    };

    lessonDrafts[lessonId] = newDraft;
    return JSON.parse(JSON.stringify(newDraft));
  }

  saveLessonDraft(lessonId: string, draft: LessonEditorDraft): LessonEditorDraft {
    const updatedDraft: LessonEditorDraft = {
      ...JSON.parse(JSON.stringify(draft)),
      updatedAt: new Date().toISOString(),
    };
    lessonDrafts[lessonId] = updatedDraft;

    // Sync lesson metadata to parent curriculum
    const index = lessons.findIndex((l) => l.id === lessonId);
    if (index !== -1) {
      lessons[index] = {
        ...lessons[index],
        titleZh: draft.intro.titleZh,
        titleVi: draft.intro.titleVi,
        durationMinutes: draft.intro.durationMinutes,
        xpReward: draft.intro.xpReward,
        summary: draft.intro.summary,
        status: draft.status,
        linkedVocabularyCount: draft.vocabularies.length,
        linkedGrammarCount: draft.grammars.length,
        exerciseCount: draft.exercises.length,
        updatedAt: updatedDraft.updatedAt,
      };

      httpClient
        .put(`/content/lessons/${lessonId}`, {
          lessonNumber: lessons[index].lessonNumber,
          titleZh: lessons[index].titleZh,
          titleVi: lessons[index].titleVi,
          durationMinutes: lessons[index].durationMinutes,
          xpReward: lessons[index].xpReward,
          orderIndex: lessons[index].orderIndex,
          status: lessons[index].status,
          summary: lessons[index].summary,
        })
        .catch(console.warn);
    }

    return JSON.parse(JSON.stringify(updatedDraft));
  }

  publishLesson(lessonId: string): LessonEditorDraft {
    const draft = this.getLessonEditorData(lessonId);
    draft.status = 'PUBLISHED';

    httpClient
      .put(`/content/lessons/${lessonId}/status`, {
        status: 'PUBLISHED',
      })
      .catch(console.warn);

    return this.saveLessonDraft(lessonId, draft);
  }

  submitLessonForReview(lessonId: string): LessonEditorDraft {
    const draft = this.getLessonEditorData(lessonId);
    draft.status = 'PENDING_REVIEW';
    return this.saveLessonDraft(lessonId, draft);
  }
}

let lessonDrafts: Record<string, LessonEditorDraft> = {
  'les-8': JSON.parse(JSON.stringify(MOCK_LESSON_8_DRAFT)),
};

export const curriculumService = new CurriculumService();

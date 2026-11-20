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

export interface LessonReleaseReadinessItem {
  lessonId: string;
  lessonNumber: number;
  titleZh: string;
  titleVi: string;
  currentStatus: string;
  isReadyForPublish: boolean;
  dialogueValid: boolean;
  listeningValid: boolean;
  vocabCount: number;
  grammarCount: number;
  exerciseCount: number;
  audioFilesExist: boolean;
  humanReviewCompleted: boolean;
  readinessState: 'PUBLISHED' | 'READY_TO_PUBLISH' | 'PENDING_REVIEW' | 'BLOCKED' | string;
  unitStatus?: string | null;
  updatedByUserId?: string | null;
  blockerReasons: string[];
}

export interface CoursePublicationReadiness {
  courseId: string;
  hskLevel: number;
  courseTitle: string;
  courseStatus: string;
  unitCount?: number;
  standardLessonTarget?: number | null;
  totalLessons: number;
  publishedCount: number;
  draftCount?: number;
  readyToPublishCount: number;
  pendingReviewCount: number;
  blockedCount: number;
  lessons: LessonReleaseReadinessItem[];
}

export interface BatchLessonReviewResult {
  processedCount: number;
  skippedCount: number;
  skippedReasons: string[];
}

// Real runtime: state is loaded exclusively from live Backend SQL Server API.
// Fixtures are reserved only for testing environments.
let courses: Course[] = [];
let courseLevels: CourseLevel[] = [];
let units: Unit[] = [];
let lessons: Lesson[] = [];

let lessonDrafts: Record<string, LessonEditorDraft> = {};

class CurriculumService {
  /**
   * Resets local stores with fixture data (used exclusively for tests)
   */
  loadFixturesForTesting(): void {
    courses = [...MOCK_COURSES];
    courseLevels = [...MOCK_COURSE_LEVELS];
    units = [...MOCK_UNITS];
    lessons = [...MOCK_LESSONS];
    lessonDrafts = {
      'les-8': JSON.parse(JSON.stringify(MOCK_LESSON_8_DRAFT)),
    };
  }

  /**
   * Synchronizes curriculum courses, units, and lessons with the live Backend SQL Server API.
   * Throws on network failure so UI can surface error states and retry buttons.
   */
  async syncFromApi(): Promise<void> {
    const [apiCourses, apiUnits, firstLessonPage] = await Promise.all([
      httpClient.get<any[]>('/content/courses'),
      httpClient.get<any[]>('/content/units'),
      httpClient.get<any>('/content/lessons', { params: { pageSize: 500, page: 1 } }),
    ]);

    if (Array.isArray(apiCourses)) {
      courses = apiCourses.map((c: any) => ({
        id: c.id,
        code: c.code,
        name: c.title,
        description: c.description || '',
        hskLevel: c.hskLevel,
        status: c.status,
        unitCount: c.unitCount ?? 0,
        lessonCount: c.lessonCount ?? 0,
        publishedLessonCount: c.publishedLessonCount ?? 0,
        draftLessonCount: c.draftLessonCount ?? 0,
        pendingReviewLessonCount: c.pendingReviewLessonCount ?? 0,
        archivedLessonCount: c.archivedLessonCount ?? 0,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt || c.createdAt,
      }));

      courseLevels = courses.map((c: any, idx: number) => ({
        id: c.id,
        courseId: c.id,
        hskLevelId: `level-hsk-${c.hskLevel || idx + 1}`,
        name: c.name || `HSK ${c.hskLevel || idx + 1}`,
        orderIndex: c.orderIndex || c.hskLevel || idx + 1,
      }));
    }

    if (Array.isArray(apiUnits)) {
      units = apiUnits.map((u: any) => ({
        id: u.id,
        courseLevelId: u.courseId,
        unitNumber: u.unitNumber,
        titleZh: u.titleZh,
        titleVi: u.titleVi,
        description: u.description || '',
        orderIndex: u.orderIndex,
        status: u.status,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt || u.createdAt,
        lessonCount: u.lessonCount ?? 0,
        publishedLessonCount: u.publishedLessonCount ?? 0,
      }));
    }

    let lessonItems = Array.isArray(firstLessonPage) ? firstLessonPage : (firstLessonPage?.items || []);
    const totalPages = firstLessonPage?.totalPages ?? 1;
    if (totalPages > 1) {
      const remainingRequests: Promise<any>[] = [];
      for (let p = 2; p <= totalPages; p++) {
        remainingRequests.push(httpClient.get<any>('/content/lessons', { params: { pageSize: 500, page: p } }));
      }
      const nextPages = await Promise.all(remainingRequests);
      for (const nextPage of nextPages) {
        const nextItems = Array.isArray(nextPage) ? nextPage : (nextPage?.items || []);
        lessonItems = [...lessonItems, ...nextItems];
      }
    }

    lessons = lessonItems.map((l: any) => ({
      id: l.id,
      courseId: l.courseId,
      unitId: l.unitId || '',
      lessonNumber: l.lessonNumber,
      titleZh: l.titleZh,
      titleVi: l.titleVi,
      pinyin: l.pinyin || '',
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

  // --- Read operations against loaded state ---

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

    // Compute live aggregated lesson counts
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

  getLessons(unitId?: string): Lesson[] {
    const list = unitId ? lessons.filter((l) => l.unitId === unitId) : lessons;
    return list.sort((a, b) => a.orderIndex - b.orderIndex).map((l) => ({ ...l }));
  }

  getLessonById(id: string): Lesson | undefined {
    const found = lessons.find((l) => l.id === id);
    return found ? { ...found } : undefined;
  }

  // --- Unit Real CRUD Persistence ---

  async createUnit(courseLevelId: string, dto: UpdateUnitDTO): Promise<Unit> {
    const courseId = courseLevels.find((cl) => cl.id === courseLevelId)?.courseId || courseLevelId;
    const existingUnitsForCourse = units.filter((u) => u.courseLevelId === courseId);
    const maxUnitNumber = existingUnitsForCourse.reduce((max, u) => Math.max(max, u.unitNumber || 0), 0);
    const unitNumber = maxUnitNumber + 1;

    const payload = {
      courseId,
      unitNumber,
      titleZh: dto.titleZh.trim(),
      titleVi: dto.titleVi.trim(),
      description: dto.description.trim(),
      orderIndex: dto.orderIndex ?? unitNumber,
      status: dto.status,
    };

    const res = await httpClient.post<any>('/content/units', payload);
    const newUnit: Unit = {
      id: res.id,
      courseLevelId: res.courseId,
      unitNumber: res.unitNumber,
      titleZh: res.titleZh,
      titleVi: res.titleVi,
      description: res.description || '',
      orderIndex: res.orderIndex,
      status: res.status,
      createdAt: res.createdAt,
      updatedAt: res.updatedAt || res.createdAt,
      lessonCount: 0,
      publishedLessonCount: 0,
    };

    units = [...units, newUnit];
    return newUnit;
  }

  async updateUnit(id: string, dto: UpdateUnitDTO): Promise<Unit> {
    const existing = units.find((u) => u.id === id);
    const payload = {
      unitNumber: existing?.unitNumber ?? 1,
      titleZh: dto.titleZh.trim(),
      titleVi: dto.titleVi.trim(),
      description: dto.description.trim(),
      orderIndex: dto.orderIndex,
      status: dto.status,
    };

    const res = await httpClient.put<any>(`/content/units/${id}`, payload);
    const updatedUnit: Unit = {
      id: res.id,
      courseLevelId: res.courseId,
      unitNumber: res.unitNumber,
      titleZh: res.titleZh,
      titleVi: res.titleVi,
      description: res.description || '',
      orderIndex: res.orderIndex,
      status: res.status,
      createdAt: res.createdAt,
      updatedAt: res.updatedAt || res.createdAt,
      lessonCount: existing?.lessonCount ?? 0,
      publishedLessonCount: existing?.publishedLessonCount ?? 0,
    };

    units = units.map((u) => (u.id === id ? updatedUnit : u));
    return updatedUnit;
  }

  async deleteUnit(id: string): Promise<boolean> {
    await httpClient.delete(`/content/units/${id}`);
    units = units.filter((u) => u.id !== id);
    return true;
  }

  // --- Lesson Real CRUD Persistence ---

  async createLesson(unitId: string, dto: UpdateLessonDTO): Promise<Lesson> {
    const unit = units.find((u) => u.id === unitId);
    const courseId = unit ? (courseLevels.find((cl) => cl.id === unit.courseLevelId)?.courseId || unit.courseLevelId) : courses[0]?.id;
    if (!courseId) {
      throw new Error('Không tìm thấy thông tin khóa học hợp lệ cho bài học.');
    }

    const courseUnitIds = new Set(units.filter((u) => u.courseLevelId === courseId).map((u) => u.id));
    const courseLessons = lessons.filter((l) => l.courseId === courseId || courseUnitIds.has(l.unitId));
    const nextLessonNumber = courseLessons.reduce((max, l) => Math.max(max, l.lessonNumber || 0), 0) + 1;
    const lessonNumber = dto.lessonNumber && dto.lessonNumber >= 1 ? Math.floor(dto.lessonNumber) : nextLessonNumber;

    const payload = {
      courseId,
      unitId,
      lessonNumber,
      titleZh: dto.titleZh.trim(),
      titleVi: dto.titleVi.trim(),
      pinyin: dto.pinyin?.trim() || '',
      durationMinutes: dto.durationMinutes,
      xpReward: dto.xpReward,
      orderIndex: dto.orderIndex ?? lessonNumber,
      status: 'DRAFT',
      summary: dto.summary.trim(),
      allowExceedStandardLimit: Boolean(dto.allowExceedStandardLimit),
    };

    const res = await httpClient.post<any>('/content/lessons', payload);
    const newLesson: Lesson = {
      id: res.id,
      courseId: res.courseId || courseId,
      unitId: res.unitId || unitId,
      lessonNumber: res.lessonNumber,
      titleZh: res.titleZh,
      titleVi: res.titleVi,
      pinyin: res.pinyin || '',
      durationMinutes: res.durationMinutes,
      xpReward: res.xpReward,
      orderIndex: res.orderIndex,
      status: res.status || 'DRAFT',
      summary: res.summary || '',
      linkedVocabularyCount: res.vocabularyCount ?? 0,
      linkedGrammarCount: res.grammarCount ?? 0,
      exerciseCount: res.exerciseCount ?? 0,
      createdAt: res.createdAt,
      updatedAt: res.updatedAt || res.createdAt,
    };

    lessons = [...lessons, newLesson];
    return newLesson;
  }

  async updateLesson(id: string, dto: UpdateLessonDTO): Promise<Lesson> {
    const existing = lessons.find((l) => l.id === id);
    const payload = {
      unitId: existing?.unitId || undefined,
      lessonNumber: dto.lessonNumber && dto.lessonNumber >= 1 ? Math.floor(dto.lessonNumber) : (existing?.lessonNumber ?? 1),
      titleZh: dto.titleZh.trim(),
      titleVi: dto.titleVi.trim(),
      pinyin: dto.pinyin !== undefined ? dto.pinyin.trim() : (existing?.pinyin || ''),
      durationMinutes: dto.durationMinutes,
      xpReward: dto.xpReward,
      orderIndex: dto.orderIndex,
      status: dto.status,
      summary: dto.summary.trim(),
    };

    const res = await httpClient.put<any>(`/content/lessons/${id}`, payload);
    const updatedLesson: Lesson = {
      id: res.id,
      courseId: res.courseId || existing?.courseId,
      unitId: res.unitId || existing?.unitId || '',
      lessonNumber: res.lessonNumber,
      titleZh: res.titleZh,
      titleVi: res.titleVi,
      pinyin: res.pinyin || '',
      durationMinutes: res.durationMinutes,
      xpReward: res.xpReward,
      orderIndex: res.orderIndex,
      status: res.status,
      summary: res.summary || '',
      linkedVocabularyCount: res.vocabularyCount ?? existing?.linkedVocabularyCount ?? 0,
      linkedGrammarCount: res.grammarCount ?? existing?.linkedGrammarCount ?? 0,
      exerciseCount: res.exerciseCount ?? existing?.exerciseCount ?? 0,
      createdAt: res.createdAt,
      updatedAt: res.updatedAt || res.createdAt,
    };

    lessons = lessons.map((l) => (l.id === id ? updatedLesson : l));
    return updatedLesson;
  }

  async deleteLesson(id: string): Promise<boolean> {
    await httpClient.delete(`/content/lessons/${id}`);
    lessons = lessons.filter((l) => l.id !== id);
    return true;
  }

  async publishLesson(lessonId: string): Promise<Lesson> {
    await httpClient.put<any>(`/content/lessons/${lessonId}/status`, {
      status: 'PUBLISHED',
    });
    lessons = lessons.map((l) => (l.id === lessonId ? { ...l, status: 'PUBLISHED' } : l));
    if (lessonDrafts[lessonId]) {
      lessonDrafts[lessonId].status = 'PUBLISHED';
    }
    return lessons.find((l) => l.id === lessonId)!;
  }

  // --- Lesson Editor Aggregate Storage & Operations ---

  async fetchLessonEditorData(lessonId: string): Promise<LessonEditorDraft> {
    const res = await httpClient.get<any>(`/content/lessons/${lessonId}`);
    if (!res || !res.id) {
      throw new Error(`Không tìm thấy dữ liệu bài học ${lessonId}`);
    }

    const safeJson = <T,>(raw: any, fallback: T): T => {
      if (raw === null || raw === undefined || raw === '') return fallback;
      if (typeof raw !== 'string') return raw as T;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return fallback;
      }
    };

    const parsedDialogue = safeJson<any>(res.dialogueJson, null);
    const dialogue = {
      ...(parsedDialogue && typeof parsedDialogue === 'object' ? parsedDialogue : {}),
      id: parsedDialogue?.id || `diag-${res.id}`,
      lessonId: res.id,
      title: parsedDialogue?.title || `Hội thoại bài ${res.lessonNumber}`,
      situationZh: parsedDialogue?.situationZh || '',
      situationVi: parsedDialogue?.situationVi || '',
      audioUrl: parsedDialogue?.audioUrl,
      lines: Array.isArray(parsedDialogue?.lines) ? parsedDialogue.lines : [],
    };

    const rawListenings = safeJson<any>(res.listeningJson, []);
    const listenings = Array.isArray(rawListenings)
      ? rawListenings
      : Array.isArray(rawListenings?.items)
      ? rawListenings.items
      : [];

    const vocabularies = (res.vocabularies || []).map((v: any, idx: number) => {
      const examples = safeJson<any[]>(v.examplesJson, Array.isArray(v.examples) ? v.examples : []);
      const vocabObj = {
        id: v.id,
        hskLevelId: `level-hsk-${v.hskLevel || 1}`,
        simplified: v.hanzi,
        traditional: v.traditional || v.hanzi,
        pinyin: v.pinyin || '',
        meaningVi: v.meaningVi || '',
        meaningEn: v.meaningEn || '',
        partOfSpeech: (v.partOfSpeech || 'NOUN') as any,
        audioUrl: v.audioUrl || '',
        status: (v.status || 'PUBLISHED') as any,
        examples: Array.isArray(examples) ? examples : [],
        source: 'Live SQL Server',
        createdAt: v.createdAt || new Date().toISOString(),
        updatedAt: v.updatedAt || new Date().toISOString(),
      };
      const firstEx = vocabObj.examples[0];
      return {
        id: `lv-${res.id}-${v.id}`,
        lessonId: res.id,
        vocabularyId: v.id,
        displayOrder: idx + 1,
        isCoreWord: idx < 5,
        customExampleZh: firstEx?.zh || '',
        customExamplePinyin: firstEx?.pinyin || '',
        customExampleVi: firstEx?.meaningVi || '',
        vocabulary: vocabObj,
      };
    });

    const grammars = (res.grammarPoints || []).map((g: any, idx: number) => {
      const examples = safeJson<any[]>(g.examplesJson, Array.isArray(g.examples) ? g.examples : []);
      const rawPractice = safeJson<any>(g.practiceJson, g.practiceQuestions ?? null);
      const practiceQuestions = Array.isArray(rawPractice)
        ? rawPractice
        : rawPractice && typeof rawPractice === 'object'
        ? [rawPractice]
        : [];
      const gpObj = {
        id: g.id,
        code: g.code || `GP-${idx + 1}`,
        title: g.title || '',
        pinyinTitle: g.pinyinTitle || '',
        hskLevelId: `level-hsk-${g.hskLevel || 1}`,
        category: (g.category || 'SENTENCE_STRUCTURE') as any,
        structureFormula: g.structureFormula || '',
        explanation: g.explanation || '',
        difficulty: (g.difficulty || 'BASIC') as any,
        status: (g.status || 'PUBLISHED') as any,
        examples: Array.isArray(examples) ? examples : [],
        practiceQuestions,
        linkedLessonIds: [res.id],
        createdAt: g.createdAt || new Date().toISOString(),
        updatedAt: g.updatedAt || new Date().toISOString(),
      };
      return {
        id: `lg-${res.id}-${g.id}`,
        lessonId: res.id,
        grammarPointId: g.id,
        displayOrder: idx + 1,
        lessonNotes: g.explanation || '',
        quickPractice: practiceQuestions[0]
          ? {
              question: practiceQuestions[0].question || '',
              options: Array.isArray(practiceQuestions[0].options) ? practiceQuestions[0].options : [],
              correctIndex: Number(practiceQuestions[0].correctIndex ?? 0),
              explanation: practiceQuestions[0].explanation || g.explanation || '',
            }
          : undefined,
        grammarPoint: gpObj,
      };
    });

    const exercises = (res.exercises || []).map((e: any, idx: number) => {
      const options = safeJson<string[]>(e.optionsJson, Array.isArray(e.options) ? e.options : []);
      const sharedExercise = {
        id: String(e.id),
        type: (e.type || 'multiple-choice') as any,
        title: e.title || '',
        instruction: e.instruction || '',
        promptHanzi: e.promptHanzi || '',
        promptPinyin: e.promptPinyin || '',
        promptVietnamese: e.promptVietnamese || '',
        audioUrl: e.audioUrl || '',
        options: Array.isArray(options) ? options : [],
        correctOptionIndex: e.correctOptionIndex ?? 0,
        explanation: e.explanation || '',
        xpReward: e.xpReward ?? 10,
      };
      return {
        id: `le-${res.id}-${e.id}`,
        lessonId: res.id,
        exerciseId: String(e.id),
        section: ((e.section || '').toUpperCase() === 'QUIZ' ? 'QUIZ' : 'PRACTICE') as 'PRACTICE' | 'QUIZ',
        displayOrder: idx + 1,
        points: e.xpReward ?? 10,
        exercise: sharedExercise,
      };
    });

    const draft: LessonEditorDraft = {
      lessonId: res.id,
      unitId: res.unitId,
      lessonNumber: res.lessonNumber,
      status: res.status,
      intro: {
        titleZh: res.titleZh,
        titleVi: res.titleVi,
        pinyinTitle: res.pinyin || '',
        summary: res.summary || '',
        durationMinutes: res.durationMinutes || 30,
        xpReward: res.xpReward || 50,
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
      vocabularies,
      grammars,
      dialogue,
      listenings,
      exercises,
      updatedAt: res.updatedAt || res.createdAt || new Date().toISOString(),
    };

    lessonDrafts[lessonId] = draft;
    return JSON.parse(JSON.stringify(draft));
  }

  getLessonEditorData(lessonId: string): LessonEditorDraft {
    if (lessonDrafts[lessonId]) {
      return JSON.parse(JSON.stringify(lessonDrafts[lessonId]));
    }

    const lesson = this.getLessonById(lessonId);
    if (!lesson) {
      throw new Error(`Không tìm thấy bài học: ${lessonId}`);
    }

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

  async saveLessonDraft(lessonId: string, draft: LessonEditorDraft): Promise<LessonEditorDraft> {
    const updatedDraft: LessonEditorDraft = {
      ...JSON.parse(JSON.stringify(draft)),
      updatedAt: new Date().toISOString(),
    };

    const lesson = lessons.find((l) => l.id === lessonId);
    const payload = {
      unitId: draft.unitId,
      lessonNumber: draft.lessonNumber || lesson?.lessonNumber || 1,
      titleZh: draft.intro.titleZh,
      titleVi: draft.intro.titleVi,
      pinyin: draft.intro.pinyinTitle || '',
      summary: draft.intro.summary || '',
      durationMinutes: draft.intro.durationMinutes,
      xpReward: draft.intro.xpReward,
      orderIndex: lesson?.orderIndex || draft.lessonNumber || 1,
      status: draft.status,
      dialogueJson: JSON.stringify(draft.dialogue),
      listeningJson: JSON.stringify(draft.listenings),
      linkedVocabularyIds: draft.vocabularies.map((v) => v.vocabularyId || v.id),
      linkedGrammarPointIds: draft.grammars.map((g) => g.grammarPointId || g.id),
      linkedExerciseIds: draft.exercises.map((e) => e.exerciseId || e.id),
    };

    await httpClient.put(`/content/lessons/${lessonId}`, payload);
    lessonDrafts[lessonId] = updatedDraft;

    if (lesson) {
      lessons = lessons.map((l) =>
        l.id === lessonId
          ? {
              ...l,
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
            }
          : l
      );
    }

    return JSON.parse(JSON.stringify(updatedDraft));
  }

  async submitLessonForReview(lessonId: string): Promise<LessonEditorDraft> {
    const draft = this.getLessonEditorData(lessonId);
    draft.status = 'PENDING_REVIEW';
    return this.saveLessonDraft(lessonId, draft);
  }

  async getCoursePublicationReadiness(hskLevel: number): Promise<CoursePublicationReadiness> {
    return httpClient.get<CoursePublicationReadiness>('/content/lessons/readiness', {
      params: { hskLevel },
    });
  }

  async batchReviewLessons(
    ids: string[],
    status: 'PENDING_REVIEW' | 'PUBLISHED' | 'DRAFT',
    reviewNotes?: string
  ): Promise<BatchLessonReviewResult> {
    return httpClient.post<BatchLessonReviewResult>('/content/lessons/batch-review', {
      ids,
      status,
      reviewNotes,
    });
  }
}

export const curriculumService = new CurriculumService();

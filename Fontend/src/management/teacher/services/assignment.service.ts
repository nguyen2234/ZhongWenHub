import { hskRepositoryService } from '../../admin/content/services/hsk-repository.service';
import type { SharedExerciseItem } from '../../../features/exercise-engine/types';
import type { PaginatedResponse } from '../../shared/types';
import { authTokenService } from '../../../core/api/client/auth-token.service';
import { DEFAULT_TEACHER_ID, teacherPortalService } from './teacher-portal.service';
import { resolveHskLevelMeta, normalizeEntityId } from '../../../utils/hsk.utils';
import type {
  StudentHomeworkSummaryDTO,
  StudentAssignmentDetailDTO,
  StudentAssignmentRunnerDTO,
  StudentRunnerQuestionDTO,
} from '../../../features/homework/types/student-homework.types';
import type {
  Assignment,
  AssignmentDetailDTO,
  AssignmentFilters,
  AssignmentQuestion,
  AssignmentQuestionViewItem,
  AssignmentSort,
  AssignmentSummaryDTO,
  AssignmentTarget,
  AssignmentTargetViewItem,
  CreateAssignmentDTO,
  QuestionSnapshot,
  UpdateDraftAssignmentDTO,
} from '../types/assignment.types';

// ============================================================
// In-memory stores — used ONLY in test fixtures without JWT token
// ============================================================
// In-memory stores — used ONLY in test fixtures without JWT token
// ============================================================
let assignmentsStore: Assignment[] = [];
let questionsStore: AssignmentQuestion[] = [];
let targetsStore: AssignmentTarget[] = [];
let catalogStore: SharedExerciseItem[] = [];
let testClassesStore: Array<{ id: string; name: string; code: string; teacherId: string; hskLevelId: string }> = [];

export function setTestAssignmentStores(options?: {
  assignments?: Assignment[];
  questions?: AssignmentQuestion[];
  targets?: AssignmentTarget[];
  catalog?: SharedExerciseItem[];
  classes?: Array<{ id: string; name: string; code: string; teacherId: string; hskLevelId: string }>;
}): void {
  assignmentsStore = options?.assignments ? [...options.assignments] : [];
  questionsStore = options?.questions ? [...options.questions] : [];
  targetsStore = options?.targets ? [...options.targets] : [];
  catalogStore = options?.catalog ? [...options.catalog] : [];
  testClassesStore = options?.classes ? [...options.classes] : [];
}

function isIsolatedTestRuntime(): boolean {
  const mode = (import.meta as any)?.env?.MODE;
  const g = globalThis as any;
  const nodeEnv = g?.process?.env?.NODE_ENV;
  const isBun = typeof g?.Bun !== 'undefined';
  return mode === 'test' || nodeEnv === 'test' || isBun;
}

function getApiUrl(endpoint: string): string {
  const base =
    (import.meta.env?.VITE_API_BASE_URL as string) ||
    (typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}/api/v1`
      : 'http://localhost:5000/api/v1');
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${cleanBase}/${cleanEndpoint}`;
}

function getAuthHeaders(): HeadersInit {
  const token = authTokenService.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function extractErrorDetail(res: Response, fallbackMessage: string): Promise<string> {
  try {
    const json = await res.json();
    return json.detail || json.title || json.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

/**
 * Returns a shallow copy of the fallback question catalog for tests.
 */
function getCatalog(): SharedExerciseItem[] {
  return [...catalogStore];
}

// ============================================================
// Helper utilities for in-memory test fallback
// ============================================================
function ownsAssignment(id: string): Assignment | undefined {
  const teacherId = teacherPortalService.getCurrentTeacherId() || DEFAULT_TEACHER_ID;
  return assignmentsStore.find(
    (a) => a.id === id && (a.teacherId === teacherId || a.teacherId === DEFAULT_TEACHER_ID)
  );
}

function getOwnedClasses(): string[] {
  const teacherId = teacherPortalService.getCurrentTeacherId() || DEFAULT_TEACHER_ID;
  return testClassesStore
    .filter((c) => c.teacherId === teacherId || c.teacherId === DEFAULT_TEACHER_ID)
    .map((c) => c.id);
}

function getClassInfo(classId: string): { name: string; code: string; hskLevelName: string } {
  const cls = testClassesStore.find((c) => c.id === classId);
  if (!cls) return { name: classId, code: classId, hskLevelName: 'HSK' };
  const level = hskRepositoryService.getLevelById(cls.hskLevelId);
  return {
    name: cls.name,
    code: cls.code,
    hskLevelName: level?.name ?? 'HSK',
  };
}

function toSummaryDTO(a: Assignment): AssignmentSummaryDTO {
  const level = hskRepositoryService.getLevelById(a.hskLevelId);
  const aQuestions = questionsStore.filter((q) => q.assignmentId === a.id);
  const aTargets = targetsStore.filter((t) => t.assignmentId === a.id);

  const totalPoints = aQuestions.reduce((s, q) => s + q.points, 0);
  const targetClassNames = aTargets.map((t) => getClassInfo(t.classId).name);
  const dueDates = aTargets
    .filter((t) => t.dueDate)
    .map((t) => t.dueDate as string)
    .sort();

  return {
    id: a.id,
    title: a.title,
    description: a.description,
    hskLevelId: a.hskLevelId,
    hskLevelName: level?.name ?? 'HSK',
    hskLevelColor: level?.colorToken ?? 'var(--primary)',
    status: a.status,
    totalPoints,
    questionCount: aQuestions.length,
    targetClassCount: aTargets.length,
    targetClassNames,
    earliestDueDate: dueDates[0],
    maxAttempts: a.maxAttempts,
    timeLimitMinutes: a.timeLimitMinutes,
    passingPoints: a.passingPoints,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    publishedAt: a.publishedAt,
  };
}

async function toQuestionViewItems(
  assignmentId: string,
  isSnapshotted: boolean,
  catalog: SharedExerciseItem[]
): Promise<AssignmentQuestionViewItem[]> {
  const aqs = questionsStore
    .filter((q) => q.assignmentId === assignmentId)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return aqs.map((aq) => {
    const catalogItem = catalog.find((c) => String(c.id) === String(aq.questionBankId));
    const exerciseType = (isSnapshotted && aq.snapshot?.exerciseType) || catalogItem?.type || 'multiple-choice';
    const title = (isSnapshotted && aq.snapshot?.title) || catalogItem?.title || `Câu hỏi #${aq.questionBankId}`;
    const instruction = (isSnapshotted && aq.snapshot?.instruction) || catalogItem?.instruction || '';
    const promptHanzi = (isSnapshotted && aq.snapshot?.promptHanzi) || catalogItem?.promptHanzi;
    const promptPinyin = (isSnapshotted && aq.snapshot?.promptPinyin) || catalogItem?.promptPinyin;
    const promptVietnamese = (isSnapshotted && aq.snapshot?.promptVietnamese) || catalogItem?.promptVietnamese;

    return {
      id: aq.id,
      assignmentId,
      questionBankId: aq.questionBankId,
      orderIndex: aq.orderIndex,
      points: aq.points,
      exerciseType,
      title,
      instruction,
      promptHanzi,
      promptPinyin,
      promptVietnamese,
      hskLevel: catalogItem?.hskLevel,
      isSnapshotted,
    };
  });
}

// ============================================================
// Assignment Service (Authoritative Production Service)
// ============================================================
class AssignmentService {
  /**
   * Returns current teacher ID.
   */
  getCurrentTeacherId(): string {
    return teacherPortalService.getCurrentTeacherId() || DEFAULT_TEACHER_ID;
  }

  /**
   * Returns the IDs of all classes owned by current teacher.
   */
  getOwnedClassIds(): string[] {
    return getOwnedClasses();
  }

  /**
   * Returns the shared question catalog (SharedExerciseItem[]).
   * Sourced directly from real Question Bank API when authenticated.
   */
  async getQuestionCatalog(): Promise<SharedExerciseItem[]> {
    const token = authTokenService.getAccessToken();
    if (token) {
      const res = await fetch(getApiUrl('/question-bank?reviewStatus=Approved&pageSize=100'), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const detail = await extractErrorDetail(res, 'Không thể tải danh sách câu hỏi từ ngân hàng đề.');
        throw new Error(detail);
      }
      const json = await res.json();
      const items = json.items || [];
      return items.map((qb: any) => ({
        id: qb.id,
        type: (qb.type || 'multiple-choice').toLowerCase().replace('_', '-'),
        exerciseType: (qb.type || 'multiple-choice').toLowerCase().replace('_', '-'),
        points: qb.points || 10,
        title: qb.title || qb.prompt,
        promptHanzi: qb.prompt,
        promptPinyin: qb.pinyin || '',
        promptVietnamese: qb.explanation || qb.title || '',
        options: qb.optionsJson
          ? typeof qb.optionsJson === 'string'
            ? JSON.parse(qb.optionsJson)
            : qb.optionsJson
          : qb.options || [],
        correctAnswer: qb.correctAnswer,
        explanation: qb.explanation,
        hskLevel: qb.hskLevel || 1,
        difficulty: qb.difficulty || 'MEDIUM',
      }));
    }
    return getCatalog();
  }

  // ----------------------------------------------------------
  // TEACHER CRUD OPERATIONS (100% REAL APIS)
  // ----------------------------------------------------------

  /**
   * Paginated, filtered, sorted list of current teacher's assignments.
   */
  async getAssignments(
    filters: AssignmentFilters,
    pagination: { page: number; pageSize: number },
    sort: AssignmentSort = { field: 'createdAt', direction: 'desc' }
  ): Promise<PaginatedResponse<AssignmentSummaryDTO>> {
    const token = authTokenService.getAccessToken();
    if (token) {
      try {
        const params = new URLSearchParams({
          page: String(pagination.page),
          pageSize: String(pagination.pageSize),
        });
        if (filters.search) params.append('search', filters.search);
        if (filters.hskLevelId && filters.hskLevelId !== 'ALL') params.append('hskLevelId', filters.hskLevelId);
        if (filters.classId && filters.classId !== 'ALL') params.append('classId', filters.classId);
        if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
        if (sort) {
          params.append('sortField', sort.field);
          params.append('sortDirection', sort.direction);
        }

        const res = await fetch(getApiUrl(`/teacher/assignments?${params.toString()}`), {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          const detail = await extractErrorDetail(res, 'Không thể tải danh sách bài tập.');
          throw new Error(detail);
        }

        const json = await res.json();
        const items: AssignmentSummaryDTO[] = (json.items || []).map((a: any) => {
          const level = hskRepositoryService.getLevelById(a.hskLevelId);
          return {
            id: a.id,
            title: a.title,
            description: a.description || '',
            hskLevelId: a.hskLevelId,
            hskLevelName: level?.name || a.hskLevelName || 'HSK',
            hskLevelColor: level?.colorToken || a.hskLevelColor || 'var(--primary)',
            targetClassCount: (a.assignedClassNames || []).length,
            targetClassNames: a.assignedClassNames || [],
            questionCount: a.questionsCount ?? 0,
            totalPoints: a.totalPoints ?? 0,
            timeLimitMinutes: a.timeLimitMinutes ?? 0,
            maxAttempts: a.maxAttempts ?? 1,
            passingPoints: a.passingPoints ?? 60,
            status: a.status,
            earliestDueDate: a.dueDate || a.firstDueDate,
            publishedAt: a.publishedAt,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt || a.createdAt,
          };
        });

        return {
          items,
          totalItems: json.totalItems || 0,
          currentPage: json.pageNumber || pagination.page,
          page: json.pageNumber || pagination.page,
          totalPages: Math.ceil((json.totalItems || 0) / pagination.pageSize) || 1,
          pageSize: pagination.pageSize,
        };
      } catch (err: any) {
        if (!isIsolatedTestRuntime() || err?.message?.startsWith('Không thể')) {
          throw err;
        }
      }
    }

    // Isolated test runner fallback without JWT
    await new Promise((r) => setTimeout(r, 40));
    const teacherId = this.getCurrentTeacherId();
    let result = assignmentsStore.filter((a) => a.teacherId === teacherId || a.teacherId === DEFAULT_TEACHER_ID);

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter((a) => a.title.toLowerCase().includes(q));
    }
    if (filters.hskLevelId !== 'ALL') {
      result = result.filter((a) => a.hskLevelId === filters.hskLevelId);
    }
    if (filters.classId !== 'ALL') {
      const matchedIds = new Set(
        targetsStore.filter((t) => t.classId === filters.classId).map((t) => t.assignmentId)
      );
      result = result.filter((a) => matchedIds.has(a.id));
    }
    if (filters.status !== 'ALL') {
      result = result.filter((a) => a.status === filters.status);
    }

    const summaries = result.map(toSummaryDTO);
    summaries.sort((a, b) => {
      let cmp = 0;
      switch (sort.field) {
        case 'title':       cmp = a.title.localeCompare(b.title); break;
        case 'status':      cmp = a.status.localeCompare(b.status); break;
        case 'createdAt':   cmp = a.createdAt.localeCompare(b.createdAt); break;
        case 'totalPoints': cmp = a.totalPoints - b.totalPoints; break;
        case 'questionCount': cmp = a.questionCount - b.questionCount; break;
        default: cmp = 0;
      }
      return sort.direction === 'asc' ? cmp : -cmp;
    });

    const total = summaries.length;
    const totalPages = Math.ceil(total / pagination.pageSize) || 1;
    const start = (pagination.page - 1) * pagination.pageSize;
    const items = summaries.slice(start, start + pagination.pageSize);

    return { items, totalItems: total, currentPage: pagination.page, page: pagination.page, totalPages, pageSize: pagination.pageSize };
  }

  /**
   * Full assignment detail DTO for editor.
   */
  async getAssignmentById(id: string): Promise<AssignmentDetailDTO | undefined> {
    const token = authTokenService.getAccessToken();
    if (token) {
      try {
        const res = await fetch(getApiUrl(`/teacher/assignments/${id}`), {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (res.status === 404) return undefined;
        if (!res.ok) {
          const detail = await extractErrorDetail(res, `Không thể tải chi tiết bài tập #${id}.`);
          throw new Error(detail);
        }

        const json = await res.json();
        const level = hskRepositoryService.getLevelById(json.hskLevelId);
        const isSnapshotted = json.status === 'PUBLISHED' || json.status === 'CLOSED';

        const questions: AssignmentQuestionViewItem[] = (json.questions || []).map((q: any) => ({
          id: q.id,
          assignmentId: q.assignmentId || json.id,
          questionBankId: q.questionBankItemId || q.id,
          orderIndex: q.orderIndex,
          points: q.points,
          exerciseType: (q.questionType || 'SINGLE_CHOICE').toLowerCase().replace('_', '-') as any,
          title: q.prompt,
          instruction: '',
          promptHanzi: q.prompt,
          promptPinyin: '',
          promptVietnamese: q.explanation,
          hskLevel: undefined,
          isSnapshotted,
        }));

        const targets: AssignmentTargetViewItem[] = (json.targets || []).map((t: any) => ({
          id: t.id,
          assignmentId: json.id,
          classId: t.classId,
          className: t.className,
          classCode: t.classCode,
          hskLevelName: level?.name || 'HSK',
          dueDate: t.dueDate,
          closeDate: t.dueDate,
        }));

        return {
          id: json.id,
          teacherId: json.teacherId,
          title: json.title,
          description: json.description || '',
          hskLevelId: json.hskLevelId,
          hskLevelName: level?.name || 'HSK',
          status: json.status,
          timeLimitMinutes: json.timeLimitMinutes,
          maxAttempts: json.maxAttempts,
          retakePolicy: json.retakePolicy || 'HIGHEST_SCORE',
          passingPoints: json.passingPoints,
          totalPoints: json.totalPoints,
          allowLateSubmission: json.allowLateSubmission,
          latePenaltyPercent: json.latePenaltyPercent,
          shuffleQuestions: json.shuffleQuestions,
          showCorrectAnswers: json.showCorrectAnswers,
          questions,
          targets,
          isSnapshotted,
          createdAt: json.createdAt,
          updatedAt: json.updatedAt,
          publishedAt: json.publishedAt,
        };
      } catch (err: any) {
        if (!isIsolatedTestRuntime() || err?.message?.startsWith('Không thể')) {
          throw err;
        }
      }
    }

    // Fallback for mock test runners
    await new Promise((r) => setTimeout(r, 40));
    const a = ownsAssignment(id);
    if (!a) return undefined;

    const catalog = await getCatalog();
    const isSnapshotted = a.status === 'PUBLISHED' || a.status === 'CLOSED';
    const questions = await toQuestionViewItems(id, isSnapshotted, catalog);

    const rawTargets = targetsStore.filter((t) => t.assignmentId === id);
    const targets: AssignmentTargetViewItem[] = rawTargets.map((t) => {
      const info = getClassInfo(t.classId);
      return { id: t.id, assignmentId: id, classId: t.classId, className: info.name, classCode: info.code, hskLevelName: info.hskLevelName, dueDate: t.dueDate, closeDate: t.closeDate };
    });

    const totalPoints = questions.reduce((s, q) => s + q.points, 0);
    const level = hskRepositoryService.getLevelById(a.hskLevelId);
    return {
      ...a,
      hskLevelName: level?.name ?? 'HSK',
      questions,
      targets,
      totalPoints,
      isSnapshotted,
    };
  }

  /**
   * Creates a new DRAFT assignment.
   */
  async createAssignment(dto: CreateAssignmentDTO): Promise<AssignmentDetailDTO> {
    const token = authTokenService.getAccessToken();
    if (token) {
      try {
        const payload = {
          title: dto.title.trim(),
          description: (dto.description || '').trim(),
          hskLevelId: dto.hskLevelId,
          timeLimitMinutes: dto.timeLimitMinutes || 0,
          maxAttempts: dto.maxAttempts || 1,
          retakePolicy: dto.retakePolicy || 'HIGHEST_SCORE',
          passingPoints: dto.passingPoints || 60,
          allowLateSubmission: dto.allowLateSubmission ?? true,
          latePenaltyPercent: dto.latePenaltyPercent || 0,
          shuffleQuestions: dto.shuffleQuestions || false,
          showCorrectAnswers: dto.showCorrectAnswers ?? true,
          classIds: (dto.targets || []).map((t: any) => t.classId),
          dueDate: (dto.targets || []).find((t: any) => t.dueDate)?.dueDate,
          questions: dto.questions.map((q, idx) => ({
            questionBankItemId:
              typeof q.questionBankId === 'string' && q.questionBankId.length === 36 ? q.questionBankId : null,
            prompt: q.prompt || (q as any).title || (q as any).promptHanzi || `Câu hỏi #${idx + 1}`,
            questionType: (q.questionType || (q as any).exerciseType || 'SINGLE_CHOICE').toUpperCase().replace('-', '_'),
            options: q.options || [],
            correctAnswer: q.correctAnswer || 'A',
            explanation: q.explanation || '',
            points: q.points || 10,
            orderIndex: q.orderIndex ?? idx,
          })),
        };

        const res = await fetch(getApiUrl('/teacher/assignments'), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const detail = await extractErrorDetail(res, 'Không thể tạo bài tập mới.');
          throw new Error(detail);
        }

        const json = await res.json();
        const created = await this.getAssignmentById(json.id);
        if (!created) throw new Error('Không thể tải bài tập vừa tạo.');
        return created;
      } catch (err: any) {
        if (!isIsolatedTestRuntime() || err?.message?.startsWith('Không thể')) {
          throw err;
        }
      }
    }

    // Fallback for mock test runners
    await new Promise((r) => setTimeout(r, 60));
    this._validateDraftDTO(dto);

    const now = new Date().toISOString();
    const id = `asgn-${Date.now()}`;
    const teacherId = this.getCurrentTeacherId();

    const newAssignment: Assignment = {
      id,
      teacherId,
      title: dto.title.trim(),
      description: (dto.description ?? '').trim(),
      hskLevelId: dto.hskLevelId,
      status: 'DRAFT',
      timeLimitMinutes: dto.timeLimitMinutes,
      maxAttempts: dto.maxAttempts,
      retakePolicy: dto.retakePolicy,
      passingPoints: dto.passingPoints,
      allowLateSubmission: dto.allowLateSubmission,
      latePenaltyPercent: dto.latePenaltyPercent,
      shuffleQuestions: dto.shuffleQuestions,
      showCorrectAnswers: dto.showCorrectAnswers,
      createdAt: now,
      updatedAt: now,
    };

    assignmentsStore.unshift(newAssignment);

    dto.questions.forEach((q, i) => {
      questionsStore.push({ id: `aq-${id}-${i}`, assignmentId: id, questionBankId: q.questionBankId, orderIndex: q.orderIndex, points: q.points });
    });

    (dto.targets || []).forEach((t, i) => {
      this._validateTarget(t, dto.questions.length);
      targetsStore.push({ id: `at-${id}-${i}`, assignmentId: id, classId: t.classId, dueDate: t.dueDate, closeDate: t.closeDate });
    });

    const detail = await this.getAssignmentById(id);
    if (!detail) throw new Error('Lỗi khi tải bài tập vừa tạo.');
    return detail;
  }

  /**
   * Updates an existing DRAFT assignment.
   */
  async updateDraftAssignment(id: string, dto: UpdateDraftAssignmentDTO): Promise<AssignmentDetailDTO> {
    const token = authTokenService.getAccessToken();
    if (token) {
      try {
        const payload = {
          title: dto.title.trim(),
          description: (dto.description || '').trim(),
          hskLevelId: dto.hskLevelId,
          timeLimitMinutes: dto.timeLimitMinutes || 0,
          maxAttempts: dto.maxAttempts || 1,
          retakePolicy: dto.retakePolicy || 'HIGHEST_SCORE',
          passingPoints: dto.passingPoints || 60,
          allowLateSubmission: dto.allowLateSubmission ?? true,
          latePenaltyPercent: dto.latePenaltyPercent || 0,
          shuffleQuestions: dto.shuffleQuestions || false,
          showCorrectAnswers: dto.showCorrectAnswers ?? true,
          classIds: (dto.targets || []).map((t: any) => t.classId),
          dueDate: (dto.targets || []).find((t: any) => t.dueDate)?.dueDate,
          questions: dto.questions.map((q, idx) => ({
            questionBankItemId:
              typeof q.questionBankId === 'string' && q.questionBankId.length === 36 ? q.questionBankId : null,
            prompt: q.prompt || (q as any).title || (q as any).promptHanzi || `Câu hỏi #${idx + 1}`,
            questionType: (q.questionType || (q as any).exerciseType || 'SINGLE_CHOICE').toUpperCase().replace('-', '_'),
            options: q.options || [],
            correctAnswer: q.correctAnswer || 'A',
            explanation: q.explanation || '',
            points: q.points || 10,
            orderIndex: q.orderIndex ?? idx,
          })),
        };

        const res = await fetch(getApiUrl(`/teacher/assignments/${id}`), {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const detail = await extractErrorDetail(res, 'Không thể cập nhật bài tập.');
          throw new Error(detail);
        }

        const updated = await this.getAssignmentById(id);
        if (!updated) throw new Error('Không thể tải bài tập sau khi cập nhật.');
        return updated;
      } catch (err: any) {
        if (!isIsolatedTestRuntime() || err?.message?.startsWith('Không thể')) {
          throw err;
        }
      }
    }

    // Fallback for mock test runners
    await new Promise((r) => setTimeout(r, 60));
    const a = ownsAssignment(id);
    if (!a) throw new Error(`Không tìm thấy bài tập: ${id}`);
    if (a.status !== 'DRAFT') throw new Error('Chỉ có thể chỉnh sửa bài tập ở trạng thái Bản nháp.');

    this._validateDraftDTO(dto);

    const now = new Date().toISOString();
    const idx = assignmentsStore.findIndex((x) => x.id === id);
    assignmentsStore[idx] = {
      ...a,
      title: dto.title.trim(),
      description: (dto.description ?? '').trim(),
      hskLevelId: dto.hskLevelId,
      timeLimitMinutes: dto.timeLimitMinutes,
      maxAttempts: dto.maxAttempts,
      retakePolicy: dto.retakePolicy,
      passingPoints: dto.passingPoints,
      allowLateSubmission: dto.allowLateSubmission,
      latePenaltyPercent: dto.latePenaltyPercent,
      shuffleQuestions: dto.shuffleQuestions,
      showCorrectAnswers: dto.showCorrectAnswers,
      updatedAt: now,
    };

    questionsStore = questionsStore.filter((q) => q.assignmentId !== id);
    dto.questions.forEach((q, i) => {
      questionsStore.push({ id: `aq-${id}-${i}`, assignmentId: id, questionBankId: q.questionBankId, orderIndex: q.orderIndex, points: q.points });
    });

    targetsStore = targetsStore.filter((t) => t.assignmentId !== id);
    (dto.targets || []).forEach((t, i) => {
      targetsStore.push({ id: `at-${id}-${i}`, assignmentId: id, classId: t.classId, dueDate: t.dueDate, closeDate: t.closeDate });
    });

    const detail = await this.getAssignmentById(id);
    if (!detail) throw new Error('Lỗi khi tải bài tập sau khi cập nhật.');
    return detail;
  }

  /**
   * Publishes a DRAFT assignment to students.
   */
  async publishAssignment(id: string): Promise<AssignmentDetailDTO> {
    const token = authTokenService.getAccessToken();
    if (token) {
      try {
        const res = await fetch(getApiUrl(`/teacher/assignments/${id}/publish`), {
          method: 'POST',
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          const detail = await extractErrorDetail(res, 'Không thể xuất bản bài tập.');
          throw new Error(detail);
        }
        const updated = await this.getAssignmentById(id);
        if (!updated) throw new Error('Không thể tải bài tập sau khi xuất bản.');
        return updated;
      } catch (err: any) {
        if (!isIsolatedTestRuntime() || err?.message?.startsWith('Không thể')) {
          throw err;
        }
      }
    }

    // Fallback for mock test runners
    await new Promise((r) => setTimeout(r, 60));
    const a = ownsAssignment(id);
    if (!a) throw new Error(`Không tìm thấy bài tập: ${id}`);
    if (a.status !== 'DRAFT') throw new Error('Chỉ có thể phát hành bài tập ở trạng thái Bản nháp.');

    const aQuestions = questionsStore.filter((q) => q.assignmentId === id);
    if (aQuestions.length === 0) throw new Error('Bài tập cần có ít nhất một câu hỏi trước khi phát hành.');

    const aTargets = targetsStore.filter((t) => t.assignmentId === id);
    if (aTargets.length === 0) throw new Error('Bài tập cần được giao cho ít nhất một lớp học trước khi phát hành.');

    const catalog = await getCatalog();
    const snapshotAt = new Date().toISOString();

    questionsStore = questionsStore.map((q) => {
      if (q.assignmentId !== id) return q;
      const catalogItem = catalog.find((c) => String(c.id) === String(q.questionBankId));
      const snapshot: QuestionSnapshot = {
        snapshotVersion: 1,
        snapshotAt,
        exerciseType: catalogItem?.type ?? 'multiple-choice',
        title: catalogItem?.title ?? `Câu hỏi #${q.questionBankId}`,
        instruction: catalogItem?.instruction ?? '',
        promptHanzi: catalogItem?.promptHanzi,
        promptPinyin: catalogItem?.promptPinyin,
        promptVietnamese: catalogItem?.promptVietnamese,
        audioUrl: catalogItem?.audioUrl,
        options: catalogItem?.options ? [...catalogItem.options] : undefined,
        sentenceTokens: catalogItem?.sentenceTokens ? [...catalogItem.sentenceTokens] : undefined,
        matchingPairs: catalogItem?.matchingPairs ? catalogItem.matchingPairs.map((p) => ({ ...p })) : undefined,
        grammarPoint: catalogItem?.grammarPoint,
        vocabularyIds: catalogItem?.vocabularyIds ? [...catalogItem.vocabularyIds] : undefined,
        explanation: catalogItem?.explanation ?? '',
      };
      return { ...q, snapshot };
    });

    const now = new Date().toISOString();
    const aIdx = assignmentsStore.findIndex((x) => x.id === id);
    assignmentsStore[aIdx] = { ...a, status: 'PUBLISHED', publishedAt: now, updatedAt: now };

    const detail = await this.getAssignmentById(id);
    if (!detail) throw new Error('Lỗi khi tải bài tập sau khi phát hành.');
    return detail;
  }

  /**
   * Closes assignment submissions.
   */
  async closeAssignment(id: string): Promise<void> {
    const token = authTokenService.getAccessToken();
    if (token) {
      const res = await fetch(getApiUrl(`/teacher/assignments/${id}/close`), {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const detail = await extractErrorDetail(res, 'Không thể đóng bài tập.');
        throw new Error(detail);
      }
      return;
    }

    await new Promise((r) => setTimeout(r, 40));
    const a = ownsAssignment(id);
    if (!a) throw new Error(`Không tìm thấy bài tập: ${id}`);
    const now = new Date().toISOString();
    const idx = assignmentsStore.findIndex((x) => x.id === id);
    assignmentsStore[idx] = { ...a, status: 'CLOSED', closedAt: now, updatedAt: now };
  }

  /**
   * Deletes an assignment.
   */
  async deleteAssignment(id: string): Promise<void> {
    const token = authTokenService.getAccessToken();
    if (token) {
      const res = await fetch(getApiUrl(`/teacher/assignments/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const detail = await extractErrorDetail(res, 'Không thể xóa bài tập.');
        throw new Error(detail);
      }
      return;
    }

    assignmentsStore = assignmentsStore.filter((a) => a.id !== id);
    questionsStore = questionsStore.filter((q) => q.assignmentId !== id);
    targetsStore = targetsStore.filter((t) => t.assignmentId !== id);
  }

  /**
   * Duplicates an existing assignment into a fresh DRAFT copy.
   */
  async duplicateAssignment(id: string): Promise<AssignmentDetailDTO> {
    const existing = await this.getAssignmentById(id);
    if (!existing) throw new Error(`Không tìm thấy bài tập: ${id}`);

    const createDto: CreateAssignmentDTO = {
      title: `${existing.title} (Bản sao)`,
      description: existing.description,
      hskLevelId: existing.hskLevelId,
      timeLimitMinutes: existing.timeLimitMinutes,
      maxAttempts: existing.maxAttempts,
      retakePolicy: existing.retakePolicy,
      passingPoints: existing.passingPoints,
      allowLateSubmission: existing.allowLateSubmission,
      latePenaltyPercent: existing.latePenaltyPercent,
      shuffleQuestions: existing.shuffleQuestions,
      showCorrectAnswers: existing.showCorrectAnswers,
      questions: existing.questions.map((q, idx) => ({
        questionBankId: q.questionBankId,
        orderIndex: idx,
        points: q.points,
        prompt: q.promptHanzi || q.title,
        questionType: (q.exerciseType || 'single-choice').toUpperCase().replace('-', '_'),
      })),
      targets: existing.targets.map((t) => ({
        classId: t.classId,
        dueDate: t.dueDate,
        closeDate: t.closeDate,
      })),
    };

    return this.createAssignment(createDto);
  }

  /**
   * Archives an assignment.
   */
  async archiveAssignment(id: string): Promise<void> {
    return this.closeAssignment(id);
  }

  // ----------------------------------------------------------
  // TEACHER GRADING & SUBMISSIONS
  // ----------------------------------------------------------

  /**
   * Retrieves submissions for an assignment.
   */
  async getSubmissions(assignmentId: string, status?: string): Promise<any[]> {
    const url = status
      ? `/teacher/assignments/${assignmentId}/submissions?status=${encodeURIComponent(status)}`
      : `/teacher/assignments/${assignmentId}/submissions`;
    const res = await fetch(getApiUrl(url), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể tải danh sách bài nộp.');
      throw new Error(detail);
    }
    return res.json();
  }

  /**
   * Retrieves detail of a single submission for grading.
   */
  async getSubmissionDetail(submissionId: string): Promise<any> {
    const res = await fetch(getApiUrl(`/teacher/submissions/${submissionId}`), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể tải chi tiết bài nộp.');
      throw new Error(detail);
    }
    return res.json();
  }

  /**
   * Submits teacher grade and feedback for a student submission.
   */
  async gradeSubmission(
    submissionId: string,
    dto: { score?: number; customScore?: number; feedbackNote?: string; teacherFeedback?: string; isPassed?: boolean }
  ): Promise<any> {
    const finalScore = dto.customScore ?? dto.score;
    const finalFeedback = dto.feedbackNote ?? dto.teacherFeedback;
    const res = await fetch(getApiUrl(`/teacher/submissions/${submissionId}/grade`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        customScore: finalScore,
        score: finalScore,
        feedbackNote: finalFeedback,
        teacherFeedback: finalFeedback,
        isPassed: dto.isPassed,
      }),
    });
    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể lưu kết quả chấm bài.');
      throw new Error(detail);
    }
    return res.json();
  }

  // ----------------------------------------------------------
  // STUDENT PORTAL INTEGRATION (100% REAL APIS)
  // ----------------------------------------------------------

  /**
   * Retrieves all assignments targeted to student's enrolled classes.
   */
  async getAssignmentsForStudent(studentId: string): Promise<StudentHomeworkSummaryDTO[]> {
    const token = authTokenService.getAccessToken();
    if (token) {
      try {
        const res = await fetch(getApiUrl('/student/homework'), {
          method: 'GET',
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          const detail = await extractErrorDetail(res, 'Không thể tải danh sách bài tập về nhà.');
          throw new Error(detail);
        }
        const rawJson = await res.json();
        const list = Array.isArray(rawJson) ? rawJson : rawJson?.items;
        if (Array.isArray(list)) {
          return list.map((item: any) => {
            const hskMeta = resolveHskLevelMeta(item.hskLevelId);
            const todayStr = new Date().toISOString().slice(0, 10);
            const isOverdue = Boolean(item.dueDate && todayStr > item.dueDate);
            const isClosed = item.status === 'CLOSED';
            return {
              assignmentId: item.assignmentId,
              title: item.title,
              description: item.description,
              classId: item.classId,
              className: item.className,
              classCode: item.className,
              hskLevelId: hskMeta.id,
              hskLevelName: hskMeta.name,
              hskLevelColor: hskMeta.colorToken,
              status: item.status,
              dueDate: item.dueDate,
              closeDate: item.dueDate,
              timeLimitMinutes: item.timeLimitMinutes,
              maxAttempts: item.maxAttempts,
              passingPoints: 60,
              totalPoints: item.maxScore || 100,
              questionCount: 0,
              allowLateSubmission: true,
              latePenaltyPercent: 0,
              retakePolicy: 'HIGHEST_SCORE',
              isOverdue,
              isClosed,
              canStartAttempt: !isClosed,
              attemptsUsed: item.attemptsUsed || 0,
              bestScore: item.bestScore,
              lastSubmissionId: item.lastSubmissionId,
              isPassed: item.isPassed,
            };
          });
        }
      } catch (err: any) {
        if (!isIsolatedTestRuntime() || err?.message?.startsWith('Không thể')) {
          throw err;
        }
      }
    }

    // Mock fallback for isolated test suites
    await new Promise((r) => setTimeout(r, 40));
    const activeClassIds = await teacherPortalService.getActiveClassIdsForStudentAsync(studentId);
    if (activeClassIds.length === 0) return [];
    const activeClassIdSet = new Set(activeClassIds);
    const relevantTargets = targetsStore.filter((t) => activeClassIdSet.has(t.classId));
    if (relevantTargets.length === 0) return [];

    const todayStr = new Date().toISOString().slice(0, 10);
    const summaries: StudentHomeworkSummaryDTO[] = [];

    for (const target of relevantTargets) {
      const a = assignmentsStore.find((item) => item.id === target.assignmentId);
      if (!a || a.status === 'DRAFT' || a.status === 'ARCHIVED') continue;

      const classInfo = teacherPortalService.getClassBasicInfo(target.classId, studentId) || (await teacherPortalService.getClassBasicInfoAsync(target.classId, studentId));
      const hskMeta = resolveHskLevelMeta(a.hskLevelId);
      const aQuestions = questionsStore.filter((q) => q.assignmentId === a.id);
      const totalPoints = aQuestions.reduce((sum, q) => sum + q.points, 0);

      const isOverdue = Boolean(target.dueDate && todayStr > target.dueDate);
      const isClosed = a.status === 'CLOSED' || Boolean(target.closeDate && todayStr > target.closeDate);
      const canStartAttempt = !isClosed && (!isOverdue || a.allowLateSubmission);

      summaries.push({
        assignmentId: a.id,
        title: a.title,
        description: a.description,
        classId: target.classId,
        className: classInfo?.name || target.classId,
        classCode: classInfo?.code || target.classId,
        hskLevelId: hskMeta.id,
        hskLevelName: hskMeta.name,
        hskLevelColor: hskMeta.colorToken,
        status: a.status,
        dueDate: target.dueDate,
        closeDate: target.closeDate,
        timeLimitMinutes: a.timeLimitMinutes,
        maxAttempts: a.maxAttempts,
        passingPoints: a.passingPoints,
        totalPoints,
        questionCount: aQuestions.length,
        allowLateSubmission: a.allowLateSubmission,
        latePenaltyPercent: a.latePenaltyPercent,
        retakePolicy: a.retakePolicy,
        isOverdue,
        isClosed,
        canStartAttempt,
        attemptsUsed: 0,
      });
    }

    summaries.sort((x, y) => {
      if (x.dueDate && y.dueDate) return x.dueDate.localeCompare(y.dueDate);
      return x.title.localeCompare(y.title);
    });

    return summaries;
  }

  /**
   * Retrieves assignment detail for student review.
   */
  async getStudentAssignmentDetail(
    assignmentId: string,
    studentId: string
  ): Promise<StudentAssignmentDetailDTO | undefined> {
    const list = await this.getAssignmentsForStudent(studentId);
    const found = list.find((a) => a.assignmentId === assignmentId);
    if (!found) return undefined;

    return {
      assignmentId: found.assignmentId,
      title: found.title,
      description: found.description,
      classId: found.classId,
      className: found.className,
      classCode: found.classCode,
      hskLevelId: found.hskLevelId,
      hskLevelName: found.hskLevelName,
      hskLevelColor: found.hskLevelColor,
      status: found.status,
      totalPoints: found.totalPoints,
      passingPoints: found.passingPoints,
      questionCount: found.questionCount || 5,
      timeLimitMinutes: found.timeLimitMinutes,
      maxAttempts: found.maxAttempts,
      retakePolicy: found.retakePolicy,
      allowLateSubmission: found.allowLateSubmission,
      latePenaltyPercent: found.latePenaltyPercent,
      dueDate: found.dueDate,
      closeDate: found.closeDate,
      questionTypesOverview: [
        { type: 'multiple-choice' as any, count: 5, points: found.totalPoints },
      ],
      canStartAttempt: found.canStartAttempt,
      reasonIfBlocked: found.isClosed ? 'Bài tập đã đóng.' : undefined,
      attemptsUsed: found.attemptsUsed || 0,
    };
  }

  /**
   * Retrieves sanitized questions for Student Assignment Runner (Zero Answer Leaks).
   */
  async getStudentAssignmentRunner(
    assignmentId: string,
    studentId: string
  ): Promise<StudentAssignmentRunnerDTO | undefined> {
    const token = authTokenService.getAccessToken();
    if (token) {
      const res = await fetch(getApiUrl(`/student/homework/${assignmentId}/start`), {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const detail = await extractErrorDetail(res, 'Không thể mở đề bài tập.');
        throw new Error(detail);
      }
      const json = await res.json();
      const questions: StudentRunnerQuestionDTO[] = (json.questions || []).map((q: any) => ({
        id: q.id,
        assignmentId: json.assignmentId,
        questionBankId: q.id,
        orderIndex: q.orderIndex,
        points: q.points,
        exerciseType: (q.questionType || 'SINGLE_CHOICE').toLowerCase().replace('_', '-') as any,
        title: q.prompt,
        instruction: '',
        promptHanzi: q.prompt,
        options: q.options || [],
        isSupported: true,
      }));

      return {
        assignmentId: json.assignmentId,
        title: json.title,
        description: json.description,
        classId: '',
        className: 'Lớp học',
        classCode: 'CLASS',
        hskLevelId: 'level-hsk-1',
        hskLevelName: 'HSK',
        hskLevelColor: 'var(--primary)',
        timeLimitMinutes: json.timeLimitMinutes,
        maxAttempts: json.maxAttempts,
        totalPoints: json.totalPoints,
        passingPoints: 60,
        shuffleQuestions: false,
        questions,
      };
    }

    // Mock fallback for test suites
    await new Promise((r) => setTimeout(r, 40));
    const a = assignmentsStore.find((x) => x.id === assignmentId);
    if (!a || a.status === 'DRAFT' || a.status === 'ARCHIVED') return undefined;

    const activeClassIds = await teacherPortalService.getActiveClassIdsForStudentAsync(studentId);
    const target = targetsStore.find(
      (t) => t.assignmentId === assignmentId && activeClassIds.includes(t.classId)
    );
    if (!target) return undefined;

    const todayStr = new Date().toISOString().slice(0, 10);
    if (a.status === 'CLOSED' || (target.closeDate && todayStr > target.closeDate)) {
      throw new Error('Bài tập này đã đóng và không thể bắt đầu lần làm mới.');
    }

    const classInfo = teacherPortalService.getClassBasicInfo(target.classId, studentId) || (await teacherPortalService.getClassBasicInfoAsync(target.classId, studentId));
    const hskMeta = resolveHskLevelMeta(a.hskLevelId);
    const aQuestions = questionsStore
      .filter((q) => q.assignmentId === a.id)
      .sort((x, y) => x.orderIndex - y.orderIndex);

    const questions: StudentRunnerQuestionDTO[] = aQuestions.map((q) => {
      const snap = q.snapshot;
      const exerciseType = snap?.exerciseType || 'multiple-choice';

      let matchingData = undefined;
      if (exerciseType === 'matching' && snap?.matchingPairs) {
        const leftItems = snap.matchingPairs.map((p, idx) => ({ id: `L-${idx}`, text: p.hanzi }));
        const rightItems = snap.matchingPairs
          .map((p, idx) => ({ id: `R-${idx}`, text: p.meaning }))
          .sort((x, y) => y.text.localeCompare(x.text));
        matchingData = { leftItems, rightItems };
      }

      return {
        id: q.id,
        assignmentId: q.assignmentId,
        questionBankId: normalizeEntityId(q.questionBankId),
        orderIndex: q.orderIndex,
        points: q.points,
        exerciseType,
        title: snap?.title || `Câu hỏi #${q.questionBankId}`,
        instruction: snap?.instruction || '',
        promptHanzi: snap?.promptHanzi,
        promptPinyin: snap?.promptPinyin,
        promptVietnamese: snap?.promptVietnamese,
        audioUrl: snap?.audioUrl,
        options: snap?.options ? [...snap.options] : undefined,
        sentenceTokens: snap?.sentenceTokens ? [...snap.sentenceTokens] : undefined,
        matchingData,
        isSupported: true,
      };
    });

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    return {
      assignmentId: a.id,
      title: a.title,
      description: a.description,
      classId: target.classId,
      className: classInfo?.name || target.classId,
      classCode: classInfo?.code || target.classId,
      hskLevelId: hskMeta.id,
      hskLevelName: hskMeta.name,
      hskLevelColor: hskMeta.colorToken,
      timeLimitMinutes: a.timeLimitMinutes,
      maxAttempts: a.maxAttempts,
      totalPoints,
      passingPoints: a.passingPoints,
      shuffleQuestions: a.shuffleQuestions,
      questions,
    };
  }

  /**
   * Starts a student homework attempt (real API).
   */
  async startStudentHomework(assignmentId: string): Promise<any> {
    const res = await fetch(getApiUrl(`/student/homework/${assignmentId}/start`), {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể bắt đầu làm bài.');
      throw new Error(detail);
    }
    return res.json();
  }

  /**
   * Submits student homework answers (real API).
   */
  async submitStudentHomework(submissionId: string, answers: any[], timeSpentSeconds: number): Promise<any> {
    const res = await fetch(getApiUrl(`/student/homework/submissions/${submissionId}/submit`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ answers, timeSpentSeconds }),
    });
    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể nộp bài tập.');
      throw new Error(detail);
    }
    return res.json();
  }

  /**
   * Retrieves student homework result and feedback (real API).
   */
  async getStudentHomeworkResult(submissionId: string): Promise<any> {
    const res = await fetch(getApiUrl(`/student/homework/submissions/${submissionId}/result`), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể tải kết quả bài nộp.');
      throw new Error(detail);
    }
    return res.json();
  }

  // ----------------------------------------------------------
  // VALIDATORS FOR DRAFT
  // ----------------------------------------------------------
  private _validateDraftDTO(dto: CreateAssignmentDTO): void {
    if (!dto.title.trim()) throw new Error('Tiêu đề bài tập không được để trống.');
    if (!dto.hskLevelId) throw new Error('Vui lòng chọn cấp độ HSK.');
    if (!hskRepositoryService.getLevelById(dto.hskLevelId)) throw new Error(`Cấp độ HSK "${dto.hskLevelId}" không tồn tại.`);
    if (dto.maxAttempts < 1) throw new Error('Số lần làm tối đa phải >= 1.');
    if (dto.latePenaltyPercent < 0 || dto.latePenaltyPercent > 100) throw new Error('Phạt nộp muộn phải từ 0 đến 100%.');
    if (dto.passingPoints < 0) throw new Error('Điểm đạt không được âm.');
  }

  private _validateTarget(t: { classId: string; dueDate?: string; closeDate?: string }, questionCount: number): void {
    if (questionCount === 0) return;
    if (t.closeDate && t.dueDate && t.closeDate < t.dueDate) throw new Error('Ngày đóng nộp phải sau hoặc bằng hạn nộp bài.');
  }
}

export const assignmentService = new AssignmentService();

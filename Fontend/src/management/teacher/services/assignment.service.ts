import { hskRepositoryService } from '../../admin/content/services/hsk-repository.service';
import type { SharedExerciseItem } from '../../../features/exercise-engine/types';
import type { PaginatedResponse } from '../../shared/types';
import { CURRENT_TEACHER_ID, INITIAL_TEACHING_CLASSES } from '../data/mockTeacherPortalData';
import { MOCK_QUESTION_CATALOG } from '../data/mockQuestionCatalog';
import {
  INITIAL_ASSIGNMENTS,
  INITIAL_ASSIGNMENT_QUESTIONS,
  INITIAL_ASSIGNMENT_TARGETS,
} from '../data/mockAssignmentData';
import { teacherPortalService } from './teacher-portal.service';
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
// In-memory stores — resets on page refresh (DEMO ONLY)
// ============================================================
let assignmentsStore: Assignment[] = [...INITIAL_ASSIGNMENTS];
let questionsStore: AssignmentQuestion[] = [...INITIAL_ASSIGNMENT_QUESTIONS];
let targetsStore: AssignmentTarget[] = [...INITIAL_ASSIGNMENT_TARGETS];

/**
 * Returns a shallow copy of the question catalog.
 */
function getCatalog(): SharedExerciseItem[] {
  return [...MOCK_QUESTION_CATALOG];
}

// ============================================================
// Helper utilities
// ============================================================
function ownsAssignment(id: string): Assignment | undefined {
  return assignmentsStore.find(
    (a) => a.id === id && a.teacherId === CURRENT_TEACHER_ID
  );
}

function getOwnedClasses(): string[] {
  return INITIAL_TEACHING_CLASSES
    .filter((c) => c.teacherId === CURRENT_TEACHER_ID)
    .map((c) => c.id);
}

function getClassInfo(classId: string): { name: string; code: string; hskLevelName: string } {
  const cls = INITIAL_TEACHING_CLASSES.find((c) => c.id === classId);
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
    // If published, prefer snapshot data; otherwise fall back to catalog
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
// Assignment Service
// ============================================================
class AssignmentService {
  /**
   * Returns the current teacher ID from the centralized mock auth context.
   */
  getCurrentTeacherId(): string {
    return CURRENT_TEACHER_ID;
  }

  /**
   * Returns the IDs of all classes owned by the current teacher.
   */
  getOwnedClassIds(): string[] {
    return getOwnedClasses();
  }

  /**
   * Returns the shared question catalog (SharedExerciseItem[]).
   * Sourced from the exercise-engine mock data; never exposes answer keys to student DTOs.
   */
  async getQuestionCatalog(): Promise<SharedExerciseItem[]> {
    return getCatalog();
  }

  // ----------------------------------------------------------
  // READ
  // ----------------------------------------------------------

  /**
   * Paginated, filtered, sorted list of the current teacher's assignments.
   */
  async getAssignments(
    filters: AssignmentFilters,
    pagination: { page: number; pageSize: number },
    sort: AssignmentSort = { field: 'createdAt', direction: 'desc' }
  ): Promise<PaginatedResponse<AssignmentSummaryDTO>> {
    await new Promise((r) => setTimeout(r, 60)); // simulate async

    let result = assignmentsStore.filter((a) => a.teacherId === CURRENT_TEACHER_ID);

    // Search
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter((a) => a.title.toLowerCase().includes(q));
    }

    // HSK filter
    if (filters.hskLevelId !== 'ALL') {
      result = result.filter((a) => a.hskLevelId === filters.hskLevelId);
    }

    // Class filter (match any target)
    if (filters.classId !== 'ALL') {
      const matchedIds = new Set(
        targetsStore
          .filter((t) => t.classId === filters.classId)
          .map((t) => t.assignmentId)
      );
      result = result.filter((a) => matchedIds.has(a.id));
    }

    // Status filter
    if (filters.status !== 'ALL') {
      result = result.filter((a) => a.status === filters.status);
    }

    // Map to DTO
    const summaries = result.map(toSummaryDTO);

    // Sort
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
   * Full detail DTO for the editor. Only accessible by the owner.
   */
  async getAssignmentById(id: string): Promise<AssignmentDetailDTO | undefined> {
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

  // ----------------------------------------------------------
  // CREATE
  // ----------------------------------------------------------

  /**
   * Creates a new DRAFT assignment owned by the current teacher.
   */
  async createAssignment(dto: CreateAssignmentDTO): Promise<AssignmentDetailDTO> {
    await new Promise((r) => setTimeout(r, 80));
    this._validateDraftDTO(dto);

    const now = new Date().toISOString();
    const id = `asgn-${Date.now()}`;

    const newAssignment: Assignment = {
      id,
      teacherId: CURRENT_TEACHER_ID,
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

    dto.targets.forEach((t, i) => {
      this._validateTarget(t, dto.questions.length);
      targetsStore.push({ id: `at-${id}-${i}`, assignmentId: id, classId: t.classId, dueDate: t.dueDate, closeDate: t.closeDate });
    });

    const detail = await this.getAssignmentById(id);
    if (!detail) throw new Error('Lỗi khi tải bài tập vừa tạo.');
    return detail;
  }

  // ----------------------------------------------------------
  // UPDATE DRAFT
  // ----------------------------------------------------------

  /**
   * Updates a DRAFT assignment. Published/Closed assignments cannot be edited.
   */
  async updateDraftAssignment(id: string, dto: UpdateDraftAssignmentDTO): Promise<AssignmentDetailDTO> {
    await new Promise((r) => setTimeout(r, 80));
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

    // Replace questions
    questionsStore = questionsStore.filter((q) => q.assignmentId !== id);
    dto.questions.forEach((q, i) => {
      questionsStore.push({ id: `aq-${id}-${i}`, assignmentId: id, questionBankId: q.questionBankId, orderIndex: q.orderIndex, points: q.points });
    });

    // Replace targets
    targetsStore = targetsStore.filter((t) => t.assignmentId !== id);
    dto.targets.forEach((t, i) => {
      targetsStore.push({ id: `at-${id}-${i}`, assignmentId: id, classId: t.classId, dueDate: t.dueDate, closeDate: t.closeDate });
    });

    const detail = await this.getAssignmentById(id);
    if (!detail) throw new Error('Lỗi khi tải bài tập sau khi cập nhật.');
    return detail;
  }

  // ----------------------------------------------------------
  // DUPLICATE
  // ----------------------------------------------------------

  /**
   * Creates a DRAFT copy of any assignment (regardless of original status).
   */
  async duplicateAssignment(id: string): Promise<AssignmentDetailDTO> {
    await new Promise((r) => setTimeout(r, 60));
    const a = ownsAssignment(id);
    if (!a) throw new Error(`Không tìm thấy bài tập: ${id}`);

    const now = new Date().toISOString();
    const newId = `asgn-${Date.now()}`;

    const copy: Assignment = {
      ...a,
      id: newId,
      title: `${a.title} (Bản sao)`,
      status: 'DRAFT',
      publishedAt: undefined,
      closedAt: undefined,
      createdAt: now,
      updatedAt: now,
    };

    assignmentsStore.unshift(copy);

    // Copy questions (without snapshots — draft starts fresh)
    const origQuestions = questionsStore.filter((q) => q.assignmentId === id);
    origQuestions.forEach((q, i) => {
      questionsStore.push({ id: `aq-${newId}-${i}`, assignmentId: newId, questionBankId: q.questionBankId, orderIndex: q.orderIndex, points: q.points });
    });

    // Do NOT copy targets — teacher must re-assign to classes for the new draft

    const detail = await this.getAssignmentById(newId);
    if (!detail) throw new Error('Lỗi khi tải bài tập vừa sao chép.');
    return detail;
  }

  // ----------------------------------------------------------
  // PUBLISH
  // ----------------------------------------------------------

  /**
   * Publishes a DRAFT assignment.
   * Creates immutable question snapshots from the catalog.
   * After publish, question content and points CANNOT be modified.
   * At least one question and one target class are required.
   */
  async publishAssignment(id: string): Promise<AssignmentDetailDTO> {
    await new Promise((r) => setTimeout(r, 100));
    const a = ownsAssignment(id);
    if (!a) throw new Error(`Không tìm thấy bài tập: ${id}`);
    if (a.status !== 'DRAFT') throw new Error('Chỉ có thể phát hành bài tập ở trạng thái Bản nháp.');

    const aQuestions = questionsStore.filter((q) => q.assignmentId === id);
    if (aQuestions.length === 0) throw new Error('Bài tập cần có ít nhất một câu hỏi trước khi phát hành.');

    const aTargets = targetsStore.filter((t) => t.assignmentId === id);
    if (aTargets.length === 0) throw new Error('Bài tập cần được giao cho ít nhất một lớp học trước khi phát hành.');

    const hasInvalidPoints = aQuestions.some((q) => q.points <= 0);
    if (hasInvalidPoints) throw new Error('Tất cả câu hỏi phải có điểm số hợp lệ (> 0) trước khi phát hành.');

    const totalPoints = aQuestions.reduce((s, q) => s + q.points, 0);
    if (a.passingPoints > totalPoints) throw new Error(`Điểm đạt (${a.passingPoints}) không được vượt quá tổng điểm (${totalPoints}).`);

    // Validate target dates
    aTargets.forEach((t) => {
      if (t.closeDate && t.dueDate && t.closeDate < t.dueDate) {
        throw new Error('Ngày đóng nộp phải sau hoặc bằng hạn nộp bài.');
      }
    });

    // Create immutable snapshots
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
        // Internal answer keys (never exposed to student-facing DTOs)
        _correctOptionIndex: catalogItem?.correctOptionIndex,
        _correctSentence: catalogItem?.correctSentence,
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

  // ----------------------------------------------------------
  // CLOSE
  // ----------------------------------------------------------

  async closeAssignment(id: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 50));
    const a = ownsAssignment(id);
    if (!a) throw new Error(`Không tìm thấy bài tập: ${id}`);
    if (a.status !== 'PUBLISHED') throw new Error('Chỉ có thể đóng bài tập đang ở trạng thái Đang phát hành.');

    const now = new Date().toISOString();
    const idx = assignmentsStore.findIndex((x) => x.id === id);
    assignmentsStore[idx] = { ...a, status: 'CLOSED', closedAt: now, updatedAt: now };
  }

  // ----------------------------------------------------------
  // ARCHIVE
  // ----------------------------------------------------------

  async archiveAssignment(id: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 50));
    const a = ownsAssignment(id);
    if (!a) throw new Error(`Không tìm thấy bài tập: ${id}`);
    if (a.status === 'ARCHIVED') throw new Error('Bài tập đã được lưu trữ.');

    const idx = assignmentsStore.findIndex((x) => x.id === id);
    assignmentsStore[idx] = { ...a, status: 'ARCHIVED', updatedAt: new Date().toISOString() };
  }

  // ----------------------------------------------------------
  // PRIVATE VALIDATORS
  // ----------------------------------------------------------

  private _validateDraftDTO(dto: CreateAssignmentDTO): void {
    if (!dto.title.trim()) throw new Error('Tiêu đề bài tập không được để trống.');
    if (!dto.hskLevelId) throw new Error('Vui lòng chọn cấp độ HSK.');
    if (!hskRepositoryService.getLevelById(dto.hskLevelId)) throw new Error(`Cấp độ HSK "${dto.hskLevelId}" không tồn tại.`);
    if (dto.maxAttempts < 1) throw new Error('Số lần làm tối đa phải >= 1.');
    if (dto.latePenaltyPercent < 0 || dto.latePenaltyPercent > 100) throw new Error('Phạt nộp muộn phải từ 0 đến 100%.');
    if (dto.passingPoints < 0) throw new Error('Điểm đạt không được âm.');

    // Validate questions
    const ids = dto.questions.map((q) => String(q.questionBankId));
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) throw new Error('Danh sách câu hỏi có câu bị trùng lặp.');
    dto.questions.forEach((q) => {
      if (q.points <= 0) throw new Error('Mỗi câu hỏi phải có điểm số lớn hơn 0.');
    });

    // Validate total points vs passing points
    if (dto.questions.length > 0) {
      const total = dto.questions.reduce((s, q) => s + q.points, 0);
      if (dto.passingPoints > total) throw new Error(`Điểm đạt (${dto.passingPoints}) không được vượt quá tổng điểm (${total}).`);
    }

    // Validate that target classes are owned
    const ownedClasses = new Set(getOwnedClasses());
    dto.targets.forEach((t) => {
      if (!ownedClasses.has(t.classId)) throw new Error(`Bạn không có quyền giao bài cho lớp: ${t.classId}`);
    });
  }

  private _validateTarget(t: { classId: string; dueDate?: string; closeDate?: string }, questionCount: number): void {
    if (questionCount === 0) return; // draft with no questions yet is fine
    if (t.closeDate && t.dueDate && t.closeDate < t.dueDate) throw new Error('Ngày đóng nộp phải sau hoặc bằng hạn nộp bài.');
  }

  // ============================================================
  // STUDENT PORTAL INTEGRATION (Phase 2B.1 Shared Access)
  // ============================================================

  /**
   * Retrieves all assignments targeted to classes that the student is actively enrolled in.
   * Excludes DRAFT and ARCHIVED assignments.
   */
  async getAssignmentsForStudent(studentId: string): Promise<StudentHomeworkSummaryDTO[]> {
    await new Promise((r) => setTimeout(r, 40));

    const activeClassIds = teacherPortalService.getActiveClassIdsForStudent(studentId);
    if (activeClassIds.length === 0) return [];

    const activeClassIdSet = new Set(activeClassIds);

    // Filter targets matching student's active classes
    const relevantTargets = targetsStore.filter((t) => activeClassIdSet.has(t.classId));
    if (relevantTargets.length === 0) return [];

    const todayStr = new Date().toISOString().slice(0, 10);
    const summaries: StudentHomeworkSummaryDTO[] = [];

    for (const target of relevantTargets) {
      const a = assignmentsStore.find((item) => item.id === target.assignmentId);
      // Strictly ignore non-published assignments (drafts & archives)
      if (!a || a.status === 'DRAFT' || a.status === 'ARCHIVED') continue;

      const classInfo = teacherPortalService.getClassBasicInfo(target.classId);
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

    // Sort by earliest dueDate, then title
    summaries.sort((x, y) => {
      if (x.dueDate && y.dueDate) return x.dueDate.localeCompare(y.dueDate);
      return x.title.localeCompare(y.title);
    });

    return summaries;
  }

  /**
   * Retrieves sanitized assignment detail for student review before starting attempt.
   * Strictly verifies student enrollment in the target class.
   */
  async getStudentAssignmentDetail(
    assignmentId: string,
    studentId: string
  ): Promise<StudentAssignmentDetailDTO | undefined> {
    await new Promise((r) => setTimeout(r, 40));

    const a = assignmentsStore.find((x) => x.id === assignmentId);
    if (!a || a.status === 'DRAFT' || a.status === 'ARCHIVED') return undefined;

    const activeClassIds = teacherPortalService.getActiveClassIdsForStudent(studentId);
    const target = targetsStore.find(
      (t) => t.assignmentId === assignmentId && activeClassIds.includes(t.classId)
    );
    if (!target) return undefined; // Student is not enrolled in targeted class

    const classInfo = teacherPortalService.getClassBasicInfo(target.classId);
    const hskMeta = resolveHskLevelMeta(a.hskLevelId);
    const aQuestions = questionsStore.filter((q) => q.assignmentId === a.id);
    const totalPoints = aQuestions.reduce((sum, q) => sum + q.points, 0);

    const todayStr = new Date().toISOString().slice(0, 10);
    const isOverdue = Boolean(target.dueDate && todayStr > target.dueDate);
    const isClosed = a.status === 'CLOSED' || Boolean(target.closeDate && todayStr > target.closeDate);
    const canStartAttempt = !isClosed && (!isOverdue || a.allowLateSubmission);

    // Group question types overview (count & points per type, NO questions or answers exposed)
    const typeMap = new Map<string, { count: number; points: number }>();
    aQuestions.forEach((q) => {
      const type = q.snapshot?.exerciseType || 'multiple-choice';
      const existing = typeMap.get(type) || { count: 0, points: 0 };
      typeMap.set(type, { count: existing.count + 1, points: existing.points + q.points });
    });

    const questionTypesOverview = Array.from(typeMap.entries()).map(([type, stats]) => ({
      type: type as any,
      count: stats.count,
      points: stats.points,
    }));

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
      status: a.status,
      totalPoints,
      passingPoints: a.passingPoints,
      questionCount: aQuestions.length,
      timeLimitMinutes: a.timeLimitMinutes,
      maxAttempts: a.maxAttempts,
      retakePolicy: a.retakePolicy,
      allowLateSubmission: a.allowLateSubmission,
      latePenaltyPercent: a.latePenaltyPercent,
      dueDate: target.dueDate,
      closeDate: target.closeDate,
      publishedAt: a.publishedAt,
      questionTypesOverview,
      canStartAttempt,
      reasonIfBlocked: isClosed
        ? 'Bài tập đã kết thúc thời gian nộp.'
        : isOverdue && !a.allowLateSubmission
        ? 'Đã quá hạn nộp bài.'
        : undefined,
      attemptsUsed: 0,
    };
  }

  /**
   * Retrieves sanitized questions for Student Assignment Runner.
   * EXPLICIT ALLOWLIST MAPPING: Strictly strips all correct answer keys, solutions, and explanations.
   */
  async getStudentAssignmentRunner(
    assignmentId: string,
    studentId: string
  ): Promise<StudentAssignmentRunnerDTO | undefined> {
    await new Promise((r) => setTimeout(r, 60));

    const a = assignmentsStore.find((x) => x.id === assignmentId);
    if (!a || a.status === 'DRAFT' || a.status === 'ARCHIVED') return undefined;

    const activeClassIds = teacherPortalService.getActiveClassIdsForStudent(studentId);
    const target = targetsStore.find(
      (t) => t.assignmentId === assignmentId && activeClassIds.includes(t.classId)
    );
    if (!target) return undefined;

    const todayStr = new Date().toISOString().slice(0, 10);
    if (a.status === 'CLOSED' || (target.closeDate && todayStr > target.closeDate)) {
      throw new Error('Bài tập này đã đóng và không thể bắt đầu lần làm mới.');
    }

    const classInfo = teacherPortalService.getClassBasicInfo(target.classId);
    const hskMeta = resolveHskLevelMeta(a.hskLevelId);
    const aQuestions = questionsStore
      .filter((q) => q.assignmentId === a.id)
      .sort((x, y) => x.orderIndex - y.orderIndex);

    const questions: StudentRunnerQuestionDTO[] = aQuestions.map((q) => {
      // Prioritize snapshot (published guarantee)
      const snap = q.snapshot;
      const exerciseType = snap?.exerciseType || 'multiple-choice';

      // Check capability flag for unsupported types
      let isSupported = true;
      let unsupportedReason: string | undefined;
      if (
        exerciseType === 'pronunciation' ||
        exerciseType === 'speaking' ||
        exerciseType === 'hanzi-writing'
      ) {
        isSupported = false;
        unsupportedReason =
          'Dạng bài tập này cần thiết bị ghi âm / vẽ nét chữ Hán (sẽ khả dụng trong Phase 3).';
      }

      // Matching data: independently shuffle left and right
      let matchingData = undefined;
      if (exerciseType === 'matching' && snap?.matchingPairs) {
        const leftItems = snap.matchingPairs.map((p, idx) => ({ id: `L-${idx}`, text: p.hanzi }));
        // Independent deterministic pseudo-shuffle for right items
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
        matchingPairs: snap?.matchingPairs
          ? snap.matchingPairs.map((p) => ({ id: p.id, hanzi: p.hanzi, meaning: p.meaning }))
          : undefined,
        isSupported,
        unsupportedReason,
        // SECURITY NOTE:
        // _correctOptionIndex, _correctSentence, and explanation are EXPLICITLY OMITTED.
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
      questions: a.shuffleQuestions ? [...questions].sort(() => 0.5 - Math.random()) : questions,
    };
  }
}

export const assignmentService = new AssignmentService();

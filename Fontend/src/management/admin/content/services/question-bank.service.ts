import { httpClient } from '../../../../core/api/client/http-client';
import { defaultApiConfig } from '../../../../core/api/client/api-config';
import { adminExerciseService } from './admin-exercise.service';
import type {
  AdminExerciseFilters,
  AdminExerciseItem,
  CreateAdminExerciseDTO,
  QuestionReviewStatus,
  UpdateAdminExerciseDTO,
} from '../types/admin-content.types';
import type { ContentStatus } from '../types/common-content.types';

export interface QuestionBankPageResponse {
  items: AdminExerciseItem[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface QuestionBankStats {
  total: number;
  published: number;
  draft: number;
  pendingReview: number;
  validatedReview: number;
  needsAcademicReview: number;
  approvedReview: number;
  rejectedReview: number;
  archived: number;
  withSubstantiveExplanation: number;
  reportedCount: number;
  linkedToLessons: number;
  standaloneBank: number;
  byHsk: Record<number, number>;
  bySkill: Record<string, number>;
  byType: Record<string, number>;
  byDifficulty: Record<string, number>;
  byReviewStatus: Record<string, number>;
}

export interface DuplicateCheckMatch {
  id: string;
  title: string;
  hskLevel: number;
  type: string;
  status: string;
  reviewStatus: string;
  promptHanzi?: string;
  matchReason: string;
}

export interface CheckDuplicatesResponse {
  hasDuplicates: boolean;
  contentHash: string;
  matches: DuplicateCheckMatch[];
}

export interface QuestionImportItemPayload {
  type: string;
  skill: string;
  hskLevel: number;
  difficulty?: string;
  title: string;
  instruction: string;
  promptHanzi?: string;
  promptPinyin?: string;
  promptVietnamese?: string;
  audioUrl?: string;
  options?: string[];
  correctOptionIndex?: number;
  correctAnswer?: string;
  explanation?: string;
  tags?: string;
  sourceId?: string;
  sourceLicense?: string;
}

export interface ImportQuestionsResult {
  dryRun: boolean;
  totalReceived: number;
  importedCount: number;
  duplicateSkippedCount: number;
  rejectedCount: number;
  importedIds: string[];
  rejections: { index: number; title: string; reason: string }[];
}

export interface GenerateQuestionsRequest {
  hskLevel: number;
  skill: string;
  type: string;
  difficulty: string;
  count: number;
  lessonId?: string;
  grammarPointId?: string;
  dryRun?: boolean;
}

export interface GenerateQuestionsResult {
  dryRun: boolean;
  requestedCount: number;
  generatedCount: number;
  duplicateSkippedCount: number;
  validationRejectedCount: number;
  generatorMode: string;
  previewItems: AdminExerciseItem[];
}

export interface BatchActionResult {
  requestedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
}

function normalizeDiffToUi(raw?: string): 'easy' | 'medium' | 'hard' {
  const v = (raw || '').toUpperCase();
  if (v === 'EASY') return 'easy';
  if (v === 'HARD') return 'hard';
  return 'medium';
}

function normalizeDiffToApi(raw?: string): string {
  const v = (raw || 'medium').toUpperCase();
  if (v === 'EASY' || v === 'HARD' || v === 'MEDIUM') return v;
  return 'MEDIUM';
}

function mapApiToAdminItem(e: any): AdminExerciseItem {
  let options: string[] = Array.isArray(e.options) ? e.options.map(String) : [];
  if (options.length === 0 && typeof e.optionsJson === 'string' && e.optionsJson.trim()) {
    try {
      const parsed = JSON.parse(e.optionsJson);
      if (Array.isArray(parsed)) options = parsed.map(String);
    } catch {
      options = [];
    }
  }

  return {
    id: String(e.id),
    type: (e.type || 'multiple-choice') as AdminExerciseItem['type'],
    skill: (e.skill || 'reading') as AdminExerciseItem['skill'],
    hskLevel: Number(e.hskLevel || 1),
    hskLevelId: `level-hsk-${e.hskLevel || 1}`,
    difficulty: normalizeDiffToUi(e.difficulty),
    status: (e.status || 'DRAFT') as ContentStatus,
    reviewStatus: (e.reviewStatus || 'DRAFT') as QuestionReviewStatus,
    tags: e.tags || undefined,
    sourceId: e.sourceId || undefined,
    sourceLicense: e.sourceLicense || undefined,
    qualityScore: typeof e.qualityScore === 'number' ? e.qualityScore : undefined,
    contentHash: e.contentHash || undefined,
    reviewNotes: e.reviewNotes || undefined,
    title: e.title || '',
    instruction: e.instruction || '',
    promptHanzi: e.promptHanzi || undefined,
    promptPinyin: e.promptPinyin || undefined,
    promptVietnamese: e.promptVietnamese || undefined,
    audioUrl: e.audioUrl || undefined,
    options,
    correctOptionIndex: e.correctOptionIndex ?? undefined,
    correctSentence: e.correctAnswer ?? e.correctSentence ?? undefined,
    explanation: e.explanation || '',
    hasSubstantiveExplanation: Boolean(e.hasSubstantiveExplanation),
    isReported: Boolean(e.isReported),
    grammarPointId: e.grammarPointId || undefined,
    grammarTitle: e.grammarTitle || undefined,
    lessonId: e.lessonId || undefined,
    lessonTitle: e.lessonTitle || undefined,
    vocabularyId: e.vocabularyId || undefined,
    vocabularyHanzi: e.vocabularyHanzi || undefined,
    xpReward: Number(e.xpReward || 10),
    createdAt: e.createdAt || new Date().toISOString(),
    updatedAt: e.updatedAt || e.createdAt || new Date().toISOString(),
  };
}

class QuestionBankService {
  private readonly baseEndpoint = '/question-bank';

  async getQuestionBankPage(
    filters: Partial<AdminExerciseFilters>,
    page = 1,
    pageSize = 20
  ): Promise<QuestionBankPageResponse> {
    if (defaultApiConfig.useMock) {
      const all = await adminExerciseService.getAllAsync(filters);
      const start = (page - 1) * pageSize;
      const items = all.slice(start, start + pageSize);
      return {
        items,
        totalItems: all.length,
        pageNumber: page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(all.length / pageSize)),
      };
    }

    const params: Record<string, string | number> = { page, pageSize };
    if (filters.hskLevel && filters.hskLevel !== 'ALL') params.hskLevel = filters.hskLevel;
    if (filters.skill && filters.skill !== 'ALL') params.skill = filters.skill;
    if (filters.type && filters.type !== 'ALL') params.type = filters.type;
    if (filters.difficulty && filters.difficulty !== 'ALL') params.difficulty = normalizeDiffToApi(filters.difficulty);
    if (filters.status && filters.status !== 'ALL') params.status = filters.status;
    if (filters.reviewStatus && filters.reviewStatus !== 'ALL') params.reviewStatus = filters.reviewStatus;
    if (filters.lessonId) params.lessonId = filters.lessonId;
    if (filters.grammarPointId) params.grammarPointId = filters.grammarPointId;
    if (filters.tag?.trim()) params.tag = filters.tag.trim();
    if (filters.search?.trim()) params.search = filters.search.trim();

    const res = await httpClient.get<any>(this.baseEndpoint, { params });
    const items = (Array.isArray(res?.items) ? res.items : []).map(mapApiToAdminItem);
    const totalItems = Number(res?.totalItems ?? items.length);
    return {
      items,
      totalItems,
      pageNumber: Number(res?.pageNumber ?? page),
      pageSize: Number(res?.pageSize ?? pageSize),
      totalPages: Number(res?.totalPages ?? Math.max(1, Math.ceil(totalItems / pageSize))),
    };
  }

  async getStats(): Promise<QuestionBankStats> {
    if (defaultApiConfig.useMock) {
      const s = await adminExerciseService.getStatsAsync();
      return {
        total: s.total,
        published: s.published,
        draft: s.draft,
        pendingReview: s.pending,
        validatedReview: 0,
        needsAcademicReview: 0,
        approvedReview: s.published,
        rejectedReview: 0,
        archived: s.archived,
        withSubstantiveExplanation: s.total,
        reportedCount: 0,
        linkedToLessons: 0,
        standaloneBank: s.total,
        byHsk: s.byHsk,
        bySkill: s.bySkill,
        byType: s.byType,
        byDifficulty: {},
        byReviewStatus: {},
      };
    }

    return httpClient.get<QuestionBankStats>(`${this.baseEndpoint}/stats`);
  }

  async create(dto: CreateAdminExerciseDTO): Promise<AdminExerciseItem> {
    if (defaultApiConfig.useMock) {
      return adminExerciseService.createAsync(dto);
    }

    const payload = {
      type: dto.type,
      skill: dto.skill,
      hskLevel: dto.hskLevel,
      difficulty: normalizeDiffToApi(dto.difficulty),
      status: dto.status || 'DRAFT',
      tags: dto.tags,
      sourceId: dto.sourceId,
      sourceLicense: dto.sourceLicense,
      title: dto.title,
      instruction: dto.instruction,
      promptHanzi: dto.promptHanzi,
      promptPinyin: dto.promptPinyin,
      promptVietnamese: dto.promptVietnamese,
      audioUrl: dto.audioUrl,
      options: dto.options,
      optionsJson: dto.options ? JSON.stringify(dto.options) : undefined,
      correctOptionIndex: dto.correctOptionIndex,
      correctAnswer: dto.correctSentence,
      explanation: dto.explanation,
      xpReward: dto.xpReward || 10,
      lessonId: dto.lessonId || null,
      grammarPointId: dto.grammarPointId || null,
      vocabularyId: dto.vocabularyId || null,
    };

    const res = await httpClient.post<any>(this.baseEndpoint, payload);
    return mapApiToAdminItem(res);
  }

  async update(id: string, dto: UpdateAdminExerciseDTO): Promise<AdminExerciseItem> {
    if (defaultApiConfig.useMock) {
      return adminExerciseService.updateAsync(id, dto);
    }

    const payload = {
      type: dto.type,
      skill: dto.skill,
      hskLevel: dto.hskLevel,
      difficulty: normalizeDiffToApi(dto.difficulty),
      status: dto.status || 'DRAFT',
      tags: dto.tags,
      sourceId: dto.sourceId,
      sourceLicense: dto.sourceLicense,
      title: dto.title,
      instruction: dto.instruction,
      promptHanzi: dto.promptHanzi,
      promptPinyin: dto.promptPinyin,
      promptVietnamese: dto.promptVietnamese,
      audioUrl: dto.audioUrl,
      options: dto.options,
      optionsJson: dto.options ? JSON.stringify(dto.options) : undefined,
      correctOptionIndex: dto.correctOptionIndex,
      correctAnswer: dto.correctSentence,
      explanation: dto.explanation,
      xpReward: dto.xpReward || 10,
      lessonId: dto.lessonId || null,
      grammarPointId: dto.grammarPointId || null,
      vocabularyId: dto.vocabularyId || null,
    };

    const res = await httpClient.put<any>(`${this.baseEndpoint}/${id}`, payload);
    return mapApiToAdminItem(res);
  }

  async delete(id: string): Promise<boolean> {
    if (defaultApiConfig.useMock) {
      return adminExerciseService.deleteAsync(id);
    }
    await httpClient.delete(`${this.baseEndpoint}/${id}`);
    return true;
  }

  async checkDuplicates(payload: {
    hskLevel: number;
    type: string;
    promptHanzi?: string;
    promptVietnamese?: string;
    correctAnswer?: string;
    excludeId?: string;
  }): Promise<CheckDuplicatesResponse> {
    return httpClient.post<CheckDuplicatesResponse>(`${this.baseEndpoint}/check-duplicates`, payload);
  }

  async importQuestions(
    items: QuestionImportItemPayload[],
    options?: { defaultSourceId?: string; defaultSourceLicense?: string; dryRun?: boolean }
  ): Promise<ImportQuestionsResult> {
    return httpClient.post<ImportQuestionsResult>(`${this.baseEndpoint}/import`, {
      items,
      defaultSourceId: options?.defaultSourceId,
      defaultSourceLicense: options?.defaultSourceLicense,
      dryRun: Boolean(options?.dryRun),
    });
  }

  async exportQuestions(filters?: Partial<AdminExerciseFilters>): Promise<AdminExerciseItem[]> {
    const params: Record<string, string | number> = { limit: 2000 };
    if (filters?.hskLevel && filters.hskLevel !== 'ALL') params.hskLevel = filters.hskLevel;
    if (filters?.skill && filters.skill !== 'ALL') params.skill = filters.skill;
    if (filters?.status && filters.status !== 'ALL') params.status = filters.status;
    if (filters?.reviewStatus && filters.reviewStatus !== 'ALL') params.reviewStatus = filters.reviewStatus;

    const res = await httpClient.get<any[]>(`${this.baseEndpoint}/export`, { params });
    return (Array.isArray(res) ? res : []).map(mapApiToAdminItem);
  }

  async generateQuestions(req: GenerateQuestionsRequest): Promise<GenerateQuestionsResult> {
    const res = await httpClient.post<any>(`${this.baseEndpoint}/generate`, req);
    return {
      ...res,
      previewItems: (Array.isArray(res?.previewItems) ? res.previewItems : []).map(mapApiToAdminItem),
    };
  }

  async reviewQuestion(
    id: string,
    decision: 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW' | 'VALIDATED' | 'NEEDS_ACADEMIC_REVIEW',
    reviewNotes?: string,
    publishImmediately = false
  ): Promise<AdminExerciseItem> {
    const res = await httpClient.post<any>(`${this.baseEndpoint}/${id}/review`, {
      decision,
      reviewNotes,
      publishImmediately,
    });
    return mapApiToAdminItem(res);
  }

  async batchReview(
    questionIds: string[],
    decision: 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW' | 'VALIDATED' | 'NEEDS_ACADEMIC_REVIEW',
    reviewNotes?: string,
    publishImmediately = false
  ): Promise<BatchActionResult> {
    return httpClient.post<BatchActionResult>(`${this.baseEndpoint}/batch-review`, {
      questionIds,
      decision,
      reviewNotes,
      publishImmediately,
    });
  }

  async reportQuestion(
    id: string,
    reason: string,
    details?: string
  ): Promise<{ questionId: string; reviewStatus: string; tags: string; message: string }> {
    return httpClient.post(`${this.baseEndpoint}/${id}/report`, { reason, details });
  }

  async publishQuestion(id: string): Promise<AdminExerciseItem> {
    const res = await httpClient.post<any>(`${this.baseEndpoint}/${id}/publish`, {});
    return mapApiToAdminItem(res);
  }

  async batchPublish(questionIds: string[]): Promise<BatchActionResult> {
    return httpClient.post<BatchActionResult>(`${this.baseEndpoint}/batch-publish`, questionIds);
  }
}

export const questionBankService = new QuestionBankService();


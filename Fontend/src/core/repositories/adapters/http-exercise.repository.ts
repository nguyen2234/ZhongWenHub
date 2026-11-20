import { httpClient } from '../../api/client/http-client';
import type {
  AdminExerciseItem,
  AdminExerciseFilters,
  CreateAdminExerciseDTO,
  UpdateAdminExerciseDTO,
} from '../../../management/admin/content/types/admin-content.types';
import type {
  IExerciseRepository,
  AdminExerciseStats,
} from '../interfaces/exercise-repository.interface';

/**
 * ASP.NET Core HTTP Implementation of IExerciseRepository.
 * Maps live SQL Server endpoints (/api/v1/content/exercises or /api/v1/admin/exercises).
 */
export class HttpExerciseRepository implements IExerciseRepository {
  private endpoint = '/admin/exercises';

  private mapDtoToAdminExercise(e: any): AdminExerciseItem {
    let options: string[] = [];
    if (typeof e.optionsJson === 'string' && e.optionsJson) {
      try {
        options = JSON.parse(e.optionsJson);
      } catch {
        options = [];
      }
    } else if (Array.isArray(e.options)) {
      options = e.options;
    }

    return {
      id: e.id,
      type: e.type || 'multiple-choice',
      skill: e.skill || 'reading',
      hskLevel: e.hskLevel || 1,
      hskLevelId: `level-hsk-${e.hskLevel || 1}`,
      difficulty: e.difficulty || 'easy',
      status: e.status || 'PUBLISHED',
      title: e.title,
      instruction: e.instruction || '',
      promptHanzi: e.promptHanzi,
      promptPinyin: e.promptPinyin,
      promptVietnamese: e.promptVietnamese,
      audioUrl: e.audioUrl,
      options,
      correctOptionIndex: e.correctOptionIndex,
      correctSentence: e.correctAnswer,
      explanation: e.explanation || '',
      grammarPointId: e.grammarPointId,
      lessonId: e.lessonId,
      xpReward: e.xpReward || 10,
      createdAt: e.createdAt || new Date().toISOString(),
      updatedAt: e.updatedAt || e.createdAt || new Date().toISOString(),
    };
  }

  async getAll(filters?: Partial<AdminExerciseFilters>): Promise<AdminExerciseItem[]> {
    const params: Record<string, string | number | boolean> = {
      pageSize: 100,
    };
    if (filters?.search) params.search = filters.search;
    if (filters?.hskLevel && filters.hskLevel !== 'ALL') params.hskLevel = filters.hskLevel;
    if (filters?.skill && filters.skill !== 'ALL') params.skill = filters.skill;
    if (filters?.type && filters.type !== 'ALL') params.type = filters.type;
    if (filters?.status && filters.status !== 'ALL') params.status = filters.status;
    if (filters?.lessonId) params.lessonId = filters.lessonId;
    if (filters?.grammarPointId) params.grammarPointId = filters.grammarPointId;

    const res = await httpClient.get<any>(this.endpoint, { params });
    const rawList: any[] = Array.isArray(res) ? res : (res?.items || []);
    return rawList.map((e) => this.mapDtoToAdminExercise(e));
  }

  async getById(id: string): Promise<AdminExerciseItem | undefined> {
    try {
      const e = await httpClient.get<any>(`${this.endpoint}/${id}`);
      if (!e) return undefined;
      return this.mapDtoToAdminExercise(e);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'status' in err && (err as { status: number }).status === 404) {
        return undefined;
      }
      throw err;
    }
  }

  async create(dto: CreateAdminExerciseDTO): Promise<AdminExerciseItem> {
    const payload = {
      type: dto.type,
      skill: dto.skill,
      hskLevel: dto.hskLevel,
      title: dto.title,
      instruction: dto.instruction,
      promptHanzi: dto.promptHanzi,
      promptPinyin: dto.promptPinyin,
      promptVietnamese: dto.promptVietnamese,
      audioUrl: dto.audioUrl,
      optionsJson: JSON.stringify(dto.options || []),
      correctOptionIndex: dto.correctOptionIndex,
      correctAnswer: dto.correctSentence,
      explanation: dto.explanation,
      xpReward: dto.xpReward || 10,
      status: dto.status || 'PUBLISHED',
      lessonId: dto.lessonId || null,
      grammarPointId: dto.grammarPointId || null,
    };

    const created = await httpClient.post<any>(this.endpoint, payload);
    return this.mapDtoToAdminExercise(created);
  }

  async update(id: string, dto: UpdateAdminExerciseDTO): Promise<AdminExerciseItem> {
    const payload = {
      type: dto.type,
      skill: dto.skill,
      hskLevel: dto.hskLevel,
      title: dto.title,
      instruction: dto.instruction,
      promptHanzi: dto.promptHanzi,
      promptPinyin: dto.promptPinyin,
      promptVietnamese: dto.promptVietnamese,
      audioUrl: dto.audioUrl,
      optionsJson: dto.options ? JSON.stringify(dto.options) : undefined,
      correctOptionIndex: dto.correctOptionIndex,
      correctAnswer: dto.correctSentence,
      explanation: dto.explanation,
      xpReward: dto.xpReward,
      status: dto.status,
      lessonId: dto.lessonId || null,
      grammarPointId: dto.grammarPointId || null,
    };

    const updated = await httpClient.put<any>(`${this.endpoint}/${id}`, payload);
    return this.mapDtoToAdminExercise(updated);
  }

  async delete(id: string): Promise<boolean> {
    await httpClient.delete<void>(`${this.endpoint}/${id}`);
    return true;
  }

  async getStats(): Promise<AdminExerciseStats> {
    const s = await httpClient.get<any>(`${this.endpoint}/stats`);
    return {
      total: s.totalExercises ?? s.total ?? 0,
      published: s.publishedExercises ?? s.published ?? 0,
      draft: s.draftExercises ?? s.draft ?? 0,
      pending: s.pendingReviewExercises ?? s.pending ?? 0,
      archived: s.archivedExercises ?? s.archived ?? 0,
      bySkill: s.bySkill || {},
      byType: s.byType || {},
      byHsk: s.byHsk || {},
    };
  }

  async resetToDefault(): Promise<void> {
    try {
      await httpClient.post<void>(`${this.endpoint}/reset-default`);
    } catch {
      // Endpoint may not exist on live backend in production, ignore
    }
  }
}

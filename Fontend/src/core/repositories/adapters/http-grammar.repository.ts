import { httpClient } from '../../api/client/http-client';
import type {
  AdminGrammarPoint,
  AdminGrammarFilters,
  CreateAdminGrammarDTO,
  UpdateAdminGrammarDTO,
  GrammarCategory,
} from '../../../management/admin/content/types/admin-content.types';
import type {
  IGrammarRepository,
  AdminGrammarStats,
} from '../interfaces/grammar-repository.interface';

/**
 * ASP.NET Core HTTP Implementation of IGrammarRepository.
 * Maps live SQL Server endpoints (/api/v1/content/grammar or /api/v1/admin/grammar).
 */
export class HttpGrammarRepository implements IGrammarRepository {
  private endpoint = '/admin/grammar';

  private mapDtoToAdminGrammar(g: any): AdminGrammarPoint {
    let examples = [];
    if (typeof g.examplesJson === 'string' && g.examplesJson) {
      try {
        examples = JSON.parse(g.examplesJson);
      } catch {
        examples = [];
      }
    } else if (Array.isArray(g.examples)) {
      examples = g.examples;
    }

    let practice = undefined;
    if (typeof g.practiceJson === 'string' && g.practiceJson) {
      try {
        practice = JSON.parse(g.practiceJson);
      } catch {
        practice = undefined;
      }
    } else if (g.practice) {
      practice = g.practice;
    }

    return {
      id: g.id,
      code: g.code || `g-${g.id?.substring(0, 8)}`,
      title: g.title,
      pinyinTitle: g.pinyinTitle || '',
      hskLevel: g.hskLevel || 1,
      hskLevelId: `level-hsk-${g.hskLevel || 1}`,
      category: (g.category as GrammarCategory) || 'cơ bản',
      structureFormula: g.structureFormula || '',
      explanation: g.explanation || '',
      difficulty: g.difficulty || 'Dễ',
      status: g.status || 'PUBLISHED',
      examples,
      practice,
      linkedLessonIds: g.lessonId ? [g.lessonId] : [],
      linkedExerciseIds: [],
      createdAt: g.createdAt || new Date().toISOString(),
      updatedAt: g.updatedAt || g.createdAt || new Date().toISOString(),
    };
  }

  async getAll(filters?: Partial<AdminGrammarFilters>): Promise<AdminGrammarPoint[]> {
    const params: Record<string, string | number | boolean> = {
      pageSize: 100,
    };
    if (filters?.search) params.search = filters.search;
    if (filters?.hskLevel && filters.hskLevel !== 'ALL') params.hskLevel = filters.hskLevel;
    if (filters?.category && filters.category !== 'ALL') params.category = filters.category;
    if (filters?.status && filters.status !== 'ALL') params.status = filters.status;

    const res = await httpClient.get<any>(this.endpoint, { params });
    const rawList: any[] = Array.isArray(res) ? res : (res?.items || []);
    return rawList.map((g) => this.mapDtoToAdminGrammar(g));
  }

  async getById(id: string): Promise<AdminGrammarPoint | undefined> {
    try {
      const g = await httpClient.get<any>(`${this.endpoint}/${id}`);
      if (!g) return undefined;
      return this.mapDtoToAdminGrammar(g);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'status' in err && (err as { status: number }).status === 404) {
        return undefined;
      }
      throw err;
    }
  }

  async create(dto: CreateAdminGrammarDTO): Promise<AdminGrammarPoint> {
    const payload = {
      code: dto.code || `g-hsk${dto.hskLevel}-${Date.now().toString().slice(-4)}`,
      title: dto.title,
      pinyinTitle: dto.pinyinTitle || '',
      hskLevel: dto.hskLevel || 1,
      category: dto.category || 'cơ bản',
      structureFormula: dto.structureFormula || '',
      explanation: dto.explanation || '',
      difficulty: dto.difficulty || 'Dễ',
      examplesJson: JSON.stringify(dto.examples || []),
      practiceJson: dto.practice ? JSON.stringify(dto.practice) : null,
      status: dto.status || 'PUBLISHED',
      lessonId: dto.linkedLessonIds?.[0] || null,
    };

    const created = await httpClient.post<any>(this.endpoint, payload);
    return this.mapDtoToAdminGrammar(created);
  }

  async update(id: string, dto: UpdateAdminGrammarDTO): Promise<AdminGrammarPoint> {
    const payload = {
      title: dto.title,
      pinyinTitle: dto.pinyinTitle || '',
      hskLevel: dto.hskLevel || 1,
      category: dto.category || 'cơ bản',
      structureFormula: dto.structureFormula || '',
      explanation: dto.explanation || '',
      difficulty: dto.difficulty || 'Dễ',
      examplesJson: dto.examples ? JSON.stringify(dto.examples) : undefined,
      practiceJson: dto.practice ? JSON.stringify(dto.practice) : undefined,
      status: dto.status || 'PUBLISHED',
      lessonId: dto.linkedLessonIds?.[0] || null,
    };

    const updated = await httpClient.put<any>(`${this.endpoint}/${id}`, payload);
    return this.mapDtoToAdminGrammar(updated);
  }

  async delete(id: string): Promise<boolean> {
    await httpClient.delete<void>(`${this.endpoint}/${id}`);
    return true;
  }

  async getStats(): Promise<AdminGrammarStats> {
    const s = await httpClient.get<any>(`${this.endpoint}/stats`);
    return {
      total: s.totalGrammarPoints ?? s.total ?? 0,
      published: s.publishedGrammarPoints ?? s.published ?? 0,
      draft: s.draftGrammarPoints ?? s.draft ?? 0,
      pending: s.pendingReviewGrammarPoints ?? s.pending ?? 0,
      archived: s.archivedGrammarPoints ?? s.archived ?? 0,
      byHsk: s.byHsk || {},
      byCategory: s.byCategory || {},
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

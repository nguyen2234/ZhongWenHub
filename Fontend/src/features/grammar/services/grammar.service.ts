import type { GrammarPoint, GrammarExample, GrammarPracticeExercise } from '../types/grammar.types';
import { MOCK_GRAMMAR_POINTS } from '../mock/mockGrammarData';
import { httpClient } from '../../../core/api/client/http-client';
import { defaultApiConfig } from '../../../core/api/client/api-config';

export interface GrammarFilterParams {
  hskLevel?: number | null;
  category?: string | null;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}

export interface GrammarListResponse {
  items: GrammarPoint[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

function parseExamples(raw: string | undefined): GrammarExample[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => ({
      chinese: item.chinese || item.zh || item.hanzi || '',
      pinyin: item.pinyin || '',
      vietnamese: item.vietnamese || item.meaningVi || item.meaning || '',
    }));
  } catch {
    return [];
  }
}

function parsePractice(raw: string | undefined): GrammarPracticeExercise | undefined {
  if (!raw) return undefined;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object') return undefined;
    return {
      prompt: parsed.prompt || '',
      scrambledWords: parsed.scrambledWords || [],
      standardAnswer: parsed.standardAnswer || '',
      acceptableAnswers: parsed.acceptableAnswers || [],
      hint: parsed.hint,
      explanation: parsed.explanation || '',
    };
  } catch {
    return undefined;
  }
}

export class GrammarService {
  /**
   * Async method fetching real PUBLISHED grammar points from Backend SQL Server.
   * Gracefully falls back if in test fixture environment.
   */
  static async fetchGrammarPointsAsync(params: GrammarFilterParams = {}): Promise<GrammarListResponse> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 12;

    // In Bun unit tests environment without network
    if (defaultApiConfig.useMock && typeof window === 'undefined') {
      const all = this.getGrammarPoints(params);
      const start = (page - 1) * pageSize;
      const paged = all.slice(start, start + pageSize);
      return {
        items: paged,
        totalItems: all.length,
        totalPages: Math.max(1, Math.ceil(all.length / pageSize)),
        page,
        pageSize,
      };
    }

    try {
      const queryParams: Record<string, string | number | undefined> = {
        page,
        pageSize,
      };
      if (params.hskLevel && params.hskLevel > 0) {
        queryParams.hskLevel = params.hskLevel;
      }
      if (params.category && params.category !== 'all') {
        queryParams.category = params.category;
      }
      if (params.searchQuery && params.searchQuery.trim().length > 0) {
        queryParams.search = params.searchQuery.trim();
      }

      const res = await httpClient.get<any>('/content/grammar', { params: queryParams });
      const rawItems = Array.isArray(res) ? res : (res?.items || []);
      const totalItems = res?.totalItems ?? rawItems.length;
      const totalPages = res?.totalPages ?? Math.max(1, Math.ceil(totalItems / pageSize));

      const items: GrammarPoint[] = rawItems.map((g: any) => {
        const examples = parseExamples(g.examplesJson);
        const practice = parsePractice(g.practiceJson);

        return {
          id: g.id,
          title: g.title || '',
          pinyinTitle: g.pinyinTitle || '',
          hskLevel: g.hskLevel || 1,
          category: (g.category as any) || 'cơ bản',
          structure: g.structureFormula || g.structure || '',
          explanation: g.explanation || '',
          difficulty: (g.difficulty as any) || 'Dễ',
          examples,
          practice,
        };
      });

      return {
        items,
        totalItems,
        totalPages,
        page: res?.pageNumber ?? res?.page ?? page,
        pageSize,
      };
    } catch (err) {
      console.warn('[GrammarService] Failed to fetch grammar from backend API, using fallback:', err);
      const all = this.getGrammarPoints(params);
      const start = (page - 1) * pageSize;
      return {
        items: all.slice(start, start + pageSize),
        totalItems: all.length,
        totalPages: Math.max(1, Math.ceil(all.length / pageSize)),
        page,
        pageSize,
      };
    }
  }

  /**
   * Synchronous offline lookup method (kept for backwards-compatibility).
   */
  static getGrammarPoints(params: GrammarFilterParams = {}): GrammarPoint[] {
    let list = [...MOCK_GRAMMAR_POINTS];

    if (params.hskLevel) {
      list = list.filter((item) => item.hskLevel === params.hskLevel);
    }

    if (params.category && params.category !== 'all') {
      list = list.filter((item) => item.category === params.category);
    }

    if (params.searchQuery && params.searchQuery.trim().length > 0) {
      const q = params.searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.pinyinTitle.toLowerCase().includes(q) ||
          item.structure.toLowerCase().includes(q) ||
          item.explanation.toLowerCase().includes(q) ||
          (item.practice?.prompt && item.practice.prompt.toLowerCase().includes(q)) ||
          (item.practice?.standardAnswer && item.practice.standardAnswer.toLowerCase().includes(q)) ||
          item.examples.some(
            (ex) =>
              ex.chinese.toLowerCase().includes(q) ||
              ex.pinyin.toLowerCase().includes(q) ||
              ex.vietnamese.toLowerCase().includes(q)
          )
      );
    }

    return list;
  }

  static getGrammarById(id: string): GrammarPoint | undefined {
    return MOCK_GRAMMAR_POINTS.find((item) => item.id === id);
  }

  static getAvailableCategories(): string[] {
    const categories = new Set<string>();
    MOCK_GRAMMAR_POINTS.forEach((pt) => categories.add(pt.category));
    return Array.from(categories);
  }
}

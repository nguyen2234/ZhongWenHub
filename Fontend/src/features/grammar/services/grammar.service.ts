import type { GrammarPoint } from '../types/grammar.types';
import { MOCK_GRAMMAR_POINTS } from '../mock/mockGrammarData';

export interface GrammarFilterParams {
  hskLevel?: number | null;
  category?: string | null;
  searchQuery?: string;
}

export class GrammarService {
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
          item.explanation.toLowerCase().includes(q)
      );
    }

    return list;
  }

  static getGrammarById(id: string): GrammarPoint | undefined {
    return MOCK_GRAMMAR_POINTS.find((item) => item.id === id);
  }
}

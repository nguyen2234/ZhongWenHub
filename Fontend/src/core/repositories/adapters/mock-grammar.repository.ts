import { MOCK_GRAMMAR_POINTS as STUDENT_GRAMMAR_POINTS } from '../../../features/grammar/mock/mockGrammarData';
import { MOCK_GRAMMAR_POINTS as HSK_REPO_GRAMMAR_POINTS } from '../../../management/admin/content/data/mockHskRepositoryData';
import type {
  AdminGrammarPoint,
  AdminGrammarFilters,
  CreateAdminGrammarDTO,
  UpdateAdminGrammarDTO,
  AdminGrammarExample,
} from '../../../management/admin/content/types/admin-content.types';
import type { ContentStatus } from '../../../management/admin/content/types/common-content.types';
import type {
  IGrammarRepository,
  AdminGrammarStats,
} from '../interfaces/grammar-repository.interface';

const STORAGE_KEY = 'zhongwenhub_admin_grammar_v1';

function buildInitialDataset(): AdminGrammarPoint[] {
  const initial: AdminGrammarPoint[] = STUDENT_GRAMMAR_POINTS.map((sg, index) => {
    const hskLevel = sg.hskLevel;
    const orderStr = String(index + 1).padStart(2, '0');
    const code = `HSK${hskLevel}_G${orderStr}`;

    const examples: AdminGrammarExample[] = sg.examples.map((ex) => ({
      zh: ex.chinese,
      pinyin: ex.pinyin,
      meaningVi: ex.vietnamese,
    }));

    const linkedLessonIds: string[] = [];
    if (sg.id === 'g-hsk1-01' || sg.id === 'g-hsk1-02') {
      linkedLessonIds.push('les-1');
    } else if (sg.id === 'g-hsk1-03') {
      linkedLessonIds.push('les-2');
    } else if (sg.id === 'g-hsk2-01') {
      linkedLessonIds.push('les-8');
    }

    const linkedExerciseIds: string[] = [];
    if (sg.id === 'g-hsk2-01') {
      linkedExerciseIds.push('ex-p1', 'ex-p2', 'ex-p3', 'ex-p4', 'ex-p5', 'ex-p10');
    } else if (sg.id === 'g-hsk1-01') {
      linkedExerciseIds.push('ex-vocab-1', 'ex-p11');
    } else if (sg.id === 'g-hsk1-02') {
      linkedExerciseIds.push('ex-vocab-2');
    } else if (sg.id === 'g-hsk1-03') {
      linkedExerciseIds.push('ex-sentence-1');
    } else if (sg.id === 'g-hsk2-02') {
      linkedExerciseIds.push('ex-p12');
    } else if (sg.id === 'g-hsk3-01') {
      linkedExerciseIds.push('ex-p8', 'ex-p9');
    } else if (sg.id === 'g-hsk4-01') {
      linkedExerciseIds.push('ex-p14');
    }

    const status: ContentStatus =
      sg.hskLevel >= 5 ? (sg.hskLevel === 6 ? 'DRAFT' : 'PENDING_REVIEW') : 'PUBLISHED';

    return {
      id: sg.id,
      code,
      title: sg.title,
      pinyinTitle: sg.pinyinTitle,
      hskLevel: sg.hskLevel,
      hskLevelId: `level-hsk-${sg.hskLevel}`,
      category: sg.category,
      structureFormula: sg.structure,
      explanation: sg.explanation,
      difficulty: sg.difficulty,
      status,
      examples,
      commonMistake:
        sg.id === 'g-hsk1-01'
          ? HSK_REPO_GRAMMAR_POINTS.find((h) => h.id === 'gram-1')?.commonMistake
          : undefined,
      practice: sg.practice,
      linkedLessonIds,
      linkedExerciseIds,
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-03-01T00:00:00Z',
    };
  });

  return initial;
}

/**
 * Mock Grammar Repository Adapter using localStorage for offline reliability and demo testing.
 */
export class MockGrammarRepository implements IGrammarRepository {
  private data: AdminGrammarPoint[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') {
      this.data = buildInitialDataset();
      return;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.data = parsed;
          return;
        }
      }
    } catch {
      // In case of error fallback
    }
    this.data = buildInitialDataset();
    this.saveToStorage();
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (err) {
      console.warn('[MockGrammarRepository] Storage write error', err);
    }
  }

  // --- Synchronous methods ---

  getAllSync(filters?: Partial<AdminGrammarFilters>): AdminGrammarPoint[] {
    let result = [...this.data];

    if (!filters) return result;

    if (filters.hskLevel && filters.hskLevel !== 'ALL') {
      const levelNum = Number(filters.hskLevel);
      result = result.filter((g) => g.hskLevel === levelNum);
    }

    if (filters.category && filters.category !== 'ALL') {
      result = result.filter((g) => g.category === filters.category);
    }

    if (filters.status && filters.status !== 'ALL') {
      result = result.filter((g) => g.status === filters.status);
    }

    if (filters.search && filters.search.trim().length > 0) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.pinyinTitle.toLowerCase().includes(q) ||
          g.code.toLowerCase().includes(q) ||
          g.structureFormula.toLowerCase().includes(q) ||
          g.explanation.toLowerCase().includes(q) ||
          g.examples.some((ex) => ex.zh.includes(q) || ex.meaningVi.toLowerCase().includes(q))
      );
    }

    return result.map((g) => ({
      ...g,
      examples: g.examples ? g.examples.map((e) => ({ ...e })) : [],
      linkedLessonIds: g.linkedLessonIds ? [...g.linkedLessonIds] : [],
      linkedExerciseIds: g.linkedExerciseIds ? [...g.linkedExerciseIds] : [],
    }));
  }

  getByIdSync(id: string): AdminGrammarPoint | undefined {
    const item = this.data.find((g) => g.id === id);
    if (!item) return undefined;
    return {
      ...item,
      examples: item.examples ? item.examples.map((e) => ({ ...e })) : [],
      linkedLessonIds: item.linkedLessonIds ? [...item.linkedLessonIds] : [],
      linkedExerciseIds: item.linkedExerciseIds ? [...item.linkedExerciseIds] : [],
    };
  }

  createSync(dto: CreateAdminGrammarDTO): AdminGrammarPoint {
    const nextIndex = this.data.length + 1;
    const generatedId = `g-admin-${Date.now()}`;
    const generatedCode = dto.code && dto.code.trim().length > 0
      ? dto.code.trim().toUpperCase()
      : `HSK${dto.hskLevel}_G${String(nextIndex).padStart(2, '0')}`;

    const newItem: AdminGrammarPoint = {
      id: generatedId,
      code: generatedCode,
      title: dto.title.trim(),
      pinyinTitle: dto.pinyinTitle.trim(),
      hskLevel: dto.hskLevel,
      hskLevelId: `level-hsk-${dto.hskLevel}`,
      category: dto.category,
      structureFormula: dto.structureFormula.trim(),
      explanation: dto.explanation.trim(),
      difficulty: dto.difficulty,
      status: dto.status || 'DRAFT',
      examples: dto.examples.map((e) => ({ ...e })),
      commonMistake: dto.commonMistake,
      practice: dto.practice,
      linkedLessonIds: dto.linkedLessonIds ? [...dto.linkedLessonIds] : [],
      linkedExerciseIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.unshift(newItem);
    this.saveToStorage();
    return { ...newItem };
  }

  updateSync(id: string, dto: UpdateAdminGrammarDTO): AdminGrammarPoint {
    const index = this.data.findIndex((g) => g.id === id);
    if (index === -1) {
      throw new Error(`Không tìm thấy điểm ngữ pháp với ID: ${id}`);
    }

    const current = this.data[index];
    const updated: AdminGrammarPoint = {
      ...current,
      ...dto,
      code: dto.code ? dto.code.trim() : current.code,
      title: dto.title ? dto.title.trim() : current.title,
      pinyinTitle: dto.pinyinTitle ? dto.pinyinTitle.trim() : current.pinyinTitle,
      hskLevel: dto.hskLevel ?? current.hskLevel,
      hskLevelId: dto.hskLevel ? `level-hsk-${dto.hskLevel}` : current.hskLevelId,
      category: dto.category ?? current.category,
      structureFormula: dto.structureFormula ? dto.structureFormula.trim() : current.structureFormula,
      explanation: dto.explanation ? dto.explanation.trim() : current.explanation,
      difficulty: dto.difficulty ?? current.difficulty,
      status: dto.status ?? current.status,
      examples: dto.examples ? dto.examples.map((e) => ({ ...e })) : current.examples,
      commonMistake: dto.commonMistake !== undefined ? dto.commonMistake : current.commonMistake,
      practice: dto.practice !== undefined ? dto.practice : current.practice,
      linkedLessonIds: dto.linkedLessonIds ? [...dto.linkedLessonIds] : current.linkedLessonIds,
      updatedAt: new Date().toISOString(),
    };

    this.data[index] = updated;
    this.saveToStorage();
    return { ...updated };
  }

  deleteSync(id: string): boolean {
    const prevLen = this.data.length;
    this.data = this.data.filter((g) => g.id !== id);
    if (this.data.length !== prevLen) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  getStatsSync(): AdminGrammarStats {
    const total = this.data.length;
    const published = this.data.filter((g) => g.status === 'PUBLISHED').length;
    const draft = this.data.filter((g) => g.status === 'DRAFT').length;
    const pending = this.data.filter((g) => g.status === 'PENDING_REVIEW').length;
    const archived = this.data.filter((g) => g.status === 'ARCHIVED').length;
    const byHsk: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    this.data.forEach((g) => {
      if (byHsk[g.hskLevel] !== undefined) {
        byHsk[g.hskLevel]++;
      }
    });

    return { total, published, draft, pending, archived, byHsk };
  }

  // --- Async IGrammarRepository implementation ---

  async getAll(filters?: Partial<AdminGrammarFilters>): Promise<AdminGrammarPoint[]> {
    return this.getAllSync(filters);
  }

  async getById(id: string): Promise<AdminGrammarPoint | undefined> {
    return this.getByIdSync(id);
  }

  async create(dto: CreateAdminGrammarDTO): Promise<AdminGrammarPoint> {
    return this.createSync(dto);
  }

  async update(id: string, dto: UpdateAdminGrammarDTO): Promise<AdminGrammarPoint> {
    return this.updateSync(id, dto);
  }

  async delete(id: string): Promise<boolean> {
    return this.deleteSync(id);
  }

  async getStats(): Promise<AdminGrammarStats> {
    return this.getStatsSync();
  }

  async resetToDefault(): Promise<void> {
    this.data = buildInitialDataset();
    this.saveToStorage();
  }
}

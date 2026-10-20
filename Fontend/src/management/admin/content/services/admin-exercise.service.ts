import { PRACTICE_EXERCISE_POOL } from '../../../../features/practice/data/mockPracticeData';
import type { SharedExerciseItem, MatchingPair } from '../../../../features/exercise-engine/types';
import { MOCK_LESSON_8_DRAFT } from '../data/mockLessonEditorData';
import type {
  AdminExerciseItem,
  AdminExerciseFilters,
  CreateAdminExerciseDTO,
  UpdateAdminExerciseDTO,
} from '../types/admin-content.types';

const STORAGE_KEY = 'zhongwenhub_admin_exercises_v1';

function buildInitialDataset(): AdminExerciseItem[] {
  const items: AdminExerciseItem[] = [];

  // 1. Ingest from PRACTICE_EXERCISE_POOL
  (Object.values(PRACTICE_EXERCISE_POOL) as SharedExerciseItem[]).forEach((ex) => {
    const id = String(ex.id);
    const hskLevel = ex.hskLevel || 2;
    let grammarPointId: string | undefined;

    // Stable grammar mapping based on pedagogy
    if (id === 'ex-p1' || id === 'ex-p2' || id === 'ex-p3' || id === 'ex-p5') {
      grammarPointId = 'g-hsk2-01'; // 想
    } else if (id === 'ex-vocab-1' || id === 'ex-p11') {
      grammarPointId = 'g-hsk1-01'; // 是
    } else if (id === 'ex-sentence-1') {
      grammarPointId = 'g-hsk1-03'; // 吗
    } else if (id === 'ex-p8') {
      grammarPointId = 'g-hsk3-01'; // 是...的
    }

    const lessonId = grammarPointId === 'g-hsk2-01' ? 'les-8' : undefined;

    items.push({
      id,
      type: ex.type,
      skill: ex.skill || 'vocabulary',
      hskLevel,
      hskLevelId: `level-hsk-${hskLevel}`,
      difficulty: ex.difficulty || 'medium',
      status: 'PUBLISHED',
      title: ex.title,
      instruction: ex.instruction,
      promptHanzi: ex.promptHanzi,
      promptPinyin: ex.promptPinyin,
      promptVietnamese: ex.promptVietnamese,
      audioUrl: ex.audioUrl,
      options: ex.options ? [...ex.options] : undefined,
      correctOptionIndex: ex.correctOptionIndex,
      matchingPairs: ex.matchingPairs ? ex.matchingPairs.map((m: MatchingPair) => ({ ...m })) : undefined,
      sentenceTokens: ex.sentenceTokens ? [...ex.sentenceTokens] : undefined,
      correctSentence: ex.correctSentence,
      explanation: ex.explanation,
      grammarPointId,
      lessonId,
      xpReward: ex.xpReward || 3,
      createdAt: '2024-01-20T00:00:00Z',
      updatedAt: '2024-02-15T00:00:00Z',
    });
  });

  // 2. Ingest Lesson 8 Exercises
  MOCK_LESSON_8_DRAFT.exercises.forEach((item) => {
    const ex = item.exercise;
    const id = String(ex.id);
    if (!items.some((i) => i.id === id)) {
      items.push({
        id,
        type: ex.type,
        skill: ex.skill || (item.section === 'QUIZ' ? 'comprehensive' : 'grammar'),
        hskLevel: ex.hskLevel || 2,
        hskLevelId: `level-hsk-${ex.hskLevel || 2}`,
        difficulty: ex.difficulty || (item.section === 'QUIZ' ? 'hard' : 'medium'),
        status: 'PUBLISHED',
        title: ex.title,
        instruction: ex.instruction,
        promptHanzi: ex.promptHanzi,
        promptPinyin: ex.promptPinyin,
        promptVietnamese: ex.promptVietnamese,
        audioUrl: ex.audioUrl,
        options: ex.options ? [...ex.options] : undefined,
        correctOptionIndex: ex.correctOptionIndex,
        matchingPairs: ex.matchingPairs ? ex.matchingPairs.map((m) => ({ ...m })) : undefined,
        sentenceTokens: ex.sentenceTokens ? [...ex.sentenceTokens] : undefined,
        correctSentence: ex.correctSentence,
        explanation: ex.explanation,
        grammarPointId: 'g-hsk2-01',
        lessonId: 'les-8',
        xpReward: ex.xpReward || (item.section === 'QUIZ' ? 5 : 3),
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-02-15T00:00:00Z',
      });
    }
  });

  return items;
}

class AdminExerciseService {
  private data: AdminExerciseItem[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
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

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Ignore quota error in tests
    }
  }

  resetToDefault() {
    this.data = buildInitialDataset();
    this.saveToStorage();
  }

  getAll(filters?: AdminExerciseFilters): AdminExerciseItem[] {
    let result = [...this.data];

    if (filters?.hskLevel && filters.hskLevel !== 'ALL') {
      result = result.filter((e) => e.hskLevel === filters.hskLevel);
    }

    if (filters?.skill && filters.skill !== 'ALL') {
      result = result.filter((e) => e.skill === filters.skill);
    }

    if (filters?.type && filters.type !== 'ALL') {
      result = result.filter((e) => e.type === filters.type);
    }

    if (filters?.difficulty && filters.difficulty !== 'ALL') {
      result = result.filter((e) => e.difficulty === filters.difficulty);
    }

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((e) => e.status === filters.status);
    }

    if (filters?.grammarPointId) {
      result = result.filter((e) => e.grammarPointId === filters.grammarPointId);
    }

    if (filters?.lessonId) {
      result = result.filter((e) => e.lessonId === filters.lessonId);
    }

    if (filters?.search?.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.id.toLowerCase().includes(q) ||
          e.title.toLowerCase().includes(q) ||
          e.instruction.toLowerCase().includes(q) ||
          (e.promptHanzi && e.promptHanzi.includes(q)) ||
          (e.promptPinyin && e.promptPinyin.toLowerCase().includes(q)) ||
          (e.promptVietnamese && e.promptVietnamese.toLowerCase().includes(q)) ||
          (e.correctSentence && e.correctSentence.includes(q)) ||
          (e.options && e.options.some((opt) => opt.toLowerCase().includes(q))) ||
          e.explanation.toLowerCase().includes(q)
      );
    }

    return result.map((e) => ({
      ...e,
      options: e.options ? [...e.options] : undefined,
      matchingPairs: e.matchingPairs ? e.matchingPairs.map((m) => ({ ...m })) : undefined,
      sentenceTokens: e.sentenceTokens ? [...e.sentenceTokens] : undefined,
    }));
  }

  getById(id: string): AdminExerciseItem | undefined {
    const item = this.data.find((e) => e.id === id);
    if (!item) return undefined;
    return {
      ...item,
      options: item.options ? [...item.options] : undefined,
      matchingPairs: item.matchingPairs ? item.matchingPairs.map((m) => ({ ...m })) : undefined,
      sentenceTokens: item.sentenceTokens ? [...item.sentenceTokens] : undefined,
    };
  }

  create(dto: CreateAdminExerciseDTO): AdminExerciseItem {
    // Validate HSK bounds
    if (dto.hskLevel < 1 || dto.hskLevel > 6) {
      throw new Error(`Cấp độ HSK không hợp lệ: ${dto.hskLevel}. Chỉ chấp nhận từ 1 đến 6.`);
    }

    // Validate type requirements
    if (dto.type === 'multiple-choice' || dto.type === 'fill-blank' || dto.type === 'listen-choice') {
      if (!dto.options || dto.options.length < 2) {
        throw new Error('Dạng bài trắc nghiệm/điền từ yêu cầu tối thiểu 2 lựa chọn.');
      }
      if (
        dto.correctOptionIndex === undefined ||
        dto.correctOptionIndex < 0 ||
        dto.correctOptionIndex >= dto.options.length
      ) {
        throw new Error('Chỉ số đáp án đúng không hợp lệ.');
      }
    }

    if (dto.type === 'sentence-order') {
      if (!dto.sentenceTokens || dto.sentenceTokens.length < 2) {
        throw new Error('Dạng bài sắp xếp câu yêu cầu tối thiểu 2 mảnh từ.');
      }
      if (!dto.correctSentence?.trim()) {
        throw new Error('Dạng bài sắp xếp câu yêu cầu câu hoàn chỉnh chuẩn.');
      }
    }

    if (dto.type === 'matching') {
      if (!dto.matchingPairs || dto.matchingPairs.length < 2) {
        throw new Error('Dạng bài nối từ yêu cầu tối thiểu 2 cặp tương ứng.');
      }
    }

    const id = `ex-custom-${Date.now().toString().slice(-6)}`;
    const newItem: AdminExerciseItem = {
      id,
      type: dto.type,
      skill: dto.skill,
      hskLevel: dto.hskLevel,
      hskLevelId: `level-hsk-${dto.hskLevel}`,
      difficulty: dto.difficulty || 'medium',
      status: dto.status || 'DRAFT',
      title: dto.title.trim(),
      instruction: dto.instruction.trim(),
      promptHanzi: dto.promptHanzi?.trim(),
      promptPinyin: dto.promptPinyin?.trim(),
      promptVietnamese: dto.promptVietnamese?.trim(),
      audioUrl: dto.audioUrl?.trim(),
      options: dto.options ? dto.options.map((o) => o.trim()) : undefined,
      correctOptionIndex: dto.correctOptionIndex,
      matchingPairs: dto.matchingPairs ? dto.matchingPairs.map((m) => ({ ...m })) : undefined,
      sentenceTokens: dto.sentenceTokens ? dto.sentenceTokens.map((s) => s.trim()) : undefined,
      correctSentence: dto.correctSentence?.trim(),
      explanation: dto.explanation?.trim() || '',
      grammarPointId: dto.grammarPointId,
      lessonId: dto.lessonId,
      xpReward: dto.xpReward || 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.unshift(newItem);
    this.saveToStorage();
    return { ...newItem };
  }

  update(id: string, dto: UpdateAdminExerciseDTO): AdminExerciseItem {
    const index = this.data.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error(`Không tìm thấy câu hỏi với ID: ${id}`);
    }

    const current = this.data[index];
    const hskLevel = dto.hskLevel ?? current.hskLevel;

    if (hskLevel < 1 || hskLevel > 6) {
      throw new Error(`Cấp độ HSK không hợp lệ: ${hskLevel}. Chỉ chấp nhận từ 1 đến 6.`);
    }

    const updated: AdminExerciseItem = {
      ...current,
      ...dto,
      hskLevel,
      hskLevelId: `level-hsk-${hskLevel}`,
      title: dto.title ? dto.title.trim() : current.title,
      instruction: dto.instruction ? dto.instruction.trim() : current.instruction,
      promptHanzi: dto.promptHanzi !== undefined ? dto.promptHanzi?.trim() : current.promptHanzi,
      promptPinyin: dto.promptPinyin !== undefined ? dto.promptPinyin?.trim() : current.promptPinyin,
      promptVietnamese: dto.promptVietnamese !== undefined ? dto.promptVietnamese?.trim() : current.promptVietnamese,
      audioUrl: dto.audioUrl !== undefined ? dto.audioUrl?.trim() : current.audioUrl,
      options: dto.options ? dto.options.map((o) => o.trim()) : current.options,
      correctOptionIndex: dto.correctOptionIndex !== undefined ? dto.correctOptionIndex : current.correctOptionIndex,
      matchingPairs: dto.matchingPairs ? dto.matchingPairs.map((m) => ({ ...m })) : current.matchingPairs,
      sentenceTokens: dto.sentenceTokens ? dto.sentenceTokens.map((s) => s.trim()) : current.sentenceTokens,
      correctSentence: dto.correctSentence !== undefined ? dto.correctSentence?.trim() : current.correctSentence,
      explanation: dto.explanation ? dto.explanation.trim() : current.explanation,
      updatedAt: new Date().toISOString(),
    };

    this.data[index] = updated;
    this.saveToStorage();
    return { ...updated };
  }

  delete(id: string): boolean {
    const prevLen = this.data.length;
    this.data = this.data.filter((e) => e.id !== id);
    if (this.data.length !== prevLen) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  getStats() {
    const total = this.data.length;
    const published = this.data.filter((e) => e.status === 'PUBLISHED').length;
    const draft = this.data.filter((e) => e.status === 'DRAFT').length;
    const pending = this.data.filter((e) => e.status === 'PENDING_REVIEW').length;
    const archived = this.data.filter((e) => e.status === 'ARCHIVED').length;

    const byHsk: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const bySkill: Record<string, number> = {};
    const byType: Record<string, number> = {};

    this.data.forEach((e) => {
      if (byHsk[e.hskLevel] !== undefined) {
        byHsk[e.hskLevel]++;
      }
      bySkill[e.skill] = (bySkill[e.skill] || 0) + 1;
      byType[e.type] = (byType[e.type] || 0) + 1;
    });

    return { total, published, draft, pending, archived, byHsk, bySkill, byType };
  }
}

export const adminExerciseService = new AdminExerciseService();

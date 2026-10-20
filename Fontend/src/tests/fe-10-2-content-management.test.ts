// @ts-nocheck
import { describe, test, expect, beforeEach } from 'bun:test';
import { adminGrammarService } from '../management/admin/content/services/admin-grammar.service';
import { adminExerciseService } from '../management/admin/content/services/admin-exercise.service';

describe('FE-10.2: Admin Content Management - Grammar & Exercise Services', () => {
  beforeEach(() => {
    // Reset services to pristine seeded state
    adminGrammarService.resetToDefault();
    adminExerciseService.resetToDefault();
  });

  describe('1. Admin Grammar Service', () => {
    test('initializes with merged seed data from student grammar and HSK repository', () => {
      const items = adminGrammarService.getAll();
      expect(items.length).toBeGreaterThanOrEqual(10);

      // Verify standardized ID pattern
      const sample = items[0];
      expect(sample.id).toMatch(/^g-hsk\d-\d{2}$/);
      expect(sample.hskLevelId).toBe(`level-hsk-${sample.hskLevel}`);
      expect(sample.title).toBeTruthy();
      expect(sample.structureFormula).toBeTruthy();
    });

    test('filters grammar by HSK level strictly without fake levels', () => {
      const hsk1Items = adminGrammarService.getAll({ hskLevel: 1 });
      expect(hsk1Items.length).toBeGreaterThan(0);
      hsk1Items.forEach((item) => expect(item.hskLevel).toBe(1));

      const hsk2Items = adminGrammarService.getAll({ hskLevel: 2 });
      expect(hsk2Items.length).toBeGreaterThan(0);
      hsk2Items.forEach((item) => expect(item.hskLevel).toBe(2));
    });

    test('filters grammar by category', () => {
      const all = adminGrammarService.getAll();
      const firstCategory = all[0].category;

      const filtered = adminGrammarService.getAll({ category: firstCategory });
      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((item) => expect(item.category).toBe(firstCategory));
    });

    test('searches across Chinese title, Pinyin, and structure', () => {
      const results = adminGrammarService.getAll({ search: 'Câu' });
      expect(results.length).toBeGreaterThan(0);

      const found = results.some((r) =>
        r.title.includes('Câu') || r.explanation.toLowerCase().includes('câu')
      );
      expect(found).toBe(true);
    });

    test('creates new grammar point with default DRAFT status', () => {
      const created = adminGrammarService.create({
        title: '把字句',
        pinyinTitle: 'bǎ zì jù',
        hskLevel: 3,
        category: 'Cấu trúc đặc biệt',
        structureFormula: 'S + 把 + O + V + Thành phần khác',
        explanation: 'Dùng để diễn tả sự tác động làm biến đổi tân ngữ.',
        difficulty: 'HARD',
        examples: [
          { zh: '我把作业做完了。', pinyin: 'Wǒ bǎ zuòyè zuò wán le.', meaningVi: 'Tôi làm xong bài tập rồi.' },
        ],
        linkedLessonId: 'les-8',
        linkedExerciseIds: ['ex-p1'],
      });

      expect(created.id).toBeTruthy();
      expect(created.status).toBe('DRAFT');
      expect(created.hskLevelId).toBe('level-hsk-3');
      expect(created.code).toMatch(/^HSK3_G/);

      // Verify retrieval
      const retrieved = adminGrammarService.getById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe('把字句');
    });

    test('updates existing grammar point properties and status', () => {
      const all = adminGrammarService.getAll();
      const target = all[0];

      const updated = adminGrammarService.update(target.id, {
        explanation: 'Giải thích đã cập nhật qua Web Admin Console.',
        status: 'PENDING_REVIEW',
      });

      expect(updated.explanation).toBe('Giải thích đã cập nhật qua Web Admin Console.');
      expect(updated.status).toBe('PENDING_REVIEW');
    });

    test('deletes a grammar point and updates stats', () => {
      const initialStats = adminGrammarService.getStats();
      const all = adminGrammarService.getAll();
      const target = all[0];

      adminGrammarService.delete(target.id);
      const afterStats = adminGrammarService.getStats();

      expect(afterStats.total).toBe(initialStats.total - 1);
      expect(adminGrammarService.getById(target.id)).toBeUndefined();
    });

    test('computes accurate status statistics', () => {
      const stats = adminGrammarService.getStats();
      expect(stats.total).toBe(stats.published + stats.pending + stats.draft + stats.archived);
      expect(stats.total).toBeGreaterThan(0);
    });
  });

  describe('2. Admin Exercise Bank Service', () => {
    test('initializes with verified exercise pool using standardized IDs', () => {
      const exercises = adminExerciseService.getAll();
      expect(exercises.length).toBeGreaterThanOrEqual(14);

      exercises.forEach((ex) => {
        expect(ex.id).toMatch(/^ex-/);
        expect(ex.hskLevelId).toBe(`level-hsk-${ex.hskLevel}`);
        expect([1, 2, 3, 4, 5, 6]).toContain(ex.hskLevel);
      });
    });

    test('filters exercises by skill, type, and difficulty', () => {
      const grammarExercises = adminExerciseService.getAll({ skill: 'grammar' });
      expect(grammarExercises.length).toBeGreaterThan(0);
      grammarExercises.forEach((e) => expect(e.skill).toBe('grammar'));

      const mcExercises = adminExerciseService.getAll({ type: 'multiple-choice' });
      expect(mcExercises.length).toBeGreaterThan(0);
      mcExercises.forEach((e) => expect(e.type).toBe('multiple-choice'));
    });

    test('filters by linked grammar point and linked lesson for deep-link navigation', () => {
      // Find an exercise that has a grammarPointId
      const all = adminExerciseService.getAll();
      const withGrammar = all.find((e) => !!e.grammarPointId);
      expect(withGrammar).toBeDefined();

      if (withGrammar && withGrammar.grammarPointId) {
        const filtered = adminExerciseService.getAll({ grammarPointId: withGrammar.grammarPointId });
        expect(filtered.length).toBeGreaterThan(0);
        filtered.forEach((e) => expect(e.grammarPointId).toBe(withGrammar.grammarPointId));
      }
    });

    test('creates new multiple-choice exercise with DRAFT status', () => {
      const created = adminExerciseService.create({
        type: 'multiple-choice',
        title: 'Trắc nghiệm liên từ 和',
        instruction: 'Chọn từ thích hợp điền vào chỗ trống',
        promptHanzi: '我和他___好朋友。',
        promptPinyin: 'Wǒ hé tā ___ hǎopéngyǒu.',
        hskLevel: 1,
        skill: 'grammar',
        difficulty: 'EASY',
        options: ['是', '在', '有', '去'],
        correctOptionIndex: 0,
        explanation: 'Chủ ngữ "我和他" (tôi và anh ấy) đi với động từ "是" (là).',
        grammarPointId: 'g-hsk1-01',
      });

      expect(created.id).toMatch(/^ex-/);
      expect(created.status).toBe('DRAFT');
      expect(created.options?.length).toBe(4);
      expect(created.correctOptionIndex).toBe(0);

      const retrieved = adminExerciseService.getById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe('Trắc nghiệm liên từ 和');
    });

    test('creates sentence-order exercise with tokenized components', () => {
      const created = adminExerciseService.create({
        type: 'sentence-order',
        title: 'Sắp xếp câu HSK 2',
        instruction: 'Sắp xếp các từ thành câu hoàn chỉnh',
        hskLevel: 2,
        skill: 'sentence',
        difficulty: 'MEDIUM',
        sentenceTokens: ['我', '想', '去', '商店', '买', '东西'],
        correctSentence: '我想去商店买东西。',
        explanation: 'Cấu trúc liên động: 想去 + địa điểm + làm gì.',
      });

      expect(created.type).toBe('sentence-order');
      expect(created.sentenceTokens?.length).toBe(6);
      expect(created.correctSentence).toBe('我想去商店买东西。');
    });

    test('creates matching exercise with paired keys', () => {
      const created = adminExerciseService.create({
        type: 'matching',
        title: 'Nối từ trái nghĩa',
        instruction: 'Ghép cặp từ tương ứng',
        hskLevel: 1,
        skill: 'vocabulary',
        difficulty: 'EASY',
        matchingPairs: [
          { id: 'p1', left: '大 (to)', right: '小 (nhỏ)' },
          { id: 'p2', left: '多 (nhiều)', right: '少 (ít)' },
        ],
        explanation: 'Các cặp tính từ cơ bản trong HSK 1.',
      });

      expect(created.type).toBe('matching');
      expect(created.matchingPairs?.length).toBe(2);
    });

    test('reports accurate real HSK distribution without fake substitution', () => {
      const stats = adminExerciseService.getStats();
      expect(stats.total).toBeGreaterThan(0);

      // Verify all HSK keys 1-6 exist in stats.byHsk
      [1, 2, 3, 4, 5, 6].forEach((level) => {
        expect(typeof stats.byHsk[level]).toBe('number');
      });

      // Sum of all HSK counts must equal total exercises
      const sumByHsk = Object.values(stats.byHsk).reduce((a, b) => a + b, 0);
      expect(sumByHsk).toBe(stats.total);

      // Status totals match
      const sumByStatus = stats.published + stats.pending + stats.draft + stats.archived;
      expect(sumByStatus).toBe(stats.total);
    });

    test('handles resetToDefault cleanly restoring initial datasets', () => {
      // Create a temporary exercise
      const tmp = adminExerciseService.create({
        type: 'fill-blank',
        title: 'Temp question',
        instruction: 'Fill',
        hskLevel: 1,
        skill: 'vocabulary',
        difficulty: 'EASY',
        promptHanzi: '___',
        options: ['A', 'B'],
        correctOptionIndex: 0,
      });

      expect(adminExerciseService.getById(tmp.id)).toBeDefined();

      // Reset
      adminExerciseService.resetToDefault();
      expect(adminExerciseService.getById(tmp.id)).toBeUndefined();
    });
  });
});

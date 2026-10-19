// @ts-ignore
import { describe, it, expect } from 'bun:test';
import { GrammarService } from '../features/grammar/services/grammar.service';
import { MOCK_GRAMMAR_POINTS } from '../features/grammar/mock/mockGrammarData';
import {
  SKILL_ITEMS,
  PRACTICE_EXERCISE_POOL,
  MOCK_RECOMMENDATION,
  MOCK_MISTAKE_RECORDS,
} from '../features/practice/data/mockPracticeData';

describe('FE-9: Practice & Grammar UX Redesign Suite', () => {
  describe('1. Practice Center Architecture & Metadata Integrity', () => {
    it('should define exactly 6 core language practice skills', () => {
      expect(SKILL_ITEMS.length).toBe(6);
      const skillIds = SKILL_ITEMS.map((s) => s.id);
      expect(skillIds).toEqual([
        'vocabulary',
        'grammar',
        'listening',
        'reading',
        'sentence',
        'comprehensive',
      ]);
    });

    it('should maintain bilingual titles for all skill cards', () => {
      SKILL_ITEMS.forEach((skill) => {
        expect(skill.chinese.length).toBeGreaterThan(0);
        expect(skill.vietnamese.length).toBeGreaterThan(0);
        expect(skill.totalExercises).toBeGreaterThan(0);
      });
    });

    it('should provide complete metadata for recommended practice', () => {
      expect(MOCK_RECOMMENDATION.hskLevel).toBe(2);
      expect(MOCK_RECOMMENDATION.skill).toBe('grammar');
      expect(MOCK_RECOMMENDATION.estimatedMinutes).toBeGreaterThan(0);
      expect(MOCK_RECOMMENDATION.xpReward).toBeGreaterThan(0);
      expect(MOCK_RECOMMENDATION.exerciseIds.length).toBeGreaterThan(0);
    });

    it('should strictly filter exercise pool by metadata without fake level substitution', () => {
      const pool = Object.values(PRACTICE_EXERCISE_POOL);
      const hsk1Exercises = pool.filter((ex) => ex.hskLevel === 1);
      const hsk2Exercises = pool.filter((ex) => ex.hskLevel === 2);
      const hsk4Exercises = pool.filter((ex) => ex.hskLevel === 4);

      expect(hsk1Exercises.length).toBe(2);
      expect(hsk2Exercises.length).toBe(13);
      // HSK 4 has 0 exercises in mock pool; system must report 0 and not substitute HSK 2 questions
      expect(hsk4Exercises.length).toBe(0);
    });

    it('should track mistake records categorized by skill', () => {
      expect(MOCK_MISTAKE_RECORDS.length).toBeGreaterThan(0);
      const grammarMistakes = MOCK_MISTAKE_RECORDS.filter((m) => m.skill === 'grammar');
      const vocabMistakes = MOCK_MISTAKE_RECORDS.filter((m) => m.skill === 'vocabulary');
      expect(grammarMistakes.length).toBeGreaterThan(0);
      expect(vocabMistakes.length).toBeGreaterThan(0);
    });
  });

  describe('2. Grammar Library Data & Categorization', () => {
    it('should support full HSK 1 through 6 span', () => {
      const levels = new Set(MOCK_GRAMMAR_POINTS.map((g) => g.hskLevel));
      expect(levels.has(1)).toBe(true);
      expect(levels.has(2)).toBe(true);
      expect(levels.has(3)).toBe(true);
      expect(levels.has(4)).toBe(true);
      expect(levels.has(5)).toBe(true);
      expect(levels.has(6)).toBe(true);
    });

    it('should support all required grammar categories including bổ ngữ and phó từ', () => {
      const categories = new Set(MOCK_GRAMMAR_POINTS.map((g) => g.category));
      expect(categories.has('cơ bản')).toBe(true);
      expect(categories.has('câu chữ')).toBe(true);
      expect(categories.has('trợ từ')).toBe(true);
      expect(categories.has('liên từ')).toBe(true);
      expect(categories.has('bổ ngữ')).toBe(true);
      expect(categories.has('phó từ')).toBe(true);
    });

    it('should filter grammar points accurately by HSK level', () => {
      const hsk1Points = GrammarService.getGrammarPoints({ hskLevel: 1 });
      expect(hsk1Points.length).toBeGreaterThanOrEqual(2);
      hsk1Points.forEach((p) => expect(p.hskLevel).toBe(1));

      const hsk4Points = GrammarService.getGrammarPoints({ hskLevel: 4 });
      expect(hsk4Points.length).toBeGreaterThanOrEqual(2);
      hsk4Points.forEach((p) => expect(p.hskLevel).toBe(4));
    });

    it('should filter grammar points accurately by category', () => {
      const boNguPoints = GrammarService.getGrammarPoints({ category: 'bổ ngữ' });
      expect(boNguPoints.length).toBeGreaterThanOrEqual(2);
      boNguPoints.forEach((p) => expect(p.category).toBe('bổ ngữ'));

      const phoTuPoints = GrammarService.getGrammarPoints({ category: 'phó từ' });
      expect(phoTuPoints.length).toBeGreaterThanOrEqual(2);
      phoTuPoints.forEach((p) => expect(p.category).toBe('phó từ'));
    });

    it('should search across Chinese, Pinyin, structure, and bilingual examples', () => {
      // Search by Chinese keyword
      const byHanzi = GrammarService.getGrammarPoints({ searchQuery: '把' });
      expect(byHanzi.some((p) => p.title.includes('把'))).toBe(true);

      // Search by Pinyin
      const byPinyin = GrammarService.getGrammarPoints({ searchQuery: 'bùjǐn' });
      expect(byPinyin.some((p) => p.pinyinTitle.includes('bùjǐn'))).toBe(true);

      // Search by example word
      const byExample = GrammarService.getGrammarPoints({ searchQuery: '蛋糕' });
      expect(byExample.length).toBeGreaterThan(0);
    });

    it('should retrieve individual grammar point by ID', () => {
      const point = GrammarService.getGrammarById('g-hsk1-01');
      expect(point).toBeDefined();
      expect(point?.title).toContain('是');
      expect(point?.examples.length).toBeGreaterThan(0);
    });
  });

  describe('3. Grammar Practice Deterministic Evaluation (No Fake AI)', () => {
    it('should provide practice exercises with explicit standard answers', () => {
      const pointsWithPractice = MOCK_GRAMMAR_POINTS.filter((p) => p.practice !== undefined);
      expect(pointsWithPractice.length).toBe(MOCK_GRAMMAR_POINTS.length);

      pointsWithPractice.forEach((p) => {
        expect(p.practice?.standardAnswer).toBeDefined();
        expect(p.practice?.standardAnswer.length).toBeGreaterThan(0);
        expect(p.practice?.prompt.length).toBeGreaterThan(0);
      });
    });

    it('should correctly evaluate matching answers normalizing punctuation and spaces', () => {
      const point = GrammarService.getGrammarById('g-hsk1-01');
      expect(point).toBeDefined();

      // Helper function matching GrammarPage evaluator
      const evaluate = (userInput: string, targetPoint: typeof point) => {
        const normUser = userInput.replace(/[.,!?。！？\s]/g, '').toLowerCase();
        const normStd = (targetPoint!.practice?.standardAnswer || '')
          .replace(/[.,!?。！？\s]/g, '')
          .toLowerCase();
        const acceptable = (targetPoint!.practice?.acceptableAnswers || []).map((ans) =>
          ans.replace(/[.,!?。！？\s]/g, '').toLowerCase()
        );
        return normUser === normStd || acceptable.includes(normUser);
      };

      // Exact match with fullstop
      expect(evaluate('我是汉语老师。', point)).toBe(true);
      // Without fullstop
      expect(evaluate('我是汉语老师', point)).toBe(true);
      // With spaces
      expect(evaluate('我 是 汉语 老师', point)).toBe(true);
      // Incorrect answer
      expect(evaluate('我是学生', point)).toBe(false);
      // Empty string
      expect(evaluate('', point)).toBe(false);
    });
  });
});

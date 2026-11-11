import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  adaptPracticeQuestionToShared,
  practiceQuestionBankService,
  type StudentPracticeQuestionPayload,
} from '../features/practice/services/practice-question-bank.service';
import { questionBankService } from '../management/admin/content/services/question-bank.service';
import { defaultApiConfig } from '../core/api/client/api-config';

describe('Question Bank Frontend Contract & Privacy Rules', () => {
  test('adaptPracticeQuestionToShared strips answer keys and explanations before submit', () => {
    const serverPayload: StudentPracticeQuestionPayload & Record<string, unknown> = {
      id: 'q-123',
      type: 'multiple-choice',
      skill: 'grammar',
      hskLevel: 2,
      difficulty: 'MEDIUM',
      title: 'Ngữ pháp HSK 2',
      instruction: 'Chọn đáp án đúng',
      promptHanzi: '他每天都去学校。',
      options: ['Anh ấy mỗi ngày đều đi học.', 'Anh ấy không đi học.', 'Anh ấy đi làm.', 'Anh ấy ở nhà.'],
      xpReward: 10,
      selectionReasonCode: 'WEAK_SKILL_TARGET',
      selectionReasonLabel: 'Kỹ năng grammar có tỷ lệ đúng thấp',
      correctOptionIndex: 0,
      correctAnswer: 'Anh ấy mỗi ngày đều đi học.',
      explanation: 'Mỗi ngày đều...',
    };

    const adapted = adaptPracticeQuestionToShared(serverPayload);
    expect(adapted.id).toBe('q-123');
    expect(adapted.difficulty).toBe('medium');
    expect(adapted.correctOptionIndex).toBeUndefined();
    expect(adapted.correctSentence).toBeUndefined();
    expect(adapted.explanation).toBe('');
    expect(adapted.selectionReasonLabel).toBe('Kỹ năng grammar có tỷ lệ đúng thấp');
  });

  test('PracticeCenter does not bulk-load pageSize=500 exercises', () => {
    const src = readFileSync(resolve(import.meta.dir, '../features/practice/PracticeCenter.tsx'), 'utf-8');
    expect(src).not.toContain('pageSize=500');
    expect(src).not.toContain('pageSize: 500');
    expect(src).toContain('practiceQuestionBankService');
  });

  test('AdminExerciseBankPage removes localStorage demo fallback and connects to QuestionBankService', () => {
    const src = readFileSync(
      resolve(import.meta.dir, '../management/admin/content/pages/AdminExerciseBankPage.tsx'),
      'utf-8'
    );
    expect(src).not.toContain('zhongwenhub_admin_exercises_v1');
    expect(src).toContain('questionBankService.getQuestionBankPage');
    expect(src).toContain('QuestionBankImportModal');
    expect(src).toContain('QuestionBankGenerateModal');
  });

  test('questionBankService supports mock-mode server-shaped pagination in unit tests', async () => {
    const prevMock = defaultApiConfig.useMock;
    defaultApiConfig.useMock = true;
    try {
      const page = await questionBankService.getQuestionBankPage({ hskLevel: 'ALL' }, 1, 5);
      expect(Array.isArray(page.items)).toBe(true);
      expect(page.pageNumber).toBe(1);
      expect(page.pageSize).toBe(5);
      expect(page.totalItems).toBeGreaterThanOrEqual(page.items.length);
    } finally {
      defaultApiConfig.useMock = prevMock;
    }
  });

  test('Phase 2 contracts expose extended review statuses, analytics and fault reporting', () => {
    expect(typeof questionBankService.reportQuestion).toBe('function');
    expect(typeof practiceQuestionBankService.reportQuestion).toBe('function');

    const adminPageSrc = readFileSync(
      resolve(import.meta.dir, '../management/admin/content/pages/AdminExerciseBankPage.tsx'),
      'utf-8'
    );
    expect(adminPageSrc).toContain('VALIDATED');
    expect(adminPageSrc).toContain('NEEDS_ACADEMIC_REVIEW');
    expect(adminPageSrc).toContain('reported-issue');

    const practiceResultSrc = readFileSync(
      resolve(import.meta.dir, '../features/practice/components/PracticeResult.tsx'),
      'utf-8'
    );
    expect(practiceResultSrc).toContain('Báo lỗi câu hỏi');
  });
});


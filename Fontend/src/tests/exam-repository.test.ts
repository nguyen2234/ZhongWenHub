// @ts-ignore
import { describe, it, expect } from 'bun:test';
import { examRepositoryService } from '../management/admin/content/services/exam-repository.service';

describe('Kho đề thi (Exam Repository Service)', () => {
  it('supports listing, filtering by HSK 2.0 level, creating draft exam, attaching questions, and workflow transitions', async () => {
    const initial = await examRepositoryService.getExams({ hskLevel: 1 });
    expect(initial.items.length).toBeGreaterThanOrEqual(1);

    const created = await examRepositoryService.createExam({
      code: 'HSK1-UNITTEST-01',
      title: 'Đề kiểm tra thử HSK 1 unit test',
      hskLevel: 1,
      examType: 'MOCK',
      durationMinutes: 40,
      passingScore: 120,
      description: 'Test mô tả đề thi',
      instructions: 'Hoàn thành trong 40 phút',
    });
    expect(created.status).toBe('DRAFT');
    expect(created.code).toBe('HSK1-UNITTEST-01');

    // Cannot publish exam without questions
    await expect(examRepositoryService.reviewExam(created.id, 'PUBLISHED')).rejects.toThrow();

    // Attach 2 ordered questions
    const withQuestions = await examRepositoryService.setExamQuestions(created.id, [
      { exerciseId: 'ex-1', sectionName: 'Nghe hiểu', orderIndex: 1, points: 10 },
      { exerciseId: 'ex-2', sectionName: 'Đọc hiểu', orderIndex: 2, points: 15 },
    ]);
    expect(withQuestions.questionCount).toBe(2);
    expect(withQuestions.totalPoints).toBe(25);

    // Move to PENDING_REVIEW -> PUBLISHED
    const pending = await examRepositoryService.reviewExam(created.id, 'PENDING_REVIEW');
    expect(pending.status).toBe('PENDING_REVIEW');

    const published = await examRepositoryService.reviewExam(created.id, 'PUBLISHED');
    expect(published.status).toBe('PUBLISHED');

    // Cannot hard delete a PUBLISHED exam without archiving
    await expect(examRepositoryService.deleteExam(created.id)).rejects.toThrow();

    // Archive succeeds, then delete succeeds when no student attempts exist
    const archived = await examRepositoryService.reviewExam(created.id, 'ARCHIVED');
    expect(archived.status).toBe('ARCHIVED');
    await examRepositoryService.deleteExam(created.id);
  });

  it('rejects out-of-range HSK levels (> 6) to enforce HSK 2.0 scope', async () => {
    await expect(
      examRepositoryService.createExam({
        code: 'HSK7-INVALID',
        title: 'Invalid HSK 7 exam',
        hskLevel: 7,
        examType: 'MOCK',
        durationMinutes: 45,
        passingScore: 120,
      })
    ).rejects.toThrow();
  });
});

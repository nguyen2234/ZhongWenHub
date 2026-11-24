import type { ContentStatus } from '../../management/admin/content/types/common-content.types';
import type {
  CreateExamInput,
  ExamDetail,
  ExamFilters,
  ExamStats,
  ExamSummary,
  UpdateExamInput,
  UpsertExamQuestionInput,
} from '../../management/admin/content/types/exam-repository.types';

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export class MockExamRepository {
  private mockStore: ExamDetail[] = [
    {
      id: 'exam-hsk1-mock-01',
      code: 'HSK1-MOCK-01',
      title: 'Đề thi thử HSK 1 chuẩn — Bộ đề 01',
      hskLevel: 1,
      examType: 'MOCK',
      description: 'Đề tổng hợp từ vựng và mẫu câu giao tiếp HSK 2.0 cấp độ 1.',
      instructions: 'Hoàn thành phần Nghe hiểu và Đọc hiểu trong 40 phút. Điểm đạt tối thiểu 120/200.',
      durationMinutes: 40,
      passingScore: 120,
      totalPoints: 20,
      questionCount: 2,
      attemptCount: 0,
      status: 'DRAFT',
      createdAt: '2026-11-10T00:00:00Z',
      updatedAt: '2026-11-10T00:00:00Z',
      questions: [],
    },
  ];

  async getExams(filters?: Partial<ExamFilters>, page = 1, pageSize = 50): Promise<PagedResult<ExamSummary>> {
    let items = [...this.mockStore];
    if (filters?.hskLevel && filters.hskLevel !== 'ALL') {
      items = items.filter((e) => e.hskLevel === filters.hskLevel);
    }
    if (filters?.examType && filters.examType !== 'ALL') {
      items = items.filter((e) => e.examType === filters.examType);
    }
    if (filters?.status && filters.status !== 'ALL') {
      items = items.filter((e) => e.status === filters.status);
    }
    if (filters?.search?.trim()) {
      const kw = filters.search.trim().toLowerCase();
      items = items.filter(
        (e) =>
          e.code.toLowerCase().includes(kw) ||
          e.title.toLowerCase().includes(kw) ||
          (e.description ?? '').toLowerCase().includes(kw)
      );
    }
    return { items, totalCount: items.length, page, pageSize };
  }

  async getStats(): Promise<ExamStats> {
    const byHsk: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (const e of this.mockStore) {
      if (byHsk[e.hskLevel] !== undefined) byHsk[e.hskLevel]++;
    }
    return {
      total: this.mockStore.length,
      published: this.mockStore.filter((e) => e.status === 'PUBLISHED').length,
      draft: this.mockStore.filter((e) => e.status === 'DRAFT').length,
      pending: this.mockStore.filter((e) => e.status === 'PENDING_REVIEW').length,
      archived: this.mockStore.filter((e) => e.status === 'ARCHIVED').length,
      byHsk,
    };
  }

  async getExamById(id: string): Promise<ExamDetail> {
    const found = this.mockStore.find((e) => e.id === id);
    if (!found) throw new Error('Không tìm thấy đề thi.');
    return JSON.parse(JSON.stringify(found));
  }

  async createExam(input: CreateExamInput): Promise<ExamDetail> {
    if (input.hskLevel < 1 || input.hskLevel > 6) {
      throw new Error('Cấp độ HSK phải từ HSK 1 đến HSK 6 (HSK 2.0).');
    }
    const created: ExamDetail = {
      id: `exam-${Date.now()}`,
      code: input.code.trim().toUpperCase(),
      title: input.title.trim(),
      hskLevel: input.hskLevel,
      examType: input.examType,
      description: input.description?.trim() ?? '',
      instructions: input.instructions?.trim() ?? '',
      durationMinutes: input.durationMinutes,
      passingScore: input.passingScore,
      totalPoints: (input.questions ?? []).reduce((sum, q) => sum + q.points, 0),
      questionCount: (input.questions ?? []).length,
      attemptCount: 0,
      status: input.status ?? 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [],
    };
    this.mockStore.unshift(created);
    return JSON.parse(JSON.stringify(created));
  }

  async updateExam(id: string, input: UpdateExamInput): Promise<ExamDetail> {
    if (input.hskLevel < 1 || input.hskLevel > 6) {
      throw new Error('Cấp độ HSK phải từ HSK 1 đến HSK 6 (HSK 2.0).');
    }
    const idx = this.mockStore.findIndex((e) => e.id === id);
    if (idx < 0) throw new Error('Không tìm thấy đề thi.');
    this.mockStore[idx] = {
      ...this.mockStore[idx],
      code: input.code.trim().toUpperCase(),
      title: input.title.trim(),
      hskLevel: input.hskLevel,
      examType: input.examType,
      description: input.description,
      instructions: input.instructions,
      durationMinutes: input.durationMinutes,
      passingScore: input.passingScore,
      updatedAt: new Date().toISOString(),
    };
    return JSON.parse(JSON.stringify(this.mockStore[idx]));
  }

  async setExamQuestions(id: string, questions: UpsertExamQuestionInput[]): Promise<ExamDetail> {
    const idx = this.mockStore.findIndex((e) => e.id === id);
    if (idx < 0) throw new Error('Không tìm thấy đề thi.');
    const normalized = [...questions]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((q, index) => ({
        id: `eq-${index + 1}`,
        examId: id,
        exerciseId: q.exerciseId,
        sectionName: q.sectionName,
        orderIndex: index + 1,
        points: q.points,
        exerciseTitle: `Question ${index + 1}`,
        exerciseType: 'multiple-choice',
        exerciseSkill: 'reading',
        hskLevel: this.mockStore[idx].hskLevel,
      }));
    this.mockStore[idx] = {
      ...this.mockStore[idx],
      questions: normalized,
      questionCount: normalized.length,
      totalPoints: normalized.reduce((acc, q) => acc + q.points, 0),
      updatedAt: new Date().toISOString(),
    };
    return JSON.parse(JSON.stringify(this.mockStore[idx]));
  }

  async reviewExam(id: string, status: ContentStatus, reviewNotes?: string): Promise<ExamDetail> {
    const idx = this.mockStore.findIndex((e) => e.id === id);
    if (idx < 0) throw new Error('Không tìm thấy đề thi.');
    if (status === 'PUBLISHED' && this.mockStore[idx].questions.length === 0) {
      throw new Error('Không thể xuất bản đề thi chưa có câu hỏi nào.');
    }
    this.mockStore[idx] = {
      ...this.mockStore[idx],
      status,
      reviewNotes: reviewNotes ?? this.mockStore[idx].reviewNotes,
      reviewedAt: new Date().toISOString(),
    };
    return JSON.parse(JSON.stringify(this.mockStore[idx]));
  }

  async deleteExam(id: string): Promise<void> {
    const target = this.mockStore.find((e) => e.id === id);
    if (!target) throw new Error('Không tìm thấy đề thi.');
    if (target.attemptCount > 0) {
      throw new Error('Không thể xóa đề thi đã có lịch sử làm bài. Vui lòng lưu trữ (ARCHIVED).');
    }
    if (target.status === 'PUBLISHED') {
      throw new Error('Không thể xóa trực tiếp đề thi PUBLISHED. Vui lòng chuyển sang ARCHIVED trước.');
    }
    this.mockStore = this.mockStore.filter((e) => e.id !== id);
  }
}

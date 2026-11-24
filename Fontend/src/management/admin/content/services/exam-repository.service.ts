import { httpClient } from '../../../../core/api/client/http-client';
import type { ContentStatus } from '../types/common-content.types';
import type {
  CreateExamInput,
  ExamDetail,
  ExamFilters,
  ExamStats,
  ExamSummary,
  UpdateExamInput,
  UpsertExamQuestionInput,
} from '../types/exam-repository.types';

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Exam Repository Service (Kho đề thi).
 * Connects directly to ASP.NET Core /api/v1/exams endpoints in production runtime.
 */
class ExamRepositoryService {
  private readonly baseEndpoint = '/exams';

  async getExams(filters?: Partial<ExamFilters>, page = 1, pageSize = 50): Promise<PagedResult<ExamSummary>> {
    const params: Record<string, string | number | boolean> = { page, pageSize };
    if (filters?.hskLevel && filters.hskLevel !== 'ALL') params.hskLevel = filters.hskLevel;
    if (filters?.examType && filters.examType !== 'ALL') params.examType = filters.examType;
    if (filters?.status && filters.status !== 'ALL') params.status = filters.status;
    if (filters?.search?.trim()) params.search = filters.search.trim();

    return httpClient.get<PagedResult<ExamSummary>>(this.baseEndpoint, { params });
  }

  async getStats(): Promise<ExamStats> {
    return httpClient.get<ExamStats>(`${this.baseEndpoint}/stats`);
  }

  async getExamById(id: string): Promise<ExamDetail> {
    return httpClient.get<ExamDetail>(`${this.baseEndpoint}/${id}`);
  }

  async createExam(input: CreateExamInput): Promise<ExamDetail> {
    if (input.hskLevel < 1 || input.hskLevel > 6) {
      throw new Error('Cấp độ HSK phải từ HSK 1 đến HSK 6 (HSK 2.0).');
    }
    return httpClient.post<ExamDetail>(this.baseEndpoint, input);
  }

  async updateExam(id: string, input: UpdateExamInput): Promise<ExamDetail> {
    if (input.hskLevel < 1 || input.hskLevel > 6) {
      throw new Error('Cấp độ HSK phải từ HSK 1 đến HSK 6 (HSK 2.0).');
    }
    return httpClient.put<ExamDetail>(`${this.baseEndpoint}/${id}`, input);
  }

  async setExamQuestions(id: string, questions: UpsertExamQuestionInput[]): Promise<ExamDetail> {
    return httpClient.put<ExamDetail>(`${this.baseEndpoint}/${id}/questions`, { questions });
  }

  async reviewExam(id: string, status: ContentStatus, reviewNotes?: string): Promise<ExamDetail> {
    return httpClient.post<ExamDetail>(`${this.baseEndpoint}/${id}/review`, {
      status,
      reviewNotes,
    });
  }

  async deleteExam(id: string): Promise<void> {
    await httpClient.delete<void>(`${this.baseEndpoint}/${id}`);
  }
}

export const examRepositoryService = new ExamRepositoryService();

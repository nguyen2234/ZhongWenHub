import type {
  AdminGrammarPoint,
  AdminGrammarFilters,
  CreateAdminGrammarDTO,
  UpdateAdminGrammarDTO,
} from '../types/admin-content.types';
import {
  repositoryContainer,
  MockGrammarRepository,
  type IGrammarRepository,
  type AdminGrammarStats,
} from '../../../../core/repositories';
import { defaultApiConfig } from '../../../../core/api/client/api-config';

/**
 * Application Service for Admin Grammar Management.
 * Delegates to IGrammarRepository (Mock or HTTP Adapter).
 * Maintains synchronous backward-compatibility for existing UI and tests while providing async methods for Backend readiness.
 */
export class AdminGrammarService {
  private get repo(): IGrammarRepository {
    return repositoryContainer.getGrammarRepository();
  }

  private get mockRepo(): MockGrammarRepository {
    const r = this.repo;
    if (r instanceof MockGrammarRepository) {
      return r;
    }
    return new MockGrammarRepository();
  }

  /**
   * Guard check: Sync methods cannot run over real HTTP network calls.
   */
  private ensureSyncSupported(methodName: string): void {
    if (!defaultApiConfig.useMock) {
      throw new Error(
        `[AdminGrammarService.${methodName}] Phương thức đồng bộ không khả dụng khi đang ở chế độ HTTP API Adapter. ` +
        `UI components phải sử dụng phương thức bất đồng bộ (${methodName}Async) hoặc cấu hình VITE_USE_MOCK_API=true.`
      );
    }
  }

  // --- Synchronous methods (Preserved for existing components and tests) ---

  getAll(filters?: Partial<AdminGrammarFilters>): AdminGrammarPoint[] {
    this.ensureSyncSupported('getAll');
    return this.mockRepo.getAllSync(filters);
  }

  getById(id: string): AdminGrammarPoint | undefined {
    this.ensureSyncSupported('getById');
    return this.mockRepo.getByIdSync(id);
  }

  create(dto: CreateAdminGrammarDTO): AdminGrammarPoint {
    this.ensureSyncSupported('create');
    return this.mockRepo.createSync(dto);
  }

  update(id: string, dto: UpdateAdminGrammarDTO): AdminGrammarPoint {
    this.ensureSyncSupported('update');
    return this.mockRepo.updateSync(id, dto);
  }

  delete(id: string): boolean {
    this.ensureSyncSupported('delete');
    return this.mockRepo.deleteSync(id);
  }

  getStats(): AdminGrammarStats {
    this.ensureSyncSupported('getStats');
    return this.mockRepo.getStatsSync();
  }

  resetToDefault(): void {
    this.mockRepo.resetToDefault();
  }

  // --- Asynchronous methods (For modern hooks & HTTP Backend integration) ---

  async getAllAsync(filters?: Partial<AdminGrammarFilters>): Promise<AdminGrammarPoint[]> {
    return this.repo.getAll(filters);
  }

  async getByIdAsync(id: string): Promise<AdminGrammarPoint | undefined> {
    return this.repo.getById(id);
  }

  async createAsync(dto: CreateAdminGrammarDTO): Promise<AdminGrammarPoint> {
    return this.repo.create(dto);
  }

  async updateAsync(id: string, dto: UpdateAdminGrammarDTO): Promise<AdminGrammarPoint> {
    return this.repo.update(id, dto);
  }

  async deleteAsync(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }

  async getStatsAsync(): Promise<AdminGrammarStats> {
    return this.repo.getStats();
  }
}

export const adminGrammarService = new AdminGrammarService();

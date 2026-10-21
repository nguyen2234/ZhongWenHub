import type {
  AdminExerciseItem,
  AdminExerciseFilters,
  CreateAdminExerciseDTO,
  UpdateAdminExerciseDTO,
} from '../types/admin-content.types';
import {
  repositoryContainer,
  MockExerciseRepository,
  type IExerciseRepository,
  type AdminExerciseStats,
} from '../../../../core/repositories';
import { defaultApiConfig } from '../../../../core/api/client/api-config';

/**
 * Application Service for Admin Exercise Bank Management.
 * Delegates to IExerciseRepository (Mock or HTTP Adapter).
 * Maintains synchronous backward-compatibility for existing UI and tests while providing async methods for Backend readiness.
 */
export class AdminExerciseService {
  private get repo(): IExerciseRepository {
    return repositoryContainer.getExerciseRepository();
  }

  private get mockRepo(): MockExerciseRepository {
    const r = this.repo;
    if (r instanceof MockExerciseRepository) {
      return r;
    }
    return new MockExerciseRepository();
  }

  /**
   * Guard check: Sync methods cannot run over real HTTP network calls.
   */
  private ensureSyncSupported(methodName: string): void {
    if (!defaultApiConfig.useMock) {
      throw new Error(
        `[AdminExerciseService.${methodName}] Phương thức đồng bộ không khả dụng khi đang ở chế độ HTTP API Adapter. ` +
        `UI components phải sử dụng phương thức bất đồng bộ (${methodName}Async) hoặc cấu hình VITE_USE_MOCK_API=true.`
      );
    }
  }

  // --- Synchronous methods (Preserved for existing components and tests) ---

  getAll(filters?: Partial<AdminExerciseFilters>): AdminExerciseItem[] {
    this.ensureSyncSupported('getAll');
    return this.mockRepo.getAllSync(filters);
  }

  getById(id: string): AdminExerciseItem | undefined {
    this.ensureSyncSupported('getById');
    return this.mockRepo.getByIdSync(id);
  }

  create(dto: CreateAdminExerciseDTO): AdminExerciseItem {
    this.ensureSyncSupported('create');
    return this.mockRepo.createSync(dto);
  }

  update(id: string, dto: UpdateAdminExerciseDTO): AdminExerciseItem {
    this.ensureSyncSupported('update');
    return this.mockRepo.updateSync(id, dto);
  }

  delete(id: string): boolean {
    this.ensureSyncSupported('delete');
    return this.mockRepo.deleteSync(id);
  }

  getStats(): AdminExerciseStats {
    this.ensureSyncSupported('getStats');
    return this.mockRepo.getStatsSync();
  }

  resetToDefault(): void {
    this.mockRepo.resetToDefault();
  }

  // --- Asynchronous methods (For modern hooks & HTTP Backend integration) ---

  async getAllAsync(filters?: Partial<AdminExerciseFilters>): Promise<AdminExerciseItem[]> {
    return this.repo.getAll(filters);
  }

  async getByIdAsync(id: string): Promise<AdminExerciseItem | undefined> {
    return this.repo.getById(id);
  }

  async createAsync(dto: CreateAdminExerciseDTO): Promise<AdminExerciseItem> {
    return this.repo.create(dto);
  }

  async updateAsync(id: string, dto: UpdateAdminExerciseDTO): Promise<AdminExerciseItem> {
    return this.repo.update(id, dto);
  }

  async deleteAsync(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }

  async getStatsAsync(): Promise<AdminExerciseStats> {
    return this.repo.getStats();
  }
}

export const adminExerciseService = new AdminExerciseService();

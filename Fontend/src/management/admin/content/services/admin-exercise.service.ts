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

  // --- Synchronous methods (Preserved for existing components and tests) ---

  getAll(filters?: Partial<AdminExerciseFilters>): AdminExerciseItem[] {
    return this.mockRepo.getAllSync(filters);
  }

  getById(id: string): AdminExerciseItem | undefined {
    return this.mockRepo.getByIdSync(id);
  }

  create(dto: CreateAdminExerciseDTO): AdminExerciseItem {
    return this.mockRepo.createSync(dto);
  }

  update(id: string, dto: UpdateAdminExerciseDTO): AdminExerciseItem {
    return this.mockRepo.updateSync(id, dto);
  }

  delete(id: string): boolean {
    return this.mockRepo.deleteSync(id);
  }

  getStats(): AdminExerciseStats {
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

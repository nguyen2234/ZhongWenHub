import type {
  AdminExerciseItem,
  AdminExerciseFilters,
  CreateAdminExerciseDTO,
  UpdateAdminExerciseDTO,
} from '../types/admin-content.types';
import {
  repositoryContainer,
  type IExerciseRepository,
  type AdminExerciseStats,
} from '../../../../core/repositories';

/**
 * Application Service for Admin Exercise Bank Management.
 * Delegates to IExerciseRepository (HTTP Adapter in production).
 * Asynchronous methods are used for Backend API operations.
 */
export class AdminExerciseService {
  private get repo(): IExerciseRepository {
    return repositoryContainer.getExerciseRepository();
  }

  private ensureSyncRepo(methodName: string): any {
    const r = this.repo as any;
    if (r && typeof r[`${methodName}Sync`] === 'function') {
      return r;
    }
    throw new Error(
      `[AdminExerciseService.${methodName}] Phương thức đồng bộ không khả dụng trong môi trường HTTP API production. ` +
      `UI components phải sử dụng phương thức bất đồng bộ (${methodName}Async).`
    );
  }

  // --- Synchronous methods (Preserved for test fixtures injecting a sync double) ---

  getAll(filters?: Partial<AdminExerciseFilters>): AdminExerciseItem[] {
    return this.ensureSyncRepo('getAll').getAllSync(filters);
  }

  getById(id: string): AdminExerciseItem | undefined {
    return this.ensureSyncRepo('getById').getByIdSync(id);
  }

  create(dto: CreateAdminExerciseDTO): AdminExerciseItem {
    return this.ensureSyncRepo('create').createSync(dto);
  }

  update(id: string, dto: UpdateAdminExerciseDTO): AdminExerciseItem {
    return this.ensureSyncRepo('update').updateSync(id, dto);
  }

  delete(id: string): boolean {
    return this.ensureSyncRepo('delete').deleteSync(id);
  }

  getStats(): AdminExerciseStats {
    return this.ensureSyncRepo('getStats').getStatsSync();
  }

  resetToDefault(): void {
    const r = this.repo as any;
    if (r && typeof r.resetToDefault === 'function') {
      r.resetToDefault();
    }
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

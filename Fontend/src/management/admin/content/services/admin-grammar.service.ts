import type {
  AdminGrammarPoint,
  AdminGrammarFilters,
  CreateAdminGrammarDTO,
  UpdateAdminGrammarDTO,
} from '../types/admin-content.types';
import {
  repositoryContainer,
  type IGrammarRepository,
  type AdminGrammarStats,
} from '../../../../core/repositories';

/**
 * Application Service for Admin Grammar Management.
 * Delegates to IGrammarRepository (HTTP Adapter in production).
 * Asynchronous methods are used for Backend API operations.
 */
export class AdminGrammarService {
  private get repo(): IGrammarRepository {
    return repositoryContainer.getGrammarRepository();
  }

  private ensureSyncRepo(methodName: string): any {
    const r = this.repo as any;
    if (r && typeof r[`${methodName}Sync`] === 'function') {
      return r;
    }
    throw new Error(
      `[AdminGrammarService.${methodName}] Phương thức đồng bộ không khả dụng trong môi trường HTTP API production. ` +
      `UI components phải sử dụng phương thức bất đồng bộ (${methodName}Async).`
    );
  }

  // --- Synchronous methods (Preserved for test fixtures injecting a sync double) ---

  getAll(filters?: Partial<AdminGrammarFilters>): AdminGrammarPoint[] {
    return this.ensureSyncRepo('getAll').getAllSync(filters);
  }

  getById(id: string): AdminGrammarPoint | undefined {
    return this.ensureSyncRepo('getById').getByIdSync(id);
  }

  create(dto: CreateAdminGrammarDTO): AdminGrammarPoint {
    return this.ensureSyncRepo('create').createSync(dto);
  }

  update(id: string, dto: UpdateAdminGrammarDTO): AdminGrammarPoint {
    return this.ensureSyncRepo('update').updateSync(id, dto);
  }

  delete(id: string): boolean {
    return this.ensureSyncRepo('delete').deleteSync(id);
  }

  getStats(): AdminGrammarStats {
    return this.ensureSyncRepo('getStats').getStatsSync();
  }

  resetToDefault(): void {
    const r = this.repo as any;
    if (r && typeof r.resetToDefault === 'function') {
      r.resetToDefault();
    }
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

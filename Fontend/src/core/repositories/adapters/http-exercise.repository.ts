import { httpClient } from '../../api/client/http-client';
import type {
  AdminExerciseItem,
  AdminExerciseFilters,
  CreateAdminExerciseDTO,
  UpdateAdminExerciseDTO,
} from '../../../management/admin/content/types/admin-content.types';
import type {
  IExerciseRepository,
  AdminExerciseStats,
} from '../interfaces/exercise-repository.interface';

/**
 * ASP.NET Core HTTP Implementation of IExerciseRepository.
 * Prepared for future Backend integration without modifying UI components.
 */
export class HttpExerciseRepository implements IExerciseRepository {
  private endpoint = '/admin/exercises';

  async getAll(filters?: Partial<AdminExerciseFilters>): Promise<AdminExerciseItem[]> {
    return httpClient.get<AdminExerciseItem[]>(this.endpoint, {
      params: filters as Record<string, string | number | boolean>,
    });
  }

  async getById(id: string): Promise<AdminExerciseItem | undefined> {
    try {
      return await httpClient.get<AdminExerciseItem>(`${this.endpoint}/${id}`);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'status' in err && (err as { status: number }).status === 404) {
        return undefined;
      }
      throw err;
    }
  }

  async create(dto: CreateAdminExerciseDTO): Promise<AdminExerciseItem> {
    return httpClient.post<AdminExerciseItem>(this.endpoint, dto);
  }

  async update(id: string, dto: UpdateAdminExerciseDTO): Promise<AdminExerciseItem> {
    return httpClient.put<AdminExerciseItem>(`${this.endpoint}/${id}`, dto);
  }

  async delete(id: string): Promise<boolean> {
    await httpClient.delete<void>(`${this.endpoint}/${id}`);
    return true;
  }

  async getStats(): Promise<AdminExerciseStats> {
    return httpClient.get<AdminExerciseStats>(`${this.endpoint}/stats`);
  }

  async resetToDefault(): Promise<void> {
    await httpClient.post<void>(`${this.endpoint}/reset-default`);
  }
}

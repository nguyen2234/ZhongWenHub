import { httpClient } from '../../api/client/http-client';
import type {
  AdminGrammarPoint,
  AdminGrammarFilters,
  CreateAdminGrammarDTO,
  UpdateAdminGrammarDTO,
} from '../../../management/admin/content/types/admin-content.types';
import type {
  IGrammarRepository,
  AdminGrammarStats,
} from '../interfaces/grammar-repository.interface';

/**
 * ASP.NET Core HTTP Implementation of IGrammarRepository.
 * Prepared for future Backend integration without changing UI components.
 */
export class HttpGrammarRepository implements IGrammarRepository {
  private endpoint = '/admin/grammar';

  async getAll(filters?: Partial<AdminGrammarFilters>): Promise<AdminGrammarPoint[]> {
    return httpClient.get<AdminGrammarPoint[]>(this.endpoint, {
      params: filters as Record<string, string | number | boolean>,
    });
  }

  async getById(id: string): Promise<AdminGrammarPoint | undefined> {
    try {
      return await httpClient.get<AdminGrammarPoint>(`${this.endpoint}/${id}`);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'status' in err && (err as { status: number }).status === 404) {
        return undefined;
      }
      throw err;
    }
  }

  async create(dto: CreateAdminGrammarDTO): Promise<AdminGrammarPoint> {
    return httpClient.post<AdminGrammarPoint>(this.endpoint, dto);
  }

  async update(id: string, dto: UpdateAdminGrammarDTO): Promise<AdminGrammarPoint> {
    return httpClient.put<AdminGrammarPoint>(`${this.endpoint}/${id}`, dto);
  }

  async delete(id: string): Promise<boolean> {
    await httpClient.delete<void>(`${this.endpoint}/${id}`);
    return true;
  }

  async getStats(): Promise<AdminGrammarStats> {
    return httpClient.get<AdminGrammarStats>(`${this.endpoint}/stats`);
  }

  async resetToDefault(): Promise<void> {
    await httpClient.post<void>(`${this.endpoint}/reset-default`);
  }
}

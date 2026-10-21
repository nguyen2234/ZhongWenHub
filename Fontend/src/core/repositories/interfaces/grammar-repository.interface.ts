import type {
  AdminGrammarPoint,
  AdminGrammarFilters,
  CreateAdminGrammarDTO,
  UpdateAdminGrammarDTO,
} from '../../../management/admin/content/types/admin-content.types';

export interface AdminGrammarStats {
  total: number;
  published: number;
  draft: number;
  pending: number;
  archived: number;
  byHsk: Record<number, number>;
}

/**
 * Data boundary contract for Grammar operations.
 * Allows transparent switching between Mock/LocalStorage and ASP.NET Core HTTP Web API.
 */
export interface IGrammarRepository {
  getAll(filters?: Partial<AdminGrammarFilters>): Promise<AdminGrammarPoint[]>;
  getById(id: string): Promise<AdminGrammarPoint | undefined>;
  create(dto: CreateAdminGrammarDTO): Promise<AdminGrammarPoint>;
  update(id: string, dto: UpdateAdminGrammarDTO): Promise<AdminGrammarPoint>;
  delete(id: string): Promise<boolean>;
  getStats(): Promise<AdminGrammarStats>;
  resetToDefault(): Promise<void>;
}

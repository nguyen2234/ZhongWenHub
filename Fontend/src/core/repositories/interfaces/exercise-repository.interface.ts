import type {
  AdminExerciseItem,
  AdminExerciseFilters,
  CreateAdminExerciseDTO,
  UpdateAdminExerciseDTO,
} from '../../../management/admin/content/types/admin-content.types';

export interface AdminExerciseStats {
  total: number;
  published: number;
  draft: number;
  pending: number;
  archived: number;
  byHsk: Record<number, number>;
  bySkill: Record<string, number>;
  byType: Record<string, number>;
}

/**
 * Data boundary contract for Exercise and Question Bank operations.
 * Allows transparent switching between Mock/LocalStorage and ASP.NET Core HTTP Web API.
 */
export interface IExerciseRepository {
  getAll(filters?: Partial<AdminExerciseFilters>): Promise<AdminExerciseItem[]>;
  getById(id: string): Promise<AdminExerciseItem | undefined>;
  create(dto: CreateAdminExerciseDTO): Promise<AdminExerciseItem>;
  update(id: string, dto: UpdateAdminExerciseDTO): Promise<AdminExerciseItem>;
  delete(id: string): Promise<boolean>;
  getStats(): Promise<AdminExerciseStats>;
  resetToDefault(): Promise<void>;
}

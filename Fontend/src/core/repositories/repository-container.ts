import { defaultApiConfig } from '../api/client/api-config';
import type { IGrammarRepository } from './interfaces/grammar-repository.interface';
import type { IExerciseRepository } from './interfaces/exercise-repository.interface';
import { MockGrammarRepository } from './adapters/mock-grammar.repository';
import { HttpGrammarRepository } from './adapters/http-grammar.repository';
import { MockExerciseRepository } from './adapters/mock-exercise.repository';
import { HttpExerciseRepository } from './adapters/http-exercise.repository';

/**
 * Service container for data repositories.
 * Controls dependency injection between Mock adapters and ASP.NET Core HTTP adapters.
 */
class RepositoryContainer {
  private grammarRepositoryInstance?: IGrammarRepository;
  private exerciseRepositoryInstance?: IExerciseRepository;

  /**
   * Returns active Grammar Repository (Mock or HTTP based on config).
   */
  getGrammarRepository(): IGrammarRepository {
    if (!this.grammarRepositoryInstance) {
      this.grammarRepositoryInstance = defaultApiConfig.useMock
        ? new MockGrammarRepository()
        : new HttpGrammarRepository();
    }
    return this.grammarRepositoryInstance;
  }

  /**
   * Returns active Exercise Repository (Mock or HTTP based on config).
   */
  getExerciseRepository(): IExerciseRepository {
    if (!this.exerciseRepositoryInstance) {
      this.exerciseRepositoryInstance = defaultApiConfig.useMock
        ? new MockExerciseRepository()
        : new HttpExerciseRepository();
    }
    return this.exerciseRepositoryInstance;
  }

  /**
   * Override repository for unit testing or dynamic runtime reconfiguration.
   */
  setGrammarRepository(repo: IGrammarRepository): void {
    this.grammarRepositoryInstance = repo;
  }

  setExerciseRepository(repo: IExerciseRepository): void {
    this.exerciseRepositoryInstance = repo;
  }

  reset(): void {
    this.grammarRepositoryInstance = undefined;
    this.exerciseRepositoryInstance = undefined;
  }
}

export const repositoryContainer = new RepositoryContainer();

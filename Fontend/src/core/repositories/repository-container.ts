import type { IGrammarRepository } from './interfaces/grammar-repository.interface';
import type { IExerciseRepository } from './interfaces/exercise-repository.interface';
import { HttpGrammarRepository } from './adapters/http-grammar.repository';
import { HttpExerciseRepository } from './adapters/http-exercise.repository';

/**
 * Service container for data repositories.
 * In production runtime, delegates exclusively to ASP.NET Core HTTP adapters.
 * Test fixtures may inject test doubles via setGrammarRepository / setExerciseRepository.
 */
class RepositoryContainer {
  private grammarRepositoryInstance?: IGrammarRepository;
  private exerciseRepositoryInstance?: IExerciseRepository;

  /**
   * Returns active Grammar Repository (HTTP Adapter in production runtime).
   */
  getGrammarRepository(): IGrammarRepository {
    if (!this.grammarRepositoryInstance) {
      this.grammarRepositoryInstance = new HttpGrammarRepository();
    }
    return this.grammarRepositoryInstance;
  }

  /**
   * Returns active Exercise Repository (HTTP Adapter in production runtime).
   */
  getExerciseRepository(): IExerciseRepository {
    if (!this.exerciseRepositoryInstance) {
      this.exerciseRepositoryInstance = new HttpExerciseRepository();
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

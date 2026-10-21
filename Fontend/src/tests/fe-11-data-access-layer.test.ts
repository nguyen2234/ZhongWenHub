// @ts-nocheck
import { describe, test, expect, beforeEach } from 'bun:test';
import {
  isProblemDetails,
  ProblemDetails,
  ApiClientError,
  authTokenService,
  paginateArray,
  HttpClient,
} from '../core/api';
import {
  MockGrammarRepository,
  MockExerciseRepository,
  HttpGrammarRepository,
  HttpExerciseRepository,
  repositoryContainer,
} from '../core/repositories';
import { adminGrammarService } from '../management/admin/content/services/admin-grammar.service';
import { adminExerciseService } from '../management/admin/content/services/admin-exercise.service';
import { defaultApiConfig } from '../core/api/client/api-config';

describe('FE-11: Data Access Layer & Backend Readiness Unit Tests', () => {
  beforeEach(() => {
    repositoryContainer.reset();
  });

  // 1. Problem Details & Error Handling
  describe('1. RFC 7807 Problem Details & ApiClientError', () => {
    test('correctly identifies valid ProblemDetails structure', () => {
      const validProblem: ProblemDetails = {
        title: 'Validation Failed',
        status: 400,
        detail: 'One or more fields failed validation.',
        errors: {
          Title: ['Title is required.'],
        },
      };

      expect(isProblemDetails(validProblem)).toBe(true);
      expect(isProblemDetails({ foo: 'bar' })).toBe(false);
      expect(isProblemDetails(null)).toBe(false);
      expect(isProblemDetails(undefined)).toBe(false);
    });

    test('constructs ApiClientError from ProblemDetails with flattened validation errors', () => {
      const problem: ProblemDetails = {
        title: 'Lỗi xác thực',
        status: 422,
        detail: 'Dữ liệu bài tập không hợp lệ',
        errors: {
          title: ['Tiêu đề không được để trống'],
          hskLevel: ['Cấp độ HSK phải từ 1 đến 6'],
        },
      };

      const error = ApiClientError.fromResponse(422, problem);
      expect(error.status).toBe(422);
      expect(error.message).toContain('Lỗi xác thực');
      expect(error.message).toContain('Dữ liệu bài tập không hợp lệ');

      const flatErrors = error.getFlatValidationErrors();
      expect(flatErrors.length).toBe(2);
      expect(flatErrors).toContain('Tiêu đề không được để trống');
      expect(flatErrors).toContain('Cấp độ HSK phải từ 1 đến 6');
    });

    test('constructs ApiClientError for network errors', () => {
      const error = ApiClientError.networkError();
      expect(error.isNetworkError).toBe(true);
      expect(error.status).toBe(0);
      expect(error.message).toContain('Không thể kết nối đến máy chủ');
    });
  });

  // 2. Auth Token Boundary
  describe('2. Authentication Token Boundary (In-Memory Security)', () => {
    test('stores access token strictly in-memory and does not leak refresh token to storage', () => {
      authTokenService.clearTokens();
      expect(authTokenService.isAuthenticated()).toBe(false);
      expect(authTokenService.getAccessToken()).toBeNull();

      authTokenService.setTokens({
        accessToken: 'memory-bearer-token-12345',
        refreshToken: 'should-not-be-in-localstorage',
      });

      expect(authTokenService.isAuthenticated()).toBe(true);
      expect(authTokenService.getAccessToken()).toBe('memory-bearer-token-12345');

      // Verify localStorage does not have refresh token
      if (typeof window !== 'undefined') {
        expect(window.localStorage.getItem('zhongwenhub_auth_tokens_v1')).toBeNull();
        expect(window.localStorage.getItem('refresh_token')).toBeNull();
      }

      authTokenService.clearTokens();
      expect(authTokenService.isAuthenticated()).toBe(false);
      expect(authTokenService.getAccessToken()).toBeNull();
    });

    test('invalidates expired tokens automatically', () => {
      authTokenService.setSession({
        accessToken: 'expired-token',
        expiresAt: Date.now() - 1000, // expired 1s ago
      });

      expect(authTokenService.isAuthenticated()).toBe(false);
      expect(authTokenService.getAccessToken()).toBeNull();
    });
  });

  // 3. Pagination
  describe('3. Pagination Helpers', () => {
    test('paginates arbitrary collections accurately', () => {
      const items = Array.from({ length: 45 }, (_, i) => ({ id: i + 1 }));
      const page1 = paginateArray(items, 1, 10);

      expect(page1.items.length).toBe(10);
      expect(page1.totalCount).toBe(45);
      expect(page1.totalPages).toBe(5);
      expect(page1.pageNumber).toBe(1);
      expect(page1.hasPreviousPage).toBe(false);
      expect(page1.hasNextPage).toBe(true);

      const page5 = paginateArray(items, 5, 10);
      expect(page5.items.length).toBe(5);
      expect(page5.hasNextPage).toBe(false);
      expect(page5.hasPreviousPage).toBe(true);
    });
  });

  // 4. Grammar Repository
  describe('4. Mock & HTTP Grammar Repository Adapters', () => {
    test('MockGrammarRepository supports async CRUD and maintains stability', async () => {
      const repo = new MockGrammarRepository();
      await repo.resetToDefault();

      const items = await repo.getAll();
      expect(items.length).toBeGreaterThanOrEqual(14);

      // Async create
      const created = await repo.create({
        code: 'HSK1_TEST',
        title: 'Ngữ pháp kiểm thử',
        pinyinTitle: 'ceshi',
        hskLevel: 1,
        category: 'cơ bản',
        structureFormula: 'S + V',
        explanation: 'Giải thích kiểm thử',
        difficulty: 'Dễ',
        status: 'DRAFT',
        examples: [{ zh: '测试', pinyin: 'cèshì', meaningVi: 'Kiểm thử' }],
      });

      expect(created.id).toBeDefined();
      expect(created.status).toBe('DRAFT');

      // Async getById
      const retrieved = await repo.getById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe('Ngữ pháp kiểm thử');

      // Async stats
      const stats = await repo.getStats();
      expect(stats.draft).toBeGreaterThanOrEqual(1);

      // Cleanup
      await repo.delete(created.id);
      const afterDelete = await repo.getById(created.id);
      expect(afterDelete).toBeUndefined();
    });

    test('HttpGrammarRepository instances instantiate with correct endpoint contracts', () => {
      const httpRepo = new HttpGrammarRepository();
      expect(httpRepo).toBeDefined();
      expect(typeof httpRepo.getAll).toBe('function');
      expect(typeof httpRepo.create).toBe('function');
      expect(typeof httpRepo.update).toBe('function');
      expect(typeof httpRepo.delete).toBe('function');
      expect(typeof httpRepo.getStats).toBe('function');
    });
  });

  // 5. Exercise Repository
  describe('5. Mock & HTTP Exercise Repository Adapters', () => {
    test('MockExerciseRepository supports async CRUD and query filters', async () => {
      const repo = new MockExerciseRepository();
      await repo.resetToDefault();

      const all = await repo.getAll();
      expect(all.length).toBeGreaterThanOrEqual(14);

      const filtered = await repo.getAll({ hskLevel: 2 });
      expect(filtered.every((e) => e.hskLevel === 2)).toBe(true);

      const stats = await repo.getStats();
      expect(stats.total).toBe(all.length);
      expect(stats.published).toBeGreaterThanOrEqual(1);
    });

    test('HttpExerciseRepository instances instantiate with correct endpoint contracts', () => {
      const httpRepo = new HttpExerciseRepository();
      expect(httpRepo).toBeDefined();
      expect(typeof httpRepo.getAll).toBe('function');
      expect(typeof httpRepo.create).toBe('function');
      expect(typeof httpRepo.update).toBe('function');
      expect(typeof httpRepo.delete).toBe('function');
      expect(typeof httpRepo.getStats).toBe('function');
    });
  });

  // 6. Repository Container Switching & Guard Check
  describe('6. Dependency Injection Container & Sync Guards', () => {
    test('provides active repository and allows test mocking overrides', () => {
      const defaultGrammarRepo = repositoryContainer.getGrammarRepository();
      expect(defaultGrammarRepo).toBeInstanceOf(MockGrammarRepository);

      // Override with custom mock
      const customMock = new MockGrammarRepository();
      repositoryContainer.setGrammarRepository(customMock);
      expect(repositoryContainer.getGrammarRepository()).toBe(customMock);

      repositoryContainer.reset();
      expect(repositoryContainer.getGrammarRepository()).not.toBe(customMock);
    });

    test('guards against calling synchronous methods when HTTP mode is active', () => {
      // Temporarily simulate HTTP mode
      const originalMode = defaultApiConfig.useMock;
      try {
        defaultApiConfig.useMock = false;

        expect(() => adminGrammarService.getAll()).toThrow(
          /Phương thức đồng bộ không khả dụng khi đang ở chế độ HTTP API Adapter/
        );
        expect(() => adminExerciseService.getAll()).toThrow(
          /Phương thức đồng bộ không khả dụng khi đang ở chế độ HTTP API Adapter/
        );
      } finally {
        defaultApiConfig.useMock = originalMode;
      }
    });
  });

  // 7. HttpClient pre-abort and timeout guard
  describe('7. HttpClient Cancellation & Pre-abort Handling', () => {
    test('rejects immediately when passed an already-aborted signal', async () => {
      const client = new HttpClient();
      const controller = new AbortController();
      controller.abort();

      try {
        await client.get('/test', { signal: controller.signal });
        expect(true).toBe(false); // Should not reach
      } catch (err: any) {
        expect(err.status).toBe(499);
        expect(err.message).toContain('bị hủy');
      }
    });
  });
});

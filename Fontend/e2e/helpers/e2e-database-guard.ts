import { APIRequestContext } from '@playwright/test';

export interface DatabaseEnvironmentInfo {
  databaseName: string;
  dataSource?: string;
  isTestDatabase: boolean;
  environment: string;
  timestampUtc: string;
}

/**
 * Strict Fail-Closed Pre-Flight Guard for E2E Tests:
 * Verifies that the running backend is explicitly connected to 'ZhongWenHub_Test'
 * and operating under 'Testing' environment before executing any operations.
 * 
 * If the backend is running against ZhongWenHub_Dev, or if the database name cannot
 * be verified, this function throws a fatal error and halts test execution immediately.
 */
export async function verifyTestDatabaseOrThrow(request: APIRequestContext): Promise<DatabaseEnvironmentInfo> {
  const res = await request.get('/api/v1/system/database-environment');
  
  if (!res.ok()) {
    throw new Error(
      `[FATAL E2E VIOLATION] Unable to verify backend database environment! ` +
      `Endpoint '/api/v1/system/database-environment' returned status ${res.status()}. ` +
      `E2E write tests are strictly halted to prevent accidental execution against production/dev databases.`
    );
  }

  const data: DatabaseEnvironmentInfo = await res.json();

  const isExactTestDb = (data.databaseName || '').trim().toLowerCase() === 'zhongwenhub_test';
  const isTestingEnv = (data.environment || '').trim().toLowerCase() === 'testing';

  if (!isExactTestDb || !isTestingEnv || !data.isTestDatabase) {
    throw new Error(
      `[FATAL E2E VIOLATION] Target backend environment validation failed! ` +
      `databaseName='${data.databaseName}', environment='${data.environment}', isTestDatabase=${data.isTestDatabase}. ` +
      `E2E tests that create, modify, or delete data require exact match: 'ZhongWenHub_Test' on 'Testing' environment. ` +
      `Execution halted immediately.`
    );
  }

  return data;
}

import { APIRequestContext } from '@playwright/test';

export interface DatabaseEnvironmentInfo {
  databaseName: string;
  isTestDatabase: boolean;
  environment: string;
  timestampUtc: string;
}

/**
 * Strict Pre-Flight Guard for E2E Tests:
 * Verifies that the running backend is explicitly connected to ZhongWenHub_Test
 * before executing any data-modifying operations.
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

  if (!data.isTestDatabase || data.databaseName.toLowerCase().endsWith('_dev')) {
    throw new Error(
      `[FATAL E2E VIOLATION] Target backend is currently connected to '${data.databaseName}'! ` +
      `E2E tests that create, modify, or delete data are strictly forbidden on ZhongWenHub_Dev! ` +
      `Please switch the backend server to ZhongWenHub_Test before running E2E tests.`
    );
  }

  return data;
}

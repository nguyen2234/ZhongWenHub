import { request, FullConfig } from '@playwright/test';
import { verifyTestDatabaseOrThrow } from './helpers/e2e-database-guard';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || 'http://127.0.0.1:5173';
  console.log(`\n[E2E Global Setup] Checking backend database environment via ${baseURL}...`);

  const reqContext = await request.newContext({ baseURL });
  try {
    const info = await verifyTestDatabaseOrThrow(reqContext);
    console.log(`[E2E Pre-Flight Guard] SUCCESS: Verified backend database is '${info.databaseName}' (isTestDatabase: ${info.isTestDatabase}). Safe to execute tests.\n`);
  } catch (err: any) {
    console.error(`\n================================================================`);
    console.error(`[E2E FATAL ERROR] DATABASE ISOLATION GUARD TRIGGERED:`);
    console.error(err.message);
    console.error(`================================================================\n`);
    throw err;
  } finally {
    await reqContext.dispose();
  }
}

export default globalSetup;

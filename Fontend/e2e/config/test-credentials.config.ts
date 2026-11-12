/**
 * Secure Test Credentials Configuration for E2E Tests
 * Strictly loads credentials from environment variables to prevent committing secrets.
 */
function getCredential(envVarName: string, defaultEmail: string, envPasswordVar: string): { email: string; password: () => string } {
  return {
    email: process.env[envVarName] || defaultEmail,
    password: () => {
      const pass = process.env[envPasswordVar] || process.env.DEV_DEMO_PASSWORD;
      if (!pass) {
        throw new Error(
          `[SECURITY ERROR] Missing test password in environment variable '${envPasswordVar}' or 'DEV_DEMO_PASSWORD'. ` +
          `Never hardcode passwords in source files.`
        );
      }
      return pass;
    }
  };
}

export const testCredentials = {
  admin: getCredential('E2E_ADMIN_EMAIL', 'admin@gmail.com', 'E2E_ADMIN_PASSWORD'),
  contentManager: getCredential('E2E_CONTENT_MANAGER_EMAIL', 'content.hongphuc.demo@zhongwenhub.edu.vn', 'E2E_CONTENT_MANAGER_PASSWORD'),
  student: getCredential('E2E_STUDENT_EMAIL', 'student.an.demo@zhongwenhub.edu.vn', 'E2E_STUDENT_PASSWORD'),
  teacher: getCredential('E2E_TEACHER_EMAIL', 'teacher.hung.demo@zhongwenhub.edu.vn', 'E2E_TEACHER_PASSWORD'),
};

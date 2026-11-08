/**
 * Secure Test Credentials Configuration for E2E Tests
 * Reads from environment variables if present, falling back to standard local test accounts.
 */
export const testCredentials = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@gmail.com',
    password: process.env.E2E_ADMIN_PASSWORD || 'admin',
  },
  contentManager: {
    email: process.env.E2E_CONTENT_MANAGER_EMAIL || 'contentmanager@zhongwenhub.edu.vn',
    password: process.env.E2E_CONTENT_MANAGER_PASSWORD || 'ContentManager123!',
  },
  student: {
    email: process.env.E2E_STUDENT_EMAIL || 'student.an.demo@zhongwenhub.edu.vn',
    password: process.env.E2E_STUDENT_PASSWORD || 'Demo@2026!ZhongWen',
  },
  teacher: {
    email: process.env.E2E_TEACHER_EMAIL || 'teacher.hung.demo@zhongwenhub.edu.vn',
    password: process.env.E2E_TEACHER_PASSWORD || 'Teacher123!',
  },
};

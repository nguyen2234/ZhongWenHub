// @ts-ignore
import { describe, it, expect, beforeEach } from 'bun:test';
import { PORTAL_DEFINITIONS, type PortalDef } from '../management/shared/components/PortalSwitcher';


describe('PHẦN A — Portal Switcher & RBAC Access Rules', () => {
  it('should define exactly 4 portals with valid routes and metadata', () => {
    expect(PORTAL_DEFINITIONS).toHaveLength(4);

    const ids = PORTAL_DEFINITIONS.map((p) => p.id);
    expect(ids).toContain('STUDENT');
    expect(ids).toContain('TEACHER');
    expect(ids).toContain('CONTENT_MANAGER');
    expect(ids).toContain('ADMIN');

    const studentPortal = PORTAL_DEFINITIONS.find((p) => p.id === 'STUDENT')!;
    expect(studentPortal.path).toBe('/dashboard');
    expect(studentPortal.name).toBe('Cổng Học Viên');

    const teacherPortal = PORTAL_DEFINITIONS.find((p) => p.id === 'TEACHER')!;
    expect(teacherPortal.path).toBe('/management/teacher/dashboard');
    expect(teacherPortal.name).toBe('Cổng Giáo Viên');

    const cmPortal = PORTAL_DEFINITIONS.find((p) => p.id === 'CONTENT_MANAGER')!;
    expect(cmPortal.path).toBe('/management/content-manager/dashboard');
    expect(cmPortal.name).toBe('Cổng Quản Lý Học Liệu');

    const adminPortal = PORTAL_DEFINITIONS.find((p) => p.id === 'ADMIN')!;
    expect(adminPortal.path).toBe('/management/admin/dashboard');
    expect(adminPortal.name).toBe('Cổng Quản Trị Hệ Thống');
  });

  // Helper simulating getAvailablePortals
  function filterPortalsForUser(userRoles: string[]): PortalDef[] {
    const roleSet = new Set(userRoles);
    const isSuperOrAdmin = roleSet.has('ADMIN') || roleSet.has('SUPER_ADMIN');

    return PORTAL_DEFINITIONS.filter((portal) => {
      if (portal.id === 'STUDENT') return true;
      if (isSuperOrAdmin) return true;
      return portal.allowedRoles.some((r) => roleSet.has(r));
    });
  }

  it('STUDENT user should ONLY see Student Portal', () => {
    const portals = filterPortalsForUser(['STUDENT']);
    expect(portals).toHaveLength(1);
    expect(portals[0].id).toBe('STUDENT');
  });

  it('TEACHER user should see Student Portal and Teacher Portal only', () => {
    const portals = filterPortalsForUser(['TEACHER']);
    expect(portals).toHaveLength(2);
    const ids = portals.map((p) => p.id);
    expect(ids).toContain('STUDENT');
    expect(ids).toContain('TEACHER');
    expect(ids).not.toContain('CONTENT_MANAGER');
    expect(ids).not.toContain('ADMIN');
  });

  it('CONTENT_MANAGER user should see Student Portal and Content Manager Portal only', () => {
    const portals = filterPortalsForUser(['CONTENT_MANAGER']);
    expect(portals).toHaveLength(2);
    const ids = portals.map((p) => p.id);
    expect(ids).toContain('STUDENT');
    expect(ids).toContain('CONTENT_MANAGER');
    expect(ids).not.toContain('TEACHER');
    expect(ids).not.toContain('ADMIN');
  });

  it('ADMIN / SUPER_ADMIN user should see ALL 4 portals', () => {
    const adminPortals = filterPortalsForUser(['ADMIN']);
    expect(adminPortals).toHaveLength(4);

    const superAdminPortals = filterPortalsForUser(['SUPER_ADMIN']);
    expect(superAdminPortals).toHaveLength(4);
  });

  it('Multi-role user with [TEACHER, CONTENT_MANAGER] should see 3 portals without admin portal', () => {
    const portals = filterPortalsForUser(['TEACHER', 'CONTENT_MANAGER']);
    expect(portals).toHaveLength(3);
    const ids = portals.map((p) => p.id);
    expect(ids).toContain('STUDENT');
    expect(ids).toContain('TEACHER');
    expect(ids).toContain('CONTENT_MANAGER');
    expect(ids).not.toContain('ADMIN');
  });
});

describe('PHẦN B — Excel Template & File Validation Rules', () => {
  it('validates supported file extensions (.xlsx and .csv only)', () => {
    const isSupported = (filename: string) => {
      const lower = filename.toLowerCase();
      return lower.endsWith('.xlsx') || lower.endsWith('.csv');
    };

    expect(isSupported('Mau_Import_TuVung_HSK.xlsx')).toBe(true);
    expect(isSupported('hsk-1.csv')).toBe(true);
    expect(isSupported('vocabulary.xls')).toBe(false);
    expect(isSupported('vocab.pdf')).toBe(false);
    expect(isSupported('data.json')).toBe(false);
  });

  it('validates HSK levels strictly between 1 and 6, rejecting HSK 7-9', () => {
    const validateHskLevel = (level: number) => {
      if (level < 1 || level > 6) {
        return { valid: false, reason: `Cấp độ HSK không hợp lệ ('${level}'). Hệ thống chỉ hỗ trợ chuẩn HSK 3.0 từ cấp 1 đến cấp 6, từ chối cấp 7–9.` };
      }
      return { valid: true };
    };

    expect(validateHskLevel(1).valid).toBe(true);
    expect(validateHskLevel(2).valid).toBe(true);
    expect(validateHskLevel(6).valid).toBe(true);
    expect(validateHskLevel(7).valid).toBe(false);
    expect(validateHskLevel(8).valid).toBe(false);
    expect(validateHskLevel(9).valid).toBe(false);
    expect(validateHskLevel(0).valid).toBe(false);
    expect(validateHskLevel(7).reason).toContain('từ chối cấp 7–9');
  });

  it('sanitizes formula injection triggers (=, +, -, @) safely', () => {
    const sanitizeCellValue = (raw: string) => {
      let str = raw.trim();
      if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
        str = str.replace(/^[=+\-@]+/, '').trim();
      }
      return str;
    };

    expect(sanitizeCellValue('=1+1')).toBe('1+1');
    expect(sanitizeCellValue('+cmd|/c calc')).toBe('cmd|/c calc');
    expect(sanitizeCellValue('@SUM(A1:A10)')).toBe('SUM(A1:A10)');
    expect(sanitizeCellValue('你好')).toBe('你好');
  });

  it('validates Import Wizard state transitions and safety guardrails', () => {
    type WizardState =
      | 'SELECT_FILE'
      | 'PREVIEW_LOADING'
      | 'PREVIEW_READY'
      | 'IMPORT_LOADING'
      | 'IMPORT_SUCCESS'
      | 'IMPORT_ERROR';

    let state: WizardState = 'SELECT_FILE';
    let file: { name: string; size: number } | null = null;
    let previewResult: { importedCount: number; skippedCount: number; failedCount: number } | null = null;

    // Rule 1: Cannot preview without file
    const canPreview = (s: WizardState, f: typeof file) => s === 'SELECT_FILE' && f !== null;
    expect(canPreview(state, file)).toBe(false);

    // Rule 2: Selecting file allows preview
    file = { name: 'test.xlsx', size: 10240 };
    expect(canPreview(state, file)).toBe(true);

    // Transition to PREVIEW_LOADING
    state = 'PREVIEW_LOADING';

    // Transition to PREVIEW_READY
    previewResult = { importedCount: 2, skippedCount: 1, failedCount: 0 };
    state = 'PREVIEW_READY';

    // Rule 3: Cannot import if importedCount <= 0
    const canImport = (s: WizardState, res: typeof previewResult) => s === 'PREVIEW_READY' && res !== null && res.importedCount > 0;
    expect(canImport(state, previewResult)).toBe(true);

    // If importedCount is 0 (all duplicates or errors)
    const zeroValidResult = { importedCount: 0, skippedCount: 2, failedCount: 1 };
    expect(canImport(state, zeroValidResult)).toBe(false);

    // Transition to IMPORT_LOADING -> IMPORT_SUCCESS
    state = 'IMPORT_LOADING';
    state = 'IMPORT_SUCCESS';
    expect(state).toBe('IMPORT_SUCCESS');
  });
});

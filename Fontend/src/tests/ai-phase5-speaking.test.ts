import { describe, it, expect } from 'bun:test';
import { studentRoutes } from '../app/router/student.routes';
import {
  HANBEEGO_STUDENT_NAV_GROUPS,
  STUDENT_MAIN_NAV_ITEMS,
} from '../config/student-navigation.config';

describe('Retired Standalone Skills (Listening, Speaking, Reading, Writing) Decommission Acceptance', () => {
  it('redirects all retired skill routes to /practice', () => {
    const layoutRoute = studentRoutes.find((r) => r.path === '/');
    expect(layoutRoute).toBeDefined();
    expect(layoutRoute?.children).toBeDefined();

    const children = layoutRoute!.children!;
    const retiredPaths = [
      'skills/listening',
      'skills/speaking',
      'speaking',
      'skills/reading',
      'skills/writing',
    ];

    retiredPaths.forEach((path) => {
      const route = children.find((r) => r.path === path);
      expect(route).toBeDefined();
      // Element is <Navigate to="/practice" replace />
      const element = route?.element as any;
      expect(element).toBeDefined();
      expect(element.props?.to).toBe('/practice');
      expect(element.props?.replace).toBe(true);
    });
  });

  it('verifies that standalone skill modules are absent from student sidebar navigation', () => {
    const groupIds = HANBEEGO_STUDENT_NAV_GROUPS.map((g) => g.id);
    expect(groupIds).not.toContain('skills');

    const allSidebarItems = HANBEEGO_STUDENT_NAV_GROUPS.flatMap((g) => g.items);
    const allSidebarPaths = allSidebarItems.map((i) => i.path);

    expect(allSidebarPaths).not.toContain('/skills/listening');
    expect(allSidebarPaths).not.toContain('/skills/speaking');
    expect(allSidebarPaths).not.toContain('/skills/reading');
    expect(allSidebarPaths).not.toContain('/skills/writing');
    expect(allSidebarPaths).not.toContain('/speaking');
  });

  it('verifies that standalone skill modules are absent from student main navigation and secondary items', () => {
    const mainNavIds = STUDENT_MAIN_NAV_ITEMS.map((i) => i.id);
    expect(mainNavIds).not.toContain('skills');
    expect(mainNavIds).not.toContain('speaking');

    const allSecondaryItems = STUDENT_MAIN_NAV_ITEMS.flatMap((i) => i.secondaryFeatures);
    const allSecondaryPaths = allSecondaryItems.map((i) => i.path);

    expect(allSecondaryPaths).not.toContain('/skills/listening');
    expect(allSecondaryPaths).not.toContain('/skills/speaking');
    expect(allSecondaryPaths).not.toContain('/skills/reading');
    expect(allSecondaryPaths).not.toContain('/skills/writing');
  });

  it('preserves shared learning capabilities and AI tutor routes', () => {
    const layoutRoute = studentRoutes.find((r) => r.path === '/');
    const children = layoutRoute!.children!;
    const childPaths = children.map((r) => r.path);

    // Active learning and practice routes
    expect(childPaths).toContain('dashboard');
    expect(childPaths).toContain('learning-path');
    expect(childPaths).toContain('lesson');
    expect(childPaths).toContain('vocabulary');
    expect(childPaths).toContain('grammar');
    expect(childPaths).toContain('practice');
    expect(childPaths).toContain('mock-exams');
    expect(childPaths).toContain('ai-tutor');
    expect(childPaths).toContain('ai-live');
    expect(childPaths).toContain('ai-grading');
    expect(childPaths).toContain('videos');
  });
});

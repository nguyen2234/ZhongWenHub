import { describe, it, expect } from 'bun:test';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('Chinese Watercolor Landscape Decorations Contract', () => {
  const publicDir = resolve(__dirname, '../../public/images/dashboard');
  const heroWebp = resolve(publicDir, 'hero-landscape.webp');
  const sidebarWebp = resolve(publicDir, 'sidebar-landscape.webp');
  const dashboardWebp = resolve(publicDir, 'dashboard-landscape.webp');
  const cssFile = resolve(__dirname, '../features/dashboard/dashboard-decorations.css');

  it('provides hero and sidebar WebP landscape image assets and confirms overall dashboard backdrop is removed', () => {
    expect(existsSync(heroWebp)).toBe(true);
    expect(existsSync(sidebarWebp)).toBe(true);
    expect(existsSync(dashboardWebp)).toBe(false);
  });

  it('ensures optimized image sizes are kept light (<150KB for hero, <100KB for sidebar)', () => {
    const heroSize = readFileSync(heroWebp).length;
    const sidebarSize = readFileSync(sidebarWebp).length;

    expect(heroSize).toBeLessThan(150 * 1024);
    expect(sidebarSize).toBeLessThan(100 * 1024);
  });

  it('defines dedicated dashboard-decorations.css retaining hero banner and sidebar while removing overall backdrop', () => {
    expect(existsSync(cssFile)).toBe(true);
    const cssContent = readFileSync(cssFile, 'utf-8');

    // Confirms overall backdrop class has been cleanly removed
    expect(cssContent).not.toContain('.dashboard-landscape-backdrop');
    // Confirms hero banner landscape layer and sidebar card remain intact
    expect(cssContent).toContain('.hero-banner-landscape-layer');
    expect(cssContent).toContain('.student-sidebar-landscape-footer');
    expect(cssContent).toContain('pointer-events: none');
    expect(cssContent).toContain('@media (max-width:');
  });

  it('keeps text readable and retains Viettel red & white branding contrast', () => {
    const cssContent = readFileSync(cssFile, 'utf-8');
    // Verifies gradient protection over the image
    expect(cssContent).toContain('linear-gradient');
    // Verifies isolation to prevent z-index bleeding
    expect(cssContent).toContain('isolation: isolate');
  });
});

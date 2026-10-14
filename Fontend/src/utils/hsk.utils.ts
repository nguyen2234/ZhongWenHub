import { hskRepositoryService } from '../management/admin/content/services/hsk-repository.service';

/**
 * Normalizes any entity identifier (number or string) to a clean, trimmed string.
 * Prevents unsafe string/number comparisons across boundaries.
 */
export function normalizeEntityId(id: string | number): string {
  return String(id).trim();
}

/**
 * Maps an HSK Level ID (e.g. 'level-hsk-2', 'level-hsk-79') to its numeric level representation.
 * Supports HSK 1 through HSK 7-9 (represented numerically as 7 for ordering).
 */
export function hskLevelIdToNumber(hskLevelId?: string): number | undefined {
  if (!hskLevelId) return undefined;
  const trimmed = hskLevelId.trim().toLowerCase();

  if (trimmed === 'level-hsk-79' || trimmed === 'hsk7_9' || trimmed === 'hsk7-9') {
    return 7;
  }

  const match = trimmed.match(/level-hsk-(\d+)/) || trimmed.match(/hsk(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    return Number.isFinite(num) ? num : undefined;
  }

  const parsed = parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Maps a numeric HSK level (1..9) or string number to its canonical HskLevel ID.
 * Preserves support for HSK 7–9.
 */
export function hskNumberToLevelId(level?: number | string): string {
  if (level === undefined || level === null) return 'level-hsk-1';
  const num = typeof level === 'number' ? level : parseInt(String(level), 10);

  if (num >= 7) {
    return 'level-hsk-79';
  }

  if (num >= 1 && num <= 6) {
    return `level-hsk-${num}`;
  }

  return 'level-hsk-1';
}

/**
 * Resolves full HSK level presentation metadata using the authoritative HskRepositoryService.
 * Seamlessly handles both string IDs ('level-hsk-3') and numeric level numbers (3).
 */
export function resolveHskLevelMeta(identifier?: string | number): {
  id: string;
  name: string;
  code: string;
  colorToken: string;
} {
  const fallback = {
    id: 'level-hsk-1',
    name: 'HSK 1',
    code: 'HSK1',
    colorToken: 'var(--primary)',
  };

  if (identifier === undefined || identifier === null) {
    return fallback;
  }

  let levelId: string;
  if (typeof identifier === 'number') {
    levelId = hskNumberToLevelId(identifier);
  } else {
    const trimmed = identifier.trim();
    if (trimmed.startsWith('level-hsk-')) {
      levelId = trimmed;
    } else {
      levelId = hskNumberToLevelId(trimmed);
    }
  }

  const repoLevel = hskRepositoryService.getLevelById(levelId);
  if (repoLevel) {
    return {
      id: repoLevel.id,
      name: repoLevel.name,
      code: repoLevel.levelCode,
      colorToken: repoLevel.colorToken || 'var(--primary)',
    };
  }

  // Fallback for HSK 7-9 if not resolved directly
  if (levelId === 'level-hsk-79') {
    return {
      id: 'level-hsk-79',
      name: 'HSK 7–9',
      code: 'HSK7_9',
      colorToken: '#db2777',
    };
  }

  return fallback;
}

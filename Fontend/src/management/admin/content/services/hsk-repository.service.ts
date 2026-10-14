import {
  MOCK_CHARACTERS,
  MOCK_GRAMMAR_POINTS,
  MOCK_HSK_LEVELS,
  MOCK_STANDARDS,
  MOCK_VOCABULARIES,
} from '../data/mockHskRepositoryData';
import type {
  CharacterFilters,
  ChineseCharacter,
  CreateVocabularyDTO,
  GrammarFilters,
  GrammarPoint,
  HskLevel,
  HskStandard,
  UpdateCharacterDTO,
  UpdateGrammarDTO,
  UpdateHskLevelDTO,
  UpdateVocabularyDTO,
  Vocabulary,
  VocabularyFilters,
} from '../types';

let standards = [...MOCK_STANDARDS];
let levels = [...MOCK_HSK_LEVELS];
let vocabularies = [...MOCK_VOCABULARIES];
let characters = [...MOCK_CHARACTERS];
let grammarPoints = [...MOCK_GRAMMAR_POINTS];

class HskRepositoryService {
  getStandards(): HskStandard[] {
    return standards.map((s) => ({ ...s }));
  }

  getLevels(standardId?: string): HskLevel[] {
    const list = standardId ? levels.filter((l) => l.standardId === standardId) : levels;
    return list.sort((a, b) => a.orderIndex - b.orderIndex).map((l) => ({ ...l }));
  }

  getLevelById(id: string): HskLevel | undefined {
    const found = levels.find((l) => l.id === id);
    return found ? { ...found } : undefined;
  }

  updateLevel(id: string, dto: UpdateHskLevelDTO): HskLevel {
    const index = levels.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Không tìm thấy cấp độ HSK: ${id}`);
    levels[index] = {
      ...levels[index],
      name: dto.name.trim(),
      targetVocabularyCount: dto.targetVocabularyCount,
      targetCharacterCount: dto.targetCharacterCount,
      active: dto.active,
    };
    return { ...levels[index] };
  }

  // --- Vocabulary ---
  getVocabularies(filters?: VocabularyFilters): Vocabulary[] {
    let result = [...vocabularies];

    if (filters?.hskLevelId && filters.hskLevelId !== 'ALL') {
      result = result.filter((v) => v.hskLevelId === filters.hskLevelId);
    }

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((v) => v.status === filters.status);
    }

    if (filters?.partOfSpeech && filters.partOfSpeech !== 'ALL') {
      result = result.filter((v) => v.partOfSpeech.toLowerCase().includes(filters.partOfSpeech.toLowerCase()));
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.simplified.toLowerCase().includes(q) ||
          v.traditional.toLowerCase().includes(q) ||
          v.pinyin.toLowerCase().includes(q) ||
          v.meaningVi.toLowerCase().includes(q) ||
          v.meaningEn.toLowerCase().includes(q)
      );
    }

    return result.map((v) => ({ ...v, examples: v.examples.map((e) => ({ ...e })) }));
  }

  getVocabularyById(id: string): Vocabulary | undefined {
    const found = vocabularies.find((v) => v.id === id);
    return found ? { ...found, examples: found.examples.map((e) => ({ ...e })) } : undefined;
  }

  createVocabulary(dto: CreateVocabularyDTO): Vocabulary {
    const newVocab: Vocabulary = {
      id: `voc-${Date.now()}`,
      hskLevelId: dto.hskLevelId,
      simplified: dto.simplified.trim(),
      traditional: dto.traditional.trim() || dto.simplified.trim(),
      pinyin: dto.pinyin.trim(),
      meaningVi: dto.meaningVi.trim(),
      meaningEn: dto.meaningEn.trim(),
      partOfSpeech: dto.partOfSpeech.trim(),
      audioUrl: dto.audioUrl?.trim(),
      examples: dto.examples.map((ex, idx) => ({
        id: `ex-${Date.now()}-${idx}`,
        ...ex,
      })),
      status: dto.status,
      source: 'Thêm thủ công từ CMS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    vocabularies = [newVocab, ...vocabularies];
    return { ...newVocab };
  }

  updateVocabulary(id: string, dto: UpdateVocabularyDTO): Vocabulary {
    const index = vocabularies.findIndex((v) => v.id === id);
    if (index === -1) throw new Error(`Không tìm thấy từ vựng: ${id}`);

    const updated: Vocabulary = {
      ...vocabularies[index],
      hskLevelId: dto.hskLevelId,
      simplified: dto.simplified.trim(),
      traditional: dto.traditional.trim() || dto.simplified.trim(),
      pinyin: dto.pinyin.trim(),
      meaningVi: dto.meaningVi.trim(),
      meaningEn: dto.meaningEn.trim(),
      partOfSpeech: dto.partOfSpeech.trim(),
      audioUrl: dto.audioUrl?.trim(),
      examples: dto.examples.map((e) => ({ ...e })),
      status: dto.status,
      updatedAt: new Date().toISOString(),
    };

    vocabularies[index] = updated;
    return { ...updated };
  }

  // --- Chinese Characters ---
  getCharacters(filters?: CharacterFilters): ChineseCharacter[] {
    let result = [...characters];

    if (filters?.hskLevelId && filters.hskLevelId !== 'ALL') {
      result = result.filter((c) => c.hskLevelId === filters.hskLevelId);
    }

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((c) => c.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.character.includes(q) ||
          c.pinyin.toLowerCase().includes(q) ||
          c.sinoVietnamese.toLowerCase().includes(q) ||
          c.meaningVi.toLowerCase().includes(q)
      );
    }

    return result.map((c) => ({ ...c }));
  }

  getCharacterById(id: string): ChineseCharacter | undefined {
    const found = characters.find((c) => c.id === id);
    return found ? { ...found } : undefined;
  }

  updateCharacter(id: string, dto: UpdateCharacterDTO): ChineseCharacter {
    const index = characters.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Không tìm thấy chữ Hán: ${id}`);

    const updated: ChineseCharacter = {
      ...characters[index],
      ...dto,
      character: dto.character.trim(),
      pinyin: dto.pinyin.trim(),
      sinoVietnamese: dto.sinoVietnamese.trim(),
      meaningVi: dto.meaningVi.trim(),
      updatedAt: new Date().toISOString(),
    };

    characters[index] = updated;
    return { ...updated };
  }

  // --- Grammar Points ---
  getGrammarPoints(filters?: GrammarFilters): GrammarPoint[] {
    let result = [...grammarPoints];

    if (filters?.hskLevelId && filters.hskLevelId !== 'ALL') {
      result = result.filter((g) => g.hskLevelId === filters.hskLevelId);
    }

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((g) => g.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.code.toLowerCase().includes(q) ||
          g.title.toLowerCase().includes(q) ||
          g.structureFormula.toLowerCase().includes(q) ||
          g.explanation.toLowerCase().includes(q)
      );
    }

    return result.map((g) => ({ ...g, examples: g.examples.map((e) => ({ ...e })) }));
  }

  getGrammarById(id: string): GrammarPoint | undefined {
    const found = grammarPoints.find((g) => g.id === id);
    return found ? { ...found, examples: found.examples.map((e) => ({ ...e })) } : undefined;
  }

  updateGrammar(id: string, dto: UpdateGrammarDTO): GrammarPoint {
    const index = grammarPoints.findIndex((g) => g.id === id);
    if (index === -1) throw new Error(`Không tìm thấy điểm ngữ pháp: ${id}`);

    const updated: GrammarPoint = {
      ...grammarPoints[index],
      ...dto,
      code: dto.code.trim(),
      title: dto.title.trim(),
      structureFormula: dto.structureFormula.trim(),
      explanation: dto.explanation.trim(),
      examples: dto.examples.map((e) => ({ ...e })),
      updatedAt: new Date().toISOString(),
    };

    grammarPoints[index] = updated;
    return { ...updated };
  }
}

export const hskRepositoryService = new HskRepositoryService();
